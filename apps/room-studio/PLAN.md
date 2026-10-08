# Room Studio implementation and review

A Next.js + React + TypeScript app in apps/room-studio. SVG floor plan and demand-rendered Three.js room view share one versioned plan. Desktop uses adjacent views; mobile uses tabs. Original implementation inspired by Floorplan's plan editing and Sael's material/light interactions. Rectangular rooms and automatically connected shared walls are the initial supported geometry. No backend, accounts, deployment, commit or push requested.

1. [x] Model. Pass when shared-wall resizing keeps adjoining rooms connected, rooms never overlap, furniture stays inside rooms without solid collisions or blocked doorway zones, and invalid imported plans are rejected by the runnable model check.
2. [x] 2D editor. Pass when room drawing, room drag/resize, numeric dimensions, furniture placement/movement/rotation, selection, deletion and undo/redo produce matching shared plan data with mouse and touch.
3. [x] 3D view. Pass when actual walls have door/window openings, furniture is supported, selection and placement synchronize in both directions, materials and daylight work, and scene resources update without rebuilding the renderer or leaking geometry.
4. [x] Review and delivery. Pass when typecheck, model tests and production build pass; desktop/mobile browser flows, persistence, imports, physical geometry and performance are observed; README, reusable prompt and preview captures describe the completed app.

Performance checks: bounded pixel ratio, shared geometries/materials, one shadow-casting sun, cached procedural textures, unchanged rooms/items reuse their resources, pointer work coalesced to animation frames, no repeated WebGL renderer setup, demand rendering stops when idle or hidden. Record actual draw calls/triangles, idle frame stability and edit timings without claiming guaranteed FPS across devices.

## Observed review results

- Seven native model/GLB checks pass, including shared resizing, collisions/door approaches, connected rooms, strict imports and consistent serialized history.
- Production build and strict TypeScript checks pass.
- Desktop and 390 × 844 mobile flows pass: drawing, resizing, keyboard and real touch movement, 2D/3D drag synchronization, item sizing/rotation, one-step undo/redo, paint/floor/daylight changes, import/export and persistence. Browser errors: none.
- Immediate reload preserves the completed resize. Storage-unavailable editing and exported backup were checked separately.
- Physical review corrected table-leg floor contact, countertop layer supports, desk-chair direction, shared-wall face paint, blocked door placement and disconnected rooms. Full-wall and cutaway views have real openings. Click selection does not snap furniture; panning uses the original gesture transform.
- Default model: 22,528 main-view triangles, 164 draw calls after material batching (previously 255). Repeated resizing kept the warmed geometry/texture counts at 62 / 8. Idle and hidden frames stopped. No model-detail reduction or automatic quality changes were used.
- Production stress check used Chromium / SwiftShader software WebGL: median animation-frame interval 16.7 ms, p95 116.7 ms. Physical-GPU frame rates were not measured; performance on large plans remains device dependent.
- Preview, detail and mobile PNGs are captures of the actual production app.

## Material reveal and imported furniture

1. [x] Import model data. Pass when native checks accept version-1 plans with bounded model metadata, preserve old-plan compatibility, and apply the existing floor, collision and doorway rules to imported furniture.
2. [x] GLB files and storage. Pass when file/URL imports validate self-contained static GLB geometry, size and texture budgets, save binary files in IndexedDB, and portable JSON backups round-trip the files without putting binary data in localStorage.
3. [x] Import editing. Pass when Furniture exposes file/link import, measured width/depth/height, a reusable imported library, 2D footprints and matching 3D models with the existing move, rotate, remove and undo controls.
4. [x] Material reveal. Pass when changing floor/paint spreads the new finish across only the changed room over about one second, repeated changes finish correctly, reduced motion applies immediately, and rendering returns to idle.
5. [x] Review. Pass when native checks, strict types and production build pass and browser checks observe import/reload/export, invalid input, dimensions/grounding, 2D/3D dragging, material reveal and idle/resource behavior.

Scope: self-contained GLB files and direct GLB URLs, static furniture, cached shared model geometry/materials, preserved original model detail, explicit limits for heavy assets. No backend, accounts, deployment or provider-specific model-store integration. Draco and Meshopt decoding use Three.js's installed addons; unsupported texture extensions report a readable import error.


Observed on the local production build:

- Seven native model/GLB checks, strict TypeScript and the production build passed.
- Desktop: malformed-file rejection; file and CORS-enabled direct-link GLB import; measured width/depth/height and floor contact; rotation; 2D/3D movement, 10 cm lift and single undo; deduplicated library; shared geometry; reload; missing-file re-import recovery; portable export restored in an isolated fresh browser context. No page errors.
- Mobile at 390 × 844: embedded PNG texture preserved, dimensions editable, import controls fit without horizontal overflow, real touch dragging and undo worked, and WebGL initialized when the 3D tab opened. A backup missing its GLB was rejected without changing the current plan. No page errors.
- Captured paint frames verified progressive coverage instead of an immediate change. Floor reveal worked in SVG and 3D. Rapid choices completed with the latest material; reduced motion skipped the animation. After repeated paint changes, the warmed main view returned to 164 draw calls / 22,528 triangles / 62 geometries / 8 textures and frame counts stopped while idle.
- Checks used Chromium with SwiftShader software WebGL. No physical-GPU FPS claim. [Import preview](images/import.png) and [early paint reveal](images/material-reveal.png) are actual app captures; the cabinet fixture in the import capture was generated for the test.

## Previous apartment furniture upgrade

User direction: realistic contemporary furniture throughout, without wooden tables. Reuse the existing GLB loader and catalog; keep saved layouts and placement behavior compatible.

1. [x] Asset files. Pass when selected modern CC0 GLBs are self-contained, within the existing model budgets, and have recorded sources and locally rendered previews.
2. [x] Catalog and rendering. Pass when the default room and furniture library use the new modern models/finishes, furniture stays grounded inside its declared footprint, and repeated instances share decoded resources.
3. [x] Review. Pass when native tests, typecheck and build pass, and desktop/mobile checks observe loading, dragging, rotation, undo, imports, paint reveal and stable idle resources.

Observed on the local production preview:

- Eight native checks, strict TypeScript and the production build pass. Five self-hosted CC0 GLBs (8.90 MB combined) provide nine source-model instances across six default catalog types. Source geometry and textures remain intact. The remaining tables, desk, bed, kitchen and rug use contemporary procedural finishes and supports.
- All 14 default pieces were measured from actual rendered vertices: grounded geometry and full visible width/depth fit the declared footprint. Kitchen fronts/handles were corrected after measured depth exceeded its 0.65 m footprint. Saved plan dimensions and version-1 compatibility are unchanged.
- Each GLB loaded once. Adding another dining chair reused its geometry/textures; one-step undo restored the layout. Warmed selection counts stayed at 61 geometries / 27 textures. The unselected default view used 59 geometries / 27 textures. Camera-only rendering reported 157 calls / 142,537 triangles; updates that also refresh shadows reported 286–288 calls / about 285,000 triangles. Detail stays fixed during movement and idle frame counts stop.
- Desktop dragging passed: 10 cm lift, visible green/red footprint, invalid drop restores the complete gesture without history, valid drop lowers to the floor, width/depth edits, rotation and single undo. File/direct-link imports, malformed files, dimensions, source textures, library reuse, portable backups and reload remained compatible. Mobile checks observed lazy WebGL, source models/textures, file import, real touch dragging, undo and no horizontal overflow at 390 × 844. No browser errors.
- Material reveal still spreads in both views, honors reduced motion and returns to stable geometry/texture counts and idle rendering. Checks used Chromium / SwiftShader; physical-GPU frame rates were not measured. [Updated preview](images/preview.png), [detail](images/detail.png), [mobile](images/mobile.png) and [furniture library](images/furniture.png) are actual app captures.

## Modern Residence interior

User correction: remove the garden, car, parking and balcony from the example; complete a coherent contemporary interior with actual detailed furniture models and modern glazing, doors and walls. Preserve existing saved projects and undo. No commit, push or deployment requested.

1. [x] Interior plan: pass when the two-storey, three-bedroom example has no outdoor spaces or objects, both levels remain connected by aligned stair shafts, and all fixtures leave doors and usable circulation clear.
2. [x] Real furniture: pass when every catalog furniture type used by the example (except the architectural staircase and thin woven rug) loads a licensed, detailed source GLB, with credits, preserved geometry, self-hosted textures and measured floor contact/footprints.
3. [x] Modern architecture: pass when glass entry doors, flush room doors, charcoal aluminium windows, warm-white walls, trim and staircase guards follow one contemporary palette and have credible hinges, handles and supports.
4. [x] Review: pass when native checks, strict types and production build pass; browser checks verify both floors, source-model loading, footprints, undo, imports, material reveal, mobile and idle resource stability; documentation and actual app captures match the completed interior.


## Household layout correction

Assumption: four residents, with one two-person bedroom and two one-person bedrooms. Bedroom areas follow occupancy, furniture capacity and circulation; equality is not a requirement.

1. [x] Sleeping and wet areas: pass when the double bedroom has a double bed and two bedside positions, both singles have their own bed/desk/wardrobe, two complete upstairs bathrooms serve the bedrooms (one ensuite), laundry is upstairs beside the shared bathroom, and the downstairs WC remains available to guests. Both levels, fixtures and door approaches must pass layout validation.
2. [x] Kitchen storage: pass when the fitted kitchen has a continuous preparation counter, base cabinets/drawers, an oven/hob/sink, multiple upper cabinets and visible crockery behind glazed storage, using licensed detailed source meshes within the existing GLB limits.
3. [x] Review and delivery: pass when native tests, types, build and desktop/mobile browser checks pass, actual geometry has support/footprint clearance, and documentation/screenshots match the revised preset. Check room access, fixture fronts, furniture proportions and upstairs wet-area placement from both 2D and 3D.

Reuse the existing plan schema, catalog kind, GLB loader, source-model converter and model validation; no new dependency, generated floor-plan system, account, deployment or push.


Observed on the final local production build:

- All 16 native model/import/house checks, strict TypeScript and the production build pass.
- Layout: four residents in one 30.7 m² double bedroom and two 14.4 m² single bedrooms; ensuite and shared full bathrooms upstairs, upstairs laundry beside the shared bath, downstairs guest WC and home office. Door approaches and 0.7–0.8 m working space in front of sanitary fixtures, washer and wardrobes are checked. Removed two fixture-front obstructions found during this review.
- The 3.6 m fitted kitchen has four base modules, three upper cabinets (one glazed), sink, induction hob, oven and visible source crockery. Worktops align at the measured counter surface; crockery rests on measured shelf tops. The double bedroom has a separate two-pillow source model; single rooms retain one-pillow models and matching 2D symbols.
- Twenty-three licensed self-hosted GLBs (22.41 MB combined) provide 25 catalog types and 62 model instances in the 64-piece preset. Kitchen: 51,944 triangles / 28 meshes; double bed: 23,884 triangles / 5 meshes. Both remain inside existing asset budgets; no source detail reduction or new dependency.
- Measured actual vertices for all 64 pieces in ground, upper and whole-house views: no support/footprint findings, no browser errors. Ground: 31 pieces; upper inspection: 33 pieces plus the visible lower stair flight. Architecture includes supported glazing, flush doors, trim and guarded stair opening.
- Production desktop/mobile checks pass: source model loading, 3D green/red floor feedback and 10 cm lift, invalid full-gesture restore, valid drag/one undo, both floors/whole house, repeated floor resource stability, material reveal completion, malformed-file rejection, GLB import, reload, portable backup restore, mobile lazy WebGL, no overflow and native touch drag/Undo. No changes to touch handlers were needed after reproducing successful native touch behavior on the final build.
- Ground shadow-refresh frame: 383 calls / 606,370 triangles / 98 geometries / 31 textures. Warmed repeated floor switches retain 151 geometries / 37 textures; idle rendering stops. Observations use Chromium / SwiftShader; physical-GPU FPS was not measured.
- All preview/detail/library/mobile/import/material/kitchen/bathroom/upper/whole PNGs now show the actual final app. Existing saved plans remain readable and the new preset can be loaded reversibly with Load Modern Residence / Undo. No commit, push or deployment.

## Explicit 3D activation and warm evening lights

Assumption: 3D starts only after the user selects Enable 3D. A website cannot change the browser's graphics settings; distinguish a working capability check from an actual renderer-start failure, and keep 2D editing available in every state. Activate the existing floor lamps as daylight fades, preserving model detail and demand rendering.

1. [x] 3D activation: pass when a capable browser shows Enable 3D and creates the renderer/models only after activation, an unavailable browser shows a clear unavailable message, startup failure/lost context permits manual retry, and all states preserve usable 2D editing on desktop/mobile.
2. [x] Evening lighting: pass when existing lamp shades glow warm orange and nearby surfaces receive warm light gradually at dusk, daylight returns with lights off, moving/removing lamps and changing floors updates sources correctly, and illumination is bounded without extra shadow passes or model-detail changes.
3. [x] Review: pass when native tests, types and production build pass; desktop/mobile capability, retry, dusk, editing/import/undo and idle/resource checks run; documentation and actual captures show the final behavior. No new dependency, automatic GPU-setting changes, commit, push or deployment.


Observed on the final production preview:

- All 18 native checks, strict TypeScript and the production build pass. Desktop/mobile checks observe Enable 3D, no canvas/model loading before activation, unavailable/unsupported messages, usable 2D editing, failed-start retry and lost-context disposal/retry with exactly one replacement canvas. No browser errors.
- Actual lamps are off at 14:00, partly illuminated at 18:00 and fully warm at 21:00; returning to daylight switches them off. Native checks verify world-space shade positions, movement/removal and the four-light limit. The two preset lamps light nearby floors and furnishings; no additional fixtures were invented.
- Day, dusk and night each report 383 calls / 606,370 triangles / 98 geometries / 31 textures. All indoor lights remain unshadowed, model detail stays intact and idle frame counts stop. Warmed repeated floor switches retain 151 geometries / 37 textures.
- Full production regression passes source-model loading, both floors/whole house, placement feedback, invalid-drop restoration, valid drag/undo, material reveal, imports, persistence, portable backups and native mobile touch edits without overflow.
- Saved actual production captures: [activation](images/enable-3d.png), [unavailable graphics](images/3d-unavailable.png), [dusk](images/dusk.png), [night](images/night.png), plus refreshed main/floor/library/mobile previews. README and reusable prompt describe the activation and evening-light behavior.
- Checks use Chromium / SwiftShader; physical-GPU FPS and this user's browser configuration were not measured. The CTA starts available WebGL 2; it cannot enable graphics settings or unsupported hardware. Four lamps at most illuminate nearby surfaces, while every existing visible lamp shade glows. No new dependency, commit, push or deployment.


## Remember successful 3D activation

Assumption: after one successful Enable 3D on this browser, show 3D automatically on later visits when the panel becomes visible and WebGL 2 is available. A new browser still asks first. Keep this preference separate from the floor plan; blocked storage must not prevent 3D or 2D use.

1. [x] Activation memory: pass when successful startup stores the preference, returning desktop/mobile visitors automatically get one renderer, first-time visitors still see Enable 3D, and unavailable graphics or failed startup never cause an automatic retry loop.
2. [x] Review and push preparation: pass when storage edge-case tests, strict types, production build and browser activation/reload/failure/context-loss checks pass; update run instructions/prompt and prepare the reviewed app with licensed assets and actual preview images for the authorized push to tunghp2002/4fun. Preserve unrelated local files.


Observed on the final production build:

- All 19 native checks, strict TypeScript and production build pass. Activation storage is versioned and independent of the plan; missing, invalid, blocked and server-side storage access are tested.
- Production browser checks observe the first-time CTA, successful preference storage, automatic desktop reload with one renderer and the same plan, restored CTA after clearing storage, manual recovery from context loss, no automatic retry loop after failed startup, no saved preference after first-time failure, and usable 2D while graphics are blocked. Check again automatically opens a remembered viewer after graphics recover. No browser errors.
- Mobile reload leaves the hidden 3D panel uninitialized; opening its tab starts the remembered viewer without another Enable 3D click. No horizontal overflow. Blocked preference storage still permits manual 3D use.
- Full production regression passes both floors/62 source-model instances, placement lift/feedback, invalid-drop restoration, drag/undo, whole-house view, material reveal, malformed-file rejection, imports, automatic reload, portable backups, native mobile touch edits and idle rendering. Warmed resources stay stable.
- Day/dusk/night lighting remains correct with identical ground counts: 383 calls / 606,370 triangles / 98 geometries / 31 textures. [Automatic 3D after reload](images/automatic-3d.png) and refreshed preview/floor/library/mobile/night images are actual app captures.
- Publish scope is README.md and apps/room-studio/ with the full app, self-hosted licensed furniture/decoder files, native tests, prompt and previews. Main matched origin/main before staging. Unrelated .vscode/ files, node_modules, build caches and local configuration are excluded. No new dependency or deployment. Physical-GPU frame rates were not measured; clearing or blocking browser storage returns the first-time CTA.
