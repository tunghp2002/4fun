# 4fun

A collection of interactive 3D HTML scenes. Each scene has a standalone HTML file, a reusable generation prompt, and rendered preview images.

## Scenes

| Scene | HTML | Prompt | Preview |
| --- | --- | --- | --- |
| Amemachi — Rainy Night Konbini | [Open file](scenes/rainy-konbini/index.html) | [Generation prompt](scenes/rainy-konbini/PROMPT.md) | [Overview](scenes/rainy-konbini/images/preview.png) · [Detail](scenes/rainy-konbini/images/detail.png) |

![A Japanese convenience-store miniature on a rainy night](scenes/rainy-konbini/images/preview.png)

## View a scene

Download or clone this repository and open a scene's `index.html` in a modern browser with WebGL support. The GitHub file view displays source code; open the downloaded HTML to interact with the scene.

The current scene works offline, with no installation, build step, or server required.

- Drag to rotate; right-drag to pan; scroll to zoom.
- On touch screens, drag with one finger to rotate and use two fingers to pan or pinch to zoom.
- Press `Home` to reset the view.

## Folder convention

```text
scenes/
  scene-name/
    index.html
    PROMPT.md
    images/
      preview.png
      detail.png
```

Use a descriptive folder name for each new scene. Keep its code in `index.html`, its reusable prompt in `PROMPT.md`, and its rendered images in `images/`. Link the scene from the table above.

The konbini scene embeds Three.js r160.1, OrbitControls, and Reflector. Their MIT license notice is included in the HTML. Preview images are captures of the actual HTML scene.
