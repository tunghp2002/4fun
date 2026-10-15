// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  Mesh,
} from "three/webgpu";
import {
  attribute,
  Fn,
  mat4,
  normalLocal,
  positionLocal,
  transformNormal,
  vec4,
} from "three/tsl";
export function createGeometryModule(scope) {
  var NR = [`iM0`, `iM1`, `iM2`, `iM3`];
  function PR(e) {
    return Fn(() => {
      let t = mat4(
        attribute(NR[0], `vec4`),
        attribute(NR[1], `vec4`),
        attribute(NR[2], `vec4`),
        attribute(NR[3], `vec4`),
      );
      normalLocal.assign(transformNormal(normalLocal, t));
      let n = e ? positionLocal.mul(e) : positionLocal;
      return t.mul(vec4(n, 1)).xyz;
    })();
  }
  var InstancePool = class {
    capacity;
    bounds;
    matrices;
    columns;
    extras = new Map();
    views = new Map();
    count = 0;
    constructor(e, t) {
      ((this.capacity = e),
        (this.bounds = t),
        (this.matrices = new InstancedInterleavedBuffer(
          new Float32Array(Math.max(1, e) * 16),
          16,
          1,
        )),
        (this.columns = NR.map(
          (e, t) => new InterleavedBufferAttribute(this.matrices, 4, t * 4),
        )));
    }
    addAttribute(e, t, n = 0) {
      let r = new InstancedBufferAttribute(
        new Float32Array(Math.max(1, this.capacity) * t).fill(n),
        t,
      );
      return (this.extras.set(e, r), r);
    }
    view(e) {
      let t = this.views.get(e);
      if (!t) {
        ((t = new InstancedBufferGeometry()), t.setIndex(e.index));
        for (let n in e.attributes) t.setAttribute(n, e.attributes[n]);
        this.columns.forEach((e, n) => t.setAttribute(NR[n], e));
        for (let [e, n] of this.extras) t.setAttribute(e, n);
        ((t.boundingSphere = this.bounds),
          (t.instanceCount = this.count),
          this.views.set(e, t));
      }
      return t;
    }
    setCount(e) {
      this.count = Math.min(e, this.capacity);
      for (let e of this.views.values()) e.instanceCount = this.count;
    }
    setMatrix(e, t) {
      t.toArray(this.matrices.array, e * 16);
    }
    commit() {
      this.matrices.needsUpdate = !0;
    }
  };
  function IR(e, t, n, r) {
    let i = new Mesh(t, n);
    return (
      (i.name = e),
      (i.castShadow = i.receiveShadow = r),
      (i.raycast = () => {}),
      (i.userData.noExport = !0),
      i
    );
  }
  return {
    PR,
    InstancePool,
    IR,
  };
}
