import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { createReveal } from "../lib/scene/reveal.ts";
import { buildContext } from "../lib/scene/context.ts";
import { unproject } from "../lib/geo/coordinates.ts";

function mesh(x: number, base = 10) {
  const geometry = new THREE.BoxGeometry(10, 20, 10);
  geometry.translate(x, base + 10, 0);
  geometry.userData.revealOrigin = [x, base, 0, 5];
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
}

test("new buildings grow in staggered groups while covered and boundary buildings stay still", () => {
  const root = new THREE.Group(), old = mesh(0), boundary = mesh(54), next = mesh(130);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial());
  root.add(old, boundary, next, ground);
  const originals = [old, boundary, next, ground].map((m) => Array.from(m.geometry.getAttribute("position").array));
  const reveal = createReveal();
  assert(reveal.start(root, [[-50, -50, 50, 50]], 100));
  assert.deepEqual(Array.from(old.geometry.getAttribute("position").array), originals[0]);
  assert.deepEqual(Array.from(boundary.geometry.getAttribute("position").array), originals[1]);
  assert.deepEqual(Array.from(ground.geometry.getAttribute("position").array), originals[3]);
  const positions = next.geometry.getAttribute("position");
  assert(Array.from({length: positions.count}, (_, i) => positions.getY(i)).every((y) => Math.abs(y - 10) < 0.0001));
  assert.equal(next.frustumCulled, false);
  for (let time = 116; time <= 500; time += 16) assert(reveal.update(time));
  assert.notDeepEqual(Array.from(positions.array), originals[2]);
  for (let time = 512; time < 1000; time += 16) reveal.update(time);
  assert.equal(reveal.update(1000), false);
  assert.deepEqual(Array.from(positions.array), originals[2]);
  assert.equal(next.frustumCulled, true);
  assert.equal(reveal.update(1100), false);
  [old, boundary, next, ground].forEach((m) => {m.geometry.dispose(); (m.material as THREE.Material).dispose();});
});

test("a long first render cannot swallow the entrance or leave an unbounded render loop", () => {
  const root = new THREE.Group(), object = mesh(120), reveal = createReveal();
  root.add(object);
  const original = Array.from(object.geometry.getAttribute("position").array);
  assert(reveal.start(root, [], 0));
  assert(reveal.update(1000));
  assert.notDeepEqual(Array.from(object.geometry.getAttribute("position").array), original);
  assert.equal(reveal.update(2300), false);
  assert.deepEqual(Array.from(object.geometry.getAttribute("position").array), original);
  object.geometry.dispose(); object.material.dispose();
});

test("canceling a reveal before replacement or export restores exact vertices and original culling", () => {
  const root = new THREE.Group(), object = mesh(120);
  object.frustumCulled = false;
  root.add(object);
  const original = Array.from(object.geometry.getAttribute("position").array), reveal = createReveal();
  assert(reveal.start(root, [], 0));
  reveal.update(400);
  reveal.finish();
  assert.deepEqual(Array.from(object.geometry.getAttribute("position").array), original);
  assert.equal(object.frustumCulled, false);
  assert.equal(reveal.update(500), false);
  root.position.x = -120;
  assert.equal(reveal.start(root, [[-50, -50, 50, 50]], 1000), false);
  object.geometry.dispose(); object.material.dispose();
});

test("mapped walls, roofs and windows share the same base throughout their construction animation", async () => {
  const center = {lat: 16, lon: 108};
  const context = await buildContext({center, span: 400, source: "live", features: [{id: 1, kind: "building", holes: [], tags: {building:"yes",height:"12","roof:shape":"gabled"}, points: [[110,-10],[130,-10],[130,10],[110,10]].map(([x,z])=>unproject(x,z,center))}]}, 100, 2026, () => 5);
  const reveal = createReveal(), originals: [THREE.BufferAttribute, number[]][] = [];
  try {
    context.root.traverse((o) => {if(o instanceof THREE.Mesh && o.geometry.getAttribute("revealOrigin")) {const p=o.geometry.getAttribute("position") as THREE.BufferAttribute; originals.push([p,Array.from(p.array)]);}});
    assert(originals.length >= 2);
    assert(reveal.start(context.root, [[-50,-50,50,50]], 0));
    const bases = new Set<number>();
    originals.forEach(([p])=>{for(let i=0;i<p.count;i++) bases.add(Math.round(p.getY(i)*100));});
    assert.equal(bases.size, 1);
    reveal.finish();
    originals.forEach(([p,source])=>assert.deepEqual(Array.from(p.array),source));
  } finally {reveal.finish();context.dispose();}
});
