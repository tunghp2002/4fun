import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const html=await fs.readFile(new URL('index.html',import.meta.url),'utf8');
const profile=html.match(/const profile=(\[\[[^;]+);/);assert.ok(profile);
const fn=html.match(/function radiusAt\([^\n]+/);assert.ok(fn);
const context={Math};vm.createContext(context);vm.runInContext(`const profile=${profile[1]};${fn[0]}`,context);
let previous=null;
for(let u=0;u<=1.000001;u+=.0005){const r=context.radiusAt(Math.min(1,u));assert.ok(r.every(n=>Number.isFinite(n)&&n>.019&&n<.3));if(previous)assert.ok(Math.max(...r.map((n,i)=>Math.abs(n-previous[i])))<.003);previous=r;}
assert.ok(context.radiusAt(.25)[0]>context.radiusAt(.03)[0]*1.5);
assert.ok(context.radiusAt(.80)[0]<context.radiusAt(.25)[0]*.5);
assert.ok(context.radiusAt(1)[0]<.04);
console.log('PASS: the actual HTML koi profile has a smooth full shoulder, tapered tail root and finite positive cross sections.');
