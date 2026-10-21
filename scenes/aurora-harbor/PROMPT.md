# Nordlys — Aurora Harbor

Create a complete, runnable, offline single-file `index.html` in `scenes/aurora-harbor/`. Reuse the repository's embedded Three.js r160.1, OrbitControls and Reflector, retaining MIT notices. Include this reusable prompt, reference credits, concise verification notes, a browser regression check and actual rendered images. No framework, runtime HTTP requests, remote textures, visible controls or characters.

## Reference and composition

Inspect [Pinterest pin 9499849209582210](https://www.pinterest.com/pin/9499849209582210/) for the snowy cabin, dark water, starry sky and green auroral curtain. Inspect [Pinterest pin 535787686918587883](https://www.pinterest.com/pin/535787686918587883/) for Lofoten-style red waterfront cabins and rock-supported decks. Make an original compact harbor inspired by both, rather than claiming to reconstruct either site. Credit the references without redistributing their image pixels.

Build a finely made 32 × 32 square miniature, with a complete plinth, open fjord in front, a retained snowy shore, warm cabins in the middle and craggy snow-covered ridges behind. Use quiet navy, blue-gray snow, subdued red timber, warm amber interiors and mint/teal auroral light. Keep clean silhouettes and readable material layers, with enough detail to inspect close up from any side.

## Ground, buildings and access

Make the terrain solid with closed exposed cuts. Snow should settle on gentler ground and upper surfaces, exposing darker rock on steeper slopes. Use varied shoreline rocks and restrained thin coastal ice, leaving the water around the boat open.

Place two furnished cabins and a fishing store on proper foundations. Model pitched roofs, snow caps, roof seams, gables, trim, porch canopies supported by posts, chimney flashing, door mats and glazed doors/windows. Give the walls real openings so the interiors remain visible. Add credible furniture: beds, seating, coffee tables, kitchenette counters, sinks, upper cabinets, appliances, shelves, books and ceiling fixtures. Keep furniture supported and within the room, with space to walk from the door. Furnish the store with fishing supplies rather than another bedroom.

Connect the doors, stairs, store and pier with clear paths. Stairs must descend onto firm land and meet their approaches, with reasonable riser heights. Walking paths must avoid building footprints. Put crates, barrels and path lights in side bays. Every grounded object needs actual support, and all physical assets must remain inside the base.

Build a pier with deck boards, stringers, founded piles, rails, cleats, life rings and bounded boarding openings. Connect a gently sloped gangway to a moored launch. Make a shaped hull with keel, gunwales, open deck, benches, rope, fenders, a separate glazed wheelhouse, helm, roof, mast and navigation lamps. Keep the hull clear of shore and seabed. If the boat moves, mooring lines must follow its cleats rather than detaching. Keep movement small enough for the gangway and mooring arrangement.

## Vegetation and small motion

Use varied spruce proportions, branch directions and heights. Build tapering trunks, radial needle fans and snow resting on their upper surfaces; avoid bare poles with a few floating leaf tiers. Add a few bare birches with connected smaller twigs. Start chimney smoke at the actual chimney cap, with gentle drift and fade.

## Aurora motion

Use [NASA's Polar Aurora morphology](https://pwg.gsfc.nasa.gov/Education/waurora1.html) as guidance: rays are elongated and nearly vertical, forming long changing arcs and curtains. Make several transparent three-dimensional sheets at different depths, orientations and phases. Fold and unfurl their paths slowly with multiple spatial scales. Give rays irregular widths and local intensity changes; light should drift along the curtain without the whole sky flashing uniformly. Fade the ends and upper tails softly. Use green as the main color, with subtle cooler and violet variation guided by [NASA's aurora color explanation](https://science.nasa.gov/sun/auroras/).

Do not use a static aurora photograph, downloaded video, a single flat scrolling gradient or evenly spaced bright bars. The effect must change shape and brightness with time, while remaining smooth over small time steps. Atmospheric distance and height can be compressed to frame the miniature, but disclose this as an artistic approximation rather than a plasma simulation.

## Water, controls and performance

Reflect the same animated sky in one bounded live planar mirror, including while the camera is stationary. Pass the same animation clock to all curtains and the water material after any uniform cloning. Keep surface distortion restrained so it reads as water rather than a repeated grid or noisy static.

Support mouse orbit, right-drag pan, scroll zoom, touch orbit/pan/pinch, Home reset, arrow-key orbit, +/- zoom and Space pause/resume. Respect reduced motion and hidden-page pause. Frame the complete base on desktop and portrait screens, with no visible settings or buttons.

Share materials and geometries, instance repeated solid fittings, use a cached static moon shadow, cap pixel ratio and keep the reflection resolution fixed. Preserve scene detail while navigating. Reuse the resource pool during animation; do not allocate new geometry or textures every frame. Report real-device performance only after measuring it.

## Verification and deliverables

Run the offline HTML in a browser and check bounds, supports, stair landings, path clearance, boat/seabed clearance and moving mooring endpoints. Measure actual aurora pixel changes at nearby and later times, and verify that the raw reflection image also changes without moving the camera. Check synchronized shader clocks and stable geometry/texture pools.

Test desktop/touch/keyboard controls, pause/resume, reduced motion, visibility handling and zero runtime HTTP requests or browser errors. Review overview, cabin, boat, water, sky, opposite, overhead and portrait captures. Save images from the actual HTML, including two aurora times, and update the root scene index. Do not commit, push or deploy unless requested.
