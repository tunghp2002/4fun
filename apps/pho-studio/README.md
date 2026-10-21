# Phố Studio

A Vietnamese 3D location studio: choose a real place, explore its streets, compose a view and export an image or model. Built with Next.js, React, strict TypeScript and Three.js. The interface is in Vietnamese, with an original paper-and-moss visual design.

## Run

Requires Node.js 20.9+ and pnpm 9.15.9.

```sh
cd apps/pho-studio
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://localhost:3015>.

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

The production build is a Next.js static export in `out/`; `start` serves it with Python 3. No API key or account is needed for the current public data providers.

## Use

- Browse 50 destinations across all 34 province/city names, from the northern mountains to the Mekong Delta and offshore islands. Filter by province, region or “Biển đảo”; older province names remain searchable.
- Open “Bản đồ Việt Nam” to choose a destination or select a coordinate directly. Drag to pan, scroll or use +/− to zoom, and press Home to reset. Hoàng Sa, Trường Sa, Phú Quốc, Côn Đảo, Lý Sơn, Cô Tô, Bạch Long Vĩ and Phú Quý are included. The detailed window is 300–1,800 m across and follows your journey automatically.
- Hội An, Hồ Gươm, Nguyễn Huệ, Huế, Đà Lạt and Đà Nẵng retain bundled map snapshots. Other destinations load current provider data. Successful sparse/empty map responses show the available terrain and land cover with an explicit sparse-data note; they never trigger invented settlements. Service failures still report an error and preserve the previous scene.
- Discovery photographs are bundled locally with author/license links in the help dialog.
- Search a Vietnamese place name, enter `21.0287, 105.8521` or offshore coordinates such as `8.6443, 111.9193`, or paste a full map URL containing coordinates. Shortened map URLs are not expanded.
- The initial scene opens Hồ Gươm. The “Nổi bật” tab lists 93 named architectural and scenic illustrations: the earlier 88 locations and five scenic additions. Familiar landmarks appear first in an editorial discovery order; this is not an official popularity ranking. Search without Vietnamese accents, filter by region/province and select a card to load and frame that landmark. The scene's “Điểm nổi bật” picker also follows this order.
- Scenic highlights include Cầu Vàng at Bà Nà Hills, Hòn Trống Mái in Hạ Long Bay, the Phong Nha cave entrance, Gành Đá Đĩa and the main Bản Giốc cascade. Their cards have searchable aliases such as “Ba Na Hills”, “Ha Long Bay”, “Phong Nha Ke Bang” and “Ghềnh Đá Đĩa”. These are original exterior illustrations: Phong Nha does not include a full explorable cave interior, the waterfall is static, and the Golden Bridge's deck elevation is estimated. Mapped terrain/water and generated trees yield to the modeled cave, islets and waterfall footprint; underground waterways stay hidden. Cổng Tò Vò is deferred because the available coordinate could not be reconciled with the mapped coast.
- Architectural additions include Landmark 81, Dinh Độc Lập, Notre-Dame Cathedral, the Central Post Office, Bến Thành Market, Hanoi and Hải Phòng opera houses, Khuê Văn Các, One Pillar Pagoda, Thiên Mụ and Trấn Quốc towers, Đà Lạt station, Chăm towers, regional museums, churches and lighthouses. The original destination photographs remain in “Khám phá”; landmark cards use numbered tiles.
- Drag to pan across the map; Shift + drag or the cursor toggle switches to orbit. Scroll/pinch to zoom, including regional and country distances. The default perspective frames the landmark district; ordinary areas start on a mapped street. “Toàn cảnh” fits the entire area. Focus the canvas for keyboard controls: `1` perspective, `2` top view, `3` eye level, `4` overview, arrows to rotate, `+`/`-` to zoom and `F` to focus the selected pin. Eye-level mode starts on a clear road at 1.7 m. Drag to look, scroll or use `W A S D` to walk; building and water footprints block movement. Nearby areas stream before you reach the boundary, preserving your geographic position, heading and camera distance.
- Choose paper, clay or ink, then adjust light, line opacity, vertical exaggeration and visible layers. Ink starts with monochrome screentone. Detailed houses retain roof cornices and parapets; distant houses preserve their footprint, roof profile and palette. Nearby houses add deep window reveals, shutter slats, balcony rails, floor bands, shop signs, awnings, tiled roof relief and roof equipment. Broad and slender tree crowns use forked trunks; close foliage follows the camera with a maximum of 96 detailed trees. Mapped woods use dense canopies, while parks remain more open. Vegetation follows mapped polygons and holes and avoids mapped buildings, roads and water. Near and far vegetation share geometry and colors; distant forest crowns represent groups of trees on a bounded spatial grid, with land-cover surfaces used beyond 8.8 km. Raised curbs, cars, scooters, people, utility poles and sagging cables follow mapped roads. Camera-local shadows and geometry-based outlines preserve small details; distant lines and screentone fade. The camera panel includes focal length, extent and grid controls.
- Save up to twelve views on this browser. Shared links include the location, extent, deterministic seed, appearance and camera pose. Saved views and map caches stay in browser storage; clearing browser data removes them.
- Export PNG, SVG, GLB or OBJ. PNG preserves the displayed shading and screentone. SVG and 3D exports contain visible geometry and materials, without the screen-space finish or inverted tree-contour shells. PNG/SVG include attribution; 3D files retain source metadata or comments. Keep the map-data credit beside published work. OBJ is an uncompressed geometry format and can produce large files.

## Code map

| File                                                                                       | Responsibility                                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| [components/Studio.tsx](components/Studio.tsx)                                             | Vietnamese workspace, search, settings, saved views and export dialogs.         |
| [components/SceneCanvas.tsx](components/SceneCanvas.tsx)                                   | Typed React/3D boundary, asynchronous scene generation and cancellation.        |
| [components/MapPreview.tsx](components/MapPreview.tsx)                                     | Lightweight vector minimap and fallback.                                        |
| [lib/geo/coordinates.ts](lib/geo/coordinates.ts)                                           | Coordinates, URL state, polygon clipping and seeded heights.                    |
| [lib/geo/data.ts](lib/geo/data.ts)                                                         | Map parsing, multipolygon assembly, search and cache/provider requests.         |
| [lib/geo/vector.ts](lib/geo/vector.ts)                                                     | Live vector tiles, ring/line clipping and map-provider fallback.                |
| [lib/geo/terrain.ts](lib/geo/terrain.ts)                                                   | Terrain tiles and bilinear elevation sampling.                                  |
| [lib/scene/model.ts](lib/scene/model.ts)                                                   | Extruded footprints, stylized roofs, windows, roads, water and instanced trees. |
| [lib/scene/landmarks/](lib/scene/landmarks/), [catalog.json](lib/scene/landmarks/catalog.json) | Original landmark geometry, mapped anchors, footprint replacement and themes. |
| [lib/geo/buildings.ts](lib/geo/buildings.ts), [lib/scene/elevation.ts](lib/scene/elevation.ts) | Building-part elevations/outline suppression and Hoàn Kiếm lake leveling. |
| [lib/scene/facades.ts](lib/scene/facades.ts), [lib/scene/streets.ts](lib/scene/streets.ts) | Batched nearby architecture, road-aware camera placement and street furniture.  |
| [lib/scene/trees.ts](lib/scene/trees.ts), [lib/scene/vegetation.ts](lib/scene/vegetation.ts) | Shared foliage clusters, mapped forest/park distribution, near/far detail and palette changes. |
| [lib/scene/context.ts](lib/scene/context.ts), [lib/scene/architecture.ts](lib/scene/architecture.ts) | Batched surroundings and shared near/far palettes, roofs and distance-limited basic windows. |
| [lib/scene/stage.ts](lib/scene/stage.ts)                                                   | Camera, picking, lighting, render scheduling and GPU cleanup.                   |
| [lib/scene/camera.ts](lib/scene/camera.ts), [lib/scene/finish.ts](lib/scene/finish.ts)     | Close/overview framing, bounded contact shading and screentone output.          |
| [lib/scene/export.ts](lib/scene/export.ts)                                                 | PNG, SVG, GLB and OBJ output.                                                   |
| [lib/settings.ts](lib/settings.ts), [lib/saved.ts](lib/saved.ts)                           | Validate shared/saved settings and persist local views.                         |
| [lib/places.ts](lib/places.ts), [public/data/](public/data/)                               | Featured Vietnamese locations and attributed snapshots.                         |

Geometry is merged by layer, trees use five instanced batches with bounded close foliage, and rendering stops while idle or hidden. Nearby facade details follow the camera after it settles, with a bounded geometry budget; replaced details release their resources. A surrounding map starts at 2.2 km and expands to regional/country scales as you zoom out. Vector and elevation zoom levels adapt to keep each request bounded to a few tiles; byte/pixel caches are bounded in memory. Near and far houses share palettes, roof profiles and basic windows; buildings crossing the detailed boundary retain their full footprint. The surrounding layer no longer truncates mapped houses after 6,500 entries. Context generation yields between batches and releases canceled work. The far map omits distant landmark meshes and uses a coarser surface grid; road joins also reduce their precision with distance. Re-centering rebases camera coordinates to the new local origin; navigation swaps the detailed model and surroundings together. A new location cancels pending work; discarded models release their geometry, materials and instance buffers. Failed navigation retains the previous scene and offers retry. Background loads use a small status badge while panning remains available. The canvas has a bounded pixel budget and no continuous decorative render loop.

## Data and limits

Building footprints, roads, parks and water come from OpenStreetMap. New areas load OpenFreeMap vector tiles, with public Overpass servers as a fallback; explicit search uses Photon. City requests retain zoom-14 building tiles (up to nine tiles); regional requests can supplement four coarse tiles with this local building layer. At most four tile fetches run at once. Country requests remain limited to four coarse tiles. Requests are cached, and searches run only after submission. Vector tiles generalize geometry and their rendered heights are marked as estimates. Repeated vector IDs do not determine the look of an entire street: visual variation uses each footprint’s geographic position. The provider’s 5 m default is replaced by a deterministic illustrative height; tagged source heights remain authoritative. Providers can throttle requests or become unavailable. The bundled locations remain usable without a live map request; surrounding scenery and terrain still load separately. Failed surroundings leave the detailed scene usable, and unavailable terrain falls back to a flat surface.

Elevation comes from Mapzen Terrain Tiles. Available `height`/floor-count tags drive ordinary building heights; missing values use deterministic estimates. Building parts retain their minimum elevation and replace enclosing whole-building shells. Known landmarks replace their generic extrusions and retain architecture across themes and model exports. The catalog covers 93 locations across 21 province/city names, not every landmark in Vietnam. Repeated halls, churches and towers share architectural families. Of the 49 additions, 39 use mapped building footprints and ten have approximate point anchors; Đài Nghiên and Đắc Nguyệt Lâu also retain their earlier approximate anchors. These entries are identified in `catalog.json` and their card tooltips. Fitted models stay within a footprint or one clear interior section; complex plans and decorative details are simplified. The round Chợ Đầm hall preserves its separate surrounding wing. Removed figurative sculptures remain excluded. Closed lakes, river reaches and coastal water use a shared local level and preserve islands; linear streams retain terrain gradients. Roofs, facades, shop names, vehicles, people, poles and extra park trees are illustrative; their precise appearance and placement are not surveyed. Lighting is an artistic time-of-day control. Eye-level movement checks mapped building and water footprints; it does not simulate traffic or collisions with small furniture. This is a creative reference tool rather than a measured architectural model.

Tests cover coordinate/share state, clipping, heights, all six snapshots, multipolygons, elevation, saved-data validation, model lifecycle, camera-near facade replacement, street placement and the surrounding ring’s clipping and water holes. Landmark checks cover every new model's geometry, themes and cleanup, all 39 new mapped footprints, courtyard fitting and six actual generalized vector shells. Generalized shells are removed when almost fully covered; merged buildings are clipped to preserve their remaining wings in both near and context rendering. Browser QA covers desktop/mobile, reduced motion, idle rendering, controls, save/restore, shared views, exports and 2D fallback. The scenic update was checked on desktop/mobile and at all five new sites, including the real tunnel metadata in a Phong Nha vector tile and the near/context surface cutouts. Earlier checks covered Landmark 81, Notre-Dame Cathedral, Dinh Độc Lập, Hanoi Opera House, Đà Lạt station, Đầm Market and Kê Gà lighthouse. Physical-device frame rates have not been measured.

See [CREDITS.md](CREDITS.md) for inspiration, data sources and licenses.

[Desktop](images/preview.png) · [Street view](images/street.png) · [Mobile](images/mobile.png) · [Ink view](images/ink.png)

## Nationwide coverage limits

Supported mainland and island coordinates can be reached by continuous pan/zoom and on-demand loading, as well as the destination picker. Zoom out for inter-city travel and back in for buildings; walking keeps its real-world street pace. It does not mean that every location has complete mapped houses, surveyed elevation or a custom landmark illustration. The 93 architectural and scenic illustrations appear when their locations enter the detailed or nearby scene; other buildings use real mapped footprints with the shared architecture, vegetation and street rendering. New landmark destinations still need live surroundings and terrain data. The overview uses simplified country outlines, while 3D geometry comes from the map providers. Data and network availability determine local detail and travel loading time. Regional/country views simplify the map; the full country is not held in memory at street detail.
