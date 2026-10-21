import { useCallback, useEffect, useRef, useState } from "react";
import { PLACES, PROVINCES, MAP_LABELS, mapLabel } from "../lib/places";
import {
  contains,
  isOffshore,
  isVietnam,
  type Point,
} from "../lib/geo/coordinates";
import outlines from "../lib/geo/vietnam-overview.json";
import type { Place } from "../lib/types";
import Icon from "./Icon";
import PlaceArt from "./PlaceArt";

type View = { x: number; y: number; width: number; height: number };
const HOME: View = { x: 101, y: -24.5, width: 16.8, height: 18.8 };
const path = (rings: number[][][]) =>
  rings
    .map(
      (ring) =>
        ring.map(([lon, lat], i) => `${i ? "L" : "M"}${lon},${-lat}`).join("") +
        "Z",
    )
    .join("");

const LAND_PATHS = outlines.map((country) => ({
  ...country,
  path: path(country.rings),
}));

export default function CountryPicker({
  current,
  onChoose,
}: {
  current: Place;
  onChoose(place: Place): void;
}) {
  const [view, setView] = useState(HOME),
    [selected, setSelected] = useState(current),
    [province, setProvince] = useState(""),
    [message, setMessage] = useState("");
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    inverse: DOMMatrix;
    view: View;
    moved: boolean;
  } | null>(null);
  const skipClick = useRef(false);
  const shown = province
    ? PLACES.filter((p) => p.province === province)
    : PLACES;
  const zoom = useCallback(
    (factor: number, anchor?: DOMPoint) =>
      setView((previous) => {
        const width = Math.max(
            0.7,
            Math.min(HOME.width, previous.width * factor),
          ),
          ratio = width / previous.width;
        const point =
          anchor ??
          new DOMPoint(
            previous.x + previous.width / 2,
            previous.y + previous.height / 2,
          );
        return {
          x: point.x - (point.x - previous.x) * ratio,
          y: point.y - (point.y - previous.y) * ratio,
          width,
          height: previous.height * ratio,
        };
      }),
    [],
  );
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const matrix = element.getScreenCTM()?.inverse();
      if (matrix)
        zoom(
          event.deltaY > 0 ? 1.2 : 1 / 1.2,
          new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix),
        );
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [zoom]);
  const select = (place: Place) => {
    setSelected(place);
    setProvince((previous) =>
      previous && previous !== place.province ? "" : previous,
    );
    setMessage("");
  };
  const chooseProvince = (value: string) => {
    setProvince(value);
    const places = PLACES.filter((p) => p.province === value);
    if (!places.length) {
      setView(HOME);
      return;
    }
    select(places[0]);
    const west = Math.min(...places.map((p) => p.lon)) - 0.7,
      east = Math.max(...places.map((p) => p.lon)) + 0.7;
    const north = Math.max(...places.map((p) => p.lat)) + 0.7,
      south = Math.min(...places.map((p) => p.lat)) - 0.7;
    const width = Math.max(
        2,
        east - west,
        ((north - south) * HOME.width) / HOME.height,
      ),
      height = (width * HOME.height) / HOME.width;
    setView({
      x: (west + east - width) / 2,
      y: (-north - south - height) / 2,
      width,
      height,
    });
  };
  const pointAt = (clientX: number, clientY: number) => {
    const matrix = svg.current?.getScreenCTM()?.inverse();
    return matrix
      ? new DOMPoint(clientX, clientY).matrixTransform(matrix)
      : null;
  };
  const pick = (point: DOMPoint) => {
    const coordinate = { lat: -point.y, lon: point.x };
    const land = outlines
      .find((country) => country.code === "VNM")!
      .rings.some((ring) =>
        contains(ring as Point[], coordinate.lon, coordinate.lat),
      );
    if (!isVietnam(coordinate) || (!land && !isOffshore(coordinate))) {
      setMessage(
        "Chọn một điểm trên phần đất liền hoặc vùng biển đảo được đánh dấu.",
      );
      return;
    }
    setProvince("");
    select({
      ...coordinate,
      id: "custom",
      name: "Góc nhìn trên bản đồ",
      city: "Việt Nam",
      region:
        coordinate.lat > 19 ? "Bắc" : coordinate.lat > 14 ? "Trung" : "Nam",
      category: isOffshore(coordinate) ? "Biển đảo" : "Tọa độ",
      span: 800,
      description: "Một điểm do bạn chọn trên bản đồ.",
    });
  };
  const unit = view.width / HOME.width;
  return (
    <div className="country-picker">
      <div className="country-map-wrap">
        <div className="country-map-caption">
          <span className="live-dot" /> TỪ MIỀN NÚI ĐẾN BIỂN ĐẢO
        </div>
        <svg
          ref={svg}
          className="country-map"
          viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
          role="group"
          tabIndex={0}
          aria-label="Bản đồ chọn điểm Việt Nam. Kéo để di chuyển, phím cộng trừ để thu phóng, Home để xem toàn quốc. Chọn địa danh bằng phím Tab."
          onKeyDown={(event) => {
            if (event.key === "+" || event.key === "=") {
              event.preventDefault();
              zoom(1 / 1.4);
            } else if (event.key === "-") {
              event.preventDefault();
              zoom(1.4);
            } else if (event.key === "Home") {
              event.preventDefault();
              setView(HOME);
            }
          }}
          onPointerDown={(event) => {
            if (
              event.button !== 0 ||
              (event.target as Element).closest("[data-place]")
            )
              return;
            const inverse = event.currentTarget.getScreenCTM()?.inverse();
            if (!inverse) return;
            drag.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              inverse,
              view,
              moved: false,
            };
            skipClick.current = false;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const start = drag.current;
            if (!start || start.id !== event.pointerId) return;
            const a = new DOMPoint(start.x, start.y).matrixTransform(
                start.inverse,
              ),
              b = new DOMPoint(event.clientX, event.clientY).matrixTransform(
                start.inverse,
              );
            if (
              Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4
            )
              start.moved = true;
            if (start.moved)
              setView({
                ...start.view,
                x: start.view.x + a.x - b.x,
                y: start.view.y + a.y - b.y,
              });
          }}
          onPointerUp={(event) => {
            if (drag.current?.id === event.pointerId) {
              skipClick.current = drag.current.moved;
              drag.current = null;
            }
          }}
          onPointerCancel={() => {
            drag.current = null;
            skipClick.current = true;
          }}
          onClick={(event) => {
            if (skipClick.current) {
              skipClick.current = false;
              return;
            }
            const point = pointAt(event.clientX, event.clientY);
            if (point) pick(point);
          }}
        >
          <defs>
            <pattern
              id="country-grid"
              width="1"
              height="1"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 1 0 L 0 0 0 1"
                fill="none"
                stroke="#b1cbc4"
                strokeWidth={0.008 * unit}
              />
            </pattern>
          </defs>
          <rect x={90} y={-35} width={40} height={40} fill="#dceae4" />
          <rect
            x={90}
            y={-35}
            width={40}
            height={40}
            fill="url(#country-grid)"
          />
          {LAND_PATHS.map((country) => (
            <path
              key={country.code}
              data-country={country.code}
              d={country.path}
              fill={country.code === "VNM" ? "#fffdf0" : "#c8d5c0"}
              stroke={country.code === "VNM" ? "#84977b" : "#b5c5ae"}
              strokeWidth={0.028 * unit}
              fillRule="evenodd"
            />
          ))}
          <text
            x={112}
            y={-13.8}
            className="country-sea-label"
            fontSize={0.32 * unit}
          >
            BIỂN ĐÔNG
          </text>
          {PLACES.map((place) => (
            <g
              key={place.id}
              data-place={place.id}
              role="button"
              tabIndex={0}
              aria-label={`Chọn ${place.name}`}
              aria-pressed={selected.id === place.id}
              className="country-marker"
              opacity={!province || place.province === province ? 1 : 0.3}
              onClick={(event) => {
                event.stopPropagation();
                select(place);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  select(place);
                }
              }}
            >
              <title>
                {place.name} · {place.province}
              </title>
              <circle
                cx={place.lon}
                cy={-place.lat}
                r={0.19 * unit}
                fill="transparent"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={place.lon}
                cy={-place.lat}
                r={(selected.id === place.id ? 0.09 : 0.055) * unit}
                fill={place.category === "Biển đảo" ? "#ac7049" : "#42654a"}
                stroke="#fffefa"
                strokeWidth={0.025 * unit}
              />
              {(MAP_LABELS.has(place.id) || view.width < 5) && (
                <text
                  x={place.lon + 0.13 * unit}
                  y={-place.lat + 0.05 * unit}
                  fontSize={0.23 * unit}
                  strokeWidth={0.055 * unit}
                >
                  {mapLabel(place)}
                </text>
              )}
            </g>
          ))}
          <g className="country-selection" pointerEvents="none">
            <circle
              cx={selected.lon}
              cy={-selected.lat}
              r={0.15 * unit}
              fill="none"
              stroke="#bd754a"
              strokeWidth={0.025 * unit}
            />
            <circle
              cx={selected.lon}
              cy={-selected.lat}
              r={0.045 * unit}
              fill="#bd754a"
              stroke="#fffefa"
              strokeWidth={0.02 * unit}
            />
          </g>
        </svg>
        <div className="country-map-tools">
          <button
            type="button"
            onClick={() => zoom(1 / 1.4)}
            aria-label="Phóng to bản đồ"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoom(1.4)}
            aria-label="Thu nhỏ bản đồ"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => {
              setView(HOME);
              setProvince("");
            }}
            aria-label="Xem toàn Việt Nam"
          >
            <Icon name="top" size={18} />
          </button>
        </div>
        <div className="country-map-hint">
          Kéo để di chuyển · Chạm để chọn · Cuộn để phóng to
        </div>
        <a
          className="country-map-source"
          href="https://www.naturalearthdata.com/"
          target="_blank"
          rel="noreferrer"
        >
          Đường bờ: Natural Earth
        </a>
      </div>
      <div className="country-selection-panel">
        <div className="country-coverage">
          <strong>{PROVINCES.length}</strong>
          <span>tỉnh, thành</span>
          <i />
          <strong>{PLACES.length}</strong>
          <span>điểm đến</span>
        </div>
        <label htmlFor="country-province">Bạn muốn ghé vùng nào?</label>
        <select
          id="country-province"
          value={province}
          onChange={(event) => chooseProvince(event.target.value)}
        >
          <option value="">Toàn Việt Nam</option>
          {PROVINCES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <label htmlFor="country-destination">Điểm đến gợi ý</label>
        <select
          id="country-destination"
          value={shown.some((p) => p.id === selected.id) ? selected.id : ""}
          onChange={(event) => {
            const place = PLACES.find((p) => p.id === event.target.value);
            if (place) select(place);
          }}
        >
          <option value="" disabled>
            Điểm do bạn chọn
          </option>
          {shown.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="country-place-preview">
          <PlaceArt placeId={selected.id} large />
          <div>
            <span className="eyebrow">
              {selected.category} · {selected.province ?? "VIỆT NAM"}
            </span>
            <h3>{selected.name}</h3>
            <p>{selected.description}</p>
            <span className="country-coordinates">
              {selected.lat.toFixed(5)}° N · {selected.lon.toFixed(5)}° E
            </span>
          </div>
        </div>
        {message && (
          <p className="field-error" role="status">
            {message}
          </p>
        )}
        <p className="country-detail-note">
          Chọn điểm bắt đầu, rồi kéo cảnh để đi tiếp. Thu nhỏ để di chuyển xa;
          phóng gần để xem nhà và đường. Độ chi tiết tùy dữ liệu tại mỗi nơi.
        </p>
        <button
          className="button button--primary full-width"
          onClick={() => onChoose(selected)}
        >
          <Icon name="cube" />
          Khám phá nơi này
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  );
}
