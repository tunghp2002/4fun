# Yozakura — an illuminated cherry-blossom moat

Create a complete, runnable, offline single-file `index.html` in `scenes/yozakura/`. Include this reusable prompt, references/credits, concise review notes and actual browser screenshots alongside it. Embed the repository's Three.js r160.1, OrbitControls and Reflector with MIT notices. No framework, installation, runtime HTTP requests, remote fonts, visible controls or characters. Mouse/touch users must be able to orbit, pan and zoom the entire square miniature.

## Reference and visual direction

Use [Pinterest pin 608689705908112658, Night Cherry Blossoms at Hirosaki Castle](https://www.pinterest.com/pin/608689705908112658/) as the primary reference. Actually inspect its image before choosing the layout. Preserve the idea of illuminated blossom banks mirrored in dark water. Use navy night tones, pale rose and lavender petals, pink uplighting and small warm paper lanterns. The result should feel quiet and finely made, with soft 3D-to-2D rendering and clear material layers. This is a compact interpretation, not an exact surveyed model of Hirosaki Park. Credit references without redistributing their photo pixels.

## Layout and construction

Build a complete square cutaway base with solid soil, a continuous moat passing through two model cuts, two retained banks and connected walking routes. A modest arched footbridge must cross a meaningful stretch of water; its stringers, deck, balusters, handrails, foundations and approaches must meet physically. Keep the deck ends flush with the paths. The view must show why the bridge is needed.

Use broad clear promenades. Place benches in separate outer bays and trees in planted strips, keeping both off walking routes. Keep the bridge and its approaches clear above head height. Give waterside rails regularly spaced posts and openings where people enter the bridge. Support every pole and lamp on a real base. Hang paper lanterns from cables attached to anchored poles, with visible short hangers and end caps. Retaining walls need soil behind them and closed side/end faces.

## Cherry trees and flowers

Make mature, spreading, asymmetric cherry crowns with visible tapered trunks, connected curved limbs, smaller twigs and bark grain. Distribute dense flowering growth along the twigs, leaving natural air gaps. Build outward-spreading lower limbs and upward-growing central leaders at varied heights. The upper centre must carry flowers and rise above the outer limbs, forming an irregular dome when seen from above or from the side. Avoid placing all major limbs in one horizontal ring; increasing blossom count cannot fix a hollow crown structure. Use a broad umbrella-like dome with softly irregular lobes, wider than it is deep or tall above the main forks. Give every tree a distinct width, depth, height, lean, orientation and dominant branch side. Use bounded seeded variation so the eight silhouettes differ but remain stable on reload. Transform branches, normals, flower stalks and flower positions together. Keep all crowns within the base and maintain headroom above paths and the bridge. Foliage spheres are not cherry blossoms. Use individual curved five-petal corollas with notched tips, petal gradients, fine stamens and small stalks connected to the twigs. Keep the flowers readable at close range and the crowns coherent from a distance. Avoid crossed planar flower sheets that reveal bright straight edges when lit or viewed obliquely.

Use shared instanced blossom geometry and a locally generated flower texture. Vary flower orientation, scale and pink/lavender tones subtly. Let illumination create depth while retaining the gentle illustrated style. Keep branches, flower clusters and suspended fixtures within the complete base footprint.

## Motion and water

Continuously drift actual petal-shaped instances from real flower positions. Petals should tumble gently, lose sideways drift before the final descent, and settle on the correct surface: water, path, curb, bridge or seat. Do not let an endpoint-only landing check permit a petal to pass through a higher surface during its approach. Sample complete trajectories as well as their endpoints. Hold landed petals briefly, fade them and restart at the canopy. Add restrained static petal rafts near the moat edges, leaving the central reflections readable.

Use a real planar garden reflection with a gentle animated water distortion. Keep the reflection target bounded. The water clock must reach the reflector material after its uniforms are copied. A cached static-garden reflection may refresh on camera changes while the water shader keeps moving; disclose if airborne petals are excluded from that cache.

## Controls, performance and review

Reuse the existing scenes' accessible canvas and keyboard conventions: Home resets, arrows orbit, +/- zoom, Space pauses. Respect reduced motion and hidden-page pause. Fit the complete base on desktop and portrait screens, and keep pinch/pan working. No visible settings, buttons, loaders or overlays.

Instance blossoms and petals, batch repeated fixtures, share materials/textures, cap pixel ratio and reuse a cached static shadow map. Keep scene detail fixed while orbiting. Do not claim a real-device frame rate from software WebGL tests.

Review actual screenshots at overview, close blossom, bridge, canal/reflection, opposite, overhead, low petal and portrait angles. Verify supported roots/fixtures, bridge approach contact, uninterrupted paths and headroom. Run the offline HTML in a browser: check no HTTP requests or console errors, desktop/touch/keyboard controls, petal position changes, pause/resume, reduced motion, visibility handling, shared water time and stable geometry/texture pools. Save those captures rather than concept images. Update the root scene table and report any unmeasured hardware behavior. Do not commit, push or deploy unless requested.
