import * as THREE from "three";

// Share one material and geometry; only window vertices emit, with no extra lights or draw calls.
export function windowGlow(
  material: THREE.MeshStandardMaterial,
  geometry: THREE.BufferGeometry,
  mask: ArrayLike<number>,
) {
  geometry.setAttribute("windowGlow", new THREE.Float32BufferAttribute(Array.from(mask), 1));
  const strength = { value: 0 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.windowGlowStrength = strength;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float windowGlow; varying float vWindowGlow;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWindowGlow = windowGlow;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float windowGlowStrength; varying float vWindowGlow;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.57, 0.18) * vWindowGlow * windowGlowStrength;");
  };
  material.customProgramCacheKey = () => "pho-window-glow";
  return (night: boolean) => { strength.value = night ? 1.4 : 0; };
}
