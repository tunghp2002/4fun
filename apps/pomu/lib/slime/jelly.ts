export type SurfaceBinding = { indices: Uint32Array; weights: Float32Array };

/** Exact damped spring: the body lags behind the grabbed skin, then catches up. */
export function followSpring(position: number, velocity: number, target: number, dt: number): [number, number] {
  const damping = 5, stiffness = 75, frequency = Math.sqrt(stiffness - damping * damping);
  const decay = Math.exp(-damping * dt), sin = Math.sin(frequency * dt), cos = Math.cos(frequency * dt);
  const offset = position - target;
  return [target + decay * (offset * cos + (velocity + damping * offset) / frequency * sin),
    decay * (velocity * cos - (damping * velocity + stiffness * offset) / frequency * sin)];
}

/** Connected skin springs with a supported grab patch and inertial, free-moving skin. */
export class JellySurface {
  readonly rest: Float32Array;
  readonly position: Float32Array;
  readonly velocity: Float32Array;
  readonly weight: Float32Array;
  readonly anchor = new Float64Array(3);
  readonly normal = new Float64Array(3);
  active = false;
  energy = 0;
  private readonly sources: Uint32Array;
  private readonly nodes: Uint32Array;
  private readonly neighborStart: Uint32Array;
  private readonly neighbors: Uint32Array;
  private readonly acceleration: Float32Array;
  private readonly round: Float32Array;
  private readonly pose: Float32Array;
  private readonly target: Float32Array;
  private roundness = 0;
  private readonly lastFloor = new Float64Array([NaN, NaN, NaN, NaN]);
  private time = 0;

  constructor(vertices: Float32Array, triangles?: ArrayLike<number>, round?: Float32Array) {
    this.rest = vertices.slice(); this.position = vertices;
    this.velocity = new Float32Array(vertices.length);
    this.weight = new Float32Array(vertices.length / 3);
    this.round = round ?? this.rest; this.pose = this.rest.slice(); this.target = this.rest.slice();
    // Sphere UV seams and poles share one simulated point; render UVs stay intact.
    const welded = new Map<string, number>(), nodes: number[] = [];
    this.sources = new Uint32Array(this.weight.length);
    for (let i = 0; i < vertices.length; i += 3) {
      const key = `${Math.round(vertices[i] * 100000)},${Math.round(vertices[i + 1] * 100000)},${Math.round(vertices[i + 2] * 100000)}`;
      let node = welded.get(key);
      if (node === undefined) { node = nodes.length; welded.set(key, node); nodes.push(i); }
      this.sources[i / 3] = node;
    }
    this.nodes = Uint32Array.from(nodes);
    const adjacency = nodes.map(() => new Set<number>());
    if (triangles) for (let i = 0; i < triangles.length; i += 3) {
      const a = this.sources[triangles[i]], b = this.sources[triangles[i + 1]], c = this.sources[triangles[i + 2]];
      for (const [from, to] of [[a, b], [b, c], [c, a]]) if (from !== to) { adjacency[from].add(to); adjacency[to].add(from); }
    }
    this.neighborStart = new Uint32Array(nodes.length + 1);
    const neighbors: number[] = [];
    adjacency.forEach((list, node) => { this.neighborStart[node] = neighbors.length; for (const neighbor of list) neighbors.push(nodes[neighbor]); });
    this.neighborStart[nodes.length] = neighbors.length;
    this.neighbors = Uint32Array.from(neighbors);
    this.acceleration = new Float32Array(vertices.length);
  }

  /** Change the spring rest pose; the render skin catches up instead of snapping. */
  reshape(roundness: number) {
    const blend = Math.max(0, Math.min(1, roundness));
    if (Math.abs(blend - this.roundness) < .00001) return;
    this.roundness = blend;
    for (let i = 0; i < this.pose.length; i++) this.pose[i] = this.rest[i] + (this.round[i] - this.rest[i]) * blend;
    this.energy = Math.max(this.energy, .01);
  }

  /** Lowest point of the spring pose along a contact normal, including the asymmetric belly. */
  minProjection(nx: number, ny: number, nz: number): number {
    let lowest = Infinity;
    for (const i of this.nodes) lowest = Math.min(lowest, nx * this.pose[i] + ny * this.pose[i + 1] + nz * this.pose[i + 2]);
    return lowest;
  }

  grab(x: number, y: number, z: number, nx: number, ny: number, nz: number) {
    // Use the nearest rest vertex so grabbing an already wobbling surface stays stable.
    let nearest = 0, distance = Infinity;
    for (let i = 0; i < this.position.length; i += 3) {
      const d = (x - this.position[i]) ** 2 + (y - this.position[i + 1]) ** 2 + (z - this.position[i + 2]) ** 2;
      if (d < distance) { distance = d; nearest = i; }
    }
    this.anchor.set([this.rest[nearest] + x - this.position[nearest], this.rest[nearest + 1] + y - this.position[nearest + 1], this.rest[nearest + 2] + z - this.position[nearest + 2]]);
    const normalLength = Math.hypot(nx, ny, nz) || 1;
    this.normal.set([nx / normalLength, ny / normalLength, nz / normalLength]); this.active = true; this.energy = .01;
    for (let i = 0; i < this.rest.length; i += 3) {
      const d = (this.rest[i] - this.anchor[0]) ** 2 + (this.rest[i + 1] - this.anchor[1]) ** 2 + (this.rest[i + 2] - this.anchor[2]) ** 2;
      this.weight[i / 3] = Math.exp(-d / .6);
      for (let axis = 0; axis < 3; axis++) this.velocity[i + axis] -= this.normal[axis] * this.weight[i / 3] * .65;
    }
  }

  /** A brush or poke excites a local patch without attaching it to the cursor. */
  touch(x: number, y: number, z: number, nx: number, ny: number, nz: number, dx = 0, dy = 0, dz = 0, strength = 1) {
    this.energy = Math.max(this.energy, .01);
    const impulse = [dx * 9 - nx * strength * 2.8, dy * 9 - ny * strength * 2.8, dz * 9 - nz * strength * 2.8];
    for (let i = 0; i < this.rest.length; i += 3) {
      const distance = (this.position[i] - x) ** 2 + (this.position[i + 1] - y) ** 2 + (this.position[i + 2] - z) ** 2;
      const weight = Math.exp(-distance / .65);
      for (let axis = 0; axis < 3; axis++) this.velocity[i + axis] = Math.max(-4, Math.min(4, this.velocity[i + axis] + impulse[axis] * weight));
    }
  }

  /** Skin lags behind a change in body velocity, then sends a ripple through neighbors. */
  inertia(dx: number, dy: number, dz: number) {
    const length = Math.hypot(dx, dy, dz);
    if (length < .005) return;
    const scale = Math.min(1, 6 / length) * .85;
    for (const i of this.nodes) {
      const mobility = .3 + .7 * Math.min(1, this.rest[i + 1] / .7);
      this.velocity[i] -= dx * scale * mobility;
      this.velocity[i + 1] -= dy * scale * mobility;
      this.velocity[i + 2] -= dz * scale * mobility;
    }
    this.energy = Math.max(this.energy, .01);
  }

  step(delta: number, dx = 0, dy = 0, dz = 0, press = 0, floor = .035, suspension = 0, nx = 0, ny = 1, nz = 0): boolean {
    const sameFloor = Math.abs(this.lastFloor[0] - nx) < .00001 && Math.abs(this.lastFloor[1] - ny) < .00001 && Math.abs(this.lastFloor[2] - nz) < .00001 && Math.abs(this.lastFloor[3] - floor) < .00001;
    this.lastFloor.set([nx, ny, nz, floor]);
    if (!this.active && this.roundness === 0 && this.energy < .000001 && sameFloor) return false;
    for (let i = 0; i < this.pose.length; i += 3) {
      const penetration = Math.max(0, floor - (nx * this.pose[i] + ny * this.pose[i + 1] + nz * this.pose[i + 2]));
      this.target[i] = this.pose[i] + nx * penetration;
      this.target[i + 1] = this.pose[i + 1] + ny * penetration;
      this.target[i + 2] = this.pose[i + 2] + nz * penetration;
    }
    const length = Math.hypot(dx, dy, dz), limit = 1.6 * Math.tanh(length / 1.6) / Math.max(length, .000001);
    const pull = [dx * limit - this.normal[0] * press, dy * limit - this.normal[1] * press, dz * limit - this.normal[2] * press];
    // An inward grab can dent the shell, but cannot push it through the opposite side.
    const inward = pull[0] * this.normal[0] + pull[1] * this.normal[1] + pull[2] * this.normal[2];
    if (inward < -.18) for (let axis = 0; axis < 3; axis++) pull[axis] -= this.normal[axis] * (inward + .18);
    const dt = 1 / 240, sag = this.active ? 72 * Math.min(1, Math.max(0, suspension)) : 0;
    this.time += Math.min(delta, .05);
    let energy = 0;
    let stepped = false;
    while (this.time + 1e-9 >= dt) {
      this.time -= dt; stepped = true; energy = 0;
      // Read the entire old state before integrating, so waves do not favor one direction.
      for (let node = 0; node < this.nodes.length; node++) {
        const i = this.nodes[node], start = this.neighborStart[node], end = this.neighborStart[node + 1];
        const weight = this.active ? this.weight[i / 3] : 0, grip = 1800 * weight;
        for (let axis = 0; axis < 3; axis++) {
          const j = i + axis, offset = this.position[j] - this.target[j];
          let neighborOffset = 0, neighborVelocity = 0;
          for (let k = start; k < end; k++) {
            const neighbor = this.neighbors[k] + axis;
            neighborOffset += this.position[neighbor] - this.target[neighbor]; neighborVelocity += this.velocity[neighbor];
          }
          const coupling = end > start ? 700 * (neighborOffset / (end - start) - offset) + 6 * (neighborVelocity / (end - start) - this.velocity[j]) : 0;
          this.acceleration[j] = -220 * offset - 5 * this.velocity[j] + coupling + grip * (pull[axis] * weight - offset) - 15 * weight * this.velocity[j];
          if (axis === 1) {
            const radius = Math.min(1, (this.rest[i] / 1.4) ** 2 + (this.rest[i + 2] / 1.04) ** 2);
            this.acceleration[j] -= sag * (1 - weight) * (.35 + .65 * (1 - Math.min(1, this.rest[j] / 1.8)) * (1 - .65 * radius));
          }
        }
      }
      for (const i of this.nodes) {
        for (let axis = 0; axis < 3; axis++) {
          const j = i + axis;
          this.velocity[j] = Math.max(-14, Math.min(14, this.velocity[j] + this.acceleration[j] * dt));
          this.position[j] += this.velocity[j] * dt;
        }
        const x = this.position[i] - this.rest[i], y = this.position[i + 1] - this.rest[i + 1], z = this.position[i + 2] - this.rest[i + 2];
        const stretch = Math.hypot(x, y, z);
        if (stretch > 1.8) for (let axis = 0; axis < 3; axis++) {
          this.position[i + axis] = this.rest[i + axis] + (this.position[i + axis] - this.rest[i + axis]) * 1.8 / stretch;
          this.velocity[i + axis] *= .8;
        }
        const penetration = floor - (nx * this.position[i] + ny * this.position[i + 1] + nz * this.position[i + 2]);
        if (penetration > 0) {
          this.position[i] += nx * penetration; this.position[i + 1] += ny * penetration; this.position[i + 2] += nz * penetration;
          const inward = Math.min(0, nx * this.velocity[i] + ny * this.velocity[i + 1] + nz * this.velocity[i + 2]);
          this.velocity[i] -= nx * inward; this.velocity[i + 1] -= ny * inward; this.velocity[i + 2] -= nz * inward;
        }
        for (let axis = 0; axis < 3; axis++) energy += (this.position[i + axis] - this.target[i + axis]) ** 2 + this.velocity[i + axis] ** 2 * .005;
      }
    }
    if (!stepped) return false;
    for (let vertex = 0; vertex < this.sources.length; vertex++) {
      const source = this.nodes[this.sources[vertex]], target = vertex * 3;
      if (source !== target) for (let axis = 0; axis < 3; axis++) { this.position[target + axis] = this.position[source + axis]; this.velocity[target + axis] = this.velocity[source + axis]; }
    }
    this.energy = energy / (this.nodes.length * 3);
    if (!this.active && this.energy < .000001) { this.position.set(this.target); this.velocity.fill(0); this.time = 0; }
    return stepped;
  }

  /** Interpolate nearby vertices instead of snapping a face vertex to one surface vertex. */
  bind(points: Float32Array): SurfaceBinding {
    const indices = new Uint32Array(points.length / 3 * 4), weights = new Float32Array(indices.length);
    for (let i = 0; i < points.length; i += 3) {
      const distances = [Infinity, Infinity, Infinity, Infinity], nearest = [0, 0, 0, 0];
      for (let j = 0; j < this.rest.length; j += 3) {
        const d = (points[i] - this.rest[j]) ** 2 + (points[i + 1] - this.rest[j + 1]) ** 2 + (points[i + 2] - this.rest[j + 2]) ** 2;
        for (let k = 0; k < 4; k++) if (d < distances[k]) {
          distances.splice(k, 0, d); nearest.splice(k, 0, j); distances.pop(); nearest.pop(); break;
        }
      }
      const total = distances.reduce((sum, d) => sum + 1 / Math.max(d, .00001), 0);
      for (let k = 0; k < 4; k++) {
        indices[i / 3 * 4 + k] = nearest[k];
        weights[i / 3 * 4 + k] = 1 / Math.max(distances[k], .00001) / total;
      }
    }
    return { indices, weights };
  }

  follow(rest: Float32Array, target: Float32Array, binding: SurfaceBinding) {
    for (let i = 0; i < target.length; i++) {
      let offset = 0;
      for (let k = 0; k < 4; k++) {
        const index = Math.floor(i / 3) * 4 + k, source = binding.indices[index] + i % 3;
        offset += (this.position[source] - this.rest[source]) * binding.weights[index];
      }
      target[i] = rest[i] + offset;
    }
  }
}
