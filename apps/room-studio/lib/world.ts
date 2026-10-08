import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createIndoorLighting, eveningStrength } from "./lighting";
import { createMaterialReveal } from "./material-reveal";
import { readModelFile } from "./assets";
import { houseAsset } from "./house-assets";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  CATALOG,
  PAINTS,
  STOREY,
  levelOf,
  outdoor,
  stairOpening,
  deriveWalls,
  moveItem,
  planExtent,
  snap,
  type Plan,
  type BuiltinKind,
  type Wall,
  type Room,
  type Item,
} from "./model";
import type { Selection } from "../components/PlanEditor";
type Callbacks = {
  select: (s: Selection) => void;
  begin: () => void;
  preview: (p: Plan) => void;
  finish: () => void;
  report: (m: string) => void;
};
export function createWorld(host: HTMLDivElement, callbacks: Callbacks) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor("#e9e6dc");
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute(
    "aria-label",
    "Interactive 3D interior. Drag to orbit, scroll to zoom, drag furniture to move.",
  );
  renderer.domElement.tabIndex = 0;
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(39, 1, 0.05, 240);
  camera.position.set(14, 13, 17);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.minDistance = 2;
  controls.maxDistance = 90;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(4.5, 0, 3.6);
  const pmrem = new THREE.PMREMGenerator(renderer),
    environment = new RoomEnvironment(),
    env = pmrem.fromScene(environment, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = .65;
  environment.dispose();
  pmrem.dispose();
  const hemi = new THREE.HemisphereLight("#fff9e8", "#a7adb1", .85),
    sun = new THREE.DirectionalLight("#fff6eb", 2.8);
  sun.position.set(-4, 12, -7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.025;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 100;
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.radius = 3;
  scene.add(hemi, sun, sun.target);
  const indoorLighting = createIndoorLighting(scene);
  const textures: THREE.Texture[] = [],
    materials = new Map<string, THREE.MeshStandardMaterial>(),
    geometries = new Map<string, THREE.BufferGeometry>();
  const box = new THREE.BoxGeometry(1, 1, 1);
  geometries.set("box", box);
  function texture(type: string) {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    ctx.fillStyle =
      type === "wood"
        ? "#c6a479"
        : type === "fabric"
          ? "#ffffff"
          : type === "terrazzo"
            ? "#ddd8ca"
            : "#d9d1bf";
    ctx.fillRect(0, 0, 512, 512);
    if (type === "wood") {
      for (let col = 0; col < 8; col++) {
        ctx.fillStyle = `rgba(97,62,30,${0.035 + rand() * 0.09})`;
        ctx.fillRect(col * 64, 0, 63, 512);
        ctx.strokeStyle = "rgba(91,60,33,.19)";
        ctx.strokeRect(col * 64, 0, 64, 512);
        const seam = rand() * 400;
        ctx.beginPath();
        ctx.moveTo(col * 64, seam);
        ctx.lineTo((col + 1) * 64, seam);
        ctx.stroke();
        for (let i = 0; i < 25; i++) {
          ctx.strokeStyle = `rgba(104,68,35,${rand() * 0.16})`;
          const x = col * 64 + rand() * 63;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.bezierCurveTo(x + 5, 120, x - 4, 360, x + rand() * 5, 512);
          ctx.stroke();
        }
      }
    } else if (type === "marble") {
      ctx.fillStyle = "#e4e1d9"; ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 18; i++) {
        const y = rand() * 700 - 100;
        ctx.strokeStyle = `rgba(108,110,112,${.05 + rand() * .1})`;
        ctx.lineWidth = .4 + rand() * 1.6;
        ctx.beginPath(); ctx.moveTo(0, y);
        ctx.bezierCurveTo(130, y + rand() * 70, 310, y - 90, 512, y - 160); ctx.stroke();
      }
    } else
      for (let i = 0; i < (type === "terrazzo" ? 1300 : 11000); i++) {
        const v = rand();
        ctx.fillStyle =
          type === "terrazzo"
            ? ["#b5b8a5", "#cbb59c", "#9eaaa0", "#eee9dc"][Math.floor(v * 4)]
            : `rgba(${type === "fabric" ? "60,56,47" : "117,102,82"},${v * 0.1})`;
        const x = rand() * 512,
          y = rand() * 512,
          s = type === "terrazzo" ? 1 + rand() * 4 : 0.5 + rand() * 1.2;
        ctx.fillRect(x, y, s, s);
      }
    if (type === "fabric") {
      for (let i = 0; i < 512; i += 4) {
        ctx.fillStyle = "rgba(80,76,70,.07)"; ctx.fillRect(i, 0, 1, 512);
        ctx.fillStyle = "rgba(80,76,70,.05)"; ctx.fillRect(0, i, 512, 1);
      }
    }
    if (type === "grass") {
      ctx.fillStyle = "#819671"; ctx.fillRect(0,0,512,512);
      for(let i=0;i<19000;i++) {
        const x=rand()*512, y=rand()*512;
        ctx.strokeStyle=["#7a8f65","#8ba47a","#718c63","#9aad83"][i%4];
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand()*4-2,y-2-rand()*5);ctx.stroke();
      }
    }
    if (type === "pavers") {
      ctx.fillStyle = "#c4c9c2";ctx.fillRect(0,0,512,512);
      for(let i=0;i<4;i++) for(let j=0;j<4;j++) {
        ctx.fillStyle = ["#c0c6be","#c5cbc4","#bec5be","#cad0c7"][(i+j)%4];
        ctx.fillRect(i*128+2,j*128+2,124,124);
      }
      for(let i=0;i<7000;i++) {ctx.fillStyle="rgba(70,85,75,.07)";ctx.fillRect(rand()*512,rand()*512,1,1);}
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.push(t);
    return t;
  }
  const grass = texture("grass"), pavers = texture("pavers");
  const wood = texture("wood"),
    fabric = texture("fabric"),
    stone = texture("stone"),
    terrazzo = texture("terrazzo"),
    marble = texture("marble");
  fabric.repeat.set(4, 4);
  function mat(color: string, finish = "plain") {
    const key = color + finish;
    let m = materials.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color,
        vertexColors: finish === "paint",
        roughness: finish === "mirror" ? .045 : finish === "glass" ? .08 : finish === "metal" ? 0.32 : finish === "stone" ? 0.35 : finish === "lacquer" ? .42 : finish === "wood" ? 0.63 : 0.88,
        metalness: finish === "mirror" ? 1 : finish === "metal" ? 0.65 : 0,
        transparent: finish === "glass",
        opacity: finish === "glass" ? .16 : 1,
        depthWrite: finish !== "glass",
        map: finish === "fabric" ? fabric : finish === "wood" ? wood : finish === "stone" ? marble : null,
        bumpMap: finish === "fabric" ? fabric : null,
        bumpScale: finish === "fabric" ? .003 : 0,
      });
      materials.set(key, m);
    }
    return m;
  }
  function geometry(shape: string) {
    let g = geometries.get(shape);
    if (!g) {
      g =
        shape === "ring" ? new THREE.TorusGeometry(.42,.08,8,32)
        : shape === "ellipsoid" ? new THREE.SphereGeometry(.5,16,10)
        : shape === "bowl" ? new THREE.LatheGeometry([new THREE.Vector2(.18,-.5),new THREE.Vector2(.22,-.4),new THREE.Vector2(.42,-.1),new THREE.Vector2(.5,.25),new THREE.Vector2(.5,.5),new THREE.Vector2(.42,.5),new THREE.Vector2(.37,.2),new THREE.Vector2(.2,-.18),new THREE.Vector2(0,-.2)],24)
        : shape === "round"
          ? new RoundedBoxGeometry(1, 1, 1, 4, 0.08)
          : shape === "sphere"
            ? new THREE.SphereGeometry(1, 12, 8)
            : shape === "cylinder"
              ? new THREE.CylinderGeometry(1, 1, 1, 16)
              : shape === "pot"
                ? new THREE.CylinderGeometry(0.85, 0.62, 1, 16)
                : new THREE.SphereGeometry(1, 8, 6);
      geometries.set(shape, g);
    }
    return g;
  }
  function part(
    root: THREE.Group,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: string,
    finish = "plain",
    shape = "box",
  ) {
    const mesh = new THREE.Mesh(geometry(shape), mat(color, finish));
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = finish !== "glass";
    mesh.receiveShadow = finish !== "glass";
    root.add(mesh);
    return mesh;
  }
  const templates = new Map<BuiltinKind, THREE.Group>();
  function asset(kind: BuiltinKind) {
    let root = templates.get(kind);
    if (root) return root;
    root = new THREE.Group();
    const { w, d, color } = CATALOG[kind];
    const p = (
      ww: number,
      hh: number,
      dd: number,
      x: number,
      y: number,
      z: number,
      c = color,
      finish = "plain",
      shape = "round",
    ) => part(root!, ww, hh, dd, x, y, z, c, finish, shape);
    const legs = (height: number, top: number, inset = 0.12) => {
      for (const x of [-w / 2 + inset, w / 2 - inset])
        for (const z of [-d / 2 + inset, d / 2 - inset])
          p(
            0.05,
            height,
            0.05,
            x,
            top - height / 2,
            z,
            "#555b50",
            "metal",
            "box",
          );
    };
    if (kind === "dining") {
      legs(0.43, 0.43, 0.055);
      p(w, 0.07, d, 0, 0.465, 0, color, "fabric");
      for (const x of [-w / 2 + 0.05, w / 2 - 0.05])
        p(0.025, 0.4, 0.025, x, 0.63, -d / 2 + 0.03, "#5f6c5d", "metal", "box");
      p(w - 0.04, 0.25, 0.045, 0, 0.735, -d / 2 + 0.035, color, "fabric");
    } else if (kind === "sofa" || kind === "chair") {
      legs(0.16, 0.16);
      p(w - 0.04, 0.16, d - 0.03, 0, 0.24, 0, color, "fabric");
      p(w - 0.14, 0.19, d - 0.17, 0, 0.39, 0.035, color, "fabric");
      p(w - 0.1, 0.47, 0.14, 0, 0.56, -d / 2 + 0.085, color, "fabric");
      for (const x of [-w / 2 + 0.075, w / 2 - 0.075])
        p(0.15, 0.4, d - 0.08, x, 0.45, 0, color, "fabric");
      if (kind === "sofa") {
        for (const x of [-w / 4, w / 4])
          p(w / 2 - 0.16, 0.11, d - 0.27, x, 0.49, 0.045, "#afbead", "fabric");
        const pillow = p(
          0.32,
          0.32,
          0.12,
          -w / 2 + 0.3,
          0.63,
          -0.19,
          "#e1d7bb",
          "fabric",
        );
        pillow.rotation.z = -0.18;
        const pillow2 = p(
          0.32,
          0.3,
          0.12,
          w / 2 - 0.3,
          0.63,
          -0.19,
          "#bd906e",
          "fabric",
        );
        pillow2.rotation.z = 0.13;
      }
    } else if (kind === "bed" || kind === "doubleBed") {
      legs(0.15, 0.15);
      p(w, 0.24, d - 0.05, 0, 0.23, 0, "#939998", "fabric");
      p(w, .86, .12, 0, .48, -d / 2 + .065, "#979e9c", "fabric");
      for (let i = 0; i < 4; i++)
        p(w / 4 - .012, .63, .025, -w / 2 + (i + .5) * w / 4, .57, -d / 2 + .13, "#afb5b2", "fabric");
      p(w - 0.08, 0.22, d - 0.14, 0, 0.43, 0.025, "#f4eee0", "fabric");
      p(w - 0.06, 0.085, d * 0.63, 0, 0.575, d * 0.16, color, "fabric");
      for (const x of [-w / 4, w / 4])
        p(w * 0.41, 0.11, 0.39, x, 0.6, -d / 2 + 0.4, "#f3ede1", "fabric");
      p(w - 0.06, 0.035, 0.4, 0, 0.63, d * 0.23, "#7b898a", "fabric");
    } else if (["table", "coffee", "desk", "nightstand"].includes(kind)) {
      const h = kind === "coffee" ? .42 : kind === "nightstand" ? .53 : .75;
      const top = h - .04;
      legs(top, top, kind === "nightstand" ? .065 : .1);
      p(w, .04, d, 0, h - .02, 0, color, kind === "desk" ? "lacquer" : "stone");
      for (const x of [-w / 2 + .1, w / 2 - .1])
        p(.025, .045, d - .2, x, top - .025, 0, "#45494a", "metal", "box");
      p(w - .2, .045, .025, 0, top - .025, -d / 2 + .1, "#45494a", "metal", "box");
      if (kind === "desk") {
        p(.3, .095, d - .12, -w / 2 + .21, top - .048, 0, "#d8d9d5", "lacquer");
        p(.19, .012, .015, -w / 2 + .21, top - .04, d / 2 - .055, "#45494a", "metal", "box");
        p(.37, .012, .25, .07, h + .006, .03, "#657072", "metal");
        const screen = p(.37, .22, .012, .07, h + .121, -.104, "#424a4c", "metal");
        screen.rotation.x = -.12;
        const display = p(.33, .185, .003, .07, h + .121, -.096, "#96abae");
        display.rotation.x = -.12;
      }
    } else if (kind === "kitchen") {
      p(w - 0.1, 0.12, d - 0.08, 0, 0.06, 0, "#6f7c70", "plain", "box");
      p(w, 0.74, d - 0.02, 0, 0.49, 0, color, "lacquer", "box");
      p(w, 0.045, d, 0, 0.8825, 0, "#ddd8c9", "stone");
      for (let i = 0; i < 4; i++) {
        const x = -w / 2 + ((i + 0.5) * w) / 4;
        p(w / 4 - 0.02, 0.65, 0.02, x, 0.49, d / 2 - .025, "#e2e4df", "lacquer");
        p(0.14, 0.02, 0.025, x, 0.73, d / 2 - .014, "#657364", "metal");
      }
      p(0.55, 0.008, 0.41, -w * 0.29, 0.909, 0, "#778d8b", "metal");
      p(0.46, 0.005, 0.32, -w * 0.29, 0.9155, 0, "#b6c7c3", "metal");
      p(0.022, 0.18, 0.022, -w * 0.29, 0.995, -d * 0.27, "#d0d9d6", "metal");
      p(
        0.15,
        0.022,
        0.022,
        -w * 0.29 + 0.065,
        1.079,
        -d * 0.27,
        "#d0d9d6",
        "metal",
      );
      p(0.48, 0.01, 0.42, w * 0.29, 0.91, 0, "#3b4742");
      for (const x of [w * 0.29 - 0.11, w * 0.29 + 0.11])
        for (const z of [-0.1, 0.1])
          p(0.075, 0.004, 0.075, x, 0.917, z, "#79857d", "metal", "cylinder");
    } else if (kind === "plant") {
      p(0.19, 0.3, 0.19, 0, 0.15, 0, "#bd9b79", "plain", "pot");
      p(0.15, 0.012, 0.15, 0, 0.3, 0, "#665849", "plain", "cylinder");
      p(0.013, 0.48, 0.013, 0, 0.52, 0, "#506d45", "plain", "cylinder");
      for (let i = 0; i < 10; i++) {
        const a = i * 2.399,
          y = 0.39 + (i % 5) * 0.075,
          r = 0.1 + (i % 3) * 0.02;
        const stem = p(
          0.008,
          0.24,
          0.008,
          Math.cos(a) * r * 0.45,
          y,
          Math.sin(a) * r * 0.45,
          "#577748",
          "plain",
          "cylinder",
        );
        stem.rotation.z = Math.cos(a) * 0.6;
        stem.rotation.x = Math.sin(a) * 0.6;
        const leaf = p(
          0.075,
          0.15,
          0.029,
          Math.cos(a) * r,
          y + 0.09,
          Math.sin(a) * r,
          i % 2 ? "#718c62" : "#567c52",
          "plain",
          "sphere",
        );
        leaf.rotation.set(Math.sin(a) * 0.45, a, Math.cos(a) * 0.55);
      }
    } else if (kind === "rug") {
      p(w, 0.012, d, 0, 0.008, 0, color, "fabric", "box");
      for (const x of [-w / 2 + 0.07, w / 2 - 0.07])
        p(0.025, 0.002, d - 0.1, x, 0.016, 0, "#969d98", "fabric", "box");
    }
    houseAsset(kind, p);
    // Bake static parts by material once; cloning the template preserves every triangle and texture.
    root.updateMatrixWorld(true);
    const batches = new Map<
      THREE.MeshStandardMaterial,
      THREE.BufferGeometry[]
    >();
    for (const child of root.children) {
      const mesh = child as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshStandardMaterial
      >;
      const list = batches.get(mesh.material) ?? [];
      list.push((mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld));
      batches.set(mesh.material, list);
    }
    root.clear();
    for (const [material, parts] of batches) {
      const merged = mergeGeometries(parts);
      if(!merged) throw Error(`Could not prepare ${CATALOG[kind].name}.`);
      for (const geometry of parts) geometry.dispose();
      geometries.set(`asset:${kind}:${material.uuid}`, merged);
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = mesh.receiveShadow = true;
      root.add(mesh);
    }
    templates.set(kind, root);
    return root;
  }
  const shell = new THREE.Group(),
    furniture = new THREE.Group();
  scene.add(shell, furniture);
  type LoadedModel = Awaited<ReturnType<typeof import("./imported-model").decodeModel>>;
  const modelTemplates = new Map<string, LoadedModel>(), loadingModels = new Set<string>(), failedModels = new Set<string>();
  const builtinModels = new Set(Object.values(CATALOG).flatMap((v) => v.model ? [v.model] : [])), modelRequests = new AbortController();
  const itemRoots = new Map<string, THREE.Group>(),
    floorRoots = new Map<
      string,
      { mesh: THREE.Mesh; top: THREE.MeshStandardMaterial; map: THREE.Texture }
    >();
  const ground = new THREE.Mesh(box, mat("#ddd9ca"));
  ground.position.y = -0.23;
  ground.receiveShadow = true;
  scene.add(ground);
  const footprintMaterial = new THREE.MeshBasicMaterial({
      color: "#27864b",
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      toneMapped: false,
    }),
    footprintBorderMaterial = new THREE.LineBasicMaterial({
      color: "#27864b",
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
    footprint = new THREE.Group(),
    footprintGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    footprintBorder = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.5, 0, -0.5),
      new THREE.Vector3(0.5, 0, -0.5),
      new THREE.Vector3(0.5, 0, 0.5),
      new THREE.Vector3(-0.5, 0, 0.5),
    ]);
  geometries.set("footprint", footprintGeometry);
  geometries.set("footprint-border", footprintBorder);
  footprint.add(
    new THREE.Mesh(footprintGeometry, footprintMaterial),
    new THREE.LineLoop(footprintBorder, footprintBorderMaterial),
  );
  footprint.visible = false;
  scene.add(footprint);
  let plan: Plan | null = null,
    selection: Selection = { room: "" },
    fullWalls = false,
    overview = false,
    activeLevel = 0,
    roomSignature = "",
    frame = 0,
    disposed = false,
    frames = 0,
    drag: {
      id: string;
      plan: Plan;
      offset: THREE.Vector3;
      startX: number;
      startY: number;
      moved: boolean;
      position: THREE.Vector3;
      next: Plan | null;
      baseY: number;
    } | null = null;
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2(),
    plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    hit = new THREE.Vector3();
  function invalidate() {
    if (!frame && !disposed && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function render() {
    frame = 0;
    if (disposed || document.hidden || !host.offsetWidth) return;
    const spreading = reveal.tick();
    controls.update();
    renderer.render(scene, camera);
    if (spreading) invalidate();
    frames++;
    const c = renderer.domElement;
    c.dataset.frames = String(frames);
    c.dataset.drawCalls = String(renderer.info.render.calls);
    c.dataset.triangles = String(renderer.info.render.triangles);
    c.dataset.geometries = String(renderer.info.memory.geometries);
    c.dataset.textures = String(renderer.info.memory.textures);
  }
  const reveal = createMaterialReveal(scene, invalidate);
  controls.addEventListener("change", invalidate);
  const visibleRooms = (p: Plan) => p.rooms.filter(r => overview || levelOf(r) === activeLevel);
  const elevation = (r: Room) => (levelOf(r) - (overview ? 0 : activeLevel)) * STOREY;
  const itemY = (p: Plan, f: Item) => elevation(p.rooms.find(r => r.id === f.roomId)!) + (f.kind === "model" ? 0 : CATALOG[f.kind].mount ?? 0);
  function wallBox(
    w: Wall,
    a: number,
    b: number,
    bottom: number,
    top: number,
    color: string,
    painted = false,
  ) {
    if (b - a < 0.001 || top - bottom < 0.001) return;
    const mesh = part(
      shell,
      w.axis === "h" ? b - a : w.positive && w.negative ? .12 : .2,
      top - bottom,
      w.axis === "h" ? w.positive && w.negative ? .12 : .2 : b - a,
      w.axis === "h" ? (a + b) / 2 : w.at,
      (bottom + top) / 2 + ((w.level ?? 0) - (overview ? 0 : activeLevel)) * STOREY,
      w.axis === "h" ? w.at : (a + b) / 2,
      color,
      "plain",
      "box",
    );
    if (painted && plan) {
      mesh.userData.surfaceKey = `${w.id}:${a}:${b}:${bottom}:${top}`;
      mesh.userData.surfaceRooms = [w.positive, w.negative];
      const positive = plan.rooms.find((r) => r.id === w.positive),
        negative = plan.rooms.find((r) => r.id === w.negative),
        pos = positive ? PAINTS[positive.paint].color : color,
        neg = negative ? PAINTS[negative.paint].color : color,
        key = `wall:${w.axis}:${pos}:${neg}`;
      let g = geometries.get(key);
      if (!g) {
        g = new THREE.BoxGeometry(1, 1, 1);
        const colors: number[] = [];
        for (let face = 0; face < 6; face++) {
          const c = new THREE.Color(
            face === (w.axis === "v" ? 0 : 4)
              ? pos
              : face === (w.axis === "v" ? 1 : 5)
                ? neg
                : color,
          );
          for (let vertex = 0; vertex < 4; vertex++) colors.push(c.r, c.g, c.b);
        }
        g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        geometries.set(key, g);
      }
      mesh.geometry = g;
      mesh.material = mat("#ffffff", "paint");
    }
  }
  function rebuildShell(p: Plan) {
    shell.traverse(o=>{if(o.userData.shellGeometry) (o as THREE.Mesh).geometry.dispose();});
    shell.clear();
    const rooms = visibleRooms(p), active = new Set(rooms.map((r) => r.id));
    for (const [id, f] of floorRoots)
      if (!active.has(id)) {
        scene.remove(f.mesh);
        f.top.dispose();
        f.map.dispose();
        if(f.mesh.geometry !== box) f.mesh.geometry.dispose();
        floorRoots.delete(id);
      }
    for (const r of rooms) {
      let f = floorRoots.get(r.id);
      if (!f) {
        const map = (
          r.floor === "grass" ? grass : r.floor === "pavers" ? pavers : r.floor === "oak" ? wood : r.floor === "terrazzo" ? terrazzo : stone
        ).clone();
        map.needsUpdate = true;
        const top = new THREE.MeshStandardMaterial({
          map,
          color: "#ffffff",
          roughness: 0.82,
        });
        const mesh = new THREE.Mesh(box, [
          mat("#c9c4b4"),
          mat("#c9c4b4"),
          top,
          mat("#c9c4b4"),
          mat("#c9c4b4"),
          mat("#c9c4b4"),
        ]);
        mesh.receiveShadow = true;
        scene.add(mesh);
        f = { mesh, top, map };
        floorRoots.set(r.id, f);
      }
      const source =
        r.floor === "grass" ? grass : r.floor === "pavers" ? pavers : r.floor === "oak" ? wood : r.floor === "terrazzo" ? terrazzo : stone;
      if (f.map.source !== source.source) {
        f.map.source = source.source;
        f.map.needsUpdate = true;
      }
      f.map.repeat.set(r.w / 2, r.h / 2);
      f.mesh.scale.set(r.w, 0.14, r.h);
      f.mesh.position.set(r.x + r.w / 2, elevation(r) - .07, r.y + r.h / 2);
      f.top.bumpMap = r.floor === "grass" ? f.map : null; f.top.bumpScale = .014;
      const hole = r.zone === "stairs" ? stairOpening(p,r) : undefined;
      const holeKey = JSON.stringify([r.x,r.y,r.w,r.h,hole]);
      if(f.mesh.userData.holeKey !== holeKey) {
        if(f.mesh.geometry !== box) f.mesh.geometry.dispose();
        f.mesh.geometry = box;
        if(hole) {
          const strips = [
            {x:r.x,y:r.y,w:hole.x-r.x,h:r.h},
            {x:hole.x+hole.w,y:r.y,w:r.x+r.w-hole.x-hole.w,h:r.h},
            {x:hole.x,y:r.y,w:hole.w,h:hole.y-r.y},
            {x:hole.x,y:hole.y+hole.h,w:hole.w,h:r.y+r.h-hole.y-hole.h},
          ].filter(b=>b.w>.001&&b.h>.001);
          const parts = strips.map(b=>box.clone().scale(b.w/r.w,1,b.h/r.h).translate((b.x+b.w/2-r.x-r.w/2)/r.w,0,(b.y+b.h/2-r.y-r.h/2)/r.h));
          const merged = mergeGeometries(parts)!;
          parts.forEach((part,i)=>{for(const group of part.groups) merged.addGroup(i*36+group.start,group.count,group.materialIndex);part.dispose();});
          f.mesh.geometry = merged;
        }
        f.mesh.userData.holeKey = holeKey;
      }
      if(hole) {
        const h = elevation(r), x0=hole.x, x1=hole.x+hole.w, z0=hole.y, z1=hole.y+hole.h;
        const guard = (x: number,z: number) => part(shell,.035,1.05,.035,x,h+.525,z,"#3d464b","metal");
        for(let z=z0;z<=z1+.001;z+=.55) {guard(x0,z);guard(x1,z);}
        part(shell,.035,.035,hole.h,x0,h+1.05,(z0+z1)/2,"#3d464b","metal");
        part(shell,.035,.035,hole.h,x1,h+1.05,(z0+z1)/2,"#3d464b","metal");
        part(shell,hole.w,.035,.035,(x0+x1)/2,h+1.05,z0,"#3d464b","metal");
        // The right flight exits onto the front landing; guard the other half of the void.
        part(shell,hole.w/2,.035,.035,x0+hole.w/4,h+1.05,z1,"#3d464b","metal");
        for(const x of [x0,x0+hole.w/2,x1]) guard(x,z1);
        for(const x of [x0,x1]) guard(x,z0);
        for(const x of [x0,x1]) part(shell,.012,.94,hole.h-.04,x,h+.5,(z0+z1)/2,"#cbdcdf","glass");
        part(shell,hole.w-.04,.94,.012,(x0+x1)/2,h+.5,z0,"#cbdcdf","glass");
        part(shell,hole.w/2-.04,.94,.012,x0+hole.w/4,h+.5,z1,"#cbdcdf","glass");
      }
      if(r.zone === "terrace") {
        const h=elevation(r);
        for(let x=r.x+.08;x<=r.x+r.w-.05;x+=.9) part(shell,.035,1.05,.035,x,h+.525,r.y+r.h-.06,"#3d464b","metal");
        part(shell,r.w,.035,.035,r.x+r.w/2,h+1.05,r.y+r.h-.06,"#3d464b","metal");
        part(shell,r.w-.12,.98,.015,r.x+r.w/2,h+.51,r.y+r.h-.06,"#c7ded8","glass");
        for(const x of [r.x+.06,r.x+r.w-.06]) {
          part(shell,.035,1.05,.035,x,h+.525,r.y+.06,"#3d464b","metal");
          part(shell,.035,.035,r.h,x,h+1.05,r.y+r.h/2,"#3d464b","metal");
          part(shell,.015,.98,r.h-.12,x,h+.51,r.y+r.h/2,"#c7ded8","glass");
        }
      }
    
    }
    for (const w of deriveWalls(p).filter(w => overview || (w.level ?? 0) === activeLevel)) {
      const high =
        (overview && fullWalls) || fullWalls || (!w.negative && (w.axis === "h" || w.axis === "v"));
      const height = high ? (p.openings ? 3.05 : 2.65) : 0.95,
        owner = p.rooms.find((r) => r.id === (w.positive ?? w.negative))!,
        color = PAINTS[owner.paint].color,
        o = w.opening;
      if (!o) {
        wallBox(w, w.a, w.b, 0, height, color, true);
        continue;
      }
      const a = o.center - o.width / 2,
        b = o.center + o.width / 2;
      wallBox(w, w.a, a, 0, height, color, true);
      wallBox(w, b, w.b, 0, height, color, true);
      if (o.type === "window") {
        wallBox(w, a, b, 0, 0.83, color, true);
        wallBox(w, a, b, Math.min(height, 2.22), height, color, true);
        const upper = Math.min(height, 2.22);
        wallBox(w, a - 0.025, a + 0.025, 0.83, upper, "#343c42");
        wallBox(w, b - 0.025, b + 0.025, 0.83, upper, "#343c42");
        wallBox(w, a, b, 0.83, 0.88, "#343c42");
        if (height >= 2.22) {
          wallBox(w, a, b, 2.17, 2.22, "#343c42");
          wallBox(w, o.center - 0.018, o.center + 0.018, 0.88, 2.17, "#343c42");
          const glass = new THREE.Mesh(
            box,
            mat("#c9e2de", "glass"),
          );
          glass.scale.set(
            w.axis === "h" ? o.width : 0.016,
            1.29,
            w.axis === "h" ? 0.016 : o.width,
          );
          glass.position.set(
            w.axis === "h" ? o.center : w.at,
            1.525 + ((w.level ?? 0) - (overview ? 0 : activeLevel)) * STOREY,
            w.axis === "h" ? w.at : o.center,
          );
          shell.add(glass);
        }
      } else {
        const top=2.32, frame="#343c42";
        wallBox(w, a, b, Math.min(height, top), height, color, true);
        wallBox(w, a-.018, a+.018, 0, Math.min(height, top), frame);
        wallBox(w, b-.018, b+.018, 0, Math.min(height, top), frame);
        if(height>=top) wallBox(w,a,b,top-.035,top,frame);
        if(p.openings) {
          const exterior=!w.positive || !w.negative, width=o.width-.065,
            pivot=new THREE.Group(), inward=w.positive?1:-1,
            y=((w.level??0)-(overview?0:activeLevel))*STOREY;
          pivot.position.set(w.axis==="h"?a+.032:w.at,y+.02,w.axis==="h"?w.at:a+.032);
          pivot.rotation.y=(w.axis==="h"?0:-Math.PI/2)+(exterior?0:-inward*Math.PI*.39);
          const piece=(ww:number,hh:number,dd:number,x:number,yy:number,z:number,c:string,finish="plain")=>part(pivot,ww,hh,dd,x,yy,z,c,finish);
          if(exterior) {
            piece(width-.07,2.20,.016,width/2,1.13,0,"#d3e1e5","glass");
            for(const x of [.018,width-.018]) piece(.036,2.27,.052,x,1.135,0,frame,"metal");
            for(const yy of [.018,2.252]) piece(width,.036,.052,width/2,yy,0,frame,"metal");
            piece(.018,.5,.04,width-.12,1.2,.046,frame,"metal");
            for(const yy of [.98,1.42]) piece(.018,.018,.055,width-.12,yy,.025,frame,"metal");
          } else {
            piece(width,2.27,.045,width/2,1.135,0,"#e4e6e3","lacquer");
            for(const z of [-.043,.043]) {
              piece(.045,.12,.012,width-.12,1.04,z,"#566066","metal");
              piece(.12,.018,.022,width-.16,1.05,z*1.55,"#9da5a9","metal");
              piece(.018,.018,.035,width-.12,1.05,z*1.3,"#9da5a9","metal");
            }
          }
          for(const yy of [.28,1.14,2.02]) piece(.022,.075,.062,.008,yy,0,"#a3a9ac","metal");
          shell.add(pivot);
        }

      }
    }
    for(const w of deriveWalls(p).filter(w=>overview || (w.level??0)===activeLevel)) {
      const sections=w.opening?.type==="door"?[[w.a,w.opening.center-w.opening.width/2],[w.opening.center+w.opening.width/2,w.b]]:[[w.a,w.b]], thickness=w.positive&&w.negative?.12:.2;
      for(const [a,b] of sections) if(b-a>.001) for(const sign of [-1,1]) {
        if(sign===1&&!w.positive || sign===-1&&!w.negative) continue;
        const h=((w.level??0)-(overview?0:activeLevel))*STOREY;
        part(shell,w.axis==="h"?b-a:.014,.09,w.axis==="h"?.014:b-a,w.axis==="h"?(a+b)/2:w.at+sign*(thickness/2+.007),h+.045,w.axis==="h"?w.at+sign*(thickness/2+.007):(a+b)/2,"#d4d8d7","lacquer");
      }
    }
    for(const f of p.items) {
      if(f.kind === "model" || CATALOG[f.kind].layer !== "wall") continue;
      const r=p.rooms.find(r=>r.id===f.roomId)!;
      if(!active.has(r.id) || fullWalls) continue;
      const horizontal=f.rotation%180===0, north=f.rotation===0, east=f.rotation===90;
      const wall: Wall={id:`support:${f.id}`,axis:horizontal?"h":"v",at:horizontal?north?r.y:r.y+r.h:east?r.x+r.w:r.x,a:0,b:0,level:levelOf(r),positive:r.id};
      const center=horizontal?f.x:f.y;
      wallBox(wall,center-f.w/2-.06,center+f.w/2+.06,.95,Math.min(3.05,(CATALOG[f.kind].mount??0)+(f.kind==="ac"?.31:f.kind==="hood"?.65:.88)),PAINTS[r.paint].color,true);
    }
    if(overview && fullWalls) for(const r of p.rooms.filter(r=>!outdoor(r) && levelOf(r) === Math.max(...p.rooms.map(levelOf)))) {
      part(shell,r.w,.15,r.h,r.x+r.w/2,elevation(r)+3.125,r.y+r.h/2,"#d1d4d3","plain");
    }
    if(overview && fullWalls) for(const wall of deriveWalls(p).filter(w=>w.level===Math.max(...p.rooms.map(levelOf)) && (!w.positive || !w.negative)))
      wallBox(wall,wall.a,wall.b,3.2,3.42,"#d4d7d5");
    if(activeLevel === 0 || overview) {
      for(const path of p.paths??[]) part(shell,path.w,.014,path.h,path.x+path.w/2,.007,path.y+path.h/2,"#c7ccc3","stone");
      if(p.paths?.length) {
        const b=planExtent(p);
        part(shell,b.w,.25,.12,b.x+b.w/2,.125,b.y+.06,"#c2c9bb");
        part(shell,.12,.25,b.h,b.x+b.w-.06,.125,b.y+b.h/2,"#c2c9bb");
        part(shell,.12,.25,b.h,b.x+.06,.125,b.y+b.h/2,"#c2c9bb");
        const garden=p.rooms.find(r=>r.id==="garden-front");
        if(garden) part(shell,garden.w,.25,.12,garden.x+garden.w/2,.125,garden.y+garden.h-.06,"#c2c9bb");
      }
    }
    shell.updateMatrixWorld(true);
    const groups=new Map<string,{material:THREE.Material;cast:boolean;receive:boolean;parts:THREE.BufferGeometry[]}>(), remove:THREE.Mesh[]=[];
    shell.traverse(o=>{
      if(!(o instanceof THREE.Mesh) || o.userData.surfaceKey || Array.isArray(o.material)) return;
      const key=`${o.material.uuid}:${o.castShadow}:${o.receiveShadow}`, g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      if(!groups.has(key)) groups.set(key,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,parts:[]});
      groups.get(key)!.parts.push(g);remove.push(o);
    });
    for(const {material,cast,receive,parts} of groups.values()) {
      const geometry=mergeGeometries(parts);
      parts.forEach(g=>g.dispose());
      if(!geometry) throw Error("Could not prepare architectural finishes.");
      const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=cast;mesh.receiveShadow=receive;mesh.userData.shellGeometry=true;shell.add(mesh);
    }
    remove.forEach(o=>o.removeFromParent());
    const b = planExtent(p);
    ground.visible = activeLevel === 0 || overview;
    ground.scale.set(b.w + 0.3, 0.15, b.h + 0.3);
    ground.position.set(b.x + b.w / 2, -0.215, b.y + b.h / 2);
    sun.target.position.set(b.x + b.w / 2, 0, b.y + b.h / 2);
    const size = Math.max(b.w, b.h) + 5;
    sun.shadow.camera.left = -size;
    sun.shadow.camera.right = size;
    sun.shadow.camera.top = size;
    sun.shadow.camera.bottom = -size;
    sun.shadow.camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
  }
  function syncFootprint() {
    const id = drag?.id ?? selection.item,
      f = plan?.items.find((f) => f.id === id),
      root = id ? itemRoots.get(id) : undefined;
    footprint.visible = !!f && !!root;
    if (!f || !root) return;
    footprint.position.set(root.position.x, elevation(plan!.rooms.find(r=>r.id===f.roomId)!) + .025, root.position.z);
    footprint.rotation.y = root.rotation.y;
    footprint.scale.set(f.w, 1, f.d);
    const color = drag?.next === null ? "#d44545" : "#27864b";
    footprintMaterial.color.set(color);
    footprintBorderMaterial.color.set(color);
  }
  function update(p: Plan, s: Selection) {
    const first = !plan, previous = plan;
    const nextLevel = levelOf(p.rooms.find(r=>r.id===s.room) ?? p.rooms[0]), switched = nextLevel !== activeLevel;
    activeLevel=nextLevel;
    const signature = JSON.stringify([p.rooms,p.openings,p.paths,p.items.filter(f=>f.kind==="stairs" || f.kind!=="model" && CATALOG[f.kind].layer === "wall")]) + fullWalls + overview + activeLevel;
    const changedFloors = previous && reveal.enabled() ? p.rooms.filter((r) => (overview || levelOf(r) === activeLevel) && floorRoots.has(r.id) && previous.rooms.some((old) => old.id === r.id && old.floor !== r.floor)) : [],
      changedPaint = previous && reveal.enabled() ? p.rooms.filter((r) => (overview || levelOf(r) === activeLevel) && floorRoots.has(r.id) && previous.rooms.some((old) => old.id === r.id && old.paint !== r.paint)) : [];
    if (signature !== roomSignature) reveal.finish();
    const oldFloors = new Map(changedFloors.map((r) => [r.id, reveal.snapshot(floorRoots.get(r.id)!.mesh, true)])),
      oldWalls = new Map<string, ReturnType<typeof reveal.snapshot>>();
    if (changedPaint.length)
      for (const child of shell.children) {
        if (child.userData.surfaceRooms?.some((id: string) => changedPaint.some((r) => r.id === id)))
          oldWalls.set(child.userData.surfaceKey, reveal.snapshot(child as THREE.Mesh));
      }
    plan = p;
    selection = s;
    if (signature !== roomSignature) {
      for (const child of shell.children)
        if (child.userData.ownedMaterial)
          (child as THREE.Mesh).material instanceof THREE.Material &&
            ((child as THREE.Mesh).material as THREE.Material).dispose();
      rebuildShell(p);
      roomSignature = signature;
    }
    for (const [id, loaded] of modelTemplates)
      if (!builtinModels.has(id) && !p.assets?.some((a) => a.id === id)) { loaded.dispose(); modelTemplates.delete(id); }
    for (const id of failedModels) if (!builtinModels.has(id) && !p.assets?.some((a) => a.id === id)) failedModels.delete(id);
    const shown = p.items.filter(f => {
      const r=p.rooms.find(r=>r.id===f.roomId)!;
      return overview || levelOf(r) === activeLevel || f.kind === "stairs" && levelOf(r) === activeLevel - 1;
    });
    const ids = new Set(shown.map((f) => f.id));
    for (const [id, root] of itemRoots)
      if (!ids.has(id)) {
        furniture.remove(root);
        itemRoots.delete(id);
      }
    for (const f of shown) {
      let root = itemRoots.get(f.id);
      const modelKey = f.kind === "model" ? f.assetId : CATALOG[f.kind].model,
        model = modelKey ? modelTemplates.get(modelKey) : undefined;
      if (modelKey && !model && !loadingModels.has(modelKey) && !failedModels.has(modelKey)) {
        const id = modelKey, metadata = p.assets?.find((a) => a.id === id);
        loadingModels.add(id);
        void (async () => {
          let loaded: LoadedModel | undefined;
          try {
            const { decodeModel } = await import("./imported-model");
            let data: ArrayBuffer;
            if (builtinModels.has(id)) {
              const response = await fetch(id, { signal: modelRequests.signal });
              if (!response.ok) throw Error("The furniture file is unavailable.");
              data = await response.arrayBuffer();
            } else data = await readModelFile(id);
            loaded = await decodeModel(data);
            if (metadata && loaded.triangles !== metadata.triangles) throw Error("This model does not match its saved geometry.");
            if (disposed || !plan || (!builtinModels.has(id) && !plan.assets?.some((a) => a.id === id))) { loaded.dispose(); return; }
            modelTemplates.set(id, loaded);
            for (const [kind, def] of Object.entries(CATALOG))
              if (def.model === id) {
                templates.delete(kind as BuiltinKind);
                for (const [key, geometry] of geometries)
                  if (key.startsWith(`asset:${kind}:`)) { geometry.dispose(); geometries.delete(key); }
              }
            update(plan, selection);
          } catch (e) {
            loaded?.dispose(); failedModels.add(id);
            if (!disposed) callbacks.report(`Model could not load. ${(e as Error).message}`);
          } finally { loadingModels.delete(id); }
        })();
      }
      if (!root || root.userData.kind !== f.kind || root.userData.assetId !== f.assetId || !!root.userData.loaded !== !!model) {
        if (root) furniture.remove(root);
        if (model) root = model.root.clone(true);
        else if (f.kind === "model") {
          root = new THREE.Group();
          part(root, 1, 1, 1, 0, .5, 0, "#c3cdca");
        } else root = asset(f.kind).clone(true);
        root.userData = { id: f.id, kind: f.kind, assetId: f.assetId, loaded: !!model };
        root.traverse((child) => {
          child.userData.item = f.kind === "stairs" ? undefined : f.id;
        });
        furniture.add(root);
        itemRoots.set(f.id, root);
      }
      const base = model || f.kind === "model" ? { w: 1, d: 1 } : CATALOG[f.kind];
      if (drag?.id === f.id) root.position.copy(drag.position);
      else root.position.set(f.x, itemY(p,f), f.y);
      root.rotation.y = (-f.rotation * Math.PI) / 180;
      root.scale.set(f.w / base.w, f.kind === "model" ? f.h! : model ? CATALOG[f.kind].h! : 1, f.d / base.d);
    }
    syncFootprint();
    const b = planExtent(p),
      t = (p.hour - 7) / 15,
      alt = Math.max(0.1, Math.sin(((p.hour - 6) / 14) * Math.PI)),
      evening = eveningStrength(p.hour);
    sun.position.set(
      b.x + b.w / 2 + Math.cos(t * Math.PI) * 10,
      3 + alt * 10,
      b.y + b.h / 2 - 8,
    );
    sun.intensity = THREE.MathUtils.lerp(2.0 + alt * 2.5, .12, evening);
    sun.color.set(p.hour >= 17 ? "#ffcf97" : "#fff3df").lerp(new THREE.Color("#b9c7e6"), evening);
    hemi.intensity = THREE.MathUtils.lerp(1.8, .35, evening);
    hemi.color.set("#fff9eb").lerp(new THREE.Color("#abbccc"), evening);
    scene.environmentIntensity = THREE.MathUtils.lerp(.28, .12, evening);
    renderer.setClearColor(new THREE.Color("#e9e6dc").lerp(new THREE.Color("#596779"), evening));
    indoorLighting.update([...itemRoots.values()], p.hour);
    renderer.shadowMap.needsUpdate = true;
    for (const r of changedFloors)
      reveal.start(floorRoots.get(r.id)!.mesh, oldFloors.get(r.id)!, new THREE.Vector3(r.x + r.w / 2, elevation(r)+.025, r.y + r.h / 2), Math.hypot(r.w, r.h) / 2 + .2, true);
    for (const child of shell.children) {
      const before = oldWalls.get(child.userData.surfaceKey);
      if (!before) continue;
      const r = changedPaint.find((r) => child.userData.surfaceRooms.includes(r.id))!;
      reveal.start(child as THREE.Mesh, before, new THREE.Vector3(r.x + r.w / 2, elevation(r)+1.1, r.y), Math.hypot(r.w, r.h, 2.65) + .2);
    }
    if (first || switched) fit();
    invalidate();
  }
  const modelFilesSaved = (event: Event) => {
    for (const id of (event as CustomEvent<string[]>).detail) failedModels.delete(id);
    if (plan) update(plan, selection);
  };
  window.addEventListener("room-studio-model-files", modelFilesSaved);
  function fit(room?: string) {
    if (!plan) return;
    const r = room ? plan.rooms.find((r) => r.id === room) : planExtent({...plan, rooms: visibleRooms(plan)});
    if (!r) return;
    const center = new THREE.Vector3(r.x + r.w / 2, overview ? 2.1 : .4, r.y + r.h / 2),
      span = Math.max(r.w, r.h),
      distance = Math.max(span, Math.min(span + 3, span * 1.4));
    controls.target.copy(center);
    camera.position
      .copy(center)
      .add(new THREE.Vector3(distance * 0.95, distance * 1.07, distance * 1.1));
    controls.update();
    invalidate();
  }
  function cast(e: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    return ray
      .intersectObjects(furniture.children, true)
      .find((h) => h.object.userData.item);
  }
  function floorPoint(e: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    return ray.ray.intersectPlane(plane, hit);
  }
  function down(e: PointerEvent) {
    if (!e.isPrimary || e.button !== 0 || !plan) return;
    const h = cast(e);
    if (!h) return;
    const f = plan.items.find((f) => f.id === h.object.userData.item)!;
    plane.constant = -elevation(plan.rooms.find(r=>r.id===f.roomId)!);
    const pt = floorPoint(e);
    if (!pt) return;
    selection = { room: f.roomId, item: f.id };
    callbacks.select(selection);
    drag = {
      id: f.id,
      plan,
      offset: new THREE.Vector3(f.x, 0, f.y).sub(pt),
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      position: new THREE.Vector3(f.x, itemY(plan,f), f.y),
      baseY: itemY(plan,f),
      next: plan,
    };
    syncFootprint();
    invalidate();
    controls.enabled = false;
    callbacks.begin();
    renderer.domElement.setPointerCapture(e.pointerId);
  }
  let moveFrame = 0,
    pendingMove: PointerEvent | null = null;
  function applyDrag(e: PointerEvent) {
    if (!drag) return;
    if (
      Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 4 &&
      !drag.moved
    )
      return;
    drag.moved = true;
    const pt = floorPoint(e);
    if (!pt) return;
    const x = snap(pt.x + drag.offset.x),
      y = snap(pt.z + drag.offset.z);
    drag.position.set(x, drag.baseY + .1, y);
    try {
      drag.next = moveItem(drag.plan, drag.id, x, y);
      const placed=drag.next.items.find(f=>f.id===drag!.id)!;
      drag.position.set(placed.x,drag.baseY+.1,placed.y);
      callbacks.preview(drag.next);
      callbacks.report("Placement available. Release to place.");
    } catch (e) {
      drag.next = null;
      callbacks.report((e as Error).message);
    }
    itemRoots.get(drag.id)!.position.copy(drag.position);
    syncFootprint();
    renderer.shadowMap.needsUpdate = true;
    invalidate();
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    pendingMove = e;
    if (!moveFrame)
      moveFrame = requestAnimationFrame(() => {
        moveFrame = 0;
        if (pendingMove) applyDrag(pendingMove);
        pendingMove = null;
      });
  }
  function up(e: PointerEvent) {
    if (!drag) return;
    cancelAnimationFrame(moveFrame);
    moveFrame = 0;
    pendingMove = null;
    if (e.type !== "pointercancel") applyDrag(e);
    const next = e.type === "pointercancel" ? drag.plan : drag.next ?? drag.plan;
    if (drag.moved)
      callbacks.report(
        e.type === "pointercancel" || !drag.next
          ? "Position unavailable. Furniture returned to its starting position."
          : "Furniture placed. Both views are in sync.",
      );
    drag = null;
    controls.enabled = true;
    callbacks.preview(next);
    update(next, selection);
    callbacks.finish();
    if (renderer.domElement.hasPointerCapture(e.pointerId))
      renderer.domElement.releasePointerCapture(e.pointerId);
    invalidate();
  }
  renderer.domElement.addEventListener("pointerdown", down, true);
  renderer.domElement.addEventListener("pointermove", move);
  renderer.domElement.addEventListener("pointerup", up);
  renderer.domElement.addEventListener("pointercancel", up);
  const observer = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  });
  observer.observe(host);
  const visible = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else invalidate();
  };
  document.addEventListener("visibilitychange", visible);
  return {
    update,
    fit,
    setOverview(value: boolean) {
      overview=value;
      if(plan) {update(plan,selection);fit();}
    },
    setWalls(full: boolean) {
      fullWalls = full;
      if (plan) update(plan, selection);
    },
    top() {
      if (!plan) return;
      const b = planExtent({...plan,rooms:visibleRooms(plan)});
      controls.target.set(b.x + b.w / 2, 0, b.y + b.h / 2);
      camera.position.set(
        b.x + b.w / 2,
        Math.max(b.w, b.h) * 1.65,
        b.y + b.h / 2 + 0.01,
      );
      controls.update();
      invalidate();
    },
    dispose() {
      disposed = true;
      if (drag) {callbacks.preview(drag.plan); callbacks.finish(); drag = null;}
      modelRequests.abort();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(moveFrame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visible);
      renderer.domElement.removeEventListener("pointerdown", down, true);
      renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", up);
      controls.dispose();
      window.removeEventListener("room-studio-model-files", modelFilesSaved);
      reveal.dispose();
      for (const loaded of modelTemplates.values()) loaded.dispose();
      for (const g of geometries.values()) g.dispose();
      for (const m of materials.values()) m.dispose();
      for (const t of textures) t.dispose();
      for (const f of floorRoots.values()) {
        f.top.dispose();
        f.map.dispose();
        if(f.mesh.geometry !== box) f.mesh.geometry.dispose();
      }
      shell.traverse((o) => {
        if(o.userData.shellGeometry) (o as THREE.Mesh).geometry.dispose();
        if (o.userData.ownedMaterial)
          ((o as THREE.Mesh).material as THREE.Material).dispose();
      });
      footprintMaterial.dispose();
      footprintBorderMaterial.dispose();
      env.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
