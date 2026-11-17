# Hanabi — Pastel Beach Fireworks

Create a complete, runnable, offline single-file `index.html` under `scenes/hanabi-beach/`. Reuse the repository's embedded Three.js r160.1, OrbitControls and Reflector, retaining MIT notices. Include this reusable prompt, art credits, concise scene notes, regression checks and actual browser captures. No framework, installation requirement, runtime HTTP requests, characters or visible controls.

## Art direction: illustrations, not photography

Open and inspect [Pinterest artwork 768145280220406157](https://www.pinterest.com/pin/768145280220406157/) for the anime coastal composition, blue-violet sky, peach warmth and broad gold/pink/cyan fireworks. Inspect [Pinterest artwork 676525175308363841](https://www.pinterest.com/pin/676525175308363841/) for glittering tips and curved radial trails. A secondary coastal color study is [artwork 616571005275637540](https://www.pinterest.com/pin/616571005275637540/).

Translate their composition, palette, silhouettes and soft luminous layers into code-native geometry and shaders. Use the art as the visual reference; do not replace it with photographs or pursue a photographic reconstruction of a real event. Do not embed, trace into textures or redistribute reference pixels, watermarks, characters or promotional text. Credit the pins and distinguish known titles from unverified artist attribution.

Make a quiet, finely crafted 3D-to-2D miniature with clean silhouettes, soft pastel materials and a festive summer-anime atmosphere. Let gold, rose, cyan and lavender bursts be the main focus. Keep foreground details compact, leaving open water and breathing room around the fireworks.

## Miniature and ground layout

Use a complete 32 × 32 square base. Place gently sloping sand and a broad boardwalk in the foreground, open sea behind, and small floating launch platforms offshore. Close exposed terrain cuts. Give wet sand a cooler, darker tone and model a narrow moving foam edge that follows the actual shore.

Provide two different food kiosks: yakisoba and shaved ice. Build supported striped canopies, posts, counters, floor planks, back shelving, dishes, food trays, bottles, serving equipment, a register, glazing and warm ceiling fixtures. Provide a plausible staff entrance and a grounded step. Put a small drinks cart and modern slatted metal benches in separate landward bays so they do not consume the main walking strip.

Hang paper lanterns from visibly sagging wires connected to anchored poles. Keep cables and lanterns clear of roofs and walking headroom. Make a lifeguard tower with braced feet, a supported floor and roof, a seat, guardrails and an access stair with a connecting top landing and supported handrails. Attach signs to a fascia, board or posts instead of leaving them floating.

Use varied curved palm trunks and full pinnate fronds, with connected midribs and broad enough leaflets to read from the overview. Fill narrow side planting bands with dense short coastal grass. Keep all physical fixtures inside the base, with correct sand or structural contact.

## Fireworks

Use a continuous repeating show of staggered launches. Give each shell a visible ascent trail that slows toward the burst. Make several distinct three-dimensional forms: spherical blooms, drooping gold willows, tilted rings and delayed crackles. Vary positions, timing, colors, speed and lifespan without changing the object pool size.

Use analytic drag/gravity trajectories and segmented history trails. Preserve exact launch and burst endpoints. Let sparks fade before they reach the water or beach. Add local flash halos, softly colored smoke drifting from the actual burst position, and short-lived colored light on nearby surfaces. Avoid uniform flickering of the whole screen.

Match the artwork's luminous painted quality: sufficiently broad heads, long curved tails and a soft additive glow. Do not settle for faint disconnected ticks around a sphere. Layer blooms at different ages so the composition remains readable and lively.

## Reflection, interaction and performance

Use one bounded live planar reflection of the actual fireworks and sky, including while the camera is stationary. Frame the opening view so fireworks and their reflections are both visible on the model's sea. Keep surface distortion restrained and avoid repeated grid-like highlights. Document the compressed miniature scale rather than claiming this is a real-world launch arrangement.

Reuse fixed buffers for particles and trails. Share geometry, instance static fittings, cache the static moon shadow and cap pixel ratio. Keep the same scene detail during orbiting and zooming. Do not claim hardware frame rates without measuring them.

Support mouse orbit, right-drag pan, scroll zoom, touch orbit/pan/pinch, Home reset, arrow-key orbit, +/- zoom and Space pause/resume. Respect reduced motion and hidden-page pause. Keep the complete base and whole show in the initial desktop and portrait framing. The scene remains silent and has no visible interface.

## Verification and delivery

Test the actual shared motion functions for endpoints, slowing ascent, drag and gravity. Sample the entire display for finite positions, particle capacity, burnout above the water and initial framing. Measure actual rendered changes at nearby and later times, and verify the raw reflection image changes without camera movement. Verify stable geometry/texture pools through a full cycle.

Run the offline HTML in a browser and test desktop/touch/keyboard controls, pause/resume, reduced motion, visibility handling and zero runtime HTTP requests or browser errors. Review overview, food kiosk, tower, water, sky, opposite, overhead and portrait captures, including another show time. Save these real captures alongside the HTML and update the root scene index. Do not commit, push or deploy unless requested.
