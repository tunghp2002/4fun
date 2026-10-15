// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
export function createTransitionsModule(scope) {
  var L6 = {
    cover: 190,
    reveal: 340,
    end: 530,
  };
  var R6 = 150;
  var z6 = 950;
  var B6 = (e) => e.toFixed(1);
  var V6 = (() => {
    let e = [];
    for (let t = 0; t < 10; t++) {
      let n = -Math.PI / 2 + (t * Math.PI) / 5,
        r = t % 2 ? 9.5 : 21;
      e.push(`${B6(Math.cos(n) * r)} ${B6(Math.sin(n) * r)}`);
    }
    return `M${e.join(`L`)}Z`;
  })();
  function createCutWipe(e = document.body) {
    let t = scope.element(`div`);
    ((t.className = `cut-wipe`),
      (t.dataset.style = `caption`),
      t.setAttribute(`aria-hidden`, `true`),
      (t.innerHTML = `
    <div class="cut-wipe__slab"></div>
    <div class="cut-wipe__rider">
      <div class="cut-wipe__card">
        <svg class="cut-wipe__ticks" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
          <path vector-effect="non-scaling-stroke" d="M7 22 1 8M93 22 99 8M7 78 1 92M93 78 99 92M28 10 26 -4M72 10 74 -4M30 90 28 104M70 90 72 104" />
        </svg>
        <span class="cut-wipe__kicker"></span>
        <span class="cut-wipe__pill"><b class="cut-wipe__num"></b><span class="cut-wipe__name"></span><svg class="cut-wipe__arrow" viewBox="0 0 34 24" focusable="false"><path d="M3 12h25M19 3.5l9 8.5-9 8.5" /></svg></span>
        <svg class="cut-wipe__star" viewBox="-30 -30 60 60" focusable="false"><path class="cut-wipe__star-cut" d="${V6}" /><path class="cut-wipe__star-face" d="${V6}" /></svg>
      </div>
    </div>`),
      e.append(t));
    let n = t.querySelector(`.cut-wipe__card`),
      r = t.querySelector(`.cut-wipe__kicker`),
      i = t.querySelector(`.cut-wipe__num`),
      a = t.querySelector(`.cut-wipe__name`),
      o = `idle`,
      s = L6,
      c = null,
      l = 0,
      u = 0,
      d = 0,
      f = 0,
      p = -1e9,
      m = (e, t) => {
        (scope.clearTimeout(l), (l = scope.timeout(e, Math.max(0, t))));
      },
      h = (e) =>
        t
          .getAnimations({
            subtree: !0,
          })
          .filter(
            (t) => t instanceof CSSAnimation && t.animationName.endsWith(e),
          ),
      g = () => {
        let e = h(`-in`)[0];
        if (!e) return performance.now() - f;
        let t = e.startTime;
        return typeof t == `number` ? performance.now() - t : 0;
      },
      _ = (e) => {
        ((r.textContent = e.dir < 0 ? `back to` : `next stop`),
          (i.textContent = e.num),
          (a.textContent = e.name),
          n.style.setProperty(`--to`, e.dir < 0 ? `-1` : `1`));
      },
      v = () => {
        (scope.clearTimeout(l),
          (o = `idle`),
          (c = null),
          t.classList.remove(`run`, `out`),
          (p = performance.now()));
      },
      y = () => {
        if (((o = `out`), t.classList.contains(`out`)))
          for (let e of [...h(`-out`), ...h(`-linger`)])
            ((e.playbackRate = 1), (e.currentTime = 0), e.play());
        else t.classList.add(`out`);
        m(v, Math.max(s.end - s.reveal, z6) + 40);
      },
      b = () => {
        if (o !== `hold`) return;
        let e = d - performance.now();
        if (e > 4) return m(b, e);
        if (u < 2 && e > -1e3) return m(b, 1e3 + e);
        y();
      },
      x = (e) => {
        o = `hold`;
        let t = c;
        ((c = null), t?.(), (u = 0), (d = performance.now() + e));
        let n = () => {
          o === `hold` && (++u < 2 ? scope.frame(n) : b());
        };
        (scope.frame(n), m(b, e));
      },
      S = () => {
        if (o !== `in`) return;
        let e = g();
        if (e < s.cover - 4) return m(S, s.cover - e);
        x(s.reveal - e);
      };
    return {
      el: t,
      get busy() {
        return o !== `idle`;
      },
      run(e, n) {
        if (o !== `idle`) {
          if (((c = n), _(e), o === `hold`))
            x(Math.max(d - performance.now(), R6));
          else if (o === `out`) {
            ((o = `back`), scope.clearTimeout(l));
            let e = h(`-out`);
            for (let t of e) t.reverse();
            for (let e of h(`-linger`)) ((e.currentTime = 0), e.pause());
            Promise.all(e.map((e) => e.finished)).then(
              () => o === `back` && x(R6),
              () => {},
            );
          }
          return null;
        }
        let r = e.dir < 0 ? -1 : 1,
          i = t.style;
        (i.setProperty(`--dir`, String(r)),
          i.setProperty(`--wipe-cover`, `${s.cover}ms`),
          i.setProperty(`--wipe-in`, `${s.reveal}ms`),
          i.setProperty(`--wipe-out`, `${s.end - s.reveal}ms`),
          i.setProperty(`--wipe-linger`, `${z6}ms`));
        let a = document.documentElement.style.getPropertyValue(`--page`);
        if (
          (a && i.setProperty(`--wipe-page`, a),
          _(e),
          (c = n),
          (o = `in`),
          (f = performance.now()),
          t.classList.remove(`out`),
          t.classList.add(`run`),
          f - p < 100)
        )
          for (let e of t.getAnimations({
            subtree: !0,
          }))
            (e.cancel(), e.play());
        return (
          m(S, s.cover),
          {
            dir: r,
            ...s,
          }
        );
      },
    };
  }
  return {
    createCutWipe,
  };
}
