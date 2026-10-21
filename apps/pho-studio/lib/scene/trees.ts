import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { random } from "../geo/coordinates";

export interface SceneTree {
  x: number;
  z: number;
  h: number;
  radius: number;
  tone: number;
  conifer?: boolean;
}

// Close foliage follows the camera; the rest retain a smaller, branched silhouette.
const CLOSE_TREES = 96;
const CLUSTERS = 10;

export function createTrees(
  trees: SceneTree[],
  height: (x: number, z: number) => number,
  seed: number,
  distant = false,
) {
  const root = new THREE.Group();
  root.name = "Tan_la_va_canh";
  const rnd = random(seed),
    pieces: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.OctahedronGeometry(1, 0);
    leaf.scale(0.2 + rnd() * 0.2, 0.07, 0.38 + rnd() * 0.22);
    leaf.rotateZ((rnd() - 0.5) * 1.5);
    leaf.rotateY(rnd() * Math.PI * 2);
    const angle = i * 2.39996,
      radius = Math.sqrt((i + 0.5) / 8) * 0.8;
    leaf.translate(
      Math.cos(angle) * radius,
      (rnd() - 0.5) * 0.65,
      Math.sin(angle) * radius,
    );
    pieces.push(leaf);
  }
  for (let i = 0; i < 5; i++) {
    const core = new THREE.IcosahedronGeometry(0.38 + rnd() * 0.08, 1);
    const angle = i * 2.39996,
      spread = i ? 0.5 : 0;
    core.scale(1, 0.8 + rnd() * 0.4, 1);
    core.rotateY(angle);
    core.translate(
      Math.cos(angle) * spread,
      (rnd() - 0.5) * 0.45,
      Math.sin(angle) * spread,
    );
    pieces.push(core);
  }
  const fineGeometry = mergeGeometries(pieces)!;
  pieces.forEach((g) => g.dispose());
  pieces.length = 0;
  for (let i = 0; i < (distant ? 3 : 7); i++) {
    const lobe = new THREE.IcosahedronGeometry(1, 0);
    const angle = i * 2.39996,
      radius = i ? 0.46 : 0;
    lobe.scale(0.55, 0.52 + rnd() * 0.16, 0.55);
    lobe.rotateY(i);
    lobe.translate(
      Math.cos(angle) * radius,
      i ? (rnd() - 0.5) * 0.5 : 0.35,
      Math.sin(angle) * radius,
    );
    pieces.push(lobe);
  }
  const coarseGeometry = mergeGeometries(pieces)!;
  pieces.forEach((g) => g.dispose());
  const bark = new THREE.MeshStandardMaterial({ roughness: 1 });
  const foliage = new THREE.MeshStandardMaterial({ roughness: 0.95 });
  const contour = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    transparent: true,
  });
  const stems = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.65, 1, 1, 5),
    bark,
    trees.length * (distant ? 1 : 5),
  );
  const coarse = new THREE.InstancedMesh(coarseGeometry, foliage, trees.length);
  const coarseEdges = new THREE.InstancedMesh(
    coarseGeometry,
    contour,
    trees.length,
  );
  const fine = new THREE.InstancedMesh(
    fineGeometry,
    foliage,
    Math.min(distant ? 0 : CLOSE_TREES, trees.length) * CLUSTERS,
  );
  const fineEdges = new THREE.InstancedMesh(fineGeometry, contour, fine.count);
  stems.name = "Than_va_canh";
  coarse.name = "Tan_la_xa";
  fine.name = "La_can_canh";
  for (const edge of [coarseEdges, fineEdges]) {
    edge.name = "Net_tan_la";
    edge.userData.screenOnly = true;
  }
  const transform = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0);
  const branch = (
    index: number,
    from: THREE.Vector3,
    to: THREE.Vector3,
    width: number,
  ) => {
    const direction = to.clone().sub(from);
    transform.position.copy(from).add(to).multiplyScalar(0.5);
    transform.quaternion.setFromUnitVectors(up, direction.clone().normalize());
    transform.scale.set(width, direction.length(), width);
    transform.updateMatrix();
    stems.setMatrixAt(index, transform.matrix);
  };
  const bases = trees.map((t) => height(t.x, t.z));
  for (let i = 0; i < trees.length; i++) {
    const t = trees[i],
      base = bases[i];
    branch(
      i * (distant ? 1 : 5),
      new THREE.Vector3(t.x, base, t.z),
      new THREE.Vector3(t.x, base + t.h * 0.63, t.z),
      t.h * 0.027,
    );
    for (let j = 0; !distant && j < 4; j++) {
      const angle = j * 2.39996 + i;
      branch(
        i * 5 + j + 1,
        new THREE.Vector3(t.x, base + t.h * (0.32 + j * 0.055), t.z),
        new THREE.Vector3(
          t.x + Math.cos(angle) * t.radius * 0.72,
          base + t.h * (0.62 + j * 0.04),
          t.z + Math.sin(angle) * t.radius * 0.72,
        ),
        t.h * 0.012,
      );
    }
  }
  stems.castShadow = coarse.castShadow = fine.castShadow = true;
  coarse.receiveShadow = fine.receiveShadow = true;
  root.add(stems, coarse, coarseEdges, fine, fineEdges);
  let key = "",
    selected: number[] = [],
    coarseIds: number[] = [],
    colors: THREE.Color[] = [],
    outlines = 0.55;
  const tint = (tree: SceneTree, shade: number) =>
    colors[tree.tone % colors.length].clone().multiplyScalar(shade);
  const matrix = (
    mesh: THREE.InstancedMesh,
    edge: THREE.InstancedMesh,
    index: number,
  ) => {
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
    transform.scale.multiplyScalar(1.018);
    transform.updateMatrix();
    edge.setMatrixAt(index, transform.matrix);
  };
  function recolor() {
    if (!colors.length) return;
    coarseIds.forEach((i, slot) =>
      coarse.setColorAt(slot, tint(trees[i], 0.92 + (i % 5) * 0.035)),
    );
    selected.forEach((i, slot) => {
      for (let j = 0; j < CLUSTERS; j++)
        fine.setColorAt(
          slot * CLUSTERS + j,
          tint(
            trees[i],
            j < 3
              ? 1.04 + (j % 3) * 0.07
              : j < 7
                ? 0.92 + (j % 3) * 0.05
                : 0.78 + (j % 3) * 0.04,
          ),
        );
    });
    for (const mesh of [coarse, fine])
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  function detail(position: THREE.Vector3) {
    const next = trees
      .map((t, i) => ({ i, d: Math.hypot(t.x - position.x, t.z - position.z) }))
      .filter((t) => t.d < 165)
      .sort((a, b) => a.d - b.d)
      .slice(0, distant ? 0 : CLOSE_TREES)
      .map((t) => t.i)
      .sort((a, b) => a - b);
    const nextKey = next.join(",");
    if (key === nextKey && coarse.userData.ready) return false;
    key = nextKey;
    selected = next;
    const near = new Set(selected);
    coarseIds = [];
    for (let i = 0; i < trees.length; i++) {
      if (near.has(i)) continue;
      const t = trees[i];
      transform.position.set(t.x, bases[i] + t.h * 0.7, t.z);
      transform.rotation.set(0, i * 2.39996, 0);
      const slender = t.conifer ? 0.65 : i % 7 === 0 ? 0.62 : 1;
      transform.scale.set(t.radius * slender, t.h * 0.36, t.radius * slender);
      matrix(coarse, coarseEdges, coarseIds.length);
      coarseIds.push(i);
    }
    selected.forEach((i, slot) => {
      const t = trees[i],
        variation = random(seed ^ Math.imul(i + 1, 2654435761));
      for (let j = 0; j < CLUSTERS; j++) {
        const angle = j * 2.39996 + variation(),
          ring = t.conifer
            ? j < 3
              ? 0.12
              : j < 7
                ? 0.4
                : 0.72
            : j < 3
              ? 0.25
              : j < 7
                ? 0.55
                : 0.65;
        const slender = t.conifer
          ? j < 3
            ? 0.42
            : j < 7
              ? 0.7
              : 1
          : i % 7 === 0
            ? 0.62
            : 1;
        const fullRadius = t.radius * (0.52 + variation() * 0.12);
        const radius = fullRadius * slender;
        transform.position.set(
          t.x + Math.cos(angle) * t.radius * ring,
          bases[i] +
            t.h * (j < 3 ? 0.87 : j < 7 ? 0.74 : 0.64) +
            (variation() - 0.5) * 0.4,
          t.z + Math.sin(angle) * t.radius * ring,
        );
        transform.rotation.set(
          (variation() - 0.5) * 0.7,
          angle,
          (variation() - 0.5) * 0.6,
        );
        transform.scale.set(
          radius,
          fullRadius * (1.05 + variation() * 0.15),
          radius,
        );
        matrix(fine, fineEdges, slot * CLUSTERS + j);
      }
    });
    fine.count = fineEdges.count = selected.length * CLUSTERS;
    coarse.count = coarseEdges.count = coarseIds.length;
    coarse.visible = coarse.count > 0;
    fine.visible = fine.count > 0;
    coarseEdges.visible = coarse.visible && outlines > 0;
    fineEdges.visible = fine.visible && outlines > 0;
    for (const mesh of [coarse, coarseEdges, fine, fineEdges]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    coarse.userData.ready = true;
    root.userData.detailedTrees = selected.length;
    recolor();
    return true;
  }
  detail(new THREE.Vector3(0, 0, 0));
  return {
    root,
    detail,
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      root.traverse((object) => {
        if (object instanceof THREE.InstancedMesh) {
          object.dispose();
          geometries.add(object.geometry);
          materials.add(object.material as THREE.Material);
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      root.clear();
    },
    apply(
      palette: { foliage: string[]; trunk: string; edge: string },
      lineOpacity: number,
    ) {
      outlines = lineOpacity;
      bark.color.set(palette.trunk);
      contour.color.set(palette.edge);
      contour.opacity = outlines * 0.38;
      coarseEdges.visible = coarse.visible && outlines > 0;
      fineEdges.visible = fine.visible && outlines > 0;
      colors = palette.foliage.map((c) => new THREE.Color(c));
      recolor();
    },
  };
}
