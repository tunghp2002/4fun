import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { CityModel } from "./model";
import type {
  CameraView,
  MapData,
  ScenePin,
  SceneSettings,
  TerrainData,
  SceneLandmark,
  Coordinate,
} from "../types";
import { project, unproject } from "../geo/coordinates";
import {
  contextSpan,
  MAX_TRAVEL_DISTANCE,
  pinScale,
  rebaseCamera,
  travelCenter,
} from "./navigation";
import { cameraFrame, cameraNear } from "./camera";
import { createFinish } from "./finish";
import type { CityContext } from "./context";

export interface CameraState {
  view?: CameraView;
  position: [number, number, number];
  target: [number, number, number];
  focal: number;
}
export interface Stage {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  setCity(
    model: CityModel,
    data: MapData,
    terrain: TerrainData,
    travel?: boolean,
  ): void;
  setContext(context: CityContext): void;
  update(settings: SceneSettings): void;
  view(view: CameraView): void;
  zoom(direction: number): void;
  rotate(direction: number): void;
  pan(enabled: boolean): void;
  focusPin(): void;
  focusLandmark(id: string): void;
  lens(value: number): void;
  pinAt(x: number, z: number): void;
  getCamera(): CameraState;
  setCamera(value: CameraState): void;
  png(width: number, title: string): Promise<Blob>;
  getModel(): THREE.Group | undefined;
  dispose(): void;
}
export function createStage(
  canvas: HTMLCanvasElement,
  onPin: (pin: ScenePin | null) => void,
  onFailure: () => void,
  onView: (view: CameraView) => void,
  onLandmarks: (landmarks: SceneLandmark[]) => void = () => {},
  onMove: (
    center: Coordinate | null,
    span: number,
    settled: boolean,
  ) => void = () => {},
): Stage {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(38, 1, 0.12, 18000);
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 4;
  skyCanvas.height = 256;
  const sky = new THREE.CanvasTexture(skyCanvas);
  sky.colorSpace = THREE.SRGBColorSpace;
  scene.background = sky;
  let skyStyle = "";
  const finish = createFinish(renderer, scene, camera);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !matchMedia("(prefers-reduced-motion: reduce)")
    .matches;
  controls.dampingFactor = 0.12;
  controls.maxPolarAngle = Math.PI / 2 - 0.025;
  controls.minPolarAngle = 0.015;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  const ambient = new THREE.HemisphereLight("#ffffff", "#b6aa8f", 1.1),
    sun = new THREE.DirectionalLight("#fff3df", 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.045;
  sun.shadow.blurSamples = 4;
  scene.add(ambient, sun, sun.target);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12000, 12000),
    new THREE.ShadowMaterial({ color: "#4d5948", opacity: 0.24 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(1800, 36, "#8e9a88", "#adb3a3");
  grid.visible = false;
  scene.add(grid);
  const marker = new THREE.Group();
  marker.visible = false;
  scene.add(marker);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: "#c76a42" });
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 14, 8),
    markerMaterial,
  );
  stem.position.y = 7;
  marker.add(stem);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(3, 12, 8),
    markerMaterial,
  );
  head.position.y = 15;
  marker.add(head);
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(4, 5, 32),
    new THREE.MeshBasicMaterial({ color: "#c76a42", side: THREE.DoubleSide }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.5;
  marker.add(halo);
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2(),
    down = new THREE.Vector2();
  let model: CityModel | undefined,
    context: CityContext | undefined,
    skyline = 0,
    map: MapData | undefined,
    terrain: TerrainData | undefined;
  let settings: SceneSettings | undefined,
    currentView: CameraView = "perspective",
    pin: ScenePin | null = null;
  let frame = 0,
    disposed = false,
    last = 0,
    width = 1,
    height = 1;
  const keys = new Set<string>();
  let navigating = false,
    dragging = false,
    lastMove = 0;
  const startNavigation = () => {
    navigating = true;
    dragging = true;
  };
  const endNavigation = () => {
    dragging = false;
    refreshSoon();
  };
  controls.addEventListener("start", startNavigation);
  controls.addEventListener("end", endNavigation);
  function moved(settled = false) {
    if (!map || (!settled && performance.now() - lastMove < 250)) return;
    lastMove = performance.now();
    const focus = currentView === "eye" ? camera.position : controls.target;
    const span = contextSpan(
      camera.position.distanceTo(controls.target),
      camera.fov,
      camera.aspect,
    );
    const stable = settled && !dragging;
    onMove(
      navigating && (stable || currentView === "eye")
        ? travelCenter(
            map.center,
            Math.max(map.span, span > 4400 ? span / 2 : 0),
            focus.x,
            focus.z,
          )
        : null,
      span,
      stable,
    );
  }
  const render = () => {
    if (disposed || document.hidden) return;
    frame = 0;
    const now = performance.now(),
      dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let moving = false;
    if (currentView === "eye" && keys.size && map && terrain) {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3()
          .crossVectors(forward, camera.up)
          .normalize(),
        delta = new THREE.Vector3();
      if (keys.has("w")) delta.add(forward);
      if (keys.has("s")) delta.sub(forward);
      if (keys.has("d")) delta.add(right);
      if (keys.has("a")) delta.sub(right);
      delta.normalize().multiplyScalar(dt * 4.2);
      moveEye(delta);
      moving = true;
    }
    const changed = currentView !== "eye" && controls.update(dt);
    if (currentView === "eye") camera.lookAt(controls.target);
    fitClipping();
    if (marker.visible)
      marker.scale.setScalar(
        pinScale(
          camera.position.distanceTo(marker.position),
          camera.fov,
          height,
        ),
      );
    moved();
    finish.render();
    if (changed || moving) request();
  };
  function fitClipping() {
    const ground = model
      ? model.elevation(camera.position.x, camera.position.z) *
        (settings?.heightScale ?? 1)
      : 0;
    const near = cameraNear(camera.position.y - ground);
    const far = Math.max(
      3000,
      (context?.root.userData.extentMeters ?? map?.span ?? 800) * 3,
      camera.position.distanceTo(controls.target) * 3,
    );
    if (Math.abs(camera.near - near) > 0.001 || camera.far !== far) {
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();
    }
  }
  function request() {
    if (!disposed && !frame && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  const resize = () => {
    const bounds = canvas.parentElement!.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        1.5,
        Math.sqrt(2400000 / (width * height)),
      ),
    );
    renderer.setSize(width, height, false);
    finish.resize(width, height, renderer.getPixelRatio());
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    request();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas.parentElement!);
  controls.addEventListener("change", request);
  const compassNeedle =
    canvas.parentElement?.querySelector<SVGElement>(".compass svg");
  const updateBearing = () => {
    if (compassNeedle)
      compassNeedle.style.transform = `rotate(${(controls.getAzimuthalAngle() * 180) / Math.PI}deg)`;
  };
  controls.addEventListener("change", updateBearing);
  const visibility = () => {
    keys.clear();
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else request();
  };
  document.addEventListener("visibilitychange", visibility);
  const failed = (event: Event) => {
    event.preventDefault();
    keys.clear();
    cancelAnimationFrame(frame);
    frame = 0;
    onFailure();
  };
  canvas.addEventListener("webglcontextlost", failed);
  let eyePointer: { id: number; x: number; y: number } | undefined;
  function moveEye(delta: THREE.Vector3) {
    if (!map || !terrain || !model) return;
    navigating = true;
    const before = camera.position.clone(),
      next = before.clone().add(delta);
    if (!model.street.blocked(next.x, next.z)) camera.position.copy(next);
    else if (!model.street.blocked(next.x, before.z))
      camera.position.x = next.x;
    else if (!model.street.blocked(before.x, next.z))
      camera.position.z = next.z;
    camera.position.y =
      model!.elevation(camera.position.x, camera.position.z) *
        (settings?.heightScale ?? 1) +
      1.7;
    controls.target.add(camera.position.clone().sub(before));
    refreshSoon();
    request();
  }
  const pointerDown = (event: PointerEvent) => {
    down.set(event.clientX, event.clientY);
    if (currentView === "eye" && event.button === 0) {
      eyePointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    }
  };
  const pointerMove = (event: PointerEvent) => {
    if (
      !eyePointer ||
      event.pointerId !== eyePointer.id ||
      currentView !== "eye"
    )
      return;
    const direction = new THREE.Spherical().setFromVector3(
      controls.target.clone().sub(camera.position),
    );
    direction.theta -= (event.clientX - eyePointer.x) * 0.004;
    direction.phi = THREE.MathUtils.clamp(
      direction.phi - (event.clientY - eyePointer.y) * 0.004,
      0.25,
      Math.PI - 0.25,
    );
    controls.target
      .copy(camera.position)
      .add(new THREE.Vector3().setFromSpherical(direction));
    eyePointer.x = event.clientX;
    eyePointer.y = event.clientY;
    refreshSoon();
    request();
  };
  const stopPointer = () => {
    eyePointer = undefined;
  };
  const wheel = (event: WheelEvent) => {
    if (currentView !== "eye") return;
    event.preventDefault();
    const direction = controls.target.clone().sub(camera.position);
    direction.y = 0;
    moveEye(
      direction.normalize().multiplyScalar(Math.sign(event.deltaY) * -1.6),
    );
  };
  const pointerUp = (event: PointerEvent) => {
    eyePointer = undefined;
    if (
      !model ||
      !map ||
      !terrain ||
      event.button !== 0 ||
      Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5
    )
      return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const surfaces = [
      model.ground,
      model.root.getObjectByName("water"),
      model.root.getObjectByName("Lòng nước"),
    ].filter((o): o is THREE.Object3D => !!o && o.visible);
    const hit = ray.intersectObjects(surfaces, true)[0];
    if (!hit) return;
    pin = {
      x: hit.point.x,
      z: hit.point.z,
      coordinate: unproject(hit.point.x, hit.point.z, map.center),
    };
    marker.visible = true;
    marker.position.copy(hit.point);
    onPin(pin);
    request();
  };
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointercancel", stopPointer);
  canvas.addEventListener("wheel", wheel, { passive: false });
  const keyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (currentView === "eye" && ["w", "a", "s", "d"].includes(key)) {
      event.preventDefault();
      keys.add(key);
      request();
      return;
    }
    if (key === "f") {
      event.preventDefault();
      api.focusPin();
    } else if (key === "1") api.view("perspective");
    else if (key === "2") api.view("top");
    else if (key === "3") api.view("eye");
    else if (key === "4") api.view("overview");
    else if (key === "+" || key === "=") api.zoom(1);
    else if (key === "-") api.zoom(-1);
    else if (key === "arrowleft" || key === "arrowright") {
      event.preventDefault();
      api.rotate(key === "arrowleft" ? -1 : 1);
    }
  };
  const keyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase()),
    blur = () => keys.clear();
  canvas.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", blur);
  function applyLight() {
    if (!settings || !map) return;
    const angle = ((settings.hour - 6) / 12) * Math.PI,
      span = map.span;
    sun.position
      .set(
        -Math.cos(angle) * span * 0.8,
        Math.max(0.12, Math.sin(angle)) * span * 0.8,
        span * 0.45,
      )
      .add(sun.target.position);
    sun.color.set(
      settings.style === "ink"
        ? "#ffffff"
        : settings.hour > 16
          ? "#ffd4a0"
          : "#fff4e4",
    );
    sun.intensity = settings.style === "ink" ? 2.8 : 2.6;
    ambient.intensity = settings.style === "ink" ? 0.95 : 1.2;
    const background =
      settings.style === "ink"
        ? "#faf9f5"
        : settings.style === "clay"
          ? "#eeeee8"
          : "#e0e8df";
    if (skyStyle !== settings.style) {
      skyStyle = settings.style;
      const ctx = skyCanvas.getContext("2d")!;
      const gradient = ctx.createLinearGradient(0, 0, 0, skyCanvas.height);
      gradient.addColorStop(
        0,
        settings.style === "paper" ? "#92b6c5" : background,
      );
      gradient.addColorStop(0.68, background);
      gradient.addColorStop(1, background);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
      sky.needsUpdate = true;
    }
    scene.fog = new THREE.Fog(
      background,
      span * 0.65,
      Math.max(1500, span * 2.2),
    );
    finish.update(settings.style, settings.shadows, settings.outlines);
    renderer.shadowMap.enabled = settings.shadows;
    sun.castShadow = settings.shadows;
    grid.visible = settings.grid;
    grid.scale.setScalar(span / 1800);
    grid.position.y = 0.6;
    fitShadow();
  }
  function fitShadow() {
    if (!map || !terrain || !settings) return;
    const ground =
      model!.elevation(camera.position.x, camera.position.z) *
      settings.heightScale;
    const altitude = Math.max(0, camera.position.y - ground);
    if (scene.fog instanceof THREE.Fog) {
      const extent = Math.max(
        map.span,
        (context?.root.userData.extentMeters ?? map.span) / 2,
      );
      scene.fog.near = extent * 0.65 + altitude * 0.8;
      scene.fog.far = Math.max(1500, extent * 2.2) + altitude * 1.8;
    }
    const half =
      altitude < 45
        ? 100
        : Math.min(map.span * 0.7, Math.max(150, altitude * 0.9));
    const center =
      altitude < 45
        ? camera.position
            .clone()
            .add(
              camera
                .getWorldDirection(new THREE.Vector3())
                .setY(0)
                .normalize()
                .multiplyScalar(65),
            )
        : controls.target.clone();
    center.y = model!.elevation(center.x, center.z) * settings.heightScale;
    const offset = sun.position.clone().sub(sun.target.position);
    sun.target.position.copy(center);
    sun.position.copy(center).add(offset);
    Object.assign(sun.shadow.camera, {
      left: -half,
      right: half,
      top: half,
      bottom: -half,
    });
    sun.shadow.camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
  }
  let detailTimer: ReturnType<typeof setTimeout> | undefined;
  function refreshDetails() {
    if (disposed || !model) return;
    const local = camera.position.clone();
    local.y /= settings?.heightScale ?? 1;
    const changed = model.detail(local);
    if (changed) renderer.shadowMap.needsUpdate = true;
    fitShadow();
    moved(true);
    request();
  }
  function refreshSoon() {
    clearTimeout(detailTimer);
    detailTimer = setTimeout(refreshDetails, 280);
  }
  controls.addEventListener("change", refreshSoon);
  const api: Stage = {
    renderer,
    camera,
    scene,
    setCity(next, data, elevation, travel = false) {
      const previous =
        travel && map && terrain
          ? rebaseCamera(
              api.getCamera(),
              map.center,
              data.center,
              (terrain.minimum - elevation.minimum) *
                (settings?.heightScale ?? 1),
            )
          : undefined;
      const oldPin = travel ? pin : null;
      const sameArea =
        map?.span === data.span &&
        map.center.lat === data.center.lat &&
        map.center.lon === data.center.lon;
      if (model) {
        scene.remove(model.root);
        model.dispose();
      }
      if (!sameArea && context) {
        scene.remove(context.root);
        context.dispose();
        context = undefined;
      }
      model = next;
      map = data;
      terrain = elevation;
      scene.add(next.root);
      onLandmarks([...next.landmarks, ...(context?.landmarks ?? [])]);
      marker.visible = false;
      pin = null;
      onPin(null);
      const size = data.span;
      floor.position.y = -Math.max(12, size * 0.018) - 0.3;
      Object.assign(sun.shadow.camera, {
        left: -size * 0.7,
        right: size * 0.7,
        top: size * 0.7,
        bottom: -size * 0.7,
        near: 1,
        far: size * 4,
      });
      sun.shadow.camera.updateProjectionMatrix();
      if (settings) next.apply(settings);
      const buildings = next.root.getObjectByName("buildings");
      skyline = buildings
        ? Math.max(0, new THREE.Box3().setFromObject(buildings).max.y) /
          (settings?.heightScale ?? 1)
        : 0;
      applyLight();
      camera.far = Math.max(3000, size * 7);
      camera.updateProjectionMatrix();
      if (previous) {
        if (previous.view === "eye") {
          const floor =
            next.elevation(previous.position[0], previous.position[2]) *
              (settings?.heightScale ?? 1) +
            1.7;
          previous.target[1] += floor - previous.position[1];
          previous.position[1] = floor;
        }
        api.setCamera(previous);
        if (oldPin) {
          const [x, z] = project(oldPin.coordinate, data.center);
          if (Math.max(Math.abs(x), Math.abs(z)) <= data.span / 2)
            api.pinAt(x, z);
        }
      } else if (!sameArea) {
        navigating = false;
        api.view("perspective");
      }
      refreshDetails();
      refreshSoon();
      request();
    },
    setContext(next) {
      if (context) {
        scene.remove(context.root);
        context.dispose();
      }
      context = next;
      scene.add(next.root);
      if (settings) next.apply(settings);
      onLandmarks([...(model?.landmarks ?? []), ...next.landmarks]);
      fitShadow();
      request();
    },
    update(next) {
      settings = next;
      model?.apply(next);
      context?.apply(next);
      applyLight();
      request();
    },
    view(view) {
      if (!map || !terrain) return;
      keys.clear();
      currentView = view;
      onView(view);
      const span = map.span,
        relief =
          (terrain.maximum - terrain.minimum) * (settings?.heightScale ?? 1),
        top = relief * 0.35 + 8,
        fit =
          (span / Math.tan((camera.fov * Math.PI) / 360) / 2) *
          Math.max(1, 1 / camera.aspect) *
          1.08;
      controls.enabled = view !== "eye";
      controls.maxPolarAngle =
        view === "eye" ? Math.PI * 0.65 : Math.PI / 2 - 0.025;
      controls.minDistance = view === "eye" ? 0.5 : 8;
      controls.maxDistance = MAX_TRAVEL_DISTANCE;
      const street = model?.street.camera;
      if (view === "eye" && street) {
        const [sx, , sz] = street.position;
        const x = pin && !model!.street.blocked(pin.x, pin.z) ? pin.x : sx;
        const z = pin && !model!.street.blocked(pin.x, pin.z) ? pin.z : sz;
        const direction = new THREE.Vector3()
          .fromArray(street.target)
          .sub(new THREE.Vector3().fromArray(street.position))
          .setY(0)
          .normalize();
        const y = model!.elevation(x, z) * (settings?.heightScale ?? 1) + 1.7;
        camera.position.set(x, y, z);
        controls.target.copy(camera.position).add(direction.multiplyScalar(45));
        controls.target.y =
          model!.elevation(controls.target.x, controls.target.z) *
            (settings?.heightScale ?? 1) +
          2.3;
      } else if (view === "perspective" && street && !model?.landmarks.length) {
        const x = street.position[0],
          z = street.position[2];
        const direction = new THREE.Vector3()
          .fromArray(street.target)
          .sub(new THREE.Vector3().fromArray(street.position))
          .setY(0)
          .normalize();
        const y = model!.elevation(x, z) * (settings?.heightScale ?? 1);
        camera.position.set(x, y + 7, z);
        controls.target.copy(camera.position).add(direction.multiplyScalar(45));
        controls.target.y =
          model!.elevation(controls.target.x, controls.target.z) *
            (settings?.heightScale ?? 1) +
          3;
      } else {
        controls.target.set(0, top, 0);
        if (view === "top") camera.position.set(0, fit * 1.07, 0.01);
        else {
          const frame = cameraFrame(
            span,
            camera.aspect,
            camera.fov,
            relief,
            view === "overview",
            skyline * (settings?.heightScale ?? 1),
          );
          camera.position.copy(frame.position);
          controls.target.copy(frame.target);
        }
      }
      camera.updateProjectionMatrix();
      camera.lookAt(controls.target);
      if (view !== "eye") controls.update();
      refreshDetails();
      request();
    },
    zoom(direction) {
      navigating = true;
      if (currentView === "eye") {
        const offset = controls.target
          .clone()
          .sub(camera.position)
          .setY(0)
          .normalize();
        moveEye(offset.multiplyScalar(direction > 0 ? 2 : -2));
        return;
      }
      const offset = camera.position
        .clone()
        .sub(controls.target)
        .multiplyScalar(direction > 0 ? 0.82 : 1.22);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      request();
    },
    rotate(direction) {
      if (currentView === "eye") {
        const offset = controls.target
          .clone()
          .sub(camera.position)
          .applyAxisAngle(camera.up, (direction * Math.PI) / 12);
        controls.target.copy(camera.position).add(offset);
        refreshSoon();
        request();
        return;
      }
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        (direction * Math.PI) / 12,
      );
      camera.position.copy(controls.target).add(offset);
      controls.update();
      request();
    },
    pan(enabled) {
      controls.enableDamping =
        !enabled && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      controls.mouseButtons.LEFT = enabled
        ? THREE.MOUSE.PAN
        : THREE.MOUSE.ROTATE;
      controls.touches.ONE = enabled ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
    },
    focusPin() {
      if (!pin) {
        api.view("perspective");
        return;
      }
      const target = new THREE.Vector3(pin.x, marker.position.y, pin.z),
        offset = camera.position.clone().sub(controls.target);
      if (offset.length() > (map?.span ?? 800) * 0.45)
        offset.setLength((map?.span ?? 800) * 0.45);
      controls.target.copy(target);
      camera.position.copy(target).add(offset);
      controls.update();
      request();
    },
    focusLandmark(id) {
      const item = [
        ...(model?.landmarks ?? []),
        ...(context?.landmarks ?? []),
      ].find((item) => item.id === id);
      if (!item) return;
      keys.clear();
      currentView = "perspective";
      onView(currentView);
      controls.enabled = true;
      controls.minDistance = 5;
      controls.maxPolarAngle = Math.PI / 2 - 0.025;
      const scale = settings?.heightScale ?? 1;
      const target = new THREE.Vector3(
        item.x,
        (item.base + item.height * 0.45) * scale,
        item.z,
      );
      const radius =
        Math.hypot(item.width, item.depth, item.height * scale) / 2;
      const halfFov = Math.atan(
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
          Math.min(1, camera.aspect),
      );
      const offset = new THREE.Vector3(0.65, 0.65, 1.5)
        .normalize()
        .multiplyScalar((radius / Math.sin(halfFov)) * 1.12);
      offset.applyAxisAngle(camera.up, item.rotation);
      controls.target.copy(target);
      camera.position.copy(target).add(offset);
      camera.lookAt(target);
      controls.update();
      refreshDetails();
      request();
    },
    pinAt(x, z) {
      if (!map || !terrain) return;
      pin = { x, z, coordinate: unproject(x, z, map.center) };
      marker.visible = true;
      marker.position.set(
        x,
        model!.elevation(x, z) * (settings?.heightScale ?? 1),
        z,
      );
      onPin(pin);
      request();
    },
    lens(value) {
      camera.setFocalLength(value);
      camera.updateProjectionMatrix();
      request();
    },
    getCamera() {
      return {
        view: currentView,
        position: camera.position.toArray() as [number, number, number],
        target: controls.target.toArray() as [number, number, number],
        focal: camera.getFocalLength(),
      };
    },
    setCamera(value) {
      if (
        ![...value.position, ...value.target, value.focal].every(
          Number.isFinite,
        )
      )
        return;
      if (
        [...value.position, ...value.target].some(
          (n) => Math.abs(n) > MAX_TRAVEL_DISTANCE * 2,
        ) ||
        value.focal < 10 ||
        value.focal > 150
      )
        return;
      if (
        value.view &&
        ["perspective", "overview", "top", "eye"].includes(value.view)
      ) {
        currentView = value.view;
        onView(currentView);
        controls.minDistance = currentView === "eye" ? 0.5 : 8;
      }
      controls.enabled = currentView !== "eye";
      controls.maxDistance = MAX_TRAVEL_DISTANCE;
      controls.maxPolarAngle =
        currentView === "eye" ? Math.PI * 0.65 : Math.PI / 2 - 0.025;
      camera.position.fromArray(value.position);
      controls.target.fromArray(value.target);
      camera.setFocalLength(value.focal);
      if (currentView !== "eye") controls.update();
      else camera.lookAt(controls.target);
      refreshDetails();
      request();
    },
    async png(exportWidth, title) {
      refreshDetails();
      const w = Math.max(800, Math.min(3840, exportWidth)),
        h = Math.round((w * height) / width),
        dpr = renderer.getPixelRatio();
      const output = document.createElement("canvas");
      output.width = w;
      output.height = h;
      const ctx = output.getContext("2d");
      if (!ctx) throw new Error("Không tạo được ảnh.");
      try {
        renderer.setPixelRatio(1);
        renderer.setSize(w, h, false);
        finish.resize(w, h, 1);
        marker.visible = false;
        fitClipping();
        finish.render();
        ctx.fillStyle = settings?.style === "ink" ? "#f8f6ee" : "#efeee6";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(canvas, 0, 0, w, h);
        const font = Math.max(12, Math.round(w / 110)),
          padding = font * 1.4;
        ctx.fillStyle = "#faf9f4";
        ctx.fillRect(0, h - font * 4, w, font * 4);
        ctx.fillStyle = "#334d3e";
        ctx.font = `600 ${font * 1.15}px system-ui`;
        ctx.fillText(title, padding, h - font * 2.2);
        ctx.font = `${font * 0.85}px system-ui`;
        ctx.fillText(
          "© OpenStreetMap contributors · © OpenMapTiles / OpenFreeMap · Mapzen Terrain · phostudio",
          padding,
          h - font * 0.8,
        );
        return await new Promise<Blob>((resolve, reject) =>
          output.toBlob(
            (blob) =>
              blob ? resolve(blob) : reject(new Error("Không xuất được ảnh.")),
            "image/png",
          ),
        );
      } finally {
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height, false);
        finish.resize(width, height, dpr);
        marker.visible = !!pin;
        request();
      }
    },
    getModel() {
      refreshDetails();
      if (!model) return;
      const root = new THREE.Group();
      root.name = model.root.name;
      root.userData = model.root.userData;
      root.add(model.root.clone(true));
      if (context) root.add(context.root.clone(true));
      return root;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(detailTimer);
      observer.disconnect();
      controls.removeEventListener("change", request);
      controls.removeEventListener("change", refreshSoon);
      controls.removeEventListener("change", updateBearing);
      controls.removeEventListener("start", startNavigation);
      controls.removeEventListener("end", endNavigation);
      controls.dispose();
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("webglcontextlost", failed);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointercancel", stopPointer);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
      model?.dispose();
      context?.dispose();
      sky.dispose();
      sun.dispose();
      ambient.dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      grid.geometry.dispose();
      for (const m of Array.isArray(grid.material)
        ? grid.material
        : [grid.material])
        m.dispose();
      marker.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          if (o.material instanceof THREE.Material) o.material.dispose();
        }
      });
      finish.dispose();
      renderer.dispose();
      scene.clear();
    },
  };
  resize();
  return api;
}
