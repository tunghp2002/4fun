import * as THREE from "three";
import { LandmarkBuilder, type LandmarkAsset, type Tone } from "./geometry";

function stairs(
  b: LandmarkBuilder,
  name: string,
  x: number,
  z: number,
  width: number,
  height: number,
  steps: number,
  direction = -1,
) {
  for (let i = 0; i < steps; i++) {
    const h = (height * (i + 1)) / steps;
    b.box(
      `${name}_tread_${i}`,
      "stone",
      x,
      h / 2,
      z + direction * i * 0.34,
      width,
      h,
      0.36,
    );
  }
  for (const side of [-1, 1])
    b.tube(
      `${name}_balustrade`,
      "cream",
      [
        [x + (side * width) / 2, 0.55, z + 0.2],
        [x + (side * width) / 2, height + 0.55, z + direction * steps * 0.34],
      ],
      0.12,
    );
}

function railing(
  b: LandmarkBuilder,
  name: string,
  x: number,
  y: number,
  z: number,
  width: number,
  alongZ = false,
  tone: Tone = "cream",
) {
  const count = Math.ceil(width / 1.3);
  for (let i = 0; i <= count; i++) {
    const offset = -width / 2 + (width * i) / count;
    b.box(
      `${name}_baluster`,
      tone,
      x + (alongZ ? 0 : offset),
      y + 0.45,
      z + (alongZ ? offset : 0),
      0.13,
      0.9,
      0.13,
    );
  }
  b.box(
    `${name}_handrail`,
    tone,
    x,
    y + 0.93,
    z,
    alongZ ? 0.2 : width + 0.2,
    0.16,
    alongZ ? width + 0.2 : 0.2,
  );
  b.box(
    `${name}_sill`,
    tone,
    x,
    y + 0.12,
    z,
    alongZ ? 0.22 : width + 0.2,
    0.18,
    alongZ ? width + 0.2 : 0.22,
  );
}

function pillars(
  b: LandmarkBuilder,
  name: string,
  x: number,
  z: number,
  width: number,
  depth: number,
  floor: number,
  height: number,
  bays = 5,
  tone: Tone = "red",
) {
  for (const side of [-1, 1]) {
    for (let i = 0; i <= bays; i++) {
      const px = x - width / 2 + (i * width) / bays;
      b.cylinder(
        `${name}_column`,
        tone,
        px,
        floor + height / 2,
        z + (side * depth) / 2,
        0.15,
        0.19,
        height,
        10,
      );
      b.cylinder(
        `${name}_column_foot`,
        "stone",
        px,
        floor + 0.1,
        z + (side * depth) / 2,
        0.28,
        0.3,
        0.2,
        10,
      );
      b.box(
        `${name}_capital`,
        "gold",
        px,
        floor + height - 0.15,
        z + (side * depth) / 2,
        0.42,
        0.17,
        0.42,
      );
    }
    b.box(
      `${name}_beam`,
      tone,
      x,
      floor + height,
      z + (side * depth) / 2,
      width + 0.5,
      0.28,
      0.28,
    );
  }
  for (const side of [-1, 1])
    b.box(
      `${name}_side_beam`,
      tone,
      x + (side * width) / 2,
      floor + height,
      z,
      0.25,
      0.28,
      depth,
    );
}

function ridge(
  b: LandmarkBuilder,
  name: string,
  tone: Tone,
  points: [number, number, number][],
  radius: number,
  segments = 8,
  sides = 4,
) {
  const path = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
  );
  b.add(
    name,
    tone,
    new THREE.TubeGeometry(path, segments, radius, sides, false),
  );
}

function roof(
  b: LandmarkBuilder,
  name: string,
  x: number,
  y: number,
  z: number,
  width: number,
  depth: number,
  rise: number,
  tone: Tone = "gold",
  dragon = true,
) {
  b.roof(name, tone, x, y, z, width, depth, rise, 0.24);
  b.box(
    `${name}_eave_fascia`,
    "wood",
    x,
    y - 0.08,
    z,
    width * 0.97,
    0.18,
    depth * 0.97,
  );
  // The lifted corner ridges give the roofs a readable silhouette at map scale.
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      ridge(
        b,
        `${name}_hip_ridge`,
        tone,
        [
          [x + sx * width * 0.26, y + rise + 0.1, z],
          [x + sx * width * 0.37, y + rise * 0.48, z + sz * depth * 0.27],
          [x + (sx * width) / 2, y + rise * 0.24 + 0.08, z + (sz * depth) / 2],
          [
            x + sx * (width / 2 + 0.18),
            y + rise * 0.34,
            z + sz * (depth / 2 + 0.14),
          ],
        ],
        0.085,
      );
    }
  const count = Math.min(34, Math.ceil(width / 0.65));
  for (let i = 0; i <= count; i++) {
    const u = (i * 2) / count - 1;
    for (const side of [-1, 1]) {
      const points: [number, number, number][] = [];
      for (let j = 0; j <= 6; j++) {
        const t = j / 6;
        points.push([
          x + u * ((width / 2) * (1 - t) + width * 0.26 * t),
          y +
            rise * t ** 0.75 +
            rise * 0.24 * Math.abs(u) ** 6 * (1 - t) ** 3 +
            0.03,
          z + ((side * depth) / 2) * (1 - t),
        ]);
      }
      ridge(b, `${name}_tile_course`, tone, points, 0.027, 6, 3);
    }
  }
  if (dragon)
    for (const side of [-1, 1]) {
      const end = x + side * width * 0.24;
      ridge(
        b,
        `${name}_dragon_ridge`,
        "gold",
        [
          [end - side * 1.25, y + rise + 0.2, z],
          [end - side * 0.6, y + rise + 0.45, z],
          [end - side * 0.3, y + rise + 0.85, z],
          [end, y + rise + 0.64, z],
        ],
        0.1,
      );
      b.sphere(
        `${name}_dragon_head`,
        "gold",
        end,
        y + rise + 0.69,
        z,
        0.19,
        0.17,
        0.15,
      );
    }
  if (dragon)
    b.sphere(
      `${name}_ridge_pearl`,
      "gold",
      x,
      y + rise + 0.3,
      z,
      0.2,
      0.22,
      0.2,
    );
}

function ngoMon() {
  const b = new LandmarkBuilder("Ngo_Mon_Five_Phoenix_Pavilion");
  const plinth = 5.8;
  for (const x of [-8, 0, 8])
    b.arch(
      "central_vaulted_passage",
      "stone",
      x,
      0,
      -6,
      8,
      plinth,
      16,
      x ? 3.1 : 3.7,
      4.4,
    );
  for (const x of [-15, 15])
    b.box("stone_platform_cheek", "stone", x, plinth / 2, -6, 6, plinth, 16);
  for (const side of [-1, 1]) {
    const x = side * 23.5;
    b.box("U_platform_back_wing", "stone", x, plinth / 2, -10, 11, plinth, 8);
    b.box("U_platform_front_wing", "stone", x, plinth / 2, 12, 11, plinth, 4);
    b.arch(
      "side_vaulted_passage",
      "stone",
      x,
      0,
      2,
      16,
      plinth,
      11,
      3.1,
      4.1,
      Math.PI / 2,
    );
    b.box(
      "upper_stone_wing_terrace",
      "cream",
      x,
      plinth + 0.13,
      0,
      11.3,
      0.26,
      28,
    );
    railing(
      b,
      "wing_outer_balustrade",
      side * 28.5,
      plinth + 0.25,
      0,
      27,
      true,
    );
    railing(b, "wing_front_balustrade", x, plinth + 0.25, 13.5, 10);
    stairs(b, "rear_access_stair", side * 16, -19, 3.6, plinth, 16, 1);
    for (const z of [-7, 7]) {
      pillars(b, "wing_open_pavilion", x, z, 8.6, 8, 6.15, 3.15, 3);
      roof(b, "wing_green_glazed_roof", x, 9.6, z, 11.4, 11, 2.1, "green");
    }
    pillars(
      b,
      "flanking_open_pavilion",
      side * 13.5,
      -5.5,
      7.5,
      10,
      6.15,
      3.6,
      3,
    );
    roof(
      b,
      "flanking_green_glazed_roof",
      side * 13.5,
      10.1,
      -5.5,
      11,
      13,
      2.1,
      "green",
    );
  }
  b.box("central_terrace_coping", "cream", 0, 6.05, -6, 36.3, 0.3, 16.3);
  railing(b, "central_front_balustrade", 0, 6.2, 1.8, 34);
  pillars(b, "central_lower_arcade", 0, -6, 16, 10, 6.25, 3.9, 6);
  roof(b, "central_lower_yellow_glazed_roof", 0, 10.45, -6, 20, 14, 2.3);
  b.box("upper_pavilion_red_wall", "red", 0, 12.85, -6, 10.2, 2.9, 6.6);
  pillars(b, "central_upper_pavilion", 0, -6, 11, 7.4, 11.8, 2.5, 4);
  for (const z of [-9.35, -2.65])
    for (const x of [-3.5, 0, 3.5]) {
      b.box("upper_latticed_window", "dark", x, 12.85, z, 2.3, 1.5, 0.1);
      for (let i = -2; i <= 2; i++)
        b.box(
          "window_lattice",
          "gold",
          x + i * 0.39,
          12.85,
          z + (z > -6 ? 0.07 : -0.07),
          0.06,
          1.5,
          0.08,
        );
    }
  roof(b, "central_upper_yellow_glazed_roof", 0, 14.3, -6, 14, 10, 2.25);
  pillars(b, "rear_connecting_gallery", 0, -11, 20, 3, 6.2, 3.1, 6);
  roof(
    b,
    "rear_connecting_green_roof",
    0,
    9.6,
    -11,
    23,
    5.5,
    1.5,
    "green",
    false,
  );
  return b.finish(58, 28);
}

function thaiHoa() {
  const b = new LandmarkBuilder("Thai_Hoa_Interlocked_Imperial_Halls");
  for (let i = 0; i < 3; i++)
    b.box(
      "imperial_stone_plinth",
      "stone",
      0,
      0.24 + i * 0.45,
      0,
      47 - i * 1.2,
      0.48,
      41 - i * 1.2,
    );
  for (const x of [-15, 0, 15])
    stairs(b, "ceremonial_front_stair", x, 23.5, x ? 4 : 6, 1.4, 7);
  b.box("rear_enclosed_hall", "wood", 0, 4.55, -7, 37, 6.1, 18);
  b.box("front_enclosed_hall", "wood", 0, 3.65, 10, 37, 4.4, 8);
  for (let i = -4; i <= 4; i++) {
    b.box(
      "front_red_lacquered_door",
      "red",
      i * 4.1,
      3.55,
      14.05,
      3.4,
      3.95,
      0.18,
    );
    for (const side of [-1, 1])
      b.box(
        "front_gold_door_frame",
        "gold",
        i * 4.1 + side * 1.75,
        3.55,
        14.18,
        0.11,
        4.1,
        0.18,
      );
    for (let j = -1; j <= 1; j++)
      b.box(
        "front_door_lattice",
        "gold",
        i * 4.1 + j * 0.8,
        4.7,
        14.18,
        0.06,
        1.3,
        0.1,
      );
  }
  for (const z of [-16.2, 2.2])
    for (let i = -4; i <= 4; i++) {
      b.box("red_lacquered_door", "red", i * 4.1, 3.6, z, 3.2, 4.3, 0.2);
      for (const side of [-1, 1])
        b.box(
          "gold_door_frame",
          "gold",
          i * 4.1 + side * 1.65,
          3.6,
          z,
          0.11,
          4.5,
          0.26,
        );
      b.box("door_transom", "gold", i * 4.1, 5.7, z, 3.4, 0.15, 0.24);
    }
  pillars(b, "front_red_column_arcade", 0, 10.2, 40, 12, 1.45, 4.6, 10);
  pillars(b, "rear_red_column_arcade", 0, -7, 40, 20, 1.45, 5.7, 10);
  b.box("front_gold_carved_frieze", "gold", 0, 5.8, 16.25, 40, 0.45, 0.3);
  for (let i = -9; i <= 9; i++)
    b.box(
      "painted_poetry_panel",
      i % 2 ? "red" : "cream",
      i * 2.05,
      5.82,
      16.43,
      1.75,
      0.29,
      0.06,
    );
  roof(b, "front_interlocked_yellow_tile_roof", 0, 6.25, 10, 46, 19, 3.05);
  roof(b, "rear_interlocked_yellow_tile_roof", 0, 7.5, -7, 46, 24, 3.8);
  b.box("interlocked_roof_valley", "gold", 0, 7.1, 1, 40, 0.4, 2);
  for (const side of [-1, 1]) {
    railing(b, "side_terrace_balustrade", side * 22.2, 1.4, 0, 35, true);
    for (let i = 0; i < 6; i++)
      b.box(
        "rank_marker_stele",
        "stone",
        side * 17,
        1.85,
        20 + i * 0.4,
        0.42,
        0.9,
        0.2,
      );
  }
  return b.finish(47, 41);
}

function hienLam() {
  const b = new LandmarkBuilder("Hien_Lam_Three_Storey_Pavilion");
  b.box("stone_pavilion_plinth", "stone", 0, 0.4, 0, 15, 0.8, 15);
  stairs(b, "pavilion_front_stair", 0, 9.8, 4.2, 0.8, 4);
  const tiers = [
    { width: 12.8, depth: 12.8, floor: 0.8, columns: 3.9, rise: 2 },
    { width: 9.5, depth: 9.5, floor: 6.95, columns: 3.1, rise: 1.5 },
    { width: 6.8, depth: 6.8, floor: 11.8, columns: 2.8, rise: 1.9 },
  ];
  tiers.forEach((tier, i) => {
    b.box(
      `tier_${i}_timber_floor`,
      "wood",
      0,
      tier.floor + 0.08,
      0,
      tier.width + 0.4,
      0.16,
      tier.depth + 0.4,
    );
    pillars(
      b,
      `tier_${i}_open_red_arcade`,
      0,
      0,
      tier.width,
      tier.depth,
      tier.floor,
      tier.columns,
      i ? 2 : 4,
    );
    if (i)
      for (const side of [-1, 1]) {
        railing(
          b,
          `tier_${i}_wood_balcony`,
          0,
          tier.floor,
          (side * tier.depth) / 2,
          tier.width,
          false,
          "red",
        );
        railing(
          b,
          `tier_${i}_wood_balcony`,
          (side * tier.width) / 2,
          tier.floor,
          0,
          tier.depth,
          true,
          "red",
        );
      }
    roof(
      b,
      `tier_${i}_curved_tile_roof`,
      0,
      tier.floor + tier.columns + 0.2,
      0,
      tier.width + 3.3,
      tier.depth + 3.3,
      tier.rise,
      "gold",
      i === 2,
    );
  });
  b.box("upper_pavilion_lacquered_core", "red", 0, 13.2, 0, 3.3, 2.7, 3.3);
  for (const side of [-1, 1])
    b.box("upper_doorway", "dark", 0, 13.1, side * 1.68, 1.5, 2.2, 0.12);
  return b.finish(15, 15);
}

function phuVanLau() {
  const b = new LandmarkBuilder("Phu_Van_Lau_Imperial_Proclamation_Pavilion");
  b.box("marble_square_plinth", "stone", 0, 0.61, 0, 12.23, 1.22, 12.23);
  b.box("marble_plinth_coping", "cream", 0, 1.24, 0, 12.4, 0.16, 12.4);
  stairs(b, "front_dragon_stair", 0, 8.2, 3.4, 1.3, 6);
  stairs(b, "rear_pavilion_stair", 0, -8.2, 3.4, 1.3, 6, 1);
  for (const side of [-1, 1]) {
    railing(b, "stone_side_platform_railing", side * 5.9, 1.3, 0, 11.5, true);
    for (const z of [-5.9, 5.9]) {
      railing(b, "stone_front_platform_railing", side * 3.9, 1.3, z, 3.9);
      b.box("stone_corner_pier", "cream", side * 5.9, 1.95, z, 0.42, 1.3, 0.42);
    }
    b.tube(
      "front_stair_dragon_balustrade",
      "cream",
      [
        [side * 1.85, 0.45, 8.3],
        [side * 1.85, 0.9, 7.8],
        [side * 1.85, 1.65, 6.6],
        [side * 1.85, 1.75, 6.25],
      ],
      0.16,
    );
    b.sphere(
      "stair_dragon_head",
      "cream",
      side * 1.85,
      0.58,
      8.35,
      0.23,
      0.22,
      0.29,
    );
  }
  pillars(b, "open_ground_storey", 0, 0, 9.5, 9.5, 1.3, 3.2, 3);
  for (const x of [-2.15, 2.15])
    for (const z of [-2.15, 2.15]) {
      b.cylinder(
        "continuous_red_timber_column",
        "red",
        x,
        4.9,
        z,
        0.17,
        0.22,
        7.2,
        10,
      );
      b.cylinder(
        "principal_column_stone_base",
        "stone",
        x,
        1.4,
        z,
        0.33,
        0.38,
        0.2,
        12,
      );
    }
  roof(
    b,
    "lower_yellow_curved_pavilion_roof",
    0,
    4.75,
    0,
    12.6,
    12.6,
    1.25,
    "gold",
    false,
  );
  b.box("upper_timber_floor", "wood", 0, 6.08, 0, 6.4, 0.18, 6.4);
  pillars(b, "upper_red_pavilion_arcade", 0, 0, 6, 6, 6.17, 2.35, 2);
  for (const side of [-1, 1]) {
    railing(b, "upper_wood_balcony", 0, 6.17, side * 3, 6, false, "red");
    railing(b, "upper_wood_balcony", side * 3, 6.17, 0, 6, true, "red");
    const face = new THREE.Shape();
    face.moveTo(-2.15, 0);
    face.lineTo(2.15, 0);
    face.lineTo(2.15, 2.35);
    face.lineTo(-2.15, 2.35);
    face.closePath();
    const opening = new THREE.Path();
    opening.absarc(0, 1.25, 0.63, 0, Math.PI * 2, true);
    face.holes.push(opening);
    const wall = new THREE.ExtrudeGeometry(face, {
      depth: 0.13,
      bevelEnabled: false,
      curveSegments: 20,
    });
    wall.translate(0, 0, -0.065);
    b.add(
      "upper_round_side_window_wall",
      "red",
      wall,
      side * 2.15,
      6.17,
      0,
      Math.PI / 2,
    );
    const rim: [number, number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i * Math.PI) / 12;
      rim.push([side * 2.23, 7.42 + Math.cos(a) * 0.65, Math.sin(a) * 0.65]);
    }
    ridge(b, "round_window_gold_rim", "gold", rim, 0.04, 24, 4);
    b.box(
      "front_upper_timber_panel",
      "red",
      side * 1.71,
      7.35,
      2.15,
      0.85,
      2.35,
      0.15,
    );
  }
  b.box("rear_upper_timber_wall", "red", 0, 7.35, -2.15, 4.3, 2.35, 0.15);
  b.box("front_open_window_lintel", "wood", 0, 8.4, 2.15, 4.3, 0.2, 0.2);
  b.box(
    "proclamation_pavilion_inscription",
    "gold",
    0,
    8.05,
    2.27,
    2.5,
    0.42,
    0.12,
  );
  roof(b, "upper_yellow_curved_pavilion_roof", 0, 8.7, 0, 8.3, 8.3, 1.25);
  return b.finish(12.23, 12.23);
}

function kyDai() {
  const b = new LandmarkBuilder("Ky_Dai_Three_Terrace_Flag_Tower");
  const terraces = [
    { w: 50, d: 50, y: 0, h: 5.6 },
    { w: 38, d: 38, y: 5.6, h: 5.8 },
    { w: 26, d: 26, y: 11.4, h: 6.1 },
  ];
  for (const [i, t] of terraces.entries()) {
    b.box(`bastion_terrace_${i}`, "stone", 0, t.y + t.h / 2, 0, t.w, t.h, t.d);
    b.box(
      `bastion_coping_${i}`,
      "cream",
      0,
      t.y + t.h,
      0,
      t.w + 0.4,
      0.3,
      t.d + 0.4,
    );
    for (const side of [-1, 1]) {
      b.box(
        "terrace_front_parapet",
        "stone",
        0,
        t.y + t.h + 0.65,
        (side * t.d) / 2,
        t.w,
        1.1,
        0.65,
      );
      b.box(
        "terrace_side_parapet",
        "stone",
        (side * t.w) / 2,
        t.y + t.h + 0.65,
        0,
        0.65,
        1.1,
        t.d,
      );
    }
  }
  b.cylinder("flagpole_stone_socket", "cream", 0, 18.15, 0, 1.5, 2.1, 1.3, 16);
  b.cylinder("flagpole_lower_shaft", "metal", 0, 28, 0, 0.3, 0.5, 20, 14);
  b.cylinder("flagpole_upper_shaft", "metal", 0, 45.7, 0, 0.16, 0.3, 15.4, 12);
  b.sphere("flagpole_finial", "gold", 0, 53.6, 0, 0.24, 0.32, 0.24);
  const points: number[] = [];
  const at = (u: number, v: number): [number, number, number] => [
    u * 7.5,
    52.9 - v * 5 - u * 0.65,
    Math.sin(u * Math.PI * 2.2) * 0.45,
  ];
  for (let x = 0; x < 12; x++)
    for (let y = 0; y < 5; y++)
      for (const [u, v] of [
        [x / 12, y / 5],
        [(x + 1) / 12, y / 5],
        [x / 12, (y + 1) / 5],
        [(x + 1) / 12, y / 5],
        [(x + 1) / 12, (y + 1) / 5],
        [x / 12, (y + 1) / 5],
      ])
        points.push(...at(u, v));
  const flag = new THREE.BufferGeometry();
  flag.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  b.add("Vietnam_red_flag", "red", flag);
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? 0.56 : 1.35;
    const x = Math.cos(angle) * r,
      y = Math.sin(angle) * r;
    if (i) star.lineTo(x, y);
    else star.moveTo(x, y);
  }
  star.closePath();
  for (const side of [-1, 1]) {
    const emblem = new THREE.ShapeGeometry(star),
      positions = emblem.getAttribute("position");
    for (let i = 0; i < positions.count; i++)
      positions.setZ(
        i,
        Math.sin(((positions.getX(i) + 3.75) / 7.5) * Math.PI * 2.2) * 0.45 +
          side * 0.025,
      );
    emblem.computeVertexNormals();
    b.add("Vietnam_gold_star", "gold", emblem, 3.75, 50.1);
  }
  return b.finish(50, 50);
}

function imperialGate() {
  const b = new LandmarkBuilder("Imperial_Arch_Gate");
  b.arch("central_open_arch", "cream", 0, 0, 0, 8, 5.5, 3, 3.2, 4.1);
  for (const side of [-1, 1]) {
    b.arch("side_open_arch", "cream", side * 6, 0, 0, 4.1, 4.4, 2.7, 1.9, 3);
    b.box("gateway_relief_panel", "red", side * 3, 3, 1.56, 0.9, 2.3, 0.12);
    b.box("gateway_sculpted_pier", "cream", side * 8.3, 2.5, 0, 0.75, 5, 3.2);
    roof(b, "side_gate_green_roof", side * 6, 4.5, 0, 4.8, 4, 1.15, "green");
  }
  b.box("main_gate_inscription", "red", 0, 5.2, 1.6, 3.7, 0.6, 0.13);
  roof(b, "main_gate_lower_roof", 0, 5.6, 0, 9.5, 5, 1.4);
  b.box("upper_gate_pavilion", "cream", 0, 7, 0, 4, 1.2, 2.6);
  roof(b, "main_gate_upper_roof", 0, 7.5, 0, 5.8, 4.2, 1.45);
  return b.finish(17, 3.2);
}

function imperialTemple() {
  const b = new LandmarkBuilder("Imperial_Ancestral_Courtyard_Halls");
  b.box("courtyard_paving", "stone", 0, 0.12, 0, 30, 0.24, 38);
  for (const z of [-11.5, 11.5]) {
    b.box("hall_stone_platform", "stone", 0, 0.5, z, 28, 0.75, 12);
    b.box("hall_red_timber_core", "red", 0, 2.95, z - 0.8, 23, 4.2, 8.3);
    pillars(b, "temple_red_arcade", 0, z, 25, 9, 0.85, 4.2, 8);
    for (let i = -3; i <= 3; i++) {
      b.box(
        "temple_door_recess",
        "dark",
        i * 3.2,
        2.6,
        z + 3.46,
        2.5,
        3.3,
        0.12,
      );
      b.box(
        "temple_door_gold_lintel",
        "gold",
        i * 3.2,
        4.25,
        z + 3.55,
        2.6,
        0.12,
        0.2,
      );
    }
    roof(b, "ancestral_hall_yellow_roof", 0, 5.35, z, 30.8, 13.4, 2.6);
  }
  for (const side of [-1, 1]) {
    pillars(b, "courtyard_side_gallery", side * 13.3, 0, 2.5, 12, 0.4, 2.7, 1);
    roof(
      b,
      "side_gallery_green_roof",
      side * 13.3,
      3.4,
      0,
      5,
      14,
      1.3,
      "green",
      false,
    );
  }
  stairs(b, "temple_entry_stair", 0, 20.3, 5, 0.9, 4);
  b.cylinder("courtyard_incense_urn", "dark", 0, 0.9, 1, 0.7, 0.45, 1.25, 12);
  b.tube(
    "urn_left_handle",
    "dark",
    [
      [-0.6, 1.2, 1],
      [-1, 1.5, 1],
      [-0.8, 1.7, 1],
    ],
    0.07,
  );
  b.tube(
    "urn_right_handle",
    "dark",
    [
      [0.6, 1.2, 1],
      [1, 1.5, 1],
      [0.8, 1.7, 1],
    ],
    0.07,
  );
  return b.finish(30, 38);
}

function japaneseBridge() {
  const b = new LandmarkBuilder("Chua_Cau_Covered_Bridge_And_Shrine");
  for (const x of [-6.7, 0, 6.7]) {
    b.box("stone_bridge_pier", "stone", x, 0.65, 0, 1.2, 1.3, 5.2);
    b.box("pier_capping", "cream", x, 1.3, 0, 1.45, 0.25, 5.6);
  }
  for (let i = -9; i <= 9; i++) {
    const y = 1.4 + 0.38 * (1 - (i / 9) ** 2);
    b.box(
      "curving_timber_bridge_deck",
      "wood",
      i * 0.93,
      y,
      0,
      0.95,
      0.25,
      4.3,
    );
  }
  for (const side of [-1, 1]) {
    b.box("side_cream_parapet", "cream", 0, 2.05, side * 2.15, 17.8, 1, 0.3);
    railing(
      b,
      "open_wooden_bridge_balustrade",
      0,
      2.5,
      side * 2.15,
      17,
      false,
      "wood",
    );
    for (let i = -4; i <= 4; i++) {
      b.cylinder(
        "bridge_red_timber_column",
        "red",
        i * 2.05,
        3.55,
        side * 1.95,
        0.12,
        0.15,
        3.8,
        8,
      );
      b.box(
        "wooden_bracket",
        "wood",
        i * 2.05,
        5.1,
        side * 1.95,
        0.55,
        0.2,
        0.4,
      );
    }
    b.box(
      "continuous_timber_eave_beam",
      "wood",
      0,
      5.4,
      side * 1.95,
      18,
      0.25,
      0.3,
    );
  }
  roof(
    b,
    "covered_bridge_curved_tile_roof",
    0,
    5.45,
    0,
    19,
    6,
    1.25,
    "roof",
    false,
  );
  b.box("north_temple_cream_walls", "cream", 0, 3.35, -3.55, 6.8, 3.6, 2.2);
  b.box("north_temple_red_shutters", "red", 0, 3.4, -2.38, 4.4, 2.3, 0.12);
  roof(b, "north_temple_shrine_roof", 0, 5.45, -3.65, 8, 4.3, 1.55, "roof");
  for (const side of [-1, 1])
    for (const z of [-1.7, 1.7]) {
      b.box(
        "bridge_guardian_pedestal",
        "stone",
        side * 8.6,
        2.1,
        z,
        0.62,
        0.75,
        0.62,
      );
      b.sphere(
        "bridge_guardian_body",
        "stone",
        side * 8.6,
        2.8,
        z,
        0.21,
        0.42,
        0.24,
      );
      b.sphere(
        "bridge_guardian_head",
        "stone",
        side * 8.6,
        3.17,
        z,
        0.2,
        0.2,
        0.2,
      );
    }
  return b.finish(18, 7);
}

function assemblyHall() {
  const b = new LandmarkBuilder("Hoi_An_Assembly_Hall_Courtyard");
  b.box("ceramic_courtyard_paving", "brick", 0, 0.12, 0, 22, 0.24, 31);
  b.arch(
    "central_ceremonial_gate",
    "red",
    0,
    0.2,
    12,
    6.5,
    4.8,
    1.25,
    2.7,
    3.7,
  );
  for (const side of [-1, 1]) {
    b.arch(
      "side_ceremonial_gate",
      "red",
      side * 5,
      0.2,
      12,
      3.5,
      3.75,
      1.25,
      1.7,
      2.9,
    );
    b.box(
      "gate_white_ceramic_panel",
      "cream",
      side * 2.4,
      2.85,
      12.68,
      0.8,
      2.6,
      0.13,
    );
    roof(b, "side_gate_tiled_roof", side * 5, 4.05, 12, 5, 3, 1, "green");
    b.box("courtyard_boundary_wall", "cream", side * 10.5, 1.1, 0, 0.35, 2, 30);
    b.box("side_gallery_wall", "cream", side * 8.7, 2.2, -2, 3, 3.9, 10);
    roof(
      b,
      "side_gallery_roof",
      side * 8.7,
      4.3,
      -2,
      4.5,
      12,
      1.3,
      "roof",
      false,
    );
    b.cylinder(
      "courtyard_ceramic_planter",
      "green",
      side * 4.5,
      0.6,
      1.5,
      0.7,
      0.5,
      0.7,
      12,
    );
    b.sphere(
      "courtyard_topiary",
      "green",
      side * 4.5,
      1.35,
      1.5,
      0.8,
      0.75,
      0.8,
    );
  }
  roof(b, "central_gate_double_eave_lower", 0, 5, 12, 8.8, 3.7, 1.2, "green");
  b.box("upper_gate_inscription_panel", "cream", 0, 6.2, 12, 3.4, 0.8, 1.4);
  roof(b, "central_gate_double_eave_upper", 0, 6.7, 12, 5.3, 3, 1.45, "green");
  b.box("main_hall_yellow_walls", "cream", 0, 3.05, -10.5, 17, 5.1, 7.5);
  pillars(b, "main_hall_red_arcade", 0, -9, 17.5, 9, 0.55, 4.8, 6);
  for (let i = -2; i <= 2; i++) {
    b.box(
      "dark_carved_timber_door",
      "wood",
      i * 3.15,
      2.7,
      -6.7,
      2.5,
      4.2,
      0.18,
    );
    b.box("red_door_frame", "red", i * 3.15, 4.8, -6.5, 2.7, 0.16, 0.3);
  }
  roof(
    b,
    "assembly_hall_ceramic_dragon_roof",
    0,
    5.65,
    -9.8,
    21.6,
    12,
    2.9,
    "roof",
  );
  b.cylinder(
    "ceremonial_incense_burner",
    "dark",
    0,
    0.9,
    -0.6,
    0.6,
    0.4,
    1.1,
    12,
  );
  for (const side of [-1, 1]) {
    b.cylinder("dragon_column", "green", side * 4, 2.3, 5.5, 0.18, 0.26, 4, 10);
    b.sphere(
      "dragon_column_pearl",
      "gold",
      side * 4,
      4.4,
      5.5,
      0.28,
      0.28,
      0.28,
    );
  }
  return b.finish(22, 31);
}

function ancientHouse() {
  const b = new LandmarkBuilder("Hoi_An_Timber_House_With_Open_Courtyard");
  b.box("long_narrow_stone_foundation", "stone", 0, 0.13, 0, 7, 0.26, 27);
  for (const z of [8, -8]) {
    b.box("yellow_plaster_house_body", "cream", 0, 2.4, z, 6.6, 4.5, 9.6);
    for (const side of [-1, 1]) {
      b.box("wooden_floor_band", "wood", side * 3.34, 2.8, z, 0.15, 0.18, 9.6);
      b.box(
        "side_timber_eave_beam",
        "wood",
        side * 3.4,
        4.8,
        z,
        0.22,
        0.24,
        10.4,
      );
    }
    roof(b, "yin_yang_tile_house_roof", 0, 4.9, z, 7.8, 11, 1.8, "roof", false);
  }
  for (const z of [12.85, 3.15, -3.15, -12.85]) {
    b.box("timber_door_backing", "dark", 0, 1.95, z, 5.7, 3.3, 0.1);
    for (let i = -3; i <= 3; i++) {
      b.box(
        "carved_timber_door_frame",
        "wood",
        i * 0.87,
        1.9,
        z + (z > 0 ? 0.08 : -0.08),
        0.12,
        3.2,
        0.19,
      );
      b.box("upper_timber_lattice", "wood", i * 0.87, 3.85, z, 0.1, 0.85, 0.18);
    }
    b.box("timber_carved_lintel", "wood", 0, 3.3, z, 6.3, 0.34, 0.25);
  }
  for (const side of [-1, 1]) {
    b.box(
      "courtyard_side_plaster_wall",
      "cream",
      side * 3.25,
      1.75,
      0,
      0.25,
      3.2,
      6.1,
    );
    pillars(
      b,
      "courtyard_side_veranda",
      side * 2.5,
      0,
      0.9,
      5.5,
      0.3,
      2.5,
      1,
      "wood",
    );
    b.roof("courtyard_side_lean_roof", "roof", side * 2.6, 3, 0, 1.8, 6.1, 0.6);
  }
  b.cylinder(
    "courtyard_water_jar",
    "green",
    -1,
    0.72,
    -0.4,
    0.37,
    0.44,
    0.9,
    12,
  );
  b.box("shop_front_signboard", "wood", 0, 4.1, 13, 3.4, 0.65, 0.2);
  for (const side of [-1, 1]) {
    b.tube(
      "lantern_hanger",
      "dark",
      [
        [side * 2.45, 4.9, 12.7],
        [side * 2.45, 4.45, 13.3],
      ],
      0.025,
    );
    b.sphere("front_red_lantern", "red", side * 2.45, 4, 13.3, 0.3, 0.42, 0.3);
    b.cylinder(
      "lantern_gold_tassel",
      "gold",
      side * 2.45,
      3.5,
      13.3,
      0.025,
      0.025,
      0.25,
      6,
    );
  }
  return b.finish(7, 27);
}

export function makeHeritageLandmark(kind: string): LandmarkAsset | undefined {
  switch (kind) {
    case "ngo-mon":
      return ngoMon();
    case "thai-hoa":
      return thaiHoa();
    case "hien-lam":
      return hienLam();
    case "phu-van-lau":
      return phuVanLau();
    case "ky-dai":
      return kyDai();
    case "imperial-gate":
      return imperialGate();
    case "imperial-temple":
      return imperialTemple();
    case "japanese-bridge":
      return japaneseBridge();
    case "assembly-hall":
      return assemblyHall();
    case "ancient-house":
      return ancientHouse();
    default:
      return undefined;
  }
}
