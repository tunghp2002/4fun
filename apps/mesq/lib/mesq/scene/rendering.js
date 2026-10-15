// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  Color,
  DataTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearSRGBColorSpace,
  MathUtils,
  MeshToonNodeMaterial,
  NearestFilter,
  RenderPipeline,
  RepeatWrapping,
  RGBAFormat,
  Vector2,
  Vector3,
  Vector4,
} from "three/webgpu";
import {
  abs,
  cameraFar,
  cameraNear,
  clamp,
  cos,
  diffuseColor,
  dot,
  emissive,
  float,
  floatBitsToUint,
  floor,
  Fn,
  fract,
  fwidth,
  If,
  length,
  luminance,
  max,
  min,
  mix,
  mrt,
  normalGeometry,
  normalize,
  normalView,
  output,
  packNormalToRGB,
  pass,
  perspectiveDepthToViewZ,
  positionGeometry,
  positionViewDirection,
  renderGroup,
  screenCoordinate,
  screenSize,
  screenUV,
  select,
  sin,
  smoothstep,
  sqrt,
  step,
  texture,
  time,
  uint,
  uniform,
  unpackRGBToNormal,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
export function createRenderingModule(scope, { paletteModule }) {
  const {
    paperWhite,
    eveningSkyTop,
    eveningSkyBottom,
    inkPurple,
    palette,
    IF,
  } = paletteModule;
  var JF = 256;
  function YF(e) {
    return () => {
      e = (e + 1831565813) | 0;
      let t = Math.imul(e ^ (e >>> 15), 1 | e);
      return (
        (t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t),
        ((t ^ (t >>> 14)) >>> 0) / 4294967296
      );
    };
  }
  var XF = (e) => e * e * e * (e * (e * 6 - 15) + 10);
  function ZF(e, t, n, r, i) {
    let a = new Float32Array(e * t);
    for (let e = 0; e < a.length; e++) a[e] = n();
    for (let n = 0; n < JF; n++) {
      let o = (n / JF) * t,
        s = Math.floor(o),
        c = XF(o - s),
        l = (s % t) * e,
        u = ((s + 1) % t) * e;
      for (let t = 0; t < JF; t++) {
        let o = (t / JF) * e,
          s = Math.floor(o),
          d = XF(o - s),
          f = s % e,
          p = (s + 1) % e,
          m = a[l + f] + (a[l + p] - a[l + f]) * d,
          h = a[u + f] + (a[u + p] - a[u + f]) * d;
        r[n * JF + t] += (m + (h - m) * c) * i;
      }
    }
  }
  function QF(e, t, n, r, i) {
    let a = new Float32Array(JF * JF),
      o = 1;
    for (let s = 0; s < n; s++) (ZF(e << s, t << s, i, a, o), (o *= r));
    return a;
  }
  function $F(e, t = 1) {
    let n = 1 / 0,
      r = -1 / 0;
    for (let t of e) ((n = Math.min(n, t)), (r = Math.max(r, t)));
    let i = 2048,
      a = new Uint32Array(i),
      o = (e) => Math.min(2047, Math.floor(((e - n) / (r - n || 1)) * i));
    for (let t of e) a[o(t)]++;
    let s = new Float32Array(i),
      c = 0;
    for (let t = 0; t < i; t++)
      ((s[t] = (c + a[t] * 0.5) / e.length), (c += a[t]));
    for (let n = 0; n < e.length; n++) e[n] = s[o(e[n])] * t;
    return e;
  }
  function eI(t, n) {
    let r = new DataTexture(t, JF, JF, RGBAFormat);
    return (
      (r.wrapS = r.wrapT = RepeatWrapping),
      (r.magFilter = LinearFilter),
      (r.minFilter = n ? LinearMipmapLinearFilter : LinearFilter),
      (r.generateMipmaps = n),
      (r.needsUpdate = !0),
      r
    );
  }
  var tI = (e) => Math.max(0, Math.min(255, Math.round(e * 255)));
  var nI = (e) =>
    Math.sqrt(-2 * Math.log(1 - e())) * Math.cos(2 * Math.PI * e());
  var rI = 0.17;
  var iI = null;
  function aI() {
    if (iI) return iI;
    let e = YF(1337),
      t = JF * JF,
      n = [new Float32Array(t), new Float32Array(t), new Float32Array(t)];
    for (let r of n) for (let n = 0; n < t; n++) r[n] = nI(e);
    let r = new Float32Array(t),
      i = n.map((e) => {
        for (let t = 0; t < JF; t++)
          for (let n = 0; n < JF; n++) {
            let i = t * JF;
            r[i + n] =
              (e[i + ((n + JF - 1) & 255)] +
                2 * e[i + n] +
                e[i + ((n + 1) & 255)]) *
              0.25;
          }
        let n = new Float32Array(t),
          i = 0;
        for (let t = 0; t < JF; t++) {
          let a = ((t + JF - 1) & 255) * JF,
            o = ((t + 1) & 255) * JF;
          for (let s = 0; s < JF; s++) {
            let c = t * JF + s,
              l = 0.65 * (r[a + s] + 2 * r[c] + r[o + s]) * 0.25 + 0.35 * e[c];
            ((n[c] = l), (i += l * l));
          }
        }
        let a = 1 / Math.sqrt(i / t);
        for (let e = 0; e < t; e++) n[e] *= a;
        return n;
      }),
      a = $F(QF(3, 3, 4, 0.5, e)),
      o = new Uint8Array(t * 4);
    for (let e = 0; e < t; e++)
      ((o[e * 4] = tI(0.5 + i[0][e] * rI)),
        (o[e * 4 + 1] = tI(0.5 + i[1][e] * rI)),
        (o[e * 4 + 2] = tI(0.5 + i[2][e] * rI)),
        (o[e * 4 + 3] = tI(a[e])));
    return ((iI = eI(o, !1)), (iI.name = `grain`), iI);
  }
  var oI = null;
  function sI() {
    if (oI) return oI;
    let e = YF(4242),
      t = JF * JF,
      n = $F(QF(4, 4, 4, 0.5, e)),
      r = $F(QF(6, 6, 5, 0.62, e), 0.985),
      i = $F(QF(24, 24, 2, 0.5, e)),
      a = $F(QF(2, 16, 3, 0.55, e)),
      o = new Uint8Array(t * 4);
    for (let e = 0; e < t; e++)
      ((o[e * 4] = tI(n[e])),
        (o[e * 4 + 1] = tI(r[e])),
        (o[e * 4 + 2] = tI(i[e])),
        (o[e * 4 + 3] = tI(a[e])));
    return ((oI = eI(o, !0)), (oI.anisotropy = 4), (oI.name = `surface`), oI);
  }
  var cI = window.matchMedia(`not all`);
  var lI = (e, t, n) => new Color().setRGB(e, t, n, LinearSRGBColorSpace);
  var uI = uniform(1).setGroup(renderGroup);
  var postEffects = {
    skyTop: uniform(new Color(eveningSkyTop)),
    skyBottom: uniform(new Color(eveningSkyBottom)),
    skyDots: uniform(0.16),
    skyDotSize: uniform(7.83),
    misprint: uniform(0.522),
    misprintOffset: uniform(new Vector2(0.39, -0.65)),
    ink: uniform(0),
    inkColor: uniform(new Color(inkPurple)),
    inkWidth: uniform(0.5),
    inkDepth: uniform(0.0354),
    inkCrease: uniform(0.01),
    halftone: uniform(0.315),
    halftoneSize: uniform(6.89),
    halftoneAngle: uniform(2.356),
    halftoneReach: uniform(0.484),
    halftoneTint: uniform(lI(0.42, 0.34, 0.75)),
    bloomStrength: uniform(0.228),
    bloomRadius: uniform(0.152),
    bloomThreshold: uniform(0.022),
    shadowLift: uniform(lI(0.025, 0, 0.05)),
    warmth: uniform(1),
    vignette: uniform(0),
    grain: uniform(0.0293),
    grainSize: uniform(0.25),
    grainColor: uniform(0.207),
    grainDrift: uniform(0),
    blotch: uniform(0),
    speed: uniform(0),
    speedDir: uniform(1),
    speedThreshold: uniform(0.18),
    speedLines: uniform(0.65),
    speedReach: uniform(0.6),
    speedWidth: uniform(14),
    speedFringe: uniform(0.8),
    speedOpacity: uniform(0.85),
    speedInk: uniform(0.35),
    speedRate: uniform(1500),
    speedSplit: uniform(4),
    speedStretch: uniform(0.9),
  };
  for (let e of Object.values(postEffects)) e.setGroup(renderGroup);
  var renderSettings = {
    bloomScale: 0.5,
    msaa: 4,
  };
  var pI = (e, t) =>
    vec2(
      e.x.mul(cos(t)).sub(e.y.mul(sin(t))),
      e.x.mul(sin(t)).add(e.y.mul(cos(t))),
    );
  var mI = uniform(new Vector2(1, 1));
  var hI = uniform(new Vector4(0, 0, 1, 0));
  var gI = uniform(new Vector4(0.65, 0.6, 30, 14));
  var _I = uniform(new Vector4(0, 0, 0.8, 0));
  var vI = uniform(new Vector3(1, 0, 1));
  var yI = uniform(1);
  var bI = (e) => {
    let t = fract(e.mul(vec4(0.1031, 0.103, 0.0973, 0.1099))).toVar();
    return (
      t.addAssign(dot(t, t.wzxy.add(33.33))),
      fract(t.xxyz.add(t.yzzw).mul(t.zywx))
    );
  };
  var xI = new Color(paperWhite);
  var SI = new Color(palette.pink);
  var CI = new Color(palette.cyan);
  var wI = (e) => vec3(e.r, e.g, e.b);
  var TI = Fn(({ input: e, threshold: t, smoothWidth: n }) => {
    let r = uv(),
      i = mI,
      a = e
        .sample(r.add(vec2(i.x, i.y)))
        .add(e.sample(r.add(vec2(i.x.negate(), i.y))))
        .add(e.sample(r.add(vec2(i.x, i.y.negate()))))
        .add(e.sample(r.sub(i)))
        .mul(0.25),
      o = select(
        floatBitsToUint(a.r.add(a.g).add(a.b).add(a.a))
          .bitAnd(uint(2139095040))
          .equal(uint(2139095040)),
        vec4(0),
        a.min(vec4(64)),
      );
    return mix(vec4(0), o, smoothstep(t, t.add(n), luminance(o.rgb)));
  });
  var EI = vec3(0.299, 0.587, 0.114);
  function DI(e, t, n, r) {
    let i = aI();
    return Fn(() => {
      let a = screenUV,
        o = vec2(1).div(screenSize),
        s = a.sub(0.5),
        c = s
          .mul(length(s))
          .mul(0.01)
          .add(o.mul(postEffects.misprintOffset).mul(uI))
          .mul(postEffects.misprint)
          .add(vec2(0, hI.y).mul(o).mul(uI)),
        l = e.sample(a.add(c)).r,
        u = e.sample(a).g,
        d = e.sample(a.sub(c)).b,
        f = vec3(l, u, d).toVar(),
        p = t.sample(a).r.toVar(),
        m = float(1).sub(step(0.99999, p));
      if (n) {
        let e = (e) => perspectiveDepthToViewZ(e, cameraNear, cameraFar),
          r = e(p).toVar(),
          i = unpackRGBToNormal(n.sample(a).rgb).toVar(),
          s = o.mul(uI).mul(postEffects.inkWidth),
          c = postEffects.inkDepth.max(1e-4),
          l = float(0).toVar();
        for (let o of [vec2(1, 0), vec2(-1, 0), vec2(0, 1), vec2(0, -1)]) {
          let u = a.add(o.mul(s)),
            d = abs(e(t.sample(u).r).sub(r)).div(abs(r).max(0.001)),
            f = unpackRGBToNormal(n.sample(u).rgb);
          (l.assign(max(l, smoothstep(c, c.mul(2.5), d))),
            l.assign(
              max(
                l,
                smoothstep(
                  postEffects.inkCrease,
                  postEffects.inkCrease.add(0.1),
                  float(1).sub(dot(f, i)),
                ),
              ),
            ));
        }
        f.assign(mix(f, postEffects.inkColor, l.mul(postEffects.ink)));
      }
      let h = dot(f, EI),
        g = screenCoordinate.xy,
        _ = fract(
          pI(g, postEffects.halftoneAngle).div(
            postEffects.halftoneSize.mul(uI),
          ),
        ).sub(0.5),
        v = float(1)
          .sub(smoothstep(0.03, postEffects.halftoneReach.max(0.031), h))
          .mul(0.5),
        y = vI,
        b = sqrt(
          _.x
            .mul(_.x)
            .mul(y.x)
            .add(_.x.mul(_.y).mul(y.y).mul(2))
            .add(_.y.mul(_.y).mul(y.z))
            .max(0),
        ),
        x = clamp(v.sub(b).div(0.07), 0, 1);
      (f.assign(
        mix(
          f,
          f.mul(postEffects.halftoneTint),
          x.mul(m).mul(postEffects.halftone),
        ),
      ),
        f.addAssign(r.rgb));
      let S = dot(f, EI);
      f.assign(
        f
          .add(postEffects.shadowLift.mul(float(1).sub(S)))
          .mul(
            mix(
              vec3(1),
              vec3(1.04, 1, 0.95),
              clamp(S, 0, 1).mul(postEffects.warmth),
            ),
          ),
      );
      let C = smoothstep(0.3, 0.95, length(s.mul(vec2(1.1, 1))));
      (f.mulAssign(float(1).sub(C.mul(postEffects.vignette))),
        If(hI.x.greaterThan(0), () => {
          let e = hI.x,
            t = g.div(uI),
            n = screenSize.x.div(uI),
            r = gI.z,
            i = step(n.mul(0.5), t.x),
            a = floor(mix(t.x, n.sub(t.x), i).div(r)),
            o = bI(vec4(a, i, a, i.add(7))),
            s = float(1).sub(a.add(0.5).mul(r).div(n.mul(0.5))),
            c = clamp(gI.y, 0.05, 0.95),
            l = smoothstep(c.oneMinus(), float(1).sub(c.mul(0.45)), s).toVar(),
            u = smoothstep(
              o.x,
              o.x.add(0.06),
              l.mul(gI.x).mul(mix(0.6, 1.2, e)),
            ),
            d = mix(240, 620, fract(o.z.mul(7.31).add(o.w))).toVar(),
            p = t.y
              .add(hI.w.mul(mix(0.75, 1.25, o.w)))
              .div(d)
              .toVar(),
            m = floor(p).toVar(),
            h = bI(vec4(a, m, i.mul(53).add(a), m)),
            _ = smoothstep(h.z, h.z.add(0.06), mix(0.45, 0.9, e)),
            v = u.mul(_).mul(abs(hI.z)).toVar();
          If(v.greaterThan(0), () => {
            let o = bI(vec4(m, a.add(0.5), i.add(3.1), m.mul(1.7).add(a))),
              s = bI(vec4(m.add(0.37), a, m.mul(0.61), i.add(a.mul(2.3)))),
              c = _I.z,
              u = c.add(3),
              g = mix(0.35, 0.8, h.x).mul(d),
              _ = g.mul(_I.w).mul(v).toVar(),
              y = d
                .sub(u)
                .sub(h.y.mul(d.sub(u.mul(2)).sub(g)))
                .toVar(),
              b = r.mul(0.5).sub(c).sub(float(0.5).div(uI)),
              x = gI.w
                .mul(0.5)
                .mul(mix(0.45, 1, s.x.mul(s.x)))
                .mul(mix(0.75, 1, l))
                .min(b),
              S = x
                .mul(mix(0.8, 1, e))
                .mul(mix(0.35, 1, v))
                .toVar(),
              C = a
                .add(0.5)
                .mul(r)
                .add(s.y.sub(0.5).mul(2).mul(b.sub(x).max(0))),
              w = mix(C, n.sub(C), i).toVar(),
              T = clamp(o.z.mul(1.6).sub(0.5), 0, 1).toVar(),
              E = mix(0.4, 4, o.x.mul(o.x)).toVar(),
              D = step(0.5, o.w).mul(2).sub(1),
              ee = step(0.5, fract(o.w.mul(2))),
              te = mix(mix(0.4, 4, o.y), E, ee).toVar(),
              O = mix(step(0.5, o.y).mul(2).sub(1), D, ee),
              ne = E.mul(E).add(1).inverseSqrt(),
              re = te.mul(te).add(1).inverseSqrt(),
              ie = clamp(_.sub(E.add(te).mul(S).mul(2)).div(6), 0, 1).toVar(),
              ae = step(0, hI.z),
              oe = fract(p).mul(d).toVar(),
              se = (e) => {
                let n = t.x.sub(e.x).sub(w),
                  r = oe.sub(e.y),
                  i = mix(r, d.sub(r), ae),
                  a = S.mul(
                    float(1).sub(
                      T.mul(clamp(y.sub(i).div(_.max(0.001)), 0, 1)),
                    ),
                  );
                return clamp(
                  min(
                    a.sub(abs(n)),
                    min(
                      y
                        .sub(E.mul(S.add(D.mul(n))))
                        .sub(i)
                        .mul(ne),
                      i
                        .sub(y.sub(_))
                        .sub(te.mul(S.sub(O.mul(n))))
                        .mul(re),
                    ),
                  )
                    .mul(uI)
                    .add(0.5),
                  0,
                  1,
                )
                  .min(a.mul(uI).mul(2))
                  .min(ie);
              },
              ce = se(_I.xy).toVar(),
              le = se(_I.xy.negate()).toVar(),
              ue = postEffects.speedOpacity,
              de = mix(f, wI(xI), vec3(ce, le, max(ce, le)).mul(ue)).toVar(),
              fe = step(h.w, postEffects.speedInk)
                .mul(step(s.x, 0.6))
                .mul(yI)
                .toVar();
            (If(fe.greaterThan(0), () => {
              let e = se(vec2(0)).toVar(),
                t = e.oneMinus().mul(ue),
                n = mix(
                  mix(mix(f, wI(SI), ce.mul(t)), wI(CI), le.mul(t)),
                  postEffects.inkColor,
                  e.mul(ue),
                );
              de.assign(mix(de, n, fe));
            }),
              f.assign(de));
          });
        }));
      let w = texture(i, g.div(uI.mul(900)))
        .a.sub(0.5)
        .mul(2)
        .mul(postEffects.blotch);
      f.mulAssign(w.add(1));
      let T = g
          .div(uI.mul(postEffects.grainSize))
          .add(time.mul(postEffects.grainDrift).mul(vec2(0.6, 0.8))),
        E = texture(i, T.div(256)).rgb,
        D = texture(i, pI(T, float(1.1)).div(435.2).add(0.5)).rgb,
        ee = E.sub(0.5)
          .mul(0.8 / rI)
          .add(D.sub(0.5).mul(0.6 / rI)),
        te = ee.yz.mul(postEffects.grainColor),
        O = vec3(
          ee.x.add(te.x),
          ee.x.sub(te.x.add(te.y).mul(0.5)),
          ee.x.add(te.y),
        ),
        ne = sqrt(clamp(dot(f, EI), 0, 1)),
        re = ne.mul(ne.oneMinus()).mul(4);
      return (
        f.addAssign(O.mul(postEffects.grain.mul(re).mul(ne).mul(2))),
        vec4(max(f, vec3(0)), 1)
      );
    })();
  }
  function OI(e, t, n) {
    let disposed = false;
    let r = new RenderPipeline(e),
      i = {},
      a = new Vector2(),
      o;
    function s(e) {
      let r = pass(t, n, {
        samples: renderSettings.msaa,
        storeMultisampledColorBuffer: !1,
      });
      r.setMRT(
        mrt(
          e
            ? {
                output: output,
                emissive: emissive,
                normal: packNormalToRGB(normalView),
              }
            : {
                output: output,
                emissive: emissive,
              },
        ),
      );
      let i = r.getTextureNode(`output`),
        a = r.getTextureNode(`depth`),
        o = e ? r.getTextureNode(`normal`) : null,
        s = bloom(
          r.getTextureNode(`emissive`),
          postEffects.bloomStrength,
          postEffects.bloomRadius,
          postEffects.bloomThreshold,
        );
      return (
        (s.highPassFn = TI),
        {
          ink: e,
          scenePass: r,
          glow: s,
          output: DI(i, a, o, s),
        }
      );
    }
    function c(e) {
      let t = e ? (i.ink ??= s(!0)) : (i.flat ??= s(!1));
      ((o = t), (r.outputNode = t.output), (r.needsUpdate = !0));
    }
    c(postEffects.ink.value > 0);
    let l = window.matchMedia?.(`(pointer: coarse)`),
      u = -1,
      d = 1;
    function f(e) {
      let t = performance.now(),
        n = u < 0 ? 0 : MathUtils.clamp((t - u) / 1e3, 0, 0.1);
      u = t;
      let r = postEffects.speed.value,
        i = cI?.matches || !Number.isFinite(r) ? 0 : MathUtils.clamp(r, 0, 1),
        a = MathUtils.clamp(postEffects.speedThreshold.value, 0, 0.95),
        o = MathUtils.smoothstep(i, a, 1),
        s = postEffects.speedDir.value < 0 ? -1 : 1;
      d += (s - d) * (1 - Math.exp(-n / 0.12));
      let c = hI.value;
      ((c.w += n * i * d * postEffects.speedRate.value),
        (!Number.isFinite(c.w) || (o === 0 && Math.abs(c.w) > 1e5)) &&
          (c.w = 0),
        (c.x = o),
        (c.y =
          0.5 *
          postEffects.speedSplit.value *
          MathUtils.smoothstep(i, a * 0.75, 1) *
          d),
        (c.z = d));
      let f = MathUtils.clamp((1e3 - e) / 600, 0, 1),
        p = l?.matches ? f : 0,
        m = MathUtils.clamp(e / 48, 18, 30),
        h =
          MathUtils.clamp(postEffects.speedWidth.value, 0, 24) *
          (1 - 0.15 * (f - p) + 0.15 * p),
        g = MathUtils.clamp(
          postEffects.speedReach.value * (1 + 0.12 * p),
          0.05,
          0.95,
        );
      gI.value.set(postEffects.speedLines.value * (1 + 0.35 * f), g, m, h);
      let _ = MathUtils.clamp(postEffects.speedFringe.value, 0, 4),
        v = _ * (0.6 + 0.4 * o);
      _I.value.set(v, -0.6 * v * d, _, o ** 0.6);
      let y = Math.max(0.05, 1 + postEffects.speedStretch.value * o),
        b = 1 / y,
        x = Math.cos(postEffects.halftoneAngle.value),
        S = Math.sin(postEffects.halftoneAngle.value);
      vI.value.set(
        x * x * y + S * S * b,
        x * S * (y - b),
        S * S * y + x * x * b,
      );
      let C = postEffects.skyTop.value,
        w = postEffects.skyBottom.value,
        T =
          0.5 *
          (0.299 * (C.r + w.r) + 0.587 * (C.g + w.g) + 0.114 * (C.b + w.b));
      yI.value = MathUtils.smoothstep(T, 0.06, 0.2);
    }
    function p() {
      (e.getDrawingBufferSize(a),
        f(a.x / Math.max(uI.value, 0.25)),
        postEffects.ink.value > 0 !== o.ink && c(postEffects.ink.value > 0));
      let t = renderSettings.msaa;
      (o.scenePass.options.samples !== t &&
        ((o.scenePass.options.samples = t),
        (o.scenePass.renderTarget.samples = t),
        (r.needsUpdate = !0)),
        mI.value.set(1 / Math.max(1, a.x), 1 / Math.max(1, a.y)),
        o.glow.setResolutionScale(
          Math.min(1, renderSettings.bloomScale / Math.max(uI.value, 0.25)),
        ),
        r.render());
    }
    return {
      pipeline: r,
      render: p,
      get inkEnabled() {
        return o.ink;
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        for (const branch of Object.values(i)) {
          branch.glow.dispose();
          branch.scenePass.dispose();
        }
        r.dispose();
      },
    };
  }
  var kI = {
    shadow: 0.23,
    mid: 0.505,
    lit: 0.668,
  };
  var AI = {
    shadow: 0.44,
    mid: 0.62,
    lit: 0.62,
  };
  function jI() {
    let e = new DataTexture(
      new Uint16Array(16),
      4,
      1,
      RGBAFormat,
      HalfFloatType,
    );
    return (
      (e.minFilter = e.magFilter = NearestFilter),
      (e.generateMipmaps = !1),
      e
    );
  }
  var MI = jI();
  var NI = jI();
  var PI = {
    ...kI,
  };
  var FI = {
    ...AI,
  };
  function II(e, { shadow: t, mid: n, lit: r }) {
    let i = e.image.data;
    ([t, t, n, r].forEach((e, t) => {
      let n = DataUtils.toHalfFloat(Math.max(0, e));
      i.set([n, n, n, DataUtils.toHalfFloat(1)], t * 4);
    }),
      (e.needsUpdate = !0));
  }
  function LI() {
    (II(MI, PI), II(NI, FI));
  }
  LI();
  var RI = {
    color: uniform(new Color(IF)),
    strength: uniform(0.13),
    width: uniform(0.511),
    side: uniform(-1),
    level: uniform(1),
  };
  var zI = (() => {
    let e = clamp(dot(normalView, positionViewDirection), 0, 1).oneMinus(),
      t = dot(normalView, normalize(vec3(0.85, 0.3, 0.1))),
      n = smoothstep(RI.width, RI.width.add(0.04), e).mul(
        smoothstep(RI.side, RI.side.add(0.1), t),
      );
    return RI.color.mul(n).mul(RI.strength.mul(RI.level));
  })();
  var BI = {
    mottle: uniform(0.054),
    chips: uniform(0.087),
    chipColor: uniform(new Color(`#ffffff`)),
    hatch: uniform(0.424),
    hatchStart: uniform(0.452),
    hatchSpacing: uniform(5.39),
    hatchAngle: uniform(0.854),
    hatchTint: uniform(
      new Color().setRGB(0.36, 0.3, 0.62, LinearSRGBColorSpace),
    ),
    scale: uniform(0.943),
  };
  var VI = {
    enabled: !0,
  };
  var HI = {
    level: uniform(1),
  };
  for (let e of [...Object.values(RI), ...Object.values(BI), HI.level])
    e.setGroup(renderGroup);
  var UI = vec3(0.2126, 0.7152, 0.0722);
  var WI = 0.14;
  function GI() {
    let e = sI(),
      t = positionGeometry.mul(BI.scale),
      n = abs(normalGeometry),
      r = n.mul(n).mul(n).mul(n),
      i = r.div(max(r.x.add(r.y).add(r.z), 1e-5));
    return texture(e, t.yz)
      .mul(i.x)
      .add(texture(e, t.zx.add(vec2(0.37, 0.61))).mul(i.y))
      .add(texture(e, t.xy.add(vec2(0.73, 0.19))).mul(i.z));
  }
  function KI(e, t) {
    return Fn((n) => {
      let r = output.rgb;
      if (!e) return vec4(r.add(zI), output.a);
      let i = GI().toVar(),
        a = mix(i.r, i.a, 0.35).sub(0.5).mul(2),
        o = r.mul(a.mul(BI.mottle).add(1)).toVar(),
        s = diffuseColor.rgb,
        c = max(dot(s, UI), 0.001),
        l = n.material;
      if (t && !l.map && !l.colorNode) {
        let e = float(1).sub(BI.chips.mul(0.12)),
          t = max(fwidth(i.g), 0.001),
          n = smoothstep(0.55, 0.8, c)
            .oneMinus()
            .mul(clamp(BI.chips.mul(50), 0, 1)),
          a = smoothstep(e.sub(t), e.add(t), i.g).mul(n),
          l = smoothstep(e.sub(0.03).sub(t), e.sub(0.03).add(t), i.g)
            .mul(n)
            .sub(a),
          u = r.div(max(s, vec3(0.03)));
        o.assign(mix(o.mul(l.mul(0.28).oneMinus()), u.mul(BI.chipColor), a));
      }
      let u = dot(r, UI).div(c.mul(HI.level)),
        d = smoothstep(BI.hatchStart.sub(WI), BI.hatchStart, u).oneMinus(),
        f = BI.hatchSpacing.mul(uI),
        p = abs(
          fract(
            dot(
              screenCoordinate.xy,
              vec2(sin(BI.hatchAngle).negate(), cos(BI.hatchAngle)),
            ).div(f),
          ).sub(0.5),
        ).mul(f),
        m = d.mul(f).mul(0.2).mul(i.b.mul(0.7).add(0.65)),
        h = clamp(m.add(0.5).sub(p), 0, 1).mul(clamp(m.mul(2), 0, 1));
      return (
        o.assign(mix(o, o.mul(BI.hatchTint), h.mul(BI.hatch))),
        vec4(o.add(zI), output.a)
      );
    })();
  }
  var qI = {
    wear: KI(!0, !0),
    clean: KI(!0, !1),
    plain: KI(!1, !1),
  };
  var JI = new Map();
  var YI = (e) => (VI.enabled ? (e ? qI.wear : qI.clean) : qI.plain);
  function createToonMaterial(e = {}, t = {}) {
    let n = t.wear ?? !0,
      r = new MeshToonNodeMaterial({
        gradientMap: t.creature ? NI : MI,
        ...e,
      });
    return (
      (r.outputNode = YI(n)),
      JI.set(r, n),
      scope.listen(r, `dispose`, () => JI.delete(r)),
      r
    );
  }
  var ZI = {
    master: 0.7,
    ambience: 0.7,
    sfx: 0.7,
    helper: 0.7,
    birds: 0.7,
    ui: 0.7,
    scroll: 0.7,
    reverb: 0.7,
  };
  var QI = 0.7;
  var $I = (e) => (Number.isFinite(e) ? Math.max(0, Math.min(1.5, e)) / QI : 1);
  var eL = 0.8;
  function tL() {
    if (typeof window > `u`) return null;
    let e = window.AudioContext;
    return typeof e == `function` &&
      typeof e.prototype?.createStereoPanner == `function`
      ? e
      : null;
  }
  scope.defer(() => {
    for (const texture of new Set([iI, oI, MI, NI])) texture?.dispose();
    JI.clear();
  });
  return {
    cI,
    uI,
    postEffects,
    renderSettings,
    OI,
    PI,
    RI,
    HI,
    createToonMaterial,
    ZI,
    $I,
    eL,
    tL,
  };
}
