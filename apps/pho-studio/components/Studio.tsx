"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Icon, { type IconName } from "./Icon";
import PlaceArt from "./PlaceArt";
import { LANDMARK_PLACES } from "../lib/landmarks";
import placePhotos from "../public/photos/credits.json";
import MapPreview from "./MapPreview";
import {
  PLACES,
  PROVINCES,
  filterPlaces,
  normalizeSearch,
} from "../lib/places";
import {
  INITIAL_SETTINGS,
  type CameraView,
  type Coordinate,
  type MapData,
  type Place,
  type ScenePin,
  type SceneSettings,
  type SceneStats,
  type SceneLandmark,
  type TerrainData,
} from "../lib/types";
import {
  parseCoordinate,
  readHash,
  shareHash,
  unproject,
  project,
  isVietnam,
  isOffshore,
} from "../lib/geo/coordinates";
import { loadMap, searchPlaces } from "../lib/geo/data";
import { loadTerrain } from "../lib/geo/terrain";
import { readSaved, saveScenes, type SavedScene } from "../lib/saved";
import type { CanvasHandle } from "./SceneCanvas";
import type { CameraState } from "../lib/scene/stage";
import type { ExportFormat } from "../lib/scene/export";
import { normalizeSettings } from "../lib/settings";

const CountryPicker = dynamic(() => import("./CountryPicker"), {
  ssr: false,
  loading: () => (
    <p className="country-loading" role="status">
      Đang mở bản đồ Việt Nam…
    </p>
  ),
});
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });
const VIEWS: { id: CameraView; name: string; icon: IconName }[] = [
  { id: "perspective", name: "Phối cảnh", icon: "cube" },
  { id: "overview", name: "Toàn cảnh", icon: "layers" },
  { id: "top", name: "Từ trên", icon: "top" },
  { id: "eye", name: "Tầm mắt", icon: "eye" },
];
const STYLES = [
  { id: "paper", name: "Màu giấy" },
  { id: "clay", name: "Mô hình" },
  { id: "ink", name: "Nét mực" },
] as const;
const formatCount = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);
export default function Studio() {
  const [place, setPlace] = useState(PLACES[1]),
    [data, setData] = useState<MapData | null>(null),
    [terrain, setTerrain] = useState<TerrainData | null>(null);
  const [settings, setSettings] = useState<SceneSettings>(INITIAL_SETTINGS),
    [seed, setSeed] = useState(2026),
    [focal, setFocal] = useState(35),
    [view, setView] = useState<CameraView>("perspective");
  const [spanDraft, setSpanDraft] = useState(PLACES[1].span),
    [query, setQuery] = useState(""),
    [region, setRegion] = useState("Tất cả"),
    [province, setProvince] = useState(""),
    [countryOpen, setCountryOpen] = useState(false),
    [results, setResults] = useState<Place[] | null>(null),
    [searching, setSearching] = useState(false),
    [searchError, setSearchError] = useState("");
  const [landmarks, setLandmarks] = useState<SceneLandmark[]>([]);
  const [pending, setPending] = useState<string | null>("Hồ Gươm"),
    [travel, setTravel] = useState(false),
    [travelPending, setTravelPending] = useState(false),
    [contextLoading, setContextLoading] = useState(false),
    [mapSpan, setMapSpan] = useState(2200),
    [dragPan, setDragPan] = useState(true),
    [progress, setProgress] = useState<number | null>(null),
    [ready, setReady] = useState(false),
    [unavailable, setUnavailable] = useState(false);
  const [stats, setStats] = useState<SceneStats>({
      buildings: 0,
      estimated: 0,
      roads: 0,
      trees: 0,
    }),
    [pin, setPin] = useState<ScenePin | null>(null),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const [inspector, setInspector] = useState<"appearance" | "camera">(
      "appearance",
    ),
    [leftTab, setLeftTab] = useState<"explore" | "landmarks" | "saved">(
      "explore",
    ),
    [saved, setSaved] = useState<SavedScene[]>([]);
  const [mobilePanel, setMobilePanel] = useState<
      "location" | "settings" | null
    >(null),
    [flat, setFlat] = useState(false),
    [exportFormat, setExportFormat] = useState<ExportFormat>("png"),
    [exportWidth, setExportWidth] = useState(1920),
    [exporting, setExporting] = useState(false);
  const canvas = useRef<CanvasHandle>(null),
    request = useRef<AbortController | null>(null),
    searchRequest = useRef<AbortController | null>(null),
    restore = useRef<CameraState | undefined>(undefined);
  const navigating = useRef(true),
    currentArea = useRef({ data, terrain, place }),
    committedArea = useRef({ data, terrain, place }),
    failedTravel = useRef<{ center: Coordinate; time: number } | null>(null);
  currentArea.current = { data, terrain, place };
  const exportDialog = useRef<HTMLDialogElement>(null),
    helpDialog = useRef<HTMLDialogElement>(null),
    countryDialog = useRef<HTMLDialogElement>(null),
    noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    searchInput = useRef<HTMLInputElement>(null),
    exportCanceled = useRef(false);
  const busy = pending !== null || progress !== null,
    canExport = ready && !busy && !contextLoading && !unavailable,
    countryView = mapSpan > 8800 && view !== "eye" && !flat;
  const notify = useCallback((text: string) => {
    setNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 4500);
  }, []);
  const update = <K extends keyof SceneSettings>(
    key: K,
    value: SceneSettings[K],
  ) => setSettings((previous) => ({ ...previous, [key]: value }));
  const choosePlace = useCallback(
    async (
      next: Place,
      span = next.span,
      cameraState?: CameraState,
      continuous = false,
    ) => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      navigating.current = true;
      setTravelPending(continuous);
      setPending(next.name);
      setError("");
      setSearchError("");
      setMobilePanel(null);
      restore.current = cameraState;
      const preset = PLACES.find(
        (p) =>
          Math.abs(p.lat - next.lat) < 0.00001 &&
          Math.abs(p.lon - next.lon) < 0.00001,
      );
      try {
        const [map, elevation] = await Promise.all([
          loadMap(next, span, preset, controller.signal),
          loadTerrain(next, span, controller.signal),
        ]);
        controller.signal.throwIfAborted();
        setData(map);
        setTerrain(elevation);
        setTravel(continuous);
        setLandmarks([]);
        setPlace(next);
        setSpanDraft(span);
        setPin(null);
        setReady(false);
        if (!continuous) setView("perspective");
      } catch (reason) {
        if (!controller.signal.aborted) {
          navigating.current = false;
          setTravelPending(false);
          if (continuous)
            failedTravel.current = { center: next, time: Date.now() };
          setError(
            reason instanceof Error
              ? reason.message
              : "Chưa tải được địa điểm.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setPending(null);
      }
    },
    [],
  );
  useEffect(() => {
    setSaved(readSaved());
    const initial = readHash(location.hash);
    if (initial) {
      const preset = PLACES.find(
        (p) =>
          Math.abs(p.lat - initial.center.lat) < 0.00001 &&
          Math.abs(p.lon - initial.center.lon) < 0.00001,
      );
      const params = new URLSearchParams(location.hash.slice(1)),
        style = params.get("style"),
        hour = Number(params.get("hour"));
      if (style === "paper" || style === "clay" || style === "ink")
        setSettings((s) => ({ ...s, style }));
      if (params.has("hour") && hour >= 6 && hour <= 18)
        setSettings((s) => ({ ...s, hour }));
      if (params.has("cfg")) {
        try {
          setSettings(normalizeSettings(JSON.parse(params.get("cfg")!)));
        } catch {
          /* Keep the validated defaults. */
        }
      }
      const sharedView = params.get("view");
      const values = (params.get("cam") ?? "").split(",").map(Number);
      const cameraState: CameraState | undefined =
        values.length === 7 && values.every(Number.isFinite)
          ? {
              position: values.slice(0, 3) as [number, number, number],
              target: values.slice(3, 6) as [number, number, number],
              focal: values[6],
              view:
                sharedView === "top" ||
                sharedView === "eye" ||
                sharedView === "overview"
                  ? sharedView
                  : "perspective",
            }
          : undefined;
      if (cameraState && cameraState.focal >= 10 && cameraState.focal <= 150)
        setFocal(cameraState.focal);
      setSeed(initial.seed);
      void choosePlace(
        preset ?? {
          ...PLACES[0],
          ...initial.center,
          id: "custom",
          name: initial.name,
          city: "Việt Nam",
          description: "Một góc nhìn được chia sẻ.",
          span: initial.span,
        },
        initial.span,
        cameraState,
      );
    } else void choosePlace(PLACES[1]);
    return () => {
      request.current?.abort();
      searchRequest.current?.abort();
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [choosePlace]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobilePanel(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const sceneReady = useCallback(() => {
    setReady(true);
    navigating.current = false;
    setTravelPending(false);
    committedArea.current = currentArea.current;
    if (restore.current) {
      canvas.current?.setCamera(restore.current);
      restore.current = undefined;
    } else if (currentArea.current.place.id.startsWith("landmark:")) {
      canvas.current?.focusLandmark(currentArea.current.place.id.slice(9));
    }
  }, []);
  const sceneError = useCallback((text: string, failed = false) => {
    setError(text);
    if (failed) {
      navigating.current = false;
      setTravelPending(false);
      const previous = committedArea.current;
      if (previous.data && previous.data !== currentArea.current.data) {
        failedTravel.current = {
          center: currentArea.current.place,
          time: Date.now(),
        };
        setData(previous.data);
        setTerrain(previous.terrain);
        setPlace(previous.place);
        setTravel(true);
      }
    }
  }, []);
  const navigate = useCallback(
    (center: Coordinate) => {
      const area = committedArea.current;
      if (navigating.current || !area.data || !isVietnam(center)) return;
      const failed = failedTravel.current;
      if (failed && Date.now() - failed.time < 5000) {
        const [x, z] = project(center, failed.center);
        if (Math.hypot(x, z) < area.data.span * 0.2) return;
      }
      const nearest = PLACES.reduce((best, p) => {
        const a = project(p, center),
          b = project(best, center);
        return Math.hypot(...a) < Math.hypot(...b) ? p : best;
      });
      const nearby = Math.hypot(...project(nearest, center)) < 15000;
      void choosePlace(
        {
          ...center,
          id: "custom",
          name: nearby ? `Dạo quanh ${nearest.city}` : "Dọc Việt Nam",
          city: nearby ? nearest.city : "Việt Nam",
          province: nearby ? nearest.province : undefined,
          region: center.lat > 19 ? "Bắc" : center.lat > 14 ? "Trung" : "Nam",
          category: isOffshore(center) ? "Biển đảo" : "Khám phá",
          span: area.data.span,
          description: "Khu vực được tải tiếp theo hành trình của bạn.",
        },
        area.data.span,
        undefined,
        true,
      );
    },
    [choosePlace],
  );
  const sceneUnavailable = useCallback(() => {
    setUnavailable(true);
    setFlat(true);
    setProgress(null);
  }, []);
  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    setSearchError("");
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    const local = filterPlaces(
      query,
      "Tất cả",
      "",
      leftTab === "landmarks"
        ? LANDMARK_PLACES
        : [...PLACES, ...LANDMARK_PLACES],
    );
    if (leftTab === "landmarks" && !parseCoordinate(query)) {
      setResults(local);
      setRegion("Tất cả");
      setProvince("");
      return;
    }
    if (local.length && !parseCoordinate(query)) {
      setResults(local);
      setRegion("Tất cả");
      setProvince("");
      return;
    }
    setSearching(true);
    try {
      const found = await searchPlaces(query, controller.signal);
      if (controller.signal.aborted) return;
      setResults(found);
      setProvince("");
      setRegion("Tất cả");
      if (!found.length)
        setSearchError(
          "Chưa tìm thấy. Thử tên cụ thể hơn hoặc dán tọa độ từ bản đồ.",
        );
    } catch (reason) {
      if (!controller.signal.aborted)
        setSearchError(
          reason instanceof Error ? reason.message : "Chưa tìm được địa điểm.",
        );
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  };
  const save = () => {
    if (!canExport) return;
    const record: SavedScene = {
      id: crypto.randomUUID(),
      place,
      span: data!.span,
      seed,
      settings: { ...settings },
      camera: canvas.current?.getCamera(),
    };
    const next = [record, ...saved].slice(0, 12);
    try {
      saveScenes(next);
      setSaved(next);
      notify("Đã lưu góc nhìn trên thiết bị này.");
    } catch {
      notify(
        "Bộ nhớ trình duyệt đã đầy. Bạn có thể xuất ảnh hoặc sao chép liên kết.",
      );
    }
  };
  const removeSaved = (id: string) => {
    const next = saved.filter((p) => p.id !== id);
    try {
      saveScenes(next);
      setSaved(next);
    } catch {
      notify("Chưa cập nhật được bộ nhớ.");
    }
  };
  const openSaved = (record: SavedScene) => {
    setSettings({ ...INITIAL_SETTINGS, ...record.settings });
    setSeed(record.seed);
    if (record.camera) setFocal(record.camera.focal);
    void choosePlace(record.place, record.span, record.camera);
  };
  const copy = async (text: string, success: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(success);
    } catch {
      setError(
        "Trình duyệt chưa cho sao chép. Bạn có thể sao chép liên kết trên thanh địa chỉ.",
      );
    }
  };
  const share = () => {
    if (!data) return;
    const params = new URLSearchParams(
      shareHash(data.center, data.span, seed, place.name),
    );
    params.set("style", settings.style);
    params.set("hour", String(settings.hour));
    params.set("cfg", JSON.stringify(settings));
    const cameraState = canvas.current?.getCamera();
    params.set("view", cameraState?.view ?? view);
    if (cameraState)
      params.set(
        "cam",
        [...cameraState.position, ...cameraState.target, cameraState.focal]
          .map((n) => n.toFixed(2))
          .join(","),
      );
    const url = new URL(location.href);
    url.hash = params.toString();
    history.replaceState(null, "", url);
    void copy(url.href, "Đã sao chép liên kết góc nhìn.");
  };
  const exportFile = async () => {
    if (!canvas.current || !canExport) return;
    setExporting(true);
    exportCanceled.current = false;
    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const blob = await canvas.current.export(
          exportFormat,
          exportWidth,
          place.name,
        ),
        { download } = await import("../lib/scene/export");
      if (exportCanceled.current) return;
      download(
        blob,
        `pho-${normalizeSearch(place.name).replace(/[^a-z0-9]+/g, "-")}.${exportFormat}`,
      );
      exportDialog.current?.close();
      notify("Đã xuất cảnh. File được tải về thiết bị của bạn.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không xuất được cảnh.",
      );
    } finally {
      setExporting(false);
    }
  };
  const changeView = (next: CameraView) => {
    setView(next);
    canvas.current?.view(next);
  };
  const filtered =
    results ??
    filterPlaces(
      query,
      region,
      province,
      leftTab === "landmarks"
        ? LANDMARK_PLACES
        : query.trim()
          ? [...PLACES, ...LANDMARK_PLACES]
          : PLACES,
    );
  const timeLabel = `${Math.floor(settings.hour).toString().padStart(2, "0")}:${Math.round(
    (settings.hour % 1) * 60,
  )
    .toString()
    .padStart(2, "0")}`;
  const iconButton = (
    name: IconName,
    label: string,
    action: () => void,
    disabled = false,
  ) => (
    <button
      className="icon-button"
      type="button"
      aria-label={label}
      title={label}
      onClick={action}
      disabled={disabled}
    >
      <Icon name={name} />
    </button>
  );
  const toggles: {
    key: "buildings" | "trees" | "roads" | "water" | "terrain" | "shadows";
    label: string;
    icon: IconName;
  }[] = [
    { key: "buildings", label: "Công trình", icon: "building" },
    { key: "trees", label: "Cây xanh", icon: "tree" },
    { key: "roads", label: "Đường phố", icon: "road" },
    { key: "water", label: "Mặt nước", icon: "water" },
    { key: "terrain", label: "Địa hình", icon: "mountain" },
    { key: "shadows", label: "Bóng đổ", icon: "sun" },
  ];
  return (
    <div className="studio-shell">
      <a className="skip-link" href="#scene-area">
        Đến cảnh 3D
      </a>
      <header className="app-header">
        <a href="/" className="brand" aria-label="Phố Studio — trang đầu">
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <path d="m4 17 13-8 15 8-13 9Z" />
            <path d="M4 17v8l15 8 13-8v-8M19 26v7M11 21V12m8 14V7" />
          </svg>
          <span className="brand-word">
            phố<span className="brand-dot">.</span>
          </span>
          <span className="brand-studio">STUDIO</span>
        </a>
        <div className="header-caption">
          <span className="live-dot" />
          Không gian Việt, góc nhìn mới
        </div>
        <div className="header-actions">
          <button
            className="text-button help-button"
            aria-label="Hướng dẫn"
            onClick={() => helpDialog.current?.showModal()}
          >
            <Icon name="help" />
            <span>Hướng dẫn</span>
          </button>
          <button
            className="button button--quiet save-button"
            aria-label="Lưu góc nhìn"
            onClick={save}
            disabled={!canExport}
          >
            <Icon name="bookmark" />
            <span>Lưu góc nhìn</span>
          </button>
          <button
            className="button button--primary"
            onClick={() => exportDialog.current?.showModal()}
            disabled={!canExport}
          >
            <Icon name="download" />
            <span>Xuất cảnh</span>
          </button>
        </div>
      </header>
      <main className="studio-workspace">
        {mobilePanel && (
          <button
            className="panel-scrim"
            aria-label="Đóng bảng điều khiển"
            onClick={() => setMobilePanel(null)}
          />
        )}
        <aside
          className={`location-panel ${mobilePanel === "location" ? "is-open" : ""}`}
          id="location-panel"
          aria-label="Chọn địa điểm"
        >
          <div className="panel-mobile-heading">
            <strong>Địa điểm</strong>
            {iconButton("close", "Đóng địa điểm", () => setMobilePanel(null))}
          </div>
          <div className="location-intro">
            <p className="eyebrow">VIỆT NAM, THU NHỎ</p>
            <h1>
              Đi tìm một
              <br />
              góc thân quen.
            </h1>
            <p>
              Mở một nơi chốn.
              <br />
              Kể một câu chuyện của riêng bạn.
            </p>
          </div>
          <div
            className="left-tabs"
            role="group"
            aria-label="Danh sách địa điểm"
          >
            <button
              aria-pressed={leftTab === "explore"}
              onClick={() => {
                searchRequest.current?.abort();
                setSearching(false);
                setLeftTab("explore");
                setResults(null);
              }}
            >
              Khám phá
            </button>
            <button
              aria-pressed={leftTab === "landmarks"}
              onClick={() => {
                searchRequest.current?.abort();
                setSearching(false);
                setLeftTab("landmarks");
                setResults(null);
                setQuery("");
              }}
            >
              Nổi bật
            </button>
            <button
              aria-pressed={leftTab === "saved"}
              onClick={() => setLeftTab("saved")}
            >
              Đã lưu <span>{saved.length}</span>
            </button>
          </div>
          {leftTab !== "saved" ? (
            <>
              <button
                className="country-launch"
                onClick={() => {
                  setCountryOpen(true);
                  countryDialog.current?.showModal();
                }}
              >
                <span className="country-launch-icon">
                  <Icon name="top" size={24} />
                </span>
                <span>
                  <strong>Bản đồ Việt Nam</strong>
                  <small>
                    {PROVINCES.length} tỉnh, thành · đất liền & biển đảo
                  </small>
                </span>
                <Icon name="arrow" size={18} />
              </button>
              <form className="search-form" onSubmit={search}>
                <label htmlFor="location-search">Bạn muốn ghé nơi nào?</label>
                <div className="search-box">
                  <Icon name="search" size={18} />
                  <input
                    id="location-search"
                    ref={searchInput}
                    value={query}
                    onChange={(event) => {
                      searchRequest.current?.abort();
                      setSearching(false);
                      setQuery(event.target.value);
                      setResults(null);
                      setSearchError("");
                    }}
                    placeholder="Địa danh hoặc tọa độ…"
                    autoComplete="off"
                    maxLength={180}
                  />
                  <button
                    type="submit"
                    aria-label="Tìm địa điểm"
                    title="Tìm địa điểm"
                    disabled={searching}
                  >
                    {searching ? (
                      <span className="spinner" />
                    ) : (
                      <Icon name="arrow" size={18} />
                    )}
                  </button>
                </div>
                {searchError && (
                  <p className="field-error" role="alert">
                    {searchError}
                  </p>
                )}
              </form>
              <div
                className="region-filters"
                role="group"
                aria-label="Lọc theo miền"
              >
                {["Tất cả", "Bắc", "Trung", "Nam", "Biển đảo"].map((item) => (
                  <button
                    key={item}
                    aria-pressed={region === item}
                    onClick={() => {
                      setRegion(item);
                      setProvince("");
                      setResults(null);
                    }}
                  >
                    {item === "Tất cả" || item === "Biển đảo"
                      ? item
                      : `Miền ${item}`}
                  </button>
                ))}
              </div>
              <label htmlFor="location-province" className="sr-only">
                Lọc tỉnh, thành phố
              </label>
              <select
                id="location-province"
                className="province-filter"
                value={province}
                onChange={(event) => {
                  setProvince(event.target.value);
                  setRegion("Tất cả");
                  setResults(null);
                }}
              >
                <option value="">Tất cả tỉnh, thành phố</option>
                {PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <div className="list-heading">
                <span>
                  {results
                    ? "KẾT QUẢ TÌM KIẾM"
                    : leftTab === "landmarks"
                      ? "KIẾN TRÚC & DANH THẮNG"
                      : "GỢI Ý KHÁM PHÁ"}
                </span>
                <span>{filtered.length.toString().padStart(2, "0")}</span>
              </div>
              {leftTab === "landmarks" && (
                <p className="landmark-order-note">
                  Biểu tượng quen thuộc trước, rồi đến những nét riêng từng
                  vùng.
                </p>
              )}
              <div className="place-list">
                {filtered.map((item, index) => (
                  <button
                    className={`place-card ${place.id === item.id ? "is-selected" : ""}`}
                    key={item.id}
                    aria-label={item.name}
                    title={item.description}
                    onClick={() => void choosePlace(item)}
                    aria-pressed={place.id === item.id}
                  >
                    {item.id.startsWith("landmark:") ? (
                      <span className="landmark-rank" aria-hidden="true">
                        {String(
                          LANDMARK_PLACES.findIndex((p) => p.id === item.id) +
                            1,
                        ).padStart(2, "0")}
                      </span>
                    ) : (
                      <PlaceArt
                        placeId={item.id}
                        variant={
                          PLACES.findIndex((p) => p.id === item.id) >= 0
                            ? PLACES.findIndex((p) => p.id === item.id)
                            : index
                        }
                      />
                    )}
                    <span className="place-card-copy">
                      <strong>{item.name}</strong>
                      <span>
                        {item.city}
                        <i /> {item.category}
                      </span>
                    </span>
                    <span className="place-card-indicator">
                      <Icon
                        name={place.id === item.id ? "check" : "chevron"}
                        size={16}
                      />
                    </span>
                  </button>
                ))}
                {!filtered.length && !searching && (
                  <div className="empty-state">
                    <Icon name="search" />
                    <p>Chưa thấy góc phố này.</p>
                    <span>
                      Bấm mũi tên để tìm thêm địa điểm, hoặc dán tọa độ từ bản
                      đồ.
                    </span>
                    <button
                      className="button button--quiet"
                      onClick={() => {
                        setQuery("");
                        setRegion("Tất cả");
                        setProvince("");
                        setResults(null);
                      }}
                    >
                      Xem các địa điểm gợi ý
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="saved-list">
              {saved.map((record, index) => (
                <div className="saved-card" key={record.id}>
                  <button
                    className="saved-open"
                    onClick={() => openSaved(record)}
                  >
                    <PlaceArt placeId={record.place.id} variant={index} />
                    <span>
                      <strong>{record.place.name}</strong>
                      <small>
                        {record.span} m ·{" "}
                        {
                          STYLES.find((s) => s.id === record.settings.style)
                            ?.name
                        }
                      </small>
                    </span>
                  </button>
                  {iconButton(
                    "trash",
                    `Xóa góc nhìn ${record.place.name}`,
                    () => removeSaved(record.id),
                  )}
                </div>
              ))}
              {!saved.length && (
                <div className="empty-state">
                  <Icon name="bookmark" size={28} />
                  <p>Giữ lại góc nhìn yêu thích.</p>
                  <span>
                    Chọn một cảnh rồi bấm “Lưu góc nhìn”. Dữ liệu ở lại trên
                    thiết bị này.
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="location-tip">
            <Icon name="pin" size={17} />
            <p>
              Một tọa độ, một thế giới nhỏ.
              <br />
              <span>Thử dán link Google Maps vào ô tìm kiếm.</span>
            </p>
          </div>
        </aside>
        <section
          className="viewport"
          id="scene-area"
          aria-label="Không gian địa cảnh"
        >
          <div className="viewport-heading">
            <div className="place-category">
              <span className="live-dot" />
              {countryView ? "Tổng quan" : place.category} · Việt Nam
            </div>
            <h2>{countryView ? "Đi dọc Việt Nam" : place.name}</h2>
            <div className="coordinate-label">
              <span>
                {countryView ? (
                  "Kéo để đi xa · Phóng gần để xem phố"
                ) : (
                  <>
                    {place.lat.toFixed(5)}° N <i>·</i> {place.lon.toFixed(5)}° E
                  </>
                )}
              </span>
              {!countryView &&
                iconButton(
                  "copy",
                  "Sao chép tọa độ",
                  () =>
                    void copy(
                      `${place.lat.toFixed(6)}, ${place.lon.toFixed(6)}`,
                      "Đã sao chép tọa độ.",
                    ),
                )}
            </div>
            {!!landmarks.length && !flat && !countryView && (
              <label className="landmark-picker">
                <span>Điểm nổi bật · {landmarks.length}</span>
                <select
                  aria-label="Đến điểm nổi bật"
                  disabled={busy}
                  defaultValue=""
                  key={place.id}
                  onChange={(event) => {
                    canvas.current?.focusLandmark(event.target.value);
                    event.target.value = "";
                  }}
                >
                  <option value="" disabled>
                    Chọn địa danh để xem gần
                  </option>
                  {landmarks.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="viewport-top-actions">
            {iconButton("share", "Chia sẻ góc nhìn", share, !ready)}
            <button
              className="compass"
              aria-label="Về góc phối cảnh mặc định"
              title="Về góc mặc định"
              onClick={() => changeView("perspective")}
            >
              <span>N</span>
              <svg viewBox="0 0 28 28" aria-hidden="true">
                <path d="m14 3 6 19-6-4-6 4Z" fill="currentColor" />
                <path d="m14 3 6 19-6-4Z" fill="#a5b2a0" />
              </svg>
            </button>
          </div>
          <SceneCanvas
            ref={canvas}
            data={data}
            terrain={terrain}
            settings={settings}
            seed={seed}
            focal={focal}
            travel={travel}
            onPin={setPin}
            onView={setView}
            onStats={setStats}
            onLandmarks={(items) =>
              setLandmarks(
                [...items].sort(
                  (a, b) => (a.priority ?? 1000) - (b.priority ?? 1000),
                ),
              )
            }
            onProgress={setProgress}
            onError={sceneError}
            onReady={sceneReady}
            onUnavailable={sceneUnavailable}
            onNavigate={navigate}
            onContextLoading={setContextLoading}
            onSpan={setMapSpan}
          />
          {flat && (
            <div className="flat-map">
              <MapPreview
                data={data}
                large
                onPick={(x, z) => {
                  if (data)
                    setPin({ x, z, coordinate: unproject(x, z, data.center) });
                }}
              />
              {unavailable && (
                <div className="fallback-note">
                  <Icon name="info" />
                  <span>
                    Thiết bị chưa mở được 3D. Bạn vẫn có thể xem bản đồ và chọn
                    địa điểm.
                  </span>
                </div>
              )}
            </div>
          )}
          {busy && !travelPending && !unavailable && (
            <div className="scene-loading" role="status">
              <div className="loading-mark">
                <Icon name="building" size={28} />
              </div>
              <strong>
                {pending ? `Đang mở ${pending}…` : "Đang dựng góc phố…"}
              </strong>
              <span>
                {pending
                  ? "Đang lấy bản đồ và địa hình"
                  : `${Math.round((progress ?? 0) * 100)}% · Sắp đến nơi rồi`}
              </span>
              {progress !== null && <progress value={progress} max={1} />}
            </div>
          )}
          {(travelPending || contextLoading) && !unavailable && (
            <div className="travel-loading" role="status">
              <span className="spinner" />
              {travelPending
                ? "Đang nối vùng tiếp theo…"
                : "Đang mở rộng bản đồ…"}
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              <Icon name="info" />
              <span>{error}</span>
              <button
                className="button button--quiet"
                onClick={() => {
                  setError("");
                  const failed = failedTravel.current;
                  if (failed) {
                    failedTravel.current = null;
                    navigate(failed.center);
                  } else if (ready) canvas.current?.retryContext();
                  else void choosePlace(place, data?.span ?? spanDraft);
                }}
              >
                Thử lại
              </button>
              {iconButton("close", "Đóng thông báo lỗi", () => setError(""))}
            </div>
          )}
          <div className="viewport-stamp">
            <span>
              PHỐ / GÓC NHÌN{" "}
              {String(
                PLACES.findIndex((p) => p.id === place.id) + 1 || 1,
              ).padStart(2, "0")}
            </span>
            <span>
              {countryView
                ? `Bản đồ liên tục · ${formatCount(Math.round(mapSpan / 1000))} km`
                : `${data?.span ?? spanDraft} × ${data?.span ?? spanDraft} m`}
            </span>
          </div>
          {data && !flat && !countryView && (
            <div className="minimap-card">
              <MapPreview
                data={data}
                onPick={(x, z) => canvas.current?.pinAt(x, z)}
              />
              <div>
                <span>
                  <Icon name="pin" size={12} />
                  Vị trí của bạn
                </span>
                <button
                  onClick={() => setFlat(true)}
                  title="Mở bản đồ lớn"
                  aria-label="Mở bản đồ lớn"
                >
                  <Icon name="top" size={15} />
                </button>
              </div>
            </div>
          )}
          <div className="viewport-bottom">
            <div className="canvas-hint">
              <Icon name={view === "eye" ? "eye" : "cursor"} size={15} />
              <span>
                {view === "eye"
                  ? "W A S D để đi · Kéo để nhìn"
                  : dragPan
                    ? "Kéo để đi · Shift + kéo để xoay · Cuộn thu phóng"
                    : "Kéo để xoay · Shift + kéo để đi · Cuộn thu phóng"}
              </span>
            </div>
            <div className="view-controls">
              {view !== "eye" && (
                <button
                  className={`drag-mode icon-button ${dragPan ? "is-active" : ""}`}
                  aria-label="Kéo để di chuyển bản đồ"
                  title="Bật/tắt kéo để di chuyển. Shift + kéo đổi thao tác."
                  aria-pressed={dragPan}
                  onClick={() => {
                    setDragPan(!dragPan);
                    canvas.current?.pan(!dragPan);
                  }}
                >
                  <Icon name="cursor" size={17} />
                </button>
              )}
              <div className="view-segments" role="group" aria-label="Góc nhìn">
                {VIEWS.map((item) => (
                  <button
                    key={item.id}
                    className={view === item.id && !flat ? "is-active" : ""}
                    aria-label={item.name}
                    aria-pressed={view === item.id && !flat}
                    onClick={() => {
                      setFlat(false);
                      changeView(item.id);
                    }}
                    disabled={!ready || unavailable}
                  >
                    <Icon name={item.icon} size={17} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
              <span className="toolbar-divider" />
              {iconButton(
                "minus",
                "Thu nhỏ",
                () => canvas.current?.zoom(-1),
                !ready,
              )}
              {iconButton(
                "plus",
                "Phóng to",
                () => canvas.current?.zoom(1),
                !ready,
              )}
              {iconButton(
                "reset",
                "Đặt lại góc nhìn",
                () => changeView("perspective"),
                !ready,
              )}
            </div>
          </div>
          {pin && (
            <div className="pin-popover">
              <Icon name="pin" size={17} />
              <span>
                {pin.coordinate.lat.toFixed(5)}, {pin.coordinate.lon.toFixed(5)}
              </span>
              <button onClick={() => canvas.current?.focusPin()}>
                Tới đây <Icon name="arrow" size={14} />
              </button>
              {iconButton("close", "Bỏ chọn vị trí", () => setPin(null))}
            </div>
          )}
        </section>
        <aside
          className={`inspector-panel ${mobilePanel === "settings" ? "is-open" : ""}`}
          id="settings-panel"
          aria-label="Thiết lập cảnh"
        >
          <div className="inspector-title">
            <div>
              <Icon name="sliders" size={18} />
              <h2>Thiết lập cảnh</h2>
            </div>
            <span className="desktop-only">01—06</span>
            <span className="mobile-only">
              {iconButton("close", "Đóng thiết lập", () =>
                setMobilePanel(null),
              )}
            </span>
          </div>
          <div
            className="inspector-tabs"
            role="group"
            aria-label="Nhóm thiết lập"
          >
            <button
              aria-pressed={inspector === "appearance"}
              onClick={() => setInspector("appearance")}
            >
              Hiển thị
            </button>
            <button
              aria-pressed={inspector === "camera"}
              onClick={() => setInspector("camera")}
            >
              Máy ảnh
            </button>
          </div>
          <div className="inspector-scroll">
            {inspector === "appearance" ? (
              <>
                <section className="setting-section">
                  <h3>Phong cách</h3>
                  <div className="style-cards">
                    {STYLES.map((style, index) => (
                      <button
                        key={style.id}
                        className={`style-card style-card--${style.id}`}
                        aria-pressed={settings.style === style.id}
                        onClick={() =>
                          setSettings((previous) => ({
                            ...previous,
                            style: style.id,
                            outlines: style.id === "ink" ? 0.85 : 0.55,
                          }))
                        }
                      >
                        <svg viewBox="0 0 72 48" aria-hidden="true">
                          <path
                            d="m11 26 23-13 26 12-22 14Z"
                            className="style-ground"
                          />
                          <path
                            d="m26 18 11-6 13 6-12 7Z"
                            className="style-roof"
                          />
                          <path
                            d="M26 18v13l12 6V25ZM38 25l12-7v13l-12 6Z"
                            className="style-wall"
                          />
                          <path
                            d="m23 18 14-10 16 10-15 9Z"
                            className="style-roof"
                          />
                        </svg>
                        <span>{style.name}</span>
                        {settings.style === style.id && (
                          <i>
                            <Icon name="check" size={10} />
                          </i>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
                <section className="setting-section">
                  <div className="setting-label">
                    <label htmlFor="sun-hour">
                      <Icon name="sun" size={16} />
                      Ánh sáng
                    </label>
                    <output htmlFor="sun-hour">{timeLabel}</output>
                  </div>
                  <input
                    id="sun-hour"
                    type="range"
                    min={6}
                    max={18}
                    step={0.25}
                    value={settings.hour}
                    onChange={(event) =>
                      update("hour", Number(event.target.value))
                    }
                  />
                  <div className="range-ends">
                    <span>Bình minh</span>
                    <span>Hoàng hôn</span>
                  </div>
                </section>
                <section className="setting-section setting-section--compact">
                  <div className="setting-label">
                    <label htmlFor="outline">Độ đậm nét</label>
                    <output htmlFor="outline">
                      {Math.round(settings.outlines * 100)}%
                    </output>
                  </div>
                  <input
                    id="outline"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.outlines}
                    onChange={(event) =>
                      update("outlines", Number(event.target.value))
                    }
                  />
                  <div className="setting-label second-control">
                    <label htmlFor="height-scale">Phóng đại chiều cao</label>
                    <output htmlFor="height-scale">
                      {settings.heightScale.toFixed(1)}×
                    </output>
                  </div>
                  <input
                    id="height-scale"
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={settings.heightScale}
                    onChange={(event) =>
                      update("heightScale", Number(event.target.value))
                    }
                  />
                </section>
                <section className="setting-section layers-section">
                  <h3>Thành phần cảnh</h3>
                  {toggles.map((item) => (
                    <label className="toggle-row" key={item.key}>
                      <span>
                        <Icon name={item.icon} size={17} />
                        {item.label}
                      </span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={settings[item.key]}
                        onChange={(event) =>
                          update(item.key, event.target.checked)
                        }
                        disabled={item.key === "terrain" && !terrain?.available}
                      />
                      <span className="switch-track" aria-hidden="true" />
                    </label>
                  ))}
                </section>
                <div className="seed-card">
                  <div>
                    <Icon name="shuffle" size={17} />
                    <strong>Một chút ngẫu hứng</strong>
                  </div>
                  <p>Đổi chiều cao ước tính, giữ nguyên mặt bằng.</p>
                  <button
                    className="button button--quiet"
                    disabled={busy || !data}
                    onClick={() =>
                      setSeed(Math.floor(Math.random() * 4294967295))
                    }
                  >
                    <Icon name="shuffle" size={15} />
                    Tạo biến thể mới
                  </button>
                </div>
              </>
            ) : (
              <>
                <section className="setting-section">
                  <h3>Góc nhìn</h3>
                  <div className="camera-presets">
                    {VIEWS.map((item) => (
                      <button
                        key={item.id}
                        aria-pressed={view === item.id}
                        onClick={() => changeView(item.id)}
                        disabled={!ready || unavailable}
                      >
                        <Icon name={item.icon} />
                        {item.name}
                        <span>
                          {item.id === "perspective"
                            ? "1"
                            : item.id === "overview"
                              ? "4"
                              : item.id === "top"
                                ? "2"
                                : "3"}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="setting-section">
                  <div className="setting-label">
                    <label htmlFor="lens">Tiêu cự ống kính</label>
                    <output htmlFor="lens">{Math.round(focal)} mm</output>
                  </div>
                  <input
                    id="lens"
                    type="range"
                    min={24}
                    max={85}
                    step={1}
                    value={focal}
                    onChange={(event) => setFocal(Number(event.target.value))}
                  />
                  <div className="range-ends">
                    <span>Góc rộng</span>
                    <span>Cận cảnh</span>
                  </div>
                </section>
                <section className="setting-section">
                  <h3>Phạm vi khu vực</h3>
                  <label htmlFor="scene-extent" className="sr-only">
                    Chiều rộng khu vực
                  </label>
                  <select
                    id="scene-extent"
                    value={spanDraft}
                    onChange={(event) =>
                      setSpanDraft(Number(event.target.value))
                    }
                  >
                    {[300, 500, 800, 900, 1000, 1100, 1500, 1800].map(
                      (value) => (
                        <option value={value} key={value}>
                          {formatCount(value)} × {formatCount(value)} m
                        </option>
                      ),
                    )}
                  </select>
                  <button
                    className="button button--quiet full-width"
                    disabled={busy}
                    onClick={() => void choosePlace(place, spanDraft)}
                  >
                    <Icon name="layers" size={17} />
                    Dựng khu vực
                  </button>
                </section>
                <section className="setting-section">
                  <label className="toggle-row">
                    <span>
                      <Icon name="top" size={17} />
                      Lưới tham chiếu
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={settings.grid}
                      onChange={(event) => update("grid", event.target.checked)}
                    />
                    <span className="switch-track" aria-hidden="true" />
                  </label>
                  <p className="control-note">
                    Chạm vào cảnh hoặc bản đồ nhỏ để ghim vị trí.
                  </p>
                  <button
                    className="button button--quiet full-width"
                    onClick={() => canvas.current?.focusPin()}
                    disabled={!pin}
                  >
                    <Icon name="pin" size={17} />
                    Đưa máy ảnh tới ghim
                  </button>
                  <button
                    className="button button--quiet full-width"
                    onClick={() => changeView("eye")}
                    disabled={!ready || unavailable}
                  >
                    <Icon name="eye" size={17} />
                    Đứng ở tầm mắt · 1,7 m
                  </button>
                </section>
              </>
            )}
          </div>
          <div className="data-note">
            <Icon name="info" size={15} />
            <p>
              {terrain?.available
                ? "Dựng từ bản đồ và cao độ thực."
                : "Đang dùng mặt nền phẳng."}
              <span>
                {stats.estimated > 0
                  ? `${formatCount(stats.estimated)} chiều cao được ước tính.`
                  : "Hình khối kiến trúc được đơn giản hóa."}
              </span>
              <span>Mặt tiền và đồ vật đường phố được minh họa.</span>
              {data &&
                place.category !== "Danh thắng" &&
                !data.features.some((f) => f.kind === "building") && (
                  <span className="sparse-data-note">
                    Nguồn bản đồ chưa ghi nhận nhà trong vùng này. Cảnh hiển thị
                    đường, địa hình và thảm thực vật có dữ liệu.
                  </span>
                )}
              {data?.provider === "vector" && (
                <span>Bản đồ vector đã tổng quát hóa.</span>
              )}
            </p>
          </div>
        </aside>
      </main>
      <footer className="status-bar">
        <div>
          <span className={`status-dot ${busy ? "is-busy" : ""}`} />
          <span>
            {busy
              ? "Đang dựng cảnh"
              : ready
                ? "Sẵn sàng khám phá"
                : "Bản đồ Việt Nam"}
          </span>
          {ready && (
            <>
              <i />
              <span>{formatCount(stats.buildings)} công trình</span>
              <span className="status-roads">
                · {formatCount(stats.roads)} đoạn đường
              </span>
            </>
          )}
        </div>
        <div className="attribution">
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors
          </a>
          <span>·</span>
          <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">
            © OpenMapTiles
          </a>
          <span>·</span>
          <a
            href="https://registry.opendata.aws/terrain-tiles/"
            target="_blank"
            rel="noreferrer"
          >
            Mapzen Terrain
          </a>
        </div>
      </footer>
      <nav className="mobile-nav" aria-label="Bảng công cụ">
        <button
          aria-expanded={mobilePanel === "location"}
          aria-controls="location-panel"
          onClick={() =>
            setMobilePanel((m) => (m === "location" ? null : "location"))
          }
        >
          <Icon name="pin" />
          <span>Địa điểm</span>
        </button>
        <button
          aria-pressed={!mobilePanel}
          onClick={() => setMobilePanel(null)}
        >
          <Icon name="cube" />
          <span>Cảnh 3D</span>
        </button>
        <button
          aria-expanded={mobilePanel === "settings"}
          aria-controls="settings-panel"
          onClick={() =>
            setMobilePanel((m) => (m === "settings" ? null : "settings"))
          }
        >
          <Icon name="sliders" />
          <span>Tùy chỉnh</span>
        </button>
      </nav>
      {notice && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {notice}
        </div>
      )}
      <dialog
        className="studio-dialog country-dialog"
        aria-labelledby="country-title"
        ref={countryDialog}
        onClose={() => setCountryOpen(false)}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">MỘT DẢI ĐẤT, VÔ VÀN GÓC NHÌN</span>
            <h2 id="country-title">Đi dọc Việt Nam.</h2>
          </div>
          {iconButton("close", "Đóng bản đồ Việt Nam", () =>
            countryDialog.current?.close(),
          )}
        </div>
        {countryOpen && (
          <CountryPicker
            current={place}
            onChoose={(next) => {
              countryDialog.current?.close();
              void choosePlace(next);
            }}
          />
        )}
      </dialog>
      <dialog
        className="studio-dialog"
        aria-labelledby="export-title"
        ref={exportDialog}
        onClose={() => {
          exportCanceled.current = true;
        }}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">MANG GÓC PHỐ ĐI CÙNG BẠN</span>
            <h2 id="export-title">Xuất cảnh của bạn</h2>
          </div>
          {iconButton(
            "close",
            "Đóng xuất cảnh",
            () => exportDialog.current?.close(),
            exporting,
          )}
        </div>
        <p className="dialog-description">
          {place.name} · {data?.span ?? 800} × {data?.span ?? 800} m
        </p>
        <div
          className="export-formats"
          role="group"
          aria-label="Định dạng xuất"
        >
          {(
            [
              {
                id: "png",
                name: "PNG",
                detail: "Ảnh góc nhìn hiện tại",
                icon: "download",
              },
              {
                id: "svg",
                name: "SVG",
                detail: "Hình vector có thể chỉnh sửa",
                icon: "layers",
              },
              {
                id: "glb",
                name: "GLB",
                detail: "Mô hình 3D có màu",
                icon: "cube",
              },
              {
                id: "obj",
                name: "OBJ",
                detail: "Hình học 3D",
                icon: "building",
              },
            ] as const
          ).map((format) => (
            <button
              key={format.id}
              aria-pressed={exportFormat === format.id}
              onClick={() => setExportFormat(format.id)}
              disabled={exporting}
            >
              <Icon name={format.icon} />
              <strong>{format.name}</strong>
              <span>{format.detail}</span>
              {exportFormat === format.id && <Icon name="check" size={17} />}
            </button>
          ))}
        </div>
        {(exportFormat === "png" || exportFormat === "svg") && (
          <label className="export-resolution">
            Chiều rộng ảnh
            <select
              value={exportWidth}
              onChange={(event) => setExportWidth(Number(event.target.value))}
              disabled={exporting}
            >
              <option value={1920}>1.920 px</option>
              <option value={2560}>2.560 px</option>
              <option value={3840}>3.840 px</option>
            </select>
          </label>
        )}
        <div className="export-credit">
          <Icon name="info" size={17} />
          <p>
            File xuất giữ thông tin nguồn bản đồ. Khi sử dụng, hãy giữ credit
            OpenStreetMap bên cạnh tác phẩm.
          </p>
        </div>
        <button
          className="button button--primary export-submit"
          onClick={() => void exportFile()}
          disabled={exporting || !canExport}
        >
          {exporting ? <span className="spinner" /> : <Icon name="download" />}
          {exporting
            ? "Đang chuẩn bị file…"
            : `Tải xuống ${exportFormat.toUpperCase()}`}
        </button>
      </dialog>
      <dialog
        className="studio-dialog help-dialog"
        ref={helpDialog}
        aria-labelledby="help-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">BẮT ĐẦU TỪ MỘT NƠI CHỐN</span>
            <h2 id="help-title">Một góc Việt Nam của bạn.</h2>
          </div>
          {iconButton("close", "Đóng hướng dẫn", () =>
            helpDialog.current?.close(),
          )}
        </div>
        <ol className="help-steps">
          <li>
            <span>01</span>
            <div>
              <h3>Chọn nơi bạn muốn ghé</h3>
              <p>
                Mở bản đồ Việt Nam để chọn điểm trên đất liền và biển đảo, lọc
                tỉnh/thành, tìm tên địa điểm hoặc dán tọa độ/link bản đồ đầy đủ.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Tìm góc nhìn có câu chuyện</h3>
              <p>
                Kéo để đi trên bản đồ; Shift + kéo để xoay. Trên điện thoại,
                dùng hai ngón tay để thu phóng. Vùng tiếp theo tự tải khi bạn đi
                ra rìa. Thu nhỏ để đi xa giữa các thành phố, phóng gần để xem
                nhà và đường. Chạm vào cảnh để ghim; ở tầm mắt, dùng W A S D để
                đi.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Thêm dấu ấn rồi mang đi</h3>
              <p>
                Chọn phong cách, ánh sáng và xuất ảnh hoặc mô hình 3D. Lưu góc
                nhìn để quay lại bất cứ lúc nào.
              </p>
            </div>
          </li>
        </ol>
        <div className="shortcut-list">
          <span>
            <kbd>1</kbd> Phối cảnh
          </span>
          <span>
            <kbd>2</kbd> Từ trên
          </span>
          <span>
            <kbd>3</kbd> Tầm mắt
          </span>
          <span>
            <kbd>4</kbd> Toàn cảnh
          </span>
          <span>
            <kbd>F</kbd> Tới ghim
          </span>
        </div>
        <p className="help-note">
          Dữ liệu nhà và đường đến từ OpenStreetMap. Chiều cao thiếu dữ liệu
          được ước tính; đây là công cụ sáng tạo, không phải bản đo kiến trúc.
        </p>
        <details className="photo-credits">
          <summary>Nguồn ảnh địa điểm</summary>
          <ul>
            {Object.entries(placePhotos).map(([id, photo]) => (
              <li key={id}>
                <a href={photo.source} target="_blank" rel="noreferrer">
                  {PLACES.find((place) => place.id === id)?.name}
                </a>
                {" · "}
                {photo.author}
                {" · "}
                <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
                  {photo.license}
                </a>
              </li>
            ))}
          </ul>
          <p>Ảnh đã được cắt vuông, thu nhỏ và nén từ bản gốc.</p>
        </details>
        <button
          className="button button--primary full-width"
          onClick={() => helpDialog.current?.close()}
        >
          Bắt đầu khám phá
          <Icon name="arrow" />
        </button>
      </dialog>
    </div>
  );
}
