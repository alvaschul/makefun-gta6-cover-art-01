// Cover composition: panels, masthead lettering and the magazine furniture.
//
// drawCover paints a whole cover onto a canvas at the state's pixel size.
// The photo panels fill the page edge to edge; the masthead sits on a dusk
// shade across the top, and the cover lines and barcode ride the bottom.

import { makePanelArt } from './poster.js';
import { hexRgb } from './grades.js';

export const SIZES = [
  { id: 'portrait', name: 'Portrait post · 1080 × 1350', w: 1080, h: 1350 },
  { id: 'square', name: 'Square post · 1080 × 1080', w: 1080, h: 1080 },
  { id: 'story', name: 'Story · 1080 × 1920', w: 1080, h: 1920 },
  { id: 'wide', name: 'Wide banner · 1920 × 1080', w: 1920, h: 1080 },
];

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

function rgbCss([r, g, b], alpha = 1) {
  return `rgba(${r},${g},${b},${alpha})`;
}

// Fit a font size so `text` spans at most maxWidth: measure, then scale.
function fitFont(ctx, text, family, weight, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  const w = ctx.measureText(text).width;
  if (w > maxWidth) {
    size = Math.max(10, Math.floor((size * maxWidth) / w));
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

// A fake-but-honest barcode: bar widths hashed from the cover's own words.
function drawBarcode(ctx, x, y, w, h, seedText) {
  ctx.fillStyle = '#f8f4e8';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#14100c';
  let cursor = x + w * 0.06;
  const unit = w * 0.012;
  for (let i = 0; i < seedText.length && cursor < x + w * 0.9; i++) {
    const code = seedText.charCodeAt(i);
    const bars = [1 + (code % 3), 1 + ((code >> 3) % 2), 1 + ((code >> 5) % 3)];
    for (const b of bars) {
      ctx.fillRect(cursor, y + h * 0.12, unit * b * 0.62, h * 0.62);
      cursor += unit * (b + 0.8);
    }
  }
  ctx.font = `${Math.round(h * 0.16)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('VICE · PANELS · STUDIO', x + w / 2, y + h * 0.92);
}

function drawPanelTag(ctx, text, x, y, scale) {
  ctx.font = `${Math.round(21 * scale)}px Anton, sans-serif`;
  const w = ctx.measureText(text).width + 22 * scale;
  const h = 34 * scale;
  ctx.fillStyle = 'rgba(10,6,18,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffd94d';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 11 * scale, y + h / 2 + 1);
}

export function drawCover(canvas, state) {
  const { w, h } = state.size;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grade = state.grade;
  const ink = grade.ink;
  const scale = w / 1080;

  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, w, h);

  // Panels edge to edge, each with its own crop of the one photo.
  const frame = Math.max(6, Math.round(10 * scale));
  state.layout.panels.forEach((panel, i) => {
    const px = Math.round(panel.x * w);
    const py = Math.round(panel.y * h);
    const pw = Math.round(panel.w * w);
    const ph = Math.round(panel.h * h);
    const art = makePanelArt(state.photo, panel, pw, ph, grade, 11 + i * 5);
    ctx.drawImage(art, px, py);
    ctx.lineWidth = frame;
    ctx.strokeStyle = ink;
    ctx.strokeRect(px + frame / 2, py + frame / 2, pw - frame, ph - frame);
    ctx.lineWidth = Math.max(1.5, 2.5 * scale);
    ctx.strokeStyle = 'rgba(255,240,200,0.35)';
    ctx.strokeRect(px + frame + 3, py + frame + 3, pw - frame * 2 - 6, ph - frame * 2 - 6);
    drawPanelTag(ctx, panel.tag, px + frame + 10 * scale, py + frame + 10 * scale, scale);
  });

  // Dusk shade across the top so the masthead always reads.
  const shadeH = h * 0.34;
  const shade = ctx.createLinearGradient(0, 0, 0, shadeH);
  shade.addColorStop(0, rgbCss(hexRgb(ink), 0.82));
  shade.addColorStop(1, rgbCss(hexRgb(ink), 0));
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, shadeH);

  // Masthead: the title in Anton, filled with the grade's own sunset.
  const title = (state.title || 'VICE PANELS').toUpperCase();
  const titleSize = fitFont(ctx, title, 'Anton, sans-serif', '', w * 0.92, h * 0.115);
  const grad = ctx.createLinearGradient(0, 0, 0, titleSize * 1.15);
  grad.addColorStop(0, grade.paper);
  grad.addColorStop(0.45, grade.ramp[Math.min(5, grade.ramp.length - 2)]);
  grad.addColorStop(1, grade.ramp[Math.min(3, grade.ramp.length - 1)]);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = titleSize * 0.09;
  ctx.strokeStyle = ink;
  ctx.lineJoin = 'round';
  const titleY = h * 0.035;
  ctx.strokeText(title, w / 2, titleY);
  ctx.fillStyle = grad;
  ctx.fillText(title, w / 2, titleY);

  // Script accent tucked under the title's right shoulder.
  if (state.accent) {
    const accentSize = fitFont(ctx, state.accent, 'Yellowtail, cursive', '', w * 0.5, h * 0.052);
    ctx.textAlign = 'right';
    ctx.lineWidth = accentSize * 0.14;
    ctx.strokeText(state.accent, w * 0.94, titleY + titleSize * 0.82);
    ctx.fillStyle = grade.paper;
    ctx.fillText(state.accent, w * 0.94, titleY + titleSize * 0.82);
  }

  // Cover lines: ink chips low on the page, one to a side.
  const lines = state.lines.filter((l) => l.trim() !== '');
  ctx.textAlign = 'left';
  lines.slice(0, 2).forEach((line, i) => {
    const text = line.toUpperCase();
    const size = fitFont(ctx, text, 'Anton, sans-serif', '', w * 0.52, h * 0.034);
    const tw = ctx.measureText(text).width + 30 * scale;
    const th = size * 1.5;
    const lx = i === 0 ? w * 0.045 : w - w * 0.045 - tw;
    const ly = h - h * 0.155 - i * (th + 12 * scale);
    ctx.fillStyle = 'rgba(10,6,18,0.9)';
    ctx.fillRect(lx, ly, tw, th);
    ctx.fillStyle = i === 0 ? '#ffd94d' : grade.paper;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, lx + 15 * scale, ly + th / 2 + 1);
  });

  // Bottom furniture: issue line on the left, barcode on the right.
  const footH = Math.round(64 * scale * (h > w ? 1 : 0.8));
  ctx.fillStyle = ink;
  ctx.fillRect(0, h - footH, w, footH);
  ctx.fillStyle = grade.paper;
  ctx.font = `${Math.round(22 * scale)}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText((state.issue || 'ISSUE 01 · COVER STUDIO').toUpperCase(), w * 0.03, h - footH / 2);
  const bw = Math.round(210 * scale);
  const bh = Math.round(footH * 0.78);
  drawBarcode(ctx, w - bw - w * 0.02, h - footH + (footH - bh) / 2, bw, bh, title + state.accent);

  return canvas;
}
