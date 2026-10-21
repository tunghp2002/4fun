# Sources and credits

## Concept reference

The real-location-to-3D workflow was inspired by [Rokehan / どこでもロケハン](https://tools.oyasumi-gamedev.com/rokehan/), and the street rendering of [World Gacha / ワールドガチャ](https://tools.oyasumi-gamedev.com/worldgacha/), by MIYADAIKU / Oyasumi Game Development. Phố Studio has its own implementation and interface. No affiliation or endorsement is claimed.

## Map data

**© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).** The bundled snapshots in `public/data/` are OpenStreetMap extracts under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Each snapshot includes attribution, license, center, extent and source timestamp. They were fetched on 2026-10-15.

Live areas and the distant surrounding ring use [OpenFreeMap](https://openfreemap.org/), with the [OpenMapTiles schema](https://openmaptiles.org/docs/schema/) (© OpenMapTiles, CC BY 4.0). A real tile at z14/x13047/y7698 is retained as a parser test fixture. Vector geometry is clipped and transformed into the app's local coordinates; supplied render heights remain labelled as estimates. [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API), via Private.coffee or VK Maps, provides a fallback. Explicit place searches use [Photon](https://github.com/komoot/photon), whose results derive from OpenStreetMap. Requests are cached and search is never issued for each keystroke.

Retain OpenStreetMap attribution when publishing outputs. PNG/SVG include a credit line, GLB includes source metadata and OBJ includes source comments.

## Nationwide location overview

The simplified overview in `lib/geo/vietnam-overview.json` comes from [Natural Earth 1:50m country outlines](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson), accessed 2026-10-19. Natural Earth data is [public domain](https://www.naturalearthdata.com/about/terms-of-use/). The outline is clipped to the navigator's vicinity and also supplies the country-view orientation line; small offshore destinations are separately marked by their coordinates. This overview supplies navigation, not 3D building footprints or a surveyed boundary.

Province filters use the 34 names in the government's [published administrative name list](https://baochinhphu.vn/bang-danh-muc-va-ma-so-cua-34-tinh-thanh-moi-3321-don-vi-hanh-chinh-cap-xa-moi-102250704153652947.htm). Older province names are retained as search aliases. Hoàng Sa and Trường Sa destination coordinates identify individual islands, rather than the centroid of an entire archipelago.

## Elevation

[Terrain Tiles](https://registry.opendata.aws/terrain-tiles/), managed by Mapzen, a Linux Foundation project, and served from the public AWS dataset. Accessed on 2026-10-15. Source acknowledgements include SRTM/GMTED2010 data courtesy of the U.S. Geological Survey and global ETOPO1 data from NOAA. The dataset combines sources with their own terms; see the [provider's attribution and source notices](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).

The app samples and interpolates the supplied elevation; it does not claim survey accuracy. Flat fallback and optional vertical exaggeration are transformations made by this app.

## Landmark architecture

The architectural and scenic illustrations at 93 named locations are original geometry, including 49 architectural additions and five scenic additions to the earlier 39-location catalog. OpenStreetMap supplies mapped positions and footprints; public photographs and architectural descriptions inform the recognizable shapes. No third-party 3D models are bundled; photographs are used only as the discovery thumbnails credited below. Ordering in the “Nổi bật” collection is editorial, not a measured popularity ranking.

- Hoàn Kiếm district tourism references: [Tháp Rùa](https://hoankiem360.tourism.vn/chi_tiet_ho_hoan_kiem/thap-rua.html), [Ngọc Sơn](https://hoankiem360.tourism.vn/chi_tiet_ho_hoan_kiem/den-ngoc-son.html), [Hòa Phong](https://hoankiem360.tourism.vn/chi_tiet_ho_hoan_kiem/thap-hoa-phong.html).
- [Hanoi Department of Culture: Hoàn Kiếm and Ngọc Sơn complex](https://sovhtt.hanoi.gov.vn/en/hoan-kiem-lake-ngoc-son-temple-special-national-monuments-famous-scenic-spots-capital/) and [Vietnam News Agency photos](https://vietnam.vnanet.vn/english/tin-tuc/ngoc-son-temple-20765.html).
- [Huế tourism: Thái Hòa Palace](https://huetourism.gov.vn/Dien-Thai-Hoa.html/?pid=MjAzMDN8Y3NkbGRs0) and [Department of Cultural Heritage: Phu Văn Lâu restoration paper](https://dsvh.gov.vn/Upload/files/5314_Trung%20tu%20di%20tich%20Phu%20Van%20Lau.pdf).
- [Vietnam National Authority of Tourism: Hội An architecture](https://vietnam.travel/things-to-do/the-best-ways-to-explore-the-ancient-town-of-hoi-an), [Hanoi architectural photos](https://vietnam.travel/node/187), and [Đà Nẵng tourism database](https://csdl.vietnamtourism.gov.vn/shop/?item=424).
- [Bitexco: tower and helipad reference](https://bitexco.com.vn/en/hcmc-skyrun-the-contest-runs-the-stairs-to-the-high-floor-with-the-destination-of-helipad-in-the-air/).
- [Vietnam National Authority of Tourism: Vietnam's architectural landmarks](https://vietnam.travel/things-to-do/vietnams-amazing-architecture), including Landmark 81, Dinh Độc Lập, Notre-Dame Cathedral, Hanoi Opera House, Văn Miếu, Huế and Chăm architecture.
- [Đầm Market reference](https://travel.com.vn/en/tin-tuc-du-lich/cho-dam-v18453.aspx) and [Cao Văn Lầu Theatre location reference](https://tanitour.vn/nha-hat-cao-van-lau-phuong-1/).

The catalog retains a source OSM way, relation or node link for each mapped anchor. The 49 additional map extracts used for placement tests in `tests/fixtures/national-landmark-maps.json` were accessed on 2026-10-20 and remain © OpenStreetMap contributors under ODbL 1.0. Six overlapping OpenFreeMap/OpenMapTiles building extracts in `tests/fixtures/landmark-vector-shells.json` were accessed on 2026-10-21 and retain the same map-data attribution. Ga Đà Lạt's connected relation components are combined; Chợ Đầm uses the round hall's component and preserves the separate surrounding wing.

Repeated halls, churches and towers use architectural families fitted to their mapped footprints. Decorative details and complex floor plans are simplified; these are exterior illustrations, not surveyed replicas. Ten additions have approximate point anchors: Sa Pa church, Keo bell house, Dâu and Phổ Minh towers, Nhạn and Đôi towers, Po Sah Inư, Kon Klor communal house, Nghinh Phong tower and Cao Văn Lầu Theatre. Đài Nghiên and Đắc Nguyệt Lâu retain their two earlier approximate anchors. All twelve are explicitly identified in `catalog.json` and card tooltips. Hoàn Kiếm’s water surface is leveled and its islands raised above it to remove DEM sampling artifacts.

## Scenic references

- [Sun World: Golden Bridge](https://sunworld.vn/vi/banahills/cam-nang-du-lich/kham-pha-cau-ban-tay-ba-na-hills-dia-diem-check-in-cuc-hothtml), including its curved deck and stone hand supports. Its plan follows the OpenFreeMap representation of [OSM way 683416736](https://www.openstreetmap.org/way/683416736); the vertical placement is estimated from local terrain.
- [Ha Long Bay management: Hòn Trống Mái](https://halongbay.com.vn/vi/places/5-trong-mai-islet-ga-choi-islet), paired undercut limestone forms, anchored at [OSM way 480056722](https://www.openstreetmap.org/way/480056722). This models the two named islets, not every island in the bay.
- [Vietnam National Authority of Tourism: Phong Nha](https://vietnam.travel/things-to-do/cave-country-phong-nha), with the entrance at [OSM node 3093700681](https://www.openstreetmap.org/node/3093700681). The illustration shows the exterior mouth and short river approach; it does not reproduce the underground cave system.
- [Vietnam National Authority of Tourism: Đắk Lắk coast and Gành Đá Đĩa](https://vietnamtourism.gov.vn/post/66775), with illustrative basalt columns kept within [OSM way 1229067977](https://www.openstreetmap.org/way/1229067977).
- [Vietnam National Authority of Tourism: Bản Giốc](https://vietnam.travel/things-to-do/ban-gioc-waterfall-majestic-beauty-northern-border), with a simplified static main cascade anchored at [OSM node 4759574761](https://www.openstreetmap.org/node/4759574761). Water levels, ledges and foliage are illustrative.

The five OpenFreeMap context extracts in `tests/fixtures/scenic-maps.json` and the Phong Nha tile z14/x13029/y7378 in `tests/fixtures/phong-nha-vector.pbf` were accessed on 2026-10-21. They retain © OpenStreetMap contributors, ODbL 1.0 and OpenMapTiles attribution. Reference photographs were inspected for shape; none were added to the product. Terrain, generic water and generated trees are locally masked where the modeled scenery supplies its own surfaces.

## Software and fonts

- Three.js, by the Three.js authors: [MIT notice](public/licenses/three-MIT.txt).
- Clipper, by Angus Johnson and Timo: [Boost Software License](public/licenses/clipper-BSL.txt). Its bundled JSBN code by Tom Wu retains the [original copyright and license](public/licenses/jsbn-LICENSE.txt).
- Next.js: [MIT notice](public/licenses/next-MIT.txt).
- React and React DOM: [React notice](public/licenses/react-MIT.txt), [React DOM notice](public/licenses/react-dom-MIT.txt).
- Manrope, by The Manrope Project Authors: [SIL Open Font License 1.1](public/fonts/OFL-Manrope.txt). Vietnamese and Latin subsets are self-hosted.
- Vector-tile reader: [@mapbox/vector-tile BSD notice](public/licenses/vector-tile-BSD.txt), [Pbf BSD notice](public/licenses/pbf-BSD.txt), [point-geometry ISC notice](public/licenses/point-geometry-ISC.txt).

Procedural facade modules, storefront lettering and street furniture are original code-native illustrations, not photographs or a survey of individual buildings.

Brand marks, interface icons and fallback thumbnails for custom locations are code-native SVG illustrations. Preview images are captures of this app. No reference-site source code, photographic assets or branding are included.

## Discovery photographs

The 50 discovery images are hosted locally as WebP thumbnails: the original six at 480 × 480 pixels and 44 additions at 320 × 320 pixels. Each was cropped, resized and compressed; each derivative retains its source license or public-domain status. Full machine-readable titles, authors, dates, source links and reuse terms are in [`public/photos/credits.json`](public/photos/credits.json), and the app exposes these credits in Hướng dẫn → Nguồn ảnh địa điểm. Photos depict the named city or landscape; they do not document the generated 3D model.

The Hoàng Sa thumbnail is a NASA photograph of Pattle Island from 2002; the Trường Sa Lớn thumbnail is a 2020 Landsat image of Spratly Island. Both are public domain. The Bạch Long Vĩ satellite thumbnail contains modified Copernicus Sentinel data 2024 and retains the required attribution under the [Copernicus reuse terms](https://commons.wikimedia.org/wiki/Template:Attribution-Copernicus). No endorsement by NASA, ESA, the European Union or the photographers is implied. The six original photographs are listed below; the complete 50-image list is in the metadata linked above.

- [Street in Hoi An](https://commons.wikimedia.org/wiki/File:Street_in_Hoi_An.jpg), by Christophe95 · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- [Hanoi – Hoàn Kiếm Lake – Turtle Tower](https://commons.wikimedia.org/wiki/File:Hanoi_-_Hoan_Kiem_See_-_Schildkr%C3%B6tenturm_0002.JPG), by Stefan Fussan · [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- [Nguyen Hue Boulevard, Saigon (20230705 1503)](<https://commons.wikimedia.org/wiki/File:Nguyen_Hue_Boulevard,_Saigon_(20230705_1503).jpg>), by Syced · [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- [Ngo Mon](https://commons.wikimedia.org/wiki/File:Ngo_Mon.jpg), by Lưu Ly · [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- [Chợ Đà Lạt toàn cảnh](https://commons.wikimedia.org/wiki/File:Ch%E1%BB%A3_%C4%90%C3%A0_L%E1%BA%A1t_to%C3%A0n_c%E1%BA%A3nh.jpg), by DHN · [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- [Da Nang Dragon Bridge](https://commons.wikimedia.org/wiki/File:Da_nang_dragon_bridge.jpg), by Thangphan · [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
