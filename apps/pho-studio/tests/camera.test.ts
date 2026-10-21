import assert from "node:assert/strict";
import { test } from "node:test";
import { cameraFrame, cameraNear } from "../lib/scene/camera.ts";

test("street composition stays closer than overview and fits a whole block in portrait and landscape", () => {
  for (const aspect of [0.5, 1, 1.6]) {
    const street = cameraFrame(800, aspect, 53, 20, false, 12),
      overview = cameraFrame(800, aspect, 53, 20, true, 12);
    const closeDistance = street.position.distanceTo(street.target),
      wideDistance = overview.position.distanceTo(overview.target);
    assert(closeDistance < wideDistance * 0.45);
    const halfAngle = Math.atan(
      Math.tan((53 * Math.PI) / 360) * Math.min(1, aspect),
    );
    assert(wideDistance * Math.sin(halfAngle) >= 800 * Math.SQRT1_2);
    assert(street.position.y > street.target.y);
    assert(
      [...street.position.toArray(), ...overview.position.toArray()].every(
        Number.isFinite,
      ),
    );
  }
});

test("city views retain depth precision between grass, pavement and ground without clipping the walking view", () => {
  assert.equal(cameraNear(1.7), 0.12);
  assert.equal(cameraNear(0), 0.12);
  assert.equal(cameraNear(800), 16);
  assert.equal(cameraNear(4000), 20);
  const distance = 1500,
    near = cameraNear(800),
    far = 18000;
  const depthStep =
    ((far - near) * distance * distance) / (far * near * (2 ** 24 - 1));
  assert(depthStep < 0.02, "the 12 cm grass layer remains distinct at 1.5 km");
});
