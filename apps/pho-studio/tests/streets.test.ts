import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { createStreetDetails } from "../lib/scene/streets.ts";
import { unproject } from "../lib/geo/coordinates.ts";
import type { MapData } from "../lib/types.ts";
const center = { lat: 15.8773, lon: 108.3284 },
  point = (x: number, z: number) => unproject(x, z, center);
const terrain = {
  size: 2,
  heights: [0, 0, 0, 0],
  minimum: 0,
  maximum: 0,
  available: true,
};
const data: MapData = {
  center,
  span: 400,
  source: "live",
  features: [
    {
      id: 1,
      kind: "road",
      points: [point(0, -180), point(0, 180)],
      holes: [],
      tags: { highway: "secondary" },
    },
    {
      id: 2,
      kind: "road",
      points: [point(-180, 80), point(0, 80), point(180, 80)],
      holes: [],
      tags: { highway: "residential" },
    },
    ...[-1, 1].flatMap((side) =>
      [-55, -20, 20, 55].map((z, i) => ({
        id: 10 + i + (side + 1) * 5,
        kind: "building" as const,
        points: [
          point(side * 15 - 5, z - 9),
          point(side * 15 + 5, z - 9),
          point(side * 15 + 5, z + 9),
          point(side * 15 - 5, z + 9),
        ],
        holes: [],
        tags: { building: "yes" },
      })),
    ),
    {
      id: 100,
      kind: "water",
      points: [
        point(100, -170),
        point(170, -170),
        point(170, 40),
        point(100, 40),
      ],
      holes: [],
      tags: { natural: "water" },
    },
  ],
};

test("pedestrian paths retain people without inventing scooters or overhead utilities", () => {
  const streets = createStreetDetails(
    {
      ...data,
      features: [
        {
          id: 1,
          kind: "road",
          points: [point(0, -180), point(0, 180)],
          holes: [],
          tags: { highway: "footway" },
        },
      ],
    },
    terrain,
    2026,
  );
  try {
    const counts = streets.root.userData.counts;
    assert.equal(counts.poles, 0);
    assert.equal(counts.scooters, 0);
    assert.equal(counts.cars, 0);
    assert(counts.people > 0);
  } finally {
    streets.dispose();
  }
});
test("street cameras and furniture follow actual roads without entering footprints or water", () => {
  const streets = createStreetDetails(data, terrain, 2026);
  try {
    assert(streets.camera);
    assert(
      !streets.blocked(streets.camera.position[0], streets.camera.position[2]),
    );
    assert.equal(streets.blocked(15, 20), true);
    assert.equal(streets.blocked(130, 0), true);
    assert.equal(streets.blocked(0, 0), false);
    const counts = streets.root.userData.counts;
    assert(counts.cars > 0);
    assert(counts.scooters > 0);
    assert(counts.poles > 0);
    assert(counts.sidewalks > 0);
    for (const placement of streets.root.userData.placements) {
      assert(!streets.blocked(placement.x, placement.z));
      for (const [x, z] of placement.footprint) assert(!streets.blocked(x, z));
    }
    assert(
      streets
        .fronts([
          [-20, -29],
          [-10, -29],
          [-10, -11],
          [-20, -11],
        ])
        .includes(1),
    );
    let vertices = 0;
    streets.root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        const p = o.geometry.getAttribute("position");
        vertices += p.count;
        assert(Array.from(p.array).every(Number.isFinite));
      }
    });
    assert(vertices < 650_000);
    streets.apply("ink", 0);
    assert.equal(
      (
        (
          streets.root.getObjectByName("Street_contours")!
            .children[0] as THREE.LineSegments
        ).material as THREE.LineBasicMaterial
      ).opacity,
      0,
    );
  } finally {
    streets.dispose();
    streets.dispose();
  }
  assert.equal(streets.root.children.length, 0);
});

test("sidewalks and curbs conform to sloping terrain instead of forming floating steps", () => {
  const slope = { ...terrain, heights: [0, 0, 50, 50], maximum: 50 };
  const street = createStreetDetails(data, slope, 2026);
  try {
    for (const name of ["Street_walk", "Street_curb"]) {
      const mesh = street.root.getObjectByName(name) as THREE.Mesh,
        p = mesh.geometry.getAttribute("position");
      for (let i = 0; i < p.count; i++) {
        const ground = (p.getZ(i) / 400 + 0.5) * 50,
          offset = p.getY(i) - ground;
        assert(
          offset >= 0.3 - 1e-4 &&
            offset <= (name === "Street_walk" ? 0.45 : 0.48) + 1e-4,
          "each curb vertex follows local ground",
        );
      }
    }
  } finally {
    street.dispose();
  }
});
