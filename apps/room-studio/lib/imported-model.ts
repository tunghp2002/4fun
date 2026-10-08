import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { inspectGLB } from "./assets";
export async function decodeModel(data: ArrayBuffer) {
  inspectGLB(data);
  const draco = new DRACOLoader().setDecoderPath("/decoders/draco/").setWorkerLimit(2);
  try {
    const gltf = await new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder).parseAsync(data, "");
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    let triangles = 0, meshes = 0, pixels = 0;
    for (const scene of gltf.scenes)
      scene.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        geometries.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          materials.add(m);
          for (const v of Object.values(m)) if (v instanceof THREE.Texture) textures.add(v);
        }
      });
    const dispose = () => {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      const images = new Set<ImageBitmap>();
      for (const t of textures) { if (typeof ImageBitmap !== "undefined" && t.image instanceof ImageBitmap) images.add(t.image); t.dispose(); }
      for (const image of images) image.close();
    };
    try {
      const sceneHelpers: THREE.Object3D[] = [];
      gltf.scene.traverse((o) => {
        if (o instanceof THREE.Light || o instanceof THREE.Camera) sceneHelpers.push(o);
        if (o instanceof THREE.Mesh) {
          meshes++; triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
          const materials=Array.isArray(o.material)?o.material:[o.material];
          o.castShadow=!materials.some(m=>m.transparent && m.opacity<.5);o.receiveShadow=true;
          for(const m of materials) if(m.transparent) m.depthWrite=false;
        }
      });
      for (const helper of sceneHelpers) helper.removeFromParent();
      for (const t of textures) {
        const image = t.image as { width?: number; height?: number } | undefined;
        if (!image || !image.width || !image.height || image.width > 4096 || image.height > 4096) throw Error("Use model textures no larger than 4096 × 4096 pixels.");
        pixels += image.width * image.height;
      }
      if (!meshes || meshes > 64 || triangles > 60000 || pixels > 8 * 1024 * 1024 || materials.size > 32)
        throw Error("This model is too heavy. Use up to 60,000 triangles, 64 meshes and 8 million texture pixels.");
      const b = new THREE.Box3().setFromObject(gltf.scene), size = b.getSize(new THREE.Vector3()), center = b.getCenter(new THREE.Vector3());
      if ([size.x, size.y, size.z].some((n) => !Number.isFinite(n) || n < .00001)) throw Error("This model needs non-zero width, depth and height.");
      const inner = new THREE.Group(), root = new THREE.Group();
      inner.position.set(-center.x, -b.min.y, -center.z);
      inner.add(gltf.scene);
      root.add(inner); root.scale.set(1 / size.x, 1 / size.y, 1 / size.z);
      const normalized = new THREE.Group(); normalized.add(root);
      const factor = Math.max(size.x, size.y, size.z) > 4 ? 1.2 / Math.max(size.x, size.y, size.z) : 1;
      const dimension = (n: number, min: number) => Math.round(Math.max(min, Math.min(4, n * factor)) * 100) / 100;
      return { root: normalized, triangles, w: dimension(size.x, .2), d: dimension(size.z, .2), h: dimension(size.y, .05), dispose };
    } catch (e) { dispose(); throw e; }
  } finally { draco.dispose(); }
}
