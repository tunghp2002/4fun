import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { unproject, project } from "../lib/geo/coordinates.ts";
import { buildingDesign } from "../lib/geo/buildings.ts";
import { buildContext } from "../lib/scene/context.ts";
import { buildCity } from "../lib/scene/model.ts";
import { PALETTES } from "../lib/scene/architecture.ts";
import {
  INITIAL_SETTINGS,
  type MapData,
  type SceneStyle,
} from "../lib/types.ts";

const center = { lat: 16, lon: 108 },
  flat = {
    size: 2,
    heights: [0, 0, 0, 0],
    minimum: 0,
    maximum: 0,
    available: false,
  };
const house = {
  id: 36,
  kind: "building" as const,
  points: [
    [40, -20],
    [80, -20],
    [80, 20],
    [40, 20],
  ].map(([x, z]) => unproject(x, z, center)),
  holes: [],
  tags: {
    building: "yes",
    height: "10",
    "roof:shape": "gabled",
    "roof:height": "2",
  },
};

test("merged vector IDs do not turn unrelated houses into identical yellow blocks", () => {
  const designs = Array.from({ length: 80 }, (_, i) => {
    const points = [
      [0, 0],
      [8, 0],
      [8, 12],
      [0, 12],
    ].map(([x, z]) => [x + i * 15, z] as [number, number]);
    return buildingDesign(
      {
        ...house,
        id: 27852500,
        tags: {
          building: "yes",
          height: "5",
          "height:source": "vector_estimate",
        },
      },
      points,
      [],
      center,
      2026,
    );
  });
  assert.equal(new Set(designs.map((d) => d.tone)).size, 4);
  assert(new Set(designs.map((d) => d.height)).size > 40);
  assert(designs.some((d) => d.pitched) && designs.some((d) => !d.pitched));
  assert(designs.every((d) => d.estimated && d.height > 5 && d.height < 13));
});

test("a house crossing the detail boundary keeps its whole roof and is rendered once with matching far colors and windows", async () => {
  const data: MapData = {
    center,
    span: 400,
    source: "live",
    features: [house],
  };
  const near = await buildCity(
    { ...data, span: 100 },
    flat,
    2026,
    new AbortController().signal,
    () => {},
  );
  const ring = await buildContext(data, 100, 2026),
    far = await buildContext(data, 0, 2026);
  try {
    assert.equal(near.stats.buildings, 1);
    assert.equal(
      ring.root.userData.buildings,
      0,
      "the context must not duplicate or cut the boundary house",
    );
    const roofs = near.root
      .getObjectByName("buildings")!
      .children.filter(
        (o) =>
          o instanceof THREE.Mesh &&
          (o.material as THREE.MeshStandardMaterial).vertexColors,
      ) as THREE.Mesh[];
    const roof = roofs[1];
    roof.geometry.computeBoundingBox();
    assert(
      Math.abs(roof.geometry.boundingBox!.max.x - 80) < 0.001,
      "the detail square cannot amputate a roof",
    );
    assert(far.root.getObjectByName("Context_windows"));
    const mesh = far.root.getObjectByName("Context_buildings") as THREE.Mesh;
    mesh.geometry.computeBoundingBox();
    assert(
      Math.abs(
        mesh.geometry.boundingBox!.max.y - roof.geometry.boundingBox!.max.y,
      ) < 0.001,
    );
    assert(mesh.castShadow && mesh.receiveShadow);
    for (const style of ["paper", "clay", "ink"] as SceneStyle[]) {
      near.apply({ ...INITIAL_SETTINGS, style });
      far.apply({ ...INITIAL_SETTINGS, style });
      const tone = buildingDesign(
        house,
        house.points.map((p) => project(p, center)),
        [],
        center,
        2026,
      ).tone;
      const expected = new THREE.Color(
        PALETTES[style].roof[tone % PALETTES[style].roof.length],
      );
      const a = roof.geometry.getAttribute("color"),
        b = mesh.geometry.getAttribute("color");
      assert(Math.abs(a.getX(0) - expected.r) < 1e-6);
      assert(
        Array.from({ length: b.count }, (_, i) => i).some(
          (i) =>
            Math.abs(b.getX(i) - expected.r) < 1e-6 &&
            Math.abs(b.getY(i) - expected.g) < 1e-6 &&
            Math.abs(b.getZ(i) - expected.b) < 1e-6,
        ),
      );
    }
    far.apply({ ...INITIAL_SETTINGS, buildings: false });
    assert.equal(far.root.getObjectByName("Context_windows")!.visible, false);
  } finally {
    near.dispose();
    ring.dispose();
    far.dispose();
  }
});

test("heritage roof decisions follow the building's location through recentering", () => {
  const origin = { lat: 15.8773, lon: 108.3284 },
    moved = { lat: 16, lon: 108.5 };
  const feature = {
    ...house,
    id: 1,
    tags: { building: "yes", height: "8" },
    points: [
      [0, 0],
      [10, 0],
      [10, 15],
      [0, 15],
    ].map(([x, z]) => unproject(x, z, origin)),
  };
  const a = buildingDesign(
    feature,
    feature.points.map((p) => project(p, origin)),
    [],
    origin,
    2026,
  );
  const b = buildingDesign(
    feature,
    feature.points.map((p) => project(p, moved)),
    [],
    moved,
    2026,
  );
  assert(a.pitched && b.pitched);
  assert.deepEqual(a, b);
});

test("large contexts keep all mapped houses across the map and cancel unfinished generation", async () => {
  const data: MapData = {
    center,
    span: 1200,
    source: "live",
    features: Array.from({ length: 6601 }, (_, id) => ({
      ...house,
      id,
      tags: { building: "yes", height: "6", "roof:shape": "flat" },
      points: [
        [0, 0],
        [5, 0],
        [5, 5],
        [0, 5],
      ].map(([x, z]) =>
        unproject(
          -550 + (id % 100) * 11 + x,
          -500 + Math.floor(id / 100) * 11 + z,
          center,
        ),
      ),
    })),
  };
  const context = await buildContext(data, 0, 2026);
  try {
    assert.equal(context.root.userData.buildings, 6601);
    context.root.updateMatrixWorld(true);
    const last = data.features.at(-1)!.points.map((p) => project(p, center));
    const x = (last[0][0] + last[2][0]) / 2,
      z = (last[0][1] + last[2][1]) / 2;
    assert(
      new THREE.Raycaster(
        new THREE.Vector3(x, 50, z),
        new THREE.Vector3(0, -1, 0),
      )
        .intersectObject(context.root, true)
        .some((hit) => hit.object.name === "Context_buildings"),
      "the final map block cannot disappear at the old building cap",
    );
  } finally {
    context.dispose();
  }
  const controller = new AbortController();
  const pending = buildContext(data, 0, 2026, () => 0, [], controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});
