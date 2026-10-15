// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  MathUtils,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Timer,
  Vector2,
  Vector3,
  WebGPURenderer,
} from "three/webgpu";
import { createMenuModule } from "./menu.js";
import { createPaletteModule } from "./palette.ts";
import { createRenderingModule } from "./rendering.js";
import { createAudioModule } from "./audio.js";
import { createGeometryModule } from "./geometry.js";
import { createBirdsModule } from "./birds.js";
import { createDialogueModule } from "./dialogue.js";
import { createLedPixelsModule } from "./led-pixels.js";
import { createStickersModule } from "./stickers.js";
import { createSignArtModule } from "./sign-art.js";
import { createFilmModule } from "./film.js";
import { createTrafficLightsModule } from "./traffic-lights.js";
import { createMeshBuildersModule } from "./mesh-builders.js";
import { createPartyModule } from "./party.js";
import { createPhoneModule } from "./phone.js";
import { createProjectDataModule } from "./project-data.ts";
import { createSlotMachineModule } from "./slot-machine.js";
import { createPostAtlasModule } from "./post-atlas.js";
import { createMailboxModule } from "./mailbox.js";
import { createPongModule } from "./pong.js";
import { createSlotGeometryModule } from "./slot-geometry.js";
import { createTicketsModule } from "./tickets.js";
import { createPolePlacementModule } from "./pole-placement.js";
import { createSignpostModule } from "./signpost.js";
import { createScrollEffectsModule } from "./scroll-effects.js";
import { createSkyModule } from "./sky.js";
import { createAboutDataModule } from "./about-data.ts";
import { createShowcaseStateModule } from "./showcase-state.js";
import { createShowcaseCardsModule } from "./showcase-cards.js";
import { createTuckButtonModule } from "./tuck-button.js";
import { createDemoGeometryModule } from "./demo-geometry.js";
import { createDemoShowcaseModule } from "./demo-showcase.js";
import { createHelperModule } from "./helper.js";
import { createLayoutModule } from "./layout.js";
import { createLoaderModule } from "./loader.js";
import { createTransitionsModule } from "./transitions.js";
import { createScrollInputModule } from "./scroll-input.js";
import { createPerformanceModule } from "./performance.ts";
// shortcut: scene internals remain JavaScript; add types when changing each subsystem.
export async function startScene(scope) {
  function disposeSceneResources(root) {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    const nodes = new Set();
    function collect(value) {
      if (!value || typeof value !== "object") return;
      if (value.isTexture) {
        textures.add(value);
        return;
      }
      if (Array.isArray(value)) {
        for (const item of value) collect(item);
        return;
      }
      if (!value.isNode || nodes.has(value)) return;
      nodes.add(value);
      collect(value.value);
      for (const child of value.getChildren()) collect(child);
    }
    root.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      const surfaces = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const surface of surfaces) {
        if (!surface || materials.has(surface)) continue;
        materials.add(surface);
        for (const value of Object.values(surface)) collect(value);
      }
    });
    collect(root.background);
    collect(root.environment);
    collect(root.backgroundNode);
    for (const geometry of geometries) geometry.dispose();
    for (const surface of materials) surface.dispose();
    for (const texture of textures) texture.dispose();
  }
  scope.check();
  const menuModule = createMenuModule(scope);
  const paletteModule = createPaletteModule(scope);
  const renderingModule = createRenderingModule(scope, {
    paletteModule,
  });
  const audioModule = createAudioModule(scope, {
    renderingModule,
  });
  const geometryModule = createGeometryModule(scope);
  const birdsModule = createBirdsModule(scope, {
    paletteModule,
    renderingModule,
    audioModule,
    geometryModule,
  });
  const dialogueModule = createDialogueModule(scope);
  const ledPixelsModule = createLedPixelsModule(scope, {
    paletteModule,
    dialogueModule,
  });
  const stickersModule = createStickersModule(scope, {
    paletteModule,
    ledPixelsModule,
  });
  const signArtModule = createSignArtModule(scope, {
    paletteModule,
    stickersModule,
  });
  const filmModule = createFilmModule(scope, {
    paletteModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
  });
  const trafficLightsModule = createTrafficLightsModule(scope, {
    paletteModule,
    audioModule,
    ledPixelsModule,
    stickersModule,
  });
  const meshBuildersModule = createMeshBuildersModule(scope, {
    paletteModule,
  });
  const partyModule = createPartyModule(scope, {
    paletteModule,
    renderingModule,
    audioModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
    trafficLightsModule,
    meshBuildersModule,
  });
  const phoneModule = createPhoneModule(scope, {
    paletteModule,
    renderingModule,
    birdsModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
    trafficLightsModule,
    partyModule,
  });
  const projectDataModule = createProjectDataModule(scope, {
    paletteModule,
  });
  const slotMachineModule = createSlotMachineModule(scope, {
    paletteModule,
    dialogueModule,
    ledPixelsModule,
    projectDataModule,
  });
  const postAtlasModule = createPostAtlasModule(scope, {
    renderingModule,
    stickersModule,
    slotMachineModule,
  });
  const mailboxModule = createMailboxModule(scope, {
    paletteModule,
    stickersModule,
    postAtlasModule,
  });
  const pongModule = createPongModule(scope, {
    paletteModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
    mailboxModule,
  });
  const slotGeometryModule = createSlotGeometryModule(scope, {
    paletteModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
    trafficLightsModule,
    pongModule,
  });
  const ticketsModule = createTicketsModule(scope, {
    paletteModule,
    renderingModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    meshBuildersModule,
    slotGeometryModule,
  });
  const polePlacementModule = createPolePlacementModule(scope, {
    stickersModule,
  });
  const signpostModule = createSignpostModule(scope, {
    paletteModule,
    renderingModule,
    birdsModule,
    dialogueModule,
    ledPixelsModule,
    stickersModule,
    signArtModule,
    filmModule,
    trafficLightsModule,
    partyModule,
    phoneModule,
    projectDataModule,
    slotMachineModule,
    postAtlasModule,
    mailboxModule,
    pongModule,
    slotGeometryModule,
    ticketsModule,
    polePlacementModule,
  });
  const scrollEffectsModule = createScrollEffectsModule(scope, {
    renderingModule,
  });
  const skyModule = createSkyModule(scope, {
    paletteModule,
    renderingModule,
    audioModule,
  });
  const aboutDataModule = createAboutDataModule(scope, {
    paletteModule,
  });
  const showcaseStateModule = createShowcaseStateModule(scope, {
    renderingModule,
  });
  const showcaseCardsModule = createShowcaseCardsModule(scope, {
    paletteModule,
    audioModule,
    stickersModule,
    meshBuildersModule,
    phoneModule,
    projectDataModule,
    showcaseStateModule,
  });
  const tuckButtonModule = createTuckButtonModule(scope, {
    audioModule,
    showcaseStateModule,
    showcaseCardsModule,
  });
  const demoGeometryModule = createDemoGeometryModule(scope, {
    paletteModule,
    renderingModule,
    meshBuildersModule,
  });
  const demoShowcaseModule = createDemoShowcaseModule(scope, {
    paletteModule,
    renderingModule,
    meshBuildersModule,
    showcaseStateModule,
    demoGeometryModule,
  });
  const helperModule = createHelperModule(scope, {
    paletteModule,
    renderingModule,
    audioModule,
    signpostModule,
    demoShowcaseModule,
  });
  const layoutModule = createLayoutModule(scope, {
    renderingModule,
    helperModule,
  });
  const loaderModule = createLoaderModule(scope, {
    layoutModule,
  });
  const transitionsModule = createTransitionsModule(scope);
  const scrollInputModule = createScrollInputModule(scope, {
    loaderModule,
  });
  const performanceModule = createPerformanceModule(scope, {
    renderingModule,
    scrollInputModule,
  });
  const { MenuOrb } = menuModule;
  const { cI, uI, postEffects, OI } = renderingModule;
  const { sound } = audioModule;
  const { Flock } = birdsModule;
  const { ane, AB, jB, MB, NB, PB, FB, IB, LB, RB, zB, BB, one, VB } =
    dialogueModule;
  const { rV, dne } = ledPixelsModule;
  const { CW } = filmModule;
  const { projects } = projectDataModule;
  const { zX } = slotGeometryModule;
  const { qZ, JZ, XZ, QZ, FQ, JQ, SignpostWorld } = signpostModule;
  const { createLighting, N$ } = scrollEffectsModule;
  const { createSky } = skyModule;
  const { l0, u0 } = aboutDataModule;
  const { p0, h0 } = showcaseStateModule;
  const { createProjectCards } = showcaseCardsModule;
  const { FloatingPanelButton } = tuckButtonModule;
  const { createAboutPanel } = demoShowcaseModule;
  const { Helper, $3 } = helperModule;
  const { CameraFraming } = layoutModule;
  const { activateStartGate, setLoadingProgress } = loaderModule;
  const { createCutWipe } = transitionsModule;
  const { dprForTier, createQualityController, reachedScrollTarget, scrollDuration } = performanceModule;
  const { scrollSettings, scrollHost } = scrollInputModule;
  var $6 = new URLSearchParams(location.search).has(`bg`);
  var e8 = !$6;
  var t8 = [];
  function n8(e) {
    document.documentElement.classList.toggle(`gated`, e);
    for (let e of t8) e.inert = !1;
    t8 = e
      ? [...document.body.children].filter(
          (e) =>
            e instanceof HTMLElement && !e.id.startsWith(`loader`) && !e.inert,
        )
      : [];
    for (let e of t8) e.inert = !0;
  }
  (e8 && (n8(!0), (sound.autoStart = !1)),
    await Promise.race([
      Promise.race([
        Promise.all([
          document.fonts.load(`800 64px Manrope`),
          document.fonts.load(`700 64px "IBM Plex Mono"`),
        ]),
        new Promise((e) => scope.timeout(e, 3e3)),
      ]).catch(() => {}),
      scope.whenAborted,
    ]));
  scope.check();
  var r8 = document.querySelector(`#scene`);
  var i8 = scrollHost.framed ? scrollHost.frame : r8;
  var a8 = () => r8.clientWidth || window.innerWidth;
  var o8 = window.matchMedia(`(pointer: coarse)`);
  var s8 = (e, t) => {
    let n = scope.element(`div`);
    return (
      (n.id = e),
      n.setAttribute(`aria-hidden`, `true`),
      (n.style.cssText = `position:fixed;left:0;top:0;width:0;height:100vh;height:${t};padding-left:env(safe-area-inset-left, 0px);visibility:hidden;pointer-events:none`),
      document.body.append(n),
      n
    );
  };
  var c8 = s8(`svh-probe`, `100svh`);
  var l8 = s8(`lvh-probe`, `100lvh`);
  var u8 = {
    w: -1,
    tall: 0,
    small: 1 / 0,
    end: -1,
  };
  var d8 = () => {
    let e = window.visualViewport;
    return e && e.height > 0
      ? Math.ceil(e.height * e.scale)
      : window.innerHeight;
  };
  function f8() {
    let e = document.documentElement;
    if (scrollHost.framed) {
      let t = scrollHost.viewH;
      return t <= 0 || t === u8.tall
        ? !1
        : (Object.assign(u8, {
            w: e.clientWidth,
            tall: t,
            small: t,
            end: t,
          }),
          e.style.setProperty(`--vh-pin`, `${t}px`),
          e.style.setProperty(`--end-h`, `${t}px`),
          e.classList.add(`vh-pin`),
          !0);
    }
    let t = d8();
    if (
      (t > 0 &&
        t !== u8.end &&
        ((u8.end = t), e.style.setProperty(`--end-h`, `${t}px`)),
      !o8.matches)
    )
      return u8.w < 0
        ? !1
        : (Object.assign(u8, {
            w: -1,
            tall: 0,
            small: 1 / 0,
          }),
          e.classList.remove(`vh-pin`),
          e.style.removeProperty(`--vh-pin`),
          (r8.style.height = ``),
          !0);
    let n = e.clientWidth;
    (n !== u8.w &&
      Object.assign(u8, {
        w: n,
        tall: 0,
        small: 1 / 0,
      }),
      c8.offsetHeight > 0 && (u8.small = Math.min(u8.small, c8.offsetHeight)));
    let r = Math.max(l8.offsetHeight, window.innerHeight, t);
    return r <= u8.tall
      ? !1
      : ((u8.tall = r),
        e.style.setProperty(`--vh-pin`, `${r}px`),
        e.classList.add(`vh-pin`),
        (r8.style.height = `${r}px`),
        !0);
  }
  f8();
  function p8(e) {
    if (scrollHost.framed) return e;
    let t =
      o8.matches && Number.isFinite(u8.small) ? u8.small : c8.offsetHeight;
    return Math.min(e, t > 0 ? t : e);
  }
  var renderer = new WebGPURenderer({
    canvas: r8,
    antialias: !1,
    depth: !1,
    forceWebGL:
      new URLSearchParams(location.search).get(`renderer`) === `webgl`,
  });
  renderer.setPixelRatio(
    dprForTier(`full`, devicePixelRatio, a8(), r8.clientHeight || innerHeight),
  );
  var h8 = !1;
  (scope.listen(window, `mesq-render-failed`, () => {
    ((h8 = !0),
      renderer.setAnimationLoop(null),
      (sound.autoStart = !1),
      sound.setEnabled(!1));
  }),
    (uI.value = renderer.getPixelRatio()),
    renderer.setSize(a8(), r8.clientHeight || window.innerHeight, !1),
    (renderer.toneMapping = 0),
    (renderer.shadowMap.enabled = !0));
  var g8 = `mesq-device-lost`;
  ((renderer.onDeviceLost = (e) => {
    console.error(
      `[mesq] ${e.api} device lost (${e.reason ?? `unknown`}): ${e.message}`,
    );
    try {
      if (sessionStorage.getItem(g8))
        return void window.dispatchEvent(new Event(`mesq-render-failed`));
      sessionStorage.setItem(g8, `1`);
    } catch {
      window.dispatchEvent(new Event(`mesq-render-failed`));
      return;
    }
    location.reload();
  }),
    setLoadingProgress(0.3));
  try {
    await renderer.init();
  } catch (e) {
    scope.check();
    throw (window.dispatchEvent(new Event(`mesq-render-failed`)), e);
  }
  scope.defer(async () => {
    h8 = true;
    renderer.onDeviceLost = () => {};
    await renderer.setAnimationLoop(null);
    X9?.dispose();
    I8?.dispose();
    if (scene) {
      disposeSceneResources(scene);
      scene.clear();
    }
    await renderer.dispose();
  });
  scope.check();
  setLoadingProgress(0.45);
  var scene = new Scene();
  var sky = createSky();
  (scene.add(sky.group), (scene.backgroundNode = sky.backgroundNode));
  var camera = new PerspectiveCamera(
    30.5,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  (camera.position.set(0, -0.4, 11),
    camera.lookAt(0, 0.15, 0),
    scene.add(camera));
  var lighting = createLighting(scene);
  var x8 = lighting.key.position.clone();
  var S8 = lighting.kick.position.clone();
  var C8 = new Vector3(0, 1, 0);
  var signpost = new SignpostWorld();
  scene.add(signpost.group);
  var cameraFraming = new CameraFraming(signpost);
  var menuOrb = new MenuOrb(document.querySelector(`#menu`));
  camera.add(menuOrb.mesh);
  var D8 = document.querySelector(`#helper`);
  var helper = new Helper();
  (helper.hold(e8),
    camera.add(helper.mesh),
    signpost.listen(helper),
    D8.setAttribute(`aria-label`, `Talk to the helper`),
    scope.listen(D8, `pointerenter`, (e) =>
      helper.setHover(e.pointerType !== `touch`),
    ),
    scope.listen(D8, `pointerleave`, () => helper.setHover(!1)));
  var projectCards = createProjectCards(renderer);
  ((projectCards.teaserLink = JZ.href), camera.add(projectCards.group));
  var aboutPanel = createAboutPanel();
  camera.add(aboutPanel.group);
  var photoCards = createProjectCards(renderer, u0);
  camera.add(photoCards.group);
  var M8 = {
    x: qZ.find((e) => e.label === `X`).href,
    linkedin: qZ.find((e) => e.label === `LinkedIn`).href,
    artstation: JZ.href,
    mailbox: FQ,
    blender: `say:blender`,
    threejs: `say:threejs`,
    shaders: `say:shaders`,
    substance: `say:substance`,
    timetable: XZ,
    iso400: QZ,
  };
  var N8 = null;
  var P8 = 0;
  var F8 = new Vector3();
  helper.onCue = (e) => {
    if (!e) return;
    if (e === `flickr`) return void photoCards.nudge();
    let t = e.startsWith(`stop:`) ? `say:${e}` : M8[e];
    ((N8 = signpost.nudge(t)),
      (P8 = N8 ? 1.4 : 0),
      N8 && sound.sfx.signNudge(),
      e === `timetable` && N8 && (J7 = !0));
  };
  var I8 = OI(renderer, scene, camera);
  var L8 = N$(renderer, {
    onPixelRatio: (e) => {
      (renderer.setPixelRatio(e), (uI.value = e));
    },
  });
  var R8 = !1;
  var z8 = r8.clientHeight || window.innerHeight;
  var B8 = a8();
  var V8 = !1;
  var H8 = p8(z8);
  var U8 = {
    heroZ: 11,
    signsZ: 7.4,
    portraitSignsZ: 8.5,
    tabletSignsZ: 8.3,
    heroX: 0.5,
    signsX: 0.62,
    contactsX: 0.62,
    endX: signpost.endFraming.x,
    showcaseX: 0.86,
    portraitX: 0.72,
    portraitHeroX: 0.86,
    portraitHeroReach: 2.9,
    heroY: -0.35,
    portraitHeroY: 0.45,
    cameraY: -0.4,
    lookY: 0.15,
  };
  function W8() {
    G8() && renderer.setSize(a8(), z8, !1);
  }
  function G8() {
    let e = a8(),
      t = r8.clientHeight || window.innerHeight;
    return e === 0 || t === 0
      ? !1
      : ((z8 = t),
        (B8 = e),
        (H8 = p8(t)),
        (camera.aspect = e / H8),
        H8 < t - 0.5
          ? camera.setViewOffset(e, H8, 0, 0, e, t)
          : camera.clearViewOffset(),
        camera.updateProjectionMatrix(),
        (R8 = camera.aspect < 0.9),
        (h0.share = (parseFloat(getComputedStyle(c8).paddingLeft) || 0) / e),
        Y8(),
        (V8 = o8.matches && !R8),
        (projectCards.touch = aboutPanel.touch = photoCards.touch = V8),
        (signpost.tickets.compact = R8 && camera.aspect < 0.6),
        projectCards.layout(camera),
        aboutPanel.layout(camera),
        photoCards.layout(camera),
        (X8 = !0),
        !0);
  }
  var K8 = -1;
  var q8 = () => window.visualViewport?.height ?? window.innerHeight;
  var J8 = 0;
  scope.listen(window.visualViewport, `resize`, () => (J8 = 0));
  function Y8() {
    (menuOrb.layout(camera, H8, a8()),
      helper.layout(camera, D8, H8, a8()),
      (K8 = q8()));
  }
  var X8 = !0;
  function Z8() {
    X8 = !1;
    let e = cameraFraming.tuning,
      t = Math.max(
        ...[`#menu`, `.sound-toggle`].map(
          (e) => document.querySelector(e)?.getBoundingClientRect().bottom ?? 0,
        ),
      );
    if (!R8) {
      projectCards.portraitBox =
        aboutPanel.portraitBox =
        photoCards.portraitBox =
          null;
      let n = helper.speechRoom([...MB.flatMap((e) => e.talk), ...NB, ...PB]),
        r = (e) => 1 - (2 * e) / H8;
      photoCards.room = n
        ? {
            top: r(t + e.rowGap),
            bottom: r(n.top - e.speechGap - 12),
          }
        : null;
      return;
    }
    let n = a8(),
      r = projects.length,
      i = (e) => {
        if (Math.abs(e - signpost.stops.about) < 0.001)
          return [...k7(1), ...Object.values(jB).flat()];
        let t = signpost.stops.aboutMore.findIndex(
          (t) => Math.abs(e - t) < 0.001,
        );
        if (t === 0) return [...MB.flatMap((e) => e.talk), ...NB];
        if (t > 0) return [...PB];
        if (Math.abs(e - signpost.stops.contacts) < 0.001)
          return [...k7(S7), ...BB(zB), ...one];
        if (Math.abs(e - signpost.stops.end) < 0.001) return k7(C7);
        let n = projects.findIndex((t, n) => Math.abs(d7(n, r) - e) < 0.001);
        return n >= 0 ? k7(2 + n) : RB;
      };
    cameraFraming.layout({
      camera: camera,
      canvasH: z8,
      frameH: H8,
      cameraY: U8.cameraY,
      lookY: U8.lookY,
      z: U8.portraitSignsZ,
      top: t + e.rowGap,
      bottom: (t) => {
        let n = helper.speechRoom(i(t));
        return (n ? Math.min(n.top, H8) : H8) - e.speechGap;
      },
      panelH: Math.min(
        (n * projectCards.tuning.portraitWidth) / projectCards.visualAspect,
        H8 * projectCards.tuning.tabletHeight,
      ),
      caseH: Math.min(
        (n * aboutPanel.tuning.portraitWidth) / aboutPanel.portraitVisualAspect,
        H8 * aboutPanel.tuning.portraitHeight,
      ),
      poleX: U8.portraitX,
    });
  }
  W8();
  var Q8 = {
    w: a8(),
    h: z8,
    f: H8,
  };
  var $8 = 0;
  var e5 = 0;
  var t5 = null;
  function n5() {
    let e = r8.clientHeight || window.innerHeight;
    return (
      t5 === null &&
        (a8() !== Q8.w || e !== Q8.h || p8(e) !== Q8.f) &&
        ((t5 = _7),
        y9(),
        scope.clearTimeout($8),
        ($8 = scope.timeout(r5, 120))),
      t5 !== null
    );
  }
  function r5() {
    (W8(),
      (Q8 = {
        w: a8(),
        h: z8,
        f: H8,
      }),
      p7());
    let e = t5 ?? _7;
    ((t5 = null),
      scrollHost.scrollTo(g7(e), `instant`),
      y7(e),
      (o9 = scrollHost.y),
      $5.refresh(),
      L8.pause(1.5));
  }
  function i5() {
    let e =
        Math.abs(_7 - signpost.stops.end) < 0.001 || scrollHost.y >= f7.E - 1,
      t = f8();
    return (
      e &&
        scrollHost.y < f7.E - 1 &&
        V5.offsetTop === f7.E &&
        (scrollHost.scrollTo(f7.E, `instant`), (o9 = scrollHost.y)),
      t
    );
  }
  function a5() {
    (scrollHost.framed ? f8() : i5(),
      Y8(),
      scope.clearTimeout(e5),
      (e5 = scope.timeout(Y8, 400)),
      n5() && (G8(), scope.clearTimeout($8), ($8 = scope.timeout(r5, 120))));
  }
  (scope.listen(window, `resize`, a5),
    scrollHost.framed ||
      scope.listen(window.visualViewport, `resize`, () => i5() && a5()));
  var o5 = 0;
  function s5() {
    X8 && Z8();
    let e = U8,
      t = signpost.focus,
      n = MathUtils.lerp(
        e.heroZ,
        R8 ? e.portraitSignsZ : V8 ? e.tabletSignsZ : e.signsZ,
        t,
      ),
      r = Math.tan(MathUtils.degToRad(camera.fov / 2)) * n * camera.aspect,
      i = R8
        ? MathUtils.clamp(r / e.portraitHeroReach, 0.4, 1.25)
        : Math.min(1, r / 4.4),
      a = R8 ? cameraFraming.at(signpost.offset) : null;
    signpost.group.scale.setScalar(MathUtils.lerp(i, a ? a.scale : 1, t));
    let o = MathUtils.lerp,
      s = R8
        ? o(e.portraitHeroX, a ? a.x : e.portraitX, t)
        : o(
            o(
              o(o(e.heroX, e.signsX, t), e.showcaseX, o5),
              e.contactsX,
              signpost.contactsFocus,
            ),
            e.endX,
            signpost.endFocus,
          );
    (signpost.group.position.set(
      r * s,
      MathUtils.lerp(R8 ? e.portraitHeroY : e.heroY, a ? a.y : 0, t),
      0,
    ),
      camera.position.set(0, e.cameraY, n),
      camera.lookAt(0, e.lookY, 0),
      a &&
        ((projectCards.portraitBox = cameraFraming.cardBox(
          `panel`,
          signpost.offset,
        )),
        (aboutPanel.portraitBox = cameraFraming.cardBox(
          `case`,
          signpost.offset,
        )),
        (photoCards.portraitBox = cameraFraming.cardBox(
          `cards`,
          signpost.offset,
        ))));
  }
  var c5 = new Vector2(9, 9);
  var l5 = new Raycaster();
  var u5 = 0;
  function d5() {
    l5.setFromCamera(c5, camera);
    let e = l5.intersectObjects(signpost.birdTargets, !1)[0];
    e && e.object.userData.flock.scare(e.object.userData.bird, u5);
  }
  function f5(e) {
    c5.set((e.clientX / a8()) * 2 - 1, -(e.clientY / z8) * 2 + 1);
  }
  var p5 = new Vector2(9, 9);
  function m5() {
    return p5.set(c5.x, c5.x === 9 ? 9 : 1 - ((1 - c5.y) * z8) / H8);
  }
  function h5() {
    (c5.set(9, 9), T5());
  }
  function g5() {
    l5.setFromCamera(c5, camera);
    let e = l5.intersectObjects(signpost.linkTargets, !1)[0]?.object ?? null;
    for (; e && !e.userData.href;) e = e.parent;
    return (e &&
      (aboutPanel.hovered || photoCards.hovered) &&
      String(e.userData.href).startsWith(`say:`)) ||
      (e?.userData.href === `say:timetable` && !x5)
      ? null
      : e;
  }
  function _5() {
    return (
      l5.setFromCamera(c5, camera),
      projectCards.hit(l5) ?? photoCards.hit(l5) ?? aboutPanel.hit(l5)
    );
  }
  function v5() {
    return (
      l5.setFromCamera(c5, camera),
      l5.intersectObjects(signpost.slotTargets, !1)[0]?.object ?? null
    );
  }
  function y5() {
    return (
      l5.setFromCamera(c5, camera),
      l5.intersectObjects(signpost.pongPad.hits, !1)[0]?.object.userData
        .pongDir ?? 0
    );
  }
  function b5() {
    let e = signpost.interactiveTargets;
    return e.length
      ? (l5.setFromCamera(c5, camera),
        l5.intersectObjects(e, !1)[0]?.object ?? null)
      : null;
  }
  var x5 = !1;
  var S5 = null;
  function C5(e) {
    if (e === S5) return;
    let t = S5 && signpost.interactiveOf(S5),
      n = e && signpost.interactiveOf(e);
    ((S5 = e), t && t !== n && t.hover?.(null), n?.hover?.(e));
  }
  var w5 = null;
  function T5(e = !1) {
    let t = _5(),
      n = t ? null : g5();
    signpost.hoverLink(n, !x5);
    let r = t || n || !v5() ? null : signpost.slot;
    signpost.hoverSlot(!!r);
    let i = t || n || r ? 0 : y5();
    signpost.pongPad.hover(i);
    let a = t || n || r || i ? null : b5();
    (C5(x5 ? null : a), i8.classList.toggle(`hot`, !!(t || n || r || i || a)));
    let o =
      t ?? n ?? r ?? (i ? signpost.pongPad.hits[i < 0 ? 0 : 1] : null) ?? a;
    (o && o !== w5 && !e && sound.sfx.uiHover(0.4), (w5 = o));
  }
  var E5 = NaN;
  function jne() {
    c5.x === 9 ||
      Math.abs(signpost.offset - E5) < 0.001 ||
      ((E5 = signpost.offset), T5(!0));
  }
  function D5() {
    if ((j7.add(S7), M7.delete(S7), !navigator.clipboard)) return A7(S7, [zB]);
    navigator.clipboard.writeText(zB).then(
      () => {
        (sound.sfx.mailCopy(), A7(S7, BB(zB)));
      },
      () => A7(S7, [zB]),
    );
  }
  var Mne = {
    blender: 0,
    substance: 2,
    threejs: 3,
    shaders: 5,
  };
  var O5 = null;
  var k5 = !1;
  var A5 = null;
  var j5 = -1;
  var Nne = 24;
  function M5(e, t = !1) {
    if (e === `experience`) {
      ((J7 = !0), A7(1, NB));
      return;
    }
    if (e === `film`) {
      ((Y7 = !0), A7(1, PB));
      return;
    }
    if (e === `timetable` || e.startsWith(`stop:`)) {
      let n =
        t || e === `timetable` ? (j5 + 1) % MB.length : Number(e.slice(5));
      if (!t && A5 === n && helper.speaking) return void helper.advance();
      k5 = !0;
      let r = j5;
      ((j5 = n),
        A7(1, MB[n].talk, (e, t, i) => {
          (e === `silenced` && t === 0 && !i && j5 === n && (j5 = r),
            A5 === n && ((A5 = null), signpost.routeOpen(null)));
        }),
        (A5 = n),
        signpost.routeOpen(n));
      return;
    }
    let n = e;
    if (O5 === n && helper.speaking) {
      (helper.advance(), signpost.nudge(`say:${n}`));
      return;
    }
    (A7(1, jB[n], () => O5 === n && (O5 = null)),
      (O5 = n),
      aboutPanel.skipTo(Mne[n]));
  }
  (scope.listen(i8, `click`, (e) => {
    if (e.target !== i8) return;
    f5(e);
    let t = _5(),
      n = t ?? g5()?.userData.href;
    if ((n && sound.sfx.uiClick(0.4), n === `showcase:untuck`))
      p0.sliverClick();
    else if (n === `copy:email`) D5();
    else if (n?.startsWith(`say:`))
      M5(
        n.slice(4),
        !t &&
          x5 &&
          (n === `say:timetable` || signpost.routeRowPx(camera, z8) < Nne),
      );
    else if (n?.startsWith(`mailto:`)) location.href = n;
    else if (n) window.open(n, `_blank`, `noopener`);
    else if (v5()) signpost.spinSlot();
    else {
      let e = b5();
      e && signpost.interactiveOf(e)?.click?.(e);
    }
    e.pointerType && e.pointerType !== `mouse` && h5();
  }),
    scope.listen(window, `pointermove`, (e) => {
      if ((helper.watch(e.clientX, e.clientY), e.target !== i8)) {
        c5.x !== 9 && h5();
        return;
      }
      ((x5 = e.pointerType === `touch`), f5(e), d5(), T5());
    }),
    scope.listen(window, `pointerdown`, (e) => {
      e.target === i8 && ((x5 = e.pointerType === `touch`), f5(e), d5());
    }),
    scope.listen(window, `pointercancel`, h5),
    scope.listen(window, `pointerdown`, (e) => {
      e.target === i8 &&
        e.pointerType === `mouse` &&
        e.button === 0 &&
        (f5(e), v5() && signpost.holdSlot(!0));
    }));
  for (let e of [`pointerup`, `pointercancel`])
    scope.listen(window, e, () => signpost.holdSlot(!1));
  (scope.listen(window, `pointerdown`, (e) => {
    if (e.target !== i8 || (e.pointerType === `mouse` && e.button !== 0))
      return;
    f5(e);
    let t = y5();
    t && e.pointerType === `mouse`
      ? signpost.pongPad.press(e.pointerId, t)
      : t && signpost.pongPad.touch(e.pointerId, t, e.clientX, e.clientY);
  }),
    scope.listen(
      window,
      `pointermove`,
      (e) => signpost.pongPad.move(e.pointerId, e.clientX, e.clientY),
      {
        passive: !0,
      },
    ),
    scope.listen(window, `pointerup`, (e) =>
      signpost.pongPad.release(e.pointerId),
    ),
    scope.listen(window, `pointercancel`, (e) =>
      signpost.pongPad.cancel(e.pointerId),
    ));
  var N5 = new Map();
  scope.listen(window, `pointerdown`, (e) => {
    if (e.target !== i8 || (e.pointerType === `mouse` && e.button !== 0))
      return;
    f5(e);
    let t = b5(),
      n = t && signpost.interactiveOf(t);
    t && n?.down && (N5.set(e.pointerId, n), n.down(t, e.pointerId));
  });
  for (let e of [`pointerup`, `pointercancel`])
    scope.listen(window, e, (t) => {
      let n = N5.get(t.pointerId);
      n && (N5.delete(t.pointerId), n.up?.(t.pointerId, e === `pointercancel`));
    });
  (scope.listen(window, `blur`, () => {
    for (let [e, t] of N5) t.up?.(e, !0);
    N5.clear();
  }),
    scope.listen(window, `blur`, h5),
    scope.listen(
      document.documentElement,
      `pointerleave`,
      (e) => e.pointerType === `mouse` && h5(),
    ));
  var P5 = document.querySelector(`#start`);
  var F5 = document.querySelector(`#about`);
  document.documentElement.style.setProperty(
    `--about-more`,
    String(signpost.stops.aboutMore.length),
  );
  var I5 = {
    fine: 1.45,
    touch: 1.15,
  };
  var L5 = () => (o8.matches ? I5.touch : I5.fine);
  var R5 = () =>
    document.documentElement.style.setProperty(`--scroll-k`, String(L5()));
  R5();
  var z5 = document.querySelector(`#projects`);
  var B5 = document.querySelector(`#contacts`);
  var V5 = document.querySelector(`#end`);
  document.querySelector(`#about-text`).textContent = [
    ...AB,
    ...NB,
    ...MB.flatMap((e) => e.talk),
    ...PB,
  ].join(` `);
  var H5 = [];
  for (let [e, t] of projects.entries()) {
    let n = scope.element(`article`);
    ((n.className = `project-stop`),
      (n.id = t.id.toLowerCase()),
      (n.tabIndex = -1));
    let r = scope.element(`h3`);
    if (
      ((r.className = `sr-only`),
      (r.textContent = t.teaser
        ? `More projects coming soon`
        : `${String(e + 1).padStart(2, `0`)} — ${t.title}${t.url ? `` : ` (coming soon)`}`),
      n.append(r),
      t.url)
    ) {
      let e = scope.element(`a`);
      ((e.className = `project-link`),
        (e.href = t.url),
        (e.target = `_blank`),
        (e.rel = `noopener`),
        (e.textContent = t.title),
        t.subtitle && (e.title = t.subtitle),
        n.append(e));
    }
    if (t.teaser) {
      let e = scope.element(`a`);
      ((e.className = `project-link`),
        (e.href = JZ.href),
        (e.target = `_blank`),
        (e.rel = `noopener`),
        (e.textContent = `More of my work on ArtStation`),
        n.append(e));
    }
    (z5.append(n), H5.push(n));
  }
  var U5 = new FloatingPanelButton(projectCards, z5);
  var W5 = B5.querySelector(`.contact-links`);
  for (let { label: e, name: t, href: n } of qZ) {
    let r = scope.element(`li`),
      i = scope.element(`a`);
    ((i.href = n),
      (i.textContent = t ?? e),
      n.startsWith(`mailto:`) || ((i.target = `_blank`), (i.rel = `noopener`)),
      r.append(i),
      W5.append(r));
  }
  {
    let e = scope.element(`li`),
      t = scope.element(`button`);
    ((t.type = `button`),
      (t.textContent = `Copy email`),
      scope.listen(t, `click`, () => D5()),
      e.append(t),
      W5.append(e));
  }
  {
    let e = scope.element(`ul`);
    ((e.className = `contact-links`),
      Object.assign(e.style, {
        flexWrap: `wrap`,
        justifyContent: `center`,
        width: `max-content`,
        maxWidth: `calc(100vw - 32px)`,
      }));
    for (let [t, n] of [
      [`blender`, `What Blender is for`],
      [`threejs`, `What three.js is for`],
      [`shaders`, `What shaders are for`],
      [`substance`, `What Substance Painter is for`],
      [`route`, `My experience: the next stop`],
      [`film`, `My film photography`],
    ]) {
      let r = scope.element(`li`),
        i = scope.element(`button`);
      ((i.type = `button`),
        (i.textContent = n),
        (i.dataset.say = t),
        scope.listen(i, `click`, () => {
          ((K5 = {
            key: t === `route` ? `stop:0` : t,
            step: t === `route`,
            top: G5(t),
            at: performance.now(),
          }),
            q5());
        }),
        r.append(i),
        e.append(r));
    }
    let t = scope.element(`li`),
      n = scope.element(`a`);
    ((n.href = l0),
      (n.target = `_blank`),
      (n.rel = `noopener`),
      (n.textContent = `My film photos on Flickr`),
      (n.dataset.say = `film`),
      t.append(n),
      e.append(t),
      F5.append(e));
  }
  function G5(e) {
    return e === `route`
      ? (f7.aboutYs[0] ?? f7.A)
      : e === `film`
        ? (f7.aboutYs[1] ?? f7.Aend)
        : f7.A;
  }
  var K5 = null;
  function q5() {
    let e = K5;
    e &&
      (Math.abs(g7(signpost.offset) - e.top) < 0.2 * f7.vh && Math.abs(v7) < P7
        ? ((K5 = null), M5(e.key, e.step))
        : N9.busy
          ? (e.at = performance.now())
          : performance.now() - e.at > 3e3 && (K5 = null));
  }
  var Pne = new FloatingPanelButton(aboutPanel, F5);
  var Fne = new FloatingPanelButton(photoCards, F5);
  var J5 = [`start`, `about`, `projects`, `contacts`, `end`];
  var Y5 = document.querySelector(`#menu`);
  var X5 = !1;
  (scope.listen(
    window,
    `keydown`,
    (e) =>
      (X5 ||=
        e.key === `Tab` ||
        e.key === `Enter` ||
        e.key === ` ` ||
        e.key.startsWith(`Arrow`)),
    !0,
  ),
    scope.listen(window, `pointerdown`, () => (X5 = !1), !0));
  var Z5 = document.querySelector(`#menu-panel`);
  var Q5 = [...Z5.querySelectorAll(`a`)];
  var $5 = createQualityController(r8, L8, lighting);
  (scope.listen(window, `resize`, $5.refresh, {
    passive: !0,
  }),
    scope.interval($5.refresh, 1e3));
  var e7 = null;
  var t7 = -1;
  var n7 = {
    projects: 0,
    about: 0,
    cards: 0,
  };
  var r7 = 0;
  var i7 = !1;
  var a7 = !1;
  var o7 = !1;
  var s7 = !1;
  var c7 = 0;
  var l7 = (e) =>
    e < f7.dAbout
      ? `start`
      : e < f7.dProjects
        ? `about`
        : e < f7.dContacts
          ? `projects`
          : e < f7.dEnd
            ? `contacts`
            : `end`;
  var u7 = (e, t, n, r) => {
    let i = Math.max(t - e, e - n, 0) / r;
    return 1 - MathUtils.smoothstep(i, 0.08, 0.38);
  };
  var d7 = (e, t) =>
    signpost.stops.projects[
      t <= JQ ? e : Math.round((e * (JQ - 1)) / Math.max(1, t - 1))
    ];
  var f7 = {
    vh: 1,
    A: 0,
    aboutYs: [],
    Aend: 0,
    P: 0,
    C: 1,
    E: 2,
    step: 1,
    lastP: 0,
    dAbout: 0,
    dProjects: 0,
    dContacts: 0,
    dEnd: 1.5,
    ys: [0],
    offs: [0],
  };
  function p7() {
    if (window.innerHeight === 0) return;
    let e = signpost.stops,
      t = projects.length;
    ((f7.vh = P5.offsetHeight || window.innerHeight), (f7.A = F5.offsetTop));
    let n = e.aboutMore,
      r = (F5.offsetHeight - f7.vh) / Math.max(1, n.length);
    ((f7.aboutYs = n.map((e, t) => f7.A + (t + 1) * r)),
      (f7.Aend = n.length ? f7.aboutYs[n.length - 1] : f7.A));
    let i = n.length ? n[n.length - 1] : e.about;
    ((f7.P = z5.offsetTop),
      (f7.C = B5.offsetTop),
      (f7.E = V5.offsetTop),
      (f7.step = z5.offsetHeight / t),
      (f7.lastP = f7.P + (t - 1) * f7.step));
    let a = (e, t, n) => (n - e) / Math.max(1e-6, t - e);
    ((f7.dAbout = f7.A * a(e.start, e.about, e.dividers.about)),
      (f7.dProjects =
        f7.Aend + (f7.P - f7.Aend) * a(i, d7(0, t), e.dividers.projects)),
      (f7.dContacts =
        f7.lastP +
        (f7.C - f7.lastP) * a(d7(t - 1, t), e.contacts, e.dividers.contacts)),
      (f7.dEnd = (f7.C + f7.E) / 2),
      (f7.ys = [
        0,
        f7.dAbout,
        f7.A,
        ...f7.aboutYs,
        f7.dProjects,
        ...projects.map((e, t) => f7.P + t * f7.step),
        f7.dContacts,
        f7.C,
        f7.E,
      ]),
      (f7.offs = [
        e.start,
        e.dividers.about,
        e.about,
        ...n,
        e.dividers.projects,
        ...projects.map((e, n) => d7(n, t)),
        e.dividers.contacts,
        e.contacts,
        e.end,
      ]));
  }
  function m7(e, t, n) {
    if (e <= t[0]) return n[0];
    for (let r = 1; r < t.length; r++)
      if (e <= t[r])
        return MathUtils.lerp(
          n[r - 1],
          n[r],
          (e - t[r - 1]) / Math.max(1e-6, t[r] - t[r - 1]),
        );
    return n[n.length - 1];
  }
  var h7 = (e) => m7(e, f7.ys, f7.offs);
  var g7 = (e) => m7(e, f7.offs, f7.ys);
  var _7 = 0;
  var v7 = 0;
  function y7(e) {
    ((_7 = e), signpost.setOffset(e));
  }
  function b7() {
    n5() || y7(h7(scrollHost.y));
  }
  function x7() {
    let e = f7,
      t = g7(signpost.offset);
    ((n7.about = u7(t, e.A, e.A, e.vh)),
      (n7.cards = e.aboutYs.length ? u7(t, e.aboutYs[0], e.Aend, e.vh) : 0),
      (n7.projects = u7(t, e.P, e.lastP, e.vh)),
      (i7 = e.aboutYs.length > 1 && t > (e.aboutYs[0] + e.aboutYs[1]) / 2),
      (n7.cards >= 0.02 || Math.abs(v7) > P7 || e9) && (c7 = u5),
      i7
        ? n7.cards < 0.02 && ((o7 = !0), u5 - c7 > 0.4 && (a7 = !1))
        : (o7 = a7 = !1),
      i7 &&
        !a7 &&
        Math.abs(t - e.aboutYs[1]) < 0.12 * e.vh &&
        ((a7 = !0), signpost.filmCam.fire(() => (o7 ||= i7), !s7), (s7 = !0)),
      photoCards.setProject(+!!o7),
      (r7 = MathUtils.clamp(t / Math.max(1, e.C), 0, 1)));
    let n = projects.length,
      r = l7(t),
      i =
        r === `projects`
          ? MathUtils.clamp(Math.round((t - e.P) / e.step), 0, n - 1)
          : -1;
    if (r === e7 && i === t7) return;
    let a = r !== e7;
    if (
      (projectCards.setProject(i),
      i >= 0 && U5.follow(H5[i]),
      e7 !== null &&
        (a ? helper.turn(J5.indexOf(r) - J5.indexOf(e7)) : helper.nudge(),
        L8.pause(1.5)),
      (e7 = r),
      (t7 = i),
      a)
    )
      for (let e of Q5)
        e.setAttribute(`aria-current`, String(e.dataset.section === r));
  }
  var S7 = projects.length + 2;
  var C7 = S7 + 1;
  var w7 = (e) =>
    e <= 0
      ? 0
      : e === 1
        ? f7.A
        : e >= C7
          ? f7.E
          : e === S7
            ? f7.C
            : f7.P + (e - 2) * f7.step;
  function T7() {
    return e7 === `projects` && t7 >= 0
      ? 2 + t7
      : e7 === `about`
        ? 1
        : e7 === `contacts`
          ? S7
          : e7 === `end`
            ? C7
            : 0;
  }
  var Ine = new Map([
    ...Object.values(jB).map((e) => [e, 1]),
    ...MB.map((e) => [e.talk, 2]),
    [NB, 2],
    [PB, 4],
  ]);
  var E7 = 1;
  function D7(e) {
    let t = 0,
      n = Math.abs(e - f7.A);
    for (let r = 0; r < f7.aboutYs.length; r++) {
      let i = Math.abs(e - f7.aboutYs[r]);
      i < n && ((n = i), (t = r + 1));
    }
    return 1 << t;
  }
  function O7(e, t) {
    let n = w7(t),
      r = t === 1 ? f7.Aend : n,
      i = e < n ? e - n : e > r ? e - r : 0,
      a = (i >= 0 && t < C7) || t === 0 ? 1 : -1;
    return Math.abs(i) / Math.max(1, Math.abs(w7(t + a) - (a > 0 ? r : n)));
  }
  function Lne(e) {
    let t = f7;
    return e < t.dAbout
      ? 0
      : e < t.dProjects
        ? 1
        : e >= t.dEnd
          ? C7
          : e >= t.dContacts
            ? S7
            : 2 +
              MathUtils.clamp(
                Math.round((e - t.P) / t.step),
                0,
                projects.length - 1,
              );
  }
  function k7(e) {
    if (e >= 2 && e < S7) {
      let t = projects[e - 2];
      return LB[t.id] ?? (t.comment ? [t.comment] : RB);
    }
    return IB[
      e === 1 ? `about` : e === S7 ? `contacts` : e === C7 ? `end` : `start`
    ];
  }
  (scope.listen(
    D8,
    `pointerenter`,
    (e) => e.pointerType !== `touch` && sound.sfx.uiHover(-0.7),
  ),
    scope.listen(D8, `click`, () => {
      if ((sound.sfx.uiClick(-0.6), helper.advance())) return;
      let e = T7();
      if (e === 1 && i7) return void M5(`film`);
      if (e === 1 && D7(g7(signpost.offset)) === 2)
        return void M5(`experience`);
      (j7.add(e), M7.delete(e), A7(e, k7(e)));
    }));
  function A7(e, t, n) {
    (helper.say(t, {
      cues: VB.get(t),
      onClose: (t, r, i) => {
        (F7 === e && (F7 = -1), n?.(t, r, i));
      },
    }),
      helper.speaking &&
        ((F7 = e), (I7 = e === 1 ? (Ine.get(t) ?? E7) : 0), (B7 = 0)));
  }
  var j7 = new Set();
  var M7 = new Map();
  var N7 = new Map();
  var Rne = 2;
  var zne = 0.5;
  var Bne = 0.65;
  var Vne = 0.48;
  var P7 = 1.5;
  var Hne = 0.45;
  var F7 = -1;
  var I7 = 0;
  var L7 = -1;
  var R7 = -1;
  var z7 = 0;
  var B7 = 0;
  var V7 = -1;
  var H7 = !1;
  var U7 = window.matchMedia(`(max-height: 500px)`);
  var W7 = $3();
  var G7 = (e) => e >= 2 && e < S7;
  for (let e of [
    `pointerdown`,
    `pointerup`,
    `pointercancel`,
    `keydown`,
    `keyup`,
    `wheel`,
  ])
    scope.listen(window, e, W7.reset, {
      capture: !0,
      passive: !0,
    });
  (scope.listen(window, `blur`, W7.reset),
    scope.listen(document, `visibilitychange`, W7.reset));
  function Une() {
    if (t7 >= 0 && projectCards.presentedProject === t7) return `project${t7}`;
    if (aboutPanel.presented) return `about`;
    let e = photoCards.presentedProject;
    return e < 0 ? null : e === 1 ? `film` : `bus`;
  }
  var K7 = () =>
    helper.shown &&
    !helper.speaking &&
    !p0.value &&
    Z5.hidden &&
    !Q9 &&
    !N9.busy &&
    !n5() &&
    !document.hidden;
  var q7 = null;
  function Wne(e) {
    let t = Une(),
      n = !U7.matches && !l9 && !u9.size && !w9() && Math.abs(v7) < 0.4;
    q7 = W7.update(t, K7() && n, e) ? t : null;
  }
  function Gne(e) {
    if (e === 0) return ane;
    if (e === 1) return AB;
    if (e === C7) return FB;
    if (e === S7) return IB.contacts;
    if (e > S7) return null;
    let t = k7(e);
    return t !== RB || M7.has(e) ? t : H7 ? null : ((H7 = !0), t);
  }
  function Kne(e) {
    let t = T7(),
      n = Math.abs(v7) < P7 && !w9();
    if (F7 >= 0) {
      let n = g7(signpost.offset),
        r = t !== F7 || (I7 !== 0 && !(I7 & D7(n)));
      B7 = Math.abs(v7) < 0.4 && r ? B7 + e : 0;
      let i = L7 >= 0 && L7 !== F7,
        a = G7(F7) ? n7.projects < 0.15 : O7(n, F7) > Bne;
      (i || Math.abs(t - F7) > 1 || B7 >= zne || a) &&
        (i && (V7 = F7), helper.silence());
    }
    if (
      ((L7 = -1),
      t !== V7 && (V7 = -1),
      t !== R7 && ((R7 = t), (z7 = 0)),
      !K7())
    ) {
      z7 = 0;
      return;
    }
    z7 = n ? z7 + e : 0;
    let r = G7(t) ? `project${t - 2}` : t === 1 ? `about` : null;
    if (
      j7.has(t) ||
      (r ? q7 !== r : z7 < (t === 0 ? 0.2 : Hne)) ||
      t === V7 ||
      (t > 0 && U7.matches) ||
      (!r && O7(g7(signpost.offset), t) > Vne)
    )
      return;
    let i = Gne(t);
    if (!i) {
      j7.add(t);
      return;
    }
    let a = M7.get(t);
    (M7.delete(t),
      a !== void 0 && N7.set(t, (N7.get(t) ?? 0) + 1),
      (F7 = t),
      (I7 = t === 1 ? E7 : 0),
      (B7 = 0),
      helper.say(i, {
        startPage: a,
        cues: VB.get(i),
        onClose: (e, n, r) => {
          F7 === t && (F7 = -1);
          let a = n < i.length - 1 || !r;
          e === `silenced` && a && t !== 0 && (N7.get(t) ?? 0) < Rne
            ? M7.set(t, n)
            : j7.add(t);
        },
      }));
  }
  var J7 = !1;
  function qne() {
    J7 || k5 || q7 !== `bus` || V7 === 1 || ((J7 = !0), A7(1, NB));
  }
  var Y7 = !1;
  function Jne() {
    Y7 ||
      q7 !== `film` ||
      V7 === 1 ||
      ((Y7 = !0),
      A7(1, PB, (e, t, n) => {
        e === `silenced` && t === 0 && !n && (Y7 = !1);
      }));
  }
  (p0.subscribe((e) => {
    e ? helper.dismiss() : (V7 = T7());
  }),
    scope.listen(scrollHost.events, `scroll`, b7, {
      passive: !0,
    }));
  var X7 = [];
  var Z7 = 0;
  var Q7 = !1;
  var $7 = 0;
  var e9 = !1;
  var t9 = 0;
  var n9 = 0;
  var r9 = !1;
  var i9 = -1;
  var a9 = null;
  var o9 = 0;
  var s9 = 0;
  var c9 = -1;
  var l9 = !1;
  var u9 = new Set();
  var d9 = {
    open: !1,
    finger: !1,
    ticks: [],
    peak: 0,
    bigAt: -1 / 0,
    fine: 0,
    at: -1 / 0,
    drag: !1,
  };
  var f9 = -1 / 0;
  var p9 = [];
  var m9 = 0;
  var h9 = null;
  var g9 = 0;
  function Yne() {
    let e = scrollHost.max;
    return [
      0,
      f7.A,
      ...f7.aboutYs,
      ...projects.map((e, t) => f7.P + t * f7.step),
      f7.C,
      f7.E,
    ].map((t) => Math.min(t, e));
  }
  function _9(e = o8.matches) {
    let t = Yne(),
      n = t.map((e, n) => {
        let r = X7[n]?.offset ?? 0;
        return (
          e + r * Math.max(0, r > 0 ? (t[n + 1] ?? e) - e : e - (t[n - 1] ?? e))
        );
      }),
      r =
        n
          .slice(1)
          .map((e, t) => e - n[t])
          .sort((e, t) => e - t)[(n.length - 1) >> 1] ?? 1,
      i = e ? scrollSettings.longTouch : scrollSettings.long,
      a = (e, t, n) =>
        MathUtils.clamp(
          e !== void 0 && Number.isFinite(e)
            ? e
            : n > 1.15 * r
              ? Math.max(t, i)
              : t,
          0,
          0.49,
        );
    return n.map((t, r) => {
      let i = r > 0 ? Math.max(0, t - n[r - 1]) : 0,
        o = r < n.length - 1 ? Math.max(0, n[r + 1] - t) : 0;
      return {
        y: t,
        lo:
          t -
          a(
            X7[r]?.above,
            e ? scrollSettings.aboveTouch : scrollSettings.above,
            i,
          ) *
            i,
        hi:
          t +
          a(
            X7[r]?.below,
            e ? scrollSettings.belowTouch : scrollSettings.below,
            o,
          ) *
            o,
      };
    });
  }
  var Xne = (e) => (e === 1 ? 40 : e === 2 ? scrollHost.viewH : 1);
  function v9() {
    (scope.clearTimeout(Z7),
      (Q7 = !1),
      e9 &&
        i9 >= 0 &&
        (a9 = {
          i: i9,
          y: n9,
        }),
      scope.cancelFrame($7),
      (e9 = !1),
      (r9 = !1),
      (h9 = null),
      scope.clearTimeout(g9));
  }
  function y9() {
    (v9(), (d9.open = !1), (a9 = null), (c9 = -1));
  }
  function b9(e = !1) {
    (d9.open ||
      Object.assign(d9, {
        open: !0,
        finger: e,
        ticks: [],
        peak: 0,
        bigAt: -1 / 0,
        fine: 0,
        at: -1 / 0,
        drag: !1,
      }),
      (d9.finger ||= e),
      scope.clearTimeout(s9));
  }
  function x9() {
    let e = performance.now(),
      t = e - f9;
    ((f9 = e),
      t > 1e3 ? (p9.length = 0) : t < 600 && p9.push(t) > 4 && p9.shift(),
      (m9 = 0));
    for (let e = 0; e < p9.length; e++) {
      let t = 0;
      for (let n = 0; n < p9.length; n++)
        (p9[n] < p9[e] || (p9[n] === p9[e] && n < e)) && t++;
      t === p9.length >> 1 && (m9 = p9[e]);
    }
  }
  var S9 = () =>
    Math.max(
      d9.drag ? scrollSettings.dragQuiet : 0,
      p9.length
        ? MathUtils.clamp(
            scrollSettings.cadence * m9,
            scrollSettings.quiet,
            scrollSettings.waitMax,
          )
        : scrollSettings.quiet,
    );
  function C9(e) {
    (scope.clearTimeout(Z7),
      (Q7 = !l9 && !u9.size),
      Q7 && (Z7 = scope.timeout(Zne, e)));
  }
  var w9 = () => e9 || Q7;
  function T9() {
    (scope.clearTimeout(s9),
      (s9 = scope.timeout(() => {
        d9.open ||
          e9 ||
          h9 ||
          Math.abs(scrollHost.y - o9) < 1 ||
          ((o9 = scrollHost.y), (a9 = null), (c9 = -1));
      }, 150)));
  }
  function Zne() {
    if (
      (scope.clearTimeout(Z7), (Q7 = !1), l9 || t5 !== null || e9 || !d9.open)
    )
      return;
    d9.open = !1;
    let e = scrollHost.y,
      t = o9,
      n = a9;
    if (
      ((a9 = null),
      (o9 = e),
      Math.abs(e - t) < 1 || cI.matches || !scrollSettings.enabled)
    )
      return;
    let r = _9(d9.finger),
      i = r.findIndex((t) => e >= t.lo - 0.5 && e <= t.hi + 0.5),
      a = d9.finger ? `finger` : d9.ticks.length ? `wheel` : `key`,
      o = c9;
    c9 = -1;
    let s = i >= 0 ? r[i].y : 0,
      c =
        n !== null &&
        n.i === i &&
        Math.abs(e - n.y) >= 2 &&
        !((e - s) * (n.y - s) > 0 && Math.abs(e - s) < Math.abs(n.y - s));
    if (i >= 0 && (i === o || reachedScrollTarget(t, e, s, c))) {
      ((c9 = i), `${i}${a}`);
      return;
    }
    if (i < 0) {
      let t = 0;
      for (; t < r.length - 1 && r[t + 1].y <= e;) t++;
      `${((e - r[t].y) / Math.max(1, (r[t + 1] ?? r[t]).y - r[t].y)).toFixed(2)}${t}${a}`;
      return;
    }
    let l = r[i].y,
      u = r[e < l ? i - 1 : i + 1],
      d = u ? Math.abs(u.y - l) : f7.step;
    if (Math.abs(l - e) < 1.5) {
      `${i}${a}`;
      return;
    }
    let f = E9(l, !1, d, i);
    `${i}${((e - l) / d).toFixed(2)}${Math.round(f)}${a}`;
  }
  function E9(e, t = !1, n = f7.step, r = -1) {
    (scope.clearTimeout(Z7), (Q7 = !1), scope.cancelFrame($7));
    let i = scrollHost.y,
      a = e - i;
    if (((t9 = e), (i9 = r), (r9 = !1), Math.abs(a) < 1)) return ((o9 = e), 0);
    let o = Math.abs(a) / Math.max(1, n),
      s = t
        ? MathUtils.clamp(
            scrollSettings.keyMin +
              (scrollSettings.keyMax - scrollSettings.keyMin) * o,
            scrollSettings.keyMin,
            scrollSettings.keyMax,
          )
        : scrollDuration(a, n, d9.finger, scrollSettings),
      c = performance.now();
    ((n9 = i), (e9 = !0), `${Math.round(s)}`);
    let l = (n) => {
      if (!e9) return;
      if (Math.abs(scrollHost.y - n9) > 3 && !(h9 && n - h9.at < 150))
        return void (v9(), T9());
      let r = MathUtils.clamp((n - c) / s, 0, 1);
      ((n9 = i + a * (t ? 1 - (1 - r) ** 3 : (1 - Math.cos(Math.PI * r)) / 2)),
        scrollHost.scrollTo(n9, `instant`),
        r < 1
          ? ($7 = scope.frame(l))
          : ((e9 = !1), (r9 = !0), (o9 = e), d9.open && C9(S9())));
    };
    return (($7 = scope.frame(l)), s);
  }
  function D9() {
    if (e9) return void (g9 = scope.timeout(D9, 150));
    ((h9 = null), d9.open || (o9 = scrollHost.y));
  }
  function O9(e, t, n = 1 / 0) {
    if (e.length < t) return !1;
    let r = 0;
    for (let i = e.length - t; i < e.length; i++) {
      if (e[i] > n) return !1;
      if (i !== e.length - t) {
        if (e[i] > 1.02 * e[i - 1]) return !1;
        e[i] < 0.99 * e[i - 1] && r++;
      }
    }
    return r >= t - 2;
  }
  function Qne(e) {
    if (e.ctrlKey || !e.deltaY) return;
    let t = Math.abs(e.deltaY) * Xne(e.deltaMode),
      n = Math.sign(e.deltaY),
      r = performance.now();
    if (
      (e.deltaY,
      e.deltaMode,
      u9.clear(),
      e.buttons === 0 && (l9 = !1),
      h9 &&
        n === h9.dir &&
        t <= 1.5 * scrollSettings.tailPx + 0.1 &&
        t <= 2.2 * h9.d + 0.1 &&
        ((h9.flat = t < 0.99 * h9.d ? 0 : h9.flat + 1), h9.flat <= 3))
    ) {
      ((h9.d = t),
        (h9.at = r),
        scope.clearTimeout(g9),
        (g9 = scope.timeout(D9, 150)));
      return;
    }
    (v9(), b9(), x9());
    let i = d9.ticks;
    (i.push(t) > scrollSettings.tailN && i.shift(),
      (d9.peak = Math.max(d9.peak, t)),
      t >= 8 && (d9.bigAt = r),
      (d9.fine = t < 24 && r - d9.at < 40 ? d9.fine + 1 : 0),
      (d9.at = r));
    let a = d9.peak >= 8 && r - d9.bigAt < 2500 && O9(i, scrollSettings.tailN);
    ((d9.drag = d9.fine >= 3 && !a),
      scrollSettings.tail &&
      a &&
      O9(i, scrollSettings.tailN, scrollSettings.tailPx)
        ? ((h9 = {
            dir: n,
            d: t,
            at: r,
            flat: 0,
          }),
          (g9 = scope.timeout(D9, 150)),
          C9(scrollSettings.quiet))
        : C9(S9()));
  }
  function $ne() {
    if (!e9) {
      if (h9) {
        !d9.open &&
          r9 &&
          Math.abs(scrollHost.y - t9) >= 1 &&
          (scrollHost.y - t9, scrollHost.scrollTo(t9, `instant`));
        return;
      }
      if (!d9.open) return T9();
      C9(S9());
    }
  }
  (scope.listen(window, `wheel`, Qne, {
    passive: !0,
  }),
    scope.listen(scrollHost.events, `scroll`, $ne, {
      passive: !0,
    }),
    scope.listen(
      scrollHost.events,
      `scrollend`,
      () => d9.open && d9.finger && !e9 && C9(scrollSettings.touchQuiet),
      {
        passive: !0,
      },
    ),
    scope.listen(window, `touchstart`, () => (u9.clear(), v9(), b9(!0)), {
      passive: !0,
    }),
    scope.listen(window, `touchmove`, () => v9(), {
      passive: !0,
    }),
    scope.listen(
      window,
      `pointerdown`,
      (e) => (
        u9.clear(),
        e.pointerType !== `mouse` && v9(),
        b9(e.pointerType === `touch`)
      ),
      {
        passive: !0,
      },
    ));
  for (let e of [`touchstart`, `pointerdown`])
    scope.listen(window, e, () => (l9 = !0), {
      passive: !0,
    });
  function k9() {
    l9 && ((l9 = !1), C9(S9()));
  }
  for (let e of [`pointerup`, `pointercancel`])
    scope.listen(window, e, (e) => e.pointerType !== `touch` && k9(), {
      passive: !0,
    });
  for (let e of [`touchend`, `touchcancel`])
    scope.listen(window, e, (e) => e.touches.length === 0 && k9(), {
      passive: !0,
    });
  function ere() {
    y9();
    let e = _7;
    (R5(),
      p7(),
      scrollHost.scrollTo(g7(e), `instant`),
      y7(e),
      (o9 = scrollHost.y));
  }
  scope.listen(o8, `change`, ere);
  function tre(e) {
    let t = e.target instanceof Element ? e.target : null,
      n =
        e.key === ` ` &&
        !t?.closest(
          `button, a, [role="button"], input, textarea, select, [contenteditable]`,
        );
    return !scrollSettings.pageKeys ||
      (!n && e.key !== `PageDown` && e.key !== `PageUp`) ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      !Z5.hidden ||
      document.documentElement.classList.contains(`gated`) ||
      t?.closest(`input, textarea, select, [contenteditable], .mesq-debug`)
      ? 0
      : e.key === `PageDown` || (n && !e.shiftKey)
        ? 1
        : -1;
  }
  (scope.listen(window, `keydown`, (e) => {
    let t = tre(e);
    if (!t) {
      let t =
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !(
          e.target instanceof Element &&
          e.target.closest(
            `input, textarea, select, [contenteditable], .mesq-debug`,
          )
        );
      if (
        t &&
        !e.shiftKey &&
        (e.key === `Home` || e.key === `End`) &&
        Z5.hidden &&
        !document.documentElement.classList.contains(`gated`)
      ) {
        (e.preventDefault(),
          e.key,
          e.repeat || P9(e.key === `Home` ? 0 : V5.offsetTop));
        return;
      }
      t &&
        [
          `ArrowUp`,
          `ArrowDown`,
          `Home`,
          `End`,
          `PageUp`,
          `PageDown`,
          ` `,
        ].includes(e.key) &&
        (e.key,
        v9(),
        b9(),
        u9.add(e.code),
        e.repeat ? (f9 = performance.now()) : x9(),
        C9(S9()));
      return;
    }
    if ((e.preventDefault(), e.repeat && e9)) return;
    let n = e9 ? t9 : scrollHost.y,
      r = _9().map((e) => e.y),
      i =
        t > 0
          ? r.find((e) => e > n + 2)
          : [...r].reverse().find((e) => e < n - 2);
    if ((e.key, i !== void 0)) {
      if ((y9(), `${r.indexOf(i)}`, !cI.matches))
        return void E9(i, !0, Math.abs(i - (r[r.indexOf(i) - t] ?? n)));
      (scrollHost.scrollTo(i, `instant`),
        (o9 = i),
        signpost.jumpTo(h7(i)),
        y7(h7(i)),
        (Z9 = signpost.offset));
    }
  }),
    scope.listen(
      window,
      `keyup`,
      (e) => u9.delete(e.code) && !u9.size && d9.open && C9(S9()),
    ),
    scope.listen(window, `blur`, () => u9.clear()));
  var A9 = (e) => {
    let t = e.slice(1);
    return J5.includes(t) || H5.some((e) => e.id === t)
      ? document.getElementById(t)
      : null;
  };
  var j9 =
    performance.getEntriesByType(`navigation`)[0]?.type === `reload`
      ? null
      : A9(location.hash);
  (A9(location.hash) &&
    history.replaceState(
      history.state,
      ``,
      location.pathname + location.search,
    ),
    p7(),
    scrollHost.scrollTo(j9 ? scrollHost.top(j9) : 0, `instant`),
    b7(),
    signpost.jumpTo(_7),
    (o9 = scrollHost.y),
    x7());
  var nre = () => (Z5.hidden = Y5.getAttribute(`aria-expanded`) !== `true`);
  scope.listen(Y5, `click`, () => {
    (nre(), Z5.hidden ? sound.sfx.menuClose() : sound.sfx.menuOpen());
  });
  var M9 = () => {
    Z5.hidden || Y5.click();
  };
  var N9 = createCutWipe();
  function rre(e, t) {
    let n = N9.run(t, e);
    n &&
      sound.sfx.wipe({
        dir: n.dir,
        cover: n.cover / 1e3,
        reveal: n.reveal / 1e3,
        end: n.end / 1e3,
      });
  }
  function ire(e, t) {
    let n = l7(e),
      r = Q5.find((e) => e.dataset.section === n),
      i = r?.querySelector(`span`)?.textContent ?? ``;
    return {
      dir: t,
      num: i,
      name: (r?.textContent ?? n).slice(i.length).trim(),
    };
  }
  function P9(e) {
    (y9(), (L7 = Lne(e)));
    let t = h7(e),
      n = t - signpost.offset,
      r = (e) => {
        (t5 === null ? scrollHost.scrollTo(g7(t), `instant`) : (t5 = t),
          signpost.jumpTo(t - Math.sign(n) * e),
          y7(t),
          (Z9 = signpost.offset),
          ore(),
          aboutPanel.cutAway(),
          projectCards.cutAway(),
          photoCards.cutAway());
      };
    if (Math.abs(n) < 0.05) return scrollHost.scrollTo(e);
    let i = o8.matches ? 0 : 8.4;
    if (Math.abs(n) <= i && !N9.busy) return scrollHost.scrollTo(e);
    rre(() => r(1.2), ire(e, Math.sign(n)));
  }
  for (let e of Q5)
    scope.listen(
      e,
      `pointerenter`,
      (e) => e.pointerType !== `touch` && sound.sfx.uiHover(-0.5),
    );
  for (let e of Q5)
    scope.listen(e, `click`, (t) => {
      sound.sfx.uiClick(-0.5);
      let n = A9(e.hash);
      if (n) {
        if (t.ctrlKey || t.metaKey || t.shiftKey || t.altKey) return;
        (t.preventDefault(),
          P9(n.offsetTop),
          n.focus({
            preventScroll: !0,
          }));
      }
      M9();
    });
  var F9 = null;
  (scope.listen(window, `blur`, () => (F9 = document.activeElement)),
    scope.listen(window, `focus`, () => scope.timeout(() => (F9 = null))),
    scope.listen(z5, `focusin`, (e) => {
      if (e.target === U5.el || e.target === F9) return;
      let t = e.target.closest(`.project-stop`);
      if (!t || e.target === t) return;
      let n = z5.offsetTop + t.offsetTop;
      Math.abs(scrollHost.y - n) > 1 && P9(n);
    }),
    scope.listen(B5, `focusin`, (e) => {
      e.target !== F9 &&
        e.target !== B5 &&
        Math.abs(scrollHost.y - B5.offsetTop) > 1 &&
        P9(B5.offsetTop);
    }),
    scope.listen(F5, `focusin`, (e) => {
      let t = e.target.dataset?.say;
      if (!t || e.target === F9) return;
      let n = G5(t);
      Math.abs(scrollHost.y - n) > 1 && P9(n);
    }),
    scope.listen(V5, `focusin`, (e) => {
      e.target !== F9 &&
        e.target !== V5 &&
        Math.abs(scrollHost.y - V5.offsetTop) > 1 &&
        P9(V5.offsetTop);
    }),
    scope.listen(V5.querySelector(`[data-to-start]`), `click`, () => {
      (sound.sfx.uiClick(-0.5),
        P9(0),
        P5.focus({
          preventScroll: !0,
        }));
    }),
    scope.listen(
      window,
      `keydown`,
      (e) => {
        if (e.key !== `Escape` || Z5.hidden) return;
        e.stopPropagation();
        let t = Z5.contains(document.activeElement);
        (M9(), t && Y5.focus());
      },
      {
        capture: !0,
      },
    ),
    scope.listen(window, `pointerdown`, (e) => {
      !Z5.contains(e.target) && !Y5.contains(e.target) && M9();
    }));
  var I9 = {
    mode: `scroll`,
    manual: 0.5,
    ease: 3,
    current: -1,
  };
  var are = {
    day: 0,
    dusk: 0.5,
    night: 1,
  };
  var L9 = ``;
  var R9 = ``;
  var z9 = 0;
  var B9 = -1;
  var V9 = !1;
  function ore() {
    ((V9 = !0), (z9 = 0));
  }
  function H9(e) {
    let t =
        I9.mode === `scroll`
          ? r7
          : I9.mode === `manual`
            ? I9.manual
            : are[I9.mode],
      n =
        I9.current < 0 || V9
          ? t
          : I9.current + (t - I9.current) * (1 - Math.exp(-e * I9.ease));
    ((V9 = !1),
      (I9.current = n),
      sky.setTimeOfDay(n),
      lighting.setTimeOfDay(n),
      (helper.look.night.value = MathUtils.smoothstep(n, 0.35, 1)),
      Math.abs(n - B9) > 1e-4 && ((B9 = n), signpost.setTimeOfDay(n)));
    let r = performance.now();
    if (r - z9 > 250) {
      z9 = r;
      let e = `#${postEffects.skyTop.value.getHexString()}`,
        t = document.documentElement.style,
        i =
          scrollHost.y > f7.dEnd
            ? `#${postEffects.skyBottom.value.getHexString()}`
            : e;
      (i !== R9 && ((R9 = i), t.setProperty(`--page-edge`, i)),
        e !== L9 &&
          ((L9 = e),
          t.setProperty(`--page`, e),
          document
            .querySelector(`meta[name="theme-color"]`)
            ?.setAttribute(`content`, e),
          t.setProperty(
            `--page-low`,
            `#${postEffects.skyBottom.value.getHexString()}`,
          ),
          t.setProperty(`--page-night`, n.toFixed(2)),
          t.setProperty(`--menu`, `#${menuOrb.color.value.getHexString()}`)));
    }
  }
  ((rV.snakeEat = () =>
    sound.sfx.snakeEat(signpost.contactsFocus * (1 - signpost.endFocus))),
    (rV.snakeDie = () =>
      sound.sfx.snakeDie(signpost.contactsFocus * (1 - signpost.endFocus))));
  var U9 = () => {
    let e = signpost.stops.projects,
      t = Math.abs(signpost.offset - e[3]),
      n = Math.abs(e[4] - e[3]);
    return 1 - MathUtils.smoothstep(t, 0.3 * n, n);
  };
  ((rV.pongHit = (e) => sound.sfx.pongHit(e, U9())),
    (rV.pongGoal = (e, t) => sound.sfx.pongGoal(t, U9())),
    (rV.pongPress = (e) => sound.sfx.pongPress(e, U9())));
  var W9 = {
    ArrowLeft: -1,
    ArrowRight: 1,
  };
  var G9 = (e) => (e < 0 ? -2 : -3);
  (scope.listen(window, `keydown`, (e) => {
    let t = W9[e.key];
    !t ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey ||
      !Z5.hidden ||
      U9() < 0.6 ||
      (e.target instanceof Element &&
        e.target.closest(
          `input, textarea, select, [contenteditable], .mesq-debug`,
        )) ||
      (e.preventDefault(), e.repeat || signpost.pongPad.press(G9(t), t));
  }),
    scope.listen(
      window,
      `keyup`,
      (e) => W9[e.key] && signpost.pongPad.release(G9(W9[e.key])),
    ),
    scope.listen(window, `blur`, () => signpost.pongPad.releaseAll()));
  var K9 = () => {
    let e = signpost.stops.projects,
      t = e.length - 1,
      n = Math.abs(signpost.offset - e[t]),
      r = Math.abs(e[t] - e[t - 1]);
    return 1 - MathUtils.smoothstep(n, 0.3 * r, r);
  };
  ((rV.slotSpin = () => sound.sfx.slotSpin(K9())),
    (rV.slotPress = (e, t) => sound.sfx.slotPress(e, t, K9())),
    (rV.slotTick = (e, t) => sound.sfx.slotTick(e, t, K9())),
    (rV.slotStop = (e, t) => sound.sfx.slotStop(e, t, K9())),
    (rV.slotWin = () => sound.sfx.slotWin(K9())),
    (zX.print = (e, t) => sound.sfx.ticketPrint(e, t, K9())),
    (zX.tear = () => sound.sfx.ticketTear(K9())),
    (CW.pop = (e) => sound.sfx.shutter(e)),
    (CW.wind = (e) => sound.sfx.ledTick(e * 0.8)));
  var q9 = {
    at: 30,
    on: 5.4,
    atTouch: 19,
    onTouch: 9,
    rise: 0.08,
    fall: 0.3,
  };
  var J9 = 0;
  var Y9 = 1;
  function sre(e) {
    let t = Math.abs(v7),
      n = t * L5(),
      [r, i] = o8.matches ? [q9.onTouch, q9.atTouch] : [q9.on, q9.at],
      a = MathUtils.clamp(postEffects.speedThreshold.value, 0.01, 0.9),
      o =
        n < r
          ? (a * n) / Math.max(0.001, r)
          : Math.min(1, a + ((1 - a) * (n - r)) / Math.max(0.001, i - r)),
      s = 1 - Math.exp(-e / (o > J9 ? q9.rise : q9.fall));
    ((J9 += (o - J9) * s),
      t > 0.5 && (Y9 = Math.sign(v7)),
      (postEffects.speed.value = J9),
      (postEffects.speedDir.value = Y9));
  }
  var X9 = new Timer();
  $6 || X9.connect(document);
  var Z9 = signpost.offset;
  async function cre() {
    (setLoadingProgress(0.75),
      H9(0),
      signpost.update(0, 0, camera),
      s5(),
      sky.update({
        dt: 0,
        elapsed: 0,
        camera: camera,
        scroll: signpost.offset,
        viewH: H8,
        below: (z8 - H8) / H8,
      }),
      menuOrb.followSky(postEffects.skyTop.value),
      menuOrb.update(0),
      helper.update(0),
      projectCards.update(0, n7.projects, m5()),
      aboutPanel.update(0, n7.about, p5),
      photoCards.update(0, n7.cards, p5),
      projectCards.prepareAll(),
      photoCards.prepareAll(),
      Flock.prewarmTextures(renderer));
    let e = [signpost, sky, projectCards, aboutPanel, photoCards, helper];
    for (let t of e) t.setPrewarm(!0);
    let t = [];
    (scene.traverse((e) => {
      e.userData.bird ||
        (e.visible || ((e.visible = !0), t.push(() => (e.visible = !1))),
        (e.isMesh || e.isSprite) &&
          e.frustumCulled &&
          ((e.frustumCulled = !1), t.push(() => (e.frustumCulled = !0))));
    }),
      performance.now());
    try {
      I8.render();
      let e = renderer.backend.device?.queue.onSubmittedWorkDone();
      await Promise.race([
        Promise.race([e, new Promise((e) => scope.timeout(e, 3e3))]),
        scope.whenAborted,
      ]);
      scope.check();
    } finally {
      for (let e of t) e();
      for (let t of e) t.setPrewarm(!1);
    }
  }
  var lre = 0;
  renderer.debug.onNodeBuilderCreated = (e, t) => {
    lre++;
  };
  try {
    (await Promise.race([cre(), scope.whenAborted]),
      scope.timeout(() => {
        try {
          sessionStorage.removeItem(g8);
        } catch {}
      }, 15e3));
    scope.check();
  } catch (e) {
    scope.check();
    console.error(
      `[mesq] warm-up failed — things will compile as they appear`,
      e,
    );
  }
  scope.check();
  setLoadingProgress(1);
  var Q9 = e8;
  var ure = 0;
  function dre(e) {
    (e?.classList.add(`done`),
      scope.timeout(() => e?.setAttribute("hidden", ""), 1e3));
  }
  scope.frame(() => {
    if (h8) return;
    r8.classList.add(`ready`);
    let e = document.querySelector(`#loader`),
      t = () => {
        ((Q9 = !1),
          n8(!1),
          e?.contains(document.activeElement) &&
            (j9 ?? (X5 ? Y5 : document.querySelector(`#start`)))?.focus({
              preventScroll: !0,
            }),
          dre(e),
          helper.hold(!1));
      };
    (e8 &&
      e &&
      activateStartGate(e, {
        sound: sound.supported,
        landing: D8,
        onEnter(e) {
          (sound.setEnabled(e), (sound.autoStart = !0), t());
        },
        onPress: () => sound.prepare(),
      })) ||
      ((sound.autoStart = !0), t());
  });
  function $9() {
    try {
      I8.render();
    } catch (e) {
      (console.error(`[mesq] render failed`, e),
        window.dispatchEvent(new Event(`mesq-render-failed`)));
    }
  }
  h8 ||
    renderer.setAnimationLoop((e) => {
      if (
        h8 ||
        (!$6 && document.hidden) ||
        r8.clientWidth === 0 ||
        r8.clientHeight === 0 ||
        r8.width === 0 ||
        r8.height === 0 ||
        L8.skip(e)
      )
        return;
      X9.update(e);
      let t = Math.max(0, X9.getDelta());
      Q9 ||
        (L8.frame(Math.min(t, 0.5), Math.abs(v7) > 0.4),
        $5.frame(t, !N9.busy && !n5() && !L8.paused));
      let n = Math.min(t, 1 / 20);
      ((u5 = X9.getElapsed()),
        dne(u5),
        signpost.update(n, u5, camera),
        lighting.key.position.copy(x8).applyAxisAngle(C8, signpost.sway),
        lighting.kick.position.copy(S8).applyAxisAngle(C8, signpost.sway),
        x7(),
        jne(),
        H9(n),
        (o5 +=
          (Math.max(n7.projects, n7.about, n7.cards) - o5) *
          (1 - Math.exp(-n * 4))),
        s5(),
        sky.update({
          dt: n,
          elapsed: u5,
          camera: camera,
          scroll: signpost.offset,
          viewH: H8,
          below: (z8 - H8) / H8,
        }),
        menuOrb.followSky(postEffects.skyTop.value),
        --J8 <= 0 && ((J8 = 8), q8() !== K8 && Y8()),
        menuOrb.update(n),
        (v7 = (signpost.offset - Z9) / Math.max(n, 1e-4)),
        helper.setScrollSpeed(v7),
        sre(n),
        sound.update(n, I9.current, v7),
        (Z9 = signpost.offset),
        helper.update(n),
        q5(),
        projectCards.update(n, n7.projects, m5()),
        U5.update(camera, B8, z8),
        aboutPanel.update(n, n7.about, p5),
        Pne.update(camera, B8, z8),
        photoCards.update(n, n7.cards, p5),
        Fne.update(camera, B8, z8),
        Q9
          ? ++ure % 4 == 0 && L8.whenIdle($9)
          : ($9(), h8 || (Wne(n), Kne(n), qne(), Jne())),
        P8 > 0 &&
          N8 &&
          ((P8 -= n),
          N8.getWorldPosition(F8).project(camera),
          Math.abs(F8.x) < 1 &&
            Math.abs(F8.y) < 1 &&
            helper.lookAt((F8.x * 0.5 + 0.5) * a8(), (0.5 - F8.y * 0.5) * z8)));
    });
  return {
    renderer,
    scene,
    sound,
    dispose() {
      return scope.dispose();
    },
  };
}
