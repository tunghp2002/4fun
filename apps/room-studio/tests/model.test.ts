import test from "node:test";
import assert from "node:assert/strict";
import {
  initialPlan,
  addRoom,
  resizeRoom,
  moveRoom,
  placeItem,
  moveItem,
  deriveWalls,
  validatePlan,
  bounds,
  type Plan,
} from "../lib/model.ts";
test("shared-wall resize preserves connections and carries furniture with rooms", () => {
  const p = initialPlan(),
    next = resizeRoom(p, "living", 6.4, 4.2);
  assert.equal(next.rooms.find((r) => r.id === "bedroom")!.x, 6.4);
  assert.equal(next.rooms.find((r) => r.id === "kitchen")!.w, 6.4);
  assert.equal(
    next.items.find((f) => f.kind === "bed")!.x,
    p.items.find((f) => f.kind === "bed")!.x + 1,
  );
  assert.doesNotThrow(() => validatePlan(next));
});
test("rooms and solids cannot overlap or leave their supporting room", () => {
  const p = initialPlan();
  assert.throws(() => moveRoom(p, "bedroom", 1, 1), /overlap/i);
  assert.throws(() => moveItem(p, "sofa", 7, 1), /overlap|fit|door/i);
  assert.throws(
    () => resizeRoom(p, "living", 1.8, 4.2),
    /fit|door|overlap|small/i,
  );
  assert.throws(
    () => addRoom(p, { x: 20, y: 20, w: 3, h: 3 }),
    /connect|shared/i,
  );
  const f = p.items.find((i) => i.id === "sofa")!;
  assert.throws(() => moveItem(p, "coffee", f.x, f.y), /overlap/i);
});
test("new furniture fits and shared walls are single connected segments with door openings", () => {
  const p = initialPlan(),
    next = placeItem(p, "study", "plant");
  assert.equal(next.items.length, p.items.length + 1);
  validatePlan(next);
  const walls = deriveWalls(p);
  assert(
    walls.some((w) => w.negative && w.positive && w.opening?.type === "door"),
  );
  assert.equal(
    new Set(walls.map((w) => `${w.axis}:${w.at}:${w.a}:${w.b}`)).size,
    walls.length,
  );
  for (const f of next.items) {
    const b = bounds(f),
      r = next.rooms.find((r) => r.id === f.roomId)!;
    assert(
      b.x >= r.x &&
        b.y >= r.y &&
        b.x + b.w <= r.x + r.w &&
        b.y + b.h <= r.y + r.h,
    );
  }
});
test("import boundary rejects nonfinite coordinates, unknown assets and excessive geometry", () => {
  for (const mutate of [
    (p: Plan) => {
      p.rooms[0].floor = ["oak"] as never;
    },
    (p: Plan) => {
      p.items[0].kind = ["sofa"] as never;
    },
    (p: Plan) => {
      p.rooms[0].w = Infinity;
    },
    (p: Plan) => {
      p.items[0].kind = "unknown" as never;
    },
    (p: Plan) => {
      p.rooms = Array.from({ length: 25 }, () => ({ ...p.rooms[0] }));
    },
  ]) {
    const p = initialPlan();
    mutate(p);
    assert.throws(() => validatePlan(p));
  }
  assert.equal(
    JSON.stringify(validatePlan(initialPlan())),
    JSON.stringify(initialPlan()),
  );
  assert.throws(() => validatePlan({ version: 99 }));
  assert.doesNotThrow(() =>
    validatePlan(JSON.parse(JSON.stringify(initialPlan()))),
  );
});

test("imported furniture keeps its metadata and uses the same physical placement rules", () => {
  const base = initialPlan();
  const asset = { id: "a".repeat(64), name: "My cabinet", w: 0.6, d: 0.4, h: 1.2, bytes: 512, triangles: 12 };
  const p = validatePlan({ ...base, assets: [asset] });
  const next = placeItem(p, "living", "model", asset.id);
  const item = next.items.at(-1)!;
  assert.equal(item.assetId, asset.id);
  assert.equal(item.h, 1.2);
  assert.deepEqual(next.assets, [asset]);
  assert.throws(() => moveItem(next, item.id, 1.65, 0.85), /overlap/i);
  assert.throws(() => validatePlan({ ...next, assets: [] }), /model|asset|furniture/i);
  assert.equal(JSON.stringify(validatePlan(next)), JSON.stringify(next));
});

test("imported model metadata rejects bad dimensions and excessive scene budgets", () => {
  const asset = { id: "b".repeat(64), name: "Chair", w: 0.6, d: 0.5, h: 0.8, bytes: 512, triangles: 12 };
  for (const patch of [{ h: Infinity }, { bytes: 9 * 1024 * 1024 }, { triangles: 60001 }, { id: "invalid" }])
    assert.throws(() => validatePlan({ ...initialPlan(), assets: [{ ...asset, ...patch }] }));
  assert.throws(() => validatePlan({ ...initialPlan(), assets: [asset, asset] }));
});
