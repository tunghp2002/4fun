// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import { MathUtils } from "three/webgpu";
export function createShowcaseStateModule(scope, { renderingModule }) {
  const { cI } = renderingModule;
  var d0 = `showcase:untuck`;
  var f0 = 500;
  var p0 = new (class {
    on = !1;
    at = -1 / 0;
    listeners = new Set();
    get value() {
      return this.on;
    }
    get fresh() {
      return performance.now() - this.at < f0;
    }
    set(e) {
      if (e !== this.on) {
        ((this.on = e), (this.at = performance.now()));
        for (let t of this.listeners) t(e);
      }
    }
    toggle() {
      return (this.set(!this.on), this.on);
    }
    sliverClick() {
      this.fresh || this.set(!1);
    }
    subscribe(e) {
      return (this.listeners.add(e), () => this.listeners.delete(e));
    }
  })();
  var m0 = {
    tuckShow: 0.12,
    tuckMin: 0.045,
    tuckTime: 0.5,
    tuckRoll: -0.03,
    tuckSwing: 0.05,
    tuckAberration: 0.05,
    tuckPeek: 0.04,
  };
  var h0 = {
    share: 0,
  };
  var CardTuck = class {
    t;
    amount = 0;
    slide = 0;
    peek = 0;
    pos = 0;
    v = 0;
    constructor(e) {
      this.t = e;
    }
    park() {
      ((this.pos = this.amount = +!!p0.value),
        (this.v = this.slide = this.peek = 0));
    }
    step(e, t) {
      let n = this.t,
        r = !!cI?.matches,
        i = 6.64 / Math.max(0.05, r ? Math.min(n.tuckTime, 0.18) : n.tuckTime),
        a = +!!p0.value,
        o = this.pos - a,
        s = this.v + i * o,
        c = Math.exp(-i * e);
      ((this.pos = a + (o + s * e) * c),
        (this.v = (this.v - i * s * e) * c),
        Math.abs(this.pos - a) < 1e-4 &&
          Math.abs(this.v) < 0.001 &&
          ((this.pos = a), (this.v = 0)),
        (this.amount = MathUtils.clamp(this.pos, 0, 1)),
        (this.slide = r ? 0 : MathUtils.clamp(this.v / (i / Math.E), -1, 1)),
        (this.peek +=
          ((p0.value && t ? 1 : 0) - this.peek) * (1 - Math.exp(-e * 10))));
    }
    edge(e, t, n, r) {
      let i = this.t,
        a = Math.max(i.tuckShow * t, i.tuckMin * 2 * r);
      return (
        MathUtils.lerp(e, -n * (1 - 2 * h0.share) + a, this.amount) +
        this.peek * i.tuckPeek * t
      );
    }
    get roll() {
      return this.amount * this.t.tuckRoll - this.slide * this.t.tuckSwing;
    }
    get aberration() {
      return Math.abs(this.slide) * this.t.tuckAberration;
    }
    get parked() {
      return p0.value && this.amount >= 1;
    }
    get swept() {
      return p0.value || this.pos > 0.02 || p0.fresh;
    }
  };
  function _0(e, t, n, r) {
    let i = e + (t - e) * (1 - Math.exp(-n * r));
    return Math.abs(t - i) < 0.001 ? t : i;
  }
  return {
    d0,
    p0,
    m0,
    h0,
    CardTuck,
    _0,
  };
}
