import test from "node:test";
import assert from "node:assert/strict";
import { validatePlan, initialPlan, deriveWalls, moveItem, resizeRoom, addRoom, CATALOG, levelOf, stairOpening, placeItem, bounds } from "../lib/model.ts";
import { housePlan, interiorOnly } from "../lib/house.ts";

test("furnished two-storey house preserves levels, openings and clear connected circulation", () => {
  const p = validatePlan(housePlan());
  assert.deepEqual(validatePlan(JSON.parse(JSON.stringify(p))), p);
  assert.equal(new Set(p.rooms.map(levelOf)).size, 2);
  assert.equal(p.rooms.filter(r => /bedroom/i.test(r.name)).length, 3);
  for (const kind of ["stairs", "toilet", "shower", "vanity", "washer", "wardrobe", "fridge", "hood", "ac"])
    assert(p.items.some(f => f.kind === kind), kind);
  assert(p.items.length > 50);
  assert(p.rooms.every(r => !r.zone || r.zone === "stairs"));
  assert(p.items.every(f => !["car","carport","condenser","tree","hedge","bench"].includes(f.kind)));
  for (const f of p.items.filter(f => f.kind !== "stairs" && f.kind !== "rug")) assert(CATALOG[f.kind as keyof typeof CATALOG].model, `${f.kind} needs its real source model`);
  const upper = p.rooms.find(r => r.id === "stairs1")!;
  assert(stairOpening(p, upper));
  assert.equal(deriveWalls(p).filter(w => w.opening).length, p.openings!.length);
  assert.deepEqual(validatePlan(initialPlan()), initialPlan());
});

test("levels isolate collisions and edits, while stairs and mounted appliances retain real supports", () => {
  const p = housePlan();
  const f = p.items.find(f => f.id === "master-bed")!;
  assert.throws(() => moveItem(p, f.id, 6.7, 11.8), /room|fit|overlap|door/i);
  const bad = structuredClone(p); bad.rooms.find(r => r.id === "stairs1")!.x += .3;
  assert.throws(() => validatePlan(bad), /stair|overlap/i);
  assert.throws(() => moveItem(p, "living-ac", 3, 10), /wall/i);
  assert.throws(() => moveItem(p, "stair-flight", 8.4, 4), /stair/i);
  const resized = resizeRoom(p, "living", 5.2, 4.8);
  assert.doesNotThrow(() => validatePlan(resized));
  assert.equal(resized.rooms.find(r => r.id === "stairs0")!.x, resized.rooms.find(r => r.id === "stairs1")!.x);
  const added = addRoom(p, {x: 11.4, y: 1.8, w: 3, h: 4.5}, 1);
  assert.equal(levelOf(added.rooms.at(-1)!), 1);
  assert.equal(added.rooms.filter(r => levelOf(r) === 0).length, p.rooms.filter(r => levelOf(r) === 0).length);
});

test("untrusted house imports reject invalid levels, disconnected floors and orphan openings", () => {
  for (const mutate of [
    (p: ReturnType<typeof housePlan>) => {p.rooms[0].level = .5;},
    (p: ReturnType<typeof housePlan>) => {p.openings![0].at = 50;},
    (p: ReturnType<typeof housePlan>) => {p.rooms.find(r => r.id === "stairs1")!.zone = undefined;},
    (p: ReturnType<typeof housePlan>) => {p.items.find(f => f.kind === "wardrobe")!.w = 20;},
  ]) {const p = housePlan(); mutate(p); assert.throws(() => validatePlan(p));}
  assert(CATALOG.ac.mount! > 2);
});

test("removing an old exterior preserves indoor edits and model backups", () => {
  const p=housePlan(); p.rooms.push({id:"garden",name:"Old garden",x:11.4,y:1.8,w:3,h:11.1,level:0,zone:"garden",paint:"linen",floor:"grass"});
  p.items.push({id:"old-tree",kind:"tree",roomId:"garden",x:12.9,y:4,w:1.5,d:1.5,rotation:0});
  p.paths=[{x:12,y:8,w:1,h:2}];
  const next=interiorOnly(validatePlan(p));
  assert.deepEqual(next.rooms,housePlan().rooms);
  assert.deepEqual(next.items,housePlan().items);
  assert.equal(next.paths,undefined);
  assert.equal(p.rooms.length,next.rooms.length+1);
  assert.equal(interiorOnly(next),next);
});

test("wall fixtures leave glazing clear and placement finds a free supported wall", () => {
  const p=housePlan();
  for(const f of p.items.filter(f=>CATALOG[f.kind as keyof typeof CATALOG].layer==="wall")) assert.doesNotThrow(()=>moveItem(p,f.id,f.x,f.y),f.id);
  assert.throws(()=>moveItem(p,"living-tv",4.2,12.78),/opening|window/i);
  const ac=p.items.find(f=>f.id==="living-ac")!, duplicate={...ac,id:"duplicate-ac"};
  const withDuplicate={...p,items:[...p.items,duplicate]};
  assert.throws(()=>moveItem(withDuplicate,duplicate.id,ac.x,ac.y),/overlap|space/i);
  const placed=placeItem(p,"living","ac");
  assert.equal(placed.items.length,p.items.length+1);
  assert.doesNotThrow(()=>validatePlan(placed));
});


test("four-resident layout separates a double bedroom from furnished single bedrooms and colocates upstairs wet areas", () => {
  const p=validatePlan(housePlan());
  const room=(id:string)=>p.rooms.find(r=>r.id===id)!;
  const furniture=(id:string)=>p.items.filter(f=>f.roomId===id);
  const master=room("master");
  assert.match(master.name,/2 people/);
  const double=furniture("master").find(f=>f.id==="master-bed")!;
  assert.equal(double.kind,"doubleBed");
  assert(double.w>=1.8);
  assert.equal(furniture("master").filter(f=>f.kind==="nightstand").length,2);
  for(const id of ["bed2","bed3"]) {
    const r=room(id), pieces=furniture(id);
    assert.match(r.name,/1 person/);
    assert(master.w*master.h>r.w*r.h);
    assert(pieces.find(f=>f.kind==="bed")!.w<=1.2);
    for(const kind of ["bed","desk","wardrobe"]) assert(pieces.some(f=>f.kind===kind),id+kind);
  }
  for(const id of ["bath1","ensuite"]) {
    assert.equal(levelOf(room(id)),1);
    for(const kind of ["toilet","shower","vanity","mirror"]) assert(furniture(id).some(f=>f.kind===kind),id+kind);
  }
  const laundry=room("laundry"), bath=room("bath1");
  assert.equal(levelOf(laundry),1);
  assert.equal(laundry.y,bath.y);
  assert.equal(bath.x+bath.w,laundry.x);
  assert(furniture("laundry").some(f=>f.kind==="washer"));
  assert(furniture("wc0").some(f=>f.kind==="toilet"));
  assert.equal(furniture("wc0").some(f=>f.kind==="shower"),false);
  const door=deriveWalls(p).find(w=>w.opening?.type==="door"&&new Set([w.positive,w.negative]).has("ensuite"));
  assert(door&&[door.positive,door.negative].includes("master"),"ensuite access belongs to the double bedroom");
  assert(p.items.find(f=>f.id==="kitchen-counter")!.w>=3.5,"four-person kitchen needs preparation and storage capacity");
});


test("preset wardrobes, sanitary fixtures and washer have clear working space in front",()=>{
  const p=housePlan();
  for(const f of p.items.filter(f=>["toilet","vanity","shower","washer","wardrobe"].includes(f.kind))) {
    const b=bounds(f),depth=f.kind==="wardrobe"?.8:.7, width=Math.max(f.w,.7);
    const front=f.rotation===0?{x:f.x-width/2,y:b.y+b.h,w:width,h:depth}:
      f.rotation===180?{x:f.x-width/2,y:b.y-depth,w:width,h:depth}:
      f.rotation===90?{x:b.x-depth,y:f.y-width/2,w:depth,h:width}:
      {x:b.x+b.w,y:f.y-width/2,w:depth,h:width};
    const r=p.rooms.find(r=>r.id===f.roomId)!;
    assert(front.x>=r.x&&front.y>=r.y&&front.x+front.w<=r.x+r.w+.002&&front.y+front.h<=r.y+r.h+.002, f.id+" working space inside room");
    for(const other of p.items.filter(o=>o.id!==f.id&&o.roomId===f.roomId&&o.kind!=="rug"&&CATALOG[o.kind as keyof typeof CATALOG].layer!=="wall")) {
      const q=bounds(other),overlap=front.x<q.x+q.w-.002&&front.x+front.w>q.x+.002&&front.y<q.y+q.h-.002&&front.y+front.h>q.y+.002;
      assert.equal(overlap,false,f.id+" front blocked by "+other.id);
    }
  }
});
