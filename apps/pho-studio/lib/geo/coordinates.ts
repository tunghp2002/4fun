import type { Coordinate } from "../types";

const METERS = 111320;
// Navigation coverage envelopes, including the two offshore archipelagos.
export const COVERAGE_BOUNDS = [
  [102, 7.5, 110, 23.6],
  [110.7, 15, 113.3, 17.8],
  [109.5, 6, 117.5, 12.5],
  [109.5, 12.5, 113.3, 15], // Sea corridor connects the mainland and offshore navigation windows.
] as const;
export function isOffshore(p: Coordinate) {
  return COVERAGE_BOUNDS.slice(1).some(
    ([west, south, east, north]) =>
      p.lon >= west && p.lon <= east && p.lat >= south && p.lat <= north,
  );
}
export function isVietnam(p: Coordinate) {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lon) &&
    COVERAGE_BOUNDS.some(
      ([west, south, east, north]) =>
        p.lon >= west && p.lon <= east && p.lat >= south && p.lat <= north,
    )
  );
}
export function parseCoordinate(value: string): Coordinate | null {
  let decoded = value.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    /* Keep the original input. */
  }
  const match =
    decoded.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ??
    decoded.match(
      /(?:[?&#](?:q|ll|query)=)?(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)/,
    );
  if (!match) return null;
  const p = { lat: Number(match[1]), lon: Number(match[2]) };
  return isVietnam(p) ? p : null;
}
export function project(
  point: Coordinate,
  center: Coordinate,
): [number, number] {
  return [
    (point.lon - center.lon) * METERS * Math.cos((center.lat * Math.PI) / 180),
    (center.lat - point.lat) * METERS,
  ];
}
export function unproject(
  x: number,
  z: number,
  center: Coordinate,
): Coordinate {
  return {
    lat: center.lat - z / METERS,
    lon: center.lon + x / (METERS * Math.cos((center.lat * Math.PI) / 180)),
  };
}
export function bounds(center: Coordinate, span: number) {
  const delta = span / 2 / METERS;
  const lonDelta = delta / Math.cos((center.lat * Math.PI) / 180);
  return [
    center.lat - delta,
    center.lon - lonDelta,
    center.lat + delta,
    center.lon + lonDelta,
  ] as const;
}
export function readHash(
  hash: string,
): { center: Coordinate; span: number; seed: number; name: string } | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const center = parseCoordinate(params.get("ll") ?? "");
  if (!center) return null;
  const span = Math.max(300, Math.min(1800, Number(params.get("s")) || 800));
  const seed = params.has("seed") ? Number(params.get("seed")) : 2026;
  return {
    center,
    span,
    seed: Number.isFinite(seed) ? seed >>> 0 : 2026,
    name: (params.get("n") || "Góc phố của bạn").slice(0, 140),
  };
}
export function shareHash(
  center: Coordinate,
  span: number,
  seed: number,
  name: string,
) {
  return new URLSearchParams({
    ll: `${center.lat.toFixed(6)},${center.lon.toFixed(6)}`,
    s: String(span),
    seed: String(seed >>> 0),
    n: name,
  }).toString();
}
export function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
export function buildingHeight(
  tags: Record<string, string>,
  id: number,
  seed: number,
) {
  const height = Number.parseFloat(tags.height ?? "");
  if (height > 0 && height < 600)
    return {
      height: /ft|feet/i.test(tags.height) ? height * 0.3048 : height,
      estimated: tags["height:source"] === "vector_estimate",
    };
  const levels = Number.parseFloat(tags["building:levels"] ?? "");
  if (levels > 0 && levels < 150)
    return { height: levels * 3.2, estimated: false };
  const r = random((id ^ seed) >>> 0)();
  return {
    height: tags.building === "apartments" ? 14 + r * 20 : 5.8 + r * 7,
    estimated: true,
  };
}
export type Point = [number, number];
export function clipPolygon(input: Point[], half: number): Point[] {
  let points = input;
  for (const [axis, side] of [
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 1],
  ] as const) {
    const previous = points;
    points = [];
    for (let i = 0; i < previous.length; i++) {
      const a = previous[i],
        b = previous[(i + 1) % previous.length];
      const insideA = a[axis] * side <= half,
        insideB = b[axis] * side <= half;
      if (insideA) points.push(a);
      if (insideA !== insideB) {
        const t = (half * side - a[axis]) / (b[axis] - a[axis]);
        points.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
  }
  return points;
}
export function contains(points: Point[], x: number, z: number) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i],
      b = points[j];
    if (
      a[1] > z !== b[1] > z &&
      x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
