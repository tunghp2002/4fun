// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicNodeMaterial,
  Quaternion,
  Shape,
  ShapeGeometry,
  Sphere,
  Sprite,
  Vector2,
  Vector3,
} from "three/webgpu";
import {
  clamp,
  color,
  dot,
  inverseSqrt,
  max,
  mix,
  mrt,
  normalLocal,
  positionLocal,
  vec3,
  vec4,
} from "three/tsl";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  mergeGeometries,
  toCreasedNormals,
} from "three/addons/utils/BufferGeometryUtils.js";
export function createPhoneModule(
  scope,
  {
    paletteModule,
    renderingModule,
    birdsModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
    trafficLightsModule,
    partyModule,
  },
) {
  const {
    paperWhite,
    charcoal,
    amber,
    shadowPurple,
    paleBlue,
    inkPurple,
    palette,
    LF,
  } = paletteModule;
  const { createToonMaterial } = renderingModule;
  const { VR, HR, $R, uz, vz, Dz, Iz, Uz, cB, xB } = birdsModule;
  const { WB } = dialogueModule;
  const { PixelGrid, YB, aV } = ledPixelsModule;
  const {
    Z,
    mH,
    createPart,
    $,
    xH,
    SH,
    CH,
    TH,
    EH,
    DH,
    AH,
    LH,
    RH,
    bakeStaticGeometry,
  } = stickersModule;
  const { XH, ZH } = signArtModule;
  const { nG } = trafficLightsModule;
  const { $K, Hq, Yq } = partyModule;
  var Xq = {
    w: 0.8,
    h: 1.1,
    d: 0.42,
    r: 0.05,
  };
  var Zq = {
    z: 0.11,
    y: 0.085,
  };
  var Qq = {
    w: 0.68,
    h: 0.66,
    y: 0.655,
    depth: 0.02,
  };
  var $q = {
    w: Qq.w - 0.03,
    h: Qq.h - 0.03,
  };
  var eJ = {
    x: -0.085,
    y: 0.2,
    w: 0.4,
    h: 0.105,
    cols: 44,
    rows: 11,
  };
  var tJ = {
    x: 0.185,
    y: 0.215,
    r: 0.04,
  };
  var nJ = {
    x: -0.125,
    y: -0.075,
    w: 0.24,
    h: 0.12,
  };
  var rJ = {
    x0: -0.275,
    x1: 0.105,
    y0: 0.036,
    y1: 0.08,
    slots: 5,
  };
  var iJ = {
    x: [0.13, 0.205, 0.28],
    y: [0.055, -0.02, -0.095, -0.17],
    r: 0.029,
    socket: 0.035,
  };
  var aJ = {
    x: 0.19,
    y: -0.262,
    w: 0.2,
    h: 0.06,
  };
  var oJ = {
    x: -0.13,
    y: 0.284,
    w: 0.2,
    h: 0.024,
    n: 8,
  };
  var sJ = {
    y: 0.165,
    w: 0.4,
    h: 0.18,
  };
  var cJ = {
    len: 0.36,
    cup: 0.074,
    grip: 0.042,
    cord: -0.23,
  };
  var lJ = {
    turns: 18,
    seg: 8,
    radial: 5,
    coil: 0.022,
    wire: 0.0066,
    at: Z(-Xq.w / 2 - 0.006, 0.3, 0.13),
  };
  var uJ = {
    w: 1.2,
    t: 0.08,
    back: 0.065,
    foot: -1.17,
    bend: 0.17,
    off: 0.25,
    hang: 0.08,
  };
  var dJ = {
    y: 0.83,
    t: 0.1,
    eave: 0.03,
    back: 0.25,
    front: 0.9,
  };
  var fJ = {
    z: 0.12,
    y: 0.075,
    under: 0.05,
    lip: 0.04,
    lipT: 0.1,
    end: 0.03,
  };
  var pJ = `#b48fff`;
  var mJ = 0.5;
  var hJ = Z(0.08, 0.52, 0.16);
  var gJ = Z(-0.46, 0.36, 0.16);
  var _J = [
    [-0.11, 0.29],
    [0.81, 0.96],
  ];
  var vJ = 1.2;
  var yJ = [-0.63, 0.49];
  var bJ = {
    r: 0.022,
    len: 1,
    z: 0.68,
    day: `#dde2dc`,
    glow: `#ffe6b0`,
    falloff: 5,
    panel: 0.24,
    phone: 0.32,
  };
  var xJ = {
    rings: [0, 1.25],
    burst: [0, 0.47, 0.56, 1.03],
    panic: 0.06,
    grab: 2.55,
    hello: 3.05,
    ask: 3.75,
    reply: 4.8,
    ramble: 5.45,
    tune: 6.95,
    cross: 7.6,
    slam: 8.7,
    huh: 9.2,
    hangup: 10.15,
    shrug: 11,
    end: 11.9,
  };
  var SJ = 0.42;
  var CJ = 0.5;
  var wJ = [
    xJ.ask,
    xJ.ask + 0.75,
    xJ.ramble,
    xJ.ramble + 1.35,
    xJ.cross,
    xJ.cross + 0.95,
  ];
  var TJ = 0.95;
  var EJ = {
    go: 0.32,
    out: [
      [0, 0, 0],
      [0.25, 0.22, 0.12],
      [0.9, 0.6, 0.1],
      [1.9, 1.6, -0.8],
      [3.3, 3.8, -3.1],
    ],
    outS: 2.2,
    wait: 0.7,
    back: [
      [3, 3.5, -2.3],
      [1.5, 1.7, -0.5],
      [0.5, 0.55, 0.15],
      [0.12, 0.16, 0.06],
      [0, 0, 0],
    ],
    backS: 1.6,
  };
  var DJ = {
    go: 0.62,
    out: [
      [0, 0, 0],
      [-0.25, 0.22, 0.14],
      [-0.85, 0.62, 0.3],
      [-1.6, 1.9, 0],
      [-2.4, 4.2, -1.4],
    ],
    outS: 2.3,
    wait: 1.6,
    back: [
      [-2.6, 3.6, 0.9],
      [-1.4, 1.8, 0.6],
      [-0.5, 0.6, 0.25],
      [-0.12, 0.16, 0.08],
      [0, 0, 0],
    ],
    backS: 1.8,
  };
  var OJ = 4.5;
  var kJ = [55, 70];
  var AJ = 12;
  var jJ = 520;
  var MJ = (e, t) => (e / $q.w + 0.5) * t;
  var NJ = (e, t) => (0.5 - e / $q.h) * t;
  function PJ(e, t, n, r, i) {
    (e.beginPath(),
      e.moveTo(t + i * r * 0.5, n),
      e.lineTo(t - i * r * 0.5, n - r * 0.55),
      e.lineTo(t - i * r * 0.5, n + r * 0.55),
      e.closePath(),
      e.fill());
  }
  var FJ = (e, t, n) => {
    let r = t / $q.w;
    ((e.fillStyle = `#211a46`),
      e.fillRect(0, 0, t, n),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      (e.strokeStyle = `#8d84b8`),
      (e.lineWidth = 0.004 * r),
      e.beginPath(),
      e.roundRect(0.014 * r, 0.014 * r, t - 0.028 * r, n - 0.028 * r, 0.03 * r),
      e.stroke(),
      (e.fillStyle = `#4a4178`),
      e.beginPath(),
      e.roundRect(
        MJ(eJ.x - eJ.w / 2 - 0.02, t),
        NJ(eJ.y + eJ.h / 2 + 0.02, n),
        (eJ.w + 0.04) * r,
        (eJ.h + 0.04) * r,
        0.02 * r,
      ),
      e.fill(),
      (e.fillStyle = `#120d2a`),
      e.fillRect(
        MJ(eJ.x - eJ.w / 2 - 0.004, t),
        NJ(eJ.y + eJ.h / 2 + 0.004, n),
        (eJ.w + 0.008) * r,
        (eJ.h + 0.008) * r,
      ),
      (e.fillStyle = palette.lilac),
      (e.font = ZH(0.018 * r)),
      (e.textAlign = `left`),
      e.fillText(`VOL`, MJ(-0.28, t), NJ(0.105, n)),
      (e.fillStyle = `#8d84b8`));
    for (let [i, a] of [
      [-0.2, !1],
      [-0.15, !0],
    ]) {
      e.beginPath();
      let o = MJ(i, t),
        s = NJ(0.105, n),
        c = 0.014 * r;
      (e.moveTo(o - c, s + (a ? c * 0.6 : -c * 0.6)),
        e.lineTo(o + c, s + (a ? c * 0.6 : -c * 0.6)),
        e.lineTo(o, s + (a ? -c * 0.7 : c * 0.7)),
        e.closePath(),
        e.fill());
    }
    let i = rJ.y1 - rJ.y0;
    ((e.fillStyle = `#3b3274`),
      e.beginPath(),
      e.roundRect(
        MJ(rJ.x0, t),
        NJ(rJ.y1, n),
        (rJ.x1 - rJ.x0) * r,
        i * r,
        0.008 * r,
      ),
      e.fill(),
      (e.fillStyle = `#0c0820`));
    for (let a = 0; a < rJ.slots; a++) {
      let o = rJ.y1 - (i * (a + 0.5)) / rJ.slots;
      (e.beginPath(),
        e.roundRect(
          MJ(rJ.x0 + 0.012, t),
          NJ(o + 0.0026, n),
          (rJ.x1 - rJ.x0 - 0.024) * r,
          0.0052 * r,
          0.0026 * r,
        ),
        e.fill());
    }
    ((e.textAlign = `center`),
      (e.strokeStyle = palette.cream),
      (e.lineWidth = 0.004 * r));
    for (let [i, a] of [
      [0.25, `10`],
      [0.18, `100`],
    ])
      (e.beginPath(),
        e.arc(MJ(0.286, t), NJ(i, n), 0.027 * r, 0, Math.PI * 2),
        e.stroke(),
        (e.fillStyle = palette.cream),
        (e.font = XH((a.length > 2 ? 0.02 : 0.026) * r)),
        e.fillText(a, MJ(0.286, t), NJ(i - 0.001, n)));
    ((e.fillStyle = palette.orange),
      PJ(e, MJ(tJ.x + tJ.r + 0.014, t), NJ(tJ.y, n), 0.02 * r, -1),
      (e.fillStyle = palette.cream),
      (e.font = ZH(0.015 * r)),
      e.fillText(`¥10 · ¥100`, MJ(tJ.x + 0.04, t), NJ(0.128, n), 0.15 * r),
      (e.font = XH(0.022 * r)),
      e.fillText(`TELEPHONE CARD`, MJ(nJ.x, t), NJ(nJ.y + 0.087, n), 0.36 * r),
      (e.fillStyle = palette.orange),
      PJ(e, MJ(nJ.x - nJ.w / 2 - 0.035, t), NJ(nJ.y, n), 0.03 * r, 1),
      PJ(e, MJ(nJ.x + nJ.w / 2 + 0.035, t), NJ(nJ.y, n), 0.03 * r, -1),
      (e.fillStyle = `#0f0b22`));
    for (let i of iJ.y)
      for (let a of iJ.x)
        (e.beginPath(),
          e.arc(MJ(a, t), NJ(i, n), iJ.socket * r, 0, Math.PI * 2),
          e.fill());
    ((e.fillStyle = palette.cream),
      e.beginPath(),
      e.roundRect(
        MJ(aJ.x - aJ.w / 2, t),
        NJ(aJ.y + aJ.h / 2, n),
        aJ.w * r,
        aJ.h * r,
        0.01 * r,
      ),
      e.fill(),
      (e.fillStyle = palette.red),
      e.fillRect(
        MJ(aJ.x - aJ.w / 2, t),
        NJ(aJ.y + aJ.h / 2, n),
        0.07 * r,
        aJ.h * r,
      ),
      (e.fillStyle = paperWhite),
      (e.font = XH(0.026 * r)),
      e.fillText(
        `SOS`,
        MJ(aJ.x - aJ.w / 2 + 0.035, t),
        NJ(aJ.y - 0.002, n),
        0.06 * r,
      ),
      (e.fillStyle = inkPurple),
      (e.font = ZH(0.022 * r)),
      e.fillText(
        `110 · 119`,
        MJ(aJ.x + 0.035, t),
        NJ(aJ.y - 0.002, n),
        0.12 * r,
      ),
      (e.fillStyle = `#8d84b8`),
      (e.font = ZH(0.014 * r)),
      (e.textAlign = `left`),
      e.fillText(`EMERGENCY CALLS:`, MJ(-0.29, t), NJ(-0.248, n), 0.36 * r),
      e.fillText(`NO COIN NEEDED`, MJ(-0.29, t), NJ(-0.275, n), 0.36 * r));
  };
  var IJ = [`1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `*`, `0`, `#`];
  var LJ = {
    "phone.face": {
      w: Math.round($q.w * jJ),
      h: Math.round($q.h * jJ),
      paint: FJ,
    },
    "phone.keys": {
      w: 132,
      h: 176,
      paint: (e, t, n) => {
        (e.clearRect(0, 0, t, n),
          (e.fillStyle = inkPurple),
          (e.textAlign = `center`),
          (e.textBaseline = `middle`));
        let r = t / 3,
          i = n / 4;
        IJ.forEach((t, n) => {
          ((e.font = XH((t === `*` ? 0.95 : 0.66) * i)),
            e.fillText(
              t,
              ((n % 3) + 0.5) * r,
              ((n / 3) | 0) * i + i * (t === `*` ? 0.68 : 0.54),
            ));
        });
      },
    },
  };
  var RJ = (e, t) => new Vector2(e, t);
  function zJ(e, t, n, r = 2, i = 8) {
    return new ExtrudeGeometry(e, {
      depth: t - 2 * n,
      bevelEnabled: !0,
      bevelThickness: n,
      bevelSize: n,
      bevelSegments: r,
      curveSegments: i,
    })
      .rotateY(-Math.PI / 2)
      .translate(t / 2 - n, 0, 0);
  }
  function BJ() {
    let e = Xq.r,
      t = Xq.d / 2 - e,
      n = Xq.h - e,
      r = Math.hypot(Zq.z, Zq.y),
      i = Zq.y / r,
      a = Zq.z / r,
      o = i * (Xq.d / 2) + a * (Xq.h - Zq.y) - e;
    return CH(
      [
        RJ(-t, e),
        RJ(t, e),
        RJ(t, (o - i * t) / a),
        RJ((o - a * n) / i, n),
        RJ(-t, n),
      ],
      0.02,
    );
  }
  function VJ(e) {
    let t = uJ.back + uJ.t / 2,
      n = dJ.y - 0.005,
      r = n - uJ.bend,
      i = uJ.t / 2 - e,
      a = [],
      o = uJ.foot + e + i;
    for (let e = 0; e <= 6; e++) {
      let n = Math.PI + (e / 6) * Math.PI;
      a.push([t, o, Math.cos(n), Math.sin(n)]);
    }
    for (let e = 0; e <= 14; e++) {
      let n = Math.PI - (e / 14) * (Math.PI / 2);
      a.push([
        t + uJ.bend + Math.cos(n) * uJ.bend,
        r + Math.sin(n) * uJ.bend,
        Math.cos(n),
        Math.sin(n),
      ]);
    }
    a.push([dJ.back + 0.07 - e, n, 0, 1]);
    let s = (e, t) => RJ(a[e][0] + a[e][2] * i * t, a[e][1] + a[e][3] * i * t),
      c = [s(0, 1)];
    for (let e = 7; e < a.length; e++) c.push(s(e, 1));
    for (let e = a.length - 1; e >= 7; e--) c.push(s(e, -1));
    for (let e = 6; e >= 1; e--) c.push(s(e, 1));
    return new Shape(c);
  }
  function HJ(e, t, n) {
    let r = e + n,
      i = t - n,
      a = dJ.t - n,
      o = -fJ.lip + n,
      s = t - fJ.lipT + n,
      c = fJ.z - n,
      l = fJ.y - n,
      u = fJ.under - n,
      d = 0.01,
      f = new Shape();
    return (
      f.moveTo(r + d, n),
      f.lineTo(s - d, n),
      f.quadraticCurveTo(s, n, s, n - d),
      f.lineTo(s, o + d),
      f.quadraticCurveTo(s, o, s + d, o),
      f.lineTo(i - u, o),
      f.absarc(i - u, o + u, u, -Math.PI / 2, 0, !1),
      f.lineTo(i, a - l),
      f.absellipse(i - c, a - l, c, l, 0, Math.PI / 2, !1, 0),
      f.lineTo(r + d, a),
      f.quadraticCurveTo(r, a, r, a - d),
      f.lineTo(r, n + d),
      f.quadraticCurveTo(r, n, r + d, n),
      f
    );
  }
  function UJ(e, t, n, r) {
    let i = new Shape();
    return (
      i.absarc(0, 0, e + r / 2, t, n, !1),
      i.absarc(Math.cos(n) * e, Math.sin(n) * e, r / 2, n, n + Math.PI, !1),
      i.absarc(0, 0, e - r / 2, n, t, !0),
      i.absarc(
        Math.cos(t) * e,
        Math.sin(t) * e,
        r / 2,
        t + Math.PI,
        t + Math.PI * 2,
        !1,
      ),
      i
    );
  }
  var WJ = null;
  function GJ() {
    return (
      WJ ||
      ((WJ = new MeshBasicNodeMaterial({
        color: palette.yellow,
      })),
      Object.assign(WJ, {
        emissiveNode: color(new Color(palette.yellow)).mul(0.5),
      }),
      WJ)
    );
  }
  var KJ = null;
  function qJ() {
    if (KJ) return KJ;
    let e = new MeshBasicNodeMaterial({
        color: bJ.day,
      }),
      t = color(new Color(bJ.glow));
    return (
      (e.colorNode = mix(color(new Color(bJ.day)), t.mul(0.95), nG.night)),
      Object.assign(e, {
        emissiveNode: t.mul(nG.night).mul(0.5),
      }),
      (KJ = e)
    );
  }
  function JJ(e, t, n) {
    let r = createToonMaterial(e),
      i = positionLocal,
      a = vec3(clamp(i.x, t.x - bJ.len / 2, t.x + bJ.len / 2), t.y, t.z).sub(i),
      o = dot(a, a),
      s = max(dot(normalLocal, a.mul(inverseSqrt(o))), 0),
      c = color(new Color(bJ.glow)).mul(
        s.mul(n).div(o.mul(bJ.falloff).add(1)).mul(nG.night),
      );
    return (
      Object.assign(r, {
        emissiveNode: c,
      }),
      (r.mrtNode = mrt({
        emissive: vec4(c.mul(0.25), 1),
      })),
      r
    );
  }
  var YJ = WB(`#3a1600`);
  var XJ = WB(`#ffb03a`);
  function ZJ(e) {
    let t = new PixelGrid(YB(e).width, 9);
    return (t.text(e, t.cols / 2, 0, `#ffffff`), t);
  }
  var QJ = [`..#####..`, `.#######.`, `###...###`, `##.....##`, `##.....##`];
  function $J(e) {
    let t = ZJ(`TEL`),
      n = ZJ(`END`),
      r = ZJ(`:`),
      i = ZJ(`(`),
      a = ZJ(`)`),
      o = Array.from(
        {
          length: 10,
        },
        (e, t) => ZJ(String(t)),
      ),
      s = new PixelGrid(r.cols, 1),
      c = new PixelGrid(QJ[0].length, QJ.length);
    c.bitmap(QJ, 0, 0, `#ffffff`);
    let l = (e, t, n, r, i) => {
        for (let a = 0; a < t.rows; a++)
          for (let o = 0; o < t.cols; o++) {
            let s = n + o;
            s < 0 ||
              s >= e.cols ||
              !t.cells[a * t.cols + o] ||
              (e.cells[(r + a) * e.cols + s] = i);
          }
      },
      u = [],
      d = [],
      f = (e, t, n) => {
        let r = t;
        for (let e of u) r += e.cols + 1;
        let i = ((e.cols - r + 1) / 2) | 0;
        for (let r = 0; r < u.length; r++)
          (l(e, u[r], i, 2 + d[r], n),
            (i += u[r].cols + 1 + (r === 0 ? t : 0)));
      },
      p = (e, t = 0) => (u.push(e), d.push(t)),
      m = (e) => {
        let n = Math.min(9, (e / 60) | 0),
          i = e % 60;
        (p(t), p(o[n]), p(r), p(o[(i / 10) | 0]), p(o[i % 10]));
      },
      h = -1;
    return Object.assign(
      (t) => {
        let l = e.mode === `ring` && e.flash,
          h = l ? YJ : XJ;
        if (
          (t.cells.fill(l ? XJ : YJ),
          (u.length = d.length = 0),
          e.mode === `idle`)
        ) {
          let n = (e.clock / 60) | 0,
            i = e.clock % 60;
          (p(o[(n / 10) | 0]),
            p(o[n % 10]),
            e.colon ? p(r) : p(s),
            p(o[(i / 10) | 0]),
            p(o[i % 10]),
            f(t, 0, h));
        } else
          e.mode === `ring`
            ? (p(i), p(i), p(c, 1), p(a), p(a), f(t, 1, h))
            : e.mode === `call` || e.flash
              ? (m(e.secs), f(t, 3, h))
              : (p(n), f(t, 0, h));
      },
      {
        tick: () => e.frame !== h && ((h = e.frame), !0),
      },
    );
  }
  var eY = [
    `#ff4646`,
    `#ff4646`,
    `#ff9a2a`,
    `#ffd23a`,
    `#ffd23a`,
    `#b2ff4a`,
    `#62ff6a`,
    `#62ff6a`,
  ].map(WB);
  var tY = [
    `#3a0e10`,
    `#3a0e10`,
    `#3a1e08`,
    `#3a300c`,
    `#3a300c`,
    `#24380e`,
    `#123a16`,
    `#123a16`,
  ].map(WB);
  function nY(e) {
    let t = -1;
    return Object.assign(
      (t) => {
        for (let n = 0; n < t.cols; n++)
          t.cells[n] = n >= t.cols - e.lit ? eY[n] : tY[n];
      },
      {
        tick: () => e.frame !== t && ((t = e.frame), !0),
      },
    );
  }
  var PoseSpring = class {
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
  var iY = null;
  var aY = () =>
    (iY ??= {
      parts: createToonMaterial(
        {
          color: `#ffffff`,
          vertexColors: !0,
        },
        {
          creature: !0,
        },
      ),
      eyes: new MeshBasicNodeMaterial({
        color: `#ffffff`,
        vertexColors: !0,
      }),
      glasses: Iz(),
    });
  function oY(e, t, n) {
    let r = e.clone();
    n && r.applyMatrix4(n);
    let i = new Color(t),
      a = r.attributes.position.count,
      o = new Float32Array(a * 3);
    for (let e = 0; e < a; e++) i.toArray(o, e * 3);
    return (r.setAttribute(`color`, new BufferAttribute(o, 3)), r);
  }
  var sY = new Euler();
  var cY = new Quaternion();
  var lY = new Vector3();
  var uY = new Vector3();
  var dY = (e) =>
    new Matrix4().compose(
      uY.set(...e.pos),
      cY.setFromEuler(sY.set(e.rotX, 0, 0)),
      lY.set(...e.scale),
    );
  var BirdPose = class {
    root = new Group();
    squash = new PoseSpring(190, 7);
    pitch = new PoseSpring(120, 8);
    roll = new PoseSpring(120, 8);
    lift = new PoseSpring(260, 14);
    puff = new PoseSpring(140, 6);
    wingR = new PoseSpring(220, 12);
    wingL = new PoseSpring(220, 12);
    peek = new PoseSpring(120, 12);
    yaw = new PoseSpring(90, 11);
    lid = new PoseSpring(260, 14);
    talking = !1;
    flap = 0;
    springs;
    hip = new Group();
    body = new Group();
    jaw = new Group();
    wings = [new Group(), new Group()];
    eyes = new Group();
    shades = null;
    hat = null;
    hatBack;
    layout = uz(Uz.body);
    beak = 0;
    nextBeat = 0;
    blinkT = -1;
    nextBlink = 1 + Math.random() * 2;
    beatPhase = Math.random() * 10;
    constructor(e, t) {
      let n = this.layout,
        r = aY(),
        i = (e, t, n, r = !0) => {
          let i = new Mesh(e, t);
          return ((i.castShadow = i.receiveShadow = r), n.add(i), i);
        };
      ((this.root.name = e),
        (this.root.userData.bakeSkip = !0),
        (this.root.rotation.order = `YXZ`),
        this.root.scale.setScalar(Uz.scale),
        this.root.add(this.hip),
        this.hip.add(this.body));
      let a = mergeGeometries([
        oY($R(Uz.body), LF),
        oY(VR, n.tail.color, dY(n.tail)),
        oY(VR, n.beak.color, dY(n.beak)),
        oY(VR, n.mouth.color, dY(n.mouth)),
      ]);
      ((i(a, r.parts, this.body).name = `${e}Body`),
        this.jaw.position.set(...n.jawHinge),
        this.body.add(this.jaw),
        i(oY(VR, n.jaw.color, dY(n.jaw)), r.parts, this.jaw));
      let o = oY(VR, LF);
      this.wings.forEach((e, t) => {
        let a = t === 0 ? -1 : 1;
        (e.position.set(a * n.wing.pivot[0], n.wing.pivot[1], n.wing.pivot[2]),
          this.body.add(e));
        let s = i(o, r.parts, e);
        (s.position.set(a * n.wing.part[0], n.wing.part[1], n.wing.part[2]),
          s.scale.set(...n.wing.scale));
      });
      let [s, c, l] = n.eye ?? [0.088, 0.272, 0.12],
        u = [],
        d = new Matrix4();
      for (let e of [-1, 1]) {
        let t = Z(e * s, c, l);
        (d
          .lookAt(Z(e * 0.35, 0.3, 0.45), t, Z(0, 1, 0))
          .setPosition(t.x, t.y - c, t.z),
          u.push(oY(HR, charcoal, d.clone().scale(Z(0.019, 0.022, 0.012)))),
          u.push(
            oY(
              HR,
              paperWhite,
              d
                .clone()
                .multiply(new Matrix4().makeTranslation(0.006, 0.008, 0.009))
                .scale(Z(0.0055, 0.0055, 0.004)),
            ),
          ));
      }
      if (
        ((this.eyes.position.y = c),
        this.body.add(this.eyes),
        i(mergeGeometries(u), r.eyes, this.eyes, !1),
        t.shades && (this.shades = i(n.glassesGeo, r.glasses, this.body, !1)),
        (this.hatBack = t.hat?.backwards ?? !1),
        t.hat)
      ) {
        let [e, a] = vz[t.hat.type][t.hat.colors];
        ((this.hat = i(
          Dz(t.hat.type, new Color(e), new Color(a)),
          r.parts,
          this.body,
        )),
          this.hat.position.set(...n.hat.pos),
          this.hat.scale.setScalar(n.hat.scale));
      }
      ((this.springs = [
        this.squash,
        this.pitch,
        this.roll,
        this.lift,
        this.puff,
        this.wingR,
        this.wingL,
        this.peek,
        this.yaw,
        this.lid,
      ]),
        this.rest());
    }
    rest() {
      for (let e of this.springs) e.snap(0);
      (this.lid.snap(1), (this.talking = !1), (this.flap = 0), (this.beak = 0));
    }
    get hop() {
      return Math.max(0, this.lift.x * 0.1) * this.root.scale.y;
    }
    settle() {
      ((this.squash.target =
        this.pitch.target =
        this.roll.target =
        this.puff.target =
          0),
        (this.wingR.target = this.wingL.target = this.peek.target = 0),
        (this.lid.target = 1),
        (this.talking = !1));
    }
    pose(e, t, n) {
      ((this.squash.target += Math.sin(t * 2.2 + this.beatPhase) * 0.015),
        this.talking
          ? ((this.beak = Math.sin(t * 24) > 0 ? 0.6 : 0.05),
            t > this.nextBeat &&
              !n &&
              (this.squash.kick(0.6 + Math.random() * 0.8),
              this.pitch.kick(Math.random() * 1.2 - 0.6),
              (this.nextBeat = t + 0.18 + Math.random() * 0.12)))
          : (this.beak *= Math.exp(-e * 20)));
      for (let t of this.springs) t.update(e);
      ((this.root.rotation.y = this.yaw.x),
        this.hip.rotation.set(this.pitch.x, 0, this.roll.x),
        (this.hip.position.y = Math.max(0, this.lift.x * 0.1)));
      let r = MathUtils.clamp(this.squash.x, -0.45, 0.6),
        i = 1 / Math.sqrt(1 + r),
        a = 1 + this.puff.x;
      (this.body.scale.set(i * a, (1 + r) * a, i * a),
        (this.jaw.rotation.x = this.beak * 0.55));
      let o = n ? 0 : this.flap,
        s = o > 0 ? o * (0.9 + Math.sin(t * 34) * 0.85) : 0;
      ((this.wings[0].rotation.z = -(0.08 + this.wingR.x + s)),
        (this.wings[1].rotation.z = 0.08 + this.wingL.x + s),
        t > this.nextBlink &&
          ((this.blinkT = 0),
          (this.nextBlink =
            t + (Math.random() < 0.2 ? 0.25 : 1.8 + Math.random() * 2.7))));
      let c = MathUtils.clamp(this.lid.x, -0.1, 1.3);
      if (this.blinkT >= 0) {
        this.blinkT += e;
        let t = this.blinkT / 0.16;
        t >= 1 ? (this.blinkT = -1) : (c *= 1 - Math.sin(Math.PI * t) * 0.95);
      }
      let l = 1 - Math.max(0, c);
      this.eyes.scale.set(
        1 + Math.max(0, l) * 0.2,
        Math.max(0.06, 1 - l * 0.88),
        1,
      );
      let u = this.layout;
      if (this.shades) {
        let e = this.peek.x;
        (this.shades.position.set(
          u.glasses[0],
          u.glasses[1] - e * 0.075,
          u.glasses[2] + e * 0.012,
        ),
          (this.shades.rotation.x = e * 0.3));
      }
      if (this.hat) {
        let e = this.hatBack ? 1 : -1;
        this.hat.rotation.set(
          u.hat.tilt - MathUtils.clamp(this.pitch.v * 0.025, -0.15, 0.15) * e,
          this.hatBack ? Math.PI : 0,
          (this.hatBack ? 0.12 : -0.05) -
            MathUtils.clamp(this.roll.v * 0.025, -0.15, 0.15),
        );
      }
    }
  };
  var BirdSpeechSprite = class {
    at;
    w;
    h;
    sprite;
    pop = new PoseSpring(240, 15);
    wanted = null;
    shown = null;
    until = 0;
    constructor(e, t, n, r, i) {
      ((this.at = t), (this.w = n), (this.h = r));
      let a = (this.sprite = new Sprite(cB(`chu`)));
      ((a.name = i),
        a.center.set(xB.cx, xB.cy),
        (a.renderOrder = xB.order),
        (a.userData.bakeSkip = !0),
        (a.userData.noExport = !0),
        a.position.copy(t),
        (a.visible = !1),
        e.add(a));
    }
    say(e, t, n = TJ) {
      ((this.wanted = e), (this.until = t + n));
    }
    get quiet() {
      return this.wanted === null && this.shown === null;
    }
    clear() {
      ((this.wanted = this.shown = null),
        this.pop.snap(0),
        (this.sprite.visible = !1));
    }
    update(e, t, n, r = 0) {
      (this.wanted !== null && t > this.until && (this.wanted = null),
        (this.pop.target = +(
          this.wanted !== null && this.wanted === this.shown
        )),
        this.pop.update(e),
        this.wanted !== this.shown &&
          this.pop.x < 0.05 &&
          ((this.shown = this.wanted),
          this.shown && (this.sprite.material = cB(this.shown)),
          this.pop.snap(0)));
      let i = Math.max(0, n ? gY(this.pop.x) : this.pop.x),
        a = this.sprite;
      ((a.visible = this.shown !== null && i > 0.01),
        a.visible &&
          (a.scale.set(this.w * i, this.h * i, 1),
          a.position.set(this.at.x, this.at.y + r, this.at.z)));
    }
  };
  var FlexibleCable = class {
    mesh;
    n = lJ.turns * lJ.seg + 1;
    helix;
    pos;
    nor;
    a = new Vector3(1 / 0, 0, 0);
    b = new Vector3();
    c = new Vector3();
    p = new Vector3();
    t = new Vector3();
    nn = new Vector3();
    bn = new Vector3();
    r = new Vector3();
    z = new Vector3(0, 0, 1);
    constructor(e) {
      let t = new Group();
      ((t.name = `PhoneCord`), (t.userData.bakeSkip = !0), e.add(t));
      let n = this.n,
        r = lJ.radial,
        i = [];
      for (let e = 0; e < n - 1; e++)
        for (let t = 0; t < r; t++) {
          let n = e * r + t,
            a = e * r + ((t + 1) % r);
          i.push(n, a, n + r, a, a + r, n + r);
        }
      let a = new BufferGeometry();
      (a.setAttribute(
        `position`,
        new Float32BufferAttribute(new Float32Array(n * r * 3), 3),
      ),
        a.setAttribute(
          `normal`,
          new Float32BufferAttribute(new Float32Array(n * r * 3), 3),
        ),
        a.setIndex(i),
        createPart(a, paleBlue, t),
        ([this.mesh] = bakeStaticGeometry(t, `PhoneCord`, !0)),
        (this.pos = this.mesh.geometry.attributes.position),
        (this.nor = this.mesh.geometry.attributes.normal),
        (this.helix = new Float32Array(n * 3)));
    }
    set(e, t) {
      if (
        e.distanceToSquared(this.a) < 1e-8 &&
        t.distanceToSquared(this.b) < 1e-8
      )
        return;
      (this.a.copy(e), this.b.copy(t));
      let n = this.n,
        r = e.distanceTo(t),
        i = Math.max(0.02, 0.3 - r * 0.36),
        a = this.c.addVectors(e, t).multiplyScalar(0.5);
      ((a.x -= 0.17 + i * 0.3), (a.y -= i * 2), (a.z += 0.1));
      let o = this.helix;
      for (let r = 0; r < n; r++) {
        let i = r / (n - 1),
          s = 1 - i;
        (this.p
          .set(0, 0, 0)
          .addScaledVector(e, s * s)
          .addScaledVector(a, 2 * s * i)
          .addScaledVector(t, i * i),
          this.t
            .subVectors(a, e)
            .multiplyScalar(2 * s)
            .addScaledVector(this.r.subVectors(t, a), 2 * i)
            .normalize(),
          this.nn.crossVectors(this.t, this.z).normalize(),
          this.bn.crossVectors(this.t, this.nn));
        let c = Math.PI * 2 * lJ.turns * i,
          l =
            lJ.coil *
            MathUtils.smoothstep(i, 0, 0.03) *
            MathUtils.smoothstep(1 - i, 0, 0.03);
        (this.p
          .addScaledVector(this.nn, Math.cos(c) * l)
          .addScaledVector(this.bn, Math.sin(c) * l),
          (o[r * 3] = this.p.x),
          (o[r * 3 + 1] = this.p.y),
          (o[r * 3 + 2] = this.p.z));
      }
      let s = this.pos.array,
        c = this.nor.array,
        l = lJ.radial;
      for (let e = 0; e < n; e++) {
        let t = Math.max(0, e - 1),
          r = Math.min(n - 1, e + 1);
        (this.t
          .set(
            o[r * 3] - o[t * 3],
            o[r * 3 + 1] - o[t * 3 + 1],
            o[r * 3 + 2] - o[t * 3 + 2],
          )
          .normalize(),
          this.nn.crossVectors(this.t, this.z),
          this.nn.lengthSq() < 1e-6 && this.nn.set(1, 0, 0),
          this.nn.normalize(),
          this.bn.crossVectors(this.t, this.nn));
        for (let t = 0; t < l; t++) {
          let n = (t / l) * Math.PI * 2,
            r = Math.cos(n),
            i = Math.sin(n),
            a = (e * l + t) * 3,
            u = this.nn.x * r + this.bn.x * i,
            d = this.nn.y * r + this.bn.y * i,
            f = this.nn.z * r + this.bn.z * i;
          ((c[a] = u),
            (c[a + 1] = d),
            (c[a + 2] = f),
            (s[a] = o[e * 3] + u * lJ.wire),
            (s[a + 1] = o[e * 3 + 1] + d * lJ.wire),
            (s[a + 2] = o[e * 3 + 2] + f * lJ.wire));
        }
      }
      ((this.pos.needsUpdate = !0), (this.nor.needsUpdate = !0));
    }
  };
  var hY = {
    back: (e) => 1 + 2.4 * (e - 1) ** 3 + 1.4 * (e - 1) ** 2,
    inOut: (e) => e * e * (3 - 2 * e),
    in: (e) => e * e,
    out: (e) => 1 - (1 - e) * (1 - e),
  };
  var gY = (e) => (e < 0 ? 0 : e > 1 ? 1 : e);
  var _Y = (e, t) => e + Math.random() * (t - e);
  function vY(e, t, n) {
    let r = -(t.poleRadius + uJ.off),
      i = r - uJ.w / 2,
      a = uJ.back + uJ.t,
      o = dJ.y - dJ.t / 2,
      s = dJ.y + dJ.t / 2,
      c = uJ.foot + uJ.hang,
      l = i + 0.03,
      u = a + Xq.d / 2,
      d = o - 0.012 - 0.026 - bJ.r + 0.004,
      f = Z(i, d, bJ.z),
      p = new Group();
    ((p.name = `PhoneBooth`), (p.userData.bakeSkip = !0), e.g.add(p));
    let m = new Mesh(
      toCreasedNormals(zJ(VJ(0.03), uJ.w, 0.03, 3, 1), 0.6).translate(i, 0, 0),
      JJ(
        {
          color: pJ,
        },
        f,
        bJ.panel,
      ),
    );
    ((m.name = `PhoneBoothPanel`),
      (m.castShadow = m.receiveShadow = !0),
      p.add(m),
      createPart(
        toCreasedNormals(
          zJ(HJ(dJ.back, dJ.front, fJ.end), uJ.w + 2 * dJ.eave, fJ.end, 4, 12),
          0.6,
        ),
        palette.cream,
        p,
      ).position.set(i, o, 0));
    let h = dJ.front - fJ.lipT,
      g = dJ.back + 0.06;
    (createPart(
      new RoundedBoxGeometry(uJ.w, 0.012, h - g, 1, 0.004),
      shadowPurple,
      p,
    ).position.set(i, o - 0.006, (h + g) / 2),
      createPart(
        new RoundedBoxGeometry(bJ.len + 0.1, 0.026, 0.05, 2, 0.01),
        shadowPurple,
        p,
      ).position.set(i, o - 0.012 - 0.013, bJ.z));
    let _ = $(`phoneStripEnd`, () =>
      new CylinderGeometry(bJ.r + 0.008, bJ.r + 0.008, 0.04, 12).rotateZ(
        Math.PI / 2,
      ),
    );
    for (let e of [-1, 1])
      createPart(_, shadowPurple, p).position.set(
        i + e * (bJ.len / 2 + 0.02),
        d,
        bJ.z,
      );
    (RH(
      p,
      AH(Z(0, 0, a), Z(1, 0, 0), Z(0, 1, 0)),
      r - 0.09,
      uJ.foot + 0.3,
      1,
      0.1,
      0.15,
      0.003,
    ),
      bakeStaticGeometry(p, `PhoneBooth`, !0));
    let v = new Mesh(
      $(`phoneStripTube`, () =>
        new CapsuleGeometry(bJ.r, bJ.len, 4, 12).rotateZ(Math.PI / 2),
      ),
      qJ(),
    );
    ((v.name = `PhoneStrip`),
      v.position.copy(f),
      (v.userData.bakeSkip = !0),
      p.add(v),
      n.from(v));
    for (let e of [-1, 1])
      n.burst(
        e * (bJ.len / 2 + 0.04),
        0,
        bJ.r + 0.004,
        0.075,
        [0.35, 0.8, 1.25].map((t) => -Math.PI / 2 + e * t),
        bJ.glow,
        3,
        0.05,
        0.014,
      );
    let y = a + 0.02 + 0.035,
      b = a + 0.02 - y / 2;
    for (let n of yJ) {
      (t.collar(e, n, palette.orange, 0.13, 0.04),
        t.strap(e, -0.2, r, n, 0.07, 0.07),
        createPart(
          new RoundedBoxGeometry(0.08, 0.15, y, 2, 0.012),
          shadowPurple,
          e.g,
        ).position.set(r, n, b));
      for (let t of [-0.04, 0.04])
        xH(e.g, Z(r, n + t, a + 0.02), Z(0, 0, 1), paleBlue, 0.014);
    }
    let x = new Group();
    ((x.name = `Phone`),
      (x.userData.bakeSkip = !0),
      x.position.set(l, c, u),
      e.g.add(x));
    let S = new Group();
    ((S.name = `PhoneBody`),
      (S.userData.bakeSkip = !0),
      x.add(S),
      createPart(zJ(BJ(), Xq.w, Xq.r), palette.lime, S),
      DH(
        S,
        SH(Qq.w, Qq.h, 0.05),
        SH($q.w, $q.h, 0.04),
        shadowPurple,
        `phone.face`,
        Qq.depth,
      ).position.set(0, Qq.y, Xq.d / 2));
    let C = Xq.d / 2 + Qq.depth / 2 + EH + 0.004,
      w = (e, t, n = 0) => Z(e, Qq.y + t, C + n),
      T = $(`phoneScrew`, () =>
        new CylinderGeometry(0.008, 0.008, 0.008, 10).rotateX(Math.PI / 2),
      );
    for (let e of [-1, 1])
      for (let t of [-1, 1])
        createPart(T, paleBlue, S).position.copy(
          w(e * ($q.w / 2 - 0.016), t * ($q.h / 2 - 0.016), 0.002),
        );
    (createPart(
      $(`phoneCoinSlot`, () =>
        new CylinderGeometry(tJ.r, tJ.r, 0.024, 24).rotateX(Math.PI / 2),
      ),
      paleBlue,
      S,
    ).position.copy(w(tJ.x, tJ.y, 0.006)),
      createPart(
        new BoxGeometry(0.012, tJ.r * 1.25, 0.01),
        inkPurple,
        S,
      ).position.copy(w(tJ.x, tJ.y, 0.016)),
      createPart(
        new RoundedBoxGeometry(0.05, 0.018, 0.012, 2, 0.005),
        paleBlue,
        S,
      ).position.copy(w(tJ.x, tJ.y - tJ.r - 0.022, 0.003)),
      createPart(
        new RoundedBoxGeometry(nJ.w, nJ.h, 0.034, 2, 0.014),
        paleBlue,
        S,
      ).position.copy(w(nJ.x, nJ.y, 0.007)),
      createPart(
        new BoxGeometry(nJ.w * 0.72, 0.014, 0.01),
        inkPurple,
        S,
      ).position.copy(w(nJ.x, nJ.y + 0.01, 0.023)),
      createPart(
        new BoxGeometry(nJ.w * 0.8, 0.018, 0.02),
        palette.orange,
        S,
      ).position.copy(w(nJ.x, nJ.y - 0.035, 0.022)));
    let E = $(`phoneKey`, () =>
        new CylinderGeometry(iJ.r, iJ.r, 0.022, 20).rotateX(Math.PI / 2),
      ),
      D = mH(`phone.keys`),
      ee = (e, t = 0) => w(iJ.x[e % 3], iJ.y[(e / 3) | 0], t);
    for (let e = 0; e < 12; e++) {
      createPart(E, amber, S).position.copy(ee(e, 0.006));
      let t = e % 3,
        n = (e / 3) | 0,
        r = (D.u1 - D.u0) / 3,
        i = (D.v1 - D.v0) / 4,
        a = {
          u0: D.u0 + t * r,
          u1: D.u0 + (t + 1) * r,
          v0: D.v1 - (n + 1) * i,
          v1: D.v1 - n * i,
        };
      LH(
        S,
        AH(ee(e, 0.017), Z(1, 0, 0), Z(0, 1, 0)),
        0,
        0,
        iJ.r * 1.45,
        iJ.r * 1.45,
        0,
        a,
        0.002,
      );
    }
    (createPart(
      new RoundedBoxGeometry(sJ.w, sJ.h, 0.03, 2, 0.02),
      shadowPurple,
      S,
    ).position.set(0, sJ.y, Xq.d / 2 - 0.004),
      createPart(
        $(`phoneLock`, () =>
          new CylinderGeometry(0.022, 0.022, 0.024, 16).rotateX(Math.PI / 2),
        ),
        paleBlue,
        S,
      ).position.set(-0.1, sJ.y, Xq.d / 2 + 0.016),
      createPart(
        new BoxGeometry(0.006, 0.02, 0.006),
        inkPurple,
        S,
      ).position.set(-0.1, sJ.y, Xq.d / 2 + 0.029),
      createPart(new BoxGeometry(0.08, 0.07, 0.01), inkPurple, S).position.set(
        0.11,
        sJ.y,
        Xq.d / 2 + 0.012,
      ),
      createPart(
        $(`phoneCoin`, () =>
          new CylinderGeometry(0.02, 0.02, 0.006, 16).rotateX(
            Math.PI / 2 - 0.35,
          ),
        ),
        palette.yellow,
        S,
      ).position.set(0.115, sJ.y - 0.012, Xq.d / 2 + 0.024),
      createPart(
        new RoundedBoxGeometry(oJ.w + 0.026, oJ.h + 0.016, 0.012, 2, 0.006),
        shadowPurple,
        S,
      ).position.set(oJ.x, oJ.y, Xq.d / 2 + 0.002));
    let te = AH(Z(0, 0, Xq.d / 2), Z(1, 0, 0), Z(0, 1, 0));
    (RH(S, te, -0.295, 0.11, 11, 0.085, -0.2, 0.003),
      RH(S, te, 0.29, 0.14, 7, 0.09, 0.25, 0.003),
      createPart(
        new RoundedBoxGeometry(0.04, 0.42, 0.12, 2, 0.015),
        shadowPurple,
        S,
      ).position.set(-Xq.w / 2 - 0.012, 0.64, 0.04));
    for (let e of [0.17, -0.17])
      createPart(
        new RoundedBoxGeometry(0.07, 0.03, 0.1, 2, 0.01),
        shadowPurple,
        S,
      ).position.set(-Xq.w / 2 - 0.04, 0.64 + e - Math.sign(e) * 0.075, 0.04);
    createPart(
      $(`phonePlug`, () =>
        new CylinderGeometry(0.02, 0.026, 0.03, 12).rotateZ(Math.PI / 2),
      ),
      shadowPurple,
      S,
    ).position.copy(lJ.at);
    let O = {
        mode: `idle`,
        clock: 0,
        colon: !0,
        flash: !1,
        secs: 0,
        frame: 0,
      },
      ne = aV({
        cols: eJ.cols,
        rows: eJ.rows,
        draw: $J(O),
        brightness: 1.1,
      });
    ne.glass(`band`, eJ.w, eJ.h);
    let re = new Mesh(
      TH(new ShapeGeometry(SH(eJ.w, eJ.h, 0.012), 4)),
      ne.material,
    );
    ((re.name = `PhoneLcd`), re.position.copy(w(eJ.x, eJ.y, 0.003)), S.add(re));
    let ie = {
        lit: 1,
        frame: 0,
      },
      ae = new Mesh(
        TH(new ShapeGeometry(SH(oJ.w, oJ.h, 0.006), 2)),
        aV({
          cols: oJ.n,
          rows: 1,
          draw: nY(ie),
          brightness: 1.2,
        }).material,
      );
    ((ae.name = `PhoneLevel`),
      ae.position.set(oJ.x, oJ.y, Xq.d / 2 + 0.0095),
      S.add(ae));
    for (let e of bakeStaticGeometry(S, `PhoneBody`, !0)) {
      let t = e.material,
        n = JJ(
          {
            map: t.map,
            vertexColors: !0,
            alphaTest: t.alphaTest,
          },
          f.clone().sub(x.position),
          bJ.phone,
        );
      ((n.name = `phone-lit`),
        (n.userData.exportMap = t.userData.exportMap),
        (e.material = n));
    }
    n.from(re);
    for (let e of [-1, 0, 1])
      n.dash(
        -eJ.w / 2 - 0.028,
        e * 0.032,
        0.002,
        Math.PI - e * 0.4,
        0.045,
        0.013,
        `#ffb03a`,
        3,
      );
    let oe = new Group();
    ((oe.name = `PhoneHandset`),
      (oe.userData.bakeSkip = !0),
      x.add(oe),
      createPart(
        new CapsuleGeometry(cJ.grip, cJ.len, 6, 12),
        palette.lime,
        oe,
      ));
    for (let e of [1, -1])
      (createPart(
        $(`phoneCup`, () =>
          new CylinderGeometry(cJ.cup, cJ.cup * 0.9, 0.05, 20).rotateX(
            Math.PI / 2,
          ),
        ),
        palette.lime,
        oe,
      ).position.set(0, (e * cJ.len) / 2, 0.04),
        createPart(
          $(`phoneGrille`, () =>
            new CylinderGeometry(
              cJ.cup * 0.62,
              cJ.cup * 0.62,
              0.01,
              16,
            ).rotateX(Math.PI / 2),
          ),
          shadowPurple,
          oe,
        ).position.set(0, (e * cJ.len) / 2, 0.064));
    ((createPart(
      $(`phoneCordEnd`, () => new CylinderGeometry(0.012, 0.016, 0.04, 8)),
      shadowPurple,
      oe,
    ).position.y = cJ.cord + 0.02),
      bakeStaticGeometry(oe, `PhoneHandset`, !0));
    let se = new FlexibleCable(x);
    se.mesh.geometry.boundingSphere = new Sphere(Z(-0.4, 0.75, 0.15), 0.9);
    let ce = new BirdPose(`PhoneBird`, {
        shades: !0,
        hat: {
          type: `cap`,
          colors: 3,
          backwards: !0,
        },
      }),
      le = Z(-0.13, Xq.h, 0.05);
    (ce.root.position.copy(le), x.add(ce.root));
    let ue = xB.w * Uz.scale,
      de = xB.h * Uz.scale,
      fe = new BirdSpeechSprite(
        x,
        Z(le.x + 0.2, le.y + 0.3, le.z + 0.24),
        ue,
        de,
        `PhoneSay`,
      ),
      pe = new Group();
    ((pe.name = `PhoneRoofBirds`), (pe.userData.bakeSkip = !0), e.g.add(pe));
    let me = (e, t, n, r, i) => {
        let a = new BirdPose(e, t),
          o = Z(n, s, mJ);
        (a.root.position.copy(o), pe.add(a.root));
        let c = new BirdSpeechSprite(
            pe,
            Z().addVectors(o, hJ),
            ue,
            de,
            `${e}Say`,
          ),
          l = (e) =>
            new CatmullRomCurve3(
              e.map(([e, t, n]) => Z(o.x + e, o.y + t, o.z + n)),
              !1,
              `centripetal`,
            );
        return {
          p: a,
          at: o,
          say: c,
          sayOff: hJ,
          rest: r,
          look: {
            at: 0,
            yaw: r,
            pitch: 0,
          },
          jumpAt: -9,
          plan: i,
          out: l(i.out),
          back: l(i.back),
          flight: `home`,
          t: 0,
          landed: -9,
        };
      },
      he = me(
        `PhoneRoofBird`,
        {
          shades: !1,
          hat: null,
        },
        i - 0.3,
        0.3,
        DJ,
      ),
      ge = me(
        `PhoneRoofFlyer`,
        {
          shades: !1,
          hat: {
            type: `beanie`,
            colors: 0,
            backwards: !1,
          },
        },
        i + 0.27,
        -0.3,
        EJ,
      ),
      _e = [he, ge],
      ve = {
        cam: null,
        readAt: -1e9,
        btn: null,
        w: 1,
        h: 1,
      },
      ye = Z(),
      be = Z(),
      xe = Z(),
      Se = (e, t, n, r, i) => {
        if (!ve.cam) {
          let e = pe;
          for (; e.parent;) e = e.parent;
          ve.cam = e.children.find((e) => e.isCamera) ?? null;
        }
        let a = performance.now();
        if (a - ve.readAt > 3e3) {
          ve.readAt = a;
          let e = document
            .querySelector(`.sound-toggle`)
            ?.getBoundingClientRect();
          ve.btn = e && e.width > 0 ? e : null;
          let t = document.getElementById(`scene`);
          ((ve.w = t?.clientWidth || window.innerWidth),
            (ve.h = t?.clientHeight || window.innerHeight));
        }
        let { cam: o, btn: s } = ve;
        if (!o) return !0;
        e.updateWorldMatrix(!0, !1);
        let c = e.matrixWorld.elements,
          l = Math.hypot(c[0], c[1], c[2]);
        ye.copy(t)
          .applyMatrix4(e.matrixWorld)
          .applyMatrix4(o.matrixWorldInverse);
        let [[u, d], [f, p]] = n,
          m = (e, t) =>
            be
              .set(ye.x + e * r * l, ye.y + t * i * l, ye.z)
              .applyMatrix4(o.projectionMatrix);
        m(u, d);
        let h = (be.x * 0.5 + 0.5) * ve.w,
          g = (-be.y * 0.5 + 0.5) * ve.h;
        m(f, p);
        let _ = (be.x * 0.5 + 0.5) * ve.w,
          v = (-be.y * 0.5 + 0.5) * ve.h,
          y = (e) =>
            !!e &&
            e.width > 0 &&
            h < e.right + 6 &&
            e.left < _ + 6 &&
            v < e.bottom + 6 &&
            e.top < g + 6;
        if (y(s)) return !1;
        let b = document.querySelector(`.mesq-speech__bubble`);
        return !(b && !b.hidden && y(b.getBoundingClientRect()));
      },
      Ce = Xq.d / 2 + 0.19,
      we = [0, 1].map((e) => {
        let t = [];
        for (let [n, r] of [
          [-Xq.w / 2 - 0.02, 2.55],
          [Xq.w / 2 + 0.02, 0.59],
        ])
          [0.13, 0.2, 0.27].forEach((i, a) => {
            a % 2 === e &&
              t.push(
                new ShapeGeometry(
                  UJ(i, r - 0.42, r + 0.42, 0.026),
                  6,
                ).translate(n, Xq.h - 0.08, Ce),
              );
          });
        let n = new Mesh(mergeGeometries(t), GJ());
        return (
          (n.name = `PhoneRing${e}`),
          (n.userData.bakeSkip = !0),
          (n.userData.measure = !0),
          (n.visible = !1),
          x.add(n),
          n
        );
      }),
      Te = uJ.w + 2 * dJ.eave + 0.1,
      Ee = [uJ.foot - 0.04, s + 0.55],
      De = [uJ.back - 0.04, dJ.front + 0.06],
      Oe = new Mesh(
        $(
          `phoneBoothHit`,
          () => new BoxGeometry(Te, Ee[1] - Ee[0], De[1] - De[0]),
        ),
        t.hitMaterial,
      );
    (Oe.position.set(i, (Ee[0] + Ee[1]) / 2, (De[0] + De[1]) / 2),
      (Oe.visible = !1),
      (Oe.userData.noExport = !0),
      (Oe.userData.bakeSkip = !0),
      e.g.add(Oe));
    let ke = (e, t) => {
        let n = e.clone().normalize(),
          r = t.clone().addScaledVector(n, -t.dot(n)).normalize();
        return new Quaternion().setFromRotationMatrix(
          new Matrix4().makeBasis(new Vector3().crossVectors(n, r), n, r),
        );
      },
      Ae = {
        p: Z(-Xq.w / 2 - 0.085, 0.64, 0.04),
        q: ke(Z(0, 1, 0), Z(1, 0, 0)),
      },
      je = {
        p: Z(-0.23, 0.24, 0.07),
        q: ke(Z(-0.2, 0.84, -0.5), Z(1, 0.15, -0.1)),
      },
      Me = {
        p: Z(-0.4, 0.32, 0.02),
        q: ke(Z(-0.5, 0.8, -0.2), Z(1, 0.1, 0.1)),
      },
      Ne = {
        p: Z(-0.2, 0.3, 0.3),
        q: ke(Z(0.15, 1, 0), Z(0.55, 0, -0.83)),
      },
      Pe = {
        p: Z(),
        q: new Quaternion(),
      },
      Fe = Z(0, cJ.cord, 0),
      Ie = Z(),
      Le = Z(),
      Re = Z(),
      ze = Z(),
      Be = new Quaternion(),
      Ve = new Quaternion(),
      He = new Quaternion(),
      Ue = Z(0, 1, 0),
      We = Z(1, 0, 0),
      Ge = Z(),
      Ke = Z(),
      qe = (e, t, n) => {
        (He.setFromAxisAngle(Ue, ce.yaw.x),
          t.copy(e.p).applyQuaternion(He).add(ce.root.position),
          (t.y += ce.hop),
          n.copy(He).multiply(e.q));
      },
      Je = -1,
      Ye = OJ,
      Xe = 9,
      Ze = 0,
      Qe = 0,
      $e = 0,
      et = 0,
      k = 9,
      tt = 0,
      nt = 0,
      rt = 1,
      it = {
        at: 0,
        yaw: 0.15,
        pitch: 0,
      },
      at = !1,
      ot = 0,
      st = new Date().getTimezoneOffset(),
      ct = () => t.reducedMotion.matches,
      lt = () => t.focus(),
      ut = (e, t = TJ) => {
        (fe.say(e, ot, t), Yq.word(e, lt()));
      },
      dt = (e, t, n) => {
        ((e.sayOff = Se(pe, xe.addVectors(e.at, hJ), _J, ue * vJ, de * vJ)
          ? hJ
          : gJ),
          e.say.say(t, ot, n));
      },
      ft = (e) => Je >= e && Je < e + 0.35,
      pt = (e) => Yq.mumble(lt() * 0.9, e),
      mt = (e) => () => {
        ct() || e();
      },
      ht = (e, t = 1) => {
        (e.p.lid.kick(4 * t),
          !ct() &&
            (e.p.squash.kick(-2.5 * t),
            e.p.puff.kick(1.2 * t),
            (e.jumpAt = ot)));
      },
      gt = (e) => {
        e.flight !== `home` ||
          ct() ||
          ((e.flight = `out`), (e.t = 0), Yq.flap(lt() * (e === he ? 0.8 : 1)));
      },
      _t = [
        [xJ.rings[0], () => Yq.ring(lt())],
        [
          xJ.panic,
          () => {
            Yq.alarm(lt());
            for (let e of _e) e.flight === `home` && ht(e);
            ct() || (ce.squash.kick(-2.5), ce.lift.kick(1.2), ce.lid.kick(4));
          },
        ],
        [
          xJ.panic + 0.16,
          () => {
            he.flight === `home` && dt(he, `huh`, 0.85);
          },
        ],
        [ge.plan.go, () => gt(ge)],
        [he.plan.go, () => gt(he)],
        [xJ.rings[1], () => Yq.ring(lt())],
        [
          1.32,
          mt(() => {
            (ce.lift.kick(0.9), ce.squash.kick(-1.6));
          }),
        ],
        [xJ.grab, () => Yq.pickup(lt())],
        [xJ.hello, () => ut(`chu`)],
        [
          xJ.hello + 0.55,
          () => {
            he.flight === `home` && dt(he, `dots`, 1.1);
          },
        ],
        [xJ.ask, () => pt(`ask`)],
        [xJ.ask + 0.35, mt(() => ce.pitch.kick(1.2))],
        [
          xJ.reply,
          () => {
            (ut(Ze ? `hehe` : `hm`),
              !ct() && (Ze ? ce.squash.kick(2.2) : ce.roll.kick(-1.2)));
          },
        ],
        [xJ.ramble, () => pt(`ramble`)],
        [xJ.ramble + 0.4, mt(() => ce.pitch.kick(1.4))],
        [xJ.ramble + 0.9, mt(() => ce.pitch.kick(1.2))],
        [
          xJ.tune,
          () => {
            (ut(Ze ? `note` : `heart`, xJ.cross - xJ.tune),
              !ct() && ce.roll.kick(1.4));
          },
        ],
        [xJ.tune + 0.3, mt(() => ce.roll.kick(-1.6))],
        [
          xJ.cross,
          () => {
            (pt(`cross`),
              ce.lid.kick(4),
              !ct() && (ce.squash.kick(-2.4), ce.puff.kick(0.8)));
          },
        ],
        [
          xJ.slam,
          () => {
            (Yq.busy(lt()), ce.lid.kick(2), ct() || ce.squash.kick(-0.9));
          },
        ],
        [
          xJ.huh,
          () => {
            (ut(`huh`),
              ce.lid.kick(3),
              !ct() && (ce.squash.kick(1.6), ce.puff.kick(1)));
          },
        ],
        [
          xJ.hangup + CJ,
          () => {
            (Yq.hangup(lt()), (k = 0), ct() || ce.puff.kick(0.8));
          },
        ],
        [
          xJ.shrug,
          () => {
            (ut(`dots`, 1.1),
              !ct() && (ce.wingL.kick(5), ce.squash.kick(-1.4)));
          },
        ],
      ];
    _t.sort((e, t) => e[0] - t[0]);
    let vt = () => {
        ((Je = 0), (et = 0), (Ze = 1 - Ze), (tt = 0), (Qe = 0));
      },
      yt = (e) => {
        for (let t of xJ.rings)
          for (let n = 0; n < xJ.burst.length; n += 2) {
            let r = t + xJ.burst[n],
              i = t + xJ.burst[n + 1];
            if (e >= r && e < i) return Math.min(1, (e - r) * 20, (i - e) * 20);
          }
        return 0;
      },
      bt = () => {
        ((Je = -1), (Ye = OJ), (Qe = 0), fe.clear());
        for (let e of we) e.visible = !1;
        (S.position.set(0, 0, 0),
          (S.rotation.z = 0),
          ce.rest(),
          ce.root.position.copy(le),
          ce.pose(0, ot, !0));
        for (let e of _e)
          (e.say.clear(),
            e.p.rest(),
            e.p.yaw.snap(e.rest),
            e.p.root.position.copy(e.at),
            (e.p.root.visible = !0),
            (e.jumpAt = -9),
            (e.flight = `home`),
            (e.t = 0),
            (e.landed = -9),
            e.p.pose(0, ot, !0));
        (oe.position.copy(Ae.p),
          oe.quaternion.copy(Ae.q),
          (O.mode = `idle`),
          (ie.lit = 1),
          ie.frame++,
          xt(),
          Hq.release());
      },
      xt = () => {
        (S.updateMatrix(),
          oe.updateMatrix(),
          Ie.copy(lJ.at).applyMatrix4(S.matrix),
          Le.copy(Fe).applyMatrix4(oe.matrix),
          se.set(Ie, Le));
      },
      St = (e, t, n, r) => {
        (ot > t.at &&
          ((t.at = ot + _Y(1.6, 3.4)),
          (t.yaw = n + _Y(-0.5, 0.5)),
          (t.pitch = _Y(-0.12, 0.16)),
          !r && Math.random() < 0.2 && e.lift.kick(0.8)),
          (e.yaw.target = at ? 0 : t.yaw),
          (e.pitch.target = at ? -0.1 : t.pitch));
      },
      Ct = (e, t, n, r, i, a) => {
        let o = e.p;
        if ((o.settle(), e.flight === `out` || e.flight === `back`)) {
          let t = e.flight === `out`;
          e.t += !t && n && Je < xJ.hangup ? -a * 1.4 : a;
          let r = gY(e.t / (t ? e.plan.outS : e.plan.backS));
          (t ? e.out : e.back).getPointAt(
            t ? hY.in(r) * 0.6 + r * 0.4 : hY.out(r),
            Ge,
          );
          let i = Ge.x - o.root.position.x,
            s = Ge.z - o.root.position.z;
          (i * i + s * s > 1e-8 && (o.yaw.target = Math.atan2(i, s)),
            o.root.position.copy(Ge),
            (o.pitch.target = 0.45),
            (o.flap = t || r < 0.9 ? 1 : 0.5),
            (t ? r >= 1 : e.t <= 0)
              ? ((e.flight = `away`),
                (e.t = 0),
                (o.root.visible = !1),
                e.say.clear())
              : !t &&
                r >= 1 &&
                ((e.flight = `home`),
                (e.t = 0),
                o.root.position.copy(e.at),
                (o.flap = 0),
                o.squash.kick(-1.8),
                (o.yaw.target = e.rest),
                (e.landed = ot)));
        } else if (e.flight === `away`)
          n
            ? (e.t = 0)
            : (e.t += i) > e.plan.wait &&
              ((e.flight = `back`),
              (e.t = 0),
              e.back.getPointAt(0, Ge),
              e.back.getTangentAt(0, Ke),
              o.root.position.copy(Ge),
              o.yaw.snap(Math.atan2(Ke.x, Ke.z)),
              (o.root.visible = !0),
              Yq.flap(lt() * 0.6));
        else {
          o.flap = 0;
          let i = Math.sign(l - e.at.x) * 0.55;
          if (r && n && Je >= xJ.panic && Je < xJ.grab)
            (Je - xJ.panic > 0.35 &&
              ((o.lid.target = 0.12), (o.squash.target = -0.18)),
              (o.yaw.target = e.rest * 0.5),
              (o.puff.target = 0.12));
          else if (r && n && Je < xJ.hangup + CJ) {
            let e = gY((Je - xJ.grab) / 4);
            ((o.puff.target = 0.12 * (1 - e)),
              (o.lid.target = 1.2),
              (o.yaw.target = i),
              (o.pitch.target = 0.32));
          } else
            n && Je >= xJ.panic && Je < e.plan.go + 0.2
              ? ((o.lid.target = 1.25), (o.flap = 1))
              : t.flight === `home` && ot - Math.max(e.landed, t.landed) < 1.6
                ? ((o.yaw.target = Math.sign(t.at.x - e.at.x) * 0.9),
                  (o.pitch.target = 0))
                : St(o, e.look, e.rest, r);
          let a = (ot - e.jumpAt) / 0.3;
          o.root.position.set(
            e.at.x,
            e.at.y + (a < 1 ? Math.sin(Math.PI * a) * 0.09 : 0),
            e.at.z,
          );
        }
        (o.root.visible && o.pose(a, ot, r),
          e.say.at.addVectors(e.at, e.sayOff),
          e.say.update(a, ot, r, e.flight === `home` ? o.hop : 0));
      };
    return (
      bt(),
      Object.assign(
        {
          hits: [Oe],
          update(e, n, r) {
            if (((ot = r), !n)) {
              bt();
              return;
            }
            let i = ct(),
              a = Math.min(e, 0.05);
            Xe = t.talking() ? 0 : Xe + e;
            let o = t.waiting(),
              s = o >= 0 && o < AJ,
              c = Hq.listen(e) || Xe < 0.8 || s;
            for (
              Je < 0
                ? (t.focus() < 0.05
                    ? (Ye = OJ)
                    : s
                      ? (Ye = Math.max(Ye, OJ))
                      : t.focus() > 0.9 && !c && (Ye -= e),
                  Ye <= 0 && vt())
                : (Je += e);
              Je >= 0 && et < _t.length && Je >= _t[et][0];
            )
              _t[et++][1]();
            Je >= xJ.end && ((Je = -1), (Ye = _Y(kJ[0], kJ[1])));
            let l = Je >= 0,
              u = l && Je >= xJ.grab && Je < xJ.slam,
              d = l && Je >= xJ.slam && Je < xJ.hangup;
            (u && ($e = Math.max(0, (Je - xJ.grab) | 0)),
              l && Je >= xJ.hangup + CJ ? (Qe = 2.2) : l || (Qe -= e));
            let f = !1;
            if (u)
              for (let e = 0; e < wJ.length; e += 2)
                Je >= wJ[e] && Je < wJ[e + 1] && (f = !0);
            let p = l ? yt(Je) : 0,
              m = i ? 0 : p;
            (S.position.set(
              Math.sin(r * 95) * 0.003 * m,
              Math.abs(Math.sin(r * 47)) * 0.006 * m,
              0,
            ),
              (S.rotation.z = Math.sin(r * 71) * 0.01 * m));
            let h = ((r * 9) | 0) % 2;
            ((we[0].visible = p > 0 && (i || h === 0)),
              (we[1].visible = p > 0 && (i || h === 1)));
            let g = ce;
            g.settle();
            let _ = 0;
            if (
              (!l || Je >= xJ.hangup + CJ
                ? St(g, it, 0.15, i)
                : Je < xJ.grab
                  ? ((g.yaw.target = -0.55),
                    (g.pitch.target = 0.3),
                    (g.roll.target = 0.12))
                  : Je < xJ.cross
                    ? ((g.yaw.target = 0.3),
                      (g.pitch.target = 0.06),
                      (g.roll.target = 0.16),
                      (_ = 2.1),
                      (g.talking = ft(xJ.hello) || ft(xJ.reply) || ft(xJ.tune)))
                    : Je < xJ.slam
                      ? ((g.yaw.target = 0.5),
                        (g.pitch.target = -0.12),
                        (g.roll.target = -0.18),
                        (g.lid.target = 1.25),
                        (_ = 1.5))
                      : Je < xJ.hangup
                        ? ((g.yaw.target = -0.45),
                          (g.pitch.target = 0.12),
                          (_ = 1.3),
                          (g.talking = ft(xJ.huh)),
                          Je >= xJ.huh &&
                            ((g.peek.target = 1), (g.lid.target = 1.3)))
                        : ((g.yaw.target = -0.4),
                          (g.pitch.target = 0.25),
                          (_ = 1.2)),
              ot < tt &&
                Je >= xJ.grab &&
                Je < xJ.cross &&
                ((g.yaw.target = 0),
                (g.pitch.target = -0.1),
                (g.peek.target = 0.7)),
              (g.wingR.target = _),
              g.root.position.set(
                le.x + S.position.x,
                le.y + S.position.y,
                le.z,
              ),
              g.pose(a, r, i),
              l && Je >= xJ.grab)
            ) {
              let e = hY.out(gY((Je - xJ.cross) / 0.14)),
                t = hY.inOut(gY((Je - xJ.slam - 0.15) / 0.35));
              (Pe.p.lerpVectors(je.p, Me.p, e).lerp(Ne.p, t),
                Pe.q.slerpQuaternions(je.q, Me.q, e).slerp(Ne.q, t));
            }
            if (!l || Je < xJ.grab || Je >= xJ.hangup + CJ) {
              (Re.set(Ae.p.x + S.position.x, Ae.p.y + S.position.y, Ae.p.z),
                Be.copy(Ae.q));
              let e = i
                ? 0
                : Math.sin(r * 63) * p * 0.06 +
                  Math.max(0, 1 - k / 0.4) * Math.sin(k * 40) * 0.05;
              (e !== 0 && Be.multiply(He.setFromAxisAngle(We, e)),
                oe.position.copy(Re),
                oe.quaternion.copy(Be));
            } else if (Je < xJ.hangup) {
              qe(Pe, ze, Ve);
              let e = gY((Je - xJ.grab) / SJ);
              if (e < 1) {
                let t = i ? hY.inOut(e) : hY.back(e);
                (oe.position.lerpVectors(Ae.p, ze, t),
                  (oe.position.y += Math.sin(Math.PI * Math.min(1, e)) * 0.1),
                  oe.quaternion.slerpQuaternions(Ae.q, Ve, Math.min(1, t)));
              } else (oe.position.copy(ze), oe.quaternion.copy(Ve));
            } else {
              qe(Pe, Re, Be);
              let e = hY.inOut(gY((Je - xJ.hangup) / CJ));
              (oe.position.lerpVectors(Re, Ae.p, e),
                (oe.position.y += Math.sin(Math.PI * e) * 0.06),
                oe.quaternion.slerpQuaternions(Be, Ae.q, e));
            }
            ((k += e), xt(), fe.update(a, ot, i, g.hop));
            for (let t of _e) Ct(t, t === he ? ge : he, l, i, e, a);
            let v = 1;
            if (p > 0) v = h === 0 ? oJ.n : 0;
            else if (u)
              f
                ? (ot > nt &&
                    ((nt = ot + 0.07),
                    (rt =
                      Je >= xJ.cross
                        ? 6 + ((Math.random() * 3) | 0)
                        : 3 + ((Math.random() * 5) | 0))),
                  (v = rt))
                : (v = g.talking ? 2 : 1);
            else if (d) {
              let e = Je - xJ.slam - 0.16;
              v = e >= 0 && e < 1.5 && e % 0.5 < 0.27 ? 3 : 1;
            }
            v !== ie.lit && ((ie.lit = v), ie.frame++);
            let y = O,
              b = 0;
            if (l && Je < xJ.grab)
              ((y.mode = `ring`),
                (y.flash = ((Je * 6) | 0) % 2 == 1),
                (b = 1e6 + +!!y.flash));
            else if (u) ((y.mode = `call`), (y.secs = $e), (b = 2e6 + y.secs));
            else if (Qe > 0 || l)
              ((y.mode = `end`),
                (y.secs = $e),
                (y.flash = ((r * 1.6) | 0) % 2 == 0),
                (b = 3e6 + y.secs * 2 + +!!y.flash));
            else {
              y.mode = `idle`;
              let e = Date.now();
              ((y.clock = (((Math.floor(e / 6e4) - st) % 1440) + 1440) % 1440),
                (y.colon = ((e / 1e3) | 0) % 2 == 0),
                (b = y.clock * 2 + +!!y.colon));
            }
            y.frame = b;
          },
          hover(e) {
            let t = at;
            ((at = e !== null),
              at && !t && Je < 0 && !ct() && ce.lift.kick(0.9));
          },
          click() {
            Je < 0
              ? vt()
              : Je >= xJ.grab + SJ && Je < xJ.cross && ot >= tt
                ? ((tt = ot + 1.3),
                  fe.quiet && ut(`dots`, 1.1),
                  ct() || ce.squash.kick(-1.2))
                : Je >= xJ.cross &&
                  Je < xJ.hangup &&
                  !ct() &&
                  ce.squash.kick(-0.8);
          },
        },
        {
          debug: {
            call: () => Je,
            ring: vt,
            flight: () => {
              let [e, t] = [he.flight, ge.flight];
              return e === `home` && t === `home`
                ? `home`
                : e === `back` || t === `back`
                  ? `back`
                  : e === `out` || t === `out`
                    ? `out`
                    : e === `away` || t === `away`
                      ? `away`
                      : `home`;
            },
            flights: () => [he.flight, ge.flight],
            ends: () =>
              _e.flatMap((e) =>
                [e.out.points[e.out.points.length - 1], e.back.points[0]].map(
                  (e) => pe.localToWorld(e.clone()).toArray(),
                ),
              ),
            says: () => _e.map((e) => (e.sayOff === hJ ? `up` : `left`)),
          },
        },
      )
    );
  }
  var yY = {
    lift: 0,
    x: 0.62,
    maxScale: 0.68,
    edge: 0.16,
    ...$K,
  };
  var bY = 660 / 425;
  return {
    LJ,
    vY,
    yY,
    bY,
  };
}
