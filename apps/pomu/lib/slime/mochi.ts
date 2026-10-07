type Vector = { x: number; y: number; z: number };
export const MAX_MOCHI = 6;
export const MOCHI_FLOOR = .285 + .24 * .32;
export const SLING_PULL_LIMIT = 90;

export function slingshotVelocity(dx: number, dy: number): Vector | undefined {
  const distance = Math.hypot(dx, dy);
  if (distance < 7) return;
  const power = Math.min(1, distance / SLING_PULL_LIMIT);
  return { x: -dx / distance * power * 7.5, y: 3 + power * 1.8, z: -dy / distance * power * 10 };
}

export function stepMochi(position: Vector, velocity: Vector, dt: number) {
  const grounded = position.y <= MOCHI_FLOOR + .001 && velocity.y <= 0;
  const friction = grounded ? 6 : .25, damping = Math.exp(-friction * dt);
  position.x += velocity.x * (1 - damping) / friction;
  position.z += velocity.z * (1 - damping) / friction;
  velocity.x *= damping; velocity.z *= damping;
  if (!grounded) {
    position.y += velocity.y * dt - 4.5 * dt * dt; velocity.y -= 9 * dt;
  }
  if (position.y <= MOCHI_FLOOR) {
    position.y = MOCHI_FLOOR;
    velocity.y = velocity.y < -.8 ? -velocity.y * .28 : 0;
  }
}
