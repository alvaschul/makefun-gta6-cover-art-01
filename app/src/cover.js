// VICE PANELS — the cover renderer.
// drawCover paints a complete cover onto any 2D canvas at the canvas's own
// size: posterized, inked photo panels (see poster.js) split by chunky ink
// frames, a sunset title block with gradient arc lettering, script subtitle,
// heat stars and a badge ribbon — then grain and vignette finishing passes
// that make it feel printed.

import { getPosterArt } from './poster.js';

let noiseCanvas = null;
let dotPattern = null;

function getDotPattern(ctx) {
  if (!dotPattern) {
    dotPattern = document.createElement('canvas');
    dotPattern.width = 9;
    dotPattern.height = 9;
    const dctx = dotPattern.getContext('2d');
    dctx.fillStyle = '#ffffff';
    dctx.beginPath();
    dctx.arc(4.5, 4.5, 2.1, 0, Math.PI * 2);
    dctx.fill();
  }
  return ctx.createPattern(dotPattern, 'repeat');
}

function getNoiseCanvas() {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 256;
  noiseCanvas.height = 256;
  const nctx = noiseCanvas.getContext('2d');
  const data = nctx.createImageData(256, 256);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  return noiseCanvas;
}

function fitFontSize(ctx, text, family, maxWidth, startSize, minSize) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

function starPath(ctx, cx, cy, radius) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawPanelPhoto(ctx, rect, panel, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!panel || !panel.img) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3b1155');
    g.addColorStop(0.55, '#8c1d5c');
    g.addColorStop(1, '#ff7a3c');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255, 214, 150, 0.85)';
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.62, Math.min(w, h) * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `700 ${Math.max(11, Math.min(w, h) * 0.07)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h * 0.3);
    ctx.restore();
    return;
  }
  const img = panel.img;
  const zoom = panel.zoom || 1;
  // Poster path: the photo pre-rendered as flat inked art for this grade.
  // Crop math runs on the bitmap's own size — same aspect as the photo.
  const art = getPosterArt(img, grade);
  const src = art || img;
  const sw = art ? art.width : img.naturalWidth;
  const sh = art ? art.height : img.naturalHeight;
  const scale = Math.max(w / sw, h / sh) * zoom;
  const dw = sw * scale;
  const dh = sh * scale;
  const extraX = Math.max(0, dw - w);
  const extraY = Math.max(0, dh - h);
  const dx = x - extraX / 2 + (panel.ox || 0) * extraX;
  const dy = y - extraY / 2 + (panel.oy || 0) * extraY;
  if (art) {
    ctx.drawImage(art, dx, dy, dw, dh);
    // The palette is already baked into the art; only a whisper of the wash
    // and the rising sunset glow go on top, so panels sit in one world.
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = grade.wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    const glow = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
    glow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    glow.addColorStop(1, grade.bottom.replace(/[\d.]+\)$/, '0.20)'));
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // Halftone dot texture, the print-shop finish over flat colour.
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = getDotPattern(ctx);
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.restore();
    return;
  }
  ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  // Duotone overlays: a vertical sunset ramp in overlay mode, then the wash.
  const ramp = ctx.createLinearGradient(0, y, 0, y + h);
  ramp.addColorStop(0, grade.top);
  ramp.addColorStop(0.52, grade.mid);
  ramp.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ramp;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = ramp;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(x, y, w, h);
  // Sunset glow: the accent colour rising from the panel's foot, screened on
  // so shadows stay deep while the lower third catches the neon.
  const glow = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
  glow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(1, grade.bottom.replace(/[\d.]+\)$/, '0.30)'));
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function drawPanel(ctx, rect, panel, grade, unit) {
  const tilt = rect.tilt || 0;
  ctx.save();
  if (tilt) {
    const px = rect.x + rect.w / 2;
    const py = rect.y + rect.h / 2;
    ctx.translate(px, py);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-px, -py);
    // Polaroid frame: white card with a deep bottom edge + soft shadow.
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = unit * 2.2;
    ctx.shadowOffsetY = unit * 0.8;
    ctx.fillStyle = '#fdfdf8';
    const pad = unit * 0.55;
    const bottomPad = unit * 2.4;
    ctx.fillRect(rect.x - pad, rect.y - pad, rect.w + pad * 2, rect.h + pad + bottomPad);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  drawPanelPhoto(ctx, rect, panel, grade);
  if (tilt) {
    // Snapshot on a polaroid card: a thin ink line where photo meets card.
    ctx.lineWidth = Math.max(1, unit * 0.22);
    ctx.strokeStyle = '#0b0316';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  } else {
    // Chunky near-black frame with a thin inner keyline — the GTA VI cover
    // system. Neighbouring frames merge into black gutters.
    ctx.lineWidth = Math.max(3, unit * 0.85);
    ctx.strokeStyle = '#0b0316';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.lineWidth = Math.max(1, unit * 0.16);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    const kin = Math.max(2, unit * 0.58);
    ctx.strokeRect(rect.x + kin, rect.y + kin, rect.w - kin * 2, rect.h - kin * 2);
  }
  ctx.restore();
}

// The title, letter by letter on a shallow arc: hard black offset shadow
// (solid, no blur), a thick ink stroke, then the grade's sunset gradient.
// Per-character drawing is what lets the line bow like a poster masthead
// instead of sitting flat like a caption.
function drawArcTitle(ctx, text, cx, cy, size, family, stops, unit) {
  ctx.font = `${size}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const chars = [...text];
  const tracking = -size * 0.008;
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  const fill = ctx.createLinearGradient(0, cy - size * 0.62, 0, cy + size * 0.62);
  fill.addColorStop(0, stops[0]);
  fill.addColorStop(0.38, stops[1]);
  fill.addColorStop(0.7, stops[2]);
  fill.addColorStop(1, stops[3]);
  const amp = size * 0.05;
  let pen = cx - total / 2;
  chars.forEach((ch, i) => {
    const t = chars.length === 1 ? 0.5 : i / (chars.length - 1);
    const dy = -Math.sin(t * Math.PI) * amp;
    const gx = pen + widths[i] / 2;
    ctx.fillStyle = '#07010f';
    ctx.fillText(ch, gx + unit * 0.5, cy + dy + unit * 0.55);
    ctx.lineWidth = Math.max(2, size * 0.14);
    ctx.strokeStyle = '#0a0214';
    ctx.strokeText(ch, gx, cy + dy);
    ctx.fillStyle = fill;
    ctx.fillText(ch, gx, cy + dy);
    pen += widths[i] + tracking;
  });
}

function drawTitleBlock(ctx, block, view, W, H, unit) {
  const grade = view.grade;
  const x = block.x * W;
  const y = block.y * H;
  const w = block.w * W;
  const h = block.h * H;
  const overPhoto = view.layout.id === 'cover-story' || view.layout.id === 'full-bleed';
  ctx.save();
  if (overPhoto) {
    const back = ctx.createLinearGradient(0, y, 0, y + h * 1.25);
    back.addColorStop(0, 'rgba(12, 3, 26, 0.88)');
    back.addColorStop(0.75, 'rgba(12, 3, 26, 0.55)');
    back.addColorStop(1, 'rgba(12, 3, 26, 0)');
    ctx.fillStyle = back;
    ctx.fillRect(x, y, w, h * 1.25);
  } else {
    // Sunset band: deep purple at the top melting through magenta into hot
    // orange right where the block meets the panels.
    const bg = ctx.createLinearGradient(0, y, 0, y + h);
    bg.addColorStop(0, '#14022a');
    bg.addColorStop(0.38, '#2c0a4a');
    bg.addColorStop(0.68, '#7c1a5e');
    bg.addColorStop(0.9, '#e83e6b');
    bg.addColorStop(1, '#ff6a3c');
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    // Halftone dots fade in toward the panel edge; the Halftone toggle
    // turns the whisper into a shout.
    const dotStep = unit * (view.halftone ? 1.35 : 1.7);
    const dotR = unit * (view.halftone ? 0.24 : 0.15);
    ctx.fillStyle = '#ffffff';
    for (let dy = y + dotStep * 0.5; dy < y + h; dy += dotStep) {
      const t = (dy - y) / h;
      ctx.globalAlpha = view.halftone ? 0.08 + 0.22 * t : 0.03 + 0.09 * t;
      for (let dx = x + dotStep * 0.5; dx < x + w; dx += dotStep) {
        ctx.beginPath();
        ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // Sunset stripe along the block's foot.
    const stripe = ctx.createLinearGradient(x, 0, x + w, 0);
    stripe.addColorStop(0, '#22d3ee');
    stripe.addColorStop(0.45, '#ff2d78');
    stripe.addColorStop(0.75, '#ff8a3c');
    stripe.addColorStop(1, '#ffd23c');
    ctx.fillStyle = stripe;
    ctx.fillRect(x, y + h - Math.max(3, unit * 0.45), w, Math.max(3, unit * 0.45));
  }

  const title = (view.title || '').trim().toUpperCase() || 'VICE PANELS';
  const family = '"ViceDisplay", "Arial Black", sans-serif';
  const startSize = h * (view.subtitle ? 0.52 : 0.62);
  const size = fitFontSize(ctx, title, family, w * 0.9, startSize, 10);
  const titleY = y + h * (view.subtitle ? 0.4 : 0.5);
  drawArcTitle(ctx, title, x + w / 2, titleY, size, family, grade.titleStops, unit);

  if (view.subtitle) {
    const sub = view.subtitle;
    const subFamily = '"ViceScript", "Segoe Script", cursive';
    const subSize = fitFontSize(ctx, sub, subFamily, w * 0.6, h * 0.3, 9);
    ctx.font = `${subSize}px ${subFamily}`;
    ctx.textAlign = 'right';
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = unit * 1.6;
    ctx.fillStyle = '#ffe9f4';
    const subY = y + h * 0.82;
    ctx.fillText(sub, x + w * 0.97, subY);
    ctx.fillText(sub, x + w * 0.97, subY);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
  }

  // Heat stars, bottom-left of the block.
  const heat = Math.max(0, Math.min(5, view.heat || 0));
  if (heat > 0 || view.editor) {
    const r = Math.min(h * 0.13, unit * 1.5);
    const sy = y + h * 0.84;
    for (let i = 0; i < 5; i += 1) {
      const sx = x + w * 0.03 + r + i * r * 2.35;
      starPath(ctx, sx, sy, r);
      if (i < heat) {
        ctx.fillStyle = '#ffd23c';
        ctx.shadowColor = 'rgba(255, 170, 0, 0.8)';
        ctx.shadowBlur = unit * 0.7;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fill();
      }
      ctx.lineWidth = Math.max(1.2, unit * 0.18);
      ctx.strokeStyle = '#0a0214';
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBadge(ctx, view, W, H, unit) {
  const text = (view.badge || '').trim().toUpperCase();
  if (!text) return;
  ctx.save();
  ctx.font = `700 ${Math.max(10, unit * 1.35)}px system-ui, sans-serif`;
  const tw = ctx.measureText(text).width;
  const bw = tw + unit * 3.2;
  const bh = unit * 3.1;
  const bx = W - bw - unit * 1.6;
  const by = H - bh - unit * 1.6;
  ctx.translate(bx + bw / 2, by + bh / 2);
  ctx.rotate((-5 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = unit * 0.9;
  ctx.shadowOffsetY = unit * 0.4;
  const badgeFill = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
  badgeFill.addColorStop(0, '#ffd23c');
  badgeFill.addColorStop(0.55, '#ff8a3c');
  badgeFill.addColorStop(1, '#ff2d78');
  ctx.fillStyle = badgeFill;
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = Math.max(1.5, unit * 0.22);
  ctx.strokeStyle = '#0a0214';
  ctx.stroke();
  ctx.fillStyle = '#1a0510';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, unit * 0.08);
  ctx.restore();
}

export function drawCover(canvas, view) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const unit = Math.min(W, H) / 100;
  const { layout, grade } = view;

  ctx.fillStyle = grade.skyline;
  ctx.fillRect(0, 0, W, H);

  const heroFirst = layout.id === 'cover-story' || layout.id === 'full-bleed';
  if (!heroFirst) drawTitleBlock(ctx, layout.title, view, W, H, unit);

  layout.panels.forEach((rel, i) => {
    const rect = {
      x: rel.x * W,
      y: rel.y * H,
      w: rel.w * W,
      h: rel.h * H,
      tilt: rel.tilt || 0,
    };
    const panel = view.panels[i] || null;
    drawPanel(ctx, rect, panel, grade, unit);
    if (view.editor && view.selected === i) {
      ctx.save();
      ctx.lineWidth = Math.max(2, unit * 0.55);
      ctx.strokeStyle = grade.accent;
      ctx.strokeRect(rect.x - unit * 0.5, rect.y - unit * 0.5, rect.w + unit, rect.h + unit);
      ctx.fillStyle = grade.accent;
      const label = `PANEL ${i + 1}`;
      ctx.font = `700 ${Math.max(10, unit * 1.5)}px system-ui, sans-serif`;
      const lw = ctx.measureText(label).width + unit * 1.6;
      // Keep the tag clear of the title block: above the panel when there is
      // room, otherwise tucked inside the panel's top-left corner.
      const titleBottom = heroFirst ? 0 : (layout.title.y + layout.title.h) * H;
      const aboveY = rect.y - unit * 3.4;
      const ly = aboveY >= titleBottom + unit * 0.3 ? aboveY : rect.y + unit * 0.7;
      ctx.fillRect(rect.x - unit * 0.5, ly, lw, unit * 2.8);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, rect.x + unit * 0.3, ly + unit * 1.4);
      ctx.restore();
    }
  });

  if (heroFirst) drawTitleBlock(ctx, layout.title, view, W, H, unit);
  drawBadge(ctx, view, W, H, unit);

  if (view.vignette) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(5,0,12,0.36)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
  if (view.grain) {
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.globalCompositeOperation = 'overlay';
    const pattern = ctx.createPattern(getNoiseCanvas(), 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// Hit test: which panel (index) contains a point given in canvas pixels?
export function panelAt(layout, W, H, px, py) {
  for (let i = layout.panels.length - 1; i >= 0; i -= 1) {
    const r = layout.panels[i];
    if (px >= r.x * W && px <= (r.x + r.w) * W && py >= r.y * H && py <= (r.y + r.h) * H) return i;
  }
  return -1;
}
