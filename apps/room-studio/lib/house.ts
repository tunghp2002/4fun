import { CATALOG, deriveWalls, outdoor, validatePlan, type BuiltinKind, type Item, type Opening, type Plan, type Room } from "./model";

export function housePlan(): Plan {
  const rooms: Room[] = [];
  const room = (id: string, name: string, x: number, y: number, w: number, h: number, level = 0, zone?: Room["zone"], floor: Room["floor"] = "stone", paint: Room["paint"] = "linen") =>
    rooms.push({id, name, x, y, w, h, floor, paint, level, ...(zone ? {zone} : {})});
  room("foyer", "Entrance gallery", 5.6, 8.1, 2.2, 4.8);
  room("living", "Living room", .6, 8.1, 5, 4.8);
  room("kitchen", "Kitchen & dining", .6, 1.8, 6.4, 4.5, 0, undefined, "terrazzo");
  room("stairs0", "Stair hall", 7, 1.8, 4.4, 4.5, 0, "stairs");
  room("hall0", "Ground corridor", .6, 6.3, 10.8, 1.8);
  room("wc0", "Guest bathroom", 7.8, 8.1, 3.6, 2.2, 0, undefined, "terrazzo");
  room("study", "Home office", 7.8, 10.3, 3.6, 2.6);
  room("bed2", "Bedroom 02 · 1 person", .6, 1.8, 3.2, 4.5, 1);
  room("bed3", "Bedroom 03 · 1 person", 3.8, 1.8, 3.2, 4.5, 1);
  room("stairs1", "Upper landing", 7, 1.8, 4.4, 4.5, 1, "stairs");
  room("hall1", "Upper corridor", .6, 6.3, 10.8, 1.8, 1);
  room("master", "Main bedroom · 2 people", .6, 8.1, 6.4, 4.8, 1);
  room("bath1", "Shared bathroom", 7, 8.1, 2.6, 2.7, 1, undefined, "terrazzo");
  room("laundry", "Upstairs laundry", 9.6, 8.1, 1.8, 2.7, 1, undefined, "terrazzo");
  room("ensuite", "Main ensuite bathroom", 7, 10.8, 4.4, 2.1, 1, undefined, "terrazzo");
  const openings: Opening[] = [];
  const opening = (axis: Opening["axis"], at: number, center: number, width = .9, type: Opening["type"] = "door", level = 0) => openings.push({axis, at, center, width, type, level});
  opening("h", 12.9, 6.7, 1.1);
  opening("v", 5.6, 10.7, 1.2);
  opening("h", 8.1, 6.7);
  opening("v", 7.8, 9.2);
  opening("v", 7.8, 11.6);
  opening("h", 6.3, 6);
  opening("h", 6.3, 9.2);
  opening("h", 1.8, 5.75, 1.3, "window");
  opening("v", .6, 4.7, 1.5, "window");
  opening("v", .6, 10.5, 2, "window");
  opening("h", 12.9, 4.25, 1.6, "window");
  opening("v", 11.4, 9.2, .8, "window");
  opening("v", 11.4, 11.6, 1.2, "window");
  opening("v", 11.4, 4, 1.8, "window");
  opening("h", 1.8, 9.3, 2, "window");
  for (const [at, center, width] of [[6.3,2.8,.9],[6.3,6,.9],[6.3,9.2,.9],[8.1,6.1,.9],[8.1,8.1,.9],[8.1,10.12,.8]]) opening("h", at, center, width, "door", 1);
  opening("v", 7, 11.6, .9, "door", 1);
  opening("h", 1.8, 2.8, 1, "window", 1);
  opening("v", .6, 4.3, 1.1, "window", 1);
  opening("h", 1.8, 6, 1, "window", 1);
  opening("h", 1.8, 9.3, 2, "window", 1);
  opening("v", 11.4, 4, 1.8, "window", 1);
  opening("h", 12.9, 4.9, 1.8, "window", 1);
  opening("v", .6, 10.2, 1.6, "window", 1);
  opening("v", 11.4, 9.6, .9, "window", 1);
  opening("h", 12.9, 10.4, 1, "window", 1);
  const items: Item[] = [];
  const item = (id: string, kind: BuiltinKind, roomId: string, x: number, y: number, rotation = 0, w = CATALOG[kind].w, d = CATALOG[kind].d) =>
    items.push({id, kind, roomId, x, y, w, d, rotation});
  item("stair-flight", "stairs", "stairs0", 8.65, 3.675);
  item("living-sofa", "sofa", "living", 2.4, 8.85);
  item("living-rug", "rug", "living", 2.75, 10.55);
  item("living-coffee", "coffee", "living", 2.55, 10.55);
  item("living-chair", "chair", "living", 4.45, 9.5, 90);
  item("living-console", "console", "living", 2.25, 12.58, 180);
  item("living-tv", "tv", "living", 2.25, 12.78, 180);
  item("living-ac", "ac", "living", 2.5, 8.305);
  item("living-lamp", "lamp", "living", 1, 9.75);
  item("living-plant", "plant", "living", 4.8, 12.3);
  item("entrance-storage", "storage", "foyer", 7.1, 10.2, 0, .65, .45);
  item("entrance-plant", "plant", "foyer", 7.55, 12.5, 0, .3, .3);
  item("kitchen-counter", "kitchen", "kitchen", 2.85, 2.24, 0, 3.6, .71);
  item("kitchen-hood", "hood", "kitchen", 3.3, 2.105);
  item("kitchen-fridge", "fridge", "kitchen", 6.56, 3.05, 90);
  item("dining-table", "table", "kitchen", 3.3, 4.8, 0, 1.8, .9);
  for (const [id,x,y,rotation] of [["n1",2.8,3.75,0],["n2",3.8,3.75,0],["s1",2.8,5.65,180],["s2",3.8,5.65,180],["w",1.55,4.8,270],["e",5.05,4.8,90]] as const)
    item("dining-"+id, "dining", "kitchen", x, y, rotation);
  item("kitchen-plant", "plant", "kitchen", 1.1, 2.95);
  item("guest-toilet", "toilet", "wc0", 10.75, 8.62);
  item("guest-basin", "vanity", "wc0", 9.4, 8.5);
  item("guest-mirror", "mirror", "wc0", 9.4, 8.22);
  item("study-desk", "desk", "study", 9.4, 12.45, 180, 1.6, .65);
  item("study-chair", "dining", "study", 9.4, 11.55);
  item("study-shelving", "bookcase", "study", 11.1, 11.9, 90, 1.3, .35);
  item("study-lamp", "lamp", "study", 8.3, 10.8);
  item("stair-plant", "plant", "stairs0", 10.95, 2.4);
  item("master-bed", "doubleBed", "master", 2.75, 11.58, 180, 1.8, 2.15);
  item("master-side1", "nightstand", "master", 1.45, 12.1);
  item("master-side2", "nightstand", "master", 4.05, 12.1);
  item("master-wardrobe", "wardrobe", "master", 6.6, 9.85, 90, 2, .6);
  item("master-wardrobe2", "wardrobe", "master", 4.6, 8.49, 0, 1.4, .6);
  item("master-desk", "desk", "master", 1.7, 8.52, 0, 1.7, .65);
  item("master-chair", "dining", "master", 1.3, 9.4, 180);
  item("master-chair2", "dining", "master", 2.3, 9.4, 180);
  item("master-ac", "ac", "master", 3.5, 8.305);
  item("master-lounge", "chair", "master", 4.8, 10.55, 180);
  item("bath-toilet", "toilet", "bath1", 9.12, 10.27, 180);
  item("bath-shower", "shower", "bath1", 7.6, 9.85, 180);
  item("bath-vanity", "vanity", "bath1", 9.21, 8.65, 90, .7, .62);
  item("bath-mirror", "mirror", "bath1", 9.48, 8.65, 90, .6, .08);
  item("ensuite-toilet", "toilet", "ensuite", 9.1, 11.31);
  item("ensuite-shower", "shower", "ensuite", 10.46, 12.27, 90);
  item("ensuite-vanity", "vanity", "ensuite", 8.2, 12.51, 180);
  item("ensuite-mirror", "mirror", "ensuite", 8.2, 12.78, 180);
  item("laundry-washer", "washer", "laundry", 10.99, 8.53);
  item("laundry-cabinet", "storage", "laundry", 10.5, 10.43, 180, 1.4, .5);
  item("upper-plant", "plant", "stairs1", 10.95, 2.4);
  for(const [id,offset] of [["bed2",0],["bed3",3.2]] as const) {
    item(id+"-bed", "bed", id, 1.45+offset, 3, 0, 1.1, 2.05);
    item(id+"-side", "nightstand", id, 2.3+offset, 2.35);
    item(id+"-wardrobe", "wardrobe", id, 3.42+offset, 4.2, 90, 1.6, .6);
    item(id+"-desk", "desk", id, 1.4+offset, 5.88, 180, 1.1, .62);
    item(id+"-chair", "dining", id, 1.4+offset, 5);
    item(id+"-ac", "ac", id, 1.4+offset, 2.005);
  }
  return {version: 1, rooms, items, openings, hour: 14};
}

export function interiorOnly(p: Plan): Plan {
  const rooms=p.rooms.filter(r=>!outdoor(r));
  if(rooms.length===p.rooms.length) return p;
  const ids=new Set(rooms.map(r=>r.id)), next={...p, rooms, items:p.items.filter(f=>ids.has(f.roomId))};
  delete next.paths;
  if(p.openings) next.openings=deriveWalls(next).flatMap(w=>w.opening?[{
    axis:w.axis, at:w.at, ...w.opening, level:w.level??0,
    type:w.opening.type==="door"&&(w.level??0)>0&&(!w.positive||!w.negative)?"window" as const:w.opening.type,
  }]:[]);
  return validatePlan(next);
}
