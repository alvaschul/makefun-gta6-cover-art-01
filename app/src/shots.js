// Screenshot scenes: fixed states the app can be put into from the URL,
// so the entry's screenshots are reproducible by anyone, any time.
//
// Open the app with ?shot=1 .. ?shot=4 and it loads that scene's sample
// photo, grade, layout, size and words, hides the controls, and renders at
// full export size. ?shot=2 is the odd one out: it keeps the editor visible
// to show the app at work instead of a finished cover.

export const SHOT_SCENES = [
  {
    n: 1,
    file: '1-cover.jpg',
    caption: 'Exported cover: boulevard photo, Vice Sunset grade, Hero Stack panels, portrait size.',
    editor: false,
    sample: 'boulevard',
    grade: 'vice-sunset',
    layout: 'hero-stack',
    size: 'portrait',
    title: 'VICE PANELS',
    accent: 'cover studio',
    lines: ['ONE PHOTO IN, COVER OUT', 'PRINTED AT 1080 × 1350'],
    issue: 'ISSUE 01 · BOULEVARD RUN',
  },
  {
    n: 2,
    file: '2-editor.jpg',
    caption: 'The editor at work: pier photo loaded, panel layout and grade controls open beside the live preview.',
    editor: true,
    sample: 'pier',
    grade: 'neon-night',
    layout: 'quad-grid',
    size: 'square',
    title: 'VICE PANELS',
    accent: 'cover studio',
    lines: ['FOUR PANELS, ONE PHOTO', 'NEON NIGHT GRADE'],
    issue: 'ISSUE 02 · PIER SHIFT',
  },
  {
    n: 3,
    file: '3-cover.jpg',
    caption: 'Exported cover: pier photo, Golden Strip grade, Triptych panels, square size.',
    editor: false,
    sample: 'pier',
    grade: 'golden-strip',
    layout: 'triptych',
    size: 'square',
    title: 'VICE PANELS',
    accent: 'golden hour',
    lines: ['THREE ACTS, ONE FRAME', 'SQUARE FOR THE FEED'],
    issue: 'ISSUE 03 · GOLDEN STRIP',
  },
  {
    n: 4,
    file: '4-cover.jpg',
    caption: 'Exported cover: boulevard photo, Neon Night grade, Tall Story panels, story size.',
    editor: false,
    sample: 'boulevard',
    grade: 'neon-night',
    layout: 'tall-story',
    size: 'story',
    title: 'VICE PANELS',
    accent: 'after dark',
    lines: ['TALL STORY, FULL BLEED', 'MADE FOR THE STORY SLOT'],
    issue: 'ISSUE 04 · AFTER DARK',
  },
];

// The scene a URL asks for, or null when the app should open normally.
export function sceneFromUrl(url) {
  const raw = new URL(url).searchParams.get('shot');
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  return SHOT_SCENES.find((s) => s.n === n) ?? null;
}

export function sceneState(scene) {
  return {
    gradeId: scene.grade,
    layoutId: scene.layout,
    sizeId: scene.size,
    title: scene.title,
    accent: scene.accent,
    lines: [...scene.lines],
    issue: scene.issue,
  };
}
