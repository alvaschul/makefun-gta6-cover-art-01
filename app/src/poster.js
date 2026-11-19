// VICE PANELS — the poster pipeline.
// Turns a photograph into flat, inked poster art, GTA-cover style:
//   boost -> posterize -> palette-ramp blend -> hard shadow push -> ink edges.
// The whole photo is processed once per (photo, grade) at a capped resolution
// and cached; crops are applied later when the cached bitmap is drawn into a
// panel, so dragging and zooming never reprocess pixels. If the canvas is
// tainted (file:// pages) getImageData throws — we cache null and cover.js
// falls back to its CSS-filter path, so the app never breaks.

const MAX_SIDE = 900;
const INK = [16, 5, 26];

const artCache = new WeakMap(); // img -> Map<gradeId, canvas|null>
const lutCache = new Map(); // gradeId -> Uint8ClampedArray(256 * 3)

function rampLut(grade) {
  let lut = lutCache.get(grade.id);
  if (lut) return lut;
  lut = new Uint8ClampedArray(256 * 3);
  const stops = grade.ramp;
  for (let i = 0; i < 256; i += 1) {
    const t = (i / 255) * (stops.length - 1);
    const a = Math.min(stops.length - 2, Math.floor(t));
    const f = t - a;
    const c0 = stops[a];
    const c1 = stops[a + 1];
    lut[i * 3] = c0[0] + (c1[0] - c0[0]) * f;
    lut[i * 3 + 1] = c0[1] + (c1[1] - c0[1]) * f;
    lut[i * 3 + 2] = c0[2] + (c1[2] - c0[2]) * f;
  }
  lutCache.set(grade.id, lut);
  return lut;
}

function processPhoto(img, grade) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return null;
  const scale = Math.min(1, MAX_SIDE / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * scale));
  const h = Math.max(1, Math.round(ih * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  let imageData;
  try {
    imageData = ctx.getImageData(0, 0, w, h);
  } catch {
    return null; // tainted canvas — caller falls back to the filter path
  }
  const d = imageData.data;
  const n = w * h;
  const { sat, contrast, tint, levels } = grade;
  const brightness = grade.brightness ?? 1;
  const lut = rampLut(grade);
  const shadow = grade.ramp[0];
  const steps = levels + 1;

  // Pass 1 — boost saturation / contrast / brightness, record luminance.
  const lum = new Float32Array(n);
  for (let i = 0, p = 0; i < d.length; i += 4, p += 1) {
    let r = d[i] * brightness;
    let g = d[i + 1] * brightness;
    let b = d[i + 2] * brightness;
    const avg = (r + g + b) / 3;
    r = avg + (r - avg) * sat;
    g = avg + (g - avg) * sat;
    b = avg + (b - avg) * sat;
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    lum[p] = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
  }

  // Pass 2 — Sobel edge strength on the boosted luminance, normalized 0..255.
  const edge = new Uint8ClampedArray(n);
  for (let y = 1; y < h - 1; y += 1) {
    const row = y * w;
    for (let x = 1; x < w - 1; x += 1) {
      const p = row + x;
      const gx = -lum[p - w - 1] - 2 * lum[p - 1] - lum[p + w - 1]
        + lum[p - w + 1] + 2 * lum[p + 1] + lum[p + w + 1];
      const gy = -lum[p - w - 1] - 2 * lum[p - w] - lum[p - w + 1]
        + lum[p + w - 1] + 2 * lum[p + w] + lum[p + w + 1];
      const mag = Math.sqrt(gx * gx + gy * gy) / 4;
      edge[p] = Math.min(1, mag) * 255;
    }
  }

  // Pass 3 — posterize channels, blend toward the ramp by luminance band,
  // push the darkest bands into the deep shadow colour, ink the edges.
  const keep = 1 - tint;
  for (let i = 0, p = 0; i < d.length; i += 4, p += 1) {
    const band = Math.min(levels - 1, Math.floor(lum[p] * levels));
    const li = Math.round((band / (levels - 1)) * 255) * 3;
    let r = Math.round((d[i] / 255) * (steps - 1)) / (steps - 1) * 255;
    let g = Math.round((d[i + 1] / 255) * (steps - 1)) / (steps - 1) * 255;
    let b = Math.round((d[i + 2] / 255) * (steps - 1)) / (steps - 1) * 255;
    r = r * keep + lut[li] * tint;
    g = g * keep + lut[li + 1] * tint;
    b = b * keep + lut[li + 2] * tint;
    if (band === 0) {
      r = r * 0.76 + shadow[0] * 0.24;
      g = g * 0.76 + shadow[1] * 0.24;
      b = b * 0.76 + shadow[2] * 0.24;
    } else if (band === 1) {
      r = r * 0.9 + shadow[0] * 0.1;
      g = g * 0.9 + shadow[1] * 0.1;
      b = b * 0.9 + shadow[2] * 0.1;
    }
    const e = edge[p] / 255;
    if (e > 0.13) {
      const s = Math.min(0.82, (e - 0.13) * 2.3) * 0.85;
      r = r * (1 - s) + INK[0] * s;
      g = g * (1 - s) + INK[1] * s;
      b = b * (1 - s) + INK[2] * s;
    }
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// The processed bitmap for a photo under a grade, or null when pixel access
// is unavailable. Cached per image element + grade id.
export function getPosterArt(img, grade) {
  let byGrade = artCache.get(img);
  if (!byGrade) {
    byGrade = new Map();
    artCache.set(img, byGrade);
  }
  if (!byGrade.has(grade.id)) {
    byGrade.set(grade.id, processPhoto(img, grade));
  }
  return byGrade.get(grade.id);
}
