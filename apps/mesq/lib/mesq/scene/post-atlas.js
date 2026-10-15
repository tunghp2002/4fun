// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import { CanvasTexture, Shape, SRGBColorSpace, Vector2 } from "three/webgpu";
export function createPostAtlasModule(
  scope,
  { renderingModule, stickersModule, slotMachineModule },
) {
  const { createToonMaterial } = renderingModule;
  const { WV, tH, nH } = stickersModule;
  const { GY, KY, qY } = slotMachineModule;
  function JY(e, t) {
    let n = [
        {
          x: 0,
          y: 0,
          w: t,
        },
      ],
      r = [];
    for (let i of e) {
      let e = 1 / 0,
        a = 0;
      for (let r = 0; r < n.length; r++) {
        let o = n[r].x;
        if (o + i.w > t) break;
        let s = 0;
        for (let e = r, t = 0; t < i.w; e++)
          ((s = Math.max(s, n[e].y)),
            (t += n[e].x + n[e].w - Math.max(o, n[e].x)));
        s < e && ((e = s), (a = o));
      }
      r.push({
        x: a,
        y: e,
      });
      let o = a + i.w,
        s = [];
      for (let e of n) {
        let t = e.x,
          n = e.x + e.w;
        n <= a || t >= o
          ? s.push(e)
          : (t < a &&
              s.push({
                x: t,
                y: e.y,
                w: a - t,
              }),
            n > o &&
              s.push({
                x: o,
                y: e.y,
                w: n - o,
              }));
      }
      (s.push({
        x: a,
        y: e + i.h,
        w: i.w,
      }),
        s.sort((e, t) => e.x - t.x),
        (n.length = 0));
      for (let e of s) {
        let t = n[n.length - 1];
        t && t.y === e.y && t.x + t.w === e.x
          ? (t.w += e.w)
          : n.push({
              ...e,
            });
      }
    }
    return r;
  }
  var TextureAtlas = class {
    canvas = scope.element(`canvas`);
    texture;
    white = new Vector2();
    rects = new Map();
    stickerRects = [];
    constructor(e) {
      let t = tH().canvas,
        n = [
          {
            key: `#stickers`,
            w: t.width,
            h: t.height,
            x: 0,
            y: 0,
          },
          {
            key: `#white`,
            w: qY,
            h: qY,
            x: 0,
            y: 0,
          },
          ...Object.entries(e).map(([e, t]) => ({
            key: e,
            w: Math.round(t.w),
            h: Math.round(t.h),
            x: 0,
            y: 0,
          })),
        ],
        r = [...n].sort((e, t) => t.h - e.h || t.w - e.w),
        i = JY(
          r.map((e) => ({
            w: e.w + 12,
            h: e.h + 12,
          })),
          KY,
        ),
        a = 0;
      r.forEach((e, t) => {
        ((e.x = i[t].x + GY),
          (e.y = i[t].y + GY),
          (a = Math.max(a, e.y + e.h + GY)));
      });
      let o = KY,
        s = Math.min(8192, Math.ceil(a / 64) * 64);
      ((this.canvas.width = o), (this.canvas.height = s));
      let c = this.canvas.getContext(`2d`);
      c.imageSmoothingEnabled = !1;
      let l = (e) => ({
          u0: e.x / o,
          u1: (e.x + e.w) / o,
          v0: 1 - (e.y + e.h) / s,
          v1: 1 - e.y / s,
        }),
        u = 1,
        d = 1;
      for (let e of n)
        e.key !== `#stickers` &&
          e.key !== `#white` &&
          ((u = Math.max(u, e.w)), (d = Math.max(d, e.h)));
      let f = scope.element(`canvas`);
      ((f.width = u + 12), (f.height = d + 12));
      let p = f.getContext(`2d`);
      for (let r of n) {
        if (r.key === `#stickers`) {
          c.drawImage(t, r.x, r.y);
          for (let e = 0; e < WV; e++) {
            let t = nH(e);
            this.stickerRects.push({
              u0: (r.x + t.x) / o,
              u1: (r.x + t.x + t.w) / o,
              v0: 1 - (r.y + t.y + t.h) / s,
              v1: 1 - (r.y + t.y) / s,
            });
          }
          continue;
        }
        if (r.key === `#white`) {
          ((c.fillStyle = `#ffffff`),
            c.fillRect(r.x - GY, r.y - GY, r.w + 12, r.h + 12),
            this.white.set((r.x + r.w / 2) / o, 1 - (r.y + r.h / 2) / s));
          continue;
        }
        (p.clearRect(0, 0, r.w + 12, r.h + 12),
          p.save(),
          p.translate(GY, GY),
          p.beginPath(),
          p.rect(0, 0, r.w, r.h),
          p.clip(),
          (p.imageSmoothingEnabled = !0),
          e[r.key].paint(p, r.w, r.h),
          p.restore(),
          this.blit(c, f, r),
          this.rects.set(r.key, l(r)));
      }
      ((f.width = f.height = 0),
        (this.texture = new CanvasTexture(this.canvas)),
        (this.texture.colorSpace = SRGBColorSpace),
        (this.texture.anisotropy = 8),
        (this.texture.name = `post-atlas`),
        new URLSearchParams(location.search),
        (this.texture.onUpdate = () => {
          ((this.canvas.width = this.canvas.height = 0),
            (this.texture.onUpdate = null));
        }));
    }
    blit(e, t, n) {
      let { x: r, y: i, w: a, h: o } = n,
        s = GY;
      ((e.imageSmoothingEnabled = !1),
        e.drawImage(t, s, s, a, o, r, i, a, o),
        e.drawImage(t, s, s, 1, o, r - s, i, s, o),
        e.drawImage(t, s + a - 1, s, 1, o, r + a, i, s, o),
        e.drawImage(t, s, s, a, 1, r, i - s, a, s),
        e.drawImage(t, s, s + o - 1, a, 1, r, i + o, a, s),
        e.drawImage(t, s, s, 1, 1, r - s, i - s, s, s),
        e.drawImage(t, s + a - 1, s, 1, 1, r + a, i - s, s, s),
        e.drawImage(t, s, s + o - 1, 1, 1, r - s, i + o, s, s),
        e.drawImage(t, s + a - 1, s + o - 1, 1, 1, r + a, i + o, s, s));
    }
    rect(e) {
      let t = this.rects.get(e);
      if (!t) throw Error(`[post atlas] no region "${e}"`);
      return t;
    }
    sticker(e) {
      return this.stickerRects[((e % WV) + WV) % WV];
    }
  };
  function createPostMaterials(e) {
    let t = createToonMaterial({
      vertexColors: !0,
    });
    t.name = `post`;
    let n = createToonMaterial({
      map: e.texture,
      vertexColors: !0,
      alphaTest: 0.5,
    });
    return (
      (n.name = `post-print`),
      (n.userData.exportMap = e.texture),
      {
        solid: t,
        print: n,
      }
    );
  }
  var ZY = {
    hw: 0.19,
    hr: 0.22,
    len: 0.56,
    flagDown: 1.5,
    flagUp: 0,
  };
  var QY = {
    w: 0.3,
    h: 0.14,
    y: 0.25,
  };
  var $Y = (e, t) => {
    let n = new Shape();
    return (
      n.moveTo(-e, 0),
      n.lineTo(e, 0),
      n.lineTo(e, t),
      n.absarc(0, t, e, 0, Math.PI, !1),
      n.lineTo(-e, 0),
      n
    );
  };
  return {
    TextureAtlas,
    createPostMaterials,
    ZY,
    QY,
    $Y,
  };
}
