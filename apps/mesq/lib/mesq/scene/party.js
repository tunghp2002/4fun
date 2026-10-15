// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  Box2,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicNodeMaterial,
  Path,
  PlaneGeometry,
  Quaternion,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector4,
} from "three/webgpu";
import {
  abs,
  attribute,
  clamp,
  cos,
  cross,
  dot,
  exp,
  floor,
  Fn,
  fract,
  fwidth,
  hash,
  length,
  max,
  min,
  mix,
  mod,
  normalize,
  normalLocal,
  positionGeometry,
  positionLocal,
  pow,
  sin,
  smoothstep,
  step,
  uniform,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function createPartyModule(
  scope,
  {
    paletteModule,
    renderingModule,
    audioModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
    trafficLightsModule,
    meshBuildersModule,
  },
) {
  const {
    paperWhite,
    polePurple,
    amber,
    shadowPurple,
    paleBlue,
    inkPurple,
    palette,
  } = paletteModule;
  const { createToonMaterial } = renderingModule;
  const { sL, lL, uL, dL, gL, xL, SynthVoice, SoundLimiter, DL, OL } =
    audioModule;
  const { WB } = dialogueModule;
  const { aV } = ledPixelsModule;
  const {
    sH,
    cH,
    Z,
    mH,
    createPart,
    $,
    yH,
    bH,
    xH,
    SH,
    CH,
    mapAtlasUV,
    TH,
    AH,
    jH,
    LH,
    zH,
    VH,
    bakeStaticGeometry,
  } = stickersModule;
  const { XH, ZH, OU } = signArtModule;
  const { qW, JW, tG, oG, sG, cG } = trafficLightsModule;
  const {
    PG,
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
  } = meshBuildersModule;
  var TK = {
    pool: 6,
    size: 1.2,
    solo: 1.35,
    face: 0.05,
    pop: 0.22,
    fly: 1.3,
    drag: 0.5,
    out: 0.5,
    dip: 0.45,
    rise: 0.2,
    margin: 0.22,
    wall: 0.16,
    bend: 0.12,
    bends: [0, 0.5, 1, -1, 2],
    bendCost: 0.08,
    edge: 0.03,
    lap: 0.04,
    berth: 0.04,
    sway: 0.035,
    swayRate: 9,
    shrink: 0.25,
    fade: 0.55,
    freq: 34,
    space: 0.8,
    every: 2,
    burst: [
      [1.1, 1],
      [1.15, 0.95],
    ],
    gap: 0.12,
    soloArc: [0.8, 1],
    wait: 1,
    calmAt: 0.03,
    calmDrift: [0.06, 0.08],
    calmFly: 1.05,
    calmSpace: 1,
  };
  var EK = [
    [1, 0],
    [0, 1],
  ];
  var DK = 0.25;
  var OK = 4;
  var kK = {
    rise: 0.1,
    fall: 7,
    thump: 2.4,
    punch: 0.12,
    snap: 20,
    boost: 0.8,
    boostIn: 25,
    boostFade: 1.2,
    knee: 1.5,
    most: 2,
    wide: 0.07,
    long: 0.045,
  };
  var AK = [
    [-0.5, 0.48, 0.72],
    [0.52, 0.2, 0.83],
    [-0.18, -0.5, 0.85],
    [0.2, 0.72, 0.66],
  ];
  var jK = 0.085;
  var MK = (e, t) => new Vector2(e, t);
  var NK = MathUtils.clamp;
  function PK(e = 0) {
    let { w: t, h: n } = eK,
      r = [MK(-t / 2, 0), MK(0, -n), MK(t / 2, 0)];
    if (e > 0) {
      let i = r[1].distanceTo(r[2]),
        a = r[2].distanceTo(r[0]),
        o = r[0].distanceTo(r[1]),
        s = (t * n) / (i + a + o),
        c = MK(0, 0)
          .addScaledVector(r[0], i)
          .addScaledVector(r[1], a)
          .addScaledVector(r[2], o)
          .divideScalar(i + a + o);
      for (let t of r)
        t.sub(c)
          .multiplyScalar((s - e) / s)
          .add(c);
    }
    return CH(r, 0.024 - e);
  }
  var FK = 0.01;
  var IK = (() => {
    let e = PK(FK).getPoints(8),
      t = new Box2().setFromPoints(e),
      { w: n, h: r } = eK,
      i = (n * r) / (n + 2 * Math.hypot(n / 2, r));
    return {
      pts: e,
      box: t,
      letterY: -i,
      rho: i,
    };
  })();
  var LK = 400;
  var RK = (e, t, n) => {
    let r = t / tK.length,
      { pts: i, box: a } = IK,
      o = a.max.x - a.min.x,
      s = a.max.y - a.min.y,
      c = r / o;
    tK.forEach((t, o) => {
      let l = o * r,
        u = (e) => l + (e - a.min.x) * c,
        d = (e) => (a.max.y - e) * (n / s);
      (e.save(),
        e.beginPath(),
        e.rect(l, 0, r, n),
        e.clip(),
        (e.fillStyle = nK[o]),
        e.fillRect(l, 0, r, n),
        (e.fillStyle = `rgba(255, 255, 255, 0.4)`));
      let f = 0.022 * c;
      for (let t = f * 0.7; t < n * 0.42; t += f)
        for (let i = l + f * 0.7; i < l + r; i += f) {
          let a =
            f *
            0.36 *
            (1 - t / (n * 0.42)) *
            NK(Math.abs(i - l - r / 2) / (r * 0.32) - 0.25, 0, 1);
          a < 0.5 || (e.beginPath(), e.arc(i, t, a, 0, Math.PI * 2), e.fill());
        }
      let p = u(0),
        m = d(IK.letterY);
      (e.beginPath(),
        i.forEach((t, n) => {
          let r = p + (u(t.x) - p) * 0.84,
            i = m + (d(t.y) - m) * 0.84;
          n ? e.lineTo(r, i) : e.moveTo(r, i);
        }),
        e.closePath(),
        (e.strokeStyle = inkPurple),
        (e.lineWidth = 0.008 * c),
        (e.lineJoin = `round`),
        e.stroke(),
        (e.font = XH(0.185 * c)),
        (e.textAlign = `center`),
        (e.textBaseline = `middle`));
      let h = m + 0.008 * c;
      ((e.fillStyle = paperWhite),
        e.fillText(t, p + 0.007 * c, h + 0.007 * c),
        (e.fillStyle = inkPurple),
        e.fillText(t, p, h),
        e.restore());
    });
  };
  var zK = (e, t, n) => {
    ((e.fillStyle = inkPurple), e.fillRect(0, 0, t, n));
    let r = t * 0.12;
    ((e.fillStyle = `#ecebf5`),
      e.fillRect(r, r, t - 2 * r, n - 2 * r),
      (e.fillStyle = `#ffffff`),
      e.fillRect(r * 1.7, r * 1.7, t * 0.24, n * 0.13));
  };
  var BK = (e, t, n) => `#${new Color(e).lerp(new Color(t), n).getHexString()}`;
  var VK = (e) => ((225 - e * 33.75) * Math.PI) / 180;
  var HK = {
    w: 0.33,
    h: 0.455,
    px: 560,
    eq: {
      y: 0.1175,
      w: 0.29,
      h: 0.15,
    },
    lamps: {
      cols: [2, 18],
      names: [`L`, `R`],
      size: 0.022,
      gap: 0.024,
    },
    knobs: {
      y: -0.0425,
      x: 0.115,
      r: 0.022,
      vol: 0.04,
    },
    hot: 2,
    screw: 0.007,
    toggle: {
      x: -0.08,
      y: -0.1675,
      w: 0.08,
      h: 0.036,
      r: 0.01,
    },
    on: {
      x: 0.09,
      y: -0.1675,
      bezel: 0.022,
    },
    label: {
      size: 0.021,
      knob: 0.028,
      vol: 0.028,
      under: 0.035,
    },
  };
  var UK = (e, t) => -e.eq.w / 2 + ((t + 1.5) / mK.cols) * e.eq.w;
  var WK = (e) => (t, n, r) => {
    let { eq: i, knobs: a, toggle: o, on: s, label: c } = e,
      l = n / e.w,
      u = (e) => n / 2 + e * l,
      d = (e) => r / 2 - e * l;
    ((t.fillStyle = shadowPurple),
      t.fillRect(0, 0, n, r),
      (t.strokeStyle = palette.yellow),
      (t.lineWidth = 0.007 * l),
      t.beginPath(),
      t.roundRect(
        0.014 * l,
        0.014 * l,
        n - 0.028 * l,
        r - 0.028 * l,
        0.026 * l,
      ),
      t.stroke(),
      (t.fillStyle = `#0d0a18`),
      t.beginPath(),
      t.roundRect(
        u(-i.w / 2 - 0.014),
        d(i.y + i.h / 2 + 0.014),
        (i.w + 0.028) * l,
        (i.h + 0.028) * l,
        0.018 * l,
      ),
      t.fill(),
      (t.fillStyle = palette.yellow),
      (t.textAlign = `center`),
      (t.textBaseline = `middle`),
      (t.font = ZH(e.lamps.size * l)),
      e.lamps.cols.forEach((n, r) =>
        t.fillText(
          e.lamps.names[r],
          u(UK(e, n)),
          d(i.y - i.h / 2 - e.lamps.gap),
        ),
      ),
      (t.lineWidth = 0.0045 * l),
      (t.lineCap = `round`));
    for (let [n, r] of [
      [-a.x, a.r],
      [0, a.vol],
      [a.x, a.r],
    ])
      for (let i = 0; i < 9; i++) {
        let o = VK(i);
        ((t.strokeStyle =
          n === 0 && i >= 9 - e.hot ? palette.hotPink : palette.yellow),
          t.beginPath(),
          t.moveTo(
            u(n + Math.cos(o) * (r + 0.008)),
            d(a.y + Math.sin(o) * (r + 0.008)),
          ),
          t.lineTo(
            u(n + Math.cos(o) * (r + 0.019)),
            d(a.y + Math.sin(o) * (r + 0.019)),
          ),
          t.stroke());
      }
    ((t.font = ZH(0.019 * l)),
      t.fillText(
        `11`,
        u(Math.cos(hK.volMax) * (a.vol + 0.032)),
        d(a.y + Math.sin(hK.volMax) * (a.vol + 0.032)),
      ),
      (t.fillStyle = `#3b3058`),
      t.beginPath(),
      t.roundRect(
        u(o.x - o.w / 2),
        d(o.y + o.h / 2),
        o.w * l,
        o.h * l,
        o.r * l,
      ),
      t.fill(),
      t.beginPath(),
      t.arc(u(s.x), d(s.y), s.bezel * l, 0, Math.PI * 2),
      t.fill(),
      (t.fillStyle = palette.yellow),
      (t.font = ZH(c.size * l)),
      t.fillText(`BASS`, u(-a.x), d(a.y - a.r - c.knob)),
      t.fillText(`VOL`, u(0), d(a.y - a.vol - c.vol)),
      t.fillText(`TWEET`, u(a.x), d(a.y - a.r - c.knob)),
      t.fillText(`PARTY`, u(o.x), d(o.y - c.under)),
      t.fillText(`ON`, u(s.x), d(s.y - c.under)));
  };
  var GK = (e) => (t, n, r) => {
    let i = n / e.w,
      a = e.h / 0.068;
    ((t.fillStyle = palette.yellow),
      t.fillRect(0, 0, n, r),
      (t.textAlign = `center`),
      (t.textBaseline = `middle`),
      (t.font = XH(0.05 * a * i)),
      (t.fillStyle = paperWhite),
      t.fillText(`BIRD FM`, n / 2 + 0.004 * a * i, r / 2 + 0.007 * a * i),
      (t.fillStyle = inkPurple),
      t.fillText(`BIRD FM`, n / 2, r / 2 + 0.003 * a * i),
      (t.lineWidth = 0.003 * a * i),
      (t.strokeStyle = inkPurple),
      (t.fillStyle = paleBlue));
    for (let n of [0.026 * a, e.w - 0.026 * a])
      (t.beginPath(),
        t.arc(n * i, r / 2, 0.009 * a * i, 0, Math.PI * 2),
        t.fill(),
        t.stroke());
  };
  var KK = {
    warn: [0, 0.13, 0.12],
    code: [0.14, 0.2, 0.07],
    label: [0.35, 0.23, 0.09],
  };
  var qK = {
    w: 0.58,
    h: 0.12,
    density: 700,
  };
  var JK = ([e, t, n], r) => {
    let i = mH(`party.bits`),
      a = i.u1 - i.u0;
    return {
      u0: i.u0 + (e / r.w) * a,
      u1: i.u0 + ((e + t) / r.w) * a,
      v0: i.v1 - (n / r.h) * (i.v1 - i.v0),
      v1: i.v1,
    };
  };
  var YK = (e) => JK(KK[e], qK);
  var XK = (e, t, [n, r, i]) => {
    let a = (n + r / 2) * t,
      o = i / 0.1,
      s = (o) => {
        (e.beginPath(),
          e.moveTo(a, (0.012 + o * 1.6) * t),
          e.lineTo((n + 0.01 + o * 1.4) * t, (i - 0.01 - o) * t),
          e.lineTo((n + r - 0.01 - o * 1.4) * t, (i - 0.01 - o) * t),
          e.closePath());
      };
    (s(0),
      (e.fillStyle = paperWhite),
      (e.strokeStyle = paperWhite),
      (e.lineWidth = 0.014 * t),
      e.fill(),
      e.stroke(),
      s(0.006),
      (e.fillStyle = palette.yellow),
      (e.strokeStyle = inkPurple),
      (e.lineWidth = 0.005 * t),
      e.fill(),
      e.stroke());
    let c = i * 0.62;
    ((e.fillStyle = inkPurple), e.beginPath());
    for (let [n, r] of [
      [0.006, -0.03],
      [-0.012, 0.004],
      [0.001, 0.004],
      [-0.006, 0.03],
      [0.013, -0.006],
      [0, -0.006],
    ])
      e.lineTo(a + n * o * t, (c + r * o) * t);
    e.fill();
  };
  var ZK = (e, t, [n, r, i], a) => {
    ((e.fillStyle = paperWhite),
      (e.strokeStyle = inkPurple),
      (e.lineWidth = 0.003 * t),
      e.beginPath(),
      e.roundRect(
        (n + 0.003) * t,
        0.003 * t,
        (r - 0.006) * t,
        (i - 0.006) * t,
        0.008 * t,
      ),
      e.fill(),
      e.stroke(),
      (e.fillStyle = inkPurple),
      (e.font = ZH(0.021 * t)),
      (e.textAlign = `left`),
      a.forEach((i, a) =>
        e.fillText(
          i,
          (n + 0.014) * t,
          (0.022 + a * 0.024) * t,
          (r - 0.028) * t,
        ),
      ),
      (e.textAlign = `center`));
  };
  var QK = {
    "party.pennants": {
      w: Math.round((IK.box.max.x - IK.box.min.x) * LK) * tK.length,
      h: Math.round((IK.box.max.y - IK.box.min.y) * LK),
      paint: RK,
    },
    "party.tile": {
      w: 28,
      h: 28,
      paint: zK,
    },
    "party.panel": {
      w: Math.round(HK.w * HK.px),
      h: Math.round(HK.h * HK.px),
      paint: WK(HK),
    },
    "party.hood": {
      w: Math.round(pK.w * 480),
      h: Math.round(pK.h * 480),
      paint: GK(pK),
    },
    "party.bits": {
      w: Math.round(qK.w * qK.density),
      h: Math.round(qK.h * qK.density),
      paint: (e, t) => {
        let n = t / qK.w;
        ((e.lineJoin = `round`),
          (e.textAlign = `center`),
          (e.textBaseline = `middle`),
          XK(e, n, KK.warn));
        {
          let [t, r, i] = KK.code;
          ((e.font = ZH(0.058 * n)),
            (e.fillStyle = paperWhite),
            e.fillText(
              `BF-07`,
              (t + r / 2 + 0.004) * n,
              (i / 2 + 0.006) * n,
              (r - 0.01) * n,
            ),
            (e.fillStyle = inkPurple),
            e.fillText(
              `BF-07`,
              (t + r / 2) * n,
              (i / 2 + 0.002) * n,
              (r - 0.01) * n,
            ));
        }
        ZK(e, n, KK.label, [`BIRD FM  AMP-2`, `2x60W  100V`, `POST NO BILLS`]);
      },
    },
  };
  var $K = {
    lift: -0.53,
    x: 0.5,
    maxScale: 0.74,
  };
  var eq = [
    `#f6f6ff`,
    `#dcd8f4`,
    `#c6cff2`,
    `#e9f7ff`,
    `#b8aee6`,
    `#fff1c4`,
    `#ffd3ec`,
    `#bff0ff`,
  ];
  function tq(e, t, n) {
    let r = mH(`party.tile`),
      i = [
        [r.u0, r.v0],
        [r.u1, r.v0],
        [r.u1, r.v1],
        [r.u0, r.v1],
      ],
      a = eq.map(() => ({
        pos: [],
        nor: [],
        uv: [],
        idx: [],
      })),
      o = (t, n) =>
        Z(
          Math.cos(t) * Math.sin(n) * e,
          Math.sin(t) * e,
          Math.cos(t) * Math.cos(n) * e,
        ),
      s = Z();
    for (let e = 0; e < t; e++) {
      let r = -Math.PI / 2 + (Math.PI * e) / t,
        c = r + Math.PI / t,
        l = Math.max(5, Math.round(n * Math.cos((r + c) / 2))),
        u = sH(0, (Math.PI * 2) / l);
      for (let e = 0; e < l; e++) {
        let t = u + (Math.PI * 2 * e) / l,
          n = t + (Math.PI * 2) / l,
          d = [o(r, t), o(r, n), o(c, n), o(c, t)];
        s.set(0, 0, 0);
        for (let e of d) s.add(e);
        s.normalize();
        let f = a[cH(eq.length)],
          p = f.pos.length / 3;
        (d.forEach((e, t) => {
          (f.pos.push(e.x, e.y, e.z),
            f.nor.push(s.x, s.y, s.z),
            f.uv.push(i[t][0], i[t][1]));
        }),
          f.idx.push(p, p + 1, p + 2, p, p + 2, p + 3));
      }
    }
    return a.map((e) => {
      let t = new BufferGeometry();
      return (
        t.setAttribute(`position`, new Float32BufferAttribute(e.pos, 3)),
        t.setAttribute(`normal`, new Float32BufferAttribute(e.nor, 3)),
        t.setAttribute(`uv`, new Float32BufferAttribute(e.uv, 2)),
        t.setIndex(e.idx),
        t
      );
    });
  }
  var nq = (e, t) => {
    let n = cos(t),
      r = sin(t);
    return vec3(e.x.mul(n).add(e.z.mul(r)), e.y, e.z.mul(n).sub(e.x.mul(r)));
  };
  function rq(e, t, n) {
    let r = CK,
      i = positionLocal.sub(vec3(t.x, t.y, t.z)),
      a = length(i),
      o = i.div(a),
      s = nq(o, e.spin.mul(-2).add(n)),
      c = floor(s.mul(r)),
      l = c.x.add(15).add(c.y.add(15).mul(31)).add(c.z.add(15).mul(961)),
      u = hash(l),
      d = hash(l.add(7919)),
      f = hash(l.add(15013)),
      p = hash(l.add(22447)),
      m = normalize(c.add(vec3(d, f, p).mul(0.4).add(0.3))),
      h = p.mul(0.006).add(0.01),
      g = length(s.sub(m)),
      _ = fwidth(g).max(1e-5),
      v = abs(m.mul(r).sub(c).sub(0.5)),
      y = step(max(v.x, max(v.y, v.z)), h.mul(-14).add(0.5)),
      b = smoothstep(h.add(_), h.sub(_), g).mul(step(0.62, u)).mul(y),
      x = smoothstep(-0.2, 0.35, dot(normalLocal, o.negate())),
      S = smoothstep(3.2, 0.9, a),
      C = sin(e.clock.mul(2.6).add(u.mul(40)))
        .mul(0.18)
        .add(0.82),
      w = sq(d),
      T = b.mul(x).mul(S).mul(C).mul(0.9),
      E = new MeshBasicNodeMaterial({
        transparent: !0,
        depthWrite: !1,
        blending: 2,
      });
    return (
      (E.name = `party-specks`),
      (E.colorNode = w),
      (E.opacityNode = T.mul(0.8)),
      Object.assign(E, {
        emissiveNode: w.mul(T).mul(0.3),
      }),
      E
    );
  }
  var iq = vec3(1, 0.96, 0.9);
  var aq = vec3(0.45, 0.9, 1);
  var oq = vec3(1, 0.45, 0.8);
  function sq(e) {
    let t = iq.mul(step(e, 0.6)),
      n = aq.mul(step(0.6, e).mul(step(e, 0.8))),
      r = oq.mul(step(0.8, e));
    return t.add(n).add(r);
  }
  function cq(e) {
    let t = attribute(`gCorner`, `vec2`),
      n = attribute(`gIndex`, `float`),
      r = AK.length,
      i = e.beat.mul(2),
      a = step(abs(mod(floor(i), r).sub(n)), 0.5),
      o = fract(i),
      s = a
        .mul(smoothstep(0, 0.07, o))
        .mul(smoothstep(0.75, 0.15, o))
        .mul(jK),
      c = abs(t).max(1e-4),
      l = pow(c.x, 0.55).add(pow(c.y, 0.55)),
      u = fwidth(l).max(0.001),
      d = smoothstep(u.add(1), u.negate().add(1), l),
      f = new MeshBasicNodeMaterial({
        transparent: !0,
        depthWrite: !1,
      });
    return (
      (f.name = `party-glints`),
      (f.positionNode = positionLocal.add(vec3(t.mul(s), 0))),
      (f.colorNode = vec3(1, 0.98, 0.9)),
      (f.opacityNode = d),
      Object.assign(f, {
        emissiveNode: vec3(1, 0.98, 0.9).mul(d).mul(0.7),
      }),
      f
    );
  }
  function lq(e, t) {
    let n = attribute(`cfSlot`, `float`),
      r = attribute(`cfSeed`, `float`),
      i = attribute(`cfKick`, `vec3`),
      a = attribute(`cfTumble`, `vec4`),
      o = step(0.5, n),
      s = step(1.5, n),
      c = step(2.5, n),
      l = vec4(o.oneMinus(), o.sub(s), s.sub(c), c),
      u = dot(t.start, l),
      d = step(r, dot(t.share, l)),
      f = t.from[0]
        .mul(l.x)
        .add(t.from[1].mul(l.y))
        .add(t.from[2].mul(l.z))
        .add(t.from[3].mul(l.w)),
      p = f.xyz,
      m = t.dir[0]
        .mul(l.x)
        .add(t.dir[1].mul(l.y))
        .add(t.dir[2].mul(l.z))
        .add(t.dir[3].mul(l.w)),
      h = 0.42,
      g = createToonMaterial(
        {
          vertexColors: !0,
          side: 2,
        },
        {
          wear: !1,
        },
      );
    return (
      (g.name = `party-confetti`),
      (g.positionNode = Fn(() => {
        let t = e.clock.sub(u).sub(r.mul(0.1)),
          n = r.mul(0.9).add(2.1),
          o = max(t, 0),
          s = exp(o.mul(-2.4)).oneMinus().div(2.4),
          c = m.xyz.mul(m.w).add(i.mul(f.w)),
          l = vec3(
            sin(o.mul(6).add(r.mul(31))).mul(0.05),
            0,
            cos(o.mul(4.6).add(r.mul(17))).mul(0.04),
          ).mul(min(o, 1)),
          g = p
            .add(vec3(c.x.mul(s), c.y.add(h).mul(s).sub(o.mul(h)), c.z.mul(s)))
            .add(l),
          _ = step(0, t)
            .mul(smoothstep(n, n.sub(0.45), o))
            .mul(smoothstep(0, 0.06, o))
            .mul(d),
          v = normalize(a.xyz),
          y = a.w.mul(o).add(r.mul(6.283)),
          b = cos(y),
          x = sin(y),
          S = (e) =>
            e
              .mul(b)
              .add(cross(v, e).mul(x))
              .add(v.mul(dot(v, e)).mul(b.oneMinus()));
        return (
          normalLocal.assign(S(normalLocal)),
          g.add(S(positionLocal).mul(_))
        );
      })()),
      g
    );
  }
  function uq(e) {
    let t = 0.036,
      n = 0.012,
      r = 0.15,
      i = [],
      a = (e, a) => {
        let o = new Shape();
        o.absellipse(e, a, t, 0.026, 0, Math.PI * 2, !1, 0.38);
        let s = e + t * 0.86,
          c = new Shape([
            MK(s - n, a + 0.004),
            MK(s, a + 0.012),
            MK(s, a + r),
            MK(s - n, a + r),
          ]);
        return (i.push(o, c), s);
      },
      o = a(0, 0);
    if (e) {
      let e = a(0.09, 0.018);
      i.push(
        new Shape([
          MK(o - n, 0.11399999999999999),
          MK(e, 0.13199999999999998),
          MK(e, 0.16799999999999998),
          MK(o - n, r),
        ]),
      );
    } else {
      let e = new Shape();
      (e.moveTo(o - n / 2, r),
        e.bezierCurveTo(
          o + 0.006,
          0.11499999999999999,
          o + 0.066,
          0.105,
          o + 0.048,
          0.03499999999999999,
        ),
        e.bezierCurveTo(o + 0.05, 0.078, o + 0.016, 0.088, o - n / 2, 0.098),
        i.push(e));
    }
    return i;
  }
  var dq = [palette.yellow, palette.cyan, palette.lime];
  var fq = {
    x: 0.009,
    y: -0.009,
    z: -0.003,
  };
  function pq() {
    let e = [];
    return (
      [!1, !0].forEach((t, n) => {
        let r = new ShapeGeometry(uq(t), 6);
        (r.deleteAttribute(`uv`), r.computeBoundingBox());
        let i = r.boundingBox.getCenter(Z());
        r.translate(-i.x, -i.y, 0);
        for (let t of [1, 0]) {
          let i = t ? r.clone().translate(fq.x, fq.y, fq.z) : r,
            a = i.attributes.position.count;
          (i.setAttribute(
            `nGlyph`,
            new Float32BufferAttribute(new Float32Array(a).fill(n), 1),
          ),
            i.setAttribute(
              `nInk`,
              new Float32BufferAttribute(new Float32Array(a).fill(t), 1),
            ),
            e.push(i));
        }
      }),
      mergeGeometries(e)
    );
  }
  function mq() {
    let e = attribute(`nLook`, `vec4`),
      t = attribute(`nInk`, `float`),
      n = step(abs(attribute(`nGlyph`, `float`).sub(e.w)), 0.5),
      r = new Color(inkPurple),
      i = createToonMaterial(
        {
          alphaTest: 0.5,
        },
        {
          wear: !1,
        },
      );
    ((i.name = `party-notes`),
      (i.positionNode = positionLocal.mul(n)),
      (i.colorNode = mix(e.xyz, vec3(r.r, r.g, r.b), t)));
    let a = positionGeometry.xy.sub(vec2(fq.x, fq.y).mul(t)),
      o = clamp(a.y.mul(2.2).add(a.x.mul(0.4)).add(0.25), 0, 0.6);
    return (
      (i.opacityNode = PG(a, attribute(`nFade`, `float`), o, TK.freq)),
      i
    );
  }
  var hq = [`groover`, `shy`, `hopper`, `chatter`, `chatter`, `sleeper`];
  var gq = [0.18, 0.1, -0.22, 0.75, -0.2, -0.15];
  var _q = (gq[3] + gq[4]) / 2;
  var vq = [0.15, 0, 0.08, 0.1, 0.1, 0];
  var yq = {
    lead: 0.15,
    swing: 0.45,
    swingB: 0.6,
    hop: 0.075,
    air: 0.5,
    turns: [0.5, -0.2, 0, 0.75, -0.1],
    away: 1.1,
    down: 0.15,
    peek: -0.75,
    out: 0.3,
    blush: 0.6,
    blushDown: 0.24,
    chatTurn: 0.12,
    line: 1.1,
    night: 0.3,
  };
  var bq = [`away`, `away`, `peek`, `join`, `blush`, `away`, `preen`, `half`];
  var xq = [
    [0, 0, `chu`],
    [1, 1, `hehe`],
    [4, 0, `note`],
    [5, 1, `hm`],
    [8, 1, `chu`],
    [9, 0, `heart`],
    [12, 1, `note`],
    [13, 0, `hehe`],
  ];
  var Sq = (e, t) => ((e % t) + t) % t;
  function Cq(e, t, n, r, i) {
    let a = Math.max(1, Math.ceil(i * 120)),
      o = i / a;
    for (let i = 0; i < a; i++)
      ((e.v += (n * n * (t - e.x) - 2 * r * n * e.v) * o), (e.x += e.v * o));
  }
  var wq = [
    [-0.036, 0.022, 0.35, 0.55, palette.hotPink],
    [0.008, 0.04, -0.3, -0.2, palette.orange],
    [0.04, -0.012, 0.2, -0.6, palette.lilac],
    [-0.01, -0.034, -0.45, 0.3, paperWhite],
    [0.004, 0.002, 0.1, -0.15, palette.yellow],
  ];
  function Tq(e) {
    let { len: t, r0: n, r1: r } = bK,
      i = (r - n) / t,
      a = [],
      o = [],
      s = [];
    for (let r = 0; r <= 28; r++) {
      let c = 0.1 + (0.8 * r) / 28,
        l = e + Math.PI * 2 * c,
        u = Z(Math.sin(l), -i, Math.cos(l)).normalize();
      for (let e of [-0.046 / 2, 0.046 / 2]) {
        let r = c * t + e,
          s = n + i * r + 0.0035;
        (a.push(Math.sin(l) * s, r + 0.01, Math.cos(l) * s),
          o.push(u.x, u.y, u.z));
      }
      if (r) {
        let e = (r - 1) * 2;
        s.push(e, e + 2, e + 3, e, e + 3, e + 1);
      }
    }
    let c = new BufferGeometry();
    return (
      c.setAttribute(`position`, new Float32BufferAttribute(a, 3)),
      c.setAttribute(`normal`, new Float32BufferAttribute(o, 3)),
      c.setIndex(s),
      c
    );
  }
  function Eq(e, t, n) {
    let r = [],
      i = bK.len + 0.01;
    for (let a = 0; a <= 24; a++) {
      let o = a / 24,
        s = n * Math.PI * 4.4 * o,
        c = 0.021 * Math.min(1, o * 4);
      r.push(
        Z(
          e * (1 + 1.6 * o) + Math.cos(s) * c - c,
          i - 0.012 + 0.08 * o,
          t + Math.sin(s) * c,
        ),
      );
    }
    return new TubeGeometry(new CatmullRomCurve3(r), 48, 0.006, 5);
  }
  function Dq(e, t, n) {
    let r = t.poleRadius,
      i = t.reducedMotion,
      a = {
        beat: uniform(0),
        spin: uniform(0),
        clock: uniform(0),
      };
    (t.rod(e, ZG.to, ZG.y, ZG.r, polePurple),
      t.collar(e, ZG.y, palette.lime, 0.14, 0.04),
      zH(
        e.g,
        jH(Z(0, ZG.y, 0), oG, cG, sG, ZG.r),
        -0.62,
        0,
        0.06 * OU,
        0.06,
        `tape_mesq`,
      ));
    let o = $(`partyRopeRing`, () =>
        new TorusGeometry(ZG.r + 0.004, 0.009, 6, 16).rotateY(Math.PI / 2),
      ),
      s = (e) => {
        let [t, n] = e < QG.x ? [$G.x0, QG.x] : [QG.x, $G.x1],
          r = (e - t) / (n - t);
        return $G.y - $G.sag * 4 * r * (1 - r);
      },
      c = (e) => {
        let [t, n] = e < QG.x ? [$G.x0, QG.x] : [QG.x, $G.x1],
          r = (e - t) / (n - t);
        return (-$G.sag * 4 * (1 - 2 * r)) / (n - t);
      };
    for (let [t, n] of [
      [$G.x0, QG.x],
      [QG.x, $G.x1],
    ]) {
      let r = [];
      for (let e = 0; e <= 12; e++) {
        let i = t + ((n - t) * e) / 12;
        r.push(Z(i, s(i), 0));
      }
      createPart(
        new TubeGeometry(new CatmullRomCurve3(r), 24, 0.006, 5),
        palette.cream,
        e.g,
      );
    }
    for (let t of [$G.x0, $G.x1])
      createPart(o, paleBlue, e.g).position.set(t, ZG.y, 0);
    (createPart(o, paleBlue, e.g).position.set(QG.x, ZG.y, 0),
      yH(e.g, Z(QG.x, ZG.y, 0), Z(QG.x, QG.motor, 0), 0.013, paleBlue, 8),
      createPart(
        $(`partyMotor`, () => new CylinderGeometry(0.05, 0.056, 0.1, 16)),
        shadowPurple,
        e.g,
      ).position.set(QG.x, QG.motor, 0),
      createPart(
        $(`partyMotorRim`, () =>
          new TorusGeometry(0.053, 0.008, 6, 16).rotateX(Math.PI / 2),
        ),
        palette.lime,
        e.g,
      ).position.set(QG.x, QG.motor - 0.045, 0));
    let l = new Group();
    ((l.name = `PartyDiscoBall`),
      (l.userData.bakeSkip = !0),
      l.position.set(QG.x, QG.y, 0),
      e.g.add(l));
    for (let [e, t] of tq(QG.r, 11, 24).entries())
      createPart(t, eq[e], l, `atlas`);
    ((createPart(
      $(`partyBallCap`, () => new CylinderGeometry(0.045, 0.05, 0.035, 12)),
      shadowPurple,
      l,
    ).position.y = QG.r - 0.006),
      yH(
        l,
        Z(0, QG.r, 0),
        Z(0, QG.motor - 0.05 - QG.y + 0.01, 0),
        0.011,
        paleBlue,
        6,
      ),
      bakeStaticGeometry(l, `PartyDiscoBall`, !0));
    let u = Array.from(
      {
        length: 6,
      },
      (e, t) => Math.PI / 2 + 0.55 + (t * (Math.PI * 2 - 1.1)) / 5,
    );
    n.from(e.g).burst(QG.x, QG.y, 0.02, QG.r + 0.07, u, palette.cyan, 3, 0.09);
    let d = u.slice(1).map((e, t) => (e + u[t]) / 2);
    n.from(e.g).burst(QG.x, QG.y, 0.02, QG.r + 0.09, d, palette.pink, 3, 0.06);
    {
      let t = [],
        n = [],
        r = [],
        i = [];
      AK.forEach((e, a) => {
        let o = Z(e[0], e[1], e[2]).normalize(),
          s = Z(QG.x, QG.y, 0).addScaledVector(o, QG.r + 0.03);
        for (let [e, i] of [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ])
          (t.push(s.x, s.y, s.z + 0.02), n.push(e, i), r.push(a));
        i.push(a * 4, a * 4 + 1, a * 4 + 2, a * 4, a * 4 + 2, a * 4 + 3);
      });
      let o = new BufferGeometry();
      (o.setAttribute(`position`, new Float32BufferAttribute(t, 3)),
        o.setAttribute(`gCorner`, new Float32BufferAttribute(n, 2)),
        o.setAttribute(`gIndex`, new Float32BufferAttribute(r, 1)),
        o.setIndex(i),
        o.computeBoundingSphere(),
        (o.boundingSphere.radius += jK));
      let s = new Mesh(o, cq(a));
      ((s.name = `PartyGlints`),
        (s.renderOrder = 1),
        (s.userData.noExport = !0),
        e.g.add(s));
    }
    let f = {
        y0: fK.y + fK.h / 2 + 0.08,
        y1: ZG.y - 0.08,
      },
      p = (r * Math.cos(Math.PI / 8) + 0.009) / Math.cos(Math.PI / 8),
      m = (f.y0 + f.y1) / 2,
      h = rq(
        a,
        Z(-0.7, 0, 1.3)
          .applyAxisAngle(sG, e.yaw)
          .setY(QG.y - 0.25 - m),
        -e.yaw,
      ),
      g = new Mesh(new CylinderGeometry(p, p, f.y1 - f.y0, 8, 1, !0), h);
    ((g.name = `PartySpecks`),
      (g.position.y = m),
      (g.rotation.y = -e.yaw),
      (g.renderOrder = 1),
      (g.userData.noExport = !0),
      e.g.add(g));
    let _ = null;
    g.onBeforeRender = (e, t, n) => {
      _ = n;
    };
    let v = mH(`party.pennants`),
      y = (v.u1 - v.u0) / tK.length,
      b = [0, 1].map((t) => {
        let n = new Group();
        return (
          (n.name = `PartyPennants${t ? `B` : `A`}`),
          (n.userData.bakeSkip = !0),
          (n.position.y = $G.y),
          e.g.add(n),
          n
        );
      }),
      x = $(`partyPennant`, () =>
        new ExtrudeGeometry(PK(), {
          depth: 0.006,
          bevelEnabled: !0,
          bevelSize: 0.004,
          bevelThickness: 0.004,
          bevelSegments: 1,
          curveSegments: 6,
        }).translate(0, 0, -0.003),
      );
    tK.forEach((e, t) => {
      let n = t < 3 ? -1 : 1,
        r = t < 3 ? 2 - t : t - 3,
        i = QG.x + n * (eK.gap + r * eK.pitch),
        a = new Group();
      (a.position.set(i, s(i) - $G.y, 0),
        (a.rotation.z = Math.atan(c(i))),
        b[t % 2].add(a),
        createPart(x, nK[t], a));
      let o = mapAtlasUV(TH(new ShapeGeometry(PK(FK), 6)), {
        u0: v.u0 + t * y,
        u1: v.u0 + (t + 1) * y,
        v0: v.v0,
        v1: v.v1,
      });
      createPart(o, `#ffffff`, a, `atlas`).position.z = 0.0095;
    });
    for (let e of b) bakeStaticGeometry(e, e.name, !0);
    (t.rod(e, gK.to, gK.top, gK.r, paperWhite),
      t.collar(e, gK.top, palette.cyan, 0.16, 0.04));
    let S = Iq(e, t, n),
      { horns: C, eq: w, vol: T } = S,
      E = gK.top + gK.r,
      D = yK.map((t, n) => {
        createPart(
          $(`partyCannonClamp`, () =>
            new CylinderGeometry(gK.r + 0.008, gK.r + 0.008, 0.06, 18).rotateZ(
              Math.PI / 2,
            ),
          ),
          palette.hotPink,
          e.g,
        ).position.set(t.x, gK.top, 0);
        let r = Z(t.x, E + 0.012, 0);
        bH(e.g, r, 0.034, shadowPurple, 10);
        let i = Z(t.dir[0], t.dir[1], t.dir[2]).normalize(),
          a = new Group();
        ((a.name = `PartyCannon${n + 1}`),
          (a.userData.bakeSkip = !0),
          a.position.copy(r),
          a.quaternion.setFromUnitVectors(sG, i),
          e.g.add(a));
        let { len: o, r0: s, r1: c } = bK,
          l = o + 0.01;
        (createPart(
          $(`partyBarrel`, () =>
            new CylinderGeometry(c, s, o, 20).translate(0, o / 2 + 0.01, 0),
          ),
          palette.yellow,
          a,
        ),
          createPart(
            $(`partyBarrelStripeA`, () => Tq(0)),
            palette.hotPink,
            a,
          ),
          createPart(
            $(`partyBarrelStripeB`, () => Tq(Math.PI)),
            paperWhite,
            a,
          ),
          createPart(
            $(`partyBarrelLip`, () =>
              new TorusGeometry(c, 0.014, 6, 22)
                .rotateX(Math.PI / 2)
                .translate(0, l, 0),
            ),
            paperWhite,
            a,
          ),
          createPart(
            $(`partyBarrelBore`, () =>
              new CircleGeometry(c - 0.004, 20)
                .rotateX(-Math.PI / 2)
                .translate(0, l - 0.004, 0),
            ),
            inkPurple,
            a,
          ),
          createPart(
            $(`partyBarrelBreech`, () =>
              new SphereGeometry(
                s + 0.003,
                12,
                5,
                0,
                Math.PI * 2,
                Math.PI / 2,
                Math.PI / 2,
              ).translate(0, 0.012, 0),
            ),
            palette.yellow,
            a,
          ));
        let u = $(
          `partyBarrelChip`,
          () => new BoxGeometry(0.036, 0.055, 0.006),
        );
        for (let [e, t, n, r, i] of wq) {
          let o = createPart(u, i, a);
          (o.position.set(e, l + 0.012, t), o.rotation.set(n, e * 9, r));
        }
        return (
          createPart(
            $(`partyBarrelCurlA`, () => Eq(0.028, 0.012, 1)),
            palette.lime,
            a,
          ),
          createPart(
            $(`partyBarrelCurlB`, () => Eq(-0.03, -0.006, -1)),
            palette.cyan,
            a,
          ),
          bakeStaticGeometry(a, a.name, !0),
          {
            g: a,
            base: r,
            dir: i,
            mouth: r.clone().addScaledVector(i, o + 0.03),
            kick: 0,
          }
        );
      }),
      ee = (n, r, i, a) => {
        let o = t.perch(e, n, r, i, 0, 0.02, 1);
        ((o.group.rotation.order = `YXZ`),
          o.birds[0] && (o.birds[0].groove.cued = !0));
        let s = hq[a];
        return {
          flock: o,
          bird: o.birds[0],
          g: o.group,
          base: o.group.position.clone(),
          role: s,
          rest: gq[a],
          yaw: gq[a],
          glance: 0,
          lean: vq[a],
          pitch: 0,
          amp: 0,
          hopAt: -1e9,
          turns: 0,
        };
      },
      te = _K.map((e, t) => ee(`Birds_Party_${t + 1}`, rK + e, E, t)),
      O = vK.map((e, t) =>
        ee(`Birds_PartyArm_${t + 1}`, e, ZG.y + ZG.r, _K.length + t),
      ),
      ne = {
        start: uniform(new Vector4(-1e3, -1e3, -1e3, -1e3)),
        share: uniform(new Vector4(1, 1, 1, 1)),
        from: [0, 1, 2, 3].map(() => uniform(new Vector4())),
        dir: [0, 1, 2, 3].map(() => uniform(new Vector4())),
      },
      re = (() => {
        let t = wK.slots * wK.per,
          n = [],
          r = [],
          i = [],
          o = [],
          s = [],
          c = [],
          l = [],
          u = [],
          d = [
            palette.hotPink,
            palette.yellow,
            palette.cyan,
            palette.lime,
            palette.orange,
            palette.lilac,
            paperWhite,
          ].map((e) => new Color(e)),
          f = Z();
        for (let e = 0; e < t; e++) {
          let t = sH(0.03, 0.045),
            a = sH(0.06, 0.09),
            p = d[cH(d.length)];
          do f.set(sH(-1, 1), sH(-1, 1), sH(-1, 1));
          while (f.lengthSq() > 1);
          let m = Z(sH(-1, 1), sH(-1, 1), sH(-1, 1)).normalize(),
            h = sH(0, 1);
          for (let [u, d] of [
            [-t / 2, -a / 2],
            [t / 2, -a / 2],
            [t / 2, a / 2],
            [-t / 2, a / 2],
          ])
            (n.push(u, d, 0),
              r.push(0, 0, 1),
              i.push(p.r, p.g, p.b),
              o.push(Math.floor(e / wK.per)),
              s.push(h),
              c.push(f.x, f.y, f.z),
              l.push(m.x, m.y, m.z, sH(5, 12)));
          u.push(e * 4, e * 4 + 1, e * 4 + 2, e * 4, e * 4 + 2, e * 4 + 3);
        }
        let p = new BufferGeometry();
        (p.setAttribute(`position`, new Float32BufferAttribute(n, 3)),
          p.setAttribute(`normal`, new Float32BufferAttribute(r, 3)),
          p.setAttribute(`color`, new Float32BufferAttribute(i, 3)),
          p.setAttribute(`cfSlot`, new Float32BufferAttribute(o, 1)),
          p.setAttribute(`cfSeed`, new Float32BufferAttribute(s, 1)),
          p.setAttribute(`cfKick`, new Float32BufferAttribute(c, 3)),
          p.setAttribute(`cfTumble`, new Float32BufferAttribute(l, 4)),
          p.setIndex(u));
        let m = new Mesh(p, lq(a, ne));
        return (
          (m.name = `PartyConfetti`),
          (m.frustumCulled = !1),
          (m.visible = !1),
          (m.userData.noExport = !0),
          e.g.add(m),
          m
        );
      })(),
      ie = 0,
      ae = -1,
      oe = 0,
      se = (e, t, n, r, a) => {
        if (i.matches) return;
        let o = ie++ % wK.slots;
        (ne.start.value.setComponent(o, oe),
          ne.share.value.setComponent(o, a),
          ne.from[o].value.set(e.x, e.y, e.z, r),
          ne.dir[o].value.set(t.x, t.y, t.z, n),
          (ae = Math.max(ae, oe + 3.2)),
          (re.visible = !0));
      },
      ce = (e, t) => {
        let n = D[e];
        ((n.kick = Math.max(n.kick, 0.4 + 0.6 * t)),
          se(n.mouth, n.dir, 1.3 + 0.9 * t, 0.6 + 0.6 * t, 0.35 + 0.65 * t));
      },
      le = pq(),
      ue = new InstancedBufferAttribute(new Float32Array(TK.pool * 4), 4),
      de = new InstancedBufferAttribute(new Float32Array(TK.pool).fill(1), 1);
    (de.setUsage(DynamicDrawUsage),
      le.setAttribute(`nLook`, ue),
      le.setAttribute(`nFade`, de));
    let fe = new InstancedMesh(le, mq(), TK.pool);
    ((fe.name = `PartyNotes`),
      fe.instanceMatrix.setUsage(DynamicDrawUsage),
      (fe.frustumCulled = !1),
      (fe.visible = !1),
      (fe.userData.noExport = !0),
      (fe.userData.bakeSkip = !0),
      e.g.add(fe));
    let pe = new Matrix4().makeScale(1e-4, 1e-4, 1e-4).setPosition(S.parked);
    for (let e = 0; e < TK.pool; e++) fe.setMatrixAt(e, pe);
    let me = dq.map((e) => new Color(e)),
      he = Array.from(
        {
          length: TK.pool,
        },
        () => ({
          born: -1,
          horn: 0,
          size: 1,
          reach: 0,
          high: 0,
          phase: 0,
          calm: !1,
        }),
      ),
      ge = C.map(() => -1e9),
      _e = (e) => (e < 0 ? 0 : 1),
      ve = 0,
      ye = -1e9,
      be = 1,
      xe = {
        at: -1e9,
        due: 0,
        side: 1,
      },
      Se = 1 - Math.exp(-TK.fly / TK.drag),
      Ce = Z(),
      we = Z(),
      Te = Z(),
      Ee = Z(),
      De = [
        Z(gK.to - 0.25, gK.top - gK.r + TK.lap, -gK.r),
        Z(-r, gK.top + 0.9, gK.r),
      ],
      Oe = () => {
        let e = document.querySelector(`.mesq-speech__bubble`);
        if (!e || e.hidden) return null;
        let t = e.getBoundingClientRect();
        return t.width > 0 ? t : null;
      },
      ke = (e, t, n) => {
        let r = C[e.horn];
        if (e.calm) {
          let e = t / TK.calmFly;
          return n
            .copy(r.mouth)
            .addScaledVector(r.dir, TK.calmAt + TK.calmDrift[0] * e)
            .setY(n.y + TK.calmDrift[1] * e);
        }
        let i = t / TK.fly;
        return n
          .copy(r.mouth)
          .addScaledVector(r.way, (e.reach * (1 - Math.exp(-t / TK.drag))) / Se)
          .setY(n.y + e.high * i * i);
      },
      Ae = (t, n, i, a) => {
        let o = C[n];
        t.horn = n;
        let s = (TK.out * i * (0.85 + 0.3 * Math.random())) / Math.abs(o.way.x),
          c = TK.rise * a * (0.9 + 0.2 * Math.random());
        ((t.reach = s), (t.high = c));
        let l = _,
          u = l && document.getElementById(`scene`)?.getBoundingClientRect();
        if (!l || !u) return 1;
        let d = o.side;
        (Ce.copy(o.mouth).applyMatrix4(e.g.matrixWorld).project(l),
          we
            .copy(o.mouth)
            .setX(o.mouth.x + d)
            .applyMatrix4(e.g.matrixWorld)
            .project(l));
        let f = Math.max(0.001, Math.abs(we.x - Ce.x)),
          p = (e) => u.left + (e.x * 0.5 + 0.5) * u.width,
          m = (e) => u.top + (0.5 - e.y * 0.5) * u.height,
          h = (f * u.width) / 2,
          g = (0.08 * t.size + TK.sway) * h,
          v = (0.1 * t.size + TK.sway) * h,
          y = [1e9, 1e9, -1e9, -1e9];
        for (let t = 0; t < 8; t++)
          (Te.set(De[t & 1].x, De[(t >> 1) & 1].y, De[t >> 2].z)
            .applyMatrix4(e.g.matrixWorld)
            .project(l),
            (y[0] = Math.min(y[0], p(Te))),
            (y[1] = Math.min(y[1], m(Te))),
            (y[2] = Math.max(y[2], p(Te))),
            (y[3] = Math.max(y[3], m(Te))));
        let b = Oe(),
          x = document.querySelector(`.helper`)?.getBoundingClientRect(),
          S = TK.berth * h,
          w = TK.edge * h,
          T = (e, t, n) =>
            !!e &&
            e.width > 0 &&
            t + g + S > e.left &&
            t - g - S < e.right &&
            n + v + S > e.top &&
            n - v - S < e.bottom,
          E = () => {
            let n = t.calm ? TK.calmFly : TK.fly;
            for (let r = 0; r <= 8; r++) {
              let i = (n * r) / 8;
              ke(t, i, Te).applyMatrix4(e.g.matrixWorld).project(l);
              let a = p(Te),
                o = m(Te);
              if (
                o - v < u.top + w ||
                o + v > u.bottom - w ||
                (a + g > y[0] &&
                  a - g < y[2] &&
                  o + v > y[1] &&
                  o - v < y[3]) ||
                T(b, a, o) ||
                T(x, a, o)
              )
                return !1;
              for (let n of he) {
                let r = oe - n.born + i;
                if (n.born < 0 || r >= (n.calm ? TK.calmFly : TK.fly)) continue;
                ke(n, r, Ee).applyMatrix4(e.g.matrixWorld).project(l);
                let s = 0.85 * (t.size + n.size) * h;
                if (
                  Math.abs(p(Ee) - a) < 0.08 * s &&
                  Math.abs(m(Ee) - o) < 0.1 * s
                )
                  return !1;
              }
            }
            return !0;
          };
        if (t.calm) return +!!E();
        let D = (1 - d * Ce.x) / f - TK.margin;
        (d > 0 &&
          (we.set(-r, o.mouth.y, 0).applyMatrix4(e.g.matrixWorld).project(l),
          (D = Math.min(D, (we.x - Ce.x) / f - TK.wall))),
          we.copy(o.mouth).add(o.way).applyMatrix4(e.g.matrixWorld).project(l));
        let ee = Math.max(0.1, (d * (we.x - Ce.x)) / f),
          te = NK(
            (D - TK.sway) / (((TK.out * i * 1.15) / Math.abs(o.way.x)) * ee),
            0.15,
            1,
          ),
          O = p(Ce),
          ne = m(Ce),
          re = 0,
          ie = 0,
          ae = s * te,
          se = c;
        for (let n of TK.bends) {
          t.high = Math.max(0, c + n * TK.bend * a);
          for (let r = te; r > 0.12; r *= 0.8) {
            if (((t.reach = s * r), !E())) continue;
            ke(t, TK.fly, Te).applyMatrix4(e.g.matrixWorld).project(l);
            let i =
              Math.hypot(p(Te) - O, m(Te) - ne) / Math.max(1, 0.2 * t.size * h);
            i * (1 - TK.bendCost * Math.abs(n)) > ie &&
              ((ie = i * (1 - TK.bendCost * Math.abs(n))),
              (re = i),
              (ae = t.reach),
              (se = t.high));
            break;
          }
        }
        return ((t.reach = ae), (t.high = se), re);
      },
      je = (e, t, n = 1, r = 1, a = -1, o = !1) => {
        ((ye = tG.beat), (be = e));
        let s = a >= 0 ? a : _e(e);
        if (oe < ge[s] && a < 0) return !1;
        let c = 0;
        for (; c < he.length && he[c].born >= 0;) c++;
        if (c === he.length) return !1;
        let l = he[c];
        if (((l.size = t), (l.calm = i.matches), !Ae(l, s, n, r))) {
          let t = _e(-e);
          if (o || !(oe >= ge[t] && Ae(l, t, n, r))) return !1;
        }
        let u = ve++;
        ((l.born = oe),
          (ge[l.horn] = oe + (l.calm ? TK.calmSpace : TK.space)),
          (w.lamps[l.horn] = 1),
          (l.phase = Math.random() * Math.PI * 2));
        let d = me[u % me.length];
        return (
          ue.setXYZW(c, d.r, d.g, d.b, u % 2),
          (ue.needsUpdate = !0),
          (fe.visible = !0),
          !0
        );
      },
      Me = new Quaternion(),
      Ne = new Quaternion(),
      Pe = new Quaternion(),
      Fe = Z(),
      Ie = Z(),
      Le = new Matrix4(),
      Re = D.map((n, r) => {
        let i = Oq(e, t, `cannon${r + 1}`, 0.28, 0.42, 0.36, 0, 0);
        return (i.position.copy(n.base).addScaledVector(n.dir, bK.len / 2), i);
      }),
      ze = 0,
      Be = {
        aim: 0,
        x: 0,
        v: 0,
      },
      He = {
        aim: 0,
        x: 0,
        v: 0,
      },
      Ue = 0,
      We = 0,
      Ge = {
        x: hK.volRest,
        v: 0,
      },
      Ke = -1,
      qe = -1,
      Je = -1e9,
      Ye = -1e9,
      Xe = -1,
      Ze = (e) => (Xe === 1 ? (e & 8 ? 1 : -1) : Xe - 1),
      Qe = 0,
      $e = !0,
      et = !1,
      k = 0,
      tt = {
        next: 0,
      },
      nt = [...te, ...O],
      rt = nt.filter((e) => e.role === `chatter`),
      it = nt.find((e) => e.role === `sleeper`),
      at = {
        from: -1e9,
        stretch: -1e9,
        until: -1e9,
        up: !1,
      },
      ot = NaN,
      st = () => {
        if (!$e) {
          (($e = !0),
            nt.forEach((e, t) => {
              ((e.amp = e.glance = e.pitch = e.turns = 0),
                (e.yaw = e.rest),
                (e.lean = vq[t]),
                (e.hopAt = -1e9),
                e.g.position.copy(e.base),
                e.g.rotation.set(0, 0, 0),
                e.bird && (e.bird.groove.pitch = e.bird.groove.roll = 0));
            }),
            (at.from = at.stretch = at.until = -1e9),
            (at.up = !1),
            (ot = NaN));
          for (let e of C) e.bell.scale.setScalar(1);
          ((We = Ge.v = 0),
            (Ge.x = T.rotation.z = hK.volRest),
            w.lamps.fill(0),
            S.rest(),
            (Ke = -1));
          for (let e of D)
            ((e.kick = 0), e.g.position.copy(e.base), e.g.scale.setScalar(1));
          for (let e of b) e.rotation.x = 0;
          (he.forEach((e, t) => {
            ((e.born = -1), fe.setMatrixAt(t, pe));
          }),
            (fe.instanceMatrix.needsUpdate = !0),
            (fe.visible = !1),
            (xe.due = 0),
            ge.fill(-1e9),
            (ye = -1e9),
            (re.visible = !1),
            ne.start.value.set(-1e3, -1e3, -1e3, -1e3),
            (Ue = k = 0),
            (Be.aim = Be.x = Be.v = He.aim = He.x = He.v = 0),
            (a.beat.value = Math.floor(a.beat.value * 2) / 2 + 0.45),
            (Je = -1e9));
        }
      },
      ct = () => {
        for (let e = 0; e < te.length; e++) {
          let e = tt.next++ % te.length;
          if (te[e].bird?.isPerched) return e;
        }
        return -1;
      },
      lt = (e, t) => (t.bird?.perchX ?? 0) + t.base.x - e.base.x,
      ut = (e, t, n, r) => {
        !it.bird?.isPerched ||
          (e < at.until && (at.up || r)) ||
          (it.bird.cue(t, `wake`, 0, n),
          (at.from = e),
          (at.up = !r),
          (at.stretch = r ? Math.floor(e) + 1 : Math.ceil((e + 1) / 4) * 4),
          (at.until = at.stretch + (r ? 3 : 8)));
      },
      dt = (e, t, n) => {
        let r = e / 2,
          i = e % 2 == 0,
          a = Math.floor(r),
          o = Math.floor(a / 4),
          s = a - o * 4,
          c = Sq(o, 8),
          l = Sq(o, 16),
          u = r >= Ye && r < Ye + tG.soloBeats;
        for (let e = 0; e < nt.length; e++) {
          let a = nt[e],
            d = a.bird;
          if (d?.isPerched) {
            if (a.role === `chatter` && i && s === 0)
              for (let [e, n, r] of xq) {
                if (e !== l || rt[n] !== a) continue;
                let i = rt[1 - n];
                (d.say(t, yq.line, lt(a, i), r),
                  i.bird?.isPerched &&
                    i.bird.attend(t, yq.line + 0.3, lt(i, a)));
              }
            if (a.role === `sleeper`) {
              if (!i) continue;
              (!n && l === 12 && s === 0 && ut(r, t, 0.6, !0),
                r >= at.until
                  ? ((a.glance = a.pitch = a.lean = 0),
                    d.cue(t, `doze`, 3),
                    s === 0 && o % 2 == 0 && d.snore(t, o % 4 == 0))
                  : r < at.stretch
                    ? ((a.glance = -0.4), (a.pitch = 0.16))
                    : r === at.stretch
                      ? ((a.pitch = 0),
                        n ||
                          (d.cue(t, `stretch`, 0.9), d.cue(t, `flap`, 0, 0.8)))
                      : r >= at.stretch + 2 &&
                        ((a.glance = 0),
                        (a.lean = 0.05),
                        n || d.cue(t, `bob`, 0, 0.5)));
              continue;
            }
            if (n) {
              i &&
                s % 2 == 0 &&
                (a.role !== `shy` || s !== 2) &&
                !d.isTalking &&
                d.cue(t, `nod`, 0, 0.45);
              continue;
            }
            if (u && e < te.length) {
              if (!i) continue;
              e === Xe
                ? (d.cue(t, `bob`, 0, 1.1),
                  s % 2 == 1 && d.cue(t, `flap`, 0, 1.2))
                : s % 2 == 0 && d.cue(t, `bob`, 0, 0.6);
              continue;
            }
            switch (a.role) {
              case `groover`:
                if (!i) break;
                (d.cue(t, `bob`, 0, 1),
                  s % 2 == 1
                    ? d.cue(t, `flap`, 0, 1)
                    : (a.yaw =
                        a.rest +
                        (s === 0 ? 1 : -1) * (c < 4 ? yq.swing : yq.swingB)));
                break;
              case `shy`: {
                let e = bq[c],
                  n = e === `join` || (e === `half` && s >= 2),
                  r = c === 1;
                if (!i) break;
                if (n) {
                  ((a.glance = a.pitch = 0),
                    (a.lean = 0.05),
                    d.cue(t, `bob`, 0, 0.8));
                  break;
                }
                ((a.lean = 0.03),
                  s === 0
                    ? ((a.glance =
                        e === `peek`
                          ? yq.peek
                          : e === `preen`
                            ? 0.6
                            : e === `blush`
                              ? yq.blush
                              : r
                                ? yq.out
                                : yq.away),
                      (a.pitch =
                        e === `peek`
                          ? 0.04
                          : e === `blush`
                            ? yq.blushDown
                            : r
                              ? 0
                              : yq.down),
                      e === `blush`
                        ? d.cue(t, `puff`, 1.1)
                        : e === `preen`
                          ? d.cue(t, `preen`, 1.3, 1)
                          : e === `peek`
                            ? d.cue(t, `look`, 1.5, 0.1)
                            : r &&
                              (d.cue(t, `stretch`, 0.9),
                              d.cue(t, `flap`, 0, 0.8)))
                    : (e === `peek` && s === 3) || (r && s === 2)
                      ? ((a.glance = yq.away), (a.pitch = yq.down))
                      : c === 0 &&
                        s === 3 &&
                        ((a.glance = yq.out), (a.pitch = 0)),
                  s % 2 == 0 && !(r && s === 0) && d.cue(t, `bob`, 0, 0.4));
                break;
              }
              case `hopper`: {
                let e = o % 2 == 1;
                i
                  ? s === 0 && r - a.hopAt <= yq.air + 0.01
                    ? d.cue(t, `land`, 0, 1)
                    : d.cue(t, `bob`, 0, s === 3 && e ? 1 : 0.7)
                  : s === 3 &&
                    e &&
                    ((a.hopAt = r),
                    d.cue(t, `hop`, 0, 1),
                    d.cue(t, `flap`, 0, 1.3),
                    (c === 3 || c === 7) &&
                      ((a.yaw = a.rest + yq.turns[a.turns++ % yq.turns.length]),
                      d.face(t, a.yaw, a.glance, !0)));
                break;
              }
              case `chatter`:
                if (d.isTalking) {
                  d.cue(t, i ? `bob` : `nod`, 0, i ? 0.45 : 0.4);
                  break;
                }
                if (!i) break;
                if (
                  l % 4 == 2 &&
                  s < 2 &&
                  rt.indexOf(a) === (l % 8 == 2 ? 0 : 1)
                ) {
                  s === 0 &&
                    ((a.yaw = _q + 0.3 * (a.rest - _q)),
                    d.cue(t, `stretch`, 0.9),
                    d.cue(t, `flap`, 0, 0.8));
                  break;
                }
                (s % 2 == 0 &&
                  (a.yaw =
                    a.rest +
                    Math.sign(a.rest - _q) * (s === 0 ? 1 : -1) * yq.chatTurn),
                  d.cue(t, `bob`, 0, s % 2 == 0 ? 0.6 : 0.5));
            }
          }
        }
      };
    return {
      hits: [...S.hits, ...Re],
      update(n, r, o) {
        if (!r || t.focus() < 0.002) {
          (tG.stop(), (w.on = !1), st());
          return;
        }
        (($e = !1), (w.on = !0), (oe = o));
        let s = i.matches;
        Qe = MathUtils.smoothstep(t.focus(), 0.35, 0.95);
        let c = tG.update(n, Qe),
          u = Math.floor(c / 4),
          d = Sq(u, 8);
        ((a.beat.value = c),
          (a.clock.value = o),
          (ze = (ze + n * (s ? SK.calm : SK.rate)) % (Math.PI * 200)),
          (l.rotation.y = ze),
          (a.spin.value = ze));
        let f = !et && Qe > 0.5 && u % OK === 3;
        ((k += (+!!f - k) * (1 - Math.exp(-n * 6))),
          f &&
            Math.floor(c) !== Ke &&
            ((Ke = Math.floor(c)), (w.lamps[Sq(Ke, C.length)] = 1)));
        let { rise: p, fall: m } = kK,
          h = Sq(c + p, 1) - p,
          g = 1 + h / p,
          v = Math.exp(-(1 - p) * m),
          y = h < 0 ? g * g * (3 - 2 * g) : (Math.exp(-h * m) - v) / (1 - v);
        ((He.aim *= Math.exp(-n / kK.boostFade)),
          Cq(He, He.aim, kK.boostIn, 1, n),
          (Be.aim *= Math.exp(-n / kK.punch)),
          Cq(Be, Be.aim, kK.snap, 1, n));
        let { knee: x, most: E } = kK,
          ee = y * (1 + 0.9 * k + kK.boost * Math.max(0, He.x)) + Be.x;
        (ee > x && (ee = x + (E - x) * (1 - Math.exp(-(ee - x) / (E - x)))),
          s && (ee *= 0.4));
        let O = 1 + kK.wide * ee;
        for (let e of C) e.bell.scale.set(O, 1 + kK.long * ee, O);
        (S.tick(n, c, s), (We = Math.max(0, We - n / hK.back)));
        let ne = Math.min(1, We / 0.75);
        (Cq(
          Ge,
          hK.volRest + (hK.volMax - hK.volRest) * ne * ne * (3 - 2 * ne),
          s ? 8 : 22,
          s ? 1 : 0.65,
          n,
        ),
          (T.rotation.z = Ge.x));
        for (let e of D) {
          if (e.kick <= 0) continue;
          e.kick = Math.max(0, e.kick - n * 3.2);
          let t = e.kick * e.kick;
          (e.g.position.copy(e.base).addScaledVector(e.dir, -0.03 * t),
            e.g.scale.set(1 + 0.08 * t, 1 - 0.16 * t, 1 + 0.08 * t));
        }
        let ie = s ? 0.03 : 0.11,
          se = Math.sin(o * 0.7) * 0.05;
        ((b[0].rotation.x = se + ie * Math.sin(Math.PI * c)),
          (b[1].rotation.x = se - ie * Math.sin(Math.PI * c + 0.5)),
          qW(c, w.levels));
        for (let e = 0; e < w.lamps.length; e++)
          w.lamps[e] = Math.max(0, w.lamps[e] - n / DK);
        if (((Ue = Math.max(0, Ue - n * 1.5)), Ue > 0))
          for (let e = 0; e < w.levels.length; e++)
            w.levels[e] = Math.max(
              w.levels[e],
              Ue * (0.7 + 0.3 * Math.sin(e * 1.7 + o * 20)),
            );
        let le = Math.floor((c + yq.lead) * 2);
        for (le - ot <= 4 || (ot = le - 1); ot < le;) dt(++ot, o, s);
        let ue = c >= Ye && c < Ye + tG.soloBeats,
          me = Math.sin((Math.PI * (c + 0.1)) / 2);
        for (let e = 0; e < nt.length; e++) {
          let t = nt[e],
            r = t.bird;
          if (
            (t.flock.setDaylight(
              t === it && (c >= at.until || !at.up) ? yq.night : xK,
            ),
            !r)
          )
            continue;
          let i = r.mode === `perched`;
          ((t.amp += (+!!i - t.amp) * (1 - Math.exp(-n * (i ? 2 : 12)))),
            r.hold(o, 0.5));
          let a = ue && e === Xe && !s,
            l = t.glance;
          (ue &&
            e < te.length &&
            !s &&
            (l = a ? -t.yaw : Math.sign(Xe - e) * 0.7 - (t.yaw - t.rest)),
            i &&
              r.face(
                o,
                t.yaw,
                s ? Math.sign(t.glance) * Math.min(Math.abs(t.glance), 0.4) : l,
              ),
            (r.groove.roll = i && !s ? t.lean * me : 0),
            (r.groove.pitch = i ? t.pitch : 0));
          let u = 0,
            d = 0,
            f = c - t.hopAt;
          if (f >= 0 && f < yq.air && !s) {
            let e = f / yq.air;
            u = yq.hop * 4 * e * (1 - e);
          }
          if (a) {
            let e = NK((c - Ye - 1) / 2, 0, 1);
            ((d = Math.PI * 2 * e * e * (3 - 2 * e)),
              (u += 0.04 * Math.sin(Math.PI * e)));
          }
          (t.g.position.set(t.base.x, t.base.y + u * t.amp, t.base.z),
            t.g.rotation.set(0, d * t.amp, 0));
        }
        let ge = Math.floor(c * 4);
        for (ge - Je > 4 && (Je = ge); Je < ge;) {
          let e = ++Je,
            t = JW(e);
          if (
            (t & 1 && je(-1, TK.size),
            t & 2 && je(1, TK.size),
            t & 4 &&
              Xe >= 0 &&
              je(Ze(e), TK.solo, TK.soloArc[0], TK.soloArc[1]),
            !t && !s && e % 4 == 0 && e / 4 - ye > TK.every - 0.05)
          ) {
            let t = 0,
              n = 0;
            for (let r = 1; r <= 4; r++)
              ((t |= JW(e + r)), (n |= JW(e + 4 + r)));
            t || je(n & (be < 0 ? 2 : 1) ? be : -be, TK.size);
          }
        }
        for (let e = 0; xe.due >> e; e++) {
          if (!(xe.due & (1 << e)) || o < xe.at + e * TK.gap) continue;
          let [t, n] = TK.burst[e],
            r = s ? _e(xe.side) : EK[xe.side < 0 ? 0 : 1][e],
            i = o < xe.at + e * TK.gap + TK.wait;
          (je(C[r].side, TK.size * 1.08, t, n, r, i) || !i) &&
            (xe.due &= ~(1 << e));
        }
        _ &&
          (e.g.getWorldQuaternion(Ne).invert(),
          _.getWorldQuaternion(Me).premultiply(Ne));
        let ve = 0,
          Ce = !1;
        for (let e = 0; e < he.length; e++) {
          let t = he[e];
          if (t.born < 0) continue;
          Ce = !0;
          let n = o - t.born,
            r = t.calm ? TK.calmFly : TK.fly;
          if (n >= r || n < 0) {
            ((t.born = -1), fe.setMatrixAt(e, pe));
            continue;
          }
          (ve++, ke(t, n, Fe));
          let i = 0.08,
            a = 0,
            s = 0;
          if (!t.calm) {
            let e = C[t.horn],
              r = Math.exp(-n / TK.drag),
              o = (t.reach * r) / (TK.drag * Se),
              c = n / TK.fly,
              l = e.way.x * o,
              u = e.way.y * o + (2 * t.high * c) / TK.fly,
              d = Math.hypot(l, u) || 1,
              f = TK.sway * c * Math.sin(n * TK.swayRate + t.phase);
            ((Fe.x -= (u / d) * f),
              (Fe.y += (l / d) * f),
              (a = (1 - r) / Se),
              (i =
                (Math.abs(l) / d) * 0.32 +
                0.12 * c * Math.cos(n * TK.swayRate + t.phase)),
              (s = 0.18 * Math.exp(-n / 0.09)));
          }
          let c = Math.min(1, n / TK.pop),
            l = t.calm
              ? c * c * (3 - 2 * c)
              : 1 + 3 * (c - 1) ** 3 + 2 * (c - 1) ** 2,
            u = t.size * l * (1 - TK.shrink * a);
          ((Fe.y += s * 0.095 * u),
            Ie.set(u * (1 - 0.55 * s), u * (1 + s), u),
            Pe.setFromAxisAngle(cG, -C[t.horn].side * i),
            fe.setMatrixAt(e, Le.compose(Fe, Pe.premultiply(Me), Ie)),
            de.setX(e, 1 - NK((n - r + TK.fade) / TK.fade, 0, 1)));
        }
        if (
          (Ce && ((fe.instanceMatrix.needsUpdate = !0), (de.needsUpdate = !0)),
          (fe.visible = ve > 0),
          u !== qe)
        ) {
          if (qe >= 0 && d === 4 && Math.floor(u / 8) % 2 == 0 && Qe > 0.5) {
            let e = Math.floor(u / 16) % 2;
            (ce(e, 0), tG.popper(e ? -0.05 : -0.35, 0.15 * Qe));
          }
          qe = u;
        }
        re.visible && o > ae && (re.visible = !1);
      },
      hover(e) {
        e &&
          S.hits.includes(e) &&
          ((Be.aim = Math.max(Be.aim, 0.6)), S.poke(`hover`));
      },
      click(e) {
        let t = i.matches;
        if (S.hits.includes(e)) {
          ((et = !0),
            (We = 1),
            w.lamps.fill(1),
            S.poke(`click`),
            ut(tG.beat, oe, t ? 0.3 : 1, !1),
            tG.popper(-0.2, Math.max(0.4, Qe)),
            ce(0, 1),
            ce(1, 1),
            (Be.aim = Math.max(Be.aim, kK.thump)),
            (He.aim = 1),
            (Ue = 1));
          let e = tG.solo(-0.15);
          (e !== Ye && ((Ye = e), (Xe = ct())),
            (xe.at = oe),
            (xe.due = (1 << (t ? 1 : TK.burst.length)) - 1),
            (xe.side = Xe < 0 ? be : Ze(Ye * 4)));
        } else {
          let n = Re.indexOf(e);
          if (n < 0) return;
          (ce(n, 0.75),
            tG.popper(n ? -0.05 : -0.35, Math.max(0.4, Qe) * 0.8),
            ut(tG.beat, oe, t ? 0.3 : 0.8, !1));
        }
      },
    };
  }
  function Oq(e, t, n, r, i, a, o, s) {
    let c = new Mesh(
      $(`partyHit:${n}`, () => new BoxGeometry(r, i, a)),
      t.hitMaterial,
    );
    return (
      (c.name = `PartyHit_${n}`),
      c.position.set(o, s, 0),
      (c.visible = !1),
      (c.userData.noExport = !0),
      (c.userData.bakeSkip = !0),
      (c.userData.party = n),
      e.g.add(c),
      c
    );
  }
  function kq(e, t, n) {
    let r = t.z;
    createPart(
      mapAtlasUV(
        TH(new ShapeGeometry(SH(n.w, n.h, 0.03), 6)),
        mH(`party.panel`),
      ),
      `#ffffff`,
      e,
      `atlas`,
    ).position.copy(t);
    for (let i of [-1, 1])
      for (let a of [-1, 1])
        xH(
          e,
          Z(t.x + i * (n.w / 2 - 0.014), t.y + a * (n.h / 2 - 0.014), r),
          cG,
          paleBlue,
          n.screw,
        );
    let i = Lq(n.lamps.cols),
      a = new Mesh(
        TH(new ShapeGeometry(SH(n.eq.w, n.eq.h, 0.012), 4)),
        i.led.material,
      );
    ((a.name = `PartyEqualiser`),
      a.position.set(t.x, t.y + n.eq.y, r + 0.003),
      i.led.glass(`band`, n.eq.w, n.eq.h),
      e.add(a));
    let { r: o } = n.knobs,
      s = (e) => Z(t.x + e, t.y + n.knobs.y, r),
      c = $(`partyKnobSkirt:${o}`, () =>
        new CylinderGeometry(o + 0.005, o + 0.007, 0.008, 18)
          .rotateX(Math.PI / 2)
          .translate(0, 0, 0.004),
      ),
      l = $(`partyKnob:${o}`, () =>
        new CylinderGeometry(o, o, 0.02, 18)
          .rotateX(Math.PI / 2)
          .translate(0, 0, 0.012),
      ),
      u = $(`partyKnobMark:${o}`, () =>
        new BoxGeometry(o * 0.85, 0.006, 0.004).translate(o * 0.42, 0, 0.023),
      );
    for (let [t, r, i] of [
      [-n.knobs.x, palette.cyan, 2.27],
      [n.knobs.x, palette.lime, 1.05],
    ]) {
      let n = s(t);
      (createPart(c, inkPurple, e).position.copy(n),
        createPart(l, r, e).position.copy(n));
      let a = createPart(u, inkPurple, e);
      (a.position.copy(n), (a.rotation.z = i));
    }
    let d = new Group();
    ((d.name = `PartyVolKnob`),
      (d.userData.bakeSkip = !0),
      d.position.copy(s(0)),
      (d.rotation.z = hK.volRest),
      e.add(d));
    {
      let e = n.knobs.vol;
      (createPart(
        $(`partyVolSkirt:${e}`, () =>
          new CylinderGeometry(e + 0.006, e + 0.009, 0.01, 24)
            .rotateX(Math.PI / 2)
            .translate(0, 0, 0.005),
        ),
        inkPurple,
        d,
      ),
        createPart(
          $(`partyVolCap:${e}`, () =>
            new CylinderGeometry(e, e, 0.024, 24)
              .rotateX(Math.PI / 2)
              .translate(0, 0, 0.014),
          ),
          palette.yellow,
          d,
        ));
      let t = () =>
        new ExtrudeGeometry(
          CH(
            [
              MK(e * 1.32, 0),
              MK(0, e * 0.4),
              MK(-e * 0.78, 0),
              MK(0, -e * 0.4),
            ],
            0.008,
          ),
          {
            depth: 0.012,
            bevelEnabled: !1,
            curveSegments: 3,
          },
        );
      (createPart(
        $(`partyVolHead:${e}`, () => t().translate(0, 0, 0.026)),
        shadowPurple,
        d,
      ),
        createPart(
          $(`partyVolLine:${e}`, () =>
            new BoxGeometry(e * 1.1, 0.007, 0.003).translate(
              e * 0.62,
              0,
              0.0395,
            ),
          ),
          paperWhite,
          d,
        ));
    }
    for (let e of bakeStaticGeometry(d, d.name, !0)) e.castShadow = !1;
    let f = Z(t.x + n.toggle.x, t.y + n.toggle.y, r),
      p = Z(f.x + 0.016, f.y + 0.034, r + 0.03);
    return (
      yH(e, f.clone().setZ(r + 0.004), p, 0.0055, paleBlue, 8),
      bH(e, p, 0.011, palette.hotPink, 10),
      bH(e, Z(t.x + n.on.x, t.y + n.on.y, r), 0.016, palette.lime, 12),
      {
        eq: i,
        vol: d,
      }
    );
  }
  function Aq(e, t) {
    let n = e.mouth - e.neck,
      r = (t) => e.r0 + (e.rm - e.r0) * (0.5 * t + 0.5 * t ** 2.6),
      i = [0, 0.12, 0.24, 0.33];
    return {
      back: $(`${t}DriverBack`, () =>
        new SphereGeometry(
          e.drvR,
          24,
          6,
          0,
          Math.PI * 2,
          Math.PI / 2,
          Math.PI / 2,
        )
          .scale(1, (e.drv0 - 0.02) / e.drvR, 1)
          .translate(0, e.drv0, 0),
      ),
      can: $(`${t}DriverCan`, () =>
        new CylinderGeometry(e.drvR, e.drvR, e.drv1 - e.drv0, 24).translate(
          0,
          (e.drv0 + e.drv1) / 2,
          0,
        ),
      ),
      fins: $(`${t}DriverFins`, () =>
        mergeGeometries(
          [0, 1, 2, 3].map((t) =>
            new TorusGeometry(e.drvR + 0.005, 0.0055, 4, 24)
              .rotateX(Math.PI / 2)
              .translate(0, e.fin0 + ((e.fin1 - e.fin0) * t) / 3, 0),
          ),
        ),
      ),
      neck: $(`${t}HornNeck`, () =>
        new CylinderGeometry(
          e.neckR,
          e.neckR,
          e.neck - e.drv1 + 0.004,
          18,
        ).translate(0, (e.drv1 + e.neck) / 2, 0),
      ),
      yoke: $(`${t}Yoke`, () => {
        let t = [Z(0, e.pivot, e.yoke), Z(0, 0.06, e.yoke)];
        for (let n = 1; n < 12; n++) {
          let r = Math.PI / 2 - (Math.PI * n) / 12;
          t.push(Z(0, 0.06 - 0.085 * Math.cos(r), e.yoke * Math.sin(r)));
        }
        return (
          t.push(Z(0, 0.06, -e.yoke), Z(0, e.pivot, -e.yoke)),
          new TubeGeometry(
            new CatmullRomCurve3(t, !1, `centripetal`),
            40,
            0.011,
            6,
          )
        );
      }),
      studs: $(`${t}YokeStuds`, () =>
        mergeGeometries(
          [1, -1].map((t) =>
            new CylinderGeometry(0.011, 0.011, e.yoke - e.neckR, 8)
              .rotateX(Math.PI / 2)
              .translate(0, e.pivot, (t * (e.yoke + e.neckR)) / 2),
          ),
        ),
      ),
      knobs: $(`${t}YokeKnobs`, () =>
        mergeGeometries(
          [1, -1].flatMap((t) => [
            new CylinderGeometry(0.02, 0.02, 0.016, 8)
              .rotateX(Math.PI / 2)
              .translate(0, e.pivot, t * (e.yoke + 0.014)),
            new BoxGeometry(0.062, 0.012, 0.012).translate(
              0,
              e.pivot,
              t * (e.yoke + 0.026),
            ),
          ]),
        ),
      ),
      bolt: $(`${t}YokeBolt`, () =>
        new CylinderGeometry(0.018, 0.018, 0.056, 10).translate(0, -0.012, 0),
      ),
      bell: $(
        `${t}Bell`,
        () =>
          new LatheGeometry(
            Array.from(
              {
                length: 14,
              },
              (e, t) => MK(r(t / 13), (t / 13) * n),
            ),
            32,
          ),
      ),
      inside: [0, 1, 2].map((e) =>
        $(
          `${t}BellIn${e}`,
          () =>
            new LatheGeometry(
              Array.from(
                {
                  length: 5,
                },
                (t, a) => {
                  let o = n - i[e] - ((i[e + 1] - i[e]) * a) / 4;
                  return MK(r(o / n) - 0.005, o);
                },
              ),
              32,
            ),
        ),
      ),
      throat: $(`${t}BellThroat`, () =>
        new CircleGeometry(r((n - i[3]) / n) - 0.004, 20)
          .rotateX(-Math.PI / 2)
          .translate(0, n - i[3], 0),
      ),
      plug: $(`${t}BellPlug`, () =>
        new SphereGeometry(0.03, 14, 8).translate(0, n - i[3] + 0.022, 0),
      ),
      lip: $(`${t}BellLip`, () =>
        new TorusGeometry(e.rm, e.lip, 8, 40)
          .rotateX(Math.PI / 2)
          .translate(0, n, 0),
      ),
    };
  }
  function jq(e) {
    let t = MathUtils.degToRad(e.yaw),
      n = MathUtils.degToRad(e.el),
      r = Z(
        e.side * Math.sin(t) * Math.cos(n),
        Math.sin(n),
        Math.cos(t) * Math.cos(n),
      ),
      i = Z(0, 1, 0).addScaledVector(r, -r.y).normalize(),
      a = Z().crossVectors(r, i);
    return {
      dir: r,
      up: i,
      across: a,
      turn: new Quaternion().setFromRotationMatrix(
        new Matrix4().makeBasis(a, r, i),
      ),
    };
  }
  function Mq(e, t, n, r) {
    let i = new Group();
    (i.position.copy(n),
      i.quaternion.copy(r),
      e.add(i),
      createPart(t.back, palette.hotPink, i),
      createPart(t.can, palette.hotPink, i),
      createPart(t.fins, shadowPurple, i),
      createPart(t.neck, palette.yellow, i),
      createPart(t.yoke, paperWhite, i),
      createPart(t.studs, paperWhite, i),
      createPart(t.knobs, shadowPurple, i),
      createPart(t.bolt, paleBlue, i));
  }
  function Nq(e, t, n, r, i, a, o) {
    let s = new Group();
    ((s.name = n),
      (s.userData.bakeSkip = !0),
      s.position.copy(r),
      s.quaternion.copy(i),
      e.add(s),
      createPart(t.bell, a, s),
      t.inside.forEach((e, t) => createPart(e, o[t], s)),
      createPart(t.throat, inkPurple, s),
      createPart(t.plug, palette.yellow, s),
      createPart(t.lip, paperWhite, s));
    for (let e of bakeStaticGeometry(s, s.name, !0)) e.castShadow = !1;
    return s;
  }
  function Pq(e, t, n, r, i, a, o, s, c) {
    let { dir: l, up: u, turn: d } = i,
      f = a.clone().addScaledVector(l, 0.03).addScaledVector(u, -0.05);
    (createPart(
      new TubeGeometry(
        new CatmullRomCurve3(
          [
            f,
            f
              .clone()
              .addScaledVector(l, -0.04)
              .add(Z(0, -0.08, 0)),
            Z(o.x + r.side * 0.09, o.y - 0.07, o.z),
            Z(o.x + r.side * 0.02, o.y, o.z),
          ],
          !1,
          `centripetal`,
        ),
        20,
        0.0075,
        5,
      ),
      paleBlue,
      e,
    ),
      createPart(
        $(`partyGland`, () =>
          new CylinderGeometry(0.014, 0.017, 0.03, 10).rotateZ(Math.PI / 2),
        ),
        shadowPurple,
        e,
      ).position.copy(o));
    let p = Nq(
      e,
      t,
      `PartyBell${r.name}`,
      a.clone().addScaledVector(l, n.neck),
      d,
      s,
      c,
    );
    return {
      dir: l,
      way: l.clone().setY(l.y * (l.y < 0 ? TK.dip : 1)),
      bell: p,
      mouth: a.clone().addScaledVector(l, n.mouth + TK.face),
    };
  }
  function Fq(e, t, n, r) {
    let i = new Shape(SH(t.w + 0.016, t.h + 0.016, 0.032).getPoints(4));
    (i.holes.push(new Path(SH(t.w, t.h, 0.025).getPoints(4))),
      createPart(new ShapeGeometry(i), inkPurple, e).position.set(
        0,
        t.y,
        n + 0.002,
      ));
    let a = $(
      `partyHinge`,
      () => new CylinderGeometry(0.013, 0.013, 0.075, 10),
    );
    for (let i of r)
      createPart(a, paleBlue, e).position.set(-t.w / 2 - 0.004, i, n + 0.008);
  }
  function Iq(e, t, n) {
    let r = t.poleRadius;
    for (let t of [-1, 1]) {
      let n = iK.x + t * sK.dx;
      (createPart(
        $(`partyBoxSaddle`, () =>
          new CylinderGeometry(gK.r + 0.01, gK.r + 0.01, 0.08, 18).rotateZ(
            Math.PI / 2,
          ),
        ),
        palette.cyan,
        e.g,
      ).position.set(n, gK.top, 0),
        yH(e.g, Z(n, aK - 0.01, 0), Z(n, gK.top, 0), sK.r, paperWhite, 10),
        createPart(
          $(
            `partyBoxFlange`,
            () => new CylinderGeometry(0.045, 0.05, 0.02, 14),
          ),
          shadowPurple,
          e.g,
        ).position.set(n, aK + 0.04, 0));
    }
    let i = new Group();
    ((i.name = `PartyStreetBox`), i.position.set(iK.x, iK.y, 0), e.g.add(i));
    let a = iK.d / 2;
    createPart(
      new RoundedBoxGeometry(iK.w, iK.h, iK.d, 3, iK.r),
      palette.yellow,
      i,
    );
    let o = createPart(
      $(
        `partyBoxCap`,
        () => new RoundedBoxGeometry(oK.w, oK.t, oK.d, 2, 0.012),
      ),
      amber,
      i,
    );
    (o.position.set(0, iK.h / 2 + 0.02, 0.025),
      (o.rotation.x = oK.tilt),
      createPart(
        $(`partyBoxDrip`, () => new BoxGeometry(oK.w, oK.lip, 0.012)),
        amber,
        i,
      ).position.set(0, iK.h / 2 - 0.02, oK.d / 2 + 0.025));
    let s = $(`partyBoxLouvre`, () => new BoxGeometry(0.012, 0.014, 0.24)),
      c = BK(palette.yellow, shadowPurple, 0.4);
    for (let e of [-1, 1])
      for (let t = 0; t < 5; t++)
        createPart(s, c, i).position.set(
          e * (iK.w / 2 + 0.001),
          -0.12 - t * 0.04,
          0,
        );
    t.backStickers(i, 0, -a, 0.28, 0.26, 4);
    let l = {
      y: -0.0175,
      w: iK.w - 0.07,
      h: iK.h - 0.055,
    };
    Fq(i, l, a, [0.2, -0.22]);
    let u = Z(l.w / 2 - 0.04, 0.03, a);
    (createPart(
      $(`partyBoxHandle`, () =>
        new CylinderGeometry(0.026, 0.026, 0.012, 16).rotateX(Math.PI / 2),
      ),
      paleBlue,
      i,
    ).position.set(u.x, u.y, a + 0.006),
      createPart(
        $(
          `partyBoxHandleBar`,
          () => new RoundedBoxGeometry(0.02, 0.09, 0.016, 2, 0.006),
        ),
        paleBlue,
        i,
      ).position.set(u.x, u.y, a + 0.018));
    let d = Z(u.x, -0.075, a);
    (createPart(
      $(
        `partyBoxHasp`,
        () => new RoundedBoxGeometry(0.044, 0.024, 0.016, 2, 0.005),
      ),
      paleBlue,
      i,
    ).position.set(d.x, d.y, a + 0.008),
      createPart(
        $(
          `partyBoxVent`,
          () => new RoundedBoxGeometry(0.3, 0.13, 0.008, 2, 0.004),
        ),
        BK(palette.yellow, palette.orange, 0.25),
        i,
      ).position.set(0, -0.21, a + 0.002));
    let f = $(`partyBoxVentSlot`, () => new BoxGeometry(0.11, 0.012, 0.004));
    for (let e of [-0.075, 0.075])
      for (let t = 0; t < 4; t++)
        createPart(f, inkPurple, i).position.set(
          e,
          -0.25 + t * 0.028,
          a + 0.006,
        );
    let p = new Group();
    ((p.name = `PartyPadlock`),
      (p.userData.bakeSkip = !0),
      p.position.set(d.x, d.y, a + 0.02),
      i.add(p),
      createPart(
        $(`partyPadlockShackle`, () =>
          mergeGeometries([
            new TorusGeometry(0.018, 0.0045, 6, 12, Math.PI).translate(
              0,
              -0.018,
              0,
            ),
            ...[-1, 1].map((e) =>
              new CylinderGeometry(0.0045, 0.0045, 0.035, 6).translate(
                e * 0.018,
                -0.0355,
                0,
              ),
            ),
          ]),
        ),
        paleBlue,
        p,
      ),
      (createPart(
        $(
          `partyPadlockBody`,
          () => new RoundedBoxGeometry(0.068, 0.06, 0.022, 2, 0.01),
        ),
        palette.hotPink,
        p,
      ).position.y = -0.08),
      createPart(
        $(`partyPadlockHole`, () =>
          mergeGeometries([
            new CircleGeometry(0.007, 10),
            new PlaneGeometry(0.005, 0.014).translate(0, -0.008, 0),
          ]),
        ),
        inkPurple,
        p,
      ).position.set(0, -0.085, 0.0115));
    for (let e of bakeStaticGeometry(p, p.name, !0)) e.castShadow = !1;
    let m = AH(Z(0, 0, a), oG, sG);
    (LH(i, m, -0.2, 0.19, KK.warn[1], KK.warn[2], -0.1, YK(`warn`), 0.006),
      LH(i, m, 0.07, 0.205, KK.code[1], KK.code[2], 0, YK(`code`), 0.004),
      LH(
        i,
        m,
        0.06,
        -0.13,
        KK.label[1],
        KK.label[2],
        -0.05,
        YK(`label`),
        0.009,
      ));
    let h = -0.7;
    (zH(
      i,
      AH(
        Z(0.27, 0.24, a),
        Z(Math.cos(h), Math.sin(h), 0),
        Z(-Math.sin(h), Math.cos(h), 0),
      ),
      0,
      0,
      0.026 * OU,
      0.026,
      `tape_mesq`,
      0.005,
    ),
      VH(i, AH(Z(-0.235, -0.09, a), oG, sG), {
        count: 2,
        size: [0.08, 0.12],
        hw: 0.075,
        hh: 0.08,
      }));
    let g = Aq(lK, `partyBox`),
      _ = [
        BK(palette.purple, shadowPurple, 0.4),
        BK(palette.purple, shadowPurple, 0.72),
        BK(palette.purple, shadowPurple, 0.9),
      ],
      v = cK.y - iK.y,
      y = uK.map((t) => {
        let n = t.side;
        createPart(
          $(
            `partyBoxPlate`,
            () => new RoundedBoxGeometry(0.012, cK.plate, cK.plate, 1, 0.004),
          ),
          paperWhite,
          i,
        ).position.set(n * (iK.w / 2 + 0.006), v, cK.z);
        for (let e of [-1, 1])
          for (let t of [-1, 1])
            xH(
              i,
              Z(n * (iK.w / 2 + 0.012), v + e * 0.055, cK.z + t * 0.055),
              Z(n, 0, 0),
              paleBlue,
              0.008,
            );
        let r = Z(iK.x + n * (iK.w / 2 + cK.stub), cK.y, cK.z);
        yH(
          e.g,
          Z(iK.x + n * (iK.w / 2 + 0.012), cK.y, cK.z),
          r,
          0.028,
          paperWhite,
          12,
        );
        let a = jq(t),
          o = r.clone().addScaledVector(a.dir, 0.025);
        Mq(e.g, g, o, a.turn);
        let s = Z(iK.x + n * (iK.w / 2 + 0.006), iK.y - 0.025, 0.08);
        return {
          side: n,
          ...Pq(e.g, g, lK, t, a, o, s, palette.hotPink, _),
        };
      }),
      b = r + fK.gap + fK.d / 2;
    createPart(
      $(
        `partyPanelPlate`,
        () => new RoundedBoxGeometry(0.22, fK.h + 0.12, 0.06, 2, 0.01),
      ),
      shadowPurple,
      e.g,
    ).position.set(0, fK.y, r - 0.01);
    for (let n of [fK.y + 0.315, fK.y - 0.315])
      t.collar(e, n, palette.cyan, 0.045, 0.03);
    t.keepClear(e, fK.y - 0.36, fK.y + 0.35, 0, r + 0.06, 0.24);
    let x = new Group();
    ((x.name = `PartyPanel`), x.position.set(0, fK.y, b), e.g.add(x));
    let S = fK.d / 2;
    createPart(
      new RoundedBoxGeometry(fK.w, fK.h, fK.d, 3, 0.025),
      palette.hotPink,
      x,
    );
    let C = $(
      `partyPanelHinge`,
      () => new CylinderGeometry(0.01, 0.01, 0.06, 8),
    );
    for (let e of [0.15, -0.17])
      createPart(C, paleBlue, x).position.set(-fK.w / 2 + 0.012, e, S + 0.004);
    createPart(
      $(`partyPanelLock`, () =>
        new CylinderGeometry(0.011, 0.011, 0.012, 12).rotateX(Math.PI / 2),
      ),
      paleBlue,
      x,
    ).position.set(fK.w / 2 - 0.017, -0.02, S + 0.004);
    let w = createPart(
      $(
        `partyPanelHood`,
        () => new RoundedBoxGeometry(fK.w + 0.05, 0.025, fK.d + 0.05, 2, 0.01),
      ),
      palette.yellow,
      x,
    );
    (w.position.set(0, fK.h / 2 + 0.02, 0.02), (w.rotation.x = 0.12));
    let T = Z(0, fK.h / 2 - 0.0025, S + 0.04);
    (createPart(
      $(
        `partyPanelVisor`,
        () => new RoundedBoxGeometry(fK.w + 0.05, 0.075, 0.018, 2, 0.008),
      ),
      palette.yellow,
      x,
    ).position.copy(T),
      createPart(
        mapAtlasUV(
          TH(new ShapeGeometry(SH(pK.w, pK.h, 0.008), 4)),
          mH(`party.hood`),
        ),
        `#ffffff`,
        x,
        `atlas`,
      )
        .position.copy(T)
        .setZ(T.z + 0.012));
    let E = S + 0.004,
      { eq: D, vol: ee } = kq(x, Z(0, fK.face, E), HK),
      te = $(
        `partyPanelGland`,
        () => new CylinderGeometry(0.016, 0.019, 0.03, 10),
      );
    for (let e of [-0.12, 0.11])
      createPart(te, shadowPurple, x).position.set(e, -fK.h / 2 - 0.015, 0);
    let O = 0.61,
      ne = Z(Math.sin(O), 0, Math.cos(O)),
      re = fK.y - fK.h / 2 - 0.03;
    createPart(
      new TubeGeometry(
        new CatmullRomCurve3(
          [
            Z(0.11, re, b),
            Z(0.12, re - 0.045, b - 0.01),
            Z(0.15, re - 0.07, 0.27),
            ne
              .clone()
              .multiplyScalar(0.27)
              .setY(re - 0.07),
          ],
          !1,
          `centripetal`,
        ),
        16,
        0.009,
        6,
      ),
      shadowPurple,
      e.g,
    );
    let ie = createPart(
      $(`partyPoleGland`, () =>
        new CylinderGeometry(0.016, 0.02, 0.05, 10).rotateZ(Math.PI / 2),
      ),
      palette.hotPink,
      e.g,
    );
    (ie.position
      .copy(ne)
      .multiplyScalar(0.25)
      .setY(re - 0.07),
      (ie.rotation.y = Math.PI / 2 + O),
      n.from(x));
    let ae = fK.face + HK.eq.y;
    for (let e of [-1, 1])
      n.dash(
        -HK.eq.w / 2 - 0.03,
        ae + e * 0.04,
        E + 0.006,
        Math.PI - e * 0.3,
        0.04,
        0.014,
        palette.lime,
        3,
      );
    (n.dash(
      HK.eq.w / 2 + 0.03,
      ae - 0.04,
      E + 0.006,
      -0.3,
      0.04,
      0.014,
      palette.lime,
      3,
    ),
      n.burst(
        HK.on.x,
        fK.face + HK.on.y,
        E + 0.006,
        0.028,
        [0.3, 1.2, 1.95, 2.85],
        palette.lime,
        3,
        0.024,
        0.011,
      ),
      createPart(
        $(
          `partyBoxFootGland`,
          () => new CylinderGeometry(0.016, 0.019, 0.03, 10),
        ),
        shadowPurple,
        i,
      ).position.set(0.2, -iK.h / 2 - 0.015, 0.09),
      createPart(
        new TubeGeometry(
          new CatmullRomCurve3(
            [
              Z(iK.x + 0.2, iK.y - iK.h / 2 - 0.035, 0.09),
              Z(-1.2, -1.15, 0.12),
              Z(-0.7, -1.17, 0.24),
              Z(-0.24, -1.1, 0.32),
              Z(-0.12, re, b),
            ],
            !1,
            `centripetal`,
          ),
          48,
          0.011,
          6,
        ),
        BK(paleBlue, shadowPurple, 0.45),
        e.g,
      ));
    let oe = iK.y - iK.h / 2 - 0.05,
      se = Oq(
        e,
        t,
        `box`,
        oK.w + 0.04,
        gK.top - oe,
        oK.d + 0.06,
        iK.x,
        (gK.top + oe) / 2,
      );
    se.position.z = 0.03;
    let ce = 2 * (lK.rm + lK.lip) + 0.01,
      le = y.map((n) => {
        let r = Oq(e, t, `horn`, ce, lK.mouth + 0.06, ce, 0, 0);
        return (
          r.position
            .copy(n.bell.position)
            .addScaledVector(n.dir, lK.mouth / 2 - lK.neck - 0.01),
          r.quaternion.copy(n.bell.quaternion),
          r
        );
      }),
      ue = Oq(e, t, `panel`, fK.w + 0.14, fK.h + 0.18, 0.4, 0, fK.y - 0.01);
    ue.position.z = 0.42;
    let de = {
        x: 0,
        v: 0,
      },
      fe = NaN,
      pe = 1;
    return {
      horns: y,
      eq: D,
      vol: ee,
      hits: [se, ...le, ue],
      parked: Z(iK.x, iK.y, 0),
      tick(e, t, n) {
        if (n) {
          ((de.x = de.v = 0), (p.rotation.z = 0));
          return;
        }
        let r = Math.floor(t);
        (r !== fe &&
          (Number.isNaN(fe) || (de.v += dK.kick * (pe = -pe)), (fe = r)),
          Cq(de, 0, dK.w, dK.zeta, e),
          (p.rotation.z = dK.most * Math.tanh(de.x / dK.most)));
      },
      poke(e) {
        de.v += dK[e] * (pe = -pe);
      },
      rest() {
        ((de.x = de.v = 0), (fe = NaN), (p.rotation.z = 0));
      },
    };
  }
  function Lq(e) {
    let t = new Float32Array(mK.bands),
      n = new Int8Array(mK.bands),
      r = new Float32Array(mK.bands),
      i = new Float32Array(e.length),
      a = new Int8Array(e.length),
      o = WB(palette.lime),
      s = WB(palette.yellow),
      c = WB(palette.hotPink),
      l = WB(paperWhite),
      u = [
        WB(BK(palette.cyan, shadowPurple, 0.72)),
        WB(BK(palette.cyan, shadowPurple, 0.35)),
        WB(palette.cyan),
      ],
      d = mK.meter;
    [3, 5, 7, 6, 4, 5, 2].forEach((e, t) => ((n[t] = e), (r[t] = e + 1)));
    let f = 0,
      p = {
        on: !1,
      },
      m = Object.assign(
        (t) => {
          for (let e = 0; e < mK.bands; e++) {
            let i = 1 + e * 3,
              a = n[e];
            for (let e = 0; e < a; e++)
              t.block(i, d - 1 - e, 2, 1, e >= d - 2 ? c : e >= d - 5 ? s : o);
            let u = Math.round(r[e]);
            u > a && u > 0 && t.block(i, d - u, 2, 1, l);
          }
          for (let n = 0; n < i.length; n++)
            t.block(e[n], mK.rows - 2, 3, 2, u[a[n]]);
        },
        {
          tick: (e) => {
            if (!p.on) return !1;
            let o = Math.min(0.1, Math.max(0, e - f));
            f = e;
            let s = !1;
            for (let e = 0; e < mK.bands; e++) {
              let i = Math.round(t[e] * d);
              i !== n[e] && ((n[e] = i), (s = !0));
              let a = Math.max(r[e] - o * 7, i + 1);
              (Math.round(a) !== Math.round(r[e]) && (s = !0), (r[e] = a));
            }
            for (let e = 0; e < i.length; e++) {
              let t = i[e] > 0.5 ? 2 : +(i[e] > 0);
              t !== a[e] && ((a[e] = t), (s = !0));
            }
            return s;
          },
        },
      );
    return {
      led: aV({
        cols: mK.cols,
        rows: mK.rows,
        draw: m,
        brightness: 1.3,
      }),
      levels: t,
      lamps: i,
      get on() {
        return p.on;
      },
      set on(e) {
        p.on = e;
      },
    };
  }
  var Rq = 0.35;
  var zq = null;
  var Bq = new Float32Array(256);
  function Vq(e) {
    if (zq && zq.e === e) return zq;
    let t = e.ctx.createAnalyser();
    t.fftSize = Bq.length;
    let n = (t) => {
      let n = e.ctx.createGain();
      return (n.connect(t), n);
    };
    return (zq = {
      e,
      tap: t,
      ui: n(e.ui),
      birds: n(e.birds),
      on: !1,
      hold: 0,
      ducked: !1,
    });
  }
  var Hq = {
    listen(e) {
      let t = OL();
      if (!t) return !1;
      try {
        let n = Vq(t);
        ((n.on ||= (t.helper.connect(n.tap), !0)),
          n.tap.getFloatTimeDomainData(Bq));
        let r = 0;
        for (let e = 0; e < Bq.length; e++) r = Math.max(r, Math.abs(Bq[e]));
        n.hold = r > 0.004 ? 0.6 : Math.max(0, n.hold - e);
        let i = n.hold > 0;
        if (i !== n.ducked) {
          n.ducked = i;
          let e = t.ctx.currentTime;
          for (let t of [n.ui, n.birds])
            t.gain.setTargetAtTime(i ? Rq : 1, e, i ? 0.03 : 0.3);
        }
        return i;
      } catch (e) {
        return (DL(e), !1);
      }
    },
    release() {
      if (zq?.on) {
        zq.on = !1;
        try {
          zq.e.helper.disconnect(zq.tap);
        } catch {}
      }
    },
  };
  function Uq(e, t, n, r, i = 0, a = 0) {
    return xL(n) ? new SynthVoice(e.ctx, Vq(e)[t], e.verb, r, i, a, gL) : null;
  }
  function Wq(e) {
    let t = {};
    for (let n of Object.keys(e)) {
      let r = e[n];
      t[n] = (e, t) => {
        try {
          r(e, t);
        } catch (e) {
          DL(e);
        }
      };
    }
    return t;
  }
  var Gq = {
    ring: new SoundLimiter(0.9, 1, 1),
    hook: new SoundLimiter(0.12, 2, 4),
    mumble: new SoundLimiter(0.5, 1, 1),
    busy: new SoundLimiter(1.5, 1, 1),
    word: new SoundLimiter(0.3, 2, 2),
    alarm: new SoundLimiter(0.6, 1, 1),
    flap: new SoundLimiter(0.2, 2, 1),
  };
  var Kq = -0.2;
  var qq = [
    [750, 1200],
    [520, 900],
    [480, 1750],
    [380, 950],
  ];
  var Jq = {
    chu: [
      [0, 2500, 1950, 0.06, 1],
      [0.1, 1900, 2750, 0.15, 0.9],
    ],
    hehe: [
      [0, 2750, 2350, 0.045, 1],
      [0.09, 2650, 2250, 0.045, 0.9],
      [0.18, 2550, 2150, 0.05, 0.8],
    ],
    hm: [
      [0, 1500, 1650, 0.13, 0.75],
      [0.17, 1650, 1420, 0.2, 0.65],
    ],
    huh: [
      [0, 1650, 2850, 0.15, 1],
      [0.2, 2750, 2650, 0.03, 0.85],
    ],
    dots: [
      [0, 2200, 2150, 0.025, 0.5],
      [0.14, 2e3, 1950, 0.025, 0.45],
      [0.28, 1800, 1750, 0.025, 0.4],
    ],
    heart: [
      [0, 2500, 2050, 0.2, 0.9],
      [0.24, 2150, 1800, 0.26, 0.7],
    ],
    note: [
      [0, 1800, 1820, 0.08, 0.8],
      [0.11, 2250, 2270, 0.08, 0.85],
      [0.22, 2700, 2650, 0.14, 0.9],
    ],
  };
  var Yq = Wq({
    ring(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !Gq.ring.take(t.ctx.currentTime)) return;
      let n = Uq(t, `ui`, 1, Math.min(1, e), Kq, 0.12);
      if (!n) return;
      let r = n.osc(`sine`, dL(1320, 0.01)),
        i = n.osc(`square`, 16),
        a = n.gain(90);
      n.chain(i, a, r.frequency);
      let o = n.gain(0);
      n.chain(r, o, n.filter(`lowpass`, 2e3, 0.5), n.out);
      for (let e of [0, 0.56]) {
        let t = n.t + e;
        (o.gain.setValueAtTime(0, t),
          o.gain.linearRampToValueAtTime(0.022, t + 0.02),
          o.gain.setValueAtTime(0.022, t + 0.41),
          o.gain.linearRampToValueAtTime(0, t + 0.47));
      }
      n.play(1.1);
    },
    pickup(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !Gq.hook.take(t.ctx.currentTime)) return;
      let n = Uq(t, `ui`, 1, Math.min(1, e), Kq, 0.04);
      if (!n) return;
      let r = n.noise(t.white),
        i = n.gain(0);
      (n.chain(r, n.filter(`bandpass`, dL(3200, 0.05), 2.4), i, n.out),
        sL(i.gain, n.t, 0.16, 0.001, 0.014));
      let a = n.osc(`triangle`, dL(720, 0.03)),
        o = n.gain(0);
      (n.chain(a, o, n.filter(`lowpass`, 2200, 0.5), n.out),
        lL(a.frequency, n.t + 0.012, dL(720, 0.03), 430, 0.04),
        sL(o.gain, n.t + 0.012, 0.035, 0.002, 0.05),
        n.play(0.1));
    },
    hangup(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !Gq.hook.take(t.ctx.currentTime)) return;
      let n = Uq(t, `ui`, 1, Math.min(1, e), Kq, 0.06);
      if (!n) return;
      let r = n.osc(`sine`, 180),
        i = n.gain(0);
      (n.chain(r, i, n.out),
        lL(r.frequency, n.t, dL(180, 0.03), 58, 0.09),
        sL(i.gain, n.t, 0.12, 0.002, 0.13));
      let a = n.noise(t.white),
        o = n.gain(0),
        s = n.filter(`bandpass`, dL(1500, 0.05), 1.4);
      (n.chain(a, s, o, n.out),
        sL(o.gain, n.t, 0.22, 0.001, 0.03),
        s.frequency.setValueAtTime(dL(3e3, 0.05), n.t + 0.035),
        sL(o.gain, n.t + 0.035, 0.08, 0.001, 0.012),
        n.play(0.18));
    },
    mumble(e = 1, t = `ask`) {
      let n = OL();
      if (!n || !(e > 0.002) || !Gq.mumble.take(n.ctx.currentTime)) return;
      let r = t === `cross`,
        i = Uq(n, `ui`, +!!r, Math.min(1, e), Kq, 0.05);
      if (!i) return;
      let a = i.osc(`sawtooth`, 170),
        o = i.osc(`sine`, r ? 31 : 5.5),
        s = i.gain(r ? 10 : 3);
      i.chain(o, s, a.frequency);
      let c = i.filter(`bandpass`, 700, 2.5),
        l = i.filter(`bandpass`, 1200, 3.5),
        u = i.gain(0);
      (i.chain(a, c, u),
        i.chain(a, l, i.gain(0.6), u),
        i.chain(
          u,
          i.filter(`lowpass`, r ? 2500 : 1900, 0.6),
          i.filter(`highpass`, 340, 0.6),
          i.out,
        ));
      let d = i.t,
        f = r
          ? 5 + Math.floor(uL(0, 2))
          : t === `ramble`
            ? 5 + Math.floor(uL(0, 3))
            : 3 + Math.floor(uL(0, 2)),
        p = r ? 0.135 : 0.11;
      for (let e = 0; e < f; e++) {
        let n = e === f - 1,
          i = r ? uL(0.07, 0.11) : uL(0.09, 0.16),
          o = r ? uL(235, 300) : uL(150, 210),
          s = o * (r ? uL(1.05, 1.25) : uL(0.82, 1.12));
        (t === `ask` && n
          ? ((i = 0.2), (s = o * 1.4))
          : r && n && ((i = 0.28), (s = o * 0.6)),
          lL(a.frequency, d, o, s, i));
        let [m, h] = qq[r ? 0 : (Math.random() * qq.length) | 0];
        (c.frequency.setValueAtTime(dL(m, 0.08), d),
          l.frequency.setValueAtTime(dL(h, 0.08), d),
          u.gain.setValueAtTime(0, d),
          u.gain.linearRampToValueAtTime(p, d + (r ? 0.012 : 0.025)),
          u.gain.linearRampToValueAtTime(0, d + i),
          (d += i + (r ? uL(0.015, 0.04) : uL(0.03, 0.07))));
      }
      i.play(d - i.t + 0.05);
    },
    busy(e = 1, t = 3) {
      let n = OL();
      if (!n || !(e > 0.002) || !Gq.busy.take(n.ctx.currentTime)) return;
      let r = Uq(n, `ui`, 1, Math.min(1, e), Kq, 0.03);
      if (!r) return;
      let i = r.noise(n.white),
        a = r.gain(0);
      (r.chain(i, r.filter(`bandpass`, dL(1600, 0.05), 1.8), a, r.out),
        sL(a.gain, r.t, 0.09, 0.001, 0.03));
      let o = r.osc(`triangle`, 400),
        s = r.gain(0);
      r.chain(
        o,
        s,
        r.filter(`lowpass`, 1500, 0.6),
        r.filter(`highpass`, 300, 0.6),
        r.out,
      );
      for (let e = 0; e < t; e++) {
        let t = r.t + 0.16 + e * 0.5;
        (s.gain.setValueAtTime(0, t),
          s.gain.linearRampToValueAtTime(0.03, t + 0.015),
          s.gain.setValueAtTime(0.03, t + 0.25),
          s.gain.linearRampToValueAtTime(0, t + 0.27));
      }
      r.play(0.16 + t * 0.5);
    },
    word(e = `chu`, t = 1) {
      let n = OL(),
        r = Jq[e];
      if (!n || !r || !(t > 0.002) || !Gq.word.take(n.ctx.currentTime)) return;
      let i = Uq(n, `birds`, 1, Math.min(1, t), -0.15000000000000002, 0.16);
      if (!i) return;
      let a = dL(1, 0.04),
        o = i.osc(`sine`, r[0][1] * a),
        s = i.gain(0);
      i.chain(o, s, i.filter(`lowpass`, 4200, 0.5), i.out);
      let c = i.osc(`sine`, uL(30, 45)),
        l = i.gain(uL(40, 90));
      i.chain(c, l, o.frequency);
      let u = 0;
      for (let [e, t, n, c, l] of r)
        (lL(o.frequency, i.t + e, t * a, n * a, c),
          sL(s.gain, i.t + e, 0.075 * l, 0.012, Math.max(0.015, c - 0.012)),
          (u = Math.max(u, e + c)));
      i.play(u + 0.04);
    },
    alarm(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !Gq.alarm.take(t.ctx.currentTime)) return;
      let n = Uq(t, `birds`, 1, Math.min(1, e), -0.1, 0.1);
      if (!n) return;
      let r = n.osc(`sine`, 2300),
        i = n.gain(0);
      n.chain(r, i, n.filter(`lowpass`, 3400, 0.5), n.out);
      let a = dL(1, 0.05);
      for (let [e, t, o] of [
        [0, 2350, 1900],
        [0.075, 2200, 1800],
        [0.15, 2400, 1950],
      ])
        (lL(r.frequency, n.t + e, t * a, o * a, 0.04),
          sL(i.gain, n.t + e, 0.028, 0.006, 0.036));
      n.play(0.24);
    },
    flap(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !Gq.flap.take(t.ctx.currentTime)) return;
      let n = Uq(t, `birds`, 1, Math.min(1, e), -0.05000000000000002, 0.05);
      if (!n) return;
      let r = n.noise(t.white, dL(1, 0.1)),
        i = n.filter(`bandpass`, 900, 1.1),
        a = n.gain(0);
      n.chain(r, i, a, n.filter(`lowpass`, 2400), n.out);
      let o = n.t,
        s = uL(0.055, 0.07),
        c = 0.32,
        l = 6 + Math.floor(uL(0, 3));
      for (let e = 0; e < l; e++)
        (i.frequency.setValueAtTime(dL(900, 0.15), o),
          sL(a.gain, o, c * uL(0.8, 1), 0.008, Math.min(0.045, s - 0.008)),
          (o += s),
          (s *= 1.07),
          (c *= 0.84));
      n.play(o - n.t + 0.05);
    },
  });
  return {
    QK,
    $K,
    Dq,
    Hq,
    Yq,
  };
}
