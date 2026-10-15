// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  Color,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MathUtils,
  Mesh,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from "three/webgpu";
import {
  abs,
  attribute,
  clamp,
  cos,
  dFdx,
  dFdy,
  dot,
  float,
  floor,
  Fn,
  fract,
  fwidth,
  hash,
  If,
  length,
  max,
  min,
  mix,
  mrt,
  packNormalToRGB,
  positionGeometry,
  positionViewDirection,
  pow,
  screenCoordinate,
  screenUV,
  sin,
  smoothstep,
  sqrt,
  step,
  uniform,
  varying,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
export function createSkyModule(
  scope,
  { paletteModule, renderingModule, audioModule },
) {
  const { acidGreen, palette } = paletteModule;
  const { cI, uI, postEffects } = renderingModule;
  const { sound } = audioModule;
  var P$ = {
    time: uniform(0),
    scroll: uniform(0),
    tanHalfFov: uniform(Math.tan(MathUtils.degToRad(30.5 / 2))),
    aspect: uniform(16 / 9),
    pxWorld: uniform(6e-4),
    below: uniform(0),
    night: uniform(0),
    parallax: uniform(0.22),
  };
  var F$ = 9.5;
  var I$ = (e, t) => e + Math.random() * (t - e);
  function L$(e, t) {
    let n = new PlaneGeometry(2, 2),
      r = new InstancedBufferGeometry();
    r.index = n.index;
    for (let e of [`position`, `normal`, `uv`])
      r.setAttribute(e, n.getAttribute(e));
    let i = {};
    for (let n of t) {
      let t = new InstancedBufferAttribute(new Float32Array(e * 4), 4);
      (r.setAttribute(n, t), (i[n] = t));
    }
    return (
      (r.instanceCount = e),
      {
        geo: r,
        attrs: i,
      }
    );
  }
  function R$(e) {
    let t = new MeshBasicNodeMaterial({
      transparent: !0,
      depthWrite: !1,
    });
    return (
      (t.alphaTest = 0.003),
      (t.fog = !1),
      (t.mrtNode = mrt({
        normal: packNormalToRGB(positionViewDirection),
        ...(e
          ? {
              emissive: vec4(e, 1),
            }
          : {}),
      })),
      t
    );
  }
  function z$(e, t, n) {
    let r = new Mesh(e, t);
    return (
      (r.frustumCulled = !1),
      (r.renderOrder = n),
      (r.matrixAutoUpdate = !1),
      (r.raycast = () => {}),
      r
    );
  }
  var B$ = {
    pink: uniform(new Color(`#ff4fa6`)),
    cyan: uniform(new Color(`#62e3ff`)),
    amount: uniform(0.85),
    offset: uniform(3.5),
  };
  var V$ = (e) => clamp(e.negate().add(0.5), 0, 1);
  var H$ = (e, t, n) => length(e.sub(t)).sub(n);
  var U$ = (e, t, n) => {
    let r = e.sub(t),
      i = n.sub(t),
      a = clamp(dot(r, i).div(dot(i, i)), 0, 1);
    return length(r.sub(i.mul(a)));
  };
  var W$ = (e, t, n) => {
    let r = abs(e).sub(t).add(n);
    return length(max(r, vec2(0)))
      .add(min(max(r.x, r.y), 0))
      .sub(n);
  };
  var G$ = (e, t, n) => {
    let r = clamp(t.sub(e).div(n).mul(0.5).add(0.5), 0, 1);
    return mix(t, e, r).sub(r.mul(r.oneMinus()).mul(n));
  };
  var K$ = (e, t, n, r, i) => {
    let a = r[0] - t[0],
      o = r[1] - t[1],
      s = Math.hypot(a, o),
      c = a / s,
      l = o / s,
      u = (n - i) / s,
      d = Math.sqrt(1 - u * u),
      f = e.sub(vec2(t[0], t[1])),
      p = abs(f.x.mul(l).sub(f.y.mul(c))),
      m = f.x.mul(c).add(f.y.mul(l)),
      h = m.mul(d).sub(p.mul(u)),
      g = length(vec2(p, m)).sub(n),
      _ = length(vec2(p, m.sub(s))).sub(i);
    return mix(
      mix(p.mul(d).add(m.mul(u)).sub(n), _, step(d * s, h)),
      g,
      step(h, 0),
    );
  };
  var q$ = (e, t, n, r) => {
    let i = clamp(e.x.div(t), -1, 1),
      a = mix(n, r, i.mul(i).oneMinus());
    return length(vec2(max(abs(e.x).sub(t), 0), e.y))
      .sub(a)
      .mul(0.92);
  };
  var J$ = (e, t) => {
    let n = t.cos(),
      r = t.sin();
    return vec2(e.x.mul(n).sub(e.y.mul(r)), e.x.mul(r).add(e.y.mul(n)));
  };
  function Y$(e, t, n, r) {
    let i = V$(e),
      a = dot(t.div(max(length(t), 1)), vec2(0.86, -0.51))
        .mul(r)
        .mul(uI),
      o = V$(e.sub(a)).mul(B$.amount),
      s = V$(e.add(a)).mul(B$.amount).mul(o.oneMinus()),
      c = o.add(s),
      l = B$.pink.mul(o).add(B$.cyan.mul(s));
    return {
      pre: n.mul(i).add(l.mul(i.oneMinus())),
      alpha: i.add(c.mul(i.oneMinus())),
      body: i,
    };
  }
  var X$ = (e, t) => ({
    pre: e.pre.add(t.pre.mul(e.alpha.oneMinus())),
    alpha: e.alpha.add(t.alpha.mul(e.alpha.oneMinus())),
  });
  var SRGBColorCache = class {
    hex = ``;
    srgb = new Color();
    get(e) {
      return (
        e !== this.hex &&
          ((this.hex = e), this.srgb.set(e).convertLinearToSRGB()),
        this.srgb
      );
    }
  };
  var Q$ = (e, t, n, r) => e.setRGB(t, n, r, SRGBColorSpace);
  function $$(e, t, n) {
    let r = e.get(t);
    Q$(n, r.r, r.g, r.b);
  }
  var e1 = {
    day: {
      top: `#1f63f2`,
      bottom: `#72c6ff`,
      haze: `#ffb8dc`,
      hazeAmount: 0.5,
      dots: 0.55,
      cloudLit: `#ffffff`,
      cloudBody: `#f7f3ff`,
      cloudShade: `#f2b3dd`,
      jet: `#ffffff`,
      jetShade: `#cdd6f6`,
      jetLine: `#7d86c4`,
      trail: `#ffffff`,
      trailAlpha: 0.9,
    },
    dusk: {
      top: `#3b3fc2`,
      bottom: `#ff80b0`,
      haze: `#ffbf8e`,
      hazeAmount: 0.55,
      dots: 0.4,
      cloudLit: `#ffe2b4`,
      cloudBody: `#ff9fc8`,
      cloudShade: `#a565d8`,
      jet: `#fff0f4`,
      jetShade: `#e2a6d6`,
      jetLine: `#9a5fc6`,
      trail: `#ffd8ea`,
      trailAlpha: 0.8,
    },
    night: {
      top: `#191185`,
      bottom: `#45138c`,
      haze: `#6a24a8`,
      hazeAmount: 0,
      dots: 0.16,
      cloudLit: `#8370ee`,
      cloudBody: `#281883`,
      cloudShade: `#1d1066`,
      jet: `#3d3196`,
      jetShade: `#2a2079`,
      jetLine: `#8370ee`,
      trail: `#a596ff`,
      trailAlpha: 0.35,
    },
  };
  var t1 = {
    haze: uniform(new Color(e1.day.haze)),
    hazeAmount: uniform(e1.day.hazeAmount),
    cloudLit: uniform(new Color(e1.day.cloudLit)),
    cloudBody: uniform(new Color(e1.day.cloudBody)),
    cloudShade: uniform(new Color(e1.day.cloudShade)),
    jet: uniform(new Color(e1.day.jet)),
    jetShade: uniform(new Color(e1.day.jetShade)),
    jetLine: uniform(new Color(e1.day.jetLine)),
    trail: uniform(new Color(e1.day.trail)),
    trailAlpha: uniform(e1.day.trailAlpha),
  };
  var n1 = [
    `top`,
    `bottom`,
    `haze`,
    `cloudLit`,
    `cloudBody`,
    `cloudShade`,
    `jet`,
    `jetShade`,
    `jetLine`,
    `trail`,
  ];
  var r1 = [`day`, `dusk`, `night`];
  var i1 = Object.fromEntries(r1.map((e) => [e, {}]));
  for (let e of r1) for (let t of n1) i1[e][t] = new SRGBColorCache();
  var a1 = (e) => e * e * (3 - 2 * e);
  var o1 = `day`;
  var s1 = `dusk`;
  var c1 = 0;
  function l1(e, t) {
    let n = i1[o1][e].get(e1[o1][e]),
      r = i1[s1][e].get(e1[s1][e]);
    Q$(
      t,
      n.r + (r.r - n.r) * c1,
      n.g + (r.g - n.g) * c1,
      n.b + (r.b - n.b) * c1,
    );
  }
  function u1(e) {
    let t = e1[o1][e];
    return t + (e1[s1][e] - t) * c1;
  }
  function d1(e, t) {
    e = MathUtils.clamp(e, 0, 1);
    let n = MathUtils.clamp(t, 0.05, 0.95);
    (e <= n
      ? ((o1 = `day`), (s1 = `dusk`), (c1 = a1(e / n)))
      : ((o1 = `dusk`), (s1 = `night`), (c1 = a1((e - n) / (1 - n)))),
      l1(`top`, postEffects.skyTop.value),
      l1(`bottom`, postEffects.skyBottom.value),
      (postEffects.skyDots.value = u1(`dots`)),
      l1(`haze`, t1.haze.value),
      (t1.hazeAmount.value = u1(`hazeAmount`)),
      l1(`cloudLit`, t1.cloudLit.value),
      l1(`cloudBody`, t1.cloudBody.value),
      l1(`cloudShade`, t1.cloudShade.value),
      l1(`jet`, t1.jet.value),
      l1(`jetShade`, t1.jetShade.value),
      l1(`jetLine`, t1.jetLine.value),
      l1(`trail`, t1.trail.value),
      (t1.trailAlpha.value = u1(`trailAlpha`)));
  }
  var f1 = (e) => {
    let t = mix(postEffects.skyTop, postEffects.skyBottom, smoothstep(0, 1, e)),
      n = smoothstep(0.45, 1, e);
    return mix(t, t1.haze, n.mul(n).mul(t1.hazeAmount));
  };
  function p1() {
    return Fn(() => {
      let e = screenUV.y,
        t = f1(e),
        n = fract(
          J$(screenCoordinate.xy, float(0.6)).div(
            postEffects.skyDotSize.mul(uI),
          ),
        ).sub(0.5),
        r = clamp(
          smoothstep(0.35, 1, e).mul(0.36).sub(length(n)).div(0.05),
          0,
          1,
        );
      return t.add(
        vec3(0.06, 0.1, 0.12)
          .mul(r)
          .mul(smoothstep(0.35, 0.9, e))
          .mul(postEffects.skyDots),
      );
    })();
  }
  var m1 = 62;
  var h1 = -0.3;
  var g1 = 0.15;
  var Stars = class {
    mesh;
    u = {
      size: uniform(1),
      sparkleSize: uniform(1),
      opacity: uniform(1),
      twinkle: uniform(0.5),
      twinkleSpeed: uniform(1),
      glow: uniform(0.6),
      from: uniform(0.45),
      to: uniform(0.9),
      warm: uniform(new Color(`#ffd89e`)),
      cool: uniform(new Color(`#a9d6ff`)),
      sparkle: uniform(new Color(`#fff6fb`)),
    };
    geo;
    aA;
    aB;
    constructor() {
      let { geo: e, attrs: t } = L$(240, [`aStarA`, `aStarB`]);
      ((this.geo = e),
        (this.aA = t.aStarA),
        (this.aB = t.aStarB),
        this.scatter());
      let n = this.u,
        r = attribute(`aStarA`, `vec4`),
        i = attribute(`aStarB`, `vec4`),
        a = i.x,
        o = float(m1),
        s = P$.tanHalfFov.mul(o),
        c = s.mul(2.25).mul(P$.below.add(1)),
        l = P$.scroll.mul(P$.parallax).mul((m1 / F$) * 0.45),
        u = fract(r.y.add(l.div(c)))
          .sub(0.5)
          .mul(c)
          .sub(s.mul(P$.below)),
        d = r.x.mul(s).mul(P$.aspect),
        f = sin(P$.time.mul(i.z).mul(n.twinkleSpeed).add(r.w.mul(6.283)))
          .mul(0.5)
          .add(0.5),
        p = mix(n.from, n.to.sub(g1).max(n.from), i.w),
        m = smoothstep(p, p.add(g1), P$.night),
        h = mix(
          n.size,
          n.sparkleSize.mul(f.sub(0.5).mul(n.twinkle).mul(0.7).add(1)),
          a,
        ),
        g = r.z.mul(h).mul(step(0.002, m)),
        _ = g.mul(P$.pxWorld).mul(o),
        v = vec3(
          d.add(positionGeometry.x.mul(_)),
          u.add(positionGeometry.y.mul(_)),
          o.negate(),
        ),
        y = varying(g),
        b = varying(f),
        x = varying(m),
        S = positionGeometry.xy,
        C = float(1).div(max(y.mul(uI), 0.5)),
        w = length(S).sub(0.55).div(C),
        T = abs(S),
        E = pow(T.x, 0.36).add(pow(T.y, 0.36)).sub(0.95),
        D = min(fwidth(E), C.mul(3)).max(1e-4),
        ee = V$(mix(w, min(E.div(D), length(S).sub(0.14).div(C)), a)),
        te = mix(n.cool, n.warm, i.y),
        O = mix(te, mix(n.sparkle, te, 0.3), a),
        ne = mix(
          float(1).sub(n.twinkle.mul(0.55).mul(b.oneMinus())),
          float(1),
          a,
        ),
        re = ee.mul(x).mul(ne).mul(n.opacity),
        ie = R$(O.mul(re).mul(n.glow));
      ((ie.positionNode = v),
        (ie.colorNode = vec4(O, re)),
        (ie.name = `sky-stars`),
        (this.mesh = z$(e, ie, -40)),
        (this.mesh.name = `sky-stars`));
    }
    setCount(e) {
      this.geo.instanceCount = MathUtils.clamp(Math.round(e), 0, 240);
    }
    get firstAppear() {
      let e = this.u.from.value;
      return e + h1 * (Math.max(this.u.to.value - g1, e) - e);
    }
    scatter() {
      let e = new Float32Array(480);
      for (let t = 0; t < 240; t++) {
        let n = 0,
          r = 0,
          i = -1;
        for (let a = 0; a < 10; a++) {
          let a = Math.random(),
            o = Math.random(),
            s = 1 / 0;
          for (let n = 0; n < t; n++) {
            let t = (a - e[n * 2]) * 1.7,
              r = Math.abs(o - e[n * 2 + 1]);
            ((r = Math.min(r, 1 - r)), (s = Math.min(s, t * t + r * r)));
          }
          s > i && ((i = s), (n = a), (r = o));
        }
        ((e[t * 2] = n), (e[t * 2 + 1] = r));
        let a = t % 9 == 4,
          o = a ? I$(5, 9) / 0.86 : (1 + Math.random() ** 3 * 1.6) / 0.55,
          s = Math.random() < 0.5 ? I$(0, 0.25) : I$(0.7, 1),
          c = a && t < 15 ? h1 : Math.random();
        (this.aA.setXYZW(t, n * 2.2 - 1.1, r, o, Math.random()),
          this.aB.setXYZW(t, +!!a, s, a ? I$(1.1, 2.2) : I$(0.6, 1.6), c));
      }
      ((this.aA.needsUpdate = !0), (this.aB.needsUpdate = !0));
    }
  };
  var v1 = 22;
  var y1 = 52;
  var b1 = [`puffy`, `pill`, `curl`, `bars`];
  var x1 = 3;
  var S1 = [
    [0.24, 0.46, 2.2, 3.3, -0.04, 0.04],
    [0.38, 0.58, 4.2, 5.2, -0.03, 0.03],
    [0.2, 0.3, 2, 2.4, -0.04, 0.04],
    [0.32, 0.5, 4, 6, -0.03, 0.08],
  ];
  var C1 = (e, t, n, r) => {
    let i = W$(e.sub(vec2(0, -0.42)), vec2(t.sub(0.06), 0.42), 0.42),
      a = H$(e, vec2(t.mul(n.mul(0.1).sub(0.45)), -0.08), 0.56),
      o = H$(e, vec2(t.mul(r.mul(0.1).add(0.04)), 0.14), 0.8),
      s = H$(e, vec2(t.mul(n.mul(-0.08).add(0.47)), -0.12), 0.5);
    return vec2(
      G$(G$(i, a, 0.18), G$(o, s, 0.18), 0.18),
      e.y.add(0.42).sub(sin(e.x.mul(1.7).add(n.mul(4))).mul(0.05)),
    );
  };
  var w1 = (e, t, n) => {
    let r = q$(e.add(vec2(0, 0.4)), t.sub(0.55), 0.5, 0.6),
      i = t.mul(n.mul(0.2).add(0.1));
    return vec2(
      G$(r, q$(e.sub(vec2(i, 0.32)), t.mul(0.5).sub(0.45), 0.5, 0.68), 0.3),
      e.y.add(0.5),
    );
  };
  var T1 = (e, t, n) => {
    let r = W$(e.sub(vec2(0, -0.48)), vec2(t.sub(0.04), 0.4), 0.4),
      i = H$(e, vec2(t.negate().add(0.78), -0.06), 0.76),
      a = H$(e, vec2(t.mul(n.mul(0.05).add(0.2)), 0.12), 0.86),
      o = H$(e, vec2(t.sub(0.46), -0.26), 0.44);
    return vec2(G$(G$(r, i, 0.1), G$(a, o, 0.15), 0.1), e.y.add(0.5));
  };
  var E1 = 0.52;
  var D1 = (e, t, n, r) => {
    let i = vec2(e.x.sub(e.y.mul(0.6)), e.y),
      a = (e) => vec2(t.mul(e), 0.2),
      o = W$(i.sub(vec2(t.mul(n.mul(0.1).sub(0.12)), E1)), a(0.42), 0.17),
      s = W$(i.sub(vec2(t.mul(0.06), 0)), a(0.66), 0.17),
      c = W$(i.sub(vec2(t.mul(r.mul(0.1).add(0.2)), -0.52)), a(0.38), 0.17),
      l = e.y.sub(floor(e.y.div(E1).add(0.5)).mul(E1));
    return vec2(min(o, min(s, c)), l.add(0.03));
  };
  var Clouds = class {
    mesh;
    u = {
      count: uniform(9),
      size: uniform(1),
      speed: uniform(0.05),
      opacity: uniform(1),
      haze: uniform(0.4),
      rimWidth: uniform(0.22),
      belly: uniform(1),
      rim: uniform(1),
    };
    aA;
    aB;
    aC;
    rank = new Float32Array(14);
    mirror = new Float32Array(14);
    rSize = new Float32Array(42);
    weights = new Float32Array(b1.length).fill(1 / b1.length);
    kindStart = Math.random();
    constructor() {
      let { geo: e, attrs: t } = L$(14, [`aCloudA`, `aCloudB`, `aCloudC`]);
      ((this.aA = t.aCloudA),
        (this.aB = t.aCloudB),
        (this.aC = t.aCloudC),
        this.scatter());
      let n = this.u,
        r = attribute(`aCloudA`, `vec4`),
        i = attribute(`aCloudB`, `vec4`),
        a = attribute(`aCloudC`, `vec4`),
        o = i.z,
        s = mix(float(v1), float(y1), r.z),
        c = P$.tanHalfFov.mul(s),
        l = c.mul(P$.aspect),
        u = i.y
          .mul(c)
          .mul(n.size)
          .mul(mix(1.1, 0.75, r.z))
          .mul(P$.aspect.clamp(0.6, 1))
          .div(o),
        d = P$.pxWorld.mul(s).div(u),
        f = B$.offset.add(3).mul(d),
        p = step(a.x, n.count.sub(0.5)),
        m = vec2(o.add(f), f.add(1.04)).mul(p),
        h = positionGeometry.xy.mul(m),
        g = J$(h.mul(u), i.w),
        _ = length(m).mul(u),
        v = s.div(F$).mul(mix(1.15, 0.7, r.z)),
        y = l.add(_).mul(2),
        b = c.mul(P$.below.add(1)).add(_).mul(2),
        x = fract(r.x.add(P$.time.mul(n.speed).mul(v).div(y)))
          .sub(0.5)
          .mul(y),
        S = fract(r.y.add(P$.scroll.mul(P$.parallax).mul(v).div(b)))
          .sub(0.5)
          .mul(b)
          .sub(c.mul(P$.below)),
        C = vec3(x.add(g.x), S.add(g.y), s.negate()),
        w = varying(h),
        T = varying(d),
        E = Fn(() => {
          let e = vec2(w.x.mul(a.y), w.y).toVar(),
            t = i.x,
            s = a.z,
            c = a.w,
            l = vec2(0).toVar();
          If(t.lessThan(0.5), () => {
            l.assign(C1(e, o, s, c));
          })
            .ElseIf(t.lessThan(1.5), () => {
              l.assign(w1(e, o, s));
            })
            .ElseIf(t.lessThan(2.5), () => {
              l.assign(T1(e, o, s));
            })
            .Else(() => {
              l.assign(D1(e, o, s, c));
            });
          let u = uI.div(T),
            d = l.x.mul(u),
            f = vec2(dFdx(d), dFdy(d)),
            p = max(n.rimWidth.mul(u), uI.mul(1.5)),
            m = V$(d.add(f.y.mul(p)))
              .oneMinus()
              .mul(n.rim),
            h = V$(l.y.mul(u)).mul(n.belly),
            g = r.w.mul(0.07).add(0.95),
            _ = Y$(
              d,
              f,
              mix(
                mix(t1.cloudBody, t1.cloudShade, h),
                t1.cloudLit,
                clamp(m, 0, 1),
              ).mul(g),
              B$.offset,
            );
          return vec4(
            mix(_.pre.div(max(_.alpha, 1e-4)), f1(screenUV.y), r.z.mul(n.haze)),
            _.alpha.mul(n.opacity),
          );
        })(),
        D = R$();
      ((D.positionNode = C),
        (D.colorNode = E),
        (D.name = `sky-clouds`),
        (this.mesh = z$(e, D, -20)),
        (this.mesh.name = `sky-clouds`));
    }
    setMix(e, t, n, r) {
      let i = Math.max(0, e),
        a = Math.max(0, t),
        o = Math.max(0, n),
        s = Math.max(0, r),
        c = i + a + o + s,
        l = i;
      c <= 1e-6 && ((l = 1), (c = 1));
      let u = this.weights,
        d = a / c,
        f = o / c,
        p = s / c;
      ((l /= c),
        !(
          Math.abs(u[0] - l) +
            Math.abs(u[1] - d) +
            Math.abs(u[2] - f) +
            Math.abs(u[3] - p) <
          1e-4
        ) &&
          ((u[0] = l), (u[1] = d), (u[2] = f), (u[3] = p), this.layoutKinds()));
    }
    layoutKinds() {
      let e = this.weights;
      for (let t = 0; t < 14; t++) {
        let n = (this.kindStart + this.rank[t] * 0.618034) % 1,
          r = 0,
          i = e[0];
        for (; r < e.length - 1 && n >= i;) i += e[++r];
        for (; r > 0 && e[r] <= 0;) r--;
        let [a, o, s, c, l, u] = S1[r],
          d = t * 3;
        (this.aB.setXYZW(
          t,
          r,
          a + (o - a) * this.rSize[d],
          s + (c - s) * this.rSize[d + 1],
          l + (u - l) * this.rSize[d + 2],
        ),
          this.aC.setY(t, r === x1 ? 1 : this.mirror[t]));
      }
      this.aB.needsUpdate = this.aC.needsUpdate = !0;
    }
    scatter() {
      let e = [];
      for (let t = 0; t < 14; t++) {
        let n = (t * 0.618034 + I$(-0.08, 0.08) + 1) % 1,
          r = Math.random() < 0.5 ? -1 : 1;
        e.push({
          a: [Math.random(), n, Math.random(), Math.random()],
          c: [t, r, I$(-1, 1), I$(-1, 1)],
          s: [Math.random(), Math.random(), Math.random()],
        });
      }
      (e.sort((e, t) => t.a[2] - e.a[2]),
        e.forEach((e, t) => {
          (this.aA.setXYZW(t, e.a[0], e.a[1], e.a[2], e.a[3]),
            this.aC.setXYZW(t, e.c[0], e.c[1], e.c[2], e.c[3]),
            (this.rank[t] = e.c[0]),
            (this.mirror[t] = e.c[1]),
            this.rSize.set(e.s, t * 3));
        }),
        (this.aA.needsUpdate = !0),
        this.layoutKinds());
    }
  };
  var k1 = 1.9;
  var A1 = 1.25;
  var j1 = 10;
  var M1 = 0.3;
  function N1(e) {
    let t = Math.max(8, Math.ceil(e / M1)),
      n = [];
    for (let r = 0; r <= t; r++) n.push((e * r) / t);
    return n;
  }
  function P1(e, t) {
    let n = 1 / (t.pxWorld * e.D);
    return {
      px: e.x0 * n,
      py: e.y0 * n - e.scroll * t.liftPx,
      vx: Math.cos(e.heading) * e.speed * n,
      vy: Math.sin(e.heading) * e.speed * n,
      t0: e.t0,
      t1: e.t0 + e.cross,
      len: (t.planePx * t.refDepth) / e.D,
    };
  }
  function F1(e, t, n, r, i) {
    let a = r - e.t0,
      o = r - n - t.t0,
      s = e.px + e.vx * a - (t.px + t.vx * o),
      c = e.py + e.vy * a - (t.py + t.vy * o),
      l = e.vx - t.vx,
      u = e.vy - t.vy,
      d = l * l + u * u,
      f = d > 1e-9 ? Math.min(Math.max(-(s * l + c * u) / d, 0), i - r) : 0;
    return Math.hypot(s + l * f, c + u * f);
  }
  function I1(e, t, n) {
    let r = (e.len + t.len) / 2;
    for (let i of n) {
      let n = (i === 0 ? k1 : A1) * r,
        a = Math.max(e.t0, t.t0 + i),
        o = Math.min(e.t1, t.t1 + i);
      if (
        (a <= o && F1(e, t, i, a, o) < n) ||
        (i !== 0 &&
          ((a = Math.max(t.t0, e.t0 + i)),
          (o = Math.min(t.t1, e.t1 + i)),
          a <= o && F1(t, e, i, a, o) < n))
      )
        return !1;
    }
    return !0;
  }
  function L1(e, t, n, r, i) {
    let a = (e, t) => e + i() * (t - e),
      o = a(38, 54),
      s = r.tanHalfFov * o,
      c = s * r.aspect,
      l = r.planePx * (r.refDepth / o) * r.pxWorld * o * 0.8,
      u = 2 * (c + l),
      d = a(0.04, 0.26) * (i() < 0.7 ? 1 : -1),
      f = a(-0.3, 0.7) * s,
      p = f + Math.tan(d) * u;
    ((p > 0.95 * s || p < -0.55 * s) && ((d = -d), (p = f + Math.tan(d) * u)),
      p > 0.95 * s && (f -= p - 0.95 * s),
      p < -0.55 * s && (f += -0.55 * s - p));
    let m = i() < 0.5,
      h = n * a(0.8, 1.25);
    return {
      x0: m ? -(c + l) : c + l,
      y0: f,
      heading: m ? d : Math.PI - d,
      D: o,
      t0: e,
      speed: u / Math.cos(d) / h,
      cross: h,
      scroll: t,
    };
  }
  function R1(e, t, n, r, i, a = Math.random) {
    let o = i.map((e) => P1(e, r)),
      s = N1(r.trailLife);
    for (let i = 0; i < j1; i++) {
      let i = L1(e, t, n, r, a),
        c = P1(i, r);
      if (o.every((e) => I1(c, e, s))) return i;
    }
    return null;
  }
  function z1(e, t, n, r) {
    let i = P1(e, n),
      a = P1(t, n),
      o = Math.max(r, i.t0, a.t0),
      s = Math.min(i.t1, a.t1);
    return o > s || F1(i, a, 0, o, s) >= 1.2 * ((i.len + a.len) / 2);
  }
  var B1 = 54;
  var V1 = 46;
  var H1 = 0.44;
  var U1 = 1.4;
  var W1 = 2.8;
  var G1 = 14;
  var K1 = 16;
  var q1 = 0.6;
  var J1 = 0.048;
  var Y1 = 0.1;
  var X1 = 0.02;
  var Z1 = 0.35;
  var Q1 = (e) => {
    let t = new Color(e);
    return vec3(t.r, t.g, t.b);
  };
  var $1 = Q1(palette.red);
  var e0 = Q1(acidGreen);
  var t0 = (e) => vec4(e.pre, e.alpha);
  var n0 = (e) => ({
    pre: e.xyz,
    alpha: e.w,
  });
  var r0 = {
    nose: 0.31,
    body: 0.115,
    tailX: -0.42,
    tailR: 0.06,
    wingRoot: [0.08, 0],
    wingRootR: 0.135,
    wingTip: [-0.13, 0.43],
    wingTipR: 0.055,
    engX0: 0.17,
    engX1: 0.05,
    engY: 0.205,
    engR: 0.056,
    stabRoot: [-0.31, 0],
    stabRootR: 0.065,
    stabTip: [-0.42, 0.18],
    stabTipR: 0.033,
  };
  function i0(e) {
    let t = abs(e.y),
      n = vec2(e.x, t),
      r = min(
        U$(e, vec2(r0.nose, 0), vec2(-0.16, 0)).sub(r0.body),
        K$(e, [-0.16, 0], r0.body, [r0.tailX, 0], r0.tailR),
      ),
      i = K$(n, r0.wingRoot, r0.wingRootR, r0.wingTip, r0.wingTipR),
      a = U$(n, vec2(r0.engX0, r0.engY), vec2(r0.engX1, r0.engY)).sub(r0.engR),
      o = K$(n, r0.stabRoot, r0.stabRootR, r0.stabTip, r0.stabTipR);
    return {
      sil: min(G$(G$(r, i, 0.04), o, 0.03), a),
      fus: r,
      eng: a,
    };
  }
  var PlaneTrails = class {
    mesh;
    u = {
      size: uniform(1),
      life: uniform(7),
      width: uniform(1),
      aberration: uniform(1),
      breakup: uniform(1),
      opacity: uniform(0.9),
      nav: uniform(1),
    };
    aA;
    aB;
    flights = [];
    fitPx = 1 / 0;
    constructor() {
      let { geo: e, attrs: t } = L$(3, [`aPlaneA`, `aPlaneB`]);
      ((this.aA = t.aPlaneA.setUsage(DynamicDrawUsage)),
        (this.aB = t.aPlaneB.setUsage(DynamicDrawUsage)));
      for (let e = 0; e < 3; e++) this.aA.setW(e, V1);
      let n = this.u,
        r = attribute(`aPlaneA`, `vec4`),
        i = attribute(`aPlaneB`, `vec4`),
        a = r.w.max(1),
        o = i.y,
        s = i.w,
        c = P$.pxWorld.mul(a),
        l = n.size.mul(float(V1).div(a)),
        u = l.mul(B1),
        d = u.mul(H1),
        f = o.mul(P$.time.sub(i.x).max(0)),
        p = B$.offset.mul(q1).add(3),
        m = min(
          f.sub(o.mul(n.life)).sub(d.add(4).mul(c)).max(u.mul(-1).mul(c)),
          f.sub(u.mul(0.62).add(p).mul(c)),
        ),
        h = f.add(u.mul(0.62).add(p).mul(c)),
        g = n.width
          .mul(W1)
          .mul(l)
          .add(B$.offset.mul(0.9).mul(abs(n.aberration))),
        _ = max(u.mul(0.56), g).add(p).mul(c).mul(step(1e-5, o)),
        v = mix(m, h, positionGeometry.x.mul(0.5).add(0.5)),
        y = positionGeometry.y.mul(_),
        b = vec2(cos(r.z), sin(r.z)),
        x = P$.scroll.sub(i.z).mul(P$.parallax).mul(a.div(F$)).mul(0.8),
        S = vec3(
          vec2(r.x, r.y.add(x))
            .add(b.mul(v))
            .add(vec2(b.y.negate(), b.x).mul(y)),
          a.negate(),
        ),
        C = varying(c),
        w = step(0, b.x).mul(2).sub(1),
        T = varying(v).div(C),
        E = varying(y).div(C).mul(w),
        D = varying(f).div(C),
        ee = varying(u),
        te = varying(l),
        O = max(o, 1e-4).div(C),
        ne = n.life,
        re = vec2(T.sub(D), E).div(ee),
        ie = ee.mul(uI),
        ae = fract(P$.time.mul(0.85).add(s)),
        oe = (e) =>
          smoothstep(e, e + 0.02, ae).mul(
            smoothstep(e + 0.05, e + 0.08, ae).oneMinus(),
          ),
        se = max(oe(0), oe(0.14)),
        ce = smoothstep(0.55, 0.62, P$.night),
        le = smoothstep(0.62, 0.85, P$.night).mul(Z1),
        ue = (e) => {
          let t = length(re.sub(e)),
            n = V$(t.sub(J1).mul(ie));
          return {
            a: mix(V$(t.sub(Y1).mul(ie)).mul(le), 1, n),
            core: n,
            hot: V$(t.sub(X1).mul(ie)),
          };
        },
        de = r0.wingTip[0],
        fe = r0.wingTip[1],
        pe = ue(vec2(de, w.mul(-fe))),
        me = ue(vec2(de, w.mul(fe))),
        he = ue(vec2(-0.48, 0)),
        ge = pe.a,
        _e = me.a,
        ve = he.a.mul(se),
        ye = max(max(ge, _e), ve).mul(ce).mul(min(n.nav, 1)).clamp(0, 1),
        be = se.mul(0.85),
        xe = mix($1, vec3(1), be),
        Se = mix(e0, vec3(1), be),
        Ce = max(max(pe.hot, me.hot), he.hot.mul(se)),
        we = mix(
          xe
            .mul(ge)
            .add(Se.mul(_e))
            .add(vec3(1).mul(ve))
            .div(max(ge.add(_e).add(ve), 0.001)),
          vec3(1),
          Ce.mul(0.55),
        ),
        Te = max(max(pe.core, me.core), he.core.mul(se)).mul(ce).clamp(0, 1),
        Ee = Fn(() => {
          let e = T.toVar(),
            t = E.toVar(),
            r = D.toVar(),
            i = ee.toVar(),
            a = te.toVar(),
            o = O.toVar(),
            c = re.toVar(),
            l = ie.toVar(),
            u = r.sub(i.mul(H1)).toVar(),
            d = vec4(0).toVar();
          {
            let r = u.sub(e),
              i = clamp(r.div(o.mul(ne)), 0, 1),
              c = sqrt(i),
              l = mix(U1, W1, c)
                .mul(n.width)
                .mul(a)
                .mul(smoothstep(0, a.mul(G1), r)),
              f = a.mul(K1),
              p = e.div(f).add(s.mul(97)).add(200),
              m = smoothstep(0.5, 1, i)
                .mul(n.breakup)
                .mul(hash(floor(p)).mul(0.8).add(0.9))
                .oneMinus()
                .add(0.2),
              h = m.mul(0.5).mul(f),
              g = clamp(m.oneMinus().mul(4), 0, 1),
              _ = max(h.sub(l.mul(g)), 0),
              v = min(l, h),
              y = max(abs(fract(p).sub(0.5)).mul(f).sub(_), 0),
              b = (e) =>
                length(vec2(y, abs(t.add(e))))
                  .sub(v)
                  .max(r.negate()),
              x = B$.offset.mul(mix(0.45, 0.9, c)).mul(n.aberration),
              S = V$(b(float(0)).mul(uI)),
              C = V$(b(x).mul(uI)).mul(B$.amount),
              w = V$(b(x.negate()).mul(uI)).mul(B$.amount).mul(C.oneMinus()),
              T = smoothstep(0.55, 1, i)
                .oneMinus()
                .mul(n.opacity)
                .mul(t1.trailAlpha),
              E = t1.trail
                .mul(S)
                .add(B$.pink.mul(C).add(B$.cyan.mul(w)).mul(S.oneMinus()));
            d.assign(vec4(E, S.add(C.add(w).mul(S.oneMinus()))).mul(T));
          }
          let f = vec4(0).toVar();
          {
            let e = i0(c),
              t = e.sil.mul(l),
              n = t.sub(uI.mul(1.2)),
              r = vec2(dFdx(n), dFdy(n)),
              i = max(l.mul(0.07), uI.mul(1.5)),
              a = V$(t.sub(r.y.mul(i))).oneMinus(),
              o = V$(t.add(r.y.mul(i))).oneMinus(),
              s = mix(
                mix(t1.jet, t1.jetShade, a),
                mix(t1.jet, t1.cloudLit, 0.6),
                o,
              ),
              u = V$(c.y.add(0.02).mul(l)).mul(V$(e.fus.mul(l)));
            s = mix(s, t1.jetShade, max(u, V$(e.eng.mul(l))));
            let d = mix(t1.jetLine, s, V$(t));
            f.assign(t0(Y$(n, r, d, B$.offset.mul(q1))));
          }
          let p = X$(
            {
              pre: we.mul(ye),
              alpha: ye,
            },
            X$(n0(f), n0(d)),
          );
          return vec4(p.pre.div(max(p.alpha, 1e-4)), p.alpha);
        })(),
        De = R$(we.mul(Te).mul(n.nav.mul(1.6)));
      ((De.positionNode = S),
        (De.colorNode = Ee),
        (De.name = `sky-planes`),
        (this.mesh = z$(e, De, -30)),
        (this.mesh.name = `sky-planes`),
        (this.mesh.visible = !1));
    }
    spawn(e, t, n) {
      if (this.flights.length >= 3) return `full`;
      let r = R1(e, t, n, this.view(), this.flights);
      return r
        ? (this.flights.push({
            ...r,
            seed: Math.random(),
          }),
          (this.fitPx = P$.pxWorld.value),
          this.writeRows(),
          sound.sfx.planePass(Math.cos(r.heading) > 0 ? -0.8 : 0.8, r.cross),
          `ok`)
        : `blocked`;
    }
    writeRows() {
      this.flights.sort((e, t) => t.D - e.D);
      for (let e = 0; e < 3; e++) {
        let t = this.flights[e];
        t
          ? (this.aA.setXYZW(e, t.x0, t.y0, t.heading, t.D),
            this.aB.setXYZW(e, t.t0, t.speed, t.scroll, t.seed))
          : this.aB.setY(e, 0);
      }
      this.aA.needsUpdate = this.aB.needsUpdate = !0;
    }
    view() {
      return {
        tanHalfFov: P$.tanHalfFov.value,
        aspect: P$.aspect.value,
        pxWorld: P$.pxWorld.value,
        planePx: B1 * this.u.size.value,
        refDepth: V1,
        liftPx: (P$.parallax.value * 0.8) / (F$ * P$.pxWorld.value),
        trailLife: this.u.life.value,
      };
    }
    update(e) {
      let t = this.u.life.value + 0.5,
        n = this.flights.length;
      return (
        (this.flights = this.flights.filter((n) => e - n.t0 <= n.cross + t)),
        this.refit(e),
        this.flights.length !== n && this.writeRows(),
        this.flights.length > 0
      );
    }
    refit(e) {
      let t = P$.pxWorld.value;
      if (t <= this.fitPx) {
        this.fitPx = t;
        return;
      }
      if (t < this.fitPx * 1.1) return;
      this.fitPx = t;
      let n = this.view(),
        r = [...this.flights].sort((e, t) => e.t0 - t.t0),
        i = [];
      for (let t of r) i.every((r) => z1(t, r, n, e)) && i.push(t);
      i.length < r.length &&
        (this.flights = this.flights.filter((e) => i.includes(e)));
    }
    clear() {
      ((this.flights = []), this.writeRows());
    }
  };
  var o0 = {
    duskAt: 0.5,
    parallax: 0.378,
    stars: !0,
    starCount: 120,
    starSize: 0.815,
    sparkleSize: 1.207,
    starOpacity: 1,
    twinkle: 1,
    twinkleSpeed: 1.61,
    starGlow: 0.489,
    starsFrom: 0.38,
    starsTo: 0.902,
    starWarm: `#ffd89e`,
    starCool: `#a9d6ff`,
    sparkleColor: `#fff6fb`,
    clouds: !0,
    cloudCount: 9,
    cloudPuffy: 1,
    cloudPill: 0.6,
    cloudCurl: 0.5,
    cloudBars: 0.7,
    cloudSize: 1,
    cloudSpeed: 0.05,
    cloudOpacity: 1,
    cloudHaze: 0.4,
    cloudRim: 1,
    cloudRimWidth: 0.22,
    cloudBelly: 0.902,
    cloudPlates: 0.85,
    cloudPlateOffset: 3.5,
    platePink: `#ff4fa6`,
    plateCyan: `#62e3ff`,
    planes: !0,
    planeInterval: 14,
    planeCrossTime: 16,
    planeSize: 1,
    trailLife: 7,
    trailOpacity: 0.9,
    trailWidth: 1,
    trailAberration: 1,
    trailBreakup: 1,
    navLights: 1,
  };
  function createSky() {
    let e = o0,
      t = new Group();
    t.name = `sky`;
    let n = new Stars(),
      r = new Clouds(),
      i = new PlaneTrails();
    t.add(n.mesh, i.mesh, r.mesh);
    let a = {
        warm: new SRGBColorCache(),
        cool: new SRGBColorCache(),
        sparkle: new SRGBColorCache(),
        pink: new SRGBColorCache(),
        cyan: new SRGBColorCache(),
      },
      o = 0,
      s = 3,
      c = 0,
      l = 0,
      u = !1,
      d = new Vector3();
    function f() {
      let t = n.u;
      ((t.size.value = e.starSize),
        (t.sparkleSize.value = e.sparkleSize),
        (t.opacity.value = e.starOpacity),
        (t.twinkle.value = e.twinkle),
        (t.twinkleSpeed.value = e.twinkleSpeed),
        (t.glow.value = e.starGlow),
        (t.from.value = e.starsFrom),
        (t.to.value = Math.max(e.starsTo, e.starsFrom + 0.01)),
        $$(a.warm, e.starWarm, t.warm.value),
        $$(a.cool, e.starCool, t.cool.value),
        $$(a.sparkle, e.sparkleColor, t.sparkle.value),
        n.setCount(e.starCount));
      let s = r.u;
      ((s.count.value = e.cloudCount),
        (s.size.value = Math.max(0.05, e.cloudSize)),
        (s.speed.value = e.cloudSpeed),
        (s.opacity.value = e.cloudOpacity),
        (s.haze.value = e.cloudHaze),
        (s.rim.value = e.cloudRim),
        (s.rimWidth.value = e.cloudRimWidth),
        (s.belly.value = e.cloudBelly),
        r.setMix(e.cloudPuffy, e.cloudPill, e.cloudCurl, e.cloudBars),
        (B$.amount.value = e.cloudPlates * (1 - 0.5 * o)),
        (B$.offset.value = e.cloudPlateOffset),
        $$(a.pink, e.platePink, B$.pink.value),
        $$(a.cyan, e.plateCyan, B$.cyan.value));
      let c = i.u;
      ((c.size.value = Math.max(0.05, e.planeSize)),
        (c.life.value = Math.max(0.5, e.trailLife)),
        (c.width.value = Math.max(0, e.trailWidth)),
        (c.aberration.value = e.trailAberration),
        (c.breakup.value = Math.max(0, e.trailBreakup)),
        (c.opacity.value = e.trailOpacity),
        (c.nav.value = e.navLights),
        (P$.parallax.value = e.parallax));
    }
    function p(t) {
      ((o = MathUtils.clamp(t, 0, 1)), (P$.night.value = o), d1(o, e.duskAt));
    }
    function m(a) {
      let p = cI?.matches ? c : a.elapsed,
        m = a.camera;
      (m.updateWorldMatrix(!0, !1),
        m.matrixWorld.decompose(t.position, t.quaternion, d));
      let g = Math.tan(MathUtils.degToRad(m.fov / 2)) / m.zoom;
      ((P$.time.value = p),
        (P$.scroll.value = cI?.matches ? 0 : a.scroll),
        (P$.tanHalfFov.value = g),
        (P$.aspect.value = m.aspect),
        (P$.pxWorld.value =
          (2 * g) / Math.max(1, a.viewH ?? window.innerHeight)),
        (P$.below.value = Math.max(0, a.below ?? 0)),
        (c = p),
        (l = a.scroll),
        d1(o, e.duskAt),
        f(),
        (n.mesh.visible =
          e.stars &&
          e.starCount >= 1 &&
          e.starOpacity > 0 &&
          o > n.firstAppear),
        (r.mesh.visible = e.clouds && e.cloudCount >= 1 && e.cloudOpacity > 0),
        e.planes && !cI?.matches
          ? (p >= s &&
              (s =
                p +
                (i.spawn(p, a.scroll, e.planeCrossTime) === `blocked`
                  ? 2
                  : Math.max(1, e.planeInterval) * (0.5 + Math.random()))),
            (i.mesh.visible = i.update(p)))
          : i.mesh.visible && (i.clear(), (i.mesh.visible = !1)),
        u && h());
    }
    function h() {
      n.mesh.visible = r.mesh.visible = i.mesh.visible = !0;
    }
    return (
      p(0),
      f(),
      {
        group: t,
        tuning: e,
        palettes: e1,
        backgroundNode: p1(),
        setTimeOfDay: p,
        get timeOfDay() {
          return o;
        },
        update: m,
        spawnPlane() {
          e.planes && (i.spawn(c, l, e.planeCrossTime), (i.mesh.visible = !0));
        },
        scatter() {
          (n.scatter(), r.scatter());
        },
        setPrewarm(e) {
          ((u = e), e && h());
        },
      }
    );
  }
  return {
    createSky,
  };
}
