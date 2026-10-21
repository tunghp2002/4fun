import assert from "node:assert/strict";
import { test } from "node:test";
import { readSaved, saveScenes, type SavedScene } from "../lib/saved.ts";
import { PLACES } from "../lib/places.ts";
import { INITIAL_SETTINGS } from "../lib/types.ts";

test("corrupted saved scenes are rejected or normalized without breaking startup", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let value = "broken";
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => value,
      setItem: (_key: string, text: string) => {
        value = text;
      },
    },
  });
  try {
    assert.deepEqual(readSaved(), []);
    value = JSON.stringify([
      { id: "bad", place: { lat: NaN, lon: 108 }, span: 800, seed: 1 },
      {
        id: "valid",
        place: PLACES[0],
        span: 800,
        seed: 2,
        settings: { style: "bad", hour: 100, heightScale: -20, trees: "no" },
        camera: { position: "bad" },
      },
    ]);
    const saved = readSaved();
    assert.equal(saved.length, 1);
    assert.equal(saved[0].settings.style, "paper");
    assert.equal(saved[0].settings.hour, 18);
    assert.equal(saved[0].settings.heightScale, 0.5);
    assert.equal(saved[0].settings.trees, true);
    assert.equal(saved[0].camera, undefined);
    const records: SavedScene[] = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      place: PLACES[0],
      span: 800,
      seed: 1,
      settings: INITIAL_SETTINGS,
    }));
    saveScenes(records);
    assert.equal(readSaved().length, 12);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
