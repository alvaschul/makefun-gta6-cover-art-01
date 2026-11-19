// grades.js — the colour grades of VICE PANELS.
//
// A grade is the whole mood of a cover: the sunset sky behind the masthead,
// the ink the panels are framed in, the paper the small print sits on, and
// the recipe the poster pipeline (poster.js) uses to flatten a photograph
// into inked art. Every grade carries both halves so the chrome of the
// cover and the art inside the panels always agree.

export const GRADES = [
  {
    id: 'vice',
    name: 'Vice Sunset',
    blurb: 'Hot magenta into tangerine — the flagship sunset.',
    sky: ['#1d0640', '#5b1160', '#c2185b', '#ff6b35', '#ffc53d'],
    sun: '#ffd23d',
    ink: '#17081f',
    paper: '#fff6e9',
    accent: '#22d3ee',
    accent2: '#ff2e88',
    levels: 5,
    contrast: 1.14,
    saturation: 1.3,
    warmth: 10,
    edge: 0.62,
    grain: 7,
  },
  {
    id: 'neon',
    name: 'Neon Rain',
    blurb: 'Wet asphalt blues with a cyan-and-violet glow.',
    sky: ['#020617', '#0e2a5c', '#155e75', '#0891b2', '#67e8f9'],
    sun: '#a5f3fc',
    ink: '#020617',
    paper: '#ecfeff',
    accent: '#f0abfc',
    accent2: '#22d3ee',
    levels: 6,
    contrast: 1.18,
    saturation: 1.15,
    warmth: -14,
    edge: 0.7,
    grain: 9,
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    blurb: 'Amber, honey and dust — a late-evening western glow.',
    sky: ['#2a1503', '#7c2d12', '#c2410c', '#f59e0b', '#fde68a'],
    sun: '#fde68a',
    ink: '#1c0f02',
    paper: '#fffbeb',
    accent: '#fbbf24',
    accent2: '#ef4444',
    levels: 5,
    contrast: 1.08,
    saturation: 1.05,
    warmth: 22,
    edge: 0.5,
    grain: 8,
  },
  {
    id: 'chrome',
    name: 'Midnight Chrome',
    blurb: 'Near-monochrome steel with one cold blue accent.',
    sky: ['#030712', '#111827', '#374151', '#9ca3af', '#e5e7eb'],
    sun: '#e5e7eb',
    ink: '#030712',
    paper: '#f9fafb',
    accent: '#93c5fd',
    accent2: '#e5e7eb',
    levels: 6,
    contrast: 1.28,
    saturation: 0.32,
    warmth: -6,
    edge: 0.78,
    grain: 6,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}
