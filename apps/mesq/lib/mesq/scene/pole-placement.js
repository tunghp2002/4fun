// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
export function createPolePlacementModule(scope, { stickersModule }) {
  const { YV, ZV, iH, oH, sH, cH, MH, LH, RH, BH } = stickersModule;
  var CZ = Math.PI * 2;
  var wZ = 1e3;
  var PoleSkin = class {
    sides;
    atlas;
    apothem;
    perimeter;
    chart;
    keepOuts = [];
    spots = [];
    cut = -1 / 0;
    gap = 0;
    turnU = 0;
    at = {
      u: 0,
      y: 0,
    };
    constructor(e, t, n) {
      ((this.sides = t),
        (this.atlas = n),
        (this.apothem = e * Math.cos(Math.PI / t)),
        (this.perimeter = t * 2 * this.apothem * Math.tan(Math.PI / t)),
        (this.chart = MH(this.apothem, t)));
    }
    splice(e, t, n) {
      ((this.cut = e),
        (this.gap = t),
        (this.turnU = (n / CZ) * this.perimeter));
    }
    virtual(e) {
      return e >= this.cut
        ? e
        : e >= this.cut - this.gap
          ? e + wZ
          : e + this.gap;
    }
    real(e, t) {
      let n = t < this.cut;
      return (
        (this.at.u = n ? e + this.turnU : e),
        (this.at.y = t > wZ / 2 ? t - wZ : n ? t - this.gap : t),
        this.at
      );
    }
    angle(e, t) {
      return t < this.cut - this.gap
        ? e - (this.turnU / this.perimeter) * CZ
        : e;
    }
    ring(e, t) {
      let n = this.virtual((e + t) / 2) - (e + t) / 2;
      this.keepOuts.push({
        y0: e + n,
        y1: t + n,
      });
    }
    patch(e, t, n, r) {
      let i = (e + t) / 2,
        a = this.virtual(i) - i;
      this.keepOuts.push({
        y0: e + a,
        y1: t + a,
        a: this.angle(n, i),
        ha: r,
      });
    }
    ringFree(e, t) {
      let n = this.virtual((e + t) / 2) - (e + t) / 2;
      return this.keepOuts.every(
        (r) => r.a !== void 0 || t + n < r.y0 || e + n > r.y1,
      );
    }
    angleOf(e) {
      return (e / this.perimeter) * CZ;
    }
    free(e, t, n, r) {
      let i = this.angleOf(e),
        a = n / this.apothem;
      for (let e of this.keepOuts)
        if (
          !(t + r < e.y0 || t - r > e.y1) &&
          (e.a === void 0 ||
            Math.abs(Math.atan2(Math.sin(i - e.a), Math.cos(i - e.a))) <
              a + e.ha)
        )
          return !1;
      return !0;
    }
    distance(e, t, n) {
      let r = Math.abs(e.u - t) % this.perimeter;
      return ((r = Math.min(r, this.perimeter - r)), Math.hypot(r, e.y - n));
    }
    layerFor(e, t, n) {
      let r = 0;
      for (let i of this.spots) {
        let a = Math.abs(i.y - t);
        if (a > i.r + n) continue;
        let o = Math.abs(i.u - e) % this.perimeter;
        o = Math.min(o, this.perimeter - o);
        let s = Math.hypot(o, a);
        if (!(s >= i.r + n)) {
          if (i.hard || s < (i.r + n) * 0.62) return -1;
          r = Math.max(r, i.layer + 1);
        }
      }
      return r > 2 ? -1 : r;
    }
    flyer(e, t, n, r) {
      let i = 0.25,
        a = 2 * this.apothem * Math.tan(Math.PI / this.sides);
      for (let o = 0; o < 40; o++) {
        let o = (cH(this.sides) + 0.5) * a,
          s = sH(t + i / 2, n - i / 2);
        if (!this.free(o, s, 0.09999999999999999, 0.145)) continue;
        let c = sH(-0.05, 0.05),
          l = this.real(o, s);
        LH(
          e,
          this.chart,
          l.u,
          l.y,
          0.18,
          i,
          c,
          this.atlas.rect(r),
          0.005,
        ).name = `Flyer`;
        for (let t of [-1, 1])
          LH(
            e,
            this.chart,
            l.u + t * 0.075,
            l.y + 0.112,
            0.06,
            0.024,
            t * 0.6 + c,
            this.atlas.rect(`tapeBit`),
            0.005 + BH,
          ).name = `Tape`;
        return (
          this.spots.push({
            u: o,
            y: s,
            r: 0.16,
            layer: 0,
            hard: !0,
            i: -1,
          }),
          !0
        );
      }
      return !1;
    }
    feature(e, t, n, r, i, a = 0) {
      let o = iH(t) * i,
        s = Math.abs(Math.cos(a)),
        c = Math.abs(Math.sin(a)),
        l = (o * s + i * c) / 2,
        u = (o * c + i * s) / 2,
        d = this.angle(n, r);
      r = this.virtual(r);
      let f =
        ((((d / CZ) * this.perimeter) % this.perimeter) + this.perimeter) %
        this.perimeter;
      for (let n of [0, 0.25, -0.25, 0.5, -0.5, 0.75, -0.75, 1, -1])
        for (let s of [0, 0.08, -0.08]) {
          let c = (f + s + this.perimeter) % this.perimeter;
          if (
            !this.free(c, r + n, l, u) ||
            this.layerFor(c, r + n, Math.hypot(o, i) * 0.42) !== 0
          )
            continue;
          this.spots.push({
            u: c,
            y: r + n,
            r: Math.hypot(o, i) * 0.42,
            layer: 0,
            hard: !0,
            i: t,
          });
          let d = this.real(c, r + n);
          return (RH(e, this.chart, d.u, d.y, t, i, a, 0.003), !0);
        }
      return !1;
    }
    bomb(e, t, n, r = 0.22) {
      let i = (n - t) * this.perimeter * r,
        a = 0;
      for (let r = 0; r < 6e3 && a < i; r++) {
        let r = YV(cH(37)),
          i = iH(r),
          o = oH(),
          s =
            (o < 0.35
              ? sH(0.12, 0.16)
              : o < 0.87
                ? sH(0.17, 0.24)
                : sH(0.26, 0.33)) * (r === 34 ? 1.45 : 1),
          c = i * s,
          l =
            i > 1
              ? (oH() < 0.55 ? Math.PI / 2 : 0) + sH(-0.2, 0.2)
              : sH(-0.6, 0.6),
          u = Math.abs(Math.cos(l)),
          d = Math.abs(Math.sin(l)),
          f = (c * u + s * d) / 2,
          p = (c * d + s * u) / 2,
          m = sH(0, this.perimeter),
          h = sH(t + p, n - p);
        if (!this.free(m, h, f, p)) continue;
        let g = Math.hypot(c, s) * 0.42,
          _ = this.layerFor(m, h, g);
        if (_ < 0) continue;
        let v = ZV(r, (e) =>
          this.spots.some(
            (t) => t.i === e && this.distance(t, m, h) < (t.r + g) * 2,
          ),
        );
        this.spots.push({
          u: m,
          y: h,
          r: g,
          layer: _,
          hard: !1,
          i: v,
        });
        let y = this.real(m, h);
        (RH(e, this.chart, y.u, y.y, v, s, l, 0.003 + _ * BH),
          (a += c * s * 0.75));
      }
    }
  };
  return {
    PoleSkin,
  };
}
