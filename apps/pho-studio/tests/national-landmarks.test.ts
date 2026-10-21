import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as THREE from "three";
import catalog from "../lib/scene/landmarks/catalog.json";
import { LANDMARK_CATALOG, LANDMARK_PLACES } from "../lib/landmarks.ts";
import { filterPlaces, PLACES, PROVINCES } from "../lib/places.ts";
import {
  contains,
  isVietnam,
  project,
  unproject,
  type Point,
} from "../lib/geo/coordinates.ts";
import { parseMap } from "../lib/geo/data.ts";
import { createLandmarks } from "../lib/scene/landmarks/index.ts";
import {
  insideFootprint,
  interiorRectangle,
} from "../lib/scene/landmarks/footprint.ts";
import { makeNationalLandmark } from "../lib/scene/landmarks/national.ts";
import { clipArea } from "../lib/scene/roads.ts";
import type { MapData } from "../lib/types.ts";

const additions = LANDMARK_CATALOG.filter(
  (entry) => entry.id.startsWith("vn-") && !entry.id.startsWith("vn-scenic-"),
);
const fixtures = JSON.parse(
  readFileSync(
    new URL("./fixtures/national-landmark-maps.json", import.meta.url),
    "utf8",
  ),
) as { maps: Record<string, MapData> };

test("the landmark destinations stay ranked, searchable and separate from omitted sculptures", () => {
  assert.equal(additions.length, 49);
  assert.equal(LANDMARK_PLACES.length, 93);
  assert.equal(new Set(LANDMARK_PLACES.map((p) => p.id)).size, 93);
  assert.equal(Object.keys(fixtures.maps).length, 49);
  assert.equal(filterPlaces("", "Tất cả").length, PLACES.length);
  for (const [i, entry] of LANDMARK_CATALOG.entries()) {
    assert(isVietnam(entry), entry.name);
    assert(PROVINCES.includes(entry.province), entry.province);
    assert(["Bắc", "Trung", "Nam"].includes(entry.region));
    assert(entry.span >= 300 && entry.span <= 1800);
    if (i) assert(entry.priority >= LANDMARK_CATALOG[i - 1].priority);
  }
  for (const entry of catalog.filter((e) => e.hidden)) {
    assert(!LANDMARK_PLACES.some((p) => p.id === `landmark:${entry.id}`));
    assert.equal(makeNationalLandmark(entry.kind), undefined);
  }
  assert.deepEqual(
    filterPlaces(
      "nha tho duc ba",
      "Nam",
      "TP. Hồ Chí Minh",
      LANDMARK_PLACES,
    ).map((p) => p.id),
    ["landmark:vn-notre-dame"],
  );
  assert.equal(
    filterPlaces("nha tho duc ba", "Bắc", "", LANDMARK_PLACES).length,
    0,
  );
  assert(
    filterPlaces("thap", "Tất cả", "Khánh Hòa", LANDMARK_PLACES).some(
      (p) => p.id === "landmark:vn-po-nagar",
    ),
  );
});

test("all 49 added models have distinct finite geometry, reusable themes and bounded disposable resources", () => {
  const shapes = new Set<string>();
  assert.equal(makeNationalLandmark("unknown"), undefined);
  for (const entry of additions) {
    const asset = makeNationalLandmark(entry.kind)!;
    assert(asset, entry.kind);
    const mesh = asset.root.children[0] as THREE.Mesh;
    const position = mesh.geometry.getAttribute("position");
    assert(
      position.count > 500 && position.count < 180_000,
      `${entry.kind}: ${position.count}`,
    );
    assert(Array.from(position.array).every(Number.isFinite), entry.kind);
    assert(
      Array.from(mesh.geometry.getAttribute("normal").array).every(
        Number.isFinite,
      ),
    );
    const hash = createHash("sha256")
      .update(Buffer.from(position.array.buffer))
      .digest("hex");
    assert(!shapes.has(hash), `${entry.kind} duplicates another model`);
    shapes.add(hash);
    const bounds = new THREE.Box3().setFromObject(asset.root);
    assert(
      bounds.min.y >= -0.01 && bounds.max.y < 470,
      `${entry.kind}: ${bounds.min.y},${bounds.max.y}`,
    );
    assert(bounds.getSize(new THREE.Vector3()).length() < 500, entry.kind);
    const colors = mesh.geometry.getAttribute("color");
    const original = Array.from(colors.array);
    for (const style of ["ink", "clay"] as const) {
      asset.apply(style, 0.5);
      assert.notDeepEqual(Array.from(colors.array), original, entry.kind);
    }
    asset.apply("paper", 0);
    assert.deepEqual(Array.from(colors.array), original, entry.kind);
    assert(
      !asset.root.userData.parts.some((part: string) =>
        /statue|human|figure|caryatid/.test(part),
      ),
      entry.kind,
    );
    let releases = 0;
    for (const child of asset.root.children) {
      const drawable = child as THREE.Mesh;
      drawable.geometry.addEventListener("dispose", () => releases++);
      (drawable.material as THREE.Material).addEventListener(
        "dispose",
        () => releases++,
      );
    }
    asset.dispose();
    asset.dispose();
    assert.equal(releases, 4, entry.kind);
    assert.equal(asset.root.children.length, 0);
  }
});

test("the 39 new mapped models stay inside their real outer footprints and clear of courtyards", () => {
  let checked = 0;
  for (const entry of additions) {
    const data = fixtures.maps[entry.id];
    const manager = createLandmarks(
      { ...data, center: entry, span: 1 },
      () => 0,
    );
    try {
      manager.root.updateMatrixWorld(true);
      const object = manager.root.getObjectByName(entry.name)!;
      assert(object, entry.name);
      assert.equal(
        object.userData.approximateAnchor,
        !!entry.approximateAnchor,
      );
      assert.match(object.userData.source, /^https:\/\//);
      const item = manager.list.find((p) => p.id === entry.id)!;
      assert(
        [item.width, item.depth, item.height].every(
          (n) => Number.isFinite(n) && n > 0,
        ),
      );
      if (!entry.footprint?.length) continue;
      const outer = entry.footprint.map(([lat, lon]) =>
        project({ lat, lon }, entry),
      );
      const holes = entry.footprintHoles.map((ring) =>
        ring.map(([lat, lon]) => project({ lat, lon }, entry)),
      );
      const mesh = object.children[0] as THREE.Mesh;
      const position = mesh.geometry.getAttribute("position");
      const p = new THREE.Vector3();
      for (let i = 0; i < position.count; i++) {
        p.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
        assert(
          insideFootprint(outer, p.x, p.z, 0.03),
          `${entry.name} extends outside its footprint at ${p.x},${p.z}`,
        );
        assert(
          !holes.some((ring) => contains(ring, p.x, p.z)),
          `${entry.name} fills a courtyard`,
        );
      }
      const mapped = data.features.filter(
        (f) => f.kind === "building" && f.id === entry.osm?.id,
      );
      assert(
        mapped.some((f) => manager.replaces(f)),
        `${entry.name}: mapped shell is retained`,
      );
      if (entry.kind === "dam-market") {
        assert(
          !manager.replaces(mapped[0]),
          "keep the market's separate surrounding wing",
        );
        assert(
          Math.abs(item.width - item.depth) < 0.01,
          "the round hall stays circular",
        );
      }
      if (entry.kind === "dalat-station")
        assert(
          item.width > 40 && item.depth > 10,
          "the station spans its main hall rather than a detached annex",
        );
      if (entry.kind.endsWith("-light"))
        assert(
          Math.abs(item.width - item.depth) < 0.01,
          "a lighthouse shaft stays round",
        );
      checked++;
    } finally {
      manager.dispose();
    }
  }
  assert.equal(checked, 39);
});

test("interior fitting and shell replacement preserve buildings inside or crossing a courtyard", () => {
  const outer: Point[] = [
    [-20, -20],
    [20, -20],
    [20, 20],
    [-20, 20],
  ];
  const hole: Point[] = [
    [-8, -8],
    [8, -8],
    [8, 8],
    [-8, 8],
  ];
  const rectangle = interiorRectangle(
    outer,
    new THREE.Box2(new THREE.Vector2(-20, -20), new THREE.Vector2(20, 20)),
    1,
    [hole],
  );
  for (let x = rectangle.min.x; x <= rectangle.max.x; x += 0.5)
    for (let z = rectangle.min.y; z <= rectangle.max.y; z += 0.5) {
      assert(contains(outer, x, z));
      assert(!contains(hole, x, z));
    }
  const entry = additions.find((e) => e.kind === "ethnology-museum")!;
  const manager = createLandmarks(
    { center: entry, span: 1, source: "snapshot", features: [] },
    () => 0,
  );
  const courtyard = entry.footprintHoles[0].map(([lat, lon]) =>
    project({ lat, lon }, entry),
  );
  const center = new THREE.Box2()
    .setFromPoints(courtyard.map((p) => new THREE.Vector2(...p)))
    .getCenter(new THREE.Vector2());
  try {
    for (const [w, d] of [
      [0.5, 0.5],
      [0.5, 12],
    ]) {
      const points = [
        [-w, -d],
        [w, -d],
        [w, d],
        [-w, d],
      ].map(([x, z]) => unproject(center.x + x, center.y + z, entry));
      assert(
        !manager.replaces({
          id: 999,
          kind: "building",
          points,
          holes: [],
          tags: { building: "yes" },
        }),
      );
    }
  } finally {
    manager.dispose();
  }
});

test("actual generalized vector shells cannot cover a landmark, while the merged market wing remains", () => {
  const fixtures = JSON.parse(
    readFileSync(
      new URL("./fixtures/landmark-vector-shells.json", import.meta.url),
      "utf8",
    ),
  ) as { maps: Record<string, MapData> };
  const area = (rings: Point[][]) =>
    rings.reduce(
      (sum, ring, i) =>
        sum +
        (i ? -1 : 1) *
          Math.abs(
            THREE.ShapeUtils.area(ring.map((p) => new THREE.Vector2(...p))),
          ),
      0,
    );
  for (const [id, data] of Object.entries(fixtures.maps)) {
    const entry = additions.find((e) => e.id === id)!;
    const mask = [entry.footprint!, ...entry.footprintHoles].map((ring) =>
      ring.map(([lat, lon]) => project({ lat, lon }, data.center)),
    );
    const manager = createLandmarks(data, () => 0);
    try {
      const remaining = data.features
        .flatMap(manager.clipBuilding)
        .filter((f) => !manager.replaces(f));
      for (const f of remaining) {
        const rings = [f.points, ...f.holes].map((ring) =>
          ring.map((p) => project(p, data.center)),
        );
        const overlap = clipArea([rings], [mask], "intersection");
        assert(overlap.reduce((sum, p) => sum + area(p), 0) < 0.05, entry.name);
      }
      if (entry.kind === "dam-market") {
        assert(remaining.length, "preserve the surrounding market wing");
        const size = remaining.reduce(
          (sum, f) =>
            sum +
            area(
              [f.points, ...f.holes].map((r) =>
                r.map((p) => project(p, data.center)),
              ),
            ),
          0,
        );
        assert(size > 7200 && size < 7400, `market wing area: ${size}`);
      } else assert.equal(remaining.length, 0, entry.name);
    } finally {
      manager.dispose();
    }
  }
});

test("OSM building relations retain outline/parts and independently tagged inner buildings", () => {
  const p = (x: number, z: number) => unproject(x, z, { lat: 16, lon: 108 });
  const ring = (x: number, z: number, w: number) => [
    p(x, z),
    p(x + w, z),
    p(x + w, z + w),
    p(x, z + w),
    p(x, z),
  ];
  const outline = ring(0, 0, 30),
    part = ring(0, 0, 10),
    inner = ring(40, 0, 10),
    park = ring(35, -5, 20);
  const result = parseMap({
    elements: [
      { type: "way", id: 1, tags: { building: "yes" }, geometry: outline },
      { type: "way", id: 2, tags: { "building:part": "yes" }, geometry: part },
      {
        type: "relation",
        id: 10,
        tags: { type: "building", building: "yes" },
        members: [
          { type: "way", ref: 1, role: "outline", geometry: outline },
          { type: "way", ref: 2, role: "part", geometry: part },
        ],
      },
      { type: "way", id: 3, tags: { building: "yes" }, geometry: inner },
      {
        type: "relation",
        id: 11,
        tags: { type: "multipolygon", leisure: "park" },
        members: [
          { type: "way", ref: 4, role: "outer", geometry: park },
          { type: "way", ref: 3, role: "inner", geometry: inner },
        ],
      },
    ],
  });
  assert.deepEqual(
    result.filter((f) => f.kind === "building").map((f) => f.id),
    [1, 2, 3],
  );
  assert.equal(result.find((f) => f.id === 11)?.holes.length, 1);
});
