# Harumachi — Spring Morning Station

Create a complete, runnable **single-file `index.html`** containing an interactive miniature 3D Japanese countryside train-station diorama.

The entire scene should feel like a small collectible landscape model viewed from a slightly elevated third-person perspective. The user must be able to freely drag, rotate, pan, and zoom around the scene, with no visible UI elements whatsoever.

Use **Three.js** with OrbitControls. All HTML, CSS, and JavaScript must be contained in one file. External JavaScript libraries may be loaded from a CDN, but do not rely on external 3D models or texture image files.

## Core atmosphere

The scene takes place on a **bright, peaceful late-spring morning** in suburban or rural Japan.

The visual mood should be:

- Bright
- Fresh
- Warm
- Peaceful
- Slightly nostalgic
- Relaxing
- Clean
- Full of small everyday-life details

Avoid nighttime lighting, rain, cyberpunk styling, heavy neon, gloomy weather, or dramatic cinematic darkness.

The scene should resemble a peaceful frame from a Japanese slice-of-life anime transformed into a miniature 3D diorama.

## Main environment

Build the entire scene on a complete square diorama base.

At the visual center, create a believable Japanese local train station with a substantial station hall and a generously sized covered platform. Keep human-scale dimensions consistent; enlarge the square base when the circulation needs more space.

Surround it with enough environmental detail to clearly communicate a quiet neighborhood train-stop area.

Include:

- Substantial local station building
- Covered platform
- Railway tracks
- Platform edge markings
- Station name signs
- Timetable board
- Ticket gates or simple ticket machines
- Modern molded waiting seats on a grounded shared metal beam
- Vending machines
- Bicycle parking
- Small flower beds
- Bushes and grass
- Utility poles
- Power lines
- Railway signal lights
- Crossing barriers
- Railway crossing sign
- Narrow neighborhood road
- Small pedestrian crossing
- Road mirrors
- Guardrails
- Drainage channels
- Small parking area
- Mailbox
- Trash / recycling bins
- Public notice board
- Direction signs
- Green village-edge landscape around the base; omit unrelated border houses and shop facades so the station remains the focal point.

Keep the composition cohesive, with the station as its strongest visual anchor. Do not shrink the station, narrow walkways, or crowd seats against dangerous edges merely to fit more props. A larger base is preferable to implausible circulation.

## Station building

The station should look modest, charming, and believable rather than modern or futuristic.

Use:

- Light cream walls
- Pale green, blue, or muted teal trim
- Painted metal architectural details; use modern molded platform seats
- Large windows
- Small awnings
- Clear Japanese-style station signage
- Sliding entrance doors
- Simple tiled or painted roof
- Poster boards
- Ticket machines
- Notice panels

Inside the station building, show a few visible details through the windows:

- Ticket machine
- Small waiting area
- Modern waiting seats
- Wall posters
- Timetable
- Storage door
- Small staff counter

The interior should be softly lit by daylight rather than glowing artificially.

## Natural environment

Nature should be important to the composition.

Add:

- Fresh green grass
- Small shrubs
- Flower patches
- Dandelions or tiny wildflowers
- A few medium-sized trees
- Cherry or leafy roadside trees
- Moss around drainage edges
- Small stones
- Slightly uneven ground
- Leaves scattered near fences and tracks

Vegetation should be stylized and simplified, not photorealistic.

Use soft greens with subtle variation.

## Anime-style rendering

Target a polished **3D-to-2D Japanese anime background** aesthetic.

Use:

- Toon or cel-style shading
- Clear but subtle outlines
- Soft pastel colors
- Slightly simplified geometry
- Clean material separation
- Gentle ambient occlusion
- Soft contact shadows
- Minimal metallic appearance
- Slightly matte surfaces
- Warm sunlight
- Bright blue sky
- Soft atmospheric haze
- Subtle bloom only if inexpensive

Avoid photorealistic PBR.

Avoid excessive texture noise.

Objects should remain readable from the default camera angle.

The whole scene should feel handcrafted and collectible.

## Lighting

Use a sunny morning lighting setup.

Create:

- Warm directional sunlight
- Soft blue ambient sky light
- Gentle shadows
- Bright but not overexposed surfaces
- Soft reflected light beneath awnings
- Slightly cooler shaded areas
- Warm sunlit grass and building walls

Aim for approximately **8–10 AM spring sunlight**.

The scene should feel bright without becoming harsh or washed out.

## Small animations

Add restrained environmental animation to make the miniature world feel alive:

- Grass and leaves moving slightly in the breeze
- Tree branches gently swaying
- Railway crossing lights blinking before and during an actual approaching train
- Crossing barriers lowering before the train enters, staying down until its last carriage has cleared, and rising afterward
- A railway signal changing coherently with track occupancy
- Small station sign or hanging board moving slightly in the wind
- Clouds drifting slowly across the sky
- A few leaves occasionally moving along the ground

Do not add characters.

Do not add trains constantly.

Include two services: a single-car local train that stops to board passengers, and an occasional four-car rapid train that passes without stopping. Keep quiet intervals between services. Every barrier closure must accompany an actual approaching or departing train; do not animate empty closures.

## Camera and interaction

Use a slightly elevated miniature-diorama camera angle.

Prefer a PerspectiveCamera with approximately **30–35° field of view** for a compressed collectible-model appearance.

Allow:

- Drag to rotate
- Scroll / pinch to zoom
- Pan
- Smooth damping

Restrict the camera so users cannot move underneath the diorama base or too far away.

The initial view should immediately show the station, tracks, road crossing, trees, and surrounding neighborhood details.

## Technical requirements

Use Three.js.

Use procedural geometry wherever practical.

Do not use downloaded GLTF/OBJ/FBX assets.

Do not require image textures.

Create signs, posters, markings, and labels using canvas-generated textures or simple geometry.

Use lightweight repeated geometry or instancing where appropriate.

Keep the scene performant on a typical modern laptop.

Target smooth animation around 60 FPS where possible.

Use devicePixelRatio carefully.

All code must exist in one HTML file.

## Priority order

Prioritize:

1. Charming miniature composition
2. Bright Japanese slice-of-life atmosphere
3. Clear station and railway identity
4. Natural greenery
5. Strong 3D-to-2D anime rendering
6. Clean sunlight and soft shadows
7. Small environmental storytelling details
8. Smooth camera interaction

Do not reduce the result to a station box beside two railway tracks.

Make the environment feel lived-in, detailed, calm, and collectible.

## Physical layout and review requirements

Use consistent human-scale proportions. Establish the building, railway, roads, platforms, and clear walking routes before decorating them. Optional details must fit naturally into this layout.

Keep all model geometry within the square base. Every fixture must meet a supporting surface or have visible feet, brackets, posts, or a structural connection. Preserve clear approaches to the entrance, platform stairs, ramp, waiting area, bicycle parking, and vehicle parking.

Make platform access physically continuous. Match stair and ramp endpoints to their actual floor heights. Give the railway crossing a road deck flush with the rail heads, leave flangeways, and connect it to supported approach slopes. Crossing arms must pivot from real hinges and span the road while lowered. Coordinate their movement with the warning lights and railway signal.

Ensure doors have genuine openings, signs have opaque backs and readable front faces, roof and canopy members join their supports, and wires terminate at insulators. Glass must not cast opaque shadows. Correct shadow acne and visible detachment before delivery.

Review the rendered result from the front, rear, both sides, above, and close up. Check ground contact, collisions, access, signage, shadows, and framing. Verify mouse and touch controls, narrow portrait viewports, reduced-motion behavior, and the complete crossing animation cycle. State which checks actually ran.

Deliver index.html, this prompt as PROMPT.md, and images/preview.png plus images/detail.png captured directly from the HTML. Prefer embedding the libraries, preserving their license notice, so the delivered scene works offline.

## Scale and station safety — final layout constraints

- Use a 34 × 34 square base with a station hall roughly 11.6 × 5.4 and a 20.8 × 4.2 covered platform. Treat one unit as approximately one metre. These dimensions describe a quiet local stop, not a full-size city terminal.
- Remove minor surrounding houses. Let greenery frame the station; the building and platform must remain the focal point.
- Put platform benches beneath the canopy, backed by a continuous supported windbreak or protective wall. Seats face the broad platform aisle, with at least 1.5 metres of clear circulation ahead; never face an unprotected drop.
- Protect the platform rear and both ends. Leave only deliberate stair and ramp openings. Keep the rail-facing edge open, with a tactile warning strip.
- Do not place canopy posts, benches, railings or bins in the route from the station hall to the stairs and onto the platform. Add stair handrails and a landing at the exact floor height.
- Preserve a clear front walking route, a side route to the platform ramp and an open vehicle approach to the parking bay. Parking needs a real lowered curb; guardrails must never cross its driveway.
- At the T-junction, curbs and road markings must stop at the connecting road. No curb, railing or decorative strip may block the turn or the pedestrian crossing.
- Railway signals face approaching trains along the track. Crossing warning lights face approaching road users. Barrier arms attach to visible pivot axles beside their motor housings and span the road when lowered.
- Review the rendered model from the entrance, platform, crossing, rear, overhead and default views. Check supports, ground contact, human scale, raised-edge protection and connected routes before delivery.

## Roads and vegetation — final art direction

- Make the street in front of the station 5 metres wide, from the station-side curb to the front cut of the square model. Remove the narrow outer grass verge completely; do not squeeze the roadway to preserve an ornamental border.
- Widen the road over the level crossing to 4.4 metres. Resize its supported approach slopes, deck, stop lines and barrier arms together, and move posts, mirrors, utility poles and trees outside the widened roadway.
- Place white edge stripes 0.4–0.45 metres inside the asphalt. Leave gaps at the pedestrian crossing, parking driveway and T-junction; center dashes must also stop before crossings and junctions. Extend the zebra crossing across the entire street.
- Build continuous low grass meadows from closely spaced shared blade patches, with curved tapered leaves, restrained height variation, root-to-tip color and breeze motion. Spread blade roots across each patch, use at least 100 blades per square metre and overlap patch edges so the ground never looks dotted with isolated clumps. No grass may grow on the asphalt, platform or public walking routes.
- Trees must have tapered bark-covered trunks, grounded root flares, visible connected branches and an asymmetric crown of many overlapping foliage clusters. Add small attached leaf tips, darker inner foliage and lighter outer leaves; avoid identical polygonal balls on straight cylinders.
- Arrange layered shrubs and small wildflowers around planted patches. Keep vegetation within the square base and leave clearance around the railway, road signs and all circulation routes.
- Use shared geometry and instancing for repeated blades, branches and foliage. Keep every texture procedural and embedded; preserve the soft anime palette and offline single-file format.

## Waiting seats and train passage

- Use four molded seats per standard bench in muted teal, with gently curved seat/back shells, a shared metal beam, supported armrests and bolted pedestal feet. Fill five protected platform waiting bays: four four-seat rows and one two-seat row at the narrow end, plus two four-seat rows inside the hall, for 26 seats total. Retain the rear windbreak and generous clear aisle, and extend the canopy over the new end seating.
- The rapid train consists of four connected, roughly 18-metre carriages with bogies, eight rail-contact wheels per carriage, underfloor equipment, roofs with vents, doors, side windows, destination boards, a leading cab with headlights and a trailing cab with red tail lights. Use a local diesel train so missing overhead railway power equipment is not implied.
- Clip all train surfaces, text, wheels and shadows at the two track ends of the square base. The train should enter and leave through the model cuts rather than suddenly appear or extend unsupported into the background.
- Coordinate both services on a 180-second timeline. For the rapid, warning lights start, gates lower completely, all four carriages pass, the tail clears, then gates lift. Keep the gates down until the whole train has left the miniature. Preserve long quiet intervals.
- Verify warning, lowering, leading-cab arrival, intermediate carriages, tail clearance, reopening and cycle restart. Never permit a raised barrier while any carriage occupies the road crossing. Preserve reduced-motion behavior.

## Local boarding without holding up road traffic

- The 20.8-metre platform must contain the entire stopped 18-metre local carriage. Do not stop a four-car consist across the nearby road crossing; identify that service as a rapid train passing through.
- Stop the local carriage with its nose at x = 5.8, before the road crossing at x = 8.8–13.2. Decelerate into the platform, hold for roughly 11 seconds, and keep the crossing gates fully raised throughout arrival and boarding.
- Open only the platform-facing sliding doors. The body must have actual door openings, an interior floor and visible seats; door panels, windows and painted stripes move together. No solid body panel or floating stripe may remain across an open doorway.
- Close doors, start warning lights, lower both gates completely, then accelerate the local train past the crossing. Lift the gates only once its last wheel and tail are clear.
- Place additional benches within protected canopy bays. Preserve the station-exit aisle and ramp opening; use a shorter two-seat row in the narrow end bay instead of forcing a full-size bench between columns.
- Verify the stopped train fits the platform, gates remain open while doors are open, doors are genuinely clear at leg and body heights, and no raised gate coincides with either train occupying the road.

## Transparent glazing and distinct carriage interiors

- Build every carriage as a hollow shell with genuine side-window, door-window and windscreen openings. No solid body panel, opaque backing or decorative colored rectangle may remain behind glass. Use clear glass with only a slight cool tint, approximately 10% opacity; glass must not write depth or cast opaque shadows. Preserve clear window frames and restrained reflections without hiding the interior.
- Furnish all five carriages, including the four-car rapid service. Use longitudinal passenger seats facing the central aisle, bolted supports, end armrests, floor-to-ceiling poles, attached luggage racks, hanging straps, ceiling light strips, door signage and marked entrance vestibules. Keep at least 1.2 metres of clear central circulation and keep the three pairs of doorways completely clear of furniture.
- Use the shared molded-seat geometry at consistent human scale. The single local carriage has 28 passenger seats; each rapid end carriage has 36, and each intermediate carriage has 44. Seat rows stop before doors, driving-compartment walls and gangway entrances.
- Model driving compartments only at the exposed ends: one cab in each rapid end carriage, none in the two middle carriages, and a cab at both ends of the single local carriage. Reserve real floor space for each cab rather than placing controls inside a passenger seating row.
- Separate each cab from the passenger compartment with a framed glazed partition and a closed crew-access door. Include a supported driver's chair facing the windscreen, a distinct sloped control desk, instrument displays, brake lever, small controls and exterior wipers. The cab layout and end windows must be visibly different from an ordinary passenger compartment.
- Intermediate carriage ends need passenger gangway openings, supported flexible side bellows, a roof and a connecting floor flush with the 1.42-metre carriage floor. Do not use a solid block across the gangway or duplicate driving consoles in middle carriages.
- Give sliding doors real transparent glass openings and attached center seals. Panels, glass, stripes and seals move together. Open only the local train's platform-facing doors during boarding; passengers must have a clear route from the platform into the carriage.
- Allow closer zoom to inspect the interiors while keeping the default complete-model view. Do not add interface controls or characters. Preserve the existing local-stop and rapid-passage timetable, warning lights, barriers, rail contact and clipping at the model edges.
- Review a closed passenger window, an open boarding doorway, a normal middle carriage and a driving cab in the actual rendered HTML. Check visibility with rays through the glazing, actual aisle and vestibule clearances, connected floor heights and both train/crossing cycles. Save interior and cab close-ups alongside the scene previews.
