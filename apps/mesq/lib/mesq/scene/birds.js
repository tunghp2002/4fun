// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  BoxGeometry,
  BufferAttribute,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicNodeMaterial,
  Object3D,
  Path,
  Shape,
  ShapeGeometry,
  Sphere,
  SphereGeometry,
  Sprite,
  SpriteNodeMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three/webgpu";
import {
  abs,
  attribute,
  clamp,
  float,
  fwidth,
  max,
  mix,
  smoothstep,
  step,
  uniform,
  vec3,
  vec4,
} from "three/tsl";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
export function createBirdsModule(
  scope,
  { paletteModule, renderingModule, audioModule, geometryModule },
) {
  const { paperWhite, charcoal, blue, inkPurple, palette, LF, RF } =
    paletteModule;
  const { createToonMaterial } = renderingModule;
  const { sound } = audioModule;
  const { PR, InstancePool, IR } = geometryModule;
  var VR = new SphereGeometry(1, 16, 10);
  var HR = new SphereGeometry(1, 10, 7);
  var UR = {
    h: 0.39,
    r: 0.172,
    k: 0.16,
    depth: 0.95,
  };
  var WR = {
    c: [0, 0.195, 0],
    r: [0.172, 0.195, 0.162],
  };
  var GR = [
    {
      c: [0, 0.19, 0],
      r: [0.17, 0.2, 0.16],
    },
    {
      c: [0, 0.13, -0.01],
      r: [0.165, 0.13, 0.155],
    },
  ];
  function KR(e) {
    let t = MathUtils.clamp(1 - (2 * e) / UR.h, -1, 1);
    return UR.r * Math.sqrt(1 - t * t) * (1 + UR.k * t);
  }
  function qR(e, t, n) {
    let r = 1 - (e / n.r[0]) ** 2 - ((t - n.c[1]) / n.r[1]) ** 2;
    return r > 0 ? n.c[2] + n.r[2] * Math.sqrt(r) : 0;
  }
  function JR(e, t, n) {
    return e === `egg`
      ? Math.sqrt(Math.max(0, KR(n) ** 2 - t * t)) * UR.depth
      : e === `round`
        ? qR(t, n, WR)
        : Math.max(qR(t, n, GR[0]), qR(t, n, GR[1]));
  }
  function YR(e, t, n) {
    if (e === `egg`)
      return Math.sqrt(Math.max(0, KR(t) ** 2 - (n / UR.depth) ** 2));
    let r = (e) =>
      e.r[0] *
      Math.sqrt(
        Math.max(
          0,
          1 - ((t - e.c[1]) / e.r[1]) ** 2 - ((n - e.c[2]) / e.r[2]) ** 2,
        ),
      );
    return e === `round` ? r(WR) : Math.max(r(GR[0]), r(GR[1]));
  }
  function XR(e) {
    if (e === `round`) return WR.r[0];
    if (e === `legacy`) return Math.max(GR[0].r[0], GR[1].r[0]);
    let t = 0;
    for (let e = 0; e <= 64; e++) t = Math.max(t, KR((UR.h * e) / 64));
    return t;
  }
  var ZR = (e, t, n) =>
    new SphereGeometry(1, t, n).scale(...e.r).translate(...e.c);
  var QR = new Map();
  function $R(e) {
    let t = QR.get(e);
    if (t) return t;
    if (e === `egg`) {
      let e = [];
      for (let t = 0; t <= 18; t++) {
        let n = (t / 18) * Math.PI;
        e.push(
          new Vector2(
            UR.r * Math.sin(n) * (1 + UR.k * Math.cos(n)),
            (UR.h / 2) * (1 - Math.cos(n)),
          ),
        );
      }
      t = new LatheGeometry(e, 28).scale(1, 1, UR.depth);
    } else
      t =
        e === `round`
          ? ZR(WR, 28, 18)
          : mergeGeometries([ZR(GR[0], 24, 16), ZR(GR[1], 24, 16)]);
    return (QR.set(e, t), t);
  }
  var ez = (e) => e.h * 0.45;
  function tz(e, t, n, r = 32) {
    let i = [];
    for (let a = 0; a < r; a++) {
      let o = (a / r) * Math.PI * 2,
        s = Math.cos(o),
        c = Math.sin(o),
        l = e * Math.sign(s) * Math.abs(s) ** 0.6,
        u = c > 0 ? t * c ** 0.35 : -n * (-c) ** 0.8;
      (c < 0 && (l *= 1 + 0.2 * c), i.push(new Vector2(l, u)));
    }
    return i;
  }
  var nz = `lensUv`;
  var rz = [9, -9];
  function iz(e, t, n) {
    let r = e.index ? e.toNonIndexed() : e;
    r.deleteAttribute(`uv`);
    let i = r.attributes.position,
      a = new Float32Array(i.count * 3),
      o = new Float32Array(i.count * 2);
    for (let e = 0; e < i.count; e++)
      (t.toArray(a, e * 3),
        n
          ? ((o[e * 2] = i.getX(e) / n.w), (o[e * 2 + 1] = i.getY(e) / n.h))
          : o.set(rz, e * 2));
    return (
      r.setAttribute(`color`, new BufferAttribute(a, 3)),
      r.setAttribute(nz, new BufferAttribute(o, 2)),
      r
    );
  }
  function az(e) {
    let t = new Color(charcoal),
      n = new Color(inkPurple),
      r = [],
      i = tz(e.w, e.h, e.h),
      a = tz(e.w + e.t, e.h + e.t * 1.7, e.h + e.t),
      o = e.w + e.t,
      s = -o * Math.sin(e.wrap),
      c = ez(e);
    for (let l of [-1, 1]) {
      let u = [],
        d = new Shape(a);
      (d.holes.push(new Path(i)),
        u.push(
          iz(
            new ExtrudeGeometry(d, {
              depth: e.depth,
              bevelEnabled: !1,
            }).translate(0, 0, -e.depth / 2),
            t,
          ),
        ),
        u.push(
          iz(
            new ShapeGeometry(new Shape(i)).translate(0, 0, e.depth * 0.1),
            n,
            e,
          ),
        ));
      let f = mergeGeometries(u);
      (f.rotateY(l * e.wrap).translate(l * e.sep, 0, s), r.push(f));
      let p = l * (e.sep + o * Math.cos(e.wrap)),
        m = 2 * s,
        h = l * e.temple[0],
        g = e.temple[1],
        _ = Math.hypot(h - p, g - m),
        v = new BoxGeometry(e.t * 0.8, e.t * 1.1, _)
          .rotateY(Math.atan2(h - p, g - m))
          .translate((p + h) / 2, c, (m + g) / 2);
      r.push(iz(v, t));
    }
    let l = e.sep - o * Math.cos(e.wrap);
    return (
      l > 0 &&
        r.push(
          iz(
            new BoxGeometry(l * 2 + e.t, e.t * 1.3, e.depth).translate(0, c, 0),
            t,
          ),
        ),
      mergeGeometries(r)
    );
  }
  var oz = (e, t, n, r = 0) => ({
    pos: e,
    scale: t,
    rotX: r,
    color: n,
  });
  var sz = new Map();
  var cz = {
    sep: 0.088,
    w: 0.056,
    h: 0.043,
    t: 0.013,
    depth: 0.012,
    wrap: 0.3,
  };
  var lz = 0.335;
  function uz(e) {
    let t = sz.get(e);
    return (t || ((t = fz(e)), sz.set(e, t)), t);
  }
  var dz = (e, t, n) => t + n + (e.w + e.t) * Math.sin(e.wrap);
  function fz(e) {
    let t = 0.272,
      n = JR(e, 0.088, t) + 0.008,
      r = JR(e, 0, 0.247) + 0.005,
      i = dz(cz, n, 0.03),
      a = YR(e, 0.275 + ez(cz), 0) - 0.002;
    return {
      body: {
        pos: [0, 0, 0],
        scale: 1,
      },
      bodyHalfWidth: XR(e),
      tail: oz([0, 0.09, -0.15], [0.055, 0.03, 0.08], LF, 0.5),
      beak: oz([0, 0.247, r], [0.05, 0.03, 0.052], RF),
      mouth: oz([0, 0.232, r - 0.01], [0.036, 0.02, 0.036], `#5a2a2e`),
      jawHinge: [0, 0.232, r - 0.028],
      jaw: oz([0, -0.004, 0.026], [0.042, 0.022, 0.044], RF),
      wing: {
        pivot: [0.15, 0.225, -0.015],
        part: [0.018, -0.06, -0.012],
        scale: [0.028, 0.075, 0.095],
      },
      wingColors: [LF, LF],
      eye: [0.088, t, n],
      glasses: [0, 0.275, i],
      glassesUp: [0, 0.1, -0.075],
      glassesGeo: az({
        ...cz,
        temple: [a, -i],
      }),
      hat: {
        pos: [0, lz, -0.004],
        scale: YR(e, lz, 0) + 0.004,
        tilt: -0.1,
      },
      bubbleY: 0.55,
    };
  }
  var pz = [`beanie`, `cap`, `bucket`, `party`];
  var mz = `hatPart`;
  var hz = `aHatA`;
  var gz = `aHatB`;
  var _z = palette.cream;
  var vz = {
    beanie: [
      [palette.pink, palette.yellow],
      [palette.purple, palette.lime],
      [palette.teal, palette.hotPink],
      [palette.red, _z],
      [palette.orange, palette.purple],
    ],
    cap: [
      [blue, paperWhite],
      [palette.red, palette.yellow],
      [palette.lime, palette.purple],
      [palette.hotPink, palette.cyan],
      [palette.purple, palette.orange],
    ],
    bucket: [
      [palette.yellow, palette.pink],
      [palette.lilac, palette.purple],
      [palette.cyan, blue],
      [palette.green, palette.yellow],
    ],
    party: [
      [palette.pink, palette.cyan],
      [palette.yellow, palette.purple],
      [palette.cyan, palette.hotPink],
      [palette.lime, blue],
    ],
  };
  var yz = {
    beanie: 0.05,
    cap: 0.02,
    bucket: 0.03,
    party: 0.12,
  };
  function bz(e, t, n = 18) {
    return {
      geo: new LatheGeometry(
        e.map(([e, t]) => new Vector2(Math.max(0, e), t)),
        n,
      ),
      slot: t,
    };
  }
  function xz(e, t, n, r = 8, i = []) {
    let a = [...i];
    for (let i = 0; i <= r; i++) {
      let o = (i / r) * Math.PI * 0.5;
      a.push([e * Math.cos(o), t + n * Math.sin(o)]);
    }
    return a;
  }
  function Sz(e, t, n = 8) {
    let r = [];
    for (let i = 0; i <= n; i++) {
      let a = -Math.PI / 2 + (i / n) * Math.PI;
      r.push([t * Math.cos(a), e + t * Math.sin(a)]);
    }
    return r;
  }
  function Cz(e) {
    switch (e) {
      case `beanie`:
        return [
          bz(xz(1.04, 0.3, 0.78, 9, [[0.98, 0.26]]), 0),
          bz(
            [
              [0.98, -0.1],
              [1.1, -0.1],
              [1.1, -0.1],
              [1.14, -0.05],
              [1.14, 0.3],
              [1.1, 0.36],
              [1.1, 0.36],
              [0.96, 0.36],
            ],
            1,
          ),
          bz(Sz(1.1, 0.3), 2, 12),
        ];
      case `cap`: {
        let e = new Shape(),
          t = 1.42;
        for (let n = 0; n <= 12; n++) {
          let r = -1.42 + (n / 12) * 2 * t,
            i = new Vector2(
              1.04 * Math.sin(r),
              0.2 + 1.55 * Math.cos(r) ** 1.4,
            );
          n === 0 ? e.moveTo(i.x, i.y) : e.lineTo(i.x, i.y);
        }
        for (let n = 12; n >= 0; n--) {
          let r = -1.42 + (n / 12) * 2 * t;
          e.lineTo(0.9 * Math.sin(r), 0.9 * Math.cos(r));
        }
        let n = new ExtrudeGeometry(e, {
          depth: 0.09,
          bevelEnabled: !1,
          curveSegments: 4,
        })
          .rotateX(Math.PI / 2)
          .rotateX(0.1)
          .translate(0, 0.14, 0);
        return [
          bz(xz(1.07, 0.02, 0.78, 9, [[1.07, -0.07]]), 0),
          {
            geo: n,
            slot: 1,
          },
          bz(Sz(0.8, 0.12, 6), 1, 10),
        ];
      }
      case `bucket`:
        return [
          bz(
            [
              [1.03, -0.06],
              [0.94, 0.55],
              [0.86, 0.68],
              [0.7, 0.74],
              [0, 0.76],
            ],
            0,
          ),
          bz(
            [
              [0.99, 0.04],
              [1.05, 0.045],
              [1.05, 0.045],
              [1.02, 0.27],
              [1.02, 0.27],
              [0.96, 0.275],
            ],
            1,
          ),
          bz(
            [
              [0.95, -0.04],
              [1.5, -0.27],
              [1.5, -0.27],
              [1.54, -0.22],
              [1.54, -0.22],
              [0.97, 0.05],
            ],
            0,
            22,
          ),
        ];
      case `party`: {
        let e = [0.62, 0.18],
          t = [0, 1.55],
          n = (n) => [e[0] + (t[0] - e[0]) * n, e[1] + (t[1] - e[1]) * n],
          r = [0, 0.3, 0.58, 0.82, 1],
          i = r.slice(0, -1).map((e, t) => bz([n(e), n(r[t + 1])], t % 2, 16));
        return [bz([[0, e[1]], e], 0, 16), ...i, bz(Sz(1.58, 0.2), 2, 10)];
      }
    }
  }
  function wz(e, t, n) {
    let r = e.index ? e.toNonIndexed() : e;
    for (let e of Object.keys(r.attributes))
      e !== `position` && e !== `normal` && r.deleteAttribute(e);
    r.attributes.normal || r.computeVertexNormals();
    let i = r.attributes.normal,
      a = new Vector3();
    for (let e = 0; e < i.count; e++)
      (a.fromBufferAttribute(i, e),
        a.lengthSq() < 1e-12 && a.set(0, 1, 0),
        a.normalize(),
        i.setXYZ(e, a.x, a.y, a.z));
    let o = r.attributes.position.count;
    for (let [e, i] of Object.entries(t)) {
      let t = n[e],
        a = new Float32Array(o * t);
      for (let e = 0; e < o; e++) a.set(i(e), e * t);
      r.setAttribute(e, new BufferAttribute(a, t));
    }
    return r;
  }
  var Tz = null;
  function Ez() {
    if (Tz) return Tz;
    let e = [];
    return (
      pz.forEach((t, n) => {
        for (let r of Cz(t))
          e.push(
            wz(
              r.geo,
              {
                [mz]: () => [n, r.slot],
              },
              {
                [mz]: 2,
              },
            ),
          );
      }),
      (Tz = mergeVertices(mergeGeometries(e))),
      Tz.computeBoundingSphere(),
      Tz
    );
  }
  function Dz(e, t, n) {
    let r = new Color(_z);
    return mergeGeometries(
      Cz(e).map((e) => {
        let i = e.slot === 0 ? t : e.slot === 1 ? n : r;
        return wz(
          e.geo,
          {
            color: () => [i.r, i.g, i.b],
          },
          {
            color: 3,
          },
        );
      }),
    );
  }
  function Oz() {
    let e = attribute(mz, `vec2`),
      t = attribute(hz, `vec4`),
      n = attribute(gz, `vec4`),
      r = float(1).sub(step(0.5, abs(e.x.sub(t.w)))),
      i = createToonMaterial(
        {
          color: `#ffffff`,
        },
        {
          wear: !1,
          creature: !0,
        },
      );
    i.positionNode = PR(r);
    let a = new Color(_z),
      o = e.y;
    return (
      (i.colorNode = mix(
        mix(t.xyz, n.xyz, clamp(o, 0, 1)),
        vec3(a.r, a.g, a.b),
        clamp(o.sub(1), 0, 1),
      )),
      i
    );
  }
  function kz(e) {
    let t = e >>> 0;
    return () => {
      t = (t + 1831565813) >>> 0;
      let e = t;
      return (
        (e = Math.imul(e ^ (e >>> 15), e | 1)),
        (e ^= e + Math.imul(e ^ (e >>> 7), e | 61)),
        ((e ^ (e >>> 14)) >>> 0) / 4294967296
      );
    };
  }
  var Az = (e, t) =>
    (Math.imul(e ^ 2654435769, 2246822507) ^
      Math.imul(t + 1663821227, 3266489909)) >>>
    0;
  function jz(e, t) {
    for (let n = e.length - 1; n > 0; n--) {
      let r = Math.floor(t() * (n + 1));
      [e[n], e[r]] = [e[r], e[n]];
    }
    return e;
  }
  var Mz = [`shades`, `shadesUp`, `hat`, `none`];
  function Nz(e, t, n) {
    let r = kz(Az(n.seed | 0, t)),
      i = (e) => Math.min(1, Math.max(0, e || 0)),
      a = n.on ? [i(n.glasses), i(n.glassesUp), i(n.hat)] : [0, 0, 0],
      o = a[0] + a[1] + a[2];
    (o > 1 && (a = a.map((e) => e / o)),
      a.push(Math.max(0, 1 - a[0] - a[1] - a[2])));
    let s = [],
      c = r();
    for (let t = 0; t < e; t++) {
      let n = (c + t) / e,
        r = 0;
      for (; r < 3 && n >= a[r];) n -= a[r++];
      s.push(Mz[r]);
    }
    if ((jz(s, r), e >= 2 && s.every((e) => e === s[0]))) {
      let t = -1;
      for (let e = 0; e < 4; e++)
        Mz[e] !== s[0] && a[e] > 0 && (t < 0 || a[e] > a[t]) && (t = e);
      t >= 0 && (s[Math.floor(r() * e)] = Mz[t]);
    }
    let l = jz(
        pz.map((e, t) => t),
        r,
      ),
      u = 0;
    return s.map((e) => {
      if (e !== `hat`)
        return {
          kind: e,
          hat: null,
        };
      let t = l[u++ % l.length],
        n = pz[t],
        i = vz[n],
        [a, o] = i[Math.floor(r() * i.length)],
        s = n === `cap` && r() < 0.4,
        c = r() * 2 - 1;
      return {
        kind: e,
        hat: {
          type: n,
          typeIndex: t,
          main: new Color(a),
          second: new Color(o),
          yaw: (s ? Math.PI : 0) + c * (n === `cap` ? 0.35 : 0.25),
          roll: (r() * 2 - 1) * (n === `party` ? 0.28 : 0.07),
        },
      };
    });
  }
  var Pz = (e, t) => float(1).sub(smoothstep(t.negate(), t, e));
  var Fz = {
    wide: uniform(0.16),
    thin: uniform(0),
  };
  function Iz() {
    let e = attribute(nz, `vec2`),
      t = attribute(`color`, `vec3`),
      n = e.x.sub(e.y).add(2).mul(0.25),
      r = max(fwidth(n), 1e-4),
      i = (e, t) => Pz(abs(n.sub(e)).sub(t), r),
      a = i(0.22, 0.075).mul(Fz.wide).add(i(0.36, 0.016).mul(Fz.thin)),
      o = new Color(paperWhite),
      s = new MeshBasicNodeMaterial();
    return ((s.colorNode = mix(t, vec3(o.r, o.g, o.b), a.min(1))), s);
  }
  var Lz = (e, t) => e + Math.random() * (t - e);
  var Rz = (e) => e[Math.floor(Math.random() * e.length)];
  var zz = (e, t) => 1 - Math.exp(-e * t);
  var Bz = MathUtils.clamp;
  var Vz = (e) => Math.atan2(Math.sin(e), Math.cos(e));
  var Hz = (e, t, n) => e + Vz(t - e) * n;
  var Uz = {
    scale: 1.2,
    chatMin: 2.5,
    chatMax: 6,
    restMin: 0.9,
    restMax: 3.2,
    flightSpeed: 3,
    panicRadius: 0.95,
    body: `egg`,
    sunglasses: !0,
    sunglassesAt: 0.51,
    accessories: !0,
    glassesShare: 0.3,
    glassesUpShare: 0.15,
    hatShare: 0.3,
    accessorySeed: 7,
    turnSpeed: 1,
  };
  var Wz = 0.75;
  var Gz = 1.1;
  var Kz = 7;
  var qz = 10;
  var Jz = Math.PI * 2;
  var Yz = 6;
  var Xz = 4;
  var Zz = 0.3;
  var BirdSpring = class {
    k;
    c;
    x = 0;
    v = 0;
    target = 0;
    constructor(e = 170, t = 9) {
      ((this.k = e), (this.c = t));
    }
    update(e) {
      let t = e / 2;
      for (let e = 0; e < 2; e++)
        ((this.v += (this.k * (this.target - this.x) - this.c * this.v) * t),
          (this.x += this.v * t));
    }
    kick(e) {
      this.v += e;
    }
    snap(e) {
      ((this.x = this.target = e), (this.v = 0));
    }
  };
  var $z = new SphereGeometry(0.3, 8, 6);
  var eB = (e) => ((e.positionNode = PR()), e);
  var tB = {
    body: eB(
      createToonMaterial(
        {
          color: LF,
        },
        {
          creature: !0,
        },
      ),
    ),
    parts: eB(
      createToonMaterial(
        {
          color: `#ffffff`,
          vertexColors: !0,
        },
        {
          creature: !0,
        },
      ),
    ),
    eyes: eB(
      new MeshBasicNodeMaterial({
        color: `#ffffff`,
        vertexColors: !0,
      }),
    ),
    glasses: eB(Iz()),
    hats: Oz(),
    hit: new MeshBasicNodeMaterial({
      color: charcoal,
    }),
    hitDebug: new MeshBasicNodeMaterial({
      color: `#ff4fa6`,
      transparent: !0,
      opacity: 0.3,
      depthWrite: !1,
    }),
  };
  var nB = {
    pull: uniform(0.4),
  };
  var rB = -1;
  var PullSpriteMaterial = class extends SpriteNodeMaterial {
    setupPositionView(e) {
      let t = super.setupPositionView(e),
        n = float(1)
          .sub(nB.pull.div(t.z.negate().max(0.001)))
          .max(0.25);
      return vec4(t.xyz.mul(n), t.w);
    }
    customProgramCacheKey() {
      return `bubble:${super.customProgramCacheKey()}`;
    }
  };
  var aB = null;
  var oB = () => (aB ??= sB());
  function sB() {
    let e = (e) => {
        let t = scope.element(`canvas`);
        ((t.width = 256), (t.height = 192));
        let n = t.getContext(`2d`);
        ((n.fillStyle = paperWhite),
          n.beginPath(),
          n.roundRect(10, 8, 236, 128, 60),
          n.fill(),
          n.beginPath(),
          n.moveTo(48, 120),
          n.lineTo(30, 184),
          n.lineTo(102, 126),
          n.closePath(),
          n.fill(),
          e(n));
        let r = new CanvasTexture(t);
        return (
          (r.colorSpace = SRGBColorSpace),
          new PullSpriteMaterial({
            map: r,
            transparent: !0,
            depthWrite: !1,
            depthTest: !0,
          })
        );
      },
      t =
        (e, t = charcoal) =>
        (n) => {
          ((n.fillStyle = t),
            (n.font = `800 76px Manrope, system-ui, sans-serif`),
            (n.textAlign = `center`),
            (n.textBaseline = `middle`),
            n.fillText(e, 128, 76));
        },
      n = {
        dots: e((e) => {
          e.fillStyle = charcoal;
          for (let t of [78, 128, 178])
            (e.beginPath(), e.arc(t, 72, 15, 0, Math.PI * 2), e.fill());
        }),
        chu: e(t(`chu`)),
        huh: e(t(`?!`)),
        hm: e(t(`hm`)),
        heart: e((e) => {
          ((e.fillStyle = blue),
            e.beginPath(),
            e.moveTo(128, 118),
            e.bezierCurveTo(60, 72, 84, 20, 128, 50),
            e.bezierCurveTo(172, 20, 196, 72, 128, 118),
            e.fill());
        }),
        hehe: e(t(`hehe`)),
        note: e((e) => {
          e.fillStyle = blue;
          for (let t of [100, 160])
            (e.beginPath(),
              e.ellipse(t, 102, 19, 14, -0.4, 0, Math.PI * 2),
              e.fill(),
              e.fillRect(t + 11, 38, 9, 64));
          (e.beginPath(),
            e.moveTo(111, 34),
            e.lineTo(180, 26),
            e.lineTo(180, 46),
            e.lineTo(111, 54),
            e.closePath(),
            e.fill());
        }),
      };
    return {
      words: n,
      talk: Object.values(n),
      alarm: e(t(`!!`, blue)),
      doze: e(t(`zZ`)),
    };
  }
  var cB = (e) => oB().words[e];
  var lB = {
    camera: null,
    w: 1,
    h: 1,
    vw: 1,
    vh: 1,
    sound: null,
    readAt: -1 / 0,
  };
  scope.listen(window, `resize`, () => (lB.readAt = -1 / 0));
  function uB() {
    let e = performance.now();
    if (e - lB.readAt < 3e3) return;
    lB.readAt = e;
    let t = document.getElementById(`scene`);
    ((lB.vw = window.innerWidth),
      (lB.vh = window.innerHeight),
      (lB.w = t?.clientWidth || lB.vw),
      (lB.h = t?.clientHeight || lB.vh));
    let n = document.querySelector(`.sound-toggle`)?.getBoundingClientRect();
    lB.sound = n && n.width > 0 ? n : null;
  }
  function dB() {
    let e = document.querySelector(`.mesq-speech__bubble`);
    if (!e || e.hidden) return null;
    let t = e.getBoundingClientRect();
    return t.width > 0 ? t : null;
  }
  var fB = (e, t, n) =>
    e.x0 < t.x1 + n && t.x0 < e.x1 + n && e.y0 < t.y1 + n && t.y0 < e.y1 + n;
  var pB = new Vector3();
  var mB = new Vector3();
  var hB = {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
  };
  var gB = {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
  };
  var _B = {
    x: 0,
    y: 0,
  };
  var vB = [
    [-0.1109375, 1 - 136 / 192],
    [0.85 - 10 / 256, 1 - 8 / 192],
  ];
  var yB = 0.3;
  var bB = 0.225;
  var xB = {
    w: yB,
    h: bB,
    cx: 0.15,
    cy: 0,
    order: rB,
  };
  var SB = 1.3;
  var CB = new Matrix4();
  var wB = new Vector3();
  var TB = new Vector3(0, 1, 0);
  var EB = (e, t = !1) => {
    let n = new Object3D();
    return ((n.matrixAutoUpdate = t), e.add(n), n);
  };
  var DB = (e, t) => {
    (e.position.set(...t.pos),
      e.rotation.set(t.rotX, 0, 0),
      e.scale.set(...t.scale),
      e.updateMatrix());
  };
  var Bird = class {
    perch;
    root = new Group();
    hit;
    mode = `perched`;
    perchX;
    rig = new Object3D();
    hip = EB(this.rig, !0);
    squashN = EB(this.hip, !0);
    bodyN = EB(this.squashN);
    jawN = EB(this.squashN, !0);
    eyeGroups = [EB(this.squashN, !0), EB(this.squashN, !0)];
    wingPivots = [EB(this.squashN, !0), EB(this.squashN, !0)];
    parts;
    eyeParts;
    glassesN = EB(this.squashN, !0);
    hatN = EB(this.squashN, !0);
    accessory = {
      kind: `none`,
      hat: null,
    };
    eyeOpen = 1;
    bubble;
    layout;
    squash = new BirdSpring(190, 7);
    pitch = new BirdSpring(120, 8);
    roll = new BirdSpring(120, 8);
    lift = new BirdSpring(260, 14);
    puff = new BirdSpring(140, 6);
    wingOut = new BirdSpring(220, 12);
    lid = new BirdSpring(260, 14);
    shades = new BirdSpring(55, 7.5);
    peek = new BirdSpring(120, 12);
    hatPop = new BirdSpring(240, 10);
    springs;
    yaw;
    yawVel = 0;
    yawGoal;
    baseYaw;
    turnOffset = 0;
    fastTurnUntil = -1;
    flightYaw = 0;
    landTurn = NaN;
    beak = 0;
    blinkT = -1;
    nextBlink = Lz(1, 4);
    eyesClosed = !1;
    flapPhase = Math.random() * 10;
    flapAmp = 0;
    fly = 0;
    flightPitch = 0;
    flightRoll = 0;
    shadesGoal = 0;
    shadesAt = -1;
    shadesLanded = !0;
    activity = `idle`;
    activityEnd = 0;
    nextActivity = Lz(0.5, 3);
    walkTo = 0;
    hopPhase = 0;
    talkUntil = -1;
    talkToX = null;
    attendX = 0;
    attendUntil = -1;
    bubbleUntil = -1;
    bubbleScale = 0;
    chatUntil = -1;
    chatWith = null;
    nextBeat = 0;
    lookPitch = 0;
    preenSide = 1;
    path = null;
    pathLen = 0;
    dist = 0;
    takeoffAt = -1;
    pendingPath = null;
    tmpP = new Vector3();
    tmpT = new Vector3();
    tmpQ = new Vector3();
    constructor(e, t, n) {
      ((this.perch = e),
        (this.perchX = t),
        (this.yaw = this.yawGoal = this.baseYaw = n),
        (this.rig.rotation.order = `YXZ`),
        (this.root.rotation.order = `YXZ`),
        this.root.scale.setScalar(Uz.scale),
        this.lid.snap(1),
        (this.springs = [
          this.squash,
          this.pitch,
          this.roll,
          this.lift,
          this.puff,
          this.wingOut,
          this.lid,
          this.shades,
          this.peek,
          this.hatPop,
        ]),
        this.hatPop.snap(1));
      let r = this.squashN;
      ((this.parts = [
        EB(r),
        EB(r),
        EB(r),
        EB(this.jawN),
        EB(this.wingPivots[0]),
        EB(this.wingPivots[1]),
      ]),
        (this.eyeParts = [
          EB(this.eyeGroups[0]),
          EB(this.eyeGroups[0]),
          EB(this.eyeGroups[1]),
          EB(this.eyeGroups[1]),
        ]),
        (this.hit = new Mesh($z, tB.hit)),
        (this.hit.position.y = 0.25),
        (this.hit.visible = !1),
        (this.hit.userData.bird = this),
        (this.hit.userData.noExport = !0),
        this.root.add(this.hit),
        (this.bubble = new Sprite(oB().talk[0])),
        this.bubble.center.set(0.15, 0),
        (this.bubble.renderOrder = rB),
        (this.bubble.userData.noExport = !0),
        this.bubble.scale.setScalar(0),
        (this.bubble.visible = !1),
        this.root.add(this.bubble),
        this.placeOnPerch());
    }
    get isPerched() {
      return this.mode === `perched` && this.takeoffAt < 0;
    }
    get isTalking() {
      return this.talkUntil > 0;
    }
    get position() {
      return this.rig.position;
    }
    get reachX() {
      return this.activity === `shuffle` ? this.walkTo : this.perchX;
    }
    nudge(e) {
      ((this.perchX = Bz(this.perchX + e, this.perch.minX, this.perch.maxX)),
        this.activity === `shuffle` && (this.activity = `idle`));
    }
    get glassesVisible() {
      return this.shades.x > 0.005;
    }
    applyLayout(e) {
      ((this.layout = e),
        this.bodyN.position.set(...e.body.pos),
        this.bodyN.scale.setScalar(e.body.scale),
        this.bodyN.updateMatrix(),
        DB(this.parts[0], e.tail),
        DB(this.parts[1], e.beak),
        DB(this.parts[2], e.mouth),
        this.jawN.position.set(...e.jawHinge),
        DB(this.parts[3], e.jaw));
      for (let t = 0; t < 2; t++) {
        let n = t === 0 ? -1 : 1;
        this.wingPivots[t].position.set(
          n * e.wing.pivot[0],
          e.wing.pivot[1],
          e.wing.pivot[2],
        );
        let r = this.parts[4 + t];
        (r.position.set(n * e.wing.part[0], e.wing.part[1], e.wing.part[2]),
          r.scale.set(...e.wing.scale),
          r.updateMatrix());
        let i = this.eyeGroups[t],
          [a, o, s] = e.eye ?? [0.088, 0.272, 0.12];
        (i.position.set(n * a, o, s),
          wB.set(n * 0.35, 0.3, 0.45),
          i.quaternion.setFromRotationMatrix(CB.lookAt(wB, i.position, TB)));
        let c = this.eyeParts[t * 2];
        (c.scale.set(0.019, 0.022, 0.012), c.updateMatrix());
        let l = this.eyeParts[t * 2 + 1];
        (l.position.set(0.006, 0.008, 0.009),
          l.scale.set(0.0055, 0.0055, 0.004),
          l.updateMatrix());
      }
      this.placeBubble();
    }
    placeBubble() {
      if (!this.layout) return;
      let e = this.accessory.hat;
      this.bubble.position.set(
        0.06,
        this.layout.bubbleY + (e ? yz[e.type] : 0),
        0.05,
      );
    }
    setAccessory(e, t) {
      let n = this.accessory.hat,
        r =
          !!n &&
          !!e.hat &&
          n.typeIndex === e.hat.typeIndex &&
          n.main.equals(e.hat.main) &&
          n.second.equals(e.hat.second);
      ((this.accessory = e),
        e.hat && !r && (this.hatPop.snap(+!t), (this.hatPop.target = 1)),
        e.kind === `shadesUp`
          ? this.snapShades(Zz)
          : e.kind !== `shades` && this.snapShades(!1),
        this.placeBubble());
    }
    pose() {
      this.applyPose(0, -1 / 0);
    }
    placeOnPerch() {
      this.rig.position.set(this.perchX, this.perch.y(this.perchX), 0);
    }
    yawTowards(e) {
      return Math.atan2(e - this.perchX, 0.45);
    }
    say(e, t, n, r) {
      ((this.talkUntil = e + t),
        (this.talkToX = n),
        this.bubbleSpot(e, n === null ? this.yawGoal : this.talkYaw(n)) ===
          `ok` && this.showBubble(e, r ? oB().words[r] : Rz(oB().talk), t),
        sound.sfx.birdChirp(`talk`, 0.3),
        (this.activity === `shuffle` || this.activity === `doze`) &&
          (this.activity = `idle`),
        this.squash.kick(1.2));
    }
    attend(e, t, n) {
      ((this.attendX = n),
        (this.attendUntil = e + t),
        this.activity === `doze` && (this.activity = `idle`));
    }
    groove = {
      pitch: 0,
      roll: 0,
      cued: !1,
    };
    hold(e, t) {
      this.nextActivity = Math.max(this.nextActivity, e + t);
    }
    face(e, t, n = 0, r = !1) {
      ((this.baseYaw = t),
        (this.turnOffset = n),
        r && (this.fastTurnUntil = e + 0.5));
    }
    cue(e, t, n = 0, r = 1) {
      if (!this.isPerched) return;
      switch (t) {
        case `bob`:
          (this.squash.kick(-2.2 * r),
            this.lift.kick(0.9 * r),
            this.pitch.kick(0.9 * r));
          return;
        case `nod`:
          this.pitch.kick(1.6 * r);
          return;
        case `flap`:
          this.wingOut.kick(3.5 * r);
          return;
        case `hop`:
          (this.squash.kick(2 * r), this.lift.kick(1.4 * r));
          return;
        case `land`:
          (this.squash.kick(-3.2 * r), this.pitch.kick(-1.2 * r));
          return;
        case `wake`:
          (this.activity === `doze` && (this.activity = `idle`),
            this.bubble.material === oB().doze &&
              (this.bubbleUntil = Math.min(this.bubbleUntil, e)),
            this.squash.kick(2.4 * r),
            this.pitch.kick(-1.4 * r));
          return;
      }
      let i = e + n;
      if (this.activity === t) {
        this.activityEnd = Math.max(this.activityEnd, i);
        return;
      }
      ((this.activity = t),
        (this.activityEnd = i),
        t === `look`
          ? ((this.lookPitch = r), this.squash.kick(-1))
          : t === `preen`
            ? (this.preenSide = r < 0 ? -1 : 1)
            : t === `puff`
              ? this.puff.kick(1)
              : t === `peek`
                ? this.pitch.kick(0.5)
                : t === `doze` && this.squash.kick(-1));
    }
    snore(e, t) {
      this.isPerched &&
        this.activity === `doze` &&
        (!this.holdsSpot(e) &&
          this.bubbleSpot(e, this.baseYaw) === `ok` &&
          this.showBubble(e, oB().doze, 1.4),
        t && sound.sfx.birdChirp(`doze`, 0.3));
    }
    get dozing() {
      return this.activity === `doze`;
    }
    flee(e, t, n) {
      this.isPerched &&
        ((this.takeoffAt = e + t),
        (this.pendingPath = n),
        (this.talkUntil = -1),
        (this.chatUntil = -1),
        (this.bubbleUntil = Math.min(this.bubbleUntil, e)),
        (this.activity = `idle`),
        this.squash.kick(-2.5),
        Math.random() < 0.35 &&
          (this.bubbleSpot(e) === `ok` && this.showBubble(e, oB().alarm, 0.7),
          sound.sfx.birdChirp(`alarm`, 0.3)));
    }
    bubbleBusy(e) {
      return e < this.bubbleUntil || this.bubbleScale > 0.5;
    }
    holdsSpot(e) {
      return this.bubbleBusy(e) || e < this.chatUntil;
    }
    talkYaw(e) {
      return (
        this.baseYaw + Bz(Vz(this.yawTowards(e) - this.baseYaw), -1.4, 1.4)
      );
    }
    spotYaw(e) {
      return e < this.chatUntil && this.chatWith
        ? this.talkYaw(this.chatWith.perchX)
        : this.yawGoal;
    }
    bubbleRect(e, t) {
      let n = lB.camera,
        r = this.root.matrixWorld;
      mB.setFromMatrixPosition(r).project(n);
      let i = (mB.x * 0.5 + 0.5) * lB.w,
        a = (-mB.y * 0.5 + 0.5) * lB.h;
      if (mB.z > 1 || i < 0 || i > lB.vw || a < 0 || a > lB.vh) return !1;
      ((_B.x = i), (_B.y = a));
      let o = r.elements,
        s = Math.hypot(o[0], o[1], o[2]) * yB,
        c = Math.hypot(o[4], o[5], o[6]) * bB,
        l = this.bubble.position,
        u = this.root.scale.x,
        d = this.root.parent?.matrixWorld;
      ((e.x0 = e.y0 = 1 / 0), (e.x1 = e.y1 = -1 / 0));
      for (let r of [this.yaw, t]) {
        let t = Math.cos(r),
          i = Math.sin(r);
        (pB
          .set(l.x * t + l.z * i, l.y, l.z * t - l.x * i)
          .multiplyScalar(u)
          .add(this.root.position),
          d && pB.applyMatrix4(d),
          pB.applyMatrix4(n.matrixWorldInverse));
        for (let [t, r] of vB) {
          mB.set(pB.x + t * s, pB.y + r * c, pB.z).applyMatrix4(
            n.projectionMatrix,
          );
          let i = (mB.x * 0.5 + 0.5) * lB.w,
            a = (-mB.y * 0.5 + 0.5) * lB.h;
          ((e.x0 = Math.min(e.x0, i)),
            (e.x1 = Math.max(e.x1, i)),
            (e.y0 = Math.min(e.y0, a)),
            (e.y1 = Math.max(e.y1, a)));
        }
      }
      return !0;
    }
    bubbleSpot(e, t = this.yawGoal) {
      if (!lB.camera) return `ok`;
      if (
        (uB(),
        !this.bubbleRect(hB, t) ||
          hB.x0 < 0 ||
          hB.x1 > lB.vw ||
          hB.y0 < 0 ||
          hB.y1 > lB.vh)
      )
        return `off`;
      if (lB.sound) {
        let e = lB.sound;
        if (
          ((gB.x0 = e.left),
          (gB.y0 = e.top),
          (gB.x1 = e.right),
          (gB.y1 = e.bottom),
          fB(hB, gB, 5))
        )
          return `blocked`;
      }
      let n = dB();
      if (
        n &&
        ((gB.x0 = n.left),
        (gB.y0 = n.top),
        (gB.x1 = n.right),
        (gB.y1 = n.bottom),
        (_B.x > n.left && _B.x < n.right && _B.y > n.top && _B.y < n.bottom) ||
          fB(hB, gB, 5))
      )
        return `blocked`;
      for (let t of Flock.all)
        if (t.group.visible) {
          for (let n of t.birds)
            if (
              !(
                n === this ||
                (n === this.chatWith &&
                  e < this.chatUntil &&
                  e < n.chatUntil) ||
                !n.holdsSpot(e)
              ) &&
              n.bubbleRect(gB, n.spotYaw(e)) &&
              fB(hB, gB, 4)
            )
              return `blocked`;
        }
      return `ok`;
    }
    resume(e) {
      ((this.talkUntil = -1),
        (this.talkToX = null),
        (this.attendUntil = -1),
        (this.chatUntil = -1),
        (this.chatWith = null),
        (this.bubbleUntil = -1),
        (this.bubbleScale = 0),
        this.bubble.scale.setScalar(0),
        (this.bubble.visible = !1),
        this.activity === `doze` && (this.activity = `idle`),
        (this.nextActivity = e + Lz(0.2, Uz.restMax)));
    }
    setShades(e, t) {
      ((this.shadesGoal = +!!e), (this.shadesAt = t));
    }
    snapShades(e) {
      ((this.shadesGoal = typeof e == `number` ? e : +!!e),
        (this.shadesAt = -1),
        this.shades.snap(this.shadesGoal),
        (this.shadesLanded = !0));
    }
    showBubble(e, t, n) {
      ((this.bubble.material = t), (this.bubbleUntil = e + n));
    }
    update(e, t, n, r, i = 0.46) {
      (this.takeoffAt >= 0 &&
        t >= this.takeoffAt &&
        ((this.takeoffAt = -1),
        t >= this.bubbleUntil &&
          ((this.bubbleScale = 0),
          this.bubble.scale.setScalar(0),
          (this.bubble.visible = !1)),
        (this.mode = `flying`),
        sound.sfx.birdFlap(0.3),
        (this.path = this.pendingPath),
        (this.pathLen = Math.max(0.001, this.path.getLength())),
        (this.dist = 0),
        (this.flightYaw = this.yaw),
        (this.landTurn = NaN),
        (this.turnOffset = 0),
        (this.baseYaw =
          Math.random() < 0.3 ? Rz([-1, 1]) * Lz(1.1, 1.5) : Lz(-0.8, 0.8)),
        this.squash.kick(4),
        this.lift.kick(1.5)),
        (this.squash.target = 0),
        (this.pitch.target = this.groove.pitch),
        (this.roll.target = this.groove.roll),
        (this.lift.target = 0),
        (this.puff.target = 0),
        (this.wingOut.target = 0),
        (this.peek.target = 0),
        (this.eyesClosed = !1),
        this.mode === `perched`
          ? this.updatePerched(e, t, n, r, i)
          : this.updateFlight(e),
        this.updateShades(t),
        (this.lid.target = +!this.eyesClosed));
      for (let t of this.springs) t.update(e);
      (this.updateHeading(e, t), this.applyPose(e, t));
    }
    updatePerched(e, t, n, r, i) {
      let a = this.takeoffAt >= 0;
      switch (
        (this.talkUntil > 0 &&
          t > this.talkUntil &&
          ((this.talkUntil = -1), (this.talkToX = null)),
        this.talkUntil > 0
          ? (this.talkToX !== null &&
              (this.turnOffset = Bz(
                Vz(this.yawTowards(this.talkToX) - this.baseYaw),
                -1.4,
                1.4,
              )),
            (this.beak = Math.sin(t * 24) > 0 ? 0.6 : 0.05),
            t > this.nextBeat &&
              !this.groove.cued &&
              (this.squash.kick(Lz(0.6, 1.4)),
              this.pitch.kick(Lz(-0.6, 0.6)),
              (this.nextBeat = t + Lz(0.18, 0.3))),
            (this.pitch.target = 0.08),
            (this.wingOut.target = Math.sin(t * 18) > 0.6 ? 0.25 : 0))
          : ((this.beak *= 1 - zz(e, 20)),
            t < this.attendUntil &&
              this.activity !== `shuffle` &&
              ((this.turnOffset = Bz(
                Vz(this.yawTowards(this.attendX) - this.baseYaw),
                -1.4,
                1.4,
              )),
              (this.roll.target = 0.16))),
        !a &&
          this.talkUntil < 0 &&
          t > this.attendUntil &&
          t > this.nextActivity &&
          this.startActivity(t, n, r, i),
        this.activity)
      ) {
        case `look`:
          this.pitch.target = this.lookPitch;
          break;
        case `bounce`:
          t > this.nextBeat &&
            (this.squash.kick(-2.2),
            this.lift.kick(0.9),
            (this.nextBeat = t + 0.32));
          break;
        case `preen`:
          ((this.roll.target = this.preenSide * 0.42),
            (this.pitch.target = 0.3),
            (this.wingOut.target = 0.35 + Math.sin(t * 20) * 0.1),
            (this.eyesClosed = !0));
          break;
        case `stretch`:
          ((this.squash.target = 0.28),
            (this.lift.target = 0.05),
            (this.pitch.target = -0.12),
            (this.eyesClosed = !0));
          break;
        case `puff`:
          ((this.puff.target = 0.14), (this.squash.target = -0.08));
          break;
        case `peek`:
          ((this.peek.target = 1), (this.pitch.target = 0.16));
          break;
        case `doze`:
          ((this.eyesClosed = !0),
            (this.puff.target = 0.08),
            (this.squash.target = -0.06 + Math.sin(t * 1.3) * 0.025),
            (this.pitch.target = 0.1));
          break;
        case `shuffle`: {
          let n = this.walkTo - this.perchX;
          ((this.turnOffset = 0),
            (this.baseYaw = Math.sign(n) * Math.PI * 0.5),
            (this.hopPhase += e * 7),
            this.hopPhase >= 1 &&
              (--this.hopPhase, this.lift.kick(1.4), this.squash.kick(2)),
            (this.perchX += Math.sign(n) * Math.min(Math.abs(n), e * 0.5)),
            (this.pitch.target = 0.12),
            Math.abs(n) < 0.005 &&
              ((this.activity = `turn`),
              (this.baseYaw = Lz(-1.1, 1.1)),
              (this.fastTurnUntil = t + 0.5),
              this.squash.kick(-2),
              this.lift.kick(0.5),
              (this.activityEnd = t + 0.6)));
          break;
        }
      }
      (t > this.activityEnd &&
        this.activity !== `shuffle` &&
        (this.activity = `idle`),
        a &&
          ((this.squash.target = -0.22),
          (this.pitch.target = 0.25),
          (this.wingOut.target = 0.3)),
        (this.squash.target += Math.sin(t * 2.2 + this.perchX * 3) * 0.015),
        (this.yawGoal = this.baseYaw + this.turnOffset),
        (this.flightPitch *= 1 - zz(e, 8)),
        (this.flightRoll *= 1 - zz(e, 8)),
        (this.flapAmp *= 1 - zz(e, 10)),
        (this.fly *= 1 - zz(e, 8)),
        this.placeOnPerch());
    }
    startActivity(e, t, n, r) {
      let i = Math.random();
      this.turnOffset = 0;
      let a = 1 - n,
        o = this.shadesGoal === 1 && this.shades.x > 0.9,
        s = Lz(Uz.restMin, Uz.restMax) * (1 + a * 0.6);
      if (a > 0.65 && Math.random() < 0.3) {
        if (
          ((this.activity = `doze`),
          this.squash.kick(-1),
          (this.activityEnd = e + Lz(2.5, 5)),
          (s = this.activityEnd - e + 0.2),
          Math.random() < 0.5)
        ) {
          let n = (r / Gz) * SB;
          (!(
            e < this.chatUntil ||
            t.some(
              (t) =>
                t !== this &&
                Math.abs(t.perchX - this.perchX) < n &&
                t.holdsSpot(e),
            )
          ) &&
            this.bubbleSpot(e, this.baseYaw) === `ok` &&
            this.showBubble(e, oB().doze, 1.4),
            sound.sfx.birdChirp(`doze`, 0.3));
        }
      } else if (o && Math.random() < 0.1)
        ((this.activity = `peek`),
          this.pitch.kick(0.5),
          (this.activityEnd = e + Lz(0.9, 1.6)),
          (s = Math.max(s, this.activityEnd - e)));
      else if (i < 0.32)
        ((this.activity = `look`),
          (this.turnOffset = Lz(-1, 1)),
          (this.lookPitch = Lz(-0.15, 0.2)),
          this.squash.kick(-1),
          (this.activityEnd = e + Lz(0.6, 1.8)));
      else if (i < 0.44)
        ((this.activity = `bounce`),
          (this.nextBeat = e),
          (this.activityEnd = e + Lz(0.6, 1.3)));
      else if (i < 0.54)
        ((this.activity = `preen`),
          (this.preenSide = Math.random() < 0.5 ? -1 : 1),
          (this.turnOffset = this.preenSide * 0.6),
          (this.activityEnd = e + Lz(0.8, 1.5)));
      else if (i < 0.62)
        ((this.activity = `stretch`), (this.activityEnd = e + Lz(0.7, 1.2)));
      else if (i < 0.7)
        ((this.activity = `puff`),
          this.puff.kick(1),
          (this.activityEnd = e + Lz(0.6, 1.1)));
      else if (i < 0.84) {
        let e = Math.random() < 0.5 ? -1 : 1,
          n = Bz(
            this.perchX + e * Lz(0.12, 0.4),
            this.perch.minX,
            this.perch.maxX,
          );
        for (let i of t) {
          if (i === this || e * (i.perchX - this.perchX) <= 0) continue;
          let t =
            e > 0 ? Math.min(i.perchX, i.reachX) : Math.max(i.perchX, i.reachX);
          e * (n - t) > -r && (n = t - e * r);
        }
        e * (n - this.perchX) > 0.05 &&
          ((this.activity = `shuffle`),
          (this.walkTo = n),
          (this.hopPhase = 0.8));
      } else
        ((this.activity = `turn`),
          (this.baseYaw =
            Math.random() < 0.3 ? Rz([-1, 1]) * Math.PI * 0.5 : Lz(-1.1, 1.1)),
          (this.fastTurnUntil = e + 0.5),
          this.squash.kick(-1.6),
          this.lift.kick(0.6),
          (this.activityEnd = e + 0.7));
      this.nextActivity = e + s;
    }
    updateFlight(e) {
      let t = this.path,
        n = this.pathLen - this.dist,
        r = Math.min(Uz.flightSpeed, 1.1 + this.dist * 2.6, 0.32 + n * 1.5);
      this.dist = Math.min(this.pathLen, this.dist + r * e);
      let i = this.dist / this.pathLen;
      (t.getPointAt(i, this.tmpP),
        t.getPointAt(Math.min(1, i + 0.004), this.tmpT),
        t.getPointAt(Math.max(0, i - 0.004), this.tmpQ),
        this.tmpT.sub(this.tmpQ),
        this.tmpT.lengthSq() < 1e-12
          ? this.tmpT.set(0, 0, 1)
          : this.tmpT.normalize(),
        this.rig.position.copy(this.tmpP));
      let a = Bz(1 - n / 0.7, 0, 1),
        o = Bz((Math.hypot(this.tmpT.x, this.tmpT.z) - 0.1) / 0.5, 0, 1);
      o > 0 &&
        (this.flightYaw = Hz(
          this.flightYaw,
          Math.atan2(this.tmpT.x, this.tmpT.z),
          zz(e, 14 * o * o),
        ));
      let s = Math.asin(Bz(this.tmpT.y, -1, 1));
      if (a > 0) {
        let e = Vz(this.baseYaw - this.flightYaw);
        (Number.isNaN(this.landTurn) ||
          (e += Math.round((this.landTurn - e) / Jz) * Jz),
          (this.landTurn = e),
          (this.yawGoal = this.flightYaw + e * a));
      } else this.yawGoal = this.flightYaw;
      ((this.flightPitch +=
        (0.5 - s * 0.6 - a * 0.9 - this.flightPitch) * zz(e, 6)),
        (this.flightRoll +=
          (Bz(-this.yawVel * 0.2, -0.7, 0.7) * (1 - a) - this.flightRoll) *
          zz(e, 5)));
      let c = this.tmpT.y < -0.2 && a === 0 && this.dist > 1.2,
        l = c ? 0.35 : 1,
        u = c ? 2 : a > 0 || this.dist < 1.2 ? 11 : 8;
      ((this.flapPhase += e * u * Math.PI * 2),
        (this.flapAmp += (l - this.flapAmp) * zz(e, 6)),
        (this.fly += (1 - this.fly) * zz(e, 8)),
        (this.squash.target = c
          ? -0.06
          : 0.04 + Math.sin(this.flapPhase) * 0.05),
        (this.beak *= 1 - zz(e, 10)),
        this.dist >= this.pathLen &&
          ((this.mode = `perched`),
          (this.path = null),
          (this.perchX = this.tmpP.x),
          this.squash.kick(-5),
          this.pitch.kick(-2),
          (this.activity = `idle`),
          (this.nextActivity = 0)));
    }
    updateHeading(e, t) {
      let n = this.mode === `flying`,
        r = t < this.fastTurnUntil,
        i = Math.max(0.1, Uz.turnSpeed),
        a = (n ? 110 : r ? 160 : 90) * i,
        o = (n ? 19 : r ? 17 : 11) * Math.sqrt(i),
        s = (n ? qz : Kz) * i,
        c = e / 2;
      for (let e = 0; e < 2; e++) {
        let e = Vz(this.yawGoal - this.yaw);
        ((this.yawVel = Bz(this.yawVel + (a * e - o * this.yawVel) * c, -s, s)),
          (this.yaw += this.yawVel * c));
      }
      Math.abs(this.yaw) > Math.PI && (this.yaw = Vz(this.yaw));
    }
    updateShades(e) {
      (this.shadesAt >= 0 &&
        e >= this.shadesAt &&
        ((this.shadesAt = -1),
        this.shades.target !== this.shadesGoal &&
          ((this.shades.target = this.shadesGoal),
          (this.shadesLanded = this.shadesGoal < 1),
          this.wingOut.kick(3.5),
          this.shadesGoal === 0 && this.pitch.kick(-0.8))),
        this.shades.target === 0 && this.shades.x < 0 && this.shades.snap(0),
        !this.shadesLanded &&
          this.shades.x > 0.92 &&
          ((this.shadesLanded = !0),
          this.squash.kick(-2.2),
          this.pitch.kick(0.9)));
    }
    applyPose(e, t) {
      let n = Uz.scale;
      (this.rig.rotation.set(this.flightPitch, this.yaw, this.flightRoll),
        this.rig.scale.setScalar(n),
        this.root.position.copy(this.rig.position),
        this.root.rotation.set(this.flightPitch, this.yaw, this.flightRoll),
        this.root.scale.setScalar(n));
      let r = Bz(this.squash.x, -0.45, 0.6),
        i = 1 / Math.sqrt(1 + r),
        a = 1 + this.puff.x;
      (this.squashN.scale.set(i * a, (1 + r) * a, i * a),
        this.hip.rotation.set(this.pitch.x, 0, this.roll.x),
        (this.hip.position.y = Math.max(0, this.lift.x * 0.1)),
        t > this.nextBlink &&
          this.lid.x > 0.9 &&
          ((this.blinkT = 0),
          (this.nextBlink = t + (Math.random() < 0.2 ? 0.25 : Lz(1.8, 4.5)))));
      let o = Bz(this.lid.x, -0.1, 1.3);
      if (this.blinkT >= 0) {
        this.blinkT += e;
        let t = this.blinkT / 0.16;
        t >= 1 ? (this.blinkT = -1) : (o *= 1 - Math.sin(Math.PI * t) * 0.95);
      }
      this.eyeOpen = Math.max(0, o);
      let s = Math.max(-0.2, 1 - this.eyeOpen);
      for (let e of this.eyeGroups)
        e.scale.set(1 + Math.max(0, s) * 0.2, Math.max(0.06, 1 - s * 0.88), 1);
      this.jawN.rotation.x = this.beak * 0.55;
      let c =
        (Math.sin(this.flapPhase) * 0.5 + 0.5) * 1.6 * this.flapAmp +
        0.25 * this.fly;
      for (let e = 0; e < 2; e++)
        this.wingPivots[e].rotation.set(
          -0.25 * this.fly,
          0,
          (e === 0 ? -1 : 1) * (0.08 + this.wingOut.x + c),
        );
      let l = this.layout,
        u = this.shades.x,
        d = Bz(u / 0.3, 0, 1),
        f = 1 - (u < 0.3 ? 0 : u <= 1 ? (u - 0.3) / 0.7 : 1 + (u - 1) * 0.6),
        p = this.peek.x,
        m = this.glassesN;
      (m.position.set(
        l.glasses[0],
        l.glasses[1] + l.glassesUp[1] * f - p * 0.075,
        l.glasses[2] + l.glassesUp[2] * f + p * 0.012,
      ),
        m.rotation.set(-1.05 * f + p * 0.3, 0, 0),
        m.scale.setScalar(
          Math.max(1e-4, d * (1 + Math.sin(d * Math.PI) * 0.25)),
        ));
      let h = this.accessory.hat;
      if (h) {
        let e = l.hat,
          t = this.hatN;
        (t.position.set(e.pos[0], e.pos[1], e.pos[2]),
          t.rotation.set(
            e.tilt - Bz(this.pitch.v * 0.025, -0.15, 0.15),
            h.yaw,
            h.roll - Bz(this.roll.v * 0.025, -0.15, 0.15),
          ));
        let n = Math.max(1e-4, this.hatPop.x);
        t.scale.setScalar(e.scale * n);
      }
      this.rig.updateMatrixWorld(!0);
      let g = +(t < this.bubbleUntil);
      this.bubbleScale += (g - this.bubbleScale) * zz(e, g ? 14 : 18);
      let _ =
        this.bubbleScale * (1 + Math.sin(this.bubbleScale * Math.PI) * 0.25);
      (this.bubble.scale.set(0.3 * _, 0.225 * _, 1),
        (this.bubble.visible = this.bubbleScale > 0.01));
    }
  };
  function rne(e, t, n, r) {
    let i = e.maxX - e.minX,
      a = t > 1 ? Math.min(t, Math.floor(i / n + 1e-6) + 1) : t,
      o = Math.max(i / Math.max(1, a), Math.min(r, i / Math.max(1, a - 1))),
      s = Bz((o - n) / 4, 0, 0.05),
      c = (e.minX + e.maxX) / 2,
      l = [];
    for (let t = 0; t < a; t++)
      l.push(Bz(c + (t - (a - 1) / 2) * o + Lz(-s, s), e.minX, e.maxX));
    return l;
  }
  var ine = (e) => [
    e.tail.color,
    e.beak.color,
    e.mouth.color,
    e.jaw.color,
    e.wingColors[0],
    e.wingColors[1],
  ];
  var Flock = class e {
    perch;
    static all = [];
    static nextIndex = 0;
    static rebuildAll() {
      for (let t of e.all) t.rebuild();
    }
    static applyAccessories() {
      for (let t of e.all) t.dealAccessories(!0);
    }
    static rerollAccessories(t) {
      return (
        (Uz.accessorySeed = t ?? Math.floor(Math.random() * 2147483647)),
        e.applyAccessories(),
        Uz.accessorySeed
      );
    }
    static prewarmTextures(e) {
      let t = oB();
      for (let n of [...t.talk, t.alarm, t.doze]) n.map && e.initTexture(n.map);
    }
    group = new Group();
    birds = [];
    nextChat = 2;
    chatEnd = 0;
    chatQueue = [];
    lastNow = -1 / 0;
    bodies;
    partSet;
    eyeSet;
    shadeSet;
    hatSet;
    hatA;
    hatB;
    partColors;
    eyeColors;
    bodyMesh;
    partMesh;
    eyeMesh;
    glassesMesh;
    hatMesh;
    glassesBirds = [];
    hatBirds = [];
    order = [];
    index;
    dealt = {
      on: !1,
      glasses: -1,
      glassesUp: -1,
      hat: -1,
      seed: -1,
    };
    bounds = new Sphere();
    hits = [];
    bodyKind = Uz.body;
    layout = uz(this.bodyKind);
    daylight = 1;
    daylightKnown = !1;
    glassesOn = null;
    constructor(t, n, r) {
      ((this.perch = t),
        (this.index = r ?? e.nextIndex++),
        (this.group.name = `Birds`));
      let i = rne(t, n, this.birdWidth() * Wz, this.birdWidth() * Gz);
      for (let e = 0; e < i.length; e++) {
        let n = i[e],
          r = new Bird(
            t,
            n,
            Math.random() < 0.3 ? Rz([-1, 1]) * Lz(1.1, 1.5) : Lz(-0.7, 0.7),
          );
        ((r.root.name = `Bird_${e + 1}`),
          (r.hit.userData.flock = this),
          this.birds.push(r),
          this.order.push(r),
          this.group.add(r.root));
      }
      let a = this.birds.length;
      ((this.bodies = new InstancePool(a, this.bounds)),
        (this.partSet = new InstancePool(a * Yz, this.bounds)),
        (this.partColors = this.partSet.addAttribute(`color`, 3, 1)),
        (this.eyeSet = new InstancePool(a * Xz, this.bounds)),
        (this.eyeColors = this.eyeSet.addAttribute(`color`, 3)),
        (this.shadeSet = new InstancePool(a, this.bounds)),
        (this.hatSet = new InstancePool(a, this.bounds)),
        (this.hatA = this.hatSet.addAttribute(hz, 4)),
        (this.hatB = this.hatSet.addAttribute(gz, 4)),
        this.bodies.setCount(a),
        this.partSet.setCount(a * Yz),
        this.eyeSet.setCount(a * Xz));
      let o = (e) => (this.group.add(e), e);
      ((this.bodyMesh = o(
        IR(`BirdBodies`, this.bodies.view($R(this.bodyKind)), tB.body, !0),
      )),
        (this.partMesh = o(
          IR(`BirdParts`, this.partSet.view(VR), tB.parts, !0),
        )),
        (this.eyeMesh = o(IR(`BirdEyes`, this.eyeSet.view(HR), tB.eyes, !1))),
        (this.glassesMesh = o(
          IR(
            `BirdShades`,
            this.shadeSet.view(uz(this.bodyKind).glassesGeo),
            tB.glasses,
            !1,
          ),
        )),
        (this.hatMesh = o(IR(`BirdHats`, this.hatSet.view(Ez()), tB.hats, !0))),
        e.all.push(this),
        this.rebuild(),
        this.dealAccessories(!1));
    }
    get hitTargets() {
      this.hits.length = 0;
      for (let e of this.birds) e.isPerched && this.hits.push(e.hit);
      return this.hits;
    }
    setDaylight(e) {
      ((this.daylight = Bz(e, 0, 1)),
        this.daylightKnown ||
          ((this.daylightKnown = !0), (this.glassesOn = null)));
    }
    rebuild() {
      this.bodyKind = Uz.body;
      let e = uz(this.bodyKind);
      this.layout = e;
      for (let t of this.birds) t.applyLayout(e);
      let t = this.birds.length;
      ((this.bodyMesh.geometry = this.bodies.view($R(this.bodyKind))),
        (this.glassesMesh.geometry = this.shadeSet.view(e.glassesGeo)),
        (this.bodyMesh.visible = t > 0),
        (this.eyeMesh.visible = t > 0),
        (this.partMesh.visible = t > 0));
      let n = new Color(),
        r = ine(e);
      for (let e = 0; e < t; e++) {
        for (let t = 0; t < Yz; t++)
          (n.set(r[t]), this.partColors.setXYZ(e * Yz + t, n.r, n.g, n.b));
        for (let t = 0; t < Xz; t++)
          (n.set(t % 2 ? paperWhite : charcoal),
            this.eyeColors.setXYZ(e * Xz + t, n.r, n.g, n.b));
      }
      ((this.partColors.needsUpdate = !0), (this.eyeColors.needsUpdate = !0));
      for (let e of this.birds) e.pose();
      this.writeInstances();
    }
    sharesChanged() {
      let e = Uz,
        t = this.dealt;
      return (
        t.on !== e.accessories ||
        t.glasses !== e.glassesShare ||
        t.glassesUp !== e.glassesUpShare ||
        t.hat !== e.hatShare ||
        t.seed !== e.accessorySeed
      );
    }
    dealAccessories(e) {
      let t = Uz,
        n = this.dealt;
      ((n.on = t.accessories),
        (n.glasses = t.glassesShare),
        (n.glassesUp = t.glassesUpShare),
        (n.hat = t.hatShare),
        (n.seed = t.accessorySeed));
      let r = Nz(this.birds.length, this.index, n);
      ((this.glassesBirds.length = 0),
        (this.hatBirds.length = 0),
        r.forEach((t, n) => {
          let r = this.birds[n];
          if (
            (r.setAccessory(t, e),
            (t.kind === `shades` || t.kind === `shadesUp`) &&
              this.glassesBirds.push(r),
            t.hat)
          ) {
            let e = this.hatBirds.push(r) - 1;
            (this.hatA.setXYZW(
              e,
              t.hat.main.r,
              t.hat.main.g,
              t.hat.main.b,
              t.hat.typeIndex,
            ),
              this.hatB.setXYZW(
                e,
                t.hat.second.r,
                t.hat.second.g,
                t.hat.second.b,
                0,
              ));
          }
        }),
        (this.hatA.needsUpdate = this.hatB.needsUpdate = !0),
        this.shadeSet.setCount(this.glassesBirds.length),
        this.hatSet.setCount(this.hatBirds.length),
        (this.glassesOn = null));
      for (let e of this.birds) e.pose();
      this.writeInstances();
    }
    scare(e, t) {
      if (e.isPerched) {
        e.flee(t, 0.12, this.makePath(e));
        for (let n of this.birds) {
          if (n === e || !n.isPerched) continue;
          let r = Math.abs(n.perchX - e.perchX);
          r < Uz.panicRadius &&
            Math.random() < 0.85 - r * 0.4 &&
            n.flee(t, Lz(0.18, 0.45) + r * 0.15, this.makePath(n));
        }
      }
    }
    scareAll(e) {
      for (let t of this.birds)
        t.isPerched && t.flee(e, Lz(0, 0.3), this.makePath(t));
    }
    chatNow() {
      ((this.nextChat = 0), (this.chatEnd = 0), (this.chatQueue.length = 0));
    }
    applyScale() {
      for (let e of this.birds) e.root.scale.setScalar(Uz.scale);
    }
    showHitAreas(e) {
      for (let t of this.birds)
        ((t.hit.visible = e), (t.hit.material = e ? tB.hitDebug : tB.hit));
    }
    makePath(e) {
      let t = new Vector3(e.perchX, this.perch.y(e.perchX), 0),
        n = e.perchX - this.perch.minX,
        r = this.perch.maxX - e.perchX;
      for (let t of this.birds) {
        if (t === e) continue;
        let i = t.reachX - e.perchX;
        i > 0 ? (r = Math.min(r, i)) : (n = Math.min(n, -i));
      }
      let i = r > n ? -1 : 1,
        a = Math.min(
          Lz(0.5, 0.9),
          Math.max(0.2, Math.max(n, r) - 0.6 * this.birdWidth()),
        ),
        o = (e, n, r) => t.clone().add(new Vector3(e, n, r));
      return new CatmullRomCurve3(
        [
          t.clone(),
          o(i * 0.25, 0.42, Lz(0.2, 0.5)),
          o(i * Lz(1.6, 3), Lz(1.2, 2.2), Lz(0.6, 2.2)),
          o(i * Lz(2.5, 5), Lz(3, 4.5), Lz(-3, -0.5)),
          o(-i * Lz(0.6, 2), Lz(1.6, 2.6), Lz(0.8, 2)),
          o(-i * a, Lz(0.45, 0.7), Lz(0.3, 0.6)),
          o(-i * 0.12, 0.12, 0.08),
          t.clone(),
        ],
        !1,
        `centripetal`,
      );
    }
    update(e, t, n) {
      ((e = Math.min(e, 0.05)),
        n && (lB.camera = n),
        t - this.lastNow > 1 && this.resume(t),
        (this.lastNow = t),
        Uz.body !== this.bodyKind && this.rebuild(),
        this.sharesChanged() && this.dealAccessories(!0),
        this.updateShades(t),
        this.updateChatter(t));
      let r = this.birdWidth();
      this.keepApart(e, r * Wz);
      for (let n of this.birds)
        n.update(e, t, this.birds, this.daylight, r * Gz);
      this.writeInstances();
    }
    birdWidth() {
      return 2 * this.layout.bodyHalfWidth * Uz.scale;
    }
    keepApart(e, t) {
      let n = this.order,
        r = n.length;
      if (r < 2) return;
      for (let e = 1; e < r; e++) {
        let t = n[e],
          r = e - 1;
        for (; r >= 0 && n[r].perchX > t.perchX; r--) n[r + 1] = n[r];
        n[r + 1] = t;
      }
      let { minX: i, maxX: a } = this.perch;
      t = Math.min(t, ((a - i) / (r - 1)) * 0.98);
      let o = e * 0.5;
      for (let e = 1; e < r; e++) {
        let r = n[e - 1],
          s = n[e],
          c = t - (s.perchX - r.perchX);
        if (c <= 1e-4) continue;
        let l = r.isPerched && r.perchX > i,
          u = s.isPerched && s.perchX < a,
          d = Math.min(c, o);
        l && u
          ? (r.nudge(-d / 2), s.nudge(d / 2))
          : l
            ? r.nudge(-d)
            : u && s.nudge(d);
      }
    }
    updateShades(e) {
      let t = Uz.sunglassesAt,
        n = Uz.sunglasses && this.daylight > (this.glassesOn ? t - 0.1 : t);
      if (this.glassesOn === null)
        for (let e of this.glassesBirds)
          e.accessory.kind === `shades` && e.snapShades(n);
      else if (n !== this.glassesOn) {
        let t = this.glassesBirds
            .filter((e) => e.accessory.kind === `shades`)
            .sort(() => Math.random() - 0.5),
          r = e + Lz(0.1, 0.4);
        for (let e of t) (e.setShades(n, r), (r += Lz(0.12, 0.45)));
      }
      this.glassesOn = n;
    }
    writeInstances() {
      let e = this.birds.length,
        t = this.bounds.center.set(0, 0, 0);
      for (let n = 0; n < e; n++) {
        let e = this.birds[n];
        this.bodies.setMatrix(n, e.bodyN.matrixWorld);
        for (let t = 0; t < Yz; t++)
          this.partSet.setMatrix(n * Yz + t, e.parts[t].matrixWorld);
        for (let t = 0; t < Xz; t++)
          this.eyeSet.setMatrix(n * Xz + t, e.eyeParts[t].matrixWorld);
        t.add(e.position);
      }
      (this.bodies.commit(), this.partSet.commit(), this.eyeSet.commit());
      let n = !1;
      for (let e = 0; e < this.glassesBirds.length; e++) {
        let t = this.glassesBirds[e];
        (this.shadeSet.setMatrix(e, t.glassesN.matrixWorld),
          t.glassesVisible && (n = !0));
      }
      ((this.glassesMesh.visible = n), n && this.shadeSet.commit());
      for (let e = 0; e < this.hatBirds.length; e++)
        this.hatSet.setMatrix(e, this.hatBirds[e].hatN.matrixWorld);
      ((this.hatMesh.visible = this.hatBirds.length > 0),
        this.hatBirds.length && this.hatSet.commit(),
        e > 0 && t.divideScalar(e));
      let r = 0;
      for (let e of this.birds) r = Math.max(r, e.position.distanceTo(t));
      this.bounds.radius = r + 0.65 * Uz.scale;
    }
    updateChatter(e) {
      for (let t = this.chatQueue.length - 1; t >= 0; t--) {
        let n = this.chatQueue[t];
        e < n.at ||
          (n.bird.isPerched &&
            (n.bird.say(e, n.dur, n.listener.perchX),
            n.listener.isPerched &&
              n.listener.attend(e, n.dur + 0.3, n.bird.perchX)),
          this.chatQueue.splice(t, 1));
      }
      if (e < this.nextChat || e < this.chatEnd || this.chatQueue.length)
        return;
      this.nextChat =
        e + Lz(Uz.chatMin, Uz.chatMax) * (1 + (1 - this.daylight) * 0.8);
      let t = this.birds.filter(
        (t) => t.isPerched && !t.isTalking && !t.bubbleBusy(e),
      );
      if (t.length < 2) return;
      let n = (e) => {
          let n = e,
            r = 1 / 0;
          for (let i of t) {
            let t = Math.abs(i.perchX - e.perchX);
            i !== e && t < r && ([n, r] = [i, t]);
          }
          return n;
        },
        r = t.filter(
          (t) => t.bubbleSpot(e, t.talkYaw(n(t).perchX)) !== `blocked`,
        );
      if (!r.length) {
        this.nextChat = e + Lz(0.4, 0.8);
        return;
      }
      let i = Rz(r),
        a = n(i);
      if (Math.abs(a.perchX - i.perchX) > 1.1) return;
      let o = a.bubbleSpot(e, a.talkYaw(i.perchX)) !== `blocked`,
        s = e,
        c = e,
        l = o ? 1 + Math.floor(Math.random() * 3) : 1;
      for (let e = 0; e < l; e++) {
        let [t, n] = e % 2 == 0 ? [i, a] : [a, i],
          r = Lz(0.7, 1.4);
        (this.chatQueue.push({
          at: s,
          bird: t,
          listener: n,
          dur: r,
        }),
          (c = s + r),
          (s = c + Lz(0.15, 0.4)));
      }
      ((this.chatEnd = c + 0.3),
        (i.chatUntil = a.chatUntil = this.chatEnd),
        (i.chatWith = a),
        (a.chatWith = i));
    }
    resume(e) {
      ((this.chatQueue.length = 0),
        (this.chatEnd = 0),
        (this.nextChat = e + Lz(0.8, 2.5)));
      for (let t of this.birds) t.resume(e);
    }
  };
  return {
    VR,
    HR,
    $R,
    uz,
    vz,
    Dz,
    Iz,
    Uz,
    cB,
    xB,
    Flock,
  };
}
