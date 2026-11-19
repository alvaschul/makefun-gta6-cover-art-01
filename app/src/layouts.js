// layouts.js — the cover's geometry: output sizes and panel layouts.
//
// A panel is a rectangle in cover fractions (0..1 on both axes) plus the
// storytelling details the composer needs: a tag for its corner chip, the
// focal point of the photograph to favor inside it, and a zoom so the same
// photograph reads as a different shot in every panel — a wide establishing
// frame up top, tight crops below, like a real comic cover's art.

/** The social-post sizes a cover can be composed at. */
export const SIZES = [
  { id: 'portrait', name: 'Portrait 4:5', width: 1080, height: 1350, use: 'Feed posts' },
  { id: 'square', name: 'Square 1:1', width: 1080, height: 1080, use: 'Grid posts' },
  { id: 'story', name: 'Story 9:16', width: 1080, height: 1920, use: 'Stories & reels covers' },
];

const sizeMap = new Map(SIZES.map((size) => [size.id, size]));

/** The size with this id, or the portrait size when the id is unknown. */
export function sizeById(id) {
  return sizeMap.get(id) ?? SIZES[0];
}

export const LAYOUTS = [
  {
    id: 'hero-strip',
    name: 'Hero Strip',
    blurb: 'One wide scene up top, two tight shots underneath.',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6, tag: 'VICE CITY', focalX: 0.5, focalY: 0.32, zoom: 1 },
      { x: 0, y: 0.6, w: 0.52, h: 0.4, tag: 'THE STRIP', focalX: 0.22, focalY: 0.72, zoom: 1.45 },
      { x: 0.52, y: 0.6, w: 0.48, h: 0.4, tag: 'OCEAN DR', focalX: 0.8, focalY: 0.62, zoom: 1.3 },
    ],
  },
  {
    id: 'quad-grid',
    name: 'Quad Grid',
    blurb: 'Four frames, off-balance — the classic ensemble cover.',
    panels: [
      { x: 0, y: 0, w: 0.56, h: 0.46, tag: 'THE DRIVER', focalX: 0.3, focalY: 0.3, zoom: 1.25 },
      { x: 0.56, y: 0, w: 0.44, h: 0.46, tag: 'THE FIXER', focalX: 0.72, focalY: 0.28, zoom: 1.5 },
      { x: 0, y: 0.46, w: 0.44, h: 0.54, tag: 'THE SIREN', focalX: 0.28, focalY: 0.68, zoom: 1.4 },
      { x: 0.44, y: 0.46, w: 0.56, h: 0.54, tag: 'THE GETAWAY', focalX: 0.68, focalY: 0.7, zoom: 1.15 },
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    blurb: 'Three vertical slices — three lives, one city.',
    panels: [
      { x: 0, y: 0, w: 0.34, h: 1, tag: 'ACT I', focalX: 0.18, focalY: 0.45, zoom: 1.2 },
      { x: 0.34, y: 0, w: 0.32, h: 1, tag: 'ACT II', focalX: 0.5, focalY: 0.4, zoom: 1.35 },
      { x: 0.66, y: 0, w: 0.34, h: 1, tag: 'ACT III', focalX: 0.84, focalY: 0.5, zoom: 1.2 },
    ],
  },
  {
    id: 'front-page',
    name: 'Front Page',
    blurb: 'A newspaper stack: headline frame, two columns, a footer scene.',
    // Cover lines start lower here: the second row's panels (and their
    // tags) own the band the other layouts leave free at 0.36.
    linesY: 0.435,
    panels: [
      { x: 0, y: 0, w: 1, h: 0.34, tag: 'EXTRA! EXTRA!', focalX: 0.5, focalY: 0.25, zoom: 1.05 },
      { x: 0, y: 0.34, w: 0.62, h: 0.36, tag: 'THE SCORE', focalX: 0.32, focalY: 0.55, zoom: 1.35 },
      { x: 0.62, y: 0.34, w: 0.38, h: 0.36, tag: 'THE HEAT', focalX: 0.78, focalY: 0.5, zoom: 1.55 },
      { x: 0, y: 0.7, w: 1, h: 0.3, tag: 'SUNSET BLVD', focalX: 0.5, focalY: 0.8, zoom: 1.1 },
    ],
  },
];

const layoutByIdMap = new Map(LAYOUTS.map((layout) => [layout.id, layout]));

/** The layout with this id, or the hero layout when the id is unknown. */
export function layoutById(id) {
  return layoutByIdMap.get(id) ?? LAYOUTS[0];
}
