export interface Coordinate {
  lat: number;
  lon: number;
}
export interface Place extends Coordinate {
  id: string;
  name: string;
  city: string;
  province?: string;
  aliases?: string[];
  snapshot?: boolean;
  region: "Bắc" | "Trung" | "Nam";
  description: string;
  span: number;
  category: string;
}
export type Tags = Record<string, string>;
export interface MapFeature {
  id: number;
  kind: "building" | "road" | "water" | "park" | "tree";
  points: Coordinate[];
  holes: Coordinate[][];
  tags: Tags;
}
export interface MapData {
  center: Coordinate;
  span: number;
  features: MapFeature[];
  timestamp?: string;
  source: "snapshot" | "cache" | "live";
  provider?: "vector";
}
export function isLinearFeature(feature: MapFeature) {
  return (
    feature.kind === "road" ||
    (feature.kind === "water" &&
      !!feature.tags.waterway &&
      feature.tags.waterway !== "riverbank" &&
      feature.tags.natural !== "water")
  );
}
export interface TerrainData {
  size: number;
  heights: number[];
  minimum: number;
  maximum: number;
  available: boolean;
}
export type SceneStyle = "paper" | "clay" | "ink";
export type CameraView = "perspective" | "overview" | "top" | "eye";
export interface SceneSettings {
  style: SceneStyle;
  hour: number;
  outlines: number;
  heightScale: number;
  buildings: boolean;
  roads: boolean;
  trees: boolean;
  water: boolean;
  terrain: boolean;
  shadows: boolean;
  grid: boolean;
}
export const INITIAL_SETTINGS: SceneSettings = {
  style: "paper",
  hour: 15,
  outlines: 0.55,
  heightScale: 1,
  buildings: true,
  roads: true,
  trees: true,
  water: true,
  terrain: true,
  shadows: true,
  grid: false,
};
export interface SceneStats {
  buildings: number;
  estimated: number;
  roads: number;
  trees: number;
}
export interface SceneLandmark {
  id: string;
  priority?: number;
  name: string;
  x: number;
  z: number;
  base: number;
  width: number;
  depth: number;
  height: number;
  rotation: number;
}
export interface ScenePin {
  x: number;
  z: number;
  coordinate: Coordinate;
  name?: string;
}
