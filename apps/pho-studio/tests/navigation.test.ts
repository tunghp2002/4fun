import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  contextSpan,
  MAX_TRAVEL_DISTANCE,
  pinScale,
  rebaseCamera,
  travelCenter,
} from "../lib/scene/navigation.ts";
import {
  isVietnam,
  isOffshore,
  project,
  unproject,
} from "../lib/geo/coordinates.ts";
import { loadVectorMap } from "../lib/geo/vector.ts";
import { buildContext } from "../lib/scene/context.ts";
import { loadTerrain } from "../lib/geo/terrain.ts";
import { cameraNear } from "../lib/scene/camera.ts";
import { roadJoins } from "../lib/scene/roads.ts";

test("travel starts before the local boundary and rebasing preserves geographic camera endpoints, altitude and view", () => {
  const from = { lat: 21.0287, lon: 105.8521 };
  assert.equal(travelCenter(from, 1100, 100, -200), null);
  const to = travelCenter(from, 1100, 350, -50)!;
  assert(to);
  assert(isVietnam({ lat: 14, lon: 110.5 }));
  assert(isOffshore({ lat: 14, lon: 110.5 }));
  const state = {
    position: [460, 180, 230] as [number, number, number],
    target: [350, 35, -50] as [number, number, number],
    focal: 35,
    view: "overview" as const,
  };
  for (const destination of [to, { lat: 10.7756, lon: 106.703 }]) {
    const moved = rebaseCamera(state, from, destination, -27);
    assert.equal(moved.view, state.view);
    assert.equal(moved.focal, state.focal);
    for (const key of ["position", "target"] as const) {
      const before = unproject(state[key][0], state[key][2], from),
        after = unproject(moved[key][0], moved[key][2], destination);
      assert(Math.abs(before.lat - after.lat) < 1e-10);
      assert(Math.abs(before.lon - after.lon) < 1e-10);
      assert.equal(moved[key][1], state[key][1] - 27);
    }
  }
  assert(
    Math.hypot(...project({ lat: 21.0287, lon: 105.8521 }, from)) <
      MAX_TRAVEL_DISTANCE,
  );
});

test("zoom covers the country while pins stay compact at street and city distances", () => {
  assert.equal(contextSpan(45, 50, 1.6), 2200);
  assert(contextSpan(5000, 50, 1.6) > 2200);
  assert(contextSpan(1_500_000, 50, 1.6) >= 2_000_000);
  assert(contextSpan(100_000_000, 50, 1.6) <= 4_000_000);
  for (const distance of [10, 100, 500, 1000, 4000]) {
    const scale = pinScale(distance, 50, 800);
    assert(scale >= 0.035 && scale <= 1.6);
    if (distance >= 100 && distance <= 1000) {
      const px =
        (18 * scale) / ((2 * distance * Math.tan((25 * Math.PI) / 180)) / 800);
      assert(Math.abs(px - 18) < 0.01);
    }
  }
  assert(cameraNear(500_000) >= 1000);
  assert(
    roadJoins(
      [
        [0, 0],
        [10000, 0],
      ],
      1000,
      100,
    ).every((r) => r.length === 12),
  );
  assert(
    roadJoins(
      [
        [0, 0],
        [10000, 0],
      ],
      1000,
    ).every((r) => r.length > 100),
  );
});

test("city zooms retain building tiles, country requests stay bounded and cache hits honor aborts", async (t) => {
  const requested: string[] = [];
  let active = 0,
    peak = 0,
    buildings = false;
  const fixture = readFileSync(
    new URL("./fixtures/saigon-vector.pbf", import.meta.url),
  );
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    requested.push(url);
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 0));
    active--;
    return url === "https://tiles.openfreemap.org/planet"
      ? Response.json({
          tiles: [
            "https://tiles.openfreemap.org/planet/navigation/{z}/{x}/{y}.pbf",
          ],
        })
      : new Response(
          buildings && /\/14\//.test(url) ? fixture : new Uint8Array([]),
        );
  });
  const center = { lat: 16.123, lon: 108.234 };
  for (const span of [800, 2200, 4400, 10000, 100000, 2_000_000, 4_000_000]) {
    const start = requested.length;
    const result = await loadVectorMap(
      center,
      span,
      new AbortController().signal,
    );
    assert.equal(result.span, span);
    assert(
      requested.slice(start).filter((u) => u.endsWith(".pbf")).length <=
        (span <= 4400 ? 9 : span <= 35200 ? 13 : 4),
    );
  }
  assert(peak <= 4, `too many simultaneous tile requests: ${peak}`);
  buildings = true;
  const city = await loadVectorMap(
    { lat: 21.0287, lon: 105.8521 },
    8800,
    new AbortController().signal,
  );
  assert(
    city.features.some((f) => f.kind === "building"),
    "zooming out cannot discard the high-resolution city houses",
  );
  buildings = false;
  await loadVectorMap(center, 800, new AbortController().signal);
  const count = requested.length;
  await loadVectorMap(
    { ...center, lat: center.lat + 0.000001 },
    800,
    new AbortController().signal,
  );
  assert.equal(requested.length, count);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadVectorMap(center, 800, controller.signal), {
    name: "AbortError",
  });
  assert.equal(requested.length, count);
  assert(
    requested.some((url) => /\/[0-9]\/[0-9]+\/[0-9]+\.pbf$/.test(url)),
    "country tiles have lower zoom",
  );
});

test("country terrain is bounded to a few decoded tiles and reuses pixels on nearby pans", async (t) => {
  let requests = 0;
  const documentBefore = Object.getOwnPropertyDescriptor(
      globalThis,
      "document",
    ),
    bitmapBefore = Object.getOwnPropertyDescriptor(
      globalThis,
      "createImageBitmap",
    );
  const pixels = new Uint8ClampedArray(256 * 256 * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels[i] = 128;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => ({
        getContext: () => ({
          drawImage() {},
          getImageData: () => ({ data: pixels }),
        }),
      }),
    },
  });
  Object.defineProperty(globalThis, "createImageBitmap", {
    configurable: true,
    value: async () => ({ close() {} }),
  });
  t.after(() => {
    if (documentBefore)
      Object.defineProperty(globalThis, "document", documentBefore);
    else Reflect.deleteProperty(globalThis, "document");
    if (bitmapBefore)
      Object.defineProperty(globalThis, "createImageBitmap", bitmapBefore);
    else Reflect.deleteProperty(globalThis, "createImageBitmap");
  });
  t.mock.method(globalThis, "fetch", async () => {
    requests++;
    return new Response(new Uint8Array([]));
  });
  const center = { lat: 16, lon: 108 };
  const result = await loadTerrain(
    center,
    4_000_000,
    new AbortController().signal,
  );
  assert(result.available);
  assert(requests > 0 && requests <= 4);
  const count = requests;
  await loadTerrain(
    { ...center, lat: 16.000001 },
    4_000_000,
    new AbortController().signal,
  );
  assert.equal(requests, count);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadTerrain(center, 4_000_000, controller.signal), {
    name: "AbortError",
  });
});

test("a country-size context keeps ground triangulation bounded and finite", async () => {
  const context = await buildContext(
    {
      center: { lat: 16, lon: 108 },
      span: 4_000_000,
      features: [],
      source: "live",
    },
    1100,
    2026,
  );
  try {
    const ground = context.root.getObjectByName(
      "Context_ground",
    ) as import("three").Mesh;
    assert(ground);
    const positions = ground.geometry.getAttribute("position");
    assert(positions.count < 100_000);
    assert([...positions.array].every(Number.isFinite));
    assert(context.root.getObjectByName("Đường viền Việt Nam"));
    assert.equal(
      context.root.getObjectByName("Định hướng bản đồ")?.userData.screenOnly,
      true,
    );
  } finally {
    context.dispose();
  }
});
