# Hotaru — Forest Firefly Shrine

Create a complete runnable single-file `index.html` showing an interactive three-dimensional miniature of a small Japanese forest shrine at night. Build an original composition inspired by illustration artwork, especially the cool layered forest and warm insect lights of Ddesignator's `Light in Darkness`. Use artwork as the visual reference; do not switch to photographic realism or reproduce source-image pixels.

## Delivery and interaction

- Embed the engine, controls, textures and every scene asset in the HTML. It must work offline when opened directly, without installation, a build step or runtime network requests.
- Use a complete square base with every solid element supported by that base.
- Open with the whole miniature and its canopy visible. Allow free mouse/touch rotation, panning and zooming. Support keyboard navigation and a reset key.
- Display no toolbar, buttons, labels, controls or interface overlays. Give the canvas an accessible description and keyboard focus. Reduced motion must preserve navigation.
- Deliver a reusable prompt, a concise README, honest asset credits and actual rendered screenshots alongside the HTML in `scenes/firefly-shrine/`.

## Art direction

Aim for a quiet illustrated night forest rendered as a finely made collectible model. Use deep indigo negative space, layered blue-green foliage, mossy stone, weathered vermilion and warm amber shrine lights. Give materials clear readable shapes, soft toon-light bands and delicate surface detail. The shrine should be the visual focus, with a visible route leading toward it. Keep enough light to read the model while retaining a nighttime atmosphere.

Use thick, irregular, full tree crowns with substantial upper coverage. Vary each tree's height, width, depth, lean, asymmetry and branch direction using a stable seed. Roots must meet the terrain; tapered trunks must fork into connected branches carrying the crowns. Build overlapping foliage layers and individual leaf silhouettes. Avoid identical cloned tree shapes, bare upper leaders, spherical leaf balls and flat single-layer canopies. Frame the shrine with trees at the sides and rear; keep the opening camera's view of the torii and shrine entrance clear.

## Spatial layout

Design the circulation before adding small assets:

1. A clear paved approach starts at the front edge of the base.
2. A winding stream crosses the full model, with visible continuity at both cut edges, varied bank stones and gently sloping mossy banks.
3. An arched bridge crosses the stream between opposite banks. Its deck must meet both approaches. Railings need posts that connect to the deck and leave a practical clear walking width.
4. A torii stands on stone sockets outside the walking opening. Its beams, plaque, rope and paper streamers must attach to actual supporting geometry.
5. A forecourt connects to broad stone stairs, then a raised shrine court. Use consistent step heights, supported handrails and matching landing elevations.
6. A raised timber shrine has its own shallow veranda steps. Keep foliage, rocks and lantern foundations outside the walking route.

Do not place decorative bridges over tiny disconnected puddles. Avoid floating props, exposed unsupported roof beams, stair gaps, plants growing through floors or railings blocking the entrance.

## Shrine detail

Give the shrine a stone foundation, raised timber floor, visible structural posts and braces, a veranda, side railings and a curved overhanging tiled gable roof. Close the gable and roof underside correctly and support the eaves with framing. Include visible roof seams without making thin detail cast noisy duplicate shadows.

Open the central sliding doors so a small altar, offering vessels, candles and a back-wall scroll can be seen. Put a slatted offering box near the veranda front. Attach a bell and its rope to a structural beam. Suspend paper lanterns from real fittings. Use a few warm lights to illuminate the entrance and interior without flooding the whole forest.

Add grounded stone lanterns along the route and a small purification shelter beside it. The shelter needs posts, a supported roof, a stone basin, water inside the basin, a connected bamboo spout and a resting ladle.

Fill planting zones with dense short ground cover, connected fern fronds, mossy stones and a small secondary bamboo grove. Leave paving and stairs readable. Partially bury rocks and roots instead of balancing them on the surface.

No characters, vehicles or sound.

## Subtle animation

- Create a few hundred golden yellow-green fireflies in several loose pockets beside the stream and path.
- Give each insect a continuous smooth flight path, a distinct speed and phase and its own gradual light cycle. Avoid teleporting, synchronized blinking, constant-speed straight lines and long artificial trails.
- Precompute a complete bounding envelope for every flight path. Reject paths that intersect building solids, trunks, lanterns, stairs or bridge structure. Keep insects above the ground and inside the miniature.
- Use small bright cores and restrained soft halos, visible in the overview without washing out nearby surfaces.
- Move low translucent mist gently along the water. Keep it thin enough to preserve the model's depth and details.
- Animate subtle downstream water strokes and slight reflective surface distortion. Reflections must use the same clock and actual animated geometry, updating even when the camera is still.

## Performance and verification

Instance repeated fittings and foliage. Reuse typed particle buffers and pooled objects. Cache static shadows, use one bounded live reflection, cap device pixel ratio and pause hidden pages. Preserve geometry quality during dragging and zooming.

Review the result as a designer before delivery: inspect the main view, close shrine view, bridge, canopy, opposite side, overhead and portrait view. Fix unsupported or intersecting fixtures and blocked routes. Check that the entire base and canopy fit the opening frame on desktop and phone.

Verify offline loading without HTTP requests or browser errors, mouse/touch/keyboard controls, pause and reduced-motion behavior, finite smooth particle positions, obstacle separation, actual changing animation/reflection pixels and stable geometry/texture counts over time. Save screenshots from the actual final HTML and identify the tested file by hash. State clearly which real-device performance checks were not performed.
