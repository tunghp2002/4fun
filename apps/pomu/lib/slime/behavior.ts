export const MOODS = ['idle', 'curious', 'happy', 'held', 'dizzy', 'sleepy', 'wink', 'love', 'relaxed', 'excited', 'surprised', 'grumpy', 'scared'] as const;
export type Mood = (typeof MOODS)[number];
export type Gait = 'walk' | 'hop' | 'roll';
export type Palette = 'blue' | 'galaxy' | 'rainbow' | 'custom';
export type PetSettings = {
  tool: 'hand' | 'sword' | 'mochi'; palette: Palette; color: string; gradient: boolean; secondColor: string; sound: boolean;
};
export const DEFAULT_SETTINGS: PetSettings = {
  tool: 'hand', palette: 'blue', color: '#79b5d8', gradient: false, secondColor: '#b8a2ff', sound: false,
};
export const MAX_PETS = 8;
export const MAX_PET_SIZE = 1.23;
export const MIN_SIZE = 0.43;
export const IDLE_MERGE_SECONDS = 12;
export const DIZZY_RECOVERY_SECONDS = 6;
export function sizeAfterMochi(size: number): number {
  return Math.min(MAX_PET_SIZE, Math.cbrt(size ** 3 + .16));
}
export function dragMood(distance: number, duration: number): Mood {
  return distance > 650 && duration > 1.1 ? 'dizzy' : 'held';
}
export function holdMood(distance: number, duration: number, lift: number): Mood {
  if (dragMood(distance, duration) === 'dizzy') return 'dizzy';
  if (lift > .45) return 'surprised';
  if (distance < 9 && duration > 3.5) return 'sleepy';
  if (distance < 9 && duration > 1.3) return 'relaxed';
  return 'held';
}
export function randomGait(value = Math.random()): Gait {
  return (['walk', 'hop', 'roll'] as const)[Math.min(2, Math.max(0, Math.floor(value * 3)))];
}
export function splitSize(size: number, count: number): number | null {
  return splitSizes(size, count, .5)?.[0] ?? null;
}
export function splitSizes(size: number, count: number, fraction: number): [number, number] | null {
  if (count >= MAX_PETS || !Number.isFinite(fraction) || fraction <= 0 || fraction >= 1) return null;
  const a = size * Math.cbrt(fraction), b = size * Math.cbrt(1 - fraction);
  return Math.min(a, b) >= MIN_SIZE ? [a, b] : null;
}
export function mergedSize(a: number, b: number): number { return Math.cbrt(a ** 3 + b ** 3); }
export function constrainToGarden(x: number, z: number): { x: number; z: number } {
  const radius = Math.hypot(x / 5.25, z / 3.9);
  return radius > 1 ? { x: x / radius, z: z / radius } : { x, z };
}
export function nextGait(index: number): Gait {
  return (['walk', 'hop', 'roll'] as const)[index % 3];
}
