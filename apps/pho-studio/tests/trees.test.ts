import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { createTrees } from "../lib/scene/trees.ts";
import { disposeObject } from "../lib/scene/model.ts";
import { mappedTrees } from "../lib/scene/vegetation.ts";
import { unproject, contains, type Point } from "../lib/geo/coordinates.ts";
import type { MapData, Tags } from "../lib/types.ts";

test("mapped forests form dense, deterministic canopies without filling holes, water, buildings or roads", async () => {
  const center = { lat: 14.342927, lon: 108.246363 };
  const ring = (x0: number, z0: number, x1: number, z1: number) =>
    [
      [x0, z0],
      [x1, z0],
      [x1, z1],
      [x0, z1],
    ].map(([x, z]) => unproject(x, z, center));
  const data: MapData = {
    center,
    span: 400,
    source: "live",
    features: [
      {
        id: 1,
        kind: "park",
        points: ring(-190, -190, 190, 190),
        holes: [ring(80, 80, 160, 160)],
        tags: { natural: "wood" },
      },
      {
        id: 2,
        kind: "water",
        points: ring(-70, -60, -20, 60),
        holes: [],
        tags: { natural: "water" },
      },
      {
        id: 3,
        kind: "building",
        points: ring(20, -60, 70, 60),
        holes: [],
        tags: { building: "yes" },
      },
      {
        id: 4,
        kind: "road",
        points: [unproject(-190, 0, center), unproject(190, 0, center)],
        holes: [],
        tags: { highway: "residential", width: "8" },
      },
    ],
  };
  const forest = await mappedTrees(data, 2026),
    park = await mappedTrees(
      {
        ...data,
        features: [{ ...data.features[0], tags: { leisure: "park" } }],
      },
      2026,
    );
  assert(
    forest.length > park.length * 3,
    "woods must be substantially denser than urban parks",
  );
  assert(forest.length > 1400);
  assert.deepEqual(await mappedTrees(data, 2026), forest);
  for (const tree of forest) {
    assert(Math.abs(tree.z) >= 6);
    for (const f of data.features.slice(1, 3))
      assert(
        !contains(
          f.points.map(
            (p) =>
              [
                (p.lon - center.lon) *
                  111320 *
                  Math.cos((center.lat * Math.PI) / 180),
                (center.lat - p.lat) * 111320,
              ] as Point,
          ),
          tree.x,
          tree.z,
        ),
      );
    assert(!(tree.x > 80 && tree.x < 160 && tree.z > 80 && tree.z < 160));
  }
  const far = await mappedTrees(data, 2026, 200);
  assert(far.every((t) => Math.max(Math.abs(t.x), Math.abs(t.z)) >= 100));
  assert.deepEqual(
    await mappedTrees({ ...data, features: [] }, 2026),
    [],
    "unmapped regions must not acquire invented forests",
  );
  const wooded = {
    ...data,
    span: 1200,
    features: [
      {
        ...data.features[0],
        points: ring(-1100, -1100, 1100, 1100),
        holes: [],
      },
    ],
  };
  const nearCrowns = await mappedTrees(wooded, 2026);
  const farCrowns = await mappedTrees({ ...wooded, span: 2200 }, 2026, 1200);
  const mean = (values: typeof nearCrowns) =>
    values.reduce((sum, t) => sum + t.radius, 0) / values.length;
  const nearEdge = nearCrowns.filter(
    (t) => Math.max(Math.abs(t.x), Math.abs(t.z)) > 550,
  );
  const farEdge = farCrowns.filter(
    (t) => Math.max(Math.abs(t.x), Math.abs(t.z)) < 650,
  );
  assert(
    mean(farEdge) / mean(nearEdge) < 1.15,
    "far crowns must not suddenly double in size across the detail boundary",
  );
  const controller = new AbortController();
  const pending = mappedTrees(
    { ...wooded, span: 8800 },
    2026,
    300,
    controller.signal,
  );
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  for (const span of [1800, 4400, 8800]) {
    const large = await mappedTrees(
      {
        ...data,
        span,
        features: [
          {
            ...data.features[0],
            points: ring(-span / 2, -span / 2, span / 2, span / 2),
            holes: [],
          },
        ],
      },
      2026,
    );
    assert(large.length > 8000 && large.length <= 9216);
    for (const [sx, sz] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ])
      assert(
        large.filter((t) => t.x * sx > 0 && t.z * sz > 0).length > 1900,
        "the tree budget cannot truncate one side of a forest",
      );
  }
});

test("foliage follows the camera within its budget, preserves every tree and exports non-singular transforms", () => {
  const trees = Array.from({ length: 180 }, (_, i) => ({
    x: (i % 15) * 7,
    z: Math.floor(i / 15) * 7,
    h: 9,
    radius: 3,
    tone: i % 3,
    conifer: i % 5 === 0,
  }));
  trees.push({ x: 1000, z: 1000, h: 12, radius: 4, tone: 1, conifer: false });
  const vegetation = createTrees(trees, () => 5, 2026);
  try {
    const near = vegetation.root.getObjectByName(
      "La_can_canh",
    ) as THREE.InstancedMesh;
    const far = vegetation.root.getObjectByName(
      "Tan_la_xa",
    ) as THREE.InstancedMesh;
    const bark = vegetation.root.getObjectByName(
      "Than_va_canh",
    ) as THREE.InstancedMesh;
    vegetation.apply(
      {
        foliage: ["#476b51", "#68835b", "#7a8e61"],
        trunk: "#9b8063",
        edge: "#353d32",
      },
      0.55,
    );
    assert.equal(near.count, 960);
    assert.equal(near.count / 10 + far.count, trees.length);
    assert.equal(bark.count, trees.length * 5);
    assert.equal(vegetation.detail(new THREE.Vector3(0, 0, 0)), false);
    assert.equal(vegetation.detail(new THREE.Vector3(1000, 15, 1000)), true);
    assert.equal(near.count, 10);
    assert.equal(near.count / 10 + far.count, trees.length);
    const matrix = new THREE.Matrix4();
    for (const mesh of [near, far, bark]) {
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, matrix);
        assert(matrix.elements.every(Number.isFinite));
        assert(
          matrix.determinant() > 0,
          "model exports cannot contain collapsed LOD instances",
        );
      }
      assert(
        Array.from(mesh.geometry.getAttribute("position").array).every(
          Number.isFinite,
        ),
      );
    }
    assert(near.instanceColor && far.instanceColor);
    const original = near.instanceColor.getX(0);
    vegetation.apply(
      { foliage: ["#eeeedd"], trunk: "#777766", edge: "#222211" },
      0,
    );
    assert.notEqual(near.instanceColor.getX(0), original);
    assert.equal(
      vegetation.root.children.filter((o) => o.userData.screenOnly && o.visible)
        .length,
      0,
    );
    vegetation.detail(new THREE.Vector3(-1000, 0, -1000));
    assert.equal(near.count, 0);
    assert.equal(near.visible, false);
    assert.equal(far.count, trees.length);
  } finally {
    disposeObject(vegetation.root);
  }
});
