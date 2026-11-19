// cover.js — composes a finished cover from poster art and lettering.
//
// The recipe, back to front: ink-black page, the layout's panels filled
// with differently-cropped windows of the same poster art, heavy ink
// frames with a paper keyline, a tagged chip on every panel, then the
// magazine furniture — masthead, script flourish, cover lines, price
// burst, barcode and the caption bar along the foot.
//
// The poster art is the expensive layer, so it is cached per photo +
// grade + size; changing a headline never re-posterizes the photograph.

import { gradeById, inkCss, paperCss } from './grades.js';
import { layoutById, sizeById } from './layouts.js';
import { makeArtwork, seededRandom } from './poster.js';

const DISPLAY = `'Anton', 'Arial Narrow', sans-serif`;
const SCRIPT = `'Yellowtail', cursive`;

const artworkCache = new Map();

/** The poster art for a state, built once and then reused. */
function artworkFor(state, width, height) {
  const key = `${state.photoKey}|${state.gradeId}|${width}x${height}`;
  if (!artworkCache.has(key)) {
    artworkCache.set(key, makeArtwork(state.image, gradeById(state.gradeId), width, height));
  }
  return artworkCache.get(key);
}

/** Drop every cached artwork (a new photograph makes them all stale). */
export function forgetArtwork() {
  artworkCache.clear();
}

/** Set the font to `family` at the largest size ≤ startSize that fits maxWidth; returns the size used. */
function fitFont(ctx, text, family, startSize, maxWidth) {
  let size = startSize;
  while (size > 10) {
    ctx.font = `${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size = Math.floor(size * 0.94);
  }
  ctx.font = `${size}px ${family}`;
  return size;
}

/** Stroke-then-fill a line of text so it stays readable over busy art. */
function inkedText(ctx, text, x, y, fill) {
  ctx.strokeStyle = 'rgba(8, 6, 18, 0.9)';
  ctx.lineWidth = Math.max(3, ctx.measureText(text).width * 0.012);
  ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function drawPanel(ctx, artwork, panel, rect, grade, index, coverW, coverH) {
  const { x, y, w, h } = rect;
  drawPanelArt(ctx, artwork, panel, rect);
  // Frame: a heavy ink rule, then a hairline of paper inside it.
  const rule = Math.max(5, coverW * 0.006);
  ctx.strokeStyle = inkCss(grade);
  ctx.lineWidth = rule;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = paperCss(grade);
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(1.5, rule * 0.22);
  ctx.strokeRect(x + rule, y + rule, w - rule * 2, h - rule * 2);
  ctx.globalAlpha = 1;
  drawTag(ctx, panel.tag, rect, grade, index, coverW, coverH);
}

function drawPanelArt(ctx, artwork, panel, rect) {
  const { x, y, w, h } = rect;
  // The source window keeps the panel's aspect, sized by the zoom, and is
  // centered on the focal point, clamped to the artwork's edges.
  const aspect = w / h;
  let sW = artwork.width / panel.zoom;
  let sH = sW / aspect;
  if (sH > artwork.height / panel.zoom) {
    sH = artwork.height / panel.zoom;
    sW = sH * aspect;
  }
  if (sW > artwork.width) { sW = artwork.width; sH = sW / aspect; }
  if (sH > artwork.height) { sH = artwork.height; sW = sH * aspect; }
  const sx = Math.max(0, Math.min(artwork.width - sW, panel.focalX * artwork.width - sW / 2));
  const sy = Math.max(0, Math.min(artwork.height - sH, panel.focalY * artwork.height - sH / 2));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(artwork, sx, sy, sW, sH, x, y, w, h);
  ctx.restore();
}

/**
 * A small rotated ink chip naming the panel. Placement dodges the
 * cover's furniture: ordinary panels wear it top-left; top-row panels
 * hang it along their bottom edge (right side, or left when the panel
 * spans the cover and the price burst holds the right); and a panel
 * that runs the full height of the cover drops it below the masthead
 * instead, where the caption bar cannot swallow it.
 */
function drawTag(ctx, tag, rect, grade, index, coverW, coverH) {
  if (!tag) return;
  const size = Math.max(13, coverW * 0.02);
  ctx.save();
  ctx.font = `${size}px ${DISPLAY}`;
  const w = ctx.measureText(tag).width + size * 1.1;
  const h = size * 1.62;
  const inset = coverW * 0.016;
  const topRow = rect.y <= coverW * 0.02;
  const fullHeight = rect.y + rect.h > coverH * 0.88;
  const fullWidth = rect.w > coverW * 0.9;
  let tx = rect.x + inset;
  let ty = rect.y + inset;
  if (topRow && fullHeight) {
    ty = coverH * 0.25;
  } else if (topRow && fullWidth) {
    // The price burst guards the right side at this height; go left.
    ty = rect.y + rect.h - h - inset;
  } else if (topRow) {
    tx = rect.x + rect.w - w - inset;
    ty = rect.y + rect.h - h - inset;
  }
  ctx.translate(tx, ty);
  ctx.rotate((index % 2 === 0 ? -1 : 1) * 0.028);
  ctx.fillStyle = inkCss(grade);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = paperCss(grade);
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, size * 0.55, h / 2 + 1);
  ctx.restore();
}

/** The masthead: issue line, gradient title, script flourish. */
function drawMasthead(ctx, state, grade, W, H) {
  const ink = inkCss(grade);
  const paper = paperCss(grade);
  // A fall of shade at the top so the lettering wins over the art.
  const shade = ctx.createLinearGradient(0, 0, 0, H * 0.3);
  shade.addColorStop(0, 'rgba(6, 4, 16, 0.62)');
  shade.addColorStop(1, 'rgba(6, 4, 16, 0)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H * 0.3);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const issueSize = Math.max(13, W * 0.021);
  ctx.font = `${issueSize}px ${DISPLAY}`;
  try { ctx.letterSpacing = `${Math.round(issueSize * 0.22)}px`; } catch { /* older engines */ }
  ctx.fillStyle = paper;
  ctx.fillText(`ISSUE ${state.issue} — VICE CITY, FL`, W * 0.035, H * 0.038);
  const right = 'APPROVED BY THE SUNSET COMMISSION';
  ctx.fillText(right, W * 0.965 - ctx.measureText(right).width, H * 0.038);
  try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }

  // Title: Anton, sunset gradient, an ink outline thick enough to print.
  const title = state.title || 'VICE PANELS';
  const size = fitFont(ctx, title, DISPLAY, W * 0.185, W * 0.94);
  const titleY = H * 0.038 + size * 1.12;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink;
  ctx.lineWidth = size * 0.17;
  ctx.strokeText(title, W / 2, titleY);
  const fill = ctx.createLinearGradient(0, titleY - size, 0, titleY);
  fill.addColorStop(0, grade.masthead[0]);
  fill.addColorStop(0.55, grade.masthead[1]);
  fill.addColorStop(1, grade.masthead[2]);
  ctx.fillStyle = fill;
  ctx.fillText(title, W / 2, titleY);

  // Script flourish, tucked under the title's right shoulder.
  if (state.script) {
    const sSize = fitFont(ctx, state.script, SCRIPT, W * 0.082, W * 0.5);
    ctx.save();
    ctx.translate(W * 0.635, titleY + sSize * 0.52);
    ctx.rotate(-0.045);
    ctx.textAlign = 'center';
    ctx.strokeStyle = ink;
    ctx.lineWidth = sSize * 0.14;
    ctx.strokeText(state.script, 0, 0);
    ctx.fillStyle = paper;
    ctx.fillText(state.script, 0, 0);
    ctx.restore();
  }
  ctx.textAlign = 'left';
}

/** The starburst price badge, a newsstand shout in the top-right field. */
function drawPriceBurst(ctx, state, grade, W, H) {
  const cx = W * 0.862;
  const cy = H * 0.315;
  const r = W * 0.088;
  const points = 12;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.13);
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.79;
    const a = (i / (points * 2)) * Math.PI * 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd23a';
  ctx.fill();
  ctx.strokeStyle = inkCss(grade);
  ctx.lineWidth = Math.max(3, W * 0.004);
  ctx.stroke();
  ctx.fillStyle = '#17102c';
  ctx.textAlign = 'center';
  const small = r * 0.34;
  ctx.font = `${small}px ${DISPLAY}`;
  ctx.fillText('ONLY', 0, -r * 0.12);
  const big = r * 0.52;
  ctx.font = `${big}px ${DISPLAY}`;
  ctx.fillText(state.price, 0, big * 0.72);
  ctx.restore();
  ctx.textAlign = 'left';
}

/** Stacked cover lines down the left edge, starred like a table of contents. */
function drawCoverLines(ctx, state, grade, layout, W, H) {
  const lines = state.lines.filter((line) => line.trim() !== '').slice(0, 4);
  if (lines.length === 0) return;
  const size = Math.max(15, W * 0.027);
  ctx.font = `${size}px ${DISPLAY}`;
  let y = H * (layout.linesY ?? 0.36);
  for (const line of lines) {
    ctx.fillStyle = grade.accent;
    ctx.fillText('★', W * 0.038, y);
    inkedText(ctx, line.toUpperCase(), W * 0.038 + size * 1.25, y, paperCss(grade));
    y += size * 1.5;
  }
}

/** A barcode block: white card, seeded bars, a number that almost scans. */
function drawBarcode(ctx, W, H, barTop) {
  const w = W * 0.155;
  const h = H * 0.042;
  const x = W * 0.965 - w;
  const y = barTop - h - H * 0.012;
  ctx.fillStyle = '#fdfdf8';
  ctx.fillRect(x, y, w, h);
  const rand = seededRandom(666);
  ctx.fillStyle = '#101010';
  let bx = x + w * 0.06;
  const barsBottom = y + h * 0.72;
  while (bx < x + w * 0.92) {
    const bw = 1 + rand() * 3.2;
    if (rand() > 0.32) ctx.fillRect(bx, y + h * 0.1, bw, barsBottom - y - h * 0.1);
    bx += bw + 1 + rand() * 2.4;
  }
  ctx.font = `${Math.max(9, h * 0.24)}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('0 70989 00666 6', x + w / 2, y + h * 0.94);
  ctx.textAlign = 'left';
}

/** The caption bar along the foot, with the issue's big promise. */
function drawCaptionBar(ctx, state, grade, W, H) {
  const barH = Math.max(54, H * 0.072);
  const top = H - barH;
  drawBarcode(ctx, W, H, top);
  ctx.fillStyle = inkCss(grade);
  ctx.fillRect(0, top, W, barH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, top, W, Math.max(3, H * 0.005));
  if (state.caption) {
    ctx.textAlign = 'center';
    const size = fitFont(ctx, state.caption, DISPLAY, W * 0.034, W * 0.9);
    inkedText(ctx, state.caption, W / 2, top + barH / 2 + size * 0.36, paperCss(grade));
    ctx.textAlign = 'left';
  }
}

/**
 * Draw the whole cover for `state` onto `canvas`, sizing the canvas to
 * the state's output size. Returns the canvas.
 */
export function drawCover(canvas, state) {
  const size = sizeById(state.sizeId);
  canvas.width = size.width;
  canvas.height = size.height;
  const { width: W, height: H } = size;
  const grade = gradeById(state.gradeId);
  const layout = layoutById(state.layoutId);
  const ctx = canvas.getContext('2d');
  const artwork = artworkFor(state, W, H);

  ctx.fillStyle = inkCss(grade);
  ctx.fillRect(0, 0, W, H);

  const gap = Math.max(8, W * 0.012);
  layout.panels.forEach((panel, index) => {
    const rect = {
      x: panel.x * W + gap / 2,
      y: panel.y * H + gap / 2,
      w: panel.w * W - gap,
      h: panel.h * H - gap,
    };
    drawPanel(ctx, artwork, panel, rect, grade, index, W, H);
  });

  drawMasthead(ctx, state, grade, W, H);
  drawPriceBurst(ctx, state, grade, W, H);
  drawCoverLines(ctx, state, grade, layout, W, H);
  drawCaptionBar(ctx, state, grade, W, H);
  return canvas;
}
