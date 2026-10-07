import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { faceTexture, softTexture, tearTexture } from './art';
import { followSpring, JellySurface, type SurfaceBinding } from './jelly';
import { cutFraction } from './cutting';
import { MAX_MOCHI, MOCHI_FLOOR, SLING_PULL_LIMIT, slingshotVelocity, stepMochi } from './mochi';
import { createMochiAsset, buildSlingshot } from './mochi-art';
import { constrainToGarden, holdMood, randomGait, MOODS, splitSizes, mergedSize, sizeAfterMochi, MAX_PET_SIZE, DIZZY_RECOVERY_SECONDS, IDLE_MERGE_SECONDS, type Gait, type Mood, type PetSettings } from './behavior';

type Callbacks = { onCount: (count: number) => void; onMessage: (message: string) => void; onTool: (tool: PetSettings['tool']) => void; onReady?: () => void };
type Pet = {
  root: THREE.Group; visual: THREE.Group; body: THREE.Mesh; face: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  size: number; target: THREE.Vector3; gait: Gait; phase: number; nextWander: number; speed: number; tempo: number; departAt: number;
  mood: Mood; moodUntil: number; dizzyUntil: number; faceKey: string; squash: number; lift: number; roll: number; roundness: number; moving: boolean;
  jelly: JellySurface; faceGuides: Float32Array; faceBinding: SurfaceBinding; velocity: THREE.Vector3;
  look: THREE.Vector2; stroke: number; lastHeart: number; reflection: THREE.Mesh; motion: THREE.Vector3;
  lastTap: number; spin: number; wiggleUntil: number; fear: number;
  tears: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[];
  pursuit?: Mochi; chewUntil: number; fullness: number; meals: number; growthTarget: number;
};
type Particle = { mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>; velocity: THREE.Vector3; life: number; duration: number };
type Mochi = { mesh: THREE.Group; shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; velocity: THREE.Vector3; life: number; eater?: Pet; bite: number; inGarden: boolean };
export type SlimeWorld = { configure: (settings: PetSettings) => void; reset: () => void; dispose: () => void };

export function createSlimeWorld(canvas: HTMLCanvasElement, initial: PetSettings, callbacks: Callbacks): SlimeWorld {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, .1, 100);
  camera.position.set(0, 8.6, 18); camera.lookAt(0, 1.7, 0);
  scene.fog = new THREE.Fog('#eee1b2', 28, 60);
  scene.add(new THREE.HemisphereLight('#ffffff', '#bfccd1', 1.1));
  const sun = new THREE.DirectionalLight('#fffdf8', 1.8); sun.position.set(-6, 8, 6); scene.add(sun);
  const fill = new THREE.DirectionalLight('#dceefa', .7); fill.position.set(5, 7, 10); scene.add(fill);
  const environment = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
  const softPanel = new THREE.SphereGeometry(1, 24, 12);
  environment.traverse((object) => {
    if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshLambertMaterial && object.material.emissiveIntensity > 1) {
      object.geometry = softPanel; object.scale.multiplyScalar(.5);
      if (object.position.z > 12) object.position.set(-7, 15, object.position.z);
    }
  });
  const environmentMap = pmrem.fromScene(environment, .04);
  scene.environment = environmentMap.texture;
  environment.dispose(); pmrem.dispose();
  const shadowMap = softTexture();
  const tearMap = tearTexture(), tearGeometry = new THREE.PlaneGeometry(.095, .16);
  const faceMaterials = new Map<string, THREE.MeshBasicMaterial>();
  const dizzyRotation = { value: 0 };
  for (const light of [false, true]) for (const mood of [...MOODS, 'squeeze', 'blink'] as const) {
    const material = new THREE.MeshBasicMaterial({ map: faceTexture(mood, light), transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1 });
    if (mood === 'dizzy') material.onBeforeCompile = (shader) => {
      shader.uniforms.dizzyRotation = dizzyRotation;
      shader.fragmentShader = 'uniform float dizzyRotation;\n' + shader.fragmentShader;
      // Rotate each spiral about its own center, in opposite directions, without uploading new textures.
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        vec2 eyeCenter = vec2(vMapUv.x < .5 ? 87.0 : 169.0, 80.0);
        vec2 eyePixel = vMapUv * vec2(256.0, 160.0) - eyeCenter;
        float angle = dizzyRotation * (vMapUv.x < .5 ? 1.0 : -1.0);
        float c = cos(angle), s = sin(angle);
        vec2 spunUv = (mat2(c, -s, s, c) * eyePixel + eyeCenter) / vec2(256.0, 160.0);
        ${THREE.ShaderChunk.map_fragment.replace('vMapUv', 'spunUv')}
        diffuseColor.a *= 1.0 - smoothstep(30.0, 32.0, length(eyePixel));
      `);
    };
    faceMaterials.set(`${mood}-${light}`, material);
  }
  const bodyGeometry = new THREE.SphereGeometry(1, 48, 32);
  const positions = bodyGeometry.attributes.position;
  const bodyCenter = .92, bodyRadii = new THREE.Vector3(1.38, .96, 1.06);
  const ballRadius = Math.cbrt(bodyRadii.x * bodyRadii.y * bodyRadii.z);
  const roundPose = new Float32Array(positions.array.length);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    // Rimuru's smooth dome widens below the crown and rounds continuously into its base.
    const belly = 1 - y * .22, lean = .025 * (1 - y * y);
    const groundedY = y < 0 ? y - .34 * (1 - y * y) * THREE.MathUtils.smoothstep(-y, 0, 1) : y;
    positions.setXYZ(i, x * bodyRadii.x * belly + lean, bodyCenter + groundedY * bodyRadii.y, z * bodyRadii.z * belly);
    roundPose.set([x * ballRadius, bodyCenter + y * ballRadius, z * ballRadius], i * 3);
  }
  bodyGeometry.computeVertexNormals();
  bodyGeometry.computeBoundingSphere();
  bodyGeometry.setAttribute('petRest', positions.clone());
  const uniforms = {
    petColor: { value: new THREE.Color('#79b5d8') }, petSecond: { value: new THREE.Color('#b6def0') },
    petMode: { value: 0 }, petTime: { value: 0 }, petGradient: { value: 1 },
  };
  const bodyMaterial = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .28, metalness: 0,
    clearcoat: .45, clearcoatRoughness: .22, transmission: .18, thickness: 1.1, ior: 1.27,
    attenuationColor: '#79b5d8', attenuationDistance: 1.8, envMapIntensity: .72 });
  bodyMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'attribute vec3 petRest; varying vec3 vPetPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPetPosition = petRest;');
    shader.fragmentShader = `varying vec3 vPetPosition;
      uniform vec3 petColor; uniform vec3 petSecond;
      uniform float petMode; uniform float petTime; uniform float petGradient;
      float petHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float blend = smoothstep(0.12, 1.65, vPetPosition.y);
      vec3 tint = mix(petColor, petSecond, blend * petGradient);
      if (petMode > 1.5) {
        tint = 0.62 + 0.36 * cos(6.28318 * (vPetPosition.y * .43 + vPetPosition.x * .12 + vec3(0.0, .33, .67) + petTime * .018));
      } else if (petMode > .5) {
        float cloud = sin(vPetPosition.x * 5.0 + vPetPosition.y * 3.0 + petTime * .16) * sin(vPetPosition.z * 4.0 - vPetPosition.y * 4.0);
        tint = mix(vec3(.18,.095,.4), vec3(.58,.30,.79), blend * .6 + cloud * .24 + .25);
        vec3 grid = vPetPosition * 24.0;
        float star = step(.96, petHash(floor(grid))) * (1.0 - smoothstep(.025, .16, length(fract(grid) - .5)));
        tint += star * (0.6 + .4 * sin(petTime * 2.0 + petHash(floor(grid)) * 45.0));
      }
      diffuseColor.rgb *= tint;`);
  };
  const reflectionMaterial = new THREE.MeshBasicMaterial({ color: '#8ccfe2', transparent: true, opacity: .065, depthWrite: false, side: THREE.DoubleSide });
  const faceGeometry = new THREE.BufferGeometry();
  faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(24), 3));
  const faceUv: number[] = [], faceIndices: number[] = [];
  const faceGuideRest = new Float32Array(18);
  const frontSurface = (x: number, y: number, offset: number) => {
    const sy = (y - bodyCenter) / bodyRadii.y;
    const crossSection = Math.sqrt(Math.max(0, 1 - sy * sy));
    const belly = 1 - sy * .22, lean = .025 * (1 - sy * sy);
    const rx = bodyRadii.x * crossSection * belly, rz = bodyRadii.z * crossSection * belly;
    faceGuideRest.set([x, y, rz * Math.sqrt(Math.max(0, 1 - ((x - lean) / rx) ** 2))], offset);
  };
  for (let eye = 0; eye < 2; eye++) {
    const pixelX = eye ? 169 : 87, x = (pixelX / 256 - .5) * 1.5;
    frontSurface(x, bodyCenter + .04, eye * 9); frontSurface(x + .12, bodyCenter + .04, eye * 9 + 3); frontSurface(x, bodyCenter + .16, eye * 9 + 6);
    for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) faceUv.push((pixelX + u * 36) / 256, .5 + v * 36 / 160);
    const index = eye * 4; faceIndices.push(index, index + 1, index + 2, index, index + 2, index + 3);
  }
  faceGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(faceUv, 2)); faceGeometry.setIndex(faceIndices);
  const eyeCenter = new THREE.Vector3(), eyeRight = new THREE.Vector3(), eyeUp = new THREE.Vector3(), eyeNormal = new THREE.Vector3();
  const tearBasis = new THREE.Matrix4();
  function updateEyes(pet: Pet) {
    pet.jelly.follow(faceGuideRest, pet.faceGuides, pet.faceBinding);
    const vertices = pet.face.geometry.attributes.position;
    for (let eye = 0; eye < 2; eye++) {
      const offset = eye * 9;
      eyeCenter.fromArray(pet.faceGuides, offset);
      eyeRight.fromArray(pet.faceGuides, offset + 3).sub(eyeCenter).normalize();
      eyeUp.fromArray(pet.faceGuides, offset + 6).sub(eyeCenter);
      eyeNormal.crossVectors(eyeRight, eyeUp).normalize(); eyeUp.crossVectors(eyeNormal, eyeRight).normalize();
      eyeCenter.addScaledVector(eyeRight, pet.look.x).addScaledVector(eyeUp, pet.look.y).addScaledVector(eyeNormal, .055);
      const tear = pet.tears[eye];
      tear.visible = pet.fear > .05;
      if (tear.visible) {
        tear.position.copy(eyeCenter).addScaledVector(eyeUp, -.14).addScaledVector(eyeRight, eye ? .045 : -.045).addScaledVector(eyeNormal, .04);
        tear.position.y -= bodyCenter;
        tear.quaternion.setFromRotationMatrix(tearBasis.makeBasis(eyeRight, eyeUp, eyeNormal));
        tear.material.opacity = pet.fear * .95;
      }
      // Tangent frames follow the skin while preserving each eye's width, height and round outline.
      for (let corner = 0; corner < 4; corner++) {
        const u = (corner === 1 || corner === 2 ? 1 : -1) * .211;
        const v = (corner >= 2 ? 1 : -1) * .153;
        vertices.setXYZ(eye * 4 + corner, eyeCenter.x + eyeRight.x * u + eyeUp.x * v,
          eyeCenter.y + eyeRight.y * u + eyeUp.y * v, eyeCenter.z + eyeRight.z * u + eyeUp.z * v);
      }
    }
    vertices.needsUpdate = true; pet.face.geometry.computeBoundingSphere();
  }
  const shadowGeometry = new THREE.PlaneGeometry(4.1, 3.4);
  const pets: Pet[] = [];
  const particles: Particle[] = [];
  const snacks: Mochi[] = [];
  const mochiAsset = createMochiAsset(), sling = buildSlingshot(), loadedMochi = mochiAsset.makeMesh();
  loadedMochi.position.copy(sling.rest); sling.root.add(loadedMochi); scene.add(sling.root);
  const slingShadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, opacity: .3, depthWrite: false }));
  slingShadow.rotation.x = -Math.PI / 2; slingShadow.position.y = .005; slingShadow.scale.set(.21, .17, 1); sling.root.add(slingShadow);
  const slingOrigin = new THREE.Vector3(), slingPull = new THREE.Vector3(), bandDirection = new THREE.Vector3();
  let reloadAt = 0;
  const aimGeometry = new THREE.BufferGeometry();
  aimGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(32 * 3), 3));
  const aim = new THREE.Line(aimGeometry, new THREE.LineDashedMaterial({ color: '#d596b2', dashSize: .09, gapSize: .09, transparent: true, opacity: .7, depthWrite: false }));
  aim.visible = false; scene.add(aim);
  let heldMochi: Mochi | undefined;
  const mochiAim = new THREE.Vector3(), snackPoint = new THREE.Vector3(), previewVelocity = new THREE.Vector3();
  const heart = new THREE.Shape();
  heart.moveTo(0, -.12); heart.bezierCurveTo(-.24, .03, -.15, .22, 0, .10); heart.bezierCurveTo(.15, .22, .24, .03, 0, -.12);
  const particleGeometry = new THREE.ShapeGeometry(heart, 8);
  let settings = { ...initial }, disposed = false, elapsed = 0, frame = 0, last = performance.now();
  let hovered: Pet | undefined, held: Pet | undefined, pointerId: number | undefined;
  let downAt = 0, travel = 0, messageUntil = 0, lastInteraction = 0;
  let downX = 0, downY = 0, previousX = 0, previousY = 0;
  let hoverX = -1000, hoverY = -1000;
  const hoverPoint = new THREE.Vector3();
  let pinchDistance = 0, pinchBase = 0, pinchTarget = 0, pinchValue = 0, pinchAt = -10;
  let mergePair: { a: Pet; b: Pet; volumeA: number; volumeB: number; progress: number } | undefined;
  const touches = new Map<number, THREE.Vector2>();
  const dragSamples: { time: number; point: THREE.Vector3 }[] = [];
  let audio: AudioContext | undefined;
  const cutThisGesture = new Set<Pet>();
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.28);
  const ground = new THREE.Vector3(), scratch = new THREE.Vector3(), screenPoint = new THREE.Vector3();
  const dragTarget = new THREE.Vector3(), grabWorld = new THREE.Vector3(), grabLocal = new THREE.Vector3(), grabOffset = new THREE.Vector3();
  const dragPlane = new THREE.Plane(), dragNormal = new THREE.Vector3(), localTarget = new THREE.Vector3();
  const inverseVisual = new THREE.Quaternion();
  const rollAxis = new THREE.Vector3(), rollRotation = new THREE.Quaternion(), upright = new THREE.Quaternion();
  const floorWorld = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.285), floorLocal = new THREE.Plane();
  const inverseBody = new THREE.Matrix4();
  let lightEyes = false;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reduceMotion.matches;
  const onReduced = () => { reduced = reduceMotion.matches; };
  reduceMotion.addEventListener('change', onReduced);

  const targetMaterial = new THREE.MeshBasicMaterial({ color: '#fefbf1', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const marker = new THREE.Mesh(new THREE.RingGeometry(.21, .245, 40), targetMaterial);
  marker.rotation.x = -Math.PI / 2; scene.add(marker);
  let markerLife = 0;
  const slashMaterial = new THREE.MeshBasicMaterial({ color: '#fff9ff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  const slash = new THREE.Mesh(new THREE.RingGeometry(.95, 1.03, 36, 1, .1, Math.PI * 1.4), slashMaterial);
  slash.quaternion.copy(camera.quaternion); slash.renderOrder = 5; scene.add(slash);
  let slashLife = 0;
  const bladePlane = new THREE.Plane(), bladeStart = new THREE.Vector3(), bladeEnd = new THREE.Vector3();
  const bladeGeometry = new THREE.BufferGeometry();
  bladeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
  const blade = new THREE.Line(bladeGeometry, new THREE.LineBasicMaterial({ color: '#49788b', transparent: true, opacity: .9, depthTest: false }));
  blade.visible = false; blade.renderOrder = 6; scene.add(blade);

  function boing(strength = 1) {
    if (!settings.sound) return;
    audio ??= new AudioContext();
    void audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain(), start = audio.currentTime;
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(480 + strength * 150, start);
    oscillator.frequency.exponentialRampToValueAtTime(140, start + .18);
    gain.gain.setValueAtTime(.07, start); gain.gain.exponentialRampToValueAtTime(.001, start + .25);
    oscillator.connect(gain).connect(audio.destination); oscillator.start(start); oscillator.stop(start + .26);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  function tell(message: string, duration = 3) { callbacks.onMessage(message); messageUntil = elapsed + duration; }
  function mood(pet: Pet, value: Mood, duration = 1.5) {
    if (value === 'dizzy') pet.dizzyUntil = Math.max(pet.dizzyUntil, elapsed + duration);
    else if (pet.dizzyUntil > elapsed) return;
    pet.mood = value; pet.moodUntil = elapsed + duration;
  }
  function makePet(x: number, z: number, size: number): Pet {
    const root = new THREE.Group(); root.position.set(x, .28, z); root.scale.setScalar(size); scene.add(root);
    const visual = new THREE.Group(); visual.position.y = bodyCenter; root.add(visual);
    const body = new THREE.Mesh(bodyGeometry.clone(), bodyMaterial); body.position.y = -bodyCenter; visual.add(body);
    (body.geometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    const jelly = new JellySurface(body.geometry.attributes.position.array as Float32Array, body.geometry.index?.array, roundPose);
    jelly.energy = .01;
    const face = new THREE.Mesh(faceGeometry.clone(), faceMaterials.get(`idle-${lightEyes}`)!);
    face.position.y = -bodyCenter; face.renderOrder = 2; visual.add(face);
    (face.geometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    const shadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false, opacity: .58 }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(x, .285, z); shadow.scale.setScalar(size); scene.add(shadow);
    const reflection = new THREE.Mesh(body.geometry, reflectionMaterial); scene.add(reflection);
    reflection.visible = false;
    const tears = [0, 1].map(() => {
      const tear = new THREE.Mesh(tearGeometry, new THREE.MeshBasicMaterial({ map: tearMap, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
      tear.visible = false; tear.renderOrder = 3; visual.add(tear); return tear;
    });
    const pet: Pet = { root, visual, body, face, shadow, reflection, size, target: new THREE.Vector3(x, .28, z), gait: 'walk', phase: Math.random() * 6,
      nextWander: elapsed + 5 + Math.random() * 3, mood: 'idle', moodUntil: 0, dizzyUntil: 0, faceKey: `idle-${lightEyes}`, squash: 0, lift: 0, roll: 0, roundness: 0, moving: false,
      jelly, faceGuides: faceGuideRest.slice(), faceBinding: jelly.bind(faceGuideRest), velocity: new THREE.Vector3(), motion: new THREE.Vector3(), look: new THREE.Vector2(), stroke: 0, lastHeart: -10,
      speed: .84 + Math.random() * .32, tempo: .84 + Math.random() * .32, departAt: 0,
      lastTap: -10, spin: 0, wiggleUntil: 0, fear: 0, tears, chewUntil: 0, fullness: 0, meals: 0, growthTarget: size };
    updateEyes(pet); pets.push(pet); return pet;
  }
  function emit(position: THREE.Vector3, color = '#f4c4da', count = 10) {
    if (reduced) count = Math.min(count, 3);
    for (let i = 0; i < count; i++) {
      let particle = particles.find((entry) => entry.life <= 0);
      if (!particle) {
        if (particles.length >= 56) break;
        const mesh = new THREE.Mesh(particleGeometry, new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
        mesh.quaternion.copy(camera.quaternion);
        scene.add(mesh); particle = { mesh, velocity: new THREE.Vector3(), life: 0, duration: 1 }; particles.push(particle);
      }
      particle.life = particle.duration = 1.1 + Math.random() * .4;
      particle.mesh.visible = true; particle.mesh.position.copy(position);
      particle.mesh.material.color.set(color); particle.mesh.material.opacity = 1;
      particle.mesh.scale.setScalar(.55 + Math.random());
      particle.velocity.set((Math.random() - .5) * 1.7, 1.4 + Math.random() * .9, 0);
    }
  }
  function petPosition(pet: Pet) { return scratch.copy(pet.root.position).addScaledVector(THREE.Object3D.DEFAULT_UP, pet.size * 1.35); }
  function affection(pet: Pet) {
    pet.stroke = Math.min(2, pet.stroke + .28);
    mood(pet, pet.stroke > .7 ? 'happy' : 'wink', 2.2); pet.squash = .1; pet.nextWander = elapsed + 3;
    pet.jelly.touch(0, .9, .9, 0, 0, 1, 0, 0, 0, 1.2);
    emit(petPosition(pet), '#f49cb7', 3); boing(); tell('Your slime loves the pets.');
  }
  function jump(pet: Pet, spin = false) {
    if (pet === held || pet.dizzyUntil > elapsed) return;
    pet.velocity.y = 6; pet.lift = Math.max(.02, pet.lift); pet.spin = spin && !reduced ? Math.PI * 2 : 0;
    mood(pet, spin ? 'excited' : 'happy', 1.4); pet.nextWander = elapsed + 3;
    if (spin) emit(petPosition(pet), '#f8d98c', 5);
    boing(1.5);
  }
  function wiggle(pet: Pet) {
    if (pet === held || pet.dizzyUntil > elapsed) return;
    pet.wiggleUntil = elapsed + 1.4; pet.target.set(pet.root.position.x, .28, pet.root.position.z);
    pet.nextWander = elapsed + 3; pet.jelly.inertia(.35, .05, 0); mood(pet, 'wink', 1.6); boing(.6);
  }
  function split(pet: Pet, worldPlane?: THREE.Plane) {
    if (cutThisGesture.has(pet)) return;
    cutThisGesture.add(pet);
    pet.body.updateWorldMatrix(true, false);
    const plane = worldPlane ?? new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), pet.root.position);
    const localPlane = plane.clone().applyMatrix4(new THREE.Matrix4().copy(pet.body.matrixWorld).invert());
    const fraction = cutFraction(pet.body.geometry.attributes.position.array, pet.body.geometry.index!.array,
      localPlane.normal.toArray() as [number, number, number], -localPlane.constant);
    const sizes = splitSizes(pet.size, pets.length, fraction);
    if (!sizes) { tell(pets.length >= 8 ? 'Your meadow already has 8 slimes.' : 'This piece is too small to cut.'); return; }
    const [a, b] = sizes, center = pet.root.position.clone(), direction = plane.normal.clone();
    direction.y = 0; if (direction.lengthSq() < .001) direction.set(1, 0, 0); direction.normalize();
    const separation = (a + b) * 1.1;
    pet.size = pet.growthTarget = a; pet.root.position.addScaledVector(direction, separation * (1 - fraction)); pet.squash = .22;
    pet.target.copy(pet.root.position); pet.target.y = .28; pet.gait = 'walk'; pet.nextWander = elapsed + 4;
    const childPoint = center.addScaledVector(direction, -separation * fraction);
    const child = makePet(childPoint.x, childPoint.z, b); child.squash = .22;
    child.velocity.copy(pet.velocity); child.lift = pet.lift;
    cutThisGesture.add(child); mood(pet, 'happy', 2); mood(child, 'happy', 2);
    emit(petPosition(pet), settings.palette === 'galaxy' ? '#d7bcff' : '#b7efff', 18);
    callbacks.onCount(pets.length); tell('A new little slime!');
  }
  function groundAt(x: number, y: number) {
    const rect = canvas.getBoundingClientRect();
    ndc.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(plane, ground);
  }
  function hitAt(x: number, y: number): Pet | undefined {
    groundAt(x, y);
    const hits = raycaster.intersectObjects(pets.map((pet) => pet.body), false);
    return hits.length ? pets.find((pet) => pet.body === hits[0].object) : undefined;
  }
  function goTo(x: number, z: number) {
    const destination = roomBounds(x, z);
    pets.forEach((pet, i) => {
      const offset = i ? .65 * Math.sqrt(i) : 0;
      const angle = i * 2.4 + Math.random() * .5;
      const point = roomBounds(destination.x + Math.cos(angle) * offset, destination.z + Math.sin(angle) * offset);
      pet.target.set(point.x, .28, point.z); pet.gait = randomGait(); pet.departAt = elapsed + Math.random() * .22;
      pet.nextWander = elapsed + 7; mood(pet, 'curious', .7);
    });
    marker.position.set(destination.x, .32, destination.z); markerLife = 1.2;
    tell('Your slime is on the way.');
  }
  function roomBounds(x: number, z: number) {
    const point = constrainToGarden(x, z), horizontal = Math.max(.5, camera.right - 1.7);
    return { x: THREE.MathUtils.clamp(point.x, -horizontal, horizontal), z: THREE.MathUtils.clamp(point.z, -3.4, 2.6) };
  }
  function hideMochi(snack: Mochi) {
    snack.life = 0; snack.eater = undefined; snack.mesh.visible = snack.shadow.visible = false;
  }
  function spawnMochi(position: THREE.Vector3): Mochi {
    let snack = snacks.find(item => item.life <= 0);
    if (!snack && snacks.length >= MAX_MOCHI) snack = snacks.filter(item => item !== heldMochi).reduce((oldest, item) => item.life < oldest.life ? item : oldest);
    if (!snack) {
      const mesh = mochiAsset.makeMesh();
      const shadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, opacity: .25, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2; scene.add(mesh, shadow);
      snack = { mesh, shadow, velocity: new THREE.Vector3(), life: 0, bite: 0, inGarden: false }; snacks.push(snack);
    }
    snack.mesh.position.copy(position); snack.mesh.scale.setScalar(1);
    const point = roomBounds(position.x, position.z);
    snack.inGarden = Math.hypot(point.x - position.x, point.z - position.z) < .001;
    snack.velocity.set(0, 0, 0); snack.life = 18; snack.bite = 0; snack.eater = undefined;
    snack.mesh.visible = snack.shadow.visible = true;
    return snack;
  }
  function updateSlingshot(dt = 0) {
    sling.root.visible = settings.tool === 'mochi';
    if (!heldMochi) slingPull.multiplyScalar(reduced ? 0 : Math.exp(-dt * 20));
    loadedMochi.visible = !heldMochi && elapsed >= reloadAt;
    loadedMochi.position.copy(sling.rest).add(slingPull);
    loadedMochi.scale.setScalar(reduced ? 1 : THREE.MathUtils.clamp((elapsed - reloadAt) * 6, 0, 1));
    sling.pouch.position.copy(loadedMochi.position); sling.pouch.position.y -= .09;
    for (let i = 0; i < 2; i++) {
      const band = sling.bands[i], anchor = sling.anchors[i];
      bandDirection.copy(sling.pouch.position).sub(anchor);
      band.position.copy(anchor).addScaledVector(bandDirection, .5);
      band.scale.y = bandDirection.length();
      band.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, bandDirection.normalize());
    }
  }
  function boundMochi(position: THREE.Vector3, velocity: THREE.Vector3, entered: boolean): boolean {
    const point = roomBounds(position.x, position.z);
    const inside = Math.hypot(point.x - position.x, point.z - position.z) < .001;
    // The foreground sling can start outside the pets' walking area.
    if (!entered && !inside) return false;
    if (Math.abs(point.x - position.x) > .001) velocity.x *= -.35;
    if (Math.abs(point.z - position.z) > .001) velocity.z *= -.35;
    position.x = point.x; position.z = point.z;
    return true;
  }
  function previewMochi(x: number, y: number) {
    if (!heldMochi) return;
    const dx = x - downX, dy = y - downY, distance = Math.hypot(dx, dy);
    const limited = Math.min(1, SLING_PULL_LIMIT / Math.max(1, distance));
    const pixelsPerUnit = canvas.clientWidth / (camera.right - camera.left);
    const maxDown = Math.max(0, (slingOrigin.y - MOCHI_FLOOR - .05) * pixelsPerUnit / Math.max(.1, camera.matrixWorld.elements[5]));
    const pullX = dx * limited, pullY = Math.min(dy * limited, maxDown);
    slingPull.set(pullX / pixelsPerUnit, -pullY / pixelsPerUnit, 0).applyQuaternion(camera.quaternion);
    heldMochi.mesh.position.copy(slingOrigin).add(slingPull);
    const velocity = slingshotVelocity(pullX, pullY);
    mochiAim.copy(velocity ?? { x: 0, y: 0, z: 0 });
    updateSlingshot();
    if (!velocity) { aim.visible = false; return; }
    snackPoint.copy(heldMochi.mesh.position); previewVelocity.copy(mochiAim);
    const positions = aimGeometry.attributes.position;
    let landed = false, entered = heldMochi.inGarden;
    for (let i = 0; i < 32; i++) {
      if (i > 0 && !landed) {
        stepMochi(snackPoint, previewVelocity, .05);
        entered = boundMochi(snackPoint, previewVelocity, entered);
        landed = snackPoint.y === MOCHI_FLOOR;
      }
      positions.setXYZ(i, snackPoint.x, snackPoint.y, snackPoint.z);
    }
    positions.needsUpdate = true; aimGeometry.computeBoundingSphere(); aim.computeLineDistances(); aim.visible = true;
  }
  function updateMochi(dt: number) {
    for (const snack of snacks) {
      if (snack.life <= 0) continue;
      if (snack !== heldMochi) snack.life -= dt;
      if (snack.life <= 0) { hideMochi(snack); continue; }
      if (snack.eater) {
        snack.bite = Math.min(1, snack.bite + dt / .35);
        snackPoint.copy(snack.eater.root.position).addScaledVector(THREE.Object3D.DEFAULT_UP, snack.eater.size * .9);
        snackPoint.z += snack.eater.size * .85;
        snack.mesh.position.lerp(snackPoint, 1 - Math.exp(-dt * 16));
        snack.mesh.scale.setScalar(1 - snack.bite);
        if (snack.bite === 1) { hideMochi(snack); continue; }
      } else if (snack !== heldMochi) {
        stepMochi(snack.mesh.position, snack.velocity, dt);
        snack.inGarden = boundMochi(snack.mesh.position, snack.velocity, snack.inGarden);
        snack.mesh.scale.setScalar(Math.min(1, snack.life));
      }
      const height = snack.mesh.position.y - MOCHI_FLOOR;
      snack.shadow.position.set(snack.mesh.position.x, .292, snack.mesh.position.z);
      snack.shadow.scale.setScalar(.18 + height * .03);
      snack.shadow.material.opacity = .3 / (1 + height * 2) * Math.min(1, snack.life) * (1 - snack.bite);
    }
  }
  function slashAcross(x1: number, y1: number, x2: number, y2: number) {
    previewCut(x2, y2);
    const direction = bladeEnd.clone().sub(bladeStart);
    if (direction.lengthSq() < .001) return;
    const normal = direction.cross(bladePlane.normal).normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, bladeStart);
    const crossed = new Set<Pet>();
    // Like index.html, read the surface under the entire stroke and cut only on release.
    for (let i = 0; i <= 48; i++) {
      const pet = hitAt(x1 + (x2 - x1) * i / 48, y1 + (y2 - y1) * i / 48);
      if (pet) crossed.add(pet);
    }
    for (const pet of crossed) split(pet, plane);
    slash.position.copy(bladeStart).lerp(bladeEnd, .5);
    slash.quaternion.copy(camera.quaternion); slash.rotateZ(-Math.atan2(y2 - y1, x2 - x1)); slashLife = .3;
  }
  function previewCut(x: number, y: number) {
    groundAt(downX, downY); raycaster.ray.intersectPlane(bladePlane, bladeStart);
    groundAt(x, y); raycaster.ray.intersectPlane(bladePlane, bladeEnd);
    const attribute = blade.geometry.attributes.position;
    attribute.setXYZ(0, bladeStart.x, bladeStart.y, bladeStart.z); attribute.setXYZ(1, bladeEnd.x, bladeEnd.y, bladeEnd.z);
    attribute.needsUpdate = true; blade.geometry.computeBoundingSphere(); blade.visible = true;
  }
  function down(event: PointerEvent) {
    if (event.button === 2 && pointerId === undefined && settings.tool === 'hand') {
      const pet = hitAt(event.clientX, event.clientY);
      if (pet) {
        event.preventDefault(); canvas.focus({ preventScroll: true });
        mood(pet, 'grumpy', 1.8); pet.squash = .06; pet.nextWander = elapsed + 3;
        pet.jelly.touch(0, 1, .9, 0, 0, 1, 0, 0, 0, .45); lastInteraction = elapsed;
      }
      return;
    }
    if (event.pointerType === 'touch') {
      touches.set(event.pointerId, new THREE.Vector2(event.clientX, event.clientY));
      if (touches.size === 2) {
        release(undefined, true);
        const [a, b] = [...touches.values()]; pinchDistance = a.distanceTo(b); pinchBase = pinchValue;
        return;
      }
    }
    if (pointerId !== undefined || event.button !== 0) return;
    if (settings.tool === 'mochi') {
      if (!loadedMochi.visible) return;
      slingOrigin.copy(sling.rest).add(sling.root.position);
      screenPoint.copy(slingOrigin).project(camera);
      const sx = (screenPoint.x + 1) * canvas.clientWidth / 2, sy = (1 - screenPoint.y) * canvas.clientHeight / 2;
      const radius = Math.max(28, canvas.clientWidth / (camera.right - camera.left) * .4);
      if (Math.hypot(event.clientX - sx, event.clientY - sy) > radius) return;
    }
    event.preventDefault(); canvas.focus({ preventScroll: true });
    pointerId = event.pointerId; canvas.setPointerCapture(pointerId);
    downAt = elapsed; travel = 0; cutThisGesture.clear();
    previousX = downX = event.clientX; previousY = downY = event.clientY; lastInteraction = elapsed;
    hoverX = event.clientX; hoverY = event.clientY;
    if (settings.tool === 'mochi') {
      heldMochi = spawnMochi(slingOrigin); previewMochi(event.clientX, event.clientY);
      return;
    }
    const pet = hitAt(event.clientX, event.clientY);
    if (pet && settings.tool === 'hand') {
      held = pet; pet.target.copy(pet.root.position); mood(pet, 'held', 30); pet.velocity.set(0, 0, 0); pet.spin = 0; pet.wiggleUntil = 0;
      const hit = raycaster.intersectObject(pet.body, false)[0];
      if (hit) {
        grabLocal.copy(hit.point); pet.body.worldToLocal(grabLocal);
        const normal = hit.face?.normal ?? THREE.Object3D.DEFAULT_UP;
        pet.jelly.grab(grabLocal.x, grabLocal.y, grabLocal.z, normal.x, normal.y, normal.z);
        grabWorld.copy(hit.point);
        camera.getWorldDirection(dragNormal); dragPlane.setFromNormalAndCoplanarPoint(dragNormal, grabWorld);
        dragTarget.copy(grabWorld);
        grabOffset.copy(grabWorld).sub(pet.root.position);
        dragSamples.length = 0; dragSamples.push({ time: performance.now() / 1000, point: dragTarget.clone() });
      }
      tell('Giving your slime a squish.');
    } else if (settings.tool === 'sword') {
      const hit = pet && raycaster.intersectObject(pet.body, false)[0];
      const point = hit ? hit.point : ground.clone().add(new THREE.Vector3(0, 1, 0));
      bladePlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), point);
      previewCut(event.clientX, event.clientY);
    }
  }
  function move(event: PointerEvent) {
    if (touches.has(event.pointerId)) {
      touches.get(event.pointerId)!.set(event.clientX, event.clientY);
      if (touches.size === 2) {
        if (settings.tool === 'mochi') return;
        const [a, b] = [...touches.values()];
        pinchTarget = THREE.MathUtils.clamp(pinchBase + (a.distanceTo(b) / Math.max(1, pinchDistance) - 1), -.38, .65);
        pinchAt = lastInteraction = elapsed; return;
      }
    }
    hoverX = event.clientX; hoverY = event.clientY;
    if (pointerId === undefined) {
      const previous = hovered;
      hovered = hitAt(event.clientX, event.clientY);
      if (hovered && settings.tool === 'hand') {
        const pet = hovered;
        pet.nextWander = elapsed + 2; lastInteraction = elapsed;
        const hit = raycaster.intersectObject(pet.body, false)[0];
        if (hit) {
          localTarget.copy(hit.point); pet.body.worldToLocal(localTarget);
          const delta = scratch.copy(localTarget).sub(hoverPoint), distance = previous === pet ? Math.min(delta.length(), .35) : 0;
          delta.clampLength(0, .15);
          const normal = hit.face?.normal ?? THREE.Object3D.DEFAULT_UP;
          if (previous !== pet || distance > .005) pet.jelly.touch(localTarget.x, localTarget.y, localTarget.z,
            normal.x, normal.y, normal.z, previous === pet ? delta.x : 0, previous === pet ? delta.y : 0, previous === pet ? delta.z : 0, previous !== pet ? .65 : distance * 1.8);
          pet.stroke = Math.min(2, pet.stroke + distance * .9);
          if (previous !== pet) { pet.squash = .055; mood(pet, 'curious', .5); }
          if (pet.stroke > .18) mood(pet, 'happy', 1.2);
          if (pet.stroke > .6 && elapsed - pet.lastHeart > 1.8) { emit(petPosition(pet), '#f49cb7', 3); pet.lastHeart = elapsed; boing(.5); }
          hoverPoint.copy(localTarget);
        }
      }
      return;
    }
    if (event.pointerId !== pointerId) return;
    const step = Math.hypot(event.clientX - previousX, event.clientY - previousY); travel += step;
    if (heldMochi) {
      previewMochi(event.clientX, event.clientY);
    } else if (held) {
      groundAt(event.clientX, event.clientY);
      raycaster.ray.intersectPlane(dragPlane, dragTarget);
      dragSamples.push({ time: performance.now() / 1000, point: dragTarget.clone() });
      if (dragSamples.length > 12) dragSamples.shift();
      const expression = holdMood(travel, elapsed - downAt, held.lift);
      if (expression === 'dizzy' && held.mood !== 'dizzy') tell('Your slime feels dizzy.');
      mood(held, expression, expression === 'dizzy' ? DIZZY_RECOVERY_SECONDS : 30);
    } else if (settings.tool === 'sword' && travel > 12) {
      previewCut(event.clientX, event.clientY);
    }
    previousX = event.clientX; previousY = event.clientY;
  }
  function release(event?: PointerEvent, cancelled = false) {
    if (event?.pointerType === 'touch') { touches.delete(event.pointerId); if (touches.size < 2) pinchDistance = 0; }
    if (pointerId === undefined || (event && event.pointerId !== pointerId)) return;
    if (heldMochi) {
      if (event && !cancelled) previewMochi(event.clientX, event.clientY);
      if (cancelled || mochiAim.lengthSq() === 0) hideMochi(heldMochi);
      else {
        heldMochi.velocity.copy(mochiAim); boing(.4); tell('Mochi time!');
        reloadAt = elapsed + .35;
      }
      heldMochi = undefined; aim.visible = false;
      updateSlingshot();
    } else if (held) {
      const pet = held;
      pet.jelly.active = false; held = undefined;
      const shortTap = !cancelled && travel < 9 && elapsed - downAt < .5;
      const doubleTap = shortTap && elapsed - pet.lastTap < .34;
      pet.lastTap = shortTap && !doubleTap ? elapsed : -10;
      const recent = dragSamples.at(-1), now = performance.now() / 1000;
      const first = dragSamples.find(sample => recent && sample.time >= recent.time - .09) ?? dragSamples[0];
      if (!cancelled && travel > 9 && recent && first && recent.time - first.time > .008 && now - recent.time < .12) {
        scratch.copy(recent.point).sub(first.point).divideScalar(recent.time - first.time).clampLength(0, 9);
        pet.velocity.lerp(scratch, .85);
      }
      pet.velocity.clampLength(0, 9);
      if (pet.lift < .08) pet.velocity.y = Math.min(0, pet.velocity.y);
      if (cancelled) pet.velocity.set(0, 0, 0);
      if (pet.dizzyUntil > elapsed) { mood(pet, 'dizzy', DIZZY_RECOVERY_SECONDS); pet.nextWander = pet.dizzyUntil + 1; }
      else if (doubleTap) jump(pet, true);
      else if (shortTap) affection(pet);
      else {
        mood(pet, cancelled ? 'idle' : pet.lift > .08 ? 'surprised' : travel < 9 ? 'relaxed' : pet.velocity.lengthSq() > 6 ? 'excited' : 'happy', 1.8);
        pet.nextWander = elapsed + 2.5; if (!cancelled) boing();
      }
      pet.target.copy(pet.root.position); pet.target.y = .28; held = undefined;
    } else if (!cancelled && settings.tool === 'sword' && travel > 12) {
      slashAcross(downX, downY, event?.clientX ?? previousX, event?.clientY ?? previousY);
    } else if (!cancelled && travel < 9 && event) {
      const pet = hitAt(event.clientX, event.clientY);
      if (settings.tool === 'sword' && pet) {
        const hit = raycaster.intersectObject(pet.body, false)[0];
        if (hit) split(pet, new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), hit.point));
        slash.position.copy(petPosition(pet)); slash.quaternion.copy(camera.quaternion); slashLife = .3;
      }
      else if (groundAt(event.clientX, event.clientY)) goTo(ground.x, ground.z);
    }
    blade.visible = false;
    const id = pointerId; pointerId = undefined;
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    cutThisGesture.clear(); lastInteraction = elapsed;
  }
  const cancel = (event: PointerEvent) => release(event, true);
  const wheel = (event: WheelEvent) => {
    if (settings.tool === 'mochi') return;
    if (!held && (hovered || event.ctrlKey)) {
      event.preventDefault(); pinchTarget = THREE.MathUtils.clamp(pinchTarget - event.deltaY * .003, -.38, .65);
      pinchAt = lastInteraction = elapsed; return;
    }
    if (!held) return;
    event.preventDefault();
    const amount = THREE.MathUtils.clamp(event.deltaY * .002, -.25, .25);
    dragTarget.addScaledVector(dragNormal, amount);
    dragPlane.setFromNormalAndCoplanarPoint(dragNormal, dragTarget);
  };
  const blur = () => { release(undefined, true); hovered = undefined; touches.clear(); pinchTarget = 0; };
  const leave = () => { if (pointerId === undefined) hovered = undefined; hoverX = hoverY = -1000; };
  const contextMenu = (event: MouseEvent) => {
    if (settings.tool === 'hand' && hitAt(event.clientX, event.clientY)) event.preventDefault();
  };
  function key(event: KeyboardEvent) {
    if (event.target instanceof HTMLElement && event.target.closest('button, input, [role="dialog"]')) return;
    const pet = pets[0];
    if (!pet) return;
    const offset: Record<string, [number, number]> = { ArrowLeft: [-1.3, 0], ArrowRight: [1.3, 0], ArrowUp: [0, -1.3], ArrowDown: [0, 1.3] };
    if (offset[event.key]) { event.preventDefault(); const [x, z] = offset[event.key]; goTo(pet.target.x + x, pet.target.z + z); }
    if (event.code === 'Space') { event.preventDefault(); jump(pet); }
    if (event.key.toLowerCase() === 'e' && !event.repeat) { event.preventDefault(); wiggle(hovered ?? pet); }
    const tools: Record<string, PetSettings['tool']> = { s: 'sword', h: 'hand', m: 'mochi' };
    const tool = tools[event.key.toLowerCase()];
    if (tool && settings.tool !== tool) { blur(); settings.tool = tool; callbacks.onTool(tool); }
    if (event.key.toLowerCase() === 'r') reset();
    if (event.key === 'Enter' && settings.tool === 'sword') { cutThisGesture.clear(); split(pet); cutThisGesture.clear(); }
    else if (event.key === 'Enter' && settings.tool === 'mochi') {
      event.preventDefault();
      if (!event.repeat && !heldMochi && elapsed >= reloadAt) {
        slingOrigin.copy(sling.rest).add(sling.root.position);
        const snack = spawnMochi(slingOrigin), vy = 3.8;
        const time = (vy + Math.sqrt(vy * vy + 18 * (slingOrigin.y - MOCHI_FLOOR))) / 9;
        const travel = (1 - Math.exp(-.25 * time)) / .25;
        const target = pets.reduce((smallest, candidate) => candidate.size < smallest.size ? candidate : smallest);
        snack.velocity.set((target.root.position.x - slingOrigin.x) / travel, vy, (target.root.position.z - slingOrigin.z) / travel);
        reloadAt = elapsed + .35; boing(.4); updateSlingshot();
      }
    } else if (event.key === 'Enter') { event.preventDefault(); affection(pet); }
    if (event.key === 'Escape') blur();
    lastInteraction = elapsed;
  }
  function configure(next: PetSettings) {
    if (settings.tool !== next.tool) blur();
    settings = { ...next };
    updateSlingshot();
    lastInteraction = elapsed;
    uniforms.petMode.value = next.palette === 'galaxy' ? 1 : next.palette === 'rainbow' ? 2 : 0;
    const colors = { blue: ['#79b5d8', '#b6def0'], galaxy: ['#664499', '#bba0f1'], rainbow: ['#c7b4f1', '#ffffff'], custom: [next.color, next.secondColor] }[next.palette];
    uniforms.petColor.value.set(colors[0]); uniforms.petSecond.value.set(colors[1]);
    bodyMaterial.attenuationColor.copy(uniforms.petColor.value);
    bodyMaterial.transmission = next.palette === 'galaxy' ? .1 : .18;
    reflectionMaterial.color.copy(uniforms.petColor.value);
    uniforms.petGradient.value = next.palette === 'custom' ? Number(next.gradient) : 1;
    const color = uniforms.petColor.value.clone();
    if (next.gradient) color.lerp(uniforms.petSecond.value, .5);
    lightEyes = next.palette === 'galaxy' || (next.palette === 'custom' && color.r * .2126 + color.g * .7152 + color.b * .0722 < .22);
  }
  function removePet(pet: Pet) {
    if (hovered === pet) hovered = undefined;
    scene.remove(pet.root, pet.shadow, pet.reflection);
    pet.shadow.material.dispose(); pet.body.geometry.dispose(); pet.face.geometry.dispose();
    for (const tear of pet.tears) tear.material.dispose();
    for (const snack of snacks) if (snack.eater === pet) hideMochi(snack);
    pets.splice(pets.indexOf(pet), 1);
  }
  function updateMerge(dt: number) {
    const idle = elapsed - lastInteraction >= IDLE_MERGE_SECONDS && !held && pointerId === undefined && !touches.size;
    if (!idle || pets.length < 2) {
      if (mergePair) for (const pet of [mergePair.a, mergePair.b]) {
        pet.target.set(pet.root.position.x, .28, pet.root.position.z); pet.nextWander = elapsed + 3;
      }
      mergePair = undefined; return;
    }
    if (!mergePair) {
      let nearest = Infinity;
      for (let i = 0; i < pets.length; i++) for (let j = i + 1; j < pets.length; j++) {
        const a = pets[i], b = pets[j];
        if ([a, b].some(pet => pet.dizzyUntil > elapsed || pet.lift > .025 || pet.velocity.lengthSq() > .04)) continue;
        const distance = a.root.position.distanceToSquared(b.root.position);
        if (distance < nearest) {
          nearest = distance;
          const [parent, child] = a.size >= b.size ? [a, b] : [b, a];
          mergePair = { a: parent, b: child, volumeA: parent.size ** 3, volumeB: child.size ** 3, progress: -1 };
        }
      }
    }
    if (!mergePair) return;
    const pair = mergePair, { a, b } = pair;
    if (pair.progress < 0) {
      const center = a.root.position.clone().multiplyScalar(pair.volumeA).addScaledVector(b.root.position, pair.volumeB).divideScalar(pair.volumeA + pair.volumeB);
      a.target.set(center.x, .28, center.z); b.target.copy(a.target);
      for (const pet of [a, b]) { pet.gait = 'walk'; pet.nextWander = elapsed + 3; }
      if (a.root.position.distanceTo(b.root.position) > (a.size + b.size) * .9) return;
      pair.progress = 0; a.velocity.set(0, 0, 0); b.velocity.set(0, 0, 0);
    }
    pair.progress = Math.min(1, pair.progress + dt / .9);
    const t = pair.progress * pair.progress * (3 - 2 * pair.progress);
    a.size = Math.min(MAX_PET_SIZE, Math.cbrt(pair.volumeA + pair.volumeB * t)); b.size = Math.cbrt(pair.volumeB * (1 - t));
    b.root.position.lerp(a.root.position, 1 - Math.exp(-dt * 6));
    for (const pet of [a, b]) { pet.growthTarget = pet.size; pet.target.set(pet.root.position.x, .28, pet.root.position.z); mood(pet, 'happy', 1); }
    if (pair.progress === 1) {
      a.size = a.growthTarget = Math.min(MAX_PET_SIZE, mergedSize(Math.cbrt(pair.volumeA), Math.cbrt(pair.volumeB))); a.squash = .14;
      removePet(b); mergePair = undefined; callbacks.onCount(pets.length);
    }
  }
  function reset() {
    blur(); hovered = undefined; mergePair = undefined; markerLife = slashLife = 0;
    for (const pet of [...pets]) removePet(pet);
    for (const particle of particles) { particle.life = 0; particle.mesh.visible = false; }
    for (const snack of snacks) hideMochi(snack);
    reloadAt = 0; slingPull.set(0, 0, 0); updateSlingshot();
    makePet(0, .45, MAX_PET_SIZE); callbacks.onCount(1); tell('Your slime is ready.'); lastInteraction = elapsed;
  }
  function resize() {
    if (heldMochi) blur();
    const width = canvas.clientWidth, height = canvas.clientHeight;
    const aspect = width / Math.max(height, 1), viewHeight = Math.max(9.7, 6.6 / aspect);
    camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2;
    camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2; camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    sling.root.position.set(0, .285, 3.2);
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('lostpointercapture', cancel); canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('wheel', wheel, { passive: false });
  canvas.addEventListener('contextmenu', contextMenu);
  window.addEventListener('blur', blur); window.addEventListener('keydown', key);

  let sampleTime = 0, sampleFrames = 0, qualityAdjusted = false, firstRender = true;
  function tick(now: number) {
    if (disposed || document.hidden) return;
    frame = requestAnimationFrame(tick);
    // A first/resumed RAF timestamp can precede initialization's performance.now().
    const rawDelta = Math.max(0, (now - last) / 1000), dt = Math.min(rawDelta, .045); last = now; elapsed += dt;
    if (dt === 0) return;
    uniforms.petTime.value = reduced ? 0 : elapsed;
    dizzyRotation.value = reduced ? 0 : elapsed * 2.1;
    if (elapsed - pinchAt > .18 && touches.size < 2) pinchTarget = 0;
    pinchValue = THREE.MathUtils.damp(pinchValue, pinchTarget, 12, dt);
    canvas.dataset.hover = String(!!hovered && settings.tool === 'hand');
    if (messageUntil && elapsed > messageUntil) { callbacks.onMessage(''); messageUntil = 0; }
    if (!qualityAdjusted && elapsed > 3 && rawDelta < .3) {
      sampleTime += rawDelta; sampleFrames++;
      if (sampleTime > 3) { if (sampleTime / sampleFrames > .025) renderer.setPixelRatio(1); qualityAdjusted = true; }
    }
    // Hover is refreshed at 10 Hz so a roaming pet can notice a stationary cursor.
    if (!held && pointerId === undefined && Math.floor(elapsed * 10) !== Math.floor((elapsed - dt) * 10)) hovered = hitAt(hoverX, hoverY);
    updateSlingshot(dt); updateMochi(dt); updateMerge(dt);
    for (const pet of pets) {
      screenPoint.copy(pet.root.position); screenPoint.y += pet.size * bodyCenter; screenPoint.project(camera);
      const pixelsPerUnit = canvas.clientWidth / (camera.right - camera.left);
      const screenX = (screenPoint.x + 1) * canvas.clientWidth / 2, screenY = (1 - screenPoint.y) * canvas.clientHeight / 2;
      const bladeNear = settings.tool === 'sword' && Math.hypot((hoverX - screenX) / ((pet.size * 1.35 + .18) * pixelsPerUnit),
        (hoverY - screenY) / ((pet.size * .98 + .18) * pixelsPerUnit)) < 1.12;
      pet.fear = THREE.MathUtils.damp(pet.fear, bladeNear ? 1 : 0, bladeNear ? 12 : 5, dt);
      if (bladeNear) lastInteraction = elapsed;
      if (pet.fear > .15) { mood(pet, 'scared', .45); pet.nextWander = elapsed + 2; }
      pet.stroke = Math.max(0, pet.stroke - dt * .35);
      if (pet.dizzyUntil > elapsed) pet.mood = 'dizzy';
      else if (pet.mood === 'dizzy' || (pet !== held && pet.moodUntil < elapsed)) pet.mood = pet === held ? 'held' : 'idle';
      if (pet === held) {
        const expression = holdMood(travel, elapsed - downAt, pet.lift);
        mood(pet, expression, expression === 'dizzy' ? DIZZY_RECOVERY_SECONDS : 1);
      }
      const dizzy = pet.dizzyUntil > elapsed, joining = pet === mergePair?.a || pet === mergePair?.b;
      if (!joining && pet !== held && pet.size < pet.growthTarget) {
        pet.size = THREE.MathUtils.damp(pet.size, pet.growthTarget, 3.5, dt);
        if (pet.growthTarget - pet.size < .0001) pet.size = pet.growthTarget;
      }
      const canEat = !joining && pet !== held && !dizzy && pet.fear < .15 && pet.chewUntil < elapsed && pet.spin === 0 && Math.hypot(pet.velocity.x, pet.velocity.z) < .2;
      const previousSnack = pet.pursuit;
      if (!canEat || !pet.pursuit || pet.pursuit.life <= 0 || pet.pursuit === heldMochi || pet.pursuit.eater) pet.pursuit = undefined;
      if (canEat && !pet.pursuit) {
        let nearest = Infinity;
        for (const snack of snacks) {
          if (snack.life <= 0 || snack === heldMochi || snack.eater) continue;
          if (!snack.inGarden && snack.mesh.position.y <= MOCHI_FLOOR + .001 && snack.velocity.y <= 0) continue;
          const distance = Math.hypot(snack.mesh.position.x - pet.root.position.x, snack.mesh.position.z - pet.root.position.z);
          if (distance < nearest) { pet.pursuit = snack; nearest = distance; }
        }
      }
      if (pet.pursuit && pet.pursuit !== previousSnack) { pet.gait = randomGait(); pet.departAt = elapsed; mood(pet, 'excited', .8); }
      if (!joining && !pet.pursuit && pet !== held && !dizzy && pet.fear < .15 && pet !== hovered && elapsed > pet.nextWander) {
        const angle = Math.random() * Math.PI * 2, radius = 1.4 + Math.random() * 2.2;
        const point = roomBounds(Math.cos(angle) * radius, Math.sin(angle) * radius * .7);
        pet.target.set(point.x, .28, point.z); pet.gait = randomGait(); pet.departAt = elapsed + Math.random() * .22;
        pet.nextWander = elapsed + 5 + Math.random() * 5;
      }
      if (!joining && pet !== held && (pet.velocity.lengthSq() > .02 || pet.lift > .01)) {
        pet.target.set(pet.root.position.x, .28, pet.root.position.z);
        pet.nextWander = Math.max(pet.nextWander, elapsed + .5);
      }
      if (pet.pursuit) {
        const snack = pet.pursuit;
        const point = roomBounds(snack.mesh.position.x + snack.velocity.x * .15, snack.mesh.position.z + snack.velocity.z * .15);
        pet.target.set(point.x, .28, point.z); pet.nextWander = elapsed + 3; lastInteraction = elapsed;
      }
      const retreating = bladeNear && pet.fear > .15 && pointerId === undefined && pet !== held && !joining && !dizzy && pet.lift < .02;
      if (retreating) {
        // Undo the camera's ground foreshortening so every retreat points away from the blade.
        const awayX = screenX - hoverX, awayZ = (screenY - hoverY) / Math.max(.1, -camera.matrixWorld.elements[6]);
        const length = Math.hypot(awayX, awayZ);
        const point = roomBounds(pet.root.position.x + (length > 1 ? awayX / length : 0) * .65,
          pet.root.position.z + (length > 1 ? awayZ / length : -1) * .65);
        pet.target.set(point.x, .28, point.z);
      } else if (pet.fear > .15 && pet !== held && !joining) {
        pet.target.set(pet.root.position.x, .28, pet.root.position.z);
      }
      const dx = pet.target.x - pet.root.position.x, dz = pet.target.z - pet.root.position.z;
      const distance = Math.hypot(dx, dz);
      pet.moving = pet !== held && !dizzy && distance > .06 && (retreating || (pet.fear < .35 && elapsed >= pet.departAt && (pet !== hovered || joining || (!!pet.pursuit && settings.tool !== 'hand'))));
      const oldVX = pet.velocity.x, oldVY = pet.velocity.y, oldVZ = pet.velocity.z;
      const rolling = pet.gait === 'roll' && pet.moving && !retreating && !reduced;
      pet.roundness = THREE.MathUtils.damp(pet.roundness, rolling ? 1 : 0, 10, dt);
      if (!rolling && pet.roundness < .0001) pet.roundness = 0;
      pet.jelly.reshape(pet.roundness);
      let moveX = 0, moveZ = 0, stepDistance = 0;
      let hop = 0;
      if (pet === held) {
        const point = roomBounds(dragTarget.x - grabOffset.x, dragTarget.z - grabOffset.z);
        const lift = travel > 5 ? Math.max(0, dragTarget.y - grabOffset.y - .28) : pet.lift;
        // The hand supports the skin while the center of mass hangs slightly below it.
        const support = .48 * THREE.MathUtils.smoothstep(lift, .08, .9);
        const liftTarget = THREE.MathUtils.clamp(lift - support, 0, 2.5);
        [pet.root.position.x, pet.velocity.x] = followSpring(pet.root.position.x, pet.velocity.x, point.x, dt);
        [pet.root.position.z, pet.velocity.z] = followSpring(pet.root.position.z, pet.velocity.z, point.z, dt);
        [pet.lift, pet.velocity.y] = followSpring(pet.lift, pet.velocity.y, liftTarget, dt);
      } else {
        pet.velocity.x *= Math.exp(-dt * 3.5); pet.velocity.z *= Math.exp(-dt * 3.5);
        const point = roomBounds(pet.root.position.x + pet.velocity.x * dt, pet.root.position.z + pet.velocity.z * dt);
        pet.root.position.x = point.x; pet.root.position.z = point.z;
        if (pet.lift > 0 || pet.velocity.y > .01) {
          pet.velocity.y -= 12 * dt; pet.lift += pet.velocity.y * dt;
          if (pet.lift < 0) {
            const impact = -pet.velocity.y;
            pet.squash = Math.min(.24, impact * .035); pet.lift = 0; pet.velocity.y = impact > 2.8 ? impact * .25 : 0;
            if (impact > 3) mood(pet, 'surprised', .65);
          }
        }
        if (pet.moving) {
          const speed = (retreating ? .35 * pet.fear : pet.gait === 'roll' ? 2.55 : pet.gait === 'hop' ? 1.85 : 1.15) * Math.sqrt(pet.size) * pet.speed;
          const step = Math.min(distance, speed * dt);
          stepDistance = step; moveX = dx / distance * step / dt; moveZ = dz / distance * step / dt;
          pet.root.position.x += dx / distance * step; pet.root.position.z += dz / distance * step;
          pet.phase += dt * (retreating ? 6 : pet.gait === 'walk' ? 12 : 8) * pet.tempo;
          if (!reduced && !rolling && !retreating) hop = Math.abs(Math.sin(pet.phase)) * (pet.gait === 'hop' ? .6 : .055) * pet.size;
        }
      }
      pet.root.position.y = .28 + pet.lift + hop;
      const breathe = reduced ? 0 : Math.sin(elapsed * 2.2 + pet.phase) * .025;
      const playful = reduced || pet === held ? 0 : Math.max(0, Math.min(1, pet.wiggleUntil - elapsed)) * Math.sin(elapsed * 13);
      const chewing = !reduced && pet !== held && pet.chewUntil > elapsed ? Math.sin(elapsed * 18) * .035 : 0;
      const wobble = (reduced || pet === held ? 0 : pet.moving ? Math.sin(pet.phase * 2) * (retreating ? .02 : rolling ? .035 : pet.gait === 'hop' ? .1 : .065) : breathe) + playful * .075 + chewing;
      pet.squash = THREE.MathUtils.damp(pet.squash, 0, 5, dt);
      pet.fullness = THREE.MathUtils.damp(pet.fullness, 0, .6, dt);
      const fedSize = Math.min(MAX_PET_SIZE, pet.size * (1 + pet.fullness * .03));
      const pinch = pet === (hovered ?? pets[0]) ? pinchValue : 0, lateral = 1 / Math.sqrt(1 + pinch);
      pet.root.scale.set(fedSize * (1 + wobble + pet.squash) * lateral, fedSize * (1 - wobble * 1.2 - pet.squash) * (1 + pinch), fedSize * (1 + wobble * .5 + pet.squash * .4) * lateral);
      screenPoint.copy(pet.root.position); screenPoint.y += pet.size * bodyCenter; screenPoint.project(camera);
      const watching = (hovered === pet || pet.fear > .15) && pet !== held;
      if (pet.pursuit) snackPoint.copy(pet.pursuit.mesh.position).project(camera);
      const lookX = pet.pursuit ? THREE.MathUtils.clamp((snackPoint.x - screenPoint.x) * .65, -.075, .075) : watching ? THREE.MathUtils.clamp((hoverX / canvas.clientWidth * 2 - 1 - screenPoint.x) * .65, -.075, .075) : 0;
      const lookY = pet.pursuit ? THREE.MathUtils.clamp((snackPoint.y - screenPoint.y) * .65, -.045, .045) : watching ? THREE.MathUtils.clamp((1 - hoverY / canvas.clientHeight * 2 - screenPoint.y) * .65, -.045, .045) : 0;
      pet.look.x = THREE.MathUtils.damp(pet.look.x, lookX, 12, dt); pet.look.y = THREE.MathUtils.damp(pet.look.y, lookY, 12, dt);
      let tilt = pet.moving && !reduced ? -Math.sin(pet.phase) * (retreating ? .025 : .08) : 0;
      if (dizzy && !reduced) tilt = Math.sin(elapsed * 7) * .15;
      if (!reduced) tilt += playful * .12 + Math.sin(elapsed * 32) * pet.fear * .04;
      if (pet === held) tilt = 0;
      if (rolling) {
        rollAxis.set(dz, 0, -dx).normalize();
        const angle = stepDistance / (ballRadius * pet.size);
        pet.roll += angle;
        pet.visual.quaternion.premultiply(rollRotation.setFromAxisAngle(rollAxis, angle)).normalize();
      } else if (pet.spin > 0 && !reduced && pet !== held) {
        const angle = Math.min(pet.spin, dt * 10); pet.spin -= angle;
        pet.visual.quaternion.premultiply(rollRotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, angle)).normalize();
      } else if (pet !== held) {
        upright.setFromAxisAngle(rollAxis.set(0, 0, 1), tilt);
        pet.visual.quaternion.slerp(upright, 1 - Math.exp(-dt * 7));
      }
      // Support the actual rounded blob; an ellipsoid approximation clips its wider underside.
      scratch.set(0, 1, 0).applyQuaternion(inverseVisual.copy(pet.visual.quaternion).invert());
      const bottom = bodyCenter + pet.jelly.minProjection(scratch.x, scratch.y, scratch.z) - bodyCenter * scratch.y;
      pet.root.position.y = -floorWorld.constant + pet.lift + hop - bottom * pet.root.scale.y;
      pet.root.updateMatrixWorld(true);
      // Free fall moves the whole body; only grab, friction and impact acceleration deform its skin.
      scratch.set(pet.velocity.x - oldVX + moveX - pet.motion.x,
        pet.velocity.y - oldVY + (pet !== held && pet.lift > 0 ? 12 * dt : 0), pet.velocity.z - oldVZ + moveZ - pet.motion.z);
      pet.motion.set(moveX, 0, moveZ);
      scratch.applyQuaternion(inverseVisual.copy(pet.visual.quaternion).invert()).divideScalar(pet.size);
      pet.jelly.inertia(scratch.x, scratch.y, scratch.z);
      let pullX = 0, pullY = 0, pullZ = 0;
      if (pet === held) {
        localTarget.copy(dragTarget); pet.body.worldToLocal(localTarget);
        pullX = localTarget.x - pet.jelly.anchor[0]; pullY = localTarget.y - pet.jelly.anchor[1]; pullZ = localTarget.z - pet.jelly.anchor[2];
      }
      const suspension = pet === held ? THREE.MathUtils.smoothstep(pet.lift + Math.max(0, pullY) * pet.size, .08, .85) : 0;
      floorLocal.copy(floorWorld).applyMatrix4(inverseBody.copy(pet.body.matrixWorld).invert());
      if (pet.jelly.step(dt, pullX, pullY, pullZ, pet === held ? .16 * Math.exp(-travel / 35) : 0,
        -floorLocal.constant, suspension, floorLocal.normal.x, floorLocal.normal.y, floorLocal.normal.z)) {
        pet.body.geometry.attributes.position.needsUpdate = true;
        pet.body.geometry.computeVertexNormals(); pet.body.geometry.computeBoundingSphere();
      }
      updateEyes(pet);
      if (pet.pursuit && Math.hypot(pet.pursuit.mesh.position.x - pet.root.position.x, pet.pursuit.mesh.position.z - pet.root.position.z) < pet.size * .65 + .18) {
        const snack = pet.pursuit, airborne = snack.mesh.position.y > MOCHI_FLOOR + .4;
        if (airborne && pet.lift < .015 && !reduced) { pet.velocity.y = 3.8; pet.lift = .02; }
        if ((!airborne || pet.lift > .08 || reduced) && Math.abs(snack.mesh.position.y - (pet.root.position.y + pet.size * .8)) < pet.size * .8 + .3) {
          snack.eater = pet; pet.pursuit = undefined; pet.meals++; pet.fullness = 1; pet.chewUntil = elapsed + 1.5;
          pet.growthTarget = sizeAfterMochi(pet.growthTarget);
          pet.target.set(pet.root.position.x, .28, pet.root.position.z); pet.nextWander = elapsed + 3;
          mood(pet, 'happy', 2); emit(petPosition(pet), '#f6b9cc', 4); boing(.7);
        }
      }
      let expression: string = pet.mood;
      if (pet.chewUntil > elapsed && pet !== held && !dizzy) expression = reduced || Math.sin(elapsed * 12) > 0 ? 'happy' : 'relaxed';
      if (expression === 'held' && pet.jelly.energy > .001) expression = 'squeeze';
      if (Math.abs(pinch) > .06) expression = pinch > 0 ? 'surprised' : 'squeeze';
      if (pet.mood === 'idle' && pet === hovered) expression = 'curious';
      if (expression === 'idle' && elapsed - lastInteraction > 20 && !pet.moving) expression = 'sleepy';
      if ((expression === 'idle' || expression === 'curious') && Math.sin(elapsed * 1.8 + pet.phase) > .991) expression = 'blink';
      if (pet.fear > .15) expression = 'scared';
      const faceKey = `${expression}-${lightEyes}`;
      if (pet.faceKey !== faceKey) { pet.face.material = faceMaterials.get(faceKey)!; pet.faceKey = faceKey; }
      pet.shadow.position.set(pet.root.position.x, .29, pet.root.position.z);
      pet.shadow.scale.setScalar(pet.size * (1 + (pet.lift + hop) * .3));
      pet.shadow.material.opacity = .6 / (1 + (pet.lift + hop) * 1.6);
      pet.body.updateWorldMatrix(true, false);
      pet.body.matrixWorld.decompose(pet.reflection.position, pet.reflection.quaternion, pet.reflection.scale);
      pet.reflection.position.y = .46 - pet.reflection.position.y;
      pet.reflection.scale.y *= -1;
      pet.reflection.quaternion.x *= -1; pet.reflection.quaternion.z *= -1;
    }
    for (const particle of particles) {
      if (particle.life <= 0) continue;
      particle.life -= dt;
      if (particle.life <= 0) { particle.mesh.visible = false; continue; }
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      particle.mesh.rotateZ(dt * .25); particle.mesh.material.opacity = Math.sin(Math.PI * particle.life / particle.duration);
    }
    markerLife = Math.max(0, markerLife - dt); targetMaterial.opacity = markerLife * .65; marker.scale.setScalar(1 + (1.2 - markerLife) * .55);
    slashLife = Math.max(0, slashLife - dt); slashMaterial.opacity = slashLife / .3;
    slash.scale.set(1.3 + (.3 - slashLife) * 5, .65, 1);
    renderer.render(scene, camera);
    if (firstRender) { firstRender = false; callbacks.onReady?.(); }
  }
  function visibility() {
    blur(); cancelAnimationFrame(frame);
    if (!document.hidden && !disposed) { last = performance.now(); frame = requestAnimationFrame(tick); }
  }
  document.addEventListener('visibilitychange', visibility);
  configure(initial); makePet(0, .45, MAX_PET_SIZE); resize(); frame = requestAnimationFrame(tick);

  return { configure, reset, dispose() {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect(); blur();
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', release); canvas.removeEventListener('pointercancel', cancel);
    canvas.removeEventListener('lostpointercapture', cancel); canvas.removeEventListener('pointerleave', leave);
    canvas.removeEventListener('wheel', wheel);
    canvas.removeEventListener('contextmenu', contextMenu);
    window.removeEventListener('blur', blur); window.removeEventListener('keydown', key);
    document.removeEventListener('visibilitychange', visibility); reduceMotion.removeEventListener('change', onReduced);
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>([shadowMap]);
    scene.traverse((object) => {
      if (object instanceof THREE.InstancedMesh) object.dispose();
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      }
    });
    for (const material of faceMaterials.values()) materials.add(material);
    for (const material of mochiAsset.materials) materials.add(material);
    for (const material of materials) { if ('map' in material && material.map instanceof THREE.Texture) textures.add(material.map); material.dispose(); }
    geometries.add(bodyGeometry); geometries.add(faceGeometry); geometries.add(particleGeometry); geometries.add(shadowGeometry); geometries.add(tearGeometry); textures.add(tearMap);
    for (const geometry of mochiAsset.geometries) geometries.add(geometry);
    geometries.forEach((geometry) => geometry.dispose()); textures.forEach((texture) => texture.dispose());
    environmentMap.dispose(); void audio?.close();
    renderer.dispose();
  } };
}
