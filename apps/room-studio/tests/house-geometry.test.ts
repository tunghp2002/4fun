import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { houseAsset } from "../lib/house-assets.ts";
import { CATALOG, STOREY, type BuiltinKind } from "../lib/model.ts";

test("house fixtures are supported, bounded and merge mixed primitive geometry without losing triangles", () => {
  const shapes: Record<string,THREE.BufferGeometry> = {
    box:new THREE.BoxGeometry(1,1,1),round:new RoundedBoxGeometry(1,1,1,4,.08),ring:new THREE.TorusGeometry(.42,.08,8,32),
    ellipsoid:new THREE.SphereGeometry(.5,16,10),cylinder:new THREE.CylinderGeometry(1,1,1,16),pot:new THREE.CylinderGeometry(.85,.62,1,16),
    bowl:new THREE.LatheGeometry([new THREE.Vector2(.18,-.5),new THREE.Vector2(.22,-.4),new THREE.Vector2(.42,-.1),new THREE.Vector2(.5,.25),new THREE.Vector2(.5,.5),new THREE.Vector2(.42,.5),new THREE.Vector2(.37,.2),new THREE.Vector2(.2,-.18),new THREE.Vector2(0,-.2)],24),
  };
  for(const kind of ["stairs","toilet","vanity","shower","mirror","fridge","washer","wardrobe","storage","hood","ac","condenser","tv","console","bookcase","car","carport","tree","hedge","bench","lamp"] as BuiltinKind[]) {
    const root=new THREE.Group(),parts:THREE.BufferGeometry[]=[];
    houseAsset(kind,(w,h,d,x,y,z,_color,_finish,shape="round")=>{const mesh=new THREE.Mesh(shapes[shape]);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);root.add(mesh);return mesh;});
    root.updateMatrixWorld(true);
    for(const child of root.children) {const mesh=child as THREE.Mesh;parts.push((mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld));}
    const merged=mergeGeometries(parts);assert(merged,kind);
    assert.equal(merged.attributes.position.count,parts.reduce((n,g)=>n+g.attributes.position.count,0));
    merged.computeBoundingBox();
    const b=merged.boundingBox!,def=CATALOG[kind];
    assert(b.min.y>=-.006&&b.min.y<=.035,`${kind} floor contact: ${b.min.y}`);
    assert(b.min.x>=-def.w/2-.006&&b.max.x<=def.w/2+.006,`${kind} width: ${b.min.x}, ${b.max.x}`);
    assert(b.min.z>=-def.d/2-.006&&b.max.z<=def.d/2+.006,`${kind} depth: ${b.min.z}, ${b.max.z}`);
    if(kind==="stairs") {
      const treads=root.children.filter(o=>Math.abs((o as THREE.Mesh).scale.y-STOREY/18)<.00001);
      assert.equal(treads.length,18);
      const final=treads.at(-1)! as THREE.Mesh;
      assert(Math.abs(final.position.y+final.scale.y/2-STOREY)<.00001);
      assert(Math.abs(final.position.z+final.scale.z/2-def.d/2)<.00001,"top tread meets upper landing");
    }
    for(const g of parts)g.dispose();merged.dispose();
  }
  for(const g of Object.values(shapes))g.dispose();
});
