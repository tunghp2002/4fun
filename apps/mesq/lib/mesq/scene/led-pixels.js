// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  CanvasTexture,
  LinearFilter,
  MeshStandardNodeMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  Vector4,
} from "three/webgpu";
import {
  abs,
  floor,
  fract,
  fwidth,
  length,
  mix,
  mod,
  smoothstep,
  step,
  texture,
  time,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";
export function createLedPixelsModule(
  scope,
  { paletteModule, dialogueModule },
) {
  const { paperWhite, inkPurple, palette } = paletteModule;
  const { HB, UB } = dialogueModule;
  var PixelGrid = class {
    cols;
    rows;
    cells;
    constructor(e, t) {
      ((this.cols = e), (this.rows = t), (this.cells = new Uint32Array(e * t)));
    }
    set(e, t, n) {
      e < 0 ||
        t < 0 ||
        e >= this.cols ||
        t >= this.rows ||
        (this.cells[t * this.cols + e] = typeof n == `number` ? n : UB(n));
    }
    fill(e, t) {
      let n = e === null ? 0 : UB(e);
      for (let e = 0; e < this.rows; e++)
        for (let r = 0; r < this.cols; r++)
          t(r + 0.5, e + 0.5) && (this.cells[e * this.cols + r] = n);
    }
    block(e, t, n, r, i) {
      let a = Math.max(0, e),
        o = Math.max(0, t),
        s = Math.min(this.cols, e + n),
        c = Math.min(this.rows, t + r);
      for (let e = o; e < c; e++)
        for (let t = a; t < s; t++) this.cells[e * this.cols + t] = i;
    }
    disc(e, t, n, r) {
      return this.fill(r, (r, i) => (r - e) ** 2 + (i - t) ** 2 <= n * n);
    }
    ring(e, t, n, r, i) {
      return this.fill(i, (i, a) => {
        let o = Math.hypot(i - e, a - t);
        return o >= n && o <= r;
      });
    }
    bitmap(e, t, n, r, i = 1) {
      e.forEach((e, a) => {
        for (let o = 0; o < e.length; o++) {
          let s = e[o];
          if (s === `.` || s === ` `) continue;
          let c = typeof r == `string` ? r : r[s];
          if (c)
            for (let e = 0; e < i; e++)
              for (let r = 0; r < i; r++)
                this.set(t + o * i + r, n + a * i + e, c);
        }
      });
    }
    stamp(e, t, n, r) {
      let i = r ? UB(r) : 0;
      for (let r = 0; r < e.rows; r++)
        for (let a = 0; a < e.cols; a++)
          e.cells[r * e.cols + a] &&
            this.set(t + a, n + r, i || e.cells[r * e.cols + a]);
    }
    text(e, t, n, r, i = qB, a = 1) {
      let o = JB(e, i);
      return (
        this.bitmap(o.rows, Math.round(t - (o.width * a) / 2), n, r, a),
        o.width * a
      );
    }
  };
  var KB = (...e) => e;
  var qB = {
    gap: 1,
    space: 3,
    glyphs: {
      A: KB(`.###.`, `#...#`, `#...#`, `#####`, `#...#`, `#...#`, `#...#`),
      B: KB(`####.`, `#...#`, `#...#`, `####.`, `#...#`, `#...#`, `####.`),
      C: KB(`.###.`, `#...#`, `#....`, `#....`, `#....`, `#...#`, `.###.`),
      D: KB(`####.`, `#...#`, `#...#`, `#...#`, `#...#`, `#...#`, `####.`),
      E: KB(`#####`, `#....`, `#....`, `####.`, `#....`, `#....`, `#####`),
      F: KB(`#####`, `#....`, `#....`, `####.`, `#....`, `#....`, `#....`),
      G: KB(`.###.`, `#...#`, `#....`, `#.###`, `#...#`, `#...#`, `.####`),
      H: KB(`#...#`, `#...#`, `#...#`, `#####`, `#...#`, `#...#`, `#...#`),
      I: KB(`###`, `.#.`, `.#.`, `.#.`, `.#.`, `.#.`, `###`),
      J: KB(`..###`, `...#.`, `...#.`, `...#.`, `#..#.`, `#..#.`, `.##..`),
      K: KB(`#...#`, `#..#.`, `#.#..`, `##...`, `#.#..`, `#..#.`, `#...#`),
      L: KB(`#....`, `#....`, `#....`, `#....`, `#....`, `#....`, `#####`),
      M: KB(`#...#`, `##.##`, `#.#.#`, `#.#.#`, `#...#`, `#...#`, `#...#`),
      N: KB(`#...#`, `#...#`, `##..#`, `#.#.#`, `#..##`, `#...#`, `#...#`),
      O: KB(`.###.`, `#...#`, `#...#`, `#...#`, `#...#`, `#...#`, `.###.`),
      P: KB(`####.`, `#...#`, `#...#`, `####.`, `#....`, `#....`, `#....`),
      Q: KB(`.###.`, `#...#`, `#...#`, `#...#`, `#.#.#`, `#..#.`, `.##.#`),
      R: KB(`####.`, `#...#`, `#...#`, `####.`, `#.#..`, `#..#.`, `#...#`),
      S: KB(`.####`, `#....`, `#....`, `.###.`, `....#`, `....#`, `####.`),
      T: KB(`#####`, `..#..`, `..#..`, `..#..`, `..#..`, `..#..`, `..#..`),
      U: KB(`#...#`, `#...#`, `#...#`, `#...#`, `#...#`, `#...#`, `.###.`),
      V: KB(`#...#`, `#...#`, `#...#`, `#...#`, `#...#`, `.#.#.`, `..#..`),
      W: KB(`#...#`, `#...#`, `#...#`, `#.#.#`, `#.#.#`, `#.#.#`, `.#.#.`),
      X: KB(`#...#`, `#...#`, `.#.#.`, `..#..`, `.#.#.`, `#...#`, `#...#`),
      Y: KB(`#...#`, `#...#`, `.#.#.`, `..#..`, `..#..`, `..#..`, `..#..`),
      Z: KB(`#####`, `....#`, `...#.`, `..#..`, `.#...`, `#....`, `#####`),
      0: KB(`.###.`, `#...#`, `#..##`, `#.#.#`, `##..#`, `#...#`, `.###.`),
      1: KB(`..#..`, `.##..`, `..#..`, `..#..`, `..#..`, `..#..`, `.###.`),
      2: KB(`.###.`, `#...#`, `....#`, `...#.`, `..#..`, `.#...`, `#####`),
      3: KB(`#####`, `...#.`, `..#..`, `...#.`, `....#`, `#...#`, `.###.`),
      4: KB(`...#.`, `..##.`, `.#.#.`, `#..#.`, `#####`, `...#.`, `...#.`),
      5: KB(`#####`, `#....`, `####.`, `....#`, `....#`, `#...#`, `.###.`),
      6: KB(`..##.`, `.#...`, `#....`, `####.`, `#...#`, `#...#`, `.###.`),
      7: KB(`#####`, `....#`, `...#.`, `..#..`, `.#...`, `.#...`, `.#...`),
      8: KB(`.###.`, `#...#`, `#...#`, `.###.`, `#...#`, `#...#`, `.###.`),
      9: KB(`.###.`, `#...#`, `#...#`, `.####`, `....#`, `...#.`, `.##..`),
      "!": KB(`#`, `#`, `#`, `#`, `#`, `.`, `#`),
      "?": KB(`.###.`, `#...#`, `....#`, `...#.`, `..#..`, `.....`, `..#..`),
      ".": KB(`.`, `.`, `.`, `.`, `.`, `.`, `#`),
      ",": KB(`..`, `..`, `..`, `..`, `..`, `.#`, `#.`),
      ":": KB(`.`, `#`, `.`, `.`, `.`, `#`, `.`),
      "'": KB(`#`, `#`),
      "-": KB(`....`, `....`, `....`, `####`),
      "+": KB(`.....`, `..#..`, `..#..`, `#####`, `..#..`, `..#..`),
      "(": KB(`..#`, `.#.`, `#..`, `#..`, `#..`, `.#.`, `..#`),
      ")": KB(`#..`, `.#.`, `..#`, `..#`, `..#`, `.#.`, `#..`),
      "•": KB(`...`, `...`, `.#.`, `###`, `.#.`),
      "→": KB(`.....`, `..#..`, `...#.`, `#####`, `...#.`, `..#..`),
      "↓": KB(`..#..`, `..#..`, `..#..`, `#.#.#`, `.###.`, `..#..`),
      "♥": KB(`.....`, `.#.#.`, `#####`, `#####`, `.###.`, `..#..`),
      m: KB(`.....`, `.....`, `##.#.`, `#.#.#`, `#.#.#`, `#.#.#`, `#.#.#`),
      e: KB(`.....`, `.....`, `.###.`, `#...#`, `#####`, `#....`, `.####`),
      s: KB(`.....`, `.....`, `.####`, `#....`, `.###.`, `....#`, `####.`),
      q: KB(
        `.....`,
        `.....`,
        `.####`,
        `#...#`,
        `#...#`,
        `#...#`,
        `.####`,
        `....#`,
        `....#`,
      ),
    },
  };
  function JB(e, t) {
    let n = [];
    for (let r of e)
      if (r === ` `)
        n.push({
          art: [],
          w: t.space,
        });
      else {
        let e = t.glyphs[r] ?? t.glyphs[r.toUpperCase()] ?? t.glyphs[`?`];
        n.push({
          art: e,
          w: Math.max(...e.map((e) => e.length)),
        });
      }
    let r = n.reduce((e, t) => e + t.w, 0) + t.gap * Math.max(0, n.length - 1),
      i = [];
    for (let e = 0; e < 9; e++) {
      let r = ``;
      (n.forEach((i, a) => {
        ((r += (i.art[e] ?? ``).padEnd(i.w, `.`)),
          a < n.length - 1 && (r += `.`.repeat(t.gap)));
      }),
        i.push(r));
    }
    let a = i.findIndex((e) => e.includes(`#`)),
      o = i.length - 1 - [...i].reverse().findIndex((e) => e.includes(`#`));
    return (
      a < 0 && (a = o = 0),
      {
        rows: i.slice(a, o + 1),
        width: r,
        height: o - a + 1,
      }
    );
  }
  function YB(e, t = qB) {
    let n = JB(e, t);
    return {
      width: n.width,
      height: n.height,
    };
  }
  var cne = [63, 6, 91, 79, 102, 109, 125, 7, 127, 111];
  function XB(e, t, n) {
    let r = (t - n) / 2,
      i = (t + n) / 2;
    return {
      w: e,
      h: t,
      s: n,
      rects: new Int16Array([
        0,
        0,
        e,
        n,
        e - n,
        0,
        n,
        i,
        e - n,
        r,
        n,
        i,
        0,
        t - n,
        e,
        n,
        0,
        r,
        n,
        i,
        0,
        0,
        n,
        i,
        0,
        r,
        e,
        n,
      ]),
    };
  }
  function ZB(e, t, n, r, i, a, o = 0) {
    let s = t >= 0 && t <= 9 ? cne[t] : 0,
      c = i.rects;
    for (let t = 0; t < 7; t++)
      s & (1 << t) &&
        e.block(n + c[t * 4], r + c[t * 4 + 1], c[t * 4 + 2], c[t * 4 + 3], a);
    for (let t = 0; t < o; t++)
      for (let a = 0; a < o - t; a++)
        (e.block(n + t, r + a, 1, 1, 0),
          e.block(n + i.w - 1 - t, r + a, 1, 1, 0),
          e.block(n + t, r + i.h - 1 - a, 1, 1, 0),
          e.block(n + i.w - 1 - t, r + i.h - 1 - a, 1, 1, 0));
  }
  var lne = (e) => typeof e.tick == `function`;
  function une(e) {
    let t = e.scrollCols ? 1 : (e.frames ?? 1),
      n = e.scrollCols ?? e.cols * t,
      r = new Uint8ClampedArray(n * e.rows * 4);
    for (let i = 0; i < t; i++) {
      let t = new PixelGrid(e.scrollCols ?? e.cols, e.rows);
      (e.draw(t, i), QB(t, r, n, i * e.cols));
    }
    return {
      data: r,
      width: n,
      height: e.rows,
    };
  }
  function QB(e, t, n, r) {
    for (let i = 0; i < e.rows; i++)
      for (let a = 0; a < e.cols; a++) {
        let o = e.cells[i * e.cols + a],
          s = (i * n + r + a) * 4;
        ((t[s] = (o >> 16) & 255),
          (t[s + 1] = (o >> 8) & 255),
          (t[s + 2] = o & 255),
          (t[s + 3] = 255));
      }
  }
  var $B = {
    R1: 0.84,
    R2: 1.15,
    O: 0.52,
    soft: 0.05,
  };
  var eV = {
    spread: 1.4,
    round: 1.25,
  };
  function tV(e, t = 1, n = 1) {
    if (e === `crescent`) return new Vector4(0, 0, 0, 2);
    if (e === `round`) {
      let e = eV.round;
      return new Vector4(e / 2, e / 2, 0.5 - e / 2, 1);
    }
    let r = Math.min(t, n * eV.spread),
      i = Math.min(n, t * eV.spread);
    return new Vector4(
      t / r / 2,
      n / i / 2,
      0,
      e === `none` ? 0 : e === `band` ? 3 : 1,
    );
  }
  var nV = (e, t) => smoothstep(t.negate(), t, e).oneMinus();
  var rV = {};
  var iV = [];
  function dne(e) {
    for (let t = 0; t < iV.length; t++) {
      let n = iV[t];
      n.draw.tick(e) &&
        (n.dots.cells.fill(0),
        n.draw(n.dots, 0),
        QB(n.dots, n.image.data, n.dots.cols, 0),
        n.ctx.putImageData(n.image, 0, 0),
        (n.tex.needsUpdate = !0));
    }
  }
  function aV(t) {
    let n = lne(t.draw) && !t.scrollCols ? t.draw : null,
      r = n ? 1 : (t.frames ?? 1),
      a = une(
        n
          ? {
              ...t,
              frames: 1,
            }
          : t,
      ),
      o = a.width,
      s = scope.element(`canvas`);
    ((s.width = o), (s.height = t.rows));
    let c = s.getContext(`2d`),
      l = typeof ImageData < `u` ? new ImageData(a.data, o, t.rows) : null;
    l && c.putImageData(l, 0, 0);
    let u = new CanvasTexture(s);
    ((u.colorSpace = SRGBColorSpace),
      (u.generateMipmaps = !1),
      (u.minFilter = LinearFilter),
      t.scrollCols && (u.wrapS = RepeatWrapping),
      n &&
        l &&
        iV.push({
          draw: n,
          dots: new PixelGrid(t.cols, t.rows),
          image: l,
          ctx: c,
          tex: u,
        }));
    let d = uniform(new Vector2(t.cols, t.rows)),
      f = uv().mul(d),
      p = floor(f).add(0.5).div(d),
      m = fract(f).sub(0.5),
      h = smoothstep(HB.dot.sub(0.16), HB.dot, length(m)).oneMinus(),
      g;
    if (t.scrollCols) {
      let e = floor(time.mul(uniform((t.scrollSpeed ?? 0.15) * o))).div(
        uniform(o),
      );
      g = vec2(fract(p.x.mul(uniform(t.cols / o)).add(e)), p.y);
    } else {
      let e = uniform(r),
        n = floor(mod(time.mul(uniform(t.fps ?? 2)), e));
      g = vec2(p.x.add(n).div(e), p.y);
    }
    let _ = texture(u, g).rgb,
      v = uniform(1),
      y = uniform(tV(`none`)),
      b = y.x.mul(uv().x).add(y.y.mul(uv().y.oneMinus())).add(y.z),
      x = fwidth(b).max(1e-5),
      S = mix(
        nV(abs(b.sub(0.2)).sub(0.05), x).add(
          nV(abs(b.sub(0.33)).sub(0.016), x),
        ),
        nV(abs(b.sub(0.24)).sub(0.07), x),
        step(2.5, y.w),
      ),
      C = uv().sub(0.5).mul(2),
      w = $B.O * Math.SQRT1_2,
      T = smoothstep($B.R1 - $B.soft, $B.R1, length(C)).oneMinus(),
      E = smoothstep($B.R2, $B.R2 + $B.soft, length(C.sub(vec2(w, -w)))),
      D = T.mul(E),
      ee = step(1.5, y.w).sub(step(2.5, y.w)),
      te = mix(S.mul(y.w.min(1)).mul(HB.glass), D.mul(HB.crescent), ee),
      O = new MeshStandardNodeMaterial({
        roughness: 0.5,
      }),
      ne = null;
    return (
      Object.defineProperty(O.userData, "exportMap", {
        enumerable: !1,
        configurable: !0,
        get: () => (ne ??= fne(a, t)),
      }),
      (O.userData.exportEmissive = !0),
      (O.colorNode = mix(
        vec3(0.02, 0.018, 0.04)
          .mul(h)
          .add(_.mul(h).mul(v.mul(0.7).add(0.3)).mul(0.6)),
        vec3(1, 1, 1),
        te,
      )),
      (O.emissiveNode = _.mul(h)
        .mul(v.mul(0.8).add(0.2))
        .mul(uniform(t.brightness ?? 1.5))
        .mul(HB.brightness)
        .mul(HB.night.mul(HB.nightBoost).add(1))
        .add(te.mul(HB.glassGlow))),
      {
        material: O,
        level: v,
        glass(e, t = 1, n = 1) {
          y.value.copy(tV(e, t, n));
        },
      }
    );
  }
  function fne(e, t) {
    let n = scope.element(`canvas`);
    ((n.width = t.cols * 16), (n.height = t.rows * 16));
    let r = n.getContext(`2d`);
    ((r.fillStyle = `#05040a`), r.fillRect(0, 0, n.width, n.height));
    for (let n = 0; n < t.rows; n++)
      for (let i = 0; i < t.cols; i++) {
        let t = (n * e.width + i) * 4;
        ((r.fillStyle =
          e.data[t] + e.data[t + 1] + e.data[t + 2] > 0
            ? `rgb(${e.data[t]},${e.data[t + 1]},${e.data[t + 2]})`
            : `#14111f`),
          r.beginPath(),
          r.arc(i * 16 + 8, n * 16 + 8, 6.08, 0, Math.PI * 2),
          r.fill());
      }
    let i = new CanvasTexture(n);
    return ((i.colorSpace = SRGBColorSpace), i);
  }
  var pne = [
    `..###......###..`,
    `.#####....#####.`,
    `#######..#######`,
    `################`,
    `################`,
    `################`,
    `.##############.`,
    `..############..`,
    `...##########...`,
    `....########....`,
    `.....######.....`,
    `......####......`,
    `.......##.......`,
  ];
  var oV = `..##....##..`;
  var mne = {
    smile: [
      [
        oV,
        oV,
        oV,
        `............`,
        `.#........#.`,
        `.##......##.`,
        `..########..`,
        `....####....`,
      ],
      [
        `............`,
        `............`,
        `.####..####.`,
        `............`,
        `.#........#.`,
        `.##......##.`,
        `..########..`,
        `....####....`,
      ],
    ],
  };
  var sV = 2;
  var cV = XB(6, 10, sV);
  var lV = XB(6, 14, 2);
  function hne() {
    try {
      let e = new Intl.DateTimeFormat(void 0, {
        hour: `numeric`,
      }).resolvedOptions().hourCycle;
      return e === `h11` || e === `h12`;
    } catch {
      return !1;
    }
  }
  var uV = 1 / 9;
  var gne = 8;
  var _ne = 16;
  function vne(e) {
    let t = UB(e.wall),
      n = UB(e.body),
      r = UB(e.head),
      i = UB(e.food),
      a = UB(e.dead),
      o = UB(e.won),
      s = 0,
      c = 0,
      l = 0,
      u = 0,
      d = 0,
      f = new Int16Array(),
      p = new Uint8Array(),
      m = new Int16Array(),
      h = new Int16Array(),
      g = new Uint32Array(),
      _ = 0,
      v = null,
      y = null,
      b = 0,
      x = 0,
      S = -1,
      C = 1,
      w = 0,
      T = 0,
      E = 0,
      D = !1,
      ee = -1,
      te = [0, 1, 0, -1],
      O = [-1, 0, 1, 0],
      ne = (e) => f[(b - e + l * 2) % l],
      re = (e, t) => {
        let n = (e % s) + te[t],
          r = ((e / s) | 0) + O[t];
        return n < 0 || r < 0 || n >= s || r >= c ? -1 : r * s + n;
      },
      ie = (e, t) => e >= 0 && (p[e] === 0 || e === t);
    function ae(e, t, n, r) {
      (_++, (g[e] = _), t >= 0 && (g[t] = _));
      let i = 0,
        a = 0;
      for (m[a++] = e; i < a && a < r;) {
        let e = m[i++];
        for (let t = 0; t < 4; t++) {
          let r = re(e, t);
          r >= 0 && g[r] !== _ && ie(r, n) && ((g[r] = _), (m[a++] = r));
        }
      }
      return a;
    }
    function oe(e) {
      if (S < 0) return -1;
      _++;
      let t = ne(0);
      g[t] = _;
      let n = 0,
        r = 0;
      for (m[r++] = t; n < r;) {
        let t = m[n++];
        if (t === S) break;
        for (let n = 0; n < 4; n++) {
          let i = re(t, n);
          i >= 0 &&
            g[i] !== _ &&
            ie(i, e) &&
            ((g[i] = _), (h[i] = t), (m[r++] = i));
        }
      }
      if (g[S] !== _) return -1;
      let i = S;
      for (; h[i] !== t;) i = h[i];
      return i;
    }
    function se() {
      let e = l - x;
      if (((S = -1), e <= 0)) return;
      let t = Math.floor(Math.random() * e);
      for (let e = 0; e < l; e++)
        if (!p[e] && t-- === 0) {
          S = e;
          return;
        }
    }
    function ce() {
      p.fill(0);
      let e = (c / 2) | 0;
      ((x = 4), (b = x - 1));
      for (let t = 0; t < x; t++) ((f[t] = e * s + 1 + t), (p[f[t]] = 1));
      ((C = 1), (E = 0), se());
    }
    function le(e) {
      (rV.snakeDie?.(e), (D = e), (w = 1), (T = 0));
    }
    function ue() {
      let e = ne(0),
        t = ne(x - 1),
        n = oe(t);
      if (
        (n >= 0 && ae(n, e, t, x + 2) < Math.min(x + 2, l - x) && (n = -1),
        n < 0)
      ) {
        let r = -1;
        for (let i = 0; i < 4; i++) {
          let a = (C + i) % 4,
            o = re(e, a);
          if (!ie(o, t)) continue;
          let s = ae(o, e, t, l);
          s > r && ((r = s), (n = o));
        }
      }
      if (n < 0) return le(!1);
      for (let t = 0; t < 4; t++) re(e, t) === n && (C = t);
      let r = n === S;
      if (
        (r ? x++ : (p[t] = 0),
        (b = (b + 1) % l),
        (f[b] = n),
        (p[n] = 1),
        (E = r ? 0 : E + 1),
        r)
      ) {
        if ((rV.snakeEat?.(), x >= l / 2)) return le(!0);
        se();
      } else E > l * 3 && le(!1);
    }
    function de() {
      (T++,
        w === 0
          ? ue()
          : w === 1 && T >= gne
            ? ((w = 2), (T = 0))
            : w === 2 && T >= _ne && ((w = 0), (T = 0), ce()));
    }
    function fe(e) {
      ((s = Math.floor((e.cols - 5) / 3)),
        (c = Math.floor((e.rows - 5) / 3)),
        (l = s * c),
        (u = (e.cols - (s * 3 - 1)) >> 1),
        (d = (e.rows - (c * 3 - 1)) >> 1),
        (f = new Int16Array(l)),
        (p = new Uint8Array(l)),
        (m = new Int16Array(l)),
        (h = new Int16Array(l)),
        (g = new Uint32Array(l)),
        (v = new PixelGrid(e.cols, e.rows)));
      let t = new PixelGrid(e.cols - 4, e.rows - 4);
      (vV.misprint(`HI!`)(t, 0),
        v.stamp(t, 2, 2),
        (y = new PixelGrid(e.cols, e.rows)));
      let n = new PixelGrid(e.cols, e.rows),
        r = Math.round((e.rows - 17) / 2);
      (n.text(`GAME`, e.cols / 2, r, `#ffffff`),
        n.text(`OVER`, e.cols / 2, r + 10, `#ffffff`),
        y.stamp(n, -1, 0, palette.cyan),
        y.stamp(n, 1, 0, palette.pink),
        y.stamp(n, 0, 0, `#ffffff`),
        ce());
    }
    return Object.assign(
      (e) => {
        if ((l || fe(e), w === 2)) {
          e.cells.set((D ? v : y).cells);
          return;
        }
        if (
          (e.block(u - 2, d - 2, s * 3 + 3, 1, t),
          e.block(u - 2, d + c * 3, s * 3 + 3, 1, t),
          e.block(u - 2, d - 1, 1, c * 3 + 1, t),
          e.block(u + s * 3, d - 1, 1, c * 3 + 1, t),
          w === 1 && (T >> 1) % 2 == 1)
        )
          return;
        w === 0 &&
          S >= 0 &&
          e.block(u + (S % s) * 3, d + ((S / s) | 0) * 3, 2, 2, i);
        let f = w === 1 ? (D ? o : a) : n;
        for (let t = x - 1; t >= 0; t--) {
          let n = ne(t),
            i = n % s,
            a = (n / s) | 0;
          if (
            (e.block(u + i * 3, d + a * 3, 2, 2, t === 0 && w === 0 ? r : f),
            t === 0)
          )
            continue;
          let o = ne(t - 1),
            c = o % s,
            l = (o / s) | 0;
          l === a
            ? e.block(u + Math.min(i, c) * 3 + 2, d + a * 3, 1, 2, f)
            : e.block(u + i * 3, d + Math.min(a, l) * 3 + 2, 2, 1, f);
        }
      },
      {
        tick(e) {
          if (!l) return !1;
          (ee < 0 || e - ee > 1 || e < ee) && (ee = e);
          let t = !1;
          for (let n = 0; n < 3 && e - ee >= uV; n++)
            ((ee += uV), de(), (t = !0));
          return (e - ee >= uV && (ee = e), t);
        },
      },
    );
  }
  var yne = `#ff6b61`;
  var dV = 1 / 60;
  var bne = 8;
  var xne = 28;
  var Sne = 1.07;
  var Cne = 54;
  var wne = 30;
  var fV = 5;
  var pV = {
    slow: 15,
    fast: 40,
    ramp: [0.1, 0.4],
  };
  var mV = 6;
  var hV = {
    serve: 0.9,
    goal: 0.6,
    score: 1.8,
    win: 3.2,
    reset: 1.2,
  };
  var gV = Math.PI / 180;
  var Tne = [
    `#...#.#.#...#`,
    `#...#.#.#...#`,
    `#...#.#.##..#`,
    `#.#.#.#.#.#.#`,
    `#.#.#.#.#..##`,
    `#.#.#.#.#...#`,
    `.#.#..#.#...#`,
  ];
  function Ene(e, t) {
    let n = [UB(e.top), UB(e.bottom)],
      r = UB(e.ball),
      i = bne,
      a = 0,
      o = 0,
      s = 0,
      c = new Float64Array(2),
      l = new Float64Array(2),
      u = new Float64Array(2),
      d = new Int32Array(2),
      f = 0,
      p = 0,
      m = 0,
      h = 0,
      g = 0,
      _ = 0,
      v = 0,
      y = 0,
      b = 0,
      x = 0,
      S = -1,
      C = 0,
      w = NaN,
      T = NaN,
      E = [!1, !1],
      D = 0,
      ee = 0,
      te = mV,
      O = !1,
      ne = new Int32Array(2),
      re = [],
      ie = [],
      ae = [],
      oe = (e) => (e === 0 ? 3 : s - 5),
      se = (e, t, n) => (e < t ? t : e > n ? n : e);
    function ce(e) {
      let t = a - 4,
        n = Math.floor(e / t),
        r = e - n * t;
      return 1 + (n & 1 ? t - r : r);
    }
    let le = (e) => f - 1 + (m * (e - p)) / h,
      ue = (e) => ce(le(oe(e))) + 1,
      de = (e) => e >= 5 && e <= a - i / 2 - 1;
    function fe(e) {
      let t = Math.round(p),
        n = e === 0 ? 1 : s - 3;
      if (t + 2 <= n || t >= n + 2) return !1;
      let r = Math.round(f),
        a = Math.round(c[e] - i / 2);
      return r + 2 > a && r < a + i;
    }
    function pe(e) {
      let t = (Math.random() * 2 - 1) * (i / 2 - 0.5);
      if (Math.random() >= Math.min(0.5, 0.08 + _ * 0.06)) {
        u[e] = t;
        return;
      }
      let n = oe(e),
        r = le(n),
        o = le(n + (e === 0 ? -4 : 4)),
        s = a - 4,
        c = Math.floor(r / s),
        l = Math.floor(o / s),
        d = Math.min(ce(r), ce(o)),
        f = Math.max(ce(r), ce(o));
      if (c !== l) {
        let e = Math.max(c, l) & 1 ? a - 3 : 1;
        ((d = Math.min(d, e)), (f = Math.max(f, e)));
      }
      let p = 1.25 + Math.random() * 1.75,
        h = d - p - i / 2,
        g = f + 2 + p + i / 2,
        v = m >= 0 == !(c & 1),
        y = v ? h : g,
        b = v ? g : h,
        x = ue(e);
      u[e] = de(y) ? y - x : de(b) ? b - x : t;
    }
    let me = () => E[0] || E[1] || te < mV;
    function he() {
      let e = v === 1 || v === 0 ? f + 1 : a / 2;
      for (let t = 0; t < 2; t++) {
        let n,
          r = 20;
        if (t === 1 && me()) {
          let e = E[0] && E[1] ? D : E[0] ? -1 : +!!E[1],
            t = se((ee - pV.ramp[0]) / (pV.ramp[1] - pV.ramp[0]), 0, 1);
          ((n = e * (pV.slow + (pV.fast - pV.slow) * t * t * (3 - 2 * t))),
            (r = e ? 30 : 45));
        } else {
          let r;
          if (v === 1 && (t === 0 ? h < 0 : h > 0)) {
            let n = se((s * 0.8 - Math.abs(oe(t) - p)) / (s * 0.5), 0, 1);
            r = (t === 0 ? p < oe(0) : p > oe(1))
              ? c[t]
              : e + (ue(t) + u[t] - e) * n * n * (3 - 2 * n);
          } else
            r = a / 2 + (e - a / 2) * 0.3 + Math.sin(b * 1.3 + t * 2.1) * 2;
          let i = r - c[t];
          n = Math.abs(i) < 0.25 ? 0 : se(i * 5, -30, wne);
        }
        l[t] += (n - l[t]) * Math.min(1, dV * r);
        let o = c[t];
        ((c[t] = se(c[t] + l[t] * dV, 5, a - i / 2 - 1)),
          t === 1 &&
            me() &&
            (c[1] === 5 ? l[1] < 0 : c[1] === a - i / 2 - 1 && l[1] > 0) &&
            (l[1] = 0),
          v === 1 && fe(t) && ((c[t] = o), (l[t] = 0)));
      }
    }
    function ge() {
      let e = (12 + Math.random() * 28) * (Math.random() < 0.5 ? -1 : 1) * gV;
      ((g = xne),
        (m = g * Math.sin(e)),
        (h = g * Math.cos(e) * (x === 0 ? 1 : -1)),
        (_ = 0),
        (v = 1),
        (y = 0),
        pe(1 - x),
        rV.pongHit?.(x === 0 ? `top` : `bottom`));
    }
    function _e(e) {
      let t = Math.round(f),
        n = Math.round(c[e] - i / 2);
      if (t + 2 <= n || t >= n + i) return;
      p = 2 * oe(e) - p;
      let r =
        (se((f + 1 - c[e]) / 5, -1, 1) * 52 + (Math.random() - 0.5) * 8) * gV;
      ((g = Math.min(Cne, g * Sne)),
        (m = g * Math.sin(r)),
        (h = g * Math.cos(r) * (e === 0 ? 1 : -1)),
        _++,
        pe(1 - e),
        rV.pongHit?.(e === 0 ? `top` : `bottom`));
    }
    function ve(e) {
      let t = Math.round(c[e] - i / 2),
        n = f + 1 < c[e],
        r = n ? t - 2 : t + i;
      r < 1 ||
        r > a - 3 ||
        ((f = r),
        (m = n ? -Math.abs(m) : Math.abs(m)),
        rV.pongHit?.(e === 0 ? `top` : `bottom`));
    }
    function ye() {
      let e = p;
      if (
        ((f += m * dV),
        (p += h * dV),
        (f < 1 || f > a - 3) &&
          ((f = f < 1 ? 2 - f : 2 * (a - 3) - f),
          (m = -m),
          (p < o || p + 2 > o + t) && rV.pongHit?.(`wall`)),
        h < 0 && e >= oe(0) && p < oe(0)
          ? _e(0)
          : h > 0 && e <= oe(1) && p > oe(1) && _e(1),
        fe(0) ? ve(0) : fe(1) && ve(1),
        p <= -2 || p >= s)
      ) {
        let e = +(p < 0);
        ((S = e),
          (x = 1 - e),
          (C = f + 1),
          d[e]++,
          (v = 2),
          (y = 0),
          rV.pongGoal?.(e === 0 ? `top` : `bottom`, d[e] >= fV));
      }
    }
    function be() {
      ((b += dV),
        (y += dV),
        E[0] || E[1] ? (ee += dV) : (te += dV),
        O && (v === 0 || v === 1) && ((d[0] = d[1] = 0), (O = !1)),
        he(),
        v === 0
          ? ((f = se(c[x] - 1, 1, a - 3)), (p = oe(x)), y >= hV.serve && ge())
          : v === 1
            ? ye()
            : v === 2 && y >= hV.goal
              ? ((v = 3), (y = 0))
              : v === 3 && y >= (S < 0 ? hV.reset : hV.score)
                ? ((v = S >= 0 && d[S] >= fV ? 4 : 0), (y = 0))
                : v === 4 &&
                  y >= hV.win &&
                  ((d[0] = d[1] = 0), (S = -1), (v = 3), (y = 0)));
    }
    function xe(e) {
      if (e !== T) {
        ((T = e), (!(e - w <= 1) || e < w) && (w = e - dV / 2));
        for (let t = 0; t < 8 && e - w >= dV; t++) ((w += dV), be());
        e - w >= dV && (w = e - dV / 2);
      }
    }
    function Se(e, s) {
      if (v === 4 && e === S) {
        y % 0.5 < 0.36 && s.cells.set(ae[e].cells);
        return;
      }
      if (v === 3 || v === 4) {
        if (v === 3 && e === S && y < 0.9 && y % 0.3 >= 0.15) return;
        let t = d[e],
          r = Math.round((s.rows - cV.h) / 2);
        if (t === 1) {
          let t = Math.round((s.cols - sV) / 2);
          (s.block(t, r, sV, cV.h, n[e]),
            s.block(t, r, 1, 1, 0),
            s.block(t + sV - 1, r, 1, 1, 0),
            s.block(t, r + cV.h - 1, 1, 1, 0),
            s.block(t + sV - 1, r + cV.h - 1, 1, 1, 0));
        } else ZB(s, t, Math.round((s.cols - cV.w) / 2), r, cV, n[e], 1);
        return;
      }
      let l = v === 2 && e !== S;
      if (l) {
        let t = e === 0 ? -0.5 : o + 0.5,
          r = 1 + y * 40,
          i = n[S];
        for (let e = 0; e < o; e++)
          for (let n = 0; n < a; n++) {
            let o = Math.sqrt((n + 0.5 - C) ** 2 + (e + 0.5 - t) ** 2);
            (Math.abs(o - r) < 1 || Math.abs(o - r + 7) < 0.6) &&
              (s.cells[e * a + n] = i);
          }
      }
      ((!l || y % 0.2 < 0.1) &&
        s.block(Math.round(c[e] - i / 2), e === 0 ? 1 : o - 3, i, 2, n[e]),
        (v === 1 || (v === 0 && y % 0.3 < 0.18)) &&
          s.block(
            Math.round(f),
            Math.round(p) - (e === 0 ? 0 : o + t),
            2,
            2,
            r,
          ));
    }
    function Ce(n) {
      ((a = n.cols), (o = n.rows), (s = 2 * o + t), (c[0] = c[1] = a / 2));
      for (let t = 0; t < 2; t++) {
        (re.push(new PixelGrid(a, o)), ie.push(new PixelGrid(a, o)));
        let n = new PixelGrid(a, o);
        (n.bitmap(
          Tne,
          Math.round((a - 26) / 2),
          Math.round((o - 14) / 2),
          t === 0 ? e.top : e.bottom,
          2,
        ),
          ae.push(n));
      }
      ((f = se(c[x] - 1, 1, a - 3)), (p = oe(x)));
    }
    let we = (e) =>
      Object.assign(
        (t) => {
          (a || Ce(t), Se(e, t));
        },
        {
          tick(t) {
            if (!a) return !1;
            xe(t);
            let n = ie[e];
            (n.cells.fill(0), Se(e, n));
            let r = re[e].cells,
              i = n.cells,
              o = 0;
            for (; o < i.length && r[o] === i[o];) o++;
            return o !== i.length && ((ie[e] = re[e]), (re[e] = n), !0);
          },
        },
      );
    return {
      top: we(0),
      bottom: we(1),
      input: {
        hold(e, t) {
          let n = e < 0 ? 0 : 1;
          (t && !me() && ((O = !0), ne.set(d)),
            t && D !== e && ((D = e), (ee = 0)),
            E[n] !== t && ((E[n] = t), (ee = 0), (te = 0)));
        },
        drop() {
          ((E[0] = E[1] = !1),
            (te = mV),
            (O = !1),
            (v === 0 || v === 1) && d.set(ne));
        },
        get playing() {
          return me();
        },
      },
    };
  }
  var Dne = [
    `###......###`,
    `.###....###.`,
    `..###..###..`,
    `...######...`,
    `....####....`,
    `.....##.....`,
  ];
  var _V = [1, 2, 3, 3, 3];
  var vV = {
    chevrons:
      (e = palette.lime) =>
      (t, n) => {
        for (let r = 0; r < _V[n % _V.length]; r++)
          t.bitmap(Dne, Math.round((t.cols - 12) / 2), 3 + r * 5, e);
      },
    heart:
      (e = palette.lime) =>
      (t) =>
        t.bitmap(
          pne,
          Math.round((t.cols - 16) / 2),
          Math.round((t.rows - 13) / 2) + 1,
          e,
        ),
    face:
      (e, t, n = 0) =>
      (r, i) => {
        let a = r.cols / 2,
          o = r.rows / 2,
          s = Math.min(r.cols, r.rows) / 2 - 0.5 - n;
        (r.disc(a, o, s, e), r.disc(a, o, s - 2, null));
        let c = mne[t];
        r.bitmap(c[i % c.length], Math.round(a - 6), Math.round(o - 4), e);
      },
    pong: (e = {}) => {
      let t = {
        top: e.top ?? palette.lime,
        bottom: e.bottom ?? yne,
        ball: e.ball ?? palette.cream,
      };
      return {
        ...Ene(t, e.gap ?? 10),
        colors: t,
      };
    },
    noEntry:
      (e = palette.red, t = `#d9d3ea`) =>
      (n, r) => {
        let i = n.cols / 2,
          a = n.rows / 2,
          o = Math.min(n.cols, n.rows) * 0.47;
        r ? n.ring(i, a, o * 0.74, o, e) : n.disc(i, a, o, e);
        let s = (e, t) => e + ((e + t) % 2),
          c = s(Math.max(3, Math.round(n.rows * 0.2)), n.rows),
          l = s(Math.round(n.cols * 0.62), n.cols);
        n.block((n.cols - l) / 2, (n.rows - c) / 2, l, c, UB(t));
      },
    lamp: (e, t) => (n, r) => {
      (r === 0) === t &&
        n.disc(n.cols / 2, n.rows / 2, Math.min(n.cols, n.rows) * 0.47, e);
    },
    words:
      (e, t, n = 2) =>
      (r) => {
        let i = e.length * 7 + (e.length - 1) * n,
          a = Math.round((r.rows - i) / 2);
        for (let i of e) (r.text(i, r.cols / 2, a, t), (a += 7 + n));
      },
    liveClock: (e) => {
      let t = UB(e),
        n = hne(),
        r = new Date(),
        i = -1,
        a = -1,
        o = !1,
        s = -1,
        c = (e) => {
          let r = Math.round((e.rows - lV.h) / 2),
            s = n ? i % 12 || 12 : i,
            c = n && s < 10 ? -1 : (s / 10) | 0,
            l = (c < 0 ? s : c) === 1 ? lV.w - lV.s : 0,
            u = Math.round((e.cols - (c < 0 ? 25 : 32) + l) / 2) - l;
          (c >= 0 && (ZB(e, c, u, r, lV, t), (u += 7)),
            ZB(e, s % 10, u, r, lV, t),
            (u += 8),
            o && (e.block(u, r + 3, 2, 2, t), e.block(u + 0, r + 9, 2, 2, t)),
            (u += 4),
            ZB(e, (a / 10) | 0, u, r, lV, t),
            ZB(e, a % 10, u + 7, r, lV, t));
        },
        l = (e) => {
          if (e < s && s - e < 1) return !1;
          r.setTime(Date.now());
          let t = r.getMilliseconds();
          s = e + (500 - (t % 500)) / 1e3;
          let n = r.getHours(),
            c = r.getMinutes(),
            l = t < 500;
          return n === i && c === a && l === o
            ? !1
            : ((i = n), (a = c), (o = l), !0);
        };
      return (
        l(-1),
        Object.assign(c, {
          tick: l,
        })
      );
    },
    snake: (e) =>
      vne({
        wall: palette.purple,
        body: palette.lime,
        head: palette.yellow,
        food: palette.pink,
        dead: palette.red,
        won: palette.yellow,
        ...e,
      }),
    marquee: (e, t) => {
      let n = YB(e).width,
        r = n + qB.space + 2 * qB.gap;
      return Object.assign(
        (i) => {
          let a = Math.round((i.rows - 7) / 2);
          t.forEach((t, o) => i.text(e, o * r + n / 2, a, t));
        },
        {
          cols: r * t.length,
        },
      );
    },
    misprint:
      (e, t = `#ffffff`, n = [palette.cyan, palette.pink]) =>
      (r) => {
        let i = YB(e),
          a = Math.max(
            1,
            Math.min(
              Math.floor((r.cols - 2) / i.width),
              Math.floor(r.rows / i.height),
            ),
          ),
          o = new PixelGrid(i.width * a, i.height * a);
        o.text(e, o.cols / 2, 0, `#ffffff`, qB, a);
        let s = Math.round((r.cols - o.cols) / 2),
          c = Math.round((r.rows - o.rows) / 2);
        (r.stamp(o, s - 1, c, n[0]),
          r.stamp(o, s + 1, c, n[1]),
          r.stamp(o, s, c, t));
      },
  };
  var yV = `#7462f4`;
  function bV(e, t) {
    let n = t * 0.235,
      r = Math.sqrt(3) / 2,
      i = e / 2 - n * 1.25,
      a = {
        x: i + n * r,
        y: t / 2,
      };
    return {
      r: n,
      A: {
        x: i,
        y: a.y - n * 1.5,
      },
      B: {
        x: i,
        y: a.y + n * 1.5,
      },
      C: {
        x: a.x + n * Math.sqrt(3),
        y: a.y,
      },
      c: a,
      T: {
        x: a.x,
        y: a.y - n,
      },
      UR: {
        x: a.x + n * r,
        y: a.y - n / 2,
      },
      LR: {
        x: a.x + n * r,
        y: a.y + n / 2,
      },
      Bm: {
        x: a.x,
        y: a.y + n,
      },
      LL: {
        x: i,
        y: a.y + n / 2,
      },
      UL: {
        x: i,
        y: a.y - n / 2,
      },
    };
  }
  function One(e, t, n) {
    let { A: r, B: i, C: a, r: o } = bV(t, n),
      s = o * 0.22;
    (e.beginPath(),
      e.moveTo((r.x + i.x) / 2, (r.y + i.y) / 2),
      e.arcTo(i.x, i.y, a.x, a.y, s),
      e.arcTo(a.x, a.y, r.x, r.y, s),
      e.arcTo(r.x, r.y, i.x, i.y, s),
      e.closePath());
  }
  function kne(e, t, n, r) {
    let { c: i, T: a, UR: o, LR: s, Bm: c, LL: l, UL: u, r: d } = bV(t, n);
    (e.save(),
      (e.strokeStyle = r),
      (e.lineWidth = d * 0.16),
      (e.lineCap = `butt`),
      (e.lineJoin = `miter`),
      e.beginPath(),
      e.moveTo(u.x - d, u.y + d * 0.577),
      e.lineTo(a.x, a.y),
      e.moveTo(l.x - d, l.y - d * 0.577),
      e.lineTo(c.x, c.y),
      e.moveTo(o.x, o.y - d),
      e.lineTo(s.x, s.y + d),
      e.moveTo(i.x, i.y),
      e.lineTo(u.x - d * 0.1, u.y - d * 0.058),
      e.moveTo(i.x, i.y),
      e.lineTo(o.x, o.y),
      e.moveTo(i.x, i.y),
      e.lineTo(c.x, c.y),
      e.stroke(),
      e.restore());
  }
  function Ane(e, t, n, r, i) {
    let a = n * 0.24;
    (e.save(),
      (e.fillStyle = i),
      (e.textBaseline = `middle`),
      (e.textAlign = `left`));
    let o = `three.js`,
      s = `journey`,
      c = a * 0.28;
    e.font = r(a, 800);
    let l = e.measureText(o).width;
    e.font = r(a, 600);
    let u = e.measureText(s).width,
      d = Math.min(1, (t * 0.76) / (l + c + u)),
      f = t / 2 - ((l + c + u) * d) / 2;
    (e.translate(f, n * 0.52),
      e.scale(d, d),
      (e.font = r(a, 800)),
      e.fillText(o, 0, 0),
      (e.font = r(a, 600)),
      e.fillText(s, l + c, 0),
      e.restore());
  }
  var xV = 256;
  var SV = 8;
  var CV = 7;
  var wV = 16;
  var TV = (e, t = `sans`) =>
    t === `sans`
      ? `800 ${e}px Manrope, system-ui, sans-serif`
      : `700 ${e}px "IBM Plex Mono", ui-monospace, monospace`;
  var EV = (e, t, n) => {
    (e.beginPath(),
      e.arc(t / 2, n / 2, Math.min(t, n) / 2 - wV - 4, 0, Math.PI * 2));
  };
  var DV = (e, t, n) => {
    (e.beginPath(), e.roundRect(22, n * 0.24, t - 44, n * 0.52, n * 0.26));
  };
  var OV =
    (e = 18) =>
    (t, n, r) => {
      (t.beginPath(), t.roundRect(22, r * 0.2, n - 44, r * 0.6, e));
    };
  var kV = (e, t, n) => {
    (e.beginPath(), e.roundRect(30, 30, t - 60, n - 60, 28));
  };
  var AV = (e) => (t, n, r) => {
    (t.beginPath(),
      e.forEach(([e, i], a) =>
        a ? t.lineTo(e * n, i * r) : t.moveTo(e * n, i * r),
      ),
      t.closePath());
  };
  var jV = (e, t) => (n, r, i) => {
    n.beginPath();
    let a = Math.min(r, i) / 2 - wV - 6;
    for (let o = 0; o < e * 2; o++) {
      let s = (o / (e * 2)) * Math.PI * 2 - Math.PI / 2,
        c = o % 2 ? a * t : a,
        l = r / 2 + Math.cos(s) * c,
        u = i / 2 + Math.sin(s) * c;
      o ? n.lineTo(l, u) : n.moveTo(l, u);
    }
    n.closePath();
  };
  var MV = (e, t, n) => {
    (e.beginPath(),
      e.moveTo(t * 0.5, n * 0.86),
      e.bezierCurveTo(t * 0.02, n * 0.56, t * 0.16, n * 0.08, t * 0.5, n * 0.3),
      e.bezierCurveTo(
        t * 0.84,
        n * 0.08,
        t * 0.98,
        n * 0.56,
        t * 0.5,
        n * 0.86,
      ),
      e.closePath());
  };
  function NV(e, t = 9) {
    ((e.strokeStyle = inkPurple),
      (e.lineWidth = t),
      (e.lineCap = `round`),
      (e.lineJoin = `round`));
  }
  function PV(e, t, n, r, i, a, o = `sans`) {
    ((e.fillStyle = a),
      (e.font = TV(i, o)),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      e.fillText(t, n, r));
  }
  function FV(e, t, n, r = 0.44, i = 0.13, a = 0.045) {
    e.fillStyle = inkPurple;
    for (let o of [-1, 1])
      (e.beginPath(),
        e.arc(t * (0.5 + o * i), n * r, t * a, 0, Math.PI * 2),
        e.fill());
  }
  function IV(e, t, n, r = 0.42) {
    NV(e, 11);
    for (let i of [-1, 1]) {
      let a = t * (0.5 + i * 0.14),
        o = n * r,
        s = t * 0.055;
      (e.beginPath(),
        e.moveTo(a - s, o - s),
        e.lineTo(a + s, o + s),
        e.moveTo(a + s, o - s),
        e.lineTo(a - s, o + s),
        e.stroke());
    }
  }
  var LV = {
    x0: 0.2,
    x1: 0.6,
    y0: 0.27,
    y1: 0.81,
  };
  var RV = {
    x0: 0.17,
    x1: 0.63,
    h: 0.07,
  };
  var zV = {
    x0: 0.58,
    x1: 0.86,
    y0: 0.38,
    y1: 0.66,
    tip: 0.54,
  };
  function BV(e, t, n) {
    (e.beginPath(),
      e.roundRect(
        t * RV.x0,
        n * (LV.y0 - RV.h),
        t * (RV.x1 - RV.x0),
        n * (LV.y1 - LV.y0 + 2 * RV.h),
        t * 0.05,
      ),
      e.roundRect(t * 0.33, n * 0.12, t * 0.14, n * 0.12, t * 0.025),
      e.moveTo(t * zV.x0, n * zV.y0),
      e.lineTo(t * (zV.x1 - 0.06), n * zV.y0),
      e.quadraticCurveTo(t * zV.x1, n * zV.y0, t * zV.x1, n * (zV.y0 + 0.06)),
      e.lineTo(t * zV.x1, n * zV.tip),
      e.lineTo(t * (zV.x1 - 0.1), n * zV.y1),
      e.lineTo(t * zV.x0, n * zV.y1),
      e.closePath());
  }
  function VV(e, t, n) {
    let r = t * LV.x0,
      i = t * (LV.x1 - LV.x0);
    ((e.fillStyle = inkPurple),
      e.fillRect(t * zV.x0, 0, t * (1 - zV.x0), n),
      (e.fillStyle = palette.cream));
    for (let r = t * 0.66; r < t * 0.82; r += t * 0.065)
      (e.fillRect(r, n * (zV.y0 + 0.03), t * 0.035, n * 0.04),
        e.fillRect(r, n * (zV.y1 - 0.07), t * 0.035, n * 0.04));
    ((e.fillStyle = palette.yellow),
      e.fillRect(r, n * LV.y0, i, n * (LV.y1 - LV.y0)),
      (e.fillStyle = palette.orange),
      e.fillRect(r + i * 0.74, n * LV.y0, i * 0.26, n * (LV.y1 - LV.y0)),
      (e.fillStyle = `rgba(255, 255, 255, 0.55)`),
      e.fillRect(r + i * 0.12, n * LV.y0, i * 0.1, n * (LV.y1 - LV.y0)));
    let a = n * 0.43,
      o = n * 0.24;
    ((e.fillStyle = inkPurple),
      e.fillRect(r, a, i, o),
      PV(e, `400`, r + i / 2, a + o * 0.6, 50, palette.yellow),
      PV(e, `ISO`, r + i / 2, a + o * 0.16, 17, paperWhite, `mono`),
      (e.fillStyle = palette.cream),
      e.fillRect(t * RV.x0, n * (LV.y0 - RV.h), t * (RV.x1 - RV.x0), n * RV.h),
      e.fillRect(t * RV.x0, n * LV.y1, t * (RV.x1 - RV.x0), n * RV.h),
      e.fillRect(t * 0.33, n * 0.12, t * 0.14, n * 0.12),
      NV(e, 6),
      e.beginPath(),
      e.moveTo(t * RV.x0, n * LV.y0),
      e.lineTo(t * RV.x1, n * LV.y0),
      e.moveTo(t * RV.x0, n * LV.y1),
      e.lineTo(t * RV.x1, n * LV.y1),
      e.moveTo(t * 0.33, n * (LV.y0 - RV.h)),
      e.lineTo(t * 0.47, n * (LV.y0 - RV.h)),
      e.stroke(),
      NV(e, 7),
      e.beginPath(),
      e.moveTo(r + i, n * zV.y0),
      e.lineTo(r + i, n * LV.y0),
      e.moveTo(r + i, n * zV.y1),
      e.lineTo(r + i, n * LV.y1),
      e.stroke());
  }
  function HV(e, t, n, r, i) {
    (e.save(),
      e.beginPath(),
      e.arc(t, n, r, 0, Math.PI * 2),
      e.clip(),
      (e.fillStyle = `#c7b9ff`),
      e.fillRect(t - r, n - r, r * 2, r * 2),
      (e.fillStyle = `#f1edff`),
      e.beginPath(),
      e.arc(t - r * 0.14, n - r * 0.14, r * 0.92, 0, Math.PI * 2),
      e.fill(),
      e.restore(),
      (e.fillStyle = palette.hotPink));
    for (let i of [-1, 1]) {
      let a = t + i * r * 0.34,
        o = n - r * 0.34,
        s = r * 0.2;
      (e.beginPath(),
        e.moveTo(a, o + s * 0.9),
        e.bezierCurveTo(
          a - s * 1.3,
          o + s * 0.1,
          a - s * 0.7,
          o - s * 0.9,
          a,
          o - s * 0.25,
        ),
        e.bezierCurveTo(
          a + s * 0.7,
          o - s * 0.9,
          a + s * 1.3,
          o + s * 0.1,
          a,
          o + s * 0.9,
        ),
        e.fill());
    }
    (NV(e, i),
      e.beginPath(),
      e.arc(t, n - r * 0.1, r * 0.15, 0.15 * Math.PI, 0.85 * Math.PI),
      e.stroke());
  }
  return {
    PixelGrid,
    YB,
    rV,
    dne,
    aV,
    vV,
    yV,
    One,
    kne,
    Ane,
    xV,
    SV,
    CV,
    wV,
    TV,
    EV,
    DV,
    OV,
    kV,
    AV,
    jV,
    MV,
    NV,
    PV,
    FV,
    IV,
    BV,
    VV,
    HV,
  };
}
