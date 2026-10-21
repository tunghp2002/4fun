import * as THREE from "three";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import { clipPolygon, contains, project, type Point } from "../geo/coordinates";
import type { MapData, SceneSettings, SceneStats, TerrainData } from "../types";
import { isLinearFeature } from "../types";
import {
  createFacadeDetails,
  estimateFacade,
  type FacadeBuilding,
} from "./facades";
import { createStreetDetails } from "./streets";
import { createTrees } from "./trees";
import { mappedTrees } from "./vegetation";
import { buildingDesign, buildingOutlinesWithParts } from "../geo/buildings";
import { createLandmarks } from "./landmarks";
import { sceneElevation, type WaterSurface } from "./elevation";
import {
  areaMask,
  clipArea,
  roadJoins,
  roadWidth,
  roadFootprint,
  pedestrianRoad,
  type MultiPolygon,
} from "./roads";
import {
  drapeGeometry,
  foundation,
  gridElevation,
  surfaceGeometry,
} from "./surfaces";
import type { SceneLandmark } from "../types";
import { PALETTES, gabledRoof, windowVertices } from "./architecture";

type ColoredGeometry = { geometry: THREE.BufferGeometry; tone: number };
export interface CityModel {
  root: THREE.Group;
  ground: THREE.Mesh;
  stats: SceneStats;
  street: ReturnType<typeof createStreetDetails>;
  landmarks: SceneLandmark[];
  waterSurfaces: WaterSurface[];
  elevation(x: number, z: number): number;
  detail(position: THREE.Vector3): boolean;
  apply(settings: SceneSettings): void;
  dispose(): void;
}
export function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) object.dispose();
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material)
      for (const m of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material])
        materials.add(m);
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  root.clear();
}
function normalized(geometry: THREE.BufferGeometry) {
  if (geometry.index) {
    const source = geometry;
    geometry = source.toNonIndexed();
    source.dispose();
  }
  geometry.deleteAttribute("uv");
  geometry.deleteAttribute("uv1");
  return geometry;
}
function colored(
  items: ColoredGeometry[],
  material: THREE.Material,
  palette: string[],
) {
  if (!items.length) return new THREE.Group();
  for (const { geometry, tone } of items) {
    const color = new THREE.Color(palette[tone % palette.length]);
    const values = new Float32Array(
      geometry.getAttribute("position").count * 3,
    );
    for (let i = 0; i < values.length; i += 3) {
      values[i] = color.r;
      values[i + 1] = color.g;
      values[i + 2] = color.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(values, 3));
  }
  const result = mergeGeometries(items.map((item) => item.geometry));
  items.forEach((item) => item.geometry.dispose());
  if (!result) throw new Error("Không ghép được mô hình.");
  const mesh = new THREE.Mesh(result, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function recolor(
  mesh: THREE.Object3D,
  items: { count: number; tone: number }[],
  colors: string[],
) {
  if (!(mesh instanceof THREE.Mesh)) return;
  const values = mesh.geometry.getAttribute("color") as THREE.BufferAttribute;
  let offset = 0;
  for (const item of items) {
    const color = new THREE.Color(colors[item.tone % colors.length]);
    for (let i = 0; i < item.count; i++)
      values.setXYZ(offset++, color.r, color.g, color.b);
  }
  values.needsUpdate = true;
}
function shape(points: Point[], holes: Point[][]) {
  const result = new THREE.Shape(
    points.map(([x, z]) => new THREE.Vector2(x, -z)),
  );
  for (const ring of holes)
    if (ring.length >= 3 && contains(points, ring[0][0], ring[0][1]))
      result.holes.push(
        new THREE.Path(ring.map(([x, z]) => new THREE.Vector2(x, -z))),
      );
  return result;
}
function area(points: Point[]) {
  return (
    Math.abs(
      points.reduce((sum, a, i) => {
        const b = points[(i + 1) % points.length];
        return sum + a[0] * b[1] - b[0] * a[1];
      }, 0),
    ) / 2
  );
}

function fadeDistantLines(root: THREE.Object3D) {
  const materials = new Set<THREE.LineBasicMaterial>();
  root.traverse((object) => {
    if (
      object instanceof THREE.LineSegments &&
      object.material instanceof THREE.LineBasicMaterial
    )
      materials.add(object.material);
  });
  for (const material of materials) {
    material.transparent = true;
    material.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "varying float vSceneDistance;\n" +
        shader.vertexShader.replace(
          "#include <project_vertex>",
          "#include <project_vertex>\nvSceneDistance = max(0.0, length(mvPosition.xyz) - abs(cameraPosition.y) * 0.7);",
        );
      shader.fragmentShader =
        "varying float vSceneDistance;\n" +
        shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          "diffuseColor.a *= mix(1.0, 0.22, smoothstep(180.0, 1000.0, vSceneDistance));\n#include <opaque_fragment>",
        );
    };
  }
}

export async function buildCity(
  data: MapData,
  terrain: TerrainData,
  seed: number,
  signal: AbortSignal,
  onProgress: (value: number) => void,
): Promise<CityModel> {
  const root = new THREE.Group();
  root.name = "Pho_Vietnam";
  root.userData = {
    attribution: "© OpenStreetMap contributors · © OpenMapTiles · OpenFreeMap",
    license: "ODbL-1.0",
    source: "https://www.openstreetmap.org/copyright",
    center: data.center,
    extentMeters: data.span,
  };
  const half = data.span / 2;
  signal.throwIfAborted();
  const elevation = sceneElevation(data, terrain);
  const step = data.span / ((terrain.size - 1) * 4);
  const height = gridElevation(elevation, step, -half);
  const waterAreas: MultiPolygon = data.features
    .filter((f) => f.kind === "water" && !isLinearFeature(f))
    .map((f) =>
      [f.points, ...f.holes].map((r) => r.map((p) => project(p, data.center))),
    );
  const occupiedAreas: MultiPolygon = [
    ...waterAreas,
    ...data.features
      .filter((f) => f.kind === "building")
      .map((f) =>
        [f.points, ...f.holes].map((r) =>
          r.map((p) => project(p, data.center)),
        ),
      ),
  ];
  const cutOccupied = areaMask(occupiedAreas);
  const street = createStreetDetails(data, terrain, seed, height);
  const landmarks = createLandmarks(data, height);
  const cutScenery = areaMask(landmarks.surfaceMasks);
  const features = data.features.flatMap(landmarks.clipBuilding);
  const outlinesWithParts = buildingOutlinesWithParts(features, data.center);
  const buildings: FacadeBuilding[] = [];
  const paneRanges: { building: number; start: number; count: number }[] = [];
  let paneCount = 0;
  const layers = {
    buildings: new THREE.Group(),
    roads: new THREE.Group(),
    trees: new THREE.Group(),
    water: new THREE.Group(),
    parks: new THREE.Group(),
  };
  for (const [name, group] of Object.entries(layers)) {
    group.name = name;
    root.add(group);
  }
  layers.roads.add(street.root);
  layers.buildings.add(landmarks.root);
  const walls: ColoredGeometry[] = [],
    roofs: ColoredGeometry[] = [],
    panes: THREE.BufferGeometry[] = [],
    roadPieces: THREE.BufferGeometry[] = [],
    pathPieces: THREE.BufferGeometry[] = [],
    markingPieces: THREE.BufferGeometry[] = [],
    waterPieces: THREE.BufferGeometry[] = [],
    bedPieces: THREE.BufferGeometry[] = [],
    parkPieces: THREE.BufferGeometry[] = [],
    edgePieces: THREE.BufferGeometry[] = [];

  const stats: SceneStats = {
    buildings: landmarks.list.length,
    estimated: 0,
    roads: 0,
    trees: 0,
  };
  const groundAreas = clipArea(
    [
      [
        [
          [-half, -half],
          [half, -half],
          [half, half],
          [-half, half],
        ],
      ],
    ],
    [...waterAreas, ...landmarks.surfaceMasks],
    "difference",
  );
  const groundPieces = groundAreas.map(([outer, ...holes]) =>
    surfaceGeometry(outer, holes, height, step, -half),
  );
  const groundGeometry = groundPieces.length
    ? mergeGeometries(groundPieces)!
    : new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute([], 3),
      );
  groundPieces.forEach((g) => g.dispose());
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: PALETTES.paper.ground,
    roughness: 1,
  });
  const compactGround = mergeVertices(groundGeometry);
  groundGeometry.dispose();
  const ground = new THREE.Mesh(compactGround, groundMaterial);
  ground.name = "Địa hình";
  ground.receiveShadow = true;
  root.add(ground);
  const floorHeight = -Math.max(12, data.span * 0.018);
  const skirt: number[] = [];
  for (let side = 0; side < 4; side++)
    for (let i = 0; i < terrain.size - 1; i++) {
      const t = (i / (terrain.size - 1)) * data.span - half,
        n = ((i + 1) / (terrain.size - 1)) * data.span - half;
      const a: Point =
        side === 0
          ? [t, -half]
          : side === 1
            ? [half, t]
            : side === 2
              ? [-t, half]
              : [-half, -t];
      const b: Point =
        side === 0
          ? [n, -half]
          : side === 1
            ? [half, n]
            : side === 2
              ? [-n, half]
              : [-half, -n];
      const topA = [a[0], height(...a), a[1]],
        topB = [b[0], height(...b), b[1]],
        lowA = [a[0], floorHeight, a[1]],
        lowB = [b[0], floorHeight, b[1]];
      skirt.push(...topA, ...topB, ...lowA, ...topB, ...lowB, ...lowA);
    }
  const skirtGeometry = new THREE.BufferGeometry();
  skirtGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(skirt, 3),
  );
  skirtGeometry.computeVertexNormals();
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: PALETTES.paper.base,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const base = new THREE.Mesh(skirtGeometry, baseMaterial);
  root.add(base);
  const material = (color?: string, vertexColors = false) =>
    new THREE.MeshStandardMaterial({
      color: color ?? "#ffffff",
      vertexColors,
      roughness: 0.94,
      side: THREE.DoubleSide,
    });
  const wallMaterial = material(undefined, true),
    roofMaterial = material(undefined, true),
    roadMaterial = material(PALETTES.paper.road),
    waterMaterial = material(PALETTES.paper.water),
    parkMaterial = material(PALETTES.paper.green),
    windowMaterial = material(PALETTES.paper.window);
  const markingMaterial = new THREE.MeshBasicMaterial({ color: "#fcfaf1" });
  windowMaterial.polygonOffset = true;
  windowMaterial.polygonOffsetFactor = -1;
  windowMaterial.polygonOffsetUnits = -1;
  windowMaterial.name = "facade-windows";
  for (const face of [wallMaterial, roofMaterial]) {
    face.polygonOffset = true;
    face.polygonOffsetFactor = 1;
    face.polygonOffsetUnits = 1;
  }
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: PALETTES.paper.edge,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  let disposed = false;
  const looseMaterials: THREE.Material[] = [
    wallMaterial,
    roofMaterial,
    roadMaterial,
    waterMaterial,
    parkMaterial,
    windowMaterial,
    edgeMaterial,
    markingMaterial,
  ];
  function surface(
    points: Point[],
    holes: Point[][],
    offset: number,
    level?: number,
  ) {
    return surfaceGeometry(
      points,
      holes,
      (x, z) => (level ?? height(x, z)) + offset,
      step,
      -half,
    );
  }

  function strip(
    points: Point[],
    width: number,
    offset: number,
    rounded = false,
  ) {
    const vertices: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i],
        b = points[i + 1],
        dx = b[0] - a[0],
        dz = b[1] - a[1];
      const length = Math.hypot(dx, dz);
      if (length < 0.05) continue;
      let lo = 0,
        hi = 1;
      for (const [p, q] of [
        [-dx, a[0] + half],
        [dx, half - a[0]],
        [-dz, a[1] + half],
        [dz, half - a[1]],
      ]) {
        if (p === 0) {
          if (q < 0) hi = -1;
        } else if (p < 0) lo = Math.max(lo, q / p);
        else hi = Math.min(hi, q / p);
      }
      if (lo >= hi) continue;
      const segments = Math.ceil((length * (hi - lo)) / 6),
        across = Math.max(1, Math.ceil(width / 6));
      const point = (t: number, side: number) => {
        const x = THREE.MathUtils.clamp(
          a[0] + dx * t - (dz / length) * side,
          -half,
          half,
        );
        const z = THREE.MathUtils.clamp(
          a[1] + dz * t + (dx / length) * side,
          -half,
          half,
        );
        return [x, height(x, z) + offset, z];
      };
      for (let along = 0; along < segments; along++)
        for (let column = 0; column < across; column++) {
          const start = lo + ((hi - lo) * along) / segments,
            end = lo + ((hi - lo) * (along + 1)) / segments;
          const left = -width / 2 + (width * column) / across,
            right = -width / 2 + (width * (column + 1)) / across;
          const v = [
            point(start, left),
            point(start, right),
            point(end, left),
            point(end, right),
          ];
          for (const index of [0, 1, 2, 1, 3, 2]) vertices.push(...v[index]);
        }
    }
    if (rounded)
      for (const cap of roadJoins(points, width)) {
        const ring = clipPolygon(cap, half);
        for (let i = 2; i < ring.length; i++)
          for (const [x, z] of [ring[0], ring[i], ring[i - 1]])
            vertices.push(x, height(x, z) + offset, z);
      }
    if (!vertices.length) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    const draped = drapeGeometry(
      geometry,
      (x, z) => height(x, z) + offset,
      step,
      -half,
    );
    geometry.dispose();
    return draped;
  }
  try {
    for (let index = 0; index < features.length; index++) {
      if (index % 120 === 0) {
        signal.throwIfAborted();
        onProgress(index / features.length);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      const feature = features[index],
        projected = feature.points.map((p) => project(p, data.center));
      if (outlinesWithParts.has(feature) || landmarks.replaces(feature))
        continue;
      if (!projected.length) continue;
      if (feature.kind === "tree") continue;
      if (isLinearFeature(feature)) {
        const water = feature.kind === "water",
          type = feature.tags.highway;
        const width = water
          ? Number.parseFloat(feature.tags.width) || 16
          : roadWidth(feature.tags);
        if (water && landmarks.surfaceMasks.length) {
          for (const [outer, ...holes] of roadFootprint([
            { points: projected, width: Math.min(120, width) },
          ]))
            for (const [part, ...voids] of cutScenery(outer, holes))
              waterPieces.push(surface(part, voids, 0.5));
          continue;
        }
        const geo = strip(
          projected,
          Math.min(water ? 120 : 28, width),
          water ? 0.5 : pedestrianRoad.test(type) ? 0.26 : 0.3,
          !water,
        );
        if (geo) {
          (water
            ? waterPieces
            : pedestrianRoad.test(type)
              ? pathPieces
              : roadPieces
          ).push(geo);
          if (!water) stats.roads++;
        }
        if (
          !water &&
          width >= 7 &&
          !["footway", "path", "pedestrian", "steps", "cycleway"].includes(type)
        ) {
          const markings: Point[][] = [];
          let travelled = 0;
          for (let i = 1; i < projected.length; i++) {
            const a = projected[i - 1],
              b = projected[i],
              dx = b[0] - a[0],
              dz = b[1] - a[1],
              length = Math.hypot(dx, dz);
            if (length < 0.1) continue;
            for (let d = (8 - (travelled % 8)) % 8; d + 3 <= length; d += 8) {
              const x = a[0] + (dx * d) / length,
                z = a[1] + (dz * d) / length;
              if (
                Math.hypot(x, z) > Math.min(280, half) ||
                Math.abs(x) > half ||
                Math.abs(z) > half
              )
                continue;
              markings.push([
                [x, z],
                [x + (dx * 3) / length, z + (dz * 3) / length],
              ]);
            }
            travelled += length;
          }
          for (const line of markings) {
            const mark = strip(line, 0.22, 0.34);
            if (mark) markingPieces.push(mark);
          }
        }
        continue;
      }
      const clipped = clipPolygon(projected, half);
      if (clipped.length < 3 || area(clipped) < 2) continue;
      const points = feature.kind === "building" ? projected : clipped,
        holes = feature.holes.map((r) =>
          feature.kind === "building"
            ? r.map((p) => project(p, data.center))
            : clipPolygon(
                r.map((p) => project(p, data.center)),
                half,
              ),
        );
      if (feature.kind === "water") {
        const level = elevation.waterLevels.get(feature);
        for (const [outer, ...inner] of cutScenery(points, holes)) {
          waterPieces.push(surface(outer, inner, 0.5, level));
          bedPieces.push(surface(outer, inner, -0.8, level));
        }
        continue;
      }
      if (feature.kind === "park") {
        for (const [outer, ...inner] of cutOccupied(points, holes))
          for (const [part, ...voids] of cutScenery(outer, inner))
            parkPieces.push(surface(part, voids, 0.12));
        continue;
      }
      const xs = points.map((p) => p[0]),
        zs = points.map((p) => p[1]),
        cx = xs.reduce((a, b) => a + b, 0) / xs.length,
        cz = zs.reduce((a, b) => a + b, 0) / zs.length;
      const sizeX = Math.max(...xs) - Math.min(...xs),
        sizeZ = Math.max(...zs) - Math.min(...zs);
      const nearby = Math.hypot(cx, cz) < Math.min(240, half * 0.85);
      const {
          height: wallHeight,
          minimum,
          roof: measuredRoof,
          estimated,
          pitched,
          tone,
          identity,
        } = buildingDesign(feature, points, holes, data.center, seed),
        footing = foundation(points, holes, height, step, -half),
        baseH = footing.high + minimum + 0.2;
      const buildingH = wallHeight + (pitched ? 0 : measuredRoof);
      const geo = normalized(
        new THREE.ExtrudeGeometry(shape(points, holes), {
          depth:
            buildingH + (minimum === 0 ? footing.high - footing.low + 0.1 : 0),
          bevelEnabled: false,
          steps: 1,
          curveSegments: 1,
        }),
      );
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, minimum === 0 ? footing.low + 0.1 : baseH, 0);
      walls.push({ geometry: geo, tone });
      // These shallow bands keep ordinary houses legible before close facades load.
      for (let edge = 0; edge < points.length; edge++) {
        const a = points[edge],
          b = points[(edge + 1) % points.length];
        const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (length < 0.5) continue;
        for (const [y, thickness, depth] of pitched
          ? [[buildingH - 0.05, 0.22, 0.65]]
          : [[buildingH + 0.24, 0.48, 0.22]]) {
          const trim = normalized(
            new THREE.BoxGeometry(length + 0.12, thickness, depth),
          );
          trim.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0]));
          trim.translate((a[0] + b[0]) / 2, baseH + y, (a[1] + b[1]) / 2);
          walls.push({ geometry: trim, tone });
        }
      }
      edgePieces.push(new THREE.EdgesGeometry(geo, 25));
      stats.buildings++;
      if (estimated) stats.estimated++;
      const buildingIndex = buildings.length;
      let roofRise = 0;
      if (pitched) {
        const roof = gabledRoof(points, baseH + buildingH, measuredRoof);
        roofRise = roof.rise;
        roofs.push({ geometry: roof.geometry, tone });
        if (nearby) edgePieces.push(new THREE.EdgesGeometry(roof.geometry, 30));
      }
      buildings.push({
        id: identity,
        points,
        height: buildingH,
        base: baseH,
        pitched,
        roofRise,
        tags: feature.tags,
      });
      if (buildingH > 7 && sizeX < 180 && sizeZ < 180) {
        const vertices = windowVertices(
          points,
          baseH,
          buildingH,
          nearby ? 28 : 12,
        );
        if (vertices.length) {
          const pane = new THREE.BufferGeometry();
          pane.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3),
          );
          pane.computeVertexNormals();
          panes.push(pane);
          const count = pane.getAttribute("position").count;
          paneRanges.push({ building: buildingIndex, start: paneCount, count });
          paneCount += count;
        }
      }
    }
    signal.throwIfAborted();
    const wallCounts = walls.map((g) => ({
        count: g.geometry.getAttribute("position").count,
        tone: g.tone,
      })),
      roofCounts = roofs.map((g) => ({
        count: g.geometry.getAttribute("position").count,
        tone: g.tone,
      }));
    const wallMesh = colored(walls, wallMaterial, PALETTES.paper.wall),
      roofMesh = colored(roofs, roofMaterial, PALETTES.paper.roof);
    layers.buildings.add(wallMesh, roofMesh);
    const merge = (
      items: THREE.BufferGeometry[],
      mat: THREE.Material,
      parent: THREE.Group,
    ) => {
      if (!items.length) return;
      const geometry = mergeGeometries(items);
      items.forEach((g) => g.dispose());
      if (!geometry) return;
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const paneMesh = merge(panes, windowMaterial, layers.buildings);
    const paneIndices = new THREE.BufferAttribute(
      new Uint32Array(paneCount),
      1,
    );
    for (let i = 0; i < paneCount; i++) paneIndices.setX(i, i);
    paneIndices.setUsage(THREE.DynamicDrawUsage);
    paneMesh?.geometry.setIndex(paneIndices);
    merge(roadPieces, roadMaterial, layers.roads);
    merge(pathPieces, baseMaterial, layers.roads);
    merge(markingPieces, markingMaterial, layers.roads);
    merge(waterPieces, waterMaterial, layers.water);
    const bedMesh = merge(bedPieces, groundMaterial, root);
    if (bedMesh) bedMesh.name = "Lòng nước";
    merge(parkPieces, parkMaterial, layers.parks);
    if (edgePieces.length) {
      const edges = mergeGeometries(edgePieces);
      edgePieces.forEach((g) => g.dispose());
      if (edges)
        layers.buildings.add(new THREE.LineSegments(edges, edgeMaterial));
    }
    const trees = (await mappedTrees(data, seed, 0, signal)).filter(
      (t) => !landmarks.surfaceMasks.some(([ring]) => contains(ring, t.x, t.z)),
    );
    const treeCount = trees.length;
    const vegetation = createTrees(trees, height, seed);
    vegetation.apply(PALETTES.paper, 0.55);
    layers.trees.add(vegetation.root);
    stats.trees = treeCount;
    walls.length =
      roofs.length =
      panes.length =
      pathPieces.length =
      roadPieces.length =
      markingPieces.length =
      bedPieces.length =
      waterPieces.length =
      parkPieces.length =
      edgePieces.length =
        0;
    let previousStyle = "";
    fadeDistantLines(root);
    let lastSettings: SceneSettings | undefined;
    let details: ReturnType<typeof createFacadeDetails> | undefined;
    let detailKey = "";
    const centers = buildings.map((b) => {
      const x = b.points.reduce((sum, p) => sum + p[0], 0) / b.points.length;
      const z = b.points.reduce((sum, p) => sum + p[1], 0) / b.points.length;
      return {
        x,
        z,
        radius: Math.max(
          ...b.points.map((p) => Math.hypot(p[0] - x, p[1] - z)),
        ),
      };
    });
    return {
      root,
      ground,
      stats,
      street,
      landmarks: landmarks.list,
      waterSurfaces: elevation.waterSurfaces,
      elevation: height,
      detail(position) {
        if (disposed) return false;
        const altitude = Math.max(
          0,
          position.y - height(position.x, position.z),
        );
        const focus = position.clone();
        if (altitude > 80) {
          const scale = Math.min(
            1,
            (half * 0.72) / Math.max(Math.abs(focus.x), Math.abs(focus.z), 1),
          );
          focus.x *= scale;
          focus.z *= scale;
        }
        const treeChanged = vegetation.detail(focus);
        const radius = Math.min(420, 135 + altitude * 0.6);
        const candidates = centers
          .map((b, i) => ({
            i,
            distance: Math.hypot(b.x - focus.x, b.z - focus.z) - b.radius,
          }))
          .filter((b) => b.distance < radius)
          .sort((a, b) => a.distance - b.distance);
        const selected: number[] = [];
        let budget = 0;
        for (const candidate of candidates) {
          const estimate = estimateFacade(buildings[candidate.i]);
          if (selected.length && budget + estimate > 560_000) continue;
          selected.push(candidate.i);
          budget += estimate;
          if (selected.length >= 90 || budget >= 560_000) break;
        }
        const key = selected
          .slice()
          .sort((a, b) => a - b)
          .join(",");
        if (key === detailKey) return treeChanged;
        const next = createFacadeDetails(
          selected.map((i) => {
            const b = buildings[i];
            b.fronts ??= street.fronts(b.points);
            return b;
          }),
          seed,
        );
        fadeDistantLines(next.root);
        if (lastSettings) next.apply(lastSettings.style, lastSettings.outlines);
        details?.dispose();
        details?.root.removeFromParent();
        details = next;
        layers.buildings.add(next.root);
        detailKey = key;
        const detailed = new Set(selected);
        let count = 0;
        for (const range of paneRanges) {
          if (detailed.has(range.building)) continue;
          for (let i = range.start; i < range.start + range.count; i++)
            paneIndices.setX(count++, i);
        }
        // Collapsed trailing triangles keep OBJ/SVG exporters from restoring hidden coarse windows.
        for (let i = count; i < paneCount; i++) paneIndices.setX(i, 0);
        paneIndices.needsUpdate = true;
        paneMesh?.geometry.setDrawRange(0, count);
        return true;
      },
      apply(settings) {
        lastSettings = settings;
        street.apply(settings.style, settings.outlines);
        landmarks.apply(settings);
        details?.apply(settings.style, settings.outlines);
        const palette = PALETTES[settings.style];
        root.scale.y = settings.heightScale;
        layers.buildings.visible = settings.buildings;
        layers.roads.visible = settings.roads;
        layers.trees.visible = settings.trees;
        layers.water.visible = settings.water;
        edgeMaterial.opacity = settings.outlines;
        edgeMaterial.visible = settings.outlines > 0;
        vegetation.apply(palette, settings.outlines);
        if (previousStyle === settings.style) return;
        previousStyle = settings.style;
        groundMaterial.color.set(palette.ground);
        baseMaterial.color.set(palette.base);
        roadMaterial.color.set(palette.road);
        waterMaterial.color.set(palette.water);
        parkMaterial.color.set(palette.green);
        windowMaterial.color.set(palette.window);
        edgeMaterial.color.set(palette.edge);
        recolor(wallMesh, wallCounts, palette.wall);
        recolor(roofMesh, roofCounts, palette.roof);
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        details?.dispose();
        street.dispose();
        landmarks.dispose();
        disposeObject(root);
        looseMaterials.forEach((m) => m.dispose());
      },
    };
  } catch (error) {
    for (const item of [...walls, ...roofs]) item.geometry.dispose();
    for (const geometry of [
      ...panes,
      ...roadPieces,
      ...pathPieces,
      ...markingPieces,
      ...waterPieces,
      ...bedPieces,
      ...parkPieces,
      ...edgePieces,
    ])
      geometry.dispose();
    street.dispose();
    landmarks.dispose();
    disposeObject(root);
    looseMaterials.forEach((m) => m.dispose());
    throw error;
  }
}
