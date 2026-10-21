import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { buildCity } from "../lib/scene/model.ts";
import { INITIAL_SETTINGS, type MapData } from "../lib/types.ts";
import { unproject } from "../lib/geo/coordinates.ts";

test("a narrow diagonal building keeps the same modest roof rise as an unrotated building", async () => {
  const center = { lat: 16, lon: 108 };
  for (const [angle, measuredRoof] of [
    [0, false],
    [Math.PI / 6, false],
    [Math.PI / 6, true],
  ] as const) {
    const points = [
      [-25, -1],
      [25, -1],
      [25, 1],
      [-25, 1],
    ].map(([x, z]) =>
      unproject(
        x * Math.cos(angle) - z * Math.sin(angle),
        x * Math.sin(angle) + z * Math.cos(angle),
        center,
      ),
    );
    const city = await buildCity(
      {
        center,
        span: 160,
        source: "live",
        features: [
          {
            id: 1,
            kind: "building",
            points,
            holes: [],
            tags: {
              building: "yes",
              height: measuredRoof ? "8" : "6",
              "roof:shape": "gabled",
              ...(measuredRoof ? { "roof:height": "2" } : {}),
            },
          },
        ],
      },
      {
        size: 2,
        heights: [0, 0, 0, 0],
        minimum: 0,
        maximum: 0,
        available: false,
      },
      2026,
      new AbortController().signal,
      () => {},
    );
    try {
      const bounds = new THREE.Box3().setFromObject(
        city.root.getObjectByName("buildings")!,
      );
      assert(
        Math.abs(bounds.max.y - (measuredRoof ? 8.2 : 7)) < 0.001,
        `roof height must use its actual 2 m width, found ${bounds.max.y}`,
      );
      city.detail(new THREE.Vector3(0, 2, 20));
      const detailed = new THREE.Box3().setFromObject(
        city.root.getObjectByName("buildings")!,
      );
      assert(
        detailed.max.y > bounds.max.y && detailed.max.y < bounds.max.y + 0.3,
        "roof tiles and ridge caps must follow the corrected roof height",
      );
    } finally {
      city.dispose();
    }
  }
});

test("the Hoan Kiem water mesh stays flat at island edges while its ground remains raised", async () => {
  const center = { lat: 16, lon: 108 },
    p = (x: number, z: number) => unproject(x, z, center);
  const city = await buildCity(
    {
      center,
      span: 200,
      source: "live",
      features: [
        {
          id: 198437,
          kind: "water",
          tags: { name: "Hồ Hoàn Kiếm" },
          points: [p(-70, -70), p(70, -70), p(70, 70), p(-70, 70)],
          holes: [[p(-8, -8), p(8, -8), p(8, 8), p(-8, 8)]],
        },
      ],
    },
    {
      size: 3,
      heights: [0, 2, 6, 4, 25, 8, 7, 8, 10],
      minimum: 0,
      maximum: 25,
      available: true,
    },
    1,
    new AbortController().signal,
    () => {},
  );
  try {
    const water = city.root.getObjectByName("water")!.children[0] as THREE.Mesh;
    const positions = water.geometry.getAttribute("position");
    assert(positions.count > 0);
    for (let i = 0; i < positions.count; i++)
      assert(Math.abs(positions.getY(i) - positions.getY(0)) < 1e-6);
    assert(city.elevation(0, 0) > city.elevation(30, 30));
  } finally {
    city.dispose();
  }
});

test("build, style, hide and dispose an actual scene with finite geometry and instanced tree colors", async () => {
  const center = { lat: 16, lon: 108 },
    coordinate = (x: number, z: number) => unproject(x, z, center);
  const data: MapData = {
    center,
    span: 300,
    source: "live",
    features: [
      {
        id: 1,
        kind: "building",
        points: [
          coordinate(-15, -15),
          coordinate(15, -15),
          coordinate(15, 15),
          coordinate(-15, 15),
          coordinate(-15, -15),
        ],
        holes: [],
        tags: { building: "yes", "building:levels": "3" },
      },
      {
        id: 2,
        kind: "tree",
        points: [coordinate(50, 30)],
        holes: [],
        tags: { natural: "tree" },
      },
      {
        id: 3,
        kind: "road",
        points: [coordinate(-200, 70), coordinate(200, 70)],
        holes: [],
        tags: { highway: "residential" },
      },
    ],
  };
  const terrain = {
    size: 2,
    heights: [0, 0, 0, 0],
    minimum: 0,
    maximum: 0,
    available: true,
  };
  const city = await buildCity(
    data,
    terrain,
    2026,
    new AbortController().signal,
    () => {},
  );
  assert.equal(city.stats.buildings, 1);
  assert.equal(city.stats.estimated, 0);
  assert.equal(city.stats.trees, 1);
  city.root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const pos = object.geometry.getAttribute("position");
      assert(Array.from(pos.array).every(Number.isFinite));
      if (object instanceof THREE.InstancedMesh && object.instanceColor) {
        assert.equal(
          (object.material as THREE.MeshStandardMaterial).vertexColors,
          false,
        );
      }
    }
  });
  city.apply({
    ...INITIAL_SETTINGS,
    style: "ink",
    buildings: false,
    heightScale: 1.5,
  });
  assert.equal(city.root.getObjectByName("buildings")?.visible, false);
  assert.equal(city.root.scale.y, 1.5);
  let disposedInstances = 0;
  city.root.traverse((object) => {
    if (object instanceof THREE.InstancedMesh)
      object.addEventListener("dispose", () => disposedInstances++);
  });
  city.apply({ ...INITIAL_SETTINGS, style: "ink", outlines: 0.2 });
  const edges = city.root
    .getObjectByName("buildings")
    ?.children.find(
      (o) => o instanceof THREE.LineSegments,
    ) as THREE.LineSegments;
  assert.equal((edges.material as THREE.LineBasicMaterial).opacity, 0.2);
  city.dispose();
  city.dispose();
  assert.equal(city.root.children.length, 0);
  assert.equal(disposedInstances, 5);
});

test("canceled scene generation never returns a partially live model", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    buildCity(
      {
        center: { lat: 16, lon: 108 },
        span: 300,
        source: "live",
        features: [],
      },
      {
        size: 2,
        heights: [0, 0, 0, 0],
        minimum: 0,
        maximum: 0,
        available: true,
      },
      1,
      controller.signal,
      () => {},
    ),
    { name: "AbortError" },
  );
});

test("water follows interior terrain, and tall facades keep windows outside either footprint winding", async () => {
  const center = { lat: 16, lon: 108 },
    coordinate = (x: number, z: number) => unproject(x, z, center);
  const ring = (x: number) =>
    [
      [x - 15, -15],
      [x + 15, -15],
      [x + 15, 15],
      [x - 15, 15],
    ].map(([x, z]) => coordinate(x, z));
  const terrain = {
    size: 5,
    heights: Array.from({ length: 25 }, (_, i) => (i === 12 ? 12 : 0)),
    minimum: 0,
    maximum: 12,
    available: true,
  };
  const city = await buildCity(
    {
      center,
      span: 300,
      source: "live",
      features: [
        {
          id: 10,
          kind: "water",
          points: [
            coordinate(-140, -140),
            coordinate(140, -140),
            coordinate(140, 140),
            coordinate(-140, 140),
          ],
          holes: [],
          tags: { natural: "water", waterway: "riverbank" },
        },
        ...[-50, 50].map((x, i) => ({
          id: 20 + i,
          kind: "building" as const,
          points: i ? ring(x).reverse() : ring(x),
          holes: [],
          tags: { building: "yes", height: "200" },
        })),
      ],
    },
    terrain,
    1,
    new AbortController().signal,
    () => {},
  );
  try {
    const water = city.root.getObjectByName("water")!.children[0] as THREE.Mesh;
    const positions = water.geometry.getAttribute("position");
    assert(positions.count > 30);
    for (let i = 0; i < positions.count; i += 3) {
      const x =
        (positions.getX(i) + positions.getX(i + 1) + positions.getX(i + 2)) / 3;
      const z =
        (positions.getZ(i) + positions.getZ(i + 1) + positions.getZ(i + 2)) / 3;
      const y =
        (positions.getY(i) + positions.getY(i + 1) + positions.getY(i + 2)) / 3;
      assert(
        y >= city.elevation(x, z) - 0.05,
        "water must stay above the terrain inside the polygon",
      );
    }
    const windows = city.root
      .getObjectByName("buildings")!
      .children.find(
        (o) =>
          o instanceof THREE.Mesh &&
          !Array.isArray(o.material) &&
          o.material.name === "facade-windows",
      ) as THREE.Mesh;
    const panes = windows.geometry.getAttribute("position");
    let highest = 0;
    for (let i = 0; i < panes.count; i++) {
      const x = panes.getX(i),
        z = panes.getZ(i),
        localX = x - (x < 0 ? -50 : 50);
      assert(
        Math.abs(localX) > 15.01 || Math.abs(z) > 15.01,
        "window must sit outside the wall for both windings",
      );
      highest = Math.max(highest, panes.getY(i));
    }
    assert(highest > 190, "upper floors must keep facade detail");
  } finally {
    city.dispose();
  }
});

test("camera-near details replace coarse windows and release their previous geometry when roaming", async () => {
  const center = { lat: 16, lon: 108 },
    p = (x: number, z: number) => unproject(x, z, center);
  const city = await buildCity(
    {
      center,
      span: 600,
      source: "live",
      features: [-90, 90].map((x, i) => ({
        id: i + 1,
        kind: "building",
        points: [p(x - 8, -8), p(x + 8, -8), p(x + 8, 8), p(x - 8, 8)],
        holes: [],
        tags: { building: "yes", height: "10", "roof:shape": "flat" },
      })),
    },
    {
      size: 2,
      heights: [0, 0, 0, 0],
      minimum: 0,
      maximum: 0,
      available: false,
    },
    2026,
    new AbortController().signal,
    () => {},
  );
  try {
    city.apply(INITIAL_SETTINGS);
    assert(city.detail(new THREE.Vector3(-120, 2, 0)));
    const old = city.root.getObjectByName(
      "Khung_cua_ban_cong_bien_hieu",
    ) as THREE.Mesh;
    old.geometry.computeBoundingBox();
    assert(old.geometry.boundingBox!.max.x < 0);
    assert.equal(
      city.detail(new THREE.Vector3(-121, 2, 0)),
      false,
      "unchanged selection reuses geometry",
    );
    const coarse = city.root
      .getObjectByName("buildings")!
      .children.find(
        (o) =>
          o instanceof THREE.Mesh &&
          !Array.isArray(o.material) &&
          o.material.name === "facade-windows",
      ) as THREE.Mesh;
    const indices = coarse.geometry.index!,
      points = coarse.geometry.getAttribute("position");
    for (let i = 0; i < coarse.geometry.drawRange.count; i++)
      assert(
        points.getX(indices.getX(i)) > 0,
        "near coarse windows must be hidden",
      );
    let releases = 0;
    old.geometry.addEventListener("dispose", () => releases++);
    assert(city.detail(new THREE.Vector3(120, 2, 0)));
    assert.equal(releases, 1);
    const current = city.root.getObjectByName(
      "Khung_cua_ban_cong_bien_hieu",
    ) as THREE.Mesh;
    current.geometry.computeBoundingBox();
    assert(current.geometry.boundingBox!.min.x > 0);
    for (let i = 0; i < coarse.geometry.drawRange.count; i++)
      assert(
        points.getX(indices.getX(i)) < 0,
        "far coarse windows must return when details move",
      );
    city.detail(new THREE.Vector3(2000, 900, 2000));
    const overview = city.root.getObjectByName(
      "Khung_cua_ban_cong_bien_hieu",
    ) as THREE.Mesh;
    overview.geometry.computeBoundingBox();
    assert(
      overview.geometry.boundingBox!.min.x < 0 &&
        overview.geometry.boundingBox!.max.x > 0,
      "a camera outside the map must still detail visible houses in the overview",
    );
  } finally {
    city.dispose();
  }
});
