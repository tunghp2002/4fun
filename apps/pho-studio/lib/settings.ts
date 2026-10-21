import { INITIAL_SETTINGS, type SceneSettings } from "./types";

export function normalizeSettings(value: unknown): SceneSettings {
  const settings = { ...INITIAL_SETTINGS };
  const input =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  if (
    input.style === "paper" ||
    input.style === "clay" ||
    input.style === "ink"
  )
    settings.style = input.style;
  for (const key of [
    "buildings",
    "roads",
    "trees",
    "water",
    "terrain",
    "shadows",
    "grid",
  ] as const)
    if (typeof input[key] === "boolean") settings[key] = input[key];
  if (typeof input.hour === "number" && Number.isFinite(input.hour))
    settings.hour = Math.round(Math.max(6, Math.min(18, input.hour)) * 4) / 4;
  if (typeof input.outlines === "number" && Number.isFinite(input.outlines))
    settings.outlines = Math.max(0, Math.min(1, input.outlines));
  if (
    typeof input.heightScale === "number" &&
    Number.isFinite(input.heightScale)
  )
    settings.heightScale = Math.max(0.5, Math.min(2, input.heightScale));
  return settings;
}
