// Panel layouts: how the cover's photo area is cut into comic panels.
//
// Rects are fractions of the photo area (0..1), so a layout works at every
// output size. `cx`/`cy` pick the crop centre of the photo inside that panel
// and `zoom` how far in it punches, so a single photo reads as a different
// moment in every panel. `tag` is the little caption chip in the corner.

export const LAYOUTS = [
  {
    id: 'hero-stack',
    name: 'Hero Stack',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58, cx: 0.5, cy: 0.38, zoom: 1.05, tag: 'THE CITY' },
      { x: 0, y: 0.58, w: 0.5, h: 0.42, cx: 0.3, cy: 0.6, zoom: 1.5, tag: 'THE CREW' },
      { x: 0.5, y: 0.58, w: 0.5, h: 0.42, cx: 0.72, cy: 0.55, zoom: 1.5, tag: 'THE SCORE' },
    ],
  },
  {
    id: 'quad-grid',
    name: 'Quad Grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5, cx: 0.32, cy: 0.35, zoom: 1.4, tag: 'DAWN' },
      { x: 0.5, y: 0, w: 0.5, h: 0.5, cx: 0.68, cy: 0.35, zoom: 1.4, tag: 'NOON' },
      { x: 0, y: 0.5, w: 0.5, h: 0.5, cx: 0.32, cy: 0.68, zoom: 1.4, tag: 'DUSK' },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5, cx: 0.68, cy: 0.68, zoom: 1.4, tag: 'VICE HOUR' },
    ],
  },
  {
    id: 'tall-story',
    name: 'Tall Story',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1, cx: 0.42, cy: 0.5, zoom: 1.1, tag: 'THE LEAD' },
      { x: 0.62, y: 0, w: 0.38, h: 0.34, cx: 0.6, cy: 0.3, zoom: 1.6, tag: 'DETAIL' },
      { x: 0.62, y: 0.34, w: 0.38, h: 0.33, cx: 0.4, cy: 0.55, zoom: 1.6, tag: 'DETAIL' },
      { x: 0.62, y: 0.67, w: 0.38, h: 0.33, cx: 0.55, cy: 0.75, zoom: 1.6, tag: 'DETAIL' },
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    panels: [
      { x: 0, y: 0, w: 0.34, h: 1, cx: 0.2, cy: 0.5, zoom: 1.25, tag: 'ACT I' },
      { x: 0.34, y: 0, w: 0.32, h: 1, cx: 0.5, cy: 0.45, zoom: 1.25, tag: 'ACT II' },
      { x: 0.66, y: 0, w: 0.34, h: 1, cx: 0.8, cy: 0.5, zoom: 1.25, tag: 'ACT III' },
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}
