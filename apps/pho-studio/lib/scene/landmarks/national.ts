import * as THREE from "three";
import { LandmarkBuilder, type LandmarkAsset, type Tone } from "./geometry";

// Original exterior illustrations; no figurative statues are included.
function gable(
  b: LandmarkBuilder,
  name: string,
  tone: Tone,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  rise: number,
) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(0, rise);
  s.lineTo(w / 2, 0);
  s.closePath();
  const geometry = new THREE.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.translate(0, 0, -d / 2);
  b.add(name, tone, geometry, x, y, z);
}
function ring(
  b: LandmarkBuilder,
  name: string,
  tone: Tone,
  x: number,
  y: number,
  z: number,
  r: number,
  tube = 0.12,
) {
  b.add(name, tone, new THREE.TorusGeometry(r, tube, 5, 24), x, y, z);
}
function cross(b: LandmarkBuilder, x: number, y: number, z: number, size = 1) {
  b.box(
    "roof_cross_upright",
    "white",
    x,
    y,
    z,
    0.16 * size,
    2 * size,
    0.18 * size,
  );
  b.box(
    "roof_cross_arm",
    "white",
    x,
    y + 0.3 * size,
    z,
    1.2 * size,
    0.15 * size,
    0.18 * size,
  );
}
function windows(
  b: LandmarkBuilder,
  w: number,
  d: number,
  h: number,
  tone: Tone = "cream",
  base = 0,
) {
  const floors = Math.max(1, Math.floor(h / 3.8)),
    columns = Math.max(2, Math.min(22, Math.floor(w / 3.2)));
  for (let row = 0; row < floors; row++)
    for (let col = 0; col < columns; col++)
      for (const side of [-1, 1]) {
        const x = -w / 2 + ((col + 0.5) * w) / columns,
          y = base + 1.5 + (row * (h - 0.5)) / floors,
          z = side * (d / 2 + 0.035);
        b.box("window_reveals", tone, x, y, z, 1.55, 2, 0.15);
        b.box(
          "recessed_window_glass",
          "glass",
          x,
          y,
          z + side * 0.09,
          1.22,
          1.65,
          0.05,
        );
        b.box(
          "window_center_mullions",
          tone,
          x,
          y,
          z + side * 0.13,
          0.08,
          1.7,
          0.08,
        );
      }
  const bays = Math.max(2, Math.min(20, Math.floor(d / 4)));
  for (let row = 0; row < floors; row++)
    for (let col = 0; col < bays; col++)
      for (const side of [-1, 1]) {
        const z = -d / 2 + ((col + 0.5) * d) / bays,
          y = base + 1.5 + (row * (h - 0.5)) / floors;
        b.box(
          "side_window_glass",
          "glass",
          side * (w / 2 + 0.05),
          y,
          z,
          0.08,
          1.65,
          1.2,
        );
      }
}
function clock(b: LandmarkBuilder, x: number, y: number, z: number, r = 1) {
  b.add("clock_dial", "white", new THREE.CircleGeometry(r, 24), x, y, z);
  ring(b, "clock_surround", "gold", x, y, z + 0.025, r, 0.1);
  b.box(
    "clock_hour_hand",
    "dark",
    x,
    y + r * 0.2,
    z + 0.05,
    0.08,
    r * 0.55,
    0.04,
  );
  b.box(
    "clock_minute_hand",
    "dark",
    x + r * 0.2,
    y,
    z + 0.06,
    r * 0.5,
    0.07,
    0.04,
  );
}
function columns(
  b: LandmarkBuilder,
  w: number,
  z: number,
  y: number,
  h: number,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    const x = -w / 2 + (i * w) / (count - 1);
    b.cylinder("portico_columns", "cream", x, y + h / 2, z, 0.3, 0.4, h, 10);
    b.box("column_capitals", "white", x, y + h, z, 0.95, 0.3, 0.9);
    b.box("column_plinths", "stone", x, y + 0.12, z, 0.8, 0.24, 0.8);
  }
}
function landmark81() {
  const b = new LandmarkBuilder("Landmark_81");
  b.box("retail_podium", "stone", 0, 9, 0, 88, 18, 88);
  windows(b, 88, 88, 17, "metal");
  const heights = [
    [195, 255, 170],
    [300, 415, 335],
    [235, 350, 270],
  ];
  for (let ix = 0; ix < 3; ix++)
    for (let iz = 0; iz < 3; iz++) {
      const h = heights[ix][iz],
        x = (ix - 1) * 18,
        z = (iz - 1) * 18;
      b.box("stepped_bamboo_bundle", "glass", x, h / 2, z, 17.8, h, 17.8);
      for (let level = 20; level < h; level += 4.6)
        b.box("tower_floor_ribbons", "metal", x, level, z, 18, 0.28, 18);
      for (let offset = -7; offset <= 7; offset += 3.5)
        for (const side of [-1, 1]) {
          b.box(
            "vertical_curtainwall_fins",
            "metal",
            x + offset,
            h / 2,
            z + side * 9,
            0.18,
            h,
            0.2,
          );
          b.box(
            "side_curtainwall_fins",
            "metal",
            x + side * 9,
            h / 2,
            z + offset,
            0.2,
            h,
            0.18,
          );
        }
      b.box("setback_crown", "white", x, h + 0.6, z, 17.9, 1.2, 17.9);
    }
  b.box("central_lantern", "glass", 0, 430, 0, 9, 30, 9);
  b.cylinder("spire", "metal", 0, 452.5, 0, 0.18, 0.65, 17, 8);
  return b.finish(88, 88);
}
function palace() {
  const b = new LandmarkBuilder("Dinh_Doc_Lap");
  b.box("raised_stylobate", "stone", 0, 0.7, 0, 83, 1.4, 52);
  b.box("modernist_main_volume", "cream", 0, 9, 0, 78, 16, 48);
  windows(b, 78, 48, 15, "white", 1.4);
  for (const y of [4.7, 8.8, 13, 17])
    b.box("horizontal_cantilevered_slabs", "white", 0, y, 0, 82, 0.4, 51);
  for (let x = -36; x <= 36; x += 2.2) {
    b.box(
      "bamboo_concrete_brise_soleil",
      "cream",
      x,
      10.2,
      25.6,
      0.5,
      11.8,
      0.55,
    );
    for (const y of [6.3, 10.1, 14.3])
      b.box("screen_cross_members", "cream", x, y, 25.8, 1.5, 0.28, 0.4);
  }
  b.box("recessed_entrance", "glass", 0, 3, 26, 15, 4, 0.12);
  columns(b, 15, 27, 1.2, 4, 6);
  b.box("roof_reception_pavilion", "cream", 0, 19, 0, 23, 4, 17);
  b.box("pavilion_shade_roof", "white", 0, 21.3, 0, 28, 0.6, 21);
  for (let i = 0; i < 6; i++)
    b.box(
      "entrance_steps",
      "stone",
      0,
      0.12 + i * 0.18,
      27 - i * 0.45,
      24,
      0.24 + i * 0.36,
      0.5,
    );
  return b.finish(83, 55);
}
function opera(haiphong: boolean) {
  const b = new LandmarkBuilder(haiphong ? "Hai_Phong_Opera" : "Hanoi_Opera");
  const w = haiphong ? 32 : 40,
    d = haiphong ? 43 : 65;
  b.box("auditorium_volume", "cream", 0, 8.5, -3, w - 4, 17, d - 8);
  windows(b, w - 4, d - 8, 16);
  b.roof("mansard_auditorium_roof", "dark", 0, 17, -3, w, d - 5, 5, 0);
  b.box("front_portico", "cream", 0, 7, d / 2 - 5, w, 14, 7);
  for (const y of [1.2, 6.2, 13.8])
    b.box("facade_cornice", "white", 0, y, d / 2 - 1, w + 0.6, 0.45, 8);
  for (let i = -2; i <= 2; i++) {
    b.arch(
      "ground_arcade",
      "cream",
      i * (w / 5),
      1,
      d / 2 + 0.1,
      w / 5,
      5,
      0.7,
      w / 5 - 1.8,
      4.5,
    );
    b.box(
      "upper_window_recess",
      "dark",
      (i * w) / 5,
      9.5,
      d / 2 - 0.95,
      w / 6,
      4,
      0.1,
    );
  }
  columns(b, w * 0.83, d / 2 + 1, 6, 7.5, haiphong ? 6 : 8);
  gable(b, "central_pediment", "white", 0, 14.5, d / 2, w * 0.65, 3, 3.4);
  for (const side of [-1, 1]) {
    b.box(
      "side_pavilions",
      "cream",
      side * (w / 2 - 2),
      9,
      d / 2 - 7,
      6,
      18,
      10,
    );
    b.roof(
      "pavilion_mansards",
      "dark",
      side * (w / 2 - 2),
      18,
      d / 2 - 7,
      7.5,
      11,
      4.5,
      0,
    );
  }
  for (let i = 0; i < 9; i++)
    b.box(
      "front_stair_treads",
      "stone",
      0,
      0.08 + i * 0.13,
      d / 2 + 4 - i * 0.4,
      w * 0.8,
      0.16 + i * 0.26,
      0.5,
    );
  return b.finish(w + 2, d + 9);
}
function postOffice() {
  const b = new LandmarkBuilder("Saigon_Central_Post_Office"),
    w = 63,
    d = 35;
  b.box("yellow_colonial_walls", "cream", 0, 6.5, 0, w, 13, d);
  windows(b, w, d, 11, "white");
  gable(b, "long_green_vault_roof", "green", 0, 13, -2, w - 3, d - 3, 4);
  b.box("central_frontispiece", "cream", 0, 9, d / 2 + 1, 19, 18, 4);
  b.arch(
    "main_entrance_arch",
    "white",
    0,
    0.3,
    d / 2 + 3.1,
    9,
    10,
    0.7,
    6.5,
    8.6,
  );
  b.box("central_glazed_recess", "glass", 0, 4.5, d / 2 + 2.7, 6, 8, 0.1);
  for (const side of [-1, 1]) columns(b, 5, d / 2 + 3.5, 1, 9, 2);
  clock(b, 0, 14.3, d / 2 + 3.15, 1.3);
  b.roof("front_pavilion_roof", "green", 0, 18, d / 2, 21, 8, 3, 0);
  for (let x = -28; x <= 28; x += 4)
    b.box("roof_balustrade", "white", x, 13.5, d / 2, 1.1, 1, 0.8);
  return b.finish(w, d + 8);
}
function market() {
  const b = new LandmarkBuilder("Ben_Thanh_Market"),
    w = 110,
    d = 104;
  b.box("market_perimeter", "cream", 0, 3.5, 0, w, 7, d);
  for (let x = -44; x <= 44; x += 22)
    gable(b, "parallel_market_sheds", "roof", x, 7, 0, 22, 100, 5);
  for (let x = -50; x <= 50; x += 5)
    for (const side of [-1, 1])
      b.box(
        "market_ventilation_panels",
        "dark",
        x,
        3.6,
        side * 52.1,
        2.6,
        2,
        0.1,
      );
  b.box("south_clock_tower", "cream", 0, 10, d / 2 - 2, 11, 20, 12);
  for (const y of [7, 14.5, 20])
    b.box("clock_tower_cornices", "white", 0, y, d / 2 - 2, 12.5, 0.35, 13.5);
  b.arch("south_market_portal", "cream", 0, 0, d / 2 + 4.2, 11, 8, 0.7, 6, 6.8);
  clock(b, 0, 15.3, d / 2 + 4.6, 1.7);
  b.roof("clock_tower_hip", "roof", 0, 20, d / 2 - 2, 14, 15, 3.4, 0);
  b.box("entrance_name_panel", "gold", 0, 9, d / 2 + 4.8, 8, 1.2, 0.15);
  return b.finish(w, d + 8);
}
const CHURCHES: Record<
  string,
  {
    w: number;
    d: number;
    h: number;
    tower: number;
    twin?: boolean;
    tone: Tone;
    roof?: Tone;
    wood?: boolean;
    spire?: number;
  }
> = {
  "notre-dame": {
    w: 36,
    d: 76,
    h: 18,
    tower: 42,
    twin: true,
    tone: "brick",
    roof: "red",
    spire: 16,
  },
  "dalat-cathedral": {
    w: 24,
    d: 55,
    h: 15,
    tower: 35,
    tone: "cream",
    spire: 11,
  },
  "nha-trang-cathedral": {
    w: 26,
    d: 60,
    h: 15,
    tower: 28,
    tone: "stone",
    spire: 8,
  },
  "danang-cathedral": {
    w: 24,
    d: 54,
    h: 15,
    tower: 35,
    tone: "rose",
    spire: 9,
  },
  "tan-dinh": { w: 27, d: 56, h: 17, tower: 42, tone: "rose", spire: 9 },
  "kon-tum-church": {
    w: 28,
    d: 52,
    h: 17,
    tower: 25,
    tone: "wood",
    roof: "roof",
    wood: true,
    spire: 8,
  },
  "mang-lang": {
    w: 26,
    d: 40,
    h: 14,
    tower: 21,
    twin: true,
    tone: "stone",
    spire: 3,
  },
  "sapa-church": {
    w: 18,
    d: 31,
    h: 10,
    tower: 18,
    tone: "stone",
    roof: "roof",
    spire: 3,
  },
};
function church(kind: string, c: (typeof CHURCHES)[string]) {
  const b = new LandmarkBuilder(kind),
    { w, d, h, tower, tone } = c,
    roof = c.roof ?? "roof";
  b.box("nave_walls", tone, 0, h / 2, 0, w, h, d);
  gable(b, "long_nave_gable", roof, 0, h, 0, w + 1, d + 1, h * 0.38);
  for (const side of [-1, 1])
    for (let z = -d / 2 + 4; z < d / 2 - 4; z += 6) {
      b.box(
        "side_buttresses",
        tone,
        side * (w / 2 + 0.5),
        h * 0.4,
        z,
        1.1,
        h * 0.8,
        1,
      );
      b.box(
        "side_lancet_glass",
        "glass",
        side * (w / 2 + 0.06),
        h * 0.55,
        z + 2.6,
        0.1,
        h * 0.4,
        1.5,
      );
      if (c.wood)
        for (let y = 1; y < h; y += 0.8)
          b.box(
            "timber_weatherboards",
            "cream",
            side * (w / 2 + 0.07),
            y,
            z + 2.6,
            0.09,
            0.06,
            4.5,
          );
    }
  const positions = c.twin ? [-w * 0.32, w * 0.32] : [0];
  for (const x of positions) {
    const tw = c.twin ? w * 0.25 : w * 0.3,
      z = d / 2 - 1;
    b.box("bell_tower_shaft", tone, x, tower / 2, z, tw, tower, tw);
    for (const y of [tower * 0.34, tower * 0.66, tower - 0.4])
      b.box("bell_tower_cornices", "white", x, y, z, tw + 0.65, 0.3, tw + 0.65);
    for (const side of [-1, 1]) {
      b.arch(
        "bell_openings",
        "white",
        x,
        tower * 0.74,
        z + side * (tw / 2 + 0.05),
        tw * 0.6,
        tower * 0.17,
        0.2,
        tw * 0.38,
        tower * 0.15,
      );
      b.box(
        "bell_louver_shadow",
        "dark",
        x,
        tower * 0.81,
        z + side * (tw / 2 + 0.02),
        tw * 0.38,
        tower * 0.13,
        0.1,
      );
      for (let y = tower * 0.75; y < tower * 0.87; y += 0.5)
        b.box(
          "bell_louver_slats",
          tone,
          x,
          y,
          z + side * (tw / 2 + 0.18),
          tw * 0.38,
          0.12,
          0.15,
        );
    }
    const rise = c.spire ?? 5;
    b.cylinder(
      "steeple",
      kind === "notre-dame" ? "metal" : roof,
      x,
      tower + rise / 2,
      z,
      0,
      tw * 0.68,
      rise,
      8,
    );
    cross(b, x, tower + rise + 1, z, 0.9);
  }
  if (kind === "tan-dinh") {
    clock(b, 0, tower * 0.6, d / 2 + w * 0.15 - 0.9, 1.45);
    for (const x of [-w * 0.39, w * 0.39]) {
      b.cylinder(
        "side_octagonal_turrets",
        "rose",
        x,
        h * 0.65,
        d / 2,
        1.7,
        1.7,
        h * 1.3,
        8,
      );
      b.cylinder(
        "turret_white_cornices",
        "white",
        x,
        h * 1.3,
        d / 2,
        2,
        2,
        0.35,
        8,
      );
      b.cylinder(
        "side_turret_caps",
        "roof",
        x,
        h * 1.3 + 1.8,
        d / 2,
        0.15,
        2.2,
        3.5,
        8,
      );
    }
    for (const y of [h * 0.5, h, h * 1.12])
      b.box("baroque_facade_bands", "white", 0, y, d / 2 + 0.36, w, 0.25, 0.3);
  }
  b.box("front_gable_wall", tone, 0, h * 0.55, d / 2 + 0.05, w, h * 1.1, 0.5);
  gable(b, "facade_pediment", tone, 0, h * 1.1, d / 2, w, 0.8, h * 0.3);
  const doorX = c.twin ? [0] : [-w * 0.28, w * 0.28];
  for (const x of doorX) {
    b.arch(
      "carved_entrance_frame",
      "white",
      x,
      0.2,
      d / 2 + 0.5,
      5.2,
      7.5,
      0.65,
      3.5,
      6.6,
    );
    b.box("entrance_doors", "wood", x, 2.5, d / 2 + 0.6, 3.3, 4.8, 0.2);
  }
  if (c.twin) {
    ring(b, "rose_window_frame", "white", 0, h * 0.78, d / 2 + 0.55, 2.5, 0.2);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      b.tube(
        "rose_window_tracery",
        "white",
        [
          [0, h * 0.78, d / 2 + 0.6],
          [Math.cos(a) * 2.3, h * 0.78 + Math.sin(a) * 2.3, d / 2 + 0.6],
        ],
        0.055,
      );
    }
  }
  for (let i = 0; i < 4; i++)
    b.box(
      "front_steps",
      "stone",
      0,
      0.08 + i * 0.15,
      d / 2 + 2 - i * 0.35,
      w,
      0.16 + i * 0.3,
      0.4,
    );
  return b.finish(w + 2, d + 5);
}
function phuCam() {
  const b = new LandmarkBuilder("Phu_Cam_Cathedral");
  b.box("nave_concrete_volume", "cream", 0, 9, -5, 28, 18, 62);
  gable(b, "folded_concrete_roof", "white", 0, 18, -5, 31, 63, 11);
  for (const side of [-1, 1]) {
    b.box("slender_bell_towers", "cream", side * 16, 23, 29, 8, 46, 9);
    b.box("open_bell_tower_shadow", "dark", side * 16, 34, 33.6, 4.5, 15, 0.12);
    for (const x of [-2.7, 2.7])
      b.box("tower_concrete_fins", "white", side * 16 + x, 34, 34, 0.45, 17, 1);
    cross(b, side * 16, 48, 29, 1.4);
    for (let z = -30; z < 25; z += 6)
      b.box("concrete_flying_ribs", "stone", side * 14.5, 12, z, 1.3, 24, 1);
  }
  b.box("front_glazed_screen", "glass", 0, 10, 26.5, 23, 16, 0.15);
  for (let x = -10; x <= 10; x += 2)
    b.box("front_screen_fins", "white", x, 10, 27, 0.3, 16, 0.4);
  b.box("entrance_canopy", "cream", 0, 4, 30, 24, 0.6, 9);
  return b.finish(40, 72);
}
function pavilion(kind: string) {
  const b = new LandmarkBuilder(kind);
  if (kind === "one-pillar") {
    b.cylinder("single_stone_pillar", "stone", 0, 1.5, 0, 0.7, 0.9, 3, 16);
    b.box("raised_lotus_platform", "stone", 0, 3.1, 0, 4.8, 0.4, 4.8);
    b.box("timber_sanctuary", "wood", 0, 4.1, 0, 3.4, 1.8, 3.4);
    for (const x of [-1.8, 1.8])
      for (const z of [-1.8, 1.8])
        b.cylinder("timber_porch_columns", "red", x, 4.1, z, 0.1, 0.12, 2, 8);
    b.roof("curled_lotus_roof", "roof", 0, 5.2, 0, 6.3, 6.3, 1.5, 0.42);
    for (let i = 0; i < 10; i++)
      b.box(
        "narrow_stone_stairs",
        "stone",
        0,
        0.15 + i * 0.3,
        4 - i * 0.28,
        1.2,
        0.3 + i * 0.6,
        0.32,
      );
    return b.finish(6.3, 8.2);
  }
  for (const x of [-2.2, 2.2])
    for (const z of [-2.2, 2.2])
      b.box("four_stone_piers", "stone", x, 1.8, z, 0.7, 3.6, 0.7);
  b.box("raised_pavilion_floor", "stone", 0, 3.7, 0, 6, 0.4, 6);
  for (const side of [-1, 1]) {
    for (const rotation of [0, Math.PI / 2]) {
      const wall = new THREE.Shape();
      wall.moveTo(-2.6, -1.25);
      wall.lineTo(2.6, -1.25);
      wall.lineTo(2.6, 1.25);
      wall.lineTo(-2.6, 1.25);
      wall.closePath();
      const opening = new THREE.Path();
      opening.absarc(0, 0.1, 1.05, 0, Math.PI * 2, true);
      wall.holes.push(opening);
      const geometry = new THREE.ExtrudeGeometry(wall, {
        depth: 0.3,
        bevelEnabled: false,
        curveSegments: 24,
      });
      geometry.translate(0, 0, -0.15);
      const x = Math.sin(rotation) * side * 2.5,
        z = Math.cos(rotation) * side * 2.5;
      b.add(
        "red_upper_walls_with_round_openings",
        "red",
        geometry,
        x,
        5.1,
        z,
        rotation,
      );
      b.add(
        "circular_sun_windows",
        "gold",
        new THREE.TorusGeometry(1.05, 0.12, 5, 24),
        x + Math.sin(rotation) * side * 0.18,
        5.2,
        z + Math.cos(rotation) * side * 0.18,
        rotation,
      );
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        b.tube(
          "sun_window_spokes",
          "gold",
          [
            [x, 5.2, z],
            [
              x + Math.cos(rotation) * Math.cos(a),
              5.2 + Math.sin(a),
              z - Math.sin(rotation) * Math.cos(a),
            ],
          ],
          0.035,
        );
      }
    }
  }
  b.roof("lower_curved_eaves", "roof", 0, 6.5, 0, 7.4, 7.4, 1.1, 0.45);
  b.roof("upper_curved_eaves", "roof", 0, 7.4, 0, 5.9, 5.9, 1.2, 0.5);
  return b.finish(7.4, 7.4);
}
const STUPAS: Record<string, [number, number, number, number, Tone]> = {
  "thien-mu": [7, 21, 5.2, 8, "brick"],
  "tran-quoc": [11, 15, 2.8, 6, "brick"],
  "bai-dinh": [13, 100, 20, 8, "cream"],
  "dau-tower": [3, 17, 7, 4, "brick"],
  "pho-minh": [14, 20, 5, 4, "brick"],
};
function stupa(
  kind: string,
  [floors, h, w, sides, tone]: (typeof STUPAS)[string],
) {
  const b = new LandmarkBuilder(kind),
    step = (h - 1.8) / floors;
  for (let i = 0; i < floors; i++) {
    const r = (w / 2) * (1 - i / (floors * 1.8)),
      y = i * step;
    b.cylinder(
      "tapered_masonry_storeys",
      tone,
      0,
      y + step * 0.45,
      0,
      r * 0.89,
      r,
      step * 0.9,
      sides,
    );
    b.cylinder(
      "projecting_tier_eaves",
      "roof",
      0,
      y + step * 0.92,
      0,
      r * 0.65,
      r * 1.18,
      step * 0.2,
      sides,
    );
    for (let j = 0; j < sides; j++) {
      const a = (j * Math.PI * 2) / sides,
        x = Math.sin(a) * (r * 0.94),
        z = Math.cos(a) * (r * 0.94);
      b.box(
        "tier_window_niches",
        "dark",
        x,
        y + step * 0.43,
        z,
        Math.max(0.18, r * 0.22),
        step * 0.5,
        0.08,
        a,
      );
    }
    b.cylinder(
      "tier_cornice",
      "cream",
      0,
      y + 0.12,
      0,
      r * 1.06,
      r * 1.06,
      0.18,
      sides,
    );
  }
  b.cylinder("lotus_finial", "gold", 0, h - 0.9, 0, 0, w * 0.12, 1.8, sides);
  return b.finish(w * 1.25, w * 1.25);
}
const CHAM: Record<string, [number, number, number]> = {
  "po-nagar": [13, 14, 23],
  "po-klong": [11, 12, 21],
  "nhan-tower": [12, 12, 24],
  "doi-towers": [10, 11, 20],
  "banh-it": [13, 13, 22],
  "po-sah-inu": [10, 11, 16],
};
function cham(kind: string, [w, d, h]: (typeof CHAM)[string]) {
  const b = new LandmarkBuilder(kind),
    twin = kind === "doi-towers",
    centers = twin ? [-w * 0.62, w * 0.62] : [0];
  for (const x of centers) {
    b.box("cham_sandstone_plinth", "stone", x, 0.5, 0, w + 1, 1, d + 1);
    b.box("brick_sanctuary_core", "brick", x, h * 0.29, 0, w, h * 0.58, d);
    for (const side of [-1, 1])
      for (let j = -1; j <= 1; j++) {
        b.box(
          "vertical_cham_pilasters",
          "red",
          x + j * w * 0.32,
          h * 0.3,
          side * (d / 2 + 0.08),
          w * 0.12,
          h * 0.55,
          0.28,
        );
        b.box(
          "side_cham_pilasters",
          "red",
          x + side * (w / 2 + 0.08),
          h * 0.3,
          j * d * 0.32,
          0.28,
          h * 0.55,
          d * 0.12,
        );
      }
    for (let tier = 0; tier < 4; tier++) {
      const scale = 1 - tier * 0.2,
        y = h * 0.58 + tier * h * 0.105;
      b.box(
        "receding_brick_crown",
        "brick",
        x,
        y,
        0,
        w * scale,
        h * 0.105,
        d * scale,
      );
      b.box(
        "projecting_crown_courses",
        "red",
        x,
        y + h * 0.04,
        0,
        w * scale + 0.3,
        0.22,
        d * scale + 0.3,
      );
      for (const side of [-1, 1])
        for (const front of [-1, 1])
          b.cylinder(
            "corner_miniature_turrets",
            "brick",
            x + side * w * scale * 0.38,
            y + h * 0.08,
            front * d * scale * 0.38,
            0.05,
            0.45,
            h * 0.14,
            4,
          );
    }
    b.arch(
      "carved_stone_doorway",
      "stone",
      x,
      0.3,
      d / 2 + 0.3,
      w * 0.4,
      h * 0.42,
      0.7,
      w * 0.22,
      h * 0.34,
    );
    b.box(
      "sanctuary_door_shadow",
      "dark",
      x,
      h * 0.16,
      d / 2 + 0.38,
      w * 0.2,
      h * 0.32,
      0.1,
    );
    if (kind === "po-klong" || kind === "banh-it")
      gable(
        b,
        "elongated_entrance_mandapa",
        "brick",
        x,
        h * 0.42,
        d * 0.67,
        w * 0.46,
        d * 0.45,
        h * 0.22,
      );
    for (let course = 1; course < h * 0.55; course += 0.65)
      b.box(
        "brick_bond_courses",
        "red",
        x,
        course,
        d / 2 + 0.13,
        w,
        0.05,
        0.035,
      );
  }
  return b.finish(twin ? w * 2.5 : w + 1, twin ? d + 1 : d * 1.95);
}
function flagTower(kind: string) {
  const b = new LandmarkBuilder(kind),
    lung = kind === "lung-cu-flag",
    w = lung ? 18 : 40,
    h = lung ? 25 : 33;
  for (let i = 0; i < 3; i++)
    b.box(
      "stepped_masonry_platforms",
      "stone",
      0,
      1.2 + i * 2,
      0,
      w - i * w * 0.2,
      2.4,
      w - i * w * 0.2,
    );
  b.cylinder(
    "octagonal_flag_tower",
    "cream",
    0,
    6 + (h - 6) / 2,
    0,
    lung ? 3 : 2.5,
    lung ? 4 : 3.3,
    h - 6,
    8,
  );
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    b.box(
      "tower_slit_windows",
      "dark",
      Math.sin(a) * 2.7,
      h * 0.65,
      Math.cos(a) * 2.7,
      0.35,
      2.2,
      0.08,
      a,
    );
  }
  b.cylinder("observation_balcony", "stone", 0, h, 0, 4.2, 4.2, 0.65, 8);
  b.cylinder("flagpole", "metal", 0, h + 5, 0, 0.1, 0.14, 10, 8);
  b.box("vietnam_flag_field", "red", 2.2, h + 8, 0, 4.3, 2.9, 0.035);
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 + Math.PI / 2,
      r = i % 2 ? 0.3 : 0.75;
    const x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    if (i === 0) star.moveTo(x, y);
    else star.lineTo(x, y);
  }
  star.closePath();
  b.add(
    "five_pointed_flag_star",
    "gold",
    new THREE.ShapeGeometry(star),
    2.2,
    h + 8,
    0.025,
  );
  return b.finish(w, w);
}
function gate() {
  const b = new LandmarkBuilder("Doan_Mon");
  for (const x of [-7, 0, 7])
    b.arch("open_gate_passages", "stone", x, 0.2, 0, 7, 7, 12, 3.4, 5.7);
  for (const side of [-1, 1])
    b.box("stone_gate_wings", "stone", side * 15.5, 3.5, 0, 10, 7, 13);
  b.box("gate_cornice", "cream", 0, 7.2, 0, 42, 0.4, 14);
  for (const side of [-1, 1]) columns(b, 14, side * 4, 7.5, 3.2, 5);
  b.roof("gate_pavilion_lower_roof", "roof", 0, 10.7, 0, 20, 12, 1.5, 0.2);
  b.roof("gate_pavilion_upper_roof", "roof", 0, 12.1, 0, 15, 8, 1.5, 0.25);
  return b.finish(42, 14);
}
function bellHouse(kind: string) {
  const b = new LandmarkBuilder(kind),
    phat = kind === "phat-diem",
    w = phat ? 21 : 11,
    d = phat ? 13 : 10;
  const floors = 3;
  for (let i = 0; i < floors; i++) {
    const y = i * (phat ? 5 : 3),
      scale = 1 - i * 0.18;
    for (const x of [-1, 1])
      for (const z of [-1, 1])
        b.cylinder(
          "exposed_timber_columns",
          phat ? "stone" : "wood",
          x * w * scale * 0.35,
          y + 2,
          z * d * scale * 0.35,
          0.28,
          0.35,
          4,
          10,
        );
    b.box(
      "timber_floor_beams",
      "wood",
      0,
      y + 0.2,
      0,
      w * scale,
      0.35,
      d * scale,
    );
    b.roof(
      "tiered_curved_tile_roofs",
      "roof",
      0,
      y + 4,
      0,
      w * scale + 2,
      d * scale + 2,
      1.8,
      0.45,
    );
  }
  b.cylinder("bronze_bell", "gold", 0, 8, 0, 0.65, 1.2, 1.8, 16);
  return b.finish(w + 2, d + 2);
}
function station(dalat: boolean) {
  const b = new LandmarkBuilder(dalat ? "Da_Lat_Station" : "Hai_Phong_Station"),
    w = dalat ? 64 : 82,
    d = dalat ? 20 : 19;
  b.box("station_hall", "cream", 0, 4.5, 0, w, 9, d);
  windows(b, w, d, 8, "white");
  if (dalat)
    for (let i = -1; i <= 1; i++) {
      b.box("three_front_pavilions", "cream", i * 13, 6, d / 2, 12, 12, 4);
      gable(
        b,
        "three_highland_roof_peaks",
        "roof",
        i * 13,
        12,
        d / 2,
        14,
        7,
        7,
      );
      b.box(
        "vertical_art_deco_window",
        "glass",
        i * 13,
        9.5,
        d / 2 + 2.1,
        2.4,
        7,
        0.1,
      );
      for (const x of [-2, 2])
        b.box(
          "peak_facade_fins",
          "white",
          i * 13 + x,
          10,
          d / 2 + 2.2,
          0.2,
          8,
          0.2,
        );
    }
  else {
    b.roof("red_station_hip_roof", "roof", 0, 9, 0, w + 2, d + 2, 5, 0);
    gable(b, "central_station_pediment", "cream", 0, 9, d / 2, 22, 3, 4);
    columns(b, 21, d / 2 + 2, 0.5, 5, 8);
  }
  if (dalat) clock(b, 0, 15, d / 2 + 3.55, 1);
  b.box("platform_canopy", "metal", 0, 4.8, -d / 2 - 3, w, 0.25, 8);
  for (let x = -w / 2 + 3; x < w / 2; x += 7)
    b.cylinder(
      "platform_canopy_posts",
      "metal",
      x,
      2.4,
      -d / 2 - 6,
      0.1,
      0.12,
      4.8,
      8,
    );
  return b.finish(w + 2, d + 15);
}
function museum(kind: string) {
  const b = new LandmarkBuilder(kind);
  if (kind === "quang-ninh-museum") {
    b.box("reflective_black_glass_cube", "dark", 0, 14, 0, 47, 28, 47);
    for (let y = 1; y < 28; y += 2)
      for (const side of [-1, 1]) {
        b.box(
          "glass_horizontal_seams",
          "metal",
          0,
          y,
          side * 23.55,
          47,
          0.055,
          0.05,
        );
        b.box("side_glass_seams", "metal", side * 23.55, y, 0, 0.05, 0.055, 47);
      }
    for (let x = -23; x < 24; x += 3)
      for (const side of [-1, 1])
        b.box(
          "glass_vertical_seams",
          "glass",
          x,
          14,
          side * 23.58,
          0.045,
          28,
          0.06,
        );
    b.box("recessed_museum_entry", "glass", 0, 3, 23.7, 12, 6, 0.1);
    return b.finish(47, 47);
  }
  if (kind === "ethnology-museum") {
    b.cylinder("bronze_drum_round_gallery", "cream", 0, 7, 0, 20, 23, 14, 40);
    b.cylinder("overhanging_drum_roof", "white", 0, 14.3, 0, 24, 24, 0.6, 40);
    for (let i = 0; i < 40; i++) {
      const a = (i * Math.PI) / 20;
      b.box(
        "curved_gallery_glazing",
        "glass",
        Math.sin(a) * 21.4,
        8,
        Math.cos(a) * 21.4,
        1.5,
        7,
        0.15,
        a,
      );
      b.box(
        "drum_vertical_pilasters",
        "white",
        Math.sin(a) * 22,
        8,
        Math.cos(a) * 22,
        0.25,
        12,
        0.3,
        a,
      );
    }
    b.box("entrance_volume", "cream", 0, 4, 24, 16, 8, 12);
    windows(b, 16, 12, 7);
    return b.finish(48, 60);
  }
  if (kind === "daklak-museum") {
    b.box("longhouse_museum_base", "stone", 0, 2, 0, 100, 4, 30);
    b.box("glazed_longhouse_gallery", "glass", 0, 7, 0, 94, 10, 25);
    b.roof("extended_highland_roof", "roof", 0, 12, 0, 108, 36, 12, 0.12);
    for (let x = -46; x <= 46; x += 4)
      for (const side of [-1, 1])
        b.cylinder(
          "longhouse_timber_columns",
          "wood",
          x,
          7,
          side * 13,
          0.2,
          0.28,
          12,
          8,
        );
    return b.finish(108, 36);
  }
  b.box("colonial_gallery_walls", "cream", 0, 4, 0, 58, 8, 24);
  windows(b, 58, 24, 7, "white");
  for (const x of [-19, 0, 19])
    gable(b, "three_cham_inspired_gables", "roof", x, 8, 0, 20, 26, 6);
  columns(b, 50, 14, 0.3, 5.5, 14);
  for (const x of [-19, 0, 19])
    b.arch("gallery_arched_entries", "cream", x, 0.2, 12.5, 7, 6, 0.6, 4, 5.3);
  return b.finish(60, 30);
}
function hall(kind: string) {
  const b = new LandmarkBuilder(kind),
    khmer = kind === "doi-pagoda",
    w = khmer ? 19 : 35,
    d = khmer ? 39 : 43;
  b.box("temple_raised_base", "stone", 0, 1, 0, w + 3, 2, d + 3);
  b.box("sanctuary_walls", khmer ? "cream" : "white", 0, 6, 0, w, 10, d);
  windows(b, w, d, 8, "gold", 2);
  for (const side of [-1, 1])
    for (let z = -d / 2; z <= d / 2; z += 5)
      b.cylinder(
        "veranda_columns",
        "cream",
        side * (w / 2 + 1),
        6,
        z,
        0.25,
        0.35,
        10,
        10,
      );
  b.roof("ornamental_lower_eaves", "red", 0, 11, 0, w + 5, d + 5, 3.5, 0.35);
  b.roof("ornamental_upper_roof", "roof", 0, 14, 0, w + 1, d - 2, 4, 0.35);
  if (khmer)
    for (const side of [-1, 1])
      for (const z of [-d / 2, d / 2])
        b.tube(
          "khmer_curled_roof_finials",
          "gold",
          [
            [side * w * 0.5, 11.5, z],
            [side * w * 0.66, 12.5, z],
            [side * w * 0.65, 15, z],
          ],
          0.17,
        );
  else
    for (const x of [-11, 0, 11]) {
      b.box("western_pediment_towers", "cream", x, 12, d / 2, 5, 7, 5);
      b.roof("tiered_roof_pavilions", "roof", x, 15.5, d / 2, 6, 6, 2, 0.25);
    }
  return b.finish(w + 7, d + 7);
}
function lighthouse(kind: string) {
  const b = new LandmarkBuilder(kind),
    kega = kind === "khega-light",
    h = kega ? 35 : kind === "vungtau-light" ? 18 : 26,
    r = kega ? 3 : 2.5;
  b.cylinder(
    "lighthouse_masonry_shaft",
    kega ? "stone" : "white",
    0,
    (h - 4) / 2,
    0,
    r * 0.78,
    r,
    h - 4,
    kega ? 8 : 24,
  );
  for (const y of [h * 0.25, h * 0.5, h * 0.7])
    b.box("tower_lancet_windows", "dark", 0, y, r * 0.93, 0.65, 1.25, 0.1);
  b.cylinder(
    "lantern_balcony",
    "stone",
    0,
    h - 4,
    0,
    r * 1.3,
    r * 1.3,
    0.4,
    24,
  );
  b.cylinder(
    "lantern_glass_room",
    "glass",
    0,
    h - 2.6,
    0,
    r * 0.8,
    r * 0.8,
    2.5,
    16,
  );
  b.cylinder("lantern_dome", "metal", 0, h - 0.6, 0, 0, r * 1.1, 1.4, 16);
  for (let i = 0; i < 20; i++) {
    const a = (i * Math.PI) / 10;
    b.cylinder(
      "balcony_railing_posts",
      "metal",
      Math.sin(a) * r * 1.2,
      h - 3.5,
      Math.cos(a) * r * 1.2,
      0.04,
      0.04,
      1,
      6,
    );
  }
  const points = Array.from(
    { length: 25 },
    (_, i) =>
      [
        Math.sin((i * Math.PI) / 12) * r * 1.2,
        h - 3,
        Math.cos((i * Math.PI) / 12) * r * 1.2,
      ] as [number, number, number],
  );
  b.tube("balcony_rail", "metal", points, 0.055);
  return b.finish(r * 2.7, r * 2.7);
}
function baoDai() {
  const b = new LandmarkBuilder("Bao_Dai_III");
  b.box("modernist_villa", "cream", 0, 4, 0, 35, 8, 24);
  windows(b, 35, 24, 7, "white");
  b.box("flat_roof_sunshade", "white", 0, 8.4, 0, 37, 0.5, 26);
  b.box("terrace_balcony", "stone", 0, 4.5, 14, 20, 0.35, 5);
  for (let x = -9; x <= 9; x += 1.5)
    b.box("balcony_rails", "white", x, 5.1, 16, 0.1, 1.2, 0.15);
  b.box("roof_access_pavilion", "cream", -10, 9.7, -5, 9, 2.5, 9);
  b.box("rooftop_pergola", "white", -10, 11.2, -5, 11, 0.3, 11);
  return b.finish(37, 34);
}
function damMarket() {
  const b = new LandmarkBuilder("Dam_Market");
  b.cylinder("circular_market_hall", "cream", 0, 4, 0, 28, 28, 8, 48);
  for (let i = 0; i < 48; i++) {
    const a = (i * Math.PI) / 24,
      x = Math.sin(a),
      z = Math.cos(a);
    b.box("round_market_louvers", "glass", x * 28.1, 5, z * 28.1, 2, 3, 0.1, a);
    b.cylinder(
      "lotus_canopy_columns",
      "cream",
      x * 30,
      4,
      z * 30,
      0.18,
      0.22,
      8,
      8,
    );
    b.tube(
      "lotus_roof_ribs",
      "white",
      [
        [x * 30, 8, z * 30],
        [x * 23, 13, z * 23],
        [x * 7, 15, z * 7],
      ],
      0.14,
    );
  }
  b.cylinder("lotus_market_roof", "roof", 0, 10, 0, 9, 31, 7, 48);
  b.cylinder("central_roof_lantern", "cream", 0, 14, 0, 8, 8, 3, 24);
  b.cylinder("lantern_cap", "roof", 0, 16, 0, 0, 10, 2, 24);
  return b.finish(62, 62);
}
function rongHouse() {
  const b = new LandmarkBuilder("Kon_Klor_Rong_House");
  b.box("raised_community_floor", "wood", 0, 3, 0, 15, 0.5, 25);
  for (const side of [-1, 1])
    for (let z = -10; z <= 10; z += 5)
      b.cylinder("exposed_stilts", "wood", side * 5.8, 1.5, z, 0.25, 0.4, 3, 8);
  b.box("woven_wall_panels", "cream", 0, 5.5, 0, 14, 5, 24);
  gable(b, "soaring_highland_thatch_roof", "roof", 0, 8, 0, 18, 29, 22);
  for (let z = -13; z <= 13; z += 2)
    for (const side of [-1, 1])
      b.tube(
        "exposed_roof_battens",
        "wood",
        [
          [side * 9, 8, z],
          [side * 5, 18, z],
          [0, 30, z],
        ],
        0.1,
      );
  for (let i = 0; i < 10; i++)
    b.box(
      "log_ladder_treads",
      "wood",
      0,
      0.2 + i * 0.3,
      16 - i * 0.25,
      2,
      0.4 + i * 0.6,
      0.3,
    );
  return b.finish(18, 34);
}
function nghinhPhong() {
  const b = new LandmarkBuilder("Nghinh_Phong_Towers");
  for (const side of [-1, 1])
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 5; col++) {
        const x = side * (3 + row * 1.6),
          z = (col - 2) * 1.65,
          h = (side > 0 ? 31 : 25) - row * 3 - Math.abs(col - 2) * 2;
        b.cylinder(
          "basalt_hexagonal_columns",
          "stone",
          x,
          h / 2,
          z,
          0.95,
          0.95,
          h,
          6,
        );
      }
  return b.finish(22, 9);
}
function caoVanLau() {
  const b = new LandmarkBuilder("Cao_Van_Lau_Theatre");
  b.box("shared_theatre_plinth", "white", 0, 1, 0, 61, 2, 39);
  for (const [x, z, r, h] of [
    [-19, 4, 15, 21],
    [0, -6, 19, 25],
    [20, 5, 14, 19],
  ]) {
    b.cylinder(
      "glazed_theatre_drums",
      "glass",
      x,
      4,
      z,
      r * 0.82,
      r * 0.82,
      8,
      32,
    );
    b.cylinder(
      "three_conical_hat_roofs",
      "cream",
      x,
      8 + h / 2,
      z,
      0.2,
      r,
      h,
      48,
    );
    b.cylinder(
      "conical_hat_eave_rings",
      "white",
      x,
      8,
      z,
      r * 1.02,
      r * 1.02,
      0.3,
      48,
    );
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12;
      b.tube(
        "hat_bamboo_ribs",
        "wood",
        [
          [x + Math.sin(a) * r, 8, z + Math.cos(a) * r],
          [x, 8 + h, z],
        ],
        0.05,
      );
    }
  }
  return b.finish(68, 50);
}
export function makeNationalLandmark(kind: string): LandmarkAsset | undefined {
  if (CHURCHES[kind]) return church(kind, CHURCHES[kind]);
  if (STUPAS[kind]) return stupa(kind, STUPAS[kind]);
  if (CHAM[kind]) return cham(kind, CHAM[kind]);
  switch (kind) {
    case "landmark-81":
      return landmark81();
    case "independence-palace":
      return palace();
    case "saigon-post-office":
      return postOffice();
    case "ben-thanh":
      return market();
    case "hanoi-opera":
      return opera(false);
    case "haiphong-opera":
      return opera(true);
    case "one-pillar":
    case "khue-van":
      return pavilion(kind);
    case "hanoi-flag":
    case "lung-cu-flag":
      return flagTower(kind);
    case "doan-mon":
      return gate();
    case "phat-diem":
    case "keo-bell":
      return bellHouse(kind);
    case "phu-cam":
      return phuCam();
    case "dalat-station":
      return station(true);
    case "haiphong-station":
      return station(false);
    case "quang-ninh-museum":
    case "ethnology-museum":
    case "daklak-museum":
    case "cham-museum":
      return museum(kind);
    case "vinh-trang":
    case "doi-pagoda":
      return hall(kind);
    case "vungtau-light":
    case "dailanh-light":
    case "khega-light":
      return lighthouse(kind);
    case "bao-dai-iii":
      return baoDai();
    case "dam-market":
      return damMarket();
    case "konklor-house":
      return rongHouse();
    case "nghinh-phong":
      return nghinhPhong();
    case "caovanlau-theatre":
      return caoVanLau();
    default:
      return undefined;
  }
}
