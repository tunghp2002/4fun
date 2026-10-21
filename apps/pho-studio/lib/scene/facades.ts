import * as THREE from "three";
import { contains, random, type Point } from "../geo/coordinates";

export interface FacadeBuilding {
  id: number;
  points: Point[];
  height: number;
  base: number;
  pitched: boolean;
  roofRise?: number;
  tags: Record<string, string>;
  fronts?: number[];
}

type Style = "paper" | "clay" | "ink";
// Color slots are shared by geometry and lettering, so all exports retain the shop fronts.
const PALETTES: Record<Style, string[]> = {
  paper: [
    "#eee4c9",
    "#b6a489",
    "#506b70",
    "#263c40",
    "#765241",
    "#737e77",
    "#355e55",
    "#ac5140",
    "#c49455",
    "#e8dfca",
    "#b7c5c0",
    "#8c9587",
    "#94583f",
    "#a76548",
    "#784c3c",
    "#b27a54",
  ],
  clay: [
    "#f6f3e9",
    "#d3cec2",
    "#9faead",
    "#788884",
    "#b8afa0",
    "#b3b9b2",
    "#9faa9a",
    "#c7b6a5",
    "#d3c5ad",
    "#f8f5ec",
    "#c5cfcb",
    "#c7ccbf",
    "#f0eee7",
    "#ece9e1",
    "#e8e5dc",
    "#f2efe8",
  ],
  ink: [
    "#fafaf5",
    "#c7c8bd",
    "#606d6b",
    "#333c3a",
    "#77796e",
    "#7c827a",
    "#727c72",
    "#77796f",
    "#b4b4a2",
    "#f7f7ef",
    "#d6ddd6",
    "#b5bdaf",
    "#bdbdb9",
    "#b8b9b3",
    "#b0b1ab",
    "#c5c5be",
  ],
};
const GLYPHS: Record<string, string[]> = {
  A: ["01110", "10001", "11111", "10001", "10001"],
  B: ["11110", "10001", "11110", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  G: ["01111", "10000", "10111", "10001", "01111"],
  H: ["10001", "10001", "11111", "10001", "10001"],
  I: ["111", "010", "010", "010", "111"],
  K: ["10001", "10010", "11100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001"],
  O: ["01110", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "11110", "10000", "10000"],
  R: ["11110", "10001", "11110", "10010", "10001"],
  S: ["01111", "10000", "01110", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "01110"],
  Y: ["10001", "01010", "00100", "00100", "00100"],
};
const SHOP_NAMES = [
  "CA PHE",
  "BANH MI",
  "TIEM PHO",
  "TAP HOA",
  "BUN CHA",
  "TIEM HOA",
  "MAY DO",
  "SACH",
];
const BOX_LIMIT = 18_000;

export function estimateFacade(building: FacadeBuilding) {
  const floors = Math.max(1, Math.min(80, Math.round(building.height / 3.3)));
  const bays = building.points.reduce((sum, a, i, points) => {
    const b = points[(i + 1) % points.length];
    return (
      sum +
      Math.min(
        12,
        Math.max(1, Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3)),
      )
    );
  }, 0);
  return (
    (bays * (Math.min(floors, 12) * 10 + Math.max(0, floors - 12) * 3) +
      building.points.length * floors +
      220) *
    36
  );
}

export function createFacadeDetails(buildings: FacadeBuilding[], seed: number) {
  const root = new THREE.Group();
  root.name = "Chi_tiet_mat_tien";
  const positions: number[] = [],
    normals: number[] = [],
    tones: number[] = [],
    lines: number[] = [];
  const cubeSource = new THREE.BoxGeometry(1, 1, 1);
  const cube = cubeSource.toNonIndexed();
  cubeSource.dispose();
  const indexedCylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  const cylinderSource = indexedCylinder.toNonIndexed();
  indexedCylinder.dispose();
  let boxes = 0;

  function face(a: Point, tangent: Point, outward: Point, base: number) {
    const handedness = tangent[0] * outward[1] - tangent[1] * outward[0];
    const point = (u: number, y: number, n: number) => [
      a[0] + tangent[0] * u + outward[0] * n,
      base + y,
      a[1] + tangent[1] * u + outward[1] * n,
    ];
    const box = (
      u: number,
      y: number,
      n: number,
      w: number,
      h: number,
      d: number,
      tone: number,
      outlined = false,
      tilt = 0,
      source = cube,
    ) => {
      if (boxes >= BOX_LIMIT || w <= 0 || h <= 0 || d <= 0) return;
      boxes++;
      const p = source.getAttribute("position"),
        normal = source.getAttribute("normal");
      const cosine = Math.cos(tilt),
        sine = Math.sin(tilt);
      for (let j = 0; j < p.count; j++) {
        const index = handedness < 0 ? j - (j % 3) + [0, 2, 1][j % 3] : j;
        const x = p.getX(index) * w,
          py = p.getY(index) * h,
          pz = p.getZ(index) * d;
        positions.push(
          ...point(
            u + x,
            y + py * cosine - pz * sine,
            n + py * sine + pz * cosine,
          ),
        );
        let nx = normal.getX(index) / w,
          ny = normal.getY(index) / h,
          nz = normal.getZ(index) / d;
        const length = Math.hypot(nx, ny, nz);
        nx /= length;
        ny /= length;
        nz /= length;
        const ry = ny * cosine - nz * sine,
          rz = ny * sine + nz * cosine;
        normals.push(
          tangent[0] * nx + outward[0] * rz,
          ry,
          tangent[1] * nx + outward[1] * rz,
        );
        tones.push(tone);
      }
      if (outlined && source === cube) {
        const corners = [-1, 1].flatMap((x) =>
          [-1, 1].flatMap((py) =>
            [-1, 1].map((pz) =>
              point(
                u + (x * w) / 2,
                y + ((py * h) / 2) * cosine - ((pz * d) / 2) * sine,
                n + ((py * h) / 2) * sine + ((pz * d) / 2) * cosine,
              ),
            ),
          ),
        );
        for (const [i, j] of [
          [0, 1],
          [0, 2],
          [0, 4],
          [1, 3],
          [1, 5],
          [2, 3],
          [2, 6],
          [3, 7],
          [4, 5],
          [4, 6],
          [5, 7],
          [6, 7],
        ])
          lines.push(...corners[i], ...corners[j]);
      }
    };
    const lettering = (
      text: string,
      center: number,
      y: number,
      n: number,
      width: number,
      height: number,
    ) => {
      const lengths = [...text].map((letter) =>
        letter === " " ? 3 : (GLYPHS[letter]?.[0].length ?? 5) + 1,
      );
      const units = lengths.reduce((sum, length) => sum + length, 0) - 1;
      const pixel = Math.min(width / units, height / 5);
      let cursor = center - (units * pixel) / 2;
      for (let letter = 0; letter < text.length; letter++) {
        const glyph = GLYPHS[text[letter]];
        if (glyph)
          for (let row = 0; row < 5; row++)
            for (let col = 0; col < glyph[row].length; col++) {
              if (glyph[row][col] !== "1") continue;
              const left = cursor + col * pixel,
                top = y + (2.5 - row) * pixel,
                size = pixel * 0.93;
              const corners = [
                point(left, top - size, n),
                point(left + size, top - size, n),
                point(left + size, top, n),
                point(left, top, n),
              ];
              for (const index of handedness < 0
                ? [0, 2, 1, 0, 3, 2]
                : [0, 1, 2, 0, 2, 3]) {
                positions.push(...corners[index]);
                normals.push(outward[0], 0, outward[1]);
                tones.push(9);
              }
            }
        cursor += lengths[letter] * pixel;
      }
    };
    return { box, lettering };
  }

  for (const building of buildings.slice(0, 128)) {
    if (boxes >= BOX_LIMIT) break;
    const points = building.points;
    if (
      points.length < 3 ||
      !Number.isFinite(building.height + building.base) ||
      building.height < 2 ||
      points.some(([x, z]) => !Number.isFinite(x + z))
    )
      continue;
    const signedArea = points.reduce((sum, a, i) => {
      const b = points[(i + 1) % points.length];
      return sum + a[0] * b[1] - b[0] * a[1];
    }, 0);
    if (Math.abs(signedArea) < 2) continue;
    const edgeLengths = points.map((a, i) =>
      Math.hypot(
        points[(i + 1) % points.length][0] - a[0],
        points[(i + 1) % points.length][1] - a[1],
      ),
    );
    const fronts = new Set(
      building.fronts ?? [edgeLengths.indexOf(Math.max(...edgeLengths))],
    );
    const rnd = random(seed ^ Math.imul(building.id, 2654435761));
    const floors = Math.max(1, Math.round(building.height / 3.3));
    const floorHeight = building.height / floors;
    const traditional = building.pitched && building.height < 13;
    const trimTone = traditional ? 4 : rnd() < 0.7 ? 0 : 1;
    const signTone = 6 + Math.floor(rnd() * 3);
    const shop =
      !/church|temple|school|warehouse|industrial|garage/.test(
        building.tags.building ?? "",
      ) &&
      (Boolean(building.tags.shop || building.tags.amenity) || rnd() < 0.7);
    const balcony = floors > 1 && floors < 9 && rnd() < 0.65;
    const name = SHOP_NAMES[Math.floor(rnd() * SHOP_NAMES.length)];

    for (let edge = 0; edge < Math.min(points.length, 24); edge++) {
      const a = points[edge],
        b = points[(edge + 1) % points.length],
        length = edgeLengths[edge];
      if (length < 1.7) continue;
      const tangent: Point = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
      const outward: Point =
        signedArea > 0 ? [tangent[1], -tangent[0]] : [-tangent[1], tangent[0]];
      const { box, lettering } = face(a, tangent, outward, building.base);
      const front = fronts.has(edge),
        bays = Math.min(
          front ? 16 : 12,
          Math.max(1, Math.floor(length / (traditional ? 2.7 : 3.4))),
        );
      const bayWidth = length / bays,
        glassWidth = Math.min(1.55, bayWidth * 0.56);
      const frameWidth = traditional ? 0.085 : 0.075;
      const window = (
        u: number,
        y: number,
        width: number,
        height: number,
        door = false,
      ) => {
        box(u, y, 0.035, width + 0.18, height + 0.18, 0.05, 3);
        box(u, y, 0.075, width, height, 0.045, door ? 3 : 2);
        for (const side of [-1, 1]) {
          box(
            u + side * (width / 2 + frameWidth / 2),
            y,
            0.115,
            frameWidth,
            height + frameWidth * 2,
            0.2,
            trimTone,
          );
          box(
            u,
            y + side * (height / 2 + frameWidth / 2),
            0.115,
            width,
            frameWidth,
            0.2,
            trimTone,
          );
        }
        box(u, y, 0.1, 0.045, height, 0.12, trimTone);
        if (!door) box(u, y + height * 0.2, 0.13, width, 0.045, 0.11, trimTone);
        if (!door)
          box(
            u,
            y - height / 2 - 0.07,
            0.19,
            width + 0.28,
            0.11,
            0.4,
            traditional ? 4 : 0,
          );
      };

      box(length / 2, 0.17, 0.09, length, 0.33, 0.2, 1);
      for (const u of [0.13, length - 0.13])
        box(
          u,
          building.height / 2,
          0.065,
          0.2,
          building.height,
          0.17,
          traditional ? 4 : 0,
        );
      box(
        length / 2,
        building.height - 0.08,
        0.12,
        length + 0.05,
        0.22,
        0.34,
        trimTone,
        true,
      );
      if (!building.pitched)
        box(
          length / 2,
          building.height + 0.53,
          0,
          length + 0.1,
          0.11,
          0.42,
          trimTone,
        );

      for (let floor = 0; floor < Math.min(floors, 80); floor++) {
        if (floor)
          box(
            length / 2,
            floor * floorHeight,
            0.1,
            length,
            traditional ? 0.13 : 0.21,
            traditional ? 0.22 : 0.3,
            trimTone,
            front,
          );
        for (let bay = 0; bay < bays; bay++) {
          const u = (bay + 0.5) * bayWidth;
          if (floor >= 12) {
            const y = floor * floorHeight + floorHeight * 0.54,
              height = Math.min(1.7, floorHeight * 0.63);
            box(u, y, 0.045, glassWidth, height, 0.045, 2);
            box(u, y, 0.1, 0.065, height, 0.12, trimTone);
            box(u, y - height / 2, 0.12, glassWidth + 0.15, 0.1, 0.24, 0);
            continue;
          }
          if (!floor && front && shop) {
            const width = Math.max(0.8, bayWidth - 0.36),
              height = Math.min(2.6, floorHeight * 0.73);
            window(u, 0.3 + height / 2, width, height, true);
            if (bay % 3 === 2) {
              box(
                u,
                height * 0.5 + 0.3,
                0.22,
                width - 0.12,
                height - 0.08,
                0.04,
                11,
              );
              for (let slat = 0.4; slat < height; slat += 0.19)
                box(u, slat + 0.25, 0.25, width - 0.12, 0.025, 0.025, 5);
            } else {
              box(u + width * 0.28, 1.2, 0.25, 0.045, 0.32, 0.05, 9);
              box(u, 0.24, 0.25, width + 0.08, 0.12, 0.5, 1);
            }
            continue;
          }
          const y = floor * floorHeight + floorHeight * 0.54;
          const hasBalcony =
            front && balcony && floor > 0 && (bay + floor) % 2 === 0;
          const height = Math.min(hasBalcony ? 2.1 : 1.5, floorHeight * 0.63);
          window(
            u,
            hasBalcony ? floor * floorHeight + 0.25 + height / 2 : y,
            glassWidth,
            height,
            hasBalcony,
          );
          if (hasBalcony) {
            const platformY = floor * floorHeight + 0.06,
              width = Math.min(bayWidth - 0.12, glassWidth + 0.7),
              depth = traditional ? 0.7 : 0.86;
            box(u, platformY, depth / 2, width, 0.15, depth + 0.15, 0, true);
            for (const railY of [0.2, 1.05])
              box(
                u,
                platformY + railY,
                depth,
                width,
                0.055,
                0.055,
                traditional ? 4 : 5,
              );
            for (let bar = 0; bar <= Math.ceil(width / 0.28); bar++)
              box(
                u - width / 2 + (bar * width) / Math.ceil(width / 0.28),
                platformY + 0.6,
                depth,
                0.035,
                0.95,
                0.035,
                traditional ? 4 : 5,
              );
            for (const side of [-1, 1])
              box(
                u + (side * width) / 2,
                platformY + 1.05,
                depth / 2,
                0.045,
                0.055,
                depth,
                traditional ? 4 : 5,
              );
            if ((bay + floor + building.id) % 3 === 0) {
              box(
                u + width * 0.28,
                platformY + 0.25,
                depth * 0.55,
                0.4,
                0.32,
                0.35,
                7,
              );
              box(
                u + width * 0.28,
                platformY + 0.48,
                depth * 0.55,
                0.46,
                0.22,
                0.42,
                6,
              );
            }
          } else if (traditional && front) {
            for (const side of [-1, 1]) {
              box(
                u + side * (glassWidth / 2 + 0.25),
                y,
                0.09,
                0.34,
                height + 0.1,
                0.07,
                4,
              );
              for (
                let slat = -height / 2 + 0.08;
                slat < height / 2;
                slat += 0.16
              )
                box(
                  u + side * (glassWidth / 2 + 0.25),
                  y + slat,
                  0.145,
                  0.28,
                  0.035,
                  0.04,
                  1,
                );
            }
          }
          if (
            !traditional &&
            front &&
            floor > 0 &&
            (bay + floor + building.id) % 4 === 0
          ) {
            const acU = Math.min(length - 0.42, u + glassWidth / 2 + 0.45),
              acY = floor * floorHeight + 0.65;
            box(acU, acY, 0.3, 0.7, 0.47, 0.52, 10, true);
            for (let slat = 0; slat < 4; slat++)
              box(acU, acY - 0.14 + slat * 0.09, 0.57, 0.55, 0.026, 0.02, 5);
          }
        }
      }

      if (front && shop) {
        const width = Math.min(length - 0.45, 9),
          signHeight = Math.min(0.7, floorHeight * 0.2),
          signY = Math.min(floorHeight - signHeight * 0.55, 3.05);
        box(length / 2, signY, 0.22, width, signHeight, 0.24, signTone, true);
        lettering(
          name,
          length / 2,
          signY,
          0.345,
          width * 0.84,
          signHeight * 0.67,
        );
        const awningY = signY - signHeight * 0.6;
        const stripes = Math.max(2, Math.min(12, Math.round(width / 0.45)));
        for (let stripe = 0; stripe < stripes; stripe++) {
          const u = length / 2 - width / 2 + ((stripe + 0.5) * width) / stripes;
          box(
            u,
            awningY - 0.08,
            0.68,
            width / stripes - 0.008,
            0.065,
            1.15,
            stripe % 2 ? 9 : signTone,
            false,
            0.2,
          );
          box(
            u,
            awningY - 0.25,
            1.24,
            width / stripes - 0.008,
            0.2,
            0.045,
            stripe % 2 ? 9 : signTone,
          );
        }
      }
    }

    if (building.pitched && building.roofRise) {
      const longest = edgeLengths.indexOf(Math.max(...edgeLengths));
      const a = points[longest],
        b = points[(longest + 1) % points.length];
      const axis: Point = [
        (b[0] - a[0]) / edgeLengths[longest],
        (b[1] - a[1]) / edgeLengths[longest],
      ];
      const across: Point = [-axis[1], axis[0]];
      const alongs = points.map((p) => p[0] * axis[0] + p[1] * axis[1]);
      const widths = points.map((p) => p[0] * across[0] + p[1] * across[1]);
      const lo = Math.min(...widths),
        hi = Math.max(...widths),
        middle = (lo + hi) / 2;
      const halfWidth = (hi - lo) / 2,
        rise = building.roofRise;
      const { box } = face(
        [across[0] * middle, across[1] * middle],
        axis,
        across,
        building.base + building.height,
      );
      const inside = (u: number, n: number) =>
        contains(
          points,
          axis[0] * u + across[0] * (n + middle),
          axis[1] * u + across[1] * (n + middle),
        );
      const start = Math.min(...alongs),
        end = Math.max(...alongs);
      const tileTone = 12 + (Math.abs(building.id) % 4);
      for (let u = start + 0.25; u < end - 0.1; u += 0.52) {
        for (const side of [-1, 1]) {
          if (!inside(u, side * (halfWidth - 0.2)) || !inside(u, side * 0.12))
            continue;
          box(
            u,
            rise / 2 + 0.045,
            (side * halfWidth) / 2,
            0.075,
            0.06,
            Math.hypot(halfWidth, rise),
            tileTone,
            false,
            side * Math.atan2(rise, halfWidth),
          );
        }
        if (inside(u, 0)) box(u, rise + 0.1, 0, 0.5, 0.18, 0.22, tileTone);
      }
      for (let n = -halfWidth + 0.45; n < halfWidth - 0.2; n += 0.6) {
        const intersections: number[] = [];
        for (let i = 0; i < points.length; i++) {
          const next = (i + 1) % points.length;
          const a = widths[i] - middle,
            b = widths[next] - middle;
          if (a > n === b > n) continue;
          intersections.push(
            alongs[i] + ((alongs[next] - alongs[i]) * (n - a)) / (b - a),
          );
        }
        intersections.sort((a, b) => a - b);
        for (let i = 1; i < intersections.length; i += 2) {
          const left = intersections[i - 1],
            right = intersections[i];
          box(
            (left + right) / 2,
            rise * (1 - Math.abs(n) / halfWidth) + 0.045,
            n,
            right - left,
            0.035,
            0.065,
            tileTone,
          );
        }
      }
    }

    if (!building.pitched && building.height < 42 && rnd() < 0.7) {
      const x = points.reduce((sum, p) => sum + p[0], 0) / points.length,
        z = points.reduce((sum, p) => sum + p[1], 0) / points.length;
      if (!contains(points, x, z)) continue;
      const { box } = face(
        [x, z],
        [1, 0],
        [0, 1],
        building.base + building.height,
      );
      box(0, 0.2, 0, 1.5, 0.35, 1.5, 5);
      box(0, 1.12, 0, 0.65, 1.5, 0.65, 10, false, 0, cylinderSource);
      for (const y of [0.52, 1.12, 1.72])
        box(0, y, 0, 0.68, 0.04, 0.68, 5, false, 0, cylinderSource);
      box(0, 1.9, 0, 0.5, 0.1, 0.5, 5, false, 0, cylinderSource);
      if (building.height < 22 && Math.abs(signedArea) > 140) {
        box(0, 0.65, -2, 2.1, 0.12, 1.35, 2, true, -0.32);
        for (const u of [-0.7, 0, 0.7])
          box(u, 0.65, -2, 0.035, 0.14, 1.35, 10, false, -0.32);
        box(0, 0.25, -2, 1.8, 0.5, 0.07, 5);
      }
    }
  }
  cube.dispose();
  cylinderSource.dispose();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  const colors = new THREE.Float32BufferAttribute(
    new Float32Array(positions.length),
    3,
  );
  geometry.setAttribute("color", colors);
  geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.8,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "Khung_cua_ban_cong_bien_hieu";
  mesh.castShadow = mesh.receiveShadow = true;
  root.add(mesh);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(lines, 3),
  );
  const lineMaterial = new THREE.LineBasicMaterial({
    color: "#343c35",
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const edges = new THREE.LineSegments(lineGeometry, lineMaterial);
  edges.name = "Net_kien_truc";
  root.add(edges);
  root.userData.buildings = Math.min(buildings.length, 128);
  root.userData.parts = boxes;
  root.userData.vertices = positions.length / 3;
  root.userData.drawCalls = 2;
  let currentStyle: Style | undefined,
    disposed = false;
  function apply(style: Style, outlines = 0.55) {
    if (disposed) return;
    if (currentStyle !== style) {
      currentStyle = style;
      const palette = PALETTES[style].map((color) => new THREE.Color(color));
      for (let vertex = 0; vertex < tones.length; vertex++) {
        const color = palette[tones[vertex]];
        colors.setXYZ(vertex, color.r, color.g, color.b);
      }
      colors.needsUpdate = true;
    }
    lineMaterial.color.set(style === "ink" ? "#202921" : "#59604e");
    lineMaterial.opacity =
      Math.max(0, Math.min(1, outlines)) *
      (style === "ink" ? 1 : style === "clay" ? 0.3 : 0.55);
  }
  apply("paper");
  return {
    root,
    apply,
    dispose() {
      if (disposed) return;
      disposed = true;
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      root.clear();
    },
  };
}
