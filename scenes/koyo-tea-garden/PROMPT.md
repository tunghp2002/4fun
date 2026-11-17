# Koyo — Autumn Tea Garden with Detailed Living Koi

Create a complete runnable single-file `index.html` containing a freely rotatable and zoomable miniature of an autumn tea garden beside a clear koi pond. Use original code-built scenery inspired by illustration artwork, particularly the warmth, open timber interior, pottery and yellow/red foliage in Pinterest pin `703756186567143`, “Japanese House by the Water.” Keep the garden art-directed and place special emphasis on believable, highly detailed fish.

## Delivery

- The HTML must embed its engine, controls, geometry, textures and shaders and work offline when opened directly. No installation, server, external fonts or runtime requests.
- Place all elements on a complete square plinth. Open with the whole base and tree crowns visible on desktop and phone.
- Allow mouse/touch orbit, pan and zoom. Add keyboard navigation, reset and pause. Respect reduced motion and pause hidden pages.
- Display no interface overlays, buttons or controls. Give the canvas an accessible description and keyboard focus.
- Deliver the HTML, reusable prompt, README, honest credits and actual rendered screenshots in `scenes/koyo-tea-garden/`.

## Visual direction and composition

Use a warm honey, russet and gold palette with subdued green-grey water, weathered timber, pale stone and a cool quiet background. The broad pond occupies the foreground so fish can be seen from the opening angle. Place the tea house toward the rear, with its open interior facing the pond. Full autumn maples frame the sides and rear without covering the main swimming area.

Keep the architecture and garden in a clean illustrated miniature style. Give the koi more realistic geometry, skin, fin membranes and movement. Do not substitute colorful ellipsoids with triangle tails or oversized cartoon eyes.

## Koi modeling: highest priority

Create about ten individually varied koi, with believable proportions and sizes relative to the pond.

- Build a continuous closed body surface with a smooth head/shoulder, rounded belly, gradually narrowing tail root and consistent normals. Use enough longitudinal and radial segments to remain smooth in close views.
- The head needs a small terminal/slightly downward mouth, lips, subtle nostrils, two pairs of barbels, small lateral eyes and attached curved gill covers.
- Include paired pectoral fins just behind the gills, paired pelvic fins farther back, a dorsal fin, an anal fin and a forked caudal fin.
- Make fins thin, partly translucent and gently curved, with visible radial rays. Every fin root must meet the body. Keep tail lobes and peduncle connected while deforming.
- Give every fish its own irregular cream/red/black or metallic gold pattern. Paint patches continuously over the dorsal surface and sides instead of using disconnected colored primitives.
- Add fine scale marks and restrained bump/specular detail, leaving the head smoother. Avoid coarse reptile scales, plastic gloss and identical repeated patterns.
- Use a koi anatomy illustration to check the placement of body parts. Credit inspected references and create original model/texture data.

## Believable swimming

Animate a continuous lateral wave that increases toward the tail, with a relatively steady head. Adjust surface normals with the deformation. Fin tips should flutter subtly while their roots remain attached. Give mouths a gradual breathing movement and add slight depth variation without exposing dorsal or tail fins above the water.

Use independently chosen random destinations throughout the broad pond basin. Choose each fish's action, duration, speed, depth target, mouth opening and waiting interval separately. Include cruising, hovering, slow foraging, shallower-water exploration and occasional short faster movements. Start a fresh random sequence on each page load, with an optional fixed seed for tests. Do not apply a shared tangential force or a global clockwise/counterclockwise current.

Use smooth steering with individual speeds, gentle wandering and loose schooling. Fish should face the direction they travel, turn gradually and avoid one another and the bank. Do not use synchronized rigid rotations, teleporting loop resets, frequent jumping or blinking eyes.

Keep the complete fish and fin envelope between the pond floor and surface. Reserve enough room around swimming paths for the full body length and fins. Use deterministic fixed stepping so animation can be replayed and tested. Reuse simulation arrays and geometry instead of allocating models during animation.

## Pond and garden layout

Design a broad swimming basin with a narrow inlet. A bridge should cross that narrow inlet between actual opposite banks. Connect the bridge to a practical dry path and to the tea-house access steps. Railings need posts that meet the deck and enough clear walking width. Avoid bridges spanning disconnected puddles or paths terminating against a wall.

The tea house needs a supported raised veranda, a protected pond-facing edge and an open side entrance aligned with its stair. Its roof and underside must be closed and supported. Do not leave diagonal braces floating below the eaves.

Show tatami mats, floor cushions, a low tea table, a teapot, cups, sweets, ceramic shelves and a scroll alcove through open shoji panels and a side window. Keep the room arrangement usable and the entrance clear. Add grounded lanterns, benches, natural bank stones, dense short planting and fallen maple leaves. Put each bench in a separate dry paved rest pocket beside the path, facing the pond. Check the entire seat, back, arms, legs and comfortable foot space against the walking corridor, nearby stones, plants and lanterns. Keep the passage clear and exclude planting from the rest pocket.

Vary the maple trees in height, width, lean, branching, asymmetry and crown layout using a stable seed. Build full multilayer crowns with individual deeply lobed leaf silhouettes, including upper coverage. Hide supporting foliage masses with sufficient leaf detail; avoid identical lollipop trees, exposed upper skeletons and smooth spherical crowns. Keep roots off the walking route and all foliage within the miniature's composition.

No characters or sound.

## Scenery detail and visual hierarchy

Give the landscape the same care as the fish. Build curved, tapering trunks and a visible branching hierarchy carrying dense, irregular leaf layers. Use finely serrated leaf silhouettes with veins and color variation; hide structural foliage masses. Vary the crown height and spread, fill the upper center and combine taller maples with lower evergreen shrubs, connected ferns, moss and a few seasonal flowers.

Replace long uniform paving strips with individual worn flagstones: varied outlines, small bevels, subtle height changes, textured surfaces and narrow mossy joints. Keep a clear connected route from the garden edge across the inlet bridge to the tea-house stair. Use different-sized half-buried stones and a few larger bank boulders instead of a uniform necklace of identical pebbles.

The tea house should have a curved tiled roof with readable tile courses, ridge caps, rounded eave ends, rafters and proper support. Add layered timber framing, wainscoting, textured shoji paper, tatami weave, fabric seams, drawer hardware and useful window blinds. Copper rain chains must attach to the eaves and terminate in catch bowls. A grounded stone basin, connected bamboo spout and a low bamboo garden backdrop should fit around the actual walking route. Review the overview, close foliage, paving and tea-house captures for both richness and physical plausibility.

## Water and subtle motion

Keep water clear enough to inspect fish scales and fins. Use a restrained live reflection with stronger blending at grazing angles and weaker blending from above. Update reflection and surface motion with the same clock even when the camera is still.

Include a visible pond bed, soft fish shadows, subtle moving underwater light patterns, sparse floating maple leaves, drifting falling leaves, small surface rings and a modest rock inlet cascade. Give each falling leaf fresh source, duration, drift and spin parameters when it respawns, with independent waiting times. Use smooth nonperiodic drift for floating leaves and irregularly timed pooled surface rings. Keep physical fin strokes and water movement smooth rather than replacing them with random frame-to-frame jitter.

Keep effects delicate and avoid obscuring the fish with opaque water, excessive fog or large glow sprites.

## Review and performance

Inspect the complete model, fish close-ups from above and oblique angles, tea-room interior, bridge, reverse view, overhead view and phone portrait view. Correct floating fixtures, broken tail/fin attachments, inaccessible entrances, intersecting props and plants occupying paths.

Instance repeated static fittings and foliage, share fish geometry, preallocate simulation/effect buffers, cache static shadows, cap pixel ratio and use one bounded reflection. Preserve geometry detail while navigating.

Verify offline loading without requests or browser errors; mouse, touch and keyboard controls; pause/reduced motion; several minutes of finite continuous swimming; fish separation; water/floor clearance; repeatability; actual changing pixels and reflections; stable scene resources and complete desktop/phone framing. Save actual final screenshots and the tested HTML hash. State which real-device frame-rate checks were not performed.
