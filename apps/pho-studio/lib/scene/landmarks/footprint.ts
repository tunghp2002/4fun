import * as THREE from "three";
import { contains, type Point } from "../../geo/coordinates";

export function insideFootprint(
  points: Point[],
  x: number,
  z: number,
  margin = 0.35,
) {
  return (
    contains(points, x, z) ||
    points.some((a, i) => {
      const b = points[(i + 1) % points.length],
        dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = Math.max(
        0,
        Math.min(
          1,
          ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1),
        ),
      );
      return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) <= margin;
    })
  );
}

// A rectangular model must stay in one wing of an L-shaped footprint, clear of its courtyard.
export function interiorRectangle(
  points: Point[],
  fallback: THREE.Box2,
  aspect = 1,
  holes: Point[][] = [],
) {
  const levels = [
    ...new Set([points, ...holes].flatMap((r) => r.map((p) => p[1]))),
  ].sort((a, b) => a - b);
  let best = fallback,
    score = 0;
  for (let bottom = 0; bottom < levels.length - 1; bottom++) {
    for (let top = bottom + 1; top < levels.length; top++) {
      const lo = levels[bottom] + 0.02,
        hi = levels[top] - 0.02;
      if (hi <= lo) continue;
      let spans: Point[] = [[-Infinity, Infinity]];
      const samples = [
        lo,
        hi,
        ...levels
          .slice(bottom + 1, top)
          .flatMap((z) => [z - 0.00001, z + 0.00001]),
      ];
      for (const z of samples) {
        const crossings: number[] = [];
        for (const ring of [points, ...holes])
          for (let i = 0; i < ring.length; i++) {
            const a = ring[i],
              b = ring[(i + 1) % ring.length];
            if (a[1] > z !== b[1] > z)
              crossings.push(
                a[0] + ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]),
              );
          }
        crossings.sort((a, b) => a - b);
        const next: Point[] = [];
        for (const [left, right] of spans) {
          for (let i = 1; i < crossings.length; i += 2) {
            const a = Math.max(left, crossings[i - 1]),
              b = Math.min(right, crossings[i]);
            if (b > a) next.push([a, b]);
          }
        }
        spans = next;
        if (!spans.length) break;
      }
      for (const [left, right] of spans) {
        const width = right - left - 0.04,
          depth = hi - lo;
        const candidateScore =
          (width * depth) / (1 + Math.abs(Math.log(width / depth / aspect)));
        if (candidateScore > score) {
          score = candidateScore;
          best = new THREE.Box2(
            new THREE.Vector2(left + 0.02, lo),
            new THREE.Vector2(right - 0.02, hi),
          );
        }
      }
    }
  }
  return best;
}
