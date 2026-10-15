// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  Euler,
  Group,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicNodeMaterial,
  Ray,
  Sphere,
  Vector2,
  Vector3,
} from "three/webgpu";
import {
  abs,
  atan,
  attribute,
  clamp,
  dot,
  float,
  floor,
  fract,
  fwidth,
  length,
  max,
  min,
  mix,
  normalLocal,
  normalView,
  positionGeometry,
  sin,
  smoothstep,
  step,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export function createDemoShowcaseModule(
  scope,
  {
    paletteModule,
    renderingModule,
    meshBuildersModule,
    showcaseStateModule,
    demoGeometryModule,
  },
) {
  const { paperWhite, blue, polePurple, inkPurple, palette } = paletteModule;
  const { uI, createToonMaterial } = renderingModule;
  const {
    DG,
    OG,
    kG,
    AG,
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
  } = meshBuildersModule;
  const { d0, m0, CardTuck, _0 } = showcaseStateModule;
  const {
    f2,
    p2,
    m2,
    y2,
    DemoState,
    N2,
    F2,
    I2,
    J2,
    c4,
    MushroomCap,
    w4,
    T4,
    DemoProps,
    X4,
    Q4,
    $4,
    e3,
    a3,
  } = demoGeometryModule;
  var MushroomDemo = class {
    tuning = m2();
    state = new DemoState();
    fx = {
      dim: uniform(1),
      spotK: uniform(0),
      beamK: uniform(0),
      lampK: uniform(0),
      rimWash: uniform(0),
      grid: uniform(1),
      scene: uniform(0),
      heroBurst: uniform(0),
      clock: uniform(0),
      capCell: uniform(0),
      capScale: uniform(1),
      capBar: uniform(0),
      capShow: uniform(0),
    };
    look = {
      ink: uniform(new Color(inkPurple)),
      paper: uniform(new Color(paperWhite)),
      clay: uniform(new Color(`#c4bdd6`)),
      wire: uniform(new Color(palette.cyan)),
      select: uniform(new Color(palette.orange)),
      bakeLine: uniform(new Color(`#c9f6ff`)),
      bakeTint: uniform(new Color(`#8f7dff`)),
      checkA: uniform(new Color(paperWhite)),
      checkB: uniform(new Color(palette.purple)),
      cap: uniform(new Color(palette.red)),
      spots: uniform(new Color(palette.cream)),
      stem: uniform(new Color(palette.cream)),
      gills: uniform(new Color(`#f3c9a2`)),
      blush: uniform(new Color(palette.pink)),
      rim: uniform(new Color(palette.pink)),
      warm: uniform(new Color(`#ffd9a0`)),
      heroShade: uniform(new Color(`#8f7fd8`)),
      heroInk: uniform(new Color(`#3a2a8f`)),
      heroRim: uniform(new Color(palette.cyan)),
      rimStrength: uniform(0.55),
      warmStrength: uniform(0.35),
      aoStrength: uniform(0.85),
      heroDot: uniform(8.5),
      creature: uniform(1),
      sway: uniform(1),
      dotSize: uniform(5),
    };
    root = new Group();
    captions;
    meshes;
    u = {
      wire: uniform(0),
      cut: uniform(0),
      sub: uniform(0),
      select: uniform(0),
      bakeY: uniform(1),
      bakeLine: uniform(0),
      bakeFlash: uniform(0),
      checker: uniform(0),
      paint: uniform(0),
      lit: uniform(0),
      rim: uniform(0),
      warm: uniform(0),
      hero: uniform(0),
      sway: uniform(0),
      lift: uniform(0),
    };
    mushroom;
    particles;
    props;
    profiles;
    rowBuf = new Float32Array(Q4 * 4);
    cosT = new Float32Array(41);
    sinT = new Float32Array(41);
    builtMorph = -1;
    dur = [0, 0, 0, 0, 0, 0];
    phaseIdx = 0;
    t = 0;
    clock = 0;
    yaw = 0;
    loopCount = 0;
    looped = !1;
    puffYaw = 0;
    warmFrames = 2;
    prewarm = !1;
    active = !0;
    constructor() {
      let e = a3();
      this.profiles = e.keys;
      for (let e = 0; e <= X4; e++) {
        let t = (e / X4) * Math.PI * 2;
        ((this.cosT[e] = Math.cos(t)), (this.sinT[e] = Math.sin(t)));
      }
      (N2(this.tuning, this.dur), (this.captions = c4()));
      let t = {
        lit: this.u.lit,
        rim: this.u.rim,
        warm: this.u.warm,
        hero: this.u.hero,
        dim: this.fx.dim,
        clock: this.fx.clock,
        look: this.look,
      };
      ((this.mushroom = new Mesh(
        this.buildMushroom(e.v, e.ao),
        this.mushroomMaterial(t),
      )),
        (this.mushroom.name = `DemoMushroom`),
        (this.mushroom.frustumCulled = !1),
        (this.mushroom.castShadow = this.mushroom.receiveShadow = !1),
        (this.particles = new MushroomCap(
          e.v,
          this.profiles[3],
          $4,
          this.look,
        )),
        (this.props = new DemoProps(this.captions, t)),
        (this.meshes = [this.mushroom, this.particles.mesh, this.props.mesh]),
        this.root.add(...this.meshes),
        this.sample(),
        this.apply());
    }
    get phaseName() {
      return f2[this.phaseIdx];
    }
    get loops() {
      return this.loopCount;
    }
    get spin() {
      return this.state.spin;
    }
    get faceTime() {
      return F2(N2(this.tuning, this.dur));
    }
    get warming() {
      return this.warmFrames > 0 && this.active;
    }
    restart() {
      this.skipTo(0);
    }
    skipTo(e) {
      ((this.phaseIdx = MathUtils.clamp(Math.round(e) || 0, 0, p2 - 1)),
        (this.t = 0),
        (this.looped = !1),
        this.phaseIdx === 0 && this.newLoop(),
        this.sample());
    }
    turnedBy(e) {
      Number.isFinite(e) && (this.puffYaw -= e);
    }
    newLoop() {
      (this.loopCount++, this.clock > 600 && (this.clock %= 600));
    }
    setActive(e) {
      if (((this.active = e), (this.root.visible = e || this.prewarm), !e)) {
        let e = this.fx;
        ((e.dim.value =
          e.spotK.value =
          e.beamK.value =
          e.lampK.value =
          e.rimWash.value =
          e.scene.value =
            1),
          (e.grid.value = e.heroBurst.value = 0),
          (e.capShow.value = 0));
      }
    }
    setPrewarm(e) {
      ((this.prewarm = e),
        e
          ? ((this.root.visible = !0), this.forceDraw())
          : ((this.root.visible = this.active),
            this.props.mesh.scale.setScalar(1),
            this.active ? this.apply() : this.setActive(!1)));
    }
    forceDraw() {
      ((this.mushroom.visible = !0),
        this.particles.mesh.visible || (this.particles.mesh.visible = !0),
        this.props.mesh.visible ||
          ((this.props.mesh.visible = !0),
          this.props.mesh.scale.setScalar(1e-4)));
    }
    update(e, t = 0) {
      if (!this.active) {
        this.prewarm && this.forceDraw();
        return;
      }
      let n = this.tuning;
      N2(n, this.dur);
      let r = Math.max(0, e) * MathUtils.clamp(n.speed, 0, 3);
      ((this.t += r), (this.clock += r), (this.yaw = t));
      for (let e = 0; e < 12 && this.t >= this.dur[this.phaseIdx]; e++) {
        this.t -= this.dur[this.phaseIdx];
        let e = this.phaseIdx;
        (n.autoplay && (this.phaseIdx = (e + 1) % p2),
          this.phaseIdx === 0 &&
            ((this.looped = e === p2 - 1), this.newLoop()));
      }
      (this.t >= this.dur[this.phaseIdx] && (this.t = 0),
        this.sample(),
        this.apply(!0));
    }
    sample() {
      I2(this.phaseIdx, this.t, this.dur, this.state, this.looped);
    }
    apply(e = !1) {
      let t = this.state,
        n = this.u,
        r = this.fx;
      r.clock.value = this.clock;
      let i = Math.max(0, t.show);
      this.mushroom.visible = i > 0.002 && t.mushVisible > 0;
      let a = t.squash,
        o = Math.max(0.001, i * (1 - a * 0.5)),
        s = Math.max(0.001, i * (1 + a));
      (this.mushroom.scale.set(o, s, o),
        (this.mushroom.position.y = t.hopY + t.lift * y2),
        this.mushroom.visible && this.morph(t.morph),
        (n.wire.value = t.wire),
        (n.cut.value = t.cut),
        (n.sub.value = t.sub),
        (n.select.value = t.select),
        (n.bakeY.value = MathUtils.lerp(0.355, -0.03, t.bake)),
        (n.bakeLine.value = t.bakeLine),
        (n.bakeFlash.value = t.bakeFlash),
        (n.checker.value = t.checker),
        (n.paint.value = t.paint),
        (n.lit.value = t.lit),
        (n.rim.value = t.rim),
        (n.warm.value = t.warm),
        (n.hero.value = t.hero),
        (n.sway.value = t.sway * this.look.sway.value),
        (n.lift.value = t.lift * y2));
      let c = this.particles.u;
      (c.pop.value.set(t.dotPop[0], t.dotPop[1], t.dotPop[2]),
        (c.burst.value = t.burst),
        c.mush.value.set(o, s, o, this.mushroom.position.y),
        (c.select.value = t.select),
        (c.spark.value = t.sparkle));
      let l = t.puff >= 0 && t.puff < 0.7;
      (l || (this.puffYaw = 0),
        c.puff.value.set(l ? t.puff : -1, t.puffY, t.puffSize, this.puffYaw),
        (c.clock.value = this.clock));
      let u = t.phase === 0 && i > 0.002 && t.dotPop[0] > 0,
        d = t.burst >= 0 && t.burst < 1.05;
      ((this.particles.mesh.visible = u || d || t.sparkle > 0 || l),
        (this.props.mesh.visible = this.props.pose(t, this.yaw, this.clock)),
        (r.dim.value = t.dim),
        (r.spotK.value = t.spotK),
        (r.beamK.value = t.beamK),
        (r.lampK.value = t.lampK),
        (r.rimWash.value = t.rimWash),
        (r.grid.value = t.grid),
        (r.scene.value = t.scene),
        (r.heroBurst.value = t.heroBurst),
        (r.capCell.value = t.capCell),
        (r.capScale.value = t.capScale),
        (r.capBar.value = t.capBar),
        (r.capShow.value = 1),
        this.prewarm
          ? this.forceDraw()
          : e && this.warmFrames > 0
            ? (this.warmFrames--, this.forceDraw())
            : this.props.mesh.scale.x !== 1 &&
              this.props.mesh.scale.setScalar(1));
    }
    buildMushroom(e, t) {
      let n = 41 * Q4,
        r = new BufferGeometry(),
        i = new BufferAttribute(new Float32Array(n * 3), 3).setUsage(
          DynamicDrawUsage,
        ),
        a = new BufferAttribute(new Float32Array(n * 3), 3).setUsage(
          DynamicDrawUsage,
        ),
        o = new Float32Array(n * 2),
        s = new Float32Array(n * 4),
        c = new Float32Array(n),
        l = this.profiles[3],
        u = new Float32Array(Q4);
      for (let e = 1; e < Q4; e++)
        u[e] =
          u[e - 1] +
          Math.hypot(l[e * 4] - l[e * 4 - 4], l[e * 4 + 1] - l[e * 4 - 3]);
      for (let n = 0; n < Q4; n++)
        for (let r = 0; r <= X4; r++) {
          let i = n * 41 + r;
          ((o[i * 2] = r / X4),
            (o[i * 2 + 1] = e[n]),
            (s[i * 4] = l[n * 4] * this.sinT[r]),
            (s[i * 4 + 1] = l[n * 4 + 1]),
            (s[i * 4 + 2] = l[n * 4] * this.cosT[r]),
            (s[i * 4 + 3] = u[n] / u[Q4 - 1]),
            (c[i] = t[n]));
        }
      let d = [];
      for (let e = 0; e < Q4 - 1; e++)
        for (let t = 0; t < X4; t++) {
          let n = e * 41 + t,
            r = n + 1,
            i = n + X4 + 1,
            a = i + 1;
          d.push(n, r, a, n, a, i);
        }
      return (
        r.setIndex(d),
        r.setAttribute(`position`, i),
        r.setAttribute(`normal`, a),
        r.setAttribute(`uv`, new BufferAttribute(o, 2)),
        r.setAttribute(`rest`, new BufferAttribute(s, 4)),
        r.setAttribute(`ao`, new BufferAttribute(c, 1)),
        (r.boundingSphere = new Sphere(new Vector3(0, 0.2, 0), 0.5)),
        r
      );
    }
    morph(e) {
      if (
        ((e = MathUtils.clamp(e, 0, 3)), Math.abs(e - this.builtMorph) < 1e-4)
      )
        return;
      this.builtMorph = e;
      let t = Math.min(2, Math.floor(e)),
        n = e - t,
        r = this.profiles[t],
        i = this.profiles[t + 1],
        a = this.rowBuf;
      for (let e = 0; e < Q4; e++) {
        let t = e * 4;
        ((a[t] = r[t] + (i[t] - r[t]) * n),
          (a[t + 1] = r[t + 1] + (i[t + 1] - r[t + 1]) * n));
        let o = r[t + 2] + (i[t + 2] - r[t + 2]) * n,
          s = r[t + 3] + (i[t + 3] - r[t + 3]) * n,
          c = Math.hypot(o, s) || 1;
        ((a[t + 2] = o / c), (a[t + 3] = s / c));
      }
      let o = this.mushroom.geometry,
        s = o.getAttribute(`position`),
        c = o.getAttribute(`normal`),
        l = s.array,
        u = c.array;
      for (let e = 0; e < Q4; e++) {
        let t = e * 4;
        for (let n = 0; n <= X4; n++) {
          let r = (e * 41 + n) * 3;
          ((l[r] = a[t] * this.sinT[n]),
            (l[r + 1] = a[t + 1]),
            (l[r + 2] = a[t] * this.cosT[n]),
            (u[r] = a[t + 2] * this.sinT[n]),
            (u[r + 1] = a[t + 3]),
            (u[r + 2] = a[t + 2] * this.cosT[n]));
        }
      }
      ((s.needsUpdate = !0), (c.needsUpdate = !0), this.particles.setDots(a));
    }
    mushroomMaterial(e) {
      let t = this.u,
        n = this.look,
        r = uv(),
        i = r.x,
        a = r.y,
        o = attribute(`rest`, `vec4`),
        s = attribute(`ao`, `float`),
        c = o.xyz,
        l = o.y.div($4),
        u = step(3, a),
        d = step(2, a).mul(u.oneMinus()),
        f = step(2, a).oneMinus(),
        p = c.y.sub(t.bakeY),
        m = kG(p.negate()),
        h = kG(abs(p).sub(0.0035)).mul(t.bakeLine),
        g = m.mul(float(1).sub(smoothstep(0, 0.1, p))).mul(t.bakeLine),
        _ = m
          .mul(float(1).sub(smoothstep(0, 0.035, p)))
          .mul(t.bakeLine)
          .mul(0.35)
          .add(h.mul(1.3)),
        v = (e, t) => e.div(max(fwidth(t), 1e-5)),
        y = i.mul(e3),
        b = i.mul(16),
        x = v(abs(fract(y.add(0.5)).sub(0.5)), y),
        S = v(abs(fract(b.add(0.5)).sub(0.5)), b),
        C = a.mul(2),
        w = v(abs(fract(a.add(0.5)).sub(0.5)), a),
        T = v(abs(fract(C.add(0.5)).sub(0.5)), C),
        E = floor(a.add(0.5)),
        D = step(E, 0.5).add(step(4.5, E)),
        ee = step(1.5, E).mul(step(E, 3.5)),
        te = mix(float(1), t.cut, ee).mul(D.oneMinus()),
        O = uI.mul(0.65),
        ne = (e) => clamp(O.add(0.5).sub(e), 0, 1),
        re = t.sub.mul(m.oneMinus()),
        ie = max(
          max(ne(x), ne(S).mul(re)),
          max(ne(w).mul(te), ne(T).mul(re).mul(D.oneMinus())),
        )
          .mul(t.wire)
          .mul(mix(float(1), float(0.55), m)),
        ae = sin(i.mul(Math.PI * 2 * 3).add(l.mul(5))).mul(0.025),
        oe = t.checker.mul(1.25).sub(0.1),
        se = kG(l.sub(oe).add(ae)),
        ce = floor(i.mul(12)).add(floor(o.w.mul(7))),
        le = mix(DG(n.checkA), DG(n.checkB), fract(ce.mul(0.5)).mul(2)),
        ue = u.mul(t.select),
        de = mix(mix(DG(n.clay), DG(n.select), ue.mul(0.45)), le, se),
        fe = DG(n.cap);
      for (let [e, t, r] of s3) {
        let i = new Vector3(
          0.2 * Math.cos(e) * Math.sin(t),
          0.158 + 0.167 * Math.sin(e),
          0.2 * Math.cos(e) * Math.cos(t),
        );
        fe = mix(
          fe,
          DG(n.spots),
          kG(length(c.sub(vec3(i.x, i.y, i.z))).sub(r)),
        );
      }
      let pe = DG(n.stem),
        me = step(0, c.z);
      for (let e of [-1, 1]) {
        let t = length(
          vec2(c.x.sub(e * 0.052).div(0.02), c.y.sub(0.064).div(0.011)),
        ).sub(1);
        pe = mix(pe, DG(n.blush), kG(t).mul(me).mul(0.75));
        let r = length(
          vec2(c.x.sub(e * 0.03).div(0.011), c.y.sub(0.088).div(0.016)),
        ).sub(1);
        pe = mix(pe, DG(n.ink), kG(r).mul(me));
      }
      let he = step(0.72, fract(i.mul(48))).mul(0.35),
        ge = mix(DG(n.gills), DG(n.gills).mul(0.72), he),
        _e = fe.mul(u).add(ge.mul(d)).add(pe.mul(f)),
        ve = float(1.12).sub(t.paint.mul(1.3)),
        ye = l.sub(ve).sub(ae),
        be = kG(ye.negate()),
        xe = kG(abs(ye.add(0.018)).sub(0.01))
          .mul(step(0.001, t.paint))
          .mul(step(t.paint, 0.999));
      ((de = mix(de, _e, be)),
        (de = mix(de, DG(n.ink), xe.mul(0.45))),
        (de = de.mul(
          mix(
            float(1),
            s,
            m.mul(n.aoStrength).mul(mix(float(1), float(0.45), max(se, be))),
          ),
        )));
      let Se = w4(c.y.add(t.lift), t.hero),
        Ce = createToonMaterial(
          {
            color: 16777215,
          },
          {
            wear: !1,
            creature: !0,
          },
        );
      ((Ce.name = `DemoMushroom`), (Ce.colorNode = vec4(de, 1)));
      let we = positionGeometry.y.div($4).clamp(0, 1.2),
        Te = this.fx.clock,
        Ee = sin(Te.mul(2.1))
          .mul(0.016)
          .add(sin(Te.mul(3.7).add(1)).mul(0.005)),
        De = sin(Te.mul(1.6).add(0.7)).mul(0.01);
      return (
        (Ce.positionNode = positionGeometry.add(
          vec3(Ee, 0, De).mul(we.mul(we).mul(t.sway)),
        )),
        Object.assign(Ce, {
          emissiveNode: DG(n.bakeLine)
            .mul(_)
            .add(DG(n.rim).mul(Se.edge.mul(1.4))),
        }),
        (Ce.outputNode = T4(e, Ce.outputNode, Se.mask, {
          contour: 1,
          overlay: (e, r) => {
            let i = vec3(
                r.x.mul(0.5).add(0.5),
                r.y.mul(0.5).add(0.5),
                r.z.mul(0.15).add(0.85),
              ),
              a = mix(i.mul(i), DG(n.bakeTint), 0.35);
            e.assign(mix(e, a, max(g.mul(0.85), t.bakeFlash)));
            let o = mix(DG(n.wire), DG(n.select), ue);
            (e.assign(mix(e, o, ie)), e.assign(mix(e, DG(n.bakeLine), h)));
          },
        })),
        Ce
      );
    }
  };
  var s3 = [
    [Math.PI / 2, 0, 0.042],
    ...[0, 1, 2, 3, 4].map((e) => [0.85, (e / 5) * Math.PI * 2 + 0.3, 0.036]),
    ...[0, 1, 2, 3, 4].map((e) => [
      0.28,
      (e / 5) * Math.PI * 2 + 0.3 + Math.PI / 5,
      0.03,
    ]),
  ];
  var c3 = 0;
  var l3 = 1;
  var u3 = 2;
  var d3 = 3;
  var f3 = 4;
  var p3 = 5;
  var m3 = 6;
  var h3 = -0.035;
  var g3 = 0.04;
  function _3(e, t, n) {
    let r = e.sub(t),
      i = n.sub(t),
      a = clamp(dot(r, i).div(dot(i, i)), 0, 1);
    return length(r.sub(i.mul(a)));
  }
  var v3 = 0.17;
  var y3 = 0.36;
  var b3 = new Vector3(-0.5, 0.62, 0.6).normalize();
  var AboutPanel = class {
    group = new Group();
    tuning = {
      depth: 4.5,
      x: -0.34,
      touchX: -0.46,
      touchWidth: 0.38,
      y: 0.02,
      width: 0.45,
      height: 0.56,
      portraitX: 0,
      portraitY: 0.56,
      portraitWidth: 0.72,
      portraitHeight: 0.3,
      squarePole: 0.86,
      squareReach: 0.97,
      squareGrow: 0.06,
      aspect: 1.25,
      portraitAspect: 0.92,
      caseDepth: 0.9,
      fill: 0.9,
      roll: 0.02,
      pitch: 0.1,
      hoverTilt: 0.07,
      followTilt: 0.02,
      hoverScale: 0.02,
      hoverAberration: 0.2,
      hoverPulse: 0.35,
      bob: 1,
      spin: 0.35,
      hoverSpin: 1.4,
      aberration: 0.02,
      appearAberration: 0.14,
      appearSpeed: 8,
      ...m0,
    };
    look = {
      ink: uniform(new Color(inkPurple)),
      paper: uniform(new Color(paperWhite)),
      frame: uniform(new Color(blue)),
      plateA: uniform(new Color(palette.cyan)),
      plateB: uniform(new Color(palette.hotPink)),
      shadowDots: uniform(new Color(palette.lilac)),
      wallHigh: uniform(new Color(`#3a2a8f`)),
      wallLow: uniform(new Color(`#1f1550`)),
      wallSide: uniform(new Color(`#2b1f6c`)),
      floorFront: uniform(new Color(`#5a47b6`)),
      floorBack: uniform(new Color(`#33267c`)),
      ceiling: uniform(new Color(`#1a1244`)),
      light: uniform(new Color(`#ffe7c2`)),
      frameWidth: uniform(0.11),
      inkLine: uniform(0.018),
      paperWidth: uniform(0.03),
      radius: uniform(0.05),
      shadowOffset: uniform(new Vector2(0, 0)),
      shadowAlpha: uniform(0),
      dotFreq: uniform(26),
      dotSize: uniform(0.32),
      spot: uniform(0.22),
      lampGlow: uniform(2.2),
      beamGlow: uniform(0.12),
      glass: uniform(0.07),
      gizmoY: uniform(new Color(palette.lime)),
      pedestal: uniform(new Color(polePurple)),
      pedestalShade: uniform(new Color(`#8f7fd8`)),
    };
    u = {
      hole: uniform(new Vector2(0.625, 0.5)),
      depth: uniform(0.9),
      reveal: uniform(0),
      aberr: uniform(0.02),
      jitter: uniform(new Vector2()),
      empty: uniform(1),
    };
    demo = new MushroomDemo();
    demoTuning = this.demo.tuning;
    demoLook = this.demo.look;
    stack = new LayeredQuadGeometry(m3);
    mesh;
    pedestal;
    turntable = new Group();
    holder = new Group();
    model = null;
    modelBox = new Box3();
    v3 = new Vector3();
    c3 = new Vector3();
    demoScale = 1;
    demoLoop = -1;
    builtAspect = -1;
    builtDepth = -1;
    builtFrame = -1;
    builtPad = -1;
    fitted = -1;
    pedScale = 1;
    aspect = 1.25;
    shown = 0;
    cut = !1;
    clock = 0;
    pulse = 0;
    hover = 0;
    hoverAge = HG;
    over = !1;
    away = 1;
    tiltX = 0;
    tiltY = 0;
    pop = 1;
    jitterClock = 0;
    wasShown = !1;
    prewarm = !1;
    tuck = new CardTuck(this.tuning);
    rest = {
      at: new Vector3(),
      turn: new Euler(),
      s: 0,
      ox: 0,
    };
    point = new Vector3();
    restM = new Matrix4();
    restS = new Vector3();
    ray = new Ray();
    buttonHover = !1;
    tanHalf = Math.tan(MathUtils.degToRad(30.5 / 2));
    camAspect = window.innerWidth / Math.max(1, window.innerHeight);
    portrait = !1;
    box = {
      x: 0,
      w: 0,
    };
    portraitBox = null;
    constructor() {
      let e = this.stack;
      for (let t = 0; t < m3; t++) e.setLayer(t, t);
      (e.setUV(l3, [0, 0, 1, 1]),
        e.setUV(u3, [0, 1, 1, 0]),
        e.setUV(d3, [0, 0, 1, 1]),
        e.setUV(f3, [1, 0, 0, 1]),
        e.setNormal(l3, 0, 1, 0),
        e.setNormal(u3, 0, -1, 0),
        e.setNormal(d3, 1, 0, 0),
        e.setNormal(f3, -1, 0, 0),
        e.commitStatic(),
        e.geometry.addGroup(0, 30, 0),
        e.geometry.addGroup(30, 6, 1),
        (this.mesh = new Mesh(e.geometry, [
          this.createInteriorMaterial(),
          this.createFrontMaterial(),
        ])),
        (this.mesh.name = `ModelStage`),
        (this.mesh.frustumCulled = !1));
      let t = [
        new CylinderGeometry(y3, y3, 0.06, 48).translate(0, 0.03, 0),
        new CylinderGeometry(y3 * 0.82, y3 * 0.86, 0.08, 48).translate(
          0,
          0.1,
          0,
        ),
        new CylinderGeometry(y3 * 0.94, y3 * 0.94, 0.03, 48).translate(
          0,
          0.15500000000000003,
          0,
        ),
      ];
      ((this.pedestal = new Mesh(
        mergeGeometries(t),
        this.createPedestalMaterial(),
      )),
        t.forEach((e) => e.dispose()),
        (this.pedestal.name = `Pedestal`),
        (this.pedestal.castShadow = this.pedestal.receiveShadow = !1),
        this.turntable.add(this.holder, this.demo.root),
        this.group.add(this.mesh, this.pedestal, this.turntable),
        (this.group.visible = !1));
    }
    get hovered() {
      return this.over;
    }
    get tuckAmount() {
      return this.tuck.amount;
    }
    get presented() {
      return (
        !this.prewarm &&
        this.group.visible &&
        this.u.reveal.value === 1 &&
        !this.tuck.swept
      );
    }
    get phaseName() {
      return this.demo.phaseName;
    }
    restart() {
      this.demo.restart();
    }
    skipTo(e) {
      this.demo.skipTo(e);
    }
    cutAway() {
      this.cut = !0;
    }
    setPrewarm(e) {
      ((this.prewarm = e),
        this.demo.setPrewarm(e),
        e
          ? this.forceWarm()
          : ((this.group.visible = this.shown > 0),
            this.shown === 0 &&
              (this.pedestal.scale.setScalar(1),
              this.turntable.scale.setScalar(1))));
    }
    forceWarm() {
      ((this.group.visible = !0),
        (this.mesh.visible =
          this.pedestal.visible =
          this.turntable.visible =
            !0),
        this.shown === 0 &&
          (this.pedestal.scale.setScalar(1e-4),
          this.turntable.scale.setScalar(1e-4)));
    }
    shape() {
      let e = this.look,
        t = this.u.hole,
        n = t.add(e.frameWidth),
        r = n.add(e.inkLine),
        i = r.add(e.paperWidth),
        a = positionGeometry.xy;
      return {
        P: a,
        hole: t,
        body: n,
        inkOut: r,
        outer: i,
        sweep: clamp(
          a.x.div(i.x).mul(0.15).add(a.y.div(i.y).mul(0.1)).add(0.3),
          0,
          0.6,
        ),
      };
    }
    createFrontMaterial() {
      let e = this.u,
        t = this.look,
        {
          P: n,
          hole: r,
          body: i,
          inkOut: a,
          outer: o,
          sweep: s,
        } = this.shape(),
        c = t.radius,
        l = c.add(t.inkLine).add(t.paperWidth),
        u = DG(t.ink),
        d = DG(t.paper),
        f = OG(n, r, c.mul(0.3)),
        p = OG(n, i, c),
        m = mix(d, u, kG(OG(n, a, c.add(t.inkLine))));
      m = mix(m, DG(t.frame), kG(p));
      let h = kG(p).mul(float(1).sub(kG(OG(n.sub(vec2(0.022, -0.022)), i, c))));
      ((m = mix(m, d, h.mul(0.35))),
        (m = mix(m, u, kG(OG(n, r.add(t.inkLine), c.mul(0.5))))));
      let g = r.add(t.frameWidth.mul(0.5)),
        _ = length(abs(n).sub(g)).sub(0.017);
      ((m = mix(m, u, kG(_))), (m = mix(m, d, kG(_.add(0.007)))));
      let v = kG(f),
        y = IG(n, r).mul(t.glass);
      m = mix(m, d, v);
      let b = mix(kG(OG(n, o, l)), y, v),
        x = kG(OG(n.sub(t.shadowOffset), o, l))
          .mul(t.shadowAlpha)
          .mul(v.oneMinus()),
        S = (e) => kG(OG(e, o, l)).mul(float(1).sub(kG(OG(e, r, c.mul(0.3))))),
        C = S(n.sub(vec2(-1, 0.55).mul(e.aberr).add(e.jitter))),
        w = S(n.sub(vec2(1, -0.55).mul(e.aberr).sub(e.jitter))),
        T = mix(u, DG(t.shadowDots), NG(n, t.dotFreq, t.dotSize));
      ((T = mix(T, DG(t.plateB), w)), (T = mix(T, DG(t.plateA), C)));
      let E = max(x, max(C, w)),
        [D, ee] = LG(m, b, T, E),
        te = this.demo.fx,
        O = vec2(0.25, 0.0625).mul(te.capScale),
        ne = vec2(
          r.x.negate().add(0.29),
          r.y.negate().sub(t.frameWidth.add(t.inkLine).mul(0.5)),
        ),
        re = n.sub(ne),
        ie = Math.cos(h3),
        ae = Math.sin(h3),
        oe = vec2(
          re.x.mul(ie).add(re.y.mul(ae)),
          re.y.mul(ie).sub(re.x.mul(ae)),
        )
          .div(O.mul(2))
          .add(0.5),
        se = step(0, oe.x)
          .mul(step(oe.x, 1))
          .mul(step(0, oe.y))
          .mul(step(oe.y, 1)),
        ce = clamp(oe, 0, 1),
        le = texture(
          this.demo.captions,
          vec2(ce.x, float(7).sub(te.capCell).add(ce.y).div(8)),
        ),
        ue = ce.x.mul(512),
        de = ce.y.oneMinus().mul(128),
        fe = te.capBar.mul(J2.x1 - J2.x0).add(J2.x0),
        pe = step(J2.x0, ue)
          .mul(step(ue, fe))
          .mul(step(J2.y0, de))
          .mul(step(de, J2.y1)),
        me = max(le.a, pe).mul(se).mul(te.capShow),
        [he, ge] = LG(mix(le.rgb, DG(t.plateB), pe), me, D, ee),
        _e = new MeshBasicNodeMaterial({
          transparent: !0,
          alphaTest: 0.02,
        });
      return (
        (_e.name = `ModelStageFront`),
        (_e.colorNode = vec4(he, ge.mul(PG(n, e.reveal, s, 13)))),
        _e
      );
    }
    createInteriorMaterial() {
      let e = this.u,
        t = this.look,
        { P: n, hole: r, sweep: i } = this.shape(),
        a = uv(),
        o = attribute(`layer`, `float`),
        s = zG(o, c3),
        c = zG(o, l3),
        l = zG(o, u3),
        u = zG(o, d3).add(zG(o, f3)),
        d = e.depth,
        f = DG(t.ink),
        p = DG(t.paper),
        m = DG(t.light),
        h = this.demo.fx,
        g = t.spot.mul(h.spotK),
        _ = DG(t.plateB),
        v = mix(float(0.35), float(1), h.scene),
        y = n.y.div(r.y).mul(0.5).add(0.5),
        b = mix(DG(t.wallLow), DG(t.wallHigh), y),
        x = mix(float(0.42), float(0.1), y),
        S = kG(abs(n.x).sub(x)).mul(mix(float(1), float(0.55), y)),
        C = float(1).sub(
          smoothstep(
            0.2,
            1,
            length(vec2(n.x.div(0.55), n.y.add(r.y).div(0.35))),
          ),
        );
      ((b = b.add(m.mul(S.mul(0.8).add(C.mul(0.7)).mul(g)))),
        (b = b.add(
          _.mul(smoothstep(0.1, 1, n.x.div(r.x)).mul(h.rimWash.mul(0.16))),
        )));
      let w = n.sub(vec2(0, r.y.negate().add(0.47))),
        T = kG(
          abs(
            fract(
              atan(w.y, w.x)
                .mul(14 / (Math.PI * 2))
                .add(h.clock.mul(0.05)),
            ).sub(0.5),
          ).sub(0.25),
        ),
        E = length(w),
        D = kG(E.sub(h.heroBurst.mul(1.7)))
          .mul(smoothstep(0.08, 0.3, E))
          .mul(h.heroBurst);
      b = mix(b, mix(b, DG(t.shadowDots), 0.3).add(m.mul(0.05)), T.mul(D));
      let ee = smoothstep(0.35, 0.95, length(n.div(r)).mul(0.75));
      b = mix(b, f, NG(n, t.dotFreq, ee.mul(0.5)).mul(0.55).mul(v));
      let te = float(0.71).mul(0.5),
        O = vec2(0, r.y.negate().add(0.21000000000000002).add(te)),
        ne = OG(n.sub(O), vec2(r.x.mul(0.62).min(d.mul(0.55)), te), 0.05),
        re = step(0.5, fract(n.x.add(n.y).mul(12)));
      b = mix(b, p, AG(ne, 0.006).mul(re).mul(e.empty).mul(h.grid).mul(0.7));
      let ie = vec2(r.x.negate().add(0.13), r.y.negate().add(0.13)),
        ae = (e, t, r) => {
          let i = _3(n, ie, ie.add(vec2(e[0], e[1]))),
            a = length(n.sub(ie).sub(vec2(e[0], e[1]))).sub(0.016);
          return mix(r, t, max(kG(i.sub(0.006)), kG(a)).mul(h.grid));
        };
      ((b = ae([-0.05, -0.045], DG(t.plateA), b)),
        (b = ae([0, 0.085], DG(t.gizmoY), b)),
        (b = ae([0.085, 0], _, b)));
      let oe = a.x.sub(0.5).mul(r.x.mul(2)),
        se = a.y.mul(d),
        ce = vec2(oe, se.sub(d.mul(0.5))),
        le = mix(DG(t.floorFront), DG(t.floorBack), a.y),
        ue = float(1).sub(
          smoothstep(0.25, 1, length(ce.div(vec2(0.62, d.mul(0.48))))),
        );
      le = le.add(m.mul(ue.mul(g).mul(1.3)));
      let de = ce.div(0.1),
        fe = (e) => abs(fract(e.add(0.5)).sub(0.5)).div(max(fwidth(e), 1e-5)),
        pe = clamp(float(1.1).sub(min(fe(de.x), fe(de.y))), 0, 1),
        me = float(1)
          .sub(smoothstep(0.25, 0.75, length(ce)))
          .mul(h.grid);
      ((le = mix(le, DG(t.plateA), pe.mul(me).mul(0.5))),
        (le = mix(le, _, clamp(float(1.6).sub(fe(de.y)), 0, 1).mul(me))),
        (le = mix(
          le,
          DG(t.plateA),
          clamp(float(1.6).sub(fe(de.x)), 0, 1).mul(me),
        )));
      let he = kG(length(ce.sub(vec2(0.04, -0.05))).sub(0.41));
      ((le = mix(le, f, he.mul(NG(vec2(oe, se), t.dotFreq, 0.36)).mul(0.8))),
        (le = mix(le, p, float(1).sub(step(0.035, a.y)).mul(0.25))));
      let ge = OG(
          vec2(oe, se.sub(d.mul(0.42))),
          vec2(r.x.mul(0.45), 0.035),
          0.03,
        ),
        _e = kG(ge),
        ve = float(1).sub(smoothstep(0, 0.3, ge.max(0))),
        ye = DG(t.ceiling)
          .add(m.mul(ve.mul(0.18).mul(h.lampK)))
          .mul(h.dim);
      ye = mix(
        ye,
        mix(mix(DG(t.ceiling), p, 0.22), m, clamp(h.lampK, 0, 1)),
        _e.mul(h.scene),
      );
      let be = mix(DG(t.wallSide), DG(t.wallLow), a.x);
      ((be = mix(
        be,
        f,
        NG(
          vec2(positionGeometry.z, positionGeometry.y),
          t.dotFreq,
          a.x.mul(0.4),
        )
          .mul(0.5)
          .mul(v),
      )),
        (be = be.add(
          _.mul(
            h.rimWash.mul(0.28).mul(a.x.mul(0.5).oneMinus()).mul(zG(o, f3)),
          ),
        )));
      let xe = b.mul(s).add(le.mul(c)).add(be.mul(u)).mul(h.dim).add(ye.mul(l)),
        Se = n
          .mul(s)
          .add(vec2(positionGeometry.x, positionGeometry.z).mul(c.add(l)))
          .add(vec2(positionGeometry.z, positionGeometry.y).mul(u)),
        Ce = new MeshBasicNodeMaterial({
          alphaTest: 0.5,
        });
      return (
        (Ce.name = `ModelStageInterior`),
        (Ce.colorNode = vec4(xe, PG(Se, e.reveal, i, 13))),
        Object.assign(Ce, {
          emissiveNode: m.mul(
            _e
              .mul(t.lampGlow.mul(h.lampK).mul(h.scene))
              .mul(l)
              .add(S.mul(t.beamGlow.mul(h.beamK)).mul(s)),
          ),
        }),
        Ce
      );
    }
    createPedestalMaterial() {
      let e = this.look,
        t = this.demo.fx,
        n = DG(e.pedestal),
        r = kG(dot(normalView, vec3(b3.x, b3.y, b3.z))),
        i = smoothstep(0.5, 0.7, normalLocal.y),
        a = mix(n, n.mul(DG(e.pedestalShade)), r);
      a = mix(
        a,
        DG(e.ink),
        NG(positionGeometry.xy, e.dotFreq, 0.26).mul(r).mul(0.3),
      );
      let o = mix(n, DG(e.paper), 0.2).add(DG(e.light).mul(t.spotK.mul(0.08)));
      a = mix(a, o, i);
      let s = new MeshBasicNodeMaterial();
      return ((s.name = `Pedestal`), (s.colorNode = vec4(a.mul(t.dim), 1)), s);
    }
    setModel(e) {
      if (
        (this.model && this.holder.remove(this.model),
        (this.model = e),
        this.demo.setActive(!e),
        (this.pulse = 1),
        (this.pop = 0),
        !e)
      ) {
        this.demo.restart();
        return;
      }
      (e.removeFromParent(),
        e.updateMatrixWorld(!0),
        this.modelBox.setFromObject(e),
        e.traverse((e) => (e.castShadow = !1)),
        this.holder.add(e),
        this.fit());
    }
    fit() {
      this.fitted = this.tuning.fill;
      let e = Math.min((this.aspect / 2) * 0.82, this.tuning.caseDepth * 0.46),
        t = 0.71;
      if (
        ((this.demoScale =
          Math.min(e / 0.42, t / 0.5) * (this.tuning.fill / 0.9)),
        this.demo.root.scale.setScalar(this.demoScale),
        !this.model || this.modelBox.isEmpty())
      ) {
        (this.holder.scale.setScalar(1), this.holder.position.set(0, 0, 0));
        return;
      }
      let n = this.modelBox.getSize(this.v3),
        r = this.modelBox.getCenter(this.c3),
        i = Math.max(Math.hypot(n.x, n.z) / 2, 1e-6),
        a = Math.min(e / i, t / Math.max(n.y, 1e-6)) * this.tuning.fill;
      (this.holder.scale.setScalar(a),
        this.holder.position.set(-r.x * a, -this.modelBox.min.y * a, -r.z * a));
    }
    layout(e) {
      ((this.tanHalf = Math.tan(MathUtils.degToRad(e.fov / 2))),
        (this.camAspect = e.aspect),
        (this.portrait = e.aspect < 0.9));
    }
    touch = !1;
    get portraitVisualAspect() {
      let e =
        this.look.frameWidth.value +
        this.look.inkLine.value +
        this.look.paperWidth.value;
      return (this.tuning.portraitAspect + 2 * e + 0.1) / (1 + 2 * e + 0.1);
    }
    layoutBox() {
      let e = this.tuning,
        t = this.box;
      if (this.portrait)
        return ((t.x = e.portraitX), (t.w = e.portraitWidth), t);
      let n = this.touch ? e.touchX : e.x,
        r = this.touch ? e.touchWidth : e.width,
        i = n + r,
        a = e.squarePole - e.squareReach / this.camAspect;
      if (a >= i) ((t.x = n), (t.w = r));
      else {
        let o = n - r - Math.min(e.squareGrow, i - a),
          s = Math.max(a, o + 0.3);
        ((t.x = (o + s) / 2), (t.w = (s - o) / 2));
      }
      return t;
    }
    update(e, t, n) {
      let r = this.tuning,
        i = this.u,
        a = Number.isFinite(t) ? MathUtils.clamp(t, 0, 1) : 0;
      (this.cut && a < this.shown && (this.shown = a),
        (this.cut = !1),
        (this.shown =
          r.appearSpeed > 0 ? _0(this.shown, a, e, r.appearSpeed) : a),
        Number.isFinite(this.shown) || (this.shown = a),
        a === 0 && this.shown < 0.004 && (this.shown = 0));
      let o = this.wasShown;
      if (
        ((this.wasShown = this.shown > 0),
        (this.group.visible = this.wasShown),
        !this.group.visible)
      ) {
        ((this.over = !1),
          (this.hover = 0),
          (this.hoverAge = HG),
          (this.away = 1),
          this.tuck.park(),
          this.prewarm && this.forceWarm());
        return;
      }
      (!o && !this.model && this.demo.restart(),
        (this.clock += e),
        (this.pulse *= Math.exp(-e * 4)),
        (this.pop = Math.min(1, this.pop + e / 0.7)),
        (this.aspect = this.portrait ? r.portraitAspect : r.aspect));
      let s =
          this.look.frameWidth.value +
          this.look.inkLine.value +
          this.look.paperWidth.value,
        c = r.depth * this.tanHalf,
        l = c * this.camAspect,
        u = this.layoutBox(),
        d = u.x * l,
        f = this.portrait ? this.portraitBox : null,
        p = (f ? f.y : this.portrait ? r.portraitY : r.y) * c,
        m = u.w * 2 * l,
        h = (f ? f.h : this.portrait ? r.portraitHeight : r.height) * 2 * c,
        g = this.aspect / 2 + s,
        _ = 0.5 + s,
        v = BG(this.shown),
        y = Math.min(m / (2 * g + 0.1), h / (2 * _ + 0.1)) * (0.86 + 0.14 * v),
        b = this.tuck;
      b.step(e, this.over);
      let x = b.amount,
        S = g * y,
        C = b.edge(d + S, 2 * S, l, c),
        w = Math.atan2(-d, r.depth),
        T = C - S,
        E = 0;
      for (let e = 0; e < 2 && x > 0; e++)
        ((E = Math.atan2(-T, r.depth) - w),
          (T = (C * (r.depth + S * Math.sin(E))) / r.depth - S * Math.cos(E)));
      let D = T + (1 - v) * 0.22 * m * (1 - 2 * x),
        ee =
          p +
          Math.sin(this.clock * 0.9 + 1) * 0.006 * c * r.bob -
          (1 - v) * 0.06 * h,
        te =
          r.roll +
          Math.sin(this.clock * 0.6) * 0.005 * r.bob +
          (1 - v) * 0.12 +
          b.roll,
        O = this.rest;
      (O.at.set(D, ee, -r.depth),
        O.turn.set(r.pitch, E, te),
        (O.s = y),
        (O.ox = g));
      let ne = this.buttonHover || (Math.abs(n.x) <= 1 && Math.abs(n.y) <= 1),
        re = g,
        ie = 0;
      if (!this.buttonHover && x > 0) {
        let e = this.point;
        (this.restM
          .makeRotationFromEuler(O.turn)
          .scale(this.restS.setScalar(y))
          .setPosition(O.at),
          this.ray.direction.set(n.x * l, n.y * c, -r.depth).normalize(),
          YG(this.restM, this.ray, e) || e.set(1e3, 1e3, 0),
          (re = e.x),
          (ie = e.y));
      } else if (!this.buttonHover) {
        let e = (n.x * l - D) / y,
          t = (n.y * c - ee) / y,
          r = Math.cos(-te),
          i = Math.sin(-te);
        ((re = e * r - t * i), (ie = e * i + t * r));
      }
      let ae = this.over ? UG : 0,
        oe = ne && v > 0.6 && Math.abs(re) <= g + ae && Math.abs(ie) <= _ + ae;
      (oe &&
        !this.over &&
        this.away >= 0.3 &&
        this.hoverAge >= 0.5 &&
        (this.hoverAge = 0),
        (this.over = oe),
        (this.away = oe ? 0 : Math.min(this.away + e, 1)),
        (this.hoverAge = Math.min(this.hoverAge + e, HG)),
        (this.hover = MathUtils.clamp(this.hover + (oe ? e : -e) / VG, 0, 1)));
      let se = WG(this.hover),
        ce = 1 - Math.exp(-e * 6),
        le = MathUtils.lerp(ne ? r.followTilt : 0, r.hoverTilt, se) * (1 - x);
      ((this.tiltY += (MathUtils.clamp(re / g, -1, 1) * le - this.tiltY) * ce),
        (this.tiltX +=
          (-MathUtils.clamp(ie / _, -1, 1) * le - this.tiltX) * ce),
        this.group.position.set(D, ee, -r.depth),
        this.group.scale.setScalar(y * (1 + r.hoverScale * se * (1 - x))),
        this.group.rotation.set(r.pitch + this.tiltX, this.tiltY + E, te));
      let ue = b.parked,
        de = this.model ? 1 + se * (r.hoverSpin - 1) : this.demo.spin;
      ue ||
        (this.turntable.rotation.y =
          (this.turntable.rotation.y + e * r.spin * de) % (Math.PI * 2));
      let fe = this.pop,
        pe = fe >= 1 ? 1 : 1 - 2 ** (-9 * fe) * Math.cos(fe * Math.PI * 3.2),
        me = BG((v - 0.25) / 0.55);
      if (
        ((this.pedestal.visible = me > 0 && !ue),
        (this.turntable.visible =
          (me > 0 || (!this.model && this.demo.warming)) && !ue),
        this.pedestal.scale.set(
          this.pedScale * me,
          Math.max(me, 0.001),
          this.pedScale * me,
        ),
        (this.turntable.position.y = -0.5 + v3 * me),
        this.turntable.scale.setScalar(Math.max(0.001, pe * me)),
        !this.model && !ue)
      ) {
        if (this.demo.loops !== this.demoLoop) {
          this.demoLoop = this.demo.loops;
          let e =
            -(
              (r.spin / Math.max(this.demoTuning.speed, 0.1)) *
              this.demo.faceTime
            ) %
            (Math.PI * 2);
          (this.demo.turnedBy(e - this.turntable.rotation.y),
            (this.turntable.rotation.y = e));
        }
        this.demo.update(e, this.turntable.rotation.y);
      }
      i.reveal.value = v;
      let he = se * r.hoverAberration + GG(this.hoverAge) * 2 * r.hoverPulse;
      if (
        ((i.aberr.value =
          r.aberration * (1 + this.pulse * 2 + he) +
          (1 - v) * r.appearAberration +
          b.aberration),
        (this.jitterClock += e),
        this.pulse > 0.05)
      ) {
        if (this.jitterClock > 1 / 14) {
          this.jitterClock = 0;
          let e = 0.03 * this.pulse;
          i.jitter.value.set(
            (Math.random() - 0.5) * e,
            (Math.random() - 0.5) * e * 0.6,
          );
        }
      } else i.jitter.value.set(0, 0);
      i.empty.value += (+!this.model - i.empty.value) * (1 - Math.exp(-e * 4));
      let ge = this.look.shadowOffset.value,
        _e = i.jitter.value,
        ve = Math.max(
          Math.abs(ge.x),
          Math.abs(ge.y),
          i.aberr.value + Math.abs(_e.x),
          0.55 * i.aberr.value + Math.abs(_e.y),
        ),
        ye = Math.ceil((ve + 0.03) / g3) * g3;
      (this.aspect !== this.builtAspect ||
      r.caseDepth !== this.builtDepth ||
      s !== this.builtFrame ||
      ye !== this.builtPad
        ? this.rebuild(s, ye)
        : r.fill !== this.fitted && this.fit(),
        this.prewarm && this.forceWarm());
    }
    tuckAnchor(e) {
      if (this.prewarm || !this.group.visible || this.shown < 0.5) return null;
      let t = this.rest;
      return (
        e.set(t.ox, 0, 0).applyEuler(t.turn).multiplyScalar(t.s).add(t.at),
        t.turn.z
      );
    }
    hit(e) {
      if (
        !this.group.visible ||
        this.shown < 0.5 ||
        !this.tuck.swept ||
        !YG(this.mesh.matrixWorld, e.ray, this.point)
      )
        return null;
      let t =
          this.look.frameWidth.value +
          this.look.inkLine.value +
          this.look.paperWidth.value,
        { x: n, y: r } = this.point;
      return Math.abs(n) <= this.aspect / 2 + t && Math.abs(r) <= 0.5 + t
        ? d0
        : null;
    }
    rebuild(e, t) {
      let n = this.stack,
        r = this.aspect / 2,
        i = 0.5,
        a = this.tuning.caseDepth,
        o = 0.002,
        s = r + e,
        c = i + e;
      (n.flat(c3, 0, 0, -a, r + o, 0.502),
        n.vertex(l3, 0, -r - o, -0.5, 0),
        n.vertex(l3, 1, r + o, -0.5, 0),
        n.vertex(l3, 2, -r - o, -0.5, -a - o),
        n.vertex(l3, 3, r + o, -0.5, -a - o),
        n.vertex(u3, 0, -r - o, i, -a - o),
        n.vertex(u3, 1, r + o, i, -a - o),
        n.vertex(u3, 2, -r - o, i, 0),
        n.vertex(u3, 3, r + o, i, 0),
        n.vertex(d3, 0, -r, -0.502, 0),
        n.vertex(d3, 1, -r, -0.502, -a - o),
        n.vertex(d3, 2, -r, 0.502, 0),
        n.vertex(d3, 3, -r, 0.502, -a - o),
        n.vertex(f3, 0, r, -0.502, -a - o),
        n.vertex(f3, 1, r, -0.502, 0),
        n.vertex(f3, 2, r, 0.502, -a - o),
        n.vertex(f3, 3, r, 0.502, 0),
        n.flat(p3, 0, 0, 0, s + t, c + t),
        n.commit(),
        this.u.hole.value.set(r, i),
        (this.u.depth.value = a),
        (this.pedScale = Math.min(1, (a * 0.44) / y3, (r * 0.8) / y3)),
        this.pedestal.position.set(0, -0.5, -a / 2),
        (this.turntable.position.z = -a / 2),
        (this.builtAspect = this.aspect),
        (this.builtDepth = a),
        (this.builtFrame = e),
        (this.builtPad = t),
        this.fit());
    }
  };
  function createAboutPanel() {
    return new AboutPanel();
  }
  var C3 = (e) => {
    let t = new Color(e);
    return vec3(t.r, t.g, t.b);
  };
  var w3 = (e, t) => float(1).sub(smoothstep(t.negate(), t, e));
  var T3 = 0.19;
  return {
    createAboutPanel,
    C3,
    w3,
    T3,
  };
}
