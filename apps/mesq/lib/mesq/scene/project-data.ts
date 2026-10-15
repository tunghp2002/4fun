// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import type { ExperienceScope } from '../lifetime';
import type { createPaletteModule } from './palette';
export function createProjectDataModule(scope: ExperienceScope, { paletteModule }: { paletteModule: ReturnType<typeof createPaletteModule> }) {
  const { palette } = paletteModule;
  var projects = [
    {
      id: `MQ-001`,
      title: `Wave Shaders`,
      subtitle: `my first three.js project: GLSL waves`,
      url: `https://wave-shaders.vercel.app/`,
      image: `/projects/wave-shaders.jpg`,
      accent: palette.teal,
      sticker: 33,
    },
    {
      id: `MQ-002`,
      title: `Gameboy`,
      subtitle: `my first Three.js Journey Challenge`,
      url: `https://gameboy-tawny.vercel.app/`,
      image: `/projects/gameboy.jpg`,
      accent: palette.hotPink,
      sticker: 26,
      journey: !0,
    },
    {
      id: `MQ-003`,
      title: `Tatooine`,
      subtitle: `Star Piece on Tatooine, a LEGO diorama`,
      url: `https://tatooine.vercel.app/`,
      image: `/projects/tatooine.jpg`,
      accent: palette.cyan,
      sticker: 2,
      journey: !0,
    },
    {
      id: `MQ-004`,
      title: `Cabin`,
      subtitle: `hand-painted, for a Three.js Journey Challenge`,
      url: `https://mesq.me/cabin/`,
      image: `/projects/cabin.jpg`,
      accent: palette.yellow,
      sticker: 21,
      journey: !0,
    },
    {
      id: `MQ-005`,
      title: `Infinite Terrain`,
      subtitle: `a generated world that streams as you walk`,
      url: `https://mesq.me/infinite-terrain/`,
      image: `/projects/infinite-terrain.jpg`,
      accent: palette.lime,
      sticker: 15,
    },
    {
      id: `MQ-006`,
      title: `Utanomori`,
      subtitle: `a stylized forest of lost music spirits`,
      url: `https://mesq.me/utanomori/`,
      image: `/projects/utanomori.jpg`,
      accent: palette.yellow,
      sticker: 14,
      journey: !0,
    },
    {
      id: `MQ-007`,
      title: `Typo's Voyage`,
      subtitle: `a typing game for kids, made at EdClub`,
      url: `https://typos-voyage.edclub.io/#/intermediate/a-new-chart`,
      image: `/projects/typos-voyage.jpg`,
      accent: palette.orange,
      sticker: 16,
    },
    {
      id: `MQ-008`,
      title: `Jelly Painting`,
      subtitle: `TSL practice with hand-painted normals`,
      url: `https://mesq.me/jelly-painting/`,
      image: `/projects/jelly-painting.jpg`,
      accent: palette.pink,
      sticker: 29,
    },
    {
      id: `MQ-MORE`,
      title: `Stay tuned`,
      subtitle: `new projects on the way`,
      url: ``,
      accent: palette.purple,
      sticker: 12,
      teaser: !0,
    },
  ];
  var SY = [
    `gameboy`,
    `tree`,
    `ghost`,
    `kiwi`,
    `mushroom`,
    `cherries`,
    `star`,
    `bird`,
    `r2d2`,
  ];
  var CY = `#f6f6f4`;
  return {
    projects,
    SY,
    CY,
  };
}
