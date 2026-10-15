// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  Color,
  MathUtils,
  Matrix3,
  Mesh,
  Quaternion,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three/webgpu";
import {
  abs,
  clamp,
  dot,
  float,
  Fn,
  fwidth,
  inverseSqrt,
  length,
  max,
  mix,
  mrt,
  normalize,
  normalView,
  output,
  positionGeometry,
  positionViewDirection,
  sin,
  smoothstep,
  sqrt,
  transformNormalToView,
  uniform,
  varying,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
export function createHelperModule(
  scope,
  {
    paletteModule,
    renderingModule,
    audioModule,
    signpostModule,
    demoShowcaseModule,
  },
) {
  const { inkPurple, palette, LF } = paletteModule;
  const { cI, RI, createToonMaterial } = renderingModule;
  const { sound } = audioModule;
  const { EZ } = signpostModule;
  const { C3, w3, T3 } = demoShowcaseModule;
  function E3() {
    let e = float(T3),
      t = {
        face: uniform(new Matrix3()),
        eyeOpen: uniform(1),
        eyeShow: uniform(1),
        eyeLook: uniform(new Vector2()),
        mouth: uniform(0),
        squashY: uniform(0),
        wobble: uniform(0),
        wobblePhase: uniform(0),
        grounded: uniform(1),
      },
      n = {
        body: uniform(new Color(LF)),
        eyeColor: uniform(new Color(inkPurple)),
        eyeSize: uniform(1),
        eyeSpacing: uniform(0.25),
        eyeHeight: uniform(0.08),
        sparkle: uniform(1),
        mouthSize: uniform(1),
        rim: uniform(1),
        glow: uniform(0.26),
        nightGlow: uniform(0.26),
        night: uniform(0),
        bloom: uniform(0),
      },
      r = Fn(() => {
        let n = positionGeometry.toVar(),
          r = normalize(positionGeometry),
          i = sin(
            dot(r, vec3(0.9, 0.55, 0.3))
              .mul(6)
              .add(t.wobblePhase),
          ),
          a = sin(
            dot(r, vec3(-0.35, 0.9, 0.75))
              .mul(8.5)
              .sub(t.wobblePhase.mul(1.37)),
          ),
          o = sin(r.y.mul(4).add(t.wobblePhase.mul(0.71)));
        n.addAssign(
          r.mul(i.add(a.mul(0.7)).add(o.mul(0.5)).mul(t.wobble).mul(e)),
        );
        let s = t.squashY.add(1);
        return (
          n.assign(
            vec3(n.x.mul(inverseSqrt(s)), n.y.mul(s), n.z.mul(inverseSqrt(s))),
          ),
          n.y.addAssign(e.mul(s.sub(1)).mul(t.grounded)),
          n
        );
      })(),
      i = varying(normalize(positionGeometry), `vBallDir`),
      a = Fn(() => {
        let e = t.squashY.add(1);
        return normalize(
          transformNormalToView(
            normalize(i.mul(vec3(sqrt(e), float(1).div(e), sqrt(e)))),
          ),
        );
      })(),
      o = t.face.mul(i),
      s = vec2(o.x, o.y).sub(t.eyeLook),
      c = smoothstep(0.2, 0.45, o.z),
      l = (e, t, n) => {
        let r = t.min(n),
          i = abs(s.sub(e)).sub(vec2(t, n).sub(r));
        return length(max(i, 0)).add(i.x.max(i.y).min(0)).sub(r);
      },
      u = n.eyeSize,
      d = float(0.1).mul(u).mul(t.eyeShow),
      f = mix(float(0.02), float(0.22), t.eyeOpen).mul(u).mul(t.eyeShow),
      p = (e) => l(vec2(n.eyeSpacing.mul(e), n.eyeHeight), d, f),
      m = p(-1).min(p(1)),
      h = w3(m, fwidth(m).max(0.0015))
        .mul(c)
        .mul(smoothstep(0.02, 0.12, t.eyeShow)),
      g = (e) => {
        let r = vec2(
            n.eyeSpacing.mul(e).add(u.mul(0.034)),
            n.eyeHeight.add(u.mul(t.eyeOpen).mul(0.12)),
          ),
          i = length(s.sub(r)).sub(u.mul(0.026));
        return w3(i, fwidth(i).max(0.001));
      },
      _ = g(-1)
        .add(g(1))
        .mul(smoothstep(0.7, 1, t.eyeOpen))
        .mul(h)
        .mul(n.sparkle),
      v = n.mouthSize,
      y = mix(float(0.012), float(0.075), t.mouth).mul(v),
      b = vec2(0, n.eyeHeight.sub(0.33).sub(y.mul(0.4))),
      x = l(b, mix(float(0.05), float(0.075), t.mouth).mul(v), y),
      S = w3(x, fwidth(x).max(0.0015))
        .mul(c)
        .mul(smoothstep(0.03, 0.12, t.mouth))
        .mul(smoothstep(0, 0.1, v))
        .mul(t.eyeShow.clamp(0, 1)),
      C = length(s.sub(b.sub(vec2(0, y.mul(0.95))))).sub(y.mul(0.85)),
      w = w3(C, fwidth(C).max(0.0015))
        .mul(S)
        .mul(smoothstep(0.35, 0.7, t.mouth)),
      T = mix(
        mix(mix(n.body, n.eyeColor, h.max(S)), C3(palette.pink), w),
        vec3(1),
        _,
      ),
      E = createToonMaterial(
        {
          color: LF,
        },
        {
          wear: !1,
          creature: !0,
        },
      );
    ((E.name = `HelperBall`),
      (E.positionNode = r),
      (E.normalNode = a),
      (E.colorNode = T));
    let D = clamp(dot(normalView, positionViewDirection), 0, 1).oneMinus(),
      ee = dot(normalView, normalize(vec3(0.85, 0.3, 0.1))),
      te = smoothstep(RI.width, RI.width.add(0.04), D).mul(
        smoothstep(RI.side, RI.side.add(0.1), ee),
      ),
      O = RI.color.mul(te).mul(RI.strength.mul(RI.level)).mul(n.rim.sub(1));
    return (
      (E.emissiveNode = T.mul(n.glow.add(n.nightGlow.mul(n.night))).add(O)),
      (E.mrtNode = mrt({
        emissive: vec4(output.rgb.mul(n.bloom), 1),
      })),
      {
        material: E,
        uniforms: t,
        look: n,
      }
    );
  }
  var D3 = `http://www.w3.org/2000/svg`;
  var O3 = {
    x: -15,
    y: -7,
  };
  var k3 = 200;
  var A3 = 0.17;
  var j3 = 0.07;
  var M3 = 0.38;
  var N3 = 4;
  var P3 = 0;
  var F3 = /[\p{L}\p{N}]/u;
  function I3(e, t) {
    if (!t) return -1;
    for (let n = e.indexOf(t); n >= 0; n = e.indexOf(t, n + 1)) {
      let r = e[n - 1],
        i = e[n + t.length];
      if ((!r || !F3.test(r)) && (!i || !F3.test(i))) return n;
    }
    return -1;
  }
  var L3 = (e, t, n) => {
    let r = scope.elementNS(D3, e);
    for (let [e, n] of Object.entries(t)) r.setAttribute(e, String(n));
    return (n?.append(r), r);
  };
  var R3 = (e, t, n) => {
    let r = scope.element(e);
    return ((r.className = t), n?.append(r), r);
  };
  var SpeechBubble = class {
    tuning = {
      charsPerSecond: 62,
      readTimePerChar: 0.045,
      minPageTime: 1.8,
    };
    onStart;
    onClose;
    onCue;
    root;
    bubble;
    live;
    tag;
    shown;
    rest;
    dots;
    more;
    path;
    corner;
    reduced = cI;
    pages = [];
    page = -1;
    text = ``;
    typed = 0;
    count = 0;
    pause = 0;
    read = 0;
    idle = 0;
    opts = {};
    open = !1;
    hovered = !1;
    closeTimer = 0;
    size = {
      w: 0,
      h: 0,
      side: !1,
    };
    probe = null;
    cueAt = [];
    cueEnd = [];
    cueTarget = [];
    cueNext = 0;
    holdNext = 0;
    pointing = !1;
    constructor(e = document.body) {
      let t = `mesq-speech-${++P3}`;
      ((this.root = R3(`div`, `mesq-speech`, e)),
        (this.live = R3(`div`, `mesq-speech__live`, this.root)),
        this.live.setAttribute(`role`, `status`),
        this.live.setAttribute(`aria-live`, `polite`),
        (this.bubble = R3(`div`, `mesq-speech__bubble`, this.root)),
        this.bubble.setAttribute(`aria-hidden`, `true`),
        (this.bubble.hidden = !0));
      let n = L3(
          `svg`,
          {
            class: `mesq-speech__shape`,
            "aria-hidden": `true`,
            focusable: `false`,
          },
          this.bubble,
        ),
        r = L3(`defs`, {}, n);
      this.path = L3(
        `path`,
        {
          id: `${t}-p`,
        },
        r,
      );
      let i = L3(
        `clipPath`,
        {
          id: `${t}-c`,
        },
        r,
      );
      (L3(
        `use`,
        {
          href: `#${t}-p`,
        },
        i,
      ),
        L3(
          `circle`,
          {
            cx: 2.5,
            cy: 2.5,
            r: 1.15,
            class: `mesq-speech__dot`,
          },
          L3(
            `pattern`,
            {
              id: `${t}-d`,
              width: 5,
              height: 5,
              patternUnits: `userSpaceOnUse`,
              patternTransform: `rotate(45)`,
            },
            r,
          ),
        ));
      let a = L3(
        `radialGradient`,
        {
          id: `${t}-g`,
          cx: 1,
          cy: 0,
          r: 0.75,
        },
        r,
      );
      (L3(
        `stop`,
        {
          offset: 0.15,
          "stop-color": `#fff`,
        },
        a,
      ),
        L3(
          `stop`,
          {
            offset: 1,
            "stop-color": `#000`,
          },
          a,
        ));
      let o = L3(
        `mask`,
        {
          id: `${t}-m`,
          maskContentUnits: `objectBoundingBox`,
        },
        r,
      );
      (L3(
        `rect`,
        {
          width: 1,
          height: 1,
          fill: `url(#${t}-g)`,
        },
        o,
      ),
        L3(
          `use`,
          {
            href: `#${t}-p`,
            class: `mesq-speech__plate mesq-speech__plate--cyan`,
          },
          n,
        ),
        L3(
          `use`,
          {
            href: `#${t}-p`,
            class: `mesq-speech__plate mesq-speech__plate--pink`,
          },
          n,
        ),
        L3(
          `use`,
          {
            href: `#${t}-p`,
            class: `mesq-speech__paper`,
          },
          n,
        ),
        (this.corner = L3(
          `rect`,
          {
            fill: `url(#${t}-d)`,
            "clip-path": `url(#${t}-c)`,
            mask: `url(#${t}-m)`,
          },
          n,
        )),
        L3(
          `use`,
          {
            href: `#${t}-p`,
            class: `mesq-speech__line`,
          },
          n,
        ),
        (this.tag = R3(`span`, `mesq-speech__tag`, this.bubble)));
      let s = R3(`p`, `mesq-speech__text`, this.bubble);
      ((this.shown = R3(`span`, ``, s)),
        (this.rest = R3(`span`, `mesq-speech__rest`, s)));
      let c = R3(`span`, `mesq-speech__foot`, this.bubble);
      ((this.dots = R3(`span`, `mesq-speech__dots`, c)),
        (this.more = R3(`span`, `mesq-speech__more`, c)));
      let l = R3(`button`, `mesq-speech__close`, this.bubble);
      ((l.type = `button`),
        (l.tabIndex = -1),
        (l.textContent = `×`),
        scope.listen(l, `click`, (e) => {
          (e.stopPropagation(), this.close(`dismissed`));
        }),
        scope.listen(this.bubble, `click`, () => this.advance()),
        scope.listen(
          this.bubble,
          `pointerenter`,
          (e) => (this.hovered = e.pointerType !== `touch`),
        ),
        scope.listen(this.bubble, `pointerleave`, () => (this.hovered = !1)),
        scope.listen(window, `keydown`, (e) => {
          e.key === `Escape` && this.open && this.close(`dismissed`);
        }),
        scope.resizeObserver(() => this.draw()).observe(this.bubble));
    }
    get bottom() {
      return this.root.getBoundingClientRect().bottom;
    }
    heightOf(e) {
      if (!this.probe) {
        let e = R3(`div`, `mesq-speech`, document.body);
        (e.setAttribute(`aria-hidden`, `true`),
          (e.style.visibility = `hidden`));
        let t = R3(`div`, `mesq-speech__bubble`, e);
        R3(`span`, `mesq-speech__tag`, t).textContent = `MESQ`;
        let n = R3(`p`, `mesq-speech__text`, t);
        (R3(`span`, `mesq-speech__foot`, t),
          (this.probe = {
            bubble: t,
            text: n,
          }));
      }
      let { bubble: t, text: n } = this.probe;
      t.classList.toggle(`has-pages`, e.length > 1);
      let r = 0;
      for (let i of e)
        ((n.textContent = i.trim()), (r = Math.max(r, t.offsetHeight)));
      return r > 0 ? r + N3 : 0;
    }
    get speaking() {
      return this.open;
    }
    get talking() {
      return this.open && this.count < this.text.length && this.pause <= 0;
    }
    get waiting() {
      return this.open
        ? this.count < this.text.length
          ? 0
          : this.page < this.pages.length - 1
            ? this.idle
            : -1
        : -1;
    }
    say(e, t = {}) {
      sound.sfx.helperOpen();
      let n = (Array.isArray(e) ? e : [e]).map((e) => e.trim()).filter(Boolean);
      if (!n.length) return;
      (this.open && this.finish(`replaced`),
        scope.clearTimeout(this.closeTimer),
        (this.pages = n),
        (this.opts = t),
        (this.open = !0),
        (this.tag.textContent = t.label ?? `MESQ`),
        (this.tag.hidden = !this.tag.textContent),
        (this.bubble.hidden = !1),
        this.bubble.classList.remove(`is-closing`),
        this.restart(`is-popping`));
      let r = Math.floor(t.startPage ?? 0);
      (this.showPage(
        Number.isFinite(r) ? Math.min(Math.max(0, r), n.length - 1) : 0,
        !1,
      ),
        this.onStart?.());
    }
    advance() {
      return this.open
        ? (this.count < this.text.length
            ? (this.reveal(this.text.length), (this.pause = 0))
            : this.page < this.pages.length - 1
              ? this.showPage(this.page + 1)
              : this.close(`dismissed`),
          !0)
        : !1;
    }
    silence() {
      this.close(`silenced`);
    }
    dismiss() {
      this.close(`dismissed`);
    }
    close(e) {
      this.open &&
        (this.finish(e),
        sound.sfx.helperClose(),
        this.bubble.classList.remove(`is-popping`, `is-turning`),
        this.bubble.classList.add(`is-closing`),
        scope.clearTimeout(this.closeTimer),
        (this.closeTimer = scope.timeout(
          () => (this.bubble.hidden = !0),
          this.reduced?.matches ? 0 : k3,
        )));
    }
    update(e) {
      if (!this.open) return;
      let t = this.text.length;
      if (this.count < t) {
        if (this.pause > 0) {
          this.pause -= e;
          return;
        }
        this.typed += e * Math.max(1, this.tuning.charsPerSecond);
        let n = Math.min(t, Math.floor(this.typed));
        for (let e = this.count; e < n; e++) {
          let r =
              this.holdNext < this.cueEnd.length &&
              this.cueEnd[this.holdNext] === e + 1
                ? M3
                : 0,
            i = this.text[e],
            a = this.text[e + 1] ?? ` `;
          if (
            ((a === ` ` ||
              a ===
                `
`) &&
              (r = Math.max(
                r,
                `.!?…`.includes(i) ? A3 : `,;:—–`.includes(i) ? j3 : 0,
              )),
            r > 0 && e + 1 < t)
          ) {
            ((n = e + 1), (this.typed = n), (this.pause = r));
            break;
          }
        }
        let r = this.text.charCodeAt(n);
        (n > 0 && n < t && r >= 56320 && r <= 57343 && n++,
          n !== this.count &&
            (n > this.count && sound.sfx.helperBlip(this.text[n - 1]),
            this.reveal(n)));
        return;
      }
      if (
        ((this.idle += e),
        this.pages.length > 1 || this.hovered || !(this.opts.autoClose ?? !0))
      )
        return;
      this.read += e;
      let n = this.tuning;
      this.read < Math.max(n.minPageTime, t * n.readTimePerChar) ||
        this.close(`done`);
    }
    showPage(e, t = e > 0) {
      ((this.page = e),
        (this.text = this.pages[e]),
        (this.typed = this.count = 0),
        (this.pause = this.read = this.idle = 0),
        (this.live.textContent = this.text),
        this.bubble.style.setProperty(
          `--speech-tilt`,
          `${e % 2 ? 0.9 : -1.4}deg`,
        ),
        t && this.restart(`is-turning`),
        this.dots.replaceChildren(
          ...(this.pages.length > 1
            ? this.pages.map((t, n) => R3(`i`, n === e ? `is-current` : ``))
            : []),
        ),
        this.bubble.classList.toggle(`has-pages`, this.pages.length > 1),
        this.bubble.classList.toggle(`has-more`, e < this.pages.length - 1),
        (this.more.textContent = e < this.pages.length - 1 ? `next` : `close`),
        this.bubble.classList.toggle(`is-last`, e === this.pages.length - 1),
        this.findCues(),
        this.cueAt.length || this.cue(null),
        this.reveal(this.reduced?.matches ? this.text.length : 0));
    }
    findCues() {
      let e = this.cueAt,
        t = this.cueEnd,
        n = this.cueTarget;
      ((e.length = t.length = n.length = 0),
        (this.cueNext = this.holdNext = 0));
      for (let r of this.opts.cues ?? []) {
        if (r.page !== this.page) continue;
        let i = I3(this.text, r.word);
        if (i < 0) continue;
        let a = e.length;
        for (; a > 0 && e[a - 1] > i;) a--;
        (e.splice(a, 0, i),
          t.splice(a, 0, i + r.word.length),
          n.splice(a, 0, r.target));
      }
    }
    cue(e) {
      (e !== null || this.pointing) &&
        ((this.pointing = e !== null), this.onCue?.(e));
    }
    reveal(e) {
      for (
        this.count = e,
          this.typed = Math.max(this.typed, e),
          this.shown.textContent = this.text.slice(0, e),
          this.rest.textContent = this.text.slice(e),
          this.bubble.classList.toggle(`is-typed`, e >= this.text.length);
        this.cueNext < this.cueAt.length && this.cueAt[this.cueNext] < e;
      )
        this.cue(this.cueTarget[this.cueNext++]);
      for (
        ;
        this.holdNext < this.cueEnd.length && this.cueEnd[this.holdNext] <= e;
      )
        this.holdNext++;
    }
    finish(e) {
      let t = this.page,
        n = this.count >= this.text.length;
      ((this.open = !1),
        (this.hovered = !1),
        (this.live.textContent = ``),
        (this.cueAt.length = this.cueEnd.length = this.cueTarget.length = 0),
        this.cue(null));
      let r = this.opts.onClose;
      ((this.opts = {}), r?.(e, t, n), this.onClose?.());
    }
    restart(e) {
      (this.bubble.classList.remove(`is-popping`, `is-turning`),
        this.bubble.offsetWidth,
        this.bubble.classList.add(e));
    }
    draw() {
      let e = this.bubble.offsetWidth,
        t = this.bubble.offsetHeight,
        n =
          getComputedStyle(this.root)
            .getPropertyValue(`--speech-tail`)
            .trim() === `side`;
      if (
        !e ||
        !t ||
        (e === this.size.w && t === this.size.h && n === this.size.side)
      )
        return;
      this.size = {
        w: e,
        h: t,
        side: n,
      };
      let r = Math.min(18, t / 2 - 1),
        i = (e) => e.toFixed(1);
      if (n) return this.drawSide(e, t, r, i);
      let a = Math.min(50, e - r - 4),
        o = Math.min(28, a - 12),
        s = {
          x: 2,
          y: t + 20,
        },
        c = [
          `M${i(r)} 0`,
          `Q${i(e / 2)} -2.2 ${i(e - r)} 0.4`,
          `Q${i(e + 0.6)} -0.4 ${i(e)} ${i(r)}`,
          `Q${i(e + 1.8)} ${i(t / 2)} ${i(e - 0.3)} ${i(t - r)}`,
          `Q${i(e)} ${i(t + 0.5)} ${i(e - r)} ${i(t)}`,
          `Q${i((e + a) / 2)} ${i(t + 1.6)} ${i(a)} ${i(t)}`,
          `Q${i(a - 6)} ${i(t + 9)} ${i(s.x)} ${i(s.y)}`,
          `Q${i(o - 2)} ${i(t + 7)} ${i(o)} ${i(t - 0.2)}`,
          `Q${i(o / 2 + r / 2)} ${i(t + 0.4)} ${i(r)} ${i(t)}`,
          `Q0.3 ${i(t + 0.2)} 0.2 ${i(t - r)}`,
          `Q-1.6 ${i(t / 2)} 0 ${i(r)}`,
          `Q0 -0.3 ${i(r)} 0Z`,
        ].join(` `);
      (this.path.setAttribute(`d`, c),
        this.corner.setAttribute(`width`, String(e)),
        this.corner.setAttribute(`height`, String(t)));
    }
    drawSide(e, t, n, r) {
      let i = Math.min(n + 10, e / 3),
        a = Math.max(n, t - n - 10),
        o = {
          x: O3.x,
          y: t + O3.y,
        },
        s = [
          `M${r(n)} 0`,
          `Q${r(e / 2)} -2.2 ${r(e - n)} 0.4`,
          `Q${r(e + 0.6)} -0.4 ${r(e)} ${r(n)}`,
          `Q${r(e + 1.8)} ${r(t / 2)} ${r(e - 0.3)} ${r(t - n)}`,
          `Q${r(e)} ${r(t + 0.5)} ${r(e - n)} ${r(t)}`,
          `Q${r((e + i) / 2)} ${r(t + 1.6)} ${r(i)} ${r(t)}`,
          `Q${r(i * 0.35)} ${r(t + 2.2)} ${r(o.x)} ${r(o.y)}`,
          `Q${r(-2.5)} ${r((a + t) / 2 + 2)} ${r(0)} ${r(a)}`,
          `Q-1.6 ${r((a + n) / 2)} 0 ${r(n)}`,
          `Q0 -0.3 ${r(n)} 0Z`,
        ].join(` `);
      (this.path.setAttribute(`d`, s),
        this.corner.setAttribute(`width`, String(e)),
        this.corner.setAttribute(`height`, String(t)));
    }
  };
  var B3 = 3;
  var V3 = 1.1;
  var H3 = Math.PI * 2;
  var U3 = new Vector3(0, 1, 0);
  var W3 = (e, t) => e + Math.random() * (t - e);
  var G3 = MathUtils.clamp;
  var K3 = (e, t) => 1 - Math.exp(-Math.max(0, e) * t);
  var q3 = (e) =>
    e <= 0
      ? 0
      : e >= 1
        ? 1
        : 2 ** (-10 * e) * Math.sin((e * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  var J3 = (e) => (e < 0.5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2);
  var HelperSpring = class {
    x;
    k;
    c;
    v = 0;
    constructor(e, t, n) {
      ((this.x = e), (this.k = t), (this.c = n));
    }
    ratio(e) {
      return ((this.c = 2 * e * Math.sqrt(this.k)), this);
    }
    step(e, t) {
      let n = Math.max(1, Math.ceil(t * 30 - 1e-6)),
        r = t / n;
      for (let t = 0; t < n; t++)
        ((this.v += ((e - this.x) * this.k - this.v * this.c) * r),
          (this.x += this.v * r));
      return (
        (!Number.isFinite(this.x) || !Number.isFinite(this.v)) &&
          ((this.x = e), (this.v = 0)),
        this.x
      );
    }
  };
  var X3 = {
    followPointer: !0,
    idleLife: !0,
    hopHeight: 1,
    gravity: 28,
    clickHop: 0.3,
    nudgeHop: 0.35,
    turnHop: 0.5,
    turnRoll: !0,
    hoverAmount: 1.5,
    squash: 1,
    jiggle: 0.4,
    springiness: 0.3,
    breathe: 0.6,
    talkBob: 0.5,
    talkMouth: 1,
    restMouth: 0.9,
    talkRate: 4.5,
    idleAmount: 0.5,
    idleEvery: 14,
    followAmount: 0.85,
    followNear: 340,
    followSpeed: 6,
    lookAround: 1,
    lookEvery: 2.6,
    scrollGlance: 0.5,
    blinkEvery: 3.6,
  };
  var Helper = class {
    mesh;
    tuning = {
      ...X3,
    };
    look;
    onSpeechEnd;
    onCue;
    u;
    speech;
    fallbackSpeechTuning = {
      charsPerSecond: 62,
      readTimePerChar: 0.045,
      minPageTime: 1.8,
    };
    anchor = new Vector3();
    center = new Vector2();
    radius = 0.05;
    pxRadius = 33;
    appear = -0.6;
    held = !1;
    clock = 0;
    prewarm = !1;
    warmFrames = 1;
    hopY = 0;
    hopV = 0;
    airborne = !1;
    airTime = 0;
    squash = new HelperSpring(0, 150, 0);
    lean = new HelperSpring(0, 60, 0).ratio(0.85);
    jiggle = 0;
    wobblePhase = 0;
    roll = {
      axis: new Vector3(1, 0, 0),
      t: 1,
    };
    spin = new Quaternion();
    eyeShow = new HelperSpring(0, 380, 36);
    eyeOpen = new HelperSpring(0, 200, 0).ratio(0.6);
    blinkTime = -1;
    nextBlink = 2.5;
    face = new Vector3(0, 0, 1);
    faceTarget = new Vector3(0, 0, 1);
    fRight = new Vector3();
    fUp = new Vector3();
    fFwd = new Vector3();
    pointer = new Vector2();
    pointerIdle = 99;
    focus = new Vector2();
    focusIdle = 99;
    focusing = 0;
    gaze = new Vector2();
    gazeHold = W3(1.5, 2.5);
    atViewer = new Vector2();
    scrollSpeed = 0;
    scrollLook = 0;
    nextIdle = W3(8, 14);
    hovered = !1;
    hover = 0;
    talk = 0;
    talkPhase = 0;
    constructor() {
      let { material: e, uniforms: t, look: n } = E3();
      ((this.u = t),
        (this.look = n),
        (this.speech = typeof document > `u` ? null : new SpeechBubble()),
        this.speech &&
          ((this.speech.onStart = () => this.hop(this.tuning.clickHop)),
          (this.speech.onClose = () => this.onSpeechEnd?.()),
          (this.speech.onCue = (e) => this.onCue?.(e))),
        (this.mesh = new Mesh(new SphereGeometry(T3, 48, 32), e)),
        (this.mesh.name = `Helper`),
        (this.mesh.frustumCulled = !1),
        (this.mesh.castShadow = this.mesh.receiveShadow = !1),
        this.mesh.scale.setScalar(1e-4));
    }
    get glow() {
      return this.look.glow;
    }
    get bloom() {
      return this.look.bloom;
    }
    setPrewarm(e) {
      ((this.prewarm = e), e && (this.mesh.visible = !0));
    }
    hold(e) {
      this.held = e;
    }
    get speechTuning() {
      return this.speech?.tuning ?? this.fallbackSpeechTuning;
    }
    get shown() {
      return this.appear >= 1;
    }
    get speaking() {
      return this.speech?.speaking ?? !1;
    }
    get talking() {
      return this.speech?.talking ?? !1;
    }
    get waiting() {
      return this.speech?.waiting ?? -1;
    }
    say(e, t) {
      this.speech?.say(e, t);
    }
    advance() {
      return this.speech?.advance() ?? !1;
    }
    silence() {
      this.speech?.silence();
    }
    dismiss() {
      this.speech?.dismiss();
    }
    speechRoom(e) {
      if (!this.speech) return null;
      let t = this.speech.bottom;
      return {
        top: t - this.speech.heightOf(e),
        bottom: t,
      };
    }
    layout(e, t, n = window.innerHeight, r = window.innerWidth) {
      let i = Math.max(1, n),
        a = t.getBoundingClientRect(),
        o = (6 * Math.tan(MathUtils.degToRad(e.fov / 2))) / i;
      (this.center.set(a.left + a.width / 2, a.top + a.height / 2),
        this.anchor.set(
          (this.center.x - r / 2) * o,
          (i / 2 - this.center.y) * o,
          -3,
        ),
        this.atViewer.set(-this.anchor.x / B3, -this.anchor.y / B3),
        (this.pxRadius = Math.max(1, (a.width / 2) * 0.92)),
        (this.radius = this.pxRadius * o));
    }
    watch(e, t) {
      (this.pointer.set(e, t), (this.pointerIdle = 0));
    }
    lookAt(e, t) {
      (this.focus.set(e, t), (this.focusIdle = 0));
    }
    setScrollSpeed(e) {
      this.scrollSpeed = Number.isFinite(e) ? e : 0;
    }
    hop(e = 0.5) {
      let t = 0.6 * e * this.tuning.hopHeight;
      if (this.airborne || this.appear < 1 || !(t > 0)) return;
      let n = Math.sqrt(2 * this.gravity * t);
      ((this.airborne = !0),
        (this.airTime = 0),
        (this.hopV = n),
        (this.squash.v += n * 0.3 * this.tuning.squash),
        (this.jiggle += n * 0.0012 * this.tuning.jiggle));
    }
    turn(e) {
      (this.hop(this.tuning.turnHop),
        this.tuning.turnRoll && this.rollOver(Math.sign(e) || 1, 0, 0));
    }
    nudge() {
      this.hop(this.tuning.nudgeHop);
    }
    flip() {
      (this.hop(0.8), this.rollOver(0, 0, Math.random() < 0.5 ? 1 : -1));
    }
    setHover(e) {
      if (e && !this.hovered && this.appear >= 1) {
        let e = Math.max(0, this.tuning.hoverAmount);
        ((this.squash.v += 0.55 * e), (this.jiggle += 0.004 * e));
      }
      this.hovered = e;
    }
    get gravity() {
      return Math.max(5, this.tuning.gravity);
    }
    rollOver(e, t, n) {
      this.roll.t < 1 ||
        (this.roll.axis.set(e, t, n).normalize(), (this.roll.t = 0));
    }
    update(e) {
      let t = this.tuning,
        n = this.u;
      ((this.clock += e),
        this.held || (this.appear += e),
        this.squash.ratio(G3(0.8 - 0.65 * t.springiness, 0.08, 1.5)),
        (this.hover +=
          (+!!this.hovered - this.hover) * K3(this.hovered ? 6 : 3, e)));
      let r = this.hover * Math.max(0, t.hoverAmount);
      this.speech?.update(e);
      let i = this.speech?.talking ?? !1;
      ((this.talk += (+!!i - this.talk) * K3(i ? 14 : 8, e)),
        i
          ? (this.talkPhase =
              (this.talkPhase + e * H3 * Math.max(0, t.talkRate)) % H3)
          : (this.talkPhase +=
              (Math.round(this.talkPhase / H3) * H3 - this.talkPhase) *
              K3(10, e)));
      let a = 0.5 - 0.5 * Math.cos(this.talkPhase),
        o = G3(t.restMouth, 0, 1);
      if (
        ((n.mouth.value =
          o + ((0.3 + 0.7 * a) * Math.max(0, t.talkMouth) - o) * this.talk),
        n.eyeLook.value.set(0, -this.talk * a * 0.035 * t.talkBob),
        t.idleLife && (this.nextIdle -= e),
        this.nextIdle <= 0)
      ) {
        let e = Math.max(0, t.idleAmount);
        (Math.random() < 0.4
          ? this.hop(0.4 * e)
          : ((this.blinkTime = 0), (this.nextBlink = 0.24)),
          (this.nextIdle = Math.max(1, t.idleEvery) * W3(0.7, 1.3)));
      }
      if (
        this.airborne &&
        ((this.airTime += e),
        (this.hopV -= this.gravity * e),
        (this.hopY += this.hopV * e),
        this.hopY <= 0)
      ) {
        let e = -this.hopV;
        ((this.hopY = this.hopV = 0),
          (this.airborne = !1),
          (this.squash.v -= e * 0.3 * t.squash),
          (this.jiggle += e * 0.0022 * t.jiggle),
          (this.eyeOpen.v -= e * 0.15));
      }
      let s = !1;
      this.roll.t < 1
        ? ((this.roll.t = Math.min(1, this.roll.t + e / V3)),
          (s = this.roll.t < 0.85),
          this.spin.setFromAxisAngle(this.roll.axis, J3(this.roll.t) * H3))
        : this.spin.identity();
      let c = Math.sin(this.clock * 2.1) * 0.018 * t.breathe * (1 - this.talk),
        l = G3(this.hopV * 0.012, -0.12, 0.14) * t.squash,
        u = (this.airborne ? l : c) + r * 0.035,
        d = this.talk * (a - 0.4) * 0.03 * t.talkBob;
      ((n.squashY.value = G3(this.squash.step(u, e) + d, -0.4, 0.4)),
        (n.grounded.value = this.airborne
          ? Math.max(0, 1 - this.airTime * 8)
          : 1),
        (this.jiggle = Math.min(this.jiggle, 0.03) * Math.exp(-4 * e)),
        (n.wobble.value = this.jiggle),
        (this.wobblePhase += e * 9),
        this.wobblePhase > 1e3 && this.jiggle < 1e-5 && (this.wobblePhase = 0),
        (n.wobblePhase.value = this.wobblePhase));
      let f = G3((this.pointer.x - this.center.x) / this.pxRadius, -1, 1),
        p = this.lean.step(-f * 0.1 * r, e),
        m = Math.max(1e-4, q3(this.appear / 1.1)) * this.radius;
      (this.mesh.position.set(
        this.anchor.x - Math.sin(p) * m,
        this.anchor.y + this.hopY * this.radius + (Math.cos(p) - 1) * m,
        this.anchor.z,
      ),
        (this.mesh.rotation.z = p),
        this.mesh.scale.setScalar(m / T3),
        (this.mesh.visible =
          this.prewarm || this.warmFrames > 0 || this.appear > 0),
        this.warmFrames > 0 && this.warmFrames--,
        this.updateEyes(e, s, r));
    }
    lookAround(e) {
      let t = this.tuning;
      if (((this.gazeHold -= e), this.gazeHold > 0)) return;
      let n = Math.max(0, t.lookAround),
        r = Math.random(),
        i = this.gaze.x,
        a = this.gaze.y;
      (n === 0 || r < (this.speaking ? 0.55 : 0.32)
        ? this.gaze.set(0, 0)
        : (this.speaking ? r < 0.85 : r < 0.5)
          ? this.gaze.set(W3(0.35, 0.6), W3(0.25, 0.45))
          : r < 0.75
            ? this.gaze.set(W3(0.45, 0.9), W3(0.1, 0.55))
            : r < 0.88
              ? this.gaze.set(W3(-0.15, 0.35), W3(0.55, 0.8))
              : this.gaze.set(W3(-0.55, 0.75), W3(-0.35, 0.4)),
        this.gaze.multiplyScalar(Math.min(n, 1.5)),
        Math.hypot(this.gaze.x - i, this.gaze.y - a) > 0.45 &&
          Math.random() < 0.35 &&
          this.blinkTime < 0 &&
          (this.blinkTime = 0));
      let o = this.gaze.lengthSq() < 1e-4 ? W3(1.4, 3.6) : W3(0.8, 2.2);
      this.gazeHold = (o * Math.max(1, t.lookEvery)) / 2.6;
    }
    updateEyes(e, t, n) {
      let r = this.tuning,
        i = this.u,
        a = this.appear > 0.3,
        o = this.eyeShow.step(+!!a, e),
        s = !a || t ? 0 : this.eyeShow.x > 0.75 ? 1 + 0.18 * n : 0,
        c = G3(this.eyeOpen.step(s, e), -0.1, 1.4);
      if (
        (!t &&
          this.eyeOpen.x > 0.9 &&
          ((this.nextBlink -= e),
          this.nextBlink <= 0 &&
            ((this.blinkTime = 0),
            (this.nextBlink =
              Math.random() < 0.2
                ? 0.22
                : Math.max(0.5, r.blinkEvery) * W3(0.5, 1.5)))),
        this.blinkTime >= 0)
      ) {
        this.blinkTime += e;
        let t = this.blinkTime / 0.17;
        t >= 1
          ? (this.blinkTime = -1)
          : (c *= 1 - Math.sin(Math.PI * t) * 0.95);
      }
      ((i.eyeShow.value = Math.max(0, o)),
        (i.eyeOpen.value = Math.max(0, c)),
        (this.pointerIdle += e));
      let l = G3(-this.scrollSpeed * 0.05, -0.35, 0.35) * r.scrollGlance;
      this.scrollLook += (l - this.scrollLook) * K3(4, e);
      let u = 0,
        d = 0,
        f = 0;
      if (this.pointerIdle < 4 && r.followPointer) {
        let e = this.pointer.x - this.center.x,
          t = this.center.y - this.pointer.y;
        u =
          1 -
          MathUtils.smoothstep(
            Math.hypot(e, t),
            r.followNear,
            r.followNear * 1.6,
          );
        let n = r.followAmount / Math.max(60, r.followNear * 0.85);
        ((d = G3(e * n, -1.1, 1.1)), (f = G3(t * n, -0.9, 0.9)));
      }
      this.focusIdle += e;
      let p = this.focusIdle < 0.2;
      this.focusing += (+!!p - this.focusing) * K3(p ? 7 : 4, e);
      let m = this.gaze.x,
        h = this.gaze.y;
      if (this.focusing > 0.001) {
        let e = this.focus.x - this.center.x,
          t = this.center.y - this.focus.y,
          n = Math.max(1, Math.hypot(e, t));
        ((m += ((e / n) * 0.95 - m) * this.focusing),
          (h += ((t / n) * 0.8 - h) * this.focusing));
      }
      u < 0.5 && !t && !p && this.lookAround(e);
      let g = d * u + m * (1 - u),
        _ = G3(f * u + h * (1 - u) + this.scrollLook, -0.9, 0.9);
      (this.faceTarget
        .set(this.atViewer.x + g, this.atViewer.y + _, 1)
        .normalize(),
        this.face
          .lerp(this.faceTarget, K3(u > 0.5 ? r.followSpeed : 9, e))
          .normalize());
      let v = this.fFwd.copy(this.face),
        y = this.fRight.crossVectors(U3, v).normalize(),
        b = this.fUp.crossVectors(v, y);
      (y.applyQuaternion(this.spin),
        b.applyQuaternion(this.spin),
        v.applyQuaternion(this.spin),
        i.face.value.set(y.x, y.y, y.z, b.x, b.y, b.z, v.x, v.y, v.z));
    }
  };
  var Q3 = 0.6;
  function $3(e = Q3) {
    let t = null,
      n = 0;
    return {
      reset() {
        n = 0;
      },
      update(r, i, a) {
        return (
          r !== t && ((t = r), (n = 0)),
          (n =
            r === null || !i || !(a > 0) || a > 0.25 ? 0 : Math.min(e, n + a)),
          n >= e
        );
      },
    };
  }
  var e6 = EZ;
  var t6 = 1.35;
  return {
    Helper,
    $3,
    e6,
    t6,
  };
}
