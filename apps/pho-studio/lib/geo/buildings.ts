import {
  buildingHeight,
  contains,
  project,
  unproject,
  type Point,
} from "./coordinates";
import type { Coordinate, MapFeature, Tags } from "../types";
function meters(value: string | undefined) {
  const n = Number.parseFloat(value ?? "");
  if (!Number.isFinite(n)) return 0;
  return Math.max(
    0,
    Math.min(600, /ft|feet/i.test(value ?? "") ? n * 0.3048 : n),
  );
}
export function buildingProfile(tags: Tags, id: number, seed: number) {
  const total = buildingHeight(tags, id, seed),
    minimum = Math.min(
      total.height - 0.25,
      meters(tags.min_height) || meters(tags["building:min_level"]) * 3.2,
    );
  const roof =
    tags["roof:shape"] === "flat"
      ? 0
      : Math.min(
          Math.max(0, total.height - minimum - 0.25),
          meters(tags["roof:height"]) || meters(tags["roof:levels"]) * 3.2,
        );
  return {
    height: total.height - minimum - roof,
    minimum,
    roof,
    estimated: total.estimated,
  };
}
export function buildingDesign(
  feature: MapFeature,
  points: Point[],
  holes: Point[][],
  center: Coordinate,
  seed: number,
) {
  const xs = points.map((p) => p[0]),
    zs = points.map((p) => p[1]),
    cx = xs.reduce((a, b) => a + b, 0) / xs.length,
    cz = zs.reduce((a, b) => a + b, 0) / zs.length,
    location = unproject(cx, cz, center);
  const identity =
    (Math.imul(Math.round(location.lon * 1e6), 73856093) ^
      Math.imul(Math.round(location.lat * 1e6), 19349663) ^
      feature.id) >>>
    0;
  // Vector tiles merge unrelated footprints and use 5 m when height is unknown.
  const tags =
    feature.tags["height:source"] === "vector_estimate" &&
    feature.tags.height === "5"
      ? { ...feature.tags, height: "" }
      : feature.tags;
  const profile = buildingProfile(tags, identity, seed);

  const heritage =
    (Math.abs(location.lat - 15.8773) < 0.04 &&
      Math.abs(location.lon - 108.3284) < 0.04) ||
    (Math.abs(location.lat - 16.4698) < 0.04 &&
      Math.abs(location.lon - 107.5793) < 0.04) ||
    (Math.abs(location.lat - 11.9404) < 0.06 &&
      Math.abs(location.lon - 108.4353) < 0.06);
  const pitched =
    feature.tags["roof:shape"] !== "flat" &&
    (Boolean(feature.tags["roof:shape"]) ||
      heritage ||
      (profile.height < 10 && identity % 3 === 0)) &&
    profile.height < 18 &&
    Math.max(...xs) - Math.min(...xs) < 90 &&
    Math.max(...zs) - Math.min(...zs) < 90 &&
    holes.length === 0 &&
    contains(points, cx, cz);
  return { ...profile, pitched, tone: identity % 4, identity };
}
export function buildingOutlinesWithParts(
  features: MapFeature[],
  center: Coordinate,
) {
  const cells = new Map<
      string,
      { points: Point[]; cx: number; cz: number }[]
    >(),
    size = 64;
  for (const feature of features) {
    if (
      feature.kind !== "building" ||
      !feature.tags["building:part"] ||
      feature.tags["building:part"] === "no"
    )
      continue;
    const points = feature.points.map((p) => project(p, center));
    if (points.length < 3) continue;
    const cx = points.reduce((s, p) => s + p[0], 0) / points.length,
      cz = points.reduce((s, p) => s + p[1], 0) / points.length,
      key = `${Math.floor(cx / size)},${Math.floor(cz / size)}`;
    const item = { points, cx, cz },
      values = cells.get(key);
    if (values) values.push(item);
    else cells.set(key, [item]);
  }
  const hidden = new Set<MapFeature>();
  if (!cells.size) return hidden;
  for (const feature of features) {
    if (feature.kind !== "building" || feature.tags["building:part"]) continue;
    const ring = feature.points.map((p) => project(p, center));
    if (ring.length < 3) continue;
    const xs = ring.map((p) => p[0]),
      zs = ring.map((p) => p[1]);
    outer: for (
      let x = Math.floor(Math.min(...xs) / size);
      x <= Math.floor(Math.max(...xs) / size);
      x++
    )
      for (
        let z = Math.floor(Math.min(...zs) / size);
        z <= Math.floor(Math.max(...zs) / size);
        z++
      )
        for (const part of cells.get(`${x},${z}`) ?? []) {
          const onRing = (px: number, pz: number) =>
            ring.some((a, i) => {
              const b = ring[(i + 1) % ring.length],
                dx = b[0] - a[0],
                dz = b[1] - a[1],
                length = dx * dx + dz * dz;
              const t = length
                ? Math.max(
                    0,
                    Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / length),
                  )
                : 0;
              return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t) < 0.15;
            });
          const inHole = feature.holes.some((hole) =>
            contains(
              hole.map((p) => project(p, center)),
              part.cx,
              part.cz,
            ),
          );
          if (
            !inHole &&
            (contains(ring, part.cx, part.cz) || onRing(part.cx, part.cz)) &&
            part.points.every(
              ([px, pz]) => contains(ring, px, pz) || onRing(px, pz),
            )
          ) {
            hidden.add(feature);
            break outer;
          }
        }
  }
  return hidden;
}
