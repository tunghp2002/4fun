// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DynamicDrawUsage,
  Euler,
  Float32BufferAttribute,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MathUtils,
  Matrix3,
  Matrix4,
  Mesh,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  ShapeUtils,
  Sphere,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  Vector4,
} from "three/webgpu";
import {
  abs,
  attribute,
  cameraProjectionMatrix,
  clamp,
  cos,
  diffuseColor,
  dot,
  emissive,
  exp,
  exp2,
  float,
  Fn,
  fract,
  length,
  max,
  min,
  mix,
  modelViewMatrix,
  normalize,
  normalView,
  output,
  positionGeometry,
  positionViewDirection,
  pow,
  screenCoordinate,
  screenSize,
  sin,
  smoothstep,
  step,
  texture,
  uniform,
  uv,
  varying,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function createDemoGeometryModule(
  scope,
  { paletteModule, renderingModule, meshBuildersModule },
) {
  const { paperWhite, inkPurple, palette } = paletteModule;
  const { uI, createToonMaterial } = renderingModule;
  const { DG, kG, AG } = meshBuildersModule;
  var f2 = [`model`, `bake`, `texture`, `export`, `light`, `shader`];
  var p2 = f2.length;
  var m2 = () => ({
    autoplay: !0,
    speed: 1,
    model: 3,
    bake: 1.9,
    texture: 2.1,
    export: 2.6,
    light: 2.3,
    shader: 3.4,
  });
  var h2 = 0.93;
  var g2 = 0.89;
  var _2 = 0.7;
  var v2 = 0.55;
  var y2 = 0.035;
  var b2 = 0.15;
  var x2 = 0.19;
  var DemoState = class {
    phase = 0;
    phaseT = 0;
    progress = 0;
    show = 0;
    squash = 0;
    hopY = 0;
    lift = 0;
    morph = 0;
    cut = 0;
    select = 0;
    sub = 0;
    wire = 0;
    dotPop = [0, 0, 0];
    burst = -1;
    bake = 0;
    bakeLine = 0;
    bakeFlash = 0;
    checker = 0;
    paint = 0;
    lit = 0;
    rim = 0;
    warm = 0;
    hero = 0;
    sway = 0;
    mushVisible = 1;
    spin = 1;
    patch = 0;
    flowers = 0;
    card = 0;
    cardX = 0;
    cardY = 0;
    cardZ = 0;
    cardRoll = 0;
    cardSy = 1;
    cursor = 0;
    cursorX = 0;
    cursorY = 0;
    cursorZ = 0;
    press = 0;
    reticle = 0;
    puff = -1;
    puffY = 0.15;
    puffSize = 1;
    sparkle = 0;
    grid = 1;
    scene = 0;
    dim = 1;
    spotK = 0;
    beamK = 0;
    lampK = 0;
    rimWash = 0;
    heroBurst = 0;
    capCell = 0;
    capScale = 1;
    capBar = 0;
  };
  var C2 = (e) => (e < 0 ? 0 : e > 1 ? 1 : e);
  var w2 = (e, t, n) => C2((e - t) / (n - t));
  var T2 = (e, t, n) => e + (t - e) * n;
  var E2 = (e) => 1 - (1 - e) ** 3;
  var D2 = (e) => e * e * e;
  var O2 = (e) => (e < 0.5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2);
  var k2 = (e) => e * e * (3 - 2 * e);
  var A2 = (e, t = 1.9) =>
    e <= 0 ? 0 : 1 + (t + 1) * (e - 1) ** 3 + t * (e - 1) ** 2;
  var j2 = (e) =>
    e <= 0 ? 0 : e >= 1 ? 1 : 1 - 2 ** (-10 * e) * Math.cos(e * Math.PI * 3);
  var M2 = (e) =>
    e <= 0 || e >= 1 ? 0 : Math.sin(e * Math.PI * 3) * (1 - e) * (1 - e);
  function N2(e, t) {
    return (
      (t[0] = Math.max(0.5, e.model)),
      (t[1] = Math.max(0.5, e.bake)),
      (t[2] = Math.max(0.5, e.texture)),
      (t[3] = Math.max(0.5, e.export)),
      (t[4] = Math.max(0.5, e.light)),
      (t[5] = Math.max(0.5, e.shader)),
      t
    );
  }
  function P2(e) {
    return T2(T2(1, 0.3, O2(w2(e, 0.12, 0.3))), 1, O2(w2(e, 0.8, 0.92)));
  }
  function F2(e) {
    let t = e[0] + e[1] + e[2] + e[3] + e[4];
    for (let n = 0; n < 48; n++)
      t += P2(((n + 0.5) / 48) * v2) * (v2 / 48) * e[5];
    return t;
  }
  function I2(e, t, n, r, i = !1) {
    let a = n[e],
      o = C2(t / a);
    if (
      ((r.phase = e),
      (r.phaseT = t),
      (r.progress = o),
      (r.show = 1),
      (r.squash = 0),
      (r.hopY = 0),
      (r.lift = +(e > 3)),
      (r.morph = e > 0 ? 3 : 0),
      (r.cut = r.sub = +(e > 0)),
      (r.select = 0),
      (r.wire = +(e === 0)),
      (r.dotPop[0] = r.dotPop[1] = r.dotPop[2] = +(e > 0)),
      (r.burst = e > 1 ? 99 : -1),
      (r.bake = +(e > 1)),
      (r.bakeLine = 0),
      (r.bakeFlash = 0),
      (r.checker = r.paint = +(e > 2)),
      (r.lit = r.rim = r.warm = +(e > 4)),
      (r.hero = 0),
      (r.sway = 0),
      (r.mushVisible = 1),
      (r.spin = 1),
      (r.patch = r.flowers = +(e > 3)),
      (r.card = 0),
      (r.cardX = r.cardY = r.cardZ = r.cardRoll = 0),
      (r.cardSy = 1),
      (r.cursor = 0),
      (r.cursorX = r.cursorY = r.cursorZ = 0),
      (r.press = 0),
      (r.reticle = 0),
      (r.puff = -1),
      (r.puffY = 0.15),
      (r.puffSize = 1),
      (r.sparkle = 0),
      (r.grid = +(e < 3)),
      (r.scene = +(e > 3)),
      (r.dim = 1),
      (r.spotK = r.beamK = r.lampK = r.rimWash = +(e > 4)),
      (r.heroBurst = 0),
      (r.capCell = e),
      (r.capBar = o),
      (r.capScale = 0.75 + 0.25 * j2(C2(t / 0.4))),
      e === 0)
    ) {
      ((r.show = j2(w2(o, 0, 0.14))),
        (r.squash =
          0.22 * M2(w2(o, 0, 0.22)) +
          0.2 * M2(w2(o, 0.45, 0.6)) +
          0.12 * M2(w2(o, 0.69, 0.82)) +
          0.12 * M2(w2(o, 0.89, 1))),
        (r.cut = E2(w2(o, 0.16, 0.26))),
        (r.select = E2(w2(o, 0.26, 0.3)) * (1 - w2(o, 0.5, 0.56))),
        (r.morph =
          O2(w2(o, 0.3, 0.46)) + O2(w2(o, 0.56, 0.7)) + O2(w2(o, 0.74, 0.9))),
        (r.sub = E2(w2(o, 0.5, 0.58))),
        (r.dotPop[0] = w2(o, 0.05, 0.2)),
        (r.dotPop[1] = w2(o, 0.16, 0.3)),
        (r.dotPop[2] = w2(o, 0.5, 0.64)),
        (r.burst = o >= 0.93 ? (o - h2) * a : -1));
      let e = n[5] * 0.10999999999999999 + t;
      i && e < 0.7 && ((r.puff = e), (r.puffY = 0.2), (r.puffSize = 1.2));
    } else if (e === 1) {
      let e = n[0] * 0.06999999999999995 + t;
      r.burst = e < 1.05 ? e : 99;
      let i = w2(o, 0.1, 0.68);
      ((r.bake = k2(i)),
        (r.bakeLine = w2(o, 0.07, 0.12) * (1 - w2(o, 0.66, 0.7))),
        (r.wire = 1 - w2(o, 0.68, 0.8)),
        (r.bakeFlash = E2(w2(o, 0.7, 0.76)) * (1 - O2(w2(o, 0.82, 0.97)))),
        (r.squash = 0.14 * M2(w2(o, 0.7, 0.86))),
        (r.capBar = i));
    } else if (e === 2)
      ((r.checker = O2(w2(o, 0.04, 0.38))),
        (r.paint = O2(w2(o, 0.42, 0.84))),
        (r.squash = 0.14 * M2(w2(o, 0.85, 1))));
    else if (e === 3) K2(o, a, r);
    else if (e === 4) {
      let e = O2(w2(o, 0, 0.12)),
        t =
          (o < 0.2 ? 0 : o < 0.23 ? 1 : o < 0.26 ? 0.15 : 1) *
          E2(w2(o, 0.2, 0.24)),
        n =
          o < 0.62
            ? 0
            : o < 0.65
              ? 1
              : o < 0.68
                ? 0
                : o < 0.7
                  ? 0.8
                  : o < 0.73
                    ? 0.1
                    : T2(0.6, 1, E2(w2(o, 0.73, 0.8)));
      ((r.lit = t),
        (r.rim = A2(w2(o, 0.44, 0.52))),
        (r.rimWash = r.rim),
        (r.warm = n),
        (r.dim = T2(T2(1, 0.28, e), 0.62, t)),
        (r.dim = T2(r.dim, 1, n)),
        (r.spotK = t),
        (r.beamK = t),
        (r.lampK = n),
        (r.squash = 0.1 * M2(w2(o, 0.2, 0.32)) + 0.1 * M2(w2(o, 0.73, 0.86))));
    } else {
      ((r.hero = O2(w2(o, 0.03, 0.22))),
        (r.heroBurst = E2(w2(o, 0.1, 0.32)) * (1 - O2(w2(o, 0.9, 0.98)))),
        (r.sparkle = w2(o, 0.16, 0.3) * (1 - w2(o, 0.84, 0.9))),
        (r.sway = k2(w2(o, 0.14, 0.32)) * (1 - k2(w2(o, 0.76, 0.82)))),
        (r.spin = P2(o)),
        (r.squash = 0.14 * M2(w2(o, 0.2, 0.36)) + 0.18 * M2(w2(o, 0.78, 0.93))),
        (r.hopY = 0.07 * Math.sin(Math.PI * w2(o, 0.8, 0.88))));
      let e = w2(o, 0.87, 0.93);
      ((r.show =
        e < 0.3 ? 1 + (e / 0.3) * 0.12 : 1.12 * (1 - D2((e - 0.3) / 0.7))),
        o >= g2 &&
          ((r.puff = (o - g2) * a), (r.puffY = 0.2), (r.puffSize = 1.2)));
      let t = w2(o, 0.89, 0.97);
      r.patch = r.flowers =
        t < 0.25
          ? 1 + 0.06 * Math.sin((t / 0.25) * Math.PI)
          : 1 - D2((t - 0.25) / 0.75);
      let n = O2(w2(o, 0.92, 1));
      ((r.spotK = r.beamK = r.lampK = r.rimWash = r.scene = 1 - n),
        (r.grid = n));
    }
    return r;
  }
  var L2 = 0.07;
  var R2 = 0.15;
  var z2 = 0.22;
  var B2 = 0.4;
  var V2 = 0.47;
  var H2 = 0.62;
  var U2 = 0.65;
  var W2 = 0.13;
  var G2 = 0.42;
  function K2(e, t, n) {
    let r = _2;
    if (e < r) {
      let t = w2(e, 0, L2),
        r = w2(e, L2, R2);
      ((n.squash =
        e < L2 ? -0.28 * Math.sin((t * Math.PI) / 2) : T2(-0.28, 0.3, E2(r))),
        (n.show = 1 - D2(r)),
        (n.lift = 0));
    } else
      ((n.lift = 1),
        (n.show = j2(w2(e, r, 0.82))),
        (n.squash = 0.28 * M2(w2(e, r, 0.96))));
    if (e >= L2 && e < B2) {
      let t = w2(e, z2, B2),
        r = E2(w2(e, L2, 0.19)),
        i = 0.035 * Math.sin(Math.PI * w2(e, z2, 0.27)),
        a = D2(t);
      ((n.card = j2(w2(e, L2, 0.19))),
        (n.cardX = T2(0, 0.62, a)),
        (n.cardY = T2(0.15 + 0.035 * r - i, 1.05, a)),
        (n.cardZ = T2(0.02, 0.3, a)),
        (n.cardRoll =
          -Math.PI * 1.5 * a + 0.12 * Math.sin(Math.PI * 2 * w2(e, 0.12, z2))),
        (n.cardSy = 1 + 0.2 * Math.sin(Math.PI * w2(e, 0.25, B2))));
    } else if (e >= V2 && e < 0.73) {
      let t = E2(w2(e, V2, H2)),
        i = w2(e, U2, r);
      ((n.card = e < r ? 1 : 1 - D2(w2(e, r, 0.73))),
        (n.cardX = T2(-0.62, 0, t)),
        (n.cardZ = T2(0.22, 0.06, t)),
        (n.cardY = e < U2 ? T2(1, G2, t) : T2(G2, W2, i * i)),
        (n.cardRoll =
          0.32 * (1 - t) + 0.07 * Math.sin(t * Math.PI * 2) * (1 - i)),
        (n.cardSy = e < r ? 1 + 0.18 * i : 1 - 0.5 * w2(e, r, 0.73)));
    }
    if (e >= 0.44999999999999996 && e < 0.92) {
      let t = E2(w2(e, V2, H2)),
        r = D2(w2(e, 0.77, 0.9));
      n.cursor = Math.min(
        j2(w2(e, 0.44999999999999996, 0.53)),
        1 - D2(w2(e, 0.84, 0.92)),
      );
      let i = T2(-0.62, 0, t) - b2 / 2 + 0.018,
        a = T2(1, G2, t) + x2 / 2 - 0.02;
      ((n.cursorX = T2(i, 0.62, r)),
        (n.cursorY = T2(a + 0.03 * E2(w2(e, U2, 0.76)), 0.95, r)),
        (n.cursorZ = T2(T2(0.22, 0.06, t) + 0.012, 0.25, r)),
        (n.press = Math.sin(Math.PI * w2(e, H2, 0.66))));
    }
    ((n.reticle =
      j2(w2(e, 0.52, 0.62)) *
      (1 + 0.35 * Math.sin(Math.PI * w2(e, r, 0.7799999999999999))) *
      (1 - D2(w2(e, 0.74, 0.84)))),
      (n.grid = 1 - O2(w2(e, 0.28, 0.48))),
      (n.scene = O2(w2(e, 0.32, 0.52))),
      (n.patch = j2(w2(e, 0.34, 0.5))),
      (n.flowers = w2(e, 0.44, 0.62)),
      e >= r
        ? ((n.puff = (e - r) * t), (n.puffY = 0.06), (n.puffSize = 1))
        : e >= 0.12 &&
          ((n.puff = (e - R2 + 0.03) * t),
          (n.puffY = 0.15),
          (n.puffSize = 0.6)));
  }
  var q2 = [`MODEL`, `BAKE`, `TEXTURE`, `EXPORT`, `LIGHT`, `SHADER`];
  var J2 = {
    x0: 118,
    x1: 462,
    y0: 88,
    y1: 94,
  };
  var Y2 = {
    x0: 8,
    y0: 776,
    h: 240,
  };
  var X2 = Math.round((Y2.h * b2) / x2);
  var Z2 = 0.3;
  function Q2(e, t) {
    let n = Y2.x0 + (e / b2 + 0.5) * X2,
      r = Y2.y0 + (0.5 - t / x2) * Y2.h;
    return [n / 512, 1 - r / 1024];
  }
  var $2 = (e) => `700 ${e}px "IBM Plex Mono", ui-monospace, monospace`;
  var e4 = $2(52);
  var t4 = $2(46);
  var n4 = $2(40);
  var r4 = [e4, t4, n4];
  function i4(e) {
    for (let t = 0; t < p2; t++) {
      (e.save(),
        e.translate(0, t * 128),
        (e.fillStyle = inkPurple),
        e.fillRect(16, 18, 472, 96),
        (e.fillStyle = palette.yellow),
        e.fillRect(6, 8, 472, 96),
        (e.lineWidth = 5),
        (e.strokeStyle = inkPurple),
        e.strokeRect(6, 8, 472, 96),
        (e.fillStyle = inkPurple),
        e.fillRect(6, 8, 96, 96),
        (e.fillStyle = palette.yellow),
        (e.font = e4),
        (e.textAlign = `center`),
        (e.textBaseline = `alphabetic`),
        e.fillText(String(t + 1).padStart(2, `0`), 54, 76),
        (e.fillStyle = inkPurple),
        (e.textAlign = `left`),
        (e.font = t4),
        e.fillText(q2[t], 118, 70));
      for (let n = 0; n < p2; n++) {
        let r = 368 + n * 18;
        n <= t
          ? e.fillRect(r, 22, 12, 12)
          : ((e.lineWidth = 2.5), e.strokeRect(r + 1.25, 23.25, 9.5, 9.5));
      }
      ((e.lineWidth = 2.5),
        e.strokeRect(
          J2.x0 - 2,
          J2.y0 - 2,
          J2.x1 - J2.x0 + 4,
          J2.y1 - J2.y0 + 4,
        ),
        e.restore());
    }
  }
  function a4(e) {
    let { x0: t, y0: n, h: r } = Y2,
      i = X2,
      a = Z2 * i;
    (e.save(),
      e.translate(t, n),
      e.beginPath(),
      e.moveTo(0, 0),
      e.lineTo(i - a, 0),
      e.lineTo(i, a),
      e.lineTo(i, r),
      e.lineTo(0, r),
      e.closePath(),
      (e.fillStyle = paperWhite),
      e.fill(),
      e.beginPath(),
      e.moveTo(i - a, 0),
      e.lineTo(i - a, a),
      e.lineTo(i, a),
      e.closePath(),
      (e.fillStyle = palette.lilac),
      e.fill(),
      (e.lineWidth = 7),
      (e.lineJoin = `round`),
      (e.strokeStyle = inkPurple),
      e.stroke(),
      (e.lineWidth = 12),
      e.beginPath(),
      e.moveTo(0, 0),
      e.lineTo(i - a, 0),
      e.lineTo(i, a),
      e.lineTo(i, r),
      e.lineTo(0, r),
      e.closePath(),
      e.stroke());
    let o = i * 0.42,
      s = r * 0.43;
    ((e.fillStyle = palette.cream),
      (e.lineWidth = 5),
      e.beginPath(),
      e.roundRect(o - 13, s - 4, 26, 34, 8),
      e.fill(),
      e.stroke(),
      (e.fillStyle = palette.red),
      e.beginPath(),
      e.ellipse(o, s, 44, 36, 0, Math.PI, Math.PI * 2),
      e.closePath(),
      e.fill(),
      e.stroke(),
      (e.fillStyle = palette.cream));
    for (let [t, n, r] of [
      [-20, -12, 7],
      [8, -24, 6],
      [24, -9, 5],
    ])
      (e.beginPath(), e.arc(o + t, s + n, r, 0, Math.PI * 2), e.fill());
    ((e.fillStyle = palette.hotPink),
      e.fillRect(0, r * 0.69, i, r * 0.2),
      (e.lineWidth = 5),
      e.beginPath(),
      e.moveTo(0, r * 0.69),
      e.lineTo(i, r * 0.69),
      e.moveTo(0, r * 0.89),
      e.lineTo(i, r * 0.89),
      e.stroke(),
      (e.fillStyle = paperWhite),
      (e.font = n4),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      e.fillText(`.glb`, i / 2, r * 0.795),
      e.restore());
  }
  function o4(e) {
    (e.clearRect(0, 0, 512, 1024), i4(e), a4(e));
  }
  function s4() {
    try {
      return !document.fonts || r4.every((e) => document.fonts.check(e));
    } catch {
      return !1;
    }
  }
  function c4() {
    let e = scope.element(`canvas`);
    ((e.width = 512), (e.height = 1024));
    let t = e.getContext(`2d`),
      n = new CanvasTexture(e);
    return (
      (n.colorSpace = SRGBColorSpace),
      (n.anisotropy = 4),
      t &&
        (o4(t),
        s4() ||
          document.fonts?.ready?.then(() => {
            if (scope.signal.aborted) return;
            (o4(t), (n.needsUpdate = !0));
          })),
      n
    );
  }
  var l4 = 0;
  var u4 = 1;
  var d4 = 2;
  var f4 = 3;
  var p4 = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5];
  var m4 = 16;
  var h4 = p4.length * m4;
  var g4 = 16;
  var _4 = 36;
  var v4 = h4 * 2 + g4 + _4;
  var y4 = 1.2;
  var b4 = 0.22;
  var MushroomCap = class {
    top;
    mesh;
    u = {
      pop: uniform(new Vector3()),
      burst: uniform(-1),
      mush: uniform(new Vector4(1, 1, 1, 0)),
      select: uniform(0),
      spark: uniform(0),
      puff: uniform(new Vector4(-1, 0.15, 1, 0)),
      clock: uniform(0),
    };
    pa;
    nrm;
    ringRow = new Int32Array(p4.length);
    ringT = new Float32Array(p4.length);
    ringPrev = new Int32Array(p4.length).fill(-1);
    sinA = new Float32Array(m4);
    cosA = new Float32Array(m4);
    constructor(e, t, n, r) {
      this.top = n;
      for (let t = 0; t < p4.length; t++) {
        let n = 0;
        for (; n < e.length - 2 && e[n + 1] <= p4[t] + 1e-6;) n++;
        ((this.ringRow[t] = n),
          (this.ringT[t] = MathUtils.clamp(
            (p4[t] - e[n]) / Math.max(e[n + 1] - e[n], 1e-6),
            0,
            1,
          )),
          n > 0 && p4[t] - e[n - 1] < 0.01 && (this.ringPrev[t] = n - 1));
      }
      for (let e = 0; e < m4; e++) {
        let t = (e / m4) * Math.PI * 2;
        ((this.sinA[e] = Math.sin(t)), (this.cosA[e] = Math.cos(t)));
      }
      let i = new InstancedBufferGeometry();
      (i.setIndex([0, 1, 2, 2, 1, 3]),
        i.setAttribute(
          `position`,
          new BufferAttribute(
            new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]),
            3,
          ),
        ));
      let a = new Float32Array(v4 * 4),
        o = new Float32Array(v4 * 4),
        s = new Float32Array(v4 * 3),
        c = new Float32Array(v4 * 3),
        l = 11,
        u = () => ((l = (l * 16807) % 2147483647) - 1) / 2147483646,
        d = [
          palette.cyan,
          paperWhite,
          palette.yellow,
          palette.cyan,
          paperWhite,
        ].map((e) => new Color(e)),
        f = [palette.yellow, paperWhite, palette.pink, palette.cyan].map(
          (e) => new Color(e),
        ),
        p = [
          palette.yellow,
          palette.hotPink,
          palette.cyan,
          palette.lime,
          palette.purple,
          palette.orange,
          paperWhite,
        ].map((e) => new Color(e)),
        m = [0, 0, 0, 0];
      for (let e = 0; e < p4.length; e++) {
        let n = p4[e],
          r = n % 1 != 0,
          i = n === 2 || n === 3;
        this.ringPoint(t, e, m);
        for (let t = 0; t < m4; t++) {
          let l = e * m4 + t,
            f = r || t % 2 ? 2 : +!!i,
            p = (t / m4) * 0.85 + (e / p4.length) * 0.15;
          (a.set([0, 0, 0, p], l * 4), o.set([l4, f, u(), +(n >= 3)], l * 4));
          let h = h4 + l,
            g = m[0] * this.sinA[t],
            _ = m[0] * this.cosA[t];
          a.set([g, m[1], _, u()], h * 4);
          let v = new Vector3(m[2] * this.sinA[t], m[3], m[2] * this.cosA[t]);
          (v
            .add(
              new Vector3(u() - 0.5, u() - 0.2, u() - 0.5).multiplyScalar(1.3),
            )
            .normalize(),
            c.set([v.x, v.y, v.z], h * 3),
            o.set([u4, f, u(), 0], h * 4),
            d[l % d.length].toArray(s, h * 3));
        }
      }
      for (let e = 0; e < g4; e++) {
        let t = h4 * 2 + e;
        (a.set(
          [
            (e / g4) * Math.PI * 2 + u() * 0.3,
            0.06 + u() * 0.36,
            0.25 + u() * 0.12,
            u() * 6.28,
          ],
          t * 4,
        ),
          o.set([d4, 4 + u() * 3.5, 0.6 + u() * 0.8, 0], t * 4),
          f[e % f.length].toArray(s, t * 3),
          c.set([0, 0, 1], t * 3));
      }
      for (let e = 0; e < _4; e++) {
        let t = h4 * 2 + g4 + e,
          n = (e / _4) * Math.PI * 2 + u() * 0.25,
          r = new Vector3(
            Math.cos(n),
            0.35 + u() * 0.9,
            Math.sin(n),
          ).normalize();
        (c.set([r.x, r.y, r.z], t * 3),
          a.set([0, 0, 0, 0.9 + u() * 0.9], t * 4),
          o.set([f4, 2.4 + u() * 2.2, u(), 0], t * 4),
          p[e % p.length].toArray(s, t * 3));
      }
      ((this.pa = new InstancedBufferAttribute(a, 4).setUsage(
        DynamicDrawUsage,
      )),
        (this.nrm = new InstancedBufferAttribute(c, 3).setUsage(
          DynamicDrawUsage,
        )),
        i.setAttribute(`pa`, this.pa),
        i.setAttribute(`pb`, new InstancedBufferAttribute(o, 4)),
        i.setAttribute(`tint`, new InstancedBufferAttribute(s, 3)),
        i.setAttribute(`normal`, this.nrm),
        (i.instanceCount = v4),
        (i.boundingSphere = new Sphere(new Vector3(0, 0.2, 0), 2)),
        (this.mesh = new Mesh(i, this.material(r))),
        (this.mesh.name = `DemoParticles`),
        (this.mesh.frustumCulled = !1),
        (this.mesh.castShadow = this.mesh.receiveShadow = !1),
        (this.mesh.raycast = () => {}),
        (this.mesh.userData.noExport = !0));
    }
    ringPoint(e, t, n) {
      let r = this.ringRow[t] * 4,
        i = this.ringT[t];
      for (let t = 0; t < 4; t++)
        n[t] = e[r + t] + (e[r + 4 + t] - e[r + t]) * i;
      let a = this.ringPrev[t] * 4;
      a >= 0 && ((n[2] += e[a + 2]), (n[3] += e[a + 3]));
      let o = Math.hypot(n[2], n[3]) || 1;
      ((n[2] /= o), (n[3] /= o));
    }
    pt = [0, 0, 0, 0];
    setDots(e) {
      let t = this.pa.array,
        n = this.nrm.array,
        r = this.pt;
      for (let i = 0; i < p4.length; i++) {
        this.ringPoint(e, i, r);
        for (let e = 0; e < m4; e++) {
          let a = i * m4 + e;
          ((t[a * 4] = r[0] * this.sinA[e]),
            (t[a * 4 + 1] = r[1]),
            (t[a * 4 + 2] = r[0] * this.cosA[e]),
            (n[a * 3] = r[2] * this.sinA[e]),
            (n[a * 3 + 1] = r[3]),
            (n[a * 3 + 2] = r[2] * this.cosA[e]));
        }
      }
      ((this.pa.needsUpdate = !0), (this.nrm.needsUpdate = !0));
    }
    material(e) {
      let t = this.u,
        n = positionGeometry.xy,
        r = attribute(`pa`, `vec4`),
        i = attribute(`pb`, `vec4`),
        a = attribute(`tint`, `vec3`),
        o = attribute(`normal`, `vec3`),
        s = i.x,
        c = step(s, 0.5),
        l = step(0.5, s).mul(step(s, 1.5)),
        u = step(1.5, s).mul(step(s, 2.5)),
        d = step(2.5, s),
        f = t.mush,
        p = r.xyz.mul(f.xyz).add(vec3(0, f.w, 0)),
        m = t.burst.sub(float(1).sub(r.y.div(this.top).clamp(0, 1)).mul(b4)),
        h = i.y,
        g = vec3(step(h, 0.5), step(0.5, h).mul(step(h, 1.5)), step(1.5, h)),
        _ = dot(t.pop, g).mul(2.2).sub(r.w.mul(y4)).clamp(0, 1),
        v = float(1).sub(exp2(_.mul(-10)).mul(cos(_.mul(Math.PI * 3)))),
        y = sin(m.div(0.2).clamp(0, 1).mul(Math.PI)).mul(0.9).add(1),
        b = float(1).sub(smoothstep(0.1, 0.24, m)),
        x = smoothstep(0.02, 0.08, m),
        S = normalize(o.div(max(f.xyz, vec3(0.2)))),
        C = normalize(modelViewMatrix.mul(vec4(S, 0)).xyz),
        w = m.sub(0.04),
        T = w.clamp(0, 1),
        E = step(0, w).mul(float(1).sub(smoothstep(0.3, 0.65, w))),
        D = float(1)
          .sub(exp(T.mul(-4.5)))
          .div(4.5)
          .mul(i.z.mul(0.5).add(0.55)),
        ee = p.add(o.mul(D)).add(vec3(0, T.mul(T).mul(-0.3), 0)),
        te = e.dotSize
          .mul(0.27)
          .mul(E)
          .mul(
            sin(w.mul(32).add(i.z.mul(6)))
              .mul(0.3)
              .add(0.85),
          ),
        O = r.x.add(t.clock.mul(i.z).mul(0.35)),
        ne = vec3(
          sin(O).mul(r.z),
          r.y.add(sin(t.clock.mul(1.3).add(r.w)).mul(0.015)),
          cos(O).mul(r.z),
        ),
        re = pow(max(sin(t.clock.mul(i.z).mul(2.4).add(r.w)), 0), 3),
        ie = i.y.mul(t.spark).mul(re.mul(0.8).add(0.2)),
        ae = t.puff.x,
        oe = ae.clamp(0, 1),
        se = step(0, ae).mul(float(1).sub(smoothstep(0.22, 0.6, ae))),
        ce = float(1)
          .sub(exp(oe.mul(-5)))
          .div(5)
          .mul(r.w)
          .mul(t.puff.z),
        le = cos(t.puff.w),
        ue = sin(t.puff.w),
        de = vec3(
          o.x.mul(le).add(o.z.mul(ue)),
          o.y,
          o.z.mul(le).sub(o.x.mul(ue)),
        ),
        fe = vec3(0, t.puff.y, 0)
          .add(de.mul(ce))
          .add(vec3(0, oe.mul(oe).mul(-0.5).mul(t.puff.z), 0)),
        pe = i.y.mul(se).mul(t.puff.z.mul(0.4).add(0.6)),
        me = p.mul(c).add(ee.mul(l)).add(ne.mul(u)).add(fe.mul(d)),
        he = modelViewMatrix.mul(vec4(me, 1)),
        ge = dot(C, normalize(he.xyz.negate())),
        _e = e.dotSize
          .mul(0.5)
          .mul(v)
          .mul(y)
          .mul(b)
          .mul(smoothstep(0, 0.3, ge))
          .mul(c)
          .add(te.mul(l))
          .add(ie.mul(u))
          .add(pe.mul(d))
          .mul(uI),
        ve = he.z.negate().max(0.001),
        ye = cameraProjectionMatrix.element(1).y,
        be = _e
          .mul(2)
          .mul(ve)
          .div(ye.mul(screenSize.y))
          .mul(3)
          .add(0.003)
          .mul(c.add(l)),
        xe = he.xyz.mul(float(1).sub(be.div(length(he.xyz).max(0.001)))),
        Se = cameraProjectionMatrix.mul(vec4(xe, 1)),
        Ce = _e.add(1),
        we = n.mul(Ce).mul(2).div(screenSize).mul(Se.w).mul(step(0.05, _e)),
        Te = new MeshBasicNodeMaterial({
          transparent: !0,
          depthWrite: !1,
        });
      ((Te.name = `DemoParticles`),
        (Te.vertexNode = vec4(Se.xy.add(we), Se.zw)));
      let Ee = mix(DG(e.wire), DG(e.select), i.w.mul(t.select)),
        De = DG(e.paper)
          .mul(c.add(u))
          .add(a.mul(l.add(d))),
        Oe = Ee.mul(c)
          .add(a.mul(l.add(u)))
          .add(DG(e.ink).mul(d)),
        ke = float(0.52).mul(c).add(l.mul(2)).add(u.mul(0.34)).add(d.mul(0.6)),
        Ae = x.mul(c).add(u).add(step(0.62, i.z).mul(d)),
        je = x.mul(0.7).mul(c).add(l.mul(0.9)).add(u.mul(1.2)),
        Me = varying(n.mul(Ce).div(_e.max(0.001)), `vSpriteQ`),
        Ne = varying(De, `vSpriteA`),
        Pe = varying(vec4(Oe, Ae), `vSpriteB`),
        Fe = varying(vec2(ke, je), `vSpriteC`),
        Ie = length(Me),
        Le = kG(Ie.sub(1)),
        Re = mix(Pe.rgb, Ne, kG(Ie.sub(Fe.x))),
        ze = abs(Me.x),
        Be = abs(Me.y),
        Ve = float(1).sub(ze).clamp(0, 1),
        He = float(1).sub(Be).clamp(0, 1),
        Ue = min(
          min(Be.sub(Ve.mul(Ve).mul(0.24)), ze.sub(He.mul(He).mul(0.24))),
          Ie.sub(0.3),
        ),
        We = float(1).sub(Ie).clamp(0, 1),
        Ge = max(kG(Ue), We.mul(We).mul(0.35)),
        Ke = mix(Pe.rgb, Ne, kG(Ie.sub(0.36))),
        qe = mix(Le, Ge, Pe.a),
        Je = mix(Re, Ke, Pe.a);
      return (
        (Te.colorNode = vec4(Je, qe)),
        Object.assign(Te, {
          emissiveNode: Je.mul(Fe.y).mul(qe),
        }),
        Te
      );
    }
  };
  var S4 = new Vector3(-0.5, 0.62, 0.6).normalize();
  var C4 = 0.5;
  function w4(e, t) {
    let n = t.mul(0.52).sub(0.04);
    return {
      mask: kG(e.sub(n)),
      edge: AG(e.sub(n), 0.006).mul(step(0.001, t)).mul(step(t, 0.999)),
    };
  }
  function T4(e, t, n, r = {}) {
    let i = e.look;
    return Fn(() => {
      let a = diffuseColor.rgb,
        o = normalView,
        s = clamp(dot(o, positionViewDirection), 0, 1),
        c = mix(
          a
            .mul(s.mul(0.4).add(0.55).add(o.y.mul(0.08)))
            .mul(e.dim)
            .add(emissive),
          t.rgb,
          e.lit,
        ).toVar(),
        l = s.oneMinus(),
        u = smoothstep(0.5, 0.78, o.y).oneMinus(),
        d = smoothstep(0.5, 0.54, l)
          .mul(
            smoothstep(-0.15, -0.05, dot(o, normalize(vec3(0.85, 0.3, 0.1)))),
          )
          .mul(u),
        f = smoothstep(0.3, 0.36, o.y);
      (r.matte || c.addAssign(DG(i.rim).mul(d.mul(i.rimStrength).mul(e.rim))),
        c.addAssign(a.mul(DG(i.warm)).mul(f.mul(i.warmStrength).mul(e.warm))),
        r.overlay?.(c, o));
      let p = dot(o, vec3(S4.x, S4.y, S4.z)),
        m = kG(p.sub(0.02)),
        h = mix(a, a.mul(DG(i.heroShade)), m).toVar();
      h.addAssign(a.mul(DG(i.warm)).mul(f.mul(i.warmStrength).mul(0.8)));
      let g = screenCoordinate.xy.div(uI).add(e.clock.mul(vec2(6, -3.5))),
        _ = Math.cos(C4),
        v = Math.sin(C4),
        y = vec2(g.x.mul(_).sub(g.y.mul(v)), g.x.mul(v).add(g.y.mul(_))).div(
          i.heroDot,
        ),
        b = fract(y).sub(0.5),
        x = smoothstep(-0.55, 0.02, p).oneMinus(),
        S = sin(e.clock.mul(2.6).sub(y.x.mul(0.45)).add(y.y.mul(0.3)))
          .mul(0.06)
          .add(1),
        C = m.mul(x.mul(0.2).add(0.18)).mul(S),
        w = clamp(C.sub(length(b)).mul(i.heroDot.mul(uI)).add(0.5), 0, 1).mul(
          step(0.02, C),
        );
      if ((h.assign(mix(h, DG(i.heroInk), w.mul(0.82))), !r.matte)) {
        let t = sin(e.clock.mul(4.2)).mul(0.3).add(1);
        h.addAssign(DG(i.rim).mul(d.mul(i.rimStrength).mul(1.5).mul(t)));
        let n = smoothstep(0.55, 0.6, l)
          .mul(
            smoothstep(-0.15, -0.05, dot(o, normalize(vec3(-0.85, 0.25, 0.1)))),
          )
          .mul(u);
        h.addAssign(DG(i.heroRim).mul(n.mul(0.45)));
        let r = smoothstep(
          0.976,
          0.984,
          dot(o, normalize(positionViewDirection.add(vec3(S4.x, S4.y, S4.z)))),
        ).mul(m.oneMinus());
        h.assign(mix(h, DG(i.paper), r));
      }
      r.contour &&
        h.assign(
          mix(
            h,
            DG(i.ink),
            smoothstep(0.13, 0.24, s).oneMinus().mul(r.contour),
          ),
        );
      let T = t.rgb.toVar();
      if (!r.matte) {
        let e = smoothstep(0.38, 0.46, l)
          .mul(smoothstep(-0.35, -0.1, dot(o, normalize(vec3(0.85, 0.3, 0.1)))))
          .mul(u);
        T.addAssign(DG(i.rim).mul(e.mul(0.42)));
        let t = smoothstep(0.45, 0.95, l)
          .mul(smoothstep(-0.2, 0.1, dot(o, normalize(vec3(-0.85, 0.25, 0.1)))))
          .mul(u);
        T.addAssign(DG(i.heroRim).mul(t.mul(0.22)));
        let n = normalize(positionViewDirection.add(vec3(S4.x, S4.y, S4.z)));
        T.assign(
          mix(T, DG(i.paper), smoothstep(0.982, 0.988, dot(o, n)).mul(0.85)),
        );
      }
      return (
        r.contour &&
          T.assign(
            mix(
              T,
              DG(i.ink),
              smoothstep(0.1, 0.18, s)
                .oneMinus()
                .mul(r.contour * 0.7),
            ),
          ),
        h.assign(mix(h, T, i.creature)),
        c.assign(mix(c, h.add(emissive), n)),
        r.unlit && c.assign(mix(c, a.add(emissive), r.unlit)),
        vec4(c, output.a)
      );
    })();
  }
  var E4 = 0;
  var D4 = 1;
  var O4 = 2;
  var k4 = 3;
  var A4 = 4;
  var j4 = 5;
  var M4 = 6;
  var N4 = 7;
  var P4 = 0.285;
  var F4 = (e, t) => new Vector3(Math.sin(e) * t, y2, Math.cos(e) * t);
  var I4 = F4(2.15, 0.235);
  var L4 = F4(5.25, 0.228);
  var R4 = F4(4.35, 0.238);
  var z4 = (e) => new Color(e);
  function B4(e, t, n, r = [0, 0, 0], i) {
    let a = e.index ? e.toNonIndexed() : e;
    (a !== e && e.dispose(),
      a.getAttribute(`normal`) || a.computeVertexNormals());
    let o = a.getAttribute(`position`),
      s = a.getAttribute(`normal`),
      c = o.count,
      l = new Float32Array(c * 3),
      u = new Float32Array(c * 2),
      d = new Float32Array(c * 3),
      f = new Vector3(),
      p = new Vector3();
    for (let e = 0; e < c; e++)
      (f.fromBufferAttribute(o, e),
        p.fromBufferAttribute(s, e),
        (typeof n == `function` ? n(f, p) : n).toArray(l, e * 3),
        i && u.set(i(f), e * 2),
        d.set(r, e * 3));
    for (let e of Object.keys(a.attributes))
      e !== `position` && e !== `normal` && a.deleteAttribute(e);
    return (
      a.setAttribute(`color`, new BufferAttribute(l, 3)),
      a.setAttribute(`uv`, new BufferAttribute(u, 2)),
      a.setAttribute(`pk`, new BufferAttribute(d, 3)),
      {
        geo: a,
        part: t,
      }
    );
  }
  function V4(e, t = 0) {
    let n = e.map(([e, t]) => new Vector2(e, t)),
      r = ShapeUtils.triangulateShape(n, []),
      i = [],
      a = !ShapeUtils.isClockWise(n);
    for (let e of r) {
      let r = a ? e : [e[0], e[2], e[1]];
      for (let e of r) i.push(n[e].x, n[e].y, t);
    }
    let o = new BufferGeometry();
    return (
      o.setAttribute(`position`, new Float32BufferAttribute(i, 3)),
      o.setAttribute(
        `normal`,
        new Float32BufferAttribute(
          i.map((e, t) => +(t % 3 == 2)),
          3,
        ),
      ),
      o
    );
  }
  function H4(e, t) {
    let n = e.length,
      r =
        e.reduce(
          (t, [r, i], a) => t + r * e[(a + 1) % n][1] - e[(a + 1) % n][0] * i,
          0,
        ) > 0
          ? 1
          : -1;
    return e.map(([i, a], o) => {
      let [s, c] = e[(o + n - 1) % n],
        [l, u] = e[(o + 1) % n],
        d = new Vector2(i - s, a - c).normalize(),
        f = new Vector2(l - i, u - a).normalize(),
        p = new Vector2(d.y, -d.x).multiplyScalar(r),
        m = new Vector2(f.y, -f.x).multiplyScalar(r),
        h = p.clone().add(m),
        g = Math.min(2.6, 1 / Math.max(0.2, (1 + p.dot(m)) / 2));
      return (
        h.normalize().multiplyScalar(t * Math.sqrt(g)),
        [i + h.x, a + h.y]
      );
    });
  }
  var U4 = [
    [0, 0],
    [0, -0.078],
    [0.0185, -0.062],
    [0.031, -0.09],
    [0.0435, -0.0845],
    [0.031, -0.0565],
    [0.0545, -0.0565],
  ].map(([e, t]) => [e * 1.05, t * 1.05]);
  function W4() {
    let e = [],
      t = (() => {
        let e = 5;
        return () => ((e = (e * 16807) % 2147483647) - 1) / 2147483646;
      })(),
      n = z4(palette.lime),
      r = z4(palette.green),
      i = z4(`#7b4466`),
      a = new CylinderGeometry(P4, 0.297, y2, 40, 1).translate(0, y2 / 2, 0),
      o = new Color();
    e.push(
      B4(a, E4, (e, t) =>
        t.y > 0.5
          ? o.copy(n).lerp(r, Math.hypot(e.x, e.z) / P4)
          : t.y < -0.5
            ? i
            : o.copy(i).lerp(r, e.y > 0.035 * 0.8 ? 0.6 : 0),
      ),
    );
    for (let i = 0; i < 8; i++) {
      let a = (i / 8) * Math.PI * 2 + 0.35,
        o = F4(a, 0.255 - (i % 2) * 0.03);
      for (let i = 0; i < 3; i++) {
        let s = new ConeGeometry(0.0075, 0.042 + t() * 0.02, 4, 1).translate(
          0,
          0.021,
          0,
        );
        (s.rotateZ((i - 1) * 0.42 + (t() - 0.5) * 0.2).rotateY(a + t()),
          s.translate(o.x + (i - 1) * 0.006, y2 - 0.004, o.z),
          e.push(B4(s, E4, i === 1 ? n : r)));
      }
    }
    let s = (t, n, r, i) => {
      let a = F4(t, n),
        o = new IcosahedronGeometry(0.02 * r, 0)
          .scale(1.2, 0.62, 1)
          .rotateY(t)
          .translate(a.x, y2 + 0.004 * r, a.z);
      e.push(B4(o, E4, z4(i)));
    };
    (s(0.62, 0.232, 1, `#c9c3e6`),
      s(0.98, 0.258, 0.7, `#9d94c9`),
      s(3.7, 0.245, 0.85, `#c9c3e6`));
    let c = (t, i, a, o, s) => {
      let c = new CylinderGeometry(0.0035, 0.0045, s, 5, 1, !0).translate(
        t.x,
        t.y + s / 2,
        t.z,
      );
      e.push(B4(c, i, r));
      let l = new SphereGeometry(0.012, 6, 3)
        .scale(1, 0.25, 0.5)
        .rotateZ(0.5)
        .translate(t.x + 0.01, t.y + s * 0.35, t.z);
      e.push(B4(l, i, n));
      let u = t.y + s;
      for (let n = 0; n < 5; n++) {
        let r = (n / 5) * Math.PI * 2,
          o = new IcosahedronGeometry(0.0118, 0)
            .scale(1, 0.55, 1)
            .translate(
              t.x + Math.cos(r) * 0.0145,
              u,
              t.z + Math.sin(r) * 0.0145,
            );
        e.push(B4(o, i, z4(a)));
      }
      e.push(
        B4(
          new IcosahedronGeometry(0.0095, 1).translate(t.x, u + 0.004, t.z),
          i,
          z4(o),
        ),
      );
    };
    (c(I4, D4, palette.hotPink, palette.yellow, 0.075),
      c(L4, O4, palette.yellow, palette.orange, 0.062),
      e.push(
        B4(
          new CylinderGeometry(0.0095, 0.012, 0.032, 8, 1, !0).translate(
            R4.x,
            R4.y + 0.016,
            R4.z,
          ),
          k4,
          z4(palette.cream),
        ),
      ),
      e.push(
        B4(
          new SphereGeometry(0.026, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2)
            .scale(1, 0.8, 1)
            .translate(R4.x, R4.y + 0.03, R4.z),
          k4,
          z4(palette.red),
        ),
      ),
      e.push(
        B4(
          new CircleGeometry(0.026, 12)
            .rotateX(Math.PI / 2)
            .translate(R4.x, R4.y + 0.03, R4.z),
          k4,
          z4(`#f3c9a2`),
        ),
      ));
    let l = Z2 * b2,
      u = b2 / 2,
      d = x2 / 2,
      f = [
        [-u, -d],
        [u, -d],
        [u, d - l],
        [u - l, d],
        [-u, d],
      ];
    (e.push(
      B4(
        V4(
          f.map(([e, t]) => [e + 0.009, t - 0.01]),
          -0.004,
        ),
        A4,
        z4(inkPurple),
        [0, 1, 0],
      ),
    ),
      e.push(B4(V4(f), A4, z4(paperWhite), [1, 1, 0], (e) => Q2(e.x, e.y))),
      e.push(B4(V4(H4(U4, 0.0065), -0.002), j4, z4(inkPurple), [0, 1, 0])),
      e.push(B4(V4(U4), j4, z4(paperWhite), [0, 1, 0.15])));
    let p = y2 + 0.003;
    e.push(
      B4(
        new RingGeometry(0.1, 0.11599999999999999, 40, 1)
          .rotateX(-Math.PI / 2)
          .translate(0, p, 0),
        M4,
        z4(palette.cyan),
        [0, 1, 0.9],
      ),
    );
    for (let t = 0; t < 4; t++) {
      let n = new PlaneGeometry(0.012, 0.034)
        .rotateX(-Math.PI / 2)
        .translate(0, p, 0.14)
        .rotateY((t * Math.PI) / 2);
      e.push(B4(n, M4, z4(palette.cyan), [0, 1, 0.9]));
    }
    (e.push(
      B4(
        new CircleGeometry(0.012, 12).rotateX(-Math.PI / 2).translate(0, p, 0),
        M4,
        z4(palette.hotPink),
        [0, 1, 0.9],
      ),
    ),
      e.sort((e, t) => e.part - t.part));
    let m = [];
    for (let t of e)
      for (let e = 0; e < t.geo.getAttribute(`position`).count; e++)
        m.push(t.part);
    let h = mergeGeometries(e.map((e) => e.geo));
    return (
      e.forEach((e) => e.geo.dispose()),
      {
        merged: h,
        ids: m,
      }
    );
  }
  var DemoProps = class {
    mesh;
    rest;
    restN;
    start = new Int32Array(N4);
    end = new Int32Array(N4);
    M = Array.from(
      {
        length: N4,
      },
      () => new Matrix4(),
    );
    built = Array.from(
      {
        length: N4,
      },
      () => new Float32Array(16).fill(NaN),
    );
    builtCollapsed = new Uint8Array(N4);
    pending = new Uint8Array(N4);
    collapsed = new Uint8Array(N4);
    N = new Matrix3();
    m = new Matrix4();
    yawM = new Matrix4();
    q = new Quaternion();
    p3 = new Vector3();
    s3 = new Vector3();
    e = new Euler();
    constructor(e, t) {
      let { merged: n, ids: r } = W4(),
        i = n.getAttribute(`position`),
        a = n.getAttribute(`normal`);
      (i.setUsage(DynamicDrawUsage),
        a.setUsage(DynamicDrawUsage),
        (this.rest = Float32Array.from(i.array)),
        (this.restN = Float32Array.from(a.array)),
        this.start.fill(-1),
        r.forEach((e, t) => {
          (this.start[e] < 0 && (this.start[e] = t), (this.end[e] = t + 1));
        }),
        (n.boundingSphere = new Sphere(new Vector3(0, 0.3, 0), 1.5)),
        (this.mesh = new Mesh(n, this.material(e, t))),
        (this.mesh.name = `DemoProps`),
        (this.mesh.frustumCulled = !1),
        (this.mesh.castShadow = this.mesh.receiveShadow = !1),
        (this.mesh.userData.noExport = !0),
        (this.mesh.visible = !1));
    }
    material(e, t) {
      let n = attribute(`pk`, `vec3`),
        r = mix(attribute(`color`, `vec3`), texture(e, uv()).rgb, n.x),
        i = w4(positionGeometry.y, t.hero),
        a = createToonMaterial(
          {
            color: 16777215,
          },
          {
            wear: !1,
          },
        );
      return (
        (a.name = `DemoProps`),
        (a.colorNode = vec4(r, 1)),
        Object.assign(a, {
          emissiveNode: r
            .mul(n.z.mul(0.6))
            .add(DG(t.look.rim).mul(i.edge.mul(1.4))),
        }),
        (a.outputNode = T4(t, a.outputNode, i.mask, {
          unlit: n.y,
          contour: 0,
          matte: !0,
        })),
        a
      );
    }
    pose(e, t, n) {
      if (!(
        e.patch > 0.001 ||
        e.card > 0.001 ||
        e.cursor > 0.001 ||
        e.reticle > 0.001
      ))
        return !1;
      let r = this.M,
        i = this.q,
        a = this.collapsed,
        o = q4(e.patch);
      (r[E4].makeScale(o, o, o),
        (a[E4] = +(o <= K4)),
        this.popAt(D4, I4, e.flowers / 0.65),
        this.popAt(O4, L4, (e.flowers - 0.2) / 0.65),
        this.popAt(k4, R4, (e.flowers - 0.35) / 0.65),
        this.yawM.makeRotationY(-t));
      let s = q4(e.card);
      (i.setFromEuler(this.e.set(0, 0, e.cardRoll)),
        r[A4].compose(
          this.p3.set(e.cardX, e.cardY, e.cardZ),
          i,
          this.s3.set(s * (1 + (1 - e.cardSy) * 0.5), s * e.cardSy, s),
        ).premultiply(this.yawM),
        (a[A4] = +(s <= K4)));
      let c = q4(e.cursor);
      (i.setFromEuler(this.e.set(0, 0, 0.12)),
        r[j4]
          .compose(
            this.p3.set(e.cursorX, e.cursorY, e.cursorZ),
            i,
            this.s3.set(c * (1 + 0.1 * e.press), c * (1 - 0.2 * e.press), c),
          )
          .premultiply(this.yawM),
        (a[j4] = +(c <= K4)));
      let l = q4(e.reticle);
      (i.setFromEuler(this.e.set(0, n * 1.4, 0)),
        r[M4].compose(
          this.p3.set(0, 0, 0),
          i,
          this.s3.set(l, 1, l),
        ).premultiply(r[E4]),
        (a[M4] = l <= K4 || a[E4] ? 1 : 0));
      let u = this.mesh.geometry,
        d = u.getAttribute(`position`),
        f = u.getAttribute(`normal`),
        p = d.array,
        m = f.array;
      d.updateRanges.length === 0 &&
        f.updateRanges.length === 0 &&
        this.pending.fill(0);
      let h = !1;
      for (let e = 0; e < N4; e++) {
        let t = r[e].elements,
          n = this.built[e];
        if (a[e]) {
          if (this.builtCollapsed[e]) continue;
          ((this.builtCollapsed[e] = 1), n.fill(NaN));
          for (let n = this.start[e] * 3, r = this.end[e] * 3; n < r; n += 3)
            ((p[n] = t[12]), (p[n + 1] = t[13]), (p[n + 2] = t[14]));
          ((this.pending[e] = 1), (h = !0));
          continue;
        }
        let i = !0;
        for (let e = 0; e < 16; e++) n[e] !== t[e] && (i = !1);
        if (i) continue;
        (n.set(t),
          (this.builtCollapsed[e] = 0),
          (this.pending[e] = 1),
          (h = !0));
        let o = this.N.getNormalMatrix(r[e]).elements;
        for (let n = this.start[e], r = this.end[e]; n < r; n++) {
          let e = n * 3,
            r = this.rest[e],
            i = this.rest[e + 1],
            a = this.rest[e + 2];
          ((p[e] = t[0] * r + t[4] * i + t[8] * a + t[12]),
            (p[e + 1] = t[1] * r + t[5] * i + t[9] * a + t[13]),
            (p[e + 2] = t[2] * r + t[6] * i + t[10] * a + t[14]));
          let s = this.restN[e],
            c = this.restN[e + 1],
            l = this.restN[e + 2],
            u = o[0] * s + o[3] * c + o[6] * l,
            d = o[1] * s + o[4] * c + o[7] * l,
            f = o[2] * s + o[5] * c + o[8] * l,
            h = Math.hypot(u, d, f) || 1;
          ((m[e] = u / h), (m[e + 1] = d / h), (m[e + 2] = f / h));
        }
      }
      if (h) {
        (d.clearUpdateRanges(), f.clearUpdateRanges());
        for (let e = 0; e < N4; e++) {
          if (!this.pending[e]) continue;
          let t = e;
          for (; t + 1 < N4 && this.pending[t + 1];) t++;
          let n = this.start[e] * 3,
            r = this.end[t] * 3 - n;
          (d.addUpdateRange(n, r), f.addUpdateRange(n, r), (e = t));
        }
        ((d.needsUpdate = !0), (f.needsUpdate = !0));
      }
      return !0;
    }
    popAt(e, t, n) {
      let r = q4(Y4(J4(n))),
        i = this.M[e];
      (i
        .makeTranslation(t.x, t.y, t.z)
        .multiply(this.m.makeScale(r, r, r))
        .multiply(this.m.makeTranslation(-t.x, -t.y, -t.z)),
        i.premultiply(this.M[E4]),
        (this.collapsed[e] = r <= K4 || this.collapsed[E4] ? 1 : 0));
    }
  };
  var K4 = 0.001;
  var q4 = (e) => Math.max(K4, e);
  var J4 = (e) => (e < 0 ? 0 : e > 1 ? 1 : e);
  var Y4 = (e) =>
    e <= 0 ? 0 : e >= 1 ? 1 : 1 - 2 ** (-10 * e) * Math.cos(e * Math.PI * 3);
  var X4 = 40;
  var Z4 = [3, 8, 5, 4, 10];
  var Q4 = Z4.reduce((e, t) => e + t + 1, 0);
  var $4 = 0.325;
  var e3 = 8;
  var t3 = [
    {
      L: [
        [0, 0],
        [0.12, 0],
        [0.12, 0.1],
        [0.12, 0.14],
        [0.12, 0.2],
        [0, 0.2],
      ],
      bulge: [0, 0, 0],
      dome: 0,
      smooth: !1,
    },
    {
      L: [
        [0, 0],
        [0.1, 0],
        [0.1, 0.15],
        [0.2, 0.15],
        [0.2, 0.24],
        [0, 0.24],
      ],
      bulge: [0, 0, 0],
      dome: 0,
      smooth: !1,
    },
    {
      L: [
        [0, 0],
        [0.095, 0],
        [0.075, 0.15],
        [0.2, 0.13],
        [0.205, 0.165],
        [0, 0.3],
      ],
      bulge: [0.006, 0, 0.008],
      dome: 0.55,
      smooth: !0,
    },
    {
      L: [
        [0, 0],
        [0.088, 0],
        [0.07, 0.15],
        [0.198, 0.128],
        [0.2, 0.158],
        [0, $4],
      ],
      bulge: [0.016, 0.012, 0.016],
      dome: 1,
      smooth: !0,
    },
  ];
  function n3(e, t, n, r) {
    let [i, a] = [e.L[t], e.L[t + 1]],
      o = i[0] + (a[0] - i[0]) * n,
      s = i[1] + (a[1] - i[1]) * n,
      c = Math.sin(Math.PI * n);
    if (t === 1) o += e.bulge[0] * c;
    else if (t === 2) s += e.bulge[1] * c;
    else if (t === 3) o += e.bulge[2] * c;
    else if (t === 4) {
      let t = (n * Math.PI) / 2;
      ((o += (i[0] * Math.cos(t) - o) * e.dome),
        (s += (i[1] + (a[1] - i[1]) * Math.sin(t) - s) * e.dome));
    }
    ((r[0] = o), (r[1] = s));
  }
  var r3 = (e, t, n) => {
    let r = Math.min(1, Math.max(0, (n - e) / (t - e)));
    return r * r * (3 - 2 * r);
  };
  function i3(e, t) {
    return e === 0
      ? 0.5
      : e === 1
        ? Math.min(0.5 + 0.5 * r3(0, 0.35, t), 1 - 0.64 * r3(0.3, 1, t))
        : e === 2
          ? 0.34 + 0.44 * t
          : e === 3
            ? 0.74 + 0.26 * r3(0, 0.8, t)
            : 1 - 0.1 * (1 - r3(0, 0.25, t));
  }
  function a3() {
    let e = new Int32Array(Q4),
      t = new Float32Array(Q4),
      n = new Float32Array(Q4),
      r = 0;
    Z4.forEach((i, a) => {
      for (let o = 0; o <= i; o++, r++)
        ((e[r] = a),
          (t[r] = a + Math.min(o / i, 0.9995)),
          (n[r] = i3(a, o / i)));
    });
    let i = [0, 0];
    return {
      keys: t3.map((n) => {
        let r = new Float32Array(Q4 * 4);
        for (let a = 0; a < Q4; a++)
          (n3(n, e[a], t[a] - e[a], i),
            (r[a * 4] = i[0]),
            (r[a * 4 + 1] = i[1]));
        let a = (e, t) =>
          Math.abs(r[e * 4] - r[t * 4]) +
            Math.abs(r[e * 4 + 1] - r[t * 4 + 1]) <
          1e-6;
        for (let t = 0; t < Q4; t++) {
          let i = t,
            o = t;
          for (let r = t - 1; r >= 0 && (n.smooth || e[r] === e[t]); r--)
            if (!a(r, t)) {
              i = r;
              break;
            }
          for (let r = t + 1; r < Q4 && (n.smooth || e[r] === e[t]); r++)
            if (!a(r, t)) {
              o = r;
              break;
            }
          let s = r[o * 4] - r[i * 4],
            c = r[o * 4 + 1] - r[i * 4 + 1],
            l = Math.hypot(s, c) || 1;
          ((r[t * 4 + 2] = c / l), (r[t * 4 + 3] = -s / l));
        }
        return r;
      }),
      v: t,
      ao: n,
    };
  }
  return {
    f2,
    p2,
    m2,
    y2,
    DemoState,
    N2,
    F2,
    I2,
    J2,
    c4,
    MushroomCap,
    w4,
    T4,
    DemoProps,
    X4,
    Q4,
    $4,
    e3,
    a3,
  };
}
