// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
export function createLoaderModule(scope, { layoutModule }) {
  const { i6, a6, o6, s6 } = layoutModule;
  function activateStartGate(
    e,
    { sound: t, onEnter: n, onPress: r, landing: i },
  ) {
    let a = e.querySelector(`.loader__gate`),
      o = e.querySelector(`.loader__start`),
      s = e.querySelector(`button.loader__quiet`);
    if (!a || !o || !s) return !1;
    (e.classList.toggle(`is-mute`, !t),
      (s.hidden = !t),
      t || o.setAttribute(`aria-label`, `Start`));
    let c = e.querySelector(`.loader__status`);
    c && (c.textContent = `Ready. Press Start.`);
    let l = e.querySelector(`.loader__ring`),
      u = l ? getComputedStyle(l).transform : `none`,
      d = u && u !== `none` ? new DOMMatrixReadOnly(u) : null,
      f = d ? ((Math.atan2(d.b, d.a) * 180) / Math.PI + 360) % 360 : 0;
    ((o.disabled = !1),
      o.removeAttribute(`aria-hidden`),
      (a.hidden = !1),
      e.classList.add(`is-ready`),
      l &&
        f > 0.5 &&
        ((l.style.rotate = `${f}deg`),
        l.getBoundingClientRect(),
        (l.style.transition = `rotate 0.7s cubic-bezier(0.2, 0.7, 0.3, 1)`),
        (l.style.rotate = `360deg`)));
    let p = e.querySelector(`.loader__mesq`),
      m = e.querySelector(`.loader__stage`),
      h = scope.timeout(
        () => {
          if (e.classList.contains(`is-leaving`)) return;
          let t = p
            ? new DOMMatrixReadOnly(getComputedStyle(p).transform).m42
            : 0;
          if ((e.classList.add(`is-perched`), !m || i6())) return;
          let n =
            parseFloat(getComputedStyle(e).getPropertyValue(`--peek`)) || 133;
          m.animate(
            [
              {
                translate: `0 ${t}px`,
                easing: `cubic-bezier(0.25, 0.7, 0.45, 1)`,
              },
              {
                translate: `0 ${-n - 44}px`,
                offset: 0.58,
                easing: `cubic-bezier(0.55, 0, 0.8, 0.4)`,
              },
              {
                translate: `0 ${-n}px`,
              },
            ],
            {
              duration: 620,
            },
          );
        },
        i6() ? 0 : 330,
      ),
      g = 0,
      _ = 0,
      v = 0,
      y = () => {
        if (((v = 0), !p || !e.isConnected)) return;
        let t = p.getBoundingClientRect(),
          n = g - (t.left + t.width / 2),
          r = _ - (t.top + t.height * 0.42),
          i = Math.hypot(n, r) || 1,
          a = Math.min(1, i / 140);
        (e.style.setProperty(`--look-x`, `${((n / i) * a * 2).toFixed(2)}px`),
          e.style.setProperty(
            `--look-y`,
            `${((r / i) * a * 1.7).toFixed(2)}px`,
          ));
      },
      b = (t) => {
        if (!e.isConnected) return removeEventListener(`pointermove`, b);
        t.pointerType !== `touch` &&
          ((g = t.clientX), (_ = t.clientY), (v ||= scope.frame(y)));
      };
    (scope.listen(window, `pointermove`, b, {
      passive: !0,
    }),
      o.focus({
        preventScroll: !0,
      }));
    let x = new Set([`Tab`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`]),
      S = (t) => {
        if (!e.isConnected) return removeEventListener(`keydown`, S, !0);
        x.has(t.key) &&
          !t.metaKey &&
          !t.ctrlKey &&
          !t.altKey &&
          e.classList.add(`is-kbd`);
      };
    (scope.listen(window, `keydown`, S, !0),
      scope.listen(e, `mousedown`, (e) => {
        e.target.closest(`button, a`) || e.preventDefault();
      }));
    let C = performance.now() + (i6() ? o6 : a6),
      w = -1 / 0,
      T = (n) => {
        if (!e.isConnected) return removeEventListener(`pointerdown`, T, !0);
        ((w = performance.now()),
          t &&
            n.pointerType === `mouse` &&
            w >= C &&
            o.contains(n.target) &&
            r?.());
      };
    scope.listen(window, `pointerdown`, T, !0);
    let E = !1,
      D = (t) => (r) => {
        E ||
          performance.now() < C ||
          (r.detail > 0 && w < C) ||
          ((E = !0),
          removeEventListener(`keydown`, S, !0),
          removeEventListener(`pointermove`, b),
          removeEventListener(`pointerdown`, T, !0),
          scope.cancelFrame(v),
          scope.clearTimeout(h),
          l6(s6),
          e.classList.add(`is-leaving`),
          i && !i6() && u6(e, i),
          n(t));
      };
    return (
      scope.listen(o, `click`, D(t)),
      scope.listen(s, `click`, D(!1)),
      !0
    );
  }
  function l6(e) {
    let t = performance.now() + e,
      n = [
        `pointerdown`,
        `mousedown`,
        `pointerup`,
        `mouseup`,
        `click`,
        `dblclick`,
      ],
      r = () => {
        for (let e of n) removeEventListener(e, i, !0);
      },
      i = (e) => {
        if (performance.now() > t) return r();
        (e.preventDefault(), e.stopImmediatePropagation());
      };
    for (let e of n) scope.listen(window, e, i, !0);
    scope.timeout(r, e + 100);
  }
  function u6(e, t) {
    let n = e.querySelector(`.loader__start`),
      r = e.querySelector(`.loader__stage`),
      i = e.querySelector(`.loader__mesq`);
    if (!n || !r || !i) return;
    let a = t.getBoundingClientRect(),
      o = i.getBoundingClientRect();
    if (!a.width || !o.width) return;
    let s = parseFloat(getComputedStyle(n).scale) || 1,
      c = (a.left + a.width / 2 - (o.left + o.width / 2)) / s,
      l = (a.top + a.height / 2 - (o.top + o.height / 2)) / s,
      [u = 0, d = 0] = getComputedStyle(r)
        .translate.split(` `)
        .map((e) => parseFloat(e) || 0),
      f = (a.width * 0.86) / o.width,
      p = 70 + Math.max(0, l) * 0.3,
      m = [];
    for (let e = 0; e <= 14; e++) {
      let t = e / 14,
        n = u + c * t,
        r = d + l * t - 4 * p * t * (1 - t),
        i = 1 + (f - 1) * t,
        a = e === 0 ? 1.15 : e === 1 ? 0.88 : 1,
        o = e === 0 ? 0.85 : e === 1 ? 1.14 : 1;
      m.push({
        translate: `${n}px ${r}px`,
        scale: `${i * a} ${i * o}`,
        rotate: `${-360 * t}deg`,
        offset: t * 0.8,
      });
    }
    let h = `${u + c}px ${d + l}px`;
    (m.push({
      translate: h,
      scale: `${f * 1.2} ${f * 0.78}`,
      rotate: `-360deg`,
      offset: 0.88,
    }),
      m.push({
        translate: h,
        scale: `0 0`,
        rotate: `-360deg`,
        offset: 1,
      }),
      (r.style.transformOrigin = `50% 62.7%`),
      r.animate(m, {
        duration: 760,
        easing: `linear`,
        fill: `forwards`,
      }),
      e.style.setProperty(`--look-x`, `${Math.sign(c) * 1.8}px`),
      e.style.setProperty(`--look-y`, `1.4px`));
  }
  window.mesqBoot = performance.now();
  var d6 = [
    [0, [`mixing the ink`]],
    [0.12, [`setting the type`, `sharpening the pencils`]],
    [0.3, [`warming up the printer`, `plugging in the lights`]],
    [0.45, [`painting the post`, `hanging the signals`]],
    [
      0.75,
      [
        `waking the birds`,
        `untangling the cables`,
        `fluffing the clouds`,
        `tuning the radio`,
      ],
    ],
    [1, [`all set`]],
  ];
  var f6 = 1700;
  var p6 = 420;
  var m6 = 0;
  var h6 = 0;
  var g6 = 0;
  var _6 = 0;
  var v6 = 0;
  var y6 = [];
  var b6 = 0;
  var x6 = 0;
  var S6 = -1 / 0;
  var C6 = 0;
  var w6 = 0;
  var T6 = 0;
  var E6 = () => window.mesqCreep?.() ?? 0;
  var D6 = 0.35;
  var O6 = () => document.querySelector(`#loader:not(.is-ready)`);
  var k6 = () => document.querySelectorAll(`.loader:not(.is-ready)`);
  function A6(e) {
    let t = document.querySelectorAll(`.loader:not(.is-ready) .loader__step`);
    t.length || scope.clearInterval(x6);
    for (let n of t)
      n.textContent !== e &&
        ((n.textContent = e),
        n.classList.remove(`is-new`),
        n.offsetWidth,
        n.classList.add(`is-new`));
  }
  function j6(e) {
    scope.clearTimeout(C6);
    let t = S6 + p6 - performance.now();
    if (t > 0) {
      C6 = scope.timeout(() => j6(e), t);
      return;
    }
    ((S6 = performance.now()), A6(e));
  }
  function M6() {
    let e = `${Math.round(m6)}%`;
    for (let t of document.querySelectorAll(
      `.loader:not(.is-ready) .loader__pct`,
    ))
      t.textContent = e;
  }
  function N6() {
    v6 = 0;
    let e = Math.min(1, (performance.now() - _6) / 350);
    ((m6 = h6 + (g6 - h6) * (1 - (1 - e) ** 2)),
      M6(),
      e < 1 && (v6 = scope.frame(N6)));
  }
  function P6(e) {
    ((g6 = Math.round(e * 100)),
      (h6 = g6 < m6 ? 0 : m6),
      (_6 = performance.now()),
      (v6 ||= scope.frame(N6)));
  }
  function F6() {
    T6 = 0;
    let e = O6();
    if (!e || w6 >= D6) return;
    let t = E6();
    (t > w6 && ((w6 = t), e.style.setProperty(`--load`, String(t)), P6(t)),
      (T6 = scope.timeout(F6, 250)));
  }
  function setLoadingProgress(e) {
    ((window.mesqBoot = performance.now()), (e = Math.min(1, Math.max(0, e))));
    let t = O6();
    t && (w6 = Math.max(w6, e, E6()));
    for (let n of k6()) n.style.setProperty(`--load`, String(n === t ? w6 : e));
    (P6(t ? w6 : e), t && !T6 && F6());
    let n = d6.reduce((t, [n, r]) => (e >= n ? r : t), d6[0][1]);
    n !== y6 &&
      ((y6 = n),
      (b6 = 0),
      j6(y6[0]),
      scope.clearInterval(x6),
      y6.length > 1 &&
        (x6 = scope.interval(() => {
          ((b6 = (b6 + 1) % y6.length), j6(y6[b6]));
        }, f6)));
  }
  return {
    activateStartGate,
    setLoadingProgress,
  };
}
