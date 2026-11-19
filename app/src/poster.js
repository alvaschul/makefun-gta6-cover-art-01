// The poster pipeline: photo in, flat inked cover art out.
//
// Steps, all on a small work canvas so it stays fast:
//   1. draw the photo's crop, slightly softened, so noise dies early;
//   2. cut its luminance into the grade's bands and paint flat ink colours,
//      keeping a slice of the photo's own colour (the grade's `keep`);
//   3. find edges with a Sobel pass over luminance and burn them in as ink
//      outlines, thicker where the edge is strong;
//   4. scatter deterministic print grain so flat areas feel printed.

import { rampOf } from './grades.js';

// Source rectangle that covers a w x h frame from an image, centred on
// (cx, cy) in 0..1 and punched in by `zoom` (>= 1).
export function coverCrop(imgW, imgH, w, h, cx = 0.5, cy = 0.5, zoom = 1) {
  const scale = Math.max(w / imgW, h / imgH) * zoom;
  const sw = w / scale;
  const sh = h / scale;
  const sx = Math.min(Math.max(cx * imgW - sw / 2, 0), imgW - sw);
  const sy = Math.min(Math.max(cy * imgH - sh / 2, 0), imgH - sh);
  return { sx, sy, sw, sh };
}

// Tiny deterministic hash noise for grain: same pixel, same value, always.
function grainAt(x, y, seed) {
  let n = (x * 374761393 + y * 668265263 + seed * 974634211) | 0;
  n = (n ^ (n >> 13)) | 0;
  n = Math.imul(n, 1274126177);
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

// Render one panel of art: returns a canvas of exactly w x h pixels.
export function makePanelArt(image, panel, w, h, grade, seed = 7) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(w));
  canvas.height = Math.max(2, Math.round(h));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const crop = coverCrop(image.naturalWidth, image.naturalHeight, canvas.width, canvas.height, panel.cx, panel.cy, panel.zoom);
  ctx.filter = 'blur(0.6px)';
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = img.data;
  const ramp = rampOf(grade);
  const bands = ramp.length;
  const keep = grade.keep;
  const lum = new Float32Array(canvas.width * canvas.height);

  for (let i = 0, p = 0; i < lum.length; i++, p += 4) {
    const r = px[p];
    const g = px[p + 1];
    const b = px[p + 2];
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    lum[i] = l;
    // A gentle S-curve before banding gives the shadows more ink to hold.
    const curved = l * l * (3 - 2 * l) * 0.35 + l * 0.65;
    const band = Math.min(bands - 1, Math.floor(curved * bands));
    const ink = ramp[band];
    px[p] = ink[0] + (r - ink[0]) * keep;
    px[p + 1] = ink[1] + (g - ink[1]) * keep;
    px[p + 2] = ink[2] + (b - ink[2]) * keep;
  }

  // Sobel edges over the stored luminance, burned back in as ink.
  const inkRgb = ramp[0];
  const W = canvas.width;
  const H = canvas.height;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx = -lum[i - W - 1] - 2 * lum[i - 1] - lum[i + W - 1] + lum[i - W + 1] + 2 * lum[i + 1] + lum[i + W + 1];
      const gy = -lum[i - W - 1] - 2 * lum[i - W] - lum[i - W + 1] + lum[i + W - 1] + 2 * lum[i + W] + lum[i + W + 1];
      const mag = Math.abs(gx) + Math.abs(gy);
      if (mag > 0.55) {
        const p = i * 4;
        const mix = Math.min(1, (mag - 0.55) * 1.6);
        px[p] = px[p] + (inkRgb[0] - px[p]) * mix;
        px[p + 1] = px[p + 1] + (inkRgb[1] - px[p + 1]) * mix;
        px[p + 2] = px[p + 2] + (inkRgb[2] - px[p + 2]) * mix;
      }
    }
  }

  // Print grain: a whisper of light and dark speckle, seeded per panel.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const g = grainAt(x, y, seed);
      if (g > 0.82) {
        const p = (y * W + x) * 4;
        const lift = (g - 0.82) * 90;
        const dir = (x + y) % 2 === 0 ? 1 : -1;
        px[p] = Math.max(0, Math.min(255, px[p] + lift * dir));
        px[p + 1] = Math.max(0, Math.min(255, px[p + 1] + lift * dir));
        px[p + 2] = Math.max(0, Math.min(255, px[p + 2] + lift * dir));
      }
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}
