// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
export function createSlotMachineModule(
  scope,
  { paletteModule, dialogueModule, ledPixelsModule, projectDataModule },
) {
  const { palette } = paletteModule;
  const { WB } = dialogueModule;
  const { PixelGrid, rV } = ledPixelsModule;
  const { SY, CY } = projectDataModule;
  var wY = {
    gameboy: {
      art: [
        `gggggggggg`,
        `g........g`,
        `g.ssssss.g`,
        `g.ssssss.g`,
        `g.ssssss.g`,
        `g.ssssss.g`,
        `g........g`,
        `gggggggggg`,
        `gg.ggggggg`,
        `g...gggppg`,
        `gg.ggppggg`,
        `ggggggggg.`,
        `gggg.g.gg.`,
        `gggggggg..`,
      ],
      pal: {
        g: `#d6d8e4`,
        s: palette.lime,
        p: palette.hotPink,
      },
    },
    tree: {
      art: [
        `.....llgg.....`,
        `...llllgggg...`,
        `..lllgggggGg..`,
        `.llgggggggGGg.`,
        `.lggggg.ggGGg.`,
        `lgggggggggGGGg`,
        `lggg.gwwgggGGg`,
        `.gggggkwggGGg.`,
        `..gg.gwwg.Gg..`,
        `......wk......`,
        `......kw......`,
        `......ww......`,
        `......wk......`,
        `.....wwww.....`,
      ],
      pal: {
        g: `#4cc44a`,
        G: `#1f8f4a`,
        l: `#b6f04a`,
        w: CY,
        k: `#3a3550`,
      },
    },
    ghost: {
      art: [
        `....cccc....`,
        `..cccccccc..`,
        `.cccccccccc.`,
        `.cccccccccc.`,
        `cccccccccccc`,
        `ccc.cccc.ccc`,
        `ccc.cccc.ccc`,
        `ccpccccccpcc`,
        `cccccccccccc`,
        `cccccccccccc`,
        `ccc.cccc.ccc`,
        `.c...cc...c.`,
      ],
      pal: {
        c: palette.cream,
        p: palette.pink,
      },
    },
    kiwi: {
      art: [
        `.....oooo.....`,
        `...ooggggoo...`,
        `..oggggggggo..`,
        `.oggg.ll.gggo.`,
        `.oggllllllggo.`,
        `ogg.llkkll.ggo`,
        `oggllkkkkllggo`,
        `oggllkkkkllggo`,
        `ogg.llkkll.ggo`,
        `.oggllllllggo.`,
        `.oggg.ll.gggo.`,
        `..oggggggggo..`,
        `...ooggggoo...`,
        `.....oooo.....`,
      ],
      pal: {
        o: `#8a5a24`,
        g: `#5fc832`,
        l: `#a8ec50`,
        k: palette.cream,
      },
    },
    mushroom: {
      art: [
        `.....rrrr.....`,
        `...rrwwwwrr...`,
        `..rrwwwwwwrr..`,
        `.rrrwwwwwwrrr.`,
        `.wwrrwwwwrrww.`,
        `wwwwrrrrrrwwww`,
        `wwwwrrrrrrwwww`,
        `rwwrrrrrrrrwwr`,
        `rrrrrrrrrrrrrr`,
        `.rrrrrrrrrrrr.`,
        `...cc.cc.cc...`,
        `...cc.cc.cc...`,
        `...cccccccc...`,
        `....cccccc....`,
      ],
      pal: {
        r: palette.red,
        w: CY,
        c: `#ffdca8`,
      },
    },
    star: {
      art: [
        `......oo......`,
        `.....oyyo.....`,
        `.....oyyo.....`,
        `....oywyyo....`,
        `ooooowyyyyoooo`,
        `oyyyyyyyyyyyyo`,
        `.oyyy.yy.yyyo.`,
        `..oyy.yy.yyo..`,
        `...oyyyyyyo...`,
        `...oyyyyyyo...`,
        `..oyyyyyyyyo..`,
        `..oyyyooyyyo..`,
        `.oyyoo..ooyyo.`,
        `.ooo......ooo.`,
      ],
      pal: {
        y: palette.yellow,
        o: palette.orange,
        w: CY,
      },
    },
    cherries: {
      art: [
        `......ggLLL...`,
        `.....g.gLLLL..`,
        `.....g..g.LL..`,
        `....g...g.....`,
        `....g....g....`,
        `...g.....g....`,
        `.mm.mm..mm.mm.`,
        `mwmmmm.mwmmmmm`,
        `mwmmmm.mwmmmmm`,
        `mmmmmm.mmmmmmm`,
        `mmmmMm.mmmmmMm`,
        `.mmMm..mmmmMm.`,
        `..mm....mMMm..`,
      ],
      pal: {
        m: `#ff2e7e`,
        M: `#a8104e`,
        w: CY,
        g: `#22c27a`,
        L: `#8cf03c`,
      },
    },
    bird: {
      art: [
        `......yy......`,
        `.....yyyy.....`,
        `...pppppppp...`,
        `..pppppppppp..`,
        `..PPPPPPPPPP..`,
        `.wwwwwwwwwwww.`,
        `.wwww.ww.wwww.`,
        `swwww.ww.wwwws`,
        `swcwwbbbbwwcws`,
        `sswwwwbbwwwwss`,
        `sswwwwwwwwwwss`,
        `.swwwwwwwwwws.`,
        `..wwwwwwwwww..`,
        `...oo....oo...`,
      ],
      pal: {
        w: CY,
        s: `#bdb3d8`,
        p: palette.hotPink,
        P: `#c43a7e`,
        y: palette.yellow,
        b: `#ec8676`,
        o: `#ec8676`,
        c: `#ff2e7e`,
      },
    },
    r2d2: {
      art: [
        `....ssssss....`,
        `..ssssssssss..`,
        `..ssssbbssss..`,
        `.sssbbbbbbsss.`,
        `.sssbb.wbbsss.`,
        `.sssbb..bbsss.`,
        `.sssbbbbbbsss.`,
        `.bbsbbsrsgbbs.`,
        `bwwwwwwwwwwwwb`,
        `bwwwbbbbbbwwwb`,
        `bwwwwwwwwwwwwb`,
        `bwwwbbbbbbwwwb`,
        `bwwwwwbbwwwwwb`,
        `ww.wwwbbwww.ww`,
      ],
      pal: {
        s: `#c3cad8`,
        w: CY,
        b: `#3d7bff`,
        r: palette.red,
        g: `#8a90a8`,
      },
    },
  };
  var TY = [
    [0, 5, 2, 1, 7, 6, 8, 3, 4],
    [5, 7, 3, 0, 6, 2, 4, 8, 1],
    [6, 8, 4, 2, 1, 0, 5, 7, 3],
  ];
  var EY = [`cherries`, `r2d2`, `star`];
  var DY = 18;
  var OY = 14;
  var kY = 2;
  var AY = 0.12;
  var jY = 2;
  var MY = 0.16;
  var NY = 0.5;
  var PY = [1.1, 1.4, 1.7];
  var FY = 3;
  var IY = {
    tau: 0.07,
    omega: (2 * Math.PI) / 0.2,
    time: 0.24,
  };
  var LY = 315;
  var RY = 2.6;
  var zY = 1.1;
  var BY = {
    clicked: 0.06,
    auto: 0.05,
  };
  var VY = [5, 7];
  var HY = 0.1;
  function UY(e = Math.random) {
    let t = SY.length,
      n = () => Math.floor(e() * t),
      r = () => VY[0] + Math.floor(e() * (VY[1] - VY[0] + 1)),
      i = 0,
      a = r(),
      o = -1,
      s = (e, t) =>
        (e[0] === t[0] ? 0 : 1) +
        (e[1] === t[1] ? 0 : 1) +
        (e[2] === t[2] ? 0 : 1);
    function c(e) {
      ((i = 0), (a = r()));
      let t = n();
      for (; t === o || (e[0] === t && e[1] === t && e[2] === t);) t = n();
      return ((o = t), [t, t, t]);
    }
    function l(t) {
      for (;;) {
        let r;
        if (e() < HY) {
          let e = n(),
            t = n();
          for (; t === e;) t = n();
          r = [e, e, t];
        } else r = [n(), n(), n()];
        if ((r[0] !== r[1] || r[1] !== r[2]) && s(r, t) >= 2) return r;
      }
    }
    return {
      pick(t, n, r = null) {
        return (
          n && i++,
          Array.isArray(r)
            ? r.slice(0, 3)
            : r === `jackpot`
              ? c(t)
              : r === `mix`
                ? l(t)
                : (n && i >= a) || e() < (n ? BY.clicked : BY.auto)
                  ? c(t)
                  : l(t)
        );
      },
    };
  }
  function WY(e = 18, t = 18) {
    let n = SY.length * DY,
      r = e,
      i = t,
      a = [WB(CY), WB(palette.yellow), WB(palette.cream)],
      o = TY.map((e) => {
        let t = new Uint32Array(r * n);
        return (
          e.forEach((e, n) => {
            let { art: i, pal: a } = wY[SY[e]],
              o = Math.max(...i.map((e) => e.length)),
              s = Math.floor((r - o) / 2),
              c = n * DY + Math.floor((OY - i.length) / 2);
            i.forEach((e, n) => {
              for (let i = 0; i < e.length; i++) {
                let o = e[i];
                if (o === `.` || o === ` `) continue;
                let l = a[o] ? WB(a[o]) : 0;
                l && s + i >= 0 && s + i < r && (t[(c + n) * r + s + i] = l);
              }
            });
          }),
          t
        );
      }),
      s = TY.map((e) => SY.map((t, n) => e.indexOf(n) * DY)),
      c = new Float64Array(3),
      l = new Float64Array(3),
      u = new Float64Array(3),
      d = new Float64Array(3),
      f = new Float64Array(3),
      p = new Int32Array(3),
      m = new Uint8Array(3),
      h = new Int32Array(EY.map((e) => SY.indexOf(e))),
      g = new Int32Array(3),
      _ = [0, 1, 2].map(() => new PixelGrid(r, i)),
      v = [0, 1, 2].map(() => new PixelGrid(r, i)),
      y = new Int32Array(3).fill(-1),
      b = new Uint8Array(3),
      x = 0,
      S = 0,
      C = 0,
      w = NaN,
      T = !1,
      E = !1,
      D = null,
      ee = null,
      te = UY(),
      O = (e, t) => ((e % t) + t) % t,
      ne = (e, t) => s[e][t] - kY;
    for (let e = 0; e < 3; e++) c[e] = ne(e, h[e]);
    function re(e) {
      let t = te.pick([h[0], h[1], h[2]], E, ee);
      ((ee = null),
        (T = !1),
        (D = t[0] === t[1] && t[1] === t[2] ? `jackpot` : `mix`),
        (x = 1),
        (S = e));
      for (let e = 0; e < 3; e++) {
        ((g[e] = t[e]), (l[e] = c[e]));
        let r = PY[e] - AY - NY - MY / 2 + NY / 2,
          i = O(l[e] - ne(e, t[e]), n),
          a = i + Math.max(0, Math.round((LY * r - FY - i) / n)) * n;
        (a < n / 2 && (a += n),
          (u[e] = a),
          (d[e] = (a + FY) / r),
          (m[e] = 0),
          (p[e] = Math.floor((l[e] + kY + DY / 2) / DY)));
      }
      rV.slotSpin?.();
    }
    function ie(e, t) {
      if (t < AY)
        return (
          (f[e] = Math.abs(
            ((jY * Math.PI) / AY) * Math.sin((2 * Math.PI * t) / AY),
          )),
          (-2 * (1 - Math.cos((2 * Math.PI * t) / AY))) / 2
        );
      let n = d[e],
        r = t - AY,
        i = PY[e] - AY - NY;
      if (r < MY) return ((f[e] = (n * r) / MY), (0.5 * n * r * r) / MY);
      if (r < i) return ((f[e] = n), (n * MY) / 2 + n * (r - MY));
      if (r < i + NY) {
        let t = r - i;
        return (
          (f[e] = n * (1 - t / NY)),
          (n * MY) / 2 + n * (i - MY) + n * t - (0.5 * n * t * t) / NY
        );
      }
      let a = r - i - NY;
      return (
        (f[e] = 0),
        a >= IY.time
          ? u[e]
          : u[e] + FY * Math.exp(-a / IY.tau) * Math.cos(IY.omega * a)
      );
    }
    function ae(e, t) {
      ((x = e), (S = t), y.fill(-1));
    }
    function oe(e) {
      if (e === w) return;
      ((w = e), (C = e), T && x !== 1 && re(e));
      let t = e - S;
      if (x === 1) {
        for (let e = 0; e < 3; e++) {
          let n = l[e] - ie(e, t);
          c[e] = n;
          let r = Math.floor((n + kY + DY / 2) / DY);
          (r !== p[e] &&
            ((p[e] = r),
            f[e] > 20 && rV.slotTick?.(e, Math.min(1.5, f[e] / LY))),
            !m[e] &&
              t >= PY[e] &&
              ((m[e] = 1),
              (h[e] = g[e]),
              rV.slotStop?.(e, e === 2 ? D : null)));
        }
        if (t >= PY[2] + IY.time) {
          for (let e = 0; e < 3; e++) c[e] = O(l[e] - u[e], n);
          D === `jackpot` ? (ae(2, e), rV.slotWin?.()) : ae(0, e);
        }
      } else x === 2 && t >= RY && ae(0, e);
    }
    function se(e, t, n, r, i) {
      r < 0 ||
        r > 2 ||
        (e.block(t, n, 1, 1, i),
        r === 1 &&
          (e.block(t - 1, n, 1, 1, i),
          e.block(t + 1, n, 1, 1, i),
          e.block(t, n - 1, 1, 1, i),
          e.block(t, n + 1, 1, 1, i)));
    }
    let ce = [1, 1, r - 2, 2, 1, i - 3, r - 2, i - 2, r - 2, 8, 1, 9];
    function le(e) {
      if (D !== `jackpot`) return 0;
      let t = C - S - 0.8 - e * 0.85,
        n = O(t, 2.7);
      return n >= 0.36
        ? 0
        : 1 + Math.floor(n / 0.12) + 3 * O(Math.floor(t / 2.7) + e * 2, 6);
    }
    function ue(e, t) {
      let l = t.cells,
        u = o[e],
        d = C - S,
        p =
          x === 1 ? Math.min(4, Math.max(0, Math.floor((f[e] - 40) / 55))) : 0;
      if (!(x === 2 && d < zY && d % 0.22 >= 0.13)) {
        let t = Math.round(c[e]),
          a = x !== 1 || m[e] === 1,
          o = s[e][h[e]] - kY;
        for (let e = 0; e < i; e++)
          if (!(a && O(t + e - o, n) >= DY))
            for (let i = 0; i < r; i++) {
              let a = 0;
              for (let o = 0; o <= p && a === 0; o++)
                a = u[O(t + e + o, n) * r + i];
              a && (l[e * r + i] = a);
            }
      }
      if (x === 0) {
        let n = le(e);
        if (n >= 1) {
          let e = Math.floor((n - 1) / 3);
          se(t, ce[e * 2], ce[e * 2 + 1], (n - 1) % 3, a[e % 3]);
        }
      } else if (x === 2)
        for (let n = 0; n < 2; n++) {
          let r = d + e * 0.13 + n * 0.18,
            i = Math.floor(r / 0.36),
            o = (i * 2 + n * 3 + e) % 6;
          se(
            t,
            ce[o * 2],
            ce[o * 2 + 1],
            Math.floor((r % 0.36) / 0.12),
            a[(i + n) % 3],
          );
        }
    }
    let de = (e) =>
      Object.assign(
        (t) => {
          (b[e] || ((b[e] = 1), ue(e, _[e])), t.cells.set(_[e].cells));
        },
        {
          tick(t) {
            if ((oe(t), !b[e])) return !1;
            if (x === 0) {
              let t = le(e) * 16 + h[e];
              if (t === y[e]) return !1;
              y[e] = t;
            }
            let n = v[e];
            (n.cells.fill(0), ue(e, n));
            let r = _[e].cells,
              i = n.cells,
              a = 0;
            for (; a < i.length && r[a] === i[a];) a++;
            return a !== i.length && ((v[e] = _[e]), (_[e] = n), !0);
          },
        },
      );
    return {
      reels: [de(0), de(1), de(2)],
      get busy() {
        return x === 1 || T;
      },
      get winning() {
        return x === 2;
      },
      spin(e = !1) {
        return x === 1 || T ? !1 : ((T = !0), (E = e), !0);
      },
      force(e) {
        ee = Array.isArray(e)
          ? e.map((e) =>
              typeof e == `number` ? e : Math.max(0, SY.indexOf(e)),
            )
          : e;
      },
      get result() {
        return {
          symbols: [...h],
          outcome: D,
        };
      },
    };
  }
  var GY = 6;
  var KY = 4096;
  var qY = 32;
  return {
    WY,
    GY,
    KY,
    qY,
  };
}
