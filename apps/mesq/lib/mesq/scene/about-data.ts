// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import type { ExperienceScope } from '../lifetime';
import type { createPaletteModule } from './palette';
export function createAboutDataModule(scope: ExperienceScope, { paletteModule }: { paletteModule: ReturnType<typeof createPaletteModule> }) {
  const { palette } = paletteModule;
  var c0 = {
    id: `EXPERIENCE`,
    title: `Experience`,
    url: `say:timetable`,
    image: `/about/conf-2.jpg`,
    accent: palette.orange,
    sticker: 40,
    caption: null,
  };
  var l0 = `https://www.flickr.com/photos/202073981@N08/`;
  var u0 = [
    c0,
    {
      id: `FILM`,
      title: `Film photos`,
      url: l0,
      image: `/about/film.jpg`,
      accent: palette.teal,
      sticker: 39,
      caption: null,
    },
  ];
  return {
    l0,
    u0,
  };
}
