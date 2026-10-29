import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { windowGlow } from "../lib/scene/night.ts";

test("night emission follows the window mask and resets without replacing geometry or materials", () => {
  const geometry = new THREE.PlaneGeometry(),
    material = new THREE.MeshStandardMaterial();
  const positions = geometry.getAttribute("position");
  const mask = [1, 1, 0, 0];
  const glow = windowGlow(material, geometry, mask);
  const shader = {
    uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader,
    fragmentShader: THREE.ShaderLib.standard.fragmentShader,
  } as Parameters<THREE.Material["onBeforeCompile"]>[0];
  try {
    material.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
    assert.deepEqual(Array.from(geometry.getAttribute("windowGlow").array), mask);
    assert.strictEqual(geometry.getAttribute("position"), positions);
    assert.equal(shader.uniforms.windowGlowStrength.value, 0);
    glow(true);
    assert(shader.uniforms.windowGlowStrength.value > 0);
    glow(false);
    assert.equal(shader.uniforms.windowGlowStrength.value, 0);
    assert(shader.vertexShader.includes("varying float vWindowGlow"));
    assert(shader.fragmentShader.includes("totalEmissiveRadiance +="));
  } finally {
    geometry.dispose();
    material.dispose();
  }
});
