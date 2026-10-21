import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  buildingHeight,
  clipPolygon,
  contains,
  parseCoordinate,
  project,
  unproject,
  readHash,
  shareHash,
} from "../lib/geo/coordinates.ts";
import { parseMap } from "../lib/geo/data.ts";
import { decodeElevation, heightAt, terrainTile } from "../lib/geo/terrain.ts";
import { filterPlaces, PLACES } from "../lib/places.ts";

test("Vietnamese search and shared coordinates round-trip, including zero seed", () => {
  assert.equal(filterPlaces("hoi an", "Tất cả")[0].id, "hoi-an");
  assert.equal(filterPlaces("DA LAT", "Trung")[0].id, "da-lat");
  const center = { lat: 15.8773, lon: 108.3284 };
  assert.deepEqual(
    parseCoordinate("https://maps.google.com/@15.8773,108.3284,17z"),
    center,
  );
  assert.equal(parseCoordinate("javascript:alert(1)"), null);
  assert.equal(parseCoordinate("90, 200"), null);
  assert.deepEqual(readHash(shareHash(center, 800, 0, "Phố cổ Hội An")), {
    center,
    span: 800,
    seed: 0,
    name: "Phố cổ Hội An",
  });
  assert.equal(readHash("#ll=15.8773,108.3284")?.seed, 2026);
  assert.equal(readHash("#ll=15.8773,108.3284&s=999999")?.span, 1800);
  const original = { lat: 15.8782, lon: 108.3297 },
    [x, z] = project(original, center),
    restored = unproject(x, z, center);
  assert(
    Math.abs(original.lat - restored.lat) < 1e-9 &&
      Math.abs(original.lon - restored.lon) < 1e-9,
  );
});
test("polygon clipping preserves a crossing polygon and removes distant geometry", () => {
  const clipped = clipPolygon(
    [
      [-20, -20],
      [20, -20],
      [20, 20],
      [-20, 20],
    ],
    10,
  );
  assert.equal(clipped.length, 4);
  assert(clipped.every((p) => Math.abs(p[0]) <= 10 && Math.abs(p[1]) <= 10));
  assert(contains(clipped, 0, 0));
  assert(!contains(clipped, 20, 0));
  assert.deepEqual(
    clipPolygon(
      [
        [30, 30],
        [40, 30],
        [40, 40],
      ],
      10,
    ),
    [],
  );
});
test("height estimates are deterministic, but measured heights and floor counts win", () => {
  assert.deepEqual(buildingHeight({ height: "30 ft" }, 1, 1), {
    height: 9.144,
    estimated: false,
  });
  assert.equal(
    buildingHeight({ "building:levels": "3" }, 1, 99).height,
    9.600000000000001,
  );
  assert.deepEqual(buildingHeight({}, 55, 7), buildingHeight({}, 55, 7));
  assert.notEqual(
    buildingHeight({}, 55, 7).height,
    buildingHeight({}, 55, 8).height,
  );
  assert(buildingHeight({ height: "nonsense" }, 55, 7).estimated);
});
test("multipolygon members are joined, including reversed segments, without duplicated ways", () => {
  const a = { lat: 16, lon: 108 },
    b = { lat: 16.001, lon: 108 },
    c = { lat: 16.001, lon: 108.001 },
    d = { lat: 16, lon: 108.001 };
  const result = parseMap({
    elements: [
      null,
      {
        type: "way",
        id: 1,
        tags: { building: "yes" },
        geometry: [a, b, c, d, a],
      },
      {
        type: "relation",
        id: 10,
        tags: { building: "yes" },
        members: [
          { type: "way", ref: 1, role: "outer", geometry: [a, b, c] },
          { type: "way", ref: 2, role: "outer", geometry: [a, d, c] },
        ],
      },
    ],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 10);
  assert.equal(result[0].points.length, 5);
  assert.throws(() => parseMap({ elements: "invalid" }));
  assert.deepEqual(
    parseMap({
      elements: [
        null,
        {},
        {
          type: "relation",
          id: 2,
          tags: { building: "yes" },
          members: "invalid",
        },
      ],
    }),
    [],
  );
});
test("all six offline locations contain real, finite map features", () => {
  for (const place of PLACES.filter((p) => p.snapshot)) {
    const payload = JSON.parse(
      readFileSync(
        new URL(`../public/data/${place.id}.json`, import.meta.url),
        "utf8",
      ),
    );
    const features = parseMap(payload);
    assert.equal(payload.license, "ODbL-1.0");
    assert(
      features.some((f) => f.kind === "building"),
      place.id,
    );
    assert(
      features.every((f) =>
        f.points.every((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon)),
      ),
    );
  }
});
test("terrain tiles decode meters and bilinear interpolation stays continuous", () => {
  assert.equal(decodeElevation(128, 5, 128), 5.5);
  const terrain = {
    size: 2,
    heights: [10, 20, 30, 40],
    minimum: 10,
    maximum: 40,
    available: true,
  };
  assert.equal(heightAt(terrain, 100, 0, 0), 15);
  assert.equal(heightAt(terrain, 100, -50, -50), 0);
  assert.equal(heightAt(terrain, 100, 500, 500), 30);
  const tile = terrainTile({ lat: 15.8773, lon: 108.3284 });
  assert(tile.x >= 0 && tile.x < 4096 && tile.y >= 0 && tile.y < 4096);
});
