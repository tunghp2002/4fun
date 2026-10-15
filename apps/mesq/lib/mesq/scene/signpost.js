// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  Box2,
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  CubicBezierCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicNodeMaterial,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three/webgpu";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export function createSignpostModule(
  scope,
  {
    paletteModule,
    renderingModule,
    birdsModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
    filmModule,
    trafficLightsModule,
    partyModule,
    phoneModule,
    projectDataModule,
    slotMachineModule,
    postAtlasModule,
    mailboxModule,
    pongModule,
    slotGeometryModule,
    ticketsModule,
    polePlacementModule,
  },
) {
  const {
    paperWhite,
    blue,
    polePurple,
    amber,
    shadowPurple,
    paleBlue,
    inkPurple,
    palette,
  } = paletteModule;
  const { cI } = renderingModule;
  const { Flock } = birdsModule;
  const { MB, HB } = dialogueModule;
  const { aV, vV } = ledPixelsModule;
  const {
    YV,
    XV,
    iH,
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
    LH,
    RH,
    zH,
    VH,
    bakeStaticGeometry,
  } = stickersModule;
  const {
    $H,
    eU,
    nU,
    rU,
    aU,
    oU,
    sU,
    cU,
    lU,
    uU,
    yU,
    xU,
    SU,
    CU,
    wU,
    TU,
    EU,
    DU,
    OU,
    kU,
    AU,
  } = signArtModule;
  const { jU, MU, FU, IU, bW, wW } = filmModule;
  const { nG, GlowGeometryBuilder, oG, sG, cG, lG, pG, TG, EG } =
    trafficLightsModule;
  const { QK, Dq } = partyModule;
  const { LJ, vY, yY } = phoneModule;
  const { projects } = projectDataModule;
  const { WY } = slotMachineModule;
  const { TextureAtlas, createPostMaterials, ZY, QY } = postAtlasModule;
  const { eX, tX } = mailboxModule;
  const { _X, vX, yX, NX } = pongModule;
  const { FX, IX, LX, dZ, fZ, pZ } = slotGeometryModule;
  const { SZ } = ticketsModule;
  const { PoleSkin } = polePlacementModule;
  var EZ = 0.26;
  var DZ = EZ;
  var OZ = 8;
  var kZ = (Math.PI * 2) / OZ;
  var AZ = 4.2;
  var jZ = 2.9;
  var MZ = 3.2;
  var NZ = 5.4;
  var PZ = Math.PI / 2 / AZ;
  var FZ = -0.22;
  var IZ = 0.32;
  var LZ = yY;
  var RZ = -4.4;
  var zZ = 2.35;
  var BZ = 440;
  var VZ = 0.085;
  var HZ = (e) => -e;
  var UZ = (e) => -(e + RZ) * PZ;
  var WZ = (e, t) => new Vector2(e, t);
  var GZ = (e, t, n) => {
    let r = MathUtils.clamp((e - t) / Math.max(1e-4, n - t), 0, 1);
    return r * r * (3 - 2 * r);
  };
  var KZ = (e) => Math.atan2(Math.sin(e), Math.cos(e));
  var qZ = [
    {
      label: `X`,
      name: `X (Twitter)`,
      href: `https://x.com/mesqme`,
      bg: `#0f1419`,
      fg: paperWhite,
      angle: -0.36,
      decor: [
        [32, 0.31, 0.84, -0.18],
        [3, 0.41, 0.62, 0.25],
      ],
      lit: {
        bloom: 0.25,
        glow: {
          blur: 0.035,
          decorAlpha: 0.35,
        },
      },
    },
    {
      label: `LinkedIn`,
      href: `https://www.linkedin.com/in/mesqme/`,
      bg: blue,
      fg: paperWhite,
      angle: -0.26,
      lit: {
        bloom: 0.25,
        glow: {
          blur: 0.035,
          halo: `#7cb8ff`,
          plate: blue,
          plateAlpha: 0.25,
        },
      },
    },
  ];
  var JZ = {
    label: `ArtStation`,
    href: `https://www.artstation.com/mesq`,
    bg: inkPurple,
    fg: palette.teal,
    angle: 0.18,
  };
  var YZ = [
    {
      key: `blender`,
      atlas: `bladeA`,
      label: `BLENDER ST.`,
      w: 1.6,
      h: 0.42,
      r: 0.05,
      bg: palette.teal,
      border: paperWhite,
      ink: inkPurple,
      letters: {
        align: `center`,
        poleEnd: 0.55,
      },
      lit: {
        ink: `rgba(0,0,0,0)`,
        bloom: 0.25,
        glow: {
          blur: 0.05,
          halo: paperWhite,
          plate: palette.teal,
          plateAlpha: 0.22,
        },
      },
    },
    {
      key: `threejs`,
      atlas: `bladeB`,
      label: `THREE.JS AV.`,
      w: 1.52,
      h: 0.36,
      r: 0.05,
      bg: paperWhite,
      border: palette.green,
      ink: inkPurple,
      letters: {
        align: `center`,
        poleEnd: 0.6,
      },
      lit: {
        ink: palette.green,
        bloom: 0.25,
        glow: {
          blur: 0.05,
          halo: palette.green,
        },
      },
    },
    {
      key: `shaders`,
      atlas: `tag`,
      label: `SHADER ALLEY`,
      w: 1.5,
      h: 0.24,
      r: 0.04,
      bg: palette.purple,
      border: paperWhite,
      ink: paperWhite,
      letters: {
        align: `center`,
        poleEnd: 0.75,
        size: 0.5,
      },
      lit: {
        bloom: 0.25,
        glow: {
          blur: 0.05,
          plate: palette.purple,
          plateAlpha: 0.22,
        },
      },
      hitH: 0.52,
    },
    {
      key: `substance`,
      atlas: `bladeG`,
      label: `SUBSTANCE LN.`,
      w: 1.5,
      h: 0.24,
      r: 0.04,
      bg: paperWhite,
      border: palette.hotPink,
      ink: palette.hotPink,
      letters: {
        align: `center`,
        poleEnd: 0.75,
        size: 0.5,
      },
      lit: {
        bloom: 0.25,
        glow: {
          blur: 0.05,
        },
      },
      hitH: 0.42,
    },
  ];
  var XZ = `say:timetable`;
  var ZZ = (e) => `say:stop:${e}`;
  var QZ = `say:film`;
  var $Z = {
    w: 1,
    h: 0.66,
  };
  var eQ = {
    w: 1,
    h: 0.68,
  };
  var tQ = eQ.h - 0.04;
  var nQ = MU(MB.length);
  var rQ = (e) => tQ / 2 - tQ * (nQ.top + (e + 0.5) * nQ.row);
  function iQ(e, t, n, r, i, a, o = 0) {
    let s = e / 2 - o,
      c = t / 2 - o,
      l = n - o,
      u = WZ((r + i) / 2, -c),
      d = a.clone().add(
        u
          .clone()
          .sub(a)
          .setLength(o * 2.4),
      ),
      f = WZ(r + o, -c),
      p = WZ(i - o, -c),
      m = 0.05,
      h = new Shape();
    (h.moveTo(-s + l, -c), h.lineTo(f.x, f.y));
    let g = d.clone().add(f.clone().sub(d).setLength(m)),
      _ = d.clone().add(p.clone().sub(d).setLength(m));
    return (
      h.lineTo(g.x, g.y),
      h.quadraticCurveTo(d.x, d.y, _.x, _.y),
      h.lineTo(p.x, p.y),
      h.lineTo(s - l, -c),
      h.quadraticCurveTo(s, -c, s, -c + l),
      h.lineTo(s, c - l),
      h.quadraticCurveTo(s, c, s - l, c),
      h.lineTo(-s + l, c),
      h.quadraticCurveTo(-s, c, -s, c - l),
      h.lineTo(-s, -c + l),
      h.quadraticCurveTo(-s, -c, -s + l, -c),
      h
    );
  }
  var aQ = {
    w: 2.3,
    h: 0.78,
    r: 0.28,
    t0: 0.32,
    t1: 0.7,
    tip: WZ(0.92, -0.74),
    inset: 0.035,
  };
  var oQ = (e = 0) => iQ(aQ.w, aQ.h, aQ.r, aQ.t0, aQ.t1, aQ.tip, e);
  var sQ = (() => {
    let e = new Box2().setFromPoints(oQ(aQ.inset).getPoints(8)),
      t = e.getSize(WZ(0, 0));
    return {
      w: t.x,
      h: t.y,
      body: (e.max.y + aQ.h / 2 - aQ.inset) / t.y,
    };
  })();
  var cQ = (e, t, n, r = BZ) => ({
    w: Math.round(e * r),
    h: Math.round(t * r),
    paint: n,
  });
  var lQ = {
    w: 0.33,
    h: 0.86,
  };
  function createAtlasSources() {
    let e = {
      ufo: cQ(1.36, 1.36, $H),
      diamond: cQ(2.08, 2.08, eU, 400),
      ...Object.fromEntries(
        YZ.map((e) => [
          e.atlas,
          cQ(
            e.w,
            e.h,
            rU(e.label, e.bg, e.border, e.ink, 0, void 0, e.letters),
          ),
        ]),
      ),
      busStop: cQ($Z.w - 0.04, $Z.h - 0.04, jU, 560),
      nonstop: cQ(lQ.w, lQ.h, aU, 600),
      arrow: cQ(2.592, 0.8256, oU),
      about: cQ(2.36, 0.62, sU),
      here: cQ(1.26, 0.26, cU),
      bubble: cQ(sQ.w, sQ.h, lU(sQ.body)),
      rail0: cQ(2.06, 0.32, uU(`RAILROAD`)),
      rail1: cQ(2.06, 0.32, uU(`CROSSING`)),
      mirror: cQ(1.12, 1.12, yU, 680),
      parking: cQ(1.08, 1.08, xU, 560),
      mailLabel: cQ(QY.w, QY.h, SU(`MAIL`, paperWhite, inkPurple, 0.66), 1200),
      payLabel: cQ(0.24, 0.09, SU(`PAY ↑`, palette.yellow, inkPurple), 1e3),
      plate0: cQ(0.66, 0.86, CU),
      plate1: cQ(0.66, 0.86, CU),
      smiley: cQ(0.76, 0.76, wU),
      flyer0: {
        w: 160,
        h: 225,
        paint: TU([`LOST`, `BIRD?`], palette.hotPink),
      },
      flyer1: {
        w: 160,
        h: 225,
        paint: TU([`FREE`, `HUGS!`], palette.cyan),
      },
      tapeBit: {
        w: 48,
        h: 20,
        paint: EU,
      },
      volt: cQ(0.18, 0.08, AU, 1e3),
      band_hazard: {
        w: 512,
        h: 154,
        paint: DU(`hazard`),
      },
      band_checker: {
        w: 512,
        h: 80,
        paint: DU(`checker`),
      },
      band_barber: {
        w: 512,
        h: 80,
        paint: DU(`barber`),
      },
      slotFace: cQ(yX.w, yX.h, NX, 600),
      ticketPlate: cQ(LX.w, LX.h, pZ, 1e3),
      ticket: cQ(IX.w, IX.l, dZ, 900),
      ticketBack: cQ(IX.w, IX.l, fZ, 900),
    };
    (qZ.forEach(
      (t, n) =>
        (e[`link${n}`] = cQ(
          1.96,
          0.28,
          rU(`${t.label.toUpperCase()}  →`, t.bg, t.fg, t.fg, 0, void 0, {
            decor: t.decor,
          }),
        )),
    ),
      qZ.forEach(
        (t, n) =>
          (e[`link${n}Hi`] = cQ(
            1.96,
            0.28,
            nU(
              `${t.label.toUpperCase()}  →`,
              t.fg,
              t.fg,
              {},
              {
                decor: t.decor,
                ...t.lit.glow,
              },
            ),
          )),
      ));
    for (let t of YZ)
      e[`${t.atlas}Hi`] = cQ(
        t.w,
        t.h,
        nU(t.label, t.border, t.lit.ink ?? t.ink, t.letters, t.lit.glow),
      );
    ((e.linkArt = cQ(
      1.96,
      0.28,
      rU(`${JZ.label.toUpperCase()}  →`, JZ.bg, JZ.fg, JZ.fg, 0),
    )),
      (e.linkArtHi = cQ(
        1.96,
        0.28,
        nU(`${JZ.label.toUpperCase()}  →`, JZ.fg, JZ.fg),
      )));
    for (let [t, n] of Object.entries(kU))
      e[`tape_${t}`] = {
        w: 576,
        h: 90,
        paint: n,
      };
    for (let [t, n] of Object.entries({
      ...LJ,
      ...QK,
    }))
      e[t] = {
        w: n.w,
        h: n.h,
        paint: (e, t, r) => withRandomSeed(() => n.paint(e, t, r), 3613),
      };
    let t = MB.map((e) => e.sign);
    ((e.timetable = cQ(eQ.w - 0.04, tQ, FU(t), 600)),
      MB.forEach(
        (n, r) => (e[`tt${r}Hi`] = cQ(eQ.w - 0.04, tQ * nQ.row, IU(t, r), 600)),
      ));
    for (let [t, n] of Object.entries(bW))
      e[t] = {
        w: n.w,
        h: n.h,
        paint: (e, t, r) => withRandomSeed(() => n.paint(e, t, r), 3858),
      };
    return e;
  }
  function dQ(e, t, n, r) {
    let i = new Group();
    return (
      (i.position.y = t),
      (i.rotation.y = n),
      r && (i.name = r),
      e.g.add(i),
      {
        g: i,
        y: e.y + t,
        yaw: e.yaw + n,
      }
    );
  }
  function fQ(e, t, n, r, i = 0.14, a = 0.04, o = !0) {
    let s = DZ + a,
      c = createPart(
        $(`collar:${s}:${i}`, () => new CylinderGeometry(s, s, i, OZ)),
        r,
        t.g,
      );
    ((c.position.y = n), (c.rotation.y = -t.yaw));
    let l = Math.round((Math.PI + t.yaw) / kZ - 0.5),
      u = new Group();
    ((u.position.y = n), (u.rotation.y = (l + 0.5) * kZ - t.yaw), t.g.add(u));
    let d = s * Math.cos(Math.PI / OZ),
      f = $(`flange:${i}`, () => new BoxGeometry(0.026, i * 0.8, 0.1));
    for (let e of [-1, 1])
      createPart(f, r, u).position.set(e * 0.024, 0, d + 0.04);
    let p = createPart(
      $(`clampPin`, () => new CylinderGeometry(0.014, 0.014, 0.1, 6)),
      paleBlue,
      u,
    );
    return (
      (p.rotation.z = Math.PI / 2),
      p.position.set(0, 0, d + 0.065),
      o && e.skin.ring(t.y + n - i / 2 - 0.02, t.y + n + i / 2 + 0.02),
      c
    );
  }
  function pQ(e, t, n, r, i, a = 0, o = !0) {
    (yH(e.g, Z(-0.14, n, a), Z(t, n, a), r, i),
      o && bH(e.g, Z(t, n, a), r, i, 12));
  }
  function mQ(e, t, n, r, i = 0.08, a = 0.04, o = shadowPurple) {
    createPart(new BoxGeometry(Math.abs(n - t), i, a), o, e.g).position.set(
      (t + n) / 2,
      r,
      0,
    );
  }
  function hQ(e, t, n, r, i, a, o) {
    e.skin.patch(
      t.y + n,
      t.y + r,
      Math.atan2(i, a) + t.yaw,
      Math.atan2(o, Math.max(0.25, Math.hypot(i, a))) + 0.06,
    );
  }
  function gQ(e, t, n, r, i, a, o, s, c) {
    let l = new Flock(
      {
        y: () => -0.008,
        minX: -o,
        maxX: o,
      },
      s,
      c,
    );
    return (
      (l.group.name = n),
      l.group.position.set(r, i, a),
      (l.group.userData.bakeSkip = !0),
      t.g.add(l.group),
      e.flocks.push({
        flock: l,
        y: t.y + i,
      }),
      l
    );
  }
  function _Q(e, t, n, r, i, a, o) {
    VH(e, AH(Z(t, 0, n), lG, sG), {
      count: a,
      size: [0.15, 0.27],
      hw: r,
      hh: i,
      avoid: o,
    });
  }
  var vQ = (e, t, n = 0) => jH(Z(0, e, n), oG, cG, sG, t);
  var yQ = 1.45;
  var bQ = 0.03;
  var xQ = 4.85;
  var SQ = 0.06;
  var CQ = (e) => yQ + Math.abs(e) * bQ;
  var wQ = Z(HZ(3.15), 0.56, 0);
  var TQ = {
    w: 2.75,
    h: 0.98,
    d: 0.56,
  };
  function EQ(e, t) {
    let n = t.g,
      r = createPart(new CylinderGeometry(SQ, SQ, xQ, 16), polePurple, n);
    ((r.rotation.z = Math.PI / 2 - Math.atan(bQ)),
      r.position.set(HZ(2.525), CQ(2.525), 0),
      bH(
        n,
        Z(HZ(4.949999999999999), CQ(4.949999999999999), 0),
        SQ * 1.3,
        palette.pink,
        12,
      ));
    let i = Z(0, -1, 0),
      a = jH(Z(), i, cG, oG, SQ),
      o = (e) => 2.525 - e;
    (zH(r, a, o(1.62), -0.012, VZ * OU, VZ, `tape_dontWait`),
      zH(r, a, o(3.15), -0.012, VZ * OU, VZ, `tape_scroll`));
    let s = 0.12;
    createPart(new CylinderGeometry(s, s, 1, 24), amber, r).position.y =
      -1.9249999999999998;
    let c = createPart(
      $(`sleeveLip`, () => new TorusGeometry(s, 0.016, 6, 24)),
      shadowPurple,
      r,
    );
    ((c.position.y = -1.4249999999999998),
      (c.rotation.x = Math.PI / 2),
      VH(r, jH(Z(0, -o(0.71), 0), i, cG, oG, s), {
        count: 6,
        size: [0.1, 0.17],
        hw: 0.3,
        hh: 0.22,
      }),
      fQ(e, t, 1.47, amber, 0.3, 0.05));
    let l = Z(-1, bQ, 0).normalize();
    for (let e of [wQ.x - 0.95, wQ.x + 0.95]) {
      let t = wQ.y + TQ.h / 2;
      (createPart(
        $(`hangerPlate`, () => new CylinderGeometry(0.07, 0.07, 0.03, 12)),
        shadowPurple,
        n,
      ).position.set(e, t + 0.005, 0),
        yH(n, Z(e, t, 0), Z(e, CQ(e), 0), 0.03, polePurple, 10));
      let r = createPart(
        $(`armClamp`, () => new TorusGeometry(0.066, 0.012, 6, 18)),
        shadowPurple,
        n,
      );
      (r.position.set(e, CQ(e), 0), r.quaternion.setFromUnitVectors(cG, l));
    }
    let u = wQ.x + TQ.w / 2;
    createPart(
      new TubeGeometry(
        new CubicBezierCurve3(
          Z(-0.1, -0.22, 0),
          Z(-0.95, -0.22, 0),
          Z(-1.15, wQ.y, 0),
          Z(u - 0.06, wQ.y, 0),
        ),
        40,
        0.075,
        12,
      ),
      polePurple,
      n,
    );
    let d = createPart(
      $(`braceFlange`, () => new CylinderGeometry(0.1, 0.1, 0.05, 16)),
      polePurple,
      n,
    );
    ((d.rotation.z = Math.PI / 2),
      d.position.set(u + 0.015, wQ.y, 0),
      fQ(e, t, -0.22, palette.lime, 0.26, 0.04));
    for (let [e, t] of [
      [0.11, 0.06],
      [0.145, 0.1],
    ])
      createPart(
        new TubeGeometry(
          new CatmullRomCurve3([
            Z(u - 0.06, wQ.y - 0.2, e),
            Z(-1.45, wQ.y - 0.27, e),
            Z(-0.95, 0.12, e),
            Z(-0.55, -0.28, e),
            Z(-0.37, -0.8, e),
            Z(-0.36, -1.6, (e + t) / 2),
            Z(-0.33, -2.17, t),
          ]),
          72,
          0.018,
          6,
        ),
        paleBlue,
        n,
      );
    let f = new Group();
    (f.position.set(-0.29, -2.3, 0.04),
      n.add(f),
      createPart(
        new RoundedBoxGeometry(0.3, 0.42, 0.24, 2, 0.04),
        palette.purple,
        f,
      ));
    let p = AH(Z(0, 0, 0.12), oG, sG);
    LH(f, p, 0, 0.1, 0.18, 0.08, 0, mH(`volt`), 0.003);
    let m = YV(cH(37));
    (RH(f, p, 0, -0.07, m, iH(m) > 1 ? 0.09 : 0.12, sH(-0.3, 0.3), 0.003),
      hQ(e, t, -2.55, -2.05, -0.29, 0.04, 0.2));
    let h = new Flock(
      {
        y: (e) => CQ(e) + SQ - 0.012,
        minX: -4.6,
        maxX: -1.38,
      },
      7,
    );
    ((h.group.userData.bakeSkip = !0),
      n.add(h.group),
      e.flocks.push({
        flock: h,
        y: yQ,
      }));
    let g = EG(TQ.w, TQ.h, TQ.d);
    ((g.group.name = `TrafficSignal`),
      g.group.position.copy(wQ),
      (g.group.userData.bakeSkip = !0),
      n.add(g.group),
      bakeStaticGeometry(g.group, g.group.name));
    let _ = {
      flock: h,
      head: g,
    };
    return (bakeStaticGeometry(n, `Mast`), _);
  }
  var signBuilders = {
    PedSignals: (e, t, n) => {
      let r = 0.96,
        i = 0.86,
        a = HZ(0.62),
        o = a - 0.045 - r / 2 + 0.012,
        s = vV.pong({
          gap: 10,
        }),
        c = [
          {
            y: 0.47,
            led: {
              cols: 28,
              rows: 24,
              draw: s.top,
            },
            glow: s.colors.top,
            sides: {
              left: !0,
            },
          },
          {
            y: -0.47,
            led: {
              cols: 28,
              rows: 24,
              draw: s.bottom,
            },
            glow: s.colors.bottom,
            sides: {
              left: !0,
            },
          },
        ],
        l = _X(s.input, kQ),
        u = -0.47 - i / 2 - 0.07 - tX.h / 2;
      (l.group.position.set(o, u, 0.12),
        (l.group.rotation.x = -0.22),
        (l.y = e.y),
        e.g.add(l.group),
        (t.pong = l));
      for (let t of [-1, 1])
        createPart(
          $(`pongHanger`, () => new BoxGeometry(0.05, 0.14, 0.022)),
          shadowPurple,
          e.g,
        ).position.set(o + t * 0.3, -0.47 - i / 2 - 0.03, 0.09);
      createPart(
        new TubeGeometry(
          new CatmullRomCurve3([
            Z(o - tX.w / 2 + 0.02, u + 0.025, 0.094),
            Z(o - 0.52, u - 0.005, 0.06999999999999999),
            Z(o - 0.56, u + 0.1, 0.03),
            Z(o - 0.5, -0.925, -0.01),
            Z(o - 0.4, -0.87, -0.02),
          ]),
          24,
          0.011,
          6,
        ),
        paleBlue,
        e.g,
      );
      for (let t of c) {
        let a = pG(e.g, {
          w: r,
          h: i,
          d: 0.5,
          color: amber,
          led: t.led,
          stickers: {
            sides: 3,
            side: -1,
            back: 3,
            size: [0.15, 0.26],
          },
        });
        (a.group.position.set(o, t.y, 0),
          n.from(a.group).rect(a.w, a.h, a.front + 0.01, t.glow, t.sides));
      }
      yH(e.g, Z(a, -0.8, 0), Z(a, 0.8, 0), 0.045, amber);
      for (let t of [-0.8, 0.8]) bH(e.g, Z(a, t, 0), 0.045, amber);
      for (let n of [0.62, -0.62])
        (yH(e.g, Z(-0.14, n, 0), Z(a, n, 0), 0.035, amber),
          bH(e.g, Z(a, n, 0), 0.058, amber, 12),
          fQ(t, e, n, blue, 0.16, 0.04));
      (zH(
        e.g,
        jH(Z(a, 0, 0), sG, cG, lG, 0.045),
        0.2,
        0,
        0.06 * OU,
        0.06,
        `tape_lookUp`,
      ),
        gQ(t, e, `Birds_Ped`, o, 0.8999999999999999, 0, 0.4, 2));
    },
    StreetBlades: (e, t) => {
      let n = DH(
        e.g,
        SH(1.64, 0.46, 0.06),
        SH(1.6, 0.42, 0.05),
        `#2aa9a6`,
        `bladeA`,
      );
      (n.position.set(HZ(1.04), 0.62, 0),
        HQ(t, e.g, `blender`, n, e.y),
        _Q(n, -0.15, -0.045, 0.62, 0.16, 3));
      let r = dQ(e, 0.04, 0.75, `BladeB`),
        i = DH(
          r.g,
          SH(1.56, 0.4, 0.06),
          SH(1.52, 0.36, 0.05),
          palette.green,
          `bladeB`,
        );
      (i.position.set(HZ(1), 0, 0),
        HQ(t, r.g, `threejs`, i, e.y),
        _Q(i, -0.15, -0.045, 0.58, 0.13, 2));
      let a = DH(
        e.g,
        SH(1.56, 0.3, 0.06),
        SH(1.5, 0.24, 0.04),
        palette.purple,
        `tag`,
      );
      (a.position.set(HZ(1), -0.5, 0),
        HQ(t, e.g, `shaders`, a, e.y),
        _Q(a, -0.1, -0.045, 0.6, 0.09, 1),
        fQ(t, e, 0.62, palette.lime, 0.6, 0.05),
        fQ(t, r, 0, blue, 0.5, 0.045),
        fQ(t, e, -0.5, palette.purple, 0.4, 0.04));
      let o = 0.025 + EH + 0.004;
      for (let [t, n, i] of [
        [e.g, 0.62, 0.13],
        [r.g, 0, 0.11],
        [e.g, -0.5, 0.07],
      ])
        for (let e of [-1, 1]) xH(t, Z(-0.4, n + e * i, o), cG, shadowPurple);
      let s = dQ(e, -1.02, -0.42, `BladeSubstance`),
        c = DH(
          s.g,
          SH(1.56, 0.3, 0.06),
          SH(1.5, 0.24, 0.04),
          palette.hotPink,
          `bladeG`,
        );
      (c.position.set(HZ(1), 0, 0),
        HQ(t, s.g, `substance`, c, e.y),
        _Q(c, -0.1, -0.045, 0.5, 0.1, 1),
        fQ(t, s, 0, palette.hotPink, 0.4, 0.045));
      for (let e of [-1, 1]) xH(s.g, Z(-0.4, e * 0.09, o), cG, shadowPurple);
      (_Q(c, 0, -0.045, 0.36, 0.07, 1),
        (t.streets.find((e) => e.key === `blender`).birds = gQ(
          t,
          e,
          `Birds_Blades`,
          n.position.x - 0.15,
          0.85 + EH,
          0,
          0.55,
          2,
        )));
    },
    BusStop: (e, t) => {
      let { w: n, h: r } = $Z,
        i = 0.11,
        a = -0.5 + EH + eQ.h / 2,
        o = a + eQ.h / 2 + 2 * EH + 0.03 + r / 2,
        s = HZ(0.56 + n / 2),
        c = HZ(0.56 + eQ.w / 2),
        l = DH(
          e.g,
          SH(n, r, 0.1),
          SH(n - 0.04, r - 0.04, 0.08),
          palette.green,
          `busStop`,
        );
      l.position.set(s, o, i);
      for (let [n, r] of [
        [0.76, s],
        [0.04, c],
      ])
        (pQ(e, r - 0.32, n, 0.04, polePurple, 0.035),
          fQ(t, e, n, palette.green, 0.14, 0.04));
      (_Q(
        new Group(),
        0,
        -0.045,
        0.34,
        0.44,
        3,
        (e, t, n) => Math.abs(Math.abs(t) - 0.36) < 0.05 + n,
      ),
        withRandomSeed(
          () =>
            _Q(
              l,
              0,
              -0.045,
              0.4,
              r / 2 - 0.1,
              2,
              (e, t, n) => Math.abs(t - (0.76 - o)) < 0.05 + n,
            ),
          2821,
        ));
      let u = gQ(t, e, `Birds_Bus`, s, o + r / 2 + EH, i, 0.32, 2);
      if (!GQ) {
        let e = vV.marquee(`NEXT STOP → FILM 400  •`, [
          palette.yellow,
          palette.orange,
        ]);
        GQ = aV({
          cols: 44,
          rows: 9,
          draw: e,
          scrollCols: e.cols,
          scrollSpeed: 9 / e.cols,
        });
      }
      let d = HZ(1.06);
      (pG(e.g, {
        w: 1,
        h: 0.36,
        d: 0.26,
        color: inkPurple,
        bezel: palette.green,
        led: GQ,
        vents: !1,
        glint: `single`,
        stickers: {
          back: 2,
          size: [0.1, 0.16],
        },
      }).group.position.set(d, -0.72, 0),
        pQ(e, HZ(0.56) - 0.06, -0.6, 0.035, shadowPurple, 0, !1),
        fQ(t, e, -0.6, palette.green, 0.1, 0.04));
      let f = DH(
        e.g,
        SH(eQ.w, eQ.h, 0.08),
        SH(eQ.w - 0.04, eQ.h - 0.04, 0.06),
        palette.green,
        `timetable`,
      );
      (f.position.set(c, a, i),
        withRandomSeed(
          () =>
            _Q(
              f,
              0,
              -0.045,
              0.4,
              eQ.h / 2 - 0.08,
              2,
              (e, t, n) => Math.abs(t - (0.04 - a)) < 0.05 + n,
            ),
          2822,
        ),
        (t.route = VQ(e, Z(c, a, i), u)));
    },
    FilmCam: (e, t, n) => {
      XV(() => t.interactive(`FilmCam`, e, n, 3857, wW));
    },
    UfoCrossing: (e, t) => {
      let n = 1.4,
        r = HZ(1.28),
        i = 0.11,
        a = DH(
          e.g,
          SH(n, n, 0.12),
          SH(1.3599999999999999, 1.3599999999999999, 0.1),
          paperWhite,
          `ufo`,
        );
      a.position.set(r, 0, i);
      for (let n of [0.42, -0.42])
        (pQ(e, r - 0.5, n, 0.04, polePurple, 0.035),
          fQ(t, e, n, palette.purple, 0.14, 0.04));
      (_Q(
        a,
        0,
        -0.045,
        0.58,
        0.58,
        4,
        (e, t, n) => Math.abs(Math.abs(t) - 0.42) < 0.05 + n,
      ),
        gQ(t, e, `Birds_Ufo`, r, n / 2 + EH, i, 0.6, 3));
    },
    LedBox: (e, t, n) => {
      let r = HZ(1.46),
        i = pG(e.g, {
          w: 1.5,
          h: 1.5,
          d: 0.56,
          color: palette.yellow,
          bezel: palette.lime,
          led: {
            cols: 29,
            rows: 29,
            draw: (e, t) =>
              vV.words(OQ[t], t < 4 ? palette.yellow : palette.lilac)(e, t),
            frames: OQ.length,
            fps: 1.4,
          },
          stickers: {
            sides: 3,
            back: 6,
            size: [0.16, 0.32],
          },
        });
      (i.group.position.set(r, 0, 0),
        n.from(i.group).rect(i.w, i.h, i.front + 0.01, palette.lilac, {
          left: !0,
          right: !0,
        }));
      for (let n of [0.88, -0.88]) {
        (pQ(e, -2, n, 0.07, paperWhite),
          fQ(t, e, n, palette.orange, 0.18, 0.04));
        for (let t of [0.4, -0.4])
          yH(
            e.g,
            Z(r + t, Math.sign(n) * 0.73, 0),
            Z(r + t, n, 0),
            0.035,
            paperWhite,
            10,
          );
      }
      (zH(e.g, vQ(0.88, 0.07), -0.95, -0.02, 0.1 * OU, 0.1, `tape_scroll`),
        zH(e.g, vQ(-0.88, 0.07), -1.35, 0.01, 0.1 * OU, 0.1, `tape_hazard`),
        gQ(t, e, `Birds_LedBox`, -1.26, 0.95, 0, 0.64, 3));
    },
    Phone: (e, t, n) => {
      t.interactive(`Phone`, e, n, 3854, vY, {
        lift: 0.2,
      });
    },
    NoEntry: (e, t, n) => {
      let r = 0.7,
        i = HZ(1.31),
        a = 0.1,
        o = new Group();
      ((o.name = `Lightbox`), o.position.set(i, 0, a), e.g.add(o));
      let s = createPart(
        $(`noEntryDrum`, () => new CylinderGeometry(r, r, 0.24, 48, 1)),
        amber,
        o,
      );
      s.rotation.x = Math.PI / 2;
      let c = createPart(
        $(
          `noEntryBezel`,
          () => new TorusGeometry(0.6399999999999999, 0.045, 10, 48),
        ),
        palette.red,
        o,
      );
      c.position.z = 0.125;
      let l = aV({
        cols: 23,
        rows: 23,
        draw: vV.noEntry(),
        frames: 2,
        fps: 1.1,
      });
      l.glass(`round`);
      let u = new Mesh(TH(new CircleGeometry(0.62, 48)), l.material);
      ((u.name = `Screen`), (u.position.z = 0.123), o.add(u));
      for (let e of [0.8, 2.35, 3.93, 5.5])
        xH(
          o,
          Z(
            Math.cos(e) * 0.6399999999999999,
            Math.sin(e) * 0.6399999999999999,
            0.16999999999999998,
          ),
          cG,
          paleBlue,
          0.015,
        );
      (LH(
        o,
        AH(Z(0, 0, 0.123), oG, sG),
        0,
        0,
        lQ.w,
        lQ.h,
        0.1,
        mH(`nonstop`),
        0.006,
      ),
        VH(o, AH(Z(0, 0, -0.24 / 2), lG, sG), {
          count: 4,
          size: [0.16, 0.26],
          hw: 0.42,
          hh: 0.42,
        }),
        n
          .from(o)
          .burst(
            0,
            0,
            0.13,
            0.77,
            [0.45, 1.05, 1.57, 2.1, 2.65, 3.14, 3.65, 4.15],
            palette.red,
            3,
          ));
      for (let n of [0.35, -0.35])
        (pQ(e, i + 0.25, n, 0.045, polePurple),
          fQ(t, e, n, palette.red, 0.14, 0.04));
      let d = Z(i + 0.14, -0.55, a),
        f = new CatmullRomCurve3([
          Z(-0.1, -0.92, 0),
          Z(-0.42, -1.07, 0.08),
          Z(i + 0.5, -1.13, a),
          Z(i + 0.17, -0.92, a),
          d,
        ]);
      createPart(new TubeGeometry(f, 48, 0.06, 10), paperWhite, e.g);
      let p = Z(),
        m = Z(),
        h = $(`hoseRing`, () => new TorusGeometry(0.066, 0.012, 6, 12)),
        g = (e, t, n) => {
          let r = n(f.getPointAt(e, p));
          for (let i = 0; i < 24; i++) {
            let i = (e + t) / 2;
            n(f.getPointAt(i, p)) === r ? (e = i) : (t = i);
          }
          return e;
        },
        _ = g(0, 0.3, (e) => Math.hypot(e.x, e.z) < 0.28),
        v = g(0.6, 1, (e) => Math.hypot(e.x - i, e.y) < r);
      for (let t = 0; t < 12; t++) {
        let n = _ + 0.06 + (t / 11) * (v - _ - 0.12);
        (f.getPointAt(n, p), f.getTangentAt(n, m));
        let r = createPart(h, paperWhite, e.g);
        (r.position.copy(p), r.quaternion.setFromUnitVectors(cG, m));
      }
      let y = $(
        `hoseFitting`,
        () => new CylinderGeometry(0.085, 0.085, 0.08, 14),
      );
      for (let n of [_, v]) {
        (f.getPointAt(n, p), f.getTangentAt(n, m));
        let r = createPart(y, shadowPurple, e.g);
        (r.position.copy(p),
          r.quaternion.setFromUnitVectors(sG, m),
          n === _ && hQ(t, e, p.y - 0.12, p.y + 0.12, p.x, p.z, 0.1));
      }
    },
    ProjectsArrow: (e, t) => {
      let n = 2.7,
        r = 0.86,
        i = 0.16,
        a = [
          WZ(-2.7 / 2, 0),
          WZ(-0.8300000000000001, r / 2),
          WZ(n / 2, r / 2),
          WZ(n / 2, -0.86 / 2),
          WZ(-0.8300000000000001, -0.86 / 2),
        ],
        o = HZ(1.75),
        s = DH(
          e.g,
          CH(a, 0.08),
          CH(
            a.map((e) => e.clone().multiplyScalar(0.96)),
            0.06,
          ),
          palette.orange,
          `arrow`,
          i,
        );
      s.position.set(o, 0, 0);
      let c = i / 2 + EH + 0.004;
      for (let n of [0.28, -0.28])
        (fQ(t, e, n, palette.orange, 0.16, 0.06),
          mQ(e, -0.2, -0.52, n, 0.1, 0.12),
          xH(e.g, Z(-0.47, n, c), cG, shadowPurple));
      (_Q(s, 0.25, -(i / 2 + EH), 0.95, 0.33, 5),
        gQ(t, e, `Birds_Arrow`, o + 0.52 / 2 + 0.04, r / 2 + EH, 0, 0.95, 4));
    },
    EmojiStack: (e, t, n) => {
      let r = HZ(1.33),
        i = [palette.lime, palette.yellow, palette.orange],
        a = {
          w: 0.74,
          h: 0.74,
          d: 0.5,
        },
        o = (e) => 0.55 - e * 0.8,
        s = -0.263,
        c = WY(),
        l = [];
      c.reels.forEach((t, s) => {
        let c = pG(e.g, {
          ...a,
          color: amber,
          led: {
            cols: 18,
            rows: 18,
            draw: t,
          },
          stickers: {
            sides: 1,
            size: [0.14, 0.22],
          },
        });
        (c.group.position.set(r, o(s), 0),
          (c.group.rotation.z = (s - 1) * 0.05));
        let u = s === i.length - 1;
        n.from(c.group).rect(c.w, c.h, c.front + 0.01, i[s], {
          left: !u,
          right: !u,
          bottom: u,
        });
        let d = new Mesh(
          $(`slotHit`, () => new BoxGeometry(0.8, 0.8, 0.6)),
          kQ,
        );
        ((d.position.z = 0.02),
          (d.visible = !1),
          (d.userData.noExport = !0),
          (d.userData.bakeSkip = !0),
          c.group.add(d),
          l.push(d));
      });
      let u = FX(c),
        d = HZ(0.33 + vX.w / 2),
        f = -1.05;
      (u.group.position.set(d, f, 0.04), e.g.add(u.group));
      for (let n of [0.26, -0.26])
        (fQ(t, e, f + n, palette.yellow, 0.1, 0.04, !1),
          mQ(e, -0.2, d + vX.w / 2 - 0.03, f + n, 0.08, 0.05));
      let p = new Mesh(
        $(
          `slotButtonHit`,
          () => new BoxGeometry(vX.w + 0.16, vX.h + 0.14, 0.42),
        ),
        kQ,
      );
      ((p.position.z = 0.06),
        (p.visible = !1),
        (p.userData.noExport = !0),
        (p.userData.bakeSkip = !0),
        u.group.add(p),
        l.push(p));
      let m = SZ(e.g, c, {
        x: r,
        ...a,
        ys: i.map((e, t) => o(t)),
        spineZ: s,
      });
      ((t.slot = {
        machine: c,
        button: u,
        hits: l,
        y: e.y,
        printer: m,
      }),
        createPart(
          new BoxGeometry(0.12, 2.22, 0.05),
          shadowPurple,
          e.g,
        ).position.set(r, o(1), s));
      for (let t of [0, 1]) {
        let n = (o(t) + o(t + 1)) / 2;
        yH(e.g, Z(r, n - 0.05, 0), Z(r, n + 0.05, 0), 0.05, shadowPurple, 10);
      }
      let h = 1.1;
      (yH(e.g, Z(-0.14, h, 0), Z(r - 0.09, h, 0), 0.09, amber, 20),
        bH(e.g, Z(r - 0.09, h, 0), 0.09, amber, 14),
        yH(e.g, Z(r, 0.9, 0), Z(r, h, 0), 0.035, shadowPurple, 10),
        fQ(t, e, h, amber, 0.3, 0.05),
        zH(e.g, vQ(h, 0.09), -0.8, -0.01, 0.1 * OU, 0.1, `tape_mesq`),
        IQ(e, t, JZ, 1.62, palette.teal, `linkArt`));
    },
    AboutSign: (e, t) => {
      let n = 0.66,
        r = 0.08,
        i = 0.2,
        a = HZ(1.6199999999999999),
        o = DH(e.g, SH(2.4, n, 0.1), SH(2.36, 0.62, 0.08), blue, `about`, r);
      o.position.set(a, i, 0);
      let s = r / 2 + EH + 0.004;
      for (let n of [0.17, -0.17])
        (fQ(t, e, i + n, blue, 0.14, 0.05),
          mQ(e, -0.2, -0.54, i + n, 0.09, 0.1),
          xH(e.g, Z(-0.49, i + n, s), cG, paleBlue));
      _Q(o, 0.2, -(r / 2 + EH), 0.9, 0.24, 4);
      let c = 0.3,
        l = a - 0.35,
        u = i - n / 2 - EH - 0.1 - EH - c / 2,
        d = DH(
          e.g,
          SH(1.3, c, 0.05),
          SH(1.26, 0.26, 0.04),
          palette.yellow,
          `here`,
        );
      d.position.set(l, u, 0);
      for (let t of [-1, 1])
        yH(
          e.g,
          Z(l + t * 0.48, u + c / 2 - 0.03, 0),
          Z(l + t * 0.48, -0.1, 0),
          0.013,
          shadowPurple,
          8,
        );
      (_Q(d, 0, -0.045, 0.5, 0.08, 1),
        gQ(t, e, `Birds_About`, a - 0.15, 0.53 + EH, 0, 0.8, 2));
    },
    ContactsBubble: (e, t) => {
      let n = 0.06,
        r = HZ(0.44 + aQ.w / 2),
        i = 0.27,
        a = DH(e.g, oQ(), oQ(aQ.inset), inkPurple, `bubble`, n);
      a.position.set(r, i, 0);
      let o = n / 2 + EH + 0.004;
      for (let n of [0.2, -0.2])
        (fQ(t, e, i + n, palette.hotPink, 0.14, 0.05),
          mQ(e, -0.2, -0.56, i + n, 0.09, 0.08),
          xH(e.g, Z(-0.51, i + n, o), cG, paleBlue));
      (_Q(a, -0.3, -(n / 2 + EH), 0.6, 0.22, 3),
        gQ(t, e, `Birds_Bubble`, r - 0.2, i + aQ.h / 2 + EH, 0, 0.62, 3));
    },
    Crossbuck: (e, t, n) => {
      let r = HZ(0.61 + 1),
        i = 0.3,
        a = -0.82;
      for (let [t, n, a] of [
        [`rail1`, 0.52, 0.08],
        [`rail0`, -0.52, 0.18],
      ]) {
        let o = new Group();
        (o.position.set(r, i, a),
          (o.rotation.z = n),
          e.g.add(o),
          _Q(
            DH(o, SH(2.1, 0.36, 0.05), SH(2.06, 0.32, 0.04), palette.red, t),
            0,
            -0.045,
            0.9,
            0.12,
            2,
            (e, t, n) => Math.abs(e) < 0.26 + n,
          ));
      }
      (yH(e.g, Z(r, a, 0), Z(r, 0.42, 0), 0.05, polePurple, 12),
        bH(e.g, Z(r, 0.42, 0), 0.05, polePurple, 12),
        pQ(e, r, i, 0.045, polePurple, -0.02, !1),
        pQ(e, r - 0.62, a, 0.045, polePurple),
        bH(e.g, Z(r, a, 0), 0.07, polePurple, 12));
      for (let n of [i, a]) fQ(t, e, n, palette.red, 0.14, 0.04);
      zH(
        e.g,
        jH(Z(r, -0.34, 0), sG, cG, lG, 0.05),
        0,
        0,
        0.05 * OU,
        0.05,
        `tape_hazard`,
      );
      let o = $(`crossbuckBoard`, () =>
          new CylinderGeometry(0.27, 0.27, 0.04, 32).rotateX(Math.PI / 2),
        ),
        s = $(`crossbuckRing`, () => new TorusGeometry(0.255, 0.012, 6, 32));
      for (let t of [-1, 1]) {
        let i = r + t * 0.62;
        (createPart(o, inkPurple, e.g).position.set(i, a, 0.06),
          createPart(s, paperWhite, e.g).position.set(i, a, 0.08));
        let c = new Group();
        (c.position.set(i, a, 0.08), e.g.add(c));
        let l = TG(
            c,
            {
              cols: 14,
              rows: 14,
              draw: vV.lamp(palette.red, t < 0),
              frames: 2,
              fps: 1.4,
            },
            0.5,
          ),
          u =
            t < 0
              ? [2.5, 3.14, 3.78, 4.4, 4.9]
              : [-0.5, -1.05, -1.57, -2.1, -2.65];
        n.from(c).burst(0, 0, l.front + 0.02, 0.31, u, palette.red, 3);
      }
    },
    ConvexMirror: (e, t) => {
      let n = 0.56,
        r = new Group();
      ((r.name = `Mirror`),
        r.position.set(HZ(1.2800000000000002), 0.2, 0.12),
        r.rotation.set(0.1, -0.08, 0),
        e.g.add(r));
      let i = 0.32360000000000005 / 0.2,
        a = new SphereGeometry(i, 40, 8, 0, Math.PI * 2, 0, Math.asin(n / i));
      (a.rotateX(Math.PI / 2), a.translate(0, 0, -1.518));
      let o = a.attributes.position,
        s = a.attributes.uv;
      for (let e = 0; e < s.count; e++)
        s.setXY(e, o.getX(e) / (2 * n) + 0.5, o.getY(e) / (2 * n) + 0.5);
      (createPart(mapAtlasUV(a, mH(`mirror`)), `#ffffff`, r, `atlas`),
        createPart(
          $(
            `mirrorRim`,
            () => new TorusGeometry(0.5900000000000001, 0.05, 10, 48),
          ),
          palette.orange,
          r,
        ));
      let c = createPart(
        $(
          `mirrorShell`,
          () =>
            new SphereGeometry(
              0.6200000000000001,
              32,
              8,
              0,
              Math.PI * 2,
              0,
              Math.PI / 2,
            ),
        ),
        palette.orange,
        r,
      );
      (c.scale.set(1, 0.32, 1), (c.rotation.x = -Math.PI / 2));
      let l = $(`mirrorHood`, () => {
        let e = new Shape();
        return (
          e.absarc(0, 0, 0.66, 0.2, Math.PI - 0.2, !1),
          e.absarc(0, 0, 0.6200000000000001, Math.PI - 0.2, 0.2, !0),
          e.closePath(),
          new ExtrudeGeometry(e, {
            depth: 0.22,
            bevelEnabled: !1,
            curveSegments: 24,
          })
        );
      });
      ((createPart(l, palette.orange, r).position.z = -0.02),
        (createPart(
          $(`mirrorPlate`, () => new BoxGeometry(0.36, 0.36, 0.05)),
          shadowPurple,
          r,
        ).position.z = -0.2),
        VH(r, AH(Z(0, 0, -0.225), lG, sG), {
          count: 2,
          size: [0.09, 0.12],
          hw: 0.17,
          hh: 0.17,
          avoid: (e, t, n) => Math.hypot(e, t) < 0.06 + n,
        }),
        r.updateMatrix());
      let u = Z(0, 0, -0.215).applyMatrix4(r.matrix),
        d = Z(0, 0, -1).applyQuaternion(r.quaternion),
        f = -0.74,
        p = -0.6;
      (yH(e.g, Z(-0.14, f, 0), Z(p, f, 0), 0.05, polePurple, 12),
        bH(e.g, Z(p, f, 0), 0.05, polePurple, 12),
        createPart(
          new TubeGeometry(
            new CubicBezierCurve3(
              Z(p, f, 0),
              Z(-1.05, f, 0),
              u.clone().addScaledVector(d, 0.45),
              u,
            ),
            40,
            0.05,
            12,
          ),
          polePurple,
          e.g,
        ),
        fQ(t, e, f, palette.orange, 0.16, 0.04),
        zH(e.g, vQ(f, 0.05), -0.45, -0.01, 0.045 * OU, 0.045, `tape_dontWait`));
    },
    ParkingMeter: (e, t, n) => {
      let r = 1.12,
        i = HZ(1.12),
        a = 0.44,
        o = 0.11,
        s = DH(e.g, SH(r, r, 0.12), SH(1.08, 1.08, 0.1), blue, `parking`);
      s.position.set(i, a, o);
      for (let n of [0.3, -0.3])
        (pQ(e, i - 0.48, a + n, 0.04, polePurple, 0.035),
          fQ(t, e, a + n, palette.yellow, 0.14, 0.04));
      (_Q(
        s,
        0,
        -0.045,
        0.46,
        0.46,
        3,
        (e, t, n) => Math.abs(Math.abs(t) - 0.3) < 0.05 + n,
      ),
        gQ(t, e, `Birds_Parking`, i, 1 + EH, o, 0.38, 2));
      let c = 0.72,
        l = 0.5,
        u = HZ(0.84),
        d = -0.62,
        f = pG(e.g, {
          w: c,
          h: l,
          d: 0.36,
          color: palette.purple,
          bezel: palette.yellow,
          led: {
            cols: 36,
            rows: 20,
            draw: vV.liveClock(palette.orange),
          },
          vents: !1,
          stickers: {
            sides: 1,
            side: -1,
            back: 2,
            size: [0.1, 0.16],
          },
        });
      (f.group.position.set(u, d, 0),
        n.from(f.group).rect(f.w, f.h, f.front + 0.01, palette.orange, {
          left: !0,
          top: !0,
        }));
      let p = new Group();
      (p.position.set(u, d - l / 2 - 0.18, 0),
        e.g.add(p),
        createPart(
          new RoundedBoxGeometry(0.48, 0.4, 0.32, 2, 0.04),
          shadowPurple,
          p,
        ),
        createPart(
          $(`coinSlot`, () => new BoxGeometry(0.12, 0.02, 0.02)),
          paleBlue,
          p,
        ).position.set(0, 0.09, 0.16),
        LH(
          p,
          AH(Z(0, 0, 0.16), oG, sG),
          0,
          -0.06,
          0.24,
          0.09,
          0,
          mH(`payLabel`),
          0.003,
        ),
        pQ(e, u + c / 2 - 0.05, d, 0.045, shadowPurple, 0, !1),
        fQ(t, e, d, palette.yellow, 0.12, 0.04),
        mQ(e, -0.2, p.position.x + 0.24 - 0.04, p.position.y, 0.07, 0.06),
        fQ(t, e, p.position.y, palette.yellow, 0.1, 0.04));
    },
    Finale: (e, t, n) => {
      t.interactive(`Ending`, e, n, 3613, Dq);
    },
  };
  var OQ = [
    [`OPEN`, ``, ``],
    [`OPEN`, `OPEN`, ``],
    [`OPEN`, `OPEN`, `OPEN`],
    [`OPEN`, `OPEN`, `OPEN`],
    [`TRY`, `TRY`, `TRY`],
    [`TRY`, `TRY`, `TRY`],
  ];
  var kQ = new MeshBasicNodeMaterial({
    visible: !1,
  });
  var AQ = 2.6;
  var jQ = 0.8;
  var MQ = 2;
  var NQ = Math.max(AQ, MQ);
  var PQ = 0.9;
  var FQ = `copy:email`;
  function IQ(e, t, { label: n, href: r, bg: i, angle: a, lit: o }, s, c, l) {
    ((createPart(
      $(`swivel`, () => new CylinderGeometry(0.3, 0.3, 0.44, 24)),
      c,
      e.g,
    ).position.y = s),
      t.skin.ring(e.y + s - 0.24, e.y + s + 0.24));
    let u = new Group();
    ((u.name = `Link_${n}`),
      (u.userData.href = r),
      (u.userData.bakeSkip = !0),
      (u.position.y = s),
      (u.rotation.y = a),
      e.g.add(u));
    let d = new Group();
    ((d.rotation.order = `YXZ`), u.add(d));
    let f = HZ(1.22),
      p = DH(d, SH(2, 0.32, 0.06), SH(1.96, 0.28, 0.05), i, l);
    p.position.x = f;
    for (let e of [-1, 1])
      xH(d, Z(-0.4, e * 0.09, 0.049), cG, shadowPurple, 0.018);
    (_Q(p, -0.15, -0.045, 0.75, 0.1, 2),
      bakeStaticGeometry(d, `Link_${n}_Blade`, !0));
    let m = OH(d, SH(1.96, 0.28, 0.05), `${l}Hi`, 0.05, o?.bloom);
    ((m.name = `Link_${n}_Glow`),
      (m.position.x = f),
      (m.visible = !1),
      (m.userData.noExport = !0));
    let h = new Mesh(
      $(`linkHit`, () => new BoxGeometry(2.1, 0.44, 0.26)),
      kQ,
    );
    ((h.position.x = f),
      (h.visible = !1),
      (h.userData.noExport = !0),
      u.add(h),
      t.blades.push({
        mount: u,
        swing: d,
        base: a,
        reach: f,
        yaw: 0,
        yawV: 0,
        tilt: 0,
        tiltV: 0,
        hit: h,
        holder: e.g,
        stationY: e.y,
        home: e.y === $Q ? scrollStops.contacts : -e.y,
        shake: 0,
        shakeT: NQ,
        glow: m,
      }));
  }
  var LQ = 0.5;
  var RQ = 0.6;
  var zQ = (e) =>
    e < MQ
      ? Math.min(1, Math.max(0, e) * 6) * (1 - MathUtils.smoothstep(e, jQ, MQ))
      : 0;
  var BQ = new Vector3();
  function VQ(e, t, n) {
    let r = tQ * nQ.row,
      i = new Group();
    ((i.name = `Timetable_Links`),
      (i.userData.bakeSkip = !0),
      i.position.copy(t),
      e.g.add(i));
    let a = MB.map((e, t) => {
        let n = new Group();
        ((n.name = `Stop_${t}`),
          (n.userData.href = ZZ(t)),
          (n.position.y = rQ(t)),
          i.add(n));
        let a = new Mesh(
          $(`ttRowHit`, () => new BoxGeometry(eQ.w - 0.04, r, 0.16)),
          kQ,
        );
        ((a.visible = !1), (a.userData.noExport = !0), n.add(a));
        let o = OH(n, SH(eQ.w - 0.04, r, 0.02), `tt${t}Hi`, 0.05, 0.25);
        return (
          (o.name = `Stop_${t}_Glow`),
          (o.visible = !1),
          (o.userData.noExport = !0),
          {
            mount: n,
            hit: a,
            glow: o,
            level: 0,
            flashT: MQ,
          }
        );
      }),
      o = new Group();
    ((o.name = `Stop_Sheet`), (o.userData.href = XZ), i.add(o));
    let s = new Mesh(new BoxGeometry(eQ.w + 0.04, eQ.h + 0.04, 0.06), kQ);
    return (
      (s.position.z = -0.05),
      (s.visible = !1),
      (s.userData.noExport = !0),
      o.add(s),
      {
        rows: a,
        birds: n,
        y: e.y,
        sheet: {
          mount: o,
          hit: s,
        },
      }
    );
  }
  function HQ(e, t, n, r, i) {
    let a = YZ.find((e) => e.key === n),
      o = new Group();
    ((o.name = `Street_${n}`),
      (o.userData.href = `say:${n}`),
      (o.userData.bakeSkip = !0),
      o.position.copy(r.position),
      t.add(o));
    let s = new Mesh(
      $(
        `streetHit_${n}`,
        () => new BoxGeometry(a.w + 0.1, a.hitH ?? a.h + 0.1, 0.2),
      ),
      kQ,
    );
    ((s.visible = !1), (s.userData.noExport = !0), o.add(s));
    let c = OH(o, SH(a.w, a.h, a.r), `${a.atlas}Hi`, 0.05, a.lit.bloom);
    ((c.name = `Street_${n}_Glow`),
      (c.visible = !1),
      (c.userData.noExport = !0),
      e.streets.push({
        key: n,
        mount: o,
        hit: s,
        glow: c,
        stationY: i,
        level: 0,
        flashT: MQ,
        birds: null,
      }));
  }
  function UQ(e, t, n) {
    let r = HZ(1.46),
      i = pG(e.g, {
        w: 1.6,
        h: 1,
        d: 0.5,
        color: palette.pink,
        bezel: inkPurple,
        led: {
          cols: 50,
          rows: 29,
          draw: vV.snake(),
        },
        stickers: {
          sides: 3,
          side: -1,
          back: 5,
          size: [0.15, 0.27],
        },
      });
    (i.group.position.set(r, 0.67, 0),
      n.from(i.group).rect(i.w, i.h, i.front + 0.01, palette.cyan, {
        left: !0,
        bottom: !0,
      }));
    for (let n of [0.97, 0.37000000000000005])
      (pQ(e, r + 0.8 - 0.06, n, 0.045, shadowPurple, 0, !1),
        fQ(t, e, n, palette.pink, 0.12, 0.04));
    (zH(
      e.g,
      vQ(0.37000000000000005, 0.045),
      -0.48,
      0,
      0.05 * OU,
      0.05,
      `tape_keepGoing`,
    ),
      gQ(t, e, `Birds_Contacts`, r, 1.17, 0, 0.6, 3),
      qZ.forEach((n, r) => {
        IQ(
          e,
          t,
          n,
          -0.18 - r * 0.46,
          r % 2 ? palette.lime : palette.yellow,
          `link${r}`,
        );
      }));
    let a = -0.18 - qZ.length * 0.46 - 0.34,
      o = HZ(0.74),
      s = (t) => (
        t.position.set(o, a, 0.04),
        (t.rotation.y = 0.4),
        t.scale.setScalar(1.35),
        e.g.add(t),
        t
      ),
      c = s(new Group());
    c.name = `Mailbox`;
    let l = s(new Group());
    ((l.name = `Link_Mail`),
      (l.userData.href = FQ),
      (l.userData.bakeSkip = !0));
    let u = eX(c, l, `Mail`),
      d = new Mesh(
        $(`mailHit`, () => new BoxGeometry(0.56, 0.42, 0.76)),
        kQ,
      );
    ((d.position.y = 0.21),
      (d.visible = !1),
      (d.userData.noExport = !0),
      l.add(d));
    let f = a + 0.15;
    return (
      mQ(e, -0.2, o, f, 0.08, 0.07),
      fQ(t, e, f, palette.hotPink, 0.1, 0.04),
      yH(
        e.g,
        Z(-0.1, a - 0.16, 0),
        Z(o + 0.1, a + 0.02, 0.02),
        0.026,
        shadowPurple,
        8,
      ),
      fQ(t, e, a - 0.16, shadowPurple, 0.08, 0.04),
      {
        link: l,
        box: u,
        flag: ZY.flagDown,
        flagV: 0,
        door: 0,
        doorV: 0,
        show: 0,
        slow: !1,
        hit: d,
      }
    );
  }
  var WQ = null;
  var GQ = null;
  var KQ = [
    {
      collars: [[0, 0.12]],
      build: (e, t) => {
        if (!WQ) {
          let e = vV.marquee(`MESQ • PROJECTS • HELLO •`, [
            palette.lime,
            palette.pink,
            palette.cyan,
          ]);
          WQ = aV({
            cols: 61,
            rows: 11,
            draw: e,
            scrollCols: e.cols,
            scrollSpeed: 11 / e.cols,
          });
        }
        (pG(e.g, {
          w: 1.3,
          h: 0.4,
          d: 0.3,
          color: inkPurple,
          bezel: palette.purple,
          led: WQ,
          vents: !1,
          stickers: {
            back: 2,
            size: [0.12, 0.2],
          },
        }).group.position.set(HZ(1.21), 0, 0),
          pQ(e, HZ(0.56) - 0.06, 0, 0.04, shadowPurple, 0, !1),
          fQ(t, e, 0, palette.purple, 0.12, 0.04));
      },
    },
    {
      collars: [
        [0.3, 0.1],
        [-0.3, 0.1],
      ],
      build: (e, t, n) => {
        DH(
          e.g,
          SH(0.72, 0.92, 0.06),
          SH(0.66, 0.86, 0.05),
          palette.purple,
          `plate${n % 2}`,
        ).position.set(HZ(0.72), 0, 0);
        for (let n of [0.3, -0.3])
          (fQ(t, e, n, palette.teal, 0.1, 0.04),
            mQ(e, -0.2, -0.44, n, 0.07, 0.035));
        hQ(t, e, -0.5, 0.5, -0.5, 0, 0.18);
      },
    },
    {
      collars: [
        [0.2, 0.08],
        [-0.2, 0.08],
      ],
      build: (e, t) => {
        let n = new Group();
        (n.position.set(HZ(0.5), 0, 0),
          e.g.add(n),
          createPart(
            new RoundedBoxGeometry(0.4, 0.6, 0.28, 2, 0.05),
            palette.teal,
            n,
          ));
        let r = AH(Z(0, 0, 0.14), oG, sG);
        (LH(n, r, 0, 0.19, 0.2, 0.09, 0, mH(`volt`), 0.003),
          VH(n, r, {
            count: 2,
            size: [0.12, 0.2],
            hw: 0.14,
            hh: 0.13,
            lift: 0.003,
          }));
        for (let n of [0.2, -0.2])
          (fQ(t, e, n, palette.yellow, 0.08, 0.04),
            mQ(e, -0.2, -0.32, n, 0.07, 0.05));
        (createPart(
          new TubeGeometry(
            new CatmullRomCurve3([
              Z(-0.42, -0.28, 0.06),
              Z(-0.42, -0.4, 0.07),
              Z(-0.34, -0.47, 0.05),
              Z(-0.1, -0.5, 0.02),
            ]),
            16,
            0.016,
            6,
          ),
          paleBlue,
          e.g,
        ),
          hQ(t, e, -0.58, 0.32, -0.45, 0, 0.22));
      },
    },
    {
      collars: [[0, 0.12]],
      build: (e, t) => {
        let n = (e) => new Shape().absarc(0, 0, e, 0, Math.PI * 2, !1);
        (DH(e.g, n(0.42), n(0.38), inkPurple, `smiley`).position.set(
          HZ(0.98),
          0,
          0.08,
        ),
          pQ(e, HZ(1.18), 0, 0.035, polePurple, 0.035 - 0.027),
          fQ(t, e, 0, palette.hotPink, 0.12, 0.04));
      },
    },
  ];
  var qQ = [
    `LedBox`,
    `UfoCrossing`,
    `Crossbuck`,
    `PedSignals`,
    `ConvexMirror`,
    `NoEntry`,
    `ParkingMeter`,
    `Phone`,
    `EmojiStack`,
  ];
  var JQ = qQ.length;
  var signLayout = (() => {
    let e = [
        {
          name: `AboutSign`,
          kind: `divider`,
        },
        {
          name: `StreetBlades`,
          kind: `slot`,
        },
        {
          name: `BusStop`,
          kind: `about`,
        },
        {
          name: `FilmCam`,
          kind: `about`,
        },
        {
          name: `ProjectsArrow`,
          kind: `divider`,
        },
        ...qQ.map((e) => ({
          name: e,
          kind: `slot`,
        })),
        {
          name: `ContactsBubble`,
          kind: `divider`,
        },
        {
          name: `Contacts`,
          kind: `contacts`,
        },
        {
          name: `Finale`,
          kind: `finale`,
        },
      ],
      t = RZ;
    return e.map((n, r) => {
      if (r > 0) {
        let i = e[r - 1].kind;
        t -=
          n.kind === `contacts`
            ? MZ
            : n.kind === `finale`
              ? NZ
              : n.kind === `divider` || i === `divider`
                ? jZ
                : AZ;
      }
      return {
        ...n,
        y: Math.round(t * 1e3) / 1e3,
      };
    });
  })();
  var XQ = (e) => signLayout.find((t) => t.name === e).y;
  var ZQ = `FilmCam`;
  var QQ = 1.6;
  var $Q = XQ(`Contacts`);
  var e$ = XQ(`Finale`);
  var t$ = -0.12;
  var n$ = $Q - 3.2;
  var r$ = e$ - 3.2;
  var i$ = e$ - 40;
  var scrollStops = {
    start: 0,
    main: 0,
    dividers: {
      about: -XQ(`AboutSign`),
      projects: -XQ(`ProjectsArrow`),
      contacts: -XQ(`ContactsBubble`),
    },
    about: -XQ(`StreetBlades`),
    aboutMore: signLayout.filter((e) => e.kind === `about`).map((e) => -e.y),
    projects: signLayout
      .filter((e) => e.kind === `slot`)
      .slice(1)
      .map((e) => -e.y),
    contacts: -$Q + t$,
    end: -e$ + LZ.lift,
  };
  var o$ = (e) =>
    e.kind === `contacts`
      ? scrollStops.contacts
      : e.kind === `finale`
        ? scrollStops.end
        : -e.y;
  var s$ = [
    scrollStops.start,
    scrollStops.about,
    ...scrollStops.aboutMore,
    ...scrollStops.projects,
    scrollStops.contacts,
    scrollStops.end,
  ].sort((e, t) => e - t);
  var c$ = 1;
  var l$ = [
    {
      name: `StickerDiamond`,
      after: `ConvexMirror`,
      nudge: -0.05,
      turn: 0.05,
      build: (e, t) => {
        let n = (e) => [WZ(0, e), WZ(e, 0), WZ(0, -e), WZ(-e, 0)],
          r = DH(
            e.g,
            CH(n(0.84), 0.1),
            CH(n(0.78), 0.08),
            palette.hotPink,
            `diamond`,
          );
        r.position.set(HZ(0.42), 0, -0.42);
        for (let n of [0.28, -0.28])
          (fQ(t, e, n, blue, 0.16, 0.05),
            createPart(
              $(`diamondBracket`, () => new BoxGeometry(0.1, 0.08, 0.15)),
              blue,
              e.g,
            ).position.set(0, n, -0.315));
        _Q(
          r,
          0,
          -0.045,
          0.64,
          0.64,
          5,
          (e, t, n) => Math.abs(e) + Math.abs(t) + n * 1.42 > 0.74,
        );
      },
    },
  ];
  var SignpostWorld = class {
    group = new Group();
    flock;
    flocks;
    tuning = {
      ease: 14,
      stages: 2,
      sway: 0.015,
      extraBirds: !0,
      birdRange: 3.6,
      hoverTurn: 1,
      hoverTilt: 0.7,
      hoverSpring: 120,
      nightFrom: 0.45,
      nightTo: 0.85,
    };
    spinner = new Group();
    mast;
    blades = [];
    linkHits = [];
    birdHits = [];
    glows = [];
    flockY;
    target = 0;
    eased = 0;
    current = 0;
    hoveredLink = null;
    mail;
    slot;
    slotButton;
    tickets;
    pongPad;
    slotHits;
    slotY;
    slotGreeted = !1;
    slotRest = 0;
    slotAuto = 0;
    night = 0;
    prewarm = null;
    tmp = new Vector3();
    live = [];
    phone;
    ending;
    filmCam;
    filmY = XQ(`FilmCam`);
    liveHits = [];
    hitOwner = new Map();
    mesq = {
      talking: !1,
      waiting: -1,
    };
    streets;
    hoverLit = !0;
    route;
    routeHeld = null;
    routeReactAt = -1;
    reducedMotion;
    elapsed = 0;
    constructor() {
      (this.group.add(this.spinner),
        (this.group.name = `MesqPost`),
        (this.spinner.name = `Post`));
      let e = new TextureAtlas(createAtlasSources());
      (pH(e, createPostMaterials(e)), (this.reducedMotion = cI));
      let t = {
          skin: new PoleSkin(DZ, OZ, e),
          flocks: [],
          blades: this.blades,
          slot: null,
          pong: null,
          streets: [],
          route: null,
          interactive: (e, n, r, i, a, o = {}) => {
            let s = o$(signLayout.find((e) => e.y === n.y)),
              c = s$.indexOf(s),
              l = s$[c - 1] ?? s - AZ,
              u = s$[c + 1] ?? s + (s - l),
              d = {
                name: e,
                thing: null,
                g: n.g,
                y: n.y,
                lo: -2,
                hi: 2,
                stop: s,
                prev: l,
                next: u,
                focus: 0,
                on: !1,
              },
              f = {
                poleRadius: DZ,
                collar: (e, n, r, i, a, o) => fQ(t, e, n, r, i, a, o),
                rod: pQ,
                strap: mQ,
                keepClear: (e, n, r, i, a, o) => hQ(t, e, n, r, i, a, o),
                perch: (e, n, r, i, a, o, s, c) =>
                  gQ(t, e, n, r, i, a, o, s, c),
                backStickers: _Q,
                child: dQ,
                hitMaterial: kQ,
                focus: () => d.focus,
                talking: () => this.mesq.talking,
                waiting: () => this.mesq.waiting,
                reducedMotion: cI,
              };
            d.thing = withRandomSeed(
              () => a(o.lift ? dQ(n, o.lift, 0, `${e}Lift`) : n, f, r),
              i,
            );
            for (let e of d.thing.hits) this.hitOwner.set(e, d.thing);
            return (this.live.push(d), d.thing);
          },
        },
        n = signLayout.findIndex((e) => e.name === ZQ),
        r = signLayout[n - 1].y - signLayout[n].y,
        i = signLayout[n - 1].y - QQ;
      t.skin.splice(i, r, r * PZ);
      let a = new Group();
      ((a.name = `MastHolder`),
        (a.rotation.y = IZ - UZ(0)),
        this.spinner.add(a));
      let o = new Group();
      ((o.name = `Mast`),
        a.add(o),
        (this.mast = EQ(t, {
          g: o,
          y: 0,
          yaw: a.rotation.y,
        })));
      let s = null,
        c = 0,
        l = (e, n) => {
          let r = new Group();
          ((r.name =
            e.kind === `contacts`
              ? `Contacts`
              : e.kind === `finale`
                ? `Finale`
                : `Slot_${String(n + 1).padStart(2, `0`)}_${e.kind === `divider` ? `Divider_` : ``}${e.name}`),
            (r.position.y = e.y),
            (r.rotation.y = FZ - UZ(o$(e))),
            this.spinner.add(r));
          let i = {
              g: r,
              y: e.y,
              yaw: r.rotation.y,
            },
            a = new GlowGeometryBuilder(r);
          if (
            (e.name === `Contacts`
              ? (s = UQ(i, t, a))
              : signBuilders[e.name](i, t, a),
            e.kind === `slot`)
          ) {
            for (let [n, r] of [
              [c, 1],
              [c + 2, -1],
            ]) {
              if (n !== c && c % 2) continue;
              let a = r * 1.35;
              for (let o = n; o < n + KQ.length; o++) {
                let s = KQ[o % KQ.length];
                if (
                  s.collars.every(([n, r]) =>
                    t.skin.ringFree(
                      e.y + a + n - r / 2 - 0.01,
                      e.y + a + n + r / 2 + 0.01,
                    ),
                  )
                ) {
                  s.build(
                    dQ(i, a, r * Math.PI * (n === c ? 0.62 : 0.9), `Extra`),
                    t,
                    o,
                  );
                  break;
                }
              }
            }
            c++;
          }
          let o = a.build(`${r.name}_Glow`);
          (o && this.glows.push(o), bakeStaticGeometry(r, r.name));
        },
        u = (e, n) => {
          let r = (signLayout[n].y + signLayout[n + 1].y) / 2 + e.nudge,
            i = new Group();
          ((i.name = `Decor_${e.name}`),
            (i.position.y = r),
            (i.rotation.y = FZ - UZ(-r) + e.turn),
            this.spinner.add(i),
            withRandomSeed(
              () =>
                e.build(
                  {
                    g: i,
                    y: r,
                    yaw: i.rotation.y,
                  },
                  t,
                ),
              3354,
            ),
            bakeStaticGeometry(i, i.name));
        },
        d = signLayout.findIndex((e) => e.kind === `finale`),
        f = new Set();
      (signLayout.forEach((e, t) => {
        if (t !== d) {
          l(e, t);
          for (let n of l$) n.after === e.name && (u(n, t), f.add(t));
        }
      }),
        (this.mail = s));
      let p = t.slot;
      ((this.slot = p.machine),
        (this.slotButton = p.button),
        (this.tickets = p.printer),
        (this.slotHits = p.hits),
        (this.slotY = p.y),
        (this.pongPad = t.pong),
        (this.streets = t.streets),
        (this.route = t.route));
      for (let e of this.blades) this.linkHits.push(e.hit);
      this.linkHits.push(this.mail.hit);
      for (let e of [...this.streets, ...this.route.rows, this.route.sheet])
        this.linkHits.push(e.hit);
      let m = new Group();
      ((m.name = `Pole`), this.spinner.add(m));
      let h = {
        g: m,
        y: 0,
        yaw: 0,
      };
      ((createPart(
        new CylinderGeometry(DZ, DZ, zZ - i$, OZ, 1, !0),
        polePurple,
        m,
      ).position.y = (zZ + i$) / 2),
        (createPart(
          new CylinderGeometry(DZ * 0.9, DZ * 1.08, 0.34, OZ),
          shadowPurple,
          m,
        ).position.y = 2.5100000000000002),
        fQ(t, h, 2.3000000000000003, palette.yellow, 0.1, 0.05));
      let g = [`hazard`, `checker`, `barber`],
        _ = (t.skin.apothem + 0.01) / Math.cos(Math.PI / OZ),
        v = 0,
        y = (e, r = !1) => {
          let i = t.skin.virtual(signLayout[e === n ? e - 1 : e].y),
            a = t.skin.virtual(signLayout[e + 1].y),
            o = `flyer${(e >= n ? e - 1 : e) % 2}`;
          if (i - a < 4.1000000000000005) {
            t.skin.flyer(m, a + 0.9, i - 0.9, o);
            return;
          }
          let s = (i + a) / 2,
            c = (signLayout[e].y + signLayout[e + 1].y) / 2;
          if (f.has(e)) {
            v++;
            return;
          }
          let l = v % 3 == 0 ? 0.5 : 0.26,
            u = mapAtlasUV(
              new CylinderGeometry(_, _, l, OZ, 1, !0),
              mH(`band_${g[v % 3]}`),
            );
          ((createPart(u, `#ffffff`, m, `atlas`).position.y = c),
            t.skin.ring(c - l / 2 - 0.02, c + l / 2 + 0.02),
            v++,
            (r || !t.skin.flyer(m, s + l / 2 + 0.05, i - 0.9, o)) &&
              t.skin.flyer(m, a + 0.9, s - l / 2 - 0.05, o));
        };
      for (let e = 0; e < d - 1; e++) e !== n - 1 && y(e);
      let b = signLayout.filter((e) => e.kind === `slot`).slice(1),
        x = 0;
      (projects.forEach((e, n) => {
        let r = b[n];
        if (!e.journey || !r) return;
        let i = FZ - UZ(-r.y) - 0.32 + (n % 2 ? 0.05 : -0.05),
          a = x++ % 2 == 0;
        t.skin.feature(
          m,
          a ? 37 : 38,
          i,
          r.y - 0.75,
          a ? 0.36 : 0.27,
          (n % 2 ? 1 : -1) * (a ? 0.12 : 0.06),
        );
      }),
        t.skin.bomb(m, t.skin.virtual(n$ + 0.8), 2.23));
      let S = () => {
        let e = signLayout[n - 1].y,
          a = signLayout[n].y,
          o = (e + a) / 2,
          s = 0.26,
          c = mapAtlasUV(
            new CylinderGeometry(_, _, s, OZ, 1, !0),
            mH(`band_barber`),
          );
        ((createPart(c, `#ffffff`, m, `atlas`).position.y = o),
          t.skin.ring(o - s / 2 - 0.02, o + s / 2 + 0.02));
        let l = (e) => t.skin.virtual(e);
        (t.skin.flyer(m, l(a + 1), l(o - s / 2 - 0.05), `flyer1`) ||
          t.skin.flyer(m, l(o + s / 2 + 0.05), l(i - 0.3), `flyer1`),
          t.skin.bomb(m, l(i - r + 0.25), l(i - 0.25)));
      };
      (withRandomSeed(() => XV(S), 3859),
        l(signLayout[d], d),
        y(d - 1, !0),
        t.skin.bomb(m, t.skin.virtual(r$ + 0.8), t.skin.virtual(n$ + 0.8)),
        bakeStaticGeometry(m, `Pole`),
        (this.phone = this.live.find((e) => e.name === `Phone`).thing),
        (this.ending = this.live.find((e) => e.name === `Ending`).thing),
        (this.filmCam = this.live.find((e) => e.name === `FilmCam`).thing),
        this.group.updateMatrixWorld(!0));
      let C = new Box3(),
        w = new Box3();
      for (let e of this.live)
        (C.makeEmpty(),
          e.g.traverse((e) => {
            let t = e;
            t.isMesh &&
              !t.isInstancedMesh &&
              (t.geometry.boundingBox || t.geometry.computeBoundingBox(),
              C.union(
                w.copy(t.geometry.boundingBox).applyMatrix4(t.matrixWorld),
              ));
          }),
          (e.lo = C.min.y - e.y - 0.05),
          (e.hi = C.max.y - e.y + 0.1));
      ((this.flocks = t.flocks.map((e) => e.flock)),
        (this.flockY = t.flocks.map((e) => e.y)),
        (this.flock = this.flocks[0]));
    }
    get stops() {
      return scrollStops;
    }
    get offset() {
      return this.current;
    }
    get focus() {
      return MathUtils.smoothstep(this.current, 1, scrollStops.dividers.about);
    }
    get contactsFocus() {
      return MathUtils.smoothstep(
        this.current,
        scrollStops.projects[scrollStops.projects.length - 1],
        scrollStops.contacts,
      );
    }
    get endFocus() {
      return MathUtils.smoothstep(
        this.current,
        scrollStops.contacts,
        scrollStops.end,
      );
    }
    get endFraming() {
      return LZ;
    }
    get interactiveTargets() {
      return this.liveHits;
    }
    interactiveOf(e) {
      return this.hitOwner.get(e) ?? null;
    }
    listen(e) {
      this.mesq = e;
    }
    get linkTargets() {
      return this.linkHits;
    }
    nudge(e) {
      if (e === `copy:email`)
        return ((this.mail.show = PQ), (this.mail.slow = !0), this.mail.hit);
      let t = (e) =>
          Math.abs(e + this.current) > 2.5 / Math.max(0.6, this.group.scale.y),
        n = this.route.rows;
      if (e === `say:timetable`)
        return t(this.route.y)
          ? null
          : (n.forEach((e, t) => (e.flashT = -0.12 * t)),
            n[(n.length - 1) >> 1].hit);
      let r = n.findIndex((t) => t.mount.userData.href === e);
      if (r >= 0)
        return t(this.route.y)
          ? null
          : ((n[r].flashT = 0), this.routeReact(r), n[r].hit);
      if (e === `say:film`) return t(this.filmY) ? null : this.filmCam.cue();
      let i = this.streets.find((t) => t.mount.userData.href === e);
      if (i)
        return t(i.stationY)
          ? null
          : ((i.flashT = 0),
            i.birds &&
              !this.reducedMotion.matches &&
              i.birds.birds.forEach((e, t) =>
                e.cue(this.elapsed, `hop`, 0, t ? 0.45 : 0.6),
              ),
            i.hit);
      let a = this.blades.find((t) => t.mount.userData.href === e);
      return a ? ((a.shake = 1), (a.shakeT = 0), a.hit) : null;
    }
    get birdTargets() {
      let e = this.birdHits;
      e.length = 0;
      for (let t of this.flocks)
        if (t.group.visible) for (let n of t.hitTargets) e.push(n);
      return e;
    }
    get slotTargets() {
      return this.slotHits;
    }
    spinSlot() {
      return this.slotButton.press();
    }
    holdSlot(e) {
      this.slotButton.hold(e);
    }
    hoverSlot(e) {
      this.slotButton.hover(e);
    }
    hoverLink(e, t = !0) {
      ((this.hoveredLink = e), (this.hoverLit = t));
    }
    routeOpen(e) {
      this.routeHeld = e;
    }
    routeRowPx(e, t) {
      let n = this.route.rows[0].mount,
        r = (tQ * nQ.row) / 2,
        i = n.localToWorld(BQ.set(0, r, 0)).project(e).y,
        a = n.localToWorld(BQ.set(0, -r, 0)).project(e).y;
      return (Math.abs(i - a) / 2) * t;
    }
    routeReact(e) {
      let t = this.elapsed;
      if (t - this.routeReactAt < 0.8) return;
      this.routeReactAt = t;
      let n = this.route.birds.birds,
        r = n.find((e) => e.dozing);
      if (r) {
        (r.cue(t, `wake`), r.say(t, 1, null, `huh`));
        return;
      }
      let [i, a] = n;
      i?.cue(t, `look`, 1.2, 0.3);
      let o = MB[e].bird;
      if ((o && a?.isPerched && a.say(t, 0.9, null, o), e < MB.length - 1))
        return;
      this.reducedMotion.matches ||
        n.forEach((e, n) => e.cue(t, `hop`, 0, n ? 0.6 : 0.8));
      let s = o ? i : a;
      s?.isPerched && s.say(t, 0.9, null, `chu`);
    }
    setOffset(e) {
      this.target = e;
    }
    jumpTo(e) {
      this.target = this.eased = this.current = e;
    }
    setTimeOfDay(e) {
      let t = GZ(e, this.tuning.nightFrom, this.tuning.nightTo);
      ((this.night = t),
        (nG.night.value = t),
        (HB.night.value = t),
        this.showGlows());
      for (let t of this.flocks) t.setDaylight(1 - e);
    }
    showGlows() {
      let e = this.night > 0.002 || this.prewarm !== null;
      for (let t of this.glows) t.visible = e;
      this.mast.head.ticks && (this.mast.head.ticks.visible = e);
    }
    setPrewarm(e) {
      if (e !== (this.prewarm !== null)) {
        if (e) {
          let e = [],
            t = [];
          (this.group.traverse((n) => {
            (!n.visible && !n.userData.bird && ((n.visible = !0), e.push(n)),
              (n.isMesh || n.isSprite) &&
                (t.push([n, n.frustumCulled]), (n.frustumCulled = !1)));
          }),
            (this.prewarm = {
              hidden: e,
              culled: t,
            }));
        } else {
          let e = this.prewarm;
          this.prewarm = null;
          for (let t of e.hidden) t.visible = !1;
          for (let [t, n] of e.culled) t.frustumCulled = n;
          this.showGlows();
        }
      }
    }
    restPose() {
      let e = {
          pos: this.group.position.clone(),
          scale: this.group.scale.clone(),
          y: this.spinner.position.y,
          rot: this.spinner.rotation.y,
        },
        t = this.flocks.map((e) => e.group.visible);
      for (let e of this.flocks) e.group.visible = !0;
      return (
        this.group.position.set(0, 0, 0),
        this.group.scale.setScalar(1),
        (this.spinner.position.y = 0),
        (this.spinner.rotation.y = UZ(0)),
        this.group.updateMatrixWorld(!0),
        () => {
          (this.group.position.copy(e.pos),
            this.group.scale.copy(e.scale),
            (this.spinner.position.y = e.y),
            (this.spinner.rotation.y = e.rot),
            this.flocks.forEach((e, n) => (e.group.visible = t[n])));
        }
      );
    }
    update(e, t, n) {
      this.elapsed = t;
      let r = 1 - Math.exp(-e * this.tuning.ease);
      ((this.eased =
        this.tuning.stages > 1
          ? this.eased + (this.target - this.eased) * r
          : this.target),
        (this.current += (this.eased - this.current) * r),
        (this.spinner.position.y = this.current),
        (this.sway = this.reducedMotion.matches
          ? 0
          : Math.sin(t * 0.4) * this.tuning.sway),
        (this.spinner.rotation.y = UZ(this.current) + this.sway),
        this.mast.head.animate(t, e),
        this.updateBlades(e, n),
        this.updateAbout(e),
        this.updateSlot(e),
        this.pongPad.update(e, Math.abs(this.pongPad.y + this.current) < 1.6),
        this.updateLive(e, t, n));
      let i = this.tuning.birdRange / Math.max(0.3, this.group.scale.y);
      for (let r = 0; r < this.flocks.length; r++) {
        let a = this.flocks[r],
          o =
            r === 0
              ? Math.abs(this.flockY[r] + this.current) < i + 1
              : Math.abs(this.flockY[r] + this.current) < i &&
                this.tuning.extraBirds;
        (this.prewarm
          ? (a.group.visible = !0)
          : a.group.visible !== o && (a.group.visible = o),
          o && a.update(e, t, n));
      }
      if (this.prewarm) for (let e of this.prewarm.hidden) e.visible = !0;
    }
    updateLive(e, t, n) {
      let r = this.liveHits;
      r.length = 0;
      for (let i of this.live) {
        let a = this.shows(i, n);
        if (a) {
          let e = this.current - i.stop;
          i.focus =
            1 -
            MathUtils.smoothstep(
              Math.abs(e),
              0,
              e < 0 ? i.stop - i.prev : i.next - i.stop,
            );
          for (let e of i.thing.hits) r.push(e);
        } else i.focus = 0;
        ((a || i.on) && i.thing.update?.(e, a, t), (i.on = a));
      }
    }
    shows(e, t) {
      let n = this.group,
        r = n.scale.y;
      if (!t) return Math.abs(e.y + this.current) < 4 / Math.max(0.6, r);
      let i = n.position.y + r * (e.y + this.current),
        a = this.tmp;
      return a.set(n.position.x, i + r * e.hi, 0).project(t).y < -1
        ? !1
        : a.set(n.position.x, i + r * e.lo, 0).project(t).y < c$;
    }
    sway = 0;
    updateSlot(e) {
      let t = Math.abs(this.slotY + this.current);
      if (
        (this.slotButton.update(e, t < 1.6, this.prewarm !== null),
        this.tickets.update(e, this.prewarm !== null),
        (this.slotRest =
          t < 0.4 && Math.abs(this.target - this.current) < 0.4
            ? this.slotRest + e
            : 0),
        this.slot.busy)
      ) {
        this.slotAuto = 12 + Math.random() * 8;
        return;
      }
      if (!this.slotGreeted) {
        if (this.slotRest < 0.5) return;
        ((this.slotGreeted = !0), this.slotButton.ghost());
        return;
      }
      t > 1.6 ||
        ((this.slotAuto -= e),
        this.slotAuto <= 0 && this.slotRest > 0.5 && this.slotButton.ghost());
    }
    updateAbout(e) {
      let t = 1 - Math.exp(-14 * e),
        n = Math.abs(this.streets[0].stationY + this.current) < 4;
      for (let r of this.streets)
        (!n && r.level === 0 && r.flashT >= MQ) ||
          this.light(
            r,
            n && this.hoverLit && this.hoveredLink === r.mount ? LQ : 0,
            t,
            e,
          );
      let r = this.route.rows,
        i = Math.abs(this.route.y + this.current) < 4;
      for (let n = 0; n < r.length; n++) {
        let a = r[n];
        (!i && a.level === 0 && a.flashT >= MQ) ||
          this.light(
            a,
            i &&
              ((this.hoverLit && this.hoveredLink === a.mount) ||
                this.routeHeld === n)
              ? RQ
              : 0,
            t,
            e,
          );
      }
    }
    light(e, t, n, r) {
      ((e.level += (t - e.level) * n),
        Math.abs(e.level - t) < 0.004 && (e.level = t),
        e.flashT < MQ && (e.flashT += r));
      let i = Math.max(e.level, zQ(e.flashT));
      ((e.glow.level.value = i),
        (e.glow.visible = i > 0.004 || this.prewarm !== null));
    }
    updateBlades(e, t) {
      let n = this.tuning,
        r = Math.abs($Q + this.current) < 4,
        i = this.tmp,
        a = n.hoverSpring,
        o = 2 * Math.sqrt(a) * 0.72;
      for (let r of this.blades) {
        let s = 0,
          c = 0,
          l = Math.abs(r.stationY + this.current) < 4;
        if (l && r.mount === this.hoveredLink) {
          (r.holder.updateWorldMatrix(!0, !1),
            t ? i.setFromMatrixPosition(t.matrixWorld) : i.set(0, -0.4, 9),
            r.holder.worldToLocal(i),
            i.applyAxisAngle(sG, this.spinner.rotation.y - UZ(r.home)),
            (i.y += this.current - r.home));
          let e = r.base;
          for (let t = 0; t < 3; t++)
            e = Math.atan2(
              i.x - r.reach * Math.cos(e),
              i.z + r.reach * Math.sin(e),
            );
          s = MathUtils.clamp(KZ(e - r.base), -1.2, 1.2) * n.hoverTurn;
          let a = Math.hypot(
            i.x - r.reach * Math.cos(e),
            i.z + r.reach * Math.sin(e),
          );
          c =
            MathUtils.clamp(
              -Math.atan2(i.y - r.mount.position.y, a),
              -0.4,
              0.4,
            ) * n.hoverTilt;
        }
        if (!l && r.yaw === 0 && r.tilt === 0 && r.shakeT >= NQ) continue;
        ((r.yawV += (a * (s - r.yaw) - o * r.yawV) * e),
          (r.yaw += r.yawV * e),
          (r.tiltV += (a * (c - r.tilt) - o * r.tiltV) * e),
          (r.tilt += r.tiltV * e),
          Math.abs(r.yaw - s) < 1e-4 &&
            Math.abs(r.yawV) < 0.001 &&
            ((r.yaw = s), (r.yawV = 0)),
          Math.abs(r.tilt - c) < 1e-4 &&
            Math.abs(r.tiltV) < 0.001 &&
            ((r.tilt = c), (r.tiltV = 0)));
        let u = 0;
        if (r.shakeT < NQ) {
          ((r.shakeT += e),
            (r.shake = Math.max(0, r.shake - e / AQ)),
            (u =
              Math.sin(r.shakeT * Math.PI * 2 * 0.85) *
              0.28 *
              r.shake *
              r.shake));
          let t = 1 - MathUtils.smoothstep(r.shakeT, jQ, MQ);
          ((r.glow.level.value = Math.min(1, r.shakeT * 6) * t),
            (r.glow.visible = r.shakeT < MQ || this.prewarm !== null));
        }
        r.swing.rotation.set(r.tilt, r.yaw + u, 0);
      }
      let s = this.mail;
      s.show = Math.max(0, s.show - e);
      let c = (r && this.hoveredLink === s.link) || s.show > 0,
        l = c ? ZY.flagUp : ZY.flagDown,
        u = c ? 0.38 : 0;
      if (s.flag === l && s.flagV === 0 && s.door === u && s.doorV === 0) {
        c || (s.slow = !1);
        return;
      }
      let d = s.slow ? a * 0.4 : a * 1.4,
        f = 2 * Math.sqrt(d) * (s.slow ? 0.62 : 0.42),
        p = Math.min(8, Math.ceil(e * 90)),
        m = e / p;
      for (let e = 0; e < p; e++)
        ((s.flagV += (d * (l - s.flag) - f * s.flagV) * m),
          (s.flag += s.flagV * m),
          (s.doorV += (d * (u - s.door) - f * s.doorV) * m),
          (s.door = Math.max(-0.02, s.door + s.doorV * m)));
      (Math.abs(s.flag - l) < 1e-4 &&
        Math.abs(s.flagV) < 0.001 &&
        ((s.flag = l), (s.flagV = 0)),
        Math.abs(s.door - u) < 1e-4 &&
          Math.abs(s.doorV) < 0.001 &&
          ((s.door = u), (s.doorV = 0)),
        (s.box.flag.rotation.x = s.flag),
        (s.box.door.rotation.x = s.door));
    }
  };
  return {
    EZ,
    qZ,
    JZ,
    XZ,
    QZ,
    FQ,
    JQ,
    SignpostWorld,
  };
}
