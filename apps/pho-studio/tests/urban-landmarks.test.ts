import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { makeUrbanLandmark } from "../lib/scene/landmarks/urban.ts";

const expected: Record<
  string,
  { height: [number, number]; parts: string[]; budget?: number }
> = {
  "saigon-city-hall": {
    height: [34, 37],
    parts: [
      "clock_face",
      "pavilion_hip_roof",
      "upper_arcade_arch",
      "courtyard_wings",
    ],
  },
  "saigon-opera": {
    height: [24, 27],
    parts: [
      "great_arch_frame",
      "mansard_auditorium_roof",
      "paired_portico_columns_shaft",
      "entrance_steps",
    ],
  },
  bitexco: {
    height: [262, 263],
    parts: [
      "tapered_lotus_glass_tower",
      "cantilevered_helipad",
      "horizontal_floor_bands",
    ],
  },
  "cafe-apartments": {
    height: [33, 35],
    parts: [
      "balcony_floor_slabs",
      "patchwork_awnings",
      "individual_cafe_signs",
      "balcony_greenery",
    ],
  },
  "dalat-market": {
    height: [18, 20],
    parts: [
      "rounded_market_hall",
      "rounded_white_parapet",
      "horizontal_sun_louvres",
      "market_name",
    ],
  },
  "hoa-binh-theatre": {
    height: [23, 25],
    parts: [
      "right_sign_tower",
      "continuous_marquee",
      "side_horizontal_louvres",
      "cinema_name",
    ],
  },
  "dragon-bridge": {
    height: [34, 37],
    parts: [
      "five_yellow_dragon_arch_tubes",
      "dragon_head",
      "dragon_open_mouth",
      "arch_suspenders",
      "river_piers",
    ],
    budget: 120_000,
  },
};

test("urban landmarks retain their identifying architecture with finite, bounded geometry and reusable style changes", () => {
  assert.equal(makeUrbanLandmark("unknown"), undefined);
  for (const [kind, spec] of Object.entries(expected)) {
    const asset = makeUrbanLandmark(kind)!;
    try {
      assert(asset, kind);
      const mesh = asset.root.children[0] as THREE.Mesh;
      const p = mesh.geometry.getAttribute("position"),
        n = mesh.geometry.getAttribute("normal");
      assert(p.count > 1_000, kind);
      assert(
        p.count < (spec.budget ?? 180_000),
        `${kind}: ${p.count} vertices`,
      );
      assert(Array.from(p.array).every(Number.isFinite), kind);
      assert(Array.from(n.array).every(Number.isFinite), kind);
      for (const part of spec.parts)
        assert(asset.root.userData.parts.includes(part), `${kind}: ${part}`);
      mesh.geometry.computeBoundingBox();
      const bounds = mesh.geometry.boundingBox!;
      assert(
        bounds.min.y >= -0.01,
        `${kind}: underground geometry ${bounds.min.y}`,
      );
      assert(
        bounds.max.y >= spec.height[0] && bounds.max.y <= spec.height[1],
        `${kind}: ${bounds.max.y} m`,
      );
      assert(
        bounds.max.x - bounds.min.x < asset.width * 1.08,
        `${kind}: width`,
      );
      assert(
        bounds.max.z - bounds.min.z < asset.depth * 1.08,
        `${kind}: depth`,
      );
      const colors = mesh.geometry.getAttribute("color"),
        original = Array.from(colors.array);
      asset.apply("ink", 0.8);
      assert.notDeepEqual(Array.from(colors.array), original, kind);
      asset.apply("paper", 0);
      assert.deepEqual(Array.from(colors.array), original, kind);
      assert.equal(
        (asset.root.children[1] as THREE.LineSegments).material instanceof
          THREE.LineBasicMaterial,
        true,
      );
      assert.equal(
        (
          (asset.root.children[1] as THREE.LineSegments)
            .material as THREE.LineBasicMaterial
        ).opacity,
        0,
      );
    } finally {
      asset.dispose();
    }
  }
});

test("the bridge has a traversable deck, and landmark resources are released exactly once", () => {
  const bridge = makeUrbanLandmark("dragon-bridge")!;
  const mesh = bridge.root.children[0] as THREE.Mesh;
  bridge.root.updateMatrixWorld(true);
  const hits = new THREE.Raycaster(
    new THREE.Vector3(0, 50, 9),
    new THREE.Vector3(0, -1, 0),
  ).intersectObject(mesh);
  assert(hits.length > 0);
  assert(
    Math.abs(hits[0].point.y - 8.61) < 0.05,
    "the traffic lane is on the deck, clear of dragon arches",
  );
  let releases = 0;
  for (const child of bridge.root.children) {
    const drawable = child as THREE.Mesh;
    drawable.geometry.addEventListener("dispose", () => releases++);
    (drawable.material as THREE.Material).addEventListener(
      "dispose",
      () => releases++,
    );
  }
  bridge.dispose();
  bridge.dispose();
  assert.equal(releases, 4);
  assert.equal(bridge.root.children.length, 0);
});

test("bridge approaches descend to local ground while its central traffic lanes stay elevated", () => {
  const ground = (x: number) => 3 + x * 0.002;
  const bridge = makeUrbanLandmark("dragon-bridge", ground)!;
  try {
    bridge.root.updateMatrixWorld(true);
    for (const x of [-340, 420]) {
      const hit = new THREE.Raycaster(
        new THREE.Vector3(x, 60, 9),
        new THREE.Vector3(0, -1, 0),
      )
        .intersectObject(bridge.root, true)
        .find((hit) => hit.object instanceof THREE.Mesh);
      assert(
        hit && Math.abs(hit.point.y - ground(x) - 0.3) < 0.05,
        "approach pavement must meet the sampled bank height",
      );
    }
    const center = new THREE.Raycaster(
      new THREE.Vector3(0, 60, 9),
      new THREE.Vector3(0, -1, 0),
    )
      .intersectObject(bridge.root, true)
      .find((hit) => hit.object instanceof THREE.Mesh);
    assert(center && Math.abs(center.point.y - 8.61) < 0.01);
  } finally {
    bridge.dispose();
  }
});

test("the tower facade and sloping roof have outward normals for lighting and mesh exports", () => {
  const tower = makeUrbanLandmark("bitexco")!;
  try {
    const mesh = tower.root.children[0] as THREE.Mesh;
    mesh.updateMatrixWorld(true);
    const facade = new THREE.Raycaster(
      new THREE.Vector3(100, 60.7, 5.21),
      new THREE.Vector3(-1, 0, 0),
    ).intersectObject(mesh)[0];
    assert(
      facade?.face && facade.face.normal.x > 0.8,
      "the glass wall faces the street",
    );
    const roof = new THREE.Raycaster(
      new THREE.Vector3(0.03, 400, -2.02),
      new THREE.Vector3(0, -1, 0),
    ).intersectObject(mesh)[0];
    assert(
      roof?.face && roof.face.normal.y > 0.4,
      "the sloping crown faces the sky",
    );
  } finally {
    tower.dispose();
  }
});
