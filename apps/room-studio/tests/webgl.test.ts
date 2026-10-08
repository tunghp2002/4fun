import test from "node:test";
import assert from "node:assert/strict";
import { webglSupport, is3DEnabled, remember3DEnabled } from "../lib/webgl.ts";

test("WebGL capability distinguishes unsupported and blocked graphics and releases successful probes",()=>{
  const previousWindow=Object.getOwnPropertyDescriptor(globalThis,"window"), previousDocument=Object.getOwnPropertyDescriptor(globalThis,"document");
  let mode="available", probes=0, releases=0;
  Object.defineProperty(globalThis,"window",{configurable:true,value:{}});
  Object.defineProperty(globalThis,"document",{configurable:true,value:{createElement:()=>({getContext:(type:string)=>{
    probes++;assert.equal(type,"webgl2");
    if(mode==="blocked")return null;
    if(mode==="throw")throw Error("Graphics blocked");
    return {isContextLost:()=>mode==="lost",getExtension:(name:string)=>{assert.equal(name,"WEBGL_lose_context");return{loseContext:()=>{releases++;}};}};
  }})}});
  try {
    assert.equal(webglSupport(),"unsupported");assert.equal(probes,0);
    Object.defineProperty(globalThis,"window",{configurable:true,value:{WebGL2RenderingContext:class{}}});
    assert.equal(webglSupport(),"available");assert.equal(releases,1);
    for(mode of ["blocked","throw","lost"])assert.equal(webglSupport(),"unavailable");
    mode="available";assert.equal(webglSupport(),"available");assert.equal(releases,2);
  }finally {
    if(previousWindow)Object.defineProperty(globalThis,"window",previousWindow);else Reflect.deleteProperty(globalThis,"window");
    if(previousDocument)Object.defineProperty(globalThis,"document",previousDocument);else Reflect.deleteProperty(globalThis,"document");
  }
});


test("successful 3D activation is remembered independently of plans and tolerates blocked storage",()=>{
  const previousWindow=Object.getOwnPropertyDescriptor(globalThis,"window");
  const values=new Map<string,string>([["room-studio:v1","saved floor plan"]]);
  Object.defineProperty(globalThis,"window",{configurable:true,value:{localStorage:{
    getItem:(key:string)=>values.get(key)??null,
    setItem:(key:string,value:string)=>values.set(key,value),
  }}});
  try {
    assert.equal(is3DEnabled(),false);
    remember3DEnabled();
    assert.equal(is3DEnabled(),true);
    assert.equal(values.get("room-studio:v1"),"saved floor plan");
    values.set("room-studio:3d:v1","invalid");assert.equal(is3DEnabled(),false);
    Object.defineProperty(globalThis,"window",{configurable:true,value:{get localStorage(){throw Error("Storage blocked");}}});
    assert.equal(is3DEnabled(),false);
    assert.doesNotThrow(()=>remember3DEnabled());
    Reflect.deleteProperty(globalThis,"window");
    assert.equal(is3DEnabled(),false);
    assert.doesNotThrow(()=>remember3DEnabled());
  }finally {
    if(previousWindow)Object.defineProperty(globalThis,"window",previousWindow);else Reflect.deleteProperty(globalThis,"window");
  }
});
