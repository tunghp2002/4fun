"use client";
import { useRef, useState, useEffect } from "react";
import {
  addRoom,
  levelOf,
  CATALOG,
  itemDefinition,
  deriveWalls,
  FLOORS,
  moveItem,
  moveRoom,
  planExtent,
  resizeRoom,
  snap,
  type Plan,
  type Rect,
  type Room,
} from "../lib/model";
export type Selection = { room: string; item?: string };
type Props = {
  plan: Plan;
  selection: Selection;
  select: (s: Selection) => void;
  begin: () => void;
  preview: (p: Plan) => void;
  finish: () => void;
  commit: (p: Plan) => void;
  report: (message: string) => void;
};
type Drag = {
  type: "item" | "size" | "move" | "draw" | "pan";
  id: string;
  x: number;
  y: number;
  plan: Plan;
  view: Rect;
  matrix: DOMMatrix;
  moved: boolean;
};
function fit(p: Plan): Rect {
  const b = planExtent(p);
  return { x: b.x - 2, y: b.y - 2, w: b.w + 4, h: b.h + 4 };
}
export default function PlanEditor({
  plan,
  selection,
  select,
  begin,
  preview,
  finish,
  commit,
  report,
}: Props) {
  const level = levelOf(plan.rooms.find(r=>r.id===selection.room) ?? plan.rooms[0]),
    floorRooms = plan.rooms.filter(r=>levelOf(r)===level),
    floorPlan = {...plan, rooms: floorRooms}, roomKeys = floorRooms.map(r=>r.id).join(",");
  const svg = useRef<SVGSVGElement>(null),
    drag = useRef<Drag | null>(null),
    frame = useRef(0),
    pending = useRef<{ x: number; y: number } | null>(null);
  const [view, setView] = useState(() => fit(floorPlan)),
    [tool, setTool] = useState<"select" | "draw" | "pan">("select"),
    [draft, setDraft] = useState<Rect | null>(null),
    [drawError, setDrawError] = useState("");
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  useEffect(() => {setView(fit(floorPlan));}, [level, roomKeys]);
  const point = (e: { clientX: number; clientY: number }) => {
    const node = svg.current!,
      p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
        drag.current?.matrix ?? node.getScreenCTM()!.inverse(),
      );
    return { x: p.x, y: p.y };
  };
  function down(
    e: React.PointerEvent<SVGElement>,
    type: Drag["type"],
    id = "",
  ) {
    if (!e.isPrimary || (e.button !== 0 && e.button !== 1)) return;
    e.stopPropagation();
    const pt = point(e);
    drag.current = {
      type: e.button === 1 ? "pan" : tool === "pan" ? "pan" : type,
      id,
      ...pt,
      plan,
      view,
      matrix: svg.current!.getScreenCTM()!.inverse(),
      moved: false,
    };
    if (drag.current.type === "draw") setDrawError("");
    svg.current!.setPointerCapture(e.pointerId);
    begin();
  }
  function update(pt: { x: number; y: number }) {
    const d = drag.current;
    if (!d) return;
    const dx = pt.x - d.x,
      dy = pt.y - d.y;
    try {
      if (d.type === "pan") {
        setView({ ...d.view, x: d.view.x - dx, y: d.view.y - dy });
        return;
      }
      if (d.type === "draw") {
        setDraft({
          x: snap(Math.min(pt.x, d.x)),
          y: snap(Math.min(pt.y, d.y)),
          w: snap(Math.abs(dx)),
          h: snap(Math.abs(dy)),
        });
        return;
      }
      if (!d.moved && Math.hypot(dx / d.matrix.a, dy / d.matrix.d) < 3) return;
      d.moved = true;
      if (d.type === "item") {
        const f = d.plan.items.find((f) => f.id === d.id)!;
        preview(moveItem(d.plan, d.id, f.x + dx, f.y + dy));
      } else {
        const r = d.plan.rooms.find((r) => r.id === d.id)!;
        preview(
          d.type === "size"
            ? resizeRoom(d.plan, d.id, r.w + dx, r.h + dy)
            : moveRoom(d.plan, d.id, r.x + dx, r.y + dy),
        );
      }
    } catch (e) {
      report((e as Error).message);
    }
  }
  function move(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    pending.current = point(e);
    if (!frame.current)
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        if (pending.current) update(pending.current);
        pending.current = null;
      });
  }
  function up(e: React.PointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d) return;
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    pending.current = null;
    update(point(e));
    drag.current = null;
    if (d.type === "draw") {
      const pt = point(e);
      try {
        const next = addRoom(d.plan, {
          x: snap(Math.min(pt.x, d.x)),
          y: snap(Math.min(pt.y, d.y)),
          w: snap(Math.abs(pt.x - d.x)),
          h: snap(Math.abs(pt.y - d.y)),
        }, level);
        commit(next);
        select({ room: next.rooms.at(-1)!.id });
        setTool("select");
      } catch (e) {
        setDrawError(`Room not added. ${(e as Error).message}`);
        report((e as Error).message);
      }
    }
    setDraft(null);
    finish();
    if (svg.current?.hasPointerCapture(e.pointerId))
      svg.current.releasePointerCapture(e.pointerId);
  }
  function zoom(factor: number) {
    setView((v) => {
      const w = Math.max(4, Math.min(90, v.w * factor)),
        h = (v.h * w) / v.w;
      return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h };
    });
  }
  const selected = plan.rooms.find((r) => r.id === selection.room),
    walls = deriveWalls(plan).filter(w=>(w.level??0)===level),
    extent = planExtent(floorPlan);
  return (
    <section className="workspace plan-workspace" aria-label="2D floor plan">
      <div className="view-heading">
        <div>
          <span className="eyebrow">01 / DRAW</span>
          <h2>
            Floor plan <span>2D</span>
          </h2>
        </div>
        <div className="segmented" aria-label="Plan tools">
          {(["select", "draw", "pan"] as const).map((t) => (
            <button
              key={t}
              aria-label={
                t === "select"
                  ? "Select furniture"
                  : t === "draw"
                    ? "Draw room"
                    : "Pan floor plan"
              }
              aria-pressed={tool === t}
              title={
                t === "draw"
                  ? "Drag beside an existing wall to create a connected room"
                  : t === "pan"
                    ? "Drag to pan"
                    : "Select and move furniture"
              }
              onClick={() => {
                setTool(t);
                setDrawError("");
              }}
            >
              {t === "select" ? "Select" : t === "draw" ? "Draw room" : "Pan"}
            </button>
          ))}
        </div>
      </div>
      {tool === "draw" && (
        <p className="plan-instruction" role={drawError ? "alert" : "status"}>
          {drawError ||
            "Drag a rectangle in empty space touching an existing wall. Minimum 1.8 × 1.8 m. Choose Select to finish drawing."}
        </p>
      )}
      <div className="plan-canvas">
        <svg
          ref={svg}
          data-tool={tool}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          role="group"
          aria-label="Editable floor plan. Select rooms or furniture, drag furniture, or drag the selected room’s lower right corner to resize."
          onPointerDown={(e) => down(e, tool === "draw" ? "draw" : "pan")}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onWheel={(e) => zoom(e.deltaY > 0 ? 1.08 : 0.92)}
        >
          <defs>
            <pattern
              id="grid"
              width=".5"
              height=".5"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M .5 0 H 0 V .5"
                fill="none"
                stroke="#d8d4ca"
                strokeWidth=".012"
              />
            </pattern>
            <pattern
              id="oak"
              width=".28"
              height="1.2"
              patternUnits="userSpaceOnUse"
            >
              <rect width=".28" height="1.2" fill="#d7bd9b" />
              <path
                d="M 0 0 H .28 M 0 0 V 1.2"
                stroke="#b99c79"
                strokeWidth=".012"
              />
            </pattern>
          </defs>
          <rect
            x={view.x - 100}
            y={view.y - 100}
            width="250"
            height="250"
            fill="url(#grid)"
          />
          {floorRooms.map((r) => (
            <g key={r.id}>
              <RoomFloor
                room={r}
                onPointerDown={(e) => {
                  if (tool === "draw") {
                    down(e, "draw");
                    return;
                  }
                  select({ room: r.id });
                  if (e.shiftKey) down(e, "move", r.id);
                  else if (tool === "pan") down(e, "pan");
                  else e.stopPropagation();
                }}
              />
            </g>
          ))}
          {plan.items
            .filter(f=>floorRooms.some(r=>r.id===f.roomId) || f.kind === "stairs" && levelOf(plan.rooms.find(r=>r.id===f.roomId)!) === level-1)
            .slice()
            .sort(
              (a, b) =>
                (a.kind === "rug" ? -1 : 0) - (b.kind === "rug" ? -1 : 0),
            )
            .map((f) => (
              <g
                key={f.id}
                transform={`translate(${f.x} ${f.y}) rotate(${f.rotation})`}
                onPointerDown={(e) => {
                  if (tool === "draw") return down(e, "draw");
                  select({ room: f.kind === "stairs" ? floorRooms.find(r=>r.zone==="stairs")!.id : f.roomId, item: f.id });
                  if(f.kind !== "stairs") down(e, "item", f.id);
                }}
                className="plan-item"
                role="button"
                tabIndex={0}
                aria-label={`Select ${itemDefinition(plan, f).name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") select({ room: f.roomId, item: f.id });
                  const steps: Record<string, [number, number]> = {
                    ArrowLeft: [-0.1, 0],
                    ArrowRight: [0.1, 0],
                    ArrowUp: [0, -0.1],
                    ArrowDown: [0, 0.1],
                  };
                  if (steps[e.key]) {
                    e.preventDefault();
                    try {
                      commit(
                        moveItem(
                          plan,
                          f.id,
                          f.x + steps[e.key][0],
                          f.y + steps[e.key][1],
                        ),
                      );
                    } catch (error) {
                      report((error as Error).message);
                    }
                  }
                }}
              >
                <rect
                  x={-f.w / 2}
                  y={-f.d / 2}
                  width={f.w}
                  height={f.d}
                  rx={f.kind === "plant" ? f.w / 2 : 0.065}
                  fill={itemDefinition(plan, f).color}
                  fillOpacity={f.kind === "rug" ? 0.5 : f.kind === "carport" ? .2 : f.kind !== "model" && CATALOG[f.kind].layer === "wall" ? .65 : 1}
                  stroke={selection.item === f.id ? "#a04f36" : "#6d7468"}
                  strokeWidth={selection.item === f.id ? 0.055 : 0.022}
                  strokeDasharray={f.kind === "rug" ? ".04 .04" : undefined}
                />
                {f.kind === "stairs" && <g stroke="#78877a" strokeWidth=".025">
                  {Array.from({length:9},(_,i)=><path key={i} d={`M -1.32 ${1.57-i*.27} h 1.15 M .17 ${1.57-i*.27} h 1.15`}/>)}
                  <path d="M -.75 1.4 V -1.2 H .75 V 1.4 m -.15 -.2 l .15 .2 .15 -.2" fill="none"/>
                  <text className="model-plan-label" textAnchor="middle" x="0" y="-.9">{level === 0 ? "UP" : "DOWN"}</text>
                </g>}
                {["toilet","vanity","washer","shower","car","wardrobe","fridge"].includes(f.kind) && <g pointerEvents="none">
                  {f.kind==="car" ? <><rect x={-f.w*.38} y={-f.d*.22} width={f.w*.76} height={f.d*.39} rx=".12" fill="#788e8d"/><path d={`M ${-f.w*.4} ${-f.d*.24} H ${f.w*.4} M ${-f.w*.4} ${f.d*.2} H ${f.w*.4}`} stroke="#e4e8dc" strokeWidth=".07"/></> : <text className="model-plan-label" textAnchor="middle" x="0" y=".055">{({toilet:"WC",vanity:"BASIN",washer:"WASH",shower:"SHOWER",wardrobe:"CLOSET",fridge:"FRIDGE"} as Record<string,string>)[f.kind]}</text>}
                </g>}
                {(f.kind === "sofa" ||
                  f.kind === "bed" || f.kind === "doubleBed" ||
                  f.kind === "chair" ||
                  f.kind === "dining") && (
                  <>
                    <path
                      d={`M ${-f.w / 2 + 0.07} ${-f.d / 2 + 0.2} H ${f.w / 2 - 0.07}`}
                      stroke="#f4ecdc"
                      strokeWidth=".045"
                    />
                    {f.kind === "bed" || f.kind === "doubleBed" ? (
                      <>
                        {Array.from({length:f.kind === "doubleBed" ? 2 : 1}, (_,i)=><rect key={i}
                          x={f.kind === "doubleBed" ? -f.w/2+.1+i*f.w/2 : -f.w*.35}
                          y={-f.d/2+.07} width={f.kind === "doubleBed" ? f.w/2-.16 : f.w*.7}
                          height=".32" rx=".05" fill="#efeadc"/>) }
                      </>
                    ) : (
                      <path
                        d={`M 0 ${-f.d / 2 + 0.2} V ${f.d / 2 - 0.07}`}
                        stroke="#6d7468"
                        strokeWidth=".018"
                      />
                    )}
                  </>
                )}
                {f.kind === "model" && <text className="model-plan-label" textAnchor="middle" dominantBaseline="middle" pointerEvents="none">{itemDefinition(plan, f).name.slice(0, 12)}</text>}
                {f.kind === "plant" && (
                  <path
                    d="M 0 .13 V -.14 M 0 0 L -.12 -.10 M 0 .06 L .12 -.05"
                    stroke="#e8eedb"
                    strokeWidth=".03"
                  />
                )}
                {f.kind === "kitchen" && (
                  <>
                    <rect
                      x={-f.w / 2 + 0.13}
                      y={-f.d / 2 + 0.1}
                      width=".50"
                      height=".40"
                      rx=".045"
                      fill="#dfe3dd"
                    />
                    {[0, 1, 2, 3].map((i) => (
                      <circle
                        key={i}
                        cx={f.w / 2 - 0.45 + (i % 2) * 0.18}
                        cy={-0.1 + Math.floor(i / 2) * 0.18}
                        r=".06"
                        fill="#555f58"
                      />
                    ))}
                  </>
                )}
              </g>
            ))}
          {walls.map((w) => {
            const path =
                w.axis === "h"
                  ? `M ${w.a} ${w.at} H ${w.b}`
                  : `M ${w.at} ${w.a} V ${w.b}`,
              o = w.opening;
            return (
              <g key={w.id} pointerEvents="none">
                <path d={path} stroke="#545e52" strokeWidth=".105" />
                {o && (
                  <g
                    transform={
                      w.axis === "h"
                        ? `translate(${o.center} ${w.at})`
                        : `translate(${w.at} ${o.center}) rotate(90)`
                    }
                  >
                    <path
                      d={`M ${-o.width / 2} 0 H ${o.width / 2}`}
                      stroke={o.type === "door" ? "#f1eee5" : "#89aaa9"}
                      strokeWidth=".115"
                    />
                    {o.type === "door" ? (
                      <path
                        d={`M ${-o.width / 2} 0 v ${o.width} M ${-o.width / 2} ${o.width} A ${o.width} ${o.width} 0 0 0 ${o.width / 2} 0`}
                        fill="none"
                        stroke="#919a88"
                        strokeWidth=".02"
                      />
                    ) : (
                      <path
                        d={`M ${-o.width / 2} 0 H ${o.width / 2}`}
                        stroke="#526e6e"
                        strokeWidth=".025"
                      />
                    )}
                  </g>
                )}
              </g>
            );
          })}
          {floorRooms.map((r) => (
            <g key={`label-${r.id}`} pointerEvents="none">
              <rect
                x={
                  r.x +
                  r.w / 2 -
                  Math.min(r.w - 0.3, r.name.length * 0.13 + 1) / 2
                }
                y={r.y + 0.1}
                width={Math.min(r.w - 0.3, r.name.length * 0.13 + 1)}
                height=".45"
                rx=".07"
                fill="#f6f1e5"
                fillOpacity=".92"
              />
              <text className="room-label" x={r.x + r.w / 2} y={r.y + 0.29}>
                {r.name}
              </text>
              <text className="area-label" x={r.x + r.w / 2} y={r.y + 0.48}>
                {(r.w * r.h).toFixed(1)} m²
              </text>
            </g>
          ))}
          {selected && (
            <g pointerEvents="none">
              <rect
                x={selected.x + 0.08}
                y={selected.y + 0.08}
                width={selected.w - 0.16}
                height={selected.h - 0.16}
                fill="none"
                stroke="#a04f36"
                strokeWidth=".022"
                strokeDasharray=".12 .08"
              />
              <path
                d={`M ${selected.x} ${selected.y - 0.36} H ${selected.x + selected.w} M ${selected.x} ${selected.y - 0.44} V ${selected.y - 0.28} M ${selected.x + selected.w} ${selected.y - 0.44} V ${selected.y - 0.28}`}
                stroke="#a04f36"
                strokeWidth=".018"
              />
              <text
                className="dimension"
                x={selected.x + selected.w / 2}
                y={selected.y - 0.48}
              >
                {selected.w.toFixed(1)} m
              </text>
              <text
                className="dimension"
                transform={`translate(${selected.x - 0.4} ${selected.y + selected.h / 2}) rotate(-90)`}
              >
                {selected.h.toFixed(1)} m
              </text>
            </g>
          )}
          {selected && tool === "select" && (
            <rect
              role="button"
              aria-label="Drag to resize selected room"
              x={selected.x + selected.w - 0.14}
              y={selected.y + selected.h - 0.14}
              width=".28"
              height=".28"
              rx=".04"
              fill="#a04f36"
              stroke="#faf8f0"
              strokeWidth=".04"
              className="resize-handle"
              onPointerDown={(e) => down(e, "size", selected.id)}
            />
          )}
          {draft && (
            <rect
              {...draft}
              width={draft.w}
              height={draft.h}
              fill="#a04f36"
              fillOpacity=".12"
              stroke="#a04f36"
              strokeWidth=".04"
              strokeDasharray=".1 .06"
            />
          )}
          <g
            transform={`translate(${extent.x} ${extent.y + extent.h + 0.65})`}
            pointerEvents="none"
          >
            <path
              d="M 0 0 H 2 M 0 -.05 V .05 M 1 -.05 V .05 M 2 -.05 V .05"
              stroke="#777e6f"
              strokeWidth=".025"
            />
            <text x="1" y=".26" className="scale-label">
              2 metres
            </text>
          </g>
        </svg>
        <div className="canvas-controls">
          <button aria-label="Zoom out floor plan" onClick={() => zoom(1.2)}>
            −
          </button>
          <button aria-label="Zoom in floor plan" onClick={() => zoom(0.8)}>
            +
          </button>
          <button onClick={() => setView(fit(floorPlan))}>Fit</button>
        </div>
        <span className="north" aria-hidden="true">
          ↑<small>N</small>
        </span>
      </div>
      <div className="view-footer">
        <span>
          {tool === "draw"
            ? "Keep the connecting doorway clear of furniture"
            : tool === "pan"
              ? "Drag to pan · scroll to zoom · Fit to show all rooms"
              : "Drag furniture · resize the corner · shift-drag a room"}
        </span>
        <span>Snap 10 cm</span>
      </div>
    </section>
  );
}

function RoomFloor({ room: r, onPointerDown }: { room: Room; onPointerDown: React.PointerEventHandler<SVGRectElement> }) {
  const [finish, setFinish] = useState({ current: r.floor, previous: r.floor });
  if (finish.current !== r.floor) setFinish({ current: r.floor, previous: finish.current });
  const fill = (f: Room["floor"]) => f === "oak" ? "url(#oak)" : FLOORS[f].color;
  return <>
    <rect key={`base:${r.floor}`} className={finish.previous !== r.floor ? "floor-underlay" : undefined} x={r.x} y={r.y} width={r.w} height={r.h} fill={fill(finish.previous)} fillOpacity={.63} onPointerDown={onPointerDown} />
    {finish.previous !== r.floor && <rect key={r.floor} className="floor-reveal" x={r.x} y={r.y} width={r.w} height={r.h} fill={fill(r.floor)} fillOpacity={.63} pointerEvents="none" />}
  </>;
}
