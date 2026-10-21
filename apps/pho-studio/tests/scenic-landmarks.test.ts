import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as THREE from "three";
import { LANDMARK_CATALOG, LANDMARK_PLACES } from "../lib/landmarks.ts";
import { filterPlaces } from "../lib/places.ts";
import { contains, project, type Point } from "../lib/geo/coordinates.ts";
import { createLandmarks } from "../lib/scene/landmarks/index.ts";
import { makeScenicLandmark } from "../lib/scene/landmarks/scenic.ts";
import { INITIAL_SETTINGS, type MapData } from "../lib/types.ts";
import { buildCity } from "../lib/scene/model.ts";
import { buildContext } from "../lib/scene/context.ts";
import { parseVectorTile } from "../lib/geo/vector.ts";
import { parseMap } from "../lib/geo/data.ts";

const sites = LANDMARK_CATALOG.filter((e) => e.id.startsWith("vn-scenic-"));
const fixtures = JSON.parse(
  readFileSync(new URL("./fixtures/scenic-maps.json", import.meta.url), "utf8"),
) as { maps: Record<string, MapData> };
const local = (ring: number[][], entry: (typeof sites)[number]): Point[] =>
  ring.map(([lat, lon]) => project({ lat, lon }, entry));
const make = (
  entry: (typeof sites)[number],
  ground = (_x: number, _z: number) => 0,
) =>
  makeScenicLandmark(
    entry.kind,
    ground,
    local(entry.path ?? [], entry),
    local(entry.footprint ?? [], entry),
  )!;

test("five scenic highlights are searchable without hiding the architectural catalog", () => {
  assert.equal(sites.length, 5);
  assert.equal(LANDMARK_PLACES.length, 93);
  assert.equal(Object.keys(fixtures.maps).length, 5);
  for (const [query, kind] of [
    ["ba na hills", "golden-bridge"],
    ["vinh ha long", "fighting-cocks"],
    ["phong nha ke bang", "phong-nha-cave"],
    ["ghenh da dia", "ganh-da-dia"],
    ["ban gioc waterfall", "ban-gioc-falls"],
  ]) {
    assert(
      filterPlaces(query, "Tất cả", "", LANDMARK_PLACES).some(
        (p) => p.id === `landmark:vn-scenic-${kind}`,
      ),
      query,
    );
  }
  assert.equal(
    LANDMARK_PLACES.filter((p) => p.category === "Danh thắng").length,
    4,
  );
  assert(
    LANDMARK_PLACES.find((p) =>
      p.id.endsWith("phong-nha-cave"),
    )!.description.includes("không mô phỏng toàn bộ"),
  );
});

test("Phong Nha's mapped underground river is not drawn up the hillside", () => {
  const bytes = readFileSync(
    new URL("./fixtures/phong-nha-vector.pbf", import.meta.url),
  );
  const features = parseVectorTile(new Uint8Array(bytes), 13029, 7378, 14);
  assert(
    !features.some((f) => f.id === 3430038962),
    "underground reach stays hidden",
  );
  assert(
    features.some((f) => f.id === 4788541402 && f.kind === "water"),
    "exposed Son River remains visible",
  );
  const geometry = [
    { lat: 17.58, lon: 106.28 },
    { lat: 17.59, lon: 106.29 },
  ];
  assert.equal(
    parseMap({
      elements: [
        {
          type: "way",
          id: 1,
          tags: { waterway: "river", tunnel: "yes" },
          geometry,
        },
      ],
    }).length,
    0,
  );
  assert.equal(
    parseMap({
      elements: [
        {
          type: "way",
          id: 2,
          tags: { waterway: "river", tunnel: "no" },
          geometry,
        },
      ],
    }).length,
    1,
  );
});

test("all five scenic models have finite bounded geometry, consistent themes and disposable resources", () => {
  assert.equal(makeScenicLandmark("unknown"), undefined);
  for (const entry of sites) {
    const asset = make(entry),
      mesh = asset.root.children[0] as THREE.Mesh;
    const p = mesh.geometry.getAttribute("position");
    assert(
      p.count > 1000 && p.count < 220_000,
      `${entry.kind}: ${p.count} vertices`,
    );
    assert(Array.from(p.array).every(Number.isFinite), entry.kind);
    assert(
      Array.from(mesh.geometry.getAttribute("normal").array).every(
        Number.isFinite,
      ),
      entry.kind,
    );
    const size = new THREE.Box3()
      .setFromObject(asset.root)
      .getSize(new THREE.Vector3());
    assert(
      size.x < 180 && size.z < 180 && size.y < 90,
      `${entry.kind}: ${size.toArray()}`,
    );
    const colors = mesh.geometry.getAttribute("color"),
      original = Array.from(colors.array);
    for (const style of ["clay", "ink"] as const) {
      asset.apply(style, 0.4);
      assert.notDeepEqual(Array.from(colors.array), original);
    }
    asset.apply("paper", 0);
    assert.deepEqual(Array.from(colors.array), original);
    let disposed = 0;
    for (const child of asset.root.children) {
      const item = child as THREE.Mesh;
      item.geometry.addEventListener("dispose", () => disposed++);
      (item.material as THREE.Material).addEventListener(
        "dispose",
        () => disposed++,
      );
    }
    asset.dispose();
    asset.dispose();
    assert.equal(disposed, 4, entry.kind);
  }
});

test("the mapped Golden Bridge curve retains its deck and two separated supporting hands on sloping terrain", () => {
  const entry = sites.find((e) => e.kind === "golden-bridge")!,
    path = local(entry.path!, entry);
  const ground = (x: number, z: number) => x * 0.025 + z * 0.012;
  const asset = make(entry, ground);
  try {
    const parts = asset.root.userData.parts as string[];
    assert.equal(parts.filter((p) => p === "cupped_support_palm").length, 2);
    assert.equal(
      parts.filter((p) => p === "four_separate_stone_fingers").length,
      8,
    );
    assert.equal(parts.filter((p) => p === "seven_support_piers").length, 7);
    const curve = new THREE.CatmullRomCurve3(
      path.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      false,
      "centripetal",
    );
    assert(curve.getLength() > 125 && curve.getLength() < 165);
    asset.root.updateMatrixWorld(true);
    for (const t of [0.08, 0.48, 0.94]) {
      const p = curve.getPointAt(t);
      const hit = new THREE.Raycaster(
        new THREE.Vector3(p.x, 60, p.z),
        new THREE.Vector3(0, -1, 0),
      ).intersectObject(asset.root.children[0])[0];
      assert(
        hit && hit.point.y > ground(p.x, p.z) + 4,
        "walking deck is clear of mapped ground",
      );
    }
  } finally {
    asset.dispose();
  }
});

test("the cave mouth keeps a real opening rather than a painted entrance", () => {
  for (const [kind, height, far] of [["phong-nha-cave", 3, 35]] as const) {
    const asset = make(sites.find((e) => e.kind === kind)!);
    try {
      asset.root.updateMatrixWorld(true);
      const hits = new THREE.Raycaster(
        new THREE.Vector3(0, height, 8),
        new THREE.Vector3(0, 0, -1),
        0,
        far,
      ).intersectObject(asset.root.children[0]);
      assert(
        hits.every((h) => h.distance > 25),
        "the front passage stays open",
      );
    } finally {
      asset.dispose();
    }
  }
});

test("hundreds of basalt columns follow the mapped rock boundary and sampled coastal ground", () => {
  const entry = sites.find((e) => e.kind === "ganh-da-dia")!,
    outline = local(entry.footprint!, entry);
  const ground = (x: number, z: number) => 1 + x * 0.008 + z * 0.01;
  const asset = make(entry, ground);
  try {
    assert(
      asset.root.userData.basaltColumns > 300 &&
        asset.root.userData.basaltColumns < 1600,
    );
    const p = (asset.root.children[0] as THREE.Mesh).geometry.getAttribute(
      "position",
    );
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i);
      assert(
        contains(outline, x, z),
        "columns stay clear of adjacent paths and sea",
      );
      assert(
        p.getY(i) >= ground(x, z) - 0.03,
        "columns meet the sampled ground",
      );
    }
  } finally {
    asset.dispose();
  }
});

test("the five actual map locations keep surrounding buildings and near/context ownership intact", () => {
  for (const entry of sites) {
    const data = { ...fixtures.maps[entry.id], center: entry, span: 1 };
    const manager = createLandmarks(data, () => 3),
      far = createLandmarks({ ...data, span: 2200 }, () => 3, 1);
    try {
      assert(manager.list.some((p) => p.id === entry.id));
      assert(
        !far.list.some((p) => p.id === entry.id),
        "no duplicated scene ownership",
      );
      const item = manager.list.find((p) => p.id === entry.id)!;
      assert(
        [item.x, item.z, item.base, item.width, item.depth, item.height].every(
          Number.isFinite,
        ),
      );
      assert(item.width > 0 && item.height > 0 && item.depth > 0);
      const object = manager.root.getObjectByName(entry.name)!;
      assert.match(object.userData.source, /^https:\/\//);
      assert.equal(
        object.userData.approximateAnchor,
        !!entry.approximateAnchor,
      );
      assert(
        data.features
          .filter((f) => f.kind === "building")
          .every((f) => !manager.replaces(f)),
        `${entry.kind} removes neighbouring buildings`,
      );
      manager.apply({ ...INITIAL_SETTINGS, style: "clay", buildings: false });
      assert.equal(manager.root.visible, false);
    } finally {
      manager.dispose();
      far.dispose();
    }
  }
});

test("modeled cave, islets and waterfall replace their generic terrain and water surfaces in both renderers", async () => {
  for (const kind of ["phong-nha-cave", "fighting-cocks", "ban-gioc-falls"]) {
    const entry = sites.find((e) => e.kind === kind)!;
    const data = { ...fixtures.maps[entry.id], center: entry };
    const manager = createLandmarks(data, () => 0);
    const terrain = {
      size: 3,
      heights: [0, 2, 8, 0, 3, 10, 0, 4, 12],
      minimum: 0,
      maximum: 12,
      available: true,
    };
    const city = await buildCity(
      data,
      terrain,
      2026,
      new AbortController().signal,
      () => {},
    );
    const context = await buildContext(data, 0, 2026);
    try {
      assert.equal(manager.surfaceMasks.length, 1, kind);
      const ring = manager.surfaceMasks[0][0],
        xs = ring.map((p) => p[0]),
        zs = ring.map((p) => p[1]);
      for (const object of [
        city.root.getObjectByName("Địa hình"),
        city.root.getObjectByName("water"),
        context.root.getObjectByName("Context_ground"),
        context.root.getObjectByName("Context_water"),
      ]) {
        if (!object) continue;
        object.updateMatrixWorld(true);
        for (let row = 1; row < 5; row++)
          for (let col = 1; col < 5; col++) {
            const x = THREE.MathUtils.lerp(
                Math.min(...xs),
                Math.max(...xs),
                col / 5,
              ),
              z = THREE.MathUtils.lerp(
                Math.min(...zs),
                Math.max(...zs),
                row / 5,
              );
            if (!contains(ring, x, z)) continue;
            const hits: THREE.Intersection[] = new THREE.Raycaster(
              new THREE.Vector3(x, 200, z),
              new THREE.Vector3(0, -1, 0),
            ).intersectObject(object, true);
            assert.equal(
              hits.length,
              0,
              `${kind}: ${object.name} obstructs modeled scenery`,
            );
          }
      }
    } finally {
      city.dispose();
      context.dispose();
      manager.dispose();
    }
  }
});
