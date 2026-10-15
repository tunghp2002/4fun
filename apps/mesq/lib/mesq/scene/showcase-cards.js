// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  CanvasTexture,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicNodeMaterial,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
} from "three/webgpu";
import {
  abs,
  attribute,
  clamp,
  float,
  floor,
  fract,
  hash,
  max,
  min,
  mix,
  positionGeometry,
  smoothstep,
  step,
  texture,
  time,
  uniform,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
export function createShowcaseCardsModule(
  scope,
  {
    paletteModule,
    audioModule,
    stickersModule,
    meshBuildersModule,
    phoneModule,
    projectDataModule,
    showcaseStateModule,
  },
) {
  const { paperWhite, inkPurple, palette } = paletteModule;
  const { sound } = audioModule;
  const { rH, iH } = stickersModule;
  const {
    DG,
    OG,
    kG,
    NG,
    PG,
    IG,
    LG,
    LayeredQuadGeometry,
    zG,
    BG,
    VG,
    HG,
    UG,
    WG,
    GG,
    YG,
    IdleQueue,
  } = meshBuildersModule;
  const { bY } = phoneModule;
  const { projects } = projectDataModule;
  const { d0, m0, CardTuck, _0 } = showcaseStateModule;
  function v0(e, t, n) {
    return e === 1 && t === 1 && n === 1;
  }
  var y0 = bY;
  var b0 = 0.8;
  var x0 = 1536;
  var S0 = 256;
  var C0 = [0, 0, 1024, 256];
  var w0 = [1024, 0, 256, 256];
  var T0 = [1280, 0, 256, 128];
  var E0 = ([e, t, n, r]) => [
    e / x0,
    1 - (t + r) / S0,
    (e + n) / x0,
    1 - t / S0,
  ];
  var D0 = 0;
  var O0 = 1;
  var k0 = 2;
  var A0 = 3;
  var j0 = 0.21;
  var M0 = 0.15;
  var N0 = 0.27;
  var P0 = 0.04;
  var F0 = 0.12;
  var I0 = 0.19;
  var L0 = 0.05;
  var R0 = 0.03;
  var z0 = [
    palette.yellow,
    palette.lime,
    palette.cyan,
    palette.pink,
    palette.orange,
    palette.lilac,
  ];
  var B0 = [2, 17, 25, 27, 18, 0];
  var V0 = (e, t) => e.accent ?? z0[t % z0.length];
  var H0 = (e, t) => e.sticker ?? B0[t % B0.length];
  var U0 = 1024;
  var W0 = Math.round(U0 / y0);
  var G0 = (e) => `800 ${e}px Manrope, system-ui, sans-serif`;
  var K0 = (e) => `700 ${e}px "IBM Plex Mono", ui-monospace, monospace`;
  function q0(e) {
    let t = new CanvasTexture(e);
    return ((t.colorSpace = SRGBColorSpace), (t.anisotropy = 4), t);
  }
  function J0(e) {
    let t = scope.element(`canvas`);
    t.width = t.height = 4;
    let n = t.getContext(`2d`);
    return (
      e ? ((n.fillStyle = e), n.fillRect(0, 0, 4, 4)) : n.clearRect(0, 0, 4, 4),
      q0(t)
    );
  }
  var ProjectCards = class {
    cards;
    group = new Group();
    tuning = {
      depth: 4.5,
      x: -0.4,
      touchX: -0.46,
      touchY: 0.14,
      touchWidth: 0.38,
      y: 0.05,
      width: 0.46,
      height: 0.56,
      portraitX: 0,
      portraitY: 0.42,
      portraitWidth: 0.74,
      portraitHeight: 0.34,
      tabletFrom: 0.57,
      tabletTo: 0.62,
      tabletHeight: 0.3,
      squarePole: 0.86,
      squareReach: 1.15,
      squareGrow: 0.06,
      roll: -0.025,
      hoverTilt: 0.08,
      followTilt: 0.02,
      hoverScale: 0.02,
      hoverPulse: 0.35,
      bob: 1,
      transition: 0.75,
      glitch: 1,
      aberration: 0.022,
      hoverAberration: 0.2,
      appearAberration: 0.14,
      split: 0.03,
      hoverSplit: 0,
      appearSpeed: 8,
      ...m0,
    };
    look = {
      ink: uniform(new Color(inkPurple)),
      paper: uniform(new Color(paperWhite)),
      plateA: uniform(new Color(palette.cyan)),
      plateB: uniform(new Color(palette.hotPink)),
      shadowDots: uniform(new Color(palette.lilac)),
      inkWidth: uniform(0),
      paperWidth: uniform(0.0337),
      radius: uniform(0.0543),
      shadowOffset: uniform(new Vector2(0, 0)),
      shadowAlpha: uniform(0),
      dotFreq: uniform(29.48),
      dotSize: uniform(0.221),
      glare: uniform(0.026),
      innerShadow: uniform(0.337),
      glow: uniform(1.478),
    };
    u = {
      size: uniform(new Vector2(y0 / 2, 0.5)),
      swap: uniform(1),
      fromSlot: uniform(1),
      glitch: uniform(0),
      split: uniform(0),
      aberr: uniform(0.022),
      jitter: uniform(new Vector2()),
      reveal: uniform(0),
      loaded: uniform(new Vector2()),
      imgAspect: uniform(new Vector2(y0, y0)),
    };
    mesh;
    stack = new LayeredQuadGeometry(4);
    standIns = [J0(inkPurple), J0(inkPurple)];
    img;
    sheet;
    warmer;
    idle = new IdleQueue(800);
    covers;
    coverAspects;
    coverStarted;
    sheets;
    loading = new Map();
    pictures = new Map();
    counted;
    uploaded = new WeakSet();
    slotProject = [-1, -1];
    slotLoaded = [0, 0];
    fromSlot = 1;
    swap = 1;
    target = -1;
    builtPop = -1;
    builtBorder = -1;
    builtPad = -1;
    shown = 0;
    cut = !1;
    clock = 0;
    hover = 0;
    hoverAge = HG;
    over = !1;
    away = 1;
    tiltX = 0;
    tiltY = 0;
    jitterClock = 0;
    prewarming = !1;
    tuck = new CardTuck(this.tuning);
    rest = {
      x: 0,
      y: 0,
      s: 0,
      roll: 0,
    };
    buttonHover = !1;
    tanHalf = Math.tan(MathUtils.degToRad(30.5 / 2));
    camAspect = window.innerWidth / Math.max(1, window.innerHeight);
    portrait = !1;
    box = {
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    };
    portraitBox = null;
    room = null;
    point = new Vector3();
    constructor(e, t = projects) {
      ((this.cards = t),
        (this.warmer = e ?? null),
        (this.covers = t.map(() => null)),
        (this.coverAspects = t.map(() => y0)),
        (this.coverStarted = t.map(() => !1)),
        (this.sheets = t.map(() => null)),
        (this.counted = t.filter((e) => !e.teaser).length),
        (this.img = [texture(this.standIns[0]), texture(this.standIns[1])]),
        (this.sheet = [texture(J0(null)), texture(J0(null))]));
      let n = this.stack;
      n.setLayer(D0, 0);
      for (let e of [O0, k0, A0]) n.setLayer(e, 1);
      (n.setUV(O0, E0(T0)),
        n.setUV(k0, E0(C0)),
        n.setUV(A0, E0(w0)),
        n.commitStatic(),
        (this.mesh = new Mesh(n.geometry, this.createMaterial())),
        (this.mesh.name = `ProjectFrame`),
        (this.mesh.frustumCulled = !1),
        this.group.add(this.mesh),
        (this.group.visible = !1));
      let r = t.length,
        i = t.map((e, t) => t);
      r > 2 && i.splice(1, 0, i.pop());
      for (let e of i)
        (this.idle.add(() => !this.sheets[e] && !!this.sheetOf(e), e),
          this.idle.add(() => this.makeCover(e), e));
      (this.setProject(0),
        this.rebuild(
          this.look.inkWidth.value + this.look.paperWidth.value,
          1,
          P0 * 3,
        ));
    }
    get project() {
      return this.target;
    }
    get hovered() {
      return this.over;
    }
    get tuckAmount() {
      return this.tuck.amount;
    }
    createMaterial() {
      let e = this.u,
        t = this.look,
        n = positionGeometry.xy,
        r = attribute(`layer`, `float`),
        i = zG(r, 0),
        a = zG(r, 1),
        o = e.size,
        s = o.add(t.inkWidth),
        c = s.add(t.paperWidth),
        l = n.div(o).mul(0.5).add(0.5),
        u = floor(time.mul(14)),
        d = floor(l.y.mul(16)),
        f = hash(d.mul(17).add(u.mul(131)))
          .sub(0.5)
          .mul(step(0.6, hash(d.mul(29).add(u.mul(61)).add(7))))
          .mul(e.glitch)
          .mul(0.16),
        p = l.x
          .mul(0.78)
          .add(l.y.mul(0.22))
          .add(hash(d.mul(13).add(3)).sub(0.5).mul(0.2)),
        m = e.swap.mul(1.5).sub(0.25),
        h = step(p, m),
        g = abs(e.fromSlot.sub(h)),
        _ = float(1).sub(smoothstep(0, 0.03, abs(p.sub(m)))),
        v = mix(DG(t.plateA), DG(t.plateB), step(0.5, fract(d.mul(0.5)))),
        y = o.x.div(o.y),
        b = step(0.5, fract(n.x.add(n.y).mul(5).sub(time.mul(0.3)))),
        x = mix(DG(t.ink), mix(DG(t.ink), DG(t.plateA), 0.3), b),
        S = (t, n, r) => {
          let i = l
              .sub(0.5)
              .mul(vec2(min(y.div(n), 1), min(n.div(y), 1)))
              .add(0.5)
              .add(vec2(f, 0)),
            a = vec2(e.split, 0),
            o = vec3(t.sample(i.add(a)).r, t.sample(i).g, t.sample(i.sub(a)).b);
          return mix(x, o, r);
        },
        C = mix(
          S(this.img[0], e.imgAspect.x, e.loaded.x),
          S(this.img[1], e.imgAspect.y, e.loaded.y),
          g,
        ),
        w = t.radius.mul(0.4),
        T = kG(OG(n, o, w)),
        E = T.mul(float(1).sub(kG(OG(n.sub(vec2(0.035, -0.04)), o, w)))),
        D = mix(C, DG(t.ink), E.mul(t.innerShadow));
      D = mix(D, DG(t.paper), IG(n, o).mul(t.glare));
      let ee = OG(n, s, t.radius.mul(0.7)),
        te = OG(n, c, t.radius),
        O = mix(DG(t.paper), DG(t.ink), kG(ee));
      O = mix(O, D, T);
      let ne = _.mul(T);
      O = mix(O, v, ne);
      let re = kG(te),
        ie = mix(DG(t.ink), DG(t.shadowDots), NG(n, t.dotFreq, t.dotSize)),
        ae = kG(OG(n.sub(t.shadowOffset), c, t.radius)).mul(t.shadowAlpha),
        oe = vec2(-1, 0.55).mul(e.aberr).add(e.jitter),
        se = vec2(1, -0.55).mul(e.aberr).sub(e.jitter),
        ce = kG(OG(n.sub(oe), c, t.radius)),
        le = kG(OG(n.sub(se), c, t.radius));
      ((ie = mix(ie, DG(t.plateB), le)),
        (ie = mix(
          ie,
          mix(DG(t.plateA), DG(t.plateA).mul(DG(t.plateB)), le),
          ce,
        )));
      let ue = max(ae, max(ce, le)),
        de = mix(this.sheet[0], this.sheet[1], step(0.5, g)),
        [fe, pe] = LG(O, re, ie, ue),
        me = fe.mul(i).add(de.rgb.mul(a)),
        he = clamp(
          n.x.div(c.x).mul(0.15).add(n.y.div(c.y).mul(0.1)).add(0.3),
          0,
          0.6,
        ),
        ge = pe
          .mul(i)
          .add(de.a.mul(a))
          .mul(PG(n, e.reveal, he, 13)),
        _e = new MeshBasicNodeMaterial({
          transparent: !0,
          alphaTest: 0.02,
        });
      return (
        (_e.name = `ProjectFrame`),
        (_e.colorNode = vec4(me, ge)),
        Object.assign(_e, {
          emissiveNode: v.mul(ne).mul(i).mul(t.glow).mul(e.glitch.min(1)),
        }),
        _e
      );
    }
    nudge() {
      this.hoverAge >= 0.5 && (this.hoverAge = 0);
    }
    cutAway() {
      this.cut = !0;
    }
    get presentedProject() {
      if (this.prewarming || !this.group.visible || this.tuck.swept) return -1;
      let e = 1 - this.fromSlot,
        t = e === 0 ? this.u.loaded.value.x : this.u.loaded.value.y;
      return v0(this.u.reveal.value, this.u.swap.value, t) &&
        this.slotProject[e] === this.target
        ? this.target
        : -1;
    }
    setProject(e) {
      let t = this.cards.length;
      if (t === 0 || !Number.isFinite(e) || e < 0) return;
      let n = Math.round(e) % t;
      if (n === this.target) return;
      this.target = n;
      let r = this.swap < 0.5 ? this.fromSlot : 1 - this.fromSlot;
      if (this.slotProject[r] === n) {
        ((this.fromSlot = 1 - r),
          this.shown > 0 && sound.sfx.panelSwitch(this.tuning.transition),
          (this.swap = this.shown > 0 ? 1 - this.swap : 1));
        return;
      }
      let i = this.shown <= 0 || this.slotProject[r] < 0;
      (i || sound.sfx.panelSwitch(this.tuning.transition),
        (this.fromSlot = r),
        this.assignSlot(1 - r, n),
        (this.swap = +!!i));
    }
    assignSlot(e, t) {
      ((this.slotProject[e] = t), (this.sheet[e].value = this.sheetOf(t)));
      let n = this.covers[t];
      ((this.img[e].value = n ?? this.standIns[e]),
        (this.slotLoaded[e] = +!!n),
        e === 0
          ? (this.u.loaded.value.x = this.slotLoaded[e])
          : (this.u.loaded.value.y = this.slotLoaded[e]),
        n || this.idle.prioritize(t));
    }
    slotAspect(e) {
      let t = this.slotProject[e];
      return t >= 0 ? this.coverAspects[t] : y0;
    }
    prepareAll() {
      for (let e = 0; e < this.cards.length; e++) {
        (this.upload(this.sheetOf(e)),
          this.cards[e].image || this.makeCover(e));
        let t = this.covers[e];
        t && this.upload(t);
      }
    }
    upload(e) {
      let t = this.warmer;
      if (!t || this.uploaded.has(e)) return !1;
      try {
        t.initTexture(e);
      } catch {}
      return !0;
    }
    warm(e, t) {
      this.warmer && this.idle.add(() => this.upload(e), t, !0);
    }
    track(e, t) {
      e.onUpdate = () => {
        if (((e.onUpdate = null), this.uploaded.add(e), t)) {
          let t = e.image;
          t.width = t.height = 0;
        }
      };
    }
    sheetOf(e) {
      let t = this.sheets[e];
      if (t) return t;
      let n = scope.element(`canvas`);
      ((n.width = x0), (n.height = S0));
      let r = n.getContext(`2d`),
        i = this.cards[e];
      ($0(r, C0, i, V0(i, e)), n2(r, w0, H0(i, e)));
      let a = (e) => String(e).padStart(2, `0`);
      return (
        i.caption === null
          ? (Q0(r, T0), r.restore())
          : t2(
              r,
              T0,
              i.caption ?? [a(e + 1), i.teaser ? `/??` : `/${a(this.counted)}`],
            ),
        (t = q0(n)),
        this.track(t, !0),
        (this.sheets[e] = t),
        this.warm(t, e),
        t
      );
    }
    makeCover(e) {
      if (this.coverStarted[e]) return !1;
      this.coverStarted[e] = !0;
      let t = this.cards[e].image;
      if (!t) return (this.paintCover(e), !0);
      let n = this.pictures.get(t);
      if (n) this.coverReady(e, n.tex, n.aspect);
      else if (this.loading.has(t)) this.loading.get(t).push(e);
      else return (this.loading.set(t, [e]), this.loadCover(t), !0);
      return !1;
    }
    paintCover(e) {
      let t = this.cards[e],
        n = scope.element(`canvas`);
      ((n.width = U0),
        (n.height = W0),
        c2(n.getContext(`2d`), U0, W0, e, V0(t, e), H0(t, e), t.teaser));
      let r = q0(n);
      (this.track(r, !0), this.coverReady(e, r, U0 / W0));
    }
    loadCover(e) {
      let t = new Image();
      ((t.crossOrigin = `anonymous`),
        (t.decoding = `async`),
        (t.src = e.startsWith(`/`) ? `/` + e.slice(1) : e));
      let n = !1,
        r = () => {
          if (scope.signal.aborted) return;
          if (n) return;
          n = !0;
          let r = new Texture(t);
          ((r.colorSpace = SRGBColorSpace),
            (r.anisotropy = 4),
            (r.needsUpdate = !0),
            this.track(r, !1));
          let i = t.naturalWidth / t.naturalHeight;
          this.pictures.set(e, {
            tex: r,
            aspect: i,
          });
          for (let t of this.waiting(e)) this.coverReady(t, r, i);
        },
        i = () => {
          if (scope.signal.aborted) return;
          if (!n) {
            ((n = !0), console.warn(`showcase: could not load ${e}`));
            for (let t of this.waiting(e)) this.paintCover(t);
          }
        };
      (t.decode().then(r, () => {
        t.complete && t.naturalWidth > 0 && t.naturalHeight > 0 ? r() : i();
      }),
        scope.listen(t, `error`, i, {
          once: !0,
        }),
        scope.listen(t, `load`, () => scope.timeout(r, 1500), {
          once: !0,
        }));
    }
    waiting(e) {
      let t = this.loading.get(e) ?? [];
      return (this.loading.delete(e), t);
    }
    coverReady(e, t, n) {
      ((this.covers[e] = t),
        (this.coverAspects[e] = n > 0 && Number.isFinite(n) ? n : y0));
      for (let n = 0; n < 2; n++)
        this.slotProject[n] === e &&
          ((this.img[n].value = t), (this.slotLoaded[n] = 1));
      this.warm(t, e);
    }
    layout(e) {
      ((this.tanHalf = Math.tan(MathUtils.degToRad(e.fov / 2))),
        (this.camAspect = e.aspect),
        (this.portrait = e.aspect < 0.9));
    }
    touch = !1;
    get visualAspect() {
      let e = this.look.inkWidth.value + this.look.paperWidth.value;
      return (y0 + 2 * e + F0) / (1 + 2 * e + I0);
    }
    layoutBox() {
      let e = this.tuning,
        t = this.box,
        n = this.camAspect;
      if (this.portrait) {
        if (((t.x = e.portraitX), (t.w = e.portraitWidth), this.portraitBox))
          return ((t.y = this.portraitBox.y), (t.h = this.portraitBox.h), t);
        let r = MathUtils.smoothstep(n, e.tabletFrom, e.tabletTo);
        return (
          (t.h =
            r > 0
              ? MathUtils.lerp(e.portraitHeight, e.tabletHeight, r)
              : e.portraitHeight),
          (t.y = r > 0 ? e.portraitY + e.portraitHeight - t.h : e.portraitY),
          t
        );
      }
      ((t.y = this.touch ? e.touchY : e.y), (t.h = e.height));
      let r = this.touch ? e.touchX : e.x,
        i = this.touch ? e.touchWidth : e.width,
        a = r + i,
        o = e.squarePole - e.squareReach / n;
      if (o >= a) ((t.x = r), (t.w = i));
      else {
        let n = r - i - Math.min(e.squareGrow, a - o),
          s = Math.max(o, n + 0.3);
        ((t.x = (n + s) / 2), (t.w = (s - n) / 2));
      }
      let s = this.room;
      if (!s) return t;
      let c = Math.min(t.h, (t.w * n) / this.visualAspect),
        l = s.bottom - (t.y - c);
      if (l <= 0) return t;
      let u = Math.min(t.y + c + l, Math.max(s.top, t.y + c)),
        d = Math.max((u - s.bottom) / 2, c * b0);
      return ((t.y = u - d), (t.h = d), t);
    }
    setPrewarm(e) {
      if (e !== this.prewarming) {
        if (((this.prewarming = e), !e)) {
          this.group.visible = this.shown > 0;
          return;
        }
        ((this.group.visible = !0),
          this.group.traverse((e) => {
            ((e.visible = !0), (e.frustumCulled = !1));
          }),
          this.shown <= 0 &&
            (this.group.position.set(0, 0, -this.tuning.depth),
            this.group.rotation.set(0, 0, 0),
            this.group.scale.setScalar(0.5),
            (this.u.reveal.value = 0)));
      }
    }
    update(e, t, n) {
      let r = this.tuning,
        i = this.u,
        a = Number.isFinite(t) ? MathUtils.clamp(t, 0, 1) : 0;
      if (
        (this.cut && a < this.shown && (this.shown = a),
        (this.cut = !1),
        (this.shown =
          r.appearSpeed > 0 ? _0(this.shown, a, e, r.appearSpeed) : a),
        Number.isFinite(this.shown) || (this.shown = a),
        a === 0 && this.shown < 0.004 && (this.shown = 0),
        (this.group.visible = this.shown > 0 || this.prewarming),
        this.shown <= 0)
      ) {
        ((this.over = !1),
          (this.hover = 0),
          (this.hoverAge = HG),
          (this.away = 1),
          this.tuck.park());
        return;
      }
      ((this.clock += e),
        this.swap < 1 &&
          (this.swap = Math.min(
            1,
            this.swap + e / Math.max(0.05, r.transition),
          )));
      let o = Math.sin(Math.PI * this.swap) * r.glitch,
        s = r.depth * this.tanHalf,
        c = s * this.camAspect,
        l = this.layoutBox(),
        u = l.x * c,
        d = l.y * s,
        f = l.w * 2 * c,
        p = l.h * 2 * s,
        m = this.look.inkWidth.value + this.look.paperWidth.value,
        h = y0 / 2 + m,
        g = 0.5 + m,
        _ = BG(this.shown),
        v = Math.min(f / (2 * h + F0), p / (2 * g + I0)) * (0.86 + 0.14 * _),
        y = this.tuck;
      y.step(e, this.over);
      let b = y.amount,
        x = y.edge(u + h * v, 2 * h * v, c, s) - h * v - (1 - _) * 0.22 * f,
        S =
          d +
          Math.sin(this.clock * 1.1) * 0.006 * s * r.bob -
          (1 - _) * 0.06 * p,
        C =
          r.roll +
          Math.sin(this.clock * 0.7) * 0.006 * r.bob -
          (1 - _) * 0.12 +
          y.roll,
        w = this.rest;
      ((w.x = x), (w.y = S), (w.s = v), (w.roll = C));
      let T = this.buttonHover || (Math.abs(n.x) <= 1 && Math.abs(n.y) <= 1),
        E = h,
        D = 0;
      if (!this.buttonHover) {
        let e = (n.x * c - x) / v,
          t = (n.y * s - S) / v,
          r = Math.cos(-C),
          i = Math.sin(-C);
        ((E = e * r - t * i), (D = e * i + t * r));
      }
      let ee = this.over ? UG : 0,
        te = Math.abs(E) <= h + ee && D <= g + ee && D >= -g - j0 * 0.6 - ee,
        O = T && _ > 0.6 && (te || (y.swept && X0(E, D, h, g, ee)));
      (O &&
        !this.over &&
        this.away >= 0.3 &&
        this.hoverAge >= 0.5 &&
        (this.hoverAge = 0),
        (this.over = O),
        (this.away = O ? 0 : Math.min(this.away + e, 1)),
        (this.hoverAge = Math.min(this.hoverAge + e, HG)),
        (this.hover = MathUtils.clamp(this.hover + (O ? e : -e) / VG, 0, 1)));
      let ne = WG(this.hover),
        re = GG(this.hoverAge) * r.hoverPulse,
        ie = 1 - Math.exp(-e * 6),
        ae = MathUtils.lerp(T ? r.followTilt : 0, r.hoverTilt, ne) * (1 - b),
        oe = MathUtils.clamp(E / h, -1, 1),
        se = MathUtils.clamp(D / g, -1, 1);
      if (
        ((this.tiltY += (oe * ae - this.tiltY) * ie),
        (this.tiltX += (-se * ae - this.tiltX) * ie),
        this.group.position.set(x, S, -r.depth),
        this.group.scale.setScalar(v * (1 + r.hoverScale * ne * (1 - b))),
        this.group.rotation.set(this.tiltX, this.tiltY, C),
        (i.swap.value = this.swap),
        (i.fromSlot.value = this.fromSlot),
        (i.glitch.value = o),
        (i.split.value = r.split * (o + re * 0.4) + ne * r.hoverSplit),
        (i.aberr.value =
          r.aberration * (1 + o * 2.5 + ne * r.hoverAberration + re * 1.5) +
          (1 - _) * r.appearAberration +
          y.aberration),
        (this.jitterClock += e),
        o > 0.02)
      ) {
        if (this.jitterClock > 1 / 14) {
          this.jitterClock = 0;
          let e = 0.03 * o;
          i.jitter.value.set(
            (Math.random() - 0.5) * e,
            (Math.random() - 0.5) * e * 0.6,
          );
        }
      } else i.jitter.value.set(0, 0);
      ((i.reveal.value = _),
        (i.loaded.value.x = _0(i.loaded.value.x, this.slotLoaded[0], e, 5)),
        (i.loaded.value.y = _0(i.loaded.value.y, this.slotLoaded[1], e, 5)),
        i.imgAspect.value.set(this.slotAspect(0), this.slotAspect(1)));
      let ce = 1 + 0.12 * Math.sin(Math.PI * this.swap),
        le = this.look.shadowOffset.value,
        ue = i.jitter.value,
        de = Math.max(
          Math.abs(le.x),
          Math.abs(le.y),
          i.aberr.value + Math.abs(ue.x),
          0.55 * i.aberr.value + Math.abs(ue.y),
        ),
        fe = Math.ceil((de + 0.03) / P0) * P0;
      (ce !== this.builtPop ||
        m !== this.builtBorder ||
        fe !== this.builtPad) &&
        this.rebuild(m, ce, fe);
    }
    rebuild(e, t, n) {
      let r = this.stack,
        i = y0 / 2,
        a = i + e,
        o = 0.5 + e;
      (r.flat(D0, 0, 0, 0, a + n, o + n),
        r.flat(
          O0,
          -i + 0.03 + M0,
          0.47 - M0 / 2,
          0.015,
          M0 * t,
          (M0 / 2) * t,
          0.025,
        ),
        r.flat(
          k0,
          -a - 0.06 + 2 * j0,
          -o + 0.02,
          0.03,
          2 * j0 * t,
          (j0 / 2) * t,
          -0.035,
        ),
        r.flat(A0, a - L0, o - R0, 0.04, (N0 / 2) * t, (N0 / 2) * t, 0.22),
        r.commit(),
        (this.builtPop = t),
        (this.builtBorder = e),
        (this.builtPad = n));
    }
    teaserLink = ``;
    cardPoint(e, t, n) {
      if (!this.group.visible || this.shown < 0.5 || this.target < 0) return !1;
      let r = this.look.inkWidth.value + this.look.paperWidth.value;
      return (
        n
          .set(e * (y0 / 2 + r), t * (0.5 + r), 0)
          .applyMatrix4(this.mesh.matrixWorld),
        !0
      );
    }
    tuckAnchor(e) {
      if (
        this.prewarming ||
        !this.group.visible ||
        this.shown < 0.5 ||
        this.target < 0
      )
        return null;
      let { x: t, y: n, s: r, roll: i } = this.rest,
        a = y0 / 2 + this.look.inkWidth.value + this.look.paperWidth.value;
      return (
        e.set(
          t + r * a * Math.cos(i),
          n + r * a * Math.sin(i),
          -this.tuning.depth,
        ),
        i
      );
    }
    hit(e) {
      if (!this.group.visible || this.shown < 0.5 || this.target < 0)
        return null;
      let t = this.cards[this.target],
        n = this.tuck.swept,
        r = n ? d0 : t.url || (t.teaser ? this.teaserLink : ``);
      if (!r || !YG(this.mesh.matrixWorld, e.ray, this.point)) return null;
      let { x: i, y: a } = this.point,
        o = this.look.inkWidth.value + this.look.paperWidth.value,
        s = y0 / 2 + o,
        c = 0.5 + o,
        l = (Math.abs(i) <= s && Math.abs(a) <= c) || (n && X0(i, a, s, c, 0)),
        u =
          i >= -s - 0.06 &&
          i <= -s + 3 * j0 &&
          a >= -c + 0.02 - j0 / 2 &&
          a <= c;
      return l || u ? r : null;
    }
  };
  function X0(e, t, n, r, i) {
    return Math.hypot(e - (n - L0), t - (r - R0)) <= N0 * 0.56 + i;
  }
  function createProjectCards(e, t) {
    return new ProjectCards(e, t);
  }
  function Q0(e, [t, n, r, i]) {
    (e.save(),
      e.clearRect(t, n, r, i),
      e.beginPath(),
      e.rect(t, n, r, i),
      e.clip(),
      e.translate(t, n));
  }
  function $0(e, t, n, r) {
    Q0(e, t);
    let i = n.title.toUpperCase(),
      a = 100;
    e.font = G0(a);
    let o = e.measureText(i).width;
    o > 720 && ((a *= 720 / o), (o = 720));
    let s = !!n.url && !n.url.startsWith(`say:`),
      c = s ? 92 : n.teaser || n.url ? 0 : 136,
      l = Math.min(t[2] - 52 - 14, 40 + o + (c ? 34 + c + 28 : 40));
    ((e.fillStyle = inkPurple),
      e.beginPath(),
      e.roundRect(36, 44, l, 180, 28),
      e.fill(),
      e.beginPath(),
      e.roundRect(26, 30, l, 180, 28),
      (e.lineJoin = `round`),
      (e.lineWidth = 26),
      (e.strokeStyle = paperWhite),
      e.stroke(),
      (e.fillStyle = r),
      e.fill(),
      (e.lineWidth = 5),
      (e.strokeStyle = inkPurple),
      e.beginPath(),
      e.roundRect(36, 40, l - 20, 160, 19),
      e.stroke(),
      (e.fillStyle = inkPurple),
      (e.textAlign = `left`),
      (e.textBaseline = `alphabetic`),
      (e.font = G0(a)));
    let u = e.measureText(i),
      d = u.actualBoundingBoxAscent || a * 0.72,
      f = u.actualBoundingBoxDescent || 0;
    e.fillText(i, 66, 120 + (d - f) / 2, 720);
    let p = 26 + l - 28 - c / 2;
    if (!s) {
      (c && e2(e, p, 120, c), e.restore());
      return;
    }
    ((e.fillStyle = inkPurple),
      e.beginPath(),
      e.arc(p, 120, c / 2, 0, Math.PI * 2),
      e.fill(),
      (e.strokeStyle = paperWhite),
      (e.lineWidth = 9),
      (e.lineCap = `round`),
      (e.lineJoin = `round`),
      e.beginPath(),
      e.moveTo(p - 14, 134),
      e.lineTo(p + 15, 105),
      e.moveTo(p - 6, 105),
      e.lineTo(p + 15, 105),
      e.lineTo(p + 15, 126),
      e.stroke(),
      e.restore());
  }
  function e2(e, t, n, r) {
    (e.save(),
      e.translate(t, n),
      e.rotate(-0.12),
      e.beginPath(),
      e.roundRect(-r / 2, -29, r, 58, 12),
      (e.fillStyle = inkPurple),
      e.fill(),
      (e.lineWidth = 4),
      (e.strokeStyle = paperWhite),
      e.beginPath(),
      e.roundRect(-r / 2 + 7, -22, r - 14, 44, 7),
      e.setLineDash([9, 7]),
      e.stroke(),
      e.setLineDash([]),
      (e.fillStyle = paperWhite),
      (e.font = K0(32)),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      e.fillText(`SOON`, 0, 2, r - 28),
      e.restore());
  }
  function t2(e, t, [n, r]) {
    (Q0(e, t),
      (e.fillStyle = inkPurple),
      e.fillRect(18, 22, 222, 92),
      (e.fillStyle = palette.yellow),
      e.fillRect(10, 12, 222, 92),
      (e.lineWidth = 6),
      (e.strokeStyle = inkPurple),
      e.strokeRect(10, 12, 222, 92),
      (e.fillStyle = inkPurple),
      (e.textAlign = `left`),
      (e.textBaseline = `alphabetic`),
      (e.font = G0(66)),
      e.fillText(n, 30, 84));
    let i = e.measureText(n).width;
    ((e.font = K0(34)), e.fillText(r, 30 + i + 6, 84), e.restore());
  }
  function n2(e, t, n) {
    Q0(e, t);
    let r = iH(n) > 1 ? 118 : 236;
    (rH(e, n, t[2] / 2, t[3] / 2, r), e.restore());
  }
  function r2(e) {
    let t = e >>> 0;
    return () => {
      t = (t + 1831565813) >>> 0;
      let e = t;
      return (
        (e = Math.imul(e ^ (e >>> 15), e | 1)),
        (e ^= e + Math.imul(e ^ (e >>> 7), e | 61)),
        ((e ^ (e >>> 14)) >>> 0) / 4294967296
      );
    };
  }
  var i2 = [
    0, 1, 2, 3, 4, 7, 8, 10, 11, 12, 14, 15, 17, 18, 20, 21, 23, 25, 26, 27, 29,
    31, 32, 33, 35,
  ];
  var a2 = [
    (e, t, n) => {
      ((e.globalAlpha = 0.16), (e.fillStyle = inkPurple), e.beginPath());
      for (let r = -n; r < t + n; r += 84)
        (e.moveTo(r, n),
          e.lineTo(r + 42, n),
          e.lineTo(r + 42 + n, 0),
          e.lineTo(r + n, 0),
          e.closePath());
      (e.fill(),
        (e.globalAlpha = 0.45),
        (e.strokeStyle = paperWhite),
        (e.lineWidth = 5),
        e.beginPath());
      for (let r = -n; r < t + n; r += 84)
        (e.moveTo(r + 63, n), e.lineTo(r + 63 + n, 0));
      e.stroke();
    },
    (e, t, n) => {
      let r = 0.6,
        i = Math.cos(r),
        a = Math.sin(r),
        o = Math.hypot(t, n) / 2 + 22,
        s = new Path2D(),
        c = new Path2D();
      for (let e = -o; e < o; e += 22)
        for (let r = -o; r < o; r += 22) {
          let o = t / 2 + r * i - e * a,
            l = n / 2 + r * a + e * i;
          if (o < -22 || o > t + 22 || l < -22 || l > n + 22) continue;
          let u = MathUtils.clamp(
              0.5 + 0.5 * ((o - t / 2) / t + (l - n / 2) / n) * 1.6,
              0,
              1,
            ),
            d = 11 * MathUtils.smoothstep(u, 0.3, 1);
          d > 0.8 && (s.moveTo(o + d, l), s.arc(o, l, d, 0, Math.PI * 2));
          let f = 9.24 * (1 - u / 0.42);
          f > 0.8 && (c.moveTo(o + f, l), c.arc(o, l, f, 0, Math.PI * 2));
        }
      ((e.globalAlpha = 0.3),
        (e.fillStyle = inkPurple),
        e.fill(s),
        (e.globalAlpha = 0.55),
        (e.fillStyle = paperWhite),
        e.fill(c));
    },
    (e, t, n, r) => {
      let i = t * (0.74 + r() * 0.06),
        a = n * (0.42 + r() * 0.1),
        o = Math.hypot(t, n);
      for (let t = 0; t < 30; t++) {
        let n = (t / 30) * Math.PI * 2,
          r = ((t + 0.5) / 30) * Math.PI * 2;
        ((e.globalAlpha = t % 2 ? 0.12 : 0.32),
          (e.fillStyle = t % 2 ? inkPurple : paperWhite),
          e.beginPath(),
          e.moveTo(i, a),
          e.lineTo(i + Math.cos(n) * o, a + Math.sin(n) * o),
          e.lineTo(i + Math.cos(r) * o, a + Math.sin(r) * o),
          e.closePath(),
          e.fill());
      }
    },
    (e, t, n, r) => {
      for (let i = 0; i < 46; i++) {
        let a = r() * n,
          o = t * (0.3 + r() * 0.65),
          s = 4 + r() * 16,
          c = i % 3 == 0;
        ((e.globalAlpha = c ? 0.5 : 0.2),
          (e.fillStyle = c ? paperWhite : inkPurple),
          e.beginPath(),
          e.moveTo(t + 4, a - s / 2),
          e.lineTo(t + 4, a + s / 2),
          e.lineTo(t - o, a),
          e.closePath(),
          e.fill());
      }
    },
    (e, t, n) => {
      (e.save(), e.translate(t / 2, n / 2), e.rotate(-0.22));
      let r = Math.hypot(t, n) / 2;
      ((e.globalAlpha = 0.15), (e.fillStyle = inkPurple), e.beginPath());
      for (let t = -r; t < r; t += 64)
        for (let n = -r; n < r; n += 64)
          (Math.round((n + r) / 64) + Math.round((t + r) / 64)) % 2 == 0 &&
            e.rect(n, t, 64, 64);
      (e.fill(), e.restore());
    },
    (e, t, n, r) => {
      let i = t * (0.82 + r() * 0.1),
        a = n * (0.1 + r() * 0.1),
        o = Math.hypot(t, n) * 1.1;
      ((e.globalAlpha = 0.15), (e.fillStyle = inkPurple));
      for (let t = 36; t < o; t += 72)
        (e.beginPath(),
          e.arc(i, a, t + 36, 0, Math.PI * 2),
          e.arc(i, a, t, 0, Math.PI * 2, !0),
          e.fill());
      ((e.globalAlpha = 0.6),
        (e.strokeStyle = paperWhite),
        (e.lineWidth = 5),
        e.setLineDash([18, 14]));
      for (let t of [3.5, 7.5])
        (e.beginPath(), e.arc(i, a, 36 * t, 0, Math.PI * 2), e.stroke());
      e.setLineDash([]);
    },
    (e, t, n) => {
      let r = (n) => {
        e.beginPath();
        for (let r = -92, i = 0; r <= t + 92; r += 46, i++)
          e.lineTo(r, n + (i % 2 ? 26 : -26));
      };
      e.lineJoin = `miter`;
      for (let t = 0; t < n + 52; t += 84)
        ((e.globalAlpha = 0.17),
          (e.strokeStyle = inkPurple),
          (e.lineWidth = 24),
          r(t),
          e.stroke(),
          (e.globalAlpha = 0.5),
          (e.strokeStyle = paperWhite),
          (e.lineWidth = 4),
          r(t + 40),
          e.stroke());
    },
  ];
  var o2 = null;
  function s2(e, t, n, r, i, a, o, s) {
    ((o2 ??= scope.element(`canvas`)), (o2.width = o), (o2.height = s));
    let c = o2.getContext(`2d`);
    ((c.font = e.font),
      (c.textAlign = e.textAlign),
      (c.textBaseline = e.textBaseline),
      (c.lineJoin = `round`),
      (c.lineWidth = a),
      (c.strokeStyle = i),
      c.strokeText(t, n, r),
      (c.globalCompositeOperation = `destination-out`),
      c.fillText(t, n, r),
      e.drawImage(o2, 0, 0));
  }
  function c2(e, t, n, r, i, a, o = !1) {
    let s = r2(r * 7919 + 17);
    (e.save(),
      (e.fillStyle = i),
      e.fillRect(0, 0, t, n),
      e.save(),
      a2[r % a2.length](e, t, n, s),
      e.restore());
    let c = o ? `MORE` : String(r + 1).padStart(2, `0`),
      l = n * 0.66;
    e.font = G0(l);
    let u = e.measureText(c).width,
      d = t * (o ? 0.8 : 0.52);
    (u > d && (l *= d / u),
      (e.font = G0(l)),
      (e.textAlign = `left`),
      (e.textBaseline = `alphabetic`),
      (e.lineJoin = `round`));
    let f = t * 0.07,
      p = n * 0.79,
      m = (r, i, a, o) => s2(e, c, a, o, r, i, t, n);
    (m(palette.cyan, l * 0.1, f - 11, p - 8),
      m(palette.hotPink, l * 0.1, f + 11, p + 8),
      (e.fillStyle = inkPurple),
      e.fillText(c, f + 16, p + 20),
      (e.fillStyle = paperWhite),
      e.fillText(c, f, p),
      m(inkPurple, l * 0.07, f, p),
      e.save(),
      e.translate(t * 0.5, n * (0.54 + s() * 0.06)),
      e.rotate((r % 2 ? -1 : 1) * (0.08 + s() * 0.06)));
    let h = n * 0.125,
      g = t * 1.4;
    ((e.globalAlpha = 0.35),
      (e.fillStyle = inkPurple),
      e.fillRect(-g / 2 + 6, -h / 2 + 10, g, h),
      (e.globalAlpha = 1),
      (e.fillStyle =
        i.toLowerCase() === palette.yellow ? palette.cream : palette.yellow),
      e.fillRect(-g / 2, -h / 2, g, h),
      (e.fillStyle = inkPurple),
      e.fillRect(-g / 2, -h / 2 + 7, g, 5),
      e.fillRect(-g / 2, h / 2 - 12, g, 5),
      (e.font = K0(Math.round(h * 0.4))),
      (e.textAlign = `left`),
      (e.textBaseline = `middle`));
    let _ = o ? `MORE PROJECTS COMING SOON  //  ` : `COMING SOON  //  `,
      v = e.measureText(_).width;
    for (let t = -g / 2 - s() * v; t < g / 2; t += v) e.fillText(_, t, 2);
    e.restore();
    let y = i2.filter((e) => e !== a),
      b = () => y.splice(Math.floor(s() * y.length), 1)[0],
      x = o
        ? []
        : [
            [0.8, 0.46, 0.34],
            [0.58, 0.17, 0.2],
            [0.66, 0.79, 0.19],
          ];
    for (let [r, i, a] of x) {
      let o = b(),
        c = (n * a) / iH(o);
      rH(
        e,
        o,
        t * (r + (s() - 0.5) * 0.04),
        n * (i + (s() - 0.5) * 0.04),
        c,
        (s() - 0.5) * 0.7,
      );
    }
    e.restore();
  }
  var l2 = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.8 6 9.2 12l5.6 6"/></svg>`;
  var u2 = `Move the panels aside`;
  return {
    createProjectCards,
    l2,
    u2,
  };
}
