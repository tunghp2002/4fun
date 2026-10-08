export type Floor = "oak" | "stone" | "terrazzo" | "grass" | "pavers";
export type Paint = "linen" | "sage" | "sand";
export type BuiltinKind =
  | "sofa"
  | "chair"
  | "bed" | "doubleBed"
  | "table"
  | "coffee"
  | "desk"
  | "kitchen"
  | "plant"
  | "rug"
  | "nightstand"
  | "dining"
  | "stairs" | "toilet" | "vanity" | "shower" | "mirror" | "fridge" | "washer" | "wardrobe" | "storage"
  | "hood" | "ac" | "condenser" | "tv" | "console" | "bookcase" | "car" | "carport" | "tree" | "hedge" | "bench" | "lamp";
export type Kind = BuiltinKind | "model";
export type ModelAsset = { id: string; name: string; w: number; d: number; h: number; bytes: number; triangles: number };
export type Room = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  floor: Floor;
  paint: Paint;
  level?: number;
  zone?: "garden" | "driveway" | "terrace" | "stairs";
};
export type Item = {
  id: string;
  kind: Kind;
  roomId: string;
  x: number;
  y: number;
  w: number;
  d: number;
  rotation: number;
  assetId?: string;
  h?: number;
};
export type Opening = { axis: "h" | "v"; at: number; center: number; width: number; type: "door" | "window"; level?: number };
export type Plan = { version: 1; rooms: Room[]; items: Item[]; hour: number; assets?: ModelAsset[]; openings?: Opening[]; paths?: Rect[] };
export const STOREY = 3.2;
export const levelOf = (r: Room) => r.level ?? 0;
export const outdoor = (r: Room) => !!r.zone && r.zone !== "stairs";
export type Rect = { x: number; y: number; w: number; h: number };
export type Wall = {
  id: string;
  level?: number;
  axis: "h" | "v";
  at: number;
  a: number;
  b: number;
  positive?: string;
  negative?: string;
  opening?: { type: "door" | "window"; center: number; width: number };
};
export const FLOORS = {
  grass: { name: "Garden lawn", color: "#7e976b" },
  pavers: { name: "Concrete pavers", color: "#b5b8af" },
  oak: { name: "Natural oak", color: "#bd976f" },
  stone: { name: "Limestone", color: "#d5cbbb" },
  terrazzo: { name: "Terrazzo", color: "#dedad0" },
};
export const PAINTS = {
  linen: { name: "Warm linen", color: "#eeede8" },
  sage: { name: "Soft sage", color: "#aeb7a1" },
  sand: { name: "Clay beige", color: "#c5af9a" },
};
export const CATALOG: Record<
  BuiltinKind,
  { name: string; w: number; d: number; color: string; model?: string; preview?: string; h?: number; mount?: number; layer?: "wall" | "cover" }
> = {
  stairs: {name: "U-shaped staircase", w: 2.9, d: 3.45, color: "#e0dfd6"},
  toilet: {name: "Ceramic toilet", w: .45, d: .85, color: "#eeeee8", h: 0.77, model: "/models/furniture/modernToilet.glb", preview: "/models/furniture/modernToilet.png"},
  vanity: {name: "Basin vanity", w: 1.0, d: .62, color: "#e5e7df", h: 0.99, model: "/models/furniture/cabinetWithBasin.glb", preview: "/models/furniture/cabinetWithBasin.png"},
  shower: {name: "Glass shower", w: 1.0, d: 1.7, color: "#d5dedb", h: 2.13, model: "/models/furniture/shower-cabin-with-seat.glb", preview: "/models/furniture/shower-cabin-with-seat.png"},
  mirror: {name: "Bathroom mirror", w: .85, d: .08, color: "#dae4e1", mount: 1.2, layer: "wall", h: 0.8, model: "/models/furniture/rectangularMirror.glb", preview: "/models/furniture/rectangularMirror.png"},
  fridge: {name: "Brushed-metal refrigerator", w: .8, d: .72, color: "#a9afaf", h: 1.9, model: "/models/furniture/refridgerator.glb", preview: "/models/furniture/refridgerator.png"},
  washer: {name: "Front-load washer", w: .65, d: .65, color: "#e5e7e4", h: 0.85, model: "/models/furniture/clothes_washing_machine.glb", preview: "/models/furniture/clothes_washing_machine.png"},
  wardrobe: {name: "Modern white wardrobe", w: 1.8, d: .6, color: "#e1e3db", h: 2.1, model: "/models/furniture/wardrobe1.glb", preview: "/models/furniture/wardrobe1.png"},
  storage: {name: "Utility cabinet", w: .8, d: .5, color: "#d6dcd5", h: 1.2, model: "/models/furniture/wardrobe1.glb", preview: "/models/furniture/wardrobe1.png"},
  hood: {name: "Extractor hood", w: .8, d: .45, color: "#b6babb", mount: 1.65, layer: "wall", h: 0.6, model: "/models/furniture/hood.glb", preview: "/models/furniture/hood.png"},
  ac: {name: "Wall air conditioner", w: .9, d: .25, color: "#eeeeea", mount: 2.35, layer: "wall", h: 0.29, model: "/models/furniture/internal-unity-air-conditioning.glb", preview: "/models/furniture/internal-unity-air-conditioning.png"},
  condenser: {name: "Outdoor AC unit", w: .85, d: .4, color: "#d1d5cd"},
  tv: {name: "Wall television", w: 1.5, d: .08, color: "#242d32", mount: 1.0, layer: "wall", h: 0.85, model: "/models/furniture/wall-flat-tv.glb", preview: "/models/furniture/wall-flat-tv.png"},
  console: {name: "White media console", w: 1.8, d: .47, color: "#bfc6bd", h: 0.53, model: "/models/furniture/tvStand.glb", preview: "/models/furniture/tvStand.png"},
  bookcase: {name: "Open shelving", w: .8, d: .35, color: "#dce0d7", h: 1.8, model: "/models/furniture/kids_shelves.glb", preview: "/models/furniture/kids_shelves.png"},
  car: {name: "Electric hatchback", w: 1.85, d: 4.5, color: "#bdc8ce"},
  carport: {name: "Steel carport", w: 3.2, d: 5.4, color: "#717e7d", layer: "cover"},
  tree: {name: "Garden olive tree", w: 1.5, d: 1.5, color: "#778e67"},
  hedge: {name: "Dense garden border", w: 1.5, d: .65, color: "#698159"},
  bench: {name: "Outdoor metal bench", w: 1.6, d: .6, color: "#adb8b0"},
  lamp: {name: "Modern floor lamp", w: .55, d: .4, color: "#758482", h: 1.65, model: "/models/furniture/living_lamp.glb", preview: "/models/furniture/living_lamp.png"},
  dining: { name: "Leather dining chair", w: 0.46, d: 0.48, color: "#9a7661", h: .97, model: "/models/furniture/dining_chair_02.glb", preview: "/models/furniture/dining_chair_02.png" },
  sofa: { name: "Curved bouclé sofa", w: 2.35, d: 0.9, color: "#d8d3c6", h: .85, model: "/models/furniture/curved-boucle-sofa.glb", preview: "/models/furniture/curved-boucle-sofa.png" },
  chair: { name: "Leather lounge chair", w: 0.78, d: 0.78, color: "#57564f", h: .95, model: "/models/furniture/modern_arm_chair_01.glb", preview: "/models/furniture/modern_arm_chair_01.png" },
  bed: { name: "Upholstered bed", w: 1.65, d: 2.15, color: "#d9ded8" , h: 0.76, model: "/models/furniture/juniorBed.glb", preview: "/models/furniture/juniorBed.png"},
  doubleBed: {name: "Double upholstered bed", w: 1.8, d: 2.15, color: "#d9ded8", h: .76, model: "/models/furniture/modern-double-bed.glb", preview: "/models/furniture/modern-double-bed.png"},
  table: { name: "Stone dining table", w: 1.3, d: 0.85, color: "#d4d0c6" , h: 0.75, model: "/models/furniture/white_kitchen_table.glb", preview: "/models/furniture/white_kitchen_table.png"},
  coffee: { name: "Marble coffee table", w: 1.1, d: 0.6, color: "#d4d0cc", h: .42, model: "/models/furniture/coffee_table_round_01.glb", preview: "/models/furniture/coffee_table_round_01.png" },
  desk: { name: "White metal desk", w: 1.4, d: 0.65, color: "#e5e3dc" , h: 0.76, model: "/models/furniture/glass_table_office.glb", preview: "/models/furniture/glass_table_office.png"},
  kitchen: { name: "Fitted modern kitchen", w: 2.6, d: .71, color: "#d9dfd9" , h: 2.32, model: "/models/furniture/modern-kitchen.glb", preview: "/models/furniture/modern-kitchen.png"},
  plant: { name: "Ceramic succulent", w: 0.5, d: 0.5, color: "#6f8966", h: .75, model: "/models/furniture/potted_plant_04.glb", preview: "/models/furniture/potted_plant_04.png" },
  rug: { name: "Woven rug", w: 2.8, d: 2.0, color: "#bdc2b9" },
  nightstand: { name: "Marble side table", w: 0.45, d: 0.45, color: "#d4d0cc", h: .53, model: "/models/furniture/coffee_table_round_01.glb", preview: "/models/furniture/coffee_table_round_01.png" },
};
export function itemDefinition(p: Plan, f: Pick<Item, "kind" | "assetId">) {
  if (f.kind !== "model") return CATALOG[f.kind];
  const a = p.assets?.find((a) => a.id === f.assetId);
  if (!a) throw Error("This furniture needs its imported model.");
  return { ...a, color: "#8ba3a0" };
}
const EPS = 0.002;
const precise = (v: number) => Math.round(v * 1000) / 1000;
export const snap = (v: number) => Math.round(v * 10) / 10;
export function bounds(f: Item): Rect {
  const rotated = f.rotation % 180 !== 0;
  return {
    x: f.x - (rotated ? f.d : f.w) / 2,
    y: f.y - (rotated ? f.w : f.d) / 2,
    w: rotated ? f.d : f.w,
    h: rotated ? f.w : f.d,
  };
}
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w - EPS &&
  a.x + a.w > b.x + EPS &&
  a.y < b.y + b.h - EPS &&
  a.y + a.h > b.y + EPS;
const inside = (b: Rect, r: Rect) =>
  b.x >= r.x + 0.08 - EPS &&
  b.y >= r.y + 0.08 - EPS &&
  b.x + b.w <= r.x + r.w - 0.08 + EPS &&
  b.y + b.h <= r.y + r.h - 0.08 + EPS;
export function deriveWalls(p: Plan): Wall[] {
  const edges = new Map<
    string,
    {
      axis: "h" | "v";
      level: number;
      at: number;
      entries: {
        a: number;
        b: number;
        room: string;
        side: "positive" | "negative";
      }[];
    }
  >();
  for (const r of p.rooms.filter(r => !outdoor(r)))
    for (const [axis, at, a, b, side] of [
      ["h", r.y, r.x, r.x + r.w, "positive"],
      ["h", r.y + r.h, r.x, r.x + r.w, "negative"],
      ["v", r.x, r.y, r.y + r.h, "positive"],
      ["v", r.x + r.w, r.y, r.y + r.h, "negative"],
    ] as const) {
      const key = levelOf(r) + ":" + axis + Math.round(at * 1000);
      let edge = edges.get(key);
      if (!edge) {
        edge = { axis, at, level: levelOf(r), entries: [] };
        edges.set(key, edge);
      }
      edge.entries.push({ a, b, room: r.id, side });
    }
  const walls: Wall[] = [];
  for (const { axis, at, level, entries } of edges.values()) {
    const points = [...new Set(entries.flatMap((e) => [e.a, e.b]))].sort(
      (a, b) => a - b,
    );
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i],
        b = points[i + 1],
        mid = (a + b) / 2,
        owners = entries.filter((e) => mid > e.a - EPS && mid < e.b + EPS);
      if (!owners.length || b - a < EPS) continue;
      const wall: Wall = {
        id: `${level}:${axis}:${at.toFixed(3)}:${a.toFixed(3)}:${b.toFixed(3)}`,
        level,
        axis,
        at,
        a,
        b,
      };
      for (const e of owners) wall[e.side] = e.room;
      if (p.openings) {
        const openings = p.openings.filter(o => (o.level ?? 0) === level && o.axis === axis && Math.abs(o.at - at) < EPS && o.center - o.width / 2 >= a - EPS && o.center + o.width / 2 <= b + EPS).sort((a, b) => a.center - b.center);
        if (openings.length) {
          openings.forEach((opening, i) => {
            const start = i ? (openings[i - 1].center + openings[i - 1].width / 2 + opening.center - opening.width / 2) / 2 : a;
            const end = i < openings.length - 1 ? (opening.center + opening.width / 2 + openings[i + 1].center - openings[i + 1].width / 2) / 2 : b;
            walls.push({...wall, id: wall.id + ":" + i, a: start, b: end, opening});
          });
        } else walls.push(wall);
        continue;
      }
      if (wall.negative && wall.positive && b - a >= 1.15)
        wall.opening = {
          type: "door",
          center: a + Math.min((b - a) / 2, 2.7),
          width: 0.9,
        };
      else if (
        axis === "v" &&
        wall.positive === p.rooms[0]?.id &&
        Math.abs(at - p.rooms[0].x) < EPS &&
        b - a >= 1.15
      )
        wall.opening = {
          type: "door",
          center: a + Math.min((b - a) / 2, 2.7),
          width: 0.9,
        };
      else if (!wall.negative || !wall.positive) {
        if (b - a >= 2)
          wall.opening = {
            type: "window",
            center: mid,
            width: Math.min(1.6, b - a - 0.6),
          };
      }
      walls.push(wall);
    }
  }
  return walls;
}
export function doorZones(p: Plan, level = 0): Rect[] {
  return zones(deriveWalls(p).filter(w => (w.level ?? 0) === level));
}
function zones(walls: Wall[]): Rect[] {
  return walls
    .filter((w) => w.opening?.type === "door")
    .map((w) => {
      const o = w.opening!;
      return w.axis === "h"
        ? {
            x: o.center - o.width / 2 - 0.12,
            y: w.at - 0.7,
            w: o.width + 0.24,
            h: 1.4,
          }
        : {
            x: w.at - 0.7,
            y: o.center - o.width / 2 - 0.12,
            w: 1.4,
            h: o.width + 0.24,
          };
    });
}
const sameShaft = (a: Room, b: Room) => ["x", "y", "w", "h"].every(key => Math.abs(a[key as keyof Rect] - b[key as keyof Rect]) < EPS);
export function stairOpening(p: Plan, r: Room): Rect | undefined {
  const below = p.rooms.find(b => b.zone === "stairs" && levelOf(b) === levelOf(r) - 1 && sameShaft(r, b));
  const flight = p.items.find(f => f.kind === "stairs" && f.roomId === below?.id);
  return flight ? bounds(flight) : undefined;
}
const solid = (f: Item) => f.kind !== "rug" && (f.kind === "model" || !CATALOG[f.kind].layer);
function onWall(f: Item, r: Room) {
  const b = bounds(f), distances = [b.y - r.y, r.x + r.w - b.x - b.w, r.y + r.h - b.y - b.h, b.x - r.x];
  return !outdoor(r) && distances[f.rotation / 90] <= .15 + EPS;
}
const mounted = (f: Item) => f.kind !== "model" && CATALOG[f.kind].layer === "wall";
function wallAnchor(f: Item, r: Room) {
  return {...f, ...(f.rotation===0?{y:r.y+f.d/2+.08}:f.rotation===90?{x:r.x+r.w-f.d/2-.08}:f.rotation===180?{y:r.y+r.h-f.d/2-.08}:{x:r.x+f.d/2+.08})};
}
function wallBlocked(f: Item, r: Room, walls: Wall[], items: Item[]) {
  if(!mounted(f)) return false;
  const def=CATALOG[f.kind as BuiltinKind], horizontal=f.rotation%180===0, axis=horizontal?"h":"v",
    at=horizontal?f.rotation===0?r.y:r.y+r.h:f.rotation===90?r.x+r.w:r.x,
    surface={x:(horizontal?f.x:f.y)-f.w/2,y:def.mount!,w:f.w,h:def.h!};
  return walls.some(w=>w.axis===axis&&Math.abs(w.at-at)<EPS&&(w.level??0)===levelOf(r)&&w.opening&&overlaps(surface,{x:w.opening.center-w.opening.width/2,w:w.opening.width,y:w.opening.type==="window"?.83:0,h:w.opening.type==="window"?1.39:2.32})) ||
    items.some(other=>other.id!==f.id&&other.roomId===f.roomId&&mounted(other)&&overlaps(bounds(f),bounds(other))&&overlaps({x:0,y:def.mount!,w:1,h:def.h!},{x:0,y:CATALOG[other.kind as BuiltinKind].mount!,w:1,h:CATALOG[other.kind as BuiltinKind].h!}));
}
function checkLayout(p: Plan) {
  for (let i = 0; i < p.rooms.length; i++) {
    const r = p.rooms[i];
    if (r.w < 1.8 || r.h < 1.8 || r.w > 14 || r.h > 14)
      throw Error("Rooms need sides between 1.8 and 14 metres.");
    if (p.rooms.slice(i + 1).some((b) => levelOf(r) === levelOf(b) && overlaps(r, b)))
      throw Error("Rooms cannot overlap.");
  }
  const walls = deriveWalls(p),
    reachable = new Set([p.rooms[0].id]);
  const stairs = p.rooms.filter(r => r.zone === "stairs");
  for (const r of stairs) {
    if (!stairs.some(other => Math.abs(levelOf(r) - levelOf(other)) === 1 && sameShaft(r, other)))
      throw Error("Align the stair shaft on both floors.");
    const flight = p.items.find(f => f.kind === "stairs" && f.roomId === r.id);
    if (flight && (flight.rotation !== 0 || flight.w !== CATALOG.stairs.w || flight.d !== CATALOG.stairs.d || !stairs.some(other => levelOf(other) === levelOf(r) + 1 && sameShaft(r, other))))
      throw Error("Keep the staircase aligned with the next floor.");
    if (levelOf(r) > 0 && !stairOpening(p, r)) throw Error("The upper stair shaft needs a staircase below it.");
  }
  for (const id of reachable) {
    const r = p.rooms.find(r => r.id === id)!;
    if (r.zone === "stairs") for (const other of stairs)
      if (Math.abs(levelOf(r) - levelOf(other)) === 1 && sameShaft(r, other)) reachable.add(other.id);
    for (const w of walls) {
      if (w.opening?.type !== "door" || !w.positive || !w.negative) continue;
      if (w.positive === id) reachable.add(w.negative);
      if (w.negative === id) reachable.add(w.positive);
    }
  }
  if (p.rooms.some(r => !outdoor(r) && !reachable.has(r.id)))
    throw Error("Connect each room to a shared wall with space for a doorway.");
  if (p.openings && walls.filter(w => w.opening).length !== p.openings.length)
    throw Error("Keep every door and window on a wall, with enough room for its opening.");
  const doors = new Map([...new Set(p.rooms.map(levelOf))].map(level => [level, zones(walls.filter(w => (w.level ?? 0) === level))]));
  for (let i = 0; i < p.items.length; i++) {
    const f = p.items[i],
      r = p.rooms.find((r) => r.id === f.roomId),
      b = bounds(f);
    if (!r || !inside(b, r))
      throw Error(`${itemDefinition(p, f).name} does not fit inside its room.`);
    if (f.kind !== "model" && CATALOG[f.kind].layer === "wall" && !onWall(f, r))
      throw Error("Mount this piece against a wall.");
    if (!solid(f)) continue;
    if (doors.get(levelOf(r))!.some((d) => overlaps(b, d)) || levelOf(r) === 0 && p.paths?.some(path => overlaps(b, path)))
      throw Error(
        `${itemDefinition(p, f).name} (${f.id}): leave the doorway or entrance path clear.`,
      );
    if (
      p.items
        .slice(i + 1)
        .some((other) => solid(other) && levelOf(p.rooms.find(r => r.id === other.roomId)!) === levelOf(r) && overlaps(b, bounds(other)))
    )
      throw Error(`${itemDefinition(p, f).name}: furniture cannot overlap.`);
  }
}
export function validatePlan(value: unknown): Plan {
  if (!value || typeof value !== "object")
    throw Error("Choose a Room Studio plan file.");
  const p = value as Plan;
  if (
    p.version !== 1 ||
    !Array.isArray(p.rooms) ||
    !Array.isArray(p.items) ||
    p.rooms.length < 1 ||
    p.rooms.length > 24 ||
    p.items.length > 160
  )
    throw Error("This plan needs 1–24 rooms and up to 160 furniture pieces.");
  const num = (v: unknown, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const assetIds = new Set<string>();
  if (p.assets !== undefined && (!Array.isArray(p.assets) || p.assets.length > 8))
    throw Error("Keep up to 8 imported models in one plan.");
  for (const a of p.assets ?? []) {
    if (!a || typeof a.id !== "string" || !/^[a-f0-9]{64}$/.test(a.id) || assetIds.has(a.id) ||
      typeof a.name !== "string" || !a.name.trim() || a.name.length > 40 ||
      !num(a.w, .2, 4) || !num(a.d, .2, 4) || !num(a.h, .05, 4) ||
      !num(a.bytes, 20, 8 * 1024 * 1024) || !Number.isInteger(a.bytes) ||
      !num(a.triangles, 1, 60000) || !Number.isInteger(a.triangles))
      throw Error("The plan contains an invalid imported model.");
    assetIds.add(a.id);
  }
  if ((p.assets ?? []).reduce((n, a) => n + a.bytes, 0) > 24 * 1024 * 1024)
    throw Error("Imported models in one plan must fit within 24 MB.");
  const ids = new Set<string>();
  for (const r of p.rooms) {
    if (
      !r ||
      typeof r.id !== "string" ||
      !r.id ||
      r.id.length > 80 ||
      ids.has(r.id) ||
      typeof r.name !== "string" ||
      !r.name.trim() ||
      r.name.length > 40 ||
      !num(r.x, -40, 60) ||
      !num(r.y, -40, 60) ||
      !num(r.w, 1.8, 14) ||
      !num(r.h, 1.8, 14) ||
      typeof r.floor !== "string" ||
      typeof r.paint !== "string" ||
      !Object.hasOwn(FLOORS, r.floor) ||
      !Object.hasOwn(PAINTS, r.paint) ||
      (r.level !== undefined && (!num(r.level, 0, 3) || !Number.isInteger(r.level))) ||
      (r.zone !== undefined && !["garden", "driveway", "terrace", "stairs"].includes(r.zone))
    )
      throw Error("The plan contains an invalid room.");
    ids.add(r.id);
  }
  const items = new Set<string>();
  for (const f of p.items) {
    if (
      !f ||
      typeof f.id !== "string" ||
      !f.id ||
      f.id.length > 80 ||
      items.has(f.id) ||
      !ids.has(f.roomId) ||
      typeof f.kind !== "string" ||
      (f.kind === "model"
        ? typeof f.assetId !== "string" || !assetIds.has(f.assetId) || !num(f.h, .05, 4)
        : !Object.hasOwn(CATALOG, f.kind)) ||
      !num(f.x, -40, 80) ||
      !num(f.y, -40, 80) ||
      !num(f.w, 0.2, f.kind === "model" ? 4 : 8) ||
      !num(f.d, f.kind !== "model" && CATALOG[f.kind]?.layer === "wall" ? .05 : .2, f.kind === "model" ? 4 : 8) ||
      ![0, 90, 180, 270].includes(f.rotation)
    )
      throw Error("The plan contains invalid furniture.");
    items.add(f.id);
  }
  const modelTriangles = p.items.reduce((n, f) => n + (f.kind === "model" ? p.assets!.find((a) => a.id === f.assetId)!.triangles : 0), 0);
  if (modelTriangles > 300000) throw Error("This plan has too much imported geometry. Remove some model instances.");
  if (!num(p.hour, 7, 22))
    throw Error("Choose a daylight time between 07:00 and 22:00.");
  if (p.openings !== undefined && (!Array.isArray(p.openings) || p.openings.length > 120 || p.openings.some(o => !o || !["h", "v"].includes(o.axis) || !["door", "window"].includes(o.type) || !num(o.at, -40, 80) || !num(o.center, -40, 80) || !num(o.width, .6, 4) || !num(o.level ?? 0, 0, 3) || !Number.isInteger(o.level ?? 0))))
    throw Error("The plan contains invalid door or window openings.");
  if (p.paths !== undefined && (!Array.isArray(p.paths) || p.paths.length > 12 || p.paths.some(r => !r || !num(r.x, -40, 80) || !num(r.y, -40, 80) || !num(r.w, .8, 20) || !num(r.h, .8, 20))))
    throw Error("The plan contains an invalid access path.");
  if (p.openings?.some((o, i) => p.openings!.slice(i + 1).some(other => (other.level ?? 0) === (o.level ?? 0) && other.axis === o.axis && Math.abs(other.at - o.at) < EPS && Math.abs(other.center - o.center) < (other.width + o.width) / 2 + .1 - EPS)))
    throw Error("Leave a wall pier between door and window openings.");
  checkLayout(p);
  return {
    version: 1,
    rooms: p.rooms.map(({ id, name, x, y, w, h, floor, paint, level, zone }) => ({
      id,
      name,
      x,
      y,
      w,
      h,
      floor,
      paint,
      ...(level !== undefined ? {level} : {}),
      ...(zone ? {zone} : {}),
    })),
    items: p.items.map(({ id, kind, roomId, x, y, w, d, rotation, assetId, h }) => ({
      id,
      kind,
      roomId,
      x,
      y,
      w,
      d,
      rotation,
      ...(kind === "model" ? { assetId, h } : {}),
    })),
    hour: p.hour,
    ...(p.openings ? {openings: p.openings.map(({axis, at, center, width, type, level}) => ({axis, at, center, width, type, ...(level !== undefined ? {level} : {})}))} : {}),
    ...(p.paths ? {paths: p.paths.map(({x,y,w,h}) => ({x,y,w,h}))} : {}),
    ...(p.assets ? { assets: p.assets.map(({ id, name, w, d, h, bytes, triangles }) => ({ id, name, w, d, h, bytes, triangles })) } : {}),
  };
}
export function initialPlan(): Plan {
  const rooms: Room[] = [
    {
      id: "living",
      name: "Living room",
      x: 0,
      y: 0,
      w: 5.4,
      h: 4.2,
      floor: "oak",
      paint: "linen",
    },
    {
      id: "bedroom",
      name: "Bedroom",
      x: 5.4,
      y: 0,
      w: 3.6,
      h: 4.2,
      floor: "oak",
      paint: "sage",
    },
    {
      id: "kitchen",
      name: "Kitchen & dining",
      x: 0,
      y: 4.2,
      w: 5.4,
      h: 3,
      floor: "terrazzo",
      paint: "linen",
    },
    {
      id: "study",
      name: "Studio",
      x: 5.4,
      y: 4.2,
      w: 3.6,
      h: 3,
      floor: "stone",
      paint: "sand",
    },
  ];
  const item = (
    id: string,
    kind: BuiltinKind,
    roomId: string,
    x: number,
    y: number,
    rotation = 0,
  ): Item => ({
    id,
    kind,
    roomId,
    x,
    y,
    w: CATALOG[kind].w,
    d: CATALOG[kind].d,
    rotation,
  });
  return {
    version: 1,
    rooms,
    items: [
      item("sofa", "sofa", "living", 1.65, 0.85),
      item("rug", "rug", "living", 2.5, 2.65),
      item("coffee", "coffee", "living", 2.2, 2.55),
      item("chair", "chair", "living", 4.3, 2.6, 90),
      item("green", "plant", "living", 0.55, 3.65),
      item("bed", "bed", "bedroom", 7.3, 1.5),
      item("side", "nightstand", "bedroom", 8.65, 0.85),
      item("counter", "kitchen", "kitchen", 1.8, 6.75, 180),
      item("table", "table", "kitchen", 3.75, 5.7),
      item("dining-north", "dining", "kitchen", 3.75, 4.85),
      item("dining-south", "dining", "kitchen", 3.75, 6.55, 180),
      item("kitchen-green", "plant", "kitchen", 0.55, 4.95),
      item("desk", "desk", "study", 7, 6.7, 180),
      item("study-chair", "dining", "study", 7, 5.9),
    ],
    hour: 16,
  };
}
export function resizeRoom(p: Plan, id: string, w: number, h: number): Plan {
  const room = p.rooms.find((r) => r.id === id)!;
  if (!room || !Number.isFinite(w) || !Number.isFinite(h))
    throw Error("Enter a valid room size.");
  const edgeX = room.x + room.w,
    edgeY = room.y + room.h,
    dx = snap(w) - room.w,
    dy = snap(h) - room.h;
  const rooms = p.rooms.map((r) => {
    const x = r.x >= edgeX - EPS ? r.x + dx : r.x,
      y = r.y >= edgeY - EPS ? r.y + dy : r.y,
      right = r.x + r.w >= edgeX - EPS ? r.x + r.w + dx : r.x + r.w,
      bottom = r.y + r.h >= edgeY - EPS ? r.y + r.h + dy : r.y + r.h;
    return {
      ...r,
      x: precise(x),
      y: precise(y),
      w: precise(right - x),
      h: precise(bottom - y),
    };
  });
  const next = {
    ...p,
    rooms,
    ...(p.openings ? {openings: p.openings.map(o => ({...o,
      at: precise(o.at + (o.axis === "v" ? o.at >= edgeX - EPS ? dx : 0 : o.at >= edgeY - EPS ? dy : 0)),
      center: precise(o.center + (o.axis === "h" ? o.center >= edgeX - EPS ? dx : 0 : o.center >= edgeY - EPS ? dy : 0)),
    }))} : {}),
    ...(p.paths ? {paths: p.paths.map(r => ({...r, x: precise(r.x + (r.x >= edgeX - EPS ? dx : 0)), y: precise(r.y + (r.y >= edgeY - EPS ? dy : 0))}))} : {}),
    items: p.items.map((f) => {
      const old = p.rooms.find((r) => r.id === f.roomId)!,
        r = rooms.find((r) => r.id === f.roomId)!;
      return {
        ...f,
        x: precise(f.x + (onWall(f, old) && f.rotation === 90 ? r.x + r.w - old.x - old.w : r.x - old.x)),
        y: precise(f.y + (onWall(f, old) && f.rotation === 180 ? r.y + r.h - old.y - old.h : r.y - old.y)),
      };
    }),
  };
  return validatePlan(next);
}
export function moveRoom(p: Plan, id: string, x: number, y: number): Plan {
  const r = p.rooms.find((r) => r.id === id)!,
    dx = snap(x) - r.x,
    dy = snap(y) - r.y;
  return validatePlan({
    ...p,
    rooms: p.rooms.map((r) =>
      r.id === id ? { ...r, x: r.x + dx, y: r.y + dy } : r,
    ),
    items: p.items.map((f) =>
      f.roomId === id ? { ...f, x: f.x + dx, y: f.y + dy } : f,
    ),
  });
}
export function addRoom(p: Plan, r: Rect, level = 0): Plan {
  const id = crypto.randomUUID();
  const next: Plan = {
    ...p,
    rooms: [
      ...p.rooms,
      {
        ...r,
        id,
        ...(level ? {level} : {}),
        name: `Room ${p.rooms.length + 1}`,
        floor: "oak",
        paint: "linen",
      },
    ],
  };
  if (p.openings) {
    const shared = deriveWalls({...next, openings: undefined}).find(w => (w.positive === id || w.negative === id) && w.positive && w.negative && w.opening?.type === "door");
    if (shared) for (let center = shared.a + .65; center <= shared.b - .65; center += .2) {
      next.openings = [...p.openings, {axis: shared.axis, at: shared.at, type: "door", width: .9, center: precise(center), level}];
      try { return validatePlan(next); } catch { /* Keep existing windows and doorway approaches clear. */ }
    }
  }
  return validatePlan(next);
}
export function moveItem(
  p: Plan,
  id: string,
  x: number,
  y: number,
  rotation?: number,
): Plan {
  const f = p.items.find((f) => f.id === id)!,
    next = { ...f, x: snap(x), y: snap(y), rotation: rotation ?? f.rotation };
  if (f.kind === "stairs") throw Error("The staircase is structural. Resize the connected rooms to change the house footprint.");
  const origin = p.rooms.find(r => r.id === f.roomId)!;
  const r = p.rooms.find((r) => levelOf(r) === levelOf(origin) && inside(bounds(mounted(next)&&onWall(next,r)?wallAnchor(next,r):next), r));
  if (!r) throw Error("Keep furniture inside a room.");
  if(mounted(next)&&onWall(next,r)) Object.assign(next,wallAnchor(next,r));
  if(wallBlocked(next,r,deriveWalls(p),p.items)) throw Error("Leave wall openings and other fixtures clear; these pieces cannot overlap.");
  return validatePlan({
    ...p,
    items: p.items.map((f) => (f.id === id ? { ...next, roomId: r.id } : f)),
  });
}
export function placeItem(p: Plan, roomId: string, kind: Kind, assetId?: string): Plan {
  const r = p.rooms.find((r) => r.id === roomId)!;
  if (!r) throw Error("Choose a room first.");
  const def = itemDefinition(p, { kind, assetId }),
    f: Item = {
      id: crypto.randomUUID(),
      kind,
      roomId,
      x: 0,
      y: 0,
      w: def.w,
      d: def.d,
      rotation: 0,
      ...(kind === "model" ? { assetId, h: p.assets!.find((a) => a.id === assetId)!.h } : {}),
    };
  if (kind === "stairs") throw Error("Use the house preset for a staircase with a matching upper-floor opening.");
  const mounted = kind !== "model" && CATALOG[kind].layer === "wall",
    walls = deriveWalls(p),
    doors = doorZones(p, levelOf(r)),
    occupied = p.items.filter(f => solid(f) && levelOf(p.rooms.find(room=>room.id===f.roomId)!) === levelOf(r)).map(bounds);
  // ponytail: bounded placement search; use a spatial index only when measured larger plans need it.
  for (const rotation of mounted ? [0,90,180,270] : [0]) {
    f.rotation = rotation;
    const bw = rotation % 180 ? def.d : def.w, bd = rotation % 180 ? def.w : def.d;
    for (let y = r.y + bd / 2 + .1; y <= r.y + r.h - bd / 2 - .08; y += .25)
      for (let x = r.x + bw / 2 + .1; x <= r.x + r.w - bw / 2 - .08; x += .25) {
        f.x = snap(x); f.y = snap(y);
        if(mounted) Object.assign(f,wallAnchor(f,r));
        const b=bounds(f);
        if(wallBlocked(f,r,walls,p.items)) continue;
        if(!inside(b,r) || mounted && !onWall(f,r) || solid(f) && (doors.some(d=>overlaps(b,d)) || occupied.some(o=>overlaps(b,o)) || levelOf(r) === 0 && p.paths?.some(path=>overlaps(b,path)))) continue;
        return validatePlan({...p, items: [...p.items, {...f}]});
      }
  }
  throw Error("This room needs more space for that piece.");
}

export function planExtent(p: Plan): Rect {
  const x = Math.min(...p.rooms.map((r) => r.x)),
    y = Math.min(...p.rooms.map((r) => r.y));
  return {
    x,
    y,
    w: Math.max(...p.rooms.map((r) => r.x + r.w)) - x,
    h: Math.max(...p.rooms.map((r) => r.y + r.h)) - y,
  };
}
