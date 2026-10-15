// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  MathUtils,
  Matrix4,
  Plane,
  Ray,
  Sphere,
  Vector3,
} from "three/webgpu";
import {
  abs,
  clamp,
  float,
  fract,
  fwidth,
  length,
  max,
  min,
  smoothstep,
  step,
  vec2,
} from "three/tsl";
export function createMeshBuildersModule(scope, { paletteModule }) {
  const { palette } = paletteModule;
  var DG = (e) => e;
  function OG(e, t, n) {
    let r = abs(e).sub(t).add(n);
    return length(max(r, 0))
      .add(min(max(r.x, r.y), 0))
      .sub(n);
  }
  function kG(e) {
    let t = fwidth(e).max(1e-5);
    return float(1).sub(smoothstep(t.negate(), t, e));
  }
  function AG(e, t) {
    return kG(abs(e).sub(t));
  }
  var jG = Math.cos(0.6);
  var MG = Math.sin(0.6);
  function NG(e, t, n) {
    let r = fract(
        vec2(e.x.mul(jG).sub(e.y.mul(MG)), e.x.mul(MG).add(e.y.mul(jG))).mul(t),
      ).sub(0.5),
      i = typeof n == `number` ? float(n) : n;
    return kG(length(r).sub(i)).mul(smoothstep(0, 0.03, i));
  }
  function PG(e, t, n, r) {
    let i = clamp(t.mul(1.6).sub(n), 0, 1);
    return kG(length(fract(e.mul(r)).sub(0.5)).sub(i.mul(0.8))).mul(
      smoothstep(0, 0.03, i),
    );
  }
  function FG(e) {
    return kG(abs(e.sub(0.2)).sub(0.05)).add(kG(abs(e.sub(0.33)).sub(0.016)));
  }
  function IG(e, t) {
    let n = e.div(t).mul(0.5).add(0.5);
    return FG(n.x.mul(0.5).add(n.y.oneMinus().mul(0.5)));
  }
  function LG(e, t, n, r) {
    let i = t.add(r.mul(t.oneMinus()));
    return [e.mul(t).add(n.mul(r).mul(t.oneMinus())).div(max(i, 1e-4)), i];
  }
  var LayeredQuadGeometry = class {
    count;
    geometry = new BufferGeometry();
    pos;
    uv;
    uvAlt;
    normal;
    constructor(e) {
      this.count = e;
      let t = e * 4;
      ((this.pos = new BufferAttribute(new Float32Array(t * 3), 3)),
        this.pos.setUsage(DynamicDrawUsage),
        (this.uv = new BufferAttribute(new Float32Array(t * 2), 2)),
        (this.uvAlt = new BufferAttribute(new Float32Array(t * 2), 2)),
        (this.normal = new BufferAttribute(new Float32Array(t * 3), 3)));
      for (let e = 0; e < t; e++) this.normal.setZ(e, 1);
      let n = [];
      for (let t = 0; t < e; t++) {
        let e = t * 4;
        n.push(e, e + 1, e + 2, e + 2, e + 1, e + 3);
      }
      (this.geometry.setIndex(n),
        this.geometry.setAttribute(`position`, this.pos),
        this.geometry.setAttribute(`uv`, this.uv),
        this.geometry.setAttribute(`uvAlt`, this.uvAlt),
        this.geometry.setAttribute(`normal`, this.normal),
        this.geometry.setAttribute(
          `layer`,
          new BufferAttribute(new Float32Array(t), 1),
        ),
        (this.geometry.boundingSphere = new Sphere(new Vector3(), 1e3)));
    }
    setLayer(e, t) {
      let n = this.geometry.getAttribute(`layer`);
      for (let r = 0; r < 4; r++) n.setX(e * 4 + r, t);
    }
    setUV(e, t, n = t) {
      for (let r = 0; r < 4; r++) {
        let i = r & 1,
          a = r >> 1;
        (this.uv.setXY(e * 4 + r, i ? t[2] : t[0], a ? t[3] : t[1]),
          this.uvAlt.setXY(e * 4 + r, i ? n[2] : n[0], a ? n[3] : n[1]));
      }
    }
    setNormal(e, t, n, r) {
      for (let i = 0; i < 4; i++) this.normal.setXYZ(e * 4 + i, t, n, r);
    }
    flat(e, t, n, r, i, a, o = 0) {
      let s = Math.cos(o),
        c = Math.sin(o);
      for (let o = 0; o < 4; o++) {
        let l = (o & 1 ? 1 : -1) * i,
          u = (o >> 1 ? 1 : -1) * a;
        this.pos.setXYZ(e * 4 + o, t + l * s - u * c, n + l * c + u * s, r);
      }
    }
    vertex(e, t, n, r, i) {
      this.pos.setXYZ(e * 4 + t, n, r, i);
    }
    commit() {
      this.pos.needsUpdate = !0;
    }
    commitStatic() {
      ((this.uv.needsUpdate = !0),
        (this.uvAlt.needsUpdate = !0),
        (this.normal.needsUpdate = !0),
        (this.geometry.getAttribute(`layer`).needsUpdate = !0));
    }
  };
  function zG(e, t) {
    return step(t - 0.5, e).sub(step(t + 0.5, e));
  }
  var BG = (e) => 1 - (1 - MathUtils.clamp(e, 0, 1)) ** 3;
  var VG = 0.32;
  var HG = 0.5;
  var UG = 0.04;
  var WG = (e) => e * e * (3 - 2 * e);
  var GG = (e) => (e >= 0 && e < 0.5 ? Math.sin((Math.PI * e) / HG) ** 2 : 0);
  var KG = new Matrix4();
  var qG = new Ray();
  var JG = new Plane(new Vector3(0, 0, 1), 0);
  function YG(e, t, n) {
    return (
      KG.copy(e).invert(),
      qG.copy(t).applyMatrix4(KG),
      qG.intersectPlane(JG, n) !== null
    );
  }
  var IdleQueue = class {
    timeout;
    jobs = [];
    pending = !1;
    since = -1;
    constructor(e = 1e3) {
      this.timeout = e;
    }
    add(e, t = -1, n = !1) {
      let r = {
        key: t,
        run: e,
      };
      (n ? this.jobs.unshift(r) : this.jobs.push(r), this.kick());
    }
    prioritize(e) {
      let t = 0;
      for (let n = 0; n < this.jobs.length; n++) {
        if (this.jobs[n].key !== e) continue;
        let [r] = this.jobs.splice(n, 1);
        this.jobs.splice(t++, 0, r);
      }
    }
    step = (e) => {
      if (
        ((this.pending = !1),
        e &&
          !e.didTimeout &&
          e.timeRemaining() <= 4 &&
          performance.now() - this.since < this.timeout)
      ) {
        this.kick();
        return;
      }
      this.since = -1;
      try {
        for (
          let e = this.jobs.shift();
          e && e.run() === !1;
          e = this.jobs.shift()
        );
      } finally {
        this.kick();
      }
    };
    kick() {
      if (this.pending || this.jobs.length === 0) return;
      this.pending = !0;
      let e = performance.now();
      (this.since < 0 && (this.since = e),
        typeof requestIdleCallback == `function`
          ? scope.idle(this.step, {
              timeout: Math.max(1, this.timeout - (e - this.since)),
            })
          : scope.timeout(this.step, 40));
    }
  };
  var ZG = {
    y: 1.74,
    to: -2.56,
    r: 0.045,
  };
  var QG = {
    x: -1.4,
    y: 0.92,
    r: 0.34,
    motor: 1.36,
  };
  var $G = {
    y: ZG.y - ZG.r - 0.008,
    x0: -2.46,
    x1: -0.34,
    sag: 0.07,
  };
  var eK = {
    w: 0.3,
    h: 0.4,
    pitch: 0.32,
    gap: 0.21,
  };
  var tK = [`T`, `H`, `E`, `E`, `N`, `D`];
  var nK = [
    palette.hotPink,
    palette.yellow,
    palette.cyan,
    palette.lime,
    palette.orange,
    palette.lilac,
  ];
  var rK = -1.46;
  var iK = {
    x: rK,
    y: -0.725,
    w: 0.74,
    h: 0.7,
    d: 0.36,
    r: 0.03,
  };
  var aK = iK.y + iK.h / 2;
  var oK = {
    w: iK.w + 0.08,
    d: iK.d + 0.09,
    t: 0.035,
    tilt: 0.12,
    lip: 0.03,
  };
  var sK = {
    dx: 0.2,
    r: 0.03,
  };
  var cK = {
    y: -0.6,
    z: 0.02,
    stub: 0.075,
    plate: 0.15,
  };
  var lK = {
    drv0: 0.045,
    drv1: 0.17,
    drvR: 0.088,
    fin0: 0.052,
    fin1: 0.092,
    neckR: 0.06,
    neck: 0.21,
    mouth: 0.6,
    r0: 0.046,
    rm: 0.198,
    lip: 0.018,
    yoke: 0.122,
    pivot: 0.19,
  };
  var uK = [
    {
      name: `L`,
      side: -1,
      yaw: 48,
      el: -8,
    },
    {
      name: `R`,
      side: 1,
      yaw: 41,
      el: -8,
    },
  ];
  var dK = {
    w: 9,
    zeta: 0.25,
    kick: 1.2,
    hover: 3,
    click: 7,
    most: 0.5,
  };
  var fK = {
    y: -0.72,
    w: 0.4,
    h: 0.56,
    d: 0.12,
    gap: 0.01,
    face: -0.0225,
  };
  var pK = {
    w: 0.42,
    h: 0.055,
  };
  var mK = {
    cols: 23,
    rows: 12,
    meter: 9,
    bands: 7,
  };
  var hK = {
    volRest: 0.7,
    volMax: -0.87,
    back: 2.4,
  };
  var gK = {
    top: -0.2,
    r: 0.07,
    to: -2.46,
  };
  var _K = [-0.53, -0.02, 0.53];
  var vK = [-2.34, -1.78, -0.86];
  var yK = [
    {
      x: gK.to + 0.04,
      dir: [-0.26, 1, 0.52],
    },
    {
      x: -0.47,
      dir: [0.12, 1, 0.55],
    },
  ];
  var bK = {
    len: 0.2,
    r0: 0.03,
    r1: 0.085,
  };
  var xK = 0.62;
  var SK = {
    rate: 0.55,
    calm: 0.22,
  };
  var CK = 14;
  var wK = {
    slots: 4,
    per: 30,
  };
  return {
    DG,
    OG,
    kG,
    AG,
    NG,
    PG,
    IG,
    LG,
    LayeredQuadGeometry,
    zG,
    BG,
    VG,
    HG,
    UG,
    WG,
    GG,
    YG,
    IdleQueue,
    ZG,
    QG,
    $G,
    eK,
    tK,
    nK,
    rK,
    iK,
    aK,
    oK,
    sK,
    cK,
    lK,
    uK,
    dK,
    fK,
    pK,
    mK,
    hK,
    gK,
    _K,
    vK,
    yK,
    bK,
    xK,
    SK,
    CK,
    wK,
  };
}
