import catalog from "./scene/landmarks/catalog.json";
import type { Place } from "./types";

// Editorial discovery order, not an official popularity ranking.
export const LANDMARK_CATALOG = catalog
  .filter((entry) => !entry.hidden)
  .sort((a, b) => a.priority - b.priority);
export const LANDMARK_PLACES: Place[] = LANDMARK_CATALOG.map((entry) => ({
  id: `landmark:${entry.id}`,
  name: entry.name,
  lat: entry.lat,
  lon: entry.lon,
  city: entry.locality,
  province: entry.province,
  region: entry.region as Place["region"],
  span: entry.span,
  category: entry.category ?? "Kiến trúc",
  aliases: entry.aliases,
  description:
    entry.description ??
    (entry.approximateAnchor
      ? "Kiến trúc minh họa · Vị trí tham khảo."
      : "Minh họa kiến trúc theo vị trí bản đồ."),
}));
