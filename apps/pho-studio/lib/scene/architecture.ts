import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Point } from "../geo/coordinates";

export const PALETTES = {
  paper: {
    ground: "#ddd8c5",
    wall: ["#e8c87f", "#e7d9bd", "#f0e9d8", "#d4bda0"],
    roof: ["#94583f", "#a76548", "#784c3c", "#b27a54"],
    green: "#9ba982",
    water: "#6eaaa7",
    road: "#777d7c",
    foliage: ["#476b51", "#68835b", "#7a8e61"],
    trunk: "#9b8063",
    edge: "#353d32",
    window: "#6e827d",
    base: "#d2d0bf",
  },
  clay: {
    ground: "#e9e5df",
    wall: ["#f7f5ef"],
    roof: ["#f0eee7"],
    green: "#d2d9ca",
    water: "#bdcbd0",
    road: "#c7c9c2",
    foliage: ["#adbda6"],
    trunk: "#c2b4a4",
    edge: "#b9bab1",
    window: "#a0a7a4",
    base: "#d2cec6",
  },
  ink: {
    ground: "#eeeeeb",
    wall: ["#ffffff"],
    roof: ["#bdbdb9"],
    green: "#d1d2c9",
    water: "#c6cece",
    road: "#b4b6b5",
    foliage: ["#dde0d8", "#c4c9be", "#ebede6"],
    trunk: "#60645e",
    edge: "#181b19",
    window: "#555d5b",
    base: "#d1d2ce",
  },
};
export function gabledRoof(
  points: Point[],
  base: number,
  measuredRise: number,
) {
  let axis: Point = [1, 0],
    longest = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length > longest) {
      longest = length;
      axis = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
    }
  }
  const across = ([x, z]: Point) => -axis[1] * x + axis[0] * z;
  const values = points.map(across),
    lo = Math.min(...values),
    hi = Math.max(...values);
  const middle = (lo + hi) / 2,
    radius = Math.max(0.1, (hi - lo) / 2),
    rise = measuredRise || Math.max(0.8, Math.min(4, radius * 0.48));
  const roofY = (p: Point) =>
    base + rise * Math.max(0, 1 - Math.abs(across(p) - middle) / radius);
  const pieces: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const ring: Point[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      const da = (across(a) - middle) * side,
        db = (across(b) - middle) * side;
      if (da <= 0) ring.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        const t = da / (da - db);
        ring.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    if (ring.length < 3) continue;
    const source = new THREE.ShapeGeometry(
      new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z))),
    );
    const geometry = source.index ? source.toNonIndexed() : source;
    if (source !== geometry) source.dispose();
    geometry.deleteAttribute("uv");
    geometry.deleteAttribute("uv1");
    geometry.rotateX(-Math.PI / 2);
    const pos = geometry.getAttribute("position");
    for (let i = 0; i < pos.count; i++)
      pos.setY(i, roofY([pos.getX(i), pos.getZ(i)]));
    geometry.computeVertexNormals();
    pieces.push(geometry);
  }
  const sides: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      line = [a];
    const da = across(a) - middle,
      db = across(b) - middle;
    if (da * db < 0) {
      const t = da / (da - db);
      line.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    line.push(b);
    for (let j = 1; j < line.length; j++) {
      const p = line[j - 1],
        q = line[j];
      sides.push(
        p[0],
        base,
        p[1],
        q[0],
        base,
        q[1],
        p[0],
        roofY(p),
        p[1],
        q[0],
        base,
        q[1],
        q[0],
        roofY(q),
        q[1],
        p[0],
        roofY(p),
        p[1],
      );
    }
  }
  const ends = new THREE.BufferGeometry();
  ends.setAttribute("position", new THREE.Float32BufferAttribute(sides, 3));
  ends.computeVertexNormals();
  pieces.push(ends);
  const result = mergeGeometries(pieces)!;
  pieces.forEach((piece) => piece.dispose());
  return { geometry: result, rise };
}

export function windowVertices(
  points: Point[],
  base: number,
  height: number,
  maxColumns = 12,
) {
  const vertices: number[] = [];
  const winding =
    Math.sign(
      points.reduce((sum, a, i) => {
        const b = points[(i + 1) % points.length];
        return sum + a[0] * b[1] - b[0] * a[1];
      }, 0),
    ) || 1;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      length = Math.hypot(dx, dz);
    const columns = Math.min(maxColumns, Math.floor(length / 3.6));
    if (columns < 1) continue;
    for (
      let level = 0;
      level < Math.min(80, Math.floor((height - 0.6) / 3.2));
      level++
    )
      for (let column = 0; column < columns; column++) {
        const t = (column + 0.5) / columns,
          x = a[0] + dx * t + (dz / length) * 0.06 * winding,
          z = a[1] + dz * t - (dx / length) * 0.06 * winding,
          y = base + 1.4 + level * 3.2;
        const ux = (dx / length) * 0.7,
          uz = (dz / length) * 0.7;
        vertices.push(
          x - ux,
          y,
          z - uz,
          x + ux,
          y,
          z + uz,
          x - ux,
          y + 1.1,
          z - uz,
          x + ux,
          y,
          z + uz,
          x + ux,
          y + 1.1,
          z + uz,
          x - ux,
          y + 1.1,
          z - uz,
        );
      }
  }

  return vertices;
}
