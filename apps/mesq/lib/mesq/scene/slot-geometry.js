// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  Object3D,
  ShapeGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three/webgpu";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export function createSlotGeometryModule(
  scope,
  {
    paletteModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
    trafficLightsModule,
    pongModule,
  },
) {
  const { paperWhite, amber, shadowPurple, paleBlue, inkPurple, palette } =
    paletteModule;
  const { WB } = dialogueModule;
  const { PixelGrid, rV, aV } = ledPixelsModule;
  const { Z, mH, createPart, $, xH, SH, TH, EH, DH, bakeStaticGeometry } =
    stickersModule;
  const { XH, ZH } = signArtModule;
  const { nG, GlowGeometryBuilder } = trafficLightsModule;
  const { vX, yX, bX, xX, SX, wX, EX, DX, OX, kX, AX, jX, MX, PX } = pongModule;
  function FX(e) {
    let { w: t, h: n, d: r } = vX,
      i = new Group();
    ((i.name = `SlotButton`),
      createPart(new RoundedBoxGeometry(t, n, r, 3, 0.05), amber, i));
    let a = DH(
      i,
      SH(bX.w, bX.h, 0.05),
      SH(yX.w, yX.h, 0.04),
      amber,
      `slotFace`,
      bX.depth,
    );
    a.position.z = r / 2 + bX.depth / 2 + EH - 0.02;
    let o = a.position.z + bX.depth / 2 + EH + 0.004;
    for (let e of [-1, 1])
      for (let t of [-1, 1])
        xH(
          i,
          Z(e * (bX.w / 2 - 0.032), t * (bX.h / 2 - 0.032), o - 0.004),
          Z(0, 0, 1),
          paleBlue,
          0.013,
        );
    let s = SH(xX.w + 0.05, xX.h + 0.05, 0.028);
    (s.holes.push(SH(xX.w + 0.004, xX.h + 0.004, 0.012)),
      createPart(
        $(
          `slotWaitFrame`,
          () =>
            new ExtrudeGeometry(s, {
              depth: 0.014,
              bevelEnabled: !0,
              bevelSize: 0.005,
              bevelThickness: 0.005,
              bevelSegments: 1,
              curveSegments: 6,
            }),
        ),
        shadowPurple,
        i,
      ).position.set(0, xX.y, o - 0.012));
    let c = [SX, palette.red].map((e) => {
        let t = new PixelGrid(xX.cols, xX.rows);
        return (t.text(`WAIT`, xX.cols / 2, 1, e), t.cells);
      }),
      l = !1,
      u = -1,
      d = Object.assign(
        (e) => {
          e.cells.set(c[+!!l]);
        },
        {
          tick() {
            let e = +!!l;
            return e !== u && ((u = e), !0);
          },
        },
      ),
      f = aV({
        cols: xX.cols,
        rows: xX.rows,
        draw: d,
        brightness: 1.7,
      }),
      p = new Mesh(TH(new ShapeGeometry(SH(xX.w, xX.h, 0.012), 4)), f.material);
    ((p.name = `WaitLamp`), p.position.set(0, xX.y, o + 0.002), i.add(p));
    let m = new GlowGeometryBuilder(i),
      h = new Object3D();
    (h.position.set(0, xX.y, 0),
      i.add(h),
      m.from(h).rect(xX.w + 0.05, xX.h + 0.05, o + 0.012, palette.red, {
        top: !0,
        left: !0,
        right: !0,
      }),
      i.remove(h));
    let g = m.build(`SlotWaitGlow`),
      _ = wX.bulbs,
      v = [WB(palette.yellow), WB(palette.cream)],
      y = WB(palette.orange),
      b = -1,
      x = 0,
      S = !1,
      C = (e) =>
        x === 1
          ? 1
          : x === 2
            ? 10 + (Math.floor(e * 26) % _)
            : x === 3
              ? 100 + (Math.floor(e * 7) % 2)
              : S
                ? 2 + (Math.floor(e / 0.55) % 2)
                : 2,
      w = Object.assign(
        (e) => {
          let t = b,
            n = e.cells;
          for (let e = 0; e < _; e++) {
            let r = 0;
            if (t === 1) r = v[e % 2];
            else if (t < 10) r = (e + t) % 2 ? 0 : v[0];
            else if (t < 100) {
              let n = _ - 1 - (t - 10),
                i = Math.min((e - n + _) % _, (e - n - _ / 2 + 2 * _) % _);
              r = i === 0 ? v[1] : i < 3 ? v[0] : 0;
            } else r = t === 100 ? v[e % 2] : e % 2 ? y : 0;
            n[e] = r;
          }
        },
        {
          tick(e) {
            let t = C(e);
            return t !== b && ((b = t), !0);
          },
        },
      );
    b = C(0);
    let T = aV({
        cols: _,
        rows: 1,
        draw: w,
        brightness: 1.8,
      }),
      E = new Mesh(PX(wX.r0, wX.r1, _, Math.PI / 2 - Math.PI / _), T.material);
    ((E.name = `Bulbs`),
      E.position.set(0, wX.y, o + 0.002),
      i.add(E),
      createPart(
        $(`slotBulbRim`, () => new TorusGeometry(wX.r1 + 0.006, 0.008, 6, 48)),
        shadowPurple,
        i,
      ).position.set(0, wX.y, o),
      createPart(
        $(`slotCapBezel`, () => new TorusGeometry(EX.r + 0.013, 0.011, 8, 40)),
        paleBlue,
        i,
      ).position.set(0, wX.y, o + 0.004),
      createPart(
        $(`slotCapWell`, () => new CircleGeometry(EX.r + 0.014, 40)),
        shadowPurple,
        i,
      ).position.set(0, wX.y, o + 0.001));
    let D = new Group();
    ((D.name = `SlotButtonCap`),
      (D.userData.bakeSkip = !0),
      D.position.set(0, wX.y, o),
      i.add(D));
    let ee = createPart(
      $(`slotCapSkirt`, () =>
        new CylinderGeometry(EX.r, EX.r, 0.05, 40, 1, !0).rotateX(Math.PI / 2),
      ),
      palette.red,
      D,
    );
    ee.position.z = -0.008;
    let te = (e, t, n, r, i) =>
        new SphereGeometry(e, 40, 10, t, n, r, i).rotateX(Math.PI / 2),
      O = createPart(
        $(`slotCapDome`, () => te(EX.r, 0, Math.PI * 2, 0, Math.PI / 2)),
        palette.red,
        D,
      );
    ((O.position.z = 0.017), (O.scale.z = EX.dome / EX.r));
    for (let [e, t, n, r, i] of [
      [`slotCapGlint`, -1.35, 0.95, 0.5, 0.36],
      [`slotCapGlintDot`, -0.32, 0.26, 0.56, 0.2],
    ]) {
      let a = createPart(
        $(e, () => te(EX.r * 1.015, t, n, r, i)),
        paperWhite,
        D,
      );
      ((a.position.z = O.position.z), (a.scale.z = O.scale.z));
    }
    let ne = bakeStaticGeometry(D, `SlotButtonCap`, !0)[0].geometry.attributes
        .color,
      re = Float32Array.from(ne.array),
      ie = [];
    for (let e = 0; e < ne.count; e++) re[e * 3 + 1] < 0.5 && ie.push(e);
    let ae = (e) => o - e * EX.travel,
      oe = 0,
      se = 0,
      ce = !1,
      le = 0,
      ue = 0,
      de = -1,
      fe = !1,
      pe = !1,
      me = !1,
      he = !1,
      ge = !1,
      _e = 0,
      ve = 0,
      ye = () => e.busy || e.winning,
      be = () => {
        !ce && ue <= 0 && de < 0 && (fe = ye());
      };
    return {
      group: i,
      ticks: g,
      update(t, n, r) {
        ((t = Math.min(t, 0.05)),
          ce && (le += t),
          (ue = Math.max(0, ue - t)),
          de >= 0 && (de += t));
        let i = ce || ue > 0 || (de >= 0 && (de < OX.hold || !he)),
          a = i ? (fe ? AX : 1) : 0;
        if (oe !== a || se !== 0) {
          let e = de >= 0 ? OX.k : DX.k,
            n = 2 * Math.sqrt(e) * DX.zeta,
            r = Math.ceil(t * 240),
            i = t / r;
          for (let t = 0; t < r; t++)
            ((se += (e * (a - oe) - n * se) * i), (oe += se * i));
          (Math.abs(oe - a) < 1e-4 &&
            Math.abs(se) < 0.001 &&
            ((oe = a), (se = 0)),
            (D.position.z = ae(oe)));
          let o = 1 - MX.scale * oe;
          D.scale.set(o, o, 1);
        }
        (!he && oe > (fe ? AX * 0.85 : 0.85)
          ? ((he = !0),
            rV.slotPress?.(fe ? `stuck` : `press`, de >= 0),
            pe && !fe && e.spin(me),
            (pe = !1))
          : he &&
            oe < (fe ? AX * 0.3 : 0.3) &&
            ((he = !1),
            fe || rV.slotPress?.(`release`, de >= 0),
            de >= OX.hold && (de = -1)),
          de > 2 && (de = -1));
        let o = ge && !r ? 1 : 0;
        ((_e += (o - _e) * (1 - Math.exp(-t * 14))),
          Math.abs(_e - o) < 0.004 && (_e = o));
        let s = 1 - MX.shade * Math.min(1, Math.max(0, oe));
        if (_e + s * 2 !== ve) {
          ve = _e + s * 2;
          let e = ne.array;
          for (let t of ie)
            for (let n = 0; n < 3; n++) {
              let r = re[t * 3 + n];
              e[t * 3 + n] = (r + (jX[n] - r) * _e) * s;
            }
          ne.needsUpdate = !0;
        }
        ((l = e.busy),
          (x = e.winning ? 3 : e.busy ? 2 : ge || i ? 1 : 0),
          (S = n),
          g && (g.visible = r || (l && nG.night.value > 0.002)));
      },
      hold(e) {
        e
          ? (be(), (ce = !0), (le = 0), !fe && !ye() && ((pe = !0), (me = !0)))
          : ce && ((ce = !1), (ue = Math.max(ue, kX - le)));
      },
      press() {
        return (
          be(),
          !ce && oe < 0.5 && (ue = Math.max(ue, kX)),
          fe || ye()
            ? !1
            : ((pe = !0), (me = !0), he && (e.spin(!0), (pe = !1)), !0)
        );
      },
      ghost() {
        ye() ||
          pe ||
          ce ||
          ue > 0 ||
          de >= 0 ||
          ((fe = !1), (de = 0), (pe = !0), (me = !1));
      },
      hover(e) {
        ge = e;
      },
    };
  }
  var IX = {
    w: 0.18,
    l: 0.315,
  };
  var LX = {
    w: 0.36,
    h: 0.114,
  };
  var RX = {
    ticket: 0.16,
    plate: 0.3,
  };
  var zX = {};
  var BX = {
    w: 0.48,
    h: 0.4,
    d: 0.34,
  };
  var VX = palette.teal;
  var HX = 0.1;
  var UX = {
    y: -0.11,
    w: 0.26,
    h: 0.03,
  };
  var WX = 0.06;
  var GX = 16;
  var KX = {
    count: 6,
    period: 0.24,
    delay: 0.3,
  };
  var qX = {
    count: 5,
    period: 0.4,
  };
  var JX = 3;
  var YX = 0.65;
  var XX = {
    scale: 0.9,
    fan: 2.4,
    curl: 0.18,
    vary: [0.8, 1.2],
    twist: 0.06,
    slack: 20,
    yaw: 0.5,
    ease: 0.6,
    wobble: 0.05,
    rate: 1.9,
    breeze: 1.2,
  };
  var ZX = IX.l * XX.scale;
  var QX = 0.5;
  var $X = 1.15 * ZX;
  var eZ = 0.55 * ZX;
  var tZ = $X + (Math.PI / 2 - QX) * eZ;
  var nZ = 2.4;
  var rZ = 0.5;
  var iZ = 0.08;
  var aZ = 20;
  var oZ = [palette.yellow, palette.pink, palette.cyan, palette.orange];
  var sZ = (e) => e * e * (3 - 2 * e);
  var cZ = (e, t) => e + Math.random() * (t - e);
  function lZ(e, t, n, r) {
    let i = 0.022 * r;
    (e.beginPath(),
      e.moveTo(i, 0),
      e.lineTo(t - i, 0),
      e.arc(t, 0, i, Math.PI, Math.PI / 2, !0),
      e.lineTo(t, n - i),
      e.arc(t, n, i, -Math.PI / 2, Math.PI, !0),
      e.lineTo(i, n),
      e.arc(0, n, i, 0, -Math.PI / 2, !0),
      e.lineTo(0, i),
      e.arc(0, 0, i, Math.PI / 2, 0, !0),
      e.closePath(),
      (e.fillStyle = `#ffffff`),
      e.fill(),
      e.save(),
      (e.globalCompositeOperation = `destination-out`),
      e.beginPath(),
      e.arc(t / 2, 0.034 * r, 0.009 * r, 0, Math.PI * 2),
      e.fill(),
      (e.globalCompositeOperation = `source-atop`),
      (e.strokeStyle = inkPurple),
      (e.globalAlpha = 0.6),
      (e.lineWidth = 0.0045 * r),
      e.setLineDash([0.008 * r, 0.0045 * r]));
    for (let a of [0.006 * r, n - 0.006 * r])
      (e.beginPath(), e.moveTo(i, a), e.lineTo(t - i, a), e.stroke());
    e.restore();
  }
  function uZ(e, t, n, r, i) {
    e.beginPath();
    for (let a = 0; a < 10; a++) {
      let o = -Math.PI / 2 + (a * Math.PI) / 5,
        s = a % 2 ? i : r;
      e.lineTo(t + Math.cos(o) * s, n + Math.sin(o) * s);
    }
    e.closePath();
  }
  var dZ = (e, t, n) => {
    let r = t / RX.ticket;
    (e.clearRect(0, 0, t, n),
      lZ(e, t, n, r),
      (e.strokeStyle = inkPurple),
      (e.lineWidth = 0.0035 * r),
      e.beginPath(),
      e.roundRect(
        0.016 * r,
        0.026 * r,
        t - 0.032 * r,
        n - 0.052 * r,
        0.012 * r,
      ),
      e.stroke(),
      uZ(e, t / 2, 0.094 * r, 0.046 * r, 0.02 * r),
      (e.fillStyle = `#d9d4ec`),
      e.fill(),
      (e.lineWidth = 0.0065 * r),
      (e.lineJoin = `round`),
      e.stroke(),
      (e.fillStyle = `#ffffff`),
      e.beginPath(),
      e.ellipse(
        t / 2 - 0.01 * r,
        0.083 * r,
        0.006 * r,
        0.0035 * r,
        -0.6,
        0,
        Math.PI * 2,
      ),
      e.fill(),
      (e.fillStyle = inkPurple),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      (e.font = XH(0.054 * r)),
      e.fillText(`WIN!`, t / 2, 0.176 * r, t - 0.04 * r),
      e.fillRect(0.034 * r, 0.207 * r, t - 0.068 * r, 0.004 * r),
      (e.font = ZH(0.03 * r)),
      e.fillText(`#1405`, t / 2, 0.232 * r, t - 0.05 * r));
  };
  var fZ = (e, t, n) => {
    let r = t / RX.ticket;
    (e.clearRect(0, 0, t, n),
      lZ(e, t, n, r),
      e.save(),
      (e.globalCompositeOperation = `source-atop`),
      (e.fillStyle = `#e6e1f2`));
    for (let n = 0; n < 7; n++)
      for (let i = 0; i < 4; i++)
        (uZ(
          e,
          ((i + (n % 2) * 0.5 + 0.25) / 4) * t,
          (0.05 + n * 0.032) * r,
          0.008 * r,
          0.0035 * r,
        ),
          e.fill());
    (e.restore(),
      (e.fillStyle = `#ffffff`),
      e.fillRect(0.022 * r, 0.17 * r, t - 0.044 * r, 0.08 * r),
      (e.fillStyle = inkPurple));
    let i = 0.03 * r;
    for (let n = 0; i < t - 0.03 * r; n++) {
      let t = ((n * 7) % 3) * 0.0015 * r + 0.0015 * r;
      (e.fillRect(i, 0.178 * r, t, 0.04 * r),
        (i += t + (((n * 5) % 4) * 0.001 + 0.0018) * r));
    }
    ((e.textAlign = `center`),
      (e.textBaseline = `middle`),
      (e.font = ZH(0.016 * r)),
      e.fillText(`MESQ ARCADE`, t / 2, 0.236 * r, t - 0.04 * r));
  };
  var pZ = (e, t, n) => {
    let r = t / RX.plate;
    ((e.fillStyle = palette.yellow),
      e.fillRect(0, 0, t, n),
      (e.strokeStyle = inkPurple),
      (e.lineWidth = 0.006 * r),
      e.beginPath(),
      e.roundRect(
        0.008 * r,
        0.008 * r,
        t - 0.016 * r,
        n - 0.016 * r,
        0.012 * r,
      ),
      e.stroke());
    for (let i of [-1, 1])
      (e.save(),
        e.translate(t / 2 + i * 0.118 * r, n / 2),
        e.rotate(i * 0.25),
        (e.fillStyle = palette.hotPink),
        e.beginPath(),
        e.roundRect(-0.016 * r, -0.026 * r, 0.032 * r, 0.052 * r, 0.004 * r),
        e.fill(),
        (e.lineWidth = 0.004 * r),
        e.stroke(),
        (e.fillStyle = palette.yellow),
        uZ(e, 0, 0, 0.011 * r, 0.005 * r),
        e.fill(),
        e.restore());
    ((e.fillStyle = inkPurple),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      (e.font = XH(0.05 * r)),
      e.fillText(`TICKETS`, t / 2, n / 2 + 0.003 * r, t - 0.09 * r));
  };
  function mZ() {
    let { w: e, l: t } = IX,
      n = 0.012,
      r = mH(`ticket`),
      i = mH(`ticketBack`),
      a = [],
      o = [],
      s = [],
      c = [];
    for (let l of [1, -1]) {
      let u = l > 0 ? r : i,
        d = a.length / 3;
      for (let r = 0; r <= 1; r++)
        for (let i = 0; i <= 4; i++) {
          let c = i / 4,
            d = (c - 0.5) * e,
            f = (2 * d) / e,
            p = new Vector3((n * 4 * f) / e, 0, 1)
              .normalize()
              .multiplyScalar(l);
          (a.push(d, (r - 0.5) * t, n * (1 - f * f) - n / 2),
            o.push(p.x, p.y, p.z));
          let m = l > 0 ? c : 1 - c;
          s.push(u.u0 + m * (u.u1 - u.u0), u.v0 + r * (u.v1 - u.v0));
        }
      for (let e = 0; e < 4; e++) {
        let t = d + e,
          n = d + e + 1,
          r = d + 4 + 1 + e,
          i = d + 4 + 2 + e;
        l > 0 ? c.push(t, n, i, t, i, r) : c.push(t, i, n, t, r, i);
      }
    }
    let l = new BufferGeometry();
    return (
      l.setAttribute(`position`, new Float32BufferAttribute(a, 3)),
      l.setAttribute(`normal`, new Float32BufferAttribute(o, 3)),
      l.setAttribute(`uv`, new Float32BufferAttribute(s, 2)),
      l.setAttribute(
        `color`,
        new Float32BufferAttribute(Array(a.length).fill(1), 3),
      ),
      l.setIndex(c),
      l
    );
  }
  function hZ(e, t, n, r, i = 32) {
    return createPart(new TubeGeometry(new CatmullRomCurve3(t), i, n, 6), r, e);
  }
  function gZ(e, t, n, r, i, a) {
    let o = new CatmullRomCurve3(t),
      s = r * 10,
      c = o.computeFrenetFrames(s, !1),
      l = Z(),
      u = [];
    for (let e = 0; e <= s; e++) {
      let t = e / s,
        i = t * r * Math.PI * 2,
        a = Math.min(1, t * 8, (1 - t) * 8);
      (o.getPointAt(t, l),
        u.push(
          l
            .clone()
            .addScaledVector(c.normals[e], Math.cos(i) * n * a)
            .addScaledVector(c.binormals[e], Math.sin(i) * n * a),
        ));
    }
    return createPart(
      new TubeGeometry(new CatmullRomCurve3(u), s * 3, i, 5),
      a,
      e,
    );
  }
  function _Z(e, t, n, r) {
    let i = createPart(
      $(`ticketGland:${r}`, () => new CylinderGeometry(r, r * 1.15, 0.04, 10)),
      shadowPurple,
      e,
    );
    return (
      i.position.copy(t),
      i.quaternion.setFromUnitVectors(Z(0, 1, 0), n.clone().normalize()),
      i
    );
  }
  function vZ(e, t, n, r) {
    let i = createPart(
      $(`zipTie:${r}`, () => new TorusGeometry(r, 0.006, 4, 14)),
      inkPurple,
      e,
    );
    (i.position.copy(t),
      i.quaternion.setFromUnitVectors(Z(0, 0, 1), n.clone().normalize()),
      createPart(
        $(`zipLock`, () => new BoxGeometry(0.018, 0.016, 0.02)),
        inkPurple,
        i,
      ).position.set(r, 0, 0));
  }
  return {
    FX,
    IX,
    LX,
    zX,
    BX,
    VX,
    HX,
    UX,
    WX,
    GX,
    KX,
    qX,
    JX,
    YX,
    XX,
    ZX,
    QX,
    $X,
    eZ,
    tZ,
    nZ,
    rZ,
    iZ,
    aZ,
    oZ,
    sZ,
    cZ,
    dZ,
    fZ,
    pZ,
    mZ,
    hZ,
    gZ,
    _Z,
    vZ,
  };
}
