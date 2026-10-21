import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import * as THREE from "three";

export function createFinish(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
) {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: 2,
  });
  const composer = new EffectComposer(renderer, target),
    ao = new GTAOPass(scene, camera, 1, 1);
  ao.updateGtaoMaterial({
    radius: 2.4,
    thickness: 0.6,
    samples: 8,
    distanceFallOff: 1,
  });
  ao.updatePdMaterial({ samples: 8, radius: 3 });
  const ink = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      tDepth: { value: ao.depthTexture },
      tNormal: { value: ao.normalTexture },
      ink: { value: 0 },
      outlines: { value: 0.55 },
      pixelScale: { value: 1 },
      cameraNear: { value: camera.near },
      cameraFar: { value: camera.far },
      cameraHeight: { value: 0 },
      texel: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `#include <packing>
      uniform sampler2D tDiffuse, tDepth, tNormal;
      uniform float ink, outlines, pixelScale, cameraNear, cameraFar, cameraHeight;
      uniform vec2 texel; varying vec2 vUv;
      float depthAt(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar); }
      void main() {
        vec3 color = texture2D(tDiffuse, vUv).rgb;
        float depth = depthAt(vUv);
        float distance = max(0.0, depth - abs(cameraHeight) * 0.7);
        float distanceFade = 1.0 - 0.8 * smoothstep(220.0, 1400.0, distance);
        if (ink > 0.5) {
          float light = dot(color, vec3(0.2126, 0.7152, 0.0722));
          float coverage = clamp((0.72 - light) * 0.9, 0.0, 0.65);
          vec2 cell = fract(gl_FragCoord.xy / (2.8 * pixelScale)) - 0.5;
          float radius = sqrt(coverage / 3.14159);
          float dotInk = coverage < 0.02 ? 0.0 : 1.0 - smoothstep(radius - 0.09, radius + 0.09, length(cell));
          float tone = light < 0.3 ? 0.4 : light < 0.54 ? 0.72 : light < 0.78 ? 0.9 : 0.99;
          float screen = mix(0.99, 0.16, dotInk);
          float detail = 1.0 - smoothstep(100.0, 300.0, distance);
          color = vec3(light < 0.18 ? 0.12 : mix(tone, screen, 0.2 * detail));
        }
        if (outlines > 0.001) {
          vec3 normal = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;
          float silhouette = 0.0, crease = 0.0;
          for (int i = 0; i < 4; i++) {
            vec2 offset = i == 0 ? vec2(texel.x, 0.0) : i == 1 ? vec2(-texel.x, 0.0) : i == 2 ? vec2(0.0, texel.y) : vec2(0.0, -texel.y);
            float other = depthAt(vUv + offset);
            silhouette = max(silhouette, smoothstep(0.035, 0.14, (other - depth) / max(1.0, depth)));
            vec3 otherNormal = texture2D(tNormal, vUv + offset).xyz * 2.0 - 1.0;
            crease = max(crease, smoothstep(0.22, 0.65, 1.0 - dot(normal, otherNormal)));
          }
          float edge = max(silhouette, crease * 0.65) * max(ink * 0.5, distanceFade);
          color = mix(color, ink > 0.5 ? vec3(0.09) : vec3(0.16, 0.21, 0.19), edge * outlines * 0.88);
        }
        gl_FragColor = vec4(color, 1.0);
      }`,
  });
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(ao);
  composer.addPass(new OutputPass());
  composer.addPass(ink);
  return {
    resize(width: number, height: number, ratio: number) {
      composer.setPixelRatio(ratio);
      composer.setSize(width, height);
      ao.setSize(
        Math.max(1, Math.round((width * ratio) / 2)),
        Math.max(1, Math.round((height * ratio) / 2)),
      );
      // Reuse full-resolution geometry boundaries while contact shading stays half resolution.
      (
        ao as GTAOPass & { normalRenderTarget: THREE.WebGLRenderTarget }
      ).normalRenderTarget.setSize(
        Math.round(width * ratio),
        Math.round(height * ratio),
      );
      ink.uniforms.pixelScale.value = ratio;
      ink.uniforms.texel.value.set(1 / (width * ratio), 1 / (height * ratio));
    },
    update(style: string, shadows: boolean, outlines: number) {
      ink.uniforms.ink.value = style === "ink" ? 1 : 0;
      ink.uniforms.outlines.value = outlines;
      ao.enabled = shadows || outlines > 0;
      ao.blendIntensity = shadows ? 0.55 : 0;
    },
    render() {
      ink.uniforms.cameraNear.value = camera.near;
      ink.uniforms.cameraFar.value = camera.far;
      ink.uniforms.cameraHeight.value = camera.position.y;
      composer.render();
      if (!scene.getObjectByName("Định hướng bản đồ")?.children.length) return;
      // Map labels are overlays; excluding them from the normal pass avoids quad-shaped shading.
      const layers = camera.layers.mask,
        background = scene.background,
        autoClear = renderer.autoClear;
      camera.layers.set(1);
      scene.background = null;
      renderer.autoClear = false;
      try {
        renderer.clearDepth();
        renderer.render(scene, camera);
      } finally {
        camera.layers.mask = layers;
        scene.background = background;
        renderer.autoClear = autoClear;
      }
    },
    dispose() {
      for (const pass of composer.passes) pass.dispose();
      composer.dispose();
    },
  };
}
