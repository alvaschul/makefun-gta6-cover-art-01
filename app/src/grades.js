// Colour grades for VICE PANELS.
//
// A grade is a ramp of flat inks, darkest first. The poster pipeline cuts a
// photo's luminance into bands and paints each band with the ramp colour
// under it, keeping a slice of the photo's own hue so faces and skies still
// read as themselves. `keep` is that slice (0 = pure flat ink, 1 = photo),
// `ink` is the outline colour and `paper` the lightest tint a grade allows.

export const GRADES = [
  {
    id: 'vice-sunset',
    name: 'Vice Sunset',
    blurb: 'Magenta dusk, tangerine light, teal in the shadows.',
    ramp: ['#160a2e', '#3b1160', '#8c1d7a', '#e63e7b', '#ff7a3d', '#ffc44d', '#fff3c4'],
    keep: 0.34,
    ink: '#12081f',
    paper: '#fff6d8',
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    blurb: 'Wet asphalt blues lit by cyan and hot pink signage.',
    ramp: ['#040914', '#0a1e46', '#123a7d', '#0f7fa8', '#19c2d8', '#e84fd0', '#ffe9fb'],
    keep: 0.3,
    ink: '#03060f',
    paper: '#eafcff',
  },
  {
    id: 'golden-strip',
    name: 'Golden Strip',
    blurb: 'Sepia heat: burnt umber up through amber to cream.',
    ramp: ['#170b04', '#40200a', '#7a4416', '#b06f24', '#dd9a3a', '#f7c65f', '#fff0cd'],
    keep: 0.38,
    ink: '#140a03',
    paper: '#fff3d0',
  },
  {
    id: 'ink-noir',
    name: 'Ink Noir',
    blurb: 'Straight comic ink: seven greys, no colour at all.',
    ramp: ['#0a0a0a', '#2b2b2b', '#525252', '#7d7d7d', '#a8a8a8', '#d4d4d4', '#f7f7f7'],
    keep: 0,
    ink: '#000000',
    paper: '#ffffff',
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

// '#rrggbb' -> [r, g, b] in 0..255.
export function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Pre-parse a grade's ramp once so the per-pixel loop stays cheap.
export function rampOf(grade) {
  return grade.ramp.map(hexRgb);
}
