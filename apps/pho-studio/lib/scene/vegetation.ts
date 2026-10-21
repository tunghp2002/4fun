import { contains, project, random, type Point } from "../geo/coordinates";
import { isLinearFeature, type MapData } from "../types";
import { roadWidth } from "./roads";
import type { SceneTree } from "./trees";

// Far crowns represent groups of trees; their spacing grows with map extent.
export async function mappedTrees(
  data: MapData,
  seed: number,
  innerSpan = 0,
  signal?: AbortSignal,
): Promise<SceneTree[]> {
  signal?.throwIfAborted();
  if (data.span > 8800) return [];
  const half = data.span / 2,
    inner = innerSpan / 2;
  const spacing = Math.max(8, (innerSpan || data.span) / 96),
    cell = Math.max(64, spacing);
  type Area = {
    points: Point[];
    holes: Point[][];
    green: boolean;
    forest: boolean;
    linear: boolean;
    margin: number;
    conifer: boolean;
  };
  const cells = new Map<string, Area[]>(),
    trees: SceneTree[] = [];
  const visible = (x: number, z: number) =>
    Math.max(Math.abs(x), Math.abs(z)) < half &&
    Math.max(Math.abs(x), Math.abs(z)) >= inner;
  for (const feature of data.features) {
    const points = feature.points.map((p) => project(p, data.center));
    if (feature.kind === "tree" && points[0] && visible(...points[0])) {
      const rnd = random(seed ^ feature.id);
      trees.push({
        x: points[0][0],
        z: points[0][1],
        h: 6 + rnd() * 5,
        radius: 2.5 + rnd() * 2,
        tone: Math.floor(rnd() * 3),
        conifer: /needleleaved|conifer|pinus|thông/i.test(
          `${feature.tags.leaf_type} ${feature.tags.genus} ${feature.tags.species}`,
        ),
      });
      continue;
    }
    if (points.length < 2 || feature.kind === "tree") continue;
    const linear = isLinearFeature(feature),
      green = feature.kind === "park";
    const area: Area = {
      points,
      holes: feature.holes.map((r) => r.map((p) => project(p, data.center))),
      green,
      linear,
      forest:
        feature.tags.natural === "wood" || feature.tags.landuse === "forest",
      conifer: /needleleaved|conifer|pinus|thông/i.test(
        `${feature.tags.leaf_type} ${feature.tags.genus} ${feature.tags.species}`,
      ),
      margin: linear
        ? feature.kind === "road"
          ? roadWidth(feature.tags) / 2 + 2
          : Number.parseFloat(feature.tags.width) / 2 || 9
        : 2,
    };
    const xs = points.map((p) => p[0]),
      zs = points.map((p) => p[1]);
    for (
      let x = Math.floor(Math.max(-half, Math.min(...xs) - area.margin) / cell);
      x <= Math.floor(Math.min(half, Math.max(...xs) + area.margin) / cell);
      x++
    )
      for (
        let z = Math.floor(
          Math.max(-half, Math.min(...zs) - area.margin) / cell,
        );
        z <= Math.floor(Math.min(half, Math.max(...zs) + area.margin) / cell);
        z++
      ) {
        const key = `${x},${z}`,
          values = cells.get(key);
        if (values) values.push(area);
        else cells.set(key, [area]);
      }
  }
  const inside = (a: Area, x: number, z: number) =>
    contains(a.points, x, z) && !a.holes.some((r) => contains(r, x, z));
  const distance = (a: Point, b: Point, x: number, z: number) => {
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      length = dx * dx + dz * dz;
    const t = length
      ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / length))
      : 0;
    return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
  };
  for (let ix = Math.ceil(-half / spacing); ix * spacing < half; ix++) {
    if (ix % 8 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      signal?.throwIfAborted();
    }
    for (let iz = Math.ceil(-half / spacing); iz * spacing < half; iz++) {
      const rnd = random(
        seed ^ Math.imul(ix, 73856093) ^ Math.imul(iz, 19349663),
      );
      const x = (ix + (rnd() - 0.5) * 0.55) * spacing,
        z = (iz + (rnd() - 0.5) * 0.55) * spacing;
      if (!visible(x, z)) continue;
      const distanceScale = Math.max(
        1,
        Math.max(Math.abs(x), Math.abs(z)) / (inner || half),
      );
      if (rnd() > 1 / distanceScale ** 2) continue;
      const areas =
        cells.get(`${Math.floor(x / cell)},${Math.floor(z / cell)}`) ?? [];
      const green = areas.filter((a) => a.green && inside(a, x, z));
      if (!green.length) continue;
      const forest = green.some((a) => a.forest);
      if (!forest && rnd() > Math.min(1, (spacing / 22) ** 2)) continue;
      if (
        areas.some(
          (a) =>
            !a.green &&
            (a.linear
              ? a.points
                  .slice(1)
                  .some((p, i) => distance(a.points[i], p, x, z) < a.margin)
              : inside(a, x, z) ||
                [a.points, ...a.holes].some((r) =>
                  r.some(
                    (p, i) =>
                      distance(p, r[(i + 1) % r.length], x, z) < a.margin,
                  ),
                )),
        )
      )
        continue;
      trees.push({
        x,
        z,
        h: forest ? 11 + rnd() * 8 : 5 + rnd() * 6,
        radius: forest
          ? Math.max(4.5, spacing * 0.58) * distanceScale * (0.85 + rnd() * 0.3)
          : 2.5 + rnd() * 2,
        tone: Math.floor(rnd() * 3),
        conifer: green.some((a) => a.conifer),
      });
    }
  }
  signal?.throwIfAborted();
  return trees;
}
