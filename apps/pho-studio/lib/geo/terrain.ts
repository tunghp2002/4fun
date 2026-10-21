import type { Coordinate, TerrainData } from "../types";
import { unproject } from "./coordinates";

const SIZE = 33,
  ZOOM = 12;
const pixelCache = new Map<string, Uint8ClampedArray>();
export function terrainTile(point: Coordinate, zoom = ZOOM) {
  const scale = 2 ** zoom;
  return {
    x: ((point.lon + 180) / 360) * scale,
    y:
      ((1 - Math.asinh(Math.tan((point.lat * Math.PI) / 180)) / Math.PI) / 2) *
      scale,
  };
}
export function decodeElevation(r: number, g: number, b: number) {
  return r * 256 + g + b / 256 - 32768;
}
export async function loadTerrain(
  center: Coordinate,
  span: number,
  signal: AbortSignal,
): Promise<TerrainData> {
  signal.throwIfAborted();
  const zoom = Math.max(
    0,
    Math.min(
      ZOOM,
      Math.floor(
        Math.log2((40075016 * Math.cos((center.lat * Math.PI) / 180)) / span),
      ),
    ),
  );
  const tiles = new Map<string, Promise<Uint8ClampedArray>>();
  const pixels = async (point: Coordinate) => {
    const tile = terrainTile(point, zoom),
      x = Math.floor(tile.x),
      y = Math.floor(tile.y),
      key = `${zoom}/${x}/${y}`;
    if (!tiles.has(key))
      tiles.set(
        key,
        (async () => {
          const cached = pixelCache.get(key);
          if (cached) {
            pixelCache.delete(key);
            pixelCache.set(key, cached);
            return cached;
          }
          const response = await fetch(
            `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${key}.png`,
            { signal: AbortSignal.any([signal, AbortSignal.timeout(9000)]) },
          );
          if (!response.ok) throw new Error("Elevation unavailable");
          const bitmap = await createImageBitmap(await response.blob());
          try {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 256;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) throw new Error("Canvas unavailable");
            ctx.drawImage(bitmap, 0, 0);
            const pixels = ctx.getImageData(0, 0, 256, 256).data;
            signal.throwIfAborted();
            pixelCache.set(key, pixels);
            if (pixelCache.size > 16)
              pixelCache.delete(pixelCache.keys().next().value!);
            return pixels;
          } finally {
            bitmap.close();
          }
        })(),
      );
    const data = await tiles.get(key)!;
    const px = Math.min(255, Math.floor((tile.x - x) * 256)),
      py = Math.min(255, Math.floor((tile.y - y) * 256)),
      i = (py * 256 + px) * 4;
    return decodeElevation(data[i], data[i + 1], data[i + 2]);
  };
  try {
    const heights = await Promise.all(
      Array.from({ length: SIZE * SIZE }, (_, i) =>
        pixels(
          unproject(
            ((i % SIZE) / (SIZE - 1) - 0.5) * span,
            (Math.floor(i / SIZE) / (SIZE - 1) - 0.5) * span,
            center,
          ),
        ),
      ),
    );
    signal.throwIfAborted();
    return {
      size: SIZE,
      heights,
      minimum: Math.min(...heights),
      maximum: Math.max(...heights),
      available: true,
    };
  } catch {
    signal.throwIfAborted();
    return {
      size: SIZE,
      heights: Array(SIZE * SIZE).fill(0),
      minimum: 0,
      maximum: 0,
      available: false,
    };
  }
}
export function heightAt(
  data: TerrainData,
  span: number,
  x: number,
  z: number,
) {
  const px = Math.max(
    0,
    Math.min(data.size - 1, (x / span + 0.5) * (data.size - 1)),
  );
  const pz = Math.max(
    0,
    Math.min(data.size - 1, (z / span + 0.5) * (data.size - 1)),
  );
  const ix = Math.floor(px),
    iz = Math.floor(pz),
    fx = px - ix,
    fz = pz - iz;
  const sample = (dx: number, dz: number) =>
    data.heights[
      Math.min(data.size - 1, iz + dz) * data.size +
        Math.min(data.size - 1, ix + dx)
    ] - data.minimum;
  return (
    (sample(0, 0) * (1 - fx) + sample(1, 0) * fx) * (1 - fz) +
    (sample(0, 1) * (1 - fx) + sample(1, 1) * fx) * fz
  );
}

// shortcut: urban roof removal also smooths relief narrower than 150 m; replace with a bare-earth DEM when available.
export function groundTerrain(data: TerrainData, span: number): TerrainData {
  const radius = Math.max(
    1,
    Math.min(4, Math.round(75 / (span / (data.size - 1)))),
  );
  const filter = (values: number[], minimum: boolean) =>
    values.map((_, i) => {
      let result = minimum ? Infinity : -Infinity;
      for (
        let z = Math.max(0, Math.floor(i / data.size) - radius);
        z <= Math.min(data.size - 1, Math.floor(i / data.size) + radius);
        z++
      )
        for (
          let x = Math.max(0, (i % data.size) - radius);
          x <= Math.min(data.size - 1, (i % data.size) + radius);
          x++
        )
          result = minimum
            ? Math.min(result, values[z * data.size + x])
            : Math.max(result, values[z * data.size + x]);
      return result;
    });
  const heights = filter(filter(data.heights, true), false);
  return { ...data, heights, maximum: Math.max(...heights) };
}
