// shots.js — the deterministic scenes behind the entry's screenshots.
//
// Each scene is a complete cover state (photo, grade, layout, size and
// every line of lettering) addressed by ?shot=N. In shot mode the studio
// applies the scene, hides its chrome for cover scenes, and flags the
// document ready once the render is on screen, so a headless browser can
// photograph the exact same cover every time. The editor scene keeps the
// full studio visible: it is the "how it is made" shot.
//
// The same table drives shots.json at the repository root: file names and
// captions here are the ones the manifest publishes.

export const SHOTS = [
  {
    n: 1,
    file: '1-cover.jpg',
    mode: 'cover',
    caption: 'The cover: boulevard photo, Vice Sunset grade, Hero Strip layout, story size.',
    state: {
      photo: 'boulevard',
      gradeId: 'vice-sunset',
      layoutId: 'hero-strip',
      sizeId: 'story',
      title: 'VICE PANELS',
      script: 'Cover Studio',
      caption: 'THE CITY IS YOURS — MIND THE PARKING',
      lines: ['25 PAGES OF NEON', 'THE HEAT IS ON: A FIELD GUIDE', 'PLUS: BOATS, BADGES & BETRAYAL'],
      issue: 'Nº 06',
      price: '$6.66',
    },
  },
  {
    n: 2,
    file: '2-editor.jpg',
    mode: 'editor',
    caption: 'The studio: photo, grade, layout, size and lettering controls beside the live cover.',
    state: {
      photo: 'pier',
      gradeId: 'vice-sunset',
      layoutId: 'quad-grid',
      sizeId: 'portrait',
      title: 'VICE PANELS',
      script: 'Cover Studio',
      caption: 'EVERY SUNSET HAS A BODY COUNT',
      lines: ['THE PIER AT MIDNIGHT', 'CONFESSIONS OF A GETAWAY DRIVER', 'WIN A JET SKI (PROBABLY)'],
      issue: 'Nº 06',
      price: '$6.66',
    },
  },
  {
    n: 3,
    file: '3-cover.jpg',
    mode: 'cover',
    caption: 'Pier photo under Neon Rain, Triptych layout, portrait size.',
    state: {
      photo: 'pier',
      gradeId: 'neon-rain',
      layoutId: 'triptych',
      sizeId: 'portrait',
      title: 'NEON HARBOR',
      script: 'after dark',
      caption: 'THREE LIVES, ONE STORM',
      lines: ['THE DOCKS NEVER SLEEP', 'A LOVE LETTER IN ULTRAVIOLET', 'PLUS: THE TIDE CHART OF CRIME'],
      issue: 'Nº 13',
      price: '$7.77',
    },
  },
  {
    n: 4,
    file: '4-cover.jpg',
    mode: 'cover',
    caption: "Boulevard photo under Golden Hour '84, Front Page layout, square size.",
    state: {
      photo: 'boulevard',
      gradeId: 'golden-hour-84',
      layoutId: 'front-page',
      sizeId: 'square',
      title: 'SUNSET GAZETTE',
      script: 'est. 1984',
      caption: 'ALL THE NEWS THAT FITS THE SUNSET',
      lines: ['EXTRA: THE BOULEVARD BURNS GOLD', 'MARKETS UP, MERCURY DOWN', 'SPORT: PALMS 4 — HURRICANES 2'],
      issue: 'Nº 84',
      price: '$0.84',
    },
  },
];

const shotByNumber = new Map(SHOTS.map((shot) => [shot.n, shot]));

/** The scene for ?shot=N, or null when the URL names no scene. */
export function sceneFromQuery(search) {
  const raw = new URLSearchParams(search).get('shot');
  if (raw === null) return null;
  return shotByNumber.get(Number(raw)) ?? null;
}
