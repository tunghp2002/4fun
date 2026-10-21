import type { Coordinate } from "../types";
import { project, unproject } from "../geo/coordinates";
import type { CameraState } from "./stage";

export const MAX_TRAVEL_DISTANCE = 2_500_000;

export function contextSpan(distance: number, fov: number, aspect: number) {
  const visible =
    distance * 2 * Math.tan((fov * Math.PI) / 360) * Math.max(1, aspect);
  return Math.min(
    4_000_000,
    2200 * 2 ** Math.max(0, Math.ceil(Math.log2((visible * 1.3) / 2200))),
  );
}

export function travelCenter(
  center: Coordinate,
  span: number,
  x: number,
  z: number,
) {
  return Math.max(Math.abs(x), Math.abs(z)) > span * 0.26
    ? unproject(x, z, center)
    : null;
}

export function rebaseCamera(
  state: CameraState,
  from: Coordinate,
  to: Coordinate,
  heightDelta: number,
): CameraState {
  const point = ([x, y, z]: [number, number, number]): [
    number,
    number,
    number,
  ] => {
    const [nx, nz] = project(unproject(x, z, from), to);
    return [nx, y + heightDelta, nz];
  };
  return {
    ...state,
    position: point(state.position),
    target: point(state.target),
  };
}

export function pinScale(
  distance: number,
  fov: number,
  viewportHeight: number,
) {
  // Keep the pin roughly 18 px tall, with a small physical size at street level.
  return Math.max(
    0.035,
    Math.min(
      1.6,
      (distance * 2 * Math.tan((fov * Math.PI) / 360)) /
        Math.max(1, viewportHeight),
    ),
  );
}
