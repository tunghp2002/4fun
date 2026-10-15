# Implementation notes

An unofficial port of [mesq.me](https://mesq.me/). The original application, design and retained assets are mesq's work. See [CREDITS.md](../CREDITS.md) for attribution, provenance and permission status.

## Structure

Three.js r186 (`three@0.186.1`) is installed through npm. The application has 39 scene modules. Factory boundaries give each mount fresh uniforms, texture caches, controllers and audio state.

The full original stylesheet and body markup became `app/globals.css` and real JSX in `components/Portfolio.tsx`. Bootstrap and lifecycle use strict TypeScript. Palette, project/About data and quality/timing were subsequently typed. Other scene internals use JavaScript modules adapted from the original application.

Original event/timer/DOM creation calls pass through `ExperienceScope`, without global browser API patches. Unmount aborts work, stops rendering, releases audio/postprocessing/GPU resources and removes scene-owned DOM. Image decode and font-ready callbacks check cancellation. Late cleanup joins disposal; the next mount waits for it. The loader is hidden instead of removed so React retains its node. Saved sound preference survives disposal.

## Fidelity checks

The complete scene behavior is retained: long scroll sequence, touch scroll host, camera stops, About exhibits, project transitions, changing sky, birds, signs, menu/helper effects and synthesized sound. Linked projects remain links to the original external apps.

Browser QA compares reference and port at 1440×1000 and 390×844, DPR 1. Checks cover layout/scroll height, section stops, Start, project/contact navigation, audio toggles, runtime exceptions and asset loading. Preview images capture the implemented app.

| Viewport | Reference / port scroll height | Projects stop | Contacts stop |
| --- | --- | --- | --- |
| 1440×1000 | 18,110 / 18,110 px | 5,220 px | 15,660 px |
| 390×844 | 12,297 / 12,297 px | 3,494 px | 10,482 px |

All five section heights and offsets matched. Both desktop and mobile runs had zero runtime exceptions or missing assets. A separate React mount test passed early startup cancellation, full unmount/remount, one sound control per mount, removal of helper DOM and preservation of the sound preference. Four unit tests passed for lifecycle and quality/scroll behavior.

The production static export also passed mouse-wheel and touch-drag scrolling, keyboard menu dismissal, end/back navigation, the last-project deep link, render-failure fallback and `?view=simple`. All runtime assets were served locally. The temporary React lifecycle test route was removed before the final build.

Headless Chromium uses SwiftShader. Frame-time results are a same-environment comparison, not a hardware performance promise. Physical-device touch feel and browser/GPU differences still need evaluation. Animated/random scene state prevents an unconditional pixel-identical screenshot claim.
