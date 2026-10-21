"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  MapData,
  ScenePin,
  SceneSettings,
  SceneStats,
  TerrainData,
  CameraView,
  SceneLandmark,
  Coordinate,
} from "../lib/types";
import type { CameraState, Stage } from "../lib/scene/stage";
import type { ExportFormat } from "../lib/scene/export";
import type { CityModel } from "../lib/scene/model";

export interface CanvasHandle {
  view(value: CameraView): void;
  zoom(direction: number): void;
  rotate(direction: number): void;
  pan(enabled: boolean): void;
  retryContext(): void;
  focusPin(): void;
  focusLandmark(id: string): void;
  pinAt(x: number, z: number): void;
  getCamera(): CameraState | undefined;
  setCamera(value: CameraState): void;
  export(format: ExportFormat, width: number, title: string): Promise<Blob>;
}
interface Props {
  data: MapData | null;
  terrain: TerrainData | null;
  settings: SceneSettings;
  seed: number;
  focal: number;
  travel: boolean;
  onPin(pin: ScenePin | null): void;
  onView(view: CameraView): void;
  onStats(stats: SceneStats): void;
  onLandmarks(landmarks: SceneLandmark[]): void;
  onProgress(value: number | null): void;
  onError(message: string, failed?: boolean): void;
  onReady(): void;
  onUnavailable(): void;
  onNavigate(center: Coordinate): void;
  onContextLoading(value: boolean): void;
  onSpan(span: number): void;
}

async function surroundings(
  data: MapData,
  terrain: TerrainData,
  model: CityModel,
  seed: number,
  useTerrain: boolean,
  span: number,
  signal: AbortSignal,
) {
  const [
    { loadVectorMap },
    { loadTerrain, heightAt, groundTerrain },
    { buildContext },
  ] = await Promise.all([
    import("../lib/geo/vector"),
    import("../lib/geo/terrain"),
    import("../lib/scene/context"),
  ]);
  const [map, farTerrain] = await Promise.all([
    loadVectorMap(data.center, span, signal),
    loadTerrain(data.center, span, signal),
  ]);
  signal.throwIfAborted();
  const farGround = map.features.some((f) => f.kind === "building")
    ? groundTerrain(farTerrain, span)
    : farTerrain;
  const sample = (x: number, z: number) => {
    if (!useTerrain) return 0;
    const edgeX = Math.max(-data.span / 2, Math.min(data.span / 2, x)),
      edgeZ = Math.max(-data.span / 2, Math.min(data.span / 2, z)),
      near = model.elevation(edgeX, edgeZ);
    if (!farTerrain.available || !terrain.available) return near;
    const far =
        heightAt(farGround, span, x, z) + farTerrain.minimum - terrain.minimum,
      blend = Math.min(
        1,
        Math.max(0, (Math.max(Math.abs(x), Math.abs(z)) - data.span / 2) / 160),
      );
    return near + (far - near) * blend * blend * (3 - 2 * blend);
  };
  return buildContext(
    map,
    data.span,
    seed,
    sample,
    model.waterSurfaces,
    signal,
  );
}
const SceneCanvas = forwardRef<CanvasHandle, Props>(
  function SceneCanvas(props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null),
      stage = useRef<Stage | null>(null),
      latest = useRef(props),
      [ready, setReady] = useState(false);
    const active = useRef<{
        model: CityModel;
        data: MapData;
        terrain: TerrainData;
        sourceTerrain: TerrainData;
        seed: number;
        useTerrain: boolean;
      } | null>(null),
      building = useRef(false),
      farSpan = useRef(2200),
      covered = useRef(0),
      retryAfter = useRef(0),
      coverage = useRef<AbortController | null>(null);
    latest.current = props;
    const loadContext = () => {
      const current = active.current;
      if (
        !current ||
        building.current ||
        coverage.current ||
        Date.now() < retryAfter.current ||
        covered.current === farSpan.current
      )
        return;
      const controller = new AbortController(),
        span = farSpan.current;
      coverage.current = controller;
      latest.current.onContextLoading(true);
      void surroundings(
        current.data,
        current.terrain,
        current.model,
        current.seed,
        current.useTerrain,
        span,
        controller.signal,
      )
        .then((context) => {
          if (
            controller.signal.aborted ||
            !stage.current ||
            active.current !== current ||
            span !== farSpan.current
          )
            context.dispose();
          else {
            stage.current.setContext(context);
            covered.current = span;
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            retryAfter.current = Date.now() + 3000;
            latest.current.onError(
              "Chưa tải được vùng xung quanh. Kéo hoặc thu phóng để thử lại.",
            );
          }
        })
        .finally(() => {
          if (coverage.current !== controller) return;
          coverage.current = null;
          latest.current.onContextLoading(false);
          if (!controller.signal.aborted && span !== farSpan.current)
            loadContext();
        });
    };
    useImperativeHandle(
      ref,
      () => ({
        view: (value) => {
          stage.current?.view(value);
          if (value === "eye")
            canvasRef.current?.focus({ preventScroll: true });
        },
        zoom: (direction) => stage.current?.zoom(direction),
        rotate: (direction) => stage.current?.rotate(direction),
        pan: (enabled) => stage.current?.pan(enabled),
        retryContext: () => {
          covered.current = 0;
          retryAfter.current = 0;
          loadContext();
        },
        focusPin: () => stage.current?.focusPin(),
        focusLandmark: (id) => stage.current?.focusLandmark(id),
        pinAt: (x, z) => stage.current?.pinAt(x, z),
        getCamera: () => stage.current?.getCamera(),
        setCamera: (value) => stage.current?.setCamera(value),
        async export(format, width, title) {
          if (!stage.current) throw new Error("Trình xem 3D chưa sẵn sàng.");
          const { exportScene } = await import("../lib/scene/export");
          return exportScene(stage.current, format, width, title);
        },
      }),
      [],
    );
    useEffect(() => {
      let mounted = true;
      import("../lib/scene/stage")
        .then(({ createStage }) => {
          if (!mounted || !canvasRef.current) return;
          try {
            stage.current = createStage(
              canvasRef.current,
              (pin) => latest.current.onPin(pin),
              () => latest.current.onUnavailable(),
              (view) => latest.current.onView(view),
              (landmarks) => latest.current.onLandmarks(landmarks),
              (center, span, settled) => {
                if (span !== farSpan.current) latest.current.onSpan(span);
                if (span !== farSpan.current && coverage.current) {
                  coverage.current.abort();
                  coverage.current = null;
                  latest.current.onContextLoading(false);
                }
                farSpan.current = span;
                if (settled) loadContext();
                if (center) latest.current.onNavigate(center);
              },
            );
            stage.current.pan(true);
            setReady(true);
          } catch {
            latest.current.onUnavailable();
          }
        })
        .catch(() => {
          if (mounted) latest.current.onUnavailable();
        });
      return () => {
        mounted = false;
        coverage.current?.abort();
        stage.current?.dispose();
        stage.current = null;
      };
    }, []);
    useEffect(() => {
      stage.current?.update(props.settings);
    }, [props.settings, ready]);
    useEffect(() => {
      stage.current?.lens(props.focal);
    }, [props.focal, ready]);
    useEffect(() => {
      if (!ready || !props.data || !props.terrain) return;
      const current = active.current;
      if (
        current?.data === props.data &&
        current.sourceTerrain === props.terrain &&
        current.seed === props.seed &&
        current.useTerrain === props.settings.terrain
      ) {
        latest.current.onProgress(null);
        latest.current.onReady();
        return;
      }
      const controller = new AbortController(),
        data = props.data,
        terrain = props.settings.terrain
          ? props.terrain
          : {
              ...props.terrain,
              minimum: 0,
              maximum: 0,
              heights: props.terrain.heights.map(() => 0),
            };
      latest.current.onProgress(0);
      building.current = true;
      latest.current.onContextLoading(false);
      coverage.current?.abort();
      coverage.current = null;
      import("../lib/scene/model")
        .then(({ buildCity }) =>
          buildCity(data, terrain, props.seed, controller.signal, (value) => {
            if (!controller.signal.aborted) latest.current.onProgress(value);
          }),
        )
        .then(async (model) => {
          if (controller.signal.aborted || !stage.current) {
            model.dispose();
            return;
          }
          let context;
          const builtSpan = farSpan.current;
          try {
            if (props.travel)
              context = await surroundings(
                data,
                terrain,
                model,
                props.seed,
                props.settings.terrain,
                builtSpan,
                controller.signal,
              );
          } catch (error) {
            model.dispose();
            throw error;
          }
          if (controller.signal.aborted || !stage.current) {
            context?.dispose();
            model.dispose();
            return;
          }
          stage.current.setCity(model, data, terrain, props.travel);
          active.current = {
            model,
            data,
            terrain,
            sourceTerrain: props.terrain!,
            seed: props.seed,
            useTerrain: props.settings.terrain,
          };
          covered.current = context ? builtSpan : 0;
          if (context) stage.current.setContext(context);
          building.current = false;
          stage.current.update(latest.current.settings);
          latest.current.onStats(model.stats);
          latest.current.onProgress(null);
          latest.current.onReady();
          loadContext();
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            building.current = false;
            latest.current.onProgress(null);
            latest.current.onError(
              error instanceof Error ? error.message : "Không dựng được cảnh.",
              true,
            );
          }
        });
      return () => {
        controller.abort();
        coverage.current?.abort();
        coverage.current = null;
      };
    }, [ready, props.data, props.terrain, props.seed, props.settings.terrain]);
    return (
      <canvas
        ref={canvasRef}
        className="scene-canvas"
        tabIndex={0}
        aria-label="Cảnh 3D tương tác. Kéo để di chuyển trên bản đồ, Shift kéo để xoay, cuộn để thu phóng. Cảnh tự tải vùng tiếp theo. Phím 1, 2, 3, 4 đổi góc; WASD di chuyển khi ở tầm mắt."
      />
    );
  },
);
export default SceneCanvas;
