import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { SceneStyle } from "../../types";
import { PALETTES } from "../architecture";
export type Tone =
  | "stone"
  | "cream"
  | "white"
  | "red"
  | "wood"
  | "roof"
  | "gold"
  | "glass"
  | "dark"
  | "green"
  | "metal"
  | "brick"
  | "rose"
  | "limestone"
  | "basalt"
  | "water"
  | "foam";
const COLORS: Record<Tone, string> = {
  stone: "#b7b2a4",
  cream: "#e8d5a5",
  white: "#f1ede0",
  red: "#a13d30",
  wood: "#623f32",
  roof: "#805947",
  gold: "#bb933b",
  glass: "#526e70",
  dark: "#303c37",
  green: "#718662",
  metal: "#7d9290",
  brick: "#af7254",
  rose: "#d5a3a0",
  limestone: "#aaa99a",
  basalt: "#60685f",
  water: PALETTES.paper.water,
  foam: "#e0e8da",
};
export interface LandmarkAsset {
  root: THREE.Group;
  width: number;
  depth: number;
  height: number;
  apply(style: SceneStyle, outlines: number): void;
  dispose(): void;
}
// Units are meters; +Z is the front. Roof Y is the eave; arch Y is the bottom.
export class LandmarkBuilder {
  private items: {
    geometry: THREE.BufferGeometry;
    tone: Tone;
    name: string;
  }[] = [];
  constructor(private name: string) {}
  add(
    name: string,
    tone: Tone,
    geometry: THREE.BufferGeometry,
    x = 0,
    y = 0,
    z = 0,
    rotation = 0,
  ) {
    geometry.rotateY(rotation);
    geometry.translate(x, y, z);
    if (geometry.index) {
      const old = geometry;
      geometry = old.toNonIndexed();
      old.dispose();
    }
    geometry.deleteAttribute("uv");
    geometry.deleteAttribute("uv1");
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    this.items.push({ geometry, tone, name });
  }
  box(
    name: string,
    tone: Tone,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rotation = 0,
  ) {
    this.add(name, tone, new THREE.BoxGeometry(w, h, d), x, y, z, rotation);
  }
  cylinder(
    name: string,
    tone: Tone,
    x: number,
    y: number,
    z: number,
    top: number,
    bottom: number,
    h: number,
    sides = 16,
  ) {
    this.add(
      name,
      tone,
      new THREE.CylinderGeometry(top, bottom, h, sides),
      x,
      y,
      z,
    );
  }
  sphere(
    name: string,
    tone: Tone,
    x: number,
    y: number,
    z: number,
    rx: number,
    ry: number,
    rz: number,
  ) {
    const g = new THREE.SphereGeometry(1, 16, 10);
    g.scale(rx, ry, rz);
    this.add(name, tone, g, x, y, z);
  }
  tube(
    name: string,
    tone: Tone,
    points: [number, number, number][],
    radius = 0.05,
    closed = false,
  ) {
    if (points.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      closed,
    );
    this.add(
      name,
      tone,
      new THREE.TubeGeometry(
        curve,
        Math.min(180, Math.max(8, points.length * 7)),
        radius,
        6,
        closed,
      ),
    );
  }
  roof(
    name: string,
    tone: Tone,
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    rise: number,
    flare = 0.2,
  ) {
    const p: number[] = [];
    const sample = (face: number, u: number, t: number) => {
      const long = face < 2,
        w0 = long ? w : d,
        d0 = long ? d : w,
        side = face % 2 ? -1 : 1;
      const a = u * ((w0 / 2) * (1 - t) + (long ? w0 * 0.26 * t : 0)),
        b = side * ((d0 / 2) * (1 - t) + (long ? 0 : d0 * 0.26 * t));
      const h =
        rise * Math.pow(t, 0.75) +
        rise * flare * Math.pow(Math.abs(u), 6) * Math.pow(1 - t, 3);
      return long ? [a, h, b] : [b, h, a];
    };
    for (let f = 0; f < 4; f++)
      for (let i = 0; i < 12; i++)
        for (let j = 0; j < 5; j++) {
          const u = i / 6 - 1,
            v = (i + 1) / 6 - 1,
            t = j / 5,
            n = (j + 1) / 5;
          const a = sample(f, u, t),
            b = sample(f, v, t),
            c = sample(f, u, n),
            e = sample(f, v, n);
          for (const q of [a, b, c, b, e, c]) p.push(...q);
        }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.computeVertexNormals();
    this.add(name, tone, g, x, y, z);
    this.box(
      name + "_ridge",
      tone,
      x,
      y + rise + 0.05,
      z,
      w * 0.53,
      0.13,
      0.16,
    );
  }
  arch(
    name: string,
    tone: Tone,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    openingWidth: number,
    openingHeight: number,
    rotation = 0,
  ) {
    const r = openingWidth / 2,
      spring = openingHeight - r;
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(-w / 2, h);
    s.lineTo(w / 2, h);
    s.lineTo(w / 2, 0);
    s.lineTo(r, 0);
    s.lineTo(r, spring);
    s.absarc(0, spring, r, 0, Math.PI, false);
    s.lineTo(-r, 0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 14,
    });
    g.translate(0, 0, -depth / 2);
    this.add(name, tone, g, x, y, z, rotation);
  }
  finish(width: number, depth: number): LandmarkAsset {
    const root = new THREE.Group();
    root.name = this.name;
    const counts = this.items.map((item) => ({
      count: item.geometry.getAttribute("position").count,
      tone: item.tone,
    }));
    for (const item of this.items) {
      const color = new THREE.Color(COLORS[item.tone]),
        n = item.geometry.getAttribute("position").count,
        values = new Float32Array(n * 3);
      for (let i = 0; i < n; i++)
        values.set([color.r, color.g, color.b], i * 3);
      item.geometry.setAttribute("color", new THREE.BufferAttribute(values, 3));
    }
    const geometry =
      mergeGeometries(this.items.map((i) => i.geometry)) ??
      new THREE.BufferGeometry();
    const parts = this.items.map((i) => i.name);
    const edgeSource = this.items.some(
      (i) => i.tone === "water" || i.tone === "foam",
    )
      ? mergeGeometries(
          this.items
            .filter(
              (i) =>
                i.tone !== "water" &&
                i.tone !== "foam" &&
                i.name !== "scenic_terrain_join",
            )
            .map((i) => i.geometry),
        )!
      : geometry;
    this.items.forEach((i) => i.geometry.dispose());
    this.items = [];
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.84,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = this.name + "_architecture";
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    const edgeGeometry = new THREE.EdgesGeometry(edgeSource, 36),
      edgeMaterial = new THREE.LineBasicMaterial({
        color: "#3c4238",
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      });
    if (edgeSource !== geometry) edgeSource.dispose();
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.name = this.name + "_contours";
    root.add(edges);
    geometry.computeBoundingBox();
    const height = geometry.boundingBox?.max.y ?? 1;
    root.userData = {
      illustrative: true,
      parts,
      nominalWidth: width,
      nominalDepth: depth,
      vertices: geometry.getAttribute("position")?.count ?? 0,
    };
    let current: SceneStyle | undefined,
      disposed = false;
    return {
      root,
      width,
      depth,
      height,
      apply(style, outlines) {
        edgeMaterial.color.set(
          style === "ink"
            ? "#1e2720"
            : style === "clay"
              ? "#a2a599"
              : "#3c4238",
        );
        edgeMaterial.opacity = outlines * (style === "clay" ? 0.4 : 0.72);
        if (current === style) return;
        current = style;
        const attribute = geometry.getAttribute("color");
        let i = 0;
        for (const count of counts) {
          const color = new THREE.Color(COLORS[count.tone]);
          if (count.tone === "water") color.set(PALETTES[style].water);
          else if (style === "clay")
            color.lerp(new THREE.Color("#f0eee5"), 0.82);
          else if (style === "ink") {
            const l = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
            color.setRGB(l, l, l);
          }
          for (let j = 0; j < count.count; j++)
            attribute.setXYZ(i++, color.r, color.g, color.b);
        }
        attribute.needsUpdate = true;
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        geometry.dispose();
        material.dispose();
        edgeGeometry.dispose();
        edgeMaterial.dispose();
        root.clear();
      },
    };
  }
}
