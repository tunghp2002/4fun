import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { PLACES, PROVINCES, filterPlaces } from "../lib/places.ts";
import {
  isVietnam,
  isOffshore,
  parseCoordinate,
  readHash,
  shareHash,
} from "../lib/geo/coordinates.ts";
import { loadMap, searchPlaces } from "../lib/geo/data.ts";
import { readSaved, saveScenes } from "../lib/saved.ts";
import { INITIAL_SETTINGS } from "../lib/types.ts";
import { waterElevation } from "../lib/scene/elevation.ts";
import { unproject } from "../lib/geo/coordinates.ts";
import { buildCity } from "../lib/scene/model.ts";

test("nationwide catalog covers all 34 province names, three regions and both offshore archipelagos without breaking the six snapshots", () => {
  assert.equal(PLACES.length, 50);
  const photos = JSON.parse(
    readFileSync(
      new URL("../public/photos/credits.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(PROVINCES.length, 34);
  assert.equal(new Set(PLACES.map((p) => p.id)).size, PLACES.length);
  assert.deepEqual(
    PLACES.filter((p) => p.snapshot).map((p) => p.id),
    ["hoi-an", "ho-guom", "sai-gon", "hue", "da-lat", "da-nang"],
  );
  for (const p of PLACES) {
    assert(isVietnam(p), p.id);
    const photo = photos[p.id];
    assert(photo, `real photo credit for ${p.id}`);
    assert(photo.src.startsWith("/photos/"));
    assert(photo.author && photo.license);
    assert(new URL(photo.source).protocol === "https:");
    assert(new URL(photo.licenseUrl).protocol === "https:");
    assert(
      readFileSync(new URL(`../public${photo.src}`, import.meta.url)).length >
        0,
    );
    assert(p.span >= 300 && p.span <= 1800);
    assert(p.province);
    assert(["Bắc", "Trung", "Nam"].includes(p.region));
  }
  assert.equal(filterPlaces("", "Biển đảo").length, 8);
  assert(filterPlaces("hoang sa", "Tất cả").some((p) => p.id === "hoang-sa"));
  assert(
    filterPlaces("truong sa", "Biển đảo").some((p) => p.id === "truong-sa"),
  );
  assert.equal(filterPlaces("binh dinh", "Tất cả")[0].id, "quy-nhon");
  assert(filterPlaces("ha giang", "Tất cả").some((p) => p.id === "dong-van"));
  assert(filterPlaces("dak nong", "Tất cả").some((p) => p.id === "da-lat"));
  assert(
    filterPlaces("", "Tất cả", "Quảng Ninh").every(
      (p) => p.province === "Quảng Ninh",
    ),
  );
  assert.equal(filterPlaces("", "Tất cả", "Quảng Ninh").length, 2);
});

test("offshore coordinates survive parsing, shared links and saved views; invalid coordinates remain rejected", (t) => {
  const stores = new Map<string, string>();
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => stores.get(key) ?? null,
      setItem: (key: string, value: string) => stores.set(key, value),
    },
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  const islands = PLACES.filter((p) =>
    ["hoang-sa", "truong-sa", "phu-quoc", "con-dao"].includes(p.id),
  );
  for (const p of islands) {
    const point = { lat: p.lat, lon: p.lon };
    assert.deepEqual(parseCoordinate(`${p.lat}, ${p.lon}`), point);
    assert.deepEqual(readHash(shareHash(p, 1500, 0, p.name))?.center, point);
  }
  assert(isOffshore(islands.find((p) => p.id === "hoang-sa")!));
  assert(isOffshore({ lat: 6.8, lon: 114.3 }));
  assert(!isVietnam({ lat: 8, lon: 120 }));
  assert(!isVietnam({ lat: 30, lon: 106 }));
  assert(!isVietnam({ lat: NaN, lon: 112 }));
  assert.equal(parseCoordinate("Infinity,111"), null);
  saveScenes(
    islands.map((place, i) => ({
      id: String(i),
      place,
      span: 1500,
      seed: 2026,
      settings: INITIAL_SETTINGS,
    })),
  );
  assert.equal(readSaved().length, islands.length);
});

test("a new preset uses live tiles directly and an empty mapped area renders real terrain without inventing buildings", async (t) => {
  const requested: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    requested.push(url);
    if (url === "https://tiles.openfreemap.org/planet")
      return Response.json({
        tiles: ["https://tiles.openfreemap.org/planet/test/{z}/{x}/{y}.pbf"],
      });
    if (url.includes("tiles.openfreemap.org/planet/"))
      return new Response(new Uint8Array([]));
    throw new Error(`unexpected request ${url}`);
  });
  const preset = PLACES.find((p) => p.id === "hoang-sa")!;
  const data = await loadMap(
    preset,
    preset.span,
    preset,
    new AbortController().signal,
  );
  assert.equal(data.source, "live");
  assert.equal(data.provider, "vector");
  assert.equal(data.features.length, 0);
  assert(
    requested.every((url) => !url.startsWith("/data/")),
    "new entries have no fictitious bundled snapshot request",
  );
  const city = await buildCity(
    data,
    { size: 2, heights: [0, 2, 3, 5], minimum: 0, maximum: 5, available: true },
    2026,
    new AbortController().signal,
    () => {},
  );
  try {
    assert.equal(city.stats.buildings, 0);
    assert.equal(city.stats.roads, 0);
    assert(city.ground.geometry.getAttribute("position").count > 0);
  } finally {
    city.dispose();
  }
});

test("remote geographic search includes the eastern island envelope and keeps returned offshore locations usable", async (t) => {
  let requested = "";
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    requested = String(input);
    return Response.json({
      features: [
        {
          geometry: { coordinates: [114.3, 10.2] },
          properties: { osm_id: 123, name: "Điểm đảo", countrycode: "VN" },
        },
      ],
    });
  });
  const matches = await searchPlaces(
    "mot diem dao rieng",
    new AbortController().signal,
  );
  assert.equal(new URL(requested).searchParams.get("bbox"), "102,6,117.5,23.6");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].lon, 114.3);
  assert(isVietnam(matches[0]));
});

test("river surfaces reject DEM peaks inside their footprint when expanding to delta scenes", async () => {
  const { unproject } = await import("../lib/geo/coordinates.ts");
  const center = { lat: 10.03, lon: 105.79 },
    p = (x: number, z: number) => unproject(x, z, center);
  const city = await buildCity(
    {
      center,
      span: 300,
      source: "live",
      features: [
        {
          id: 1,
          kind: "water",
          tags: { natural: "water", water: "river" },
          points: [p(-130, -100), p(130, -100), p(130, 100), p(-130, 100)],
          holes: [],
        },
      ],
    },
    {
      size: 9,
      heights: Array.from({ length: 81 }, (_, i) => (i === 40 ? 30 : 0)),
      minimum: 0,
      maximum: 30,
      available: true,
    },
    2026,
    new AbortController().signal,
    () => {},
  );
  try {
    const water = city.root.getObjectByName("water")!
      .children[0] as import("three").Mesh;
    const pos = water.geometry.getAttribute("position");
    for (let i = 0; i < pos.count; i++)
      assert(Math.abs(pos.getY(i) - 0.5) < 0.00001);
  } finally {
    city.dispose();
  }
});

test("coastal water leveling preserves the terrain of an island inside its water polygon", () => {
  const center = { lat: 10.2, lon: 103.96 },
    p = (x: number, z: number) => unproject(x, z, center);
  const elevation = waterElevation(
    {
      center,
      span: 400,
      source: "live",
      features: [
        {
          id: 1,
          kind: "water",
          tags: { natural: "water", water: "ocean" },
          points: [p(-200, -200), p(200, -200), p(200, 200), p(-200, 200)],
          holes: [[p(-60, -60), p(60, -60), p(60, 60), p(-60, 60)]],
        },
      ],
    },
    (x, z) => (Math.abs(x) < 60 && Math.abs(z) < 60 ? 18 : 0),
  );
  assert.equal(elevation(0, 0), 18);
  assert.equal(elevation(100, 100), 0);
});
