import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import {
  createLandmarks,
  LANDMARK_CATALOG,
} from "../lib/scene/landmarks/index.ts";
import { parseMap } from "../lib/geo/data.ts";
import { PLACES } from "../lib/places.ts";
import { INITIAL_SETTINGS, type MapData } from "../lib/types.ts";
import { contains, project, unproject } from "../lib/geo/coordinates.ts";
import { sceneElevation } from "../lib/scene/elevation.ts";
import {
  buildingProfile,
  buildingOutlinesWithParts,
} from "../lib/geo/buildings.ts";
import { makeHanoiLandmark } from "../lib/scene/landmarks/hanoi.ts";
import { makeUrbanLandmark } from "../lib/scene/landmarks/urban.ts";
import { buildCity } from "../lib/scene/model.ts";
import { buildContext } from "../lib/scene/context.ts";
import catalog from "../lib/scene/landmarks/catalog.json";

test("Dragon Bridge reaches both mapped riverbank roads at their terrain height", () => {
  const center = PLACES.find((place) => place.id === "da-nang")!;
  const features = parseMap(
    JSON.parse(
      readFileSync(
        new URL("../public/data/da-nang.json", import.meta.url),
        "utf8",
      ),
    ),
  );
  const height = (x: number, z: number) => 3 + x * 0.003 + z * 0.002;
  const manager = createLandmarks(
    { center, span: 900, source: "snapshot", features },
    height,
  );
  try {
    const bridge = manager.root.getObjectByName("Cầu Rồng")!;
    manager.root.updateMatrixWorld(true);
    const south = features.find((f) => f.id === 199383481)!.points;
    const north = features.find((f) => f.id === 295386151)!.points;
    const west = features.find((f) => f.id === 694830396)!.points;
    for (const [a, b] of [
      [south[0], west[west.length - 1]],
      [south[south.length - 1], north[0]],
    ]) {
      const [x, z] = project(
        { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 },
        center,
      );
      const hit = new THREE.Raycaster(
        new THREE.Vector3(x, 100, z),
        new THREE.Vector3(0, -1, 0),
      )
        .intersectObject(bridge, true)
        .find((hit) => hit.object instanceof THREE.Mesh);
      assert(
        hit && Math.abs(hit.point.y - height(x, z) - 0.3) < 0.2,
        `bridge must connect the mapped approach at ${x}, ${z}`,
      );
    }
  } finally {
    manager.dispose();
  }
});

test("the cathedral follows its mapped axis and leaves its actual neighbouring buildings unobstructed", () => {
  const center = PLACES.find((place) => place.id === "ho-guom")!;
  const features = parseMap(
    JSON.parse(
      readFileSync(
        new URL("../public/data/ho-guom.json", import.meta.url),
        "utf8",
      ),
    ),
  );
  const landmarks = createLandmarks(
    { center, span: 1100, source: "snapshot", features },
    () => 0,
  );
  try {
    const cathedral = landmarks.root.getObjectByName("Nhà thờ Lớn Hà Nội")!;
    landmarks.root.updateMatrixWorld(true);
    for (const [id, weights] of [
      [
        1340978214,
        [
          [0, 0.375],
          [1, 0.375],
          [2, 0.125],
          [3, 0.125],
        ],
      ],
      [
        701882945,
        [
          [0, 0.65],
          [7, 0.25],
          [1, 0.1],
        ],
      ],
    ] as const) {
      const neighbour = features.find((feature) => feature.id === id)!;
      assert(
        !landmarks.replaces(neighbour),
        "mapped neighbours must remain in the scene",
      );
      const point = weights.reduce(
        (p, [i, w]) => ({
          lat: p.lat + neighbour.points[i].lat * w,
          lon: p.lon + neighbour.points[i].lon * w,
        }),
        { lat: 0, lon: 0 },
      );
      const [x, z] = project(point, center);
      assert(
        contains(
          neighbour.points.map((p) => project(p, center)),
          x,
          z,
        ),
      );
      const hits = new THREE.Raycaster(
        new THREE.Vector3(x, 60, z),
        new THREE.Vector3(0, -1, 0),
      )
        .intersectObject(cathedral, true)
        .filter((hit) => hit.object instanceof THREE.Mesh);
      assert(
        hits.every((hit) => hit.point.y < 1),
        `cathedral must not cover neighbouring building ${id}`,
      );
    }
    const entry = catalog.find((entry) => entry.kind === "st-joseph")!;
    const [frontX, frontZ] = project(
      features.find((feature) => feature.id === 910389729)!.points[0],
      entry,
    );
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(
      cathedral.quaternion,
    );
    assert(
      direction.dot(new THREE.Vector3(frontX, 0, frontZ).normalize()) > 0.9,
      "the bell towers must face the mapped entrance end of the cathedral",
    );
  } finally {
    landmarks.dispose();
  }
});

test("omitted sculptures cannot return as selectable models or generic near/far map buildings", async () => {
  const omitted = catalog.filter((entry) => entry.hidden);
  assert.equal(omitted.length, 4);
  for (const entry of omitted) {
    assert.equal(makeHanoiLandmark(entry.kind), undefined);
    assert.equal(makeUrbanLandmark(entry.kind), undefined);
    assert(!LANDMARK_CATALOG.some((item) => item.id === entry.id));
    const center = unproject(-60, 0, entry),
      p = (x: number, z: number) => unproject(x, z, center);
    const feature = {
      id: 999,
      kind: "building" as const,
      tags: { building: "yes", height: "8" },
      points: [p(59, -1), p(61, -1), p(61, 1), p(59, 1)],
      holes: [],
    };
    const data: MapData = {
      center,
      span: 160,
      source: "live",
      features: [feature],
    };
    const near = createLandmarks(data, () => 0),
      far = createLandmarks({ ...data, span: 300 }, () => 0, 80);
    try {
      assert(near.replaces(feature), entry.kind);
      assert(far.replaces(feature), entry.kind);
      assert(!near.list.some((item) => item.id === entry.id));
      assert(!far.list.some((item) => item.id === entry.id));
    } finally {
      near.dispose();
      far.dispose();
    }
    if (entry.kind !== "ho-chi-minh-statue") continue;
    const city = await buildCity(
      data,
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
    const context = await buildContext({ ...data, span: 300 }, 80, 2026);
    try {
      assert.equal(
        city.stats.buildings,
        city.landmarks.length,
        "no replacement block in the detail renderer",
      );
      assert.equal(
        context.root.userData.buildings,
        0,
        "no replacement block in the context renderer",
      );
    } finally {
      city.dispose();
      context.dispose();
    }
  }
  for (const kind of ["saigon-city-hall", "saigon-opera"]) {
    const asset = makeUrbanLandmark(kind)!;
    try {
      assert(
        !asset.root.userData.parts.some((name: string) =>
          /caryatid|_heads|_figures|pediment_sculpture|pediment_wings/.test(
            name,
          ),
        ),
      );
    } finally {
      asset.dispose();
    }
  }
});

test("all 39 registered landmarks belong to one detail/context region, replace mapped shells and retain export metadata", () => {
  const ids = new Set<string>();
  for (const place of PLACES.filter((p) => p.snapshot)) {
    const payload = JSON.parse(
      readFileSync(
        new URL(`../public/data/${place.id}.json`, import.meta.url),
        "utf8",
      ),
    );
    const data: MapData = {
      center: place,
      span: place.span,
      source: "snapshot",
      features: parseMap(payload),
    };
    const near = createLandmarks(data, () => 3);
    const far = createLandmarks({ ...data, span: 2200 }, () => 3, data.span);
    try {
      const local = new Set(near.list.map((item) => item.id));
      assert(
        far.list.every((item) => !local.has(item.id)),
        "no duplicate boundary ownership",
      );
      for (const manager of [near, far]) {
        for (const item of manager.list) {
          assert(!ids.has(item.id));
          if (!item.id.startsWith("vn-")) ids.add(item.id);
          assert.equal(item.base, 3.24);
          assert(
            [item.x, item.z, item.width, item.depth, item.height].every(
              Number.isFinite,
            ),
          );
          const object = manager.root.getObjectByName(item.name)!;
          assert.equal(object.userData.landmarkId, item.id);
          const bounds = new THREE.Box3().setFromObject(object);
          const minimum = item.id.includes("dragon-bridge") ? 2.95 : 3.19;
          assert(bounds.min.y >= minimum && bounds.max.y > 4);
        }
        manager.apply({ ...INITIAL_SETTINGS, style: "clay", buildings: false });
        assert.equal(manager.root.visible, false);
      }
      const mapped = data.features.filter(
        (f) =>
          f.kind === "building" &&
          LANDMARK_CATALOG.some((e) => e.osm?.id === f.id),
      );
      assert(
        mapped.every((feature) => near.replaces(feature)),
        place.id,
      );
      if (place.id === "ho-guom") assert.equal(near.list.length, 10);
      if (place.id === "ho-guom") {
        const bridgeParts = data.features.filter(
          (f) =>
            f.kind === "building" &&
            [1526333993, 1547379109, 1547379110].includes(f.id),
        );
        assert.equal(bridgeParts.length, 3);
        assert(
          bridgeParts.every((feature) => near.replaces(feature)),
          "mapped bridge deck and rails must not cover the detailed bridge",
        );
      }
      if (place.id === "sai-gon")
        assert(far.list.some((item) => item.name.includes("Bitexco")));
    } finally {
      near.dispose();
      far.dispose();
    }
  }
  assert.equal(ids.size, 39);
  assert.equal(
    new Set(
      LANDMARK_CATALOG.filter((item) => !item.id.startsWith("vn-")).map(
        (item) => item.kind,
      ),
    ).size,
    27,
  );
});

test("building parts preserve minimum elevations and roofs, and suppress enclosing shells rather than neighbouring buildings", () => {
  assert.deepEqual(
    buildingProfile(
      {
        height: "30",
        min_height: "10",
        "roof:height": "3",
        "roof:shape": "gabled",
      },
      1,
      1,
    ),
    { height: 17, minimum: 10, roof: 3, estimated: false },
  );
  assert.equal(
    buildingProfile({ height: "30 ft", min_height: "10 ft" }, 1, 1).minimum,
    3.048,
  );
  const center = { lat: 16, lon: 108 },
    p = (x: number, z: number) => unproject(x, z, center);
  const ring = (x: number, z: number, w: number, d: number) => [
    p(x, z),
    p(x + w, z),
    p(x + w, z + d),
    p(x, z + d),
    p(x, z),
  ];
  const features = parseMap({
    elements: [
      {
        type: "way",
        id: 1,
        tags: { building: "yes" },
        geometry: ring(0, 0, 20, 20),
      },
      {
        type: "way",
        id: 2,
        tags: { "building:part": "yes", height: "20", min_height: "8" },
        geometry: ring(0, 0, 10, 20),
      },
      {
        type: "way",
        id: 3,
        tags: { building: "yes" },
        geometry: ring(25, 0, 10, 20),
      },
    ],
  });
  assert.equal(features.length, 3);
  const hidden = buildingOutlinesWithParts(features, center);
  assert.deepEqual(
    [...hidden].map((f) => f.id),
    [1],
  );
  features[0].holes = [ring(0, -1, 11, 22)];
  assert.equal(
    buildingOutlinesWithParts(features, center).size,
    0,
    "a courtyard does not enclose a part",
  );
});

test("Hoan Kiem keeps one lake level, raised islands, and a continuous shore; unrelated terrain is unchanged", () => {
  const center = { lat: 16, lon: 108 },
    p = (x: number, z: number) => unproject(x, z, center);
  const terrain = {
    size: 3,
    heights: [0, 2, 6, 4, 25, 8, 7, 8, 10],
    minimum: 0,
    maximum: 25,
    available: true,
  };
  const data: MapData = {
    center,
    span: 200,
    source: "snapshot",
    features: [
      {
        id: 198437,
        kind: "water",
        tags: { name: "Hồ Hoàn Kiếm" },
        points: [p(-70, -70), p(70, -70), p(70, 70), p(-70, 70)],
        holes: [[p(-5, -5), p(5, -5), p(5, 5), p(-5, 5)]],
      },
    ],
  };
  const sample = sceneElevation(data, terrain);
  assert.equal(sample(20, 20), sample(-40, -30));
  assert(Math.abs(sample(0, 0) - sample(20, 20) - 0.85) < 1e-8);
  assert(Math.abs(sample(70, 20) - sample(70.001, 20)) < 0.001);
  assert.equal(sceneElevation({ ...data, features: [] }, terrain)(0, 0), 25);
});
