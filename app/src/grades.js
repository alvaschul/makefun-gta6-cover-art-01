// grades.js — the color grades of VICE PANELS.
//
// A grade is a complete print look for the cover: a seven-stop ramp that the
// poster pipeline maps photo luminance onto (deep shadow first, blown
// highlight last), the ink color outlines are drawn with, the paper color
// lettering sits on, and a handful of knobs (contrast, saturation, band
// count, grain, halftone strength) that change how the pipeline treats the
// photo before the ramp is applied.
//
// Ramps are written as [r, g, b] triples so the pipeline can index them
// without parsing strings; the CSS-friendly hex values live beside them for
// the parts of the cover (masthead gradient, chips, UI swatches) that want
// a string.

export const GRADES = [
  {
    id: 'vice-sunset',
    name: 'Vice Sunset',
    blurb: 'The flagship. Indigo shadows, magenta heat, gold highlights.',
    ramp: [
      [16, 11, 44],
      [52, 17, 92],
      [122, 20, 106],
      [214, 32, 110],
      [255, 84, 66],
      [255, 150, 52],
      [255, 226, 158],
    ],
    ink: [14, 8, 30],
    paper: [255, 240, 214],
    masthead: ['#ffe29a', '#ff9a3c', '#ff2e7e'],
    accent: '#ff2e7e',
    contrast: 1.1,
    saturation: 1.18,
    bands: 7,
    grain: 0.055,
    halftone: 0.5,
  },
  {
    id: 'neon-rain',
    name: 'Neon Rain',
    blurb: 'Wet asphalt at 2 a.m. — navy darks, violet mids, cyan signage.',
    ramp: [
      [5, 7, 18],
      [13, 24, 74],
      [32, 40, 148],
      [110, 38, 196],
      [224, 58, 158],
      [38, 196, 224],
      [230, 252, 255],
    ],
    ink: [4, 5, 14],
    paper: [232, 250, 255],
    masthead: ['#e8fcff', '#2fc4e6', '#e03a9e'],
    accent: '#2fc4e6',
    contrast: 1.16,
    saturation: 1.22,
    bands: 7,
    grain: 0.07,
    halftone: 0.35,
  },
  {
    id: 'midnight-cruise',
    name: 'Midnight Cruise',
    blurb: 'Moonlight on the causeway. Teal darks, steel mids, silver light.',
    ramp: [
      [4, 18, 26],
      [9, 43, 62],
      [16, 79, 104],
      [38, 122, 148],
      [104, 176, 184],
      [196, 226, 218],
      [253, 246, 214],
    ],
    ink: [3, 12, 18],
    paper: [240, 248, 238],
    masthead: ['#fdf6d6', '#9fd8cf', '#2b7f96'],
    accent: '#6fb6bd',
    contrast: 1.06,
    saturation: 1.05,
    bands: 7,
    grain: 0.045,
    halftone: 0.4,
  },
  {
    id: 'golden-hour-84',
    name: "Golden Hour '84",
    blurb: 'A faded newsstand find: amber, dust and thirty-year-old sun.',
    ramp: [
      [26, 13, 6],
      [66, 30, 12],
      [122, 62, 22],
      [182, 104, 36],
      [224, 152, 54],
      [246, 198, 96],
      [253, 238, 196],
    ],
    ink: [24, 12, 5],
    paper: [253, 240, 205],
    masthead: ['#fdefc2', '#f2b04a', '#c95f1e'],
    accent: '#eda93f',
    contrast: 0.98,
    saturation: 1.08,
    bands: 6,
    grain: 0.09,
    halftone: 0.65,
  },
];

const byId = new Map(GRADES.map((grade) => [grade.id, grade]));

/** The grade with this id, or the flagship grade when the id is unknown. */
export function gradeById(id) {
  return byId.get(id) ?? GRADES[0];
}

/** A ramp color as a CSS rgb() string, for canvas fills outside the pipeline. */
export function rampCss(grade, stop) {
  const [r, g, b] = grade.ramp[Math.max(0, Math.min(grade.ramp.length - 1, stop))];
  return `rgb(${r}, ${g}, ${b})`;
}

/** The grade's ink color as a CSS rgb() string. */
export function inkCss(grade) {
  const [r, g, b] = grade.ink;
  return `rgb(${r}, ${g}, ${b})`;
}

/** The grade's paper color as a CSS rgb() string. */
export function paperCss(grade) {
  const [r, g, b] = grade.paper;
  return `rgb(${r}, ${g}, ${b})`;
}
