import * as THREE from "three";
import { contains, type Point } from "../../geo/coordinates";
import { LandmarkBuilder, type LandmarkAsset, type Tone } from "./geometry";
import { clipArea, type MultiPolygon } from "../roads";

type Ground = (x: number, z: number) => number;
const rectangle = (
  left: number,
  back: number,
  right: number,
  front: number,
): MultiPolygon => [
  [
    [
      [left, back],
      [right, back],
      [right, front],
      [left, front],
    ],
  ],
];

function terrainJoin(
  b: LandmarkBuilder,
  footprints: MultiPolygon,
  ground: Ground,
) {
  const positions: number[] = [];
  for (const [ring] of footprints)
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        c = ring[(i + 1) % ring.length],
        steps = Math.max(
          1,
          Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / 2),
        );
      for (let j = 0; j < steps; j++) {
        const at = (t: number): [number, number] => [
          THREE.MathUtils.lerp(a[0], c[0], t),
          THREE.MathUtils.lerp(a[1], c[1], t),
        ];
        const p = at(j / steps),
          q = at((j + 1) / steps),
          h = ground(...p),
          k = ground(...q);
        if (Math.max(Math.abs(h), Math.abs(k)) < 0.15) continue;
        positions.push(
          p[0],
          0,
          p[1],
          q[0],
          0,
          q[1],
          p[0],
          h,
          p[1],
          q[0],
          0,
          q[1],
          q[0],
          k,
          q[1],
          p[0],
          h,
          p[1],
        );
      }
    }
  if (!positions.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  b.add("scenic_terrain_join", "limestone", g);
}

function stone(
  b: LandmarkBuilder,
  name: string,
  x: number,
  z: number,
  levels: [number, number, number, number][],
  tone: Tone = "limestone",
) {
  const vertices: number[] = [],
    segments = 20;
  const ring = (i: number, j: number) => {
    const [y, rx, rz, shift] = levels[i],
      a = (j * Math.PI * 2) / segments;
    const rough =
      1 + 0.09 * Math.sin(j * 2.7 + i * 1.8) + 0.04 * Math.cos(j * 5.1 - i);
    return [
      x + shift + Math.cos(a) * rx * rough,
      y,
      z + Math.sin(a) * rz * rough,
    ];
  };
  for (let i = 1; i < levels.length; i++)
    for (let j = 0; j < segments; j++) {
      const a = ring(i - 1, j),
        c = ring(i - 1, j + 1),
        d = ring(i, j),
        e = ring(i, j + 1);
      for (const p of [a, d, c, c, d, e]) vertices.push(...p);
    }
  for (const i of [0, levels.length - 1])
    for (let j = 0; j < segments; j++)
      vertices.push(
        x + levels[i][3],
        levels[i][0],
        z,
        ...ring(i, j),
        ...ring(i, j + 1),
      );
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.computeVertexNormals();
  b.add(name, tone, geometry);
}

function capsule(
  b: LandmarkBuilder,
  name: string,
  tone: Tone,
  a: THREE.Vector3,
  c: THREE.Vector3,
  radius: number,
) {
  const vector = c.clone().sub(a),
    length = vector.length();
  const g = new THREE.CapsuleGeometry(
    radius,
    Math.max(0.01, length - radius * 2),
    5,
    10,
  );
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const factor =
      1 + 0.035 * Math.sin(p.getY(i) * 3.7 + p.getX(i) * 4.1 + p.getZ(i) * 2.9);
    p.setXYZ(i, p.getX(i) * factor, p.getY(i), p.getZ(i) * factor);
  }
  g.computeVertexNormals();
  g.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      vector.normalize(),
    ),
  );
  const middle = a.clone().add(c).multiplyScalar(0.5);
  b.add(name, tone, g, middle.x, middle.y, middle.z);
}

function goldenBridge(ground: Ground, path: Point[]) {
  if (path.length < 3) throw new Error("Cầu Vàng cần đường cong bản đồ.");
  const b = new LandmarkBuilder("Golden_Bridge");
  const curve = new THREE.CatmullRomCurve3(
    path.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "centripetal",
  );
  const samples = curve.getSpacedPoints(150),
    length = curve.getLength();
  const deck = Math.max(...samples.map((p) => ground(p.x, p.z))) + 6;
  const edge = (t: number, side: number, y: number) => {
    const p = curve.getPointAt(t),
      direction = curve.getTangentAt(t);
    return [p.x + direction.z * side, y, p.z - direction.x * side] as [
      number,
      number,
      number,
    ];
  };
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1],
      c = samples[i],
      mid = a.clone().add(c).multiplyScalar(0.5);
    const angle = Math.atan2(c.x - a.x, c.z - a.z);
    b.box(
      "timber_walking_deck",
      "wood",
      mid.x,
      deck,
      mid.z,
      5,
      0.3,
      a.distanceTo(c) + 0.04,
      angle,
    );
    for (const side of [-1, 1]) {
      const [x, , z] = edge((i - 0.5) / 150, side * 2.05, deck);
      b.box(
        "edge_planter_beds",
        "green",
        x,
        deck + 0.2,
        z,
        0.65,
        0.2,
        a.distanceTo(c),
        angle,
      );
    }
  }
  for (const side of [-1, 1]) {
    for (const y of [deck - 0.45, deck + 1.25])
      b.tube(
        "curved_golden_rails",
        "gold",
        Array.from({ length: 91 }, (_, i) => edge(i / 90, side * 2.5, y)),
        0.12,
      );
    for (let i = 0; i <= 120; i++) {
      const [x, , z] = edge(i / 120, side * 2.5, deck);
      b.cylinder(
        "slender_golden_balusters",
        "gold",
        x,
        deck + 0.63,
        z,
        0.035,
        0.035,
        1.15,
        5,
      );
    }
  }
  for (let i = 1; i <= 7; i++) {
    const p = curve.getPointAt(i / 8),
      foot = ground(p.x, p.z);
    b.cylinder(
      "seven_support_piers",
      "metal",
      p.x,
      (deck + foot) / 2,
      p.z,
      0.4,
      0.48,
      deck - foot,
      10,
    );
  }
  for (const t of [0.29, 0.72]) {
    const p = curve.getPointAt(t),
      tangent = curve.getTangentAt(t);
    const normal = new THREE.Vector3(tangent.z, 0, -tangent.x);
    const at = (u: number, v: number, y: number) =>
      p.clone().addScaledVector(tangent, u).addScaledVector(normal, v).setY(y);
    const wrist = at(0, 6, 0);
    const foot = Math.min(ground(wrist.x, wrist.z) - 3, deck - 7);
    capsule(
      b,
      "weathered_stone_wrist",
      "stone",
      at(0, 6, foot + 1),
      at(0, 1, deck - 3),
      3.3,
    );
    const palm = new THREE.SphereGeometry(1, 18, 12);
    palm.scale(6.8, 2.8, 5.7);
    const angle = Math.atan2(tangent.z, tangent.x);
    b.add("cupped_support_palm", "stone", palm, p.x, deck - 2.3, p.z, -angle);
    for (const [i, u] of [-5.1, -1.7, 1.7, 5.1].entries()) {
      const h = [9, 12, 11, 8][i];
      capsule(
        b,
        "four_separate_stone_fingers",
        "stone",
        at(u, -3, deck - 2),
        at(u * 1.05, -6, deck + h),
        1.25,
      );
      const q = at(u, -5.1, deck + h * 0.4);
      b.sphere("sparse_moss_patches", "green", q.x, q.y, q.z, 0.45, 0.7, 0.18);
    }
    capsule(
      b,
      "opposing_stone_thumb",
      "stone",
      at(-3.5, 4.5, deck - 4),
      at(-6.5, 5.2, deck + 5.5),
      1.7,
    );
  }
  const asset = b.finish(length, 40);
  asset.root.userData.mappedPath = true;
  asset.root.userData.estimatedDeckHeight = true;
  return asset;
}

function fightingCocks() {
  const b = new LandmarkBuilder("Hon_Trong_Mai");
  stone(b, "western_undercut_karst", -8.4, -1.2, [
    [-0.7, 4.4, 3, 0],
    [0.5, 3.7, 2.8, 0],
    [2, 5.5, 4.4, -0.4],
    [5, 6.3, 4.5, 0.2],
    [8, 5.4, 4.1, 1.7],
    [11, 3.8, 3.2, 1.3],
    [12.5, 1.5, 1.8, 0.8],
  ]);
  stone(b, "eastern_leaning_karst", 8.4, 1.2, [
    [-0.7, 4.6, 3.2, 0],
    [0.7, 3.8, 3, 0.8],
    [2.7, 6.5, 4.4, 0.9],
    [5.4, 5.4, 4.1, -0.1],
    [8.4, 3.9, 3.2, -2.5],
    [11.8, 2.3, 2, -3],
    [13, 0.8, 1.2, -3.5],
  ]);
  for (const [x, y, z] of [
    [-7.5, 12.6, -1],
    [-10, 11.8, -1.8],
    [5.3, 12.7, 0.3],
    [10, 6.7, 3.6],
  ] as const)
    b.sphere("small_karst_scrub", "green", x, y, z, 1.25, 0.5, 1);
  b.box("sea_at_islet_foot", "water", 0, 0.26, 0, 60, 0.03, 34);
  const asset = b.finish(60, 34);
  asset.root.userData.focusWidth = 36;
  asset.root.userData.focusDepth = 18;
  asset.root.userData.surfaceFootprints = rectangle(-30, -17, 30, 17);
  return asset;
}

function naturalArch(
  b: LandmarkBuilder,
  name: string,
  outer: Point[],
  opening: Point[],
  depth: number,
  tone: Tone,
  y = 0,
) {
  const shape = new THREE.Shape();
  const points = [...outer, ...opening];
  shape.moveTo(...points[0]);
  for (const p of points.slice(1)) shape.lineTo(...p);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    steps: 1,
  });
  g.translate(0, 0, -depth);
  b.add(name, tone, g, 0, y);
}

function phongNha(ground: Ground) {
  const b = new LandmarkBuilder("Phong_Nha_Entrance"),
    y = 0;
  const cliff = (x: number, h: number) => Math.max(h, ground(x, -22) + 1);
  naturalArch(
    b,
    "open_limestone_cave_mouth",
    [
      [-29, 0],
      [-30, cliff(-30, 13)],
      [-26, cliff(-26, 22)],
      [-20, cliff(-20, 27)],
      [-9, cliff(-9, 31)],
      [2, cliff(2, 29)],
      [13, cliff(13, 33)],
      [25, cliff(25, 25)],
      [29, cliff(29, 12)],
      [27, 0],
    ],
    [
      [14, 0],
      [13, 3],
      [10, 6.2],
      [5, 8.1],
      [-2, 8.4],
      [-9, 6.8],
      [-13, 4],
      [-15, 0],
    ],
    22,
    "limestone",
    y,
  );
  for (let i = 0; i < 14; i++) {
    const x = -27 + i * 4,
      h = cliff(x, 26 + Math.sin(i * 1.7) * 2);
    b.sphere("jungle_on_cave_ridge", "green", x, y + h, -13, 3.7, 3.2, 5);
    if (Math.abs(x) > 15)
      b.tube(
        "vertical_limestone_seams",
        "basalt",
        [
          [x, y + 2, 0.04],
          [x + 0.9, y + 10, 0.05],
          [x - 0.7, y + 19, 0.05],
        ],
        0.08,
      );
  }
  b.box("river_entering_cave", "water", 0, y + 0.06, -3, 26, 0.1, 32);
  b.box("unmodeled_cave_depth", "dark", 0, y + 3.7, -21, 26, 7.5, 0.2);
  const footprints = clipArea(
    [...rectangle(-30, -22, 29, 0), ...rectangle(-13, -19, 13, 13)],
    [],
    "union",
  );
  terrainJoin(b, footprints, ground);
  const asset = b.finish(60, 38);
  asset.root.userData.entranceOnly = true;
  asset.root.userData.focusHeight = 36;
  asset.root.userData.surfaceFootprints = footprints;
  return asset;
}

function basaltCoast(ground: Ground, outline: Point[]) {
  if (outline.length < 3) throw new Error("Gành Đá Đĩa cần ranh giới đá.");
  const b = new LandmarkBuilder("Ganh_Da_Dia");
  const xs = outline.map((p) => p[0]),
    zs = outline.map((p) => p[1]);
  const r = 1.12,
    stepX = Math.sqrt(3) * r,
    stepZ = 1.5 * r;
  let columns = 0;
  for (
    let row = Math.floor(Math.min(...zs) / stepZ);
    row <= Math.ceil(Math.max(...zs) / stepZ);
    row++
  )
    for (
      let col = Math.floor(Math.min(...xs) / stepX);
      col <= Math.ceil(Math.max(...xs) / stepX);
      col++
    ) {
      const x = col * stepX + ((row % 2) * stepX) / 2,
        z = row * stepZ;
      if (
        !Array.from({ length: 6 }, (_, i) => (i * Math.PI) / 3).every((a) =>
          contains(outline, x + Math.sin(a) * r, z + Math.cos(a) * r),
        )
      )
        continue;
      const foot = ground(x, z),
        h = 0.8 + 0.24 * ((((col * 17 + row * 13) % 5) + 5) % 5);
      b.cylinder(
        "interlocking_hexagonal_basalt",
        "basalt",
        x,
        foot + h / 2,
        z,
        r * 0.975,
        r * 0.975,
        h,
        6,
      );
      b.cylinder(
        "weathered_hexagonal_tops",
        (col + row) % 4 === 0 ? "stone" : "basalt",
        x,
        foot + h + 0.025,
        z,
        r * 0.955,
        r * 0.955,
        0.05,
        6,
      );
      columns++;
    }
  const asset = b.finish(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...zs) - Math.min(...zs),
  );
  asset.root.userData.basaltColumns = columns;
  return asset;
}

function waterCurtain(
  b: LandmarkBuilder,
  width: number,
  top: number,
  bottom: number,
  z: number,
  phase: number,
) {
  const positions: number[] = [];
  const at = (u: number, t: number) => [
    (u * width) / 2,
    THREE.MathUtils.lerp(top, bottom, t),
    z + t * t * 3 + Math.sin(u * 24 + t * 8 + phase) * 0.16,
  ];
  for (let i = 0; i < 80; i++)
    for (let j = 0; j < 8; j++) {
      if (phase < 2 && i % 19 >= 16) continue;
      const u = i / 40 - 1,
        v = (i + 1) / 40 - 1,
        t = j / 8,
        n = (j + 1) / 8;
      for (const p of [
        at(u, t),
        at(u, n),
        at(v, t),
        at(v, t),
        at(u, n),
        at(v, n),
      ])
        positions.push(...p);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  b.add("flowing_water_curtains", "foam", g);
  for (let i = 0; i < 44; i++) {
    const x = (i / 43 - 0.5) * width;
    b.tube(
      "teal_water_channels",
      "water",
      [
        [x, top, z + 0.12],
        [x + 0.2, top * 0.6 + bottom * 0.4, z + 0.65],
        [x - 0.15, bottom, z + 3.1],
      ],
      0.035 + (i % 3) * 0.02,
    );
  }
}

function banGioc(ground: Ground) {
  const b = new LandmarkBuilder("Ban_Gioc_Main_Cascade"),
    base = 0;
  for (const [i, [w, h, z]] of [
    [62, 31, -23],
    [83, 18, -8],
    [100, 7, 8],
  ].entries()) {
    b.box(
      "layered_limestone_ledges",
      "limestone",
      0,
      base + h / 2,
      z - 9,
      w,
      h,
      18,
    );
    b.box(
      "turquoise_terrace_pools",
      "water",
      0,
      base + h + 0.06,
      z - 5,
      w,
      0.12,
      9,
    );
    waterCurtain(
      b,
      w,
      base + h,
      base + (i === 0 ? 18 : i === 1 ? 7 : 0.2),
      z,
      i,
    );
    for (let j = 0; j < 8; j++) {
      const x = -w / 2 + (j * w) / 7;
      b.sphere(
        "cascade_foam_at_ledge",
        "foam",
        x,
        base + (i === 0 ? 18 : i === 1 ? 7 : 0.2),
        z + 3,
        1.8,
        0.2,
        1.3,
      );
    }
  }
  for (const x of [-37, -24, 22, 35])
    for (const [dx, dy, dz] of [
      [0, 0, 0],
      [-1.3, -0.5, 0.5],
      [1.2, -0.7, 0.6],
    ]) {
      const crown = new THREE.IcosahedronGeometry(1, 1);
      crown.scale(1.8, 2, 1.6);
      b.add(
        "foliage_on_rock_shelves",
        "green",
        crown,
        x + dx,
        base + 20.7 + dy,
        -16 + dz,
      );
    }
  const pool = new THREE.CylinderGeometry(1, 1, 0.16, 48);
  pool.scale(56, 1, 23);
  b.add("lower_plunge_pool", "water", pool, 0, base + 0.06, 25);
  const poolRing: Point[] = Array.from({ length: 48 }, (_, i) => [
    Math.cos((i * Math.PI) / 24) * 56,
    25 + Math.sin((i * Math.PI) / 24) * 23,
  ]);
  const footprints = clipArea(
    [
      ...rectangle(-31, -41, 31, -19),
      ...rectangle(-41.5, -26, 41.5, -4),
      ...rectangle(-50, -10, 50, 12),
      [poolRing],
    ],
    [],
    "union",
  );
  terrainJoin(b, footprints, ground);
  const asset = b.finish(112, 78);
  asset.root.userData.mainCascadeOnly = true;
  asset.root.userData.surfaceFootprints = footprints;
  return asset;
}

export function makeScenicLandmark(
  kind: string,
  ground: Ground = () => 0,
  path: Point[] = [],
  outline: Point[] = [],
): LandmarkAsset | undefined {
  switch (kind) {
    case "golden-bridge":
      return goldenBridge(ground, path);
    case "fighting-cocks":
      return fightingCocks();
    case "phong-nha-cave":
      return phongNha(ground);
    case "ganh-da-dia":
      return basaltCoast(ground, outline);
    case "ban-gioc-falls":
      return banGioc(ground);
    default:
      return undefined;
  }
}
