# Hotaru — Forest Firefly Shrine

An illustrated forest shrine miniature: a warm timber sanctuary, a weathered torii and stone stairs framed by full teal canopies, with independently blinking golden fireflies over a winding stream. The visual direction comes from inspected artwork, including Ddesignator's [Light in Darkness](https://medibang.com/picture/o42009212244220530002699955/), rather than photography.

Open [index.html](index.html) in a browser with WebGL. The single HTML contains its libraries, geometry, textures, shaders and animation and works offline without installation or a server. GitHub's file viewer displays source; download the HTML to interact with it.

- Drag to orbit, right-drag to pan, scroll to zoom.
- On a touch screen, drag with one finger; pan and pinch with two fingers.
- Home resets, arrows orbit, +/- zoom, Space pauses/resumes.
- Reduced motion opens a still composition while keeping navigation available. Hidden pages pause rendering.

## Composition and detail

A complete 30 × 30 square plinth holds two sloped forest banks and a stream that crosses the full model. An arched stone bridge spans opposite banks, with seven founded railing posts on each side and a clear walking width of 2.18 model units. Its north landing meets a paved forecourt. Eight broad steps connect the forecourt to the raised shrine court, followed by the three shallow veranda steps.

The shrine has stone foundations, timber framing, a curved tiled gable roof, a raised plank floor, a veranda and railings. Open central sliding doors reveal an altar, offering vessels, candles and a hanging scroll. A slatted offering box and a bell with its attached rope occupy the front veranda. Paper lanterns hang from their fittings. Six stone lanterns and a separate purification shelter complete the approach. The shelter includes a stone basin, a bamboo spout and a ladle.

Eleven seeded trees differ in height, crown width/depth, lean and branch direction. Buttressed roots meet the terrain and tapered trunks fork into 99 overlapping crown clusters with 15,840 individual leaves. Approximately 20,000 short grass blades, 148 connected fern plants, bamboo and partially buried rocks fill the planting areas while keeping the main route clear.

The scene contains no people, sound or visible interface. It is an original art-directed miniature, not a reconstruction of a particular temple or a construction drawing.

## Motion and performance

The 280 fireflies follow smooth bounded paths, each with a different speed, phase and light cycle. Their entire flight envelopes are checked against simplified volumes around the architecture and tree trunks before placement. They drift in open pockets beside the water and approach, rather than appearing throughout solid objects.

Low transparent mist and broken current strokes move along the stream. One 640 × 640 live planar reflection shares the animation clock and reflects the same animated particles. Water, fog and firefly light are restrained visual approximations.

Static fittings and foliage are instanced, firefly buffers are preallocated, the 2048 shadow map is cached and device pixel ratio is capped at 1.6. Fog density compensates for the extra camera distance needed to fit portrait screens. Idle animation is limited to approximately 30 frames per second; navigation retains the same scene detail. These measures bound rendering work; they are not a measured frame-rate guarantee.

## Verification

[Motion checks](check-motion.mjs) exercise the actual HTML's pure helpers for continuous bounded flight, blinking and connected bridge endpoints. [Browser checks](check-scene.mjs) verify two minutes of motion, obstacle separation, resource stability, actual changing pixels and reflections, offline behavior and desktop/mobile navigation. [Recorded results](checks.json) identify the tested HTML by SHA-256.

Run `node check-motion.mjs`. Browser checks additionally require Playwright and Chromium; run `node check-scene.mjs`, optionally selecting an existing installation with `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH`. These development tools are not required to view the scene.

Verification uses Chromium with software WebGL at 1600 × 1100 and portrait 390 × 844. Real-device GPU frame rate and other browser engines have not been measured.

## Actual captures

[Overview](images/preview.png) · [Detail](images/detail.png) · [Shrine](images/shrine.png) · [Bridge](images/bridge.png) · [Fireflies](images/fireflies.png) · [Later flight](images/fireflies-later.png) · [Canopy](images/canopy.png) · [Reverse](images/reverse.png) · [Overhead](images/overhead.png) · [Phone](images/mobile.png)

[Reusable prompt](PROMPT.md) · [Art references and credits](ASSETS.md)
