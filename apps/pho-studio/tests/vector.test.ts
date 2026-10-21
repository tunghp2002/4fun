import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseVectorTile } from "../lib/geo/vector.ts";
import { loadMap } from "../lib/geo/data.ts";
import { buildingHeight } from "../lib/geo/coordinates.ts";

test("real Vietnam vector tile yields clipped footprints, holes and open roads with honest height estimates", () => {
  const features = parseVectorTile(
    readFileSync(new URL("./fixtures/saigon-vector.pbf", import.meta.url)),
    13047,
    7698,
  );
  assert(features.some((f) => f.kind === "building"));
  assert(features.some((f) => f.kind === "water"));
  for (const f of features.filter(
    (f) => f.kind === "water" && f.tags.natural === "water",
  ))
    assert.equal(
      typeof f.tags.water,
      "string",
      "river/lake classes survive parsing",
    );
  assert(features.some((f) => f.kind === "road" && f.points.length >= 2));
  assert(features.some((f) => f.holes.length > 0));
  for (const f of features) {
    for (const p of [f.points, ...f.holes].flat()) {
      assert(Number.isFinite(p.lat) && Number.isFinite(p.lon));
      const x = ((p.lon + 180) / 360) * 2 ** 14;
      const y =
        ((1 - Math.asinh(Math.tan((p.lat * Math.PI) / 180)) / Math.PI) / 2) *
        2 ** 14;
      assert(x >= 13047 - 1e-8 && x <= 13048 + 1e-8);
      assert(y >= 7698 - 1e-8 && y <= 7699 + 1e-8);
    }
    if (f.kind === "building")
      assert(buildingHeight(f.tags, f.id, 2026).estimated);
  }
  assert.throws(() => parseVectorTile(new Uint8Array([255, 255, 255]), 0, 0));
});

test("map providers fall back without losing real geometry, cache results and stop on cancellation", async (t) => {
  const center = { lat: 10.7726, lon: 106.6982 },
    controller = new AbortController();
  const geometry = [
    center,
    { lat: center.lat + 0.0001, lon: center.lon },
    { lat: center.lat, lon: center.lon + 0.0001 },
    center,
  ];
  let requests = 0;
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    requests++;
    if (requests <= 2) return new Response("busy", { status: 503 });
    return Response.json({
      elements: [
        {
          id: 42,
          type: "way",
          tags: { building: "yes", height: "12" },
          geometry,
        },
      ],
    });
  });
  const data = await loadMap(center, 300, undefined, controller.signal);
  assert.equal(data.features[0].id, 42);
  assert.equal(data.features[0].tags.height, "12");
  assert.equal(requests, 3);
  assert.equal(
    (await loadMap(center, 300, undefined, controller.signal)).source,
    "cache",
  );
  assert.equal(requests, 3);
  fetch.mock.mockImplementation(async () => {
    requests++;
    controller.abort();
    throw new DOMException("Cancelled", "AbortError");
  });
  await assert.rejects(
    loadMap(
      { ...center, lat: center.lat + 0.001 },
      300,
      undefined,
      controller.signal,
    ),
    { name: "AbortError" },
  );
  assert.equal(requests, 4);
});
