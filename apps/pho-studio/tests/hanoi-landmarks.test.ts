import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { makeHanoiLandmark } from "../lib/scene/landmarks/hanoi.ts";

const kinds = [
  "turtle-tower",
  "ngoc-son",
  "tran-ba",
  "the-huc",
  "pen-tower",
  "inkstone",
  "dac-nguyet",
  "hoa-phong",
  "ba-kieu",
  "st-joseph",
];

test("Hanoi landmarks retain distinct bounded architecture, deterministic geometry, theme changes and resource cleanup", () => {
  const signatures = new Set<string>();
  for (const kind of kinds) {
    const asset = makeHanoiLandmark(kind)!,
      second = makeHanoiLandmark(kind)!;
    assert(asset.root.userData.parts.length > 12, kind);
    const mesh = asset.root.children.find(
      (object) => object instanceof THREE.Mesh,
    ) as THREE.Mesh;
    const other = second.root.children.find(
      (object) => object instanceof THREE.Mesh,
    ) as THREE.Mesh;
    const positions = mesh.geometry.getAttribute("position"),
      colors = mesh.geometry.getAttribute("color");
    assert(
      positions.count > 500 && positions.count < 100_000,
      `${kind}: ${positions.count} vertices`,
    );
    assert(Array.from(positions.array).every(Number.isFinite), kind);
    assert.deepEqual(
      positions.array,
      other.geometry.getAttribute("position").array,
      kind,
    );
    const bounds = new THREE.Box3().setFromObject(asset.root),
      dimensions = bounds.getSize(new THREE.Vector3());
    assert(bounds.min.y >= -0.15, `${kind} sits above its local ground`);
    assert(dimensions.x > 1 && dimensions.z > 1 && dimensions.y > 3, kind);
    signatures.add(
      `${Math.round(dimensions.x * 10)},${Math.round(dimensions.y * 10)},${Math.round(dimensions.z * 10)}`,
    );
    const originalColors = Array.from(colors.array);
    asset.apply("ink", 0.7);
    for (let i = 0; i < colors.count; i += 100)
      assert(Math.abs(colors.getX(i) - colors.getY(i)) < 1e-6);
    asset.apply("clay", 0.2);
    assert.notDeepEqual(Array.from(colors.array), originalColors, kind);
    asset.apply("paper", 0.5);
    assert.deepEqual(Array.from(colors.array), originalColors, kind);
    let disposed = 0;
    mesh.geometry.addEventListener("dispose", () => disposed++);
    asset.dispose();
    asset.dispose();
    second.dispose();
    assert.equal(disposed, 1, kind);
    assert.equal(asset.root.children.length, 0, kind);
  }
  assert.equal(signatures.size, kinds.length);
  assert.equal(makeHanoiLandmark("ordinary-row-house"), undefined);
});

test("Turtle Tower has open lower arches and its characteristic shrinking tiers rather than a solid extruded block", () => {
  const asset = makeHanoiLandmark("turtle-tower")!;
  try {
    assert.equal(asset.width, 6.28);
    assert.equal(asset.depth, 4.54);
    assert(asset.height > 8.5 && asset.height < 9.1);
    asset.root.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(
      new THREE.Vector3(0, 1.5, 10),
      new THREE.Vector3(0, 0, -1),
    );
    const open = ray
      .intersectObject(asset.root, true)
      .filter((hit) => hit.object instanceof THREE.Mesh);
    assert.equal(
      open.length,
      0,
      "central ground-floor opening is transparent all the way through",
    );
    ray.set(new THREE.Vector3(1.05, 1.5, 10), new THREE.Vector3(0, 0, -1));
    assert(
      ray
        .intersectObject(asset.root, true)
        .some((hit) => hit.object instanceof THREE.Mesh),
      "stone piers remain between the openings",
    );
    ray.set(new THREE.Vector3(0, 6.83, 10), new THREE.Vector3(0, 0, -1));
    const upper = ray
      .intersectObject(asset.root, true)
      .filter((hit) => hit.object instanceof THREE.Mesh);
    assert(
      upper.length > 0 && upper[0].point.z < 0,
      "top circular window opens into the pavilion",
    );
  } finally {
    asset.dispose();
  }
});

test("The Huc bridge has a rising walkable timber deck and sixteen pairs of supports", () => {
  const asset = makeHanoiLandmark("the-huc")!;
  try {
    assert.equal(asset.depth, 45);
    assert.equal(
      asset.root.userData.parts.filter((name: string) =>
        name.startsWith("paired_bridge_support_"),
      ).length,
      32,
    );
    asset.root.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(
      new THREE.Vector3(0, 10, 0.25),
      new THREE.Vector3(0, -1, 0),
    );
    const middle = ray
      .intersectObject(asset.root, true)
      .filter((hit) => hit.object instanceof THREE.Mesh)[0];
    ray.set(new THREE.Vector3(0, 10, 21.25), new THREE.Vector3(0, -1, 0));
    const end = ray
      .intersectObject(asset.root, true)
      .filter((hit) => hit.object instanceof THREE.Mesh)[0];
    assert(middle && end && middle.point.y - end.point.y > 1.2);
    assert(middle.point.y < 3, "deck remains at pedestrian scale");
  } finally {
    asset.dispose();
  }
});

test("the cathedral nave roof reaches the front facade without an uncovered strip between the bell towers", () => {
  const asset = makeHanoiLandmark("st-joseph")!;
  try {
    asset.root.updateMatrixWorld(true);
    for (const x of [-5, 0, 5]) {
      const roofY = 19.7 + 7.5 * (1 - Math.abs(x) / 12.8);
      for (const z of [21, 23, 25, 26.3]) {
        const hit = new THREE.Raycaster(
          new THREE.Vector3(x, 50, z),
          new THREE.Vector3(0, -1, 0),
        )
          .intersectObject(asset.root, true)
          .find((hit) => hit.object instanceof THREE.Mesh);
        assert(
          hit && Math.abs(hit.point.y - roofY) < 0.01,
          `roof must close the nave at x=${x}, z=${z}; found y=${hit?.point.y}`,
        );
      }
    }
  } finally {
    asset.dispose();
  }
});
