// poster.js — turns a photograph into flat inked poster art.
//
// The pipeline, all on CPU pixel buffers so a cover renders identically
// every time it is asked for:
//
//   1. The photo is drawn cover-fit onto a work canvas at the cover's size.
//   2. Each pixel is pushed through the grade's contrast and saturation.
//   3. Luminance is posterized into a small number of flat bands, with a
//      whisper of Bayer ordered dithering so skies break into print texture
//      instead of hard steps.
//   4. Every band is painted with the grade's ramp color — no gradients
//      survive; the art is flat, like screen-print ink.
//   5. Ink lines are drawn where the picture has real edges (a Sobel pass
//      over the luminance) and where one band slams into the next.
//   6. The darkest bands get a halftone dot screen, and the whole sheet
//      gets seeded grain and a soft vignette, so it feels printed, not
//      rendered.
//
// The grain and dither come from a seeded generator: same photo, same
// grade, same seed, same art. Screenshots depend on that.

/** A tiny deterministic PRNG (mulberry32) for grain that never changes. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 4x4 Bayer matrix, normalized to 0..1: the ordered-dither pattern.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

/**
 * Draw `image` into a fresh canvas of width x height with cover-fit
 * cropping around the focal point (fractions, 0..1) and return the canvas.
 */
export function coverFitCanvas(image, width, height, focalX = 0.5, focalY = 0.5) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sw = width / scale;
  const sh = height / scale;
  const sx = Math.max(0, Math.min(image.naturalWidth - sw, focalX * image.naturalWidth - sw / 2));
  const sy = Math.max(0, Math.min(image.naturalHeight - sh, focalY * image.naturalHeight - sh / 2));
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  return canvas;
}

/**
 * The whole pipeline: photograph in, poster art canvas out.
 * `image` is an HTMLImageElement; the art is produced at width x height.
 */
export function makeArtwork(image, grade, width, height, seed = 1986) {
  const work = coverFitCanvas(image, width, height);
  const ctx = work.getContext('2d', { willReadFrequently: true });
  const frame = ctx.getImageData(0, 0, width, height);
  const px = frame.data;
  const count = width * height;

  // Pass 1: grade contrast + saturation, and bank the luminance.
  const lum = new Float32Array(count);
  const { contrast, saturation } = grade;
  for (let i = 0, p = 0; i < count; i++, p += 4) {
    let r = px[p];
    let g = px[p + 1];
    let b = px[p + 2];
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = l + (r - l) * saturation;
    g = l + (g - l) * saturation;
    b = l + (b - l) * saturation;
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;
    px[p] = clamp255(r);
    px[p + 1] = clamp255(g);
    px[p + 2] = clamp255(b);
    lum[i] = (0.2126 * px[p] + 0.7152 * px[p + 1] + 0.0722 * px[p + 2]) / 255;
  }

  // Pass 2: Sobel edge strength over the luminance field.
  const edge = new Float32Array(count);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const gx =
        -lum[i - width - 1] - 2 * lum[i - 1] - lum[i + width - 1] +
        lum[i - width + 1] + 2 * lum[i + 1] + lum[i + width + 1];
      const gy =
        -lum[i - width - 1] - 2 * lum[i - width] - lum[i - width + 1] +
        lum[i + width - 1] + 2 * lum[i + width] + lum[i + width + 1];
      edge[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // Pass 3: posterize into bands, paint the ramp, lay the ink.
  const bands = grade.bands;
  const ramp = grade.ramp;
  const bandOf = new Uint8Array(count);
  const ditherSpan = 0.55 / bands; // how far the Bayer pattern may push a pixel across a band edge
  for (let y = 0; y < height; y++) {
    const bayerRow = BAYER[y & 3];
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const pushed = lum[i] + (bayerRow[x & 3] - 0.5) * ditherSpan;
      let band = Math.floor(pushed * bands);
      if (band < 0) band = 0;
      if (band > bands - 1) band = bands - 1;
      bandOf[i] = band;
    }
  }

  const [inkR, inkG, inkB] = grade.ink;
  const rand = seededRandom(seed);
  const grainSpan = grade.grain * 255;
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0, p = 0; y < height; y++) {
    for (let x = 0; x < width; x++, p += 4) {
      const i = y * width + x;
      const band = bandOf[i];
      // Ramp stops span the band range: stretch the grade's stops over its bands.
      const stop = Math.round((band / (bands - 1)) * (ramp.length - 1));
      let [r, g, b] = ramp[stop];

      // Ink: a real edge, or a cliff between this band and a neighbour's.
      let inkMix = 0;
      if (edge[i] > 0.55) inkMix = Math.min(1, (edge[i] - 0.55) * 2.4);
      if (inkMix < 0.85) {
        const right = x + 1 < width ? bandOf[i + 1] : band;
        const below = y + 1 < height ? bandOf[i + width] : band;
        if (Math.abs(right - band) >= 2 || Math.abs(below - band) >= 2) inkMix = 0.85;
      }
      if (inkMix > 0) {
        r = r + (inkR - r) * inkMix;
        g = g + (inkG - g) * inkMix;
        b = b + (inkB - b) * inkMix;
      }

      // Halftone: a dot screen printed over the two darkest bands.
      if (grade.halftone > 0 && band <= 1) {
        const cell = 7;
        const dx = (x % cell) - cell / 2;
        const dy = (y % cell) - cell / 2;
        const radius = (1 - band / 2) * grade.halftone * (cell / 2);
        if (dx * dx + dy * dy < radius * radius) {
          r *= 0.72;
          g *= 0.72;
          b *= 0.72;
        }
      }

      // Grain and vignette: the print shop's fingerprints.
      const noise = (rand() - 0.5) * grainSpan;
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / maxDist;
      const shade = 1 - 0.16 * dist * dist;
      px[p] = clamp255((r + noise) * shade);
      px[p + 1] = clamp255((g + noise) * shade);
      px[p + 2] = clamp255((b + noise) * shade);
      px[p + 3] = 255;
    }
  }

  ctx.putImageData(frame, 0, 0);
  return work;
}
