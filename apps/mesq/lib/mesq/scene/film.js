// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  Group,
  MathUtils,
  Mesh,
  Shape,
  ShapeGeometry,
} from "three/webgpu";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export function createFilmModule(
  scope,
  {
    paletteModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
  },
) {
  const {
    paperWhite,
    polePurple,
    amber,
    shadowPurple,
    nightPurple,
    paleBlue,
    inkPurple,
    palette,
  } = paletteModule;
  const { WB } = dialogueModule;
  const { aV } = ledPixelsModule;
  const { Z, mH, createPart, $, xH, SH, TH, EH, DH, OH, AH, MH, LH, RH, VH } =
    stickersModule;
  const { XH, ZH } = signArtModule;
  var jU = (e, t, n) => {
    ((e.fillStyle = palette.green), e.fillRect(0, 0, t, n));
    let r = (0.516 / 0.96) * t,
      i = (0.3816 / 0.96) * t,
      a = (t - r) / 2,
      o = (n - i * 1.12) / 2;
    ((e.fillStyle = paperWhite),
      e.beginPath(),
      e.roundRect(a, o, r, i, r * 0.14),
      e.fill());
    for (let t of [0, 1])
      e.fillRect(a + r * (0.1 + t * 0.64), o + i * 0.96, r * 0.16, i * 0.16);
    ((e.fillStyle = palette.green),
      e.beginPath(),
      e.roundRect(a + r * 0.1, o + i * 0.13, r * 0.8, i * 0.42, r * 0.06),
      e.fill(),
      e.fillRect(a + r * 0.1, o + i * 0.82, r * 0.8, i * 0.05));
    for (let t of [0.24, 0.76])
      (e.beginPath(),
        e.arc(a + r * t, o + i * 0.69, r * 0.065, 0, Math.PI * 2),
        e.fill());
  };
  var MU = (e) => ({
    title: 0.1875,
    top: 0.2,
    row: 0.78 / Math.max(1, e),
  });
  function NU(e, t, n, r, i, a, o, s) {
    let c = t * 0.1,
      l = n + r / 2,
      u = i === a - 1,
      d = Math.min(r, (r / MU(a).row) * MU(4).row);
    e.fillStyle = palette.hotPink;
    let f = d * 0.2,
      p = i === 0 ? l : n;
    (e.fillRect(c - f / 2, p, f, (u ? l : n + r) - p),
      (e.fillStyle = s ? palette.hotPink : inkPurple),
      e.beginPath(),
      e.arc(c, l, d * 0.34, 0, Math.PI * 2),
      e.fill(),
      (e.fillStyle = s ? paperWhite : palette.cream),
      (e.font = ZH(d * 0.42)),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      e.fillText(String(i + 1), c, l + d * 0.02),
      (e.textAlign = `left`),
      (e.font = ZH(d * 0.78)),
      s && ((e.shadowBlur = d * 0.25), (e.shadowColor = palette.hotPink)),
      (e.fillStyle = s ? palette.hotPink : inkPurple),
      e.fillText(o, t * 0.17, l + d * 0.04, t * 0.8),
      (e.shadowBlur = 0));
  }
  function PU(e, t, n, r, i, a) {
    ((e.font = i), (e.textAlign = `left`), (e.textBaseline = `alphabetic`));
    let o = e.measureText(t),
      s =
        a === `center`
          ? n - (o.actualBoundingBoxRight - o.actualBoundingBoxLeft) / 2
          : n;
    e.fillText(
      t,
      s,
      r + (o.actualBoundingBoxAscent - o.actualBoundingBoxDescent) / 2,
    );
  }
  function FU(e) {
    return (t, n, r) => {
      let i = MU(e.length);
      ((t.fillStyle = palette.cream),
        t.fillRect(0, 0, n, r),
        (t.fillStyle = inkPurple));
      let a = r * i.title;
      t.fillRect(0, 0, n, a);
      let o = a / 2;
      ((t.fillStyle = palette.hotPink),
        t.beginPath(),
        t.arc(n * 0.1, o, a * 0.36, 0, Math.PI * 2),
        t.fill(),
        (t.fillStyle = paperWhite),
        PU(t, `E`, n * 0.1, o, XH(a * 0.5), `center`),
        PU(t, `EXPERIENCE`, n * 0.17, o, XH(a * 0.64), `left`));
      let s = r * i.row;
      t.fillStyle = `rgba(27, 21, 64, 0.06)`;
      for (let a = 1; a < e.length; a += 2)
        t.fillRect(0, r * i.top + a * s, n, s);
      e.forEach((a, o) => NU(t, n, r * i.top + o * s, s, o, e.length, a, !1));
    };
  }
  function IU(e, t) {
    return (n, r, i) => {
      (n.clearRect(0, 0, r, i), NU(n, r, 0, i, t, e.length, e[t], !0));
    };
  }
  var LU = {
    w: 0.92,
    h: 1.33,
    r: 0.06,
    y: 0.315,
    z: 0.11,
    off: 0.22,
    rods: 0.4,
  };
  var RU = 0.035;
  var zU = 0.012;
  var BU = {
    y: 0.27,
    d: 0.64,
  };
  var VU = {
    y: -0.34,
    w: 0.76,
    h: 0.46,
  };
  var HU = {
    w: 0.8,
    h: 0.72,
    d: 0.6,
    r: 0.08,
    y: -0.85,
    straps: 0.2,
  };
  var UU = {
    y: 0.19,
    w: 0.66,
    h: 0.22,
    gw: 0.56,
    gh: 0.13,
  };
  var WU = {
    w: 0.86,
    h: 0.4,
  };
  var GU = {
    w: 1.3,
    h: 0.5,
  };
  var KU = {
    x: -0.18,
    y: -0.095,
    w: 0.3,
    h: 0.27,
    r: 0.085,
  };
  var qU = {
    x: 0.18,
    y: -0.095,
    w: 0.3,
    h: 0.27,
    led: 0.24,
    cols: 9,
    rows: 9,
  };
  var JU = -0.28;
  var YU = {
    w: 0.1,
    aspect: 440 / 100,
  };
  var XU = 440;
  var ZU = [0, 0.45];
  var QU = 0.04;
  var $U = 0.18;
  var eW = 0.6;
  var tW = 0.45;
  var nW = 1.2;
  var rW = 0.16;
  var iW = 36;
  var aW = 23;
  var oW = 0.9;
  var sW = 0.8;
  var cW = 2;
  var lW = (e) =>
    e < cW
      ? Math.min(1, Math.max(0, e) * 6) * (1 - MathUtils.smoothstep(e, sW, cW))
      : 0;
  var uW = (e, t, n, r = XU) => ({
    w: Math.round(e * r),
    h: Math.round(t * r),
    paint: n,
  });
  var dW = `#efe6d6`;
  var fW = `#d9c9e6`;
  var pW = `#d6d0e8`;
  function mW(e, t, n, r, i) {
    let a = r * 0.43;
    i ||
      ((e.fillStyle = paperWhite),
      e.beginPath(),
      e.arc(t, n, r / 2, 0, Math.PI * 2),
      e.fill());
    for (let o of i ? [r * 0.02, 0] : [0])
      ((e.shadowBlur = o),
        (e.shadowColor = palette.orange),
        i ||
          ((e.strokeStyle = palette.red),
          (e.lineWidth = r * 0.11),
          e.beginPath(),
          e.arc(t, n, a, 0, Math.PI * 2),
          e.stroke()),
        (e.fillStyle = i ? palette.orange : inkPurple),
        (e.textAlign = `center`),
        (e.textBaseline = `middle`),
        (e.font = XH(r * 0.11)),
        e.fillText(`ISO`, t, n - r * 0.185),
        (e.font = XH(r * 0.32)),
        e.fillText(`400`, t, n + r * 0.065, r * 0.64));
    if (((e.shadowBlur = 0), i)) return;
    let o = -0.95,
      s = t + Math.cos(o) * a,
      c = n + Math.sin(o) * a;
    ((e.fillStyle = paperWhite),
      e.beginPath(),
      e.ellipse(s, c, r * 0.045, r * 0.028, 0.5, 0, Math.PI * 2),
      e.fill());
    for (let [t, n, i] of [
      [-0.018, 0.075, 0.012],
      [0.02, 0.045, 0.01],
    ])
      (e.beginPath(),
        e.roundRect(s + r * (t - i * 0.7), c, r * i * 1.4, r * n, r * i * 0.7),
        e.arc(s + r * t, c + r * n, r * i, 0, Math.PI * 2),
        e.fill());
    for (let [t, n, i] of [
      [-0.062, -0.018, 0.008],
      [0.058, 0.012, 0.007],
    ])
      (e.beginPath(),
        e.arc(s + r * t, c + r * n, r * i, 0, Math.PI * 2),
        e.fill());
    ((e.fillStyle = pW),
      e.beginPath(),
      e.ellipse(
        s + r * 0.01,
        c + r * 0.006,
        r * 0.02,
        r * 0.011,
        0.5,
        0,
        Math.PI * 2,
      ),
      e.fill());
  }
  function hW(e, t, n, r, i) {
    let a = i,
      o = a * 0.07;
    ((e.fillStyle = inkPurple),
      e.beginPath(),
      e.roundRect(t - r / 2, n - i / 2, r, i, a * 0.09),
      e.fill(),
      (e.fillStyle = paperWhite),
      e.beginPath(),
      e.roundRect(t - r / 2 + o, n - i / 2 + o, r - 2 * o, i - 2 * o, a * 0.05),
      e.fill());
    let s = a * 0.8,
      c = t - s / 2,
      l = n - s / 2,
      u = (e) => c + e * s,
      d = (e) => l + e * s;
    ((e.strokeStyle = inkPurple),
      (e.lineWidth = s * 0.05),
      (e.lineCap = `butt`));
    for (let [t, n, r, i] of [
      [0.06, 0.22, 0.25, 0.35],
      [0.36, 0.04, 0.43, 0.27],
      [0.64, 0.04, 0.57, 0.27],
      [0.94, 0.22, 0.75, 0.35],
    ])
      (e.beginPath(), e.moveTo(u(t), d(n)), e.lineTo(u(r), d(i)), e.stroke());
    ((e.fillStyle = inkPurple),
      e.beginPath(),
      e.roundRect(u(0.1), d(0.48), 0.14 * s, 0.06 * s, s * 0.012),
      e.fill(),
      e.beginPath());
    for (let [t, n] of [
      [0.29, 0.53],
      [0.36, 0.41],
      [0.64, 0.41],
      [0.71, 0.53],
    ])
      e.lineTo(u(t), d(n));
    (e.closePath(),
      e.fill(),
      e.beginPath(),
      e.roundRect(u(0), d(0.52), s, 0.47 * s, s * 0.07),
      e.fill());
    for (let [t, n] of [
      [0.185, paperWhite],
      [0.148, inkPurple],
      [0.108, paperWhite],
    ])
      ((e.fillStyle = n),
        e.beginPath(),
        e.arc(u(0.5), d(0.765), t * s, 0, Math.PI * 2),
        e.fill());
  }
  var gW = (e, t, n) => {
    let r = LU.w - 0.04,
      i = LU.h - 0.04,
      a = t / r,
      o = n / i;
    ((e.fillStyle = paperWhite), e.fillRect(0, 0, t, n));
    let s = RU * a,
      c = zU * a;
    ((e.fillStyle = palette.yellow),
      e.beginPath(),
      e.roundRect(s, s, t - 2 * s, n - 2 * s, 0.04 * a),
      e.fill(),
      (e.strokeStyle = inkPurple),
      (e.lineWidth = c),
      e.beginPath(),
      e.roundRect(
        s + c / 2,
        s + c / 2,
        t - 2 * s - c,
        n - 2 * s - c,
        0.04 * a - c / 2,
      ),
      e.stroke(),
      mW(e, t / 2, n / 2 - BU.y * o, BU.d * a, !1),
      hW(e, t / 2, n / 2 - VU.y * o, VU.w * a, VU.h * o));
  };
  var _W = (e, t, n) => {
    (e.clearRect(0, 0, t, n), mW(e, t / 2, n / 2, t, !0));
  };
  function vW(e, t, n, r, i) {
    let a = r * 0.52,
      o = a * 0.78,
      s = o * 1.9,
      c = Math.floor(t / s),
      l = (t - (c - 1) * s) / 2;
    e.fillStyle = i;
    for (let t = 0; t < c; t++)
      (e.beginPath(),
        e.roundRect(l + t * s - o / 2, n - a / 2, o, a, a * 0.22),
        e.fill());
  }
  function yW(e, t, n, r, i, a, o, s) {
    ((e.strokeStyle = o),
      (e.lineWidth = s),
      (e.lineCap = `round`),
      e.beginPath());
    for (let o = -a; o <= a; o++) {
      let s = t + (r / 2) * Math.sign(o) * (Math.abs(o) / a) ** 0.75;
      (e.moveTo(s, n - i / 2), e.lineTo(s, n + i / 2));
    }
    e.stroke();
  }
  var bW = {
    "film.sign": uW(LU.w - 0.04, LU.h - 0.04, gW),
    "film.iso400Hi": uW(BU.d, BU.d, _W),
    "film.flash": uW(UU.gw, UU.gh, (e, t, n) => {
      ((e.fillStyle = dW),
        e.fillRect(0, 0, t, n),
        yW(e, t / 2, n / 2, t * 0.9, n * 0.66, 7, fW, t * 0.011),
        (e.globalAlpha = 0.55),
        (e.fillStyle = paperWhite),
        e.beginPath(),
        e.moveTo(t * 0.14, n),
        e.lineTo(t * 0.28, n),
        e.lineTo(t * 0.44, 0),
        e.lineTo(t * 0.3, 0),
        e.closePath(),
        e.fill(),
        (e.globalAlpha = 1));
    }),
    "film.flashHi": uW(
      WU.w,
      WU.h,
      (e, t, n) => {
        e.clearRect(0, 0, t, n);
        let r = (UU.gw / WU.w) * t,
          i = (UU.gh / WU.h) * n;
        (e.save(), e.translate(t / 2, n / 2), e.scale(1, n / t));
        let a = e.createRadialGradient(0, 0, r * 0.42, 0, 0, t / 2);
        (a.addColorStop(0, `rgba(255,246,223,0.85)`),
          a.addColorStop(0.45, `rgba(255,246,223,0.32)`),
          a.addColorStop(1, `rgba(255,246,223,0)`),
          (e.fillStyle = a),
          e.fillRect(-t / 2, -t / 2, t, t),
          e.restore(),
          (e.fillStyle = `#fffaf0`),
          e.beginPath(),
          e.roundRect((t - r) / 2, (n - i) / 2, r, i, n * 0.03),
          e.fill(),
          yW(e, t / 2, n / 2, r * 0.9, i * 0.66, 7, paperWhite, r * 0.011));
      },
      360,
    ),
    "film.flashRays": uW(
      GU.w,
      GU.h,
      (e, t, n) => {
        e.clearRect(0, 0, t, n);
        let r = t / GU.w;
        ((e.strokeStyle = `#fff6df`),
          (e.lineCap = `round`),
          (e.lineWidth = 0.028 * r));
        for (let i of [0, Math.PI])
          for (let a of [-0.29, -0.16, 0.16, 0.29]) {
            let o = i + a,
              s = Math.cos(o),
              c = Math.sin(o),
              l = (HU.w / 2 + 0.02) / Math.abs(s),
              u = l + (Math.abs(a) < 0.2 ? 0.15 : 0.1);
            (e.beginPath(),
              e.moveTo(t / 2 + s * l * r, n / 2 - c * l * r),
              e.lineTo(t / 2 + s * u * r, n / 2 - c * u * r),
              e.stroke());
          }
      },
      240,
    ),
    "film.exp": uW(
      0.14,
      0.06,
      (e, t, n) => {
        (e.clearRect(0, 0, t, n),
          (e.fillStyle = inkPurple),
          (e.font = ZH(n * 0.7)),
          (e.textAlign = `center`),
          (e.textBaseline = `middle`),
          e.fillText(`EXP`, t / 2, n * 0.54, t * 0.92));
      },
      1e3,
    ),
    "film.tape": {
      w: 440,
      h: 100,
      paint: (e, t, n) => {
        ((e.fillStyle = inkPurple),
          e.fillRect(0, 0, t, n),
          vW(e, t, n * 0.13, n * 0.2, palette.cream),
          vW(e, t, n * 0.87, n * 0.2, palette.cream),
          (e.fillStyle = palette.orange),
          (e.font = ZH(n * 0.3)),
          (e.textBaseline = `middle`),
          (e.textAlign = `left`));
        let r = (t) => (
            e.beginPath(),
            e.moveTo(t, n * 0.4),
            e.lineTo(t + n * 0.15, n * 0.5),
            e.lineTo(t, n * 0.6),
            e.closePath(),
            e.fill(),
            t + n * 0.22
          ),
          i = t * 0.04;
        for (let t of [`24`, `24A`, `25`])
          ((i = r(i)),
            e.fillText(t, i, n * 0.52),
            (i += e.measureText(t).width + n * 0.42));
        e.fillText(`400`, i, n * 0.52);
      },
    },
  };
  var xW = {
    0: [`###`, `#.#`, `#.#`, `#.#`, `###`],
    1: [`.#.`, `##.`, `.#.`, `.#.`, `###`],
    2: [`###`, `..#`, `###`, `#..`, `###`],
    3: [`###`, `..#`, `.##`, `..#`, `###`],
    4: [`#.#`, `#.#`, `###`, `..#`, `..#`],
    5: [`###`, `#..`, `###`, `..#`, `###`],
    6: [`###`, `#..`, `###`, `#.#`, `###`],
    7: [`###`, `..#`, `..#`, `.#.`, `.#.`],
    8: [`###`, `#.#`, `###`, `#.#`, `###`],
    9: [`###`, `#.#`, `###`, `..#`, `###`],
    R: [`##.`, `#.#`, `##.`, `#.#`, `#.#`],
    W: [`#...#`, `#...#`, `#.#.#`, `#.#.#`, `.#.#.`],
  };
  function SW(e) {
    let t = WB(palette.yellow),
      n = WB(palette.orange),
      r = WB(palette.lilac),
      i = (e, t, n, r, i) => {
        for (let a = 0; a < t.length; a++)
          for (let o = 0; o < t[a].length; o++)
            t[a][o] === `#` && e.set(n + o, r + a, i);
      };
    return Object.assign(
      (a) => {
        (a.set(4, 0, t), a.set(4, 1, t), a.set(5, 1, t), a.set(4, 2, t));
        let o = e.rw ? `RW` : String(e.n),
          s = e.rw ? r : n,
          c = [...o].reduce((e, t) => e + xW[t][0].length, 0) + o.length - 1,
          l = Math.floor((a.cols - c) / 2);
        for (let e of o) (i(a, xW[e], l, 4, s), (l += xW[e][0].length + 1));
      },
      {
        tick: () => (e.dirty ? ((e.dirty = !1), !0) : !1),
      },
    );
  }
  var CW = {};
  function wW(e, t, n) {
    let r = t.poleRadius,
      i = -(r + LU.off + LU.w / 2),
      a = i,
      o = HU.d / 2,
      s = (e) => AH(Z(0, 0, e), Z(1, 0, 0), Z(0, 1, 0)),
      c = DH(
        e.g,
        SH(LU.w, LU.h, LU.r),
        SH(LU.w - 0.04, LU.h - 0.04, LU.r - 0.02),
        paperWhite,
        `film.sign`,
      );
    c.position.set(i, LU.y, LU.z);
    for (let n of [LU.rods, -LU.rods])
      (t.rod(e, i - 0.25, LU.y + n, 0.04, polePurple, LU.z - 0.045 - 0.03),
        t.collar(e, LU.y + n, palette.yellow, 0.14, 0.04, !1));
    t.backStickers(
      c,
      0,
      -0.045,
      LU.w / 2 - 0.08,
      LU.h / 2 - 0.08,
      3,
      (e, t, n) => Math.abs(Math.abs(t) - LU.rods) < 0.05 + n,
    );
    let l = (e) => new Shape().absarc(0, 0, e, 0, Math.PI * 2, !1),
      u = new Group();
    ((u.name = `FilmCamIso`),
      (u.userData.bakeSkip = !0),
      u.position.set(i, LU.y + BU.y, LU.z),
      e.g.add(u));
    let d = OH(u, l(BU.d / 2), `film.iso400Hi`, 0.05, 0.25);
    ((d.name = `FilmCamIsoLit`), (d.visible = !1), (d.userData.noExport = !0));
    let f = t
        .perch(e, `Birds_Film`, i, LU.y + LU.h / 2 + EH, LU.z, 0.3, 2, 1001)
        .birds.find((e) => e.accessory.hat?.type === `beanie`),
      p = new Group();
    ((p.name = `FilmCamBox`),
      p.position.set(a, HU.y, 0),
      e.g.add(p),
      createPart(
        $(
          `filmCamBody`,
          () => new RoundedBoxGeometry(HU.w, HU.h, HU.d, 3, HU.r),
        ),
        amber,
        p,
      ));
    for (let n of [HU.straps, -HU.straps])
      (t.collar(e, HU.y + n, amber, 0.12, 0.04, !1),
        t.strap(e, -0.2, a + HU.w / 2 - 0.03, HU.y + n, 0.08, 0.06));
    let m = new Group();
    ((m.name = `FilmCamFlash`),
      m.position.set(0, UU.y, o + 0.02),
      p.add(m),
      (createPart(
        new RoundedBoxGeometry(UU.w, UU.h, 0.03, 2, 0.04),
        shadowPurple,
        m,
      ).position.z = -0.015));
    for (let e of [-1, 1])
      for (let t of [-1, 1])
        xH(
          m,
          Z(e * (UU.w / 2 - 0.04), t * (UU.h / 2 - 0.04), 0),
          Z(0, 0, 1),
          paleBlue,
          0.014,
        );
    LH(m, s(0), 0, 0, UU.gw, UU.gh, 0, mH(`film.flash`), 0.002);
    let h = OH(m, SH(WU.w, WU.h, 0.1), `film.flashHi`, 0.05, 0.6);
    ((h.name = `FilmCamFlashLit`),
      (h.position.z = 0.006),
      (h.visible = !1),
      (h.userData.noExport = !0));
    let g = OH(m, SH(GU.w, GU.h, 0.02), `film.flashRays`, 0.05, 0.6);
    ((g.name = `FilmCamFlashRays`),
      (g.position.z = 0.008),
      (g.visible = !1),
      (g.userData.noExport = !0),
      n.from(m).rect(
        UU.w,
        UU.h,
        0.004,
        palette.cream,
        {
          left: !0,
          right: !0,
        },
        3,
        0.03,
      ),
      createPart(
        new RoundedBoxGeometry(KU.w, KU.h, 0.03, 2, 0.03),
        shadowPurple,
        p,
      ).position.set(KU.x, KU.y, o + 0.005),
      createPart(
        new RoundedBoxGeometry(KU.w - 0.04, KU.h - 0.04, 0.01, 2, 0.02),
        nightPurple,
        p,
      ).position.set(KU.x, KU.y, o + 0.018),
      createPart(
        $(`filmCamBarrel`, () =>
          new CylinderGeometry(KU.r, KU.r, 0.05, 24).rotateX(Math.PI / 2),
        ),
        `#26213f`,
        p,
      ).position.set(KU.x, KU.y, o + 0.045),
      createPart(
        $(`filmCamGlass`, () => new CircleGeometry(KU.r * 0.72, 24)),
        nightPurple,
        p,
      ).position.set(KU.x, KU.y, o + 0.0705),
      createPart(
        $(`filmCamGlint`, () => new CircleGeometry(0.016, 12)),
        paperWhite,
        p,
      ).position.set(KU.x - 0.024, KU.y + 0.024, o + 0.072),
      createPart(
        $(`filmCamGlint2`, () => new CircleGeometry(0.007, 8)),
        paperWhite,
        p,
      ).position.set(KU.x + 0.012, KU.y + 0.036, o + 0.072),
      createPart(
        new RoundedBoxGeometry(qU.w, qU.h, 0.03, 2, 0.03),
        shadowPurple,
        p,
      ).position.set(qU.x, qU.y, o + 0.005));
    let _ = {
        n: aW,
        rw: !1,
        dirty: !1,
      },
      v = aV({
        cols: qU.cols,
        rows: qU.rows,
        draw: SW(_),
        brightness: 1.3,
      });
    v.glass(`rect`, qU.led, qU.led);
    let y = new Mesh(
      $(`filmCamCounter`, () =>
        TH(new ShapeGeometry(SH(qU.led, qU.led, 0.012), 4)),
      ),
      v.material,
    );
    ((y.name = `FilmCamCounter`),
      y.position.set(qU.x, qU.y, o + 0.0215),
      p.add(y));
    let b = s(o);
    (LH(p, b, qU.x, JU, 0.14, 0.06, 0, mH(`film.exp`), 0.002),
      RH(p, b, -0.29, JU, 3, 0.085, 0.25, 0.003),
      VH(p, AH(Z(-HU.w / 2, 0, 0), Z(0, 0, 1), Z(0, 1, 0)), {
        count: 2,
        size: [0.13, 0.2],
        hw: HU.d / 2 - 0.08,
        hh: HU.h / 2 - 0.1,
      }),
      VH(p, AH(Z(0, 0, -o), Z(-1, 0, 0), Z(0, 1, 0)), {
        count: 3,
        size: [0.13, 0.22],
        hw: HU.w / 2 - 0.08,
        hh: HU.h / 2 - 0.1,
      }));
    let x = r * Math.cos(Math.PI / 8),
      S = (Math.PI * 2) / 8,
      C = Math.round((-0.3 + e.yaw) / S - 0.5),
      w = -e.yaw + (C + 0.5) * S,
      T = YU.w * YU.aspect;
    ((LH(
      e.g,
      MH(x, 8, -e.yaw),
      (C + 0.5) * 2 * x * Math.tan(Math.PI / 8),
      LU.y,
      T,
      YU.w,
      Math.PI / 2,
      mH(`film.tape`),
      0.004,
    ).name = `Tape`),
      t.keepClear(
        e,
        LU.y - T / 2 - 0.02,
        LU.y + T / 2 + 0.02,
        Math.sin(w) * 0.3,
        Math.cos(w) * 0.3,
        YU.w / 2 + 0.02,
      ));
    let E = new Mesh(
      $(
        `filmCamHit`,
        () => new BoxGeometry(HU.w + 0.12, HU.h + 0.12, HU.d + 0.16),
      ),
      t.hitMaterial,
    );
    (E.position.set(a, HU.y, 0.05),
      (E.visible = !1),
      (E.userData.noExport = !0),
      (E.userData.bakeSkip = !0),
      e.g.add(E));
    let D = -1,
      ee = -9,
      te = !0,
      O = !0,
      ne = null,
      re = 0,
      ie = 0,
      ae = !1,
      oe = -1,
      se = cW,
      ce = 0,
      le = !1,
      ue = 0,
      de = () => t.reducedMotion.matches,
      fe = () => {
        (CW.wind?.(t.focus()),
          _.n >= iW && !_.rw ? ((_.rw = !0), (oe = ce + oW)) : _.rw || _.n++,
          (_.dirty = !0));
      },
      pe = () => {
        ((te = !0), le && D >= 0 && CW.pop?.(t.focus()), O && fe());
        let e = ne;
        ((ne = null),
          e?.(),
          !le && f?.isPerched && f.say(ce, 0.9, null, `huh`));
      },
      me = {
        hits: [E],
        fire(e, n = !0) {
          if (t.focus() <= 0) {
            e?.();
            return;
          }
          if (ce - ee < nW) {
            e && !te ? (ne = e) : e?.();
            return;
          }
          ((D = 0),
            (ee = ce),
            (te = !1),
            (ue = 0),
            (O = n),
            (ne = e ?? null),
            (le = de()),
            !le && f?.isPerched && f.cue(ce, `puff`, 0.9));
        },
        cue() {
          return ((se = 0), u);
        },
        update(e, n, r) {
          if (((ce = r), !n)) {
            (te || pe(),
              (D = -1),
              (re = ie = 0),
              (se = cW),
              (h.visible = g.visible = d.visible = !1),
              _.rw && ((_.rw = !1), (_.n = 1), (_.dirty = !0), (oe = -1)));
            return;
          }
          let i = 0;
          if (D >= 0) {
            if (((D += e), le))
              i =
                D < 2 * eW
                  ? tW * Math.sin((Math.PI * Math.min(D, 2 * eW)) / (2 * eW))
                  : 0;
            else {
              for (let e of ZU) {
                let t = D - e;
                t >= 0 &&
                  (i = Math.max(
                    i,
                    t < QU ? t / QU : Math.max(0, 1 - (t - QU) / $U) ** 2,
                  ));
              }
              for (; ue < ZU.length && D >= ZU[ue];)
                (CW.pop?.(t.focus()), ue++);
            }
            (!te && D >= (le ? eW : ZU[1]) && pe(),
              D > (le ? 2 * eW : ZU[1] + QU + $U) && (D = -1));
          }
          ((ie += ((ae ? rW : 0) - ie) * (1 - Math.exp(-12 * e))),
            ie < 0.002 && !ae && (ie = 0),
            (re = Math.max(i, ie)),
            (h.level.value = re),
            (h.visible = re > 0.002));
          let a = le ? 0 : i;
          ((g.level.value = a), (g.visible = a > 0.002), se < cW && (se += e));
          let o = lW(se);
          ((d.level.value = o),
            (d.visible = o > 0.004),
            _.rw && ce >= oe && ((_.rw = !1), (_.n = 1), (_.dirty = !0)));
        },
        hover(e) {
          ae = e !== null;
        },
        click() {
          me.fire();
        },
        debug: {
          frame: () => (_.rw ? 0 : _.n),
          light: () => re,
          flash: () => D,
          wind: (e) => {
            ((_.n = MathUtils.clamp(Math.round(e), 1, iW)),
              (_.rw = !1),
              (_.dirty = !0));
          },
        },
      };
    return me;
  }
  return {
    jU,
    MU,
    FU,
    IU,
    bW,
    CW,
    wW,
  };
}
