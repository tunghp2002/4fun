import * as THREE from "three";

export const eveningStrength = (hour: number) => THREE.MathUtils.smoothstep(hour, 17, 19.5);

export function createIndoorLighting(scene: THREE.Scene) {
  // ponytail: four unshadowed lights bound fragment cost; use clustered lighting for larger lamp-heavy plans.
  const lights = Array.from({length: 4}, () => new THREE.PointLight("#ffac62", 0, 6, 2));
  lights.forEach(light => scene.add(light));
  const box = new THREE.Box3(), center = new THREE.Vector3();
  return {
    update(roots: THREE.Group[], hour: number) {
      const strength = eveningStrength(hour);
      lights.forEach(light => {light.intensity = 0;});
      let index = 0;
      for (const root of roots) {
        if (root.userData.kind !== "lamp") continue;
        root.updateWorldMatrix(true, true);
        let shade: THREE.Mesh | undefined;
        root.traverse(child => {
          if (!(child instanceof THREE.Mesh)) return;
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          for (const material of materials) {
            if (!(material instanceof THREE.MeshStandardMaterial) || !/tela_lamp|shade|fabric/i.test(material.name)) continue;
            material.emissive.set("#ff9b45");
            material.emissiveIntensity = strength * 1.8;
            shade = child;
          }
        });
        if (!shade || index >= lights.length) continue;
        box.setFromObject(shade).getCenter(center);
        lights[index].position.copy(center);
        lights[index].intensity = strength * 35;
        index++;
      }
    },
  };
}
