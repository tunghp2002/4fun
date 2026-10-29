import * as THREE from "three";

export type RevealArea = [number, number, number, number];
type Piece = {
  object: THREE.Object3D;
  position: THREE.BufferAttribute;
  indices: Uint32Array;
  bases: Float32Array;
  targets: Float32Array;
  delays: Uint8Array;
  count: number;
  culled: boolean;
};

export function createReveal() {
  let pieces: Piece[] = [], started = 0, previous = 0, elapsed = 0;
  const scales = new Float32Array(16);
  function finish() {
    for (const piece of pieces) {
      for (let i = 0; i < piece.count; i++) piece.position.setY(piece.indices[i], piece.targets[i]);
      piece.position.needsUpdate = true;
      piece.object.frustumCulled = piece.culled;
    }
    pieces = [];
  }
  function update(now: number) {
    if (!pieces.length) return false;
    // A slow first draw must not consume the entire entrance; still bound the extra rendering.
    elapsed += Math.min(120, Math.max(0, now - previous));
    previous = now;
    if (elapsed >= 870 || now - started >= 2200) { finish(); return false; }
    for (let i = 0; i < scales.length; i++) {
      const t = Math.max(0, Math.min(1, (elapsed - i * 18) / 600)) - 1;
      scales[i] = 1 + 1.8 * t * t * t + 0.8 * t * t;
    }
    for (const piece of pieces) {
      for (let i = 0; i < piece.count; i++)
        piece.position.setY(piece.indices[i], piece.bases[i] + (piece.targets[i] - piece.bases[i]) * scales[piece.delays[i]]);
      piece.position.needsUpdate = true;
    }
    return true;
  }
  return {
    finish,
    update,
    start(root: THREE.Group, covered: RevealArea[], now: number) {
      finish();
      started = previous = now;
      elapsed = 0;
      root.updateWorldMatrix(true, true);
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments) || object instanceof THREE.InstancedMesh) return;
        const geometry = object.geometry,
          origins = geometry.getAttribute("revealOrigin"),
          fixed = geometry.userData.revealOrigin as number[] | undefined;
        if (!origins && !fixed) return;
        const position = geometry.getAttribute("position") as THREE.BufferAttribute;
        const piece: Piece = { object, position, indices: new Uint32Array(position.count), bases: new Float32Array(position.count), targets: new Float32Array(position.count), delays: new Uint8Array(position.count), count: 0, culled: object.frustumCulled };
        let anchor: { x: number; y: number; z: number; radius: number; base: number; delay: number; covered: boolean } | undefined;
        const scale = new THREE.Vector3().setFromMatrixScale(object.matrixWorld);
        const point = new THREE.Vector3();
        for (let i = 0; i < position.count; i++) {
          const x = fixed ? fixed[0] : origins.getX(i),
            y = fixed ? fixed[1] : origins.getY(i),
            z = fixed ? fixed[2] : origins.getZ(i),
            radius = (fixed ? fixed[3] : origins.getW(i)) * Math.max(scale.x, scale.z);
          if (!anchor || anchor.x !== x || anchor.y !== y || anchor.z !== z || anchor.radius !== radius) {
            point.set(x, y, z).applyMatrix4(object.matrixWorld);
            const seen = covered.some(([left, top, right, bottom]) => point.x >= left - radius && point.x <= right + radius && point.z >= top - radius && point.z <= bottom + radius);
            const distance = covered.length ? Math.min(...covered.map(([l, t, r, b]) => Math.hypot(Math.max(l - point.x, 0, point.x - r), Math.max(t - point.z, 0, point.z - b)))) : 0;
            const noise = Math.sin(point.x * 0.13 + point.z * 0.19) * 43758.5453;
            anchor = { x, y, z, radius, base: y, covered: seen, delay: Math.min(15, Math.floor(Math.min(10, distance / 90) + (noise - Math.floor(noise)) * 5)) };
          }
          if (anchor.covered) continue;
          const slot = piece.count++;
          piece.indices[slot] = i;
          piece.bases[slot] = anchor.base;
          piece.targets[slot] = position.getY(i);
          piece.delays[slot] = anchor.delay;
        }
        if (!piece.count) return;
        // Geometry changes are shared by the color, outline, normal and shadow passes.
        object.frustumCulled = false;
        pieces.push(piece);
      });
      return update(now);
    },
  };
}
