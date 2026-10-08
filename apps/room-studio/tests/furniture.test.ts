import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CATALOG, initialPlan, validatePlan } from "../lib/model.ts";
import { inspectGLB } from "../lib/assets.ts";

test("modern catalog models are embedded, bounded and compatible with existing plans", () => {
  validatePlan(initialPlan());
  const models = Object.values(CATALOG).filter((v) => v.model);
  assert.ok(models.length >= 24);
  for (const v of models) {
    assert.ok(v.h! > .1 && v.h! < 2.5);
    const file = readFileSync(new URL("../public" + v.model, import.meta.url));
    const doc = inspectGLB(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
    assert.ok(doc.meshes!.length);
    assert.ok(readFileSync(new URL("../public" + v.preview, import.meta.url)).length > 100);
  }
  assert.match(CATALOG.table.name, /stone|marble/i);
  assert.match(CATALOG.desk.name, /metal|white/i);
  assert.doesNotMatch(CATALOG.nightstand.name, /wood/i);
});
