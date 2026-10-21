import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { makeHeritageLandmark } from "../lib/scene/landmarks/heritage.ts";

const models = [
  ["ngo-mon", 58, 28, "side_vaulted_passage", "central_upper_yellow_glazed_roof"],
  ["thai-hoa", 47, 41, "front_interlocked_yellow_tile_roof", "rear_interlocked_yellow_tile_roof"],
  ["hien-lam", 15, 15, "tier_0_open_red_arcade_column", "tier_2_curved_tile_roof"],
  ["phu-van-lau", 12.23, 12.23, "open_ground_storey_column", "upper_round_side_window_wall"],
  ["ky-dai", 50, 50, "bastion_terrace_2", "Vietnam_gold_star"],
  ["imperial-gate", 17, 3.2, "central_open_arch", "main_gate_upper_roof"],
  ["imperial-temple", 30, 38, "courtyard_paving", "ancestral_hall_yellow_roof"],
  ["japanese-bridge", 18, 7, "stone_bridge_pier", "north_temple_shrine_roof"],
  ["assembly-hall", 22, 31, "central_ceremonial_gate", "assembly_hall_ceramic_dragon_roof"],
  ["ancient-house", 7, 27, "courtyard_side_veranda_column", "yin_yang_tile_house_roof"],
] as const;

test("all heritage assets keep distinctive architecture, finite portable geometry and bounded detail", () => {
  for (const [kind, width, depth, ...parts] of models) {
    const asset = makeHeritageLandmark(kind)!;
    try {
      assert.equal(asset.width, width, kind);
      assert.equal(asset.depth, depth, kind);
      assert(asset.height > 5 && asset.height < 55, kind);
      assert.equal(asset.root.userData.illustrative, true);
      for (const part of parts) assert(asset.root.userData.parts.includes(part), `${kind}: ${part}`);
      const architecture = asset.root.children.find(o => o instanceof THREE.Mesh) as THREE.Mesh;
      const positions = architecture.geometry.getAttribute("position");
      assert(positions.count > 500 && positions.count < 160_000, `${kind}: ${positions.count} vertices`);
      for (const value of positions.array) assert(Number.isFinite(value), kind);
      const bounds = new THREE.Box3().setFromObject(asset.root);
      assert(bounds.min.y >= -.02, `${kind} below ground: ${bounds.min.y}`);
      const colors = architecture.geometry.getAttribute("color");
      asset.apply("ink", .8);
      for (let i = 0; i < colors.count; i++) assert(Math.abs(colors.getX(i) - colors.getY(i)) < 1e-6, kind);
      asset.apply("paper", .5);
      assert(Array.from(colors.array).some((value, i, all) => i % 3 === 0 && value !== all[i + 1]), `${kind} regained color`);
      const contours = asset.root.children.find(o => o instanceof THREE.LineSegments) as THREE.LineSegments;
      assert.equal((contours.material as THREE.LineBasicMaterial).opacity, .36);
    } finally {
      asset.dispose();
      asset.dispose();
      assert.equal(asset.root.children.length, 0);
    }
  }
  assert.equal(makeHeritageLandmark("unknown-kind"), undefined);
});

test("Ngo Mon's three axial gates are actual open tunnels and its side passages cross the U wings", () => {
  const asset = makeHeritageLandmark("ngo-mon")!;
  try {
    asset.root.updateMatrixWorld(true);
    const mesh = asset.root.children[0];
    for (const x of [-8, 0, 8]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(x, 2, 18), new THREE.Vector3(0, 0, -1), 0, 40);
      assert.equal(ray.intersectObject(mesh).length, 0, `axial passage x=${x}`);
    }
    const pier = new THREE.Raycaster(new THREE.Vector3(4, 2, 18), new THREE.Vector3(0, 0, -1), 0, 40);
    assert(pier.intersectObject(mesh).length > 0, "stone between passages remains solid");
    for (const side of [-1, 1]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(side * 35, 2, 2), new THREE.Vector3(-side, 0, 0), 0, 14);
      assert.equal(ray.intersectObject(mesh).length, 0, `side passage ${side}`);
    }
  } finally { asset.dispose(); }
});

test("Hien Lam has three separated roof eaves and the timber house leaves its inner courtyard open", () => {
  const pavilion = makeHeritageLandmark("hien-lam")!;
  const house = makeHeritageLandmark("ancient-house")!;
  try {
    const roofs = pavilion.root.userData.parts.filter((part: string) => /^tier_\d_curved_tile_roof$/.test(part));
    assert.equal(roofs.length, 3);
    house.root.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 20, 0), new THREE.Vector3(0, -1, 0));
    const hits = ray.intersectObject(house.root.children[0]);
    assert(hits.length > 0);
    assert(hits[0].point.y < .4, "courtyard stays open to the sky rather than a generic roof block");
  } finally { pavilion.dispose(); house.dispose(); }
});


test("Phu Van Lau keeps an open ground storey, two roofs and actual circular side windows", () => {
  const asset = makeHeritageLandmark("phu-van-lau")!;
  try {
    assert(asset.height > 10.7 && asset.height < 11.1);
    assert.equal(asset.root.userData.parts.filter((part: string) => /^(lower|upper)_yellow_curved_pavilion_roof$/.test(part)).length, 2);
    asset.root.updateMatrixWorld(true);
    const mesh = asset.root.children[0];
    const ground = new THREE.Raycaster(new THREE.Vector3(0, 3.5, 15), new THREE.Vector3(0, 0, -1));
    assert.equal(ground.intersectObject(mesh).length, 0, "lower pavilion stays open through its center");
    const roundWindow = new THREE.Raycaster(new THREE.Vector3(3, 7.42, 0), new THREE.Vector3(-1, 0, 0), 0, 6);
    assert.equal(roundWindow.intersectObject(mesh).length, 0, "circular windows are open through both upper side walls");
    const panel = new THREE.Raycaster(new THREE.Vector3(3, 8.1, 0), new THREE.Vector3(-1, 0, 0), 0, 6);
    assert(panel.intersectObject(mesh).length > 0, "solid timber remains above the round window");
  } finally { asset.dispose(); }
});
