import test from "node:test";
import assert from "node:assert/strict";
import { inspectGLB } from "../lib/assets.ts";
function file(patch = {}) {
  const json = new TextEncoder().encode(JSON.stringify({ asset: { version: "2.0" }, buffers: [{ byteLength: 0 }], meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }], accessors: [{ count: 3 }], ...patch }));
  const n = Math.ceil(json.length / 4) * 4, data = new ArrayBuffer(20 + n), view = new DataView(data);
  view.setUint32(0, 0x46546c67, true); view.setUint32(4, 2, true); view.setUint32(8, data.byteLength, true); view.setUint32(12, n, true); view.setUint32(16, 0x4e4f534a, true);
  const bytes = new Uint8Array(data); bytes.fill(32, 20); bytes.set(json, 20); return data;
}
test("GLB boundary rejects external resources, malformed containers and heavy or animated models", () => {
  assert.doesNotThrow(() => inspectGLB(file()));
  assert.throws(() => inspectGLB(new ArrayBuffer(20)), /GLB/i);
  assert.throws(() => inspectGLB(file({ buffers: [{ uri: "https://elsewhere/model.bin" }] })), /embedded|self-contained/i);
  assert.throws(() => inspectGLB(file({ images: [{ uri: "../texture.png" }] })), /embedded|self-contained/i);
  assert.throws(() => inspectGLB(file({ accessors: [{ count: 180003 }] })), /heavy|triangles/i);
  assert.throws(() => inspectGLB(file({ animations: [{}] })), /static/i);
  assert.throws(() => inspectGLB(file({ extensionsRequired: ["KHR_texture_basisu"] })), /texture/i);
});
