// VICE PANELS — layout definitions.
// Every rect is relative (0..1) to the full cover, so a layout reflows to any
// export aspect: square, portrait, wide or story. `title` is the lettering
// block; `panels` are photo cells in reading order. A panel may carry a tilt
// in degrees (the Cover Story snapshots).

function gridPanels(x0, y0, w, h, cols, rows, gap) {
  const panels = [];
  const cw = (w - gap * (cols - 1)) / cols;
  const ch = (h - gap * (rows - 1)) / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      panels.push({ x: x0 + c * (cw + gap), y: y0 + r * (ch + gap), w: cw, h: ch });
    }
  }
  return panels;
}

export const LAYOUTS = [
  {
    id: 'classic-nine',
    name: 'Classic Nine',
    blurb: '3 x 3 grid under the title block',
    title: { x: 0, y: 0, w: 1, h: 0.185 },
    panels: gridPanels(0.012, 0.197, 0.976, 0.791, 3, 3, 0.008),
  },
  {
    id: 'hero-three',
    name: 'Hero & Three',
    blurb: 'One big hero, three stacked beats',
    title: { x: 0, y: 0, w: 1, h: 0.17 },
    panels: [
      { x: 0.012, y: 0.182, w: 0.6, h: 0.806 },
      { x: 0.62, y: 0.182, w: 0.368, h: 0.262 },
      { x: 0.62, y: 0.452, w: 0.368, h: 0.262 },
      { x: 0.62, y: 0.722, w: 0.368, h: 0.266 },
    ],
  },
  {
    id: 'cover-story',
    name: 'Cover Story',
    blurb: 'Full-bleed hero with tilted snapshots',
    title: { x: 0, y: 0, w: 1, h: 0.21 },
    panels: [
      { x: 0, y: 0, w: 1, h: 1 },
      { x: 0.565, y: 0.56, w: 0.375, h: 0.335, tilt: -4 },
      { x: 0.075, y: 0.615, w: 0.335, h: 0.30, tilt: 3.5 },
    ],
  },
  {
    id: 'split-boulevard',
    name: 'Split Boulevard',
    blurb: 'Two tall panels over a wide strip',
    title: { x: 0, y: 0, w: 1, h: 0.175 },
    panels: [
      { x: 0.012, y: 0.187, w: 0.482, h: 0.475 },
      { x: 0.506, y: 0.187, w: 0.482, h: 0.475 },
      { x: 0.012, y: 0.674, w: 0.976, h: 0.314 },
    ],
  },
  {
    id: 'six-pack',
    name: 'Six Pack',
    blurb: 'Two columns, three rows of action',
    title: { x: 0, y: 0, w: 1, h: 0.165 },
    panels: gridPanels(0.012, 0.177, 0.976, 0.811, 2, 3, 0.009),
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    blurb: 'A single poster panel, title on top',
    title: { x: 0, y: 0, w: 1, h: 0.22 },
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
];

export function getLayout(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export function panelCount(id) {
  return getLayout(id).panels.length;
}
