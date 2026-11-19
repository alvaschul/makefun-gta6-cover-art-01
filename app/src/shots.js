// shots.js — the deterministic scenes behind ?shot=1..4.
//
// The screenshots in screenshots/ are renders of these scenes, so anyone
// can reproduce them exactly: each scene names its sample photo, grade,
// layout, output size and cover words, and main.js applies them verbatim.
// Shot 2 is the editor itself, controls and all, with a photo loaded;
// the others are cover-only, the app chrome hidden.

export const SHOT_SCENES = {
  1: {
    mode: 'cover',
    sizeId: 'landscape',
    gradeId: 'vice',
    layoutId: 'vice-grid',
    photoIds: ['boulevard', 'pier', 'boulevard'],
    title: 'VICE PANELS',
    accent: 'cover studio',
    issue: 'VOL. 01 · THE SUNSET ISSUE',
    lines: ['10 best getaway rides, ranked', 'Neon nights: the city after dark'],
  },
  2: {
    mode: 'editor',
    sizeId: 'portrait',
    gradeId: 'neon',
    layoutId: 'trio',
    photoIds: ['pier', 'boulevard', 'pier'],
    title: 'VICE PANELS',
    accent: 'cover studio',
    issue: 'VOL. 01 · THE SUNSET ISSUE',
    lines: ['10 best getaway rides, ranked', 'Neon nights: the city after dark', 'Meet the crew everyone fears'],
  },
  3: {
    mode: 'cover',
    sizeId: 'portrait',
    gradeId: 'golden',
    layoutId: 'trio',
    photoIds: ['pier', 'boulevard', 'pier'],
    title: 'VICE PANELS',
    accent: 'golden hour',
    issue: 'VOL. 02 · THE GOLDEN ISSUE',
    lines: ['Harbour lights and high tides', 'The pier at closing time'],
  },
  4: {
    mode: 'cover',
    sizeId: 'story',
    gradeId: 'neon',
    layoutId: 'strips',
    photoIds: ['boulevard', 'pier', 'boulevard'],
    title: 'VICE PANELS',
    accent: 'after dark',
    issue: 'VOL. 03 · THE MIDNIGHT ISSUE',
    lines: ['Three acts, one long night'],
  },
};

export function shotFromLocation() {
  const raw = new URLSearchParams(window.location.search).get('shot');
  if (!raw) return null;
  const scene = SHOT_SCENES[raw];
  return scene ? { id: raw, ...scene } : null;
}
