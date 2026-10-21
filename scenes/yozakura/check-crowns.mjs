import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(process.argv[2]||new URL('./index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const context=vm.createContext({console});vm.runInContext(scripts[0],context);
const code=scripts.at(-1),treesCode=code.slice(code.indexOf('function spray('),code.indexOf('const branchGeo='));
const generate=new Function('THREE',`let seed=21042026;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}const GROUND=.78,flowerRoots=[],trees=[],branchPositions=[],branchNormals=[],v=(x,y,z)=>new THREE.Vector3(x,y,z),branch=points=>new THREE.CatmullRomCurve3(points);${treesCode};return {flowerRoots,trees};`);
const {flowerRoots,trees}=generate(context.THREE);
assert.deepEqual(generate(context.THREE),{flowerRoots,trees},'Tree variation must be stable across reloads');
assert.equal(trees.length,8);assert.equal(flowerRoots.length,4096,'Keep the existing blossom instance budget');
const metrics=trees.map((t,i)=>{
 const points=flowerRoots.slice(i*512,(i+1)*512),cx=t.crownX,cz=t.crownZ,r=p=>Math.hypot(p.x-cx,p.z-cz)/t.spread;
 const central=points.filter(p=>r(p)<1.8*t.scale&&p.y>.78+4.8*t.scale*t.rise);
 const middleTop=Math.max(...points.filter(p=>r(p)<1.8*t.scale).map(p=>p.y));
 const outerTop=Math.max(...points.filter(p=>r(p)>2.8*t.scale).map(p=>p.y));
 const core=points.filter(p=>r(p)<.75*t.scale&&p.y>.78+4.8*t.scale*t.rise).length;
 const width=(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)))/t.scale,depth=(Math.max(...points.map(p=>p.z))-Math.min(...points.map(p=>p.z)))/t.scale;
 return {tree:i,central:central.length,core,middleTop,outerTop,width,depth};
});
console.log(JSON.stringify(metrics,null,2));
const meanWidth=metrics.reduce((sum,t)=>sum+t.width,0)/metrics.length;
assert.ok(meanWidth>=9.6,`Crowns should be broader than the previous 8.35-unit mean width, got ${meanWidth}`);
const ratios=metrics.map(t=>t.width/t.depth);
assert.ok(Math.max(...ratios)-Math.min(...ratios)>=.30,'Tree silhouettes need different proportions rather than one repeated outline');
for(const m of metrics){assert.ok(m.core>=12,`Tree ${m.tree} needs blossoms over the very centre, got ${m.core}`);assert.ok(m.central>=64,`Tree ${m.tree} needs flowering branches above the centre, got ${m.central}`);assert.ok(m.middleTop>=m.outerTop,`Tree ${m.tree} crown must rise over its spreading limbs`);}
console.log('PASS Every cherry crown has a flowering upper centre, with the same 20,480-blossom budget.');
