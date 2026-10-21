import * as THREE from "three";
import catalog from "./catalog.json";
export { LANDMARK_CATALOG } from "../../landmarks";
import { makeNationalLandmark } from "./national";
import { makeScenicLandmark } from "./scenic";
import { makeHanoiLandmark } from "./hanoi";
import { makeHeritageLandmark } from "./heritage";
import { makeUrbanLandmark } from "./urban";
import type { LandmarkAsset } from "./geometry";
import { insideFootprint, interiorRectangle } from "./footprint";
import { project, unproject, type Point } from "../../geo/coordinates";
import { areaMask, clipArea, type MultiPolygon } from "../roads";
import type {
  MapData,
  MapFeature,
  SceneLandmark,
  SceneSettings,
} from "../../types";

export function createLandmarks(
  data: MapData,
  height: (x: number, z: number) => number,
  innerSpan = 0,
) {
  const root = new THREE.Group();
  root.name = "Vietnam_landmarks";
  const assets: LandmarkAsset[] = [],
    list: SceneLandmark[] = [];
  const surfaceMasks: MultiPolygon = [];
  const nearby = catalog
    .map((entry) => {
      const [x, z] = project(entry, data.center);
      const points: Point[] = (entry.footprint ?? []).map(([lat, lon]) =>
        project({ lat, lon }, data.center),
      );
      const masks: Record<string, [number, number]> = {
        "the-huc": [10, 49],
        "dragon-bridge": [666, 40],
        "dac-nguyet": [10, 7],
        inkstone: [8, 3],
        "pen-tower": [12, 12],
        "ly-thai-to": [10, 10],
        "le-thai-to": [6, 6],
        "ho-chi-minh-statue": [8, 8],
        "carp-fountain": [12, 12],
      };
      const mask = masks[entry.kind];
      if (mask) {
        const angle = ((180 - entry.bearing) * Math.PI) / 180;
        points.length = 0;
        for (const [mx, mz] of [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ]) {
          const px = (mx * mask[0]) / 2,
            pz = (mz * mask[1]) / 2;
          points.push([
            x + px * Math.cos(angle) + pz * Math.sin(angle),
            z - px * Math.sin(angle) + pz * Math.cos(angle),
          ]);
        }
      }
      const holes = entry.footprintHoles.map((ring) =>
        ring.map(([lat, lon]) => project({ lat, lon }, data.center)),
      );
      return { entry, x, z, points, holes };
    })
    .filter(
      (item) =>
        Math.max(Math.abs(item.x), Math.abs(item.z)) <
        Math.max(2200, data.span) / 2 + 100,
    );
  try {
    for (const { entry, x, z, points, holes } of nearby) {
      // Omitted objects keep their masks so map tiles cannot restore generic extrusions.
      if (entry.hidden) continue;
      const distance = Math.max(Math.abs(x), Math.abs(z));
      if (
        distance >= data.span / 2 ||
        (innerSpan > 0 && distance < innerSpan / 2)
      )
        continue;
      let rotation = ((180 - entry.bearing) * Math.PI) / 180;
      const footprintBounds = (angle: number) => {
        const c = Math.cos(angle),
          s = Math.sin(angle);
        return new THREE.Box2().setFromPoints(
          points.map(
            ([px, pz]) =>
              new THREE.Vector2(
                (px - x) * c - (pz - z) * s,
                (px - x) * s + (pz - z) * c,
              ),
          ),
        );
      };
      let footprint = footprintBounds(rotation);
      if (entry.fit && points.length > 2) {
        // Use the surveyed wall axes; a diagonal bounding box enlarges the building into streets.
        const bearingRotation = rotation,
          size = footprint.getSize(new THREE.Vector2());
        let area = size.x * size.y;
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i],
            b = points[i + 1];
          if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1) continue;
          for (let quarter = -2; quarter <= 2; quarter++) {
            const angle =
              Math.atan2(a[1] - b[1], b[0] - a[0]) + (quarter * Math.PI) / 2;
            const difference = Math.atan2(
              Math.sin(angle - bearingRotation),
              Math.cos(angle - bearingRotation),
            );
            if (Math.abs(difference) > Math.PI / 4) continue;
            const bounds = footprintBounds(angle),
              size = bounds.getSize(new THREE.Vector2());
            if (size.x * size.y < area) {
              area = size.x * size.y;
              footprint = bounds;
              rotation = angle;
            }
          }
        }
      }
      const replacesSurface = [
        "fighting-cocks",
        "phong-nha-cave",
        "ban-gioc-falls",
      ].includes(entry.kind);
      const shore = [0, -25, 25].map((side) =>
        height(
          x + side * Math.cos(rotation) + 45 * Math.sin(rotation),
          z - side * Math.sin(rotation) + 45 * Math.cos(rotation),
        ),
      );
      const base = (replacesSurface ? Math.min(...shore) : height(x, z)) + 0.24;
      const ground = (px: number, pz: number) =>
        height(
          x + px * Math.cos(rotation) + pz * Math.sin(rotation),
          z - px * Math.sin(rotation) + pz * Math.cos(rotation),
        ) - base;
      const asset =
        makeHanoiLandmark(entry.kind) ??
        makeHeritageLandmark(entry.kind) ??
        makeNationalLandmark(entry.kind) ??
        makeScenicLandmark(
          entry.kind,
          ground,
          (entry.path ?? []).map(([lat, lon]) => {
            const [px, pz] = project({ lat, lon }, data.center);
            return [
              (px - x) * Math.cos(rotation) - (pz - z) * Math.sin(rotation),
              (px - x) * Math.sin(rotation) + (pz - z) * Math.cos(rotation),
            ] as Point;
          }),
          points.map(
            ([px, pz]) =>
              [
                (px - x) * Math.cos(rotation) - (pz - z) * Math.sin(rotation),
                (px - x) * Math.sin(rotation) + (pz - z) * Math.cos(rotation),
              ] as Point,
          ),
        ) ??
        makeUrbanLandmark(entry.kind, ground);
      if (!asset) continue;
      assets.push(asset);
      const box = new THREE.Box3().setFromObject(asset.root);
      const bounds = box.getSize(new THREE.Vector3());
      if (entry.fitInterior) {
        const c = Math.cos(rotation),
          s = Math.sin(rotation);
        footprint = interiorRectangle(
          points.map(([px, pz]) => [
            (px - x) * c - (pz - z) * s,
            (px - x) * s + (pz - z) * c,
          ]),
          footprint,
          bounds.x / bounds.z,
          holes.map((ring) =>
            ring.map(
              ([px, pz]) =>
                [
                  (px - x) * c - (pz - z) * s,
                  (px - x) * s + (pz - z) * c,
                ] as Point,
            ),
          ),
        );
      }
      let sx = 1,
        sz = 1,
        px = x,
        pz = z,
        centerX = x,
        centerZ = z;
      if (entry.fit && points.length > 2) {
        const c = Math.cos(rotation),
          s = Math.sin(rotation);
        const size = footprint.getSize(new THREE.Vector2());
        const target = footprint.getCenter(new THREE.Vector2());
        const origin = box.getCenter(new THREE.Vector3());
        sx = size.x / bounds.x;
        sz = size.y / bounds.z;
        if (entry.fitUniform) sx = sz = Math.min(sx, sz) * 0.9;
        centerX += target.x * c + target.y * s;
        centerZ += -target.x * s + target.y * c;
        px = centerX - origin.x * sx * c - origin.z * sz * s;
        pz = centerZ + origin.x * sx * s - origin.z * sz * c;
      }
      asset.root.name = entry.name;
      asset.root.position.set(px, base, pz);
      asset.root.rotation.y = rotation;
      asset.root.scale.set(sx, 1, sz);
      asset.root.userData = {
        ...asset.root.userData,
        landmarkId: entry.id,
        source: entry.osm
          ? `https://www.openstreetmap.org/${entry.osm.type}/${entry.osm.id}`
          : (entry.reference ?? "Illustrative placement"),
        approximateAnchor: entry.approximateAnchor ?? false,
      };
      root.add(asset.root);
      if (replacesSurface) {
        asset.root.updateMatrixWorld(true);
        for (const polygon of asset.root.userData
          .surfaceFootprints as MultiPolygon)
          surfaceMasks.push(
            polygon.map((ring) =>
              ring.map(([x, z]) => {
                const p = new THREE.Vector3(x, 0, z).applyMatrix4(
                  asset.root.matrixWorld,
                );
                return [p.x, p.z] as Point;
              }),
            ),
          );
      }
      list.push({
        id: entry.id,
        priority: entry.priority,
        name: entry.name,
        x: centerX,
        z: centerZ,
        base: entry.id.startsWith("vn-scenic-") ? base + box.min.y : base,
        rotation,
        width: Math.min(
          bounds.x * sx,
          asset.root.userData.focusWidth ?? Infinity,
        ),
        depth: Math.min(
          bounds.z * sz,
          asset.root.userData.focusDepth ?? Infinity,
        ),
        height: entry.id.startsWith("vn-scenic-")
          ? Math.min(bounds.y, asset.root.userData.focusHeight ?? Infinity)
          : asset.height,
      });
    }
  } catch (error) {
    assets.forEach((asset) => asset.dispose());
    throw error;
  }
  const cutMappedShells = areaMask(
    nearby
      .filter(({ points }) => points.length > 2)
      .map(({ points, holes }) => [points, ...holes]),
  );
  const area = (rings: Point[][]) =>
    rings.reduce(
      (sum, ring, i) =>
        sum +
        (i ? -1 : 1) *
          Math.abs(
            THREE.ShapeUtils.area(ring.map((p) => new THREE.Vector2(...p))),
          ),
      0,
    );
  return {
    root,
    list,
    surfaceMasks,
    clipBuilding(feature: MapFeature): MapFeature[] {
      if (
        feature.kind !== "building" ||
        (data.provider !== "vector" &&
          feature.tags["height:source"] !== "vector_estimate")
      )
        return [feature];
      const rings = [feature.points, ...feature.holes].map((ring) =>
        ring.map((p) => project(p, data.center)),
      );
      const remaining = cutMappedShells(rings[0], rings.slice(1));
      if (remaining.length === 1 && remaining[0][0] === rings[0])
        return [feature];
      // Generalized shells leave tiny edge slivers; merged neighbours retain their full remaining area.
      if (
        remaining.reduce((sum, polygon) => sum + area(polygon), 0) <
        area(rings) * 0.15
      )
        return [];
      return remaining.map(([outer, ...holes]) => ({
        ...feature,
        points: outer.map(([x, z]) => unproject(x, z, data.center)),
        holes: holes.map((ring) =>
          ring.map(([x, z]) => unproject(x, z, data.center)),
        ),
      }));
    },
    replaces(feature: MapFeature) {
      if (feature.kind !== "building" && feature.kind !== "road") return false;
      const points = feature.points.map((p) => project(p, data.center));
      if (!points.length) return false;
      return nearby.some(({ entry, points: ring, holes }) => {
        if (entry.exclude?.includes(feature.id)) return true;
        if (
          entry.osm?.id === feature.id &&
          (entry.replaceWholeRelation ||
            entry.osm.type !== "relation" ||
            points.every(([x, z]) => insideFootprint(ring, x, z)))
        )
          return true;
        return (
          feature.kind === "building" &&
          ring.length > 2 &&
          points.every(([x, z]) => insideFootprint(ring, x, z)) &&
          (!holes.length ||
            !clipArea(
              [[points]],
              holes.map((hole) => [hole]),
              "intersection",
            ).length)
        );
      });
    },
    apply(settings: SceneSettings) {
      root.visible = settings.buildings;
      assets.forEach((asset) => asset.apply(settings.style, settings.outlines));
    },
    dispose() {
      assets.forEach((asset) => asset.dispose());
      root.clear();
    },
  };
}
