// VICE PANELS — fixed scenes for screenshots.
// The maker captures the app through these URLs; each scene loads the bundled
// samples, arranges a cover and (for cover modes) leaves only the cover on
// screen. main.js supplies applyScene + markReady; this file only describes
// the scenes. `crops` are hand-tuned per panel ({ zoom, ox, oy }) so every
// face lands whole inside its frame — the generic drift table cut heads.

const SCENES = {
  'cover-wide': {
    coverOnly: true,
    size: { w: 1920, h: 1080 },
    layoutId: 'hero-three',
    gradeId: 'vice-sunset',
    title: 'NEON HARBOR',
    subtitle: 'vice panels originals',
    badge: 'VICE CITY · EST. 2026',
    heat: 5,
    panelPhotos: ['pier', 'boulevard', 'pier', 'boulevard'],
    crops: [
      { zoom: 1.05, ox: 0, oy: 0.4 }, // hero: the fisherman, hat and all
      { zoom: 1.3, ox: 0.08, oy: -0.08 }, // beat: torso, hand on the red car
      { zoom: 1.15, ox: 0.05, oy: 0.42 }, // beat: his full face over the sea
      { zoom: 1.45, ox: -0.1, oy: 0.38 }, // beat: her face, shades, sunset palms
    ],
  },
  'cover-portrait': {
    coverOnly: true,
    size: { w: 1080, h: 1350 },
    layoutId: 'classic-nine',
    gradeId: 'vice-sunset',
    title: 'VICE PANELS',
    subtitle: 'vice panels originals',
    badge: 'VICE CITY · EST. 2026',
    heat: 4,
    halftone: true,
    panelPhotos: ['pier', 'boulevard', 'pier', 'boulevard', 'pier', 'boulevard', 'pier', 'boulevard', 'pier'],
    crops: [
      { zoom: 1.3, ox: -0.06, oy: 0.34 },
      { zoom: 1.22, ox: 0, oy: 0.32 },
      { zoom: 1.3, ox: 0.08, oy: 0.34 },
      { zoom: 1.22, ox: -0.05, oy: 0.32 },
      { zoom: 1.3, ox: 0, oy: 0.36 },
      { zoom: 1.22, ox: 0.05, oy: 0.32 },
      { zoom: 1.3, ox: 0.06, oy: 0.34 },
      { zoom: 1.22, ox: 0, oy: 0.34 },
      { zoom: 1.3, ox: -0.08, oy: 0.34 },
    ],
  },
  'cover-square': {
    coverOnly: true,
    size: { w: 1080, h: 1080 },
    layoutId: 'split-boulevard',
    gradeId: 'neon-night',
    title: 'MIDNIGHT RUN',
    subtitle: 'after dark edition',
    badge: 'NEON NIGHTS · 2026',
    heat: 5,
    panelPhotos: ['boulevard', 'pier', 'boulevard'],
    crops: [
      { zoom: 1.15, ox: -0.05, oy: 0.32 }, // her, head and torso whole
      { zoom: 1.25, ox: 0.05, oy: 0.33 }, // him, hat to hands
      { zoom: 1.05, ox: 0, oy: 0.37 }, // wide strip: her face, not her chin
    ],
  },
  editor: {
    coverOnly: false,
    size: { w: 1080, h: 1350 },
    layoutId: 'classic-nine',
    gradeId: 'vice-sunset',
    title: 'VICE PANELS',
    subtitle: 'vice panels originals',
    badge: 'VICE CITY · EST. 2026',
    heat: 4,
    halftone: true,
    panelPhotos: ['pier', 'boulevard', 'pier', 'boulevard', 'pier', 'boulevard', 'pier', 'boulevard', 'pier'],
    crops: [
      { zoom: 1.3, ox: -0.06, oy: 0.34 },
      { zoom: 1.22, ox: 0, oy: 0.32 },
      { zoom: 1.3, ox: 0.08, oy: 0.34 },
      { zoom: 1.22, ox: -0.05, oy: 0.32 },
      { zoom: 1.3, ox: 0, oy: 0.36 },
      { zoom: 1.22, ox: 0.05, oy: 0.32 },
      { zoom: 1.3, ox: 0.06, oy: 0.34 },
      { zoom: 1.22, ox: 0, oy: 0.34 },
      { zoom: 1.3, ox: -0.08, oy: 0.34 },
    ],
  },
};

export async function runShot(shot, query, helpers) {
  void query;
  const scene = SCENES[shot] ?? SCENES.editor;
  await helpers.applyScene(scene);
  await helpers.markReady();
}
