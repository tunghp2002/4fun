import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const html=await fs.readFile(new URL('index.html',import.meta.url),'utf8');
const names=['channel','halfWidth','terrain','bridgeTop','flyAt','flyGlow','flightEnvelope','overlaps'];
const source=names.map(name=>{const match=html.match(new RegExp('function '+name+'\\([^\\n]+'));assert.ok(match,`Actual HTML must contain ${name}`);return match[0];}).join('\n');
const context={Math,FORECOURT:1.53,THREE:{MathUtils:{clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,u)=>a+(b-a)*u}}};
vm.createContext(context);vm.runInContext(source,context);
assert.equal(context.bridgeTop(3.55),1.53);
assert.ok(Math.abs(context.bridgeTop(9.35)-context.terrain(0,9.35)-.055)<1e-9);
assert.ok(context.bridgeTop(6.45)>context.bridgeTop(3.55));
for(let x=-15;x<=15;x+=.1){assert.ok(context.halfWidth(x)>=1.3);assert.ok(context.channel(x)-context.halfWidth(x)>-15);assert.ok(context.channel(x)+context.halfWidth(x)<15);}
const fly={x:3,y:2.7,z:7,rx:.65,rz:.4,phase:1.2,speed:.31,blink:1.2},out=[],envelope=context.flightEnvelope(fly);
let minGlow=1,maxGlow=0;
for(let t=0;t<180;t+=.07){const p=context.flyAt(fly,t,out);assert.equal(p,out);assert.ok(p.every(Number.isFinite));assert.ok(p[0]>=envelope[0]&&p[0]<=envelope[1]);assert.ok(p[1]>=envelope[2]&&p[1]<=envelope[3]);assert.ok(p[2]>=envelope[4]&&p[2]<=envelope[5]);const glow=context.flyGlow(fly,t);minGlow=Math.min(minGlow,glow);maxGlow=Math.max(maxGlow,glow);assert.ok(glow>=.08&&glow<=1);const next=context.flyAt(fly,t+.001,[]);assert.ok(Math.hypot(...p.map((n,i)=>next[i]-n))<.002);}
assert.ok(minGlow<.09&&maxGlow>.99);
assert.equal(context.overlaps([0,1,0,1,0,1],[2,3,0,1,0,1]),false);
assert.equal(context.overlaps([0,1,0,1,0,1],[.5,2,.5,2,.5,2]),true);
console.log('PASS: actual HTML helpers preserve bank-to-bank access, bounded smooth flight, independent fades and obstacle separation.');
