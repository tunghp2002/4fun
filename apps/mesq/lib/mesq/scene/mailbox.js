// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import {
  BoxGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  ShapeGeometry,
  Vector2,
} from "three/webgpu";
export function createMailboxModule(
  scope,
  { paletteModule, stickersModule, postAtlasModule },
) {
  const { blue, shadowPurple, paleBlue, palette } = paletteModule;
  const { Z, mH, createPart, $, xH, CH, AH, LH, VH, bakeStaticGeometry } =
    stickersModule;
  const { ZY, QY, $Y } = postAtlasModule;
  function eX(e, t, n) {
    let { hw: r, hr: i, len: a } = ZY;
    ((createPart(
      $(
        `mailBody`,
        () =>
          new ExtrudeGeometry($Y(r, i), {
            depth: a,
            bevelEnabled: !0,
            bevelSize: 0.012,
            bevelThickness: 0.012,
            bevelSegments: 2,
            curveSegments: 20,
          }),
      ),
      blue,
      e,
    ).position.z = -a / 2),
      createPart(
        $(`mailMouth`, () => new ShapeGeometry($Y(r - 0.025, i), 12)),
        shadowPurple,
        e,
      ).position.set(0, 0.02, a / 2 + 0.0125),
      VH(e, AH(Z(-r - 0.012, i / 2, 0), Z(0, 0, 1), Z(0, 1, 0)), {
        count: 1,
        size: [0.1, 0.15],
        hw: 0.2,
        hh: i / 2 - 0.01,
        avoid: (e, t, n) => Math.hypot(e + 0.1, t - (0.1 - i / 2)) < 0.05 + n,
      }));
    let o = new Group();
    ((o.name = `${n}_DoorHinge`),
      o.position.set(0, 0, a / 2 + 0.004),
      t.add(o));
    let s = new Group();
    ((s.position.y = -0.004),
      o.add(s),
      createPart(
        $(
          `mailDoor`,
          () =>
            new ExtrudeGeometry($Y(r + 0.006, i), {
              depth: 0.02,
              bevelEnabled: !0,
              bevelSize: 0.008,
              bevelThickness: 0.008,
              bevelSegments: 1,
              curveSegments: 20,
            }),
        ),
        blue,
        s,
      ));
    let c = 0.028;
    (createPart(
      $(`mailHandle`, () => new BoxGeometry(0.07, 0.025, 0.03)),
      palette.yellow,
      s,
    ).position.set(0, 0.07, c),
      LH(
        s,
        AH(Z(0, 0, c), Z(1, 0, 0), Z(0, 1, 0)),
        0,
        QY.y,
        QY.w,
        QY.h,
        0,
        mH(`mailLabel`),
        0.003,
      ),
      bakeStaticGeometry(o, `${n}_Door`, !0));
    let l = -r - 0.012,
      u = new Group();
    return (
      (u.name = `${n}_FlagPivot`),
      u.position.set(l - 0.012, 0.1, -0.1),
      (u.rotation.x = ZY.flagDown),
      t.add(u),
      createPart(
        $(`mailFlagPost`, () => new BoxGeometry(0.024, 0.32, 0.024)),
        palette.red,
        u,
      ).position.set(0, 0.13, 0),
      createPart(
        $(`mailFlag`, () => new BoxGeometry(0.014, 0.11, 0.18)),
        palette.red,
        u,
      ).position.set(-0.005, 0.235, -0.1),
      bakeStaticGeometry(u, `${n}_Flag`, !0),
      xH(e, Z(l, 0.1, -0.1), Z(-1, 0, 0), paleBlue, 0.018),
      {
        door: o,
        flag: u,
        height: i + r,
      }
    );
  }
  var tX = {
    w: 0.96,
    h: 0.31,
    d: 0.14,
  };
  var nX = {
    w: 0.9,
    h: 0.26,
    depth: 0.012,
  };
  var rX = {
    r: 0.098,
    travel: 0.02,
    x: 0.3,
  };
  var iX = {
    w: 0.24,
    cols: 17,
    rows: 7,
  };
  var aX = (iX.w * iX.rows) / iX.cols;
  var oX = `#8a2234`;
  var sX = {
    period: 1.3,
    on: 0.85,
  };
  var cX = {
    k: 1600,
    zeta: 0.42,
  };
  var lX = 0.09;
  var uX = {
    wait: 0.09,
    slop: 10,
    undo: 0.4,
  };
  var dX = [1.15, 0.13, 0.13];
  var fX = {
    scale: 0.1,
    shade: 0.5,
  };
  var pX = {
    P: [`###`, `#.#`, `###`, `#..`, `#..`],
    L: [`#..`, `#..`, `#..`, `#..`, `###`],
    A: [`.#.`, `#.#`, `###`, `#.#`, `#.#`],
    Y: [`#.#`, `#.#`, `.#.`, `.#.`, `.#.`],
  };
  var mX = pX.P.map((e, t) =>
    [`P`, `L`, `A`, `Y`].map((e) => pX[e][t]).join(`.`),
  );
  var hX = () =>
    $(`pongCap`, () => {
      let e = rX.r;
      return new LatheGeometry(
        [
          [e, -0.03],
          [e, 0.004],
          [e - 0.002, 0.011],
          [e - 0.006, 0.017],
          [e - 0.012, 0.0215],
          [e - 0.02, 0.0235],
          [e * 0.5, 0.025],
          [0, 0.0255],
        ].map(([e, t]) => new Vector2(e, t)),
        40,
      ).rotateX(Math.PI / 2);
    });
  var gX = () =>
    $(
      `pongArrow`,
      () =>
        new ExtrudeGeometry(
          CH(
            [
              new Vector2(-0.03, 0.039),
              new Vector2(0.0425, 0),
              new Vector2(-0.03, -0.039),
            ],
            0.01,
          ),
          {
            depth: 0.004,
            bevelEnabled: !1,
            curveSegments: 4,
          },
        ),
    );
  return {
    eX,
    tX,
    nX,
    rX,
    iX,
    aX,
    oX,
    sX,
    cX,
    lX,
    uX,
    dX,
    fX,
    mX,
    hX,
    gX,
  };
}
