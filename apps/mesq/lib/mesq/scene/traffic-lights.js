// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Matrix3,
  Matrix4,
  Mesh,
  MeshBasicNodeMaterial,
  Shape,
  ShapeGeometry,
  TorusGeometry,
  Vector3,
  Vector4,
} from "three/webgpu";
import {
  attribute,
  float,
  mix,
  positionLocal,
  sin,
  step,
  time,
  uniform,
} from "three/tsl";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export function createTrafficLightsModule(
  scope,
  { paletteModule, audioModule, ledPixelsModule, stickersModule },
) {
  const { amber, shadowPurple, paleBlue, palette } = paletteModule;
  const {
    oL,
    sL,
    cL,
    lL,
    uL,
    dL,
    pL,
    hL,
    gL,
    xL,
    SynthVoice,
    SoundLimiter,
    DL,
    OL,
  } = audioModule;
  const { aV, vV } = ledPixelsModule;
  const { Z, createPart, $, bH, xH, SH, TH, AH, VH, WH } = stickersModule;
  var TW = 60 / 100;
  var EW = TW / 4;
  var DW = 16;
  var OW = 0.3;
  var kW = 0.35;
  var AW = 0.16;
  var jW = 0.6;
  var MW = (e) => 440 * 2 ** ((e - 69) / 12);
  var NW = [48, 45, 41, 43];
  var PW = [
    [64, 67, 71],
    [60, 64, 67],
    [57, 60, 64],
    [59, 62, 64],
  ];
  var FW = [
    [
      [
        [4, 72, 2, `chu`],
        [6, 76, 6, `oo`],
      ],
      [],
    ],
    [[], []],
    [
      [],
      [
        [4, 76, 2, `chu`],
        [6, 74, 6, `oo`],
      ],
    ],
    [[[10, 74, 4, `wee`]], []],
    [
      [
        [2, 76, 2, `chu`],
        [4, 79, 4, `oo`],
      ],
      [
        [10, 76, 2, `chu`],
        [12, 72, 4, `oo`],
      ],
    ],
    [
      [
        [2, 72, 2, `chu`],
        [4, 76, 4, `oo`],
      ],
      [
        [10, 74, 2, `chu`],
        [12, 69, 4, `oo`],
      ],
    ],
    [
      [
        [2, 69, 2, `chu`],
        [4, 72, 4, `wee`],
      ],
      [
        [10, 76, 2, `chu`],
        [12, 74, 4, `oo`],
      ],
    ],
    [
      [
        [2, 74, 2, `chu`],
        [4, 76, 4, `oo`],
      ],
      [[12, 67, 4, `wee`]],
    ],
  ];
  var IW = [
    [0, 72, 2, `chu`],
    [2, 74, 2, `chu`],
    [4, 76, 2, `chu`],
    [6, 79, 4, `oo`],
    [10, 76, 2, `chu`],
    [12, 81, 4, `wee`],
  ];
  var LW = 16;
  var RW = (e) => e % 4 == 0;
  var zW = (e) => e === 4 || e === 12;
  var BW = (e) => e % 4 == 2;
  var VW = null;
  var HW = 0;
  var UW = -1e9;
  var WW = 0;
  var GW = new Float32Array(256);
  function KW(e, t) {
    for (let n of e) if (t >= n[0] && t < n[0] + n[2]) return n;
    return null;
  }
  function qW(e, t) {
    let n = e * 4,
      r = ((Math.floor(n) % DW) + DW) % DW,
      i = ((Math.floor(n / DW) % 8) + 8) % 8,
      a = n - Math.floor(n),
      o = Math.exp(-(e - Math.floor(e)) * 5),
      s = Math.exp(-(n / 2 - Math.floor(n / 2)) * 3) * (r % 4 == 2 ? 0.8 : 1),
      c = FW[i],
      l = n >= UW && n < UW + LW ? 0.9 : KW(c[0], r) || KW(c[1], r) ? 0.6 : 0,
      u = BW(r) ? Math.exp(-a * 4) : 0,
      d = t.length;
    for (let e = 0; e < d; e++) {
      let n = d > 1 ? e / (d - 1) : 0,
        r = Math.max(0, 1 - n * 2.4) * (0.55 * o + 0.4 * s),
        i = Math.max(0, 1 - Math.abs(n - 0.45) * 3) * 0.42,
        a = Math.max(0, 1 - Math.abs(n - 0.72) * 3.2) * l * 0.75,
        c = Math.max(0, n * 2.2 - 1.2) * u * 0.7;
      t[e] = pL(0.08 + r + i * (0.75 + 0.25 * o) + a + c, 0, 1);
    }
    return t;
  }
  function JW(e) {
    if (e >= UW && e < UW + LW) {
      let t = e - UW;
      for (let e of IW) if (e[0] === t && (t === 0 || e[3] !== `chu`)) return 4;
      return 0;
    }
    let t = ((e % DW) + DW) % DW,
      n = ((Math.floor(e / DW) % 8) + 8) % 8,
      r = 0;
    for (let e = 0; e < 2; e++)
      for (let i of FW[n][e]) i[0] === t && i[3] !== `chu` && (r |= 1 << e);
    return r;
  }
  function YW(e) {
    let t = e.ctx,
      n = [],
      r = [],
      i = (e, r) => {
        let i = t.createGain();
        return ((i.gain.value = e), r && hL(i, r), n.push(i), i);
      },
      a = (e, r, i, a) => {
        let o = t.createBiquadFilter();
        return (
          (o.type = e),
          (o.frequency.value = r),
          (o.Q.value = i),
          o.connect(a),
          n.push(o),
          o
        );
      },
      o = (e, r) => {
        let i = t.createStereoPanner();
        return ((i.pan.value = e), i.connect(r), n.push(i), i);
      },
      s = (e, i) => {
        let a = t.createOscillator();
        return ((a.type = e), (a.frequency.value = i), r.push(a), n.push(a), a);
      },
      c = (e, i) => {
        let a = t.createBufferSource();
        return (
          (a.buffer = e),
          (a.loop = !0),
          (a.playbackRate.value = i),
          r.push(a),
          n.push(a),
          a
        );
      },
      l = i(0, e.birds),
      u = i(1, l),
      d = i(1, u);
    d.connect(i(0.16, e.verb));
    let f = o(-0.12, d),
      p = i(0, f),
      m = s(`sine`, 60);
    m.connect(p);
    let h = i(0, o(0.08, f));
    c(e.white, 1).connect(a(`bandpass`, 1400, 0.8, h));
    let g = i(0, o(-0.2, f));
    c(e.white, 0.97).connect(
      a(`highpass`, 5200, 0.7, a(`lowpass`, 9e3, 0.5, g)),
    );
    let _ = i(0, a(`lowpass`, 760, 0.9, f)),
      v = s(`triangle`, MW(NW[0]));
    v.connect(_);
    let y = i(0, a(`lowpass`, 1150, 0.5, o(0.15, f))),
      b = PW[0].map((e, t) => {
        let n = s(`triangle`, MW(e));
        return ((n.detune.value = (t - 1) * 4), n.connect(y), n);
      }),
      x = (e) => {
        let t = o(e, d),
          n = i(0, a(`lowpass`, 1800, 0.5, t)),
          r = s(`sine`, 523);
        r.connect(n);
        let c = s(`sine`, uL(4.8, 5.6)),
          l = i(0, r.frequency);
        return (
          c.connect(l),
          {
            car: r,
            depth: l,
            env: n,
            pan: t,
          }
        );
      },
      S = [x(-0.35), x(0.3)],
      C = x(WW),
      w = t.createAnalyser();
    ((w.fftSize = GW.length), e.helper.connect(w), n.push(w));
    let T = t.currentTime + gL;
    for (let e of r)
      e instanceof AudioBufferSourceNode
        ? e.start(T, Math.random() * 1.5)
        : e.start(T);
    return {
      e,
      ctx: t,
      t0: 0,
      next: 0,
      out: d,
      duck: u,
      level: l,
      kick: {
        osc: m,
        env: p,
      },
      clap: h,
      shake: g,
      bass: {
        osc: v,
        env: _,
      },
      pad: {
        oscs: b,
        env: y,
      },
      birds: S,
      solo: C,
      tap: w,
      srcs: r,
      nodes: n,
      sentLevel: -1,
      sentDuck: 1,
      duckHold: 0,
      ending: -1,
    };
  }
  function XW(e, t, n, r) {
    let i = MW(n[1]) * dL(1, 0.004),
      a = n[2] * EW * 0.9,
      o = e.car.frequency;
    n[3] === `wee`
      ? (o.setValueAtTime(i * 0.94, t),
        o.exponentialRampToValueAtTime(i, t + Math.min(0.18, a * 0.6)))
      : (o.setValueAtTime(i * 0.97, t),
        o.exponentialRampToValueAtTime(i, t + 0.05));
    let s = e.depth.gain;
    (s.setValueAtTime(0, t),
      n[3] === `oo` &&
        (s.setValueAtTime(0, t + 0.15),
        s.linearRampToValueAtTime(i * 0.008, t + 0.45)));
    let c = e.env.gain,
      l = 0.015 * r;
    (c.setTargetAtTime(l, t, 0.03),
      c.setTargetAtTime(l * 0.7, t + 0.1, a * 0.6),
      c.setTargetAtTime(0, t + a, 0.06));
  }
  function ZW(e, t, n) {
    let r = t % DW,
      i = Math.floor(t / DW) % 8,
      a = i % 4;
    if (
      (RW(r) &&
        (lL(e.kick.osc.frequency, n, 150, 48, 0.09),
        sL(e.kick.env.gain, n, 0.14, 0.003, 0.17)),
      zW(r))
    ) {
      let t = e.clap.gain;
      t.setValueAtTime(0, n);
      for (let e = 0; e < 3; e++)
        (t.linearRampToValueAtTime(0.11, n + e * 0.011 + 0.002),
          t.linearRampToValueAtTime(0.03, n + e * 0.011 + 0.009));
      (t.exponentialRampToValueAtTime(oL, n + 0.14),
        t.setValueAtTime(0, n + 0.14));
    }
    if (
      ((BW(r) || (r === 15 && i % 2 == 1)) &&
        sL(e.shake.gain, n, r === 15 ? 0.05 : 0.09, 0.004, 0.05),
      r % 2 == 0)
    ) {
      let t = NW[a] + (r % 4 == 2 ? 12 : 0);
      (e.bass.osc.frequency.setValueAtTime(MW(t), n),
        sL(e.bass.env.gain, n, r % 4 == 2 ? 0.075 : 0.1, 0.005, 0.22));
    }
    if (r === 0) {
      let t = e.pad.env.gain;
      (PW[a].forEach((t, r) =>
        e.pad.oscs[r].frequency.setTargetAtTime(MW(t), n, 0.02),
      ),
        t.setValueAtTime(0.012, n),
        t.linearRampToValueAtTime(0.03, n + 0.2));
      for (let e = 1; e < 4; e++)
        (t.setValueAtTime(0.03, n + e * TW),
          t.linearRampToValueAtTime(0.017, n + e * TW + 0.012),
          t.linearRampToValueAtTime(0.03, n + e * TW + 0.25));
      t.linearRampToValueAtTime(0.012, n + 4 * TW - 0.02);
    }
    if (t >= UW && t < UW + LW) {
      t === UW && e.solo.pan.pan.setValueAtTime(pL(WW, -1, 1), n);
      for (let r of IW) r[0] === t - UW && XW(e.solo, n, r, 1.2);
      return;
    }
    let o = FW[i];
    for (let t = 0; t < 2; t++)
      for (let i of o[t]) i[0] === r && XW(e.birds[t], n, i, 1);
  }
  function QW(e) {
    if (e.ending > 0) return;
    let t = e.ctx.currentTime,
      n = e.level.gain;
    (n.cancelScheduledValues(t),
      n.setValueAtTime(n.value, t),
      n.linearRampToValueAtTime(0, t + 0.12),
      (e.ending = t + 0.16));
    let r = e.srcs.length,
      i = () => {
        if (!(--r > 0)) for (let t of e.nodes) t.disconnect();
      };
    for (let t of e.srcs) ((t.onended = i), t.stop(e.ending));
    try {
      e.e.helper.disconnect(e.tap);
    } catch {}
  }
  function $W(e) {
    let t = YW(e),
      n = e.ctx.outputLatency || 0;
    return (
      (t.t0 = e.ctx.currentTime - n - HW * TW),
      (t.next = Math.ceil((e.ctx.currentTime + gL - t.t0) / EW)),
      t
    );
  }
  var eG = {
    popper: new SoundLimiter(0.3, 2, 2),
  };
  var tG = {
    update(e, t) {
      let n = OL();
      try {
        (VW &&
          (!n || VW.e !== n || VW.ending > 0 || t <= 0.001) &&
          (QW(VW), (VW = null)),
          !VW && n && t > 0.02 && (VW = $W(n)));
      } catch (e) {
        (DL(e), (VW = null));
      }
      let r = VW;
      if (!r) return ((HW += Math.min(e, 0.1) / TW), HW);
      try {
        let n = r.ctx.currentTime,
          i = (n - (r.ctx.outputLatency || 0) - r.t0) / TW,
          a = HW + Math.min(e, 0.1) / TW,
          o = i - a;
        HW =
          Math.abs(o) > 0.25
            ? Math.max(HW, i)
            : Math.max(
                HW + (0.3 * Math.min(e, 0.1)) / TW,
                a + o * (1 - Math.exp(-e * 7)),
              );
        for (let e = 0; e < 64; e++) {
          let e = r.t0 + r.next * EW;
          if (e > n + AW) break;
          (e >= n + 0.004 && ZW(r, r.next, e), r.next++);
        }
        r.tap.getFloatTimeDomainData(GW);
        let s = 0;
        for (let e = 0; e < GW.length; e++) s = Math.max(s, Math.abs(GW[e]));
        r.duckHold = s > 0.004 ? 0.35 : Math.max(0, r.duckHold - e);
        let c = r.duckHold > 0 ? kW : 1;
        c !== r.sentDuck &&
          ((r.sentDuck = c),
          r.duck.gain.setTargetAtTime(c, n, c < 1 ? 0.03 : 0.3));
        let l = OW * pL(t, 0, 1);
        Math.abs(l - r.sentLevel) > r.sentLevel * 0.02 + 1e-4 &&
          ((r.sentLevel = l), r.level.gain.setTargetAtTime(l, n, 0.35));
      } catch (e) {
        (DL(e), QW(r), (VW = null));
      }
      return HW;
    },
    stop() {
      if (VW) {
        try {
          QW(VW);
        } catch (e) {
          DL(e);
        }
        VW = null;
      }
    },
    get beat() {
      return HW;
    },
    solo(e = 0) {
      let t = Math.max(Math.ceil(HW * 4 + 0.6), VW ? VW.next : -1e9),
        n = t + (t % 2);
      return n < UW + LW
        ? UW / 4
        : ((UW = n), (WW = Number.isFinite(e) ? e : 0), n / 4);
    },
    get soloFrom() {
      return UW / 4;
    },
    soloBeats: LW / 4,
    popper(e = 0, t = 1) {
      try {
        let n = OL();
        if (!n || t <= 0.01 || !eG.popper.take(n.ctx.currentTime) || !xL(1))
          return;
        let r = new SynthVoice(
            n.ctx,
            n.birds,
            n.verb,
            pL(t, 0, 1) * jW,
            e,
            0.12,
          ),
          i = r.osc(`sine`, 220),
          a = r.gain(0);
        (r.chain(i, a, r.out),
          lL(i.frequency, r.t, 240, 85, 0.07),
          sL(a.gain, r.t, 0.09, 0.006, 0.09));
        let o = r.noise(n.white),
          s = r.gain(0);
        (r.chain(
          o,
          r.filter(`bandpass`, 1500, 0.8),
          r.filter(`lowpass`, 3500, 0.5),
          s,
          r.out,
        ),
          sL(s.gain, r.t, 0.12, 0.006, 0.06));
        let c = r.noise(n.white, 1.3),
          l = r.gain(0);
        (r.chain(c, r.filter(`bandpass`, 4200, 0.7), l, r.out),
          cL(l.gain, r.t + 0.03, 0.05, 0.04, 0.42),
          r.play(0.55));
      } catch (e) {
        DL(e);
      }
    },
  };
  var nG = {
    strength: uniform(1.6),
    night: uniform(0),
    twinkle: uniform(0.3),
    levels: uniform(new Vector4(1, 0, 0, 1)),
  };
  var rG = null;
  function iG() {
    if (rG) return rG;
    let e = attribute(`lamp`, `float`),
      t = attribute(`anchor`, `vec3`),
      n = attribute(`tint`, `vec3`),
      r = nG.levels,
      i = step(0.5, e),
      a = step(1.5, e),
      o = step(2.5, e),
      s = r.x
        .mul(i.oneMinus())
        .add(r.y.mul(i.sub(a)))
        .add(r.z.mul(a.sub(o)))
        .add(r.w.mul(o)),
      c = sin(time.mul(5.3).add(t.x.mul(17)).add(t.y.mul(11)))
        .mul(0.5)
        .add(0.5),
      l = s.mul(nG.night).mul(float(1).sub(nG.twinkle.mul(c))),
      u = new MeshBasicNodeMaterial();
    return (
      (u.name = `glow-ticks`),
      (u.positionNode = mix(t, positionLocal, l)),
      (u.colorNode = n.mul(nG.strength)),
      (u.emissiveNode = n.mul(nG.strength).mul(l)),
      (rG = u),
      u
    );
  }
  var GlowGeometryBuilder = class {
    root;
    pos = [];
    nor = [];
    anchor = [];
    tint = [];
    lamp = [];
    index = [];
    m = new Matrix4();
    nm = new Matrix3();
    c = new Color();
    v = new Vector3();
    constructor(e) {
      this.root = e;
    }
    from(e) {
      return (WH(e, this.root, this.m), this.nm.getNormalMatrix(this.m), this);
    }
    dash(e, t, n, r, i, a, o, s) {
      let c = Math.cos(r),
        l = Math.sin(r),
        u = -l * (a / 2),
        d = (a / 2) * c,
        f = this.pos.length / 3;
      this.c.set(o);
      let p = [
        [e - u, t - d],
        [e + c * i - u, t + l * i - d],
        [e + c * i + u, t + l * i + d],
        [e + u, t + d],
      ];
      this.v.set(e, t, n).applyMatrix4(this.m);
      let m = this.v.x,
        h = this.v.y,
        g = this.v.z;
      for (let [e, t] of p)
        (this.v.set(e, t, n).applyMatrix4(this.m),
          this.pos.push(this.v.x, this.v.y, this.v.z),
          this.v.set(0, 0, 1).applyMatrix3(this.nm).normalize(),
          this.nor.push(this.v.x, this.v.y, this.v.z),
          this.anchor.push(m, h, g),
          this.tint.push(this.c.r, this.c.g, this.c.b),
          this.lamp.push(s));
      this.index.push(f, f + 1, f + 2, f, f + 2, f + 3);
    }
    burst(e, t, n, r, i, a, o, s = 0.075, c = 0.022) {
      for (let l of i)
        this.dash(e + Math.cos(l) * r, t + Math.sin(l) * r, n, l, s, c, a, o);
    }
    rect(e, t, n, r, i, a = 3, o = 0.05) {
      let s = e / 2 + o,
        c = t / 2 + o,
        l = 0.08,
        u = 0.022;
      if (i.top)
        for (let t of [-1, 0, 1])
          this.dash(t * e * 0.28, c, n, Math.PI / 2 - t * 0.3, l, u, r, a);
      if (i.bottom)
        for (let t of [-1, 0, 1])
          this.dash(t * e * 0.28, -c, n, -Math.PI / 2 + t * 0.3, l, u, r, a);
      let d = t > 1.2,
        f = d ? [-1, 0, 1] : [-1, 1],
        p = d ? 0.3 : 0.22;
      if (i.left)
        for (let e of f)
          this.dash(-s, e * t * p, n, Math.PI - e * 0.3, l, u, r, a);
      if (i.right)
        for (let e of f) this.dash(s, e * t * p, n, e * 0.3, l, u, r, a);
      for (let s of [-1, 1])
        for (let c of [-1, 1])
          (s < 0 ? i.left : i.right) &&
            (c < 0 ? i.bottom : i.top) &&
            this.dash(
              s * (e / 2 + o * 0.6),
              c * (t / 2 + o * 0.6),
              n,
              Math.atan2(c, s),
              l,
              u,
              r,
              a,
            );
    }
    build(e) {
      if (!this.index.length) return null;
      let t = new BufferGeometry();
      (t.setAttribute(`position`, new Float32BufferAttribute(this.pos, 3)),
        t.setAttribute(`normal`, new Float32BufferAttribute(this.nor, 3)),
        t.setAttribute(`anchor`, new Float32BufferAttribute(this.anchor, 3)),
        t.setAttribute(`tint`, new Float32BufferAttribute(this.tint, 3)),
        t.setAttribute(`lamp`, new Float32BufferAttribute(this.lamp, 1)),
        t.setIndex(this.index));
      let n = new Mesh(t, iG());
      return (
        (n.name = e),
        (n.visible = !1),
        (n.userData.noExport = !0),
        this.root.add(n),
        n
      );
    }
  };
  var oG = Z(1, 0, 0);
  var sG = Z(0, 1, 0);
  var cG = Z(0, 0, 1);
  var lG = Z(-1, 0, 0);
  var uG = Z(0, 0, -1);
  var dG = Math.PI / 180;
  var fG = paleBlue;
  function pG(e, t) {
    let n = new Group();
    ((n.name = `Housing`), e.add(n));
    let { w: r, h: i, d: a } = t,
      o = t.r ?? MathUtils.clamp(Math.min(r, i, a) * 0.18, 0.06, 0.1),
      s = a / 2;
    createPart(new RoundedBoxGeometry(r, i, a, 3, o), t.color, n);
    let c = Math.max(0, o - 0.032),
      l = Math.max(0.05, o - Math.sqrt(Math.max(0, o * o - c * c)) + 0.012),
      u = r - 0.08,
      d = i - 0.08,
      f = Math.min(u, d) * 0.1,
      p = r - 0.2,
      m = i - 0.2,
      h = SH(u, d, f);
    h.holes.push(SH(p - 0.02, m - 0.02, Math.min(p, m) * 0.08));
    let g = createPart(
      new ExtrudeGeometry(h, {
        depth: l + 0.01,
        bevelEnabled: !0,
        bevelSize: 0.008,
        bevelThickness: 0.008,
        bevelSegments: 1,
        curveSegments: 8,
      }),
      t.bezel ?? `#2b2140`,
      n,
    );
    g.position.z = s - l + 0.008;
    let _ = s + 0.026,
      v = `material` in t.led ? t.led : aV(t.led),
      y = new Mesh(
        TH(new ShapeGeometry(SH(p, m, Math.min(p, m) * 0.08), 6)),
        v.material,
      );
    ((y.name = `Screen`),
      (y.position.z = s + 0.004),
      n.add(y),
      v.glass(
        t.glint === !1 ? `none` : t.glint === `single` ? `band` : `rect`,
        p,
        m,
      ));
    let b = f > 0.035 ? f - (f - 0.035) * Math.SQRT1_2 : 0.035;
    for (let e of [-1, 1])
      for (let t of [-1, 1])
        xH(n, Z(e * (u / 2 - b), t * (d / 2 - b), _), cG, fG, 0.015);
    if (t.vents !== !1) {
      let e = a / 2 - o - 0.02,
        t = Math.max(3, Math.round((2 * e) / 0.06) + 1),
        s = $(
          `fin:${r.toFixed(3)}`,
          () => new BoxGeometry(r * 0.55, 0.035, 0.022),
        );
      for (let r = 0; r < t; r++)
        createPart(s, shadowPurple, n).position.set(
          0,
          -i / 2 + 0.0025,
          -e + (2 * e * r) / (t - 1),
        );
    }
    let x = t.stickers ?? {},
      S = x.size ?? [0.14, 0.24],
      C = o + 0.012;
    if (x.sides)
      for (let e of x.side ? [x.side] : [-1, 1])
        VH(n, AH(Z((e * r) / 2, 0, 0), Z(0, 0, -e), sG), {
          count: x.sides,
          size: S,
          hw: a / 2 - C,
          hh: i / 2 - C,
        });
    return (
      x.back &&
        VH(n, AH(Z(0, 0, -a / 2), lG, sG), {
          count: x.back,
          size: S,
          hw: r / 2 - C,
          hh: i / 2 - C,
        }),
      x.top &&
        VH(n, AH(Z(0, i / 2, 0), oG, uG), {
          count: x.top,
          size: S,
          hw: r / 2 - C,
          hh: a / 2 - C,
        }),
      {
        group: n,
        level: v.level,
        w: r,
        h: i,
        sw: p,
        sh: m,
        front: _,
      }
    );
  }
  var mG = 0.37;
  var hG = 0.405;
  var gG = 0.775 / 2;
  var _G = 0.026;
  var vG = -25 * dG;
  var yG = 205 * dG;
  var bG = 0.34;
  var xG = () =>
    $(`visor`, () => {
      let e = new Shape();
      return (
        e.absarc(0, 0, hG, vG, yG, !1),
        e.absarc(0, 0, mG, yG, vG, !0),
        e.closePath(),
        new ExtrudeGeometry(e, {
          depth: 0.39,
          bevelEnabled: !1,
          curveSegments: 28,
        })
      );
    });
  var SG = () => $(`visorLip`, () => new TorusGeometry(gG, _G, 8, 30, yG - vG));
  var CG = [palette.lime, palette.yellow, palette.red];
  var wG = 0.32;
  function TG(e, t, n = 1, r = shadowPurple, i = `round`) {
    let a = new Group();
    (a.scale.setScalar(n), e.add(a));
    let o = `material` in t ? t : aV(t),
      { material: s, level: c } = o;
    o.glass(i);
    let l = new Mesh(
      $(`lens`, () => new CircleGeometry(wG, 40)),
      s,
    );
    ((l.name = `Lens`),
      (l.position.z = 0.012),
      a.add(l),
      (createPart(
        $(`lensRing`, () => new TorusGeometry(0.335, 0.03, 8, 40)),
        r,
        a,
      ).position.z = 0.012),
      (createPart(xG(), r, a).position.z = -0.05));
    let u = createPart(SG(), r, a);
    ((u.position.z = bG), (u.rotation.z = vG));
    for (let e of [vG, yG])
      bH(a, Z(Math.cos(e) * gG, Math.sin(e) * gG, bG), _G, r, 8);
    return {
      group: a,
      level: c,
      front: bG * n,
      radius: hG * n,
    };
  }
  function EG(e, t, n) {
    let r = new Group(),
      i = n / 2;
    createPart(new RoundedBoxGeometry(e, t, n, 3, 0.16), amber, r);
    let a = new GlowGeometryBuilder(r),
      o = [
        {
          cols: 22,
          rows: 22,
          draw: vV.chevrons(palette.lime),
          frames: 5,
          fps: 5,
          brightness: 1.6,
        },
        {
          cols: 22,
          rows: 22,
          draw: vV.face(palette.yellow, `smile`, 1),
          frames: 2,
          fps: 0.8,
        },
        {
          cols: 22,
          rows: 22,
          draw: vV.heart(palette.red),
        },
      ],
      s = [0.9, 0, -0.9],
      c = [];
    s.forEach((e, t) => {
      let n = new Group();
      (n.position.set(e, 0, i),
        r.add(n),
        c.push(TG(n, o[t], 1, shadowPurple, `crescent`).level));
      let s = [45, 135, 225, 315].map((e) => e * dG);
      (t === 0 && s.push(0),
        t === 2 && s.push(Math.PI),
        a.from(n).burst(
          0,
          0,
          0.375,
          0.47,
          s.flatMap((e) => [e - 0.21, e, e + 0.21]),
          CG[t],
          t,
        ));
    });
    let l = [
      [1.2, -0.3],
      [-1.2, -0.3],
    ];
    for (let [e, t] of l) xH(r, Z(e, t, i), cG, fG);
    let u = 0.17200000000000001;
    (VH(r, AH(Z(0, 0, i), oG, sG), {
      count: 3,
      size: [0.11, 0.16],
      hw: e / 2 - u,
      hh: t / 2 - u,
      avoid: (e, t, n) =>
        s.some((r) => Math.hypot(e - r, t) < 0.45 + n) ||
        l.some(([r, i]) => Math.hypot(e - r, t - i) < 0.03 + n),
    }),
      VH(r, AH(Z(0, 0, -i), lG, sG), {
        count: 8,
        size: [0.16, 0.3],
        hw: e / 2 - u,
        hh: t / 2 - u,
      }),
      VH(r, AH(Z(-e / 2, 0, 0), cG, sG), {
        count: 2,
        size: [0.13, 0.2],
        hw: i - u,
        hh: t / 2 - u,
      }));
    let d = [1, 0, 0];
    return {
      group: r,
      ticks: a.build(`SignalGlow`),
      animate(e, t) {
        let n = e % 14,
          r = n < 7 ? 0 : n < 9 ? 1 : 2,
          i = 1 - Math.exp(-t * 10);
        for (let e = 0; e < 3; e++)
          ((d[e] += (+(e === r) - d[e]) * i), (c[e].value = d[e]));
        nG.levels.value.set(d[0], d[1], d[2], 1);
      },
    };
  }
  return {
    qW,
    JW,
    tG,
    nG,
    GlowGeometryBuilder,
    oG,
    sG,
    cG,
    lG,
    pG,
    TG,
    EG,
  };
}
