import { clipPolygon, contains, project, type Point } from "../geo/coordinates";
import { groundTerrain, heightAt } from "../geo/terrain";
import { isLinearFeature, type MapData, type TerrainData } from "../types";
import type { Elevation } from "./surfaces";

export function sceneElevation(data: MapData, terrain: TerrainData) {
  const ground = data.features.some((f) => f.kind === "building")
    ? groundTerrain(terrain, data.span)
    : terrain;
  const sample = (x: number, z: number) => heightAt(ground, data.span, x, z);
  return waterElevation(data, sample);
}

export type WaterSurface = { ring: Point[]; islands: Point[][]; level: number };

export function waterElevation(
  data: MapData,
  sample: Elevation,
  shared: WaterSurface[] = [],
) {
  const levels = new Map<MapData["features"][number], number>();
  const lakes = data.features.flatMap((feature) => {
    if (feature.kind !== "water" || isLinearFeature(feature)) return [];
    const ring = clipPolygon(
      feature.points.map((p) => project(p, data.center)),
      data.span / 2,
    );
    if (ring.length < 3) return [];
    const islands = feature.holes.map((r) =>
      r.map((p) => project(p, data.center)),
    );
    const reach = /^(river|riverbank|ocean|sea|canal)$/.test(
      feature.tags.water ?? feature.tags.waterway ?? "",
    );
    let samples = ring.map(([x, z]) => sample(x, z));
    if (reach) {
      const xs = ring.map((p) => p[0]),
        zs = ring.map((p) => p[1]),
        left = Math.min(...xs),
        right = Math.max(...xs),
        top = Math.min(...zs),
        bottom = Math.max(...zs),
        interior: number[] = [];
      for (let row = 1; row < 8; row++)
        for (let col = 1; col < 8; col++) {
          const x = left + ((right - left) * col) / 8,
            z = top + ((bottom - top) * row) / 8;
          if (contains(ring, x, z) && !islands.some((h) => contains(h, x, z)))
            interior.push(sample(x, z));
        }
      if (interior.length) samples = interior;
    }
    samples.sort((a, b) => a - b);
    const overlaps = shared.find(
      (w) =>
        w.ring.some(
          ([x, z]) =>
            contains(ring, x, z) && !islands.some((h) => contains(h, x, z)),
        ) ||
        ring.some(
          ([x, z]) =>
            contains(w.ring, x, z) && !w.islands.some((h) => contains(h, x, z)),
        ),
    );
    const level =
      overlaps?.level ??
      samples[Math.floor(samples.length * (reach ? 0.2 : 0.5))] ??
      0;
    levels.set(feature, level);
    return [
      {
        ring,
        islands,
        level,
        reach,
        minX: Math.min(...ring.map((p) => p[0])) - 18,
        maxX: Math.max(...ring.map((p) => p[0])) + 18,
        minZ: Math.min(...ring.map((p) => p[1])) - 18,
        maxZ: Math.max(...ring.map((p) => p[1])) + 18,
      },
    ];
  });
  const distance = (points: Point[], x: number, z: number) =>
    Math.min(
      ...points.map((a, i) => {
        const b = points[(i + 1) % points.length],
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          length = dx * dx + dz * dz;
        const t = length
          ? Math.max(
              0,
              Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / length),
            )
          : 0;
        return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
      }),
    );
  // shortcut: polygon river reaches use one local level per scene; use hydrologic data for long-distance flow.
  return Object.assign(
    (x: number, z: number) => {
      let result = sample(x, z),
        weight = 0;
      for (const lake of lakes) {
        const { ring, islands, level, reach, minX, maxX, minZ, maxZ } = lake;
        if (x < minX || x > maxX || z < minZ || z > maxZ) continue;
        if (contains(ring, x, z)) {
          if (!islands.some((r) => contains(r, x, z))) return level;
          // Coastal polygons can contain whole islands, whose relief must remain above water.
          return reach ? Math.max(sample(x, z), level + 0.85) : level + 0.85;
        }
        const blend = Math.min(1, distance(ring, x, z) / 18),
          influence = 1 - blend * blend * (3 - 2 * blend);
        if (influence > weight) {
          result = sample(x, z) + (level - sample(x, z)) * influence;
          weight = influence;
        }
      }
      return result;
    },
    { waterLevels: levels, waterSurfaces: lakes },
  );
}
