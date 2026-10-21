import * as THREE from "three";
import { LandmarkBuilder, type LandmarkAsset, type Tone } from "./geometry";

// Original architectural illustrations; proportions follow public reference photographs.
const glyphs: Record<string, number[][][]> = {
  A: [
    [
      [0, 0],
      [0.5, 1],
      [1, 0],
    ],
    [
      [0.22, 0.43],
      [0.78, 0.43],
    ],
  ],
  B: [
    [
      [0, 0],
      [0, 1],
      [0.65, 1],
      [1, 0.8],
      [0.65, 0.52],
      [0, 0.52],
    ],
    [
      [0.65, 0.52],
      [1, 0.25],
      [0.65, 0],
      [0, 0],
    ],
  ],
  C: [
    [
      [1, 0.9],
      [0.7, 1],
      [0.15, 0.9],
      [0, 0.5],
      [0.15, 0.1],
      [0.7, 0],
      [1, 0.1],
    ],
  ],
  D: [
    [
      [0, 0],
      [0, 1],
      [0.6, 1],
      [1, 0.75],
      [1, 0.25],
      [0.6, 0],
      [0, 0],
    ],
  ],
  E: [
    [
      [1, 1],
      [0, 1],
      [0, 0],
      [1, 0],
    ],
    [
      [0, 0.5],
      [0.8, 0.5],
    ],
  ],
  F: [
    [
      [1, 1],
      [0, 1],
      [0, 0],
    ],
    [
      [0, 0.5],
      [0.8, 0.5],
    ],
  ],
  H: [
    [
      [0, 0],
      [0, 1],
    ],
    [
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0.5],
      [1, 0.5],
    ],
  ],
  I: [
    [
      [0.5, 0],
      [0.5, 1],
    ],
    [
      [0.1, 1],
      [0.9, 1],
    ],
    [
      [0.1, 0],
      [0.9, 0],
    ],
  ],
  L: [
    [
      [0, 1],
      [0, 0],
      [1, 0],
    ],
  ],
  M: [
    [
      [0, 0],
      [0, 1],
      [0.5, 0.45],
      [1, 1],
      [1, 0],
    ],
  ],
  N: [
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  ],
  O: [
    [
      [0.2, 0],
      [0, 0.2],
      [0, 0.8],
      [0.2, 1],
      [0.8, 1],
      [1, 0.8],
      [1, 0.2],
      [0.8, 0],
      [0.2, 0],
    ],
  ],
  R: [
    [
      [0, 0],
      [0, 1],
      [0.7, 1],
      [1, 0.8],
      [0.7, 0.5],
      [0, 0.5],
    ],
    [
      [0.55, 0.5],
      [1, 0],
    ],
  ],
  T: [
    [
      [0, 1],
      [1, 1],
    ],
    [
      [0.5, 1],
      [0.5, 0],
    ],
  ],
  "2": [
    [
      [0, 0.8],
      [0.2, 1],
      [0.8, 1],
      [1, 0.8],
      [1, 0.6],
      [0, 0],
      [1, 0],
    ],
  ],
  "4": [
    [
      [0.8, 0],
      [0.8, 1],
      [0, 0.35],
      [1, 0.35],
    ],
  ],
};

function label(
  b: LandmarkBuilder,
  name: string,
  text: string,
  tone: Tone,
  x: number,
  y: number,
  z: number,
  height: number,
) {
  const width = height * 0.59,
    advance = width * 1.4;
  const start = x - (text.length * advance - advance + width) / 2;
  for (let c = 0; c < text.length; c++)
    for (const line of glyphs[text[c]] ?? []) {
      for (let i = 1; i < line.length; i++) {
        const [ax, ay] = line[i - 1],
          [bx, by] = line[i];
        const dx = (bx - ax) * width,
          dy = (by - ay) * height;
        const g = new THREE.BoxGeometry(
          Math.hypot(dx, dy) + height * 0.055,
          height * 0.075,
          height * 0.1,
        );
        g.rotateZ(Math.atan2(dy, dx));
        b.add(
          name,
          tone,
          g,
          start + c * advance + ((ax + bx) * width) / 2,
          y + ((ay + by) * height) / 2,
          z,
        );
      }
    }
}

function ellipsoid(
  b: LandmarkBuilder,
  name: string,
  tone: Tone,
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number,
  rz: number,
) {
  const g = new THREE.SphereGeometry(1, 10, 6);
  g.scale(rx, ry, rz);
  b.add(name, tone, g, x, y, z);
}

function beam(
  b: LandmarkBuilder,
  name: string,
  tone: Tone,
  from: number[],
  to: number[],
  radius: number,
  sides = 7,
) {
  const a = new THREE.Vector3(...from),
    direction = new THREE.Vector3(...to).sub(a);
  const g = new THREE.CylinderGeometry(
    radius,
    radius,
    direction.length(),
    sides,
  );
  g.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize(),
    ),
  );
  b.add(
    name,
    tone,
    g,
    ...(a.addScaledVector(direction, 0.5).toArray() as [
      number,
      number,
      number,
    ]),
  );
}

function curve(
  b: LandmarkBuilder,
  name: string,
  tone: Tone,
  points: number[][],
  radius: number,
  segments = 24,
  radial = 5,
) {
  b.add(
    name,
    tone,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
      segments,
      radius,
      radial,
    ),
  );
}

function pediment(
  b: LandmarkBuilder,
  name: string,
  x: number,
  y: number,
  z: number,
  width: number,
  rise: number,
) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0);
  s.lineTo(0, rise);
  s.lineTo(width / 2, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false });
  b.add(name, "cream", g, x, y, z);
  beam(
    b,
    name + "_moulding",
    "white",
    [x - width / 2, y, z + 0.55],
    [x, y + rise, z + 0.55],
    0.16,
  );
  beam(
    b,
    name + "_moulding",
    "white",
    [x, y + rise, z + 0.55],
    [x + width / 2, y, z + 0.55],
    0.16,
  );
  b.box(name + "_cornice", "white", x, y, z + 0.3, width + 0.6, 0.4, 1);
}

function column(
  b: LandmarkBuilder,
  name: string,
  x: number,
  y: number,
  z: number,
  height: number,
  radius: number,
) {
  b.cylinder(
    name + "_shaft",
    "white",
    x,
    y + height / 2,
    z,
    radius * 0.8,
    radius,
    height,
    10,
  );
  b.box(
    name + "_base",
    "white",
    x,
    y + 0.16,
    z,
    radius * 2.8,
    0.32,
    radius * 2.8,
  );
  b.box(
    name + "_capital",
    "white",
    x,
    y + height - 0.12,
    z,
    radius * 3,
    0.3,
    radius * 2.8,
  );
  for (const dx of [-1, 1])
    ellipsoid(
      b,
      name + "_volute",
      "white",
      x + dx * radius,
      y + height - 0.36,
      z + radius,
      radius * 0.5,
      radius * 0.4,
      radius * 0.35,
    );
}

function window(
  b: LandmarkBuilder,
  name: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  arched = false,
) {
  b.box(
    name + "_recess",
    "dark",
    x,
    y + height / 2,
    z,
    width + 0.18,
    height + 0.18,
    0.17,
  );
  if (arched) {
    b.arch(
      name + "_arch",
      "white",
      x,
      y,
      z + 0.12,
      width + 0.5,
      height + 0.22,
      0.28,
      width,
      height,
    );
  } else {
    for (const dx of [-1, 1])
      b.box(
        name + "_jamb",
        "white",
        x + dx * (width / 2 + 0.08),
        y + height / 2,
        z + 0.12,
        0.16,
        height + 0.3,
        0.3,
      );
    b.box(
      name + "_lintel",
      "white",
      x,
      y + height + 0.08,
      z + 0.12,
      width + 0.5,
      0.2,
      0.3,
    );
  }
  b.box(
    name + "_glazing",
    "glass",
    x,
    y + height * 0.46,
    z + 0.1,
    width * 0.85,
    height * 0.86,
    0.07,
  );
  b.box(
    name + "_mullion",
    "wood",
    x,
    y + height * 0.43,
    z + 0.18,
    0.1,
    height * 0.86,
    0.1,
  );
  b.box(
    name + "_transom",
    "wood",
    x,
    y + height * 0.42,
    z + 0.18,
    width,
    0.1,
    0.1,
  );
  b.box(
    name + "_sill",
    "white",
    x,
    y + 0.02,
    z + 0.17,
    width + 0.55,
    0.2,
    0.55,
  );
}

function balustrade(
  b: LandmarkBuilder,
  name: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height = 0.8,
) {
  b.box(name + "_rail", "white", x, y + height, z, width, 0.14, 0.3);
  b.box(name + "_foot", "white", x, y, z, width, 0.14, 0.32);
  const count = Math.max(2, Math.floor(width / 0.65));
  for (let i = 0; i <= count; i++)
    b.cylinder(
      name + "_baluster",
      "white",
      x - width / 2 + (width * i) / count,
      y + height / 2,
      z,
      0.07,
      0.1,
      height,
      6,
    );
}

function clock(
  b: LandmarkBuilder,
  x: number,
  y: number,
  z: number,
  radius: number,
) {
  const face = new THREE.CylinderGeometry(radius, radius, 0.12, 28);
  face.rotateX(Math.PI / 2);
  b.add("clock_face", "white", face, x, y, z);
  b.add(
    "clock_rim",
    "dark",
    new THREE.TorusGeometry(radius, radius * 0.06, 5, 28),
    x,
    y,
    z + 0.08,
  );
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const g = new THREE.BoxGeometry(radius * 0.07, radius * 0.2, 0.05);
    g.rotateZ(-angle);
    b.add(
      "clock_hours",
      "dark",
      g,
      x + Math.sin(angle) * radius * 0.78,
      y + Math.cos(angle) * radius * 0.78,
      z + 0.09,
    );
  }
  const hand = new THREE.BoxGeometry(radius * 0.07, radius * 0.62, 0.08);
  hand.translate(0, radius * 0.26, 0);
  hand.rotateZ(0.68);
  b.add("clock_hands", "dark", hand, x, y, z + 0.13);
  b.box(
    "clock_hands",
    "dark",
    x + radius * 0.2,
    y,
    z + 0.15,
    radius * 0.48,
    radius * 0.07,
    0.08,
  );
}

function cityHall(): LandmarkAsset {
  const b = new LandmarkBuilder("saigon-city-hall");
  b.box("foundation", "stone", 0, 0.22, 0, 80, 0.44, 50);
  b.box("front_range", "cream", 0, 8.3, 17, 80, 16, 12);
  b.box("rear_range", "cream", 0, 6.7, -19, 80, 13, 12);
  for (const side of [-1, 1]) {
    b.box("courtyard_wings", "cream", side * 34, 7.3, -1, 12, 14, 34);
    b.roof("wing_terracotta_roof", "red", side * 33, 14.4, -1, 14, 37, 3.6, 0);
    for (let i = 0; i < 6; i++) {
      const z = -16 + i * 6;
      b.box("side_windows", "glass", side * 40.06, 5, z, 0.12, 3.5, 2.4);
      b.box("side_windows", "glass", side * 40.06, 11, z, 0.12, 3.5, 2.4);
      b.box(
        "side_pilasters",
        "white",
        side * 40.2,
        8.2,
        z - 2.5,
        0.4,
        15,
        0.45,
      );
    }
  }
  for (const y of [0.7, 7.6, 8.3, 15.8, 16.4])
    b.box(
      "horizontal_cornices",
      "white",
      0,
      y,
      23.1,
      81,
      y > 15 ? 0.45 : 0.25,
      0.75,
    );
  for (let i = 0; i < 15; i++) {
    const x = -35 + i * 5;
    window(b, "ground_arcade", x, 0.9, 23.12, 3, 5.8, true);
    window(b, "upper_arcade", x, 9.1, 23.12, 3, 5.4, true);
    column(b, "upper_classical_columns", x - 2.25, 8.7, 23.6, 6.7, 0.25);
    if (Math.abs(x) < 26)
      balustrade(b, "upper_balconies", x, 8.8, 23.6, 3.35, 0.78);
    ellipsoid(b, "stucco_roses", "white", x, 7.9, 23.6, 0.42, 0.25, 0.14);
  }
  for (const side of [-1, 1]) {
    const x = side * 17.5;
    b.box("side_pavilion", "cream", x, 18, 17.4, 11, 4, 13.5);
    b.roof("pavilion_hip_roof", "red", x, 20.2, 17, 12, 14.5, 5, 0);
    pediment(b, "pavilion_pediment", x, 15.8, 24.15, 10.4, 3.1);
    b.cylinder("roof_finials", "white", x, 26, 17, 0.12, 0.18, 1.6, 8);
    for (const dx of [-5.3, 5.3])
      b.cylinder("roof_finials", "white", x + dx, 21, 24, 0.12, 0.2, 1.7, 8);
  }
  b.box("central_pavilion", "cream", 0, 18.1, 17.8, 13, 4.4, 14);
  pediment(b, "central_sculpted_pediment", 0, 16.8, 24, 15, 4.3);
  b.box("clock_tower_lower", "cream", 0, 23.2, 17.2, 5, 8, 5);
  for (const y of [20.3, 26.6, 27.2])
    b.box("tower_cornices", "white", 0, y, 17.2, 5.7, 0.45, 5.7);
  clock(b, 0, 24.1, 19.82, 1.12);
  for (const side of [-1, 1])
    column(b, "clock_tower_columns", side * 2.15, 21.5, 19.8, 4.9, 0.18);
  b.roof("tower_lower_hip", "roof", 0, 27.3, 17.2, 5.5, 5.5, 2, 0);
  b.box("belfry", "cream", 0, 30.5, 17.2, 2.7, 3, 2.7);
  window(b, "belfry_arch", 0, 29.4, 18.61, 1.3, 2, true);
  b.cylinder("belfry_balcony", "white", 0, 29.3, 17.2, 2.2, 1.8, 0.4, 8);
  b.cylinder("tower_cupola", "metal", 0, 32.5, 17.2, 0.65, 1.6, 1.2, 12);
  b.cylinder("flagstaff", "metal", 0, 34.15, 17.2, 0.045, 0.045, 2.2, 6);
  b.box("flag", "red", 0.6, 34.7, 17.2, 1.15, 0.7, 0.025);
  for (const x of [-35, 35])
    b.roof("outer_range_roof", "red", x, 16.5, 17, 10, 13, 2.1, 0);
  for (const x of [-27.5, -7.5, 7.5, 27.5])
    balustrade(b, "parapet_railings", x, 16.7, 23.2, 6.7, 0.75);
  return b.finish(81, 50);
}

function opera(): LandmarkAsset {
  const b = new LandmarkBuilder("saigon-opera");
  b.box("raised_foundation", "brick", 0, 1.5, -1, 28, 3, 53);
  b.box("auditorium", "cream", 0, 8.8, -5, 27, 12, 47);
  const profile = new THREE.Shape();
  profile.moveTo(-14, 0);
  profile.lineTo(-10.8, 6);
  profile.quadraticCurveTo(0, 8.5, 10.8, 6);
  profile.lineTo(14, 0);
  profile.closePath();
  b.add(
    "mansard_auditorium_roof",
    "dark",
    new THREE.ExtrudeGeometry(profile, {
      depth: 47,
      bevelEnabled: false,
      curveSegments: 14,
    }),
    0,
    14.9,
    -28.5,
  );
  b.box("front_central_wall", "cream", 0, 10.7, 20.5, 15, 15.5, 5);
  for (const side of [-1, 1]) {
    b.box("front_side_pavilions", "cream", side * 11, 9.7, 20.5, 6.5, 13.5, 5);
    window(b, "side_front_windows", side * 11, 6, 23.1, 2.7, 6.6, true);
    for (const dx of [-2.4, 2.4])
      column(b, "facade_pilasters", side * 11 + dx, 3.2, 23.2, 11.8, 0.22);
    b.box("side_cornices", "white", side * 11, 15.7, 23.4, 7.3, 0.55, 1);
    balustrade(b, "roof_balustrades", side * 11, 16.3, 23, 6.5, 1);
    for (let i = 0; i < 6; i++) {
      const z = -24 + i * 7.6;
      b.box(
        "auditorium_side_glazing",
        "glass",
        side * 13.6,
        9,
        z,
        0.15,
        6,
        2.8,
      );
      b.box(
        "auditorium_side_pilasters",
        "white",
        side * 13.8,
        9,
        z - 2.7,
        0.45,
        12,
        0.65,
      );
    }
  }
  for (let i = 0; i < 12; i++)
    b.box(
      "entrance_steps",
      "stone",
      0,
      0.12 + i * 0.12,
      32.1 - i * 0.55,
      25.5,
      0.24 + i * 0.24,
      0.8,
    );
  for (const x of [-3.8, 0, 3.8])
    window(b, "entry_doors", x, 3, 23.1, 3.2, 4.7, true);
  b.box("entrance_balcony_slab", "white", 0, 8.2, 24, 13.9, 0.45, 3.5);
  balustrade(b, "entrance_balcony", 0, 8.5, 25.3, 12.8, 0.9);
  const portal = new THREE.Shape();
  portal.moveTo(-7.5, 3.2);
  portal.lineTo(-7.5, 15.9);
  portal.absarc(0, 15.9, 7.5, Math.PI, 0, true);
  portal.lineTo(7.5, 3.2);
  portal.lineTo(6.4, 3.2);
  portal.lineTo(6.4, 15.9);
  portal.absarc(0, 15.9, 6.4, 0, Math.PI, false);
  portal.lineTo(-6.4, 3.2);
  portal.closePath();
  b.add(
    "great_arch_frame",
    "white",
    new THREE.ExtrudeGeometry(portal, {
      depth: 0.8,
      bevelEnabled: false,
      curveSegments: 24,
    }),
    0,
    0,
    23.5,
  );
  const fanlight = new THREE.Shape();
  fanlight.moveTo(-6.1, 9);
  fanlight.lineTo(-6.1, 15.9);
  fanlight.absarc(0, 15.9, 6.1, Math.PI, 0, true);
  fanlight.lineTo(6.1, 9);
  fanlight.closePath();
  b.add(
    "arched_upper_front_glass",
    "glass",
    new THREE.ShapeGeometry(fanlight, 24),
    0,
    0,
    23.35,
  );
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * Math.PI;
    ellipsoid(
      b,
      "fanlight_mosaic_rosettes",
      "cream",
      Math.cos(a) * 4.75,
      15.9 + Math.sin(a) * 4.75,
      23.45,
      0.18,
      0.18,
      0.06,
    );
  }
  for (const x of [-4, 0, 4])
    column(b, "upper_portico_columns", x, 9.1, 24, 6, 0.23);
  const arch: number[][] = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI;
    arch.push([Math.cos(a) * 7.1, 15.9 + Math.sin(a) * 7.1, 24.3]);
  }
  curve(b, "great_arch_moulding", "white", arch, 0.22, 32, 6);
  const innerArch = arch.map(([x, y, z]) => [
    x * 0.85,
    15.9 + (y - 15.9) * 0.85,
    z + 0.03,
  ]);
  curve(b, "great_arch_inner_moulding", "cream", innerArch, 0.16, 32, 5);
  for (const side of [-1, 1]) {
    column(b, "paired_portico_columns", side * 6.7, 3.1, 23.9, 12.8, 0.35);
    column(b, "paired_portico_columns", side * 7.6, 3.1, 23.9, 12.8, 0.35);
    for (let i = 0; i < 4; i++)
      ellipsoid(
        b,
        "facade_reliefs",
        "white",
        side * 9.05,
        5.5 + i * 2.8,
        23.7,
        0.3,
        0.6,
        0.15,
      );
  }
  ellipsoid(b, "pediment_crest", "cream", 0, 23.1, 23.7, 0.9, 1.2, 0.25);
  b.cylinder("crest_finial", "white", 0, 24.5, 23.5, 0.1, 0.2, 1.2, 8);
  b.box("base_cornice", "white", 0, 3.2, 23.4, 28.6, 0.35, 0.8);
  return b.finish(29, 62);
}

function bitexco(): LandmarkAsset {
  const b = new LandmarkBuilder("bitexco");
  const sides = 48;
  const point = (t: number, a: number) => {
    const taper = 1 - 0.28 * t - 0.36 * Math.pow(t, 6);
    return [
      Math.cos(a) * 23.5 * taper,
      t * (250 + 12.5 * Math.cos(a)),
      Math.sin(a) * 18.2 * taper - 2 * t,
    ];
  };
  const positions: number[] = [];
  for (let level = 0; level < 68; level++)
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2,
        next = ((j + 1) / sides) * Math.PI * 2;
      const p = point(level / 68, a),
        q = point(level / 68, next),
        r = point((level + 1) / 68, a),
        s = point((level + 1) / 68, next);
      for (const v of [p, r, q, q, r, s]) positions.push(...v);
    }
  for (let j = 0; j < sides; j++) {
    const a = point(1, (j / sides) * Math.PI * 2),
      c = point(1, ((j + 1) / sides) * Math.PI * 2);
    positions.push(0, 250, -2, ...c, ...a);
  }
  const skin = new THREE.BufferGeometry();
  skin.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  skin.computeVertexNormals();
  b.add("tapered_lotus_glass_tower", "glass", skin);
  for (let floor = 1; floor <= 68; floor++) {
    const t = floor / 68,
      ribbon: number[] = [];
    for (let j = 0; j < sides; j++) {
      const a = point(t, (j / sides) * Math.PI * 2),
        c = point(t, ((j + 1) / sides) * Math.PI * 2);
      a[0] *= 1.004;
      a[2] = (a[2] + 2 * t) * 1.004 - 2 * t;
      c[0] *= 1.004;
      c[2] = (c[2] + 2 * t) * 1.004 - 2 * t;
      for (const p of [
        [a[0], a[1] - 0.1, a[2]],
        [a[0], a[1] + 0.1, a[2]],
        [c[0], c[1] - 0.1, c[2]],
        [c[0], c[1] - 0.1, c[2]],
        [a[0], a[1] + 0.1, a[2]],
        [c[0], c[1] + 0.1, c[2]],
      ])
        ribbon.push(...p);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(ribbon, 3));
    g.computeVertexNormals();
    b.add("horizontal_floor_bands", "metal", g);
  }
  for (let j = 0; j < 16; j++) {
    const a = (j / 16) * Math.PI * 2;
    curve(
      b,
      "vertical_facade_mullions",
      "metal",
      Array.from({ length: 12 }, (_, i) =>
        point(i / 11, a).map((n, index) => (index === 1 ? n : n * 1.007)),
      ),
      0.055,
      18,
      4,
    );
  }
  for (let floor = 0; floor < 4; floor++) {
    const g = new THREE.CylinderGeometry(1, 1, 3.5, 36);
    g.scale(30 - floor * 1.2, 1, 25 - floor * 0.8);
    b.add(
      "retail_podium",
      floor % 2 ? "glass" : "metal",
      g,
      0,
      1.75 + floor * 3.5,
      -1,
    );
  }
  const pad = new THREE.CylinderGeometry(15.6, 12.5, 2.2, 40);
  pad.scale(1.08, 1, 1);
  b.add("cantilevered_helipad", "white", pad, 0, 191, 28);
  const deck = new THREE.CylinderGeometry(15, 15, 0.18, 40);
  deck.scale(1.08, 1, 1);
  b.add("helipad_landing_surface", "dark", deck, 0, 192.2, 28);
  for (const x of [-4, 4])
    b.box("helipad_H", "white", x, 192.32, 28, 1, 0.06, 11);
  b.box("helipad_H", "white", 0, 192.32, 28, 9, 0.06, 1);
  beam(b, "helipad_support", "metal", [-9, 182, 12], [-9, 190, 30], 1.2, 8);
  beam(b, "helipad_support", "metal", [9, 182, 12], [9, 190, 30], 1.2, 8);
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    b.cylinder(
      "helipad_safety_posts",
      "metal",
      Math.cos(a) * 16.1,
      192.7,
      28 + Math.sin(a) * 15,
      0.05,
      0.05,
      0.9,
      5,
    );
  }
  const railing: number[][] = [];
  for (let i = 0; i <= 36; i++)
    railing.push([
      Math.cos((i / 36) * Math.PI * 2) * 16.1,
      193.2,
      28 + Math.sin((i / 36) * Math.PI * 2) * 15,
    ]);
  curve(b, "helipad_perimeter", "metal", railing, 0.055, 48, 4);
  return b.finish(60, 70);
}

function cafeApartments(): LandmarkAsset {
  const b = new LandmarkBuilder("cafe-apartments");
  b.box("apartment_block", "cream", 0, 16, -2, 30.5, 32, 22);
  b.box("bookshop_ground_glazing", "glass", 0, 1.65, 9.1, 29.2, 3.1, 0.15);
  for (let i = 0; i < 10; i++)
    b.box(
      "ground_store_mullions",
      "white",
      -14 + i * 3.1,
      1.7,
      9.25,
      0.14,
      3.4,
      0.18,
    );
  b.box("ground_store_canopy", "white", 0, 3.55, 10, 31.7, 0.35, 5.5);
  const tones: Tone[] = ["white", "green", "red", "wood", "gold", "metal"];
  for (let floor = 1; floor <= 8; floor++) {
    const y = 3.6 + (floor - 1) * 3.55;
    b.box("balcony_floor_slabs", "stone", 0, y, 10.9, 31.3, 0.22, 4.2);
    for (let bay = 0; bay < 6; bay++) {
      const x = -12.7 + bay * 5.08,
        variant = (floor * 7 + bay * 11) % 6;
      b.box(
        "recessed_cafe_fronts",
        "glass",
        x,
        y + 1.55,
        9.16,
        4.65,
        2.75,
        0.14,
      );
      b.box(
        "balcony_dividers",
        "cream",
        x - 2.4,
        y + 1.65,
        10.9,
        0.18,
        3.25,
        4,
      );
      for (const dx of [-1, 1])
        b.box(
          "cafe_door_frames",
          tones[variant],
          x + dx * 1.1,
          y + 1.55,
          9.3,
          0.12,
          2.7,
          0.15,
        );
      b.box(
        "individual_cafe_signs",
        tones[variant],
        x,
        y + 2.7,
        12.95,
        3.9,
        0.55,
        0.15,
      );
      label(
        b,
        "individual_cafe_lettering",
        ["CAFE", "TRA", "42", "CAFE", "LA", "CAFE"][variant],
        variant === 0 || variant === 4 ? "dark" : "white",
        x,
        y + 2.56,
        13.06,
        0.27,
      );
      b.box(
        "balcony_top_rails",
        tones[(variant + 1) % 6],
        x,
        y + 1.08,
        12.95,
        4.85,
        0.12,
        0.15,
      );
      if (variant % 3 === 0)
        b.box(
          "balcony_solid_panels",
          tones[variant],
          x,
          y + 0.51,
          12.93,
          4.7,
          0.8,
          0.13,
        );
      else
        for (let post = 0; post < 9; post++)
          b.box(
            "balcony_rail_spindles",
            "dark",
            x - 2.25 + post * 0.56,
            y + 0.56,
            12.95,
            0.055,
            1,
            0.07,
          );
      if (variant % 2 === 0) {
        const awning = new THREE.BoxGeometry(4.65, 0.1, 2.8);
        awning.rotateX(-0.12);
        b.add(
          "patchwork_awnings",
          tones[(variant + 2) % 6],
          awning,
          x,
          y + 3.03,
          11.65,
        );
      }
      if ((bay + floor) % 3 !== 0) {
        const px = x + (bay % 2 ? 1.6 : -1.5);
        b.cylinder(
          "balcony_planters",
          "brick",
          px,
          y + 0.3,
          12.4,
          0.3,
          0.2,
          0.5,
          7,
        );
        ellipsoid(
          b,
          "balcony_greenery",
          "green",
          px,
          y + 0.8,
          12.4,
          0.48,
          0.6,
          0.38,
        );
        if (variant === 1)
          curve(
            b,
            "hanging_plants",
            "green",
            [
              [px, y + 1, 13],
              [px + 0.3, y + 0.3, 13.2],
              [px + 0.1, y - 0.45, 13.2],
            ],
            0.1,
            8,
            4,
          );
      }
      if (variant === 3)
        b.box(
          "wall_air_conditioners",
          "white",
          x + 1.75,
          y + 2,
          10.15,
          0.85,
          0.6,
          0.55,
        );
    }
  }
  b.box("rooftop_parapet", "cream", 0, 32.3, 10.8, 31.5, 0.75, 0.3);
  b.box("address_panel", "white", -13.8, 31.1, 13.06, 2.8, 1.6, 0.15);
  label(b, "address_42", "42", "dark", -13.8, 30.53, 13.2, 1.05);
  for (const x of [-11, 10])
    b.cylinder(
      "rooftop_water_tanks",
      "metal",
      x,
      33.25,
      -7,
      1.25,
      1.25,
      2.1,
      12,
    );
  return b.finish(32, 27);
}

function marketFrontPoint(t: number): [number, number] {
  const angle = (t - 0.5) * 1.9;
  return [Math.sin(angle) * 38, 13 + Math.cos(angle) * 12];
}

function market(): LandmarkAsset {
  const b = new LandmarkBuilder("dalat-market");
  const plan = new THREE.Shape();
  plan.moveTo(-32, 24);
  plan.lineTo(32, 24);
  plan.lineTo(32, -18);
  for (let i = 40; i >= 0; i--) {
    const [x, z] = marketFrontPoint(i / 40);
    plan.lineTo(x, -z);
  }
  plan.lineTo(-32, 24);
  plan.closePath();
  const mass = new THREE.ExtrudeGeometry(plan, {
    depth: 13.3,
    bevelEnabled: false,
    curveSegments: 10,
  });
  mass.rotateX(-Math.PI / 2);
  b.add("rounded_market_hall", "cream", mass);
  b.box("rear_market_wing", "cream", 0, 6, -19, 66, 12, 15);
  for (let i = 0; i < 36; i++) {
    const [x1, z1] = marketFrontPoint(i / 36),
      [x2, z2] = marketFrontPoint((i + 1) / 36);
    const x = (x1 + x2) / 2,
      z = (z1 + z2) / 2,
      width = Math.hypot(x2 - x1, z2 - z1) + 0.04;
    const rotation = -Math.atan2(z2 - z1, x2 - x1);
    b.box(
      "curved_louvred_glazing",
      "glass",
      x,
      9.55,
      z + 0.08,
      width,
      3.3,
      0.12,
      rotation,
    );
    b.box(
      "rounded_white_parapet",
      "white",
      x,
      13.35,
      z + 0.12,
      width,
      1.4,
      0.35,
      rotation,
    );
    b.box(
      "brick_spandrel_band",
      "brick",
      x,
      7,
      z + 0.12,
      width,
      1.6,
      0.28,
      rotation,
    );
    b.box(
      "curved_canopy_fascia",
      "white",
      x,
      5.55,
      z + 0.45,
      width,
      0.65,
      1.5,
      rotation,
    );
    for (let louvre = 0; louvre < 6; louvre++)
      b.box(
        "horizontal_sun_louvres",
        "white",
        x,
        8 + louvre * 0.43,
        z + 0.2,
        width,
        0.09,
        0.3,
        rotation,
      );
    b.box(
      "vertical_sun_fins",
      "white",
      x1,
      9.6,
      z1 + 0.22,
      0.12,
      3.6,
      0.55,
      rotation,
    );
  }
  b.box("market_name_backing", "white", 0, 13.25, 25.4, 21, 1.55, 0.22);
  label(b, "market_name", "CHO DA LAT", "red", 0, 12.75, 25.55, 1.12);
  b.box("central_entry_shadow", "dark", 0, 2.7, 25.05, 12.5, 5.3, 0.15);
  for (const x of [-5.5, 0, 5.5])
    b.box("market_entry_pillars", "white", x, 2.5, 25.7, 0.45, 5, 0.8);
  for (let i = 0; i < 5; i++)
    b.box(
      "market_entry_steps",
      "stone",
      0,
      0.09 + i * 0.09,
      28.1 - i * 0.5,
      14,
      0.18 + i * 0.18,
      0.7,
    );
  for (let i = 0; i < 10; i++) {
    const t = (i + 0.5) / 10,
      [x, z] = marketFrontPoint(t);
    if (Math.abs(x) < 8) continue;
    const [nextX, nextZ] = marketFrontPoint(t + 0.001),
      rotation = -Math.atan2(nextZ - z, nextX - x);
    b.box(
      "market_stall_doors",
      "wood",
      x,
      1.6,
      z + 0.1,
      4.9,
      3.2,
      0.15,
      rotation,
    );
    b.box(
      "green_market_canopies",
      "green",
      x,
      3.7,
      z + 1.25,
      5.5,
      0.22,
      2.8,
      rotation,
    );
    b.box("produce_counters", "wood", x, 0.7, z + 1.7, 3.9, 1.1, 0.8, rotation);
    for (let pile = 0; pile < 3; pile++)
      ellipsoid(
        b,
        "produce_and_flowers",
        pile % 2 ? "gold" : "green",
        x - 1.25 + pile * 1.25,
        1.45,
        z + 1.8,
        0.55,
        0.3,
        0.3,
      );
  }
  b.box("roof_terrace", "stone", 0, 13.6, -2, 58, 0.25, 38);
  b.box("upper_ventilation_range", "cream", 0, 15.2, -9, 41, 3, 14);
  b.roof("low_market_roof", "roof", 0, 16.8, -9, 43, 15, 1.9, 0);
  for (let i = 0; i < 13; i++)
    b.box(
      "upper_ventilation_windows",
      "glass",
      -18 + i * 3,
      15.25,
      -1.9,
      1.7,
      1.45,
      0.12,
    );
  return b.finish(66, 56);
}

function hoaBinh(): LandmarkAsset {
  const b = new LandmarkBuilder("hoa-binh-theatre");
  b.box("cinema_auditorium", "cream", 0, 5.4, -3.5, 27, 10.8, 43);
  b.roof("low_cinema_roof", "metal", 0, 10.9, -4, 28, 44, 1.2, 0);
  b.box("modernist_front_parapet", "stone", 0, 9, 19, 29, 6.6, 2);
  b.box("front_sign_panel", "cream", 0, 7.3, 20.1, 25, 4.1, 0.2);
  label(b, "cinema_name", "HOA BINH", "green", -2, 9.75, 20.25, 1.05);
  b.box("right_sign_tower", "stone", 9.4, 13.9, 17.5, 4.4, 18.4, 4.8);
  b.box(
    "tower_white_vertical_fin",
    "white",
    6.85,
    14.5,
    18.8,
    0.55,
    19.5,
    0.55,
  );
  b.box("tower_relief_panel", "cream", 9.4, 18.2, 20.05, 3.6, 8.6, 0.13);
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? 0.42 : 1;
    const x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    if (i) star.lineTo(x, y);
    else star.moveTo(x, y);
  }
  star.closePath();
  b.add(
    "tower_star",
    "gold",
    new THREE.ExtrudeGeometry(star, { depth: 0.1, bevelEnabled: false }),
    9.4,
    20.8,
    20.2,
  );
  label(b, "tower_city_name", "DA LAT", "gold", 9.4, 16.6, 20.22, 0.7);
  for (let i = 0; i < 6; i++)
    b.box(
      "tower_horizontal_relief",
      "white",
      9.4,
      14 + i * 0.55,
      20.2,
      2.5,
      0.1,
      0.12,
    );
  b.box("continuous_marquee", "white", 0, 4.3, 22, 32, 0.3, 8);
  b.box("cinema_front_recess", "dark", 0, 2, 20.15, 27, 4, 0.15);
  for (let i = 0; i < 9; i++)
    b.box(
      "front_colonnade",
      "white",
      -14.4 + i * 3.6,
      2.12,
      25.35,
      0.26,
      4.25,
      0.3,
    );
  for (let i = 0; i < 7; i++) {
    const z = -21 + i * 6.4;
    b.box("side_glazing_band", "glass", -13.6, 5.9, z, 0.15, 2.2, 5.8);
    for (let l = 0; l < 5; l++)
      b.box(
        "side_horizontal_louvres",
        "white",
        -13.78,
        5.05 + l * 0.43,
        z,
        0.22,
        0.1,
        6,
      );
    b.box("side_shop_shutters", "green", -13.7, 1.7, z, 0.15, 3.2, 5.3);
    b.box("side_shop_canopies", "green", -14.5, 3.7, z, 2.1, 0.16, 6.1);
  }
  b.box("entrance_platform", "stone", 0, 0.2, 22, 32, 0.4, 8.4);
  return b.finish(33, 52);
}

function dragonBridge(
  ground: (x: number, z: number) => number = () => 0,
): LandmarkAsset {
  const b = new LandmarkBuilder("dragon-bridge");
  // The mapped approaches extend beyond the 666 m structural span.
  const span = (
    name: string,
    tone: Tone,
    y: number,
    z: number,
    h: number,
    d: number,
  ) => b.add(name, tone, new THREE.BoxGeometry(762, h, d, 64, 1, 1), 40, y, z);
  span("bridge_deck", "stone", 7.8, 0, 1.4, 37.5);
  for (const side of [-1, 1]) {
    span("carriageways", "dark", 8.55, side * 8.2, 0.12, 14.8);
    span("raised_sidewalks", "stone", 8.67, side * 17.2, 0.35, 2.6);
    span("bridge_railing_top", "metal", 9.7, side * 18.55, 0.1, 0.1);
    for (let x = -336; x <= 416; x += 8)
      b.box("bridge_railing_posts", "metal", x, 9.2, side * 18.55, 0.1, 1, 0.1);
    for (let x = -336; x <= 408; x += 12)
      for (const lane of [5.8, 10.5])
        b.box("lane_dashes", "white", x, 8.63, side * lane, 4, 0.025, 0.12);
  }
  const bodyY = (x: number) =>
    11 + 18 * Math.pow(Math.sin(((x + 290) / 185) * Math.PI), 2);
  const bodyPoints = Array.from({ length: 57 }, (_, i) => {
    const x = -290 + i * 10;
    return [x, bodyY(x), 0];
  });
  for (let tube = 0; tube < 5; tube++) {
    const angle = (tube * Math.PI) / 4;
    const yOffset = Math.sin(angle) * 2.2,
      zOffset = Math.cos(angle) * 3.7;
    curve(
      b,
      "five_yellow_dragon_arch_tubes",
      "gold",
      bodyPoints.map(([x, y]) => [x, y + yOffset, zOffset]),
      0.62,
      112,
      6,
    );
  }
  for (let x = -282; x < 270; x += 8) {
    const y = bodyY(x);
    const hoop: number[][] = [];
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI;
      hoop.push([x, y + Math.sin(a) * 2.2, Math.cos(a) * 3.7]);
    }
    curve(b, "dragon_rib_spider_frames", "gold", hoop, 0.15, 8, 4);
    for (const side of [-1, 1])
      beam(
        b,
        "arch_suspenders",
        "metal",
        [x, 8.6, side * 3],
        [x, y, side * 3.7],
        0.09,
        5,
      );
    if (x % 24 === -18) continue;
    b.cylinder("dragon_dorsal_scales", "gold", x, y + 4.3, 0, 0, 1.2, 3.9, 3);
  }
  for (const x of [-280, -95, 90, 275]) {
    b.box("river_pier_capitals", "stone", x, 6.5, 0, 9, 1.4, 31);
    for (const side of [-1, 1])
      b.cylinder("river_piers", "stone", x, 3.2, side * 9, 2.7, 3.2, 6.4, 10);
  }
  curve(
    b,
    "rising_dragon_neck",
    "gold",
    [
      [265, bodyY(265), 0],
      [280, 18, 0],
      [291, 23, 0],
      [305, 23.5, 0],
    ],
    3.8,
    20,
    8,
  );
  ellipsoid(b, "dragon_head", "gold", 309, 24, 0, 9.5, 5.2, 4.8);
  b.box("dragon_open_mouth", "dark", 318.1, 22.8, 0, 5.8, 2.6, 6.8);
  ellipsoid(b, "dragon_upper_muzzle", "gold", 319.3, 25.1, 0, 7, 1.3, 4);
  ellipsoid(b, "dragon_lower_jaw", "gold", 319.2, 21.5, 0, 6.5, 0.8, 3.8);
  for (const side of [-1, 1]) {
    ellipsoid(
      b,
      "dragon_eyes",
      "dark",
      311.4,
      27,
      side * 4.4,
      1.65,
      1.05,
      0.28,
    );
    ellipsoid(
      b,
      "dragon_eye_glints",
      "white",
      312,
      27.2,
      side * 4.67,
      0.45,
      0.42,
      0.08,
    );
    curve(
      b,
      "dragon_horns",
      "gold",
      [
        [305, 27, side * 3],
        [301, 32, side * 4.5],
        [295, 34.5, side * 5.1],
        [298, 31.5, side * 6.2],
      ],
      0.5,
      13,
      6,
    );
    curve(
      b,
      "dragon_whiskers",
      "gold",
      [
        [318, 23.8, side * 3],
        [323, 24.4, side * 5.4],
        [326, 27, side * 5.6],
      ],
      0.18,
      12,
      5,
    );
    for (let scale = 0; scale < 6; scale++) {
      const x = 295 + scale * 3.1;
      beam(
        b,
        "head_mane_plates",
        "gold",
        [x, 23, side * 3.7],
        [x - 5, 28 + (scale % 2), side * 5.7],
        0.45,
        5,
      );
    }
  }
  curve(
    b,
    "tapered_tail",
    "gold",
    [
      [-289, 12, 0],
      [-302, 13, 0],
      [-315, 16, 0],
      [-328, 22, 0],
    ],
    1.3,
    20,
    6,
  );
  for (const side of [-1, 1])
    curve(
      b,
      "tail_fins",
      "gold",
      [
        [-314, 16, 0],
        [-324, 21, side * 3.3],
        [-331, 27, side * 4.5],
      ],
      0.55,
      12,
      5,
    );
  for (let x = -310; x < 320; x += 42)
    for (const side of [-1, 1]) {
      b.cylinder(
        "bridge_lamp_posts",
        "metal",
        x,
        12.1,
        side * 16.3,
        0.075,
        0.14,
        7,
        6,
      );
      beam(
        b,
        "bridge_lamp_arms",
        "metal",
        [x, 15.5, side * 16.3],
        [x + 2, 15.7, side * 14.4],
        0.08,
        5,
      );
      b.box("bridge_lamps", "white", x + 2, 15.7, side * 14.4, 1.2, 0.22, 0.5);
    }
  const asset = b.finish(762, 37.5);
  for (const object of asset.root.children as (
    | THREE.Mesh
    | THREE.LineSegments
  )[]) {
    const p = object.geometry.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i);
      if (x >= -265 && x <= 333) continue;
      const end = x < -265 ? -341 : 421;
      const start = x < -265 ? -265 : 333;
      const t = THREE.MathUtils.clamp((x - start) / (end - start), 0, 1);
      const offset = (ground(end, z) + 0.3 - 8.61) * t * t * (3 - 2 * t);
      p.setY(i, Math.max(ground(x, z), p.getY(i) + offset));
    }
    if (object instanceof THREE.Mesh) object.geometry.computeVertexNormals();
    object.geometry.computeBoundingBox();
    object.geometry.computeBoundingSphere();
  }
  asset.height = (
    asset.root.children[0] as THREE.Mesh
  ).geometry.boundingBox!.max.y;
  return asset;
}

export function makeUrbanLandmark(
  kind: string,
  ground?: (x: number, z: number) => number,
): LandmarkAsset | undefined {
  switch (kind) {
    case "saigon-city-hall":
      return cityHall();
    case "saigon-opera":
      return opera();
    case "bitexco":
      return bitexco();
    case "cafe-apartments":
      return cafeApartments();
    case "dalat-market":
      return market();
    case "hoa-binh-theatre":
      return hoaBinh();
    case "dragon-bridge":
      return dragonBridge(ground);
    default:
      return undefined;
  }
}
