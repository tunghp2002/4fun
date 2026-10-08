"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import PlanEditor, { type Selection } from "./PlanEditor";
import {
  CATALOG,
  FLOORS,
  PAINTS,
  levelOf,
  outdoor,
  itemDefinition,
  moveItem,
  placeItem,
  resizeRoom,
  validatePlan,
  type Floor,
  type Paint,
  type BuiltinKind,
  type ModelAsset,
  type Plan,
} from "../lib/model";
const RoomView = dynamic(() => import("./RoomView"), {
  ssr: false,
  loading: () => (
    <div className="loading-view">
      <span className="loader" />
      Preparing your space…
    </div>
  ),
});
const ModelImport = dynamic(() => import("./ModelImport"));
import { housePlan, interiorOnly } from "../lib/house";
const KEY = "room-studio:v1";
export default function Studio() {
  const [plan, setPlan] = useState(housePlan),
    [selection, setSelection] = useState<Selection>({ room: "living" }),
    [message, setMessage] = useState("Your space, from every angle."),
    [tab, setTab] = useState<"plan" | "space">("plan"),
    [panel, setPanel] = useState<"room" | "furniture">("room"),
    [saved, setSaved] = useState("Loading…"),
    [historySize, setHistorySize] = useState([0, 0]),
    [category, setCategory] = useState("all");
  const current = useRef(plan),
    transaction = useRef<Plan | null>(null),
    undo = useRef<Plan[]>([]),
    redo = useRef<Plan[]>([]),
    file = useRef<HTMLInputElement>(null);
  const report = useCallback((m: string) => setMessage(m), []),
    select = useCallback((s: Selection) => setSelection(s), []);
  const preview = useCallback((p: Plan) => {
    current.current = p;
    setPlan(p);
  }, []);
  const persist = useCallback(
    (p: Plan) => {
      try {
        localStorage.setItem(KEY, JSON.stringify(p));
        setSaved("Saved on this device");
        return true;
      } catch {
        setSaved("Local save unavailable");
        report(
          "Storage is full or unavailable. Export your plan to keep a copy.",
        );
        return false;
      }
    },
    [report],
  );
  const record = useCallback(
    (before: Plan) => {
      if (JSON.stringify(before) === JSON.stringify(current.current))
        return true;
      undo.current.push(before);
      if (undo.current.length > 50) undo.current.shift();
      redo.current = [];
      setHistorySize([undo.current.length, 0]);
      return persist(current.current);
    },
    [persist],
  );
  const begin = useCallback(() => {
    transaction.current = current.current;
  }, []);
  const finish = useCallback(() => {
    if (transaction.current) record(transaction.current);
    transaction.current = null;
  }, [record]);
  const commit = useCallback(
    (next: Plan) => {
      try {
        const p = validatePlan(next),
          before = transaction.current ?? current.current;
        transaction.current = null;
        preview(p);
        const saved = record(before);
        if (saved) setMessage("Plan updated. Both views are in sync.");
        return saved;
      } catch (e) {
        report((e as Error).message);
        return false;
      }
    },
    [preview, record, report],
  );
  const change = useCallback(
    (fn: (p: Plan) => Plan) => {
      try {
        commit(fn(current.current));
      } catch (e) {
        report((e as Error).message);
      }
    },
    [commit, report],
  );
  const travel = useCallback(
    (back: boolean) => {
      const from = back ? undo.current : redo.current,
        to = back ? redo.current : undo.current;
      const p = from.pop();
      if (!p) return;
      to.push(current.current);
      preview(p);
      transaction.current = null;
      setHistorySize([undo.current.length, redo.current.length]);
      if (persist(p)) report(back ? "Last change undone." : "Change restored.");
    },
    [preview, persist, report],
  );
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const before = validatePlan(JSON.parse(raw)), p=interiorOnly(before);
        preview(p);
        if(p!==before) {record(before);report("Exterior removed. Undo restores the previous layout.");}
        setSelection({ room: p.rooms[0].id });
      }
      setSaved("Saved on this device");
    } catch {
      report(
        "Saved plan could not be loaded. The example is ready; import a backup if you have one.",
      );
      setSaved("Local save unavailable");
    }
  }, [preview, report, record]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        travel(!e.shiftKey);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        travel(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [travel]);
  const room = plan.rooms.find((r) => r.id === selection.room) ?? plan.rooms[0],
    item = plan.items.find((f) => f.id === selection.item);
  async function exportPlan() {
    try {
    const { exportBackup } = await import("../lib/assets");
    const packed = await exportBackup(current.current);
    const url = URL.createObjectURL(
        new Blob([packed], {
          type: "application/json",
        }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "room-studio-plan.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    report("Plan exported. Keep this file as a backup.");
    } catch (e) { report(`Export failed. ${(e as Error).message}`); }
  }
  async function importPlan(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      if (f.size > 34 * 1024 * 1024)
        throw Error("Choose a plan backup smaller than 34 MB.");
      const { importBackup } = await import("../lib/assets");
      const p = await importBackup(JSON.parse(await f.text()));
      const saved = commit(p);
      select({ room: p.rooms[0].id });
      if (saved) report("Plan imported.");
    } catch (e) {
      report(`Import failed. ${(e as Error).message}`);
    }
    e.target.value = "";
  }
  const hourLabel = `${Math.floor(plan.hour).toString().padStart(2, "0")}:${Math.round(
    (plan.hour % 1) * 60,
  )
    .toString()
    .padStart(2, "0")}`;
  return (
    <main className="studio">
      <header className="topbar">
        <a className="brand" href="./" aria-label="Room Studio home">
          <span className="brand-mark">⌑</span>Room<span>Studio</span>
          <small>PLAN IT. FEEL IT.</small>
        </a>
        <div className="project-name">
          <span className="status-dot" />Design a home, room by room
          <small>{saved}</small>
        </div>
        <div className="top-actions">
          <div className="history-controls">
            <button
              disabled={!historySize[0]}
              aria-label="Undo"
              title="Undo (Ctrl/⌘ Z)"
              onClick={() => travel(true)}
            >
              ↶
            </button>
            <button
              disabled={!historySize[1]}
              aria-label="Redo"
              title="Redo (Ctrl/⌘ Shift Z)"
              onClick={() => travel(false)}
            >
              ↷
            </button>
          </div>
          <button
            className="quiet-button"
            onClick={() => file.current?.click()}
          >
            Import
          </button>
          <button className="primary-button" onClick={exportPlan}>
            Export <span>↗</span>
          </button>
          <input
            hidden
            ref={file}
            type="file"
            accept=".json,application/json"
            onChange={importPlan}
          />
        </div>
      </header>
      <div className="mobile-tabs">
        <button aria-pressed={tab === "plan"} onClick={() => setTab("plan")}>
          Floor plan / 2D
        </button>
        <button aria-pressed={tab === "space"} onClick={() => setTab("space")}>
          Your space / 3D
        </button>
      </div>
      <div className="studio-body">
        <aside className="sidebar" aria-label="Room and furniture controls">
          <div className="sidebar-intro">
            <span className="eyebrow">THE EDITING DESK</span>
            <h1>
              Make room
              <br />
              for your ideas.
            </h1>
            <p>Modern Residence · 4 people, 3 bedrooms.<br />2 full baths, guest WC & upstairs laundry.</p>
            <button className="house-preset" onClick={() => {if(commit(housePlan())) select({room:"living"});}}>Load Modern Residence <span>↗</span></button>
          </div>
          <div className="floor-switch" role="group" aria-label="Choose floor">
            {[...new Set(plan.rooms.map(levelOf))].sort().map(level => <button key={level} aria-pressed={levelOf(room) === level} onClick={() => select({room: plan.rooms.find(r=>levelOf(r)===level && !outdoor(r))!.id})}>{level===0?"Ground":level===1?"Upper":`Floor ${level+1}`}</button>)}
          </div>
          <div className="sidebar-tabs">
            <button
              aria-pressed={panel === "room"}
              onClick={() => setPanel("room")}
            >
              Rooms <span>{plan.rooms.length.toString().padStart(2, "0")}</span>
            </button>
            <button
              aria-pressed={panel === "furniture"}
              onClick={() => setPanel("furniture")}
            >
              Furniture
            </button>
          </div>
          <div className="sidebar-content">
            {panel === "room" ? (
              <>
                <div className="room-list">
                  {plan.rooms.filter(r=>levelOf(r)===levelOf(room)).map((r, i) => (
                    <button
                      key={r.id}
                      aria-pressed={room.id === r.id}
                      onClick={() => select({ room: r.id })}
                    >
                      <span className="room-number">
                        {(i + 1).toString().padStart(2, "0")}
                      </span>
                      <span>
                        {r.name}
                        <small>{(r.w * r.h).toFixed(1)} m²</small>
                      </span>
                      <span>↗</span>
                    </button>
                  ))}
                </div>
                <div className="inspector" key={room.id}>
                  <div className="section-title">
                    <h3>Room details</h3>
                    <span>METRES</span>
                  </div>
                  <label className="field">
                    Room name
                    <NameInput
                      value={room.name}
                      onValue={(name) =>
                        change((p) => ({
                          ...p,
                          rooms: p.rooms.map((r) =>
                            r.id === room.id ? { ...r, name } : r,
                          ),
                        }))
                      }
                    />
                  </label>
                  <div className="field-pair">
                    <label className="field">
                      Width
                      <SizeInput
                        label="Room width"
                        value={room.w}
                        onValue={(v) =>
                          change((p) => resizeRoom(p, room.id, v, room.h))
                        }
                      />
                    </label>
                    <label className="field">
                      Depth
                      <SizeInput
                        label="Room depth"
                        value={room.h}
                        onValue={(v) =>
                          change((p) => resizeRoom(p, room.id, room.w, v))
                        }
                      />
                    </label>
                  </div>
                  <p className="field-note">
                    Shared edges, fixtures and stair shafts stay joined.
                  </p>
                  <div className="section-title">
                    <h3>Floor finish</h3>
                  </div>
                  <div className="swatches">
                    {Object.entries(FLOORS).filter(([key])=>outdoor(room)||!["grass","pavers"].includes(key)).map(([key, v]) => (
                      <button
                        key={key}
                        aria-label={v.name}
                        aria-pressed={room.floor === key}
                        title={v.name}
                        onClick={() =>
                          change((p) => ({
                            ...p,
                            rooms: p.rooms.map((r) =>
                              r.id === room.id
                                ? { ...r, floor: key as Floor }
                                : r,
                            ),
                          }))
                        }
                      >
                        <span
                          style={{ backgroundColor: v.color }}
                          className={`swatch ${key}`}
                        />
                        <small>{key}</small>
                      </button>
                    ))}
                  </div>
                  <div className="section-title">
                    <h3>Wall colour</h3>
                  </div>
                  <div className="paint-swatches">
                    {Object.entries(PAINTS).map(([key, v]) => (
                      <button
                        key={key}
                        aria-label={v.name}
                        aria-pressed={room.paint === key}
                        title={v.name}
                        style={{ backgroundColor: v.color }}
                        onClick={() =>
                          change((p) => ({
                            ...p,
                            rooms: p.rooms.map((r) =>
                              r.id === room.id
                                ? { ...r, paint: key as Paint }
                                : r,
                            ),
                          }))
                        }
                      />
                    ))}
                  </div>
                  <button
                    className="text-button danger"
                    disabled={plan.rooms.length === 1 || room.zone === "stairs"}
                    onClick={() => {
                      const next = {...plan, rooms: plan.rooms.filter(r=>r.id!==room.id), items: plan.items.filter(f=>f.roomId!==room.id)};
                      if(commit(next)) select({room:next.rooms[0].id});
                    }}
                  >
                    Remove room
                  </button>
                </div>
              </>
            ) : (
              <>
                <ModelImport add={async (asset: ModelAsset, data: ArrayBuffer) => {
                  const { saveModelFiles } = await import("../lib/assets");
                  await saveModelFiles([{ id: asset.id, data }]);
                  const base = current.current,
                    library = [...(base.assets ?? []).filter((a) => a.id !== asset.id), asset],
                    next = placeItem(validatePlan({ ...base, assets: library }), room.id, "model", asset.id);
                  commit(next);
                  select({ room: room.id, item: next.items.at(-1)!.id });
                }} />
                {!!plan.assets?.length && <div className="imported-library">
                  <div className="section-title"><h3>Your models</h3><span>{plan.assets.length} / 8</span></div>
                  {plan.assets.map((a) => <div className="imported-model-row" key={a.id}>
                    <button title={`Add ${a.name}`} onClick={() => {
                      try { const p = placeItem(current.current, room.id, "model", a.id); commit(p); select({ room: room.id, item: p.items.at(-1)!.id }); }
                      catch (e) { report((e as Error).message); }
                    }}><span>⌑ {a.name}</span><small>{a.w.toFixed(2)} × {a.d.toFixed(2)} × {a.h.toFixed(2)} m</small></button>
                    <button aria-label={`Remove ${a.name} from library`} title="Remove unused model" disabled={plan.items.some((f) => f.assetId === a.id)} onClick={() => change((p) => ({ ...p, assets: p.assets!.filter((m) => m.id !== a.id) }))}>×</button>
                  </div>)}
                </div>}
                <div className="section-title">
                  <h3>For {room.name}</h3>
                  <span>PLACE A PIECE</span>
                </div>
                <label className="field catalog-filter">Collection
                  <select value={category} onChange={e=>setCategory(e.target.value)}>
                    <option value="all">All pieces</option><option value="living">Living & bedrooms</option><option value="fixtures">Kitchen, bath & utility</option>
                  </select>
                </label>
                <div className="furniture-grid">
                  {Object.entries(CATALOG).filter(([key]) => !["stairs","car","carport","condenser","tree","hedge","bench"].includes(key) && (category === "all" || (category === "fixtures" ? ["kitchen","toilet","vanity","shower","mirror","fridge","washer","storage","hood","ac"] : category === "outdoor" ? ["car","carport","tree","hedge","bench","plant"] : ["sofa","chair","bed","doubleBed","table","coffee","desk","plant","rug","nightstand","dining","wardrobe","tv","console","bookcase","lamp"]).includes(key))).map(([key, v]) => (
                    <button
                      key={key}
                      title={`Add ${v.name}`}
                      onClick={() => {
                        try {
                          const p = placeItem(
                            current.current,
                            room.id,
                            key as BuiltinKind,
                          );
                          commit(p);
                          select({ room: room.id, item: p.items.at(-1)!.id });
                        } catch (e) {
                          report((e as Error).message);
                        }
                      }}
                    >
                      <FurnitureGlyph kind={key as BuiltinKind} />
                      <span>{v.name}</span>
                      <small>
                        {v.w.toFixed(2)} × {v.d.toFixed(2)} m
                      </small>
                    </button>
                  ))}
                </div>
                <p className="field-note">
                  Pieces land in free space. Drag in either view to arrange.
                </p>
              </>
            )}
            {item && item.kind !== "stairs" && (
              <div className="item-inspector">
                <div className="section-title">
                  <h3>{itemDefinition(plan, item).name}</h3>
                  <span>SELECTED</span>
                </div>
                <div className="field-pair">
                  <label className="field">
                    Width
                    <SizeInput
                      label="Furniture width"
                      value={item.w}
                      min={0.2}
                      max={item.kind === "model" ? 4 : 8}
                      onValue={(v) =>
                        change((p) => ({
                          ...p,
                          items: p.items.map((f) =>
                            f.id === item.id ? { ...f, w: v } : f,
                          ),
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    Depth
                    <SizeInput
                      label="Furniture depth"
                      value={item.d}
                      min={.05}
                      max={item.kind === "model" ? 4 : 8}
                      onValue={(v) =>
                        change((p) => ({
                          ...p,
                          items: p.items.map((f) =>
                            f.id === item.id ? { ...f, d: v } : f,
                          ),
                        }))
                      }
                    />
                  </label>
                </div>
                {item.kind === "model" && <label className="field">Height<SizeInput label="Furniture height" value={item.h!} min={.05} max={4} step={.01} onValue={(v) => change((p) => ({ ...p, items: p.items.map((f) => f.id === item.id ? { ...f, h: v } : f) }))} /></label>}
                <div className="item-actions">
                  <button
                    onClick={() =>
                      change((p) =>
                        moveItem(
                          p,
                          item.id,
                          item.x,
                          item.y,
                          (item.rotation + 90) % 360,
                        ),
                      )
                    }
                  >
                    ↻ Rotate 90°
                  </button>
                  <button
                    aria-label="Remove selected furniture"
                    onClick={() => {
                      change((p) => ({
                        ...p,
                        items: p.items.filter((f) => f.id !== item.id),
                      }));
                      select({ room: room.id });
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="light-control">
            <div className="section-title">
              <h3>Follow the light</h3>
              <output>{hourLabel}</output>
            </div>
            <input
              aria-label="Time of day"
              type="range"
              min="7"
              max="22"
              step=".25"
              value={plan.hour}
              onPointerDown={begin}
              onPointerUp={finish}
              onPointerCancel={finish}
              onChange={(e) => {
                const p = { ...current.current, hour: Number(e.target.value) };
                if (transaction.current) preview(p);
                else commit(p);
              }}
              onKeyUp={finish}
            />
            <div className="light-labels">
              <span>Morning</span>
              <span>Evening</span>
            </div>
          </div>
        </aside>
        <div className={`view-grid active-${tab}`}>
          <PlanEditor
            plan={plan}
            selection={{ ...selection, room: room.id }}
            select={select}
            begin={begin}
            preview={preview}
            finish={finish}
            commit={commit}
            report={report}
          />
          <RoomView
            plan={plan}
            selection={{ ...selection, room: room.id }}
            select={select}
            begin={begin}
            preview={preview}
            finish={finish}
            report={report}
          />
        </div>
      </div>
      <footer className="statusbar">
        <span className="status-message" role="status" aria-live="polite">
          <span className="status-dot" />
          {message}
        </span>
        <span>
          {plan.rooms.filter(r=>!outdoor(r)).length} indoor spaces ·{" "}
          {plan.rooms.filter(r=>!outdoor(r)).reduce((a, r) => a + r.w * r.h, 0).toFixed(1)} m²{" "}
          <span className="status-extra">· Connected views</span>
        </span>
      </footer>
    </main>
  );
}
function SizeInput({
  label,
  value,
  onValue,
  min = 1.8,
  max = 14,
  step = .1,
}: {
  label: string;
  value: number;
  onValue: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [text, setText] = useState(value.toFixed(step === .01 ? 2 : 1));
  useEffect(() => setText(value.toFixed(step === .01 ? 2 : 1)), [value, step]);
  function save() {
    const n = Number(text);
    onValue(n);
    setText(value.toFixed(step === .01 ? 2 : 1));
  }
  return (
    <input
      aria-label={label}
      type="number"
      min={min}
      max={max}
      step={step}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
function FurnitureGlyph({ kind }: { kind: BuiltinKind }) {
  if (CATALOG[kind].preview) return <img src={CATALOG[kind].preview} width="180" height="112" alt="" loading="lazy" className="furniture-glyph furniture-preview" />;
  return (
    <svg
      viewBox="0 0 90 56"
      aria-hidden="true"
      className={`furniture-glyph glyph-${kind}`}
    >
      <g fill={CATALOG[kind].color} stroke="#606f60" strokeWidth="1.2">
        {kind === "plant" ? (
          <>
            <path d="M 37 38 h 17 l -3 13 h -11 Z" fill="#b28f74" />
            <path d="M 45 40 V 12 M 45 30 Q 25 28 28 17 Q 44 14 45 30 M 45 23 Q 62 22 61 9 Q 44 7 45 23 M 45 37 Q 65 35 64 24 Q 45 22 45 37" />
          </>
        ) : kind === "rug" ? (
          <>
            <path d="M 18 15 h 54 v 30 H 18 Z" />
            <path d="M 24 21 h 42 v 18 H 24 Z" fill="none" />
          </>
        ) : kind === "bed" || kind === "doubleBed" ? (
          <>
            <rect x="24" y="7" width="42" height="45" rx="3" />
            <rect x="27" y="10" width="17" height="11" rx="3" fill="#efeade" />
            <rect x="47" y="10" width="16" height="11" rx="3" fill="#efeade" />
            <path d="M 24 27 H 66" />
          </>
        ) : kind === "sofa" || kind === "chair" || kind === "dining" ? (
          <>
            <rect
              x={kind === "sofa" ? 14 : 27}
              y="16"
              width={kind === "sofa" ? 62 : 36}
              height="28"
              rx="5"
            />
            <rect
              x={kind === "sofa" ? 20 : 32}
              y="10"
              width={kind === "sofa" ? 50 : 26}
              height="19"
              rx="4"
            />
            <path d="M 23 29 v 12 M 67 29 v 12 M 45 29 v 12" />
            <path d="M 22 45 v 5 M 68 45 v 5" />
          </>
        ) : (
          <>
            <rect
              x="19"
              y="16"
              width="52"
              height={kind === "kitchen" ? 29 : 13}
              rx="2"
            />
            <path d="M 24 30 v 18 M 66 30 v 18" />
            {kind === "kitchen" && (
              <>
                <path d="M 36 17 V 44 M 54 17 V 44" />
                <rect x="22" y="20" width="10" height="6" fill="#dadfd5" />
              </>
            )}
          </>
        )}
      </g>
    </svg>
  );
}

function NameInput({
  value,
  onValue,
}: {
  value: string;
  onValue: (s: string) => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <input
      aria-label="Room name"
      maxLength={40}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        onValue(text.trim());
        setText(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
