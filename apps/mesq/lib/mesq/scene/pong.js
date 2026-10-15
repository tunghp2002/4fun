// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  BoxGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  RingGeometry,
  ShapeGeometry,
  TorusGeometry,
} from "three/webgpu";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export function createPongModule(
  scope,
  {
    paletteModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
    mailboxModule,
  },
) {
  const { amber, shadowPurple, paleBlue, inkPurple, palette } = paletteModule;
  const { PixelGrid, rV, aV } = ledPixelsModule;
  const { Z, createPart, $, xH, SH, TH, bakeStaticGeometry } = stickersModule;
  const { XH } = signArtModule;
  const { tX, nX, rX, iX, aX, oX, sX, cX, lX, uX, dX, fX, mX, hX, gX } =
    mailboxModule;
  function _X(e, t) {
    let { w: n, h: r, d: i } = tX,
      a = new Group();
    ((a.name = `PongPad`),
      createPart(new RoundedBoxGeometry(n, r, i, 3, 0.045), amber, a));
    let o = createPart(
      $(
        `pongDeck`,
        () =>
          new ExtrudeGeometry(SH(nX.w, nX.h, 0.035), {
            depth: nX.depth,
            bevelEnabled: !0,
            bevelSize: 0.004,
            bevelThickness: 0.004,
            bevelSegments: 1,
            curveSegments: 8,
          }),
      ),
      shadowPurple,
      a,
    );
    o.position.z = i / 2 - 0.008;
    let s = o.position.z + nX.depth + 0.004;
    for (let e of [-1, 1])
      for (let t of [-1, 1])
        xH(
          a,
          Z(e * (nX.w / 2 - 0.03), t * (nX.h / 2 - 0.03), s - 0.004),
          Z(0, 0, 1),
          paleBlue,
          0.012,
        );
    let c = SH(iX.w + 0.036, aX + 0.036, 0.022);
    c.holes.push(SH(iX.w + 0.004, aX + 0.004, 0.01));
    let l = createPart(
      $(
        `pongLampFrame`,
        () =>
          new ExtrudeGeometry(c, {
            depth: 0.01,
            bevelEnabled: !0,
            bevelSize: 0.004,
            bevelThickness: 0.004,
            bevelSegments: 1,
            curveSegments: 6,
          }),
      ),
      paleBlue,
      a,
    );
    l.position.z = s - 0.008;
    let u = [oX, palette.red].map((e) => {
        let t = new PixelGrid(iX.cols, iX.rows);
        return (t.bitmap(mX, 1, 1, e), t.cells);
      }),
      d = -1,
      f = !1,
      p = Object.assign(
        (e) => {
          e.cells.set(u[+(d === 1)]);
        },
        {
          tick(t) {
            let n = e.playing || (f && t % sX.period < sX.on) ? 1 : 0;
            return n !== d && ((d = n), !0);
          },
        },
      ),
      m = aV({
        cols: iX.cols,
        rows: iX.rows,
        draw: p,
        brightness: 1.8,
      }),
      h = new Mesh(TH(new ShapeGeometry(SH(iX.w, aX, 0.01), 4)), m.material);
    ((h.name = `PongPlayLamp`), (h.position.z = s + 0.002), a.add(h));
    let g = $(`pongBezel`, () => new TorusGeometry(rX.r + 0.011, 0.01, 8, 40)),
      _ = $(`pongPadHit`, () => new BoxGeometry(0.56, 0.56, 0.34)),
      v = [],
      y = [];
    for (let e of [-1, 1]) {
      let n = e * rX.x;
      createPart(g, paleBlue, a).position.set(n, 0, s + 0.004);
      let r = new Group();
      ((r.name = e < 0 ? `PongLeft` : `PongRight`),
        (r.userData.bakeSkip = !0),
        r.position.set(n, 0, s),
        a.add(r),
        createPart(hX(), palette.red, r));
      let i = createPart(gX(), palette.cream, r);
      (i.position.set(e * 0.004, 0, 0.0238),
        (i.rotation.z = e < 0 ? Math.PI : 0));
      let o = createPart(
        $(
          `pongGlint`,
          () => new TorusGeometry(rX.r - 0.008, 0.0035, 4, 12, 0.9),
        ),
        `#ffffff`,
        r,
      );
      ((o.position.z = 0.0185), (o.rotation.z = 1.85));
      let c = bakeStaticGeometry(r, r.name, !0)[0].geometry.attributes.color,
        l = Float32Array.from(c.array),
        u = [];
      for (let e = 0; e < c.count; e++) l[e * 3 + 1] < 0.5 && u.push(e);
      v.push({
        dir: e,
        cap: r,
        color: c,
        base: l,
        red: u,
        p: 0,
        v: 0,
        n: 0,
        on: !1,
        t: 0,
        down: !1,
        glow: 0,
        shown: 2,
      });
      let d = new Mesh(_, t);
      ((d.name = `${r.name}Hit`),
        d.position.set(e * 0.31, -0.05, 0.06),
        (d.visible = !1),
        (d.userData.noExport = !0),
        (d.userData.bakeSkip = !0),
        (d.userData.pongDir = e),
        a.add(d),
        y.push(d));
    }
    let b = new Map(),
      x = 0,
      S = (e) => v[e < 0 ? 0 : 1],
      C = (t) => {
        t.n > 0 || !t.on || t.t < lX || ((t.on = !1), e.hold(t.dir, !1));
      },
      w = new Map(),
      T = new Map(),
      E = 0,
      D = (t, n) => {
        E - t.t < uX.wait * 1e3 ||
          (w.delete(n), e.playing || T.set(n, E), ee.press(n, t.dir));
      },
      ee = {
        group: a,
        hits: y,
        y: 0,
        get playing() {
          return e.playing;
        },
        press(t, n) {
          let r = b.get(t);
          if (r === n) return;
          (r !== void 0 && ee.release(t), b.set(t, n));
          let i = S(n);
          (i.n++, (i.t = 0), (i.on = !0), e.hold(n, !0));
        },
        touch(e, t, n, r) {
          w.set(e, {
            dir: t,
            x: n,
            y: r,
            t: performance.now(),
          });
        },
        move(e, t, n) {
          let r = w.get(e);
          r && Math.hypot(t - r.x, n - r.y) > uX.slop && w.delete(e);
        },
        release(e) {
          let t = w.get(e);
          (t && (w.delete(e), ee.press(e, t.dir)), T.delete(e));
          let n = b.get(e);
          if (n === void 0) return;
          b.delete(e);
          let r = S(n);
          ((r.n = Math.max(0, r.n - 1)), C(r));
        },
        cancel(t) {
          w.delete(t);
          let n = T.get(t);
          (ee.release(t),
            n !== void 0 &&
              performance.now() - n < uX.undo * 1e3 &&
              b.size === 0 &&
              e.drop());
        },
        releaseAll() {
          (w.clear(), T.clear(), b.clear());
          for (let e of v) ((e.n = 0), C(e));
        },
        hover(e) {
          x = e;
        },
        update(e, t) {
          ((e = Math.min(e, 0.05)),
            (f = t),
            w.size && ((E = performance.now()), w.forEach(D)));
          for (let t of v) {
            t.on && ((t.t += e), C(t));
            let n = +!!t.on;
            if (t.p !== n || t.v !== 0) {
              let r = 2 * Math.sqrt(cX.k) * cX.zeta,
                i = Math.ceil(e * 240),
                a = e / i;
              for (let e = 0; e < i; e++)
                ((t.v += (cX.k * (n - t.p) - r * t.v) * a), (t.p += t.v * a));
              (Math.abs(t.p - n) < 1e-4 &&
                Math.abs(t.v) < 0.001 &&
                ((t.p = n), (t.v = 0)),
                (t.cap.position.z = s - t.p * rX.travel));
              let o = 1 - fX.scale * t.p;
              t.cap.scale.set(o, o, 1);
            }
            !t.down && t.p > 0.85
              ? ((t.down = !0), rV.pongPress?.(`press`))
              : t.down &&
                t.p < 0.3 &&
                ((t.down = !1), rV.pongPress?.(`release`));
            let r = +(x === t.dir);
            t.glow !== r &&
              ((t.glow += (r - t.glow) * (1 - Math.exp(-e * 14))),
              Math.abs(t.glow - r) < 0.004 && (t.glow = r));
            let i = 1 - fX.shade * Math.min(1, Math.max(0, t.p));
            if (t.glow + i * 2 !== t.shown) {
              t.shown = t.glow + i * 2;
              let e = t.color.array;
              for (let n of t.red)
                for (let r = 0; r < 3; r++) {
                  let a = t.base[n * 3 + r];
                  e[n * 3 + r] = (a + (dX[r] - a) * t.glow) * i;
                }
              t.color.needsUpdate = !0;
            }
          }
        },
      };
    return ee;
  }
  var vX = {
    w: 0.46,
    h: 0.8,
    d: 0.16,
  };
  var yX = {
    w: 0.41,
    h: 0.75,
  };
  var bX = {
    w: yX.w + 0.03,
    h: yX.h + 0.03,
    depth: 0.02,
  };
  var xX = {
    y: 0.262,
    w: 0.3,
    h: 0.117,
    cols: 23,
    rows: 9,
  };
  var SX = `#8a2234`;
  var CX = 0.118;
  var wX = {
    y: -0.095,
    r0: 0.112,
    r1: 0.158,
    bulbs: 18,
  };
  var TX = -0.31;
  var EX = {
    r: 0.082,
    travel: 0.028,
    dome: 0.045,
  };
  var DX = {
    k: 1400,
    zeta: 0.42,
  };
  var OX = {
    k: 520,
    hold: 0.16,
  };
  var kX = 0.09;
  var AX = 0.3;
  var jX = [1.15, 0.13, 0.13];
  var MX = {
    scale: 0.13,
    shade: 0.55,
  };
  var NX = (e, t, n) => {
    let r = t / yX.w,
      i = (e) => t / 2 + e * r,
      a = (e) => n / 2 - e * r;
    ((e.fillStyle = palette.yellow),
      e.fillRect(0, 0, t, n),
      (e.strokeStyle = inkPurple),
      (e.lineWidth = 0.011 * r),
      e.beginPath(),
      e.roundRect(0.02 * r, 0.02 * r, t - 0.04 * r, n - 0.04 * r, 0.03 * r),
      e.stroke(),
      (e.fillStyle = shadowPurple),
      e.beginPath(),
      e.roundRect(
        i(-xX.w / 2 - 0.02),
        a(xX.y + xX.h / 2 + 0.02),
        (xX.w + 0.04) * r,
        (xX.h + 0.04) * r,
        0.025 * r,
      ),
      e.fill(),
      e.beginPath(),
      e.arc(i(0), a(wX.y), (wX.r1 + 0.004) * r, 0, Math.PI * 2),
      e.fill(),
      (e.fillStyle = inkPurple),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      (e.font = XH(0.1 * r)),
      e.fillText(`PUSH`, t / 2, a(CX) + 0.004 * r, 0.34 * r),
      (e.font = XH(0.062 * r)),
      e.fillText(`FOR JACKPOT`, t / 2, a(TX) + 0.003 * r, 0.33 * r));
  };
  function PX(e, t, n, r) {
    let i = n * 4,
      a = new RingGeometry(e, t, i, 1, r, Math.PI * 2),
      o = a.attributes.uv;
    for (let e = 0; e <= 1; e++)
      for (let t = 0; t <= i; t++) o.setXY(e * (i + 1) + t, t / i, e);
    return a;
  }
  return {
    _X,
    vX,
    yX,
    bX,
    xX,
    SX,
    wX,
    EX,
    DX,
    OX,
    kX,
    AX,
    jX,
    MX,
    NX,
    PX,
  };
}
