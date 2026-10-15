import type { Scene, WebGPURenderer } from 'three/webgpu';
import type { ExperienceScope } from '../lifetime';

export interface SceneRuntime {
  renderer: WebGPURenderer;
  scene: Scene;
  sound: { setEnabled(enabled: boolean): void; readonly supported: boolean };
  dispose(): Promise<void>;
}

export function startScene(scope: ExperienceScope): Promise<SceneRuntime>;
