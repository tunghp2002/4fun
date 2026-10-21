import type { Place, SceneSettings } from "./types";
import { normalizeSettings } from "./settings";
import { isVietnam } from "./geo/coordinates";
import type { CameraState } from "./scene/stage";
export interface SavedScene {
  id: string;
  place: Place;
  span: number;
  seed: number;
  settings: SceneSettings;
  camera?: CameraState;
}
export function readSaved(): SavedScene[] {
  try {
    const data = JSON.parse(localStorage.getItem("pho-scenes-v1") ?? "[]");
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (p) =>
          p &&
          typeof p.id === "string" &&
          p.place &&
          typeof p.place.name === "string" &&
          typeof p.place.id === "string" &&
          isVietnam(p.place) &&
          p.span >= 300 &&
          p.span <= 1800 &&
          Number.isFinite(p.seed),
      )
      .slice(0, 12)
      .map((p) => {
        const settings = normalizeSettings(p.settings);
        const c = p.camera,
          valid =
            c &&
            Array.isArray(c.position) &&
            c.position.length === 3 &&
            Array.isArray(c.target) &&
            c.target.length === 3 &&
            [...c.position, ...c.target].every(
              (n) => Number.isFinite(n) && Math.abs(n) <= 5_000_000,
            ) &&
            c.focal >= 10 &&
            c.focal <= 150;
        return {
          id: p.id,
          place: p.place,
          span: p.span,
          seed: p.seed >>> 0,
          settings,
          ...(valid ? { camera: c } : {}),
        };
      });
  } catch {
    return [];
  }
}
export function saveScenes(scenes: SavedScene[]) {
  localStorage.setItem("pho-scenes-v1", JSON.stringify(scenes.slice(0, 12)));
}
