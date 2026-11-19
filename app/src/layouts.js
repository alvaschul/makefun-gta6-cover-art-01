// layouts.js — the comic panel layouts a cover can be built from.
//
// Panels are fractions of the panel area (x, y, w, h in 0..1), so one
// layout works at every output size. Each panel carries a tag — the little
// rotated sticker ("COVER STORY", "EXCLUSIVE") that magazine covers wear.
// cover.js turns these fractions into pixels and adds the ink gutters.

export const LAYOUTS = [
  {
    id: 'solo',
    name: 'Solo Splash',
    panels: [{ x: 0, y: 0, w: 1, h: 1, tag: 'COVER STORY' }],
  },
  {
    id: 'duo',
    name: 'Split Duo',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58, tag: 'COVER STORY' },
      { x: 0, y: 0.58, w: 1, h: 0.42, tag: 'PLUS' },
    ],
  },
  {
    id: 'trio',
    name: 'Top Story Trio',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6, tag: 'COVER STORY' },
      { x: 0, y: 0.6, w: 0.5, h: 0.4, tag: 'EXCLUSIVE' },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.4, tag: 'FIRST LOOK' },
    ],
  },
  {
    id: 'quad',
    name: 'Four-Up Grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5, tag: 'THE CREW' },
      { x: 0.5, y: 0, w: 0.5, h: 0.5, tag: 'THE RIDES' },
      { x: 0, y: 0.5, w: 0.5, h: 0.5, tag: 'THE CITY' },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5, tag: 'THE SCORE' },
    ],
  },
  {
    id: 'vice-grid',
    name: 'Vice Grid',
    panels: [
      { x: 0, y: 0, w: 0.56, h: 1, tag: 'COVER STORY' },
      { x: 0.56, y: 0, w: 0.44, h: 0.52, tag: 'EXCLUSIVE' },
      { x: 0.56, y: 0.52, w: 0.44, h: 0.48, tag: 'PHOTO SPECIAL' },
    ],
  },
  {
    id: 'strips',
    name: 'Film Strips',
    panels: [
      { x: 0, y: 0, w: 0.34, h: 1, tag: 'ACT I' },
      { x: 0.34, y: 0, w: 0.33, h: 1, tag: 'ACT II' },
      { x: 0.67, y: 0, w: 0.33, h: 1, tag: 'ACT III' },
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

// Pixel rectangles for a layout inside a panel area, with the gutter
// carved out between panels. Returns one rect per panel, in order.
export function panelRects(layout, area, gutter) {
  return layout.panels.map((p) => {
    const x = area.x + p.x * area.w;
    const y = area.y + p.y * area.h;
    const w = p.w * area.w;
    const h = p.h * area.h;
    const left = p.x > 0 ? gutter / 2 : 0;
    const top = p.y > 0 ? gutter / 2 : 0;
    const right = p.x + p.w < 1 ? gutter / 2 : 0;
    const bottom = p.y + p.h < 1 ? gutter / 2 : 0;
    return { x: x + left, y: y + top, w: w - left - right, h: h - top - bottom, tag: p.tag };
  });
}
