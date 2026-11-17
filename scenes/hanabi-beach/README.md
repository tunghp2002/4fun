# Hanabi — Pastel Beach Fireworks

An interactive, illustrated beach-festival miniature based on inspected Pinterest artwork: [Anime-Inspired Fireworks](https://www.pinterest.com/pin/768145280220406157/) for the pastel gold/pink/cyan palette and broad luminous blooms, and [Fireworks Anime](https://www.pinterest.com/pin/676525175308363841/) for glittering tips and curved trails. Photographic references are excluded.

Open `index.html` directly in a browser with WebGL. The single HTML embeds its libraries, geometry, textures, shaders and animation; it works offline without installation or a server.

- Drag to orbit, right-drag to pan, scroll to zoom.
- Use one finger to orbit and two fingers to pan/pinch on touch screens.
- Home resets, arrows orbit, +/- zoom, Space pauses/resumes.
- Reduced motion opens a composed still view while retaining navigation. Hidden pages pause rendering.

## Scene

A complete 32 × 32 square plinth holds a gently sloping beach, lapping foam, dark blue water and a 2.4-metre boardwalk. Two food kiosks have supported striped canopies, counters, shelves, dishes, food trays, condiment bottles, serving equipment and warm lamps. A separate drinks cart and three modern metal benches occupy the landward apron, keeping the main walking strip clear.

Paper lanterns hang from sagging wires between founded poles. The lifeguard tower has braced legs, a landed stair, supported handrails, a platform, a seat, a roof and a life ring. Four palms have distinct curved trunks with connected pinnate leaflets. Dense coastal grass fills narrow side planting bands. Offshore floating platforms provide clear origins for the animated launches.

The materials, painted sky texture, soft particle halos and restrained pastel colors translate the illustration into code. No people, reference-image pixels or visible interface elements are included.

## Animated display

The 50-second show contains 24 staggered launches and several styles: spherical blooms, drooping gold willows, tilted rings and delayed secondary crackles. Shells slow as they rise. Sparks follow analytic drag/gravity trajectories, fade before reaching the sea, and leave curved segmented trails. Soft flashes, drifting smoke and short-lived colored lights complete each burst.

Heads and trails use preallocated buffers shared across the whole show. The fixed pool holds 4,114 heads and twelve trail segments per head. A second additive pass reuses the head geometry for soft glow. Static solid fittings are instanced, the moon shadow is cached, and device pixel ratio is capped at 1.6. Detail is retained while navigating.

One live 640 × 640 planar mirror reflects the same particles and sky. Surface distortion and the narrow shore-foam ribbon share the show clock. Reflections remain animated when the camera is still; their visible position varies naturally with the viewing angle.

This is an art-directed collectible model, not a surveyed beach or a real-world fireworks layout. Atmospheric distances, heights and timing are compressed for the composition. The wave, smoke and light effects are visual approximations. The scene is silent.

## Verification

[Trajectory checks](check-motion.mjs) validate exact launch/burst endpoints, slowing ascent, drag, falling motion and finite positions. [Browser checks](check-scene.mjs) cover the complete show, particle capacity and burnout height, initial framing, actual frame changes, changing raw reflection pixels, stable resources, offline behavior and desktop/touch/keyboard controls. [Recorded results](checks.json) contain the tested HTML hash.

Run `node check-motion.mjs` with Node.js. Browser checks additionally need Playwright and Chromium; run `node check-scene.mjs` when Playwright is available. Existing installations can be selected with `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH`. These development tools are optional for viewing the HTML.

The browser run used Chromium with software WebGL at 1600 × 1100 and portrait 390 × 844. Real-device frame rate and other browser engines have not been measured.

## Actual captures

[Overview](images/preview.png) · [Beach detail](images/detail.png) · [Food kiosk](images/kiosk.png) · [Lifeguard tower](images/tower.png) · [Fireworks](images/fireworks.png) · [Different show time](images/fireworks-later.png) · [Water](images/water.png) · [Reverse](images/reverse.png) · [Overhead](images/overhead.png) · [Phone](images/mobile.png)

[Reusable prompt](PROMPT.md) · [Art references and credits](ASSETS.md)
