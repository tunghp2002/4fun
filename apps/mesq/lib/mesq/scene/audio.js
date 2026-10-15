// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
export function createAudioModule(scope, { renderingModule }) {
  let soundDisposed = false;
  const { ZI, $I, eL, tL } = renderingModule;
  function nL() {
    let e = tL();
    if (!e) return null;
    let t;
    try {
      t = new e({
        latencyHint: `interactive`,
      });
    } catch {
      try {
        t = new e();
      } catch {
        return null;
      }
    }
    let n = (e, n) => {
        let r = t.createGain();
        return ((r.gain.value = e), n && r.connect(n), r);
      },
      r = t.createWaveShaper();
    ((r.curve = rL()), r.connect(t.destination));
    let i = t.createBiquadFilter();
    ((i.type = `highpass`),
      (i.frequency.value = 35),
      (i.Q.value = 0.6),
      i.connect(r));
    let a = n(0, i),
      o = n(1, a),
      s = n(0, o),
      c = n(1, s),
      l = n(1, o),
      u = n(1, l),
      d = n(1, l),
      f = n(1, l),
      p = n(1),
      m = t.createDelay(0.1);
    m.delayTime.value = 0.018;
    let h = t.createConvolver();
    ((h.normalize = !1), (h.buffer = aL(t, 1.4, 1.05)));
    let g = n(eL, o);
    (p.connect(m), m.connect(h), h.connect(g));
    let _ = null,
      v = null;
    return {
      ctx: t,
      master: o,
      fade: a,
      ambience: c,
      bed: s,
      sfx: l,
      helper: u,
      birds: d,
      ui: f,
      verb: p,
      verbOut: g,
      get white() {
        return (_ ??= iL(t, 2, !1));
      },
      get pink() {
        return (v ??= iL(t, 2, !0));
      },
    };
  }
  function rL() {
    let e = 2049,
      t = new Float32Array(e);
    for (let n = 0; n < e; n++) {
      let e = (n / 2048) * 2 - 1,
        r = Math.abs(e);
      t[n] =
        Math.sign(e) * (r < 0.6 ? r : 0.6 + 0.4 * Math.tanh((r - 0.6) / 0.4));
    }
    return t;
  }
  function iL(e, t, n) {
    let r = e.sampleRate,
      i = Math.floor(r * 0.05),
      a = Math.max(i * 2, Math.floor(r * t)),
      o = a + i,
      s = new Float32Array(o),
      c = 0,
      l = 0,
      u = 0,
      d = 0,
      f = 0,
      p = 0,
      m = 0;
    for (let e = 0; e < o; e++) {
      let t = Math.random() * 2 - 1;
      if (!n) {
        s[e] = t;
        continue;
      }
      ((c = 0.99886 * c + t * 0.0555179),
        (l = 0.99332 * l + t * 0.0750759),
        (u = 0.969 * u + t * 0.153852),
        (d = 0.8665 * d + t * 0.3104856),
        (f = 0.55 * f + t * 0.5329522),
        (p = -0.7616 * p - t * 0.016898),
        (s[e] = c + l + u + d + f + p + m + t * 0.5362),
        (m = t * 0.115926));
    }
    let h = 0;
    for (let e = 0; e < o; e++) h += s[e];
    h /= o;
    let g = e.createBuffer(1, a, r),
      _ = g.getChannelData(0);
    for (let e = 0; e < a; e++) _[e] = s[e] - h;
    for (let e = 0; e < i; e++) {
      let t = e / i;
      _[e] = (s[e] - h) * Math.sqrt(t) + (s[a + e] - h) * Math.sqrt(1 - t);
    }
    let v = 0;
    for (let e = 0; e < a; e++) v += _[e] * _[e];
    let y = 0.3 / Math.sqrt(v / a || 1);
    for (let e = 0; e < a; e++) _[e] *= y;
    return g;
  }
  function aL(e, t, n) {
    let r = e.sampleRate,
      i = Math.floor(r * t),
      a = e.createBuffer(2, i, r);
    for (let e = 0; e < 2; e++) {
      let t = a.getChannelData(e),
        o = 0,
        s = 0;
      for (let e = 0; e < i; e++) {
        let a = e / r,
          c = Math.exp((-a * 6.9) / n) * Math.min(1, a / 0.006),
          l = 0.2 + (e / i) * 0.72;
        ((o += (Math.random() * 2 - 1 - o) * (1 - l)),
          (t[e] = o * c),
          (s += t[e] * t[e]));
      }
      let c = Math.sqrt(0.3 / (s || 1));
      for (let e = 0; e < i; e++) t[e] *= c;
    }
    return a;
  }
  var oL = 1e-4;
  function sL(e, t, n, r, i) {
    (e.setValueAtTime(0, t),
      e.linearRampToValueAtTime(Math.max(n, 2 * oL), t + r),
      e.exponentialRampToValueAtTime(oL, t + r + i),
      e.setValueAtTime(0, t + r + i));
  }
  function cL(e, t, n, r, i) {
    (e.setValueAtTime(oL, t),
      e.exponentialRampToValueAtTime(Math.max(n, 2 * oL), t + r),
      e.exponentialRampToValueAtTime(oL, t + r + i),
      e.setValueAtTime(0, t + r + i));
  }
  function lL(e, t, n, r, i) {
    (e.setValueAtTime(n, t), e.exponentialRampToValueAtTime(r, t + i));
  }
  var uL = (e, t) => e + Math.random() * (t - e);
  var dL = (e, t) => e * (1 + (Math.random() * 2 - 1) * t);
  var fL = (e) => 2 ** (e / 12);
  var pL = (e, t, n) => (e < t ? t : e > n ? n : e);
  var mL = (e, t, n) => {
    let r = pL((n - e) / (t - e), 0, 1);
    return r * r * (3 - 2 * r);
  };
  function hL(e, t) {
    (`setValueAtTime` in t, e.connect(t));
  }
  var gL = 0.025;
  var _L = 12;
  var vL = 8;
  var yL = 0;
  var bL = () => yL;
  var xL = (e) => yL < (e === 0 ? vL : e === 1 ? 11 : _L);
  var SynthVoice = class {
    ctx;
    t;
    out;
    panner;
    nodes = [];
    srcs = [];
    offsets = [];
    ended = 0;
    counted = !1;
    constructor(e, t, n, r, i, a, o = gL) {
      if (
        ((this.ctx = e),
        (TL = this),
        (this.t = e.currentTime + o),
        (this.out = e.createGain()),
        (this.out.gain.value = r),
        this.nodes.push(this.out),
        (this.panner = e.createStereoPanner()),
        (this.panner.pan.value = Number.isFinite(i) ? pL(i, -1, 1) : 0),
        this.out.connect(this.panner),
        this.panner.connect(t),
        this.nodes.push(this.panner),
        a > 0)
      ) {
        let t = e.createGain();
        ((t.gain.value = a),
          this.panner.connect(t),
          t.connect(n),
          this.nodes.push(t));
      }
    }
    osc(e, t) {
      let n = this.ctx.createOscillator();
      return (
        (n.type = e),
        (n.frequency.value = t),
        this.srcs.push(n),
        this.offsets.push(-1),
        this.nodes.push(n),
        n
      );
    }
    noise(e, t = 1) {
      let n = this.ctx.createBufferSource();
      return (
        (n.buffer = e),
        (n.loop = !0),
        (n.playbackRate.value = t),
        this.srcs.push(n),
        this.offsets.push(Math.random() * e.duration * 0.9),
        this.nodes.push(n),
        n
      );
    }
    gain(e = 0) {
      let t = this.ctx.createGain();
      return ((t.gain.value = e), this.nodes.push(t), t);
    }
    filter(e, t, n = 0.707) {
      let r = this.ctx.createBiquadFilter();
      return (
        (r.type = e),
        (r.frequency.value = t),
        (r.Q.value = n),
        this.nodes.push(r),
        r
      );
    }
    chain(...e) {
      for (let t = 0; t < e.length - 1; t++) hL(e[t], e[t + 1]);
    }
    play(e) {
      let t = this.t + Math.max(0.02, e);
      if (this.srcs.length) {
        for (let e = 0; e < this.srcs.length; e++) {
          let n = this.srcs[e];
          (this.offsets[e] >= 0
            ? n.start(this.t, this.offsets[e])
            : n.start(this.t),
            n.stop(t));
        }
        (yL++, (this.counted = !0));
        for (let e of this.srcs) e.onended = this.onEnded;
      } else this.done();
      TL === this && (TL = null);
    }
    abort() {
      this.counted || this.done();
    }
    onEnded = () => {
      ++this.ended < this.srcs.length ||
        ((yL = Math.max(0, yL - 1)), this.done());
    };
    done() {
      for (let e of this.srcs) e.onended = null;
      for (let e of this.nodes) e.disconnect();
      this.nodes.length = this.srcs.length = this.offsets.length = 0;
    }
  };
  var SoundLimiter = class {
    gap;
    burst;
    rate;
    last = -1e9;
    tokens;
    refilled = 0;
    constructor(e, t = 3, n = 1 / e) {
      ((this.gap = e), (this.burst = t), (this.rate = n), (this.tokens = t));
    }
    take(e) {
      return e - this.last < this.gap ||
        ((this.tokens = Math.min(
          this.burst,
          this.tokens + (e - this.refilled) * this.rate,
        )),
        (this.refilled = e),
        this.tokens < 1)
        ? !1
        : (--this.tokens, (this.last = e), !0);
    }
  };
  var wL = {
    engine: null,
    on: !1,
  };
  var TL = null;
  var EL = !1;
  function DL(e) {
    let t = TL;
    ((TL = null), t?.abort(), !EL && (EL = !0));
  }
  function OL() {
    let e = wL.engine;
    return wL.on && e !== null && e.ctx.state === `running` && !document.hidden
      ? e
      : null;
  }
  function kL(e, t, n, r, i = 0, a = 0, o = gL) {
    return xL(n) ? new SynthVoice(e.ctx, e[t], e.verb, r, i, a, o) : null;
  }
  function AL(e) {
    let t = {};
    for (let n of Object.keys(e)) {
      let r = e[n];
      t[n] = (e, t, n) => {
        try {
          r(e, t, n);
        } catch (e) {
          DL(e);
        }
      };
    }
    return t;
  }
  var jL = (e) => uL(-e, e);
  var ML = {
    talk: new SoundLimiter(0.22, 2, 1.5),
    alarm: new SoundLimiter(0.07, 3, 3),
    doze: new SoundLimiter(0.9, 1, 0.4),
    flap: new SoundLimiter(0.05, 3, 4),
    blip: new SoundLimiter(1 / 18, 1, 18),
    helperOpen: new SoundLimiter(0.15, 2, 3),
    helperClose: new SoundLimiter(0.15, 2, 3),
    hover: new SoundLimiter(0.06, 3, 8),
    click: new SoundLimiter(0.04, 4, 10),
    menu: new SoundLimiter(0.12, 2, 4),
    panel: new SoundLimiter(0.15, 2, 2),
    wipe: new SoundLimiter(0.2, 2, 2),
    eat: new SoundLimiter(0.05, 3, 8),
    die: new SoundLimiter(0.4, 1, 1),
    pong: new SoundLimiter(0.06, 2, 10),
    pongPress: new SoundLimiter(0.03, 4, 14),
    nudge: new SoundLimiter(0.25, 2, 3),
    goal: new SoundLimiter(0.4, 1, 1),
    slotSpin: new SoundLimiter(0.5, 1, 2),
    slotPress: new SoundLimiter(0.04, 4, 10),
    slotTick: new SoundLimiter(0.035, 3, 28),
    slotStop: new SoundLimiter(0.1, 3, 10),
    slotWin: new SoundLimiter(1, 1, 1),
    ticketPrint: new SoundLimiter(1, 1, 1),
    ticketTear: new SoundLimiter(0.3, 2, 2),
    shutter: new SoundLimiter(0.2, 2, 3),
    plane: new SoundLimiter(1.5, 2, 0.2),
    mail: new SoundLimiter(0.3, 2, 2),
    tick: new SoundLimiter(0.07, 2, 12),
    ambient: new SoundLimiter(0.6, 2, 1),
    hello: new SoundLimiter(0.3, 1, 2),
  };
  function NL(e, t) {
    let n = e.osc(`sine`, t.base),
      r = e.gain(0),
      i = e.filter(`lowpass`, t.lowpass, 0.5);
    if ((e.chain(n, r, i, e.out), t.trill[1] > 0)) {
      let r = e.osc(`sine`, t.trill[0]),
        i = e.gain(t.trill[1]);
      e.chain(r, i, n.frequency);
    }
    let a = e.t,
      o = t.maxHz - t.trill[1];
    for (let e = 0; e < t.n; e++) {
      let i = uL(t.d[0], t.d[1]),
        s =
          t.base *
          dL(1, 0.07) *
          (e === t.n - 1 && Math.random() < 0.4 ? 1.12 : 1),
        c = s,
        l = s;
      if (t.contour === `down`) ((c = s * 1.25), (l = s * 0.72));
      else if (t.contour === `song`)
        ((c = s * uL(0.92, 1.05)), (l = s * uL(0.88, 1.12)));
      else {
        let e = Math.random();
        e < 0.45
          ? ((c = s * 0.8), (l = s * 1.16))
          : e < 0.8
            ? ((c = s * 1.18), (l = s * 0.82))
            : (l = s * 1.04);
      }
      lL(n.frequency, a, Math.min(c, o), Math.min(l, o), i);
      let u = t.attack;
      (sL(r.gain, a, t.peak * uL(0.75, 1), u, Math.max(0.015, i - u)),
        (a += i + uL(t.gap[0], t.gap[1])));
    }
    e.play(a - e.t + 0.03);
  }
  function PL(e, t) {
    let n = kL(e, `birds`, 0, 1, t, 0.25);
    if (!n) return;
    let r = n.osc(`sine`, 600),
      i = n.osc(`sine`, uL(4.5, 6)),
      a = n.gain(10);
    n.chain(i, a, r.frequency);
    let o = n.gain(0);
    n.chain(r, o, n.filter(`lowpass`, 2e3, 0.5), n.out);
    let s = n.t,
      c = dL(1, 0.06),
      l = 0.07;
    (lL(r.frequency, s, 560 * c, 820 * c, 0.45),
      o.gain.setValueAtTime(0, s),
      o.gain.linearRampToValueAtTime(l * 0.55, s + 0.18),
      o.gain.exponentialRampToValueAtTime(oL, s + 0.5));
    let u = s + uL(0.58, 0.68);
    (lL(r.frequency, u, 900 * c, 500 * c, 0.6),
      sL(o.gain, u, l, 0.07, 0.55),
      n.play(u - s + 0.66));
  }
  var FL = null;
  function IL(e) {
    if (FL && FL.ctx === e.ctx) return FL;
    let t = e.ctx,
      n = t.createOscillator();
    n.type = `triangle`;
    let r = t.createBiquadFilter();
    ((r.type = `lowpass`), (r.frequency.value = 2300), (r.Q.value = 0.5));
    let i = t.createGain();
    i.gain.value = 0;
    let a = t.createStereoPanner();
    return (
      (a.pan.value = -0.3),
      n.connect(r),
      r.connect(i),
      i.connect(a),
      a.connect(e.helper),
      n.start(),
      (FL = {
        ctx: t,
        osc: n,
        env: i,
      }),
      FL
    );
  }
  var LL = [0, 2, 4, 7, 9, 12, 14];
  var RL = 523.25;
  var zL = /[\s.,!?…;:—–\-'"«»()[\]/]/;
  var BL = `aeiouyAEIOUYаеёиоуыэюяАЕЁИОУЫЭЮЯ`;
  var VL = AL({
    birdChirp(e = `talk`, t = jL(0.35)) {
      let n = OL();
      if (!n || !ML[e].take(n.ctx.currentTime)) return;
      if (e === `doze`) return PL(n, t);
      let r = e === `alarm`,
        i = kL(n, `birds`, 1, 1, t, r ? 0.1 : 0.16);
      i &&
        NL(
          i,
          r
            ? {
                n: 2 + Math.floor(uL(0, 2)),
                base: uL(2450, 2850),
                d: [0.03, 0.045],
                gap: [0.035, 0.06],
                peak: 0.07,
                attack: 0.01,
                maxHz: 3600,
                lowpass: 4600,
                trill: [0, 0],
                contour: `down`,
              }
            : {
                n: 2 + Math.floor(uL(0, 3)),
                base: uL(1850, 2750),
                d: [0.045, 0.08],
                gap: [0.03, 0.07],
                peak: 0.08,
                attack: 0.012,
                maxHz: 3400,
                lowpass: 4400,
                trill: [uL(28, 50), uL(50, 140)],
                contour: `mixed`,
              },
        );
    },
    birdFlap(e = jL(0.35)) {
      let t = OL();
      if (!t || !ML.flap.take(t.ctx.currentTime)) return;
      let n = kL(t, `birds`, 1, 1, e, 0.06);
      if (!n) return;
      let r = n.noise(t.white, dL(1, 0.1)),
        i = n.filter(`bandpass`, 1150, 1.1),
        a = n.gain(0);
      n.chain(r, i, a, n.filter(`lowpass`, 3200), n.out);
      let o = n.t,
        s = uL(0.05, 0.065),
        c = 0.6,
        l = 6 + Math.floor(uL(0, 4));
      for (let e = 0; e < l; e++)
        (i.frequency.setValueAtTime(dL(1150, 0.18), o),
          sL(a.gain, o, c * uL(0.8, 1), 0.007, Math.min(0.042, s - 0.008)),
          (o += s),
          (s *= 1.07),
          (c *= 0.84));
      let u = n.osc(`sine`, 170),
        d = n.gain(0);
      (n.chain(u, d, n.out),
        lL(u.frequency, n.t, dL(170, 0.1), 85, 0.07),
        sL(d.gain, n.t, 0.06, 0.004, 0.08),
        n.play(o - n.t + 0.05));
    },
    helperBlip(e) {
      let t = OL();
      if (!t) return;
      let n,
        r = 1;
      if (e) {
        if (zL.test(e)) return;
        let t = e.charCodeAt(0);
        ((n = BL.indexOf(e) >= 0 ? LL[3 + (t % 4)] : LL[t % 4]),
          e !== e.toLowerCase() && (r = 1.2));
      } else n = LL[Math.floor(uL(0, LL.length))];
      let i = t.ctx.currentTime;
      if (!ML.blip.take(i)) return;
      let a = IL(t),
        o = i + gL,
        s = RL * fL(n) * dL(1, 0.015);
      (lL(a.osc.frequency, o, s * 1.07, s, 0.025),
        sL(a.env.gain, o, 0.05 * r, 0.004, 0.04));
    },
    helperOpen() {
      let e = OL();
      if (!e || !ML.helperOpen.take(e.ctx.currentTime)) return;
      let t = kL(e, `helper`, 2, 1, -0.3, 0.14);
      if (!t) return;
      let n = dL(1, 0.04),
        r = t.osc(`sine`, 300),
        i = t.gain(0);
      (t.chain(r, i, t.out),
        lL(r.frequency, t.t, 260 * n, 780 * n, 0.09),
        sL(i.gain, t.t, 0.11, 0.008, 0.14));
      let a = t.osc(`triangle`, 1175 * n),
        o = t.gain(0);
      (t.chain(a, o, t.filter(`lowpass`, 3e3, 0.5), t.out),
        sL(o.gain, t.t + 0.06, 0.05, 0.004, 0.12),
        t.play(0.26));
    },
    helperClose() {
      let e = OL();
      if (!e || !ML.helperClose.take(e.ctx.currentTime)) return;
      let t = kL(e, `helper`, 2, 1, -0.3, 0.1);
      if (!t) return;
      let n = dL(1, 0.04),
        r = t.osc(`sine`, 700),
        i = t.gain(0);
      (t.chain(r, i, t.out),
        lL(r.frequency, t.t, 720 * n, 240 * n, 0.11),
        sL(i.gain, t.t, 0.12, 0.006, 0.13),
        t.play(0.16));
    },
    uiHover(e = 0) {
      let t = OL();
      if (!t || !ML.hover.take(t.ctx.currentTime)) return;
      let n = kL(t, `ui`, 1, 1, e, 0.04);
      if (!n) return;
      let r = dL(1900, 0.05),
        i = n.osc(`sine`, r),
        a = n.gain(0);
      (n.chain(i, a, n.out),
        lL(i.frequency, n.t, r, r * 0.72, 0.03),
        sL(a.gain, n.t, 0.055, 0.002, 0.035),
        n.play(0.05));
    },
    uiClick(e = 0) {
      let t = OL();
      if (!t || !ML.click.take(t.ctx.currentTime)) return;
      let n = kL(t, `ui`, 2, 1, e, 0.06);
      if (!n) return;
      let r = dL(1e3, 0.04),
        i = n.osc(`sine`, r),
        a = n.gain(0);
      (n.chain(i, a, n.out),
        lL(i.frequency, n.t, r, r * 0.45, 0.06),
        sL(a.gain, n.t, 0.12, 0.002, 0.08));
      let o = n.noise(t.white),
        s = n.gain(0);
      (n.chain(o, n.filter(`bandpass`, dL(2600, 0.08), 1.4), s, n.out),
        sL(s.gain, n.t, 0.5, 0.001, 0.012),
        n.play(0.1));
    },
    menuOpen() {
      let e = OL();
      if (!e || !ML.menu.take(e.ctx.currentTime)) return;
      let t = kL(e, `ui`, 2, 1, -0.4, 0.22);
      if (!t) return;
      let n = 784 * dL(1, 0.01),
        r = t.filter(`lowpass`, 3200, 0.5);
      (r.connect(t.out),
        [0, 4, 7].forEach((e, i) => {
          let a = t.osc(`triangle`, n * fL(e)),
            o = t.gain(0);
          (t.chain(a, o, r),
            sL(o.gain, t.t + 0.03 + i * 0.05, 0.08, 0.004, 0.2));
        }));
      let i = t.osc(`sine`, 220),
        a = t.gain(0);
      (t.chain(i, a, t.out),
        lL(i.frequency, t.t, 220, 520, 0.08),
        sL(a.gain, t.t, 0.07, 0.01, 0.08),
        t.play(0.42));
    },
    menuClose() {
      let e = OL();
      if (!e || !ML.menu.take(e.ctx.currentTime)) return;
      let t = kL(e, `ui`, 2, 1, -0.4, 0.18);
      if (!t) return;
      let n = 784 * dL(1, 0.01),
        r = t.filter(`lowpass`, 3e3, 0.5);
      (r.connect(t.out),
        [7, 0].forEach((e, i) => {
          let a = t.osc(`triangle`, n * fL(e)),
            o = t.gain(0);
          (t.chain(a, o, r), sL(o.gain, t.t + i * 0.055, 0.07, 0.004, 0.16));
        }));
      let i = t.osc(`sine`, 500),
        a = t.gain(0);
      (t.chain(i, a, t.out),
        lL(i.frequency, t.t + 0.04, 500, 220, 0.09),
        sL(a.gain, t.t + 0.04, 0.06, 0.01, 0.08),
        t.play(0.3));
    },
    panelSwitch(e = 0.75, t = 0.25) {
      let n = OL();
      if (!n || !ML.panel.take(n.ctx.currentTime)) return;
      let r = kL(n, `ui`, 1, 1, t, 0.06);
      if (!r) return;
      let i = pL(Number.isFinite(e) ? e : 0.75, 0.3, 1.2),
        a = r.t,
        o = r.filter(`lowpass`, 2400, 0.5);
      o.connect(r.out);
      let s = r.osc(`square`, 1400),
        c = r.gain(0);
      r.chain(s, c, o);
      let l = a;
      for (
        let e = 0;
        e < 6 && ((l += dL(0.055, 0.45) * (i / 0.75)), !(l > a + i * 0.6));
        e++
      )
        (s.frequency.setValueAtTime(uL(900, 2600), l),
          sL(c.gain, l, 0.014, 0.002, uL(0.012, 0.03)));
      let u = r.noise(n.white),
        d = r.filter(`bandpass`, 3200, 1.2),
        f = r.gain(0);
      (r.chain(u, d, f, o),
        f.gain.setValueAtTime(0, a),
        f.gain.linearRampToValueAtTime(0.012, a + 0.03),
        f.gain.exponentialRampToValueAtTime(oL, a + i * 0.55));
      let p = r.osc(`sine`, 520 * dL(1, 0.04)),
        m = r.gain(0);
      (r.chain(p, m, r.out),
        sL(m.gain, a + i * 0.7, 0.03, 0.004, 0.09),
        r.play(i * 0.7 + 0.15));
    },
    wipe(e = {}) {
      let t = OL();
      if (!t || !ML.wipe.take(t.ctx.currentTime)) return;
      let n = e.dir === -1 ? -1 : 1,
        r = pL(e.cover ?? 0.19, 0.12, 0.4),
        i = pL(e.reveal ?? r + 0.11, r + 0.05, r + 0.4),
        a = pL(e.end ?? i + 0.18, i + 0.1, i + 0.4),
        o = a - i,
        s = 0.8 * n,
        c = kL(t, `ui`, 2, 1, -s, 0.18);
      if (!c) return;
      let l = c.t,
        u = c.panner.pan;
      (u.setValueAtTime(-s, l),
        u.setTargetAtTime(0, l, r / 4),
        u.setValueAtTime(0, l + i),
        u.linearRampToValueAtTime(s * 0.2, l + i + o * 0.5),
        u.linearRampToValueAtTime(s, l + a));
      let d = c.noise(t.white),
        f = c.filter(`bandpass`, 1800, 1.1),
        p = c.gain(0);
      c.chain(d, f, p, c.out);
      let m = c.noise(t.white),
        h = c.gain(0);
      (c.chain(m, c.filter(`highpass`, 3500, 0.7), h, c.out),
        lL(f.frequency, l, dL(1900, 0.08), 560, r + 0.05),
        p.gain.setValueAtTime(oL, l),
        p.gain.exponentialRampToValueAtTime(0.19, l + 0.05),
        p.gain.exponentialRampToValueAtTime(0.045, l + r),
        p.gain.exponentialRampToValueAtTime(oL, l + r + 0.12),
        p.gain.setValueAtTime(0, l + r + 0.12),
        cL(h.gain, l, 0.09, 0.04, r - 0.02));
      let g = c.osc(`sine`, 150),
        _ = c.gain(0);
      (c.chain(g, _, c.out),
        lL(g.frequency, l + r - 0.02, 150, 62, 0.16),
        sL(_.gain, l + r - 0.02, 0.08, 0.008, 0.2));
      let v = c.noise(t.white),
        y = c.filter(`bandpass`, dL(1900, 0.06), 0.8),
        b = c.gain(0);
      (c.chain(v, y, b, c.out), sL(b.gain, l + r, 0.16, 0.002, 0.07));
      let x = c.osc(`sine`, 1500),
        S = c.gain(0);
      c.chain(x, S, c.out);
      let C = l + r + 0.07;
      (lL(x.frequency, C, dL(1500, 0.04), 2100, 0.03),
        sL(S.gain, C, 0.03, 0.003, 0.05));
      let w = c.noise(t.white),
        T = c.filter(`bandpass`, 600, 1.1),
        E = c.gain(0);
      (c.chain(w, T, E, c.out),
        lL(T.frequency, l + i, 520, 1900, o),
        cL(E.gain, l + i, 0.12, o * 0.75, o * 0.4),
        c.play(a + 0.15));
    },
    snakeEat(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !ML.eat.take(t.ctx.currentTime)) return;
      let n = kL(t, `ui`, 0, Math.min(1, e), 0.2, 0.04);
      if (!n) return;
      let r = n.osc(`square`, 988),
        i = n.gain(0);
      n.chain(r, i, n.filter(`lowpass`, 2600, 0.5), n.out);
      let a = dL(1, 0.02);
      (r.frequency.setValueAtTime(988 * a, n.t),
        r.frequency.setValueAtTime(1319 * a, n.t + 0.05),
        sL(i.gain, n.t, 0.045, 0.003, 0.04),
        sL(i.gain, n.t + 0.05, 0.045, 0.003, 0.07),
        n.play(0.13));
    },
    snakeDie(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !ML.die.take(t.ctx.currentTime)) return;
      let n = kL(t, `ui`, 0, Math.min(1, e), 0.2, 0.06);
      if (!n) return;
      let r = n.osc(`square`, 660),
        i = n.osc(`sine`, 12),
        a = n.gain(35);
      n.chain(i, a, r.detune);
      let o = n.gain(0);
      n.chain(r, o, n.filter(`lowpass`, 1800, 0.5), n.out);
      let s = n.t,
        c = 660 * dL(1, 0.02);
      for (let e = 0; e < 7; e++, c *= 0.84)
        r.frequency.setValueAtTime(c, s + e * 0.05);
      r.frequency.setValueAtTime(110, s + 0.37);
      let l = 0.05;
      (o.gain.setValueAtTime(0, s),
        o.gain.linearRampToValueAtTime(l, s + 0.004),
        o.gain.exponentialRampToValueAtTime(l * 0.35, s + 0.36),
        o.gain.linearRampToValueAtTime(l * 0.7, s + 0.38),
        o.gain.exponentialRampToValueAtTime(oL, s + 0.6),
        n.play(0.62));
    },
    signNudge(e = 0.3) {
      let t = OL();
      if (!t || !ML.nudge.take(t.ctx.currentTime)) return;
      let n = kL(t, `ui`, 1, 1, e, 0.08);
      if (!n) return;
      let r = n.t,
        i = n.filter(`lowpass`, 1800, 0.7);
      (i.connect(n.out),
        [0, 0.085].forEach((e, t) => {
          let a = n.osc(`triangle`, (t ? 660 : 495) * dL(1, 0.03)),
            o = n.gain(0);
          (n.chain(a, o, i), sL(o.gain, r + e, 0.05, 0.002, 0.07));
        }));
      let a = n.osc(`sine`, 330),
        o = n.gain(0),
        s = n.osc(`sine`, 18),
        c = n.gain(22);
      (n.chain(s, c, a.detune),
        n.chain(a, o, n.out),
        lL(a.frequency, r + 0.02, 330, 190, 0.32),
        sL(o.gain, r + 0.02, 0.02, 0.01, 0.3),
        n.play(0.45));
    },
    pongHit(e = `top`, t = 1) {
      let n = OL();
      if (!n || !(t > 0.002) || !ML.pong.take(n.ctx.currentTime)) return;
      let r = kL(n, `ui`, 0, Math.min(1, t), 0.2, 0.03);
      if (!r) return;
      let i = e === `wall`,
        a = r.osc(`square`, (i ? 330 : e === `top` ? 660 : 587) * dL(1, 0.01)),
        o = r.gain(0);
      (r.chain(a, o, r.filter(`lowpass`, i ? 1500 : 2200, 0.5), r.out),
        sL(o.gain, r.t, i ? 0.022 : 0.036, 0.002, i ? 0.04 : 0.06),
        r.play(0.1));
    },
    pongGoal(e = !1, t = 1) {
      let n = OL();
      if (!n || !(t > 0.002) || !ML.goal.take(n.ctx.currentTime)) return;
      let r = kL(n, `ui`, 0, Math.min(1, t), 0.2, 0.05);
      if (!r) return;
      let i = r.osc(`square`, 392),
        a = r.gain(0);
      r.chain(i, a, r.filter(`lowpass`, 1900, 0.5), r.out);
      let o = e ? [523, 659, 784] : [392, 262],
        s = dL(1, 0.015);
      (o.forEach((e, t) => {
        let n = r.t + t * 0.09;
        (i.frequency.setValueAtTime(e * s, n),
          sL(a.gain, n, 0.04, 0.003, t === o.length - 1 ? 0.16 : 0.07));
      }),
        r.play(o.length * 0.09 + 0.2));
    },
    pongPress(e = `press`, t = 1) {
      let n = OL();
      if (!n || !(t > 0.002) || !ML.pongPress.take(n.ctx.currentTime)) return;
      let r = e === `release`,
        i = kL(n, `ui`, r ? 0 : 2, Math.min(1, t), 0.2, 0.02);
      if (!i) return;
      let a = i.noise(n.white),
        o = i.gain(0);
      (i.chain(
        a,
        i.filter(`bandpass`, dL(r ? 4300 : 3100, 0.05), r ? 2.6 : 2),
        o,
        i.out,
      ),
        sL(o.gain, i.t, r ? 0.09 : 0.2, 0.001, r ? 0.01 : 0.016));
      let s = i.osc(`triangle`, dL(r ? 1050 : 540, 0.03)),
        c = i.gain(0);
      (i.chain(s, c, i.filter(`lowpass`, 2600, 0.5), i.out),
        r || lL(s.frequency, i.t, dL(540, 0.03), 380, 0.03),
        sL(c.gain, i.t + 0.002, r ? 0.018 : 0.05, 0.001, r ? 0.025 : 0.04),
        i.play(0.08));
    },
    slotSpin(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !ML.slotSpin.take(t.ctx.currentTime)) return;
      let n = kL(t, `ui`, 0, Math.min(1, e), 0.3, 0.04);
      if (!n) return;
      let r = n.noise(t.white),
        i = n.filter(`bandpass`, dL(1900, 0.05), 2.2),
        a = n.gain(0);
      n.chain(r, i, a, n.out);
      for (let e = 0; e < 3; e++)
        sL(a.gain, n.t + 0.03 + e * 0.028, 0.16 - e * 0.03, 0.001, 0.012);
      n.play(0.16);
    },
    slotPress(e = `press`, t = !1, n = 1) {
      let r = OL();
      if (!r || !(n > 0.002) || !ML.slotPress.take(r.ctx.currentTime)) return;
      let i = kL(
        r,
        `ui`,
        t || e === `release` ? 0 : 2,
        Math.min(1, n) * (t ? 0.7 : 1),
        0.3,
        0.03,
      );
      if (!i) return;
      let a = i.noise(r.white),
        o = i.gain(0);
      if (e === `release`) {
        (i.chain(a, i.filter(`bandpass`, dL(3400, 0.05), 2.5), o, i.out),
          sL(o.gain, i.t, 0.12, 0.001, 0.012));
        let e = i.osc(`triangle`, dL(900, 0.03)),
          t = i.gain(0);
        (i.chain(e, t, i.filter(`lowpass`, 2400, 0.5), i.out),
          sL(t.gain, i.t, 0.022, 0.001, 0.035),
          i.play(0.07));
        return;
      }
      let s = e === `stuck`;
      if (
        (i.chain(
          a,
          i.filter(`bandpass`, dL(s ? 1500 : 2700, 0.05), s ? 1.4 : 2.2),
          o,
          i.out,
        ),
        sL(o.gain, i.t, s ? 0.09 : 0.28, 0.001, s ? 0.012 : 0.02),
        s)
      ) {
        i.play(0.05);
        return;
      }
      let c = i.osc(`sine`, 190),
        l = i.gain(0);
      (i.chain(c, l, i.out),
        lL(c.frequency, i.t, dL(190, 0.03), 62, 0.07),
        sL(l.gain, i.t, 0.13, 0.002, 0.11));
      let u = i.osc(`triangle`, dL(430, 0.03)),
        d = i.gain(0);
      (i.chain(u, d, i.filter(`lowpass`, 1800, 0.5), i.out),
        sL(d.gain, i.t + 0.004, 0.035, 0.001, 0.05),
        i.play(0.16));
    },
    slotTick(e = 0, t = 1, n = 1) {
      let r = OL();
      if (!r || !(n > 0.002) || !ML.slotTick.take(r.ctx.currentTime)) return;
      let i = kL(r, `ui`, 0, Math.min(1, n), 0.3, 0.02);
      if (!i) return;
      let a = pL(Number.isFinite(t) ? t : 1, 0, 1.5),
        o = 0.05 * (1.2 - 0.4 * Math.min(1, a)),
        s = i.noise(r.white),
        c = i.filter(`bandpass`, dL([2600, 2300, 2050][e] ?? 2300, 0.04), 3),
        l = i.gain(0);
      (i.chain(s, c, l, i.out), sL(l.gain, i.t, o * 2.4, 0.001, 0.014));
      let u = i.osc(`triangle`, dL([1250, 1110, 990][e] ?? 1110, 0.02)),
        d = i.gain(0);
      (i.chain(u, d, i.filter(`lowpass`, 2600, 0.5), i.out),
        sL(d.gain, i.t, o * 0.35, 0.001, 0.016),
        i.play(0.04));
    },
    slotStop(e = 0, t = null, n = 1) {
      let r = OL();
      if (!r || !(n > 0.002) || !ML.slotStop.take(r.ctx.currentTime)) return;
      let i = kL(r, `ui`, 0, Math.min(1, n), 0.3, 0.05);
      if (!i) return;
      let a = ([1.12, 1, 0.9][e] ?? 1) * dL(1, 0.02),
        o = i.osc(`sine`, 170 * a),
        s = i.gain(0);
      (i.chain(o, s, i.out),
        lL(o.frequency, i.t, 170 * a, 62 * a, 0.09),
        sL(s.gain, i.t, t ? 0.11 : 0.09, 0.003, 0.12));
      let c = i.noise(r.white),
        l = i.gain(0);
      (i.chain(c, i.filter(`bandpass`, 950 * a, 1.3), l, i.out),
        sL(l.gain, i.t, 0.32, 0.001, 0.03),
        i.play(0.16));
    },
    slotWin(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !ML.slotWin.take(t.ctx.currentTime)) return;
      let n = kL(t, `ui`, 1, Math.min(1, e), 0.3, 0.3);
      if (!n) return;
      let r = n.filter(`lowpass`, 5e3, 0.5);
      (r.connect(n.out),
        [1047, 1319, 1568, 2093].forEach((e, t) => {
          let i = e * dL(1, 0.006),
            a = n.t + t * 0.075,
            o = n.osc(`sine`, i),
            s = n.osc(`sine`, i * 3),
            c = n.gain(0);
          (n.chain(s, c, o.frequency),
            c.gain.setValueAtTime(i * 1.2, a),
            c.gain.exponentialRampToValueAtTime(i * 0.03, a + 0.35));
          let l = n.gain(0);
          (n.chain(o, l, r),
            sL(l.gain, a, t === 3 ? 0.07 : 0.055, 0.003, t === 3 ? 0.9 : 0.45));
        }));
      let i = n.osc(`sine`, 2800),
        a = n.gain(0);
      n.chain(i, a, r);
      let o = n.t + 0.32;
      for (let e = 0; e < 6; e++, o += uL(0.06, 0.11))
        (i.frequency.setValueAtTime(uL(2500, 3300), o),
          sL(a.gain, o, 0.02, 0.002, 0.05));
      n.play(1.3);
    },
    ticketPrint(e = 6, t = 0.24, n = 1) {
      let r = OL();
      if (!r || !(n > 0.002) || !ML.ticketPrint.take(r.ctx.currentTime)) return;
      let i = kL(r, `ui`, 1, Math.min(1, n), 0.2, 0.03);
      if (!i) return;
      let a = pL(Math.round(Number.isFinite(e) ? e : 10), 1, 20),
        o = pL(Number.isFinite(t) ? t : 0.2, 0.08, 0.6),
        s = i.t,
        c = s + a * o,
        l = i.filter(`highpass`, 520, 0.6);
      i.chain(l, i.out);
      let u = dL(1, 0.03),
        d = i.osc(`sawtooth`, 470 * u),
        f = i.noise(r.white),
        p = i.gain(0);
      (i.chain(d, i.filter(`bandpass`, 1350 * u, 1.1), p),
        i.chain(f, i.filter(`bandpass`, 1700 * u, 0.9), i.gain(1.8), p));
      let m = i.gain(0.75);
      (i.chain(i.osc(`sine`, dL(30, 0.06)), i.gain(0.12), m.gain),
        i.chain(p, m, l),
        lL(d.frequency, s, 360 * u, 470 * u, 0.12),
        d.frequency.setValueAtTime(470 * u, c),
        d.frequency.linearRampToValueAtTime(380 * u, c + 0.12),
        p.gain.setValueAtTime(0, s),
        p.gain.linearRampToValueAtTime(0.03, s + 0.07),
        p.gain.setValueAtTime(0.03, c),
        p.gain.linearRampToValueAtTime(0, c + 0.12));
      let h = i.filter(`bandpass`, 3600, 2),
        g = i.gain(0);
      i.chain(i.noise(r.white), h, g, l);
      for (let e = 0; e < a * 4; e++) {
        let t = s + 0.03 + (e * o) / 4 + uL(0, 0.003),
          n = e % 4 == 0;
        (h.frequency.setValueAtTime(n ? 4300 : dL(3400, 0.04), t),
          sL(g.gain, t, n ? 0.075 : 0.05, 0.003, 0.012));
      }
      i.play(c - s + 0.15);
    },
    ticketTear(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !ML.ticketTear.take(t.ctx.currentTime)) return;
      let n = kL(t, `ui`, 0, Math.min(1, e), 0.15 + jL(0.1), 0.03);
      if (!n) return;
      let r = n.t,
        i = dL(0.13, 0.1),
        a = n.filter(`bandpass`, 2400, 1.3),
        o = n.gain(0),
        s = n.gain(0.55);
      (n.chain(n.osc(`sine`, dL(85, 0.08)), n.gain(0.45), s.gain),
        n.chain(
          n.noise(t.white),
          n.filter(`highpass`, 1300, 0.7),
          a,
          o,
          s,
          n.out,
        ),
        lL(a.frequency, r, dL(2400, 0.08), dL(5e3, 0.06), i),
        o.gain.setValueAtTime(0, r),
        o.gain.linearRampToValueAtTime(0.11, r + 0.008),
        o.gain.exponentialRampToValueAtTime(0.05, r + i * 0.7),
        o.gain.linearRampToValueAtTime(0, r + i),
        n.play(i + 0.03));
    },
    shutter(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !ML.shutter.take(t.ctx.currentTime)) return;
      let n = kL(t, `ui`, 1, Math.min(1, e), 0.3, 0.04);
      if (!n) return;
      for (let [e, r, i] of [
        [0, 0.2, 3300],
        [0.034, 0.14, 2700],
      ]) {
        let a = n.gain(0);
        (n.chain(
          n.noise(t.white),
          n.filter(`bandpass`, dL(i, 0.05), 1.8),
          a,
          n.out,
        ),
          sL(a.gain, n.t + e, r, 0.001, 0.016));
      }
      let r = n.osc(`triangle`, dL(300, 0.03)),
        i = n.gain(0);
      (n.chain(r, i, n.filter(`lowpass`, 1400, 0.5), n.out),
        lL(r.frequency, n.t, dL(300, 0.03), 170, 0.05),
        sL(i.gain, n.t, 0.05, 0.001, 0.05),
        n.play(0.12));
    },
    planePass(e = -0.8, t = 9) {
      let n = OL();
      if (!n || !ML.plane.take(n.ctx.currentTime)) return;
      let r = Number.isFinite(e) ? pL(e, -1, 1) : 0,
        i = kL(n, `ambience`, 1, 1, r, 0.3);
      if (!i) return;
      let a = pL(Number.isFinite(t) ? t : 9, 3, 16),
        o = i.t;
      (i.panner.pan.setValueAtTime(r, o),
        i.panner.pan.linearRampToValueAtTime(-r * 0.9, o + a));
      let s = i.noise(n.pink, 0.9),
        c = i.filter(`lowpass`, 240, 0.5),
        l = i.filter(`lowpass`, 700, 0.5),
        u = i.gain(0);
      (i.chain(s, c, l, u, i.out),
        lL(c.frequency, o, 240, 520, a * 0.45),
        c.frequency.exponentialRampToValueAtTime(260, o + a),
        cL(u.gain, o, 0.021, a * 0.45, a * 0.55));
      let d = dL(420, 0.08),
        f = i.osc(`sine`, d),
        p = i.gain(0);
      (i.chain(f, p, i.out),
        f.frequency.setValueAtTime(d * 1.025, o),
        f.frequency.linearRampToValueAtTime(d * 0.975, o + a),
        cL(p.gain, o, 6e-4, a * 0.45, a * 0.55),
        i.play(a + 0.05));
    },
    mailCopy() {
      let e = OL();
      if (!e || !ML.mail.take(e.ctx.currentTime)) return;
      let t = kL(e, `ui`, 2, 1, 0.2, 0.28);
      if (!t) return;
      let n = t.filter(`lowpass`, 5e3, 0.5);
      (n.connect(t.out),
        [1175, 1568].forEach((e, r) => {
          let i = e * dL(1, 0.008),
            a = t.t + r * 0.09,
            o = t.osc(`sine`, i),
            s = t.osc(`sine`, i * 3),
            c = t.gain(0);
          (t.chain(s, c, o.frequency),
            c.gain.setValueAtTime(i * 1.4, a),
            c.gain.exponentialRampToValueAtTime(i * 0.04, a + 0.4));
          let l = t.gain(0);
          (t.chain(o, l, n), sL(l.gain, a, 0.08, 0.003, 0.8));
        }),
        t.play(1));
    },
    ledTick(e = 1) {
      let t = OL();
      if (!t || !(e > 0.002) || !ML.tick.take(t.ctx.currentTime)) return;
      let n = kL(t, `ui`, 0, Math.min(1, e), 0.2, 0);
      if (!n) return;
      let r = n.osc(`square`, dL(2400, 0.03)),
        i = n.gain(0);
      (n.chain(r, i, n.filter(`lowpass`, 3500, 0.5), n.out),
        sL(i.gain, n.t, 0.02, 0.001, 0.012),
        n.play(0.03));
    },
  });
  var HL = 0.045;
  function nne() {
    try {
      let e = OL();
      if (!e || !ML.hello.take(e.ctx.currentTime)) return;
      let t = kL(e, `ui`, 2, 1, 0, 0.15, HL);
      if (!t) return;
      ([660, 990].forEach((e, n) => {
        let r = t.osc(`sine`, e),
          i = t.gain(0);
        (t.chain(r, i, t.out), sL(i.gain, t.t + n * 0.075, 0.12, 0.004, 0.16));
      }),
        t.play(0.3));
    } catch (e) {
      DL(e);
    }
  }
  function UL(e, t) {
    let n = OL();
    if (!n || !(t > 0.01) || !ML.ambient.take(n.ctx.currentTime)) return;
    let r = kL(n, `ambience`, 0, 0.5 * Math.min(1, t), jL(0.9), 0.6);
    r &&
      NL(
        r,
        e
          ? {
              n: 3 + Math.floor(uL(0, 3)),
              base: uL(1500, 2300),
              d: [0.08, 0.14],
              gap: [0.05, 0.12],
              peak: 0.03,
              attack: 0.018,
              maxHz: 3e3,
              lowpass: 3200,
              trill: [uL(5.5, 7), uL(20, 40)],
              contour: `song`,
            }
          : {
              n: 1 + Math.floor(uL(0, 3)),
              base: uL(2700, 3500),
              d: [0.035, 0.06],
              gap: [0.04, 0.08],
              peak: 0.03,
              attack: 0.008,
              maxHz: 3900,
              lowpass: 4200,
              trill: [uL(30, 50), uL(40, 120)],
              contour: `mixed`,
            },
      );
  }
  var WL = 0.015;
  var GL = 0.009;
  var KL = 0.0015;
  var qL = 0.008;
  var JL = 9e-4;
  var YL = 0.018;
  var XL = 0.5;
  var Soundscape = class {
    ctx;
    wind;
    windLp;
    rumble;
    drone;
    crickets;
    hum;
    whoosh;
    whooshBp;
    sent = new Float64Array(10).fill(-1);
    whooshEnv = 0;
    chirpIn = uL(1.5, 4);
    constructor(e) {
      let t = (this.ctx = e.ctx),
        n = e.ambience,
        r = t.currentTime,
        i = (e, n) => {
          let r = t.createGain();
          return ((r.gain.value = e), n && hL(r, n), r);
        },
        a = (e, n, r, i) => {
          let a = t.createBiquadFilter();
          return (
            (a.type = e),
            (a.frequency.value = n),
            (a.Q.value = r),
            i && a.connect(i),
            a
          );
        },
        o = (e, n) => {
          let i = t.createOscillator();
          return ((i.type = e), (i.frequency.value = n), i.start(r), i);
        },
        s = (e, n, i) => {
          let a = t.createBufferSource();
          return (
            (a.buffer = e),
            (a.loop = !0),
            (a.playbackRate.value = n),
            a.start(r, i % e.duration),
            a
          );
        },
        c = (e, n) => {
          let r = t.createStereoPanner();
          return ((r.pan.value = e), r.connect(n), r);
        };
      this.wind = i(0, n);
      let l = i(0.7, this.wind);
      o(`sine`, 0.087).connect(i(0.18, l.gain));
      let u = o(`sine`, 0.053),
        d = o(`sine`, 0.021),
        f = i(90),
        p = i(45);
      (u.connect(f),
        d.connect(p),
        (this.windLp = [-0.6, 0.6].map((t, n) => {
          let r = s(e.pink, n ? 0.97 : 1, n ? 1.9 : 0),
            i = a(`lowpass`, 520, 0.5, a(`lowpass`, 900, 0.5, c(t, l)));
          return (
            r.connect(a(`highpass`, 110, 0.6, i)),
            f.connect(i.frequency),
            n === 0 && p.connect(i.frequency),
            i
          );
        })),
        (this.rumble = i(0, n)),
        s(e.pink, 0.8, 2.7).connect(a(`lowpass`, 200, 0.7, this.rumble)),
        (this.drone = i(0, n)));
      let m = i(0.75, a(`lowpass`, 900, 0.5, this.drone));
      o(`sine`, 0.08).connect(i(0.25, m.gain));
      for (let [e, t] of [
        [220, 1],
        [277.6, 0.6],
        [329.2, 0.7],
        [440.8, 0.25],
      ])
        o(`sine`, e).connect(i(t, m));
      this.crickets = i(0, n);
      let h = QL(t, 4.8);
      (s(h, 1, 0).connect(this.crickets),
        s(h, 0.917, 2.1).connect(
          a(`lowpass`, 4500, 0.5, c(-0.2, i(0.45, this.crickets))),
        ),
        (this.hum = i(0, n)));
      let g = i(0.8, c(-0.15, this.hum));
      (o(`sine`, 0.21).connect(i(0.2, g.gain)),
        o(`sine`, 120).connect(i(1, g)),
        o(`sine`, 240).connect(i(0.45, g)),
        o(`triangle`, 360).connect(i(0.12, g)),
        (this.whoosh = i(0, n)),
        (this.whooshBp = a(
          `bandpass`,
          400,
          0.8,
          a(`lowpass`, 2600, 0.5, this.whoosh),
        )));
      let _ = i(Math.SQRT1_2, this.whooshBp);
      (s(e.white, 1, 0.3).connect(_), s(e.white, 0.931, 2.2).connect(_));
    }
    update(e, t, n) {
      let r = Number.isFinite(t) ? pL(t, 0, 1) : 0,
        i = 1 - mL(0.12, 0.5, r),
        a = mL(0.5, 0.88, r),
        o = Math.max(0, 1 - i - a),
        s = this.ctx.currentTime;
      this.set(0, this.wind.gain, WL * (i + 0.6 * o + 0.3 * a), s, 0.9);
      let c = 380 * i + 310 * o + 270 * a;
      (this.set(1, this.windLp[0].frequency, c, s, 1.2),
        this.set(2, this.windLp[1].frequency, c * 1.12, s, 1.2),
        this.set(3, this.rumble.gain, GL * (0.25 * i + o + 0.5 * a), s, 0.9),
        this.set(4, this.drone.gain, KL * (o + 0.2 * a), s, 1.2),
        this.set(5, this.crickets.gain, qL * (a + 0.18 * o), s, 1.2),
        this.set(6, this.hum.gain, JL * a, s, 1.2));
      let l = pL(((Number.isFinite(n) ? Math.abs(n) : 0) - XL) / 8.5, 0, 1),
        u = l > this.whooshEnv ? 10 : 3;
      ((this.whooshEnv +=
        (l - this.whooshEnv) * (1 - Math.exp(-Math.min(e, 0.1) * u))),
        l === 0 && this.whooshEnv < 0.001 && (this.whooshEnv = 0));
      let d = this.whooshEnv;
      (this.set(
        7,
        this.whoosh.gain,
        YL * d * Math.sqrt(d) * $I(ZI.scroll),
        s,
        0.05,
      ),
        this.set(8, this.whooshBp.frequency, 350 + 1500 * d, s, 0.05));
      let f = i + 0.7 * o;
      ((this.chirpIn -= Math.min(e, 0.25)),
        this.chirpIn <= 0 &&
          ((this.chirpIn = uL(2.2, 6.5) / Math.max(0.3, f)),
          f > 0.15 && Math.random() < f && UL(o > i, f)));
    }
    set(e, t, n, r, i) {
      let a = this.sent[e];
      (a >= 0 && Math.abs(n - a) <= a * 0.02 + 1e-6) ||
        ((this.sent[e] = n), t.setTargetAtTime(n, r, i));
    }
  };
  function QL(e, t) {
    let n = e.sampleRate,
      r = Math.round(n * t),
      i = e.createBuffer(2, r, n),
      a = i.getChannelData(0),
      o = i.getChannelData(1);
    for (let e of [
      {
        f: 4400,
        period: 0.8,
        pulses: 3,
        rate: 30,
        pan: -0.55,
        amp: 1,
        phase: 0.1,
      },
      {
        f: 4750,
        period: 1.2,
        pulses: 4,
        rate: 27,
        pan: 0.6,
        amp: 0.7,
        phase: 0.45,
      },
      {
        f: 4050,
        period: 0.6,
        pulses: 2,
        rate: 34,
        pan: 0.15,
        amp: 0.45,
        phase: 0.3,
      },
    ]) {
      let i = Math.round(e.f * t) / t,
        s = (2 * Math.PI * i) / n,
        c = ((e.pan + 1) * Math.PI) / 4,
        l = Math.cos(c),
        u = Math.sin(c),
        d = Math.round(t / e.period),
        f = Math.floor((0.62 / e.rate) * n);
      for (let t = 0; t < d; t++) {
        if (Math.random() < 0.12) continue;
        let i = e.amp * uL(0.7, 1),
          c = (t + e.phase) * e.period;
        for (let t = 0; t < e.pulses; t++) {
          let d = Math.floor((c + t / e.rate) * n),
            p = i * (t === 0 ? 0.75 : 1);
          for (let e = 0; e < f; e++) {
            let t = (d + e) % r,
              n = Math.sin((Math.PI * e) / f),
              i = p * n * n * Math.sin(s * t);
            ((a[t] += i * l), (o[t] += i * u));
          }
        }
      }
    }
    let s = 0;
    for (let e = 0; e < r; e++) s = Math.max(s, Math.abs(a[e]), Math.abs(o[e]));
    let c = 0.5 / (s || 1);
    for (let e = 0; e < r; e++) ((a[e] *= c), (o[e] *= c));
    return i;
  }
  var $L = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path class="sound-toggle__body" d="M3.6 9.3h3.1l4.5-3.9v13.2l-4.5-3.9H3.6z"/>
  <path class="sound-toggle__wave sound-toggle__wave--1" d="M15 9.4a3.7 3.7 0 0 1 0 5.2"/>
  <path class="sound-toggle__wave sound-toggle__wave--2" d="M17.6 6.8a7.4 7.4 0 0 1 0 10.4"/>
  <path class="sound-toggle__x" d="M15.4 9.6l4.8 4.8M20.2 9.6l-4.8 4.8"/>
</svg>`;
  var eR = `Tap or click to start the sound`;
  function tR(e) {
    let t = scope.element(`button`);
    return (
      (t.type = `button`),
      (t.className = `sound-toggle`),
      t.setAttribute(`aria-label`, `Sound on/off`),
      t.setAttribute(`aria-pressed`, `false`),
      (t.innerHTML = $L),
      scope.listen(t, `click`, e),
      {
        el: t,
        set(e, n) {
          let r = e && n;
          (t.setAttribute(`aria-pressed`, String(e && !n)),
            t.classList.toggle(`is-pending`, r),
            r ? (t.title = eR) : t.removeAttribute(`title`));
        },
      }
    );
  }
  var nR = `mesq-sound`;
  var rR = null;
  var iR = null;
  var aR = 1;
  var oR = 0;
  var sR = !1;
  var cR = !0;
  var lR = !1;
  var uR = !1;
  var dR = tL() !== null;
  function fR() {
    try {
      return localStorage.getItem(nR) === `on`;
    } catch {
      return !1;
    }
  }
  function pR(e) {
    try {
      localStorage.setItem(nR, e ? `on` : `off`);
    } catch {}
  }
  var mR = () => wL.engine !== null && wL.engine.ctx.state === `running`;
  function hR() {
    let e = mR();
    (e && (sR = !1), iR?.set(wL.on, wL.on && !e));
  }
  function gR() {
    let e = navigator.userActivation;
    return !e || e.isActive;
  }
  function _R(e, t, n, r) {
    let i = e.value;
    (e.cancelScheduledValues(n),
      e.setValueAtTime(i, n),
      e.linearRampToValueAtTime(t, n + Math.max(0.005, r)));
  }
  function vR(e) {
    let t = wL.engine;
    if (!t) return;
    let n = t.ctx.currentTime;
    (_R(t.fade.gain, 1, n, e ? 0.03 : 0.3), _R(t.bed.gain, 1, n, 0.8));
  }
  function yR(e) {
    let t = wL.engine;
    if (!t) return;
    let n = t.ctx.currentTime;
    (_R(t.fade.gain, 0, n, e), _R(t.bed.gain, 0, n, e));
  }
  var bR = (e) => scope.frame(() => scope.timeout(e, 0));
  function xR() {
    if (soundDisposed) return false;
    let e = nL();
    if (!e) return !1;
    ((wL.engine = e),
      bR(() => {
        wL.engine === e &&
          (e.white,
          e.pink,
          bR(() => {
            if (!(wL.engine !== e || rR))
              try {
                rR = new Soundscape(e);
              } catch (e) {
                ((rR = null), DL(e));
              }
          }));
      }),
      OR(),
      (e.ctx.onstatechange = hR));
    try {
      let e = navigator.audioSession;
      e && (e.type = `ambient`);
    } catch {}
    return !0;
  }
  function SR(e) {
    if (!wL.on || document.hidden) return;
    if ((scope.clearTimeout(oR), !wL.engine)) {
      if (!gR()) return;
      if (!xR()) {
        ((wL.on = !1), pR(!1), hR());
        return;
      }
    }
    let t = wL.engine,
      n = () => {
        if ((hR(), !wL.on || document.hidden)) return CR(0);
        t.ctx.state === `running` && ((uR = !1), vR(e), e && nne());
      };
    t.ctx.state === `running` ? n() : t.ctx.resume().then(n, hR);
  }
  function CR(e) {
    let t = wL.engine;
    t &&
      (yR(e),
      scope.clearTimeout(oR),
      (oR = scope.timeout(
        () => {
          (!wL.on || document.hidden) &&
            t.ctx.state === `running` &&
            t.ctx.suspend().then(hR, hR);
        },
        e * 1e3 + 60,
      )));
  }
  function wR(e) {
    if (soundDisposed) return;
    if (dR) {
      if (((e = !!e), e === wL.on)) {
        e && (!mR() || uR) && SR(!0);
        return;
      }
      ((wL.on = e), pR(e), e ? SR(!0) : CR(0.25), hR());
    }
  }
  function TR() {
    if (soundDisposed) return;
    !dR ||
      wL.engine ||
      lR ||
      ((lR = !0),
      bR(() => {
        ((lR = !1),
          !(wL.engine || document.hidden || !gR()) &&
            xR() &&
            ((uR = !0),
            scope.timeout(() => {
              let e = wL.engine;
              uR &&
                e &&
                e.ctx.state === `running` &&
                e.ctx.suspend().then(hR, hR);
            }, 1500)));
      }));
  }
  var ER = new Float64Array(7).fill(-1);
  function DR(e, t, n, r) {
    ER[e] !== n && ((ER[e] = n), t.setTargetAtTime(n, r, 0.03));
  }
  function OR() {
    let e = wL.engine;
    if (!e) return;
    let t = e.ctx.currentTime;
    (DR(0, e.master.gain, aR * aR * $I(ZI.master), t),
      DR(1, e.ambience.gain, $I(ZI.ambience), t),
      DR(2, e.sfx.gain, $I(ZI.sfx), t),
      DR(3, e.helper.gain, $I(ZI.helper), t),
      DR(4, e.birds.gain, $I(ZI.birds), t),
      DR(5, e.ui.gain, $I(ZI.ui), t),
      DR(6, e.verbOut.gain, eL * $I(ZI.reverb), t));
  }
  function kR(e) {
    cR &&
      wL.on &&
      !mR() &&
      !document.hidden &&
      ((iR && e.target instanceof Node && iR.el.contains(e.target)) || SR(!1));
  }
  function AR() {
    if (wL.on && !mR() && !sR) {
      ((sR = !0), SR(!0));
      return;
    }
    let e = !wL.on;
    ((sR = e), wR(e));
  }
  function jR() {
    (document.querySelector(`.sound-toggle`)?.remove(), (iR = tR(AR)));
    let e =
      document.getElementById(`menu-panel`) ?? document.getElementById(`menu`);
    (e && e.parentElement === document.body
      ? e.after(iR.el)
      : document.body.append(iR.el),
      hR());
  }
  if (dR) {
    wL.on = fR();
    for (let e of [`pointerdown`, `pointerup`, `touchend`, `keydown`, `click`])
      scope.listen(window, e, kR, {
        capture: !0,
        passive: !0,
      });
    (scope.listen(document, `visibilitychange`, () => {
      wL.engine && (document.hidden ? CR(0.05) : wL.on && SR(!1));
    }),
      document.body
        ? jR()
        : scope.listen(document, `DOMContentLoaded`, jR, {
            once: !0,
          }));
  }
  var sound = {
    get enabled() {
      return wL.on;
    },
    get audible() {
      return wL.on && mR() && !document.hidden;
    },
    supported: dR,
    toggle() {
      AR();
    },
    setEnabled: wR,
    prepare: TR,
    get autoStart() {
      return cR;
    },
    set autoStart(e) {
      cR = !!e;
    },
    get volume() {
      return aR;
    },
    set volume(e) {
      (Number.isFinite(e) && (aR = pL(e, 0, 1)), OR());
    },
    update(e, t, n) {
      if (wL.on && mR())
        try {
          (OR(), rR?.update(Number.isFinite(e) ? Math.max(0, e) : 0, t, n));
        } catch (e) {
          DL(e);
        }
    },
    sfx: VL,
    tuning: ZI,
    get voices() {
      return bL();
    },
    get button() {
      return iR?.el ?? null;
    },
    async dispose() {
      if (soundDisposed) return;
      soundDisposed = true;
      wL.on = false;
      cR = false;
      lR = uR = sR = false;
      scope.clearTimeout(oR);
      oR = 0;
      const engine = wL.engine;
      wL.engine = null;
      rR = null;
      iR?.el.remove();
      iR = null;
      TL?.done();
      TL = null;
      yL = 0;
      if (FL) {
        try {
          FL.osc.stop();
        } catch {}
        FL.env.disconnect();
        FL = null;
      }
      if (engine) {
        engine.ctx.onstatechange = null;
        engine.master.disconnect();
        if (engine.ctx.state !== "closed")
          await engine.ctx.close().catch(() => {});
      }
    },
  };
  scope.defer(() => sound.dispose());
  return {
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
    sound,
  };
}
