import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { project, clipPolygon, contains, type Point } from "../geo/coordinates";
import { buildingDesign, buildingOutlinesWithParts } from "../geo/buildings";
import { createLandmarks } from "./landmarks";
import {
  areaMask,
  clipArea,
  roadJoins,
  roadWidth,
  roadFootprint,
  pedestrianRoad,
  type MultiPolygon,
} from "./roads";
import { foundation, gridElevation, surfaceGeometry } from "./surfaces";
import { waterElevation, type WaterSurface } from "./elevation";
import type { SceneLandmark } from "../types";
import { isLinearFeature, type MapData, type SceneSettings } from "../types";
import outlines from "../geo/vietnam-overview.json";
import { PLACES, MAP_LABELS, mapLabel } from "../places";
import { createTrees } from "./trees";
import { mappedTrees } from "./vegetation";
import { PALETTES, gabledRoof, windowVertices } from "./architecture";

type Rect = [number, number, number, number];
const colors = (p: typeof PALETTES.paper) => [
  p.ground,
  ...Array.from({ length: 4 }, (_, i) => p.wall[i % p.wall.length]),
  p.roof[0],
  p.road,
  p.water,
  p.green,
  p.base,
  ...Array.from({ length: 4 }, (_, i) => p.roof[i % p.roof.length]),
  p.window,
];
const COLORS = {
  paper: colors(PALETTES.paper),
  clay: colors(PALETTES.clay),
  ink: colors(PALETTES.ink),
};

function clip(points: Point[], rect: Rect) {
  let result = points;
  for (const [axis, bound, direction] of [
    [0, rect[0], 1],
    [0, rect[2], -1],
    [1, rect[1], 1],
    [1, rect[3], -1],
  ]) {
    const next: Point[] = [];
    for (let i = 0; i < result.length; i++) {
      const a = result[i],
        b = result[(i + 1) % result.length],
        da = (a[axis] - bound) * direction,
        db = (b[axis] - bound) * direction;
      if (da >= 0) next.push(a);
      if (da * db < 0) {
        const t = da / (da - db);
        next.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    result = next;
    if (result.length < 3) return [];
  }
  return result;
}
export interface CityContext {
  root: THREE.Group;
  landmarks: SceneLandmark[];
  apply(settings: SceneSettings): void;
  dispose(): void;
}

export async function buildContext(
  data: MapData,
  innerSpan: number,
  seed: number,
  height: (x: number, z: number) => number = () => 0,
  sharedWater: WaterSurface[] = [],
  signal?: AbortSignal,
): Promise<CityContext> {
  signal?.throwIfAborted();
  const step = Math.max(
      6,
      data.span / 128,
      data.span > 4400 ? data.span / 48 : 0,
    ),
    origin = -innerSpan / 2;
  const elevation = waterElevation(data, height, sharedWater);
  height = gridElevation(elevation, step, origin);
  const waterAreas: MultiPolygon = data.features
    .filter((f) => f.kind === "water" && !isLinearFeature(f))
    .map((f) =>
      [f.points, ...f.holes].map((r) => r.map((p) => project(p, data.center))),
    );
  const occupiedAreas: MultiPolygon = [
    ...waterAreas,
    ...data.features
      .filter((f) => f.kind === "building")
      .map((f) =>
        [f.points, ...f.holes].map((r) =>
          r.map((p) => project(p, data.center)),
        ),
      ),
  ];
  const cutOccupied = areaMask(occupiedAreas);
  const root = new THREE.Group();
  root.name = "Canh_xa";
  const guides = new THREE.Group();
  guides.name = "Định hướng bản đồ";
  guides.userData.screenOnly = true;
  root.add(guides);
  const guideOffset = Math.max(2, data.span / 2000);
  if (data.span >= 250000) {
    const positions: number[] = [];
    for (const ring of outlines.find((country) => country.code === "VNM")!
      .rings) {
      for (let i = 1; i < ring.length; i++) {
        if (
          [ring[i - 1], ring[i]].some(
            ([lon, lat]) =>
              Math.max(...project({ lat, lon }, data.center).map(Math.abs)) >
              data.span / 2,
          )
        )
          continue;
        for (const [lon, lat] of [ring[i - 1], ring[i]]) {
          const [x, z] = project({ lat, lon }, data.center);
          positions.push(x, height(x, z) + guideOffset, z);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    const border = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: "#64816a",
        depthTest: false,
        transparent: true,
        opacity: 0.7,
      }),
    );
    border.name = "Đường viền Việt Nam";
    border.renderOrder = 10;
    border.layers.set(1);
    guides.add(border);
  }
  if (data.span > 8800 && typeof document !== "undefined") {
    for (const place of PLACES.filter((p) => MAP_LABELS.has(p.id))) {
      const [x, z] = project(place, data.center);
      if (Math.max(Math.abs(x), Math.abs(z)) > data.span / 2) continue;
      const canvas = document.createElement("canvas");
      canvas.width = 280;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.font = "600 26px system-ui";
      ctx.strokeStyle = "#fffdf0";
      ctx.lineWidth = 6;
      ctx.lineJoin = "round";
      ctx.strokeText(mapLabel(place), 18, 40);
      ctx.fillStyle = "#35583f";
      ctx.fillText(mapLabel(place), 18, 40);
      ctx.fillStyle = "#b77648";
      ctx.beginPath();
      ctx.arc(7, 32, 4, 0, Math.PI * 2);
      ctx.fill();
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const label = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          depthTest: false,
          depthWrite: false,
        }),
      );
      label.position.set(x, height(x, z) + guideOffset, z);
      label.scale.set(
        (data.span * 0.022 * canvas.width) / canvas.height,
        data.span * 0.022,
        1,
      );
      label.center.set(0, 0.5);
      label.renderOrder = 11;
      label.layers.set(1);
      guides.add(label);
    }
  }
  const landmarks = createLandmarks(
    data,
    height,
    data.span > 8800 ? data.span : innerSpan,
  );
  root.add(landmarks.root);
  const cutScenery = areaMask(landmarks.surfaceMasks);
  const features = data.features.flatMap(landmarks.clipBuilding);
  const outlinesWithParts = buildingOutlinesWithParts(features, data.center);
  const half = data.span / 2,
    inner = innerSpan / 2,
    layerScale = Math.max(1, data.span / 4400);
  const rects: Rect[] = [
    [-half, -half, -inner, half],
    [inner, -half, half, half],
    [-inner, -half, inner, -inner],
    [-inner, inner, inner, half],
  ];
  const extent: MultiPolygon = [
    [
      [
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
      ],
    ],
  ];
  const groups = new Map<string, { positions: number[]; tones: number[] }[]>();
  const bucket = (name: string) => {
    let chunks = groups.get(name);
    if (!chunks) groups.set(name, (chunks = []));
    let result = chunks[chunks.length - 1];
    if (!result || result.positions.length >= 180000) {
      result = { positions: [], tones: [] };
      chunks.push(result);
    }
    return result;
  };
  function triangle(
    name: string,
    a: number[],
    b: number[],
    c: number[],
    tone: number,
  ) {
    const item = bucket(name);
    item.positions.push(...a, ...b, ...c);
    item.tones.push(tone, tone, tone);
  }
  function polygon(
    name: string,
    points: Point[],
    holes: Point[][],
    y: (p: Point) => number,
    tone: number,
    clipped = false,
  ) {
    const xs = points.map((p) => p[0]),
      zs = points.map((p) => p[1]);
    if (
      !points.length ||
      Math.max(...xs) < -half ||
      Math.min(...xs) > half ||
      Math.max(...zs) < -half ||
      Math.min(...zs) > half
    )
      return;
    if (
      !clipped &&
      points.some(([x, z]) => Math.abs(x) > half || Math.abs(z) > half)
    ) {
      for (const [outer, ...inner] of clipArea(
        [[points, ...holes]],
        extent,
        "intersection",
      ))
        polygon(name, outer, inner, y, tone, true);
      return;
    }
    const open = (ring: Point[]) =>
      ring.length > 1 &&
      Math.hypot(
        ring[0][0] - ring[ring.length - 1][0],
        ring[0][1] - ring[ring.length - 1][1],
      ) < 1e-6
        ? ring.slice(0, -1)
        : ring;
    points = open(points);
    holes = holes.map(open).filter((r) => r.length >= 3);
    const flat = points.concat(...holes);
    if (flat.length < 3) return;
    const triangles = THREE.ShapeUtils.triangulateShape(
      points.map((p) => new THREE.Vector2(...p)),
      holes.map((r) => r.map((p) => new THREE.Vector2(...p))),
    );
    const draped =
      name !== "buildings"
        ? surfaceGeometry(points, holes, (x, z) => y([x, z]), step, origin)
        : null;
    const pos = draped?.getAttribute("position");
    const faces = pos
      ? Array.from({ length: pos.count / 3 }, (_, i) =>
          [0, 1, 2].map(
            (j) => [pos.getX(i * 3 + j), pos.getZ(i * 3 + j)] as Point,
          ),
        )
      : triangles.map((face) => face.map((i) => flat[i]));
    for (const t of faces) {
      for (const rect of rects) {
        const ring = clip(t, rect);
        for (let i = 2; i < ring.length; i++) {
          const [a, b, c] = [ring[0], ring[i - 1], ring[i]];
          const cross =
            (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
          if (Math.abs(cross) < 1e-7) continue;
          const p = (v: Point) => [v[0], y(v), v[1]];
          triangle(
            name,
            p(a),
            p(cross > 0 ? c : b),
            p(cross > 0 ? b : c),
            tone,
          );
        }
      }
    }
    draped?.dispose();
  }
  const objects: {
    name: string;
    mesh: THREE.Mesh;
    colors: THREE.BufferAttribute;
    tones: ArrayLike<number>;
  }[] = [];
  let vegetation: ReturnType<typeof createTrees> | undefined;
  let disposed = false;
  try {
    for (const [outer, ...holes] of clipArea(
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
      [...waterAreas, ...landmarks.surfaceMasks],
      "difference",
    ))
      polygon("ground", outer, holes, (p) => height(...p) - 0.06, 0);

    let buildings = 0;
    for (let index = 0; index < features.length; index++) {
      if (index % 120 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        signal?.throwIfAborted();
      }
      const feature = features[index];
      if (outlinesWithParts.has(feature) || landmarks.replaces(feature))
        continue;
      const points = feature.points.map((p) => project(p, data.center));
      const margin = feature.kind === "road" ? roadWidth(feature.tags) / 2 : 0;
      if (
        points.length < 2 ||
        points.every(
          (p) =>
            Math.abs(p[0]) < inner - margin && Math.abs(p[1]) < inner - margin,
        )
      )
        continue;
      const holes = feature.holes.map((r) =>
        r.map((p) => project(p, data.center)),
      );
      if (feature.kind === "building" && points.length > 2) {
        if (inner > 0 && clipPolygon(points, inner).length >= 3) continue;
        const profile = buildingDesign(
          feature,
          points,
          holes,
          data.center,
          seed,
        );
        const h = profile.height + (profile.pitched ? 0 : profile.roof),
          footing = foundation(points, holes, height, step, origin),
          base = footing.high + profile.minimum + 0.2,
          bottom = profile.minimum === 0 ? footing.low + 0.1 : base,
          tone = 1 + profile.tone;
        if (profile.pitched) {
          const roof = gabledRoof(points, base + h, profile.roof);
          const p = roof.geometry.getAttribute("position");
          for (let i = 0; i < p.count; i += 3) {
            const point = (j: number) => [p.getX(j), p.getY(j), p.getZ(j)];
            triangle(
              "buildings",
              point(i),
              point(i + 1),
              point(i + 2),
              10 + profile.tone,
            );
          }
          roof.geometry.dispose();
        } else polygon("buildings", points, holes, () => base + h, tone);
        for (const ring of [points, ...holes])
          for (let i = 0; i < ring.length; i++) {
            const a = ring[i],
              b = ring[(i + 1) % ring.length];
            for (const rect of rects) {
              let lo = 0,
                hi = 1;
              const dx = b[0] - a[0],
                dz = b[1] - a[1];
              for (const [p, q] of [
                [-dx, a[0] - rect[0]],
                [dx, rect[2] - a[0]],
                [-dz, a[1] - rect[1]],
                [dz, rect[3] - a[1]],
              ]) {
                if (p === 0) {
                  if (q < 0) hi = -1;
                } else if (p < 0) lo = Math.max(lo, q / p);
                else hi = Math.min(hi, q / p);
              }
              if (lo >= hi) continue;
              const p = [a[0] + dx * lo, bottom, a[1] + dz * lo],
                q = [a[0] + dx * hi, bottom, a[1] + dz * hi];
              triangle("buildings", p, q, [p[0], base + h, p[2]], tone);
              triangle(
                "buildings",
                q,
                [q[0], base + h, q[2]],
                [p[0], base + h, p[2]],
                tone,
              );
            }
          }
        const xs = points.map((p) => p[0]),
          zs = points.map((p) => p[1]);
        if (
          points.some(([x, z]) => Math.hypot(x, z) < 1200) &&
          h > 7 &&
          Math.max(...xs) - Math.min(...xs) < 180 &&
          Math.max(...zs) - Math.min(...zs) < 180
        ) {
          const panes = windowVertices(points, base, h);
          for (let i = 0; i < panes.length; i += 9)
            triangle(
              "windows",
              panes.slice(i, i + 3),
              panes.slice(i + 3, i + 6),
              panes.slice(i + 6, i + 9),
              14,
            );
        }
        buildings++;
      } else if (isLinearFeature(feature)) {
        const water = feature.kind === "water";
        const width = water
          ? Number.parseFloat(feature.tags.width) || 14
          : Math.max(roadWidth(feature.tags), data.span / 3500);
        if (water && landmarks.surfaceMasks.length) {
          for (const [outer, ...holes] of roadFootprint([{ points, width }]))
            for (const [part, ...voids] of cutScenery(outer, holes))
              polygon(
                "water",
                part,
                voids,
                (p) => height(...p) + 0.5 * layerScale,
                7,
              );
          continue;
        }
        if (!water)
          for (const cap of roadJoins(
            points,
            width,
            Math.max(0.04, data.span / 20000),
          ))
            polygon(
              "roads",
              cap,
              [],
              (p) =>
                height(...p) +
                layerScale *
                  (pedestrianRoad.test(feature.tags.highway) ? 0.26 : 0.3),
              pedestrianRoad.test(feature.tags.highway) ? 9 : 6,
            );
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1],
            b = points[i],
            length = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (length < 0.01) continue;
          const nx = ((-(b[1] - a[1]) / length) * width) / 2,
            nz = (((b[0] - a[0]) / length) * width) / 2;
          polygon(
            water ? "water" : "roads",
            [
              [a[0] + nx, a[1] + nz],
              [a[0] - nx, a[1] - nz],
              [b[0] - nx, b[1] - nz],
              [b[0] + nx, b[1] + nz],
            ],
            [],
            (p) =>
              height(...p) +
              layerScale *
                (water
                  ? 0.5
                  : pedestrianRoad.test(feature.tags.highway)
                    ? 0.26
                    : 0.3),
            water ? 7 : pedestrianRoad.test(feature.tags.highway) ? 9 : 6,
          );
        }
      } else if (feature.kind === "water" || feature.kind === "park") {
        const areas = (
          feature.kind === "park"
            ? cutOccupied(points, holes)
            : [[points, ...holes]]
        ).flatMap(([outer, ...inner]) => cutScenery(outer, inner));
        if (feature.kind === "water")
          for (const [outer, ...inner] of areas)
            polygon(
              "waterbed",
              outer,
              inner,
              (p) =>
                (elevation.waterLevels.get(feature) ?? height(...p)) -
                0.8 * layerScale,
              0,
            );
        for (const [outer, ...inner] of areas)
          polygon(
            feature.kind === "water" ? "water" : "parks",
            outer,
            inner,
            (p) =>
              (feature.kind === "water"
                ? (elevation.waterLevels.get(feature) ?? height(...p))
                : height(...p)) +
              (feature.kind === "water" ? 0.5 : 0.12) * layerScale,
            feature.kind === "water" ? 7 : 8,
          );
      }
    }
    for (const [name, chunks] of groups) {
      for (const item of chunks) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        signal?.throwIfAborted();
        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(item.positions, 3),
        );
        geometry.computeVertexNormals();
        const initialColors = new THREE.BufferAttribute(
          new Float32Array(item.positions.length),
          3,
        );
        geometry.setAttribute("color", initialColors);
        geometry.setAttribute(
          "tone",
          new THREE.Float32BufferAttribute(item.tones, 1),
        );
        item.positions.length = item.tones.length = 0;
        const compact = mergeVertices(geometry);
        geometry.dispose();
        geometry = compact;
        const tones = geometry.getAttribute("tone").array;
        geometry.deleteAttribute("tone");
        const colors = geometry.getAttribute("color") as THREE.BufferAttribute;
        const material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 1,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `Context_${name}`;
        mesh.castShadow = name === "buildings";
        mesh.receiveShadow = true;
        root.add(mesh);
        objects.push({ name, mesh, colors, tones });
      }
    }
    signal?.throwIfAborted();
    vegetation = createTrees(
      (await mappedTrees(data, seed, innerSpan, signal)).filter(
        (t) =>
          !landmarks.surfaceMasks.some(([ring]) => contains(ring, t.x, t.z)),
      ),
      height,
      seed,
      true,
    );
    vegetation.detail(new THREE.Vector3(Infinity, 0, Infinity));
    root.add(vegetation.root);
    root.userData = {
      attribution:
        "© OpenStreetMap contributors · © OpenMapTiles / OpenFreeMap",
      extentMeters: data.span,
      buildings,
    };
    let style = "";
    return {
      root,
      landmarks: landmarks.list,
      apply(settings) {
        landmarks.apply(settings);
        if (vegetation) {
          vegetation.root.visible = settings.trees;
          vegetation.apply(PALETTES[settings.style], settings.outlines);
        }
        root.scale.y = settings.heightScale;
        for (const object of objects) {
          object.mesh.visible =
            object.name === "buildings" || object.name === "windows"
              ? settings.buildings
              : object.name === "roads"
                ? settings.roads
                : object.name === "water"
                  ? settings.water
                  : true;
          if (style === settings.style) continue;
          const palette = COLORS[settings.style].map((c) => new THREE.Color(c));
          for (let i = 0; i < object.tones.length; i++) {
            const c = palette[object.tones[i]];
            object.colors.setXYZ(i, c.r, c.g, c.b);
          }
          object.colors.needsUpdate = true;
        }
        style = settings.style;
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    landmarks.dispose();
    vegetation?.dispose();
    guides.traverse((object) => {
      if (object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      } else if (object instanceof THREE.Sprite) {
        object.material.map?.dispose();
        object.material.dispose();
      }
    });
    for (const { mesh } of objects) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    root.clear();
  }
}
