# Koyo — Autumn Tea Garden

An interactive illustrated garden with red/gold maples, a furnished tea house and ten detailed koi moving beneath clear reflective water. Its warm palette and architecture are inspired by the inspected [Japanese House by the Water artwork](https://www.pinterest.com/pin/japanese-house-by-the-water--703756186567143/).

Open [index.html](index.html) directly in a browser with WebGL. The HTML embeds its engine, models, textures, shaders and animation and works offline without installation or a server. GitHub displays the source; download the file to interact with it.

- Drag to orbit, right-drag to pan, scroll to zoom.
- On a touch screen, use one finger to orbit and two fingers to pan/pinch.
- Home resets, arrows orbit, +/- zoom, Space pauses/resumes.
- Reduced motion opens a still composition while keeping navigation available. Hidden pages pause rendering.

## The koi

Each fish has a smooth closed body with more than 3,000 vertices, a full shoulder, a tapered tail root, a small mouth, four barbels, small eyes, nostrils and curved gill-cover details. Seven fin surfaces include paired pectoral and pelvic fins, a dorsal fin, an anal fin and a forked tail. Thin fin membranes show their rays and remain partly translucent.

Ten individually painted textures give the fish different cream, red, black and metallic gold patterns. Fine scale marks and a subtle scale bump map add surface detail. Shapes and materials are original procedural models, guided by an inspected koi anatomy illustration.

Each koi independently chooses a new destination and action after a randomly selected interval. Actions include cruising, hovering, slow foraging, approaching shallower water and occasional short faster movements. Targets span the broad basin and can cross its center; there is no shared circular current. Speed, turning, depth, mouth openings and rest intervals vary independently. Body and fin strokes integrate smoothly as speed changes. Shoreline avoidance and neighbor separation keep motion continuous, submerged and clear of the floor. Each page load starts a fresh random behavior sequence; fixed-seed replay is available to the verification scripts.

## The garden

A complete 32 × 32 plinth holds a broad swimming pond and a narrow inlet. The inlet bridge connects the eastern path to the tea-house side stair. Its handrails connect to founded posts, and the stair meets an open side entrance. The tea-house veranda has visible supports and a railing along the pond-facing edge.

Inside are tatami mats, floor cushions, a low table with a teapot, cups and sweets, pottery shelves and a scroll alcove. Open shoji panels and a side window allow views into the room. The curved hipped roof has individually capped eaves and ridges, laid tile courses with surface relief, a closed underside and visible rafters. Wainscot boards, textured shoji paper, woven tatami, cloth cushions, drawer hardware and bamboo blinds enrich the interior. Copper rain chains meet stone catch bowls, and a stone basin with a bamboo spout occupies a clear pocket beside the tea approach.

Six maples vary in height, crown width, lean and branch layout. Their curved tapering trunks and branches carry 90 overlapping crown clusters with 42,300 individually oriented leaves. Serrated silhouettes, veins and mottled leaf textures make the crowns readable in close views without exposed solid crown masses. Irregular beveled flagstones follow the curving paths, with moss in the joints and an additional front connecting route. Textured moss, short ground cover, evergreen shrubs, 100 fern plants, small flower groups, varied half-buried boulders and fallen leaves form layers below the maples. A bamboo backdrop and garden lanterns complete the dry garden. Both benches sit on separate paved rest pockets beside the paths, with their seat/back/arm footprints clear of the walking corridor. Planting is excluded from these pockets. A small rear rock cascade, 48 floating leaves, 68 drifting leaves, gentle surface rings and moving underwater light patterns add motion. Falling leaves choose fresh starting branches, trajectories, lifetimes and waiting intervals on each descent. Floating-leaf drift is smooth and nonperiodic, while surface rings appear at irregular intervals near the fish. No people, sound or visible interface are included.

The 640 × 640 live reflection blends more strongly at low viewing angles and remains restrained from above, preserving a view of the koi and pond bed. Water transparency, caustic light, fins and swimming behavior are visual approximations; this is an art-directed miniature rather than an optical or animal-behavior simulation.

## Performance and verification

Static fittings, head details and foliage are instanced, tree branch sections are merged, fish geometry is shared, simulation/particle buffers are reused, static shadows are cached and device pixel ratio is capped at 1.6. Idle animation is limited to approximately 30 frames per second without reducing geometry while navigating. These are workload limits, not a measured frame-rate guarantee.

[Profile checks](check-motion.mjs) exercise the actual HTML's body-shape helper. [Behavior checks](check-behavior.mjs) replay five fixed random seeds to verify center crossings, two-way turns, all action types, spacing, depth limits and continuous travel; different seeds yield different trajectories. [Browser checks](check-scene.mjs) cover three minutes of swimming, separation, depth, continuous forward motion, deterministic seeking, resource stability, changing rendered pixels, live reflections, offline behavior and desktop/touch/keyboard controls. [Recorded results](checks.json) identify the tested HTML with SHA-256.

Run `node check-motion.mjs` and `node check-behavior.mjs`. Browser checks additionally require Playwright and Chromium: run `node check-scene.mjs`, optionally selecting existing installations through `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH`. These tools are optional for viewing the scene.

Checks use Chromium with software WebGL at 1600 × 1100 and portrait 390 × 844. Real-device GPU frame rate and other browser engines have not been measured.

## Actual captures

[Overview](images/preview.png) · [Garden](images/detail.png) · [Tea house](images/tea-house.png) · [Koi close-up](images/koi.png) · [Koi from above](images/koi-top.png) · [Swimming](images/swimming.png) · [Bridge](images/bridge.png) · [Maples](images/maples.png) · [Reverse](images/reverse.png) · [Overhead](images/overhead.png) · [Phone](images/mobile.png) · [Left rest pocket](images/left-bench.png) · [Right rest pocket](images/right-bench.png)

[Reusable prompt](PROMPT.md) · [References and credits](ASSETS.md)
