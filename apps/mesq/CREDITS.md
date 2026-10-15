# Attribution and provenance

This directory is an **unofficial educational port of [mesq.me](https://mesq.me/), created by mesq**. The original visual design and application are mesq's work. This repository does not claim to be the author's source repository or an original portfolio design, and no affiliation or endorsement is claimed.

## Original application — mesq

- Original website and author: [mesq.me](https://mesq.me/).
- Author profiles linked by the reference: [ArtStation](https://www.artstation.com/mesq), [X](https://x.com/mesqme), [Flickr](https://www.flickr.com/photos/202073981@N08/).
- Scene code, stylesheet and markup are adapted from the published application at mesq.me. See [docs/reconstruction.md](docs/reconstruction.md) for the structure and verification of this port.
- Reference files were retrieved for the port on 2026-10-13 and checked again on 2026-10-14.

| Material | Local files | Provenance |
| --- | --- | --- |
| Scene logic, procedural 3D artwork, animation, shaders, scroll behavior and synthesized audio | `lib/mesq/scene/` | Derived from mesq's shipped application, split into module factories and adapted for cleanup. |
| Page styling and UI markup | `app/globals.css`, `components/Portfolio.tsx` | Adapted from the original CSS and HTML. |
| Eight project covers and two About photographs | `public/projects/`, `public/about/` | Retained from the corresponding paths on mesq.me. |
| Cursor artwork and icon | `public/cursor.svg`, `public/cursor-hand.svg`, `app/icon.svg` | Retained from the original website. |
| Preview screenshots | `images/` | Captures of this port, depicting mesq's original artwork and design. |

The project titles, biography and contact links in the demo refer to **mesq**, not the maintainer of this repository. Original content is retained to study the reference experience.

## Adaptation in this repository

The Next.js route/layout, React lifecycle integration, resource cleanup, typed boundary, tests and documentation were added for this port. Content and performance modules were typed and renamed while retaining original data and behavior. These adaptations do not transfer authorship of the underlying scene, artwork or content.

## Dependencies and fonts

- [Three.js](https://github.com/mrdoob/three.js), `0.186.1`, by the Three.js authors. Installed through npm; its MIT notice is preserved in [licenses/three-MIT.txt](licenses/three-MIT.txt).
- [Next.js](https://github.com/vercel/next.js) and [React](https://github.com/facebook/react) are npm dependencies and retain their respective package license notices.
- Manrope: The Manrope Project Authors, SIL Open Font License 1.1. Notice preserved in [public/fonts/OFL-Manrope.txt](public/fonts/OFL-Manrope.txt).
- IBM Plex Mono: IBM Corp., SIL Open Font License 1.1, Reserved Font Name “Plex”. Notice preserved in [public/fonts/OFL-IBMPlexMono.txt](public/fonts/OFL-IBMPlexMono.txt).

## Permission status

No permission or license grant from mesq has been recorded in this repository. Attribution records the source; it does not claim authorization or relicense the original material under MIT or another open-source license. Third-party material retains its own applicable rights and notices.
