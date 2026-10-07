type Point = [number, number, number];
const tetraVolume = (a: Point, b: Point, c: Point) => (
  a[0] * (b[1] * c[2] - b[2] * c[1]) + a[1] * (b[2] * c[0] - b[0] * c[2]) + a[2] * (b[0] * c[1] - b[1] * c[0])
) / 6;

/** Volume on the positive side of a blade plane through a closed triangle mesh. */
export function cutFraction(vertices: ArrayLike<number>, indices: ArrayLike<number>, normal: Point, constant: number): number {
  const distance = (p: Point) => p[0] * normal[0] + p[1] * normal[1] + p[2] * normal[2] - constant;
  const lengthSq = normal.reduce((sum, n) => sum + n * n, 0);
  if (lengthSq < 1e-12) return 0;
  const capCenter = normal.map(n => n * constant / lengthSq) as Point;
  let total = 0, clipped = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = [0, 1, 2].map(k => {
      const index = indices[i + k] * 3;
      return [vertices[index], vertices[index + 1], vertices[index + 2]] as Point;
    });
    total += tetraVolume(triangle[0], triangle[1], triangle[2]);
    const polygon: Point[] = [];
    for (let k = 0; k < 3; k++) {
      const a = triangle[k], b = triangle[(k + 1) % 3], da = distance(a), db = distance(b);
      if (da >= 0) polygon.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        polygon.push(a.map((value, axis) => value + (b[axis] - value) * t) as Point);
      }
    }
    for (let k = 1; k + 1 < polygon.length; k++) clipped += tetraVolume(polygon[0], polygon[k], polygon[k + 1]);
    // Each clipped edge supplies a cap triangle with the opposite winding.
    if (triangle.some(p => distance(p) < 0)) for (let k = 0; k < polygon.length; k++) {
      const a = polygon[k], b = polygon[(k + 1) % polygon.length];
      if (Math.abs(distance(a)) < 1e-6 && Math.abs(distance(b)) < 1e-6) clipped += tetraVolume(capCenter, b, a);
    }
  }
  return Math.max(0, Math.min(1, Math.abs(clipped) / Math.max(Math.abs(total), 1e-12)));
}
