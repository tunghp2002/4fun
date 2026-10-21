import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import * as THREE from "three";
import {
  createFacadeDetails,
  estimateFacade,
  type FacadeBuilding,
} from "../lib/scene/facades.ts";

const building: FacadeBuilding = {
  id: 37,
  points: [
    [-6, -5],
    [6, -5],
    [6, 5],
    [-6, 5],
  ],
  height: 10,
  base: 2,
  pitched: false,
  tags: { shop: "bakery" },
  fronts: [0],
};

test("traditional houses retain roof tile relief and ridge caps in their exported mesh", () => {
  const details = createFacadeDetails(
    [{ ...building, pitched: true, roofRise: 3 }],
    2026,
  );
  try {
    const p = (details.root.children[0] as THREE.Mesh).geometry.getAttribute(
      "position",
    );
    let roofVertices = 0;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) > building.base + building.height + 1) roofVertices++;
    }
    assert(
      roofVertices > 200,
      "tiles and ridge caps must be solid geometry above the eave",
    );
    assert.equal(details.root.userData.drawCalls, 2);
  } finally {
    details.dispose();
  }
});

test("solid facades face outward for either footprint winding and retain geometry and colors in every style", () => {
  for (const reverse of [false, true]) {
    const details = createFacadeDetails(
      [
        {
          ...building,
          points: reverse ? [...building.points].reverse() : building.points,
          fronts: reverse ? [2] : [0],
        },
      ],
      2026,
    );
    try {
      assert.equal(details.root.children.length, 2);
      const mesh = details.root.children[0] as THREE.Mesh;
      const geometry = mesh.geometry;
      const p = geometry.getAttribute("position"),
        n = geometry.getAttribute("normal"),
        colors = geometry.getAttribute("color");
      assert(p.count > 10_000);
      assert(Array.from(p.array).every(Number.isFinite));
      assert(Array.from(n.array).every(Number.isFinite));
      const a = new THREE.Vector3(),
        b = new THREE.Vector3(),
        c = new THREE.Vector3(),
        normal = new THREE.Vector3();
      for (let vertex = 0; vertex < p.count; vertex += 3) {
        a.fromBufferAttribute(p, vertex);
        b.fromBufferAttribute(p, vertex + 1).sub(a);
        c.fromBufferAttribute(p, vertex + 2).sub(a);
        normal.fromBufferAttribute(n, vertex);
        assert(b.cross(c).dot(normal) > 0, `backwards triangle at ${vertex}`);
      }
      mesh.updateMatrixWorld(true);
      const hits = new THREE.Raycaster(
        new THREE.Vector3(-3, 3.5, -20),
        new THREE.Vector3(0, 0, 1),
      ).intersectObject(mesh);
      assert(
        hits.length > 0,
        "the street-facing storefront must be visible from the street",
      );
      assert(
        hits[0].point.z < -5,
        "shop windows sit in front of the original building wall",
      );
      const original = Array.from(colors.array);
      details.apply("ink", 0);
      assert.notDeepEqual(Array.from(colors.array), original);
      assert.equal(
        (
          (details.root.children[1] as THREE.LineSegments)
            .material as THREE.LineBasicMaterial
        ).opacity,
        0,
      );
      details.apply("paper");
      assert.deepEqual(Array.from(colors.array), original);
      assert.equal(
        geometry,
        mesh.geometry,
        "style changes recolor the existing geometry",
      );
    } finally {
      details.dispose();
    }
  }
});

test("facades are deterministic, bounded, retain upper floors and release owned resources once", () => {
  const signature = (seed: number) => {
    const details = createFacadeDetails([building], seed);
    const geometry = (details.root.children[0] as THREE.Mesh).geometry;
    const result = createHash("sha256")
      .update(Buffer.from(geometry.getAttribute("position").array.buffer))
      .digest("hex");
    details.dispose();
    return result;
  };
  assert.equal(signature(2026), signature(2026));
  assert.notEqual(signature(2026), signature(19));
  const tall = { ...building, height: 100, pitched: true };
  assert(estimateFacade(tall) > estimateFacade(building));
  const details = createFacadeDetails(
    Array.from({ length: 150 }, (_, id) => ({ ...tall, id })),
    20,
  );
  const mesh = details.root.children[0] as THREE.Mesh;
  const p = mesh.geometry.getAttribute("position");
  assert(
    p.count <= 700_000,
    "close architecture must respect its geometry budget",
  );
  assert(
    Array.from(p.array).some(
      (value, i) => i % 3 === 1 && value > 80 && value < 95,
    ),
    "high buildings retain upper-storey windows",
  );
  let released = 0;
  for (const child of details.root.children) {
    const object = child as THREE.Mesh;
    object.geometry.addEventListener("dispose", () => released++);
    (object.material as THREE.Material).addEventListener(
      "dispose",
      () => released++,
    );
  }
  details.dispose();
  details.dispose();
  assert.equal(released, 4);
  assert.equal(details.root.children.length, 0);
});
