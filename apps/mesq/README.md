# mesq — bird street

**Original work by [mesq](https://mesq.me/). This is an unofficial educational port, not an original design or the author's source repository.** The original scene code, 3D artwork, interactions, styling, portfolio content and photographs come from mesq's published website.

See [CREDITS.md](CREDITS.md) for the source inventory, adaptation boundaries and retained license notices. No affiliation, endorsement or permission from mesq is claimed.

The full [mesq.me](https://mesq.me/) experience ported into a **Next.js / React app**, with a typed shell and readable scene modules. It retains the original pole, birds, sky, scroll stops, About exhibits, nine project cards, menu, helper, sound, interactions and postprocessing. Three.js comes from npm; the original minified bundle is not shipped.

## Run

Requires Node.js 20.9+ and pnpm 9.15.9.

```sh
cd apps/mesq
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:3013>. Click Start for sound or the quiet button to enter silently. Scroll, use the section menu, interact with the birds and signs, or browse the project cards. `?view=simple` opens the HTML portfolio; hashes such as `#about` and `#mq-008` open the corresponding stop after Start.

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

`build` creates the static export in `out/`; `start` serves it with Python 3. The hosted version is <https://mesq-clone.atsimet.chatgpt.site>.

## Read the code

| File | Responsibility |
| --- | --- |
| [app/page.tsx](app/page.tsx), [app/layout.tsx](app/layout.tsx) | Next route, metadata, font loading and CSS. |
| [components/Portfolio.tsx](components/Portfolio.tsx) | JSX for Start, canvas, navigation, sections and simple view. |
| [lib/mesq/experience.ts](lib/mesq/experience.ts) | Typed bootstrap, fallback and React mount coordination. |
| [lib/mesq/lifetime.ts](lib/mesq/lifetime.ts) | Cancel scene work and dispose DOM, audio and GPU resources. |
| [lib/mesq/scene/main.js](lib/mesq/scene/main.js) | Compose scene factories, camera, interaction and render loop. |
| [project-data.ts](lib/mesq/scene/project-data.ts), [about-data.ts](lib/mesq/scene/about-data.ts), [palette.ts](lib/mesq/scene/palette.ts) | Project content, About cards and colors. |
| [performance.ts](lib/mesq/scene/performance.ts) | Original quality tiers, DPR limits and scroll timing, with types and descriptive names. |
| [scroll-input.js](lib/mesq/scene/scroll-input.js), [scroll-effects.js](lib/mesq/scene/scroll-effects.js), [layout.js](lib/mesq/scene/layout.js) | Mouse/touch scrolling, movement and camera framing. |
| [birds.js](lib/mesq/scene/birds.js), [signpost.js](lib/mesq/scene/signpost.js), [stickers.js](lib/mesq/scene/stickers.js) | Procedural geometry, art and animation. |
| [sky.js](lib/mesq/scene/sky.js), [rendering.js](lib/mesq/scene/rendering.js) | Day/night sky, TSL materials, bloom and printed appearance. |
| [showcase-cards.js](lib/mesq/scene/showcase-cards.js), [demo-showcase.js](lib/mesq/scene/demo-showcase.js) | Projects and interactive About exhibits. |
| [audio.js](lib/mesq/scene/audio.js), [helper.js](lib/mesq/scene/helper.js) | Synthesized sound and the interactive helper. |

Each `create…Module(scope, dependencies)` owns fresh scene state. `startScene` connects those modules. React owns persistent markup; the engine owns dynamic scene nodes. Cleanup targets its own resources and leaves Next's browser machinery alone. StrictMode reuses the current mount; a later real mount waits for the previous renderer to finish disposing.

Start by changing project data or colors, then read `performance.ts`, `scroll-input.js` and `main.js` to follow how input becomes animation.

## Implementation and verification

[Implementation notes](docs/reconstruction.md) describe the module structure and verification. The Next shell, lifecycle, content and performance module use strict TypeScript. The scene engine uses JavaScript modules adapted from the original application.

The port retains the original WebGPU renderer with WebGL2 fallback, TSL effects and adaptive quality. Full quality starts at DPR ≤ 2; sustained slow frames lower bloom, resolution and shadows using the original thresholds.

Unit tests cover lifecycle cancellation, late cleanup, quality transitions and scroll timing. Browser comparison checks desktop/mobile layout, Start, navigation, sound and missing assets. Headless software-rendering timings do not establish physical-device FPS; physical devices and other browsers have not been checked.

The ten photographs are eight project covers and two About cards used by the original experience. Fonts retain SIL OFL notices in `public/fonts`; Three.js retains its npm MIT license. Original design, content and photographs are credited to mesq.

[Desktop](images/preview.png) · [Mobile](images/mobile.png) · [Projects](images/projects.png)
