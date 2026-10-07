import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const geometry = mergeGeometries(parts)!;
  parts.forEach(part => part.dispose());
  return geometry;
}

export function createMochiAsset(): {
  makeMesh: () => THREE.Group;
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
} {
  const radius = .24;
  const body = new THREE.SphereGeometry(radius, 40, 28);
  const positions = body.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    positions.setY(i, y * (y < 0 ? .32 : .95));
  }
  body.computeVertexNormals();

  const top = (x: number, z: number) => .95 * Math.sqrt(radius * radius - x * x - z * z);
  const creases = mergeParts([-1, 0, 1].map(side => {
    const points = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      const x = side * .077 * (1 - .28 * t);
      const z = .048 + t * .094;
      return new THREE.Vector3(x, top(x, z) + .001, z);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 16, .0055, 6, false);
  }));

  // Curve the icon's little shine onto the dome instead of floating a flat decal.
  const shine = new THREE.CircleGeometry(1, 28);
  const shinePositions = shine.attributes.position;
  for (let i = 0; i < shinePositions.count; i++) {
    const x = -.125 + shinePositions.getX(i) * .019;
    const z = .131 - shinePositions.getY(i) * .038;
    shinePositions.setXYZ(i, x, top(x, z) + .002, z);
  }
  shine.computeVertexNormals();

  const bodyMaterial = new THREE.MeshPhysicalMaterial({ color: '#ffdae5', roughness: .72, metalness: 0, clearcoat: .08, clearcoatRoughness: .68 });
  const creaseMaterial = new THREE.MeshStandardMaterial({ color: '#bc8b9f', roughness: .94 });
  const shineMaterial = new THREE.MeshBasicMaterial({ color: '#fff8fa', transparent: true, opacity: .58, depthWrite: false });
  const geometries = [body, creases, shine];
  const materials = [bodyMaterial, creaseMaterial, shineMaterial];

  return {
    geometries, materials,
    makeMesh: () => {
      const root = new THREE.Group();
      root.name = 'pink mochi';
      geometries.forEach((geometry, i) => root.add(new THREE.Mesh(geometry, materials[i])));
      return root;
    },
  };
}

export function buildSlingshot(): {
  root: THREE.Group;
  pouch: THREE.Mesh;
  bands: [THREE.Mesh, THREE.Mesh];
  anchors: [THREE.Vector3, THREE.Vector3];
  rest: THREE.Vector3;
} {
  const root = new THREE.Group();
  root.name = 'meadow slingshot';
  const wood = new THREE.MeshStandardMaterial({ color: '#dfbc8e', roughness: .88 });
  const cotton = new THREE.MeshStandardMaterial({ color: '#a2b492', roughness: 1 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: '#78916f', roughness: .97 });
  const rubber = new THREE.MeshStandardMaterial({ color: '#cda6a1', roughness: .9 });
  const leather = new THREE.MeshStandardMaterial({ color: '#ba927c', roughness: .94 });
  const anchors: [THREE.Vector3, THREE.Vector3] = [new THREE.Vector3(-.30, .83, 0), new THREE.Vector3(.30, .83, 0)];
  const rest = new THREE.Vector3(0, .82, .14);

  const frameParts: THREE.BufferGeometry[] = [
    new THREE.CylinderGeometry(.071, .084, .39, 16).translate(0, .285, 0),
    new THREE.SphereGeometry(.084, 16, 12).translate(0, .09, 0),
    new THREE.SphereGeometry(.073, 16, 12).translate(0, .47, 0),
    new THREE.SphereGeometry(1, 20, 12).scale(.135, .055, .115).translate(0, .055, 0),
  ];
  const wrapParts: THREE.BufferGeometry[] = [new THREE.CylinderGeometry(.084, .089, .15, 16).translate(0, .25, 0)];
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, .41, 0),
      new THREE.Vector3(side * .11, .54, 0),
      new THREE.Vector3(side * .25, .69, 0),
      new THREE.Vector3(side * .30, .83, 0),
    ]);
    frameParts.push(new THREE.TubeGeometry(curve, 20, .066, 12, false));
    frameParts.push(new THREE.SphereGeometry(.073, 16, 12).translate(side * .30, .83, 0));
    wrapParts.push(new THREE.CylinderGeometry(.075, .075, .064, 16).rotateZ(-side * .15).translate(side * .295, .801, 0));
  }
  for (const y of [.184, .22, .256, .292]) {
    wrapParts.push(new THREE.TorusGeometry(.086, .0065, 6, 20).rotateX(Math.PI / 2).translate(0, y, 0));
  }
  root.add(new THREE.Mesh(mergeParts(frameParts), wood));
  root.add(new THREE.Mesh(mergeParts(wrapParts), cotton));

  const leaf = new THREE.SphereGeometry(.07, 16, 10).scale(.42, 1, .16).rotateZ(-.8).translate(.11, .325, .085);
  const stemStart = new THREE.Vector3(.058, .282, .078), stemEnd = new THREE.Vector3(.105, .329, .085);
  const stemDirection = stemEnd.clone().sub(stemStart);
  const stem = new THREE.CylinderGeometry(.005, .005, stemDirection.length(), 6);
  stem.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), stemDirection.normalize()));
  const stemCenter = stemStart.clone().add(stemEnd).multiplyScalar(.5);
  stem.translate(stemCenter.x, stemCenter.y, stemCenter.z);
  root.add(new THREE.Mesh(mergeParts([leaf, stem]), leafMaterial));

  const pouch = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12).scale(.13, .034, .085), leather);
  pouch.name = 'mochi pouch';
  pouch.position.copy(rest).y -= .09;
  root.add(pouch);
  const bandGeometry = new THREE.CylinderGeometry(.018, .018, 1, 8);
  const bands: [THREE.Mesh, THREE.Mesh] = [new THREE.Mesh(bandGeometry, rubber), new THREE.Mesh(bandGeometry, rubber)];
  bands.forEach((band, i) => {
    const direction = pouch.position.clone().sub(anchors[i]);
    band.position.copy(anchors[i]).add(pouch.position).multiplyScalar(.5);
    band.scale.y = direction.length();
    band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    root.add(band);
  });
  return { root, pouch, bands, anchors, rest };
}
