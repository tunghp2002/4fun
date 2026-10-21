import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import catalog from "../lib/scene/landmarks/catalog.json";
import {
  createLandmarks,
  LANDMARK_CATALOG,
} from "../lib/scene/landmarks/index.ts";
import {
  insideFootprint,
  interiorRectangle,
} from "../lib/scene/landmarks/footprint.ts";
import {
  contains,
  project,
  unproject,
  type Point,
} from "../lib/geo/coordinates.ts";
import { parseMap } from "../lib/geo/data.ts";

const snapshot = (city: string) =>
  parseMap(
    JSON.parse(
      readFileSync(
        new URL(
          `../public/data/${city === "ha-noi" ? "ho-guom" : city}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  );

test("a rectangular landmark fits within a concave wing without filling its courtyard", () => {
  for (const ring of [
    [
      [0, 0],
      [10, 0],
      [10, 4],
      [4, 4],
      [4, 10],
      [0, 10],
    ],
    [
      [0, 0],
      [10, 0],
      [9, 3],
      [6, 3],
      [6, 10],
      [0, 10],
    ],
  ] as Point[][]) {
    const fitted = interiorRectangle(
      ring,
      new THREE.Box2(new THREE.Vector2(0, 0), new THREE.Vector2(10, 10)),
    );
    assert((fitted.max.x - fitted.min.x) * (fitted.max.y - fitted.min.y) > 35);
    for (let i = 0; i <= 20; i++)
      for (let j = 0; j <= 20; j++) {
        const x = THREE.MathUtils.lerp(fitted.min.x, fitted.max.x, i / 20),
          z = THREE.MathUtils.lerp(fitted.min.y, fitted.max.y, j / 20);
        assert(
          contains(ring, x, z),
          `rectangle crosses the courtyard at ${x},${z}`,
        );
      }
  }
});

test("replacement preserves a neighbouring building whose centroid falls inside a landmark", () => {
  const entry = LANDMARK_CATALOG.find((e) => e.kind === "saigon-opera")!;
  const ring = (entry.footprint ?? []).map(([lat, lon]) =>
    project({ lat, lon }, entry),
  );
  const points = [
    unproject(-90, -2, entry),
    unproject(90, -2, entry),
    unproject(90, 2, entry),
    unproject(-90, 2, entry),
  ];
  assert(contains(ring, 0, 0));
  const manager = createLandmarks(
    { center: entry, span: 200, source: "snapshot", features: [] },
    () => 0,
  );
  try {
    assert.equal(
      manager.replaces({
        id: 999,
        kind: "building",
        points,
        holes: [],
        tags: { building: "yes" },
      }),
      false,
    );
    assert.equal(
      manager.replaces({
        id: entry.osm!.id,
        kind: "building",
        points,
        holes: [],
        tags: { building: "yes" },
      }),
      true,
    );
    assert(
      insideFootprint(
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
        ],
        10.1,
        5,
      ),
    );
    assert(
      !insideFootprint(
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
        ],
        11,
        5,
      ),
    );
  } finally {
    manager.dispose();
  }
});

test("all 39 landmarks leave neighbouring buildings and streets outside their mapped footprints clear", () => {
  let checked = 0;
  for (const entry of LANDMARK_CATALOG.filter((e) => !e.id.startsWith("vn-"))) {
    const features = snapshot(entry.city);
    const manager = createLandmarks(
      { center: entry, span: 1, source: "snapshot", features },
      () => 0,
    );
    try {
      manager.root.updateMatrixWorld(true);
      const object = manager.root.getObjectByName(entry.name)!;
      assert(object, entry.name);
      const mesh = object.children.find(
        (o) => o instanceof THREE.Mesh,
      ) as THREE.Mesh;
      const position = mesh.geometry.getAttribute("position");
      const own = (entry.footprint ?? []).map(([lat, lon]) =>
        project({ lat, lon }, entry),
      );
      const neighbours = features
        .filter((f) => f.kind === "building" && !manager.replaces(f))
        .map((f) => {
          const points = f.points.map((p) => project(p, entry));
          return {
            id: f.id,
            points,
            holes: f.holes.map((r) => r.map((p) => project(p, entry))),
            bounds: new THREE.Box2().setFromPoints(
              points.map((p) => new THREE.Vector2(...p)),
            ),
          };
        });
      const roads = features
        .filter(
          (f) =>
            f.kind === "road" &&
            !/footway|path|steps|pedestrian|cycleway|corridor/.test(
              f.tags.highway,
            ) &&
            !manager.replaces(f),
        )
        .flatMap((f) => {
          const points = f.points.map((p) => project(p, entry)),
            width =
              Number.parseFloat(f.tags.width) ||
              (["motorway", "trunk", "primary"].includes(f.tags.highway)
                ? 13
                : ["secondary", "tertiary"].includes(f.tags.highway)
                  ? 9
                  : 5.2);
          return points.slice(1).map((b, i) => ({
            id: f.id,
            a: points[i],
            b,
            radius: Math.min(28, width) / 2 - 0.4,
          }));
        });
      const seen = new Set<string>(),
        p = new THREE.Vector3();
      for (let i = 0; i < position.count; i++) {
        p.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
        if (p.y < 1) continue;
        const key = `${Math.round(p.x * 4)},${Math.round(p.z * 4)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        for (const neighbour of neighbours) {
          if (!neighbour.bounds.containsPoint(new THREE.Vector2(p.x, p.z)))
            continue;
          if (
            !contains(neighbour.points, p.x, p.z) ||
            neighbour.holes.some((r) => contains(r, p.x, p.z))
          )
            continue;
          const border = neighbour.points.some((a, j) => {
            const b = neighbour.points[(j + 1) % neighbour.points.length],
              dx = b[0] - a[0],
              dz = b[1] - a[1],
              t = Math.max(
                0,
                Math.min(
                  1,
                  ((p.x - a[0]) * dx + (p.z - a[1]) * dz) /
                    (dx * dx + dz * dz || 1),
                ),
              );
            return Math.hypot(p.x - a[0] - t * dx, p.z - a[1] - t * dz) < 0.35;
          });
          assert(
            border,
            `${entry.name} covers neighbouring building ${neighbour.id} at ${p.x},${p.z}`,
          );
        }
        if (
          !entry.fit ||
          /bridge|gate/.test(entry.kind) ||
          insideFootprint(own, p.x, p.z)
        )
          continue;
        for (const road of roads) {
          const dx = road.b[0] - road.a[0],
            dz = road.b[1] - road.a[1],
            t = Math.max(
              0,
              Math.min(
                1,
                ((p.x - road.a[0]) * dx + (p.z - road.a[1]) * dz) /
                  (dx * dx + dz * dz || 1),
              ),
            );
          assert(
            Math.hypot(p.x - road.a[0] - t * dx, p.z - road.a[1] - t * dz) >=
              road.radius,
            `${entry.name} extends into street ${road.id}`,
          );
        }
      }
      if (entry.kind === "saigon-opera") {
        const item = manager.list.find((i) => i.id === entry.id)!;
        assert(
          item.width > 27 &&
            item.width < 34 &&
            item.depth > 58 &&
            item.depth < 69,
          "opera must stay a long auditorium, rather than a square block",
        );
        const front = new THREE.Vector3(0, 0, 1).applyQuaternion(
          object.quaternion,
        );
        assert(
          front.dot(new THREE.Vector3(-1, 0, 1).normalize()) > 0.98,
          "opera entrance faces southwest toward Lam Son Square",
        );
      }
      checked++;
    } finally {
      manager.dispose();
    }
  }
  assert.equal(checked, 39);
});

test("the four fitted Hue gates keep their mapped passage axes open", () => {
  const features = snapshot("hue");
  for (const entry of LANDMARK_CATALOG.filter(
    (e) => e.kind === "imperial-gate",
  )) {
    const manager = createLandmarks(
      { center: entry, span: 1, source: "snapshot", features },
      () => 0,
    );
    try {
      manager.root.updateMatrixWorld(true);
      const object = manager.root.getObjectByName(entry.name)!;
      let nearest:
        | { point: THREE.Vector3; direction: THREE.Vector3; distance: number }
        | undefined;
      for (const feature of features.filter((f) => f.kind === "road")) {
        const points = feature.points.map((p) => project(p, entry));
        for (let i = 1; i < points.length; i++) {
          const a = new THREE.Vector3(points[i - 1][0], 0, points[i - 1][1]),
            b = new THREE.Vector3(points[i][0], 0, points[i][1]);
          const direction = b.clone().sub(a),
            length = direction.length();
          if (length < 1) continue;
          direction.divideScalar(length);
          const point = a
            .clone()
            .addScaledVector(
              direction,
              Math.max(0, Math.min(length, -a.dot(direction))),
            );
          if (!nearest || point.lengthSq() < nearest.distance)
            nearest = { point, direction, distance: point.lengthSq() };
        }
      }
      assert(nearest && nearest.distance < 1, entry.name);
      for (const offset of [-0.6, 0, 0.6]) {
        const origin = nearest.point
          .clone()
          .addScaledVector(nearest.direction, -30);
        origin.x -= nearest.direction.z * offset;
        origin.z += nearest.direction.x * offset;
        origin.y = 2;
        const hits: THREE.Intersection[] = new THREE.Raycaster(
          origin,
          nearest.direction,
          0,
          60,
        )
          .intersectObject(object, true)
          .filter((hit) => hit.object instanceof THREE.Mesh);
        assert.equal(hits.length, 0, `${entry.name} blocks its mapped passage`);
      }
    } finally {
      manager.dispose();
    }
  }
});
