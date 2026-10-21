import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { roadFootprint, roadWidth, clipArea } from "../lib/scene/roads.ts";
import { contains, unproject, type Point } from "../lib/geo/coordinates.ts";
import { createStreetDetails } from "../lib/scene/streets.ts";
import { parseMap } from "../lib/geo/data.ts";
import { PLACES } from "../lib/places.ts";
import { buildCity } from "../lib/scene/model.ts";
import { buildContext } from "../lib/scene/context.ts";
const flat = {
  size: 2,
  heights: [0, 0, 0, 0],
  minimum: 0,
  maximum: 0,
  available: false,
};
const includes = (area: Point[][][], x: number, z: number) =>
  area.some(
    ([outer, ...holes]) =>
      contains(outer, x, z) && !holes.some((h) => contains(h, x, z)),
  );

test("road joins fill the old outside-corner gap without acute miter spikes, and closed loops retain their islands", () => {
  const points: Point[] = [
      [-30, 0],
      [0, 0],
      [0, 30],
    ],
    area = roadFootprint([{ points, width: 8 }]);
  assert(includes(area, 2, -2), "the outside bend must be paved");
  for (const polygon of area)
    for (const [x, z] of polygon[0]) {
      const distance = Math.min(
        ...points.slice(1).map((b, i) => {
          const a = points[i],
            dx = b[0] - a[0],
            dz = b[1] - a[1],
            t = Math.max(
              0,
              Math.min(
                1,
                ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz),
              ),
            );
          return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
        }),
      );
      assert(distance <= 4.01, "round joins stay within their road radius");
    }
  const loop = roadFootprint([
    {
      points: [
        [0, 0],
        [0, 0],
        [25, 0],
        [25, 25],
        [0, 25],
        [0, 0],
      ],
      width: 4,
    },
  ]);
  assert(!includes(loop, 12, 12));
  assert(includes(loop, 12, 1));
  const hairpin = roadFootprint([
    {
      points: [
        [0, 0],
        [30, 0],
        [0.01, 0.2],
      ],
      width: 7,
    },
  ]);
  assert(hairpin.flat(3).every(Number.isFinite));
});

test("widths agree between street details and the near/far renderers, including pedestrian corridors", () => {
  assert.equal(roadWidth({ highway: "footway" }), 2.8);
  assert.equal(roadWidth({ highway: "corridor" }), 2.8);
  assert.equal(roadWidth({ highway: "primary", width: "-2" }), 13);
  assert.equal(roadWidth({ highway: "residential", width: "80" }), 28);
  assert.equal(roadWidth({ highway: "secondary", width: "6.5" }), 6.5);
  const outer: Point[][][] = [
    [
      [
        [0, 0],
        [20, 0],
        [20, 20],
        [0, 20],
      ],
      [
        [5, 5],
        [5, 15],
        [15, 15],
        [15, 5],
      ],
    ],
  ];
  const result = clipArea(
    outer,
    [
      [
        [
          [8, -2],
          [12, -2],
          [12, 22],
          [8, 22],
        ],
      ],
    ],
    "difference",
  );
  assert(includes(result, 2, 2));
  assert(!includes(result, 10, 2));
  assert(!includes(result, 6, 6));
});

test("the near and far meshes actually pave the outside corner at the same level", async () => {
  const center = { lat: 18, lon: 106 };
  const data = {
    center,
    span: 200,
    source: "snapshot" as const,
    features: [
      {
        id: 1,
        kind: "road" as const,
        points: [
          [20, 0],
          [60, 0],
          [60, 30],
        ].map(([x, z]) => unproject(x, z, center)),
        holes: [],
        tags: { highway: "residential", width: "8" },
      },
    ],
  };
  const near = await buildCity(
      data,
      flat,
      2026,
      new AbortController().signal,
      () => {},
    ),
    far = await buildContext(data, 20, 2026);
  try {
    for (const [root, name] of [
      [near.root, "roads"],
      [far.root, "Context_roads"],
    ] as const) {
      root.updateMatrixWorld(true);
      const hit = new THREE.Raycaster(
        new THREE.Vector3(62, 4, -2),
        new THREE.Vector3(0, -1, 0),
      ).intersectObject(root.getObjectByName(name)!, true)[0];
      assert(
        hit && Math.abs(hit.point.y - 0.3) < 1e-5,
        `${name} leaves the old triangular gap`,
      );
      assert(hit.face!.normal.y > 0, "road faces point upward");
    }
  } finally {
    near.dispose();
    far.dispose();
  }
});

test("continuous sidewalks and curbs leave the whole junction carriageway clear", () => {
  const center = { lat: 18, lon: 106 },
    point = (p: Point) => unproject(...p, center);
  const lines: Point[][] = [
    [
      [-45, 0],
      [45, 0],
    ],
    [
      [0, -45],
      [0, 45],
    ],
  ];
  const street = createStreetDetails(
    {
      center,
      span: 200,
      source: "snapshot",
      features: lines.map((points, i) => ({
        id: i + 1,
        kind: "road",
        points: points.map(point),
        holes: [],
        tags: { highway: "residential", width: "7" },
      })),
    },
    flat,
    2026,
  );
  try {
    street.root.updateMatrixWorld(true);
    for (const name of ["Street_walk", "Street_curb"]) {
      const mesh = street.root.getObjectByName(name)!;
      assert(mesh);
      for (let d = -35; d <= 35; d += 2)
        for (const cross of [-3.2, 0, 3.2])
          for (const [x, z] of [
            [d, cross],
            [cross, d],
          ]) {
            const hits = new THREE.Raycaster(
              new THREE.Vector3(x, 4, z),
              new THREE.Vector3(0, -1, 0),
            ).intersectObject(mesh);
            assert.equal(
              hits.length,
              0,
              `${name} enters the carriageway at ${x},${z}`,
            );
          }
    }
    assert(street.root.userData.counts.sidewalks > 0);
  } finally {
    street.dispose();
  }
});

test("all six actual map networks build finite road surfaces, bounded sidewalks and clean resource ownership", async () => {
  for (const place of PLACES.filter((p) => p.snapshot)) {
    const features = parseMap(
      JSON.parse(
        readFileSync(
          new URL(`../public/data/${place.id}.json`, import.meta.url),
          "utf8",
        ),
      ),
    );
    const city = await buildCity(
      { center: place, span: place.span, source: "snapshot", features },
      flat,
      2026,
      new AbortController().signal,
      () => {},
    );
    try {
      let streetVertices = 0;
      city.street.root.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          const p = o.geometry.getAttribute("position");
          streetVertices += p.count;
          assert(Array.from(p.array).every(Number.isFinite), place.id);
        }
      });
      assert(
        streetVertices < 650000,
        `${place.id}: street detail exceeds its geometry budget`,
      );
      assert(city.stats.roads > 0, place.id);
    } finally {
      city.dispose();
    }
    assert.equal(city.root.children.length, 0);
  }
});

test("rounded road ends cross the detail/context seam without disappearing", async () => {
  const center = { lat: 18, lon: 106 };
  const context = await buildContext(
    {
      center,
      span: 500,
      source: "snapshot",
      features: [
        {
          id: 1,
          kind: "road",
          points: [
            [150, 0],
            [198, 0],
          ].map(([x, z]) => unproject(x, z, center)),
          holes: [],
          tags: { highway: "residential", width: "8" },
        },
      ],
    },
    400,
    2026,
  );
  try {
    context.root.updateMatrixWorld(true);
    const road = context.root.getObjectByName("Context_roads")!;
    assert(road);
    const hits = new THREE.Raycaster(
      new THREE.Vector3(201, 4, 0),
      new THREE.Vector3(0, -1, 0),
    ).intersectObject(road);
    assert(
      hits.length > 0,
      "context retains the cap outside the detailed rectangle",
    );
  } finally {
    context.dispose();
  }
});
