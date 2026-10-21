# Yozakura — Cherry Blossoms After Dark

An offline, interactive night-garden miniature inspired by the [Night Cherry Blossoms at Hirosaki Castle pin on Pinterest](https://www.pinterest.com/pin/608689705908112658/). Illuminated cherry trees flank a dark, reflective moat, with a founded arched bridge, clear promenades, suspended paper lanterns and drifting petals. The compact layout is an interpretation of the reference, not a measured reconstruction of Hirosaki Park.

Open `index.html` directly in a browser with WebGL. No server, installation, network connection or visible interface is required.

- Drag to orbit, right-drag to pan, scroll to zoom.
- On a touch screen, use one finger to orbit and two fingers to pan/pinch.
- `Home` restores the whole miniature; arrows orbit; +/- zoom; Space pauses/resumes motion.
- Reduced motion stops idle animation while retaining navigation. Hidden pages pause rendering.

## Scene and review

The complete 32 × 32 square base carries eight branching cherry trees and 20,480 individual blossoms. Each blossom uses a curved corolla surface with a locally generated five-petal/stamen cutout texture and a fine stalk connected to a twig. Eight spreading limbs and four upright leaders give each crown an irregular domed profile, with flowering branches above the centre rather than a hollow ring. The 20,480-blossom budget is unchanged. Crowns spread farther horizontally, while each tree has its own width-to-depth ratio, height, trunk lean, rotation and heavier branch direction. Seeded variation is stable across reloads. Wood, surface normals, flower stalks and blossoms receive the same transformation, keeping the wider trees connected. The trunks, roots and branches use tapered curved geometry and cherry-bark grain. Local uplights, cool moonlight and pink paper lanterns create the night palette.

The moat continues through both model cuts; its stone walls retain solid land behind them. A 13.2-metre arched deck crosses the 8.6-metre channel and meets level approaches on both banks. Promenades are 2.2 metres wide. Benches occupy outer hardstanding bays, tree roots remain off the walkways, and the waterside rails have repeated posts and gaps at the bridge. Branch and blossom headroom over the bridge/approaches is checked separately from ground contact.

There are 520 animated petal-shaped instances and 1,800 settled petals. Airborne petals start at actual blossom positions, drift and tumble, finish their lateral movement before the final descent, then rest on the water, curb, path, bench or bridge surface before fading and restarting. A sampled flight check caught late sideways drift intersecting a curb; that motion was corrected rather than hiding the petals. The movement is decorative, not a wind or fluid simulation.

Flowers and fixtures are instanced or batched. The single planar mirror uses a fixed 768 × 768 target; device pixel ratio is capped at 1.6. Geometry and blossom counts stay fixed during navigation. The static garden reflection is refreshed on camera/view changes; the water shader continues to ripple between updates. Airborne petals are omitted from that cached reflection; settled petals and the surrounding garden remain reflected. A single cached moon shadow is used, and the four bounded uplights do not generate additional shadow maps.

Browser verification covers flowering upper centres on all eight trees, layout bounds, headroom, bridge approaches, petal origins/trajectories, desktop orbit/pan/zoom/Home/arrows, touch orbit/pinch, animation pause/resume, reduced motion, visibility pause, the shared water clock, stable resource counts and zero runtime HTTP requests/browser errors. Captures below come from the runnable HTML, including opposite and overhead views. Tests use Chromium with software WebGL at 1600 × 1100 and portrait 390 × 844. Real-device frame rate and background-tab scheduling across other browsers have not been measured.

Run `node check-crowns.mjs` for a dependency-free geometry regression check against the embedded tree generator. The check requires flowering upper centres, raised crown tops, broader and differently proportioned crowns, repeatable variation and the original blossom budget. Browser verification also checks the actual generated trees after the full scene has initialized.

## Rendered images

[Overview](images/preview.png) · [Garden detail](images/detail.png) · [Water and reflection](images/water.png) · [Bridge and approaches](images/bridge.png) · [Blossoms](images/blossoms.png) · [Drifting petals](images/petals.png) · [Reverse](images/reverse.png) · [Overhead](images/overhead.png) · [Phone](images/mobile.png)

[Reusable prompt](PROMPT.md) · [References and credits](ASSETS.md)
