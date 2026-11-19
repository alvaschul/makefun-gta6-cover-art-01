// cover.js — composes a finished cover from photos, a grade and a layout.
//
// The recipe, back to front: an ink ground, a sunset band with the sun
// behind the masthead, the posterized panels in their ink frames with
// their little tags, the cover lines on ink chips, the big gradient
// masthead with its script accent, a barcode in the corner, and a
// vignette to seat it all. The editor preview and the PNG export draw
// through this same function, so what you see is exactly what you share.

import { gradeById } from './grades.js';
import { layoutById, panelRects } from './layouts.js';
import { drawCoverFit, makeCanvas, processPhoto } from './poster.js';

export const SIZES = [
  { id: 'square', name: 'Square post', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait post', w: 1080, h: 1350 },
  { id: 'landscape', name: 'Wide post', w: 1920, h: 1080 },
  { id: 'story', name: 'Story', w: 1080, h: 1920 },
];

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[1];
}

export const DEFAULT_LINES = [
  '10 best getaway rides, ranked',
  'Neon nights: the city after dark',
  'Meet the crew everyone fears',
];

export function createState() {
  return {
    sizeId: 'portrait',
    gradeId: 'vice',
    layoutId: 'trio',
    photos: [],
    panelPhoto: [],
    pans: [],
    selectedPanel: 0,
    title: 'VICE PANELS',
    accent: 'cover studio',
    lines: [...DEFAULT_LINES],
    issue: 'VOL. 01 · THE SUNSET ISSUE',
    price: 'No. 01 — $9.99',
  };
}

// The area the panels tile: full-bleed sides, room at the top for the
// masthead to overlap, a margin at the bottom for the cover lines.
export function coverArea(w, h) {
  const mx = Math.round(w * 0.038);
  const top = Math.round(h * 0.148);
  const bottom = Math.round(h * 0.03);
  return { x: mx, y: top, w: w - mx * 2, h: h - top - bottom };
}

export function rectsFor(state, w, h) {
  const gutter = Math.max(8, Math.round(w * 0.014));
  return panelRects(layoutById(state.layoutId), coverArea(w, h), gutter);
}

export function panelAt(state, w, h, x, y) {
  const rects = rectsFor(state, w, h);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

function photoForPanel(state, index) {
  if (state.photos.length === 0) return null;
  const pick = state.panelPhoto[index] ?? index;
  return state.photos[pick % state.photos.length];
}

function panForPanel(state, index) {
  return state.pans[index] ?? { x: 0, y: 0, zoom: 1 };
}

function fitFontSize(ctx, text, maxWidth, start, family) {
  let size = start;
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 8) {
    size *= 0.95;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

function drawSkyBand(ctx, grade, w, bandH) {
  const grad = ctx.createLinearGradient(0, 0, 0, bandH * 1.6);
  grade.sky.forEach((stop, i) => grad.addColorStop(i / (grade.sky.length - 1), stop));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, bandH);
  // The sun, low and huge, sitting behind the masthead.
  const sunR = w * 0.085;
  const sunX = w * 0.815;
  const sunY = bandH * 0.58;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.6);
  glow.addColorStop(0, grade.sun);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 2.6, sunY - sunR * 2.6, sunR * 5.2, sunR * 5.2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
}

function drawPanelTag(ctx, grade, rect, h) {
  if (!rect.tag || rect.h < h * 0.14 || rect.w < 90) return;
  const size = Math.max(11, Math.round(h * 0.019));
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  const tw = ctx.measureText(rect.tag).width;
  const padX = size * 0.55;
  const padY = size * 0.28;
  ctx.translate(rect.x + size * 0.7, rect.y + size * 0.7);
  ctx.rotate(-0.045);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, 0, tw + padX * 2, size + padY * 2);
  ctx.fillStyle = grade.ink;
  ctx.textBaseline = 'middle';
  ctx.fillText(rect.tag, padX, (size + padY * 2) / 2 + 1);
  ctx.restore();
}

function drawPanels(ctx, state, grade, w, h, highlight) {
  const rects = rectsFor(state, w, h);
  rects.forEach((rect, i) => {
    const photo = photoForPanel(state, i);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (photo) {
      const art = processPhoto(photo, w, h, grade);
      drawCoverFit(ctx, art, rect.x, rect.y, rect.w, rect.h, panForPanel(state, i));
    } else {
      ctx.fillStyle = grade.sky[1];
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    // Seat the panel: a soft shade rising from its bottom edge.
    const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.55, 0, rect.y + rect.h);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = shade;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();

    // The ink frame, plus a hairline of paper inside it.
    ctx.strokeStyle = grade.ink;
    ctx.lineWidth = Math.max(5, w * 0.007);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = grade.paper;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    const inset = Math.max(4, w * 0.004);
    ctx.strokeRect(rect.x + inset, rect.y + inset, rect.w - inset * 2, rect.h - inset * 2);
    ctx.globalAlpha = 1;

    if (highlight === i) {
      ctx.strokeStyle = grade.accent;
      ctx.lineWidth = Math.max(3, w * 0.004);
      ctx.setLineDash([18, 12]);
      ctx.strokeRect(rect.x - 6, rect.y - 6, rect.w + 12, rect.h + 12);
      ctx.setLineDash([]);
    }
    drawPanelTag(ctx, grade, rect, h);
  });
}

function drawCoverLines(ctx, state, grade, w, h) {
  const lines = state.lines.map((l) => l.trim()).filter(Boolean).slice(0, 4);
  if (lines.length === 0) return;
  const mx = Math.round(w * 0.038);
  const size = Math.round(h * 0.027);
  const lineH = size * 1.62;
  let y = h - Math.round(h * 0.03) - lines.length * lineH;
  ctx.textBaseline = 'middle';
  for (const line of lines) {
    const text = line.toUpperCase();
    const fitted = fitFontSize(ctx, text, w * 0.6, size, 'Anton, sans-serif');
    const tw = ctx.measureText(text).width;
    const chipH = fitted * 1.34;
    const chipY = y + (lineH - chipH) / 2;
    ctx.fillStyle = grade.ink;
    ctx.globalAlpha = 0.88;
    ctx.fillRect(mx, chipY, tw + fitted * 1.5, chipH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = grade.accent2;
    ctx.fillRect(mx + fitted * 0.32, chipY + chipH * 0.3, fitted * 0.4, fitted * 0.4);
    ctx.fillStyle = grade.paper;
    ctx.fillText(text, mx + fitted * 0.95, chipY + chipH / 2 + 1);
    y += lineH;
  }
}

function drawMasthead(ctx, state, grade, w, h) {
  const mx = Math.round(w * 0.038);
  // The title: sunset-gradient Anton with a heavy ink stroke. Its size is
  // capped so the cap height plus the stroke always clears the top edge,
  // and its centre drops just enough to make room — a wide, short cover
  // (landscape) needs the drop most.
  const title = (state.title || 'VICE PANELS').toUpperCase();
  ctx.save();
  const size = fitFontSize(ctx, title, w * 0.9, w * 0.165, 'Anton, sans-serif');
  const titleY = Math.min(h * 0.135, Math.max(h * 0.104, size * 0.47));
  ctx.translate(w / 2, titleY);
  ctx.rotate(-0.028);
  const grad = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
  const stops = [...grade.sky].reverse();
  stops.forEach((stop, i) => grad.addColorStop(i / (stops.length - 1), stop));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grade.ink;
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  ctx.restore();

  // The script accent, tucked under the title's right shoulder.
  const accent = state.accent || '';
  if (accent) {
    ctx.save();
    ctx.translate(w * 0.685, titleY + size * 0.46);
    ctx.rotate(-0.05);
    const aSize = fitFontSize(ctx, accent, w * 0.42, w * 0.058, 'Yellowtail, cursive');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = grade.ink;
    ctx.shadowOffsetY = aSize * 0.07;
    ctx.shadowBlur = 0;
    ctx.fillStyle = grade.accent2;
    ctx.fillText(accent, 0, 0);
    ctx.restore();
  }
  ctx.textAlign = 'left';

  // Magazine furniture last, on top of the masthead, with a soft ink
  // shadow so the issue line and price stay readable where the title's
  // stroke passes behind them — as a real cover layers its small print.
  const small = Math.max(12, Math.round(h * 0.02));
  ctx.save();
  ctx.font = `${small}px Anton, sans-serif`;
  ctx.fillStyle = grade.paper;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = grade.ink;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 4;
  try {
    ctx.letterSpacing = '3px';
  } catch {
    /* older engines: no letter spacing, no harm */
  }
  ctx.fillText(state.issue.toUpperCase(), mx, h * 0.034);
  const priceW = ctx.measureText(state.price.toUpperCase()).width;
  ctx.fillText(state.price.toUpperCase(), w - mx - priceW, h * 0.034);
  ctx.restore();
}

function drawBarcode(ctx, state, grade, w, h) {
  const bw = Math.round(w * 0.125);
  const bh = Math.round(h * 0.05);
  const bx = w - Math.round(w * 0.038) - bw;
  const by = h - Math.round(h * 0.03) - bh;
  ctx.fillStyle = grade.paper;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = grade.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  // Deterministic bars from the title's characters.
  const seed = (state.title || 'VICE').split('').reduce((a, c) => a + c.charCodeAt(0), 7);
  let x = bx + bw * 0.07;
  let n = seed;
  ctx.fillStyle = grade.ink;
  while (x < bx + bw * 0.9) {
    n = (n * 1103515245 + 12345) % 2147483648;
    const barW = 1 + (n % 4);
    if (n % 3 !== 0) ctx.fillRect(x, by + bh * 0.1, barW, bh * 0.58);
    x += barW + 2;
  }
  const digits = '0 70989 00123 4';
  let digitSize = Math.round(bh * 0.24);
  ctx.font = `${digitSize}px monospace`;
  while (ctx.measureText(digits).width > bw * 0.88 && digitSize > 6) {
    digitSize -= 1;
    ctx.font = `${digitSize}px monospace`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(digits, bx + bw / 2, by + bh * 0.85);
  ctx.textAlign = 'left';
}

function drawVignette(ctx, grade, w, h) {
  const r = Math.hypot(w, h) / 2;
  const grad = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  void grade;
}

export function drawCover(ctx, state, opts = {}) {
  const size = sizeById(state.sizeId);
  const grade = gradeById(state.gradeId);
  const { w, h } = size;
  ctx.fillStyle = grade.ink;
  ctx.fillRect(0, 0, w, h);
  drawSkyBand(ctx, grade, w, coverArea(w, h).y + Math.round(h * 0.02));
  drawPanels(ctx, state, grade, w, h, opts.highlight ?? null);
  drawCoverLines(ctx, state, grade, w, h);
  drawMasthead(ctx, state, grade, w, h);
  drawBarcode(ctx, state, grade, w, h);
  drawVignette(ctx, grade, w, h);
}

export function exportPNG(state) {
  const size = sizeById(state.sizeId);
  const canvas = makeCanvas(size.w, size.h);
  drawCover(canvas.getContext('2d'), state, { highlight: null });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
