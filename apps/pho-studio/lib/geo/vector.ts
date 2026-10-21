import { VectorTile, classifyRings } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
import type { Coordinate, MapData, MapFeature, Tags } from "../types";
import { bounds, clipPolygon, type Point } from "./coordinates";

const ZOOM = 14;
let template: { url: string; expires: number } | undefined;
const tileCache = new Map<string, Uint8Array>();
let cachedBytes = 0;
function tilePoint(point: Coordinate, zoom: number) {
  return {
    x: ((point.lon + 180) / 360) * 2 ** zoom,
    y:
      ((1 - Math.asinh(Math.tan((point.lat * Math.PI) / 180)) / Math.PI) / 2) *
      2 ** zoom,
  };
}
function clipLine(points: Point[], extent: number): Point[][] {
  const lines: Point[][] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      dx = b[0] - a[0],
      dy = b[1] - a[1];
    let lo = 0,
      hi = 1;
    for (const [p, q] of [
      [-dx, a[0]],
      [dx, extent - a[0]],
      [-dy, a[1]],
      [dy, extent - a[1]],
    ]) {
      if (p === 0) {
        if (q < 0) hi = -1;
      } else if (p < 0) lo = Math.max(lo, q / p);
      else hi = Math.min(hi, q / p);
    }
    if (lo >= hi) continue;
    const start: Point = [a[0] + dx * lo, a[1] + dy * lo],
      end: Point = [a[0] + dx * hi, a[1] + dy * hi];
    const line = lines[lines.length - 1],
      last = line?.[line.length - 1];
    if (last && Math.hypot(last[0] - start[0], last[1] - start[1]) < 1e-6)
      line.push(end);
    else lines.push([start, end]);
  }
  return lines;
}

export function parseVectorTile(
  bytes: Uint8Array,
  x: number,
  y: number,
  z = ZOOM,
): MapFeature[] {
  const tile = new VectorTile(new PbfReader(bytes)),
    output: MapFeature[] = [];
  for (const name of [
    "building",
    "transportation",
    "water",
    "waterway",
    "landcover",
    "landuse",
    "park",
  ]) {
    const layer = tile.layers[name];
    if (!layer) continue;
    if (layer.length > 50000) throw new Error("Vector tile quá lớn.");
    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i),
        p = feature.properties,
        category = String(p.class ?? "");
      let kind: MapFeature["kind"];
      const tags: Tags = {};
      if (name === "building") {
        if (p.hide_3d === true || p.hide_3d === 1) continue;
        kind = "building";
        tags.building = "yes";
        if (
          Number(p.render_min_height) > 0 &&
          Number(p.render_min_height) < 600
        ) {
          tags.min_height = String(p.render_min_height);
          tags["building:part"] = "yes";
        }
        for (const key of [
          "building",
          "building:part",
          "roof:shape",
          "roof:height",
          "roof:colour",
          "building:colour",
        ]) {
          if (typeof p[key] === "string" && p[key] !== "no")
            tags[key] = String(p[key]);
        }
        if (Number(p.render_height) > 0 && Number(p.render_height) < 600) {
          tags.height = String(p.render_height);
          tags["height:source"] = "vector_estimate";
        }
      } else if (name === "transportation") {
        if (
          feature.type !== 2 ||
          ["rail", "aerialway", "ferry"].includes(category)
        )
          continue;
        kind = "road";
        tags.highway = String(p.subclass || category || "residential");
      } else if (name === "water" || name === "waterway") {
        if (name === "waterway" && p.brunnel === "tunnel") continue;
        kind = "water";
        if (feature.type === 2) tags.waterway = category || "river";
        else {
          tags.natural = "water";
          tags.water = category;
        }
      } else {
        if (
          ![
            "wood",
            "grass",
            "forest",
            "park",
            "garden",
            "recreation_ground",
            "nature_reserve",
          ].includes(category)
        )
          continue;
        kind = "park";
        if (["wood", "forest"].includes(category)) tags.natural = "wood";
        else if (["grass", "recreation_ground"].includes(category))
          tags.landuse = category;
        else tags.leisure = category;
        if (typeof p.leaf_type === "string") tags.leaf_type = p.leaf_type;
      }
      if (typeof p.name === "string") tags.name = p.name;
      const extent = layer.extent;
      const coordinate = ([px, py]: Point): Coordinate => ({
        lon: ((x + px / extent) / 2 ** z) * 360 - 180,
        lat:
          (Math.atan(
            Math.sinh(Math.PI * (1 - (2 * (y + py / extent)) / 2 ** z)),
          ) *
            180) /
          Math.PI,
      });
      const id = Number.isSafeInteger(feature.id)
        ? feature.id!
        : (x * 20000 + y) * 100000 + i;
      const add = (points: Point[], holes: Point[][] = []) =>
        output.push({
          id,
          kind,
          tags,
          points: points.map(coordinate),
          holes: holes.map((r) => r.map(coordinate)),
        });
      const geometry = feature.loadGeometry();
      if (feature.type === 2) {
        for (const line of geometry)
          for (const part of clipLine(
            line.map((p) => [p.x, p.y]),
            extent,
          ))
            add(part);
      } else if (feature.type === 3) {
        const clip = (ring: (typeof geometry)[number]) =>
          clipPolygon(
            ring.map((p) => [p.x - extent / 2, p.y - extent / 2]),
            extent / 2,
          ).map(([a, b]): Point => [a + extent / 2, b + extent / 2]);
        for (const polygon of classifyRings(geometry)) {
          const outer = clip(polygon[0]);
          if (outer.length >= 3)
            add(
              outer,
              polygon
                .slice(1)
                .map(clip)
                .filter((r) => r.length >= 3),
            );
        }
      }
    }
  }
  return output;
}

export async function loadVectorMap(
  center: Coordinate,
  span: number,
  signal: AbortSignal,
): Promise<MapData> {
  signal.throwIfAborted();
  if (!template || template.expires < Date.now()) {
    const response = await fetch("https://tiles.openfreemap.org/planet", {
      signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
    });
    if (!response.ok) throw new Error("Nguồn bản đồ vector đang bận.");
    const metadata = await response.json(),
      url = metadata.tiles?.[0];
    if (
      typeof url !== "string" ||
      !url.startsWith("https://tiles.openfreemap.org/planet/") ||
      !["{z}", "{x}", "{y}"].every((token) => url.includes(token))
    )
      throw new Error("Nguồn vector không hợp lệ.");
    template = { url, expires: Date.now() + 3600000 };
  }
  const [south, west, north, east] = bounds(center, span);
  const limit = span <= 4400 ? 9 : 4;
  let zoom = ZOOM;
  let nw = tilePoint({ lat: north, lon: west }, zoom),
    se = tilePoint({ lat: south, lon: east }, zoom);
  while (
    (Math.floor(se.x) - Math.floor(nw.x) + 1) *
      (Math.floor(se.y) - Math.floor(nw.y) + 1) >
      limit &&
    zoom > 0
  ) {
    zoom--;
    nw = tilePoint({ lat: north, lon: west }, zoom);
    se = tilePoint({ lat: south, lon: east }, zoom);
  }
  const jobs: { x: number; y: number }[] = [];
  for (let x = Math.floor(nw.x); x <= Math.floor(se.x); x++)
    for (let y = Math.floor(nw.y); y <= Math.floor(se.y); y++)
      jobs.push({ x, y });
  if (jobs.length > limit) throw new Error("Phạm vi bản đồ quá lớn.");
  const tiles: MapFeature[][] = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, jobs.length) }, async () => {
      while (cursor < jobs.length) {
        const index = cursor++;
        const { x, y } = jobs[index];
        signal.throwIfAborted();
        const url = template!.url
          .replace("{z}", String(zoom))
          .replace("{x}", String(x))
          .replace("{y}", String(y));
        let bytes = tileCache.get(url);
        if (!bytes) {
          const response = await fetch(url, {
            signal: AbortSignal.any([signal, AbortSignal.timeout(18000)]),
          });
          if (!response.ok) throw new Error("Chưa tải được ô bản đồ.");
          bytes = new Uint8Array(await response.arrayBuffer());
        }
        if (bytes.length > 8 * 1024 * 1024)
          throw new Error("Ô bản đồ quá lớn.");
        signal.throwIfAborted();
        const features = parseVectorTile(bytes, x, y, zoom);
        if (tileCache.has(url)) tileCache.delete(url);
        else cachedBytes += bytes.byteLength;
        tileCache.set(url, bytes);
        while (tileCache.size > 16 || cachedBytes > 16 * 1024 * 1024) {
          const key = tileCache.keys().next().value!;
          cachedBytes -= tileCache.get(key)!.byteLength;
          tileCache.delete(key);
        }
        tiles[index] = features;
      }
    }),
  );
  let features = tiles.flat().filter((f) => {
    const lat = f.points.map((p) => p.lat),
      lon = f.points.map((p) => p.lon);
    return (
      Math.min(...lat) <= north &&
      Math.max(...lat) >= south &&
      Math.min(...lon) <= east &&
      Math.max(...lon) >= west
    );
  });
  if (span > 4400 && span <= 35200) {
    const detail = await loadVectorMap(center, 4400, signal);
    const [s, w, n, e] = bounds(center, 4400);
    features = [
      ...features.filter(
        (f) =>
          f.kind !== "building" ||
          f.points.every((p) => p.lat < s) ||
          f.points.every((p) => p.lat > n) ||
          f.points.every((p) => p.lon < w) ||
          f.points.every((p) => p.lon > e),
      ),
      ...detail.features.filter((f) => f.kind === "building"),
    ];
  }
  return { center, span, features, source: "live", provider: "vector" };
}
