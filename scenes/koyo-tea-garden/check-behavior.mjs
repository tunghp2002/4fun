import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const html=await fs.readFile(new URL('index.html',import.meta.url),'utf8');
const start=html.indexOf('const STEP=1/60,states='),end=html.indexOf('// Sparse floating leaves',start);
assert.ok(start>=0&&end>start);
const context={Math,Float64Array,Uint32Array,crypto:{getRandomValues:a=>(a[0]=12345,a)},WATER:.95,koi:Array.from({length:10},(_,i)=>({scale:.78+(i%4)*.045,phase:i*.61})),THREE:{MathUtils:{clamp:(x,a,b)=>Math.max(a,Math.min(b,x))}}};
vm.createContext(context);vm.runInContext(html.slice(start,end)+'\nglobalThis.behavior={states,resetFish,advance,swimmingPoint,fishBehaviors};',context);
const b=context.behavior;b.resetFish(12345);let minQ=1;
for(let t=0;t<180;t+=.25){b.advance(t);for(let i=0;i<10;i++)minQ=Math.min(minQ,b.swimmingPoint(b.states[i*6],b.states[i*6+1]));}
console.log('Closest normalized distance to pond center:',minQ);
assert.ok(minQ<.08,'Random destinations must let koi cross the center instead of staying on orbit lanes');
console.log('PASS: koi explore the center rather than following a fixed circular lane.');
const metrics={minSpacing:Infinity,maxQ:0,maxStep:0,minDepth:Infinity,maxDepth:-Infinity,positiveTurns:0,negativeTurns:0,modes:0};
for(const seed of [1,42,12345,987654,0xdecafbad]){b.resetFish(seed);let last=null;for(let t=0;t<180;t+=1/30){b.advance(t);const a=b.states;for(let i=0;i<10;i++){const k=i*6,scale=context.koi[i].scale;assert.ok(Array.from(a.slice(k,k+6)).every(Number.isFinite));metrics.maxQ=Math.max(metrics.maxQ,b.swimmingPoint(a[k],a[k+1]));metrics.minDepth=Math.min(metrics.minDepth,a[k+5]-.35*scale);metrics.maxDepth=Math.max(metrics.maxDepth,a[k+5]+.36*scale);if(last){metrics.maxStep=Math.max(metrics.maxStep,Math.hypot(a[k]-last[k],a[k+1]-last[k+1]));const turn=Math.atan2(Math.sin(a[k+4]-last[k+4]),Math.cos(a[k+4]-last[k+4]));if(turn>.002)metrics.positiveTurns++;if(turn<-.002)metrics.negativeTurns++;}for(let j=i+1;j<10;j++)metrics.minSpacing=Math.min(metrics.minSpacing,Math.hypot(a[k]-a[j*6],a[k+1]-a[j*6+1])/(scale+context.koi[j].scale));}last=Array.from(a);}for(const f of b.fishBehaviors)for(let j=0;j<5;j++)if(f.counts[j])metrics.modes|=1<<j;}
assert.ok(metrics.maxQ<.801&&metrics.minSpacing>1.24);
assert.ok(metrics.minDepth>.18&&metrics.maxDepth<.94);
assert.ok(metrics.maxStep<.07);
assert.ok(metrics.positiveTurns>100&&metrics.negativeTurns>100&&metrics.modes===31);
b.resetFish(12345);b.advance(37);const repeat=Array.from(b.states);b.advance(81);b.advance(37);assert.deepEqual(Array.from(b.states),repeat);
b.resetFish(54321);b.advance(37);assert.notDeepEqual(Array.from(b.states),repeat);
console.log('PASS: five behavior seeds stay separated, submerged and continuous, turn both ways, exercise all actions and replay only when the same seed is chosen.');
console.log(JSON.stringify(metrics,null,2));
