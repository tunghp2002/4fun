// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import { Color } from "three/webgpu";
import { uniform } from "three/tsl";
export function createDialogueModule(scope) {
  var ane = [
    `Hi, I'm mesq!`,
    `Scroll down the post — and click me anytime for a comment on where we are.`,
  ];
  var AB = [
    `I'm a technical artist and three.js developer. I build small worlds for games and web experiences.`,
    `My stack: Blender, three.js, shaders, and Substance Painter.`,
    `Each street sign here is one of my tools: pick one and I'll tell you what it does.`,
  ];
  var jB = {
    blender: [
      `Blender St.! Blender is free, open-source 3D software: modelling, sculpting, UVs, baking, animation and rendering, all in one.`,
      `It's the heart of my workflow: I spend most of my time here, sketching out ideas, refining shapes and optimising scenes.`,
    ],
    threejs: [
      `Three.js Av.! three.js is a JavaScript library that draws 3D right in the browser.`,
      `This whole street runs on it: the post, the birds and me, to be specific, on WebGPU.`,
      `I also use GSAP, React, R3F, and TSL.`,
    ],
    shaders: [
      `Shader Alley! Shaders control how geometry behaves and how every pixel is coloured on the screen.`,
      `Most of the cool effects come from working with shaders. Here I write them in TSL, the new shader approach from three.js.`,
    ],
    substance: [
      `Substance Ln.! Substance Painter creates complex layered materials right on the model, for more realistic or stylized looks.`,
      `I usually pair it with Marmoset, Photoshop and Illustrator to get a better result.`,
    ],
  };
  var MB = [
    {
      sign: `ENGINEERING`,
      cue: `Engineering`,
      talk: [
        `Engineering. I started in Digital Fabrication and Product Design.`,
        `I did CAD modelling and prototyping for robotics and solar energy: electronics, 3D printing and material testing.`,
      ],
    },
    {
      sign: `3D MODELLING`,
      cue: `3D modelling`,
      talk: [
        `3D modelling: Blender opened up game art for me, with UV unwrapping, baking, texturing, sculpting, animation and more.`,
      ],
    },
    {
      sign: `THREE.JS`,
      cue: `Three.js`,
      talk: [
        `Three.js put my models in the browser, so anyone could try my projects live.`,
        `Soon I could build game mechanics, shape the user experience and tune how materials and the world react to every move.`,
      ],
    },
    {
      sign: `TECH ART`,
      cue: `Tech art`,
      bird: `heart`,
      talk: [
        `Tech art: a technical artist works between art and code.`,
        `Knowing both worlds, I build and optimise pipelines that help the 3D team move from concept to prototype and then to production.`,
        `That led to my talk at Three.js Conf about the hand-painted pipeline we've built with my team at EdClub.`,
      ],
    },
  ];
  var NB = [
    `This is my professional experience.`,
    `Pick a stop on the plate under the bus and I'll tell you about it.`,
  ];
  var PB = [
    `I also shoot film. To balance the digital projects with something analogue.`,
    `Click the photo to see my film shots on Flickr.`,
  ];
  var FB = [
    `That's the end of the street! Thanks for stopping by!`,
    `Come back soon: there's always something new on the post.`,
  ];
  var IB = {
    start: [
      `Welcome to bird street! Scroll down the post to learn about me, my projects, and how to reach me.`,
      `Psst — the birds get nervous if you hover them.`,
    ],
    about: AB,
    projects: [`Click the panel to open a project.`],
    contacts: [
      `Click X or LinkedIn to visit me and say hi!`,
      `Or click the mailbox to copy my email.`,
    ],
    end: FB,
  };
  var LB = {
    "MQ-001": [
      `Wave Shaders — my very first three.js project.`,
      `I was testing GLSL and basic three.js scene positioning.`,
    ],
    "MQ-002": [
      `Gameboy — my project for the very first Three.js Journey Challenge.`,
      `These are the monthly challenges for the three.js community from Bruno Simon.`,
      `The three.js techniques are pretty simple — the real work was done with models and textures in Marmoset and Substance Painter.`,
    ],
    "MQ-003": [
      `Star Piece on Tatooine — a Three.js Journey LEGO challenge.`,
      `I built it in the LDraw app from the original LEGO Star Wars instructions, then remodelled and optimised the bricks in Blender.`,
      `Lights and the bricks' explosion were baked, so the three.js side still stays simple.`,
    ],
    "MQ-004": [
      `Cabin — my cozy-place project for the Three.js Journey Challenge.`,
      `By then I'd joined EdClub, so I pushed my three.js further: particle emitters, instancing, and Zustand to sync multiple events and scene states.`,
      `All the assets were hand-painted in Procreate during my trip to Japan.`,
    ],
    "MQ-005": [
      `Infinite Terrain — my playground for a generated world: grass, trees and wind.`,
      `The focus: smooth chunk streaming, with everything moving in sync with the wind.`,
      `I used “dithering” for the fading effect — I took the idea from Elden Ring.`,
    ],
    "MQ-006": [
      `Utanomori — a stylized forest I built for a Three.js Journey Challenge.`,
      `In the game you need to find music spirits and complete their mini games to gather your lost melody.`,
      `Here I practised pathfinding, game loops and post-processing.`,
    ],
    "MQ-007": [
      `Typo's Voyage — a game my team and I made at EdClub to help kids learn to type.`,
      `Each level is a generated line of tiles mixing several mechanics. My first encounter with BatchedMesh.`,
      `Every asset is hand-painted. I gave a talk at Three.js Conf about our pipeline behind this style.`,
    ],
    "MQ-008": [
      `Jelly Painting — my small TSL experiment, and the newest project here.`,
      `For the painterly look I'm using hand-painted normals and post-processing.`,
      `You can grab the glass and shake it to see the wobble and the glass transmission effects.`,
    ],
    "MQ-MORE": [
      `More projects are on the way!`,
      `Meanwhile, some of my modeling work is on ArtStation — click the ArtStation sign.`,
    ],
  };
  var RB = [
    `This one is still in the workshop. Come back soon — it's going to be good!`,
  ];
  var zB = `mkiiatkin@gmail.com`;
  var BB = (e) => [`Copied ${e} — paste it into your mail app and say hi!`];
  var one = [
    `The mailbox is still being installed — for now, X or LinkedIn work great!`,
  ];
  var sne = {
    blender: `Blender St.`,
    threejs: `Three.js Av.`,
    shaders: `Shader Alley`,
    substance: `Substance Ln.`,
  };
  var VB = new Map([
    [
      AB,
      [
        {
          page: 1,
          word: `Blender`,
          target: `blender`,
        },
        {
          page: 1,
          word: `three.js`,
          target: `threejs`,
        },
        {
          page: 1,
          word: `shaders`,
          target: `shaders`,
        },
        {
          page: 1,
          word: `Substance Painter`,
          target: `substance`,
        },
      ],
    ],
    ...Object.keys(jB).map((e) => [
      jB[e],
      [
        {
          page: 0,
          word: sne[e],
          target: e,
        },
      ],
    ]),
    ...MB.map((e, t) => [
      e.talk,
      [
        {
          page: 0,
          word: e.cue,
          target: `stop:${t}`,
        },
      ],
    ]),
    [
      NB,
      [
        {
          page: 1,
          word: `plate`,
          target: `timetable`,
        },
      ],
    ],
    [
      PB,
      [
        {
          page: 1,
          word: `Flickr`,
          target: `flickr`,
        },
      ],
    ],
    [
      IB.contacts,
      [
        {
          page: 0,
          word: `X`,
          target: `x`,
        },
        {
          page: 0,
          word: `LinkedIn`,
          target: `linkedin`,
        },
        {
          page: 1,
          word: `mailbox`,
          target: `mailbox`,
        },
      ],
    ],
    [
      LB[`MQ-MORE`],
      [
        {
          page: 1,
          word: `ArtStation sign`,
          target: `artstation`,
        },
      ],
    ],
  ]);
  var HB = {
    brightness: uniform(2.22),
    dot: uniform(0.39),
    night: uniform(0),
    nightBoost: uniform(0.45),
    glass: uniform(0.14),
    crescent: uniform(0.36),
    glassGlow: uniform(0.08),
  };
  var UB = (e) => {
    let t = new Color(e);
    return (
      (Math.round(t.r * 255) << 16) |
        (Math.round(t.g * 255) << 8) |
        Math.round(t.b * 255) || 1
    );
  };
  var WB = UB;
  return {
    ane,
    AB,
    jB,
    MB,
    NB,
    PB,
    FB,
    IB,
    LB,
    RB,
    zB,
    BB,
    one,
    VB,
    HB,
    UB,
    WB,
  };
}
