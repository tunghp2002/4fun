// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import type { ExperienceScope } from '../lifetime';
export function createPaletteModule(scope: ExperienceScope) {
  var paperWhite = `#f6f6f4`;
  var charcoal = `#0b0b0c`;
  var blue = `#1a6dff`;
  var eveningSkyTop = `#191185`;
  var eveningSkyBottom = `#45138c`;
  var polePurple = `#8091e4`;
  var amber = `#f4ad25`;
  var shadowPurple = `#2b2140`;
  var nightPurple = `#141020`;
  var paleBlue = `#e9edf7`;
  var acidGreen = `#7dff4a`;
  var inkPurple = `#1b1540`;
  var palette = {
    pink: `#ff4fa6`,
    hotPink: `#ff2e7e`,
    orange: `#ff7a1a`,
    yellow: `#ffd23a`,
    lime: `#8cf03c`,
    green: `#22c27a`,
    teal: `#3ec7c4`,
    cyan: `#62e3ff`,
    purple: `#8a5cff`,
    lilac: `#c9a6ff`,
    red: `#ff3b3b`,
    cream: `#fff6df`,
  };
  var IF = `#ffcaed`;
  var LF = `#f4f2ea`;
  var RF = `#ec8676`;
  return {
    paperWhite,
    charcoal,
    blue,
    eveningSkyTop,
    eveningSkyBottom,
    polePurple,
    amber,
    shadowPurple,
    nightPurple,
    paleBlue,
    acidGreen,
    inkPurple,
    palette,
    IF,
    LF,
    RF,
  };
}
