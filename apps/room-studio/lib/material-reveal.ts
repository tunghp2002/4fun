import * as THREE from "three";
export function createMaterialReveal(scene: THREE.Scene, invalidate: () => void) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  type Effect = { original: THREE.Mesh; old: THREE.Mesh; next: THREE.Mesh; radius: { value: number }; max: number; start: number; materials: THREE.Material[]; textures: THREE.Texture[] };
  let effects: Effect[] = [];
  function finish() {
    for (const e of effects) {
      e.original.visible = true;
      scene.remove(e.old, e.next);
      for (const m of e.materials) m.dispose();
      for (const t of e.textures) t.dispose();
    }
    effects = [];
  }
  function snapshot(mesh: THREE.Mesh, floor = false) {
    const old = mesh.clone(), materials: THREE.Material[] = [], textures: THREE.Texture[] = [];
    if (floor) {
      const list = (mesh.material as THREE.Material[]).slice(), top = (list[2] as THREE.MeshStandardMaterial).clone();
      top.map = top.map!.clone(); top.map.needsUpdate = true;
      materials.push(top); textures.push(top.map); list[2] = top; old.material = list;
    }
    return { old, materials, textures };
  }
  function start(mesh: THREE.Mesh, before: ReturnType<typeof snapshot>, origin: THREE.Vector3, max: number, floor = false) {
    if (motion.matches) { for (const m of before.materials) m.dispose(); for (const t of before.textures) t.dispose(); return; }
    const next = mesh.clone(), radius = { value: 0 }, source = (floor ? (mesh.material as THREE.Material[])[2] : mesh.material) as THREE.MeshStandardMaterial,
      material = source.clone();
    material.polygonOffset = true; material.polygonOffsetFactor = -1; material.polygonOffsetUnits = -1;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.revealOrigin = { value: origin }; shader.uniforms.revealRadius = radius;
      shader.vertexShader = "varying vec3 vRevealPosition;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvRevealPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      shader.fragmentShader = "uniform vec3 revealOrigin; uniform float revealRadius; varying vec3 vRevealPosition;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nif (distance(vRevealPosition, revealOrigin) > revealRadius) discard;");
    };
    material.customProgramCacheKey = () => "room-studio-material-spread";
    if (floor) { const list = (mesh.material as THREE.Material[]).slice(); list[2] = material; next.material = list; }
    else next.material = material;
    mesh.visible = false; before.old.name = "material-reveal-old"; next.name = "material-reveal-new";
    scene.add(before.old, next);
    effects.push({ original: mesh, old: before.old, next, radius, max, start: performance.now(), materials: [...before.materials, material], textures: before.textures });
    invalidate();
  }
  function tick() {
    if (!effects.length) return false;
    const now = performance.now();
    let running = false;
    for (const e of effects) {
      const t = Math.min(1, (now - e.start) / 1050);
      e.radius.value = e.max * (t * t * (3 - 2 * t));
      if (t < 1) running = true;
    }
    if (!running) finish();
    return running;
  }
  const change = () => { if (motion.matches) { finish(); invalidate(); } };
  motion.addEventListener("change", change);
  return { snapshot, start, finish, tick, enabled: () => !motion.matches, dispose() { finish(); motion.removeEventListener("change", change); } };
}
