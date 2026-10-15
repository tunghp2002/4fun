// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
export function createScrollInputModule(scope, { loaderModule }) {
  const { setLoadingProgress } = loaderModule;
  var scrollSettings = {
    enabled: !0,
    above: 0.2,
    below: 0.2,
    aboveTouch: 0.18,
    belowTouch: 0.18,
    long: 0.22,
    longTouch: 0.2,
    quiet: 280,
    cadence: 1.6,
    waitMax: 450,
    touchQuiet: 140,
    dragQuiet: 650,
    tail: !0,
    tailPx: 0.5,
    tailN: 6,
    min: 220,
    perStop: 700,
    max: 340,
    perStopTouch: 2e3,
    maxTouch: 940,
    pageKeys: !0,
    keyMin: 300,
    keyMax: 520,
  };
  var X6 = document.querySelector(`main`);
  var Z6 = document.documentElement.classList.contains(`frame`);
  var scrollHost = {
    framed: Z6,
    frame: X6,
    events: Z6 ? X6 : window,
    get y() {
      return Z6 ? X6.scrollTop : window.scrollY;
    },
    get viewH() {
      return Z6 ? X6.clientHeight : window.innerHeight;
    },
    get max() {
      return Z6
        ? X6.scrollHeight - X6.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
    },
    scrollTo(e, t) {
      Z6
        ? X6.scrollTo({
            top: e,
            behavior: t ?? `smooth`,
          })
        : window.scrollTo(
            t
              ? {
                  top: e,
                  behavior: t,
                }
              : {
                  top: e,
                },
          );
    },
    top(e) {
      return (
        e.getBoundingClientRect().top +
        (Z6 ? X6.scrollTop - X6.getBoundingClientRect().top : window.scrollY)
      );
    },
  };
  if (Z6) {
    let e = {
        capture: !0,
        passive: !0,
      },
      t = -1,
      n = !1,
      r = 0,
      i = 0,
      a = 0,
      o = [],
      s = 0,
      c = (e) => [...e.touches].find((e) => e.identifier === t),
      l = () => X6.scrollHeight - X6.clientHeight;
    (scope.listen(
      window,
      `touchstart`,
      (e) => {
        scope.cancelFrame(s);
        let a = e.changedTouches[0],
          o =
            e.target === X6 ||
            (e.target instanceof Element &&
              !!e.target.closest(`.mesq-debug, #no3d`));
        ((t =
          e.touches.length === 1 &&
          !o &&
          !document.documentElement.classList.contains(`gated`)
            ? a.identifier
            : -1),
          (n = !1),
          (r = a.clientX),
          (i = a.clientY));
      },
      e,
    ),
      scope.listen(
        window,
        `touchmove`,
        (e) => {
          let s = t < 0 ? void 0 : c(e);
          if (s) {
            if (e.touches.length > 1) return void (t = -1);
            if (!n) {
              let e = s.clientX - r,
                c = s.clientY - i;
              if (Math.hypot(e, c) < 10) return;
              if (Math.abs(e) > Math.abs(c)) return void (t = -1);
              ((n = !0), (i = s.clientY), (a = X6.scrollTop), (o = []));
            }
            (X6.scrollTo({
              top: a - (s.clientY - i),
              behavior: `instant`,
            }),
              o.push([e.timeStamp, s.clientY]) > 12 && o.shift());
          }
        },
        e,
      ));
    let u = (e) => {
      if (t < 0 || c(e) || ((t = -1), !n || !o.length)) return;
      let [r, i] = o[o.length - 1],
        [a, u] = o.find(([e]) => r - e <= 100),
        d =
          e.timeStamp - r > 50 || r <= a
            ? 0
            : Math.min(Math.max((u - i) / (r - a), -8), 8);
      if (Math.abs(d) < 0.1) return;
      let f = X6.scrollTop,
        p = performance.now(),
        m = (e) => {
          if (Math.abs(X6.scrollTop - f) > 2) return;
          let t = Math.max(0, e - p);
          ((p = e),
            (f = Math.min(Math.max(f + d * t, 0), l())),
            (d *= 0.998 ** t),
            X6.scrollTo({
              top: f,
              behavior: `instant`,
            }),
            Math.abs(d) > 0.02 && f > 0 && f < l() && (s = scope.frame(m)));
        };
      s = scope.frame(m);
    };
    (scope.listen(window, `touchend`, u, e),
      scope.listen(window, `touchcancel`, u, e));
    for (let t of [`wheel`, `keydown`])
      scope.listen(window, t, () => scope.cancelFrame(s), e);
  }
  setLoadingProgress(0.12);
  return {
    scrollSettings,
    scrollHost,
  };
}
