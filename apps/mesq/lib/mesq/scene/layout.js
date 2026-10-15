// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import { MathUtils, Matrix4, PerspectiveCamera, Vector3 } from "three/webgpu";
export function createLayoutModule(scope, { renderingModule, helperModule }) {
  const { cI } = renderingModule;
  const { e6, t6 } = helperModule;
  var CameraFraming = class {
    tuning = {
      scale: 0.6,
      minScale: 0.47,
      maxScale: 1.05,
      fillBand: 0.9,
      edge: 0.05,
      minPoleX: 0.3,
      contactsMaxScale: 0.68,
      contactsEdge: 0.16,
      cardMin: 0.7,
      gap: 12,
      margin: 6,
      rowGap: 8,
      speechGap: 4,
    };
    fronts;
    plans = [];
    cam = new PerspectiveCamera();
    v = new Vector3();
    out = {
      offset: 0,
      scale: 0.6,
      y: 0,
      x: 0.72,
      boxY: 0,
      boxH: 0,
    };
    boxes = {
      panel: {
        y: 0,
        h: 0,
      },
      case: {
        y: 0,
        h: 0,
      },
      cards: {
        y: 0,
        h: 0,
      },
    };
    canvasH = 1;
    face = {
      s: 0,
      c: 1,
    };
    end;
    constructor(e) {
      ((this.fronts = r6(e, this.face)), (this.end = e.endFraming));
    }
    get measured() {
      return this.fronts;
    }
    layout(e) {
      this.canvasH = e.canvasH;
      let t = this.cam;
      (t.copy(e.camera, !1),
        t.position.set(0, e.cameraY, e.z),
        t.lookAt(0, e.lookY, 0),
        t.updateMatrixWorld(!0),
        (this.plans = this.fronts.map((t) => this.plan(t, e))));
    }
    at(e) {
      let t = this.out,
        n = this.plans;
      if (!n.length)
        return Object.assign(t, {
          offset: e,
          scale: this.tuning.scale,
          y: 0,
          x: 0.72,
          boxY: 0,
          boxH: 0,
        });
      let r = 0;
      for (; r < n.length - 1 && n[r + 1].offset <= e;) r++;
      let i = n[r],
        a = n[Math.min(r + 1, n.length - 1)],
        o =
          a === i || e <= i.offset
            ? 0
            : MathUtils.smoothstep(e, i.offset, a.offset);
      return (
        (t.offset = e),
        (t.scale = MathUtils.lerp(i.scale, a.scale, o)),
        (t.y = MathUtils.lerp(i.y, a.y, o)),
        (t.x = MathUtils.lerp(i.x, a.x, o)),
        (t.boxY = MathUtils.lerp(i.boxY, a.boxY, o)),
        (t.boxH = MathUtils.lerp(i.boxH, a.boxH, o)),
        t
      );
    }
    cardBox(e, t) {
      let n, r;
      for (let i = 0; i < this.plans.length; i++) {
        if (this.fronts[i].card !== e) continue;
        let a = this.plans[i];
        a.offset <= t ? (n = a) : (r ||= a);
      }
      let i = n ?? r,
        a = r ?? n;
      if (!i || !a) return null;
      let o = i === a ? 0 : MathUtils.smoothstep(t, i.offset, a.offset),
        s = this.boxes[e];
      return (
        (s.y = MathUtils.lerp(i.boxY, a.boxY, o)),
        (s.h = MathUtils.lerp(i.boxH, a.boxH, o)),
        s
      );
    }
    py(e, t) {
      return (
        this.v.set(0, e, t).project(this.cam),
        ((1 - this.v.y) / 2) * this.canvasH
      );
    }
    span(e, t, n) {
      let r = n * (-e.x * this.face.s + e.z * this.face.c),
        i = this.tuning.margin;
      return {
        top: this.py(t + n * (e.base + e.top), r) - i,
        bottom: this.py(t + n * (e.base + e.bottom), r) + i,
      };
    }
    edge(e) {
      return e.card
        ? this.tuning.edge
        : e.end
          ? this.end.edge
          : this.tuning.contactsEdge;
    }
    plan(e, t) {
      let n = this.tuning,
        r = t.bottom(e.offset),
        i = Math.max(1, r - t.top),
        a = e.card === `case` ? t.caseH : e.card ? t.panelH : 0,
        o = a > 0 ? n.gap : 0,
        s = (t) => {
          let n = this.span(e, 0, t);
          return n.bottom - n.top;
        },
        c = n.scale,
        l = a,
        u = l + o + s(c) - i;
      if (u > 0) {
        let e = a * (1 - n.cardMin),
          t = Math.min(n.scale, n.minScale),
          r = s(c) - s(t),
          i = e + r,
          o = i > 0 ? Math.min(1, u / i) : 1;
        l = a - e * o;
        let d = s(c),
          f = s(t),
          p = d - r * o;
        c = d - f > 1e-6 ? MathUtils.lerp(n.scale, t, (d - p) / (d - f)) : c;
      } else {
        let r =
            Math.tan(MathUtils.degToRad(this.cam.fov / 2)) *
            this.cam.aspect *
            t.z,
          a = -(e.left * this.face.c + e.z * this.face.s),
          u = this.edge(e),
          d = e.card
            ? n.maxScale
            : e.end
              ? this.end.maxScale
              : n.contactsMaxScale,
          f = a > 0.001 ? (r * (1 - u) + r * t.poleX) / a : d,
          p = (i - l - o) * n.fillBand;
        for (let e = 0; e < 3; e++) {
          let e = s(c);
          if (e < 1) break;
          c = Math.min(d, f, (p / e) * c);
        }
        c = Math.max(c, n.scale * Math.min(1, f / n.scale));
      }
      let d = Math.max(0, i - (l + o + s(c))),
        f = t.top,
        p = f + l + o,
        m = d > 0 ? (p + r) / 2 : p + s(c) / 2,
        h = (t) => {
          let n = this.span(e, t, c);
          return (n.top + n.bottom) / 2;
        },
        g = 0;
      for (let e = 0; e < 2; e++) {
        let e = h(g),
          t = h(g + 0.5) - e;
        if (Math.abs(t) < 1e-6) break;
        g += ((m - e) / t) * 0.5;
      }
      let _ =
          Math.tan(MathUtils.degToRad(this.cam.fov / 2)) *
          this.cam.aspect *
          t.z,
        v = (t) => -(t * this.face.c + e.z * this.face.s),
        y = (c * v(e.x)) / _,
        b = (c * v(e.left)) / _ - (1 - this.edge(e)),
        x = MathUtils.clamp(Math.max(y, b), n.minPoleX, t.poleX),
        S = t.frameH / 2;
      return {
        offset: e.offset,
        scale: c,
        y: g,
        x,
        boxY: l > 0 ? (S - (f + l / 2)) / S : 0,
        boxH: l / t.frameH,
      };
    }
  };
  function r6(e, t) {
    let n = e.group.getObjectByName(`Post`);
    if (!n) return [];
    e.group.updateMatrixWorld(!0);
    let r = n.children.filter(
        (e) =>
          e.name.startsWith(`Slot_`) ||
          e.name === `Contacts` ||
          e.name === `Finale`,
      ),
      i = r.find((e) => e.name.includes(`Divider`));
    i && ((t.s = Math.sin(i.rotation.y)), (t.c = Math.cos(i.rotation.y)));
    let a = e.stops,
      o = new Set(e.flocks.map((e) => e.group)),
      s = (e, t) => Math.abs(e - t) < 0.001,
      c = [],
      l = new Matrix4(),
      u = new Matrix4(),
      d = new Vector3(),
      f = new Vector3();
    for (let e of r) {
      let t = e.name === `Contacts`,
        n = e.name === `Finale`,
        r = t ? a.contacts : n ? a.end : -e.position.y,
        i = s(r, a.about) || a.aboutMore.some((e) => s(e, r)),
        p = a.projects.some((e) => s(e, r));
      if (!t && !n && !i && !p) continue;
      l.copy(e.matrixWorld).invert();
      let m = {
          top: -1 / 0,
          bottom: 1 / 0,
          x0: 1 / 0,
          x1: -1 / 0,
          z0: 1 / 0,
          z1: -1 / 0,
        },
        h = (e) => {
          ((m.top = Math.max(m.top, e.y)),
            (m.bottom = Math.min(m.bottom, e.y)),
            (m.x0 = Math.min(m.x0, e.x)),
            (m.x1 = Math.max(m.x1, e.x)),
            (m.z0 = Math.min(m.z0, e.z)),
            (m.z1 = Math.max(m.z1, e.z)));
        },
        g = (e) => {
          if (o.has(e)) {
            e.traverse((e) => {
              let t = e;
              if (!e.userData.bird || !t.geometry) return;
              t.geometry.computeBoundingSphere();
              let n =
                (t.geometry.boundingSphere?.radius ?? 0) * e.getWorldScale(f).x;
              (d.setFromMatrixPosition(e.matrixWorld),
                (d.y += n * t6),
                d.applyMatrix4(l),
                d.x < -e6 && h(d));
            });
            return;
          }
          if (!e.visible && !e.userData.measure) return;
          let t = e,
            n =
              t.isMesh && !t.isInstancedMesh && !e.name.endsWith(`_Static`)
                ? t.geometry?.attributes.position
                : void 0;
          if (n) {
            u.multiplyMatrices(l, e.matrixWorld);
            for (let e = 0; e < n.count; e++)
              (d.fromBufferAttribute(n, e).applyMatrix4(u), d.x < -e6 && h(d));
          }
          for (let t of e.children) g(t);
        };
      for (let t of e.children) g(t);
      Number.isFinite(m.top) &&
        c.push({
          offset: r,
          base: e.position.y + r,
          top: m.top,
          bottom: m.bottom,
          x: (m.x0 + m.x1) / 2,
          z: (m.z0 + m.z1) / 2,
          left: m.x0,
          card: t || n ? null : s(r, a.about) ? `case` : i ? `cards` : `panel`,
          end: n,
        });
    }
    return c.sort((e, t) => e.offset - t.offset);
  }
  var i6 = () => cI.matches;
  var a6 = 900;
  var o6 = 350;
  var s6 = 450;
  return {
    CameraFraming,
    i6,
    a6,
    o6,
    s6,
  };
}
