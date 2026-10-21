import { Vector3 } from "three";

export function cameraFrame(
  span: number,
  aspect: number,
  fov: number,
  elevation: number,
  overview: boolean,
  skyline: number,
) {
  const halfAngle = Math.atan(
    Math.tan((fov * Math.PI) / 360) * Math.min(1, aspect),
  );
  const distance =
    (span * (overview ? 0.76 : skyline > span * 0.15 ? 0.3 : 0.21)) /
    Math.sin(halfAngle);
  const target = new Vector3(
    0,
    elevation * 0.35 + Math.min(span * 0.14, skyline * 0.2) + 8,
    0,
  );
  const direction = overview
    ? new Vector3(0.62, 0.64, 0.72)
    : new Vector3(0.73, 0.6, 0.9);
  return {
    target,
    position: direction.normalize().multiplyScalar(distance).add(target),
  };
}

// Keep centimeter-scale surface layers distinct at city-view distances.
export function cameraNear(altitude: number) {
  return Math.max(
    0.12,
    Math.min(altitude > 10000 ? 20000 : 20, altitude * 0.02),
  );
}
