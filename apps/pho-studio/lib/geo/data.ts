import type { Coordinate, MapData, MapFeature, Place, Tags } from "../types";
import { bounds, isVietnam, isOffshore, parseCoordinate } from "./coordinates";

type Raw = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Tags;
  geometry?: Coordinate[];
  members?: {
    type: string;
    ref: number;
    role: string;
    geometry?: Coordinate[];
  }[];
};
function validPoints(value: unknown): Coordinate[] {
  return Array.isArray(value)
    ? value.filter(
        (p): p is Coordinate =>
          !!p &&
          typeof p === "object" &&
          Number.isFinite(p.lat) &&
          Number.isFinite(p.lon) &&
          Math.abs(p.lat) <= 90 &&
          Math.abs(p.lon) <= 180,
      )
    : [];
}
function kind(tags: Tags): MapFeature["kind"] | null {
  if (tags.waterway && tags.tunnel && tags.tunnel !== "no") return null;
  if (
    (tags.building && tags.building !== "no") ||
    (tags["building:part"] && tags["building:part"] !== "no")
  )
    return "building";
  if (
    tags.highway &&
    !["proposed", "construction", "platform"].includes(tags.highway)
  )
    return "road";
  if (tags.natural === "water" || tags.waterway) return "water";
  if (tags.natural === "tree") return "tree";
  if (
    ["park", "garden"].includes(tags.leisure) ||
    ["grass", "forest", "recreation_ground", "meadow"].includes(tags.landuse) ||
    tags.natural === "wood"
  )
    return "park";
  return null;
}
function rings(members: NonNullable<Raw["members"]>, role: string) {
  const chains = members
    .filter((m) => m && m.role === role && m.type === "way")
    .map((m) => validPoints(m.geometry))
    .filter((p) => p.length >= 2);
  const completed: Coordinate[][] = [];
  const same = (a: Coordinate, b: Coordinate) =>
    Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lon - b.lon) < 1e-7;
  while (chains.length) {
    let chain = chains.pop()!;
    let joining = true;
    while (joining && !same(chain[0], chain[chain.length - 1])) {
      joining = false;
      for (let i = 0; i < chains.length; i++) {
        const next = chains[i];
        if (same(chain[chain.length - 1], next[0]))
          chain = chain.concat(next.slice(1));
        else if (same(chain[chain.length - 1], next[next.length - 1]))
          chain = chain.concat([...next].reverse().slice(1));
        else if (same(chain[0], next[next.length - 1]))
          chain = next.concat(chain.slice(1));
        else if (same(chain[0], next[0]))
          chain = [...next].reverse().concat(chain.slice(1));
        else continue;
        chains.splice(i, 1);
        joining = true;
        break;
      }
    }
    if (chain.length >= 4 && same(chain[0], chain[chain.length - 1]))
      completed.push(chain);
  }
  return completed;
}
export function parseMap(payload: unknown): MapFeature[] {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("elements" in payload) ||
    !Array.isArray(payload.elements)
  )
    throw new Error("Dữ liệu bản đồ không hợp lệ.");
  const elements = payload.elements as Raw[];
  if (elements.length > 50000)
    throw new Error("Khu vực có quá nhiều dữ liệu. Hãy chọn phạm vi nhỏ hơn.");
  const used = new Set<number>();
  const wayKinds = new Map(
    elements
      .filter((e) => e?.type === "way")
      .map((e) => [e.id, kind(e.tags ?? {})]),
  );
  for (const e of elements)
    if (
      e &&
      e.type === "relation" &&
      kind(e.tags ?? {}) &&
      Array.isArray(e.members)
    )
      for (const m of e.members)
        if (
          m &&
          m.type === "way" &&
          (m.role === "outer" || m.role === "inner") &&
          (!wayKinds.get(m.ref) || wayKinds.get(m.ref) === kind(e.tags ?? {}))
        )
          used.add(m.ref);
  const features: MapFeature[] = [];
  for (const e of elements) {
    if (!e || !Number.isFinite(e.id)) continue;
    const tags: Tags = Object.fromEntries(
      Object.entries(e.tags ?? {}).filter(([, v]) => typeof v === "string"),
    );
    const category = kind(tags);
    if (!category) continue;
    if (e.type === "relation") {
      const members = Array.isArray(e.members) ? e.members : [];
      const inner = rings(members, "inner");
      for (const points of rings(members, "outer"))
        features.push({ id: e.id, kind: category, points, holes: inner, tags });
    } else if (e.type === "way" && !used.has(e.id)) {
      const points = validPoints(e.geometry);
      if (points.length >= (category === "road" || tags.waterway ? 2 : 3))
        features.push({ id: e.id, kind: category, points, holes: [], tags });
    } else if (
      e.type === "node" &&
      category === "tree" &&
      Number.isFinite(e.lat) &&
      Number.isFinite(e.lon)
    ) {
      features.push({
        id: e.id,
        kind: category,
        points: [{ lat: e.lat!, lon: e.lon! }],
        holes: [],
        tags,
      });
    }
  }
  return features;
}

const cache = new Map<string, MapData>();
const CACHE_KEY = "pho-map-v5:";
function cacheId(center: Coordinate, span: number) {
  return `${center.lat.toFixed(5)},${center.lon.toFixed(5)},${span}`;
}
function readCache(key: string): MapData | undefined {
  if (cache.has(key)) return { ...cache.get(key)!, source: "cache" };
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY + key) ?? "null");
    if (
      saved &&
      Number.isFinite(saved.saved) &&
      Date.now() >= saved.saved &&
      Date.now() - saved.saved < 7 * 86400000 &&
      saved.data?.center &&
      isVietnam(saved.data.center) &&
      saved.data.span >= 300 &&
      saved.data.span <= 1800 &&
      Array.isArray(saved.data.features) &&
      saved.data.features.length < 50000 &&
      saved.data.features.every(
        (f: MapFeature) =>
          f &&
          ["building", "road", "water", "park", "tree"].includes(f.kind) &&
          Array.isArray(f.points) &&
          f.points.length > 0 &&
          validPoints(f.points).length === f.points.length &&
          Array.isArray(f.holes) &&
          f.holes.every(
            (r) => Array.isArray(r) && validPoints(r).length === r.length,
          ) &&
          f.tags &&
          typeof f.tags === "object" &&
          (saved.data.provider !== "vector" ||
            f.kind !== "water" ||
            f.tags.natural !== "water" ||
            typeof f.tags.water === "string"),
      )
    )
      return { ...saved.data, source: "cache" };
  } catch {
    /* A full or disabled cache must not prevent loading. */
  }
}
function remember(key: string, data: MapData) {
  cache.set(key, data);
  if (cache.size > 8) cache.delete(cache.keys().next().value!);
  try {
    const entries = Object.keys(localStorage).filter((k) =>
      k.startsWith(CACHE_KEY),
    );
    if (entries.length >= 5) localStorage.removeItem(entries[0]);
    localStorage.setItem(
      CACHE_KEY + key,
      JSON.stringify({ saved: Date.now(), data }),
    );
  } catch {
    /* Large scenes still remain in memory for this session. */
  }
}
export async function loadMap(
  center: Coordinate,
  span: number,
  preset: Place | undefined,
  signal: AbortSignal,
): Promise<MapData> {
  if (!isVietnam(center) || !Number.isFinite(span) || span < 300 || span > 1800)
    throw new Error("Hãy chọn tọa độ Việt Nam và phạm vi từ 300 đến 1.800 m.");
  const key = cacheId(center, span),
    cached = readCache(key);
  if (cached) return cached;
  if (
    preset?.snapshot &&
    Math.abs(center.lat - preset.lat) < 0.00001 &&
    Math.abs(center.lon - preset.lon) < 0.00001 &&
    span <= preset.span
  ) {
    const response = await fetch(`/data/${preset.id}.json`, { signal });
    if (response.ok) {
      const payload = await response.json();
      const data: MapData = {
        center,
        span,
        features: parseMap(payload),
        timestamp: payload.timestamp,
        source: "snapshot",
      };
      remember(key, data);
      return data;
    }
  }
  try {
    const { loadVectorMap } = await import("./vector");
    const data = await loadVectorMap(center, span, signal);
    remember(key, data);
    return data;
  } catch {
    signal.throwIfAborted();
  }
  const box = bounds(center, span).join(",");
  const query = `[out:json][timeout:25];(way["building"](${box});way["building:part"](${box});relation["building:part"](${box});way["highway"](${box});way["waterway"](${box});nwr["natural"~"^(water|wood|tree)$"](${box});way["landuse"~"^(grass|forest|recreation_ground|meadow)$"](${box});way["leisure"~"^(park|garden)$"](${box});relation["building"](${box}););out geom;`;
  for (const endpoint of [
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  ]) {
    signal.throwIfAborted();
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(32000)]),
      });
      if (!response.ok) throw new Error("Máy chủ bản đồ đang bận.");
      const payload = await response.json();
      const data: MapData = {
        center,
        span,
        features: parseMap(payload),
        timestamp: payload.osm3s?.timestamp_osm_base,
        source: "live",
      };
      remember(key, data);
      return data;
    } catch {
      signal.throwIfAborted();
    }
  }
  throw new Error(
    "Chưa tải được khu vực này. Thử phạm vi nhỏ hơn hoặc chọn một địa điểm có sẵn.",
  );
}

let lastSearch = 0;
const searchCache = new Map<string, Place[]>();
export async function searchPlaces(
  query: string,
  signal: AbortSignal,
): Promise<Place[]> {
  const coordinate = parseCoordinate(query);
  if (coordinate)
    return [
      {
        ...coordinate,
        id: "custom",
        name: "Tọa độ của bạn",
        city: "Việt Nam",
        region: "Trung",
        span: 800,
        description: `${coordinate.lat.toFixed(5)}, ${coordinate.lon.toFixed(5)}`,
        category: "Tọa độ",
      },
    ];
  const q = query.trim();
  if (/^https?:\/\//i.test(q))
    throw new Error(
      "Hãy dùng link bản đồ đầy đủ có tọa độ, hoặc nhập tên địa điểm. Link rút gọn chưa được hỗ trợ.",
    );
  if (q.length < 2 || q.length > 180)
    throw new Error(
      "Nhập tên địa điểm hoặc hai số tọa độ, ví dụ 21.0287, 105.8521.",
    );
  if (searchCache.has(q)) return searchCache.get(q)!;
  if (Date.now() - lastSearch < 1200)
    throw new Error("Đợi một chút rồi tìm lại nhé.");
  lastSearch = Date.now();
  const url = new URL("https://photon.komoot.io/api/");
  url.search = new URLSearchParams({
    q: q + ", Vietnam",
    limit: "8",
    bbox: "102,6,117.5,23.6",
  }).toString();
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  });
  if (!response.ok)
    throw new Error("Tìm kiếm đang bận. Bạn vẫn có thể nhập tọa độ.");
  const data = await response.json();
  const result: Place[] = [];
  for (const f of Array.isArray(data.features) ? data.features : []) {
    const c = f?.geometry?.coordinates,
      p = f?.properties;
    if (
      !Array.isArray(c) ||
      !p ||
      !isVietnam({ lat: c[1], lon: c[0] }) ||
      (p.countrycode &&
        String(p.countrycode).toUpperCase() !== "VN" &&
        !isOffshore({ lat: c[1], lon: c[0] }))
    )
      continue;
    result.push({
      id: `search-${p.osm_id}`,
      name: String(p.name || p.street || q).slice(0, 140),
      city: String(p.city || p.county || p.state || "Việt Nam"),
      lat: c[1],
      lon: c[0],
      span: 800,
      region: c[1] > 19 ? "Bắc" : c[1] > 14 ? "Trung" : "Nam",
      category: "Địa điểm",
      description: [p.district, p.city, p.state].filter(Boolean).join(", "),
    });
  }
  searchCache.set(q, result);
  return result;
}
