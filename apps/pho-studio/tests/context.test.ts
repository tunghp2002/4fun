import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { buildContext } from "../lib/scene/context.ts";
import { unproject, contains, type Point } from "../lib/geo/coordinates.ts";
import { INITIAL_SETTINGS } from "../lib/types.ts";
const center = { lat: 16, lon: 108 },
  p = (x: number, z: number) => unproject(x, z, center);
test("distant context leaves the detailed area empty and preserves water islands", async () => {
  const hole: Point[] = [
    [90, 90],
    [140, 90],
    [140, 140],
    [90, 140],
    [90, 90],
  ];
  const context = await buildContext(
    {
      center,
      span: 400,
      source: "live",
      features: [
        {
          id: 1,
          kind: "water",
          points: [
            p(-180, -180),
            p(180, -180),
            p(180, 180),
            p(-180, 180),
            p(-180, -180),
          ],
          holes: [hole.map(([x, z]) => p(x, z))],
          tags: { natural: "water" },
        },
        {
          id: 2,
          kind: "building",
          points: [p(60, -30), p(80, -30), p(80, 30), p(60, 30), p(60, -30)],
          holes: [],
          tags: { building: "yes", height: "10" },
        },
      ],
    },
    100,
    2026,
    (x, z) => x * 0.01 + z * 0.005,
  );
  try {
    context.apply(INITIAL_SETTINGS);
    context.root.traverse((o) => {
      if (o instanceof THREE.Mesh && !(o instanceof THREE.InstancedMesh)) {
        const points = o.geometry.getAttribute("position");
        assert(Array.from(points.array).every(Number.isFinite));
        for (let i = 0; i < (o.geometry.index?.count ?? points.count); i += 3) {
          const a: number = o.geometry.index?.getX(i) ?? i,
            b: number = o.geometry.index?.getX(i + 1) ?? i + 1,
            c: number = o.geometry.index?.getX(i + 2) ?? i + 2;
          const x: number =
              (points.getX(a) + points.getX(b) + points.getX(c)) / 3,
            z: number = (points.getZ(a) + points.getZ(b) + points.getZ(c)) / 3;
          assert(
            Math.abs(x) >= 49.999 || Math.abs(z) >= 49.999,
            "no context triangle may cover the detailed square",
          );
          if (o.name === "Context_water")
            assert(!contains(hole, x, z), "water holes remain dry");
        }
      }
    });
    context.apply({
      ...INITIAL_SETTINGS,
      style: "ink",
      buildings: false,
      heightScale: 1.5,
    });
    assert.equal(
      context.root.getObjectByName("Context_buildings")!.visible,
      false,
    );
    assert.equal(context.root.scale.y, 1.5);
  } finally {
    context.dispose();
    context.dispose();
  }
  assert.equal(context.root.children.length, 0);
});
