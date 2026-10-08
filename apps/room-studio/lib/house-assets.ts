import * as THREE from "three";
import { CATALOG, STOREY, type BuiltinKind } from "./model";
type Part = (w: number, h: number, d: number, x: number, y: number, z: number, color?: string, finish?: string, shape?: string) => THREE.Mesh;

export function houseAsset(kind: BuiltinKind, p: Part) {
  const {w, d, color} = CATALOG[kind], steel = "#687779", white = "#eceee8", dark = "#263337";
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, c = color, finish = "lacquer") => p(w,h,d,x,y,z,c,finish,"box");
  const beam = (a: number[], b: number[], width = .035, c = steel) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const mesh = box(width, delta.length(), width, ...start.clone().add(end).multiplyScalar(.5).toArray(), c, "metal");
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), delta.normalize());
  };
  const feet = (height: number, inset = .06) => {
    for (const x of [-w/2+inset,w/2-inset]) for (const z of [-d/2+inset,d/2-inset]) box(.045,height,.045,x,height/2,z,steel,"metal");
  };
  const handle = (x: number, y: number, z: number, length = .2) => box(length,.016,.025,x,y,z,steel,"metal");
  if (kind === "stairs") {
    const rise = STOREY / 18, tread = .27, start = 1.725, landing = -1.2;
    for (let i=0;i<9;i++) {
      const z = start - (i+.5)*tread, h = (i+1)*rise;
      box(1.15,rise,tread,-.75,h-rise/2,z,white);
      box(1.15,.008,.025,-.75,h+.004,z+tread/2-.015,steel,"metal");
      const zr = - .705 + (i+.5)*tread, hr = STOREY/2+(i+1)*rise;
      box(1.15,rise,tread,.75,hr-rise/2,zr,white);
      box(1.15,.008,.025,.75,hr+.004,zr+tread/2-.015,steel,"metal");
      if (i%2===0) {
        beam([-1.28,h,z],[-1.28,h+.94,z]);
        beam([1.28,hr,zr],[1.28,hr+.94,zr]);
      }
    }
    box(2.65,.14,1.05,0,STOREY/2-.07,landing,white);
    for (const x of [-1.25,1.25]) {
      box(.1,STOREY/2-.14,.1,x,(STOREY/2-.14)/2,-1.55,steel,"metal");
      beam([x,STOREY/2,-1.55],[x,STOREY/2+.96,-1.55]);
    }
    beam([-1.28,rise+.94,1.59],[-1.28,1.6+.94,-.57]);
    beam([1.28,1.6+rise+.94,-.57],[1.28,STOREY+.94,1.59]);
    beam([-1.28,2.56,-1.55],[1.28,2.56,-1.55]);
    for (const x of [-1.24,-.26]) beam([x,.073,1.67],[x,1.48,-.7],.12);
    for (const x of [.26,1.24]) beam([x,1.48,-.7],[x,3.08,1.68],.12);
  } else if (kind === "toilet") {
    p(.25,.3,.44,0,.15,.05,white,"lacquer");
    p(.36,.26,.52,0,.34,.08,white,"lacquer","bowl");
    p(.38,.5,.07,0,.46,.08,dark,"plain","ring").rotation.x = -Math.PI/2;
    p(.37,.49,.16,0,.465,.08,white,"lacquer","ring").rotation.x = -Math.PI/2;
    p(.34,.4,.14,0,.54,-.26,white,"lacquer");
    box(.34,.025,.14,0,.752,-.26,white);
    box(.05,.006,.04,.06,.768,-.26,steel,"metal");
    for (const x of [-.1,.1]) box(.035,.025,.04,x,.47,-.13,steel,"metal");
  } else if (kind === "vanity") {
    feet(.1);
    box(w,.67,d-.03,0,.435,0);
    for (const x of [-w/4,w/4]) {box(w/2-.012,.64,.025,x,.435,d/2-.025);handle(x,.64,d/2-.009,.22);}
    box(w,.055,.1,0,.7975,-d/2+.05,white,"stone");
    box(w,.055,.07,0,.7975,d/2-.035,white,"stone");
    for(const x of [-w/2+.14,w/2-.14]) box(.28,.055,d-.17,x,.7975,.015,white,"stone");
    box(.44,.025,.3,0,.69,.015,white);
    for(const x of [-.225,.225]) box(.025,.12,.32,x,.75,.015,white);
    for(const z of [-.15,.17]) box(.45,.12,.025,0,.75,z,white);
    p(.015,.18,.015,0,.91,-d/2+.075,steel,"metal","cylinder");
    box(.015,.018,.11,0,1.0,-d/2+.12,steel,"metal");
    p(.025,.003,.025,0,.706,.015,steel,"metal","cylinder");
  } else if (kind === "shower") {
    p(w,.075,d,0,.0375,0,white,"stone");
    box(w-.07,.008,d-.07,0,.08,0,"#c7d1cf");
    for(const x of [-w/2+.02,w/2-.02]) box(.03,2.0,.03,x,1.08,-d/2+.02,steel,"metal");
    box(w-.05,1.95,.012,0,1.075,-d/2+.025,"#d2e5e1","glass");
    box(.012,1.95,d-.06,-w/2+.025,1.075,0,"#d2e5e1","glass");
    box(w/2-.03,1.95,.012,w/4,1.075,d/2-.025,"#d2e5e1","glass");
    handle(.08,1.05,d/2-.025,.1);
    box(.022,1.15,.022,.22,1.43,-d/2+.09,steel,"metal");
    box(.022,.022,.25,.22,2.0,-d/2+.2,steel,"metal");
    p(.12,.012,.12,.22,1.97,-d/2+.31,steel,"metal","cylinder");
    handle(.22,1.08,-d/2+.1,.16);
    box(.06,.008,.06,0,.09,0,steel,"metal");
  } else if (kind === "mirror" || kind === "tv") {
    const height = kind === "mirror" ? .8 : .85;
    p(w,height,d,0,height/2,0,steel,"metal");
    box(w-.04,height-.04,.008,0,height/2,d/2-.004,kind === "mirror" ? "#c6d9d7" : "#36484f",kind === "mirror" ? "mirror" : "plain");
    if(kind === "tv") box(.025,.005,.004,0,.015,d/2,"#a8c5ba");
  } else if (kind === "washer") {
    feet(.045);
    p(w,.81,d-.025,0,.45,-.008,color,"lacquer");
    box(w-.045,.105,.012,0,.78,d/2-.022);
    box(.23,.055,.006,-.16,.785,d/2-.014,white);
    box(.14,.045,.006,.11,.785,d/2-.014,dark);
    p(.045,.045,.014,.24,.785,d/2-.006,steel,"metal","ring");
    p(.48,.48,.035,0,.405,d/2-.024,steel,"metal","ring");
    p(.375,.375,.018,0,.405,d/2-.03,dark,"plain","ellipsoid");
    p(.325,.325,.012,0,.405,d/2-.016,"#718586","glass","ellipsoid");
    box(.04,.09,.018,.19,.405,d/2-.012,steel,"metal");
    box(.08,.023,.009,-.23,.12,d/2-.017,steel);
  } else if (kind === "fridge") {
    feet(.06);p(w,1.88,d-.025,0,1.0,-.012,color,"metal");
    for(const x of [-w/4,w/4]) {
      p(w/2-.012,1.2,.028,x,1.33,d/2-.018,color,"metal");
      box(.018,.5,.02,x>0?.035:-.035,1.28,d/2-.007,steel,"metal");
    }
    for(const y of [.23,.54]) {p(w-.025,.29,.025,0,y,d/2-.018,color,"metal");handle(0,y+.09,d/2-.014,.45);}
    box(.07,.16,.008,-.22,1.45,d/2-.004,dark);
    for(let i=0;i<7;i++) box(w-.09,.009,.014,0,.08+i*.013,d/2-.022,steel);
  } else if (kind === "wardrobe" || kind === "storage" || kind === "bookcase") {
    const height = kind === "wardrobe" ? 2.35 : kind === "storage" ? 1.95 : 1.65;
    box(w,.08,d,0,.04,0,steel);
    box(w,height-.08,.025,0,height/2+.04,-d/2+.013);
    for(const x of [-w/2+.015,w/2-.015]) box(.03,height-.08,d,x,height/2+.04,0);
    box(w,.035,d,0,height-.0175,0);
    const sections = kind === "wardrobe" ? 3 : 2;
    for(let i=1;i<sections;i++) box(.025,height-.08,d,-w/2+i*w/sections,height/2+.04,0);
    for(let i=0;i<sections;i++) {
      const x = -w/2+(i+.5)*w/sections;
      for(const y of kind === "wardrobe" && i<2 ? [.24,1.98] : [.3,.7,1.1,1.5]) {
        box(w/sections-.03,.025,d-.025,x,y,0);
        if(kind !== "wardrobe") for(let j=0;j<3;j++) box(.06,.18,.14,x+(j-1)*.075,y+.102,-.02,["#8b9c98","#c6b69d","#899caf"][j]);
      }
      if(kind === "wardrobe" && i<2) {
        beam([x-w/sections*.4,1.86,0],[x+w/sections*.4,1.86,0],.025);
        for(let j=0;j<4;j++) {
          const xx = x+(j-1.5)*.095;
          beam([xx-.12,1.7,0],[xx,1.8,0],.01);beam([xx,1.8,0],[xx+.12,1.7,0],.01);
          p(.075,.55,.28,xx,1.4,0,["#879d9e","#c4bbaf","#65777e","#dcdbd3"][j],"fabric");
        }
        box(w/sections-.045,height-.13,.012,x,height/2+.04,d/2-.011,"#c8dbd5","glass");
        box(.012,height-.12,.02,x+w/sections/2-.025,height/2+.04,d/2-.008,steel,"metal");
      }
      if(kind === "storage" || kind === "wardrobe" && i===2) {
        box(w/sections-.012,height-.15,.025,x,height/2+.04,d/2-.018);
        box(.015,.3,.012,x+w/sections*.28,1.0,d/2-.008,steel,"metal");
      }
    }
  } else if (kind === "ac") {
    p(w,.29,d,0,.145,0,white,"lacquer");
    box(w-.08,.075,.014,0,.045,d/2-.014,dark);
    for(let i=0;i<3;i++) box(w-.09,.009,.027,0,.028+i*.02,d/2-.02,color);
    box(.025,.012,.008,w/2-.08,.17,d/2-.007,"#93b5a4");
  } else if (kind === "hood") {
    p(w,.08,d,0,.04,0,color,"metal");
    box(.26,.6,.22,0,.38,-d/2+.11,color,"metal");
    box(w-.06,.012,d-.05,0,.004,0,steel,"metal");
    for(const x of [-.27,.27]) box(.065,.006,.035,x,.001,.08,white);
  } else if (kind === "condenser") {
    for(const x of [-w/2+.1,w/2-.1]) box(.1,.1,d-.08,x,.05,0,"#818b83");
    p(w,.54,d-.015,0,.38,-.005,color,"metal");
    p(.45,.45,.018,-.12,.38,d/2-.018,steel,"metal","ring");
    p(.36,.36,.008,-.12,.38,d/2-.025,dark,"plain","ellipsoid");
    for(let i=0;i<5;i++) box(.31,.014,.01,-.12,.26+i*.06,d/2-.012,color,"metal");
    for(let i=0;i<10;i++) box(.14,.012,.008,.28,.15+i*.044,d/2-.011,steel);
  } else if (kind === "console") {
    feet(.12); p(w,.4,d,0,.32,0,color,"lacquer");
    for(let i=0;i<3;i++) {const x=(i-1)*w/3;box(w/3-.015,.37,.02,x,.32,d/2-.014);handle(x,.43,d/2-.014,.2);}
  } else if (kind === "lamp") {
    p(w/2,.025,d/2,0,.0125,0,steel,"metal","cylinder");
    p(.012,1.5,.012,0,.76,0,steel,"metal","cylinder");
    p(.13,.24,.13,0,1.48,0,"#e7ded0","fabric","pot");
  } else if (kind === "bench") {
    feet(.43,.1);
    for(let i=0;i<5;i++) box(w,.04,.08,0,.45,-d/2+.08+i*.105,color,"metal");
    for(const x of [-w/2+.07,w/2-.07]) box(.035,.38,.035,x,.65,-d/2+.06,steel,"metal");
    for(let i=0;i<3;i++) box(w,.07,.025,0,.59+i*.09,-d/2+.065,color,"metal");
  } else if (kind === "carport") {
    for(const x of [-w/2+.08,w/2-.08]) for(const z of [-d/2+.09,d/2-.09]) {
      box(.13,.05,.13,x,.025,z,steel,"metal");box(.075,2.6,.075,x,1.3,z,steel,"metal");
    }
    for(const x of [-w/2+.08,w/2-.08]) box(.075,.1,d-.1,x,2.57,0,steel,"metal");
    box(w,.08,d,0,2.66,0,"#c0cbc8","metal");
    for(let i=0;i<22;i++) box(w-.1,.01,.014,0,2.705,-d/2+.12+i*(d-.24)/21,steel,"metal");
  } else if (kind === "car") {
    p(w-.12,.39,d-.11,0,.48,0,color,"metal");
    p(w-.07,.16,1.05,0,.72,-1.67,color,"metal");
    p(w-.14,.1,1.5,0,.72,1.43,color,"metal");
    box(w-.23,.18,2.0,0,.84,.08,color,"metal");
    p(w-.36,.1,1.83,0,1.39,.11,color,"metal");
    for(const x of [-w/2+.06,w/2-.06]) for(const z of [-1.42,1.4]) {
      const tyre = p(.58,.58,.14,x,.29,z,dark,"plain","ring");tyre.rotation.y=Math.PI/2;
      const rim=p(.39,.39,.016,x+Math.sign(x)*.064,.29,z,"#b5c3c3","metal","ring");rim.rotation.y=Math.PI/2;
    }
    for(const x of [-.36,.36]) for(const z of [-.45,.65]) {
      p(.47,.15,.46,x,.8,z,"#46565a","fabric");p(.47,.55,.1,x,1.08,z+.19,"#46565a","fabric");
      p(.22,.15,.1,x,1.31,z+.19,"#46565a","fabric");
    }
    for(const x of [-.73,.73]) {
      beam([x,.81,-.94],[x,1.38,-.69],.035);
      beam([x,.81,1.1],[x,1.38,.88],.035);
      beam([x,.88,.08],[x,1.38,.08],.035);
      box(.012,.43,1.6,x,1.14,.09,"#b0cdcf","glass");
      for(const z of [-.35,.56]) box(.09,.012,.014,x,.93,z,steel,"metal");
    }
    const front = box(1.42,.52,.016,0,1.12,-.83,"#b0cdcf","glass");front.rotation.x=-.42;
    const rear = box(1.42,.49,.016,0,1.12,.99,"#b0cdcf","glass");rear.rotation.x=.4;
    box(1.35,.1,.28,0,.96,-.8,dark);
    const wheel = p(.23,.23,.018,-.37,1.05,-.59,steel,"metal","ring");wheel.rotation.x=-.35;
    box(.3,.16,.012,.17,1.01,-.65,dark);
    for(const x of [-.59,.59]) {p(.36,.07,.018,x,.65,-d/2+.048,white);p(.36,.065,.018,x,.65,d/2-.048,"#b78170");}
    box(1.1,.06,.012,0,.46,-d/2+.04,dark);box(.31,.085,.015,0,.55,d/2-.044,white);
    for(const z of [-d/2+.1,d/2-.1]) box(w-.13,.035,.04,0,.38,z,steel,"metal");
  } else if (kind === "tree" || kind === "hedge") {
    const tree = kind === "tree";
    if(tree) {
      p(.06,1.8,.06,0,.9,0,"#8d8f77","plain","cylinder");
      for(let i=0;i<5;i++) {const a=i*2.399;beam([0,.8+i*.16,0],[Math.cos(a)*.4,1.6+i*.08,Math.sin(a)*.4],.028,"#8d8f77");}
    } else box(w,.14,d,0,.07,0,"#9da490");
    for(let i=0;i<(tree?34:40);i++) {
      const a=i*2.399, r=(.2+(i%7)/10)*(tree?.51:.5), x=Math.cos(a)*r*w*.65, z=Math.sin(a)*r*d*.65;
      const y=tree?1.6+(i%5)*.14:.24+(i%4)*.11;
      const leaf=p(tree?.42:.31,tree?.45:.32,tree?.38:.25,x,y,z,["#748a63","#8a9e77","#5e7c59","#9baa80"][i%4],"plain","ellipsoid");
      leaf.rotation.y=a;
    }
  }
}
