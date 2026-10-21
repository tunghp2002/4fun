import * as THREE from "three";
import ClipperLib from "clipper-lib";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { drapeGeometry } from "./surfaces";
import type { Point } from "../geo/coordinates";
import type { Tags } from "../types";

export type MultiPolygon = Point[][][];
const CLIP_SCALE = 1000;

export function areaMask(areas: MultiPolygon) {
  const bounds = (ring: Point[]) => [
    Math.min(...ring.map((p) => p[0])),
    Math.min(...ring.map((p) => p[1])),
    Math.max(...ring.map((p) => p[0])),
    Math.max(...ring.map((p) => p[1])),
  ];
  const indexed = areas
    .filter((a) => a[0]?.length >= 3)
    .map((area) => ({ area, bounds: bounds(area[0]) }));
  return (points: Point[], holes: Point[][]): MultiPolygon => {
    const [x0, z0, x1, z1] = bounds(points);
    const clips = indexed
      .filter(
        (a) =>
          a.bounds[2] >= x0 &&
          a.bounds[0] <= x1 &&
          a.bounds[3] >= z0 &&
          a.bounds[1] <= z1,
      )
      .map((a) => a.area);
    return clips.length
      ? clipArea([[points, ...holes]], clips, "difference")
      : [[points, ...holes]];
  };
}

export function clipArea(
  subject: MultiPolygon,
  clips: MultiPolygon,
  operation: "union" | "intersection" | "difference",
): MultiPolygon {
  if (!subject.length || (operation === "intersection" && !clips.length))
    return [];
  const paths = (polygons: MultiPolygon) =>
    polygons.flatMap((polygon) =>
      polygon.map((ring, i) => {
        const path = ring.map(([x, z]) => ({
          X: Math.round(x * CLIP_SCALE),
          Y: Math.round(z * CLIP_SCALE),
        }));
        if (ClipperLib.Clipper.Orientation(path) !== (i === 0)) path.reverse();
        return path;
      }),
    );
  const clipper = new ClipperLib.Clipper();
  clipper.StrictlySimple = true;
  clipper.AddPaths(paths(subject), ClipperLib.PolyType.ptSubject, true);
  clipper.AddPaths(paths(clips), ClipperLib.PolyType.ptClip, true);
  const tree = new ClipperLib.PolyTree();
  const type =
    operation === "union"
      ? ClipperLib.ClipType.ctUnion
      : operation === "intersection"
        ? ClipperLib.ClipType.ctIntersection
        : ClipperLib.ClipType.ctDifference;
  if (
    !clipper.Execute(
      type,
      tree,
      ClipperLib.PolyFillType.pftNonZero,
      ClipperLib.PolyFillType.pftNonZero,
    )
  )
    throw new Error("Không ghép được mặt đường.");
  return areaFromTree(tree);
}

function areaFromTree(tree: ClipperLib.PolyTree): MultiPolygon {
  const result: MultiPolygon = [];
  for (let node = tree.GetFirst(); node; node = node.GetNext())
    if (!node.IsHole()) {
      result.push(
        [node, ...node.Childs().filter((n) => n.IsHole())].map((n) =>
          n.Contour().map((p) => [p.X / CLIP_SCALE, p.Y / CLIP_SCALE]),
        ),
      );
    }
  return result;
}

export const pedestrianRoad =
  /^(footway|path|steps|pedestrian|cycleway|corridor)$/;

export function roadWidth(tags: Tags) {
  const specified = Number.parseFloat(tags.width);
  return Math.min(
    28,
    specified > 0
      ? specified
      : /^(motorway|trunk|primary)$/.test(tags.highway)
        ? 13
        : /^(secondary|tertiary)$/.test(tags.highway)
          ? 9
          : pedestrianRoad.test(tags.highway)
            ? 2.8
            : 5.2,
  );
}

export function roadFootprint(
  lines: { points: Point[]; width: number }[],
): MultiPolygon {
  const groups = new Map<number, ClipperLib.ClipperOffset>();
  for (const { points, width } of lines) {
    if (!(width > 0 && Number.isFinite(width))) continue;
    const radius = Math.round((width * CLIP_SCALE) / 2);
    if (!radius) continue;
    const path = points
      .map(([x, z]) => ({
        X: Math.round(x * CLIP_SCALE),
        Y: Math.round(z * CLIP_SCALE),
      }))
      .filter((p, i, a) => !i || p.X !== a[i - 1].X || p.Y !== a[i - 1].Y);
    const closed =
      path.length > 3 &&
      path[0].X === path[path.length - 1].X &&
      path[0].Y === path[path.length - 1].Y;
    if (closed) path.pop();
    if (path.length < 2) continue;
    let offset = groups.get(radius);
    if (!offset) {
      offset = new ClipperLib.ClipperOffset(2, 60);
      groups.set(radius, offset);
    }
    offset.AddPath(
      path,
      ClipperLib.JoinType.jtRound,
      closed ? ClipperLib.EndType.etClosedLine : ClipperLib.EndType.etOpenRound,
    );
  }
  // Integer millimeters keep coincident streets stable; round joins cannot form long miter spikes.
  const areas: MultiPolygon = [];
  for (const [radius, offset] of groups) {
    const tree = new ClipperLib.PolyTree();
    offset.Execute(tree, radius);
    areas.push(...areaFromTree(tree));
  }
  return groups.size > 1 ? clipArea(areas, [], "union") : areas;
}

export function roadJoins(
  points: Point[],
  width: number,
  maxError = 0.04,
): Point[][] {
  const radius = width / 2,
    steps = Math.max(
      12,
      Math.ceil(Math.PI / Math.acos(1 - Math.min(maxError, radius) / radius)),
    );
  return points
    .filter((p, i) => {
      if (!i || i === points.length - 1) return true;
      const a = points[i - 1],
        b = points[i + 1],
        dx = p[0] - a[0],
        dz = p[1] - a[1],
        ex = b[0] - p[0],
        ez = b[1] - p[1];
      return (
        dx * ex + dz * ez <= 0 ||
        Math.abs(dx * ez - dz * ex) >
          0.01 * Math.hypot(dx, dz) * Math.hypot(ex, ez)
      );
    })
    .map((p) =>
      Array.from(
        { length: steps },
        (_, i): Point => [
          p[0] + Math.cos((i * Math.PI * 2) / steps) * radius,
          p[1] + Math.sin((i * Math.PI * 2) / steps) * radius,
        ],
      ),
    );
}

export function pavementGeometry(
  polygons: MultiPolygon,
  height: (x: number, z: number) => number,
  thickness: number,
  step = 8,
  origin = 0,
) {
  const pieces: THREE.BufferGeometry[] = [];
  for (const [outer, ...holes] of polygons) {
    const shape = new THREE.Shape(
      outer.map(([x, z]) => new THREE.Vector2(x, -z)),
    );
    shape.holes = holes
      .filter((r) => r.length >= 3)
      .map((r) => new THREE.Path(r.map(([x, z]) => new THREE.Vector2(x, -z))));
    const flat = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
      steps: 1,
    });
    flat.rotateX(-Math.PI / 2);
    const position = flat.getAttribute("position");
    for (let i = 0; i < position.count; i++)
      position.setY(
        i,
        position.getY(i) + height(position.getX(i), position.getZ(i)) + 0.3,
      );
    pieces.push(
      drapeGeometry(flat, (x, z) => height(x, z) + 0.3, step, origin),
    );
    flat.dispose();
  }
  const merged = pieces.length ? mergeGeometries(pieces) : null;
  pieces.forEach((g) => g.dispose());
  return merged;
}
