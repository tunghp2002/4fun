import * as THREE from "three";
import { LandmarkBuilder, type LandmarkAsset, type Tone } from "./geometry";

type Point = [number, number, number];

function beam(
  b: LandmarkBuilder,
  name: string,
  tone: Tone,
  a: Point,
  c: Point,
  width = 0.12,
  depth = width,
) {
  const from = new THREE.Vector3(...a),
    to = new THREE.Vector3(...c),
    direction = to.clone().sub(from);
  const geometry = new THREE.BoxGeometry(width, direction.length(), depth);
  geometry.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    ),
  );
  from.add(to).multiplyScalar(0.5);
  b.add(name, tone, geometry, from.x, from.y, from.z);
}

function circularWall(
  b: LandmarkBuilder,
  name: string,
  tone: Tone,
  x: number,
  bottom: number,
  z: number,
  w: number,
  h: number,
  d: number,
  r: number,
  centerY: number,
) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(w / 2, h);
  shape.lineTo(-w / 2, h);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, centerY, r, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: false,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -d / 2);
  b.add(name, tone, geometry, x, bottom, z);
}

function pointedArch(
  b: LandmarkBuilder,
  name: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  opening: number,
  openingH: number,
  depth = 0.45,
  tone: Tone = "stone",
  rotation = 0,
) {
  const r = opening / 2,
    spring = openingH * 0.68;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(-w / 2, h);
  shape.lineTo(w / 2, h);
  shape.lineTo(w / 2, 0);
  shape.lineTo(r, 0);
  shape.lineTo(r, spring);
  shape.quadraticCurveTo(r * 0.8, openingH * 0.88, 0, openingH);
  shape.quadraticCurveTo(-r * 0.8, openingH * 0.88, -r, spring);
  shape.lineTo(-r, 0);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -depth / 2);
  b.add(name, tone, geometry, x, y, z, rotation);
}

function pointedPane(
  b: LandmarkBuilder,
  name: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  tone: Tone = "glass",
) {
  const shape = new THREE.Shape(),
    r = w / 2;
  shape.moveTo(-r, 0);
  shape.lineTo(r, 0);
  shape.lineTo(r, h * 0.68);
  shape.quadraticCurveTo(r * 0.8, h * 0.88, 0, h);
  shape.quadraticCurveTo(-r * 0.8, h * 0.88, -r, h * 0.68);
  shape.closePath();
  b.add(name, tone, new THREE.ShapeGeometry(shape, 8), x, y, z);
}

function decoratedRoof(
  b: LandmarkBuilder,
  name: string,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  rise: number,
  tone: Tone = "roof",
) {
  b.roof(name, tone, x, y, z, w, d, rise, 0.32);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      b.tube(
        `${name}_upturned_corner_${sx}_${sz}`,
        "stone",
        [
          [x + sx * w * 0.24, y + rise * 0.36, z + sz * d * 0.27],
          [x + sx * w * 0.43, y + rise * 0.18, z + sz * d * 0.43],
          [x + sx * w * 0.52, y + rise * 0.42, z + sz * d * 0.52],
          [x + sx * w * 0.53, y + rise * 0.67, z + sz * d * 0.53],
        ],
        0.055,
      );
    }
  b.sphere(
    `${name}_ridge_pearl`,
    "cream",
    x,
    y + rise + 0.23,
    z,
    0.16,
    0.2,
    0.16,
  );
  for (const side of [-1, 1])
    b.tube(
      `${name}_ridge_dragon_${side}`,
      "stone",
      [
        [x + side * w * 0.06, y + rise + 0.16, z],
        [x + side * w * 0.16, y + rise + 0.4, z],
        [x + side * w * 0.25, y + rise + 0.15, z],
      ],
      0.07,
    );
}

function steps(
  b: LandmarkBuilder,
  name: string,
  x: number,
  z: number,
  w: number,
  count = 3,
  height = 0.18,
) {
  for (let i = 0; i < count; i++)
    b.box(
      `${name}_${i}`,
      "stone",
      x,
      height * (i + 0.5),
      z - i * 0.28,
      w,
      height,
      0.95 - i * 0.12,
    );
}

function hall(
  b: LandmarkBuilder,
  name: string,
  x: number,
  z: number,
  w: number,
  d: number,
  eave = 4,
) {
  b.box(`${name}_stone_platform`, "stone", x, 0.28, z, w + 1.1, 0.56, d + 1.1);
  b.box(
    `${name}_rear_wall`,
    "cream",
    x,
    eave / 2,
    z - d / 2 + 0.2,
    w,
    eave,
    0.4,
  );
  for (const side of [-1, 1])
    b.box(
      `${name}_gable_wall_${side}`,
      "cream",
      x + side * (w / 2 - 0.18),
      eave / 2,
      z,
      0.36,
      eave,
      d,
    );
  const bays = 5,
    front = z + d / 2 - 0.35;
  for (let i = 0; i <= bays; i++) {
    const px = x - w / 2 + 0.6 + ((w - 1.2) * i) / bays;
    b.cylinder(
      `${name}_red_column_${i}`,
      "red",
      px,
      (eave + 0.55) / 2,
      front + 0.4,
      0.14,
      0.18,
      eave - 0.55,
      10,
    );
    b.box(
      `${name}_column_foot_${i}`,
      "stone",
      px,
      0.68,
      front + 0.4,
      0.5,
      0.25,
      0.5,
    );
  }
  for (let i = 0; i < bays; i++) {
    const px = x - w / 2 + 0.6 + ((w - 1.2) * (i + 0.5)) / bays,
      bw = (w - 1.2) / bays - 0.24;
    b.box(
      `${name}_wood_door_${i}`,
      "wood",
      px,
      1.9,
      front - 0.5,
      bw,
      2.6,
      0.18,
    );
    for (let j = 0; j < 4; j++)
      b.box(
        `${name}_door_stile_${i}_${j}`,
        "red",
        px - bw * 0.37 + j * bw * 0.25,
        1.9,
        front - 0.39,
        0.045,
        2.5,
        0.05,
      );
    b.box(
      `${name}_transom_${i}`,
      "gold",
      px,
      3.5,
      front - 0.37,
      bw,
      0.14,
      0.07,
    );
  }
  b.box(
    `${name}_front_beam`,
    "red",
    x,
    eave - 0.15,
    front + 0.4,
    w,
    0.25,
    0.25,
  );
  decoratedRoof(b, `${name}_tile_roof`, x, eave, z, w + 2, d + 2, 2.2);
  b.box(
    `${name}_inscription_board`,
    "dark",
    x,
    3.3,
    front + 0.52,
    Math.min(3, w * 0.24),
    0.6,
    0.1,
  );
  for (let i = 0; i < 3; i++)
    b.box(
      `${name}_inscription_${i}`,
      "gold",
      x + (i - 1) * 0.45,
      3.3,
      front + 0.58,
      0.13,
      0.28,
      0.025,
    );
}

function turtleTower() {
  const b = new LandmarkBuilder("turtle-tower");
  b.box("stepped_stone_foundation", "stone", 0, 0.18, 0, 8, 0.36, 6);
  b.box("raised_pedestal", "white", 0, 0.56, 0, 7.1, 0.4, 5.2);
  for (const [level, w, d, bottom, height] of [
    [1, 6.28, 4.54, 0.8, 2.45],
    [2, 4.8, 3.64, 3.65, 2.05],
  ]) {
    const openingH = height * 0.84;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const x = ((i - 1) * w) / 3;
        pointedArch(
          b,
          `level_${level}_long_arch_${side}_${i}`,
          x,
          bottom,
          side * (d / 2 - 0.15),
          w / 3 + 0.015,
          height,
          w * 0.18,
          openingH,
          0.3,
          "white",
        );
      }
      for (let i = 0; i < 2; i++)
        pointedArch(
          b,
          `level_${level}_short_arch_${side}_${i}`,
          side * (w / 2 - 0.15),
          bottom,
          ((i - 0.5) * d) / 2,
          d / 2 + 0.015,
          height,
          d * 0.25,
          openingH,
          0.3,
          "white",
          Math.PI / 2,
        );
    }
    const y = bottom + height + 0.08;
    b.box(
      `level_${level}_projecting_cornice`,
      "stone",
      0,
      y,
      0,
      w + 0.58,
      0.2,
      d + 0.58,
    );
    for (const side of [-1, 1]) {
      for (let i = 0; i <= 10; i++)
        b.box(
          `level_${level}_long_baluster_${side}_${i}`,
          "white",
          -w / 2 + (i * w) / 10,
          y + 0.28,
          side * (d / 2 + 0.12),
          0.11,
          0.4,
          0.14,
        );
      b.box(
        `level_${level}_long_balustrade_${side}`,
        "white",
        0,
        y + 0.5,
        side * (d / 2 + 0.12),
        w + 0.2,
        0.13,
        0.18,
      );
      for (let i = 0; i <= 6; i++)
        b.box(
          `level_${level}_short_baluster_${side}_${i}`,
          "white",
          side * (w / 2 + 0.1),
          y + 0.28,
          -d / 2 + (i * d) / 6,
          0.14,
          0.4,
          0.11,
        );
      b.box(
        `level_${level}_short_balustrade_${side}`,
        "white",
        side * (w / 2 + 0.1),
        y + 0.5,
        0,
        0.18,
        0.13,
        d + 0.2,
      );
    }
  }
  circularWall(
    b,
    "top_pavilion_round_window",
    "white",
    0,
    6.15,
    0.82,
    2.97,
    1.45,
    0.25,
    0.34,
    0.68,
  );
  b.box("top_pavilion_back", "white", 0, 6.88, -0.82, 2.97, 1.45, 0.25);
  for (const side of [-1, 1])
    b.box(
      `top_pavilion_side_${side}`,
      "white",
      side * 1.36,
      6.88,
      0,
      0.25,
      1.45,
      1.9,
    );
  b.roof("curved_crown_roof", "stone", 0, 7.6, 0, 3.8, 2.9, 0.95, 0.36);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      b.tube(
        `crown_upturned_finial_${sx}_${sz}`,
        "white",
        [
          [sx * 1.5, 7.8, sz * 1.13],
          [sx * 1.96, 8.05, sz * 1.48],
          [sx * 2.02, 8.45, sz * 1.51],
        ],
        0.075,
      );
  b.box("crown_ridge", "white", 0, 8.67, 0, 1.9, 0.2, 0.22);
  return b.finish(6.28, 4.54);
}

function ngocSon() {
  const b = new LandmarkBuilder("ngoc-son");
  b.box("temple_courtyard", "stone", 0, 0.12, 0, 24, 0.24, 36);
  hall(b, "rear_sanctuary", 0, -11, 14.5, 5.7, 4.4);
  hall(b, "main_sanctuary", 0, -2.3, 18, 6.5, 4.8);
  hall(b, "front_worship_hall", 0, 7.1, 18, 5.5, 4.2);
  for (const side of [-1, 1]) {
    b.box(
      `courtyard_wall_${side}`,
      "cream",
      side * 11.4,
      1.2,
      -0.6,
      0.45,
      2.4,
      33,
    );
    b.box(
      `courtyard_wall_cap_${side}`,
      "roof",
      side * 11.4,
      2.45,
      -0.6,
      0.62,
      0.17,
      33.2,
    );
    for (let i = 0; i < 6; i++)
      b.cylinder(
        `corridor_post_${side}_${i}`,
        "red",
        side * 9.4,
        1.8,
        -13 + i * 4.6,
        0.11,
        0.13,
        3.1,
        8,
      );
    b.roof(
      `connecting_corridor_roof_${side}`,
      "roof",
      side * 9.7,
      3.4,
      -1.4,
      2.8,
      27,
      0.8,
    );
  }
  steps(b, "main_hall_steps", 0, 11, 7, 3);
  b.cylinder("incense_burner_bowl", "metal", 0, 1.35, 14.5, 0.8, 0.55, 0.7, 16);
  for (const x of [-0.48, 0.48])
    b.box(`incense_burner_leg_${x}`, "metal", x, 0.65, 14.5, 0.16, 0.7, 0.18);
  b.tube(
    "incense_burner_left_handle",
    "metal",
    [
      [-0.75, 1.4, 14.5],
      [-1.05, 1.8, 14.5],
      [-0.75, 1.9, 14.5],
    ],
    0.07,
  );
  b.tube(
    "incense_burner_right_handle",
    "metal",
    [
      [0.75, 1.4, 14.5],
      [1.05, 1.8, 14.5],
      [0.75, 1.9, 14.5],
    ],
    0.07,
  );
  return b.finish(24, 36);
}

function tranBa() {
  const b = new LandmarkBuilder("tran-ba");
  b.box("pavilion_stone_platform", "stone", 0, 0.35, 0, 7.4, 0.7, 7.4);
  b.box("pavilion_brick_platform_edge", "brick", 0, 0.75, 0, 7.45, 0.1, 7.45);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      b.cylinder(
        `outer_stone_column_${sx}_${sz}`,
        "stone",
        sx * 2.7,
        2.55,
        sz * 2.7,
        0.17,
        0.22,
        3.5,
        10,
      );
      b.box(
        `outer_column_base_${sx}_${sz}`,
        "cream",
        sx * 2.7,
        0.91,
        sz * 2.7,
        0.6,
        0.3,
        0.6,
      );
      b.cylinder(
        `inner_wood_column_${sx}_${sz}`,
        "red",
        sx * 1.65,
        3.1,
        sz * 1.65,
        0.14,
        0.17,
        4.6,
        10,
      );
      beam(
        b,
        `roof_brace_${sx}_${sz}`,
        "wood",
        [sx * 2.7, 3.4, sz * 2.7],
        [sx * 1.8, 4.3, sz * 1.8],
        0.15,
      );
    }
  for (const side of [-1, 1]) {
    b.box(
      `front_crossbeam_${side}`,
      "wood",
      0,
      4.18,
      side * 2.7,
      5.8,
      0.24,
      0.24,
    );
    b.box(
      `side_crossbeam_${side}`,
      "wood",
      side * 2.7,
      4.18,
      0,
      0.24,
      0.24,
      5.8,
    );
  }
  decoratedRoof(b, "lower_four_roofs", 0, 4.25, 0, 8.2, 8.2, 1.4);
  decoratedRoof(b, "upper_four_roofs", 0, 5.75, 0, 5.6, 5.6, 1.5);
  steps(b, "pavilion_front_steps", 0, 4.15, 2.7, 4);
  b.sphere("hanging_red_lantern", "red", 0, 3.8, 0, 0.3, 0.4, 0.3);
  return b.finish(8.7, 8.7);
}

function theHuc() {
  const b = new LandmarkBuilder("the-huc"),
    length = 45,
    width = 3.4;
  const deck = (z: number) =>
    1.0 + 1.65 * Math.sin(Math.PI * (z / length + 0.5));
  for (let i = 0; i < 90; i++) {
    const z = -length / 2 + ((i + 0.5) * length) / 90;
    const geometry = new THREE.BoxGeometry(width, 0.14, length / 90 - 0.015);
    geometry.rotateX(-Math.atan((deck(z + 0.1) - deck(z - 0.1)) / 0.2));
    b.add(`timber_deck_plank_${i}`, "wood", geometry, 0, deck(z), z);
  }
  for (let i = 0; i <= 15; i++) {
    const z = -length / 2 + (i * length) / 15,
      y = deck(z);
    for (const side of [-1, 1]) {
      b.cylinder(
        `paired_bridge_support_${i}_${side}`,
        "red",
        side * 1.4,
        (y - 0.15) / 2,
        z,
        0.18,
        0.2,
        y - 0.15,
        10,
      );
      b.box(
        `balustrade_post_${i}_${side}`,
        "red",
        side * 1.65,
        y + 0.63,
        z,
        0.17,
        1.3,
        0.17,
      );
      b.sphere(
        `post_cap_${i}_${side}`,
        "red",
        side * 1.65,
        y + 1.34,
        z,
        0.13,
        0.12,
        0.13,
      );
      if (i < 15) {
        const nz = z + length / 15,
          ny = deck(nz),
          x = side * 1.65;
        for (const h of [0.17, 0.7, 1.2])
          beam(
            b,
            `red_rail_${i}_${side}_${h}`,
            "red",
            [x, y + h, z],
            [x, ny + h, nz],
            0.13,
            0.14,
          );
        beam(
          b,
          `diagonal_brace_up_${i}_${side}`,
          "red",
          [x, y + 0.2, z],
          [x, ny + 1.12, nz],
          0.1,
        );
        beam(
          b,
          `diagonal_brace_down_${i}_${side}`,
          "red",
          [x, y + 1.12, z],
          [x, ny + 0.2, nz],
          0.1,
        );
        beam(
          b,
          `under_deck_beam_${i}_${side}`,
          "red",
          [side * 1.35, y - 0.25, z],
          [side * 1.35, ny - 0.25, nz],
          0.25,
          0.2,
        );
      }
    }
    b.box(`transverse_bridge_beam_${i}`, "red", 0, y - 0.2, z, 3.7, 0.25, 0.2);
  }
  return b.finish(3.9, length);
}

function penTower() {
  const b = new LandmarkBuilder("pen-tower");
  for (let ring = 0; ring < 4; ring++) {
    const count = 12 - ring * 2,
      radius = 4.3 - ring * 1.05;
    for (let i = 0; i < count; i++) {
      const angle = ((i + ring * 0.31) / count) * Math.PI * 2;
      const geometry = new THREE.IcosahedronGeometry(1, 0);
      geometry.scale(1.3 + 0.2 * Math.sin(i * 3), 0.9 + 0.1 * Math.cos(i), 1.1);
      geometry.rotateY(angle);
      geometry.rotateZ(i * 0.37);
      geometry.computeBoundingBox();
      geometry.translate(0, -(geometry.boundingBox?.min.y ?? 0), 0);
      b.add(
        `rock_mound_${ring}_${i}`,
        "stone",
        geometry,
        Math.sin(angle) * radius,
        ring * 0.72,
        Math.cos(angle) * radius,
      );
    }
  }
  for (let i = 0; i < 5; i++) {
    const w = 2 - i * 0.2,
      y = 4 + i * 1.45;
    b.box(`square_stone_tier_${i + 1}`, "stone", 0, y + 0.68, 0, w, 1.36, w);
    b.box(
      `tier_projecting_cornice_${i + 1}`,
      "cream",
      0,
      y + 1.4,
      0,
      w + 0.24,
      0.14,
      w + 0.24,
    );
    if (i < 3) {
      b.box(
        `vertical_red_inscription_${i}`,
        "red",
        0,
        y + 0.7,
        w / 2 + 0.01,
        0.12,
        0.65,
        0.025,
      );
      b.box(
        `inscription_cross_stroke_${i}`,
        "red",
        0,
        y + 0.74,
        w / 2 + 0.025,
        0.48,
        0.1,
        0.035,
      );
    }
  }
  b.cylinder("brush_handle_collar", "dark", 0, 11.4, 0, 0.42, 0.55, 0.45, 8);
  b.cylinder("pointed_writing_brush", "stone", 0, 12.05, 0, 0, 0.43, 1.0, 8);
  return b.finish(12, 12);
}

function inkstone() {
  const b = new LandmarkBuilder("inkstone");
  b.arch("walk_through_stone_arch", "cream", 0, 0, 0, 4.2, 3.8, 1.25, 1.8, 2.9);
  for (const side of [-1, 1]) {
    b.box(`gate_side_wall_${side}`, "cream", side * 3, 1.3, 0, 2, 2.6, 0.65);
    b.box(
      `gate_side_panel_${side}`,
      "stone",
      side * 3,
      1.55,
      0.35,
      1.5,
      1.5,
      0.07,
    );
    b.box(`gate_column_${side}`, "stone", side * 2, 2, 0, 0.5, 4, 1.4);
    b.box(
      `red_door_leaf_${side}`,
      "red",
      side * 1.05,
      1.3,
      -0.2,
      0.2,
      2.6,
      1.7,
      side * 0.65,
    );
  }
  b.roof("gate_stone_coping", "stone", 0, 3.8, 0, 4.9, 2, 0.55);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    b.sphere(
      `inkstone_frog_body_${i}`,
      "stone",
      Math.sin(a) * 0.37,
      4.5,
      Math.cos(a) * 0.28,
      0.19,
      0.13,
      0.19,
    );
    b.sphere(
      `inkstone_frog_head_${i}`,
      "stone",
      Math.sin(a) * 0.5,
      4.58,
      Math.cos(a) * 0.39,
      0.13,
      0.1,
      0.12,
    );
  }
  b.sphere("peach_shaped_ink_bowl", "stone", 0, 4.72, 0, 0.64, 0.17, 0.5);
  b.sphere("hollow_ink_bowl_interior", "dark", 0, 4.83, 0, 0.5, 0.045, 0.36);
  return b.finish(8, 2.3);
}

function dacNguyet() {
  const b = new LandmarkBuilder("dac-nguyet");
  b.arch("lower_gateway_arch", "cream", 0, 0, 0, 4.6, 3.7, 1.8, 2.1, 2.9);
  for (const side of [-1, 1]) {
    b.box(`gateway_pier_${side}`, "stone", side * 2.15, 2.1, 0.1, 0.45, 4.2, 2);
    b.box(
      `gateway_wing_${side}`,
      "cream",
      side * 3.45,
      1.55,
      0,
      2.2,
      3.1,
      0.65,
    );
    b.box(
      `painted_relief_panel_${side}`,
      "glass",
      side * 3.45,
      1.7,
      0.36,
      1.7,
      1.9,
      0.07,
    );
    b.tube(
      `wing_cloud_relief_${side}`,
      "gold",
      [
        [side * 3, 1.1, 0.43],
        [side * 3.7, 1.7, 0.43],
        [side * 3.2, 2.3, 0.43],
      ],
      0.06,
    );
    b.box(`wing_merlon_${side}`, "stone", side * 4.6, 3.1, 0, 0.4, 0.5, 0.8);
  }
  b.box("upper_pavilion_floor", "stone", 0, 3.8, 0, 5, 0.25, 2.6);
  circularWall(
    b,
    "moon_viewing_round_window",
    "cream",
    0,
    3.93,
    1.0,
    4.2,
    1.8,
    0.23,
    0.59,
    0.83,
  );
  b.box("upper_pavilion_back", "cream", 0, 4.83, -0.95, 4.2, 1.8, 0.22);
  for (const side of [-1, 1]) {
    b.box(
      `upper_pavilion_side_${side}`,
      "cream",
      side * 2,
      4.83,
      0,
      0.22,
      1.8,
      2,
    );
    b.box(
      `upper_pavilion_red_column_${side}`,
      "red",
      side * 1.87,
      4.83,
      1.17,
      0.16,
      1.8,
      0.16,
    );
  }
  decoratedRoof(b, "lower_pavilion_roof", 0, 5.8, 0, 5.8, 3.8, 1.0);
  decoratedRoof(b, "upper_pavilion_roof", 0, 6.85, 0, 4.6, 3.0, 0.95);
  b.box("moon_pavilion_name_board", "red", 0, 6.53, 1.08, 1.7, 0.42, 0.1);
  return b.finish(9.5, 4.2);
}

function hoaPhong() {
  const b = new LandmarkBuilder("hoa-phong");
  b.box("tower_stone_base", "stone", 0, 0.12, 0, 4.3, 0.24, 4.3);
  for (const side of [-1, 1]) {
    b.arch(
      `ground_vault_front_${side}`,
      "brick",
      0,
      0.24,
      side * 1.5,
      3.4,
      2.7,
      0.4,
      1.1,
      2.15,
    );
    b.arch(
      `ground_vault_side_${side}`,
      "brick",
      side * 1.5,
      0.24,
      0,
      3.4,
      2.7,
      0.4,
      1.1,
      2.15,
      Math.PI / 2,
    );
    for (const sx of [-1, 1]) {
      b.box(
        `corner_pedestal_${side}_${sx}`,
        "stone",
        sx * 1.55,
        3.12,
        side * 1.55,
        0.55,
        0.55,
        0.55,
      );
      b.sphere(
        `corner_guardian_body_${side}_${sx}`,
        "stone",
        sx * 1.55,
        3.56,
        side * 1.55,
        0.25,
        0.24,
        0.3,
      );
      b.sphere(
        `corner_guardian_head_${side}_${sx}`,
        "stone",
        sx * 1.55,
        3.82,
        side * 1.7,
        0.16,
        0.2,
        0.15,
      );
    }
  }
  b.box("lower_tower_cornice", "cream", 0, 2.98, 0, 3.9, 0.24, 3.9);
  b.box("second_brick_tier", "brick", 0, 3.65, 0, 1.85, 1.1, 1.85);
  b.box("second_tier_coping", "stone", 0, 4.25, 0, 2.2, 0.16, 2.2);
  b.box("third_brick_tier", "brick", 0, 4.75, 0, 1.38, 0.85, 1.38);
  const crown = new THREE.CylinderGeometry(0, 1.2, 0.7, 4);
  crown.rotateY(Math.PI / 4);
  b.add("four_sided_pyramid_roof", "brick", crown, 0, 5.55, 0);
  b.sphere("gourd_crown_lower", "stone", 0, 6.02, 0, 0.23, 0.24, 0.23);
  b.sphere("gourd_crown_upper", "stone", 0, 6.35, 0, 0.15, 0.2, 0.15);
  return b.finish(4.3, 4.3);
}

function baKieu() {
  const b = new LandmarkBuilder("ba-kieu");
  b.box("temple_paved_courtyard", "stone", 0, 0.12, 0, 20, 0.24, 27);
  hall(b, "three_bay_front_hall", 0, 1.5, 17, 6, 4.2);
  hall(b, "rear_mother_goddess_shrine", 0, -7.8, 8.5, 8, 4.8);
  for (const side of [-1, 1]) {
    b.box(
      `garden_boundary_${side}`,
      "cream",
      side * 9.65,
      1.3,
      -1.2,
      0.4,
      2.6,
      24,
    );
    b.roof(
      `side_boundary_tile_cap_${side}`,
      "roof",
      side * 9.65,
      2.6,
      -1.2,
      0.8,
      24.3,
      0.25,
    );
    b.box(`front_gate_post_${side}`, "stone", side * 3.5, 2.5, 12, 0.6, 5, 0.6);
    b.cylinder(
      `front_gate_finial_${side}`,
      "cream",
      side * 3.5,
      5.3,
      12,
      0,
      0.35,
      0.6,
      4,
    );
    b.box(
      `front_boundary_${side}`,
      "cream",
      side * 6.5,
      1.3,
      12,
      5.4,
      2.6,
      0.4,
    );
  }
  b.box("front_gate_lintel", "red", 0, 4.4, 12, 7.4, 0.25, 0.3);
  decoratedRoof(b, "front_gate_curved_roof", 0, 4.6, 12, 8.5, 2.4, 0.8);
  steps(b, "front_hall_steps", 0, 5.1, 5, 3);
  b.cylinder("courtyard_incense_urn", "stone", 0, 0.9, 8.2, 0.65, 0.4, 1, 12);
  return b.finish(20, 27);
}

function stJoseph() {
  const b = new LandmarkBuilder("st-joseph");
  b.box("cathedral_foundation", "stone", 0, 0.3, 0, 29, 0.6, 60);
  b.box("nave_rear_wall", "stone", 0, 10, -26, 24, 19.4, 0.7);
  for (const side of [-1, 1]) {
    b.box(
      `nave_side_wall_${side}`,
      "stone",
      side * 11.7,
      10,
      -2,
      0.6,
      19.4,
      48,
    );
    for (let i = 0; i < 7; i++) {
      const z = -23 + i * 6.9;
      b.box(
        `nave_buttress_${side}_${i}`,
        "stone",
        side * 12.3,
        7.8,
        z,
        1.5,
        15,
        1.1,
      );
      b.cylinder(
        `buttress_pinnacle_${side}_${i}`,
        "cream",
        side * 12.3,
        16.1,
        z,
        0,
        0.48,
        1.6,
        4,
      );
      const pane = new THREE.Shape();
      pane.moveTo(-0.65, 0);
      pane.lineTo(0.65, 0);
      pane.lineTo(0.65, 3.5);
      pane.quadraticCurveTo(0.45, 4.5, 0, 5);
      pane.quadraticCurveTo(-0.45, 4.5, -0.65, 3.5);
      pane.closePath();
      const g = new THREE.ShapeGeometry(pane, 8);
      g.rotateY((side * Math.PI) / 2);
      b.add(
        `nave_lancet_window_${side}_${i}`,
        "glass",
        g,
        side * 12.02,
        9,
        z + 2.5,
      );
      beam(
        b,
        `nave_window_mullion_${side}_${i}`,
        "cream",
        [side * 12.04, 9.1, z + 2.5],
        [side * 12.04, 13.4, z + 2.5],
        0.06,
      );
    }
  }
  const section = new THREE.Shape();
  section.moveTo(-12.8, 0);
  section.lineTo(12.8, 0);
  section.lineTo(0, 7.5);
  section.closePath();
  const roof = new THREE.ExtrudeGeometry(section, {
    depth: 53.1,
    bevelEnabled: false,
  });
  roof.translate(0, 0, -26.5);
  b.add("long_gabled_nave_roof", "dark", roof, 0, 19.7, 0);
  for (const side of [-1, 1]) {
    const tx = side * 10.1,
      tz = 23;
    b.box(
      `bell_tower_rear_${side}`,
      "stone",
      tx,
      17.5,
      tz - 3.8,
      7.8,
      34.4,
      0.55,
    );
    for (const edge of [-1, 1]) {
      b.box(
        `bell_tower_side_${side}_${edge}`,
        "stone",
        tx + edge * 3.65,
        17.5,
        tz,
        0.5,
        34.4,
        8,
      );
      b.box(
        `tower_corner_buttress_${side}_${edge}`,
        "cream",
        tx + edge * 3.8,
        17.5,
        tz + 4.1,
        0.55,
        34.8,
        0.7,
      );
      b.cylinder(
        `tower_corner_pinnacle_${side}_${edge}`,
        "stone",
        tx + edge * 3.8,
        38.8,
        tz + 4.1,
        0,
        0.34,
        1.7,
        4,
      );
    }
    const levels = [
      [0.6, 7.5],
      [8.3, 7.2],
      [15.7, 7.3],
      [23.2, 8.1],
    ];
    for (let level = 0; level < levels.length; level++) {
      const [y, height] = levels[level];
      for (let col = 0; col < 3; col++) {
        const x = tx + (col - 1) * 2.45,
          opening = level === 0 && col === 1 ? 1.9 : 1.15;
        pointedArch(
          b,
          `tower_${side}_pointed_arch_${level}_${col}`,
          x,
          y,
          tz + 3.9,
          2.46,
          height,
          opening,
          height - 0.8,
        );
        if (level < 3) {
          pointedPane(
            b,
            `tower_${side}_recessed_window_${level}_${col}`,
            x,
            y + 0.03,
            tz + 3.64,
            opening,
            height - 0.85,
            level === 0 && col === 1 ? "wood" : "dark",
          );
          for (let slat = 0; slat < 8; slat++)
            b.box(
              `tower_${side}_shutter_louver_${level}_${col}_${slat}`,
              "wood",
              x,
              y + 0.4 + (slat * (height - 2)) / 8,
              tz + 3.69,
              opening - 0.08,
              0.08,
              0.04,
            );
        } else {
          for (let slat = 0; slat < 12; slat++)
            b.box(
              `tower_${side}_belfry_louver_${col}_${slat}`,
              "wood",
              x,
              y + 0.45 + slat * 0.42,
              tz + 3.64,
              opening - 0.06,
              0.14,
              0.16,
            );
        }
        b.box(
          `tower_${side}_arch_sill_${level}_${col}`,
          "cream",
          x,
          y + 0.1,
          tz + 4.2,
          1.65,
          0.18,
          0.25,
        );
      }
      b.box(
        `tower_${side}_floor_cornice_${level}`,
        "cream",
        tx,
        y + height + 0.12,
        tz,
        8.15,
        0.24,
        8.3,
      );
    }
    b.box(
      `tower_${side}_upper_spandrel`,
      "stone",
      tx,
      32.7,
      tz + 3.9,
      7.8,
      2,
      0.5,
    );
    b.box(`tower_${side}_top_cornice`, "cream", tx, 34.25, tz, 8.4, 0.5, 8.6);
    for (const edge of [-1, 1]) {
      for (let i = 0; i < 7; i++)
        b.box(
          `tower_${side}_parapet_post_${edge}_${i}`,
          "stone",
          tx - 3.7 + i * 1.23,
          36.1,
          tz + edge * 3.8,
          0.3,
          3.2,
          0.3,
        );
      b.box(
        `tower_${side}_parapet_rail_${edge}`,
        "stone",
        tx,
        37.7,
        tz + edge * 3.8,
        8.1,
        0.3,
        0.45,
      );
      b.box(
        `tower_${side}_parapet_side_${edge}`,
        "stone",
        tx + edge * 3.8,
        37.7,
        tz,
        0.45,
        0.3,
        7.8,
      );
    }
  }
  pointedArch(b, "main_pointed_portal", 0, 0.6, 27, 12.3, 11.2, 4.8, 8.7, 0.7);
  pointedPane(b, "main_carved_wood_door", 0, 0.65, 26.6, 4.75, 8.55, "wood");
  b.box("main_door_center_stile", "stone", 0, 3.5, 27.12, 0.14, 5.7, 0.2);
  for (const side of [-1, 1])
    for (let row = 0; row < 3; row++)
      b.box(
        `carved_door_panel_${side}_${row}`,
        "dark",
        side * 1.18,
        1.7 + row * 1.65,
        27.14,
        1.8,
        1.25,
        0.08,
      );
  b.box("central_front_wall", "stone", 0, 17.8, 26.7, 12.3, 12, 0.6);
  const gable = new THREE.Shape();
  gable.moveTo(-6.15, 0);
  gable.lineTo(6.15, 0);
  gable.lineTo(0, 6.5);
  gable.closePath();
  b.add(
    "central_pointed_gable",
    "stone",
    new THREE.ExtrudeGeometry(gable, { depth: 0.6, bevelEnabled: false }),
    0,
    23.8,
    26.4,
  );
  b.add(
    "rose_window_glass",
    "glass",
    new THREE.CircleGeometry(2.15, 32),
    0,
    16,
    27.035,
  );
  b.add(
    "rose_window_stone_ring",
    "cream",
    new THREE.TorusGeometry(2.3, 0.16, 6, 40),
    0,
    16,
    27.15,
  );
  b.add(
    "rose_window_inner_ring",
    "dark",
    new THREE.TorusGeometry(0.8, 0.07, 5, 24),
    0,
    16,
    27.19,
  );
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    beam(
      b,
      `rose_window_tracery_${i}`,
      "dark",
      [Math.sin(a) * 0.35, 16 + Math.cos(a) * 0.35, 27.2],
      [Math.sin(a) * 2.13, 16 + Math.cos(a) * 2.13, 27.2],
      0.07,
    );
  }
  for (const y of [10.8, 20, 23.6])
    b.box(`central_facade_cornice_${y}`, "cream", 0, y, 27.13, 12.5, 0.22, 0.3);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++)
      pointedPane(
        b,
        `central_lancet_${side}_${i}`,
        side * (3.8 + i * 1.35),
        12.1,
        27.1,
        0.8,
        3.4,
        "dark",
      );
    beam(
      b,
      `front_gable_sloping_coping_${side}`,
      "cream",
      [side * 6.3, 23.9, 27.15],
      [0, 30.5, 27.15],
      0.22,
    );
  }
  b.add(
    "gable_clock_face",
    "cream",
    new THREE.CircleGeometry(1.2, 28),
    0,
    25.2,
    27.07,
  );
  b.add(
    "gable_clock_rim",
    "dark",
    new THREE.TorusGeometry(1.22, 0.075, 5, 28),
    0,
    25.2,
    27.15,
  );
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    beam(
      b,
      `clock_hour_mark_${i}`,
      "dark",
      [Math.sin(a) * 0.92, 25.2 + Math.cos(a) * 0.92, 27.19],
      [Math.sin(a) * 1.06, 25.2 + Math.cos(a) * 1.06, 27.19],
      0.045,
    );
  }
  beam(
    b,
    "clock_hour_hand",
    "dark",
    [0, 25.2, 27.2],
    [-0.5, 25.6, 27.2],
    0.065,
  );
  beam(
    b,
    "clock_minute_hand",
    "dark",
    [0, 25.2, 27.21],
    [0.25, 26.08, 27.21],
    0.045,
  );
  b.box("gable_cross_upright", "stone", 0, 32, 27, 0.3, 3.5, 0.35);
  b.box("gable_cross_arm", "stone", 0, 32.65, 27, 2.3, 0.3, 0.35);
  steps(b, "wide_cathedral_front_steps", 0, 29, 27, 3, 0.2);
  return b.finish(29, 60);
}

export function makeHanoiLandmark(kind: string): LandmarkAsset | undefined {
  switch (kind) {
    case "turtle-tower":
      return turtleTower();
    case "ngoc-son":
      return ngocSon();
    case "tran-ba":
      return tranBa();
    case "the-huc":
      return theHuc();
    case "pen-tower":
      return penTower();
    case "inkstone":
      return inkstone();
    case "dac-nguyet":
      return dacNguyet();
    case "hoa-phong":
      return hoaPhong();
    case "ba-kieu":
      return baKieu();
    case "st-joseph":
      return stJoseph();
    default:
      return undefined;
  }
}
