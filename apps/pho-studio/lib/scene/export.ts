import * as THREE from "three";
import type { Stage } from "./stage";

export type ExportFormat = "png" | "glb" | "obj" | "svg";
function visibleModel(source: THREE.Group) {
  const clone = source.clone(true),
    hidden: THREE.Object3D[] = [];
  clone.traverse((object) => {
    if (!object.visible || object.userData.screenOnly) hidden.push(object);
  });
  for (const object of hidden) object.removeFromParent();
  return clone;
}
function expanded(source: THREE.Group) {
  const clone = visibleModel(source),
    instances: THREE.InstancedMesh[] = [];
  clone.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) instances.push(object);
  });
  for (const instance of instances) {
    const group = new THREE.Group();
    group.position.copy(instance.position);
    group.quaternion.copy(instance.quaternion);
    group.scale.copy(instance.scale);
    for (let i = 0; i < instance.count; i++) {
      const mesh = new THREE.Mesh(instance.geometry, instance.material),
        matrix = new THREE.Matrix4();
      instance.getMatrixAt(i, matrix);
      mesh.applyMatrix4(matrix);
      if (instance.instanceColor) {
        const color = new THREE.Color();
        instance.getColorAt(i, color);
        mesh.userData.instanceColor = color.getHex();
      }
      group.add(mesh);
    }
    instance.parent?.add(group);
    instance.removeFromParent();
  }
  clone.updateMatrixWorld(true);
  return clone;
}
export async function exportScene(
  stage: Stage,
  format: ExportFormat,
  width: number,
  title: string,
): Promise<Blob> {
  if (format === "png") return stage.png(width, title);
  const model = stage.getModel();
  if (!model) throw new Error("Hãy đợi cảnh dựng xong.");
  if (format === "glb") {
    const { GLTFExporter } = await import(
      "three/addons/exporters/GLTFExporter.js"
    );
    const binary = await new GLTFExporter().parseAsync(visibleModel(model), {
      binary: true,
      onlyVisible: true,
    });
    if (!(binary instanceof ArrayBuffer))
      throw new Error("Không xuất được GLB.");
    return new Blob([binary], { type: "model/gltf-binary" });
  }
  const clone = expanded(model);
  if (format === "obj") {
    const { OBJExporter } = await import(
      "three/addons/exporters/OBJExporter.js"
    );
    return new Blob(
      [
        `# ${title}\n# Map data: (c) OpenStreetMap contributors, ODbL-1.0\n# Vector tiles: (c) OpenMapTiles / OpenFreeMap\n# Elevation: Mapzen Terrain Tiles\n`,
        new OBJExporter().parse(clone),
      ],
      { type: "text/plain;charset=utf-8" },
    );
  }
  const { SVGRenderer } = await import("three/addons/renderers/SVGRenderer.js");
  const renderer = new SVGRenderer(),
    height = Math.round(width / stage.camera.aspect),
    materials: THREE.Material[] = [];
  renderer.setSize(width, height);
  renderer.setQuality("high");
  renderer.setPrecision(2);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#faf8f0");
  scene.add(clone);
  clone.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const convert = (source: THREE.Material) => {
      const color =
        "color" in source
          ? (source.color as THREE.Color).clone()
          : new THREE.Color("#ffffff");
      if (typeof object.userData.instanceColor === "number")
        color.multiply(new THREE.Color(object.userData.instanceColor));
      const material = new THREE.MeshBasicMaterial({
        color,
        vertexColors: "vertexColors" in source && !!source.vertexColors,
        side: THREE.DoubleSide,
      });
      materials.push(material);
      return material;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(convert)
      : convert(object.material);
  });
  try {
    renderer.render(scene, stage.camera);
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    label.setAttribute("x", String(-width / 2 + 20));
    label.setAttribute("y", String(height / 2 - 18));
    label.setAttribute("font-size", String(Math.max(12, width / 120)));
    label.setAttribute("font-family", "sans-serif");
    label.setAttribute("fill", "#344b3d");
    label.textContent = `${title} · © OpenStreetMap contributors · © OpenMapTiles / OpenFreeMap · Mapzen Terrain`;
    renderer.domElement.append(label);
    return new Blob(
      [new XMLSerializer().serializeToString(renderer.domElement)],
      { type: "image/svg+xml;charset=utf-8" },
    );
  } finally {
    materials.forEach((m) => m.dispose());
  }
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
