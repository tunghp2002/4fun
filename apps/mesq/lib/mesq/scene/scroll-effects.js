// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  Color,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
} from "three/webgpu";
export function createScrollEffectsModule(scope, { renderingModule }) {
  const { PI, RI, HI } = renderingModule;
  var d$ = (e) => ({
    ...e,
    sky: new Color(e.sky),
    ground: new Color(e.ground),
    key: new Color(e.key),
    kick: new Color(e.kick),
  });
  var f$ = (e) => 0.2126 * e.r + 0.7152 * e.g + 0.0722 * e.b;
  var p$ = MathUtils.lerp;
  function createLighting(e) {
    let t = {
        day: d$({
          exposure: 1,
          sky: `#cfe3ff`,
          ground: `#e3c4ff`,
          fill: 1.95,
          key: `#fff3cf`,
          keyIntensity: 1.9,
          kick: `#a6ecff`,
          kickIntensity: 0.55,
          shadow: 0.9,
          rim: 1,
        }),
        dusk: d$({
          exposure: 1,
          sky: `#b9b6ff`,
          ground: `#f9b6d8`,
          fill: 1.85,
          key: `#ffc996`,
          keyIntensity: 1.75,
          kick: `#ff9ad6`,
          kickIntensity: 0.6,
          shadow: 0.88,
          rim: 1.15,
        }),
        night: d$({
          exposure: 1,
          sky: `#7a8cf5`,
          ground: `#a477ea`,
          fill: 1.65,
          key: `#bccdff`,
          keyIntensity: 1.3,
          kick: `#55d8ff`,
          kickIntensity: 1,
          shadow: 0.8,
          rim: 1.3,
        }),
        exposure: 1,
        shadowMapSize: 1024,
        shadowRadius: 1.5,
      },
      n = new HemisphereLight();
    n.name = `Fill`;
    let r = new DirectionalLight();
    ((r.name = `Key`), r.position.set(-6, 7, 8), (r.castShadow = !0));
    let i = r.shadow.camera;
    ((i.left = -8),
      (i.right = 8),
      (i.top = 5),
      (i.bottom = -5),
      (i.near = 1),
      (i.far = 30),
      i.updateProjectionMatrix(),
      (r.shadow.bias = -6e-4),
      (r.shadow.normalBias = 0.025));
    let a = new DirectionalLight();
    ((a.name = `Kick`),
      a.position.set(6, -3.5, 4),
      e.add(n, r, r.target, a, a.target));
    let o = 0,
      s = () => MathUtils.clamp(Math.round(t.shadowMapSize), 256, 4096);
    function c(e) {
      o = MathUtils.clamp(Number.isFinite(e) ? e : 0, 0, 1);
      let i = o < 0.5,
        c = i ? t.day : t.dusk,
        l = i ? t.dusk : t.night,
        u = i ? o * 2 : o * 2 - 1,
        d = p$(c.exposure, l.exposure, u) * t.exposure;
      (n.color.lerpColors(c.sky, l.sky, u),
        n.groundColor.lerpColors(c.ground, l.ground, u),
        (n.intensity = p$(c.fill, l.fill, u) * d),
        r.color.lerpColors(c.key, l.key, u),
        (r.intensity = p$(c.keyIntensity, l.keyIntensity, u) * d),
        a.color.lerpColors(c.kick, l.kick, u),
        (a.intensity = p$(c.kickIntensity, l.kickIntensity, u) * d),
        (r.shadow.intensity = MathUtils.clamp(p$(c.shadow, l.shadow, u), 0, 1)),
        (RI.level.value = p$(c.rim, l.rim, u)));
      let f =
        ((f$(n.color) + f$(n.groundColor)) / 2) * n.intensity +
        f$(r.color) * r.intensity * PI.lit +
        f$(a.color) * a.intensity * PI.shadow;
      HI.level.value = Math.max(0.001, f / Math.PI);
      let p = s();
      (r.shadow.mapSize.x !== p && r.shadow.mapSize.set(p, p),
        (r.shadow.radius = t.shadowRadius));
    }
    return (
      c(0),
      {
        hemi: n,
        key: r,
        kick: a,
        tuning: t,
        get timeOfDay() {
          return o;
        },
        setTimeOfDay: c,
      }
    );
  }
  var h$ = 0.25;
  var g$ = 2;
  var _$ = 1;
  var v$ = 1;
  var y$ = 0.5;
  var b$ = 1.5;
  var x$ = 8;
  var S$ = 0.25;
  var C$ = 1.7;
  var w$ = 0.1;
  var T$ = 4;
  var E$ = 5;
  var D$ = 120;
  var O$ = 20;
  var k$ = 300;
  var A$ = 0.5;
  var j$ = 1.5;
  var M$ = 2e3;
  function N$(e, t) {
    let n = {
        adaptive: !0,
        targetFps: 60,
        minDpr: 1,
        maxDpr: Math.min(window.devicePixelRatio || 1, 2),
        idleCap: !0,
        idleFps: 60,
      },
      r = e.getPixelRatio(),
      i = 1 / n.targetFps,
      a = i,
      o = g$,
      s = 0,
      c = 0,
      l = 0,
      u = !1,
      d = 0,
      f = 0,
      p = !1,
      m = !1,
      h = !1,
      g = 0,
      _ = 0,
      v = 0,
      y = 0,
      b = 0,
      x = 0,
      S = new Map(),
      C = [i, i],
      w = [0, 0],
      T = [NaN, NaN],
      E = [NaN, NaN],
      D = [0, 0],
      ee = performance.now(),
      te = !1,
      O = [],
      ne = NaN,
      re = NaN;
    function ie() {
      if (n.minDpr !== ne || n.maxDpr !== re) {
        ((ne = n.minDpr), (re = n.maxDpr));
        let e = Math.max(n.minDpr, n.maxDpr);
        O = [e];
        for (
          let t = Math.ceil(e / h$ - 1e-6) * h$ - h$;
          t >= n.minDpr - 1e-6;
          t -= h$
        )
          t < e - 1e-6 && O.push(t);
        (O[O.length - 1] > n.minDpr + 1e-6 && O.push(n.minDpr), S.clear());
      }
      return O;
    }
    function ae(e) {
      Math.abs(e - r) < 1e-6 ||
        ((r = e),
        (o = _$),
        (s = c = 0),
        (l = 0),
        (u = p = !1),
        (w[0] = w[1] = 0),
        t.onPixelRatio(e));
    }
    function oe(e) {
      for (let t = 0; t < 2; t++) e[t] = w[t] >= y$ ? C[t] : NaN;
    }
    function se(e) {
      for (let t = 0; t < e.length; t++) if (r >= e[t] - 1e-6) return t;
      return e.length - 1;
    }
    function ce(e, t = !1) {
      if (!(e > 0)) return;
      t && (ee = performance.now());
      let O = ie();
      if (
        ((r > O[0] + 1e-6 || r < O[O.length - 1] - 1e-6) && ae(O[se(O)]),
        te && ((te = !1), ae(O[0])),
        (a += (e - a) * (1 - Math.exp(-e / A$))),
        he)
      ) {
        o = Math.max(o, 0.25);
        return;
      }
      if (!n.adaptive) {
        r !== O[0] && ae(O[0]);
        return;
      }
      if (e > 0.25 && ++y < 4) {
        o = Math.max(o, 0.5);
        return;
      }
      e <= 0.25 && (y = 0);
      let ne = 1 / Math.max(1, n.targetFps),
        re = Math.min(e, 2.5 * ne);
      if (
        ((i += (re - i) * (1 - Math.exp(-re / A$))),
        (v += (+(e > ne * C$) - v) * (1 - Math.exp(-re / j$))),
        +t === b ? (x += e) : ((b = +t), (x = 0)),
        g > 0 && (g -= e),
        o > 0)
      ) {
        o -= e;
        return;
      }
      x >= S$ &&
        ((w[b] += e),
        (C[b] += (e - C[b]) * Math.max(1 - Math.exp(-e / j$), e / w[b])),
        w[b] >= y$ && C[b] < ne * 1.02 && v < 0.02 && (D[b] = 0));
      let ce = se(O);
      if (u) {
        d += e;
        let t = d < x$ ? b$ : y$,
          n = !1,
          r = !1;
        for (let e = 0; e < 2; e++)
          !(T[e] > ne * 1.04) ||
            w[e] < t ||
            ((n = !0),
            C[e] < T[e] * 0.96 && (!h || C[e] < ne * 1.04) && (r = !0));
        if (!n && d < x$) return;
        if (n && r && !p) {
          ((p = !0), (d = 0), (w[0] = w[1] = 0));
          return;
        }
        if (((u = !1), p && ((p = !1), r || !n))) return;
        if (!n) {
          ae(f);
          return;
        }
        if (!r && m && ce < O.length - 1) {
          ((m = !1), ae(O[ce + 1]), (u = !0), (d = 0));
          return;
        }
        if (!r && ce > 0) {
          _++;
          for (let e = 0; e < 2; e++)
            !(T[e] > ne * 1.04) ||
              w[e] < t ||
              ((D[e] = h ? Math.max(T[e], ne * 1.12) : T[e]),
              Math.abs(T[1 - e] - T[e]) < T[e] * 0.08 &&
                (D[1 - e] = h ? Math.max(T[1 - e], ne * 1.12) : T[1 - e]));
          (ae(f), (g = Math.min(k$, O$ * 2 ** (_ - 1))));
          return;
        }
      }
      let le = i > ne * 1.12 || v > w$,
        ue = i < ne * 1.04;
      if ((l > 0 && (l -= e), le)) {
        if (
          ((c = 0),
          (s += e),
          l > 0 && s > 0.3 && !(E[b] > ne * 1.12 && C[b] < E[b] * 1.1))
        )
          (S.set(O[ce], (S.get(O[ce]) ?? 0) + 1),
            ce < O.length - 1 && ae(O[ce + 1]));
        else if (
          s > v$ &&
          g <= 0 &&
          ce < O.length - 1 &&
          w[b] >= y$ &&
          C[b] > ne * 1.04 &&
          !(C[b] < D[b] * 1.1)
        ) {
          let e = i > ne * 1.6 ? 2 : 1;
          (oe(T),
            (f = r),
            (m = e === 1),
            (h = !(i > ne * 1.12)),
            ae(O[Math.min(O.length - 1, ce + e)]),
            (u = !0),
            (d = 0));
        }
        return;
      }
      if (((s = Math.max(0, s - e)), !ue || ce === 0)) {
        c = 0;
        return;
      }
      c += e;
      let de = O[ce - 1];
      c > Math.min(D$, E$ * 2 ** (S.get(de) ?? 0)) && (oe(E), ae(de), (l = T$));
    }
    let le = () => (ee = performance.now());
    for (let e of [
      `pointermove`,
      `pointerdown`,
      `wheel`,
      `keydown`,
      `touchstart`,
      `scroll`,
    ])
      scope.listen(window, e, le, {
        capture: !0,
        passive: !0,
      });
    let ue = -1,
      de = -1,
      fe = 1e3 / 60,
      pe = -1,
      me = 1 / 0,
      he = !1;
    function ge(e) {
      (ue >= 0 && e - ue > 2 && (me = Math.min(me, e - ue)),
        (ue = e),
        pe < 0 || e < pe
          ? (pe = e)
          : e - pe > 500 && (me < 1 / 0 && (fe = me), (me = 1 / 0), (pe = e)));
      let t = Math.floor(1e3 / Math.max(15, n.idleFps) / fe + 0.1);
      return (
        (he = t >= 2 && n.idleCap && performance.now() - ee >= M$),
        (he && e - de < (t - 0.5) * fe) || ((de = e), !1)
      );
    }
    let _e = !1,
      ve = () => (_e = !1);
    function ye(t) {
      if (_e) return;
      t();
      let n = e.backend.device?.queue;
      n && ((_e = !0), n.onSubmittedWorkDone().then(ve, ve));
    }
    return {
      tuning: n,
      frame: ce,
      get dpr() {
        return r;
      },
      get fps() {
        return 1 / a;
      },
      get paced() {
        return he;
      },
      get paused() {
        return o > 0;
      },
      pause(e = 1.5) {
        ((o = Math.max(o, e)), (s = 0), le());
      },
      lift() {
        te = !0;
      },
      skip: ge,
      whenIdle: ye,
    };
  }
  return {
    createLighting,
    N$,
  };
}
