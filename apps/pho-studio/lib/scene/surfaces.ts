import * as THREE from "three";
import { contains, type Point } from "../geo/coordinates";

export type Elevation = (x: number, z: number) => number;

// Use the ground's triangles for every draped layer, including exported geometry.
export function gridElevation(sample: Elevation, step: number, origin: number) {
  const cache = new Map<string, number>();
  const vertex = (x: number, z: number) => {
    const key = `${x},${z}`;
    let y = cache.get(key);
    if (y === undefined) {
      y = sample(origin + x * step, origin + z * step);
      cache.set(key, y);
    }
    return y;
  };
  return (x: number, z: number) => {
    const gx = (x - origin) / step,
      gz = (z - origin) / step;
    const ix = Math.floor(gx),
      iz = Math.floor(gz),
      fx = gx - ix,
      fz = gz - iz;
    return fx + fz <= 1
      ? vertex(ix, iz) * (1 - fx - fz) +
          vertex(ix + 1, iz) * fx +
          vertex(ix, iz + 1) * fz
      : vertex(ix + 1, iz + 1) * (fx + fz - 1) +
          vertex(ix, iz + 1) * (1 - fx) +
          vertex(ix + 1, iz) * (1 - fz);
  };
}

type SurfacePoint = [number, number, number?];

function clip(
  ring: SurfacePoint[],
  distance: (p: SurfacePoint) => number,
): SurfacePoint[] {
  const result: SurfacePoint[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i],
      b = ring[(i + 1) % ring.length],
      da = distance(a),
      db = distance(b);
    if (da >= -1e-8) result.push(a);
    if ((da < -1e-8 && db > 1e-8) || (da > 1e-8 && db < -1e-8)) {
      const t = da / (da - db);
      result.push([
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * t,
      ]);
    }
  }
  return result;
}

export function surfaceGeometry(
  points: Point[],
  holes: Point[][],
  height: Elevation,
  step: number,
  origin: number,
) {
  const open = (ring: Point[]) =>
    ring.length > 1 &&
    Math.hypot(ring[0][0] - ring.at(-1)![0], ring[0][1] - ring.at(-1)![1]) <
      1e-7
      ? ring.slice(0, -1)
      : ring;
  points = open(points);
  holes = holes.map(open).filter((r) => r.length >= 3);
  const flat = points.concat(...holes);
  const faces = THREE.ShapeUtils.triangulateShape(
    points.map((p) => new THREE.Vector2(...p)),
    holes.map((r) => r.map((p) => new THREE.Vector2(...p))),
  );
  return gridTriangles(flat, faces, height, step, origin);
}

export function drapeGeometry(
  geometry: THREE.BufferGeometry,
  height: Elevation,
  step: number,
  origin: number,
) {
  const pos = geometry.getAttribute("position");
  const points: SurfacePoint[] = Array.from({ length: pos.count }, (_, i) => [
    pos.getX(i),
    pos.getZ(i),
    pos.getY(i) - height(pos.getX(i), pos.getZ(i)),
  ]);
  const faces = Array.from(
    { length: (geometry.index?.count ?? pos.count) / 3 },
    (_, i) =>
      [0, 1, 2].map((j) =>
        geometry.index ? geometry.index.getX(i * 3 + j) : i * 3 + j,
      ),
  );
  return gridTriangles(points, faces, height, step, origin, true);
}

function gridTriangles(
  flat: SurfacePoint[],
  faces: number[][],
  height: Elevation,
  step: number,
  origin: number,
  preserveWinding = false,
) {
  const vertices: number[] = [];
  const emit = (ring: SurfacePoint[]) => {
    for (let i = 2; i < ring.length; i++) {
      const [a, b, c] = [ring[0], ring[i - 1], ring[i]];
      const cross =
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const corners = (
        cross > 0 && !preserveWinding ? [a, c, b] : [a, b, c]
      ).map(([x, z, offset]) => [x, height(x, z) + (offset ?? 0), z]);
      const ab = new THREE.Vector3()
        .fromArray(corners[1])
        .sub(new THREE.Vector3().fromArray(corners[0]));
      const ac = new THREE.Vector3()
        .fromArray(corners[2])
        .sub(new THREE.Vector3().fromArray(corners[0]));
      if (ab.cross(ac).lengthSq() > 1e-16)
        vertices.push(...corners[0], ...corners[1], ...corners[2]);
    }
  };
  for (const face of faces) {
    const tri = face.map((i) => flat[i]);
    const loX = Math.floor((Math.min(...tri.map((p) => p[0])) - origin) / step),
      hiX = Math.floor((Math.max(...tri.map((p) => p[0])) - origin) / step);
    const loZ = Math.floor((Math.min(...tri.map((p) => p[1])) - origin) / step),
      hiZ = Math.floor((Math.max(...tri.map((p) => p[1])) - origin) / step);
    for (let z = loZ; z <= hiZ; z++) {
      const z0 = origin + z * step,
        z1 = z0 + step;
      const row = clip(
        clip(tri, (p) => p[1] - z0),
        (p) => z1 - p[1],
      );
      if (row.length < 3) continue;
      const start = Math.max(
        loX,
        Math.floor((Math.min(...row.map((p) => p[0])) - origin) / step),
      );
      const end = Math.min(
        hiX,
        Math.floor((Math.max(...row.map((p) => p[0])) - origin) / step),
      );
      for (let x = start; x <= end; x++) {
        const x0 = origin + x * step,
          x1 = x0 + step;
        const cell = clip(
          clip(row, (p) => p[0] - x0),
          (p) => x1 - p[0],
        );
        if (cell.length < 3) continue;
        emit(clip(cell, (p) => x1 + z0 - p[0] - p[1]));
        emit(clip(cell, (p) => p[0] + p[1] - x1 - z0));
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function foundation(
  points: Point[],
  holes: Point[][],
  height: Elevation,
  step: number,
  origin: number,
) {
  let low = Infinity,
    high = -Infinity;
  const sample = (x: number, z: number) => {
    const y = height(x, z);
    low = Math.min(low, y);
    high = Math.max(high, y);
  };
  for (const ring of [points, ...holes])
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % ring.length];
      sample(...a);
      // Maxima along an edge can occur where it crosses a terrain triangle.
      for (const direction of [
        [1, 0],
        [0, 1],
        [1, 1],
      ]) {
        const da = a[0] * direction[0] + a[1] * direction[1],
          db = b[0] * direction[0] + b[1] * direction[1];
        const offset = origin * (direction[0] + direction[1]);
        for (
          let k = Math.ceil((Math.min(da, db) - offset) / step);
          k * step + offset < Math.max(da, db);
          k++
        ) {
          const t = (k * step + offset - da) / (db - da);
          sample(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
        }
      }
    }
  const minX = Math.min(...points.map((p) => p[0])),
    maxX = Math.max(...points.map((p) => p[0]));
  const minZ = Math.min(...points.map((p) => p[1])),
    maxZ = Math.max(...points.map((p) => p[1]));
  for (
    let x = Math.ceil((minX - origin) / step);
    origin + x * step <= maxX;
    x++
  )
    for (
      let z = Math.ceil((minZ - origin) / step);
      origin + z * step <= maxZ;
      z++
    ) {
      const px = origin + x * step,
        pz = origin + z * step;
      if (contains(points, px, pz) && !holes.some((r) => contains(r, px, pz)))
        sample(px, pz);
    }
  return { low, high };
}
