// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  Color,
  MathUtils,
  Mesh,
  MeshBasicNodeMaterial,
  SphereGeometry,
} from "three/webgpu";
import {
  mx_noise_float,
  normalLocal,
  positionLocal,
  uniform,
  vec3,
} from "three/tsl";
export function createMenuModule(scope) {
  var MenuOrb = class {
    button;
    mesh;
    color = uniform(new Color(`#005bff`));
    tuning = {
      wobble: 0.826,
      speed: 1.087,
      skyTint: 1,
      darken: 0.62,
      saturate: 1.15,
    };
    base = new Color(`#005bff`);
    shade = new Color();
    hsl = {
      h: 0,
      s: 0,
      l: 0,
    };
    noiseScale = uniform(0.365);
    wobble = uniform(1);
    phase = uniform(0);
    speed = 1;
    hovered = !1;
    open = !1;
    constructor(e) {
      this.button = e;
      let t = new MeshBasicNodeMaterial({
        depthTest: !1,
        depthWrite: !1,
        transparent: !0,
      });
      ((t.colorNode = this.color), this.base.copy(this.color.value));
      let n = this.phase,
        r = positionLocal.mul(this.noiseScale),
        i = mx_noise_float(r.mul(1.3).add(vec3(n.mul(0.55), n.mul(0.4), 0))),
        a = mx_noise_float(r.mul(2.6).sub(vec3(0, n.mul(0.7), n.mul(0.3)))),
        o = i.mul(0.11).add(a.mul(0.045)).mul(this.wobble);
      ((t.positionNode = positionLocal.add(normalLocal.mul(o))),
        (this.mesh = new Mesh(new SphereGeometry(1, 64, 40), t)),
        (this.mesh.renderOrder = 100),
        (this.mesh.frustumCulled = !1),
        scope.listen(
          e,
          `pointerenter`,
          (e) => (this.hovered = e.pointerType !== `touch`),
        ),
        scope.listen(e, `pointerleave`, () => (this.hovered = !1)),
        scope.listen(e, `click`, () => {
          ((this.open = !this.open),
            e.setAttribute(`aria-expanded`, String(this.open)),
            e.setAttribute(
              `aria-label`,
              this.open ? `Close menu` : `Open menu`,
            ));
        }));
    }
    setBaseColor(e) {
      this.base.set(e);
    }
    get baseColor() {
      return this.base;
    }
    followSky(e) {
      let t = this.tuning;
      (e.getHSL(this.hsl),
        this.shade.setHSL(
          this.hsl.h,
          Math.min(1, this.hsl.s * t.saturate),
          this.hsl.l * t.darken,
        ),
        this.color.value.copy(this.base).lerp(this.shade, t.skyTint));
    }
    layout(e, t = window.innerHeight, n = window.innerWidth) {
      let r = this.button.getBoundingClientRect(),
        i = (6 * Math.tan(MathUtils.degToRad(e.fov / 2))) / t,
        a = r.left + r.width / 2,
        o = r.top + r.height / 2;
      (this.mesh.position.set((a - n / 2) * i, (t / 2 - o) * i, -3),
        this.mesh.scale.setScalar((r.width / 2) * i * 0.9));
    }
    update(e) {
      let t = 1 - Math.exp(-e * 5),
        n = (this.open ? 1.7 : this.hovered ? 1.35 : 1) * this.tuning.wobble,
        r = (this.open ? 2.2 : this.hovered ? 1.8 : 1) * this.tuning.speed;
      ((this.wobble.value += (n - this.wobble.value) * t),
        (this.speed += (r - this.speed) * t),
        (this.phase.value += e * this.speed));
    }
  };
  return {
    MenuOrb,
  };
}
