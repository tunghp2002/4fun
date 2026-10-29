import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { createFinish } from "../lib/scene/finish.ts";

test("postprocessing retains live render targets instead of cloning their textures", () => {
  const warnings: unknown[][] = [],
    warn = console.warn;
  console.warn = (...args) => warnings.push(args);
  const renderer = {
    getPixelRatio: () => 1,
    getSize: (target: THREE.Vector2) => target.set(800, 600),
  } as THREE.WebGLRenderer;
  try {
    const finish = createFinish(renderer, new THREE.Scene(), new THREE.PerspectiveCamera());
    try {
      finish.resize(800, 600, 1.5);
      for (const style of ["pixel", "paper", "clay", "ink"] as const)
        finish.update(style, false, 0);
      assert.equal(warnings.length, 0, "render-target cloning nulls the surface texture");
    } finally {
      finish.dispose();
    }
  } finally {
    console.warn = warn;
  }
});
