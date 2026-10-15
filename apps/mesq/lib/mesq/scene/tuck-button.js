// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import { MathUtils, Vector3 } from "three/webgpu";
export function createTuckButtonModule(
  scope,
  { audioModule, showcaseStateModule, showcaseCardsModule },
) {
  const { sound } = audioModule;
  const { p0 } = showcaseStateModule;
  const { l2, u2 } = showcaseCardsModule;
  var FloatingPanelButton = class {
    panel;
    el = scope.element(`button`);
    at = new Vector3();
    shown = !1;
    pressed = null;
    px = NaN;
    py = NaN;
    deg = NaN;
    x = 0;
    w = 1;
    home = null;
    held = !1;
    constructor(e, t) {
      this.panel = e;
      let n = this.el;
      ((n.type = `button`),
        (n.className = `tuck`),
        (n.hidden = !0),
        (n.innerHTML = l2),
        n.setAttribute(`aria-label`, u2),
        scope.listen(n, `click`, (e) => {
          e.detail > 1 ||
            (p0.toggle(),
            this.hot(!1),
            this.sync(),
            sound.sfx.uiClick(this.pan()));
        }),
        scope.listen(n, `pointerenter`, (e) => {
          e.pointerType !== `touch` &&
            (this.hot(!0), sound.sfx.uiHover(this.pan()));
        }),
        scope.listen(
          n,
          `pointermove`,
          (e) => e.pointerType !== `touch` && this.hot(!0),
        ),
        scope.listen(n, `pointerleave`, () => {
          (this.hot(!1), (this.held = !1));
        }),
        scope.listen(
          n,
          `pointerdown`,
          (e) => e.pointerType !== `touch` && (this.held = !0),
        ));
      let r = () => (this.held = !1);
      (scope.listen(window, `pointerup`, r, !0),
        scope.listen(window, `pointercancel`, r, !0),
        scope.listen(n, `keydown`, (e) => e.key === `Tab` && this.goHome(!0)),
        t.append(n));
    }
    follow(e) {
      ((this.home = e),
        e !== this.el.parentElement &&
          document.activeElement !== this.el &&
          e.append(this.el));
    }
    goHome(e) {
      let t = this.el,
        n = this.home;
      if (!n || n === t.parentElement) return;
      let r = document.activeElement === t;
      if (!r || e) {
        n.append(t);
        for (let e of t.getAnimations()) e.finish();
        r &&
          t.focus({
            preventScroll: !0,
          });
      }
    }
    hot(e) {
      e !== this.panel.buttonHover &&
        ((this.panel.buttonHover = e), this.el.classList.toggle(`hot`, e));
    }
    pan() {
      return MathUtils.clamp((this.x / this.w) * 2 - 1, -1, 1) * 0.7;
    }
    update(e, t, n) {
      this.goHome(!1);
      let r = this.panel.tuckAnchor(this.at),
        i = r !== null;
      if (
        (i !== this.shown &&
          ((this.shown = i), (this.el.hidden = !i), i || this.hot(!1)),
        r === null || (this.sync(), this.held))
      )
        return;
      (this.at.applyMatrix4(e.projectionMatrix),
        (this.w = t),
        (this.x = (this.at.x * 0.5 + 0.5) * t));
      let a = (0.5 - this.at.y * 0.5) * n,
        o = Math.round(this.x * 10),
        s = Math.round(a * 10),
        c = Math.round(-MathUtils.radToDeg(r) * 100);
      ((o !== this.px || s !== this.py) &&
        ((this.px = o),
        (this.py = s),
        (this.el.style.translate = `${o / 10}px ${s / 10}px`)),
        c !== this.deg &&
          ((this.deg = c), (this.el.style.rotate = `${c / 100}deg`)));
    }
    sync() {
      let e = p0.value;
      e !== this.pressed &&
        ((this.pressed = e), this.el.setAttribute(`aria-pressed`, String(e)));
    }
  };
  return {
    FloatingPanelButton,
  };
}
