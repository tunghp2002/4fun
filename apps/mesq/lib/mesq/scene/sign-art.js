// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
export function createSignArtModule(scope, { paletteModule, stickersModule }) {
  const { paperWhite, blue, inkPurple, palette, LF, RF } = paletteModule;
  const { YV, QV, $V, rH, oH, sH, cH } = stickersModule;
  var XH = (e) => `800 ${e}px Manrope, system-ui, sans-serif`;
  var ZH = (e) => `700 ${e}px "IBM Plex Mono", ui-monospace, monospace`;
  function QH(e, t) {
    ((e.strokeStyle = inkPurple),
      (e.lineWidth = t),
      (e.lineCap = `round`),
      (e.lineJoin = `round`));
  }
  var $H = (e, t, n) => {
    ((e.fillStyle = paperWhite),
      e.fillRect(0, 0, t, n),
      (e.fillStyle = `#2f5be0`),
      e.beginPath(),
      e.roundRect(t * 0.043, n * 0.043, t * 0.914, n * 0.914, t * 0.066),
      e.fill(),
      (e.fillStyle = paperWhite),
      e.beginPath(),
      e.moveTo(t * 0.5, n * 0.22),
      e.lineTo(t * 0.88, n * 0.84),
      e.lineTo(t * 0.12, n * 0.84),
      e.closePath(),
      e.fill(),
      (e.fillStyle = inkPurple));
    for (let r = 0; r < 5; r++) {
      let i = t * (0.22 + r * 0.12);
      (e.beginPath(),
        e.moveTo(i, n * 0.81),
        e.lineTo(i + t * 0.07, n * 0.81),
        e.lineTo(i + t * 0.09, n * 0.72),
        e.lineTo(i + t * 0.02, n * 0.72),
        e.closePath(),
        e.fill());
    }
    (QH(e, t * 0.035),
      e.beginPath(),
      e.arc(t * 0.5, n * 0.42, t * 0.035, 0, Math.PI * 2),
      (e.fillStyle = inkPurple),
      e.fill(),
      e.beginPath(),
      e.moveTo(t * 0.5, n * 0.48),
      e.lineTo(t * 0.49, n * 0.6),
      e.lineTo(t * 0.43, n * 0.69),
      e.moveTo(t * 0.49, n * 0.6),
      e.lineTo(t * 0.56, n * 0.67),
      e.moveTo(t * 0.5, n * 0.51),
      e.lineTo(t * 0.42, n * 0.46),
      e.moveTo(t * 0.5, n * 0.51),
      e.lineTo(t * 0.58, n * 0.47),
      e.stroke(),
      (e.fillStyle = `#c9cfe0`),
      e.beginPath(),
      e.ellipse(t * 0.5, n * 0.24, t * 0.08, n * 0.05, 0, Math.PI, 0),
      e.fill(),
      (e.fillStyle = `#3a3a52`),
      e.beginPath(),
      e.ellipse(t * 0.5, n * 0.27, t * 0.26, n * 0.045, 0, 0, Math.PI * 2),
      e.fill(),
      (e.fillStyle = palette.lime));
    for (let r of [0.36, 0.46, 0.56, 0.66])
      (e.beginPath(),
        e.arc(t * r, n * 0.275, t * 0.012, 0, Math.PI * 2),
        e.fill());
    rH(e, 3, t * 0.82, n * 0.16, n * 0.14, 0.3);
  };
  var eU = (e, t, n) => {
    ((e.fillStyle = palette.pink), e.fillRect(0, 0, t, n));
    for (let r = 0; r < 70; r++)
      rH(
        e,
        YV(cH(37)),
        sH(0.08, 0.92) * t,
        sH(0.08, 0.92) * n,
        sH(0.08, 0.15) * n,
        sH(-0.7, 0.7),
      );
  };
  function tU(e, t, n, r, i) {
    ((e.font = ZH(r * (i.size ?? 0.42))), (e.textBaseline = `middle`));
    let a = e.measureText(t).width,
      o = r * 0.36;
    if (i.align === `center`) {
      let e = n - r * (i.poleEnd ?? 0.36);
      o = Math.max(r * 0.3, (r * 0.3 + e - a) / 2);
    }
    return {
      x0: o,
      tw: a,
    };
  }
  function nU(e, t, n, r = {}, i = {}) {
    return (a, o, s) => {
      (a.clearRect(0, 0, o, s),
        i.plate &&
          ((a.globalAlpha = i.plateAlpha ?? 0.4),
          (a.fillStyle = i.plate),
          a.fillRect(0, 0, o, s)),
        (a.globalAlpha = i.decorAlpha ?? 0.5));
      for (let [e, t, n, r] of i.decor ?? [])
        rH(a, e, o * t, s * 0.52, s * n, r);
      a.globalAlpha = 1;
      for (let c of [s * (i.blur ?? 0.16), 0]) {
        ((a.shadowBlur = c),
          (a.shadowColor = i.halo ?? n),
          (a.strokeStyle = t),
          (a.lineWidth = s * 0.06),
          a.beginPath(),
          a.roundRect(s * 0.1, s * 0.1, o - s * 0.2, s * 0.8, s * 0.12),
          a.stroke());
        let { x0: l } = tU(a, e, o, s, r);
        ((a.fillStyle = n), a.fillText(e, l, s * 0.54));
      }
      a.shadowBlur = 0;
    };
  }
  function rU(e, t, n, r, i, a, o = {}) {
    return (s, c, l) => {
      ((s.fillStyle = t),
        s.fillRect(0, 0, c, l),
        (s.strokeStyle = n),
        (s.lineWidth = l * 0.06),
        s.beginPath(),
        s.roundRect(l * 0.1, l * 0.1, c - l * 0.2, l * 0.8, l * 0.12),
        s.stroke(),
        (s.fillStyle = r));
      let { x0: u, tw: d } = tU(s, e, c, l, o);
      s.fillText(e, u, l * 0.54);
      let f = c - l * 0.25;
      if (a) {
        let e = c - l * 1.3;
        ((f = e - l * 0.1),
          (s.font = XH(l * 0.5)),
          (s.lineJoin = `round`),
          (s.strokeStyle = inkPurple),
          (s.lineWidth = l * 0.16),
          s.strokeText(a, e, l * 0.54),
          (s.strokeStyle = paperWhite),
          (s.lineWidth = l * 0.08),
          s.strokeText(a, e, l * 0.54),
          (s.fillStyle = blue),
          s.fillText(a, e, l * 0.54));
      }
      for (let [e, t, n, r] of o.decor ?? [])
        rH(s, e, c * t, l * 0.52, l * n, r);
      let p = u + d + l * 0.3;
      for (let e = 0; e < i; e++) {
        let e = sH(0.35, 0.5) * l;
        if (f - p < e * 1.1) break;
        rH(
          s,
          YV(cH(37)),
          sH(p + e * 0.5, f - e * 0.5),
          sH(0.4, 0.6) * l,
          e,
          sH(-0.4, 0.4),
        );
      }
    };
  }
  var iU = 0.06;
  var aU = (e, t, n) => {
    let r = t * iU,
      i = QV * (t - 2 * r),
      a = r + i,
      o = r + i,
      s = t - 2 * a,
      c = n - 2 * o;
    $V(
      e,
      (e) => {
        (e.beginPath(), e.roundRect(a, o, s, c, s * 0.3));
      },
      palette.yellow,
      i,
      (e) => {
        let n = s * 0.14,
          r = (c - 2 * n) / 7,
          i = Math.min(r * 1.2, s * 0.66);
        ((e.fillStyle = inkPurple),
          (e.font = XH(i)),
          (e.textAlign = `center`),
          (e.textBaseline = `middle`));
        for (let a = 0; a < 7; a++)
          e.fillText(
            `NONSTOP`[a],
            t / 2,
            o + n + (a + 0.5) * r + i * 0.04,
            s * 0.8,
          );
      },
    );
  };
  var oU = (e, t, n) => {
    ((e.fillStyle = `#ffb21f`), e.fillRect(0, 0, t, n));
    let r = n * 0.2,
      i = t - n * 0.33,
      a = n * 0.47;
    ((e.fillStyle = paperWhite),
      e.beginPath(),
      e.arc(i, a, r, 0, Math.PI * 2),
      e.fill(),
      QH(e, n * 0.04),
      e.stroke(),
      e.beginPath(),
      e.moveTo(i, a - r * 0.56),
      e.lineTo(i, a + r * 0.5),
      e.moveTo(i - r * 0.38, a + r * 0.14),
      e.lineTo(i, a + r * 0.54),
      e.lineTo(i + r * 0.38, a + r * 0.14),
      QH(e, n * 0.05),
      e.stroke());
    let o = t * 0.09,
      s = i - r - n * 0.1;
    ((e.fillStyle = inkPurple),
      (e.font = XH(n * 0.4)),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      e.fillText(`PROJECTS`, (o + s) / 2, n * 0.53, s - o),
      rH(e, 0, t - n * 0.2, n * 0.85, n * 0.18, 0.3));
  };
  var sU = (e, t, n) => {
    ((e.fillStyle = blue),
      e.fillRect(0, 0, t, n),
      (e.strokeStyle = paperWhite),
      (e.lineWidth = n * 0.05),
      e.beginPath(),
      e.roundRect(n * 0.09, n * 0.09, t - n * 0.18, n * 0.82, n * 0.14),
      e.stroke());
    let r = n * 0.6;
    ((e.fillStyle = paperWhite),
      e.beginPath(),
      e.arc(r, n / 2, n * 0.27, 0, Math.PI * 2),
      e.fill(),
      (e.fillStyle = blue),
      e.beginPath(),
      e.arc(r, n * 0.36, n * 0.045, 0, Math.PI * 2),
      e.fill(),
      e.beginPath(),
      e.roundRect(r - n * 0.04, n * 0.45, n * 0.08, n * 0.24, n * 0.02),
      e.fill(),
      (e.fillStyle = paperWhite),
      (e.font = XH(n * 0.52)),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`));
    let i = n * 1.02,
      a = t - n * 0.3;
    (e.fillText(`ABOUT`, (i + a) / 2, n * 0.54, a - i),
      rH(e, 7, t - n * 0.2, n * 0.18, n * 0.22, 0.35));
  };
  var cU = (e, t, n) => {
    ((e.fillStyle = palette.yellow),
      e.fillRect(0, 0, t, n),
      (e.strokeStyle = inkPurple),
      (e.lineWidth = n * 0.07),
      e.strokeRect(n * 0.1, n * 0.1, t - n * 0.2, n * 0.8));
    let r = n * 0.62;
    ((e.fillStyle = palette.red),
      e.beginPath(),
      e.arc(r, n * 0.42, n * 0.2, Math.PI * 0.8, Math.PI * 2.2),
      e.lineTo(r, n * 0.8),
      e.closePath(),
      e.fill(),
      (e.fillStyle = paperWhite),
      e.beginPath(),
      e.arc(r, n * 0.42, n * 0.08, 0, Math.PI * 2),
      e.fill(),
      (e.fillStyle = inkPurple),
      (e.font = ZH(n * 0.44)),
      (e.textBaseline = `middle`),
      e.fillText(`YOU ARE HERE`, n * 1, n * 0.54, t - n * 1.25));
  };
  function lU(e) {
    return (t, n, r) => {
      let i = r * e;
      ((t.fillStyle = paperWhite),
        t.fillRect(0, 0, n, r),
        (t.fillStyle = palette.lilac));
      for (let e = i * 0.62; e < i * 0.95; e += i * 0.07)
        for (let r = n * 0.04; r < n * 0.3; r += i * 0.07) {
          let a = (1 - (r / n - 0.04) / 0.26) * ((e - i * 0.62) / (i * 0.33));
          (t.beginPath(), t.arc(r, e, i * 0.026 * a, 0, Math.PI * 2), t.fill());
        }
      ((t.textAlign = `center`),
        (t.textBaseline = `middle`),
        (t.fillStyle = inkPurple),
        (t.font = XH(i * 0.4)),
        t.fillText(`CONTACTS`, n * 0.5, i * 0.43, n * 0.8),
        (t.fillStyle = palette.hotPink),
        (t.font = ZH(i * 0.19)),
        t.fillText(`SAY HI ↓`, n * 0.5, i * 0.77, n * 0.6),
        rH(t, 11, n * 0.87, i * 0.74, i * 0.26, -0.3));
    };
  }
  function uU(e) {
    return (t, n, r) => {
      ((t.fillStyle = palette.cream),
        t.fillRect(0, 0, n, r),
        (t.strokeStyle = palette.red),
        (t.lineWidth = r * 0.09),
        t.beginPath(),
        t.roundRect(r * 0.1, r * 0.1, n - r * 0.2, r * 0.8, r * 0.1),
        t.stroke(),
        (t.fillStyle = inkPurple),
        (t.font = XH(r * 0.56)),
        (t.textAlign = `center`),
        (t.textBaseline = `middle`),
        t.fillText(e, n / 2, r * 0.54, n * 0.8));
    };
  }
  var dU = [palette.yellow, palette.hotPink];
  var fU = `#d6d0e8`;
  var pU = `#bdb3d8`;
  function mU(e, t, n, r, i) {
    (e.save(),
      e.beginPath(),
      e.ellipse(t, n, r, i, 0, 0, Math.PI * 2),
      e.clip(),
      (e.fillStyle = fU),
      e.fillRect(t - r, n - i, r * 2, i * 2),
      (e.fillStyle = LF),
      e.beginPath(),
      e.ellipse(
        t - r * 0.12,
        n - i * 0.1,
        r * 0.98,
        i * 0.98,
        0,
        0,
        Math.PI * 2,
      ),
      e.fill(),
      e.restore());
  }
  function hU(e, t, n, r, i) {
    e.fillStyle = `rgba(255, 79, 166, 0.45)`;
    for (let a of [-1, 1])
      (e.beginPath(),
        e.ellipse(
          t + a * r * 0.6,
          n + i * 0.12,
          r * 0.15,
          r * 0.09,
          0,
          0,
          Math.PI * 2,
        ),
        e.fill());
    ((e.fillStyle = RF),
      e.beginPath(),
      e.moveTo(t - r * 0.17, n - i * 0.02),
      e.quadraticCurveTo(t, n - i * 0.1, t + r * 0.17, n - i * 0.02),
      e.quadraticCurveTo(t + r * 0.04, n + i * 0.2, t, n + i * 0.2),
      e.quadraticCurveTo(t - r * 0.04, n + i * 0.2, t - r * 0.17, n - i * 0.02),
      e.fill());
    let a = n - i * 0.2;
    for (let n of [-1, 1])
      ((e.fillStyle = inkPurple),
        e.beginPath(),
        e.arc(t + n * r * 0.34, a, r * 0.11, 0, Math.PI * 2),
        e.fill(),
        (e.fillStyle = paperWhite),
        e.beginPath(),
        e.arc(
          t + n * r * 0.34 - r * 0.035,
          a - r * 0.04,
          r * 0.04,
          0,
          Math.PI * 2,
        ),
        e.fill());
  }
  function gU(e, t, n, r, i, a, o = 1) {
    let s = n - i * 0.62,
      c = r * o;
    ((e.fillStyle = a[0]),
      e.beginPath(),
      e.ellipse(t, s, c * 0.66, c * 0.5, 0, Math.PI, 0),
      e.closePath(),
      e.fill(),
      (e.fillStyle = a[1]),
      e.beginPath(),
      e.roundRect(t - c * 0.72, s - c * 0.04, c * 1.44, c * 0.2, c * 0.08),
      e.fill(),
      e.beginPath(),
      e.arc(t, s - c * 0.56, c * 0.14, 0, Math.PI * 2),
      e.fill());
  }
  function _U(e, t, n, r, i, a = 1) {
    let o = r * 1.08;
    (mU(e, t, n, r, o),
      e.save(),
      e.beginPath(),
      e.ellipse(t, n, r, o, 0, 0, Math.PI * 2),
      e.clip(),
      (e.fillStyle = pU));
    for (let i of [-1, 1])
      (e.beginPath(),
        e.ellipse(
          t + i * r * 0.84,
          n + o * 0.3,
          r * 0.2,
          o * 0.3,
          i * 0.35,
          0,
          Math.PI * 2,
        ),
        e.fill());
    (e.restore(), hU(e, t, n, r, o), i && gU(e, t, n, r, o, i, a));
  }
  function vU(e, t, n) {
    let r = t * 0.08;
    ((e.fillStyle = palette.yellow),
      e.beginPath(),
      e.roundRect(0, 0, t, n, r),
      e.fill());
    let i = t * 0.05;
    ((e.strokeStyle = inkPurple),
      (e.lineWidth = t * 0.024),
      e.beginPath(),
      e.roundRect(i, i, t - 2 * i, n - 2 * i, r - i * 0.6),
      e.stroke(),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      (e.fillStyle = inkPurple),
      (e.font = XH(t * 0.185)),
      e.fillText(`WANTED`, t / 2, n * 0.175, t * 0.76));
    let a = t * 0.16,
      o = n * 0.29,
      s = t - 2 * a,
      c = n * 0.45;
    (e.save(),
      e.beginPath(),
      e.roundRect(a, o, s, c, t * 0.04),
      (e.fillStyle = blue),
      e.fill(),
      e.clip(),
      _U(e, t / 2, o + c * 0.72, c * 0.37, dU, 1.4),
      e.restore(),
      (e.fillStyle = inkPurple),
      (e.font = XH(t * 0.115)),
      e.fillText(`FOR FRIES`, t / 2, n * 0.85, t * 0.72));
  }
  var yU = (e, t, n) => {
    for (let e = 0; e < 56; e++) oH();
    let r = e.createLinearGradient(0, 0, 0, n);
    (r.addColorStop(0, palette.lilac),
      r.addColorStop(1, `#ffc6e4`),
      (e.fillStyle = r),
      e.fillRect(0, 0, t, n),
      e.save(),
      e.translate(t / 2, n / 2),
      e.rotate(-0.75),
      (e.fillStyle = `rgba(255, 255, 255, 0.4)`),
      e.fillRect(-t, -n * 0.3, t * 2, n * 0.09),
      e.fillRect(-t, -n * 0.16, t * 2, n * 0.035),
      e.restore());
    let i = e.createRadialGradient(
      t / 2,
      n / 2,
      t * 0.3,
      t / 2,
      n / 2,
      t * 0.5,
    );
    (i.addColorStop(0, `rgba(27, 21, 64, 0)`),
      i.addColorStop(1, `rgba(27, 21, 64, 0.5)`),
      (e.fillStyle = i),
      e.fillRect(0, 0, t, n),
      bU(e, t / 2, n / 2, t / 2, `rgba(255, 255, 255, 0.45)`));
    let a = t * 0.62,
      o = n * 0.72;
    (e.save(), e.translate((t - a) / 2, (n - o) / 2), vU(e, a, o), e.restore());
  };
  function bU(e, t, n, r, i) {
    let a = 0.52 * Math.SQRT1_2 * r;
    (e.save(),
      e.beginPath(),
      e.arc(t, n, r * 0.84, 0, Math.PI * 2),
      e.clip(),
      e.beginPath(),
      e.rect(t - r, n - r, 2 * r, 2 * r),
      e.arc(t + a, n + a, r * 1.15, 0, Math.PI * 2, !0),
      (e.fillStyle = i),
      e.fill(`evenodd`),
      e.restore());
  }
  var xU = (e, t, n) => {
    ((e.fillStyle = blue),
      e.fillRect(0, 0, t, n),
      (e.strokeStyle = paperWhite),
      (e.lineWidth = n * 0.035),
      e.beginPath(),
      e.roundRect(n * 0.06, n * 0.06, t - n * 0.12, n * 0.88, n * 0.09),
      e.stroke());
    let r = n * 0.14,
      i = n * 0.66,
      a = n * 0.14,
      o = n * 0.32,
      s = n * 0.39,
      c = n * 0.115,
      l = o / 2,
      u = (t - s) / 2;
    (e.beginPath(),
      e.moveTo(u, r),
      e.lineTo(u + s - l, r),
      e.arc(u + s - l, r + l, l, -Math.PI / 2, Math.PI / 2),
      e.lineTo(u + a, r + o),
      e.lineTo(u + a, i),
      e.lineTo(u, i),
      e.closePath(),
      e.moveTo(u + a, r + c),
      e.lineTo(u + s - l, r + c),
      e.arc(u + s - l, r + l, l - c, -Math.PI / 2, Math.PI / 2),
      e.lineTo(u + a, r + o - c),
      e.closePath(),
      (e.fillStyle = paperWhite),
      e.fill(`evenodd`),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      (e.font = XH(n * 0.105)),
      e.fillText(`2 EGGS / HOUR`, t / 2, n * 0.8, t * 0.76));
    let d = t * 0.78,
      f = n * 0.075;
    ((e.fillStyle = paperWhite),
      e.beginPath(),
      e.ellipse(d, f, n * 0.05, n * 0.03, -0.1, 0, Math.PI * 2),
      e.fill());
    for (let [t, r, i] of [
      [-0.028, 0.085, 0.014],
      [0.016, 0.05, 0.011],
    ])
      (e.beginPath(),
        e.roundRect(d + n * (t - i * 0.7), f, n * i * 1.4, n * r, n * i * 0.7),
        e.arc(d + n * t, f + n * r, n * i, 0, Math.PI * 2),
        e.fill());
    for (let [t, r, i] of [
      [-0.07, -0.012, 0.009],
      [0.066, 0.006, 0.007],
      [0.05, -0.03, 0.006],
    ])
      (e.beginPath(),
        e.arc(d + n * t, f + n * r, n * i, 0, Math.PI * 2),
        e.fill());
    ((e.fillStyle = fU),
      e.beginPath(),
      e.ellipse(
        d + n * 0.012,
        f + n * 0.006,
        n * 0.022,
        n * 0.012,
        -0.1,
        0,
        Math.PI * 2,
      ),
      e.fill());
  };
  function SU(e, t, n, r = 0.56) {
    return (i, a, o) => {
      ((i.fillStyle = t),
        i.fillRect(0, 0, a, o),
        (i.strokeStyle = n),
        (i.lineWidth = o * 0.08),
        i.strokeRect(o * 0.1, o * 0.1, a - o * 0.2, o * 0.8),
        (i.fillStyle = n),
        (i.font = XH(o * r)),
        (i.textAlign = `center`),
        (i.textBaseline = `middle`),
        i.fillText(e, a / 2, o * 0.55, a * 0.8));
    };
  }
  var CU = (e, t, n) => {
    ((e.fillStyle = palette.cream), e.fillRect(0, 0, t, n));
    for (let r = 0; r < 22; r++)
      rH(
        e,
        YV(cH(37)),
        sH(0.12, 0.88) * t,
        sH(0.1, 0.9) * n,
        sH(0.14, 0.24) * n,
        sH(-0.6, 0.6),
      );
  };
  var wU = (e, t, n) => {
    ((e.fillStyle = palette.yellow),
      e.fillRect(0, 0, t, n),
      rH(e, 0, t / 2, n / 2, n * 0.95, 0.2));
  };
  function TU(e, t) {
    return (n, r, i) => {
      let a = r / 256;
      ((n.fillStyle = palette.cream),
        n.fillRect(0, 0, r, i),
        (n.fillStyle = t),
        n.fillRect(0, 0, r, 14 * a),
        (n.fillStyle = inkPurple),
        (n.font = ZH(30 * a)),
        n.fillText(e[0], 24 * a, 62 * a),
        n.fillText(e[1], 24 * a, 98 * a));
      for (let e = 0; e < 5; e++)
        n.fillRect(24 * a, 130 * a + e * 22 * a, sH(90, 200) * a, 8 * a);
      ((n.font = ZH(16 * a)),
        (n.strokeStyle = inkPurple),
        (n.lineWidth = 2 * a),
        n.setLineDash([6 * a, 5 * a]));
      for (let e = 0; e < 6; e++) {
        let t = 8 * a + e * 40 * a;
        (n.beginPath(),
          n.moveTo(t + 36 * a, 250 * a),
          n.lineTo(t + 36 * a, i),
          n.stroke(),
          n.save(),
          n.translate(t + 14 * a, 262 * a),
          n.rotate(Math.PI / 2),
          n.fillText(`1405`, 0, 0),
          n.restore());
      }
      n.setLineDash([]);
    };
  }
  var EU = (e, t, n) => {
    ((e.fillStyle = `#efe6c8`),
      e.fillRect(0, 0, t, n),
      (e.fillStyle = `rgba(27, 21, 64, 0.08)`));
    for (let r = 0; r < t; r += 6) e.fillRect(r, 0, 2, n);
  };
  function DU(e) {
    return (t, n, r) => {
      if (e === `checker`) {
        let e = n / 16;
        ((t.fillStyle = `#f2f0e6`),
          t.fillRect(0, 0, n, r),
          (t.fillStyle = `#0a0814`));
        for (let n = 0; n * e < r; n++)
          for (let r = 0; r < 16; r++)
            (r + n) % 2 && t.fillRect(r * e, n * e, e, e);
        return;
      }
      let [i, a] =
        e === `hazard`
          ? [palette.yellow, inkPurple]
          : [paperWhite, palette.hotPink];
      ((t.fillStyle = i), t.fillRect(0, 0, n, r), (t.fillStyle = a));
      let o = n / 12;
      for (let e = -r; e < n + r; e += o * 2)
        (t.beginPath(),
          t.moveTo(e, r),
          t.lineTo(e + o, r),
          t.lineTo(e + o + r, 0),
          t.lineTo(e + r, 0),
          t.fill());
    };
  }
  var OU = 6.4;
  var kU = {
    dontWait: (e, t, n) => {
      ((e.fillStyle = blue),
        e.fillRect(0, 0, t, n),
        (e.fillStyle = paperWhite),
        e.fillRect(0, n * 0.08, t, n * 0.04),
        e.fillRect(0, n * 0.88, t, n * 0.04),
        (e.font = XH(n * 0.5)),
        (e.textAlign = `center`),
        (e.textBaseline = `middle`),
        e.fillText(`DON'T WAIT.`, t / 2, n * 0.53));
    },
    scroll: (e, t, n) => {
      ((e.fillStyle = palette.hotPink),
        e.fillRect(0, 0, t, n),
        (e.font = XH(n * 0.5)),
        (e.textAlign = `center`),
        (e.textBaseline = `middle`),
        (e.lineJoin = `round`),
        (e.fillStyle = paperWhite),
        e.fillText(`SCROLL DOWN`, t / 2, n * 0.53, t * 0.74),
        (e.strokeStyle = palette.yellow),
        (e.lineWidth = n * 0.11),
        (e.lineCap = `round`));
      for (let r of [0.065, 0.935])
        (e.beginPath(),
          e.moveTo(t * r - n * 0.17, n * 0.36),
          e.lineTo(t * r, n * 0.62),
          e.lineTo(t * r + n * 0.17, n * 0.36),
          e.stroke());
    },
    mesq: (e, t, n) => {
      ((e.fillStyle = palette.hotPink),
        e.fillRect(0, 0, t, n),
        (e.fillStyle = paperWhite),
        (e.font = XH(n * 0.52)),
        (e.textBaseline = `middle`),
        (e.textAlign = `center`));
      for (let r = 0; r < 3; r++)
        e.fillText(r % 2 ? `✦` : `mesq`, t * (0.2 + r * 0.3), n * 0.54);
    },
    hazard: DU(`hazard`),
    lookUp: (e, t, n) => {
      ((e.fillStyle = palette.cyan),
        e.fillRect(0, 0, t, n),
        (e.fillStyle = inkPurple),
        (e.font = ZH(n * 0.46)),
        (e.textAlign = `center`),
        (e.textBaseline = `middle`),
        e.fillText(`LOOK UP ↑ LOOK UP`, t / 2, n * 0.54));
    },
    keepGoing: (e, t, n) => {
      ((e.fillStyle = inkPurple),
        e.fillRect(0, 0, t, n),
        (e.fillStyle = palette.orange),
        e.fillRect(0, 0, n * 0.9, n),
        (e.fillStyle = inkPurple),
        (e.font = XH(n * 0.6)),
        (e.textBaseline = `middle`),
        (e.textAlign = `center`),
        e.fillText(`→`, n * 0.45, n * 0.52),
        (e.fillStyle = palette.yellow),
        (e.font = ZH(n * 0.42)),
        e.fillText(`KEEP GOING`, (t + n * 0.9) / 2, n * 0.54));
    },
  };
  var AU = (e, t, n) => {
    ((e.fillStyle = palette.yellow),
      e.fillRect(0, 0, t, n),
      (e.strokeStyle = inkPurple),
      (e.lineWidth = n * 0.08),
      e.strokeRect(n * 0.08, n * 0.08, t - n * 0.16, n * 0.84),
      (e.fillStyle = inkPurple),
      (e.font = XH(n * 0.5)),
      (e.textAlign = `left`),
      (e.textBaseline = `middle`));
    let r = `230V`,
      i = e.measureText(r),
      a = n * 0.3,
      o = n * 0.48,
      s = n * 0.12,
      c = (t - a * 1.04 - s - i.actualBoundingBoxRight) / 2,
      l = n * 0.54,
      u = l + (i.actualBoundingBoxDescent - i.actualBoundingBoxAscent) / 2,
      d = [
        [0.58, 0],
        [0.04, 0.58],
        [0.44, 0.58],
        [0.3, 1],
        [0.96, 0.38],
        [0.56, 0.38],
        [0.8, 0],
      ];
    e.beginPath();
    for (let [t, n] of d) e.lineTo(c + t * a, u + (n - 0.5) * o);
    (e.closePath(), e.fill(), e.fillText(r, c + a + s, l));
  };
  return {
    XH,
    ZH,
    $H,
    eU,
    nU,
    rU,
    aU,
    oU,
    sU,
    cU,
    lU,
    uU,
    yU,
    xU,
    SU,
    CU,
    wU,
    TU,
    EU,
    DU,
    OU,
    kU,
    AU,
  };
}
