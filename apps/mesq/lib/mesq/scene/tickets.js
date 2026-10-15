// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  ExtrudeGeometry,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  PlaneGeometry,
  TorusGeometry,
  TubeGeometry,
} from "three/webgpu";
import { attribute, clamp, positionGeometry } from "three/tsl";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export function createTicketsModule(
  scope,
  {
    paletteModule,
    renderingModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    meshBuildersModule,
    slotGeometryModule,
  },
) {
  const { shadowPurple, nightPurple, paleBlue, inkPurple, palette } =
    paletteModule;
  const { cI, createToonMaterial } = renderingModule;
  const { HB, WB } = dialogueModule;
  const { aV } = ledPixelsModule;
  const { Z, mH, createPart, $, yH, bH, xH, SH, EH, DH, AH, LH, RH } =
    stickersModule;
  const { PG } = meshBuildersModule;
  const {
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
    mZ,
    hZ,
    gZ,
    _Z,
    vZ,
  } = slotGeometryModule;
  function yZ(e, t, n) {
    let r = t.x - t.w / 2,
      i = n.y + BX.h / 2,
      a = -t.d / 2,
      o = t.spineZ - 0.025,
      s = t.ys[1],
      c = Z(r - 0.012, s - 0.2, -0.06);
    gZ(
      e,
      [
        Z(n.x + 0.11, i - 0.01, -0.02),
        Z(n.x + 0.1, i + 0.14, -0.03),
        Z(n.x + 0.2, s - 0.17, -0.05),
        c.clone().add(Z(-0.07, 0, 0)),
        c,
      ],
      0.016,
      22,
      0.0065,
      palette.hotPink,
    );
    let l = Z(r - 0.012, s - 0.26, -0.13);
    (hZ(
      e,
      [
        Z(n.x + 0.13, i - 0.01, -0.09),
        Z(n.x + 0.14, i + 0.11, -0.1),
        Z(n.x + 0.23, s - 0.24, -0.12),
        l.clone().add(Z(-0.06, 0, 0)),
        l,
      ],
      0.012,
      paleBlue,
      24,
    ),
      _Z(e, Z(n.x + 0.11, i + 0.005, -0.02), Z(0, 1, 0), 0.02),
      _Z(e, Z(n.x + 0.13, i + 0.005, -0.09), Z(0, 1, 0), 0.018),
      _Z(e, c.clone().add(Z(-0.012, 0, 0)), Z(-1, 0, 0), 0.02),
      _Z(e, l.clone().add(Z(-0.012, 0, 0)), Z(-1, 0, 0), 0.018),
      vZ(e, Z(n.x + 0.155, i + 0.15, -0.065), Z(0.3, 1, 0), 0.06));
    let u = Z(t.x, n.y - 0.14, o - 0.06),
      d = new CatmullRomCurve3([
        Z(n.x + 0.05, n.y - 0.03, -BX.d / 2 + 0.02),
        Z(n.x + 0.06, n.y - 0.05, -0.26),
        Z(r + 0.04, n.y - 0.12, -0.42),
        Z(t.x - 0.2, u.y, u.z - 0.03),
        Z(t.x - 0.08, u.y, u.z),
      ]);
    createPart(new TubeGeometry(d, 40, 0.03, 10), paleBlue, e);
    let f = Z(),
      p = Z(),
      m = $(`ticketConduitRib`, () => new TorusGeometry(0.034, 0.008, 6, 12));
    for (let t = 0; t < 11; t++) {
      let n = 0.08 + (t / 10) * 0.8;
      (d.getPointAt(n, f), d.getTangentAt(n, p));
      let r = createPart(m, paleBlue, e);
      (r.position.copy(f), r.quaternion.setFromUnitVectors(Z(0, 0, 1), p));
    }
    for (let t of [0.02, 0.97]) {
      (d.getPointAt(t, f), d.getTangentAt(t, p));
      let n = createPart(
        $(
          `ticketConduitFit`,
          () => new CylinderGeometry(0.042, 0.042, 0.05, 12),
        ),
        shadowPurple,
        e,
      );
      (n.position.copy(f), n.quaternion.setFromUnitVectors(Z(0, 1, 0), p));
    }
    let h = new Group();
    (h.position.copy(u),
      e.add(h),
      createPart(
        $(
          `ticketJunction`,
          () => new RoundedBoxGeometry(0.24, 0.2, 0.12, 2, 0.035),
        ),
        palette.purple,
        h,
      ),
      LH(
        h,
        AH(Z(0, 0, -0.06), Z(-1, 0, 0), Z(0, 1, 0)),
        0,
        0.025,
        0.15,
        0.067,
        0,
        mH(`volt`),
        0.003,
      ));
    let g = [palette.hotPink, palette.yellow, paleBlue],
      _ = o - 0.018;
    t.ys.forEach((n, r) => {
      let i = t.x + (r - 1) * 0.04,
        o = n - 0.12,
        s = Z(t.x + 0.2 + r * 0.02, n - 0.2, a - 0.004),
        c = [Z(i, u.y + 0.08, _), Z(i, u.y + 0.15, _)];
      (o > u.y + 0.3 && c.push(Z(i, o - 0.12, _)),
        c.push(
          Z(i + 0.06, o, _ - 0.03),
          Z(s.x - 0.04, s.y + 0.02, a - 0.07),
          s,
        ),
        hZ(e, c, 0.016, g[r], 40),
        _Z(e, s.clone().add(Z(0, 0, -0.012)), Z(0, 0, -1), 0.022));
    });
    let v = $(`ticketSpineStrap`, () => new BoxGeometry(0.15, 0.024, 0.012));
    for (let n = u.y + 0.2; n < t.ys[1] - 0.12; n += 0.26)
      createPart(v, inkPurple, e).position.set(t.x, n, _ - 0.018);
    for (let n = t.ys[1] + 0.12; n < t.ys[0] - 0.24; n += 0.26)
      createPart(v, inkPurple, e).position.set(t.x - 0.02, n, _ - 0.018);
  }
  var bZ = `aTicketFade`;
  function xZ() {
    let e = createPart(
        new BufferGeometry(),
        `#ffffff`,
        void 0,
        `atlas`,
      ).material,
      t = createToonMaterial({
        map: e.map,
        vertexColors: !0,
        alphaTest: 0.5,
      });
    t.name = `post-tickets`;
    let n = positionGeometry.xy,
      r = {
        x: IX.w / 2,
        y: IX.l / 2,
      },
      i = clamp(
        n.y.div(r.y).mul(-0.22).add(n.x.div(r.x).mul(0.06)).add(0.3),
        0,
        0.6,
      );
    return ((t.opacityNode = PG(n, attribute(bZ, `float`), i, aZ)), t);
  }
  function SZ(e, t, n) {
    let r = Z(
        n.x - n.w / 2 - HX - BX.w / 2,
        n.ys[n.ys.length - 1] + n.h / 2 - BX.h / 2 - 0.02,
        0.02,
      ),
      i = new Group();
    ((i.name = `TicketPrinter`), i.position.copy(r), e.add(i));
    let { w: a, h: o, d: s } = BX,
      c = s / 2;
    (createPart(new RoundedBoxGeometry(a, o, s, 3, 0.06), VX, i),
      DH(
        i,
        SH(LX.w + 0.03, LX.h + 0.03, 0.03),
        SH(LX.w, LX.h, 0.02),
        shadowPurple,
        `ticketPlate`,
        0.02,
      ).position.set(0, WX, c + 0.01 + EH - 0.02));
    let l = SH(UX.w + 0.05, UX.h + 0.05, 0.02);
    createPart(
      $(
        `ticketMouth`,
        () =>
          new ExtrudeGeometry(l, {
            depth: 0.03,
            bevelEnabled: !0,
            bevelSize: 0.006,
            bevelThickness: 0.006,
            bevelSegments: 1,
            curveSegments: 6,
          }),
      ),
      shadowPurple,
      i,
    ).position.set(0, UX.y, c - 0.022);
    let u = c + 0.014;
    createPart(
      $(`ticketSlot`, () => new PlaneGeometry(UX.w, UX.h)),
      nightPurple,
      i,
    ).position.set(0, UX.y, u + 0.001);
    let d = yH(
      i,
      Z(-UX.w / 2, UX.y - UX.h / 2 - 0.016, u - 0.004),
      Z(UX.w / 2, UX.y - UX.h / 2 - 0.016, u - 0.004),
      0.011,
      paleBlue,
      10,
    );
    d.name = `Lip`;
    for (let e of [-1, 1])
      bH(
        i,
        Z((e * UX.w) / 2, UX.y - UX.h / 2 - 0.016, u - 0.004),
        0.011,
        paleBlue,
        8,
      );
    for (let e of [0.1, -0.1])
      (createPart(
        $(`ticketBracket`, () => new BoxGeometry(0.17, 0.055, 0.035)),
        shadowPurple,
        i,
      ).position.set(a / 2 + 0.13 / 2, e, -0.02),
        xH(i, Z(a / 2 + 0.035, e, -0.0025), Z(0, 0, 1), paleBlue, 0.012));
    let f = AH(Z(-a / 2, 0, 0), Z(0, 0, 1), Z(0, 1, 0));
    (RH(i, f, -0.04, 0.06, 2, 0.12, 0.3), RH(i, f, 0.06, -0.07, 4, 0.1, -0.2));
    let p = $(`ticketFin`, () => new BoxGeometry(a * 0.5, 0.025, 0.02));
    for (let e of [-0.06, 0, 0.06])
      createPart(p, shadowPurple, i).position.set(0, -o / 2 + 0.002, e);
    let m = {
      x: -0.14,
      r: 0.034,
      h: 0.085,
    };
    (createPart(
      $(`ticketLampSocket`, () => new CylinderGeometry(0.045, 0.05, 0.03, 14)),
      shadowPurple,
      i,
    ).position.set(m.x, o / 2 + 0.01, -0.03),
      createPart(
        $(`ticketLampCap`, () => new CylinderGeometry(0.03, 0.041, 0.022, 14)),
        shadowPurple,
        i,
      ).position.set(m.x, o / 2 + 0.025 + m.h + 0.008, -0.03),
      bH(
        i,
        Z(m.x, o / 2 + 0.025 + m.h + 0.022, -0.03),
        0.012,
        shadowPurple,
        8,
      ));
    let h = {
        cols: 12,
        rows: 3,
      },
      g = WB(`#5a2c1a`),
      _ = [WB(palette.orange), WB(palette.yellow), WB(palette.red)],
      v = 0,
      y = -1,
      b = (e) =>
        v === 2
          ? 10 + (Math.floor(e * 20) % h.cols)
          : +(v === 1 && e % 1.8 < 0.45),
      x = Object.assign(
        (e) => {
          let t = e.cells;
          for (let e = 0; e < h.cols; e++) {
            let n = g;
            if (y === 1) n = _[0];
            else if (y >= 10) {
              let t = (e - (y - 10) + h.cols) % h.cols;
              n = t === 0 ? _[1] : t < 3 ? _[2] : t < 5 ? _[0] : g;
            }
            for (let r = 0; r < h.rows; r++) t[r * h.cols + e] = n;
          }
        },
        {
          tick(e) {
            let t = b(e);
            return t !== y && ((y = t), !0);
          },
        },
      ),
      S = aV({
        cols: h.cols,
        rows: h.rows,
        draw: x,
        brightness: 1.8,
      }),
      C = new Mesh(
        $(`ticketLamp`, () => new CylinderGeometry(m.r, m.r, m.h, 16, 1, !0)),
        S.material,
      );
    ((C.name = `TicketLamp`),
      C.position.set(m.x, o / 2 + 0.025 + m.h / 2, -0.03),
      i.add(C),
      yZ(e, n, r));
    let w = mZ(),
      T = new InstancedBufferAttribute(new Float32Array(GX).fill(1), 1);
    (T.setUsage(DynamicDrawUsage), w.setAttribute(bZ, T));
    let E = T.array,
      D = new InstancedMesh(w, xZ(), GX);
    ((D.name = `Tickets`),
      D.instanceMatrix.setUsage(DynamicDrawUsage),
      (D.frustumCulled = !1),
      (D.castShadow = !1),
      (D.receiveShadow = !0),
      (D.visible = !1),
      (D.userData.bakeSkip = !0),
      (D.userData.noExport = !0),
      e.add(D));
    let ee = new Color(oZ[0]);
    for (let e = 0; e < GX; e++) D.setColorAt(e, ee);
    let te = 0,
      O = Z(r.x, r.y + UX.y, r.z + u),
      ne = new Matrix4().makeScale(1e-4, 1e-4, 1e-4).setPosition(r);
    for (let e = 0; e < GX; e++) D.setMatrixAt(e, ne);
    let re = new Float32Array(51),
      ie = new Float32Array(GX),
      ae = new Float32Array(GX),
      oe = new Float32Array(GX),
      se = new Float32Array(48),
      ce = new Matrix4(),
      le = Z(),
      ue = Z(),
      de = Z(),
      fe = Z(),
      pe = Z(),
      me = Z(),
      he = Z(),
      ge = Z(),
      _e = Z(),
      ve = Z(XX.scale, XX.scale, XX.scale),
      ye = Z(0, -1, 0),
      be = !1,
      xe = 0,
      Se = 0,
      Ce = 0,
      we = !1,
      Te = !1,
      Ee = 0,
      De = -1,
      Oe = !1,
      ke = -1,
      Ae = !1,
      je = 0,
      Me = 0,
      Ne = 0,
      Pe = 0,
      Fe = (e, t) => {
        let n = Math.cos(QX),
          r = Math.sin(QX);
        if (e <= $X) return t.set(O.x, O.y - e * r, O.z + e * n);
        let i = QX + Math.min(e - $X, tZ - $X) / eZ,
          a = O.y - $X * r - eZ * n,
          o = O.z + $X * n - eZ * r;
        return t.set(O.x, a + eZ * Math.cos(i), o + eZ * Math.sin(i));
      },
      Ie = () => {
        Fe(tZ, le);
        let e = tZ;
        (de.copy(ye),
          me.set(1, 0, 0).addScaledVector(ye, -ye.x).normalize(),
          fe.copy(me));
        for (let t = Se; t >= 0; t--) {
          let n = Ee - t * ZX;
          if (
            (n <= e
              ? Fe(n, ue)
              : (ue.copy(le).addScaledVector(de, n - e), le.copy(ue), (e = n)),
            ue.toArray(re, t * 3),
            t < Se && fe.toArray(se, t * 3),
            t === 0 || n <= tZ)
          )
            continue;
          let r = t - 1,
            i = (n - tZ) / ZX,
            a = Math.min(1, i / XX.ease),
            o = XX.yaw * sZ(Math.min(1, i / 1.5)) + ae[r] * a,
            s =
              (ie[r] + (we ? 0 : XX.wobble * Math.sin(xe * XX.rate + oe[r]))) *
              a;
          (pe.crossVectors(ye, me),
            fe
              .copy(me)
              .multiplyScalar(Math.cos(o))
              .addScaledVector(pe, Math.sin(o)),
            pe.crossVectors(ye, fe),
            de
              .copy(ye)
              .multiplyScalar(Math.cos(s))
              .addScaledVector(pe, Math.sin(s)));
        }
      },
      Le = () => {
        ((we = cI.matches),
          (Se = we ? qX.count : Te ? JX : KX.count),
          (Ce = we ? qX.period : KX.period),
          ee.set(oZ[te++ % oZ.length]));
        let e = 0;
        for (let t = Se - 1; t >= 0; t--) {
          let n = (t + 1) / XX.slack,
            r = 1 / (1 + n * n);
          ((e += XX.curl * r),
            (ie[t] =
              (t % 2 ? 1 : -1) * XX.fan * 0.5 * cZ(XX.vary[0], XX.vary[1]) * r +
              e),
            (ae[t] = XX.twist * cZ(-1, 1)),
            (oe[t] = cZ(0, Math.PI * 2)));
        }
        for (let e = 0; e < GX; e++)
          (D.setColorAt(e, ee), D.setMatrixAt(e, ne), (E[e] = 1));
        ((D.instanceColor.needsUpdate = !0),
          (T.needsUpdate = !0),
          (be = !0),
          (D.visible = !0),
          (xe = 0),
          (Ee = 0),
          (De = -1),
          (Oe = !1),
          (ke = -1),
          (je = Me = Ne = Pe = 0));
      },
      Re = () => {
        ((be = !1), (D.visible = !1));
        for (let e = 0; e < GX; e++) (D.setMatrixAt(e, ne), (E[e] = 1));
        ((T.needsUpdate = !0), (D.instanceMatrix.needsUpdate = !0));
      };
    return {
      group: i,
      tickets: D,
      get active() {
        return be;
      },
      get compact() {
        return Te;
      },
      set compact(e) {
        Te = e;
      },
      print: Le,
      update(e, n) {
        e = Math.min(e, 0.05);
        let r = t.winning;
        if (
          (r && !Ae && Le(),
          (Ae = r),
          (v = be && ke < 0 ? 2 : +(HB.night.value > 0.3)),
          n || !be)
        )
          return;
        xe += e;
        let i = xe - KX.delay;
        if (
          (i >= 0 && !Oe && ((Oe = !0), zX.print?.(Se, Ce)), i > 0 && ke < 0)
        ) {
          let e = Math.min(Se, Math.floor(i / Ce)),
            t = e < Se ? i / Ce - e : 0;
          ((Ee = (e + (t < YX ? sZ(t / YX) : 1)) * ZX),
            e !== De &&
              e < Se &&
              !we &&
              ((De = e), (Pe += 0.5), (Me += cZ(-0.35, 0.35))),
            e >= Se && ((ke = xe), zX.tear?.(), we || (Pe += 0.4)));
        }
        let a = 2 * Math.sqrt(40) * 0.16;
        ((Me +=
          (-40 * je - a * Me + (we ? 0 : XX.breeze * Math.sin(xe * 1.3))) * e),
          (je += Me * e),
          (Pe += (-40 * Ne - a * Pe) * e),
          (Ne += Pe * e),
          ye.set(
            Math.sin(je) * Math.cos(Ne),
            -Math.cos(je) * Math.cos(Ne),
            Math.sin(Ne),
          ),
          Ie());
        for (let e = 0; e < Se; e++)
          Ee - e * ZX <= 0 ||
            (le.fromArray(re, (e + 1) * 3),
            ue.fromArray(re, e * 3),
            he.subVectors(le, ue),
            he.lengthSq() < 1e-10 ? he.set(0, 1, 0) : he.normalize(),
            me
              .fromArray(se, e * 3)
              .addScaledVector(he, -me.dot(he))
              .normalize(),
            ge.crossVectors(me, he),
            D.setMatrixAt(
              e,
              ce
                .makeBasis(me, he, ge)
                .scale(ve)
                .setPosition(_e.addVectors(le, ue).multiplyScalar(0.5)),
            ));
        if (((D.instanceMatrix.needsUpdate = !0), ke >= 0 && xe > ke + nZ)) {
          let e = xe - ke - nZ;
          for (let t = 0; t < Se; t++) {
            let n = 1 - (e - t * iZ) / rZ;
            E[t] = n >= 1 ? 1 : n > 0 ? sZ(n) : 0;
          }
          ((T.needsUpdate = !0), e > (Se - 1) * iZ + rZ && Re());
        }
      },
    };
  }
  return {
    SZ,
  };
}
