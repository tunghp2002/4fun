import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { contains, project, random, type Point } from "../geo/coordinates";
import { heightAt } from "../geo/terrain";
import {
  clipArea,
  pavementGeometry,
  pedestrianRoad,
  roadFootprint,
  roadWidth,
  type MultiPolygon,
} from "./roads";
import {
  isLinearFeature,
  type MapData,
  type SceneStyle,
  type TerrainData,
} from "../types";

export interface StreetSegment {
  a: Point;
  b: Point;
  width: number;
  pedestrian: boolean;
  id: number;
  length: number;
  ux: number;
  uz: number;
}

type Footprint = { points: Point[]; holes: Point[][] };
type Placement = { kind: string; x: number; z: number; footprint: Point[] };
type Tone = keyof typeof COLORS.paper;
const COLORS = {
  paper: {
    walk: "#d9d0b7",
    curb: "#eee5ce",
    white: "#f5f0da",
    metal: "#59615a",
    dark: "#313e3d",
    glass: "#5f8186",
    tire: "#29322f",
    wood: "#887966",
    ceramic: "#ddd8c3",
    skin: "#ca9c75",
    red: "#a65942",
    blue: "#688f94",
    cream: "#ddc589",
    green: "#789477",
  },
  clay: {
    walk: "#d9d7d0",
    curb: "#eeece5",
    white: "#f5f4ed",
    metal: "#a3a8a2",
    dark: "#79837c",
    glass: "#a4b3b1",
    tire: "#8b938c",
    wood: "#b7ac9c",
    ceramic: "#eeece4",
    skin: "#cec3b3",
    red: "#d3c2b8",
    blue: "#bbc9c8",
    cream: "#e5ddd0",
    green: "#bdc9b8",
  },
  ink: {
    walk: "#d6d7d1",
    curb: "#fafbf5",
    white: "#ffffff",
    metal: "#646c67",
    dark: "#37403c",
    glass: "#687772",
    tire: "#353b37",
    wood: "#858982",
    ceramic: "#e9ece5",
    skin: "#b8beb3",
    red: "#989f96",
    blue: "#b4bcb5",
    cream: "#e6e9e1",
    green: "#bbc3b5",
  },
};

/** Street furniture is illustrative; map footprints and road alignments remain authoritative. */
export function createStreetDetails(
  data: MapData,
  terrain: TerrainData,
  seed: number,
  sample?: (x: number, z: number) => number,
) {
  const root = new THREE.Group();
  root.name = "Street_details";
  const half = data.span / 2,
    cell = 24,
    rnd = random(seed ^ 0x5e47ac),
    polygons = new Map<string, Footprint[]>(),
    roadCells = new Map<string, StreetSegment[]>(),
    segments: StreetSegment[] = [],
    height =
      sample ?? ((x: number, z: number) => heightAt(terrain, data.span, x, z));
  const key = (x: number, z: number) =>
    `${Math.floor(x / cell)},${Math.floor(z / cell)}`;
  function index<T>(
    grid: Map<string, T[]>,
    item: T,
    points: Point[],
    margin = 0,
  ) {
    const xs = points.map((p) => p[0]),
      zs = points.map((p) => p[1]);
    for (
      let x = Math.floor(Math.max(-half, Math.min(...xs) - margin) / cell);
      x <= Math.floor(Math.min(half, Math.max(...xs) + margin) / cell);
      x++
    )
      for (
        let z = Math.floor(Math.max(-half, Math.min(...zs) - margin) / cell);
        z <= Math.floor(Math.min(half, Math.max(...zs) + margin) / cell);
        z++
      ) {
        const k = `${x},${z}`,
          values = grid.get(k);
        if (values) values.push(item);
        else grid.set(k, [item]);
      }
  }
  for (const feature of data.features) {
    const points = feature.points.map((p) => project(p, data.center));
    if (!points.length) continue;
    if (
      feature.kind === "building" ||
      (feature.kind === "water" && !isLinearFeature(feature))
    ) {
      const footprint = {
        points,
        holes: feature.holes.map((r) => r.map((p) => project(p, data.center))),
      };
      index(polygons, footprint, points, 1);
    }
    if (feature.kind !== "road") continue;
    const pedestrian = pedestrianRoad.test(feature.tags.highway),
      width = roadWidth(feature.tags);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i],
        length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (length < 0.5 || !Number.isFinite(length)) continue;
      const segment = {
        a,
        b,
        length,
        width,
        pedestrian,
        id: feature.id,
        ux: (b[0] - a[0]) / length,
        uz: (b[1] - a[1]) / length,
      };
      segments.push(segment);
      index(roadCells, segment, [a, b], width / 2 + 32);
    }
  }
  function blocked(x: number, z: number, margin = 0.35) {
    if (Math.abs(x) > half - margin || Math.abs(z) > half - margin) return true;
    const nearEdge = (ring: Point[]) =>
      ring.some((a, i) => {
        const b = ring[(i + 1) % ring.length],
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          t = Math.max(
            0,
            Math.min(
              1,
              ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1),
            ),
          );
        return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) < margin;
      });
    return (polygons.get(key(x, z)) ?? []).some(
      (p) =>
        (contains(p.points, x, z) && !p.holes.some((h) => contains(h, x, z))) ||
        (margin > 0 && (nearEdge(p.points) || p.holes.some(nearEdge))),
    );
  }
  function closest(segment: StreetSegment, x: number, z: number): Point {
    const d = Math.max(
      0,
      Math.min(
        segment.length,
        (x - segment.a[0]) * segment.ux + (z - segment.a[1]) * segment.uz,
      ),
    );
    return [segment.a[0] + d * segment.ux, segment.a[1] + d * segment.uz];
  }
  function clearRect(
    x: number,
    z: number,
    width: number,
    length: number,
    ux: number,
    uz: number,
  ) {
    const footprint: Point[] = [];
    for (const [across, along] of [
      [-1, -1],
      [-1, 1],
      [1, 1],
      [1, -1],
    ])
      footprint.push([
        x - (uz * across * width) / 2 + (ux * along * length) / 2,
        z + (ux * across * width) / 2 + (uz * along * length) / 2,
      ]);
    return {
      footprint,
      clear: !blocked(x, z) && footprint.every((p) => !blocked(...p)),
    };
  }
  function otherRoad(x: number, z: number, own: StreetSegment, extra = 0.3) {
    return (roadCells.get(key(x, z)) ?? []).some((s) => {
      if (s.id === own.id) return false;
      const [px, pz] = closest(s, x, z);
      return Math.hypot(x - px, z - pz) < s.width / 2 + extra;
    });
  }
  function fronts(points: Point[]) {
    const result: number[] = [],
      signedArea = points.reduce((sum, a, i) => {
        const b = points[(i + 1) % points.length];
        return sum + a[0] * b[1] - b[0] * a[1];
      }, 0),
      sign = signedArea > 0 ? 1 : -1;
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        length = Math.hypot(dx, dz);
      if (length < 1.6) continue;
      const x = (a[0] + b[0]) / 2,
        z = (a[1] + b[1]) / 2,
        nx = (sign * dz) / length,
        nz = (-sign * dx) / length;
      let distance = Infinity;
      for (const road of roadCells.get(key(x, z)) ?? []) {
        const [px, pz] = closest(road, x, z),
          rx = px - x,
          rz = pz - z,
          d = Math.hypot(rx, rz);
        if (
          d < 0.1 ||
          d > road.width / 2 + 17 ||
          (nx * rx + nz * rz) / d < 0.45
        )
          continue;
        let clear = true;
        for (let t = 0.7; t < d - road.width / 2; t += 1.2)
          if (blocked(x + (rx / d) * t, z + (rz / d) * t)) {
            clear = false;
            break;
          }
        if (clear) distance = Math.min(distance, d);
      }
      if (Number.isFinite(distance)) result.push(i);
    }
    return result;
  }

  let camera: {
      position: [number, number, number];
      target: [number, number, number];
    } | null = null,
    bestScore = -Infinity;
  for (const street of segments) {
    if (street.length < 28 || street.width > 20) continue;
    const middle = closest(street, 0, 0),
      centerDistance = Math.hypot(...middle);
    if (centerDistance > Math.min(220, half * 0.72)) continue;
    for (const direction of [1, -1]) {
      const along =
          (middle[0] - street.a[0]) * street.ux +
          (middle[1] - street.a[1]) * street.uz,
        cameraAlong =
          direction > 0
            ? Math.max(2, Math.min(street.length - 24, along))
            : Math.max(24, Math.min(street.length - 2, along)),
        x = street.a[0] + street.ux * cameraAlong,
        z = street.a[1] + street.uz * cameraAlong,
        ux = street.ux * direction,
        uz = street.uz * direction;
      let clear = true;
      for (let d = 0; d <= 22; d += 2)
        if (!clearRect(x + ux * d, z + uz * d, 0.65, 0.65, ux, uz).clear) {
          clear = false;
          break;
        }
      if (!clear) continue;
      let nearby = 0;
      for (const side of [-1, 1])
        for (const d of [8, 17, 28])
          if (
            blocked(
              x + ux * d - uz * side * (street.width / 2 + 6),
              z + uz * d + ux * side * (street.width / 2 + 6),
            )
          )
            nearby++;
      const score =
        nearby * 16 -
        centerDistance * 0.45 +
        Math.min(50, street.length) * 0.15 +
        Math.min(10, street.width) * 3;
      if (score > bestScore) {
        bestScore = score;
        camera = {
          position: [x, height(x, z) + 1.7, z],
          target: [
            x + ux * 22,
            height(x + ux * 22, z + uz * 22) + 1.9,
            z + uz * 22,
          ],
        };
      }
    }
  }

  const focus: Point = camera
      ? [camera.position[0], camera.position[2]]
      : [0, 0],
    radius = Math.min(210, half - 8),
    pieces = new Map<Tone, THREE.BufferGeometry[]>(),
    materials = new Map<Tone, THREE.MeshStandardMaterial>(),
    placements: Placement[] = [],
    occupied = new Map<string, { x: number; z: number; radius: number }[]>(),
    wireVertices: number[] = [];
  function normalized(g: THREE.BufferGeometry) {
    const value = g.index ? g.toNonIndexed() : g;
    if (value !== g) g.dispose();
    value.deleteAttribute("uv");
    return value;
  }
  const box = normalized(new THREE.BoxGeometry(1, 1, 1)),
    cylinder = normalized(new THREE.CylinderGeometry(1, 1, 1, 8)),
    sphere = normalized(new THREE.SphereGeometry(1, 8, 5)),
    matrix = new THREE.Matrix4(),
    rotation = new THREE.Quaternion(),
    yAxis = new THREE.Vector3(0, 1, 0),
    position = new THREE.Vector3(),
    scale = new THREE.Vector3();
  function primitive(
    tone: Tone,
    geometry: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    angle = 0,
    wheel = false,
  ) {
    rotation.setFromAxisAngle(yAxis, angle);
    if (wheel)
      rotation.multiply(
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          Math.PI / 2,
        ),
      );
    matrix.compose(position.set(x, y, z), rotation, scale.set(sx, sy, sz));
    const g = geometry.clone().applyMatrix4(matrix),
      values = pieces.get(tone);
    if (values) values.push(g);
    else pieces.set(tone, [g]);
  }
  function part(
    tone: Tone,
    shape: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    angle: number,
    across: number,
    up: number,
    along: number,
    sx: number,
    sy: number,
    sz: number,
    wheel = false,
  ) {
    primitive(
      tone,
      shape,
      x + Math.cos(angle) * across + Math.sin(angle) * along,
      y + up,
      z - Math.sin(angle) * across + Math.cos(angle) * along,
      sx,
      sy,
      sz,
      angle,
      wheel,
    );
  }
  function reserve(
    kind: string,
    x: number,
    z: number,
    width: number,
    length: number,
    street: StreetSegment,
  ) {
    if (
      camera &&
      Math.hypot(x - camera.position[0], z - camera.position[2]) < 4
    )
      return false;
    const rect = clearRect(
        x,
        z,
        width + 0.16,
        length + 0.16,
        street.ux,
        street.uz,
      ),
      r = Math.max(width, length) / 2 + 0.4;
    if (!rect.clear) return false;
    for (
      let ix = Math.floor((x - r - 3) / cell);
      ix <= Math.floor((x + r + 3) / cell);
      ix++
    )
      for (
        let iz = Math.floor((z - r - 3) / cell);
        iz <= Math.floor((z + r + 3) / cell);
        iz++
      )
        if (
          (occupied.get(`${ix},${iz}`) ?? []).some(
            (p) => Math.hypot(x - p.x, z - p.z) < r + p.radius,
          )
        )
          return false;
    const k = key(x, z),
      values = occupied.get(k),
      p = { x, z, radius: r };
    if (values) values.push(p);
    else occupied.set(k, [p]);
    placements.push({ kind, x, z, footprint: rect.footprint });
    return true;
  }
  function car(x: number, z: number, angle: number, tone: Tone) {
    const y = height(x, z) + 0.32,
      p = (
        t: Tone,
        across: number,
        up: number,
        along: number,
        sx: number,
        sy: number,
        sz: number,
      ) => part(t, box, x, y, z, angle, across, up, along, sx, sy, sz);
    p(tone, 0, 0.62, 0, 1.68, 0.56, 3.65);
    p("glass", 0, 1.15, -0.12, 1.43, 0.62, 1.88);
    p(tone, 0, 1.49, -0.12, 1.48, 0.08, 1.96);
    p(tone, 0, 1.15, -0.22, 1.48, 0.64, 0.09);
    for (const side of [-1, 1]) {
      p(tone, side * 0.73, 1.15, 0.75, 0.08, 0.63, 0.09);
      p(tone, side * 0.73, 1.15, -1.0, 0.08, 0.63, 0.09);
      p("white", side * 0.51, 0.69, 1.84, 0.37, 0.15, 0.03);
      p("red", side * 0.57, 0.69, -1.84, 0.26, 0.16, 0.03);
      p("dark", side * 0.91, 1.04, 0.68, 0.17, 0.12, 0.19);
      for (const along of [-1.1, 1.1]) {
        part(
          "tire",
          cylinder,
          x,
          y,
          z,
          angle,
          side * 0.82,
          0.34,
          along,
          0.32,
          0.18,
          0.32,
          true,
        );
        part(
          "metal",
          cylinder,
          x,
          y,
          z,
          angle,
          side * 0.92,
          0.34,
          along,
          0.16,
          0.02,
          0.16,
          true,
        );
      }
    }
    p("metal", 0, 0.4, 1.85, 1.45, 0.12, 0.07);
  }
  function scooter(x: number, z: number, angle: number, tone: Tone) {
    const y = height(x, z) + 0.35,
      p = (
        t: Tone,
        across: number,
        up: number,
        along: number,
        sx: number,
        sy: number,
        sz: number,
      ) => part(t, box, x, y, z, angle, across, up, along, sx, sy, sz);
    p(tone, 0, 0.43, -0.22, 0.38, 0.5, 0.74);
    p("dark", 0, 0.72, -0.23, 0.43, 0.13, 0.74);
    p("metal", 0, 0.23, 0.29, 0.34, 0.09, 0.57);
    p(tone, 0, 0.65, 0.52, 0.38, 0.73, 0.17);
    p("metal", 0, 1.03, 0.53, 0.62, 0.05, 0.06);
    p("white", 0, 0.88, 0.62, 0.23, 0.14, 0.06);
    for (const along of [-0.67, 0.67])
      part(
        "tire",
        cylinder,
        x,
        y,
        z,
        angle,
        0,
        0.25,
        along,
        0.25,
        0.13,
        0.25,
        true,
      );
    for (const side of [-1, 1]) {
      p("metal", side * 0.27, 1.15, 0.54, 0.025, 0.23, 0.025);
      p("glass", side * 0.27, 1.29, 0.54, 0.12, 0.08, 0.045);
    }
  }
  function person(x: number, z: number, angle: number, tone: Tone) {
    const y = height(x, z) + 0.46;
    part(tone, cylinder, x, y, z, angle, 0, 1.06, 0, 0.2, 0.58, 0.14);
    part("skin", sphere, x, y, z, angle, 0, 1.56, 0, 0.15, 0.19, 0.15);
    for (const side of [-1, 1]) {
      part(
        "dark",
        cylinder,
        x,
        y,
        z,
        angle,
        side * 0.1,
        0.38,
        side * 0.06,
        0.075,
        0.74,
        0.07,
      );
      part(
        "skin",
        cylinder,
        x,
        y,
        z,
        angle,
        side * 0.25,
        0.98,
        0,
        0.055,
        0.55,
        0.055,
      );
    }
  }
  type Pole = {
    x: number;
    z: number;
    y: number;
    angle: number;
    street: StreetSegment;
  };
  const poles = new Map<number, Pole[]>(),
    counts = {
      cars: 0,
      scooters: 0,
      people: 0,
      poles: 0,
      sidewalks: 0,
      crosswalks: 0,
    };
  const nearestStreets = segments
    .filter((s) => {
      const p = closest(s, ...focus);
      return Math.hypot(p[0] - focus[0], p[1] - focus[1]) < radius;
    })
    .sort((a, b) => {
      const p = closest(a, ...focus),
        q = closest(b, ...focus);
      return (
        Math.hypot(p[0] - focus[0], p[1] - focus[1]) -
        Math.hypot(q[0] - focus[0], q[1] - focus[1])
      );
    })
    .slice(0, 460);

  if (nearestStreets.length) {
    const roads = roadFootprint(
      segments
        .filter((s) => {
          const p = closest(s, ...focus);
          return Math.hypot(p[0] - focus[0], p[1] - focus[1]) < radius + 32;
        })
        .map((s) => ({ points: [s.a, s.b], width: s.width })),
    );
    const curbOuter = roadFootprint(
      nearestStreets
        .filter((s) => !s.pedestrian)
        .map((s) => ({
          points: [s.a, s.b],
          width: s.width + 0.28,
        })),
    );
    const walkOuter = roadFootprint(
      nearestStreets
        .filter((s) => !s.pedestrian)
        .map((s) => ({
          points: [s.a, s.b],
          width: s.width + 2 * (1.05 + 0.14),
        })),
    );
    const obstacles: MultiPolygon = [...new Set([...polygons.values()].flat())]
      .filter((p) => {
        const xs = p.points.map((p) => p[0]),
          zs = p.points.map((p) => p[1]);
        return (
          Math.max(...xs) >= focus[0] - radius &&
          Math.min(...xs) <= focus[0] + radius &&
          Math.max(...zs) >= focus[1] - radius &&
          Math.min(...zs) <= focus[1] + radius
        );
      })
      .map((p) => [p.points, ...p.holes]);
    const circle: Point[] = Array.from({ length: 64 }, (_, i) => [
      focus[0] + Math.cos((i * Math.PI) / 32) * radius,
      focus[1] + Math.sin((i * Math.PI) / 32) * radius,
    ]);
    const scope = clipArea(
      [[circle]],
      [
        [
          [
            [-half, -half],
            [half, -half],
            [half, half],
            [-half, half],
          ],
        ],
      ],
      "intersection",
    );
    const curb = clipArea(
      clipArea(curbOuter, scope, "intersection"),
      [...roads, ...obstacles],
      "difference",
    );
    const walk = clipArea(
      clipArea(walkOuter, scope, "intersection"),
      [...curbOuter, ...roads, ...obstacles],
      "difference",
    );
    for (const [tone, polygons, thickness] of [
      ["walk", walk, 0.15],
      ["curb", curb, 0.18],
    ] as const) {
      const geometry = pavementGeometry(
        polygons,
        height,
        thickness,
        data.span / 128,
        -half,
      );
      if (geometry) pieces.set(tone, [geometry]);
    }
    counts.sidewalks = walk.length;
  }

  for (const street of nearestStreets) {
    const { a, ux, uz, width, length } = street,
      angle = Math.atan2(ux, uz),
      nearCamera = camera
        ? closest(street, camera.position[0], camera.position[2])
        : null;
    for (let d = 5 + rnd() * 5; d < length - 5; d += 10 + rnd() * 8) {
      const x = a[0] + ux * d,
        z = a[1] + uz * d;
      if (
        Math.hypot(x - focus[0], z - focus[1]) > radius - 5 ||
        otherRoad(x, z, street, 3)
      )
        continue;
      // Keep the initial sightline open so furniture never hides the selected street view.
      if (
        nearCamera &&
        Math.hypot(x - camera!.position[0], z - camera!.position[2]) < 7
      )
        continue;
      const side = rnd() < 0.5 ? -1 : 1,
        tone = (["red", "blue", "cream", "green"] as Tone[])[
          Math.floor(rnd() * 4)
        ];
      if (
        !street.pedestrian &&
        width >= 5.2 &&
        counts.cars < 34 &&
        rnd() > 0.4
      ) {
        const offset = (width / 2 - 0.98) * side,
          px = x - uz * offset,
          pz = z + ux * offset;
        if (reserve("car", px, pz, 1.85, 3.85, street)) {
          car(px, pz, angle + (side > 0 ? Math.PI : 0), tone);
          counts.cars++;
        }
      }
      if (!street.pedestrian && counts.scooters < 90 && rnd() > 0.24) {
        const offset = (width / 2 + 0.42) * side,
          px = x - uz * offset,
          pz = z + ux * offset;
        if (reserve("scooter", px, pz, 0.7, 1.7, street)) {
          scooter(px, pz, angle, tone);
          counts.scooters++;
        }
      }
      if (counts.people < 90 && rnd() > 0.3) {
        const offset = -(width / 2 + 0.62) * side,
          px = x - uz * offset + ux * 3,
          pz = z + ux * offset + uz * 3;
        if (reserve("person", px, pz, 0.65, 0.65, street)) {
          person(px, pz, angle, tone);
          counts.people++;
        }
      }
    }
    if (length < 17 || street.pedestrian) continue;
    for (let d = 7; d < length - 4 && counts.poles < 58; d += 29) {
      const offset = width / 2 + 0.32,
        x = a[0] + ux * d - uz * offset,
        z = a[1] + uz * d + ux * offset;
      if (
        Math.hypot(x - focus[0], z - focus[1]) > radius ||
        otherRoad(x, z, street, 1.3) ||
        !reserve("pole", x, z, 0.42, 0.42, street)
      )
        continue;
      const y = height(x, z) + 0.45;
      primitive("wood", cylinder, x, y + 4.1, z, 0.105, 8.2, 0.105);
      part("metal", box, x, y, z, angle, 0, 7.35, 0, 2.1, 0.13, 0.13);
      for (const across of [-0.82, 0, 0.82])
        part(
          "ceramic",
          cylinder,
          x,
          y,
          z,
          angle,
          across,
          7.55,
          0,
          0.075,
          0.28,
          0.075,
        );
      part("metal", box, x, y, z, angle, -0.62, 6.6, 0, 1.24, 0.07, 0.07);
      part("cream", box, x, y, z, angle, -1.2, 6.57, 0, 0.39, 0.09, 0.24);
      const p = { x, y, z, angle, street },
        values = poles.get(street.id);
      if (values) values.push(p);
      else poles.set(street.id, [p]);
      counts.poles++;
    }
  }
  for (const values of poles.values()) {
    const connected = new Set<string>();
    for (let i = 0; i < values.length; i++) {
      const a = values[i];
      const nearby = values
        .map((b, j) => ({ b, j, d: Math.hypot(b.x - a.x, b.z - a.z) }))
        .filter((v) => v.j !== i && v.d > 12 && v.d < 44)
        .sort((u, v) => u.d - v.d)
        .slice(0, 2);
      for (const { b, j, d } of nearby) {
        const k = [i, j].sort((u, v) => u - v).join(":");
        if (connected.has(k)) continue;
        connected.add(k);
        let clear = true;
        for (let t = 0.1; t < 0.95; t += 0.1)
          if (blocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) {
            clear = false;
            break;
          }
        if (!clear) continue;
        for (const offset of [-0.82, 0, 0.82]) {
          const ax = a.x + Math.cos(a.angle) * offset,
            az = a.z - Math.sin(a.angle) * offset,
            bx = b.x + Math.cos(b.angle) * offset,
            bz = b.z - Math.sin(b.angle) * offset;
          const p = (t: number) => [
            ax + (bx - ax) * t,
            a.y +
              7.7 +
              (b.y - a.y) * t -
              4 * t * (1 - t) * Math.min(0.75, d * 0.018),
            az + (bz - az) * t,
          ];
          for (let step = 0; step < 12; step++)
            wireVertices.push(...p(step / 12), ...p((step + 1) / 12));
        }
      }
    }
  }

  const junctions = new Map<string, { p: Point; streets: StreetSegment[] }>();
  for (const street of nearestStreets)
    for (const p of [street.a, street.b]) {
      const k = `${Math.round(p[0] * 2)},${Math.round(p[1] * 2)}`,
        existing = junctions.get(k);
      if (existing) existing.streets.push(street);
      else junctions.set(k, { p, streets: [street] });
    }
  for (const { p, streets } of junctions.values()) {
    if (
      new Set(streets.map((s) => s.id)).size < 2 ||
      Math.hypot(p[0] - focus[0], p[1] - focus[1]) > radius
    )
      continue;
    for (const street of streets) {
      if (
        street.width < 5 ||
        street.pedestrian ||
        street.length < 20 ||
        counts.crosswalks >= 22
      )
        continue;
      const direction =
          Math.hypot(p[0] - street.a[0], p[1] - street.a[1]) < 1 ? 1 : -1,
        ux = street.ux * direction,
        uz = street.uz * direction,
        angle = Math.atan2(ux, uz),
        d = Math.max(...streets.map((s) => s.width)) / 2 + 3,
        x = p[0] + ux * d,
        z = p[1] + uz * d;
      if (!clearRect(x, z, street.width - 0.8, 2.7, ux, uz).clear) continue;
      for (
        let across = -street.width / 2 + 0.7;
        across < street.width / 2 - 0.4;
        across += 0.85
      ) {
        const px = x + uz * across,
          pz = z - ux * across;
        primitive(
          "white",
          box,
          px,
          height(px, pz) + 0.335,
          pz,
          0.45,
          0.022,
          2.5,
          angle,
        );
      }
      counts.crosswalks++;
    }
  }

  const outlines = new THREE.Group();
  outlines.name = "Street_contours";
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: "#39423a",
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  for (const [tone, items] of pieces) {
    const geometry = mergeGeometries(items);
    items.forEach((g) => g.dispose());
    if (!geometry) continue;
    const material = new THREE.MeshStandardMaterial({
        color: COLORS.paper[tone],
        roughness: tone === "glass" ? 0.32 : 0.9,
      }),
      mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Street_${tone}`;
    mesh.castShadow = tone !== "walk" && tone !== "curb" && tone !== "white";
    mesh.receiveShadow = true;
    materials.set(tone, material);
    root.add(mesh);
    if (!["walk", "curb", "skin", "tire", "white"].includes(tone))
      outlines.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry, 35),
          edgeMaterial,
        ),
      );
  }
  box.dispose();
  cylinder.dispose();
  sphere.dispose();
  root.add(outlines);
  const wireMaterial = new THREE.LineBasicMaterial({ color: "#3d453f" });
  if (wireVertices.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(wireVertices, 3),
    );
    const wires = new THREE.LineSegments(g, wireMaterial);
    wires.name = "Utility_cables";
    root.add(wires);
  }
  root.userData = { illustrative: true, counts, placements };
  let disposed = false;
  return {
    root,
    segments,
    camera,
    fronts,
    blocked,
    apply(style: SceneStyle, outline = 0.55) {
      for (const [tone, material] of materials)
        material.color.set(COLORS[style][tone]);
      edgeMaterial.color.set(
        style === "ink" ? "#242c26" : style === "clay" ? "#8f958d" : "#39423a",
      );
      edgeMaterial.opacity = outline * (style === "clay" ? 0.55 : 1);
      wireMaterial.color.set(style === "clay" ? "#858e85" : "#3d453f");
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.LineSegments
        )
          object.geometry.dispose();
      });
      for (const material of materials.values()) material.dispose();
      edgeMaterial.dispose();
      wireMaterial.dispose();
      root.clear();
    },
  };
}
