import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as THREE from "three";
import {
  contains,
  project,
  unproject,
  type Point,
} from "../lib/geo/coordinates.ts";
import { groundTerrain } from "../lib/geo/terrain.ts";
import { parseMap } from "../lib/geo/data.ts";
import { buildCity } from "../lib/scene/model.ts";
import { pavementGeometry } from "../lib/scene/roads.ts";
import { waterElevation } from "../lib/scene/elevation.ts";
import { buildContext } from "../lib/scene/context.ts";
import {
  gridElevation,
  surfaceGeometry,
  foundation,
} from "../lib/scene/surfaces.ts";
import {
  INITIAL_SETTINGS,
  type MapData,
  type TerrainData,
} from "../lib/types.ts";

function conforming(
  geometry: THREE.BufferGeometry,
  height: (x: number, z: number) => number,
  offset: number,
) {
  const pos = geometry.getAttribute("position");
  assert(Array.from(pos.array).every(Number.isFinite));
  for (let i = 0; i < (geometry.index?.count ?? pos.count); i += 3) {
    const indices = [0, 1, 2].map((j) => geometry.index?.getX(i + j) ?? i + j);
    for (const weights of [
      [1 / 3, 1 / 3, 1 / 3],
      [0.7, 0.2, 0.1],
    ]) {
      const x = weights.reduce(
        (sum, w, j) => sum + w * pos.getX(indices[j]),
        0,
      );
      const z = weights.reduce(
        (sum, w, j) => sum + w * pos.getZ(indices[j]),
        0,
      );
      const y = weights.reduce(
        (sum, w, j) => sum + w * pos.getY(indices[j]),
        0,
      );
      assert(
        Math.abs(y - height(x, z) - offset) < 0.0002,
        `triangle crosses terrain at ${x},${z}: ${y - height(x, z)}`,
      );
    }
  }
}

function ray(mesh: THREE.Object3D, x: number, z: number) {
  mesh.updateMatrixWorld(true);
  return new THREE.Raycaster(
    new THREE.Vector3(x, 1000, z),
    new THREE.Vector3(0, -1, 0),
  ).intersectObject(mesh, true);
}

test("concave surfaces and holes follow the rendered terrain inside triangles, not only at their vertices", () => {
  const height = gridElevation(
    (x, z) => Math.sin(x / 8) * Math.cos(z / 9) * 15 + x * 0.08,
    7,
    -56,
  );
  const points: Point[] = [
    [-48, -48],
    [48, -42],
    [38, 48],
    [0, 25],
    [-45, 48],
  ];
  const hole: Point[] = [
    [-12, -12],
    [14, -10],
    [14, 14],
    [-12, 14],
  ];
  const geometry = surfaceGeometry(
    points,
    [hole],
    (x, z) => height(x, z) + 0.12,
    7,
    -56,
  );
  try {
    conforming(geometry, height, 0.12);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
    );
    assert.equal(
      ray(mesh, 0, 0).length,
      0,
      "holes are not filled during subdivision",
    );
    (mesh.material as THREE.Material).dispose();
    const footing = foundation(points, [hole], height, 7, -56);
    const pos = geometry.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) - 0.12;
      assert(
        y <= footing.high + 0.0001 && y >= footing.low - 0.0001,
        "foundation includes interior peaks and triangle-edge crossings",
      );
    }
  } finally {
    geometry.dispose();
  }
});

test("roof filtering removes an isolated urban DEM peak while retaining a broad slope", () => {
  const size = 33,
    heights = Array.from(
      { length: size * size },
      (_, i) => (i % size) + Math.floor(i / size) * 0.5,
    );
  const terrain: TerrainData = {
    size,
    heights,
    minimum: 0,
    maximum: 48,
    available: true,
  };
  const clean = groundTerrain(terrain, 800);
  for (let z = 4; z < 29; z++)
    for (let x = 4; x < 29; x++)
      assert.equal(clean.heights[z * size + x], heights[z * size + x]);
  const dirty = { ...terrain, heights: [...heights] };
  dirty.heights[544] += 60;
  const fixed = groundTerrain(dirty, 800);
  assert(Math.abs(fixed.heights[544] - heights[544]) < 1);
  assert.equal(
    dirty.heights[544],
    heights[544] + 60,
    "the source DEM remains unchanged",
  );
});

test("near and distant grass leave ponds, islands and buildings intact on uneven terrain", async () => {
  const center = { lat: 18, lon: 106 },
    p = (x: number, z: number) => unproject(x, z, center);
  const ring = (x0: number, z0: number, x1: number, z1: number) => [
    p(x0, z0),
    p(x1, z0),
    p(x1, z1),
    p(x0, z1),
  ];
  const data: MapData = {
    center,
    span: 240,
    source: "live",
    features: [
      {
        id: 1,
        kind: "park",
        points: ring(-110, -110, 110, 110),
        holes: [],
        tags: { leisure: "park" },
      },
      {
        id: 2,
        kind: "water",
        points: ring(48, -45, 103, 20),
        holes: [ring(66, -20, 78, -8)],
        tags: { natural: "water", water: "pond" },
      },
      {
        id: 3,
        kind: "building",
        points: ring(-90, -45, -55, 35),
        holes: [],
        tags: { building: "yes", height: "10", "roof:shape": "flat" },
      },
    ],
  };
  const terrain: TerrainData = {
    size: 9,
    heights: Array.from(
      { length: 81 },
      (_, i) => Math.sin(i % 9) * 4 + Math.floor(i / 9) * 2 + 4,
    ),
    minimum: 0,
    maximum: 24,
    available: true,
  };
  const city = await buildCity(
    data,
    terrain,
    2026,
    new AbortController().signal,
    () => {},
  );
  const context = await buildContext(
    data,
    80,
    2026,
    (x, z) => Math.sin(x / 30) * 5 + z * 0.1 + 15,
  );
  try {
    context.apply(INITIAL_SETTINGS);
    for (const [root, ground, park, water] of [
      [
        city.root,
        city.ground,
        city.root.getObjectByName("parks")!,
        city.root.getObjectByName("water")!,
      ],
      [
        context.root,
        context.root.getObjectByName("Context_ground")!,
        context.root.getObjectByName("Context_parks")!,
        context.root.getObjectByName("Context_water")!,
      ],
    ] as const) {
      assert.equal(
        ray(ground, 56, -30).length,
        0,
        "ground cannot pierce the pond",
      );
      assert(
        ray(ground, 72, -14).length > 0,
        "the island remains solid ground",
      );
      assert.equal(ray(water, 72, -14).length, 0, "the island remains dry");
      assert.equal(ray(park, 56, -30).length, 0, "grass cannot cover water");
      assert.equal(
        ray(park, -70, 0).length,
        0,
        "grass cannot cover building foundations",
      );
      const ys: number[] = [];
      water.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          const pos = o.geometry.getAttribute("position");
          for (let i = 0; i < pos.count; i++) ys.push(pos.getY(i));
        }
      });
      assert(
        Math.max(...ys) - Math.min(...ys) < 0.0001,
        "standing water remains horizontal",
      );
      assert(ray(root, 90, 70).length > 0);
    }
    for (const style of ["paper", "clay", "ink"] as const) {
      city.apply({ ...INITIAL_SETTINGS, style });
      context.apply({ ...INITIAL_SETTINGS, style });
      const nearWater = city.root.getObjectByName("water")!
        .children[0] as THREE.Mesh;
      const farWater = context.root.getObjectByName(
        "Context_water",
      ) as THREE.Mesh;
      const color = (nearWater.material as THREE.MeshStandardMaterial).color,
        colors = farWater.geometry.getAttribute("color");
      assert(
        Math.abs(color.r - colors.getX(0)) < 0.000001 &&
          Math.abs(color.g - colors.getY(0)) < 0.000001 &&
          Math.abs(color.b - colors.getZ(0)) < 0.000001,
        "water must not change color at the detail boundary",
      );
    }
    const walls = city.root
      .getObjectByName("buildings")!
      .children.find(
        (o) =>
          o instanceof THREE.Mesh &&
          (o.material as THREE.MeshStandardMaterial).vertexColors,
      ) as THREE.Mesh;
    const bounds = new THREE.Box3().setFromObject(walls);
    const points = data.features[2].points.map((v) => project(v, center));
    const footing = foundation(points, [], city.elevation, 240 / 32, -120);
    assert(Math.abs(bounds.min.y - (footing.low + 0.1)) < 0.0001);
    assert(
      bounds.max.y >= footing.high + 10.2,
      "the full height of the building clears the highest ground under it",
    );
  } finally {
    city.dispose();
    context.dispose();
  }
});

test("the actual Nguyen Hue grass and river meshes stay above the rendered DEM, and Lam Son's pond has no grass or ground", async () => {
  const center = { lat: 10.7756, lon: 106.703 };
  const data: MapData = {
    center,
    span: 800,
    source: "snapshot",
    features: parseMap(
      JSON.parse(
        readFileSync(
          new URL("../public/data/sai-gon.json", import.meta.url),
          "utf8",
        ),
      ),
    ),
  };
  // Terrarium z12 samples from this exact location reproduce the original crossing triangles.
  const terrain = JSON.parse(
    readFileSync(
      new URL("./fixtures/sai-gon-terrain.json", import.meta.url),
      "utf8",
    ),
  );
  const city = await buildCity(
    data,
    terrain,
    2026,
    new AbortController().signal,
    () => {},
  );
  try {
    conforming(city.ground.geometry, city.elevation, 0);
    const parks = city.root.getObjectByName("parks")!;
    parks.traverse((o) => {
      if (o instanceof THREE.Mesh) conforming(o.geometry, city.elevation, 0.12);
    });
    const ponds = data.features.filter(
      (f) => f.kind === "water" && !f.tags.waterway && f.tags.water !== "river",
    );
    assert(ponds.length > 0);
    for (const pond of ponds) {
      const ring = pond.points.map((v) => project(v, center));
      const x = ring.reduce((s, p) => s + p[0], 0) / ring.length,
        z = ring.reduce((s, p) => s + p[1], 0) / ring.length;
      if (Math.abs(x) > 400 || Math.abs(z) > 400 || !contains(ring, x, z))
        continue;
      assert.equal(ray(city.ground, x, z).length, 0);
      assert.equal(ray(parks, x, z).length, 0);
    }
    let streetVertices = 0;
    city.street.root.traverse((o) => {
      if (o instanceof THREE.Mesh)
        streetVertices += o.geometry.getAttribute("position").count;
    });
    assert(
      streetVertices < 650000,
      "terrain conformity keeps the existing detail budget",
    );
  } finally {
    city.dispose();
  }
});

test("an all-water tile still builds and disposes with an empty ground mesh", async () => {
  const center = { lat: 18, lon: 106 },
    p = (x: number, z: number) => unproject(x, z, center);
  const city = await buildCity(
    {
      center,
      span: 200,
      source: "live",
      features: [
        {
          id: 1,
          kind: "water",
          tags: { natural: "water", water: "river" },
          points: [p(-120, -120), p(120, -120), p(120, 120), p(-120, 120)],
          holes: [],
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
    assert.equal(city.ground.geometry.getAttribute("position").count, 0);
    city.apply({ ...INITIAL_SETTINGS, water: false });
    assert(
      ray(city.root.getObjectByName("Lòng nước")!, 0, 0).length > 0,
      "hiding water reveals a bed instead of a void",
    );
    assert(city.root.getObjectByName("water")!.children.length > 0);
  } finally {
    city.dispose();
  }
});

test("subdivided pavement retains the outward normals of both caps and its vertical walls", () => {
  const geometry = pavementGeometry(
    [
      [
        [
          [-10, -10],
          [10, -10],
          [10, 10],
          [-10, 10],
        ],
      ],
    ],
    () => 5,
    0.18,
    6,
    -12,
  )!;
  try {
    const normals = geometry.getAttribute("normal"),
      pos = geometry.getAttribute("position");
    let up = 0,
      down = 0,
      wall = 0;
    for (let i = 0; i < pos.count; i++) {
      if (normals.getY(i) > 0.99) up++;
      else if (normals.getY(i) < -0.99) down++;
      else wall++;
    }
    assert(
      up > 0 && down > 0 && wall > 0,
      "exports retain both caps and the sides",
    );
  } finally {
    geometry.dispose();
  }
});

test("closed water stays level across the detail boundary, while linear streams retain terrain gradients", () => {
  const center = { lat: 18, lon: 106 },
    p = (x: number, z: number) => unproject(x, z, center);
  const near: MapData = {
    center,
    span: 100,
    source: "live",
    features: [
      {
        id: 1,
        kind: "water",
        tags: { water: "lake", natural: "water" },
        points: [p(20, -40), p(80, -40), p(80, 40), p(20, 40)],
        holes: [],
      },
    ],
  };
  const nearHeight = waterElevation(near, () => 8);
  const far = waterElevation(
    {
      ...near,
      span: 400,
      features: [
        {
          ...near.features[0],
          id: 22,
          points: [p(20, -40), p(180, -40), p(180, 40), p(20, 40)],
        },
        {
          id: 23,
          kind: "water",
          tags: { water: "river", natural: "water" },
          points: [p(-100, -40), p(-60, -40), p(-60, 40), p(-100, 40)],
          holes: [],
        },
        {
          id: 24,
          kind: "water",
          tags: { waterway: "stream" },
          points: [p(-150, -40), p(-150, 40)],
          holes: [],
        },
      ],
    },
    (x, z) => 20 + x * 0.1 + z * 0.03,
    nearHeight.waterSurfaces,
  );
  assert.equal(far.waterSurfaces.length, 2);
  assert.equal(far.waterSurfaces[0].level, 8);
  assert.equal(far(150, 0), 8);
  assert.equal(far(-80, 0), far(-80, 30));
  assert.notEqual(far(-150, 0), far(-150, 30));
});
