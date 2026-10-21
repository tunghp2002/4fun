import { useId, useMemo } from "react";
import type { MapData } from "../lib/types";
import { isLinearFeature } from "../lib/types";
import { project } from "../lib/geo/coordinates";

export default function MapPreview({
  data,
  large = false,
  onPick,
}: {
  data: MapData | null;
  large?: boolean;
  onPick?: (x: number, z: number) => void;
}) {
  const id = useId();
  const paths = useMemo(() => {
    const output = { building: "", road: "", water: "", park: "" };
    if (!data) return output;
    for (const feature of data.features) {
      if (feature.kind === "tree") continue;
      output[feature.kind] +=
        feature.points
          .map((p, i) => {
            const [x, z] = project(p, data.center);
            return `${i ? "L" : "M"}${x.toFixed(1)},${z.toFixed(1)}`;
          })
          .join("") + (isLinearFeature(feature) ? "" : "Z");
    }
    return output;
  }, [data]);
  const span = data?.span ?? 800,
    half = span / 2;
  return (
    <svg
      className={large ? "map-preview map-preview--large" : "map-preview"}
      viewBox={`${-half} ${-half} ${span} ${span}`}
      role={onPick ? "button" : "img"}
      aria-label={
        onPick
          ? "Bản đồ khu vực. Chạm để ghim vị trí; Enter chọn tâm."
          : "Bản đồ khu vực đang xem"
      }
      tabIndex={onPick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onPick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onPick(0, 0);
        }
      }}
      onClick={(event) => {
        if (!onPick) return;
        const r = event.currentTarget.getBoundingClientRect();
        onPick(
          ((event.clientX - r.left) / r.width) * span - half,
          ((event.clientY - r.top) / r.height) * span - half,
        );
      }}
    >
      <defs>
        <clipPath id={id}>
          <rect
            x={-half}
            y={-half}
            width={span}
            height={span}
            rx={large ? 0 : span * 0.035}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={-half} y={-half} width={span} height={span} fill="#eaeadd" />
        <path d={paths.park} fill="#b8c8aa" />
        <path d={paths.water} fill="#a5c5c2" stroke="#a5c5c2" strokeWidth={8} />
        <path d={paths.road} fill="none" stroke="#fffdf3" strokeWidth={5} />
        <path
          d={paths.building}
          fill="#b3b29e"
          stroke="#eaeadd"
          strokeWidth={0.7}
        />
        <circle
          r={span * 0.016}
          fill="#2e5c42"
          stroke="#fff"
          strokeWidth={span * 0.005}
        />
      </g>
    </svg>
  );
}
