// poster.js — turns a photograph into flat inked poster art.
//
// The pipeline, per photo + grade + size (results are cached):
//   1. draw the photo cover-fit onto a canvas at the cover's full size;
//   2. grade it per pixel — saturation, contrast and warmth;
//   3. posterize it — each channel snapped to a few flat bands, so the
//      photo stops looking photographic and starts looking printed;
//   4. ink it — a Sobel edge pass over the graded luminance darkens the
//      outlines toward the grade's ink colour, like a comic inker did;
//   5. grain — a whisper of deterministic noise, so flat bands still feel
//      like paper and ink rather than plastic.
// cover.js then cuts panels out of the finished art.

const cache = new Map();

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function clamp255(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

// Source rectangle that makes an image of iw x ih cover a w x h frame.
export function coverSourceRect(iw, ih, w, h) {
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  return { sx: (iw - sw) / 2, sy: (ih - sh) / 2, sw, sh };
}

// Draw an image (or canvas) into a rect, cover-fit, with a per-panel
// pan (-1..1 on each axis) and zoom (>= 1) applied around the centre.
export function drawCoverFit(ctx, img, dx, dy, dw, dh, pan) {
  const iw = img.naturalWidth ?? img.width;
  const ih = img.naturalHeight ?? img.height;
  const zoom = Math.max(1, pan?.zoom ?? 1);
  const base = coverSourceRect(iw, ih, dw, dh);
  const sw = base.sw / zoom;
  const sh = base.sh / zoom;
  const maxX = Math.max(0, (iw - sw) / 2);
  const maxY = Math.max(0, (ih - sh) / 2);
  const cx = iw / 2 + (pan?.x ?? 0) * maxX;
  const cy = ih / 2 + (pan?.y ?? 0) * maxY;
  const sx = Math.min(iw - sw, Math.max(0, cx - sw / 2));
  const sy = Math.min(ih - sh, Math.max(0, cy - sh / 2));
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function hexRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// A tiny deterministic noise source (a hash of the pixel index), so the
// grain is the same on every render and every machine.
function noiseAt(i) {
  let n = (i + 1) * 2654435761;
  n = (n ^ (n >>> 13)) * 1274126177;
  return (((n ^ (n >>> 16)) >>> 0) % 1000) / 1000 - 0.5;
}

export function processPhoto(photo, w, h, grade) {
  const key = `${photo.id}|${grade.id}|${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const art = makeCanvas(w, h);
  const ctx = art.getContext('2d', { willReadFrequently: true });
  drawCoverFit(ctx, photo.img, 0, 0, w, h, null);

  const imageData = ctx.getImageData(0, 0, w, h);
  const px = imageData.data;
  const count = w * h;

  // Graded luminance, kept aside for the edge pass.
  const lum = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    lum[i] = 0.2126 * px[o] + 0.7152 * px[o + 1] + 0.0722 * px[o + 2];
  }

  // Sobel edge magnitude over the luminance.
  const edge = new Float32Array(count);
  let edgePeak = 0.0001;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        -lum[i - w - 1] - 2 * lum[i - 1] - lum[i + w - 1] +
        lum[i - w + 1] + 2 * lum[i + 1] + lum[i + w + 1];
      const gy =
        -lum[i - w - 1] - 2 * lum[i - w] - lum[i - w + 1] +
        lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1];
      const mag = Math.abs(gx) + Math.abs(gy);
      edge[i] = mag;
      if (mag > edgePeak) edgePeak = mag;
    }
  }
  const edgeScale = 3.2 / edgePeak;

  const [inkR, inkG, inkB] = hexRgb(grade.ink);
  const steps = Math.max(2, grade.levels);
  const sat = grade.saturation;
  const con = grade.contrast;
  const warm = grade.warmth;
  const grainAmt = grade.grain;
  const inkAmt = grade.edge;

  for (let i = 0; i < count; i++) {
    const o = i * 4;
    let r = px[o];
    let g = px[o + 1];
    let b = px[o + 2];

    // Saturation around the pixel's own luminance.
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = l + (r - l) * sat;
    g = l + (g - l) * sat;
    b = l + (b - l) * sat;

    // Contrast around mid-grey, then warmth (red up, blue down).
    r = (r - 128) * con + 128 + warm;
    g = (g - 128) * con + 128;
    b = (b - 128) * con + 128 - warm;

    // Posterize: snap each channel to the grade's flat bands.
    r = Math.round((clamp255(r) / 255) * (steps - 1)) * (255 / (steps - 1));
    g = Math.round((clamp255(g) / 255) * (steps - 1)) * (255 / (steps - 1));
    b = Math.round((clamp255(b) / 255) * (steps - 1)) * (255 / (steps - 1));

    // Ink: pull strong edges toward the ink colour.
    const e = Math.min(1, edge[i] * edgeScale);
    const k = e * e * inkAmt;
    if (k > 0.01) {
      r += (inkR - r) * k;
      g += (inkG - g) * k;
      b += (inkB - b) * k;
    }

    // Print grain.
    const n = noiseAt(i) * grainAmt * 2;
    px[o] = clamp255(r + n);
    px[o + 1] = clamp255(g + n);
    px[o + 2] = clamp255(b + n);
    px[o + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  cache.set(key, art);
  if (cache.size > 12) cache.delete(cache.keys().next().value);
  return art;
}

export function clearPosterCache() {
  cache.clear();
}
