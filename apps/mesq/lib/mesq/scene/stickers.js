// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Matrix3,
  Matrix4,
  Mesh,
  MeshBasicNodeMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from "three/webgpu";
import { texture, uniform } from "three/tsl";
export function createStickersModule(
  scope,
  { paletteModule, ledPixelsModule },
) {
  const { paperWhite, blue, inkPurple, palette, LF, RF } = paletteModule;
  const {
    yV,
    One,
    kne,
    Ane,
    xV,
    SV,
    CV,
    wV,
    TV,
    EV,
    DV,
    OV,
    kV,
    AV,
    jV,
    MV,
    NV,
    PV,
    FV,
    IV,
    BV,
    VV,
    HV,
  } = ledPixelsModule;
  var UV = [
    {
      span: 1,
      shape: EV,
      base: palette.yellow,
      art: (e, t, n) => {
        (FV(e, t, n),
          NV(e, 12),
          e.beginPath(),
          e.arc(t / 2, n * 0.52, t * 0.2, 0.15 * Math.PI, 0.85 * Math.PI),
          e.stroke());
      },
    },
    {
      span: 1,
      shape: EV,
      base: palette.pink,
      art: (e, t, n) => {
        (IV(e, t, n),
          NV(e, 11),
          e.beginPath(),
          e.moveTo(t * 0.38, n * 0.66),
          e.quadraticCurveTo(t * 0.5, n * 0.58, t * 0.62, n * 0.66),
          e.stroke());
      },
    },
    {
      span: 1,
      shape: jV(5, 0.48),
      base: palette.yellow,
      art: (e, t, n) => FV(e, t, n, 0.52, 0.08, 0.03),
    },
    {
      span: 1,
      shape: MV,
      base: palette.hotPink,
    },
    {
      span: 1,
      shape: AV([
        [0.58, 0.1],
        [0.26, 0.56],
        [0.47, 0.56],
        [0.4, 0.9],
        [0.75, 0.42],
        [0.54, 0.42],
      ]),
      base: palette.orange,
    },
    {
      span: 2,
      shape: DV,
      base: palette.purple,
      art: (e, t, n) => PV(e, `HELLO!`, t / 2, n * 0.52, 82, palette.cream),
    },
    {
      span: 2,
      shape: DV,
      base: blue,
      art: (e, t, n) => PV(e, `mesq`, t / 2, n * 0.5, 92, paperWhite),
    },
    {
      span: 1,
      shape: AV([
        [0.5, 0.12],
        [0.9, 0.84],
        [0.1, 0.84],
      ]),
      base: palette.yellow,
      art: (e, t, n) => PV(e, `!`, t / 2, n * 0.6, 120, inkPurple),
    },
    {
      span: 1,
      shape: (e, t, n) => {
        (e.beginPath(),
          e.moveTo(t * 0.1, n * 0.5),
          e.quadraticCurveTo(t * 0.5, n * 0.08, t * 0.9, n * 0.5),
          e.quadraticCurveTo(t * 0.5, n * 0.92, t * 0.1, n * 0.5),
          e.closePath());
      },
      base: palette.cream,
      art: (e, t, n) => {
        ((e.fillStyle = blue),
          e.beginPath(),
          e.arc(t / 2, n / 2, t * 0.15, 0, Math.PI * 2),
          e.fill(),
          (e.fillStyle = inkPurple),
          e.beginPath(),
          e.arc(t / 2, n / 2, t * 0.07, 0, Math.PI * 2),
          e.fill());
      },
    },
    {
      span: 2,
      shape: OV(10),
      base: paperWhite,
      art: (e, t, n) => {
        e.fillStyle = inkPurple;
        let r = (n * 0.6) / 4;
        for (let i = 0; i < 4; i++)
          for (let a = 0; a < Math.floor((t - 60) / r); a++)
            (a + i) % 2 && e.fillRect(30 + a * r, n * 0.2 + i * r, r, r);
      },
    },
    {
      span: 1,
      shape: (e, t, n) => {
        (e.beginPath(),
          e.roundRect(t * 0.34, n * 0.08, t * 0.32, n * 0.84, t * 0.16));
      },
      base: paperWhite,
      art: (e, t, n) => {
        ((e.fillStyle = blue),
          e.beginPath(),
          e.roundRect(t * 0.34, n * 0.08, t * 0.32, n * 0.42, [
            t * 0.16,
            t * 0.16,
            0,
            0,
          ]),
          e.fill());
      },
    },
    {
      span: 1,
      shape: EV,
      base: inkPurple,
      art: (e, t, n) => {
        ((e.fillStyle = paperWhite),
          e.beginPath(),
          e.arc(t / 2, n * 0.46, t * 0.17, 0, Math.PI * 2),
          e.fill(),
          PV(e, `8`, t / 2, n * 0.48, 72, inkPurple));
      },
    },
    {
      span: 1,
      shape: EV,
      base: palette.lilac,
      art: (e, t, n) => PV(e, `?`, t / 2, n * 0.53, 130, inkPurple),
    },
    {
      span: 2,
      shape: OV(16),
      base: palette.lime,
      art: (e, t, n) => {
        (NV(e, 16),
          e.beginPath(),
          e.moveTo(t * 0.2, n / 2),
          e.lineTo(t * 0.78, n / 2),
          e.moveTo(t * 0.66, n * 0.34),
          e.lineTo(t * 0.8, n / 2),
          e.lineTo(t * 0.66, n * 0.66),
          e.stroke());
      },
    },
    {
      span: 1,
      shape: (e, t, n) => {
        (e.beginPath(),
          e.moveTo(t * 0.2, n * 0.86),
          e.lineTo(t * 0.2, n * 0.46),
          e.arc(t / 2, n * 0.46, t * 0.3, Math.PI, 0),
          e.lineTo(t * 0.8, n * 0.86));
        for (let r = 0; r < 3; r++)
          e.quadraticCurveTo(
            t * (0.75 - r * 0.2),
            n * 0.74,
            t * (0.6 - r * 0.2),
            n * 0.86,
          );
        e.closePath();
      },
      base: palette.cream,
      art: (e, t, n) => FV(e, t, n, 0.46, 0.1, 0.04),
    },
    {
      span: 1,
      shape: (e, t, n) => {
        e.beginPath();
        for (let r = 0; r < 6; r++) {
          let i = (r / 6) * Math.PI * 2;
          (e.moveTo(
            t / 2 + Math.cos(i) * t * 0.2 + t * 0.16,
            n / 2 + Math.sin(i) * n * 0.2,
          ),
            e.arc(
              t / 2 + Math.cos(i) * t * 0.2,
              n / 2 + Math.sin(i) * n * 0.2,
              t * 0.16,
              0,
              Math.PI * 2,
            ));
        }
      },
      base: palette.orange,
      art: (e, t, n) => {
        ((e.fillStyle = palette.yellow),
          e.beginPath(),
          e.arc(t / 2, n / 2, t * 0.13, 0, Math.PI * 2),
          e.fill(),
          FV(e, t, n, 0.49, 0.05, 0.022));
      },
    },
    {
      span: 2,
      shape: (e, t, n) => {
        (e.beginPath(),
          e.moveTo(t * 0.1, n * 0.5),
          e.quadraticCurveTo(t * 0.35, n * 0.16, t * 0.72, n * 0.42),
          e.lineTo(t * 0.9, n * 0.24),
          e.lineTo(t * 0.86, n * 0.5),
          e.lineTo(t * 0.9, n * 0.76),
          e.lineTo(t * 0.72, n * 0.58),
          e.quadraticCurveTo(t * 0.35, n * 0.84, t * 0.1, n * 0.5),
          e.closePath());
      },
      base: blue,
      art: (e, t, n) => {
        ((e.fillStyle = paperWhite),
          e.beginPath(),
          e.arc(t * 0.24, n * 0.46, n * 0.07, 0, Math.PI * 2),
          e.fill(),
          (e.fillStyle = blue),
          e.beginPath(),
          e.arc(t * 0.24, n * 0.46, n * 0.03, 0, Math.PI * 2),
          e.fill());
      },
    },
    {
      span: 1,
      shape: EV,
      base: palette.purple,
      art: (e, t, n) => {
        (NV(e, 10),
          (e.strokeStyle = palette.yellow),
          e.beginPath(),
          e.ellipse(t / 2, n / 2, t * 0.4, n * 0.1, -0.4, 0, Math.PI * 2),
          e.stroke());
      },
    },
    {
      span: 1,
      shape: jV(12, 0.72),
      base: palette.red,
      art: (e, t, n) => PV(e, `WOW`, t / 2, n * 0.52, 58, palette.cream),
    },
    {
      span: 2,
      shape: OV(8),
      base: paperWhite,
      art: (e, t, n) => {
        e.fillStyle = inkPurple;
        let r = t * 0.1;
        for (; r < t * 0.48;) {
          let t = 3 + Math.random() * 9;
          (e.fillRect(r, n * 0.28, t, n * 0.44),
            (r += t + 3 + Math.random() * 7));
        }
        PV(e, `1405`, t * 0.72, n * 0.5, 52, inkPurple, `mono`);
      },
    },
    {
      span: 1,
      shape: (e, t, n) => {
        (e.beginPath(),
          e.roundRect(t * 0.12, n * 0.16, t * 0.76, n * 0.52, n * 0.22),
          e.moveTo(t * 0.3, n * 0.6),
          e.lineTo(t * 0.24, n * 0.86),
          e.lineTo(t * 0.46, n * 0.64),
          e.closePath());
      },
      base: palette.cyan,
      art: (e, t, n) => PV(e, `hi`, t / 2, n * 0.43, 88, inkPurple),
    },
    {
      span: 1,
      shape: AV([
        [0.16, 0.14],
        [0.36, 0.3],
        [0.64, 0.3],
        [0.84, 0.14],
        [0.86, 0.66],
        [0.5, 0.88],
        [0.14, 0.66],
      ]),
      base: palette.lime,
      art: (e, t, n) => {
        (FV(e, t, n, 0.52, 0.14, 0.04),
          (e.fillStyle = palette.hotPink),
          e.beginPath(),
          e.arc(t / 2, n * 0.64, t * 0.035, 0, Math.PI * 2),
          e.fill());
      },
    },
    {
      span: 2,
      shape: OV(16),
      base: `#5b57ee`,
      art: (e, t, n) => {
        ((e.fillStyle = paperWhite),
          (e.font = TV(64, `sans`)),
          (e.textAlign = `left`),
          (e.textBaseline = `alphabetic`),
          e.fillText(`THREEJS`, t * 0.09, n * 0.47, t * 0.6),
          e.fillText(`CONF`, t * 0.09, n * 0.72, t * 0.6),
          HV(e, t * 0.82, n * 0.5, n * 0.21, 5));
      },
    },
    {
      span: 1,
      shape: EV,
      base: palette.red,
      art: (e, t, n) => {
        ((e.fillStyle = paperWhite),
          e.fillRect(t * 0.26, n * 0.43, t * 0.48, n * 0.14));
      },
    },
    {
      span: 2,
      shape: OV(6),
      base: palette.yellow,
      art: (e, t, n) => {
        (e.save(), e.clip(), (e.fillStyle = inkPurple));
        for (let r = -n; r < t; r += 44)
          (e.beginPath(),
            e.moveTo(r, n),
            e.lineTo(r + 22, n),
            e.lineTo(r + 22 + n, 0),
            e.lineTo(r + n, 0),
            e.fill());
        e.restore();
      },
    },
    {
      span: 1,
      shape: EV,
      base: palette.green,
      art: (e, t, n) => {
        ((e.fillStyle = paperWhite),
          e.beginPath(),
          e.moveTo(t * 0.42, n * 0.32),
          e.lineTo(t * 0.68, n * 0.5),
          e.lineTo(t * 0.42, n * 0.68),
          e.fill());
      },
    },
    {
      span: 1,
      shape: (e, t, n) => {
        (e.beginPath(),
          e.arc(t / 2, n * 0.5, t * 0.36, Math.PI, 0),
          e.lineTo(t * 0.62, n * 0.5),
          e.lineTo(t * 0.62, n * 0.84),
          e.lineTo(t * 0.38, n * 0.84),
          e.lineTo(t * 0.38, n * 0.5),
          e.closePath());
      },
      base: palette.red,
      art: (e, t, n) => {
        ((e.fillStyle = palette.cream),
          e.fillRect(t * 0.38, n * 0.5, t * 0.24, n * 0.34));
        for (let [r, i, a] of [
          [0.36, 0.34, 0.06],
          [0.6, 0.28, 0.05],
          [0.52, 0.42, 0.035],
        ])
          (e.beginPath(), e.arc(t * r, n * i, t * a, 0, Math.PI * 2), e.fill());
      },
    },
    {
      span: 1,
      shape: AV([
        [0.5, 0.1],
        [0.86, 0.42],
        [0.5, 0.9],
        [0.14, 0.42],
      ]),
      base: palette.cyan,
      art: (e, t, n) => {
        (NV(e, 6),
          e.beginPath(),
          e.moveTo(t * 0.14, n * 0.42),
          e.lineTo(t * 0.86, n * 0.42),
          e.moveTo(t * 0.5, n * 0.1),
          e.lineTo(t * 0.36, n * 0.42),
          e.lineTo(t * 0.5, n * 0.9),
          e.stroke());
      },
    },
    {
      span: 2,
      shape: OV(12),
      base: palette.teal,
      art: (e, t, n) => PV(e, `WALK →`, t / 2, n * 0.52, 70, paperWhite),
    },
    {
      span: 1,
      shape: (e, t, n) => {
        (e.beginPath(),
          e.ellipse(t / 2, n / 2, t * 0.38, n * 0.32, 0.3, 0, Math.PI * 2));
      },
      base: palette.teal,
      art: (e, t, n) => {
        (FV(e, t, n, 0.47, 0.1, 0.035),
          NV(e, 8),
          e.beginPath(),
          e.arc(t / 2, n * 0.55, t * 0.06, 0, Math.PI),
          e.stroke());
      },
    },
    {
      span: 1,
      shape: kV,
      base: palette.lilac,
      art: (e, t, n) => {
        e.fillStyle = inkPurple;
        for (let r = 0; r < 4; r++)
          e.fillRect(
            t * 0.28,
            n * (0.32 + r * 0.1),
            t * (0.44 - (r % 2) * 0.12),
            n * 0.04,
          );
      },
    },
    {
      span: 1,
      shape: jV(4, 0.28),
      base: palette.cream,
      art: (e, t, n) => FV(e, t, n, 0.5, 0.05, 0.022),
    },
    {
      span: 1,
      shape: (e, t, n) => {
        (e.beginPath(),
          e.ellipse(t / 2, n * 0.54, t * 0.3, n * 0.33, 0, 0, Math.PI * 2));
      },
      base: LF,
      art: (e, t, n) => {
        (FV(e, t, n, 0.46, 0.1, 0.03),
          (e.fillStyle = RF),
          e.beginPath(),
          e.ellipse(t / 2, n * 0.55, t * 0.07, n * 0.045, 0, 0, Math.PI * 2),
          e.fill());
      },
    },
    {
      span: 1,
      shape: (e, t, n) => {
        (e.beginPath(),
          e.arc(t / 2, n / 2, t * 0.34, Math.PI * 0.3, Math.PI * 1.7),
          e.arc(
            t * 0.62,
            n * 0.44,
            t * 0.27,
            Math.PI * 1.55,
            Math.PI * 0.42,
            !0,
          ),
          e.closePath());
      },
      base: palette.yellow,
      art: (e, t, n) => {
        (NV(e, 8),
          e.beginPath(),
          e.arc(t * 0.26, n * 0.46, t * 0.04, 0.1 * Math.PI, 0.9 * Math.PI),
          e.stroke());
      },
    },
    {
      span: 1,
      shape: kV,
      base: palette.purple,
      art: (e, t, n) => {
        ((e.fillStyle = paperWhite),
          (e.font = TV(84, `sans`)),
          (e.textAlign = `center`),
          (e.textBaseline = `middle`),
          e.fillText(`TSL`, t / 2, n * 0.44, t * 0.72),
          (e.strokeStyle = paperWhite),
          (e.lineWidth = 9),
          (e.lineCap = `round`),
          e.beginPath());
        for (let r = 0; r <= 24; r++) {
          let i = t * (0.24 + (0.52 * r) / 24),
            a = n * (0.69 + 0.035 * Math.sin((r / 24) * Math.PI * 3));
          r ? e.lineTo(i, a) : e.moveTo(i, a);
        }
        e.stroke();
      },
    },
    {
      span: 1,
      shape: (e, t, n) => {
        (e.beginPath(),
          e.moveTo(t * 0.5, n * 0.1),
          e.bezierCurveTo(
            t * 0.86,
            n * 0.42,
            t * 0.84,
            n * 0.88,
            t * 0.5,
            n * 0.88,
          ),
          e.bezierCurveTo(
            t * 0.16,
            n * 0.88,
            t * 0.18,
            n * 0.5,
            t * 0.36,
            n * 0.36,
          ),
          e.quadraticCurveTo(t * 0.4, n * 0.5, t * 0.46, n * 0.5),
          e.closePath());
      },
      base: palette.orange,
      art: (e, t, n) => {
        ((e.fillStyle = palette.yellow),
          e.beginPath(),
          e.ellipse(t / 2, n * 0.7, t * 0.14, n * 0.15, 0, 0, Math.PI * 2),
          e.fill());
      },
    },
    {
      span: 2,
      shape: OV(14),
      base: inkPurple,
      art: (e, t, n) => PV(e, `KEEP GOING`, t / 2, n * 0.52, 58, palette.lime),
    },
    {
      span: 1,
      shape: One,
      base: yV,
      art: (e, t, n) => kne(e, t, n, paperWhite),
    },
    {
      span: 2,
      shape: DV,
      base: yV,
      art: (e, t, n) =>
        Ane(
          e,
          t,
          n,
          (e, t) => `${t} ${e}px Manrope, system-ui, sans-serif`,
          paperWhite,
        ),
    },
    {
      span: 1,
      shape: BV,
      base: palette.yellow,
      art: VV,
    },
    {
      span: 1,
      shape: EV,
      base: `#c7b9ff`,
      art: (e, t, n) => HV(e, t / 2, n / 2, Math.min(t, n) / 2, 9),
    },
  ];
  var WV = UV.length;
  var GV = {
    22: [6, 36],
    34: [2, 31],
  };
  var KV = 2;
  var qV = {
    17: [0, 15],
    27: [2, 31],
  };
  var JV = {};
  function YV(e) {
    let t = qV[e];
    t && (e = t[((JV[e] = (JV[e] ?? 0) + 1) - 1) % t.length]);
    let n = GV[e];
    if (!n) return e;
    let r = (JV[e] = (JV[e] ?? 0) + 1) - 1;
    return r % KV === 0 ? e : n[(r >> 1) % n.length];
  }
  function XV(e) {
    let t = {
      ...JV,
    };
    try {
      return e();
    } finally {
      for (let e of Object.keys(JV)) delete JV[+e];
      Object.assign(JV, t);
    }
  }
  function ZV(e, t) {
    if (!t(e)) return e;
    for (let n = 1; n < 37; n++) {
      let r = (e + n) % 37;
      if (UV[r].span === UV[e].span && !GV[r] && !qV[r] && !t(r)) return r;
    }
    return e;
  }
  var QV = wV / xV;
  function $V(e, t, n, r, i) {
    (e.save(),
      t(e),
      (e.lineJoin = `round`),
      (e.strokeStyle = paperWhite),
      (e.lineWidth = r * 2),
      e.stroke(),
      (e.fillStyle = paperWhite),
      e.fill(),
      t(e),
      (e.fillStyle = n),
      e.fill(),
      i && (e.save(), t(e), e.clip(), i(e), e.restore()),
      e.restore());
  }
  var eH = null;
  function tH() {
    if (eH) return eH;
    let e = scope.element(`canvas`);
    ((e.width = xV * SV), (e.height = xV * CV));
    let t = e.getContext(`2d`),
      n = [],
      r = 0,
      i = 0,
      a = new Set();
    for (let o of UV) {
      r + o.span > SV && ((r = 0), i++);
      let s = r,
        c = i;
      if (i >= CV) {
        let e = [...Array(56).keys()].find(
          (e) =>
            e % SV <= SV - o.span &&
            [...Array(o.span).keys()].every((t) => !a.has(e + t)),
        );
        if (e === void 0) throw Error(`stickers: the sheet is full`);
        ((s = e % SV), (c = Math.floor(e / SV)));
      } else r += o.span;
      for (let e = 0; e < o.span; e++) a.add(c * SV + s + e);
      let l = s * xV,
        u = c * xV,
        d = xV * o.span,
        f = xV;
      (t.save(), t.translate(l, u));
      let p = o.art;
      ($V(t, (e) => o.shape(e, d, f), o.base, wV, p && ((e) => p(e, d, f))),
        t.restore(),
        n.push({
          u0: l / e.width,
          u1: (l + d) / e.width,
          v0: 1 - (u + f) / e.height,
          v1: 1 - u / e.height,
          aspect: o.span,
        }));
    }
    let o = new CanvasTexture(e);
    return (
      (o.colorSpace = SRGBColorSpace),
      (o.anisotropy = 8),
      (eH = {
        canvas: e,
        texture: o,
        cells: n,
      }),
      eH
    );
  }
  function nH(e) {
    let { canvas: t, cells: n } = tH(),
      r = n[((e % n.length) + n.length) % n.length];
    return {
      x: r.u0 * t.width,
      y: (1 - r.v1) * t.height,
      w: (r.u1 - r.u0) * t.width,
      h: (r.v1 - r.v0) * t.height,
      aspect: r.aspect,
    };
  }
  function rH(e, t, n, r, i, a = 0) {
    let { canvas: o, cells: s } = tH(),
      c = s[t % s.length],
      l = (c.u1 - c.u0) * o.width,
      u = (c.v1 - c.v0) * o.height,
      d = i * c.aspect;
    (e.save(),
      e.translate(n, r),
      e.rotate(a),
      e.drawImage(
        o,
        c.u0 * o.width,
        (1 - c.v1) * o.height,
        l,
        u,
        -d / 2,
        -i / 2,
        d,
        i,
      ),
      e.restore());
  }
  function iH(e) {
    return tH().cells[((e % WV) + WV) % WV].aspect;
  }
  var aH = 7;
  var oH = () => {
    aH = (aH + 1831565813) | 0;
    let e = Math.imul(aH ^ (aH >>> 15), 1 | aH);
    return (
      (e = (e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ e),
      ((e ^ (e >>> 14)) >>> 0) / 4294967296
    );
  };
  var sH = (e, t) => e + oH() * (t - e);
  var cH = (e) => Math.floor(oH() * e);
  function withRandomSeed(e, t = 24301) {
    let n = aH;
    aH = t;
    try {
      return e();
    } finally {
      aH = n;
    }
  }
  var uH = null;
  var dH = null;
  var fH = null;
  function pH(e, t) {
    ((uH = e), (dH = t.solid), (fH = t.print));
  }
  var Z = (e = 0, t = 0, n = 0) => new Vector3(e, t, n);
  var mH = (e) => uH.rect(e);
  function createPart(e, t, n, r = `white`) {
    let i = new Mesh(e, r === `atlas` ? fH : dH);
    return (
      (i.userData.part = !0),
      (i.userData.tint = t),
      (i.userData.uvMode = r),
      n?.add(i),
      i
    );
  }
  var hH = new Map();
  function $(e, t) {
    let n = hH.get(e);
    return (n || hH.set(e, (n = t())), n);
  }
  var gH = Z(0, 1, 0);
  var _H = Z();
  function vH(e, t, n) {
    return (
      e.position.addVectors(t, n).multiplyScalar(0.5),
      e.quaternion.setFromUnitVectors(gH, _H.subVectors(n, t).normalize()),
      e
    );
  }
  function yH(e, t, n, r, i, a = 12) {
    return vH(
      createPart(new CylinderGeometry(r, r, t.distanceTo(n), a, 1), i, e),
      t,
      n,
    );
  }
  function bH(e, t, n, r, i = 10) {
    let a = createPart(
      $(
        `ball:${n}:${i}`,
        () => new SphereGeometry(n, i, Math.max(4, Math.round(i * 0.6))),
      ),
      r,
      e,
    );
    return (a.position.copy(t), a);
  }
  function xH(e, t, n, r, i = 0.022) {
    let a = createPart(
      $(`bolt:${i}`, () => new CylinderGeometry(i, i, 0.018, 6)),
      r,
      e,
    );
    return (
      a.quaternion.setFromUnitVectors(gH, n),
      a.position.copy(t).addScaledVector(n, 0.004),
      a
    );
  }
  function SH(e, t, n) {
    let r = new Shape(),
      i = -e / 2,
      a = -t / 2;
    return (
      r.moveTo(i + n, a),
      r.lineTo(i + e - n, a),
      r.quadraticCurveTo(i + e, a, i + e, a + n),
      r.lineTo(i + e, a + t - n),
      r.quadraticCurveTo(i + e, a + t, i + e - n, a + t),
      r.lineTo(i + n, a + t),
      r.quadraticCurveTo(i, a + t, i, a + t - n),
      r.lineTo(i, a + n),
      r.quadraticCurveTo(i, a, i + n, a),
      r
    );
  }
  function CH(e, t) {
    let n = new Shape(),
      r = e.length;
    for (let i = 0; i < r; i++) {
      let a = e[(i + r - 1) % r],
        o = e[i],
        s = e[(i + 1) % r],
        c = o.clone().add(a.clone().sub(o).setLength(t)),
        l = o.clone().add(s.clone().sub(o).setLength(t));
      (i === 0 ? n.moveTo(c.x, c.y) : n.lineTo(c.x, c.y),
        n.quadraticCurveTo(o.x, o.y, l.x, l.y));
    }
    return (n.closePath(), n);
  }
  function mapAtlasUV(e, t) {
    let n = e.attributes.uv;
    for (let e = 0; e < n.count; e++)
      n.setXY(
        e,
        t.u0 + n.getX(e) * (t.u1 - t.u0),
        t.v0 + n.getY(e) * (t.v1 - t.v0),
      );
    return e;
  }
  function TH(e) {
    e.computeBoundingBox();
    let t = e.boundingBox,
      n = e.attributes.position,
      r = e.attributes.uv;
    for (let e = 0; e < r.count; e++)
      r.setXY(
        e,
        (n.getX(e) - t.min.x) / (t.max.x - t.min.x),
        (n.getY(e) - t.min.y) / (t.max.y - t.min.y),
      );
    return e;
  }
  var EH = 0.02;
  function DH(e, t, n, r, i, a = 0.05) {
    let o = new Group(),
      s = new ExtrudeGeometry(t, {
        depth: a,
        bevelEnabled: !0,
        bevelSize: EH,
        bevelThickness: EH,
        bevelSegments: 2,
        curveSegments: 16,
      });
    createPart(s, r, o).position.z = -a / 2;
    let c = mapAtlasUV(TH(new ShapeGeometry(n, 16)), uH.rect(i));
    return (
      (createPart(c, `#ffffff`, o, `atlas`).position.z = a / 2 + EH + 0.004),
      e.add(o),
      o
    );
  }
  function OH(e, t, n, r = 0.05, i = 0.6) {
    let a = mapAtlasUV(TH(new ShapeGeometry(t, 16)), uH.rect(n)),
      o = uniform(0),
      s = texture(uH.texture),
      c = new MeshBasicNodeMaterial({
        transparent: !0,
        depthWrite: !1,
        blending: 2,
      });
    ((c.colorNode = s.rgb),
      (c.opacityNode = s.a.mul(o).mul(0.85)),
      Object.assign(c, {
        emissiveNode: s.rgb.mul(s.a).mul(o).mul(i),
      }));
    let l = new Mesh(a, c);
    return (
      (l.position.z = r / 2 + EH + 0.008),
      e.add(l),
      Object.assign(l, {
        level: o,
      })
    );
  }
  function kH(e, t, n) {
    let r = [];
    for (let i = Math.ceil(e / n) * n; i < t; i += n) i > e && r.push(i);
    return r;
  }
  function AH(e, t, n) {
    let r = Z().crossVectors(t, n).normalize();
    return {
      at(i, a, o, s, c) {
        (s
          .copy(e)
          .addScaledVector(t, i)
          .addScaledVector(n, a)
          .addScaledVector(r, o),
          c.copy(r));
      },
    };
  }
  function jH(e, t, n, r, i) {
    return {
      at(a, o, s, c, l) {
        let u = o / i;
        (l.copy(n).multiplyScalar(Math.cos(u)).addScaledVector(r, Math.sin(u)),
          c
            .copy(e)
            .addScaledVector(t, a)
            .addScaledVector(l, i + s));
      },
      cutsV: (e, t) => kH(e, t, (i * Math.PI) / 10),
    };
  }
  function MH(e, t, n = 0) {
    let r = Math.PI / t,
      i = 2 * e * Math.tan(r);
    return {
      at(t, a, o, s, c) {
        let l = t / i,
          u = Math.floor(l),
          d = l - u,
          f = (e + o) / Math.cos(r),
          p = u * 2 * r + n,
          m = p + 2 * r,
          h = Math.sin(p) * f,
          g = Math.cos(p) * f;
        (s.set(h + (Math.sin(m) * f - h) * d, a, g + (Math.cos(m) * f - g) * d),
          c.set(Math.sin(p + r), 0, Math.cos(p + r)));
      },
      cutsU: (e, t) => kH(e, t, i),
    };
  }
  function NH(e, t, n, r) {
    let i = [];
    for (let a = 0; a < e.length; a++) {
      let o = e[a],
        s = e[(a + 1) % e.length],
        c = r * (o[t] - n),
        l = r * (s[t] - n);
      if ((c >= 0 && i.push(o), c >= 0 != l >= 0)) {
        let e = c / (c - l),
          r = {
            u: o.u + (s.u - o.u) * e,
            v: o.v + (s.v - o.v) * e,
            s: o.s + (s.s - o.s) * e,
            t: o.t + (s.t - o.t) * e,
          };
        ((r[t] = n), i.push(r));
      }
    }
    return i;
  }
  function PH(e, t, n) {
    if (!n) return e;
    let r = [];
    for (let i of e) {
      let e = 1 / 0,
        a = -1 / 0;
      for (let n of i) ((e = Math.min(e, n[t])), (a = Math.max(a, n[t])));
      let o = n(e, a);
      if (!o.length) {
        r.push(i);
        continue;
      }
      let s = [e, ...o, a];
      for (let e = 0; e < s.length - 1; e++) {
        let n = NH(NH(i, t, s[e], 1), t, s[e + 1], -1);
        n.length >= 3 && r.push(n);
      }
    }
    return r;
  }
  var FH = Z();
  var IH = Z();
  function LH(e, t, n, r, i, a, o, s, c = 0.004) {
    let l = Math.cos(o),
      u = Math.sin(o),
      d = PH(
        PH(
          [
            [
              [-0.5, -0.5],
              [0.5, -0.5],
              [0.5, 0.5],
              [-0.5, 0.5],
            ].map(([e, t]) => ({
              u: n + e * i * l - t * a * u,
              v: r + e * i * u + t * a * l,
              s: e,
              t,
            })),
          ],
          `u`,
          t.cutsU,
        ),
        `v`,
        t.cutsV,
      ),
      f = [],
      p = [],
      m = [],
      h = [];
    for (let e of d) {
      let n = f.length / 3;
      for (let n of e)
        (t.at(n.u, n.v, c, FH, IH),
          f.push(FH.x, FH.y, FH.z),
          p.push(IH.x, IH.y, IH.z),
          m.push(
            s.u0 + (n.s + 0.5) * (s.u1 - s.u0),
            s.v0 + (n.t + 0.5) * (s.v1 - s.v0),
          ));
      for (let t = 1; t < e.length - 1; t++) h.push(n, n + t, n + t + 1);
    }
    let g = new BufferGeometry();
    (g.setAttribute(`position`, new Float32BufferAttribute(f, 3)),
      g.setAttribute(`normal`, new Float32BufferAttribute(p, 3)),
      g.setAttribute(`uv`, new Float32BufferAttribute(m, 2)),
      g.setIndex(h));
    let _ = createPart(g, `#ffffff`, e, `atlas`);
    return ((_.name = `Sticker`), _);
  }
  function RH(e, t, n, r, i, a, o, s = 0.004) {
    return LH(e, t, n, r, a * iH(i), a, o, uH.sticker(i), s);
  }
  function zH(e, t, n, r, i, a, o, s = 0.003) {
    let c = LH(e, t, n, r, i, a, 0, uH.rect(o), s);
    return ((c.name = `Tape`), c);
  }
  var BH = 0.0016;
  function VH(e, t, n) {
    let r = n.spots ?? [],
      i = 0;
    for (let a = 0; a < n.count * 16 && i < n.count; a++) {
      let a = YV(cH(37)),
        o = iH(a),
        s = sH(n.size[0], n.size[1]),
        c = o > 1 ? sH(-0.35, 0.35) : sH(-0.6, 0.6),
        l = Math.abs(Math.cos(c)),
        u = Math.abs(Math.sin(c)),
        d = (o * s * l + s * u) / 2,
        f = (o * s * u + s * l) / 2,
        p = Math.min(1, n.hw / d, n.hh / f) * 0.98;
      if ((p < 1 && ((s *= p), (d *= p), (f *= p)), s < n.size[0] * 0.6))
        continue;
      let m = sH(-n.hw + d, n.hw - d),
        h = sH(-n.hh + f, n.hh - f),
        g = Math.hypot(o * s, s) * 0.42;
      if (n.avoid?.(m, h, g)) continue;
      let _ = 0,
        v = !0;
      for (let e of r) {
        let t = Math.hypot(e.u - m, e.v - h);
        if (t < (e.r + g) * 0.62) {
          v = !1;
          break;
        }
        t < e.r + g && (_ = Math.max(_, e.layer + 1));
      }
      if (!v || _ > 2) continue;
      let y = ZV(a, (e) =>
        r.some(
          (t) => t.i === e && Math.hypot(t.u - m, t.v - h) < (t.r + g) * 2,
        ),
      );
      (r.push({
        u: m,
        v: h,
        r: g,
        layer: _,
        i: y,
      }),
        RH(e, t, m, h, y, s, c, (n.lift ?? 0.004) + _ * BH),
        i++);
    }
    return r;
  }
  var HH = new Map();
  var UH = (e) => {
    let t = HH.get(e);
    return (t || HH.set(e, (t = new Color(e))), t);
  };
  function WH(e, t, n = new Matrix4()) {
    n.identity();
    for (let r = e; r && r !== t; r = r.parent)
      (r.updateMatrix(), n.premultiply(r.matrix));
    return n;
  }
  var GH = Z();
  var KH = new Matrix3();
  function qH(e, t) {
    let n = 0,
      r = 0;
    for (let { mesh: t } of e) {
      let e = t.geometry;
      ((n += e.attributes.position.count),
        (r += e.index ? e.index.count : e.attributes.position.count));
    }
    let i = new Float32Array(n * 3),
      a = new Float32Array(n * 3),
      o = t ? new Float32Array(n * 2) : null,
      s = new Float32Array(n * 3),
      c = n > 65535 ? new Uint32Array(r) : new Uint16Array(r),
      l = uH.white,
      u = 0,
      d = 0;
    for (let { mesh: t, matrix: n } of e) {
      let e = t.geometry,
        r = e.attributes.position,
        f = e.attributes.normal,
        p = e.attributes.uv,
        m = t.userData.uvMode !== `atlas` || !p,
        h = UH(t.userData.tint ?? `#ffffff`);
      KH.getNormalMatrix(n);
      for (let e = 0; e < r.count; e++) {
        let t = u + e;
        (GH.fromBufferAttribute(r, e).applyMatrix4(n),
          (i[t * 3] = GH.x),
          (i[t * 3 + 1] = GH.y),
          (i[t * 3 + 2] = GH.z),
          f
            ? GH.fromBufferAttribute(f, e).applyMatrix3(KH).normalize()
            : GH.set(0, 1, 0),
          (a[t * 3] = GH.x),
          (a[t * 3 + 1] = GH.y),
          (a[t * 3 + 2] = GH.z),
          o &&
            ((o[t * 2] = m ? l.x : p.getX(e)),
            (o[t * 2 + 1] = m ? l.y : p.getY(e))),
          (s[t * 3] = h.r),
          (s[t * 3 + 1] = h.g),
          (s[t * 3 + 2] = h.b));
      }
      let g = n.determinant() < 0,
        _ = e.index ? e.index.count : r.count;
      for (let t = 0; t < _; t += 3) {
        let n = e.index ? e.index.getX(t) : t,
          r = e.index ? e.index.getX(t + 1) : t + 1,
          i = e.index ? e.index.getX(t + 2) : t + 2;
        ((c[d++] = u + n),
          (c[d++] = u + (g ? i : r)),
          (c[d++] = u + (g ? r : i)));
      }
      u += r.count;
    }
    let f = new BufferGeometry();
    return (
      f.setAttribute(`position`, new BufferAttribute(i, 3)),
      f.setAttribute(`normal`, new BufferAttribute(a, 3)),
      o && f.setAttribute(`uv`, new BufferAttribute(o, 2)),
      f.setAttribute(`color`, new BufferAttribute(s, 3)),
      f.setIndex(new BufferAttribute(c, 1)),
      f.computeBoundingSphere(),
      f
    );
  }
  function bakeStaticGeometry(e, t, n = !1) {
    let r = [],
      i = [],
      a = [],
      o = (e, t) => {
        for (let s of e.children) {
          if (s.userData.bakeSkip) continue;
          s.updateMatrix();
          let e = new Matrix4().multiplyMatrices(t, s.matrix),
            c = s;
          if (c.isMesh && c.userData.part) {
            let t = {
              mesh: c,
              matrix: e,
            };
            (r.push(t),
              (n || (c.userData.uvMode === `atlas` && c.geometry.attributes.uv)
                ? a
                : i
              ).push(t));
          }
          o(s, e);
        }
      };
    if ((o(e, new Matrix4()), !r.length)) return [];
    let s = [];
    if (i.length) {
      let e = new Mesh(qH(i, !1), dH);
      ((e.name = `${t}_Static`),
        (e.castShadow = e.receiveShadow = !0),
        s.push(e));
    }
    if (a.length) {
      let e = new Mesh(qH(a, !0), fH);
      ((e.name = n ? t : `${t}_Print`),
        (e.castShadow = n),
        (e.receiveShadow = !0),
        s.push(e));
    }
    let c = new Set(r.map((e) => e.mesh));
    for (let e = r.length - 1; e >= 0; e--) {
      let t = r[e].mesh;
      for (let e of [...t.children])
        c.has(e) || (e.applyMatrix4(t.matrix), t.parent.add(e));
    }
    for (let { mesh: e } of r) e.removeFromParent();
    return (YH(e), e.add(...s), s);
  }
  function YH(e) {
    for (let t = e.children.length - 1; t >= 0; t--) {
      let n = e.children[t];
      n.userData.bakeSkip ||
        n.userData.keep ||
        (YH(n),
        (n.type === `Group` || n.type === `Object3D`) &&
          n.children.length === 0 &&
          e.remove(n));
    }
  }
  return {
    WV,
    YV,
    XV,
    ZV,
    QV,
    $V,
    tH,
    nH,
    rH,
    iH,
    oH,
    sH,
    cH,
    withRandomSeed,
    pH,
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
    EH,
    DH,
    OH,
    AH,
    jH,
    MH,
    LH,
    RH,
    zH,
    BH,
    VH,
    WH,
    bakeStaticGeometry,
  };
}
