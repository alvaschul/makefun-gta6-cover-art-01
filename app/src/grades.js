// VICE PANELS — colour grades.
// A grade drives the poster pipeline in poster.js:
//   1. the photo is boosted (sat / contrast / brightness), then every channel
//      is posterized to a handful of flat steps — screen-print bands, not a
//      photographic gradient;
//   2. each pixel is blended toward a five-stop palette ramp chosen by its
//      (quantized) luminance — `tint` is the blend strength, so a grade can
//      stay true to the photo's hues (Vice Sunset) or fully become its ramp
//      (Noir Mono);
//   3. Sobel edges are inked in, and the darkest band gets an extra push
//      toward the ramp's deep shadow colour for that two-tone poster shade.
// The legacy fields (filter / top / mid / bottom / wash) remain for the
// fallback path used when a canvas is tainted and pixels cannot be read.

export const GRADES = [
  {
    id: 'vice-sunset',
    name: 'Vice Sunset',
    filter: 'saturate(1.68) contrast(1.19) brightness(1.05)',
    wash: 'rgba(255, 84, 148, 0.13)',
    top: 'rgba(64, 224, 208, 0.26)',
    mid: 'rgba(255, 170, 60, 0.14)',
    bottom: 'rgba(255, 45, 120, 0.48)',
    skyline: '#2a0a3a',
    accent: '#ff2d78',
    // Poster pipeline.
    levels: 5,
    sat: 1.42,
    contrast: 1.16,
    brightness: 1.04,
    tint: 0.42,
    ramp: [
      [34, 8, 58],
      [116, 18, 92],
      [228, 45, 108],
      [255, 122, 60],
      [255, 216, 150],
    ],
    titleStops: ['#ffec7a', '#ffb347', '#ff5e78', '#b967ff'],
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    filter: 'saturate(1.6) contrast(1.22) brightness(0.94) hue-rotate(-8deg)',
    wash: 'rgba(30, 20, 120, 0.16)',
    top: 'rgba(0, 229, 255, 0.22)',
    mid: 'rgba(90, 0, 160, 0.12)',
    bottom: 'rgba(255, 0, 128, 0.30)',
    skyline: '#0b0620',
    accent: '#00e5ff',
    levels: 5,
    sat: 1.38,
    contrast: 1.2,
    brightness: 0.98,
    tint: 0.46,
    ramp: [
      [7, 8, 38],
      [42, 18, 102],
      [148, 30, 158],
      [255, 45, 148],
      [130, 240, 255],
    ],
    titleStops: ['#a5fbff', '#38e1ff', '#ff4fd8', '#8a5cff'],
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    filter: 'saturate(1.3) contrast(1.06) brightness(1.08) sepia(0.25)',
    wash: 'rgba(255, 160, 40, 0.13)',
    top: 'rgba(255, 230, 150, 0.16)',
    mid: 'rgba(255, 150, 60, 0.10)',
    bottom: 'rgba(190, 60, 20, 0.26)',
    skyline: '#33150a',
    accent: '#ff9a1f',
    levels: 5,
    sat: 1.28,
    contrast: 1.1,
    brightness: 1.06,
    tint: 0.4,
    ramp: [
      [44, 18, 10],
      [118, 50, 16],
      [204, 102, 26],
      [255, 166, 60],
      [255, 234, 172],
    ],
    titleStops: ['#fff3b0', '#ffc46b', '#ff8a3c', '#e85d3d'],
  },
  {
    id: 'teal-heat',
    name: 'Teal Heat',
    filter: 'saturate(1.35) contrast(1.16) brightness(1.0) hue-rotate(6deg)',
    wash: 'rgba(0, 140, 140, 0.12)',
    top: 'rgba(120, 255, 230, 0.18)',
    mid: 'rgba(0, 90, 110, 0.08)',
    bottom: 'rgba(255, 110, 40, 0.28)',
    skyline: '#062a30',
    accent: '#19d3b4',
    levels: 5,
    sat: 1.32,
    contrast: 1.14,
    brightness: 1.02,
    tint: 0.4,
    ramp: [
      [5, 32, 40],
      [9, 82, 92],
      [18, 158, 148],
      [255, 130, 60],
      [255, 228, 172],
    ],
    titleStops: ['#c8fff0', '#3fe0c5', '#ffb347', '#ff5e78'],
  },
  {
    id: 'noir-mono',
    name: 'Noir Mono',
    filter: 'grayscale(1) contrast(1.3) brightness(1.02)',
    wash: 'rgba(20, 20, 30, 0.10)',
    top: 'rgba(255, 255, 255, 0.10)',
    mid: 'rgba(0, 0, 0, 0)',
    bottom: 'rgba(0, 0, 0, 0.38)',
    skyline: '#101014',
    accent: '#e8e8f0',
    levels: 6,
    sat: 0,
    contrast: 1.24,
    brightness: 1.02,
    tint: 1,
    ramp: [
      [10, 10, 14],
      [52, 52, 62],
      [104, 104, 116],
      [170, 170, 182],
      [232, 232, 240],
    ],
    titleStops: ['#ffffff', '#e8e8f0', '#b9b9c9', '#8a8a9e'],
  },
  {
    id: 'bleached',
    name: 'Bleached',
    filter: 'saturate(0.55) contrast(0.94) brightness(1.18)',
    wash: 'rgba(255, 244, 214, 0.16)',
    top: 'rgba(255, 255, 255, 0.20)',
    mid: 'rgba(255, 200, 170, 0.08)',
    bottom: 'rgba(120, 160, 200, 0.20)',
    skyline: '#5a4a3a',
    accent: '#ffb37a',
    levels: 5,
    sat: 0.82,
    contrast: 0.96,
    brightness: 1.12,
    tint: 0.3,
    ramp: [
      [88, 78, 92],
      [148, 136, 140],
      [196, 182, 168],
      [228, 214, 196],
      [250, 244, 230],
    ],
    titleStops: ['#fff8e6', '#ffe3b3', '#ffb37a', '#e88ca0'],
  },
];

export function getGrade(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}
