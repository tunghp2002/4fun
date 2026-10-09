# Nếp Núi — Vietnamese terraced-rice miniature

Create a complete, runnable, offline single-file `index.html` under `scenes/vietnam-terraces/`, with this reusable prompt, source credits, review notes and actual browser screenshots alongside it. Embed Three.js, OrbitControls, any required model loader and model data with their license notices. No runtime HTTP requests, framework, visible buttons, overlays, remote fonts or people. The entire square miniature must be freely rotatable, pannable and zoomable with mouse and touch.

## Reference hierarchy

Use the supplied farm diorama for the warm, finely made collectible-model character. Use the Vietnamese golden-terrace photograph for the actual terrain and crop arrangement, and the later rural-cottage photograph for the houses. When aesthetic decoration conflicts with these references, preserve the referenced landscape and physical layout. Describe the result as an imaginary northwestern Vietnamese landscape, not an exact site reconstruction.

## Terrain and crops

The main subject is a curved hillside of ripe golden rice. Make all planted regions dense and continuous, including the highest field across the crown. Do not leave a bare summit, plant a decorative hilltop grove, scatter isolated tufts or substitute round foliage balls for real vegetation. Keep only a few recognisable bamboo clumps at the dry homestead edge.

Build nine nested, softly irregular contour terraces with horizontal field surfaces, continuous sloping earth banks and solid soil beneath every layer. Crop stems, leaves and drooping grain panicles should overlap into full planted bands, with subtle plot-to-plot hue variation. Use gold under-canopy surfaces so the miniature reads as planted from a distance. The mature growth stage must stay consistent: no freshly transplanted green seedlings or broad flooded planting pools mixed arbitrarily into the golden harvest composition.

Read the banks as earth covered with vegetation: muted brown-gray soil, small grains and subtle relief, mixed with irregular low green grass and occasional dry blades. Green banks can coexist with golden rice, but avoid uniform green slabs, painted retaining walls or an uninterrupted smooth green stripe. Join the bank and rim textures in world coordinates so patches continue naturally across the edge. Add short grass at selected rim patches, avoiding access routes and planted rice. Check root contact against the actual polygon surface, including any rim layer, rather than an analytic slope estimate alone. Use plain exposed soil on the square model cut faces. Share the textures and existing grass geometry; do not add thousands of separate mesh objects or change terrain heights just to improve its material.

Keep crops clear of access paths, stairs, cottage pads and the shelter. Reserve these routes before planting. The hill continues through the rear/side model cuts, while all objects and foliage stay within the complete square footprint. Lower dry pasture remains green and densely covered, distinct from golden rice.

## Houses, access and water

Place two proportionate timber cottages at the dry foot of the hill, inspired by the photograph: warm wood walls, gables facing the front porch, pitched layered straw roofs with thickness and irregular straw ends, doors and window openings, simple porch railings and supported steps. Avoid metal utility-shed roofs or unrelated Japanese architectural details. Frame openings correctly and support roofs on walls/posts. Keep house entrances connected to the yard route. Reserve the complete doorway and stair footprint before placing props or vegetation. Support every tread with solid material down to the ground. Pivot open doors/shutters at actual jambs. Size the veranda to fit baskets behind the balustrade without touching walls, posts or entrance steps. Check actual mesh bounds rather than center-point distances only.

A modest field shelter stands on a genuinely flat patch partway up the hill. Rotate it along the contour and check all rotated foundation corners against the terrain. A connected stepped access route reaches the fields; a small timber footbridge joins the homestead paths across a lower brook.

Make the brook continuous between two cut edges of the square base, with a curved course around the dry foot of the hill; do not stop it just behind the bridge. Carve the brook into the solid substrate itself. A depressed top surface above an unchanged flat ground box will hide the water and make ducks appear to float over dry ground. Show the bed through translucent water, add restrained traveling surface normals and show the water depth at the model cuts. The bridge must sit on the route connecting the cottage entrances, have bank abutments, solid access steps, and clearance above both water and floating ducks. Reserve the channel and bridge before placing cottage pads; sample the pad corners, edges and center against terrain. Ripe paddies are shown drained; do not add elevated diagonal water ribbons or unsupported flumes across them.

## Animals and assets

Use a detailed, properly licensed buffalo body with natural muscular proportions and visible skin texture. Record author, source, license and changes in `ASSETS.md` and in the HTML. Check the actual preview: a file labelled buffalo may depict a cow, an African buffalo, a skull, a painting or a toy. Do not silently treat the label as proof of species. If adapting a body study, replace incompatible horn geometry, use tapered backward-sweeping horns and disclose that adaptation.

Test horn face winding and normals: outward surfaces must remain visible from side, front and back. Horn roots must meet the actual indexed head surface, and their tapered sweep needs vertical depth instead of a flat horizontal ribbon. Use restrained dark keratin tones and natural base thickness.

Keep adult buffalo and a smaller companion on dry pasture, with hooves meeting the actual surface and smaller horns on the companion. Do not replace them with a few large smooth spheres, oversized cartoon eyes or cream-colored peg horns. Use shared geometry and textures. Without a rig, restrict motion to restrained upper-body breathing that leaves hoof contact fixed; do not fake walking, joint articulation or sliding. Use licensed feather-textured hen and duck meshes with natural necks, bills, wings, tails and feet; do not use sphere-based toy placeholders. Preserve authors, licenses and adaptations in the HTML and ASSETS.md. Bake bone transforms correctly if making an animated source static; do not clone a skinned mesh with an unshared or misplaced skeleton. Ducks float only within the brook, with lower legs immersed, while hens stand on the dry yard clear of baskets, railing and entrance paths. Check their complete world-space bounds and foot contact, and keep both bounded.

## Light, weather and performance

Use warm soft daylight, clear material layers and a restrained studio backdrop. Add a few soft clouds moving slowly above the miniature. A repeatable clear → clouding → rain → clearing cycle gradually cools/dims the light and restores it afterward. Rain is visible only during showers, stops at terrain, crop canopy or the correct roof slope, and adds local brook ripples. Avoid abrupt palette switches, flashing lightning or full-screen rain overlays.

Generate rain positions and terrain/roof termination heights once. Use a time uniform for falling rain; reuse cloud/ripple resources on subsequent showers. Instancing and shared materials should handle rice, grass and repeated construction details. Keep crop/model detail fixed while moving the camera, cap rendering pixel ratio, use one cached shadow map and avoid expensive full-scene bloom or reflection passes. Honour reduced motion, pause hidden tabs and allow Space to pause. Preserve accessible canvas text and keyboard controls without visible UI.

## Review before completion

Save actual captures from the working HTML at default, opposite, overhead and close angles, including rice/crown, shelter, houses/bridge, buffalo from front and side, feathered birds, the full brook, a portrait phone and rain. Inspect the captures, not only object counts. Assert dense planting in every field, no decorative summit trees, supported roots and foundation corners, animal contact and base bounds. Check roof direction against the photo and rain termination against that exact roof geometry.

Inspect a dedicated bank close-up: exposed earth and vegetation must both be readable, the edge grass must stay low, and neither floating roots nor a uniform green construction surface should remain. Verify that the material change keeps existing crop positions and support checks intact.

Run offline-file checks for zero HTTP requests/browser errors, desktop orbit/pan/zoom and exact Home reset, touch orbit/pinch, complete-model framing, reduced motion and hidden-tab pause. Check multiple rain cycles: initial GPU upload of preallocated invisible rain geometry is expected, while further cycles must not grow the resource pool. Report what was actually exercised and any real-hardware performance checks not performed. Keep licensed credits with the embedded model and update the repository's scene table. Do not push or deploy unless requested.
