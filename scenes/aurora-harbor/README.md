# Nordlys — Aurora Harbor

An interactive winter-harbor miniature inspired by two inspected Pinterest references: [a cabin beneath northern lights](https://www.pinterest.com/pin/9499849209582210/) and [the red waterfront cabins of Lofoten](https://www.pinterest.com/pin/535787686918587883/). This is an original compact composition, rather than a reconstruction of either location.

Open `index.html` directly in a browser with WebGL. The HTML contains its rendering libraries, geometry, textures and shaders, and works offline without installation or a server.

- Drag to orbit, right-drag to pan, scroll to zoom.
- On touch screens, use one finger to orbit and two fingers to pan/pinch.
- Home resets; arrows orbit; +/- zoom; Space pauses/resumes motion.
- Reduced motion stops idle animation while preserving navigation. Hidden pages pause rendering.

## The miniature

A complete 32 × 32 square base contains a rocky, snow-covered shore, closed terrain cuts, two furnished red cabins, a fishing store, connected paths, cabin stairs, a founded pier, boarding gangway and moored launch. The cabin windows have actual openings and transparent glazing. Their interiors contain beds, seating, tables, kitchenette cabinets, sinks, coffee makers, bookcases, books and ceiling lights. The store holds shelves, crates and fishing supplies.

Eight varied spruce trees carry radial needle fans and snow on the upper branches; three bare birches add a different winter silhouette. Shore rocks, thin coastal ice, path lights, porch canopies, roof seams, chimney flashing, crates, barrels, cleats, fenders, life rings, antennas and coiled rope provide detail at close range. Smoke rises from the chimney cap. The launch has a separate glazed wheelhouse and open deck; its gentle motion also updates the mooring-line endpoints.

## Aurora and reflection

Three transparent three-dimensional sheets form the auroral curtains. Their paths fold at different depths and phases; fine, irregular vertical rays vary locally in strength and drift slowly along the sheets. Light fades upward and at the ends, with a mint-green body, cooler upper rays and a restrained violet tint. Motion is generated continuously in the shaders; no downloaded aurora video, animated image or scrolling sky photograph is used.

The fjord uses a live 640 × 640 planar reflection. It renders the same moving curtains with the same clock, including while the camera is stationary. Small surface waves distort the reflection. Shared geometry, instanced solid fittings, a cached moon shadow and a pixel-ratio cap of 1.6 keep the resource pool bounded; scene detail is retained during navigation.

Atmospheric height and distance are deliberately compressed to fit the collectible miniature. The curtains are an artistic optical approximation, rather than a plasma simulation. Water motion, smoke and boat movement are decorative, rather than fluid or rigid-body simulations.

## Verification

The accompanying [browser check](check-scene.mjs) passed 23 checks in Chromium with software WebGL, at desktop 1600 × 1100 and portrait 390 × 844. It covers support and bounds, stair landings, unobstructed paths, boat clearance and live mooring endpoints, real aurora pixel changes over time, gradual short-time evolution, changing raw reflection pixels, shared shader clocks, stable geometry/texture pools, desktop/touch/keyboard controls, pause/resume, reduced motion, visibility handling and zero runtime HTTP requests/browser errors. [Recorded results](checks.json) include the tested HTML hash.

To rerun the check, use Node.js with Playwright and its Chromium browser installed, then run `node check-scene.mjs`. Existing installations can be selected with `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH`. The check recreates the images and report. These development tools are optional; viewing the HTML requires only a browser.

Real-device frame rate and other browser engines have not been measured.

## Captures

[Overview](images/preview.png) · [Harbor detail](images/detail.png) · [Cabin](images/cabin.png) · [Boat](images/boat.png) · [Aurora](images/aurora.png) · [Later aurora](images/aurora-later.png) · [Water](images/water.png) · [Reverse](images/reverse.png) · [Overhead](images/overhead.png) · [Phone](images/mobile.png)

[Reusable prompt](PROMPT.md) · [References and credits](ASSETS.md)
