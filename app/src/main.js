// VICE PANELS · Cover Studio — editor wiring.
// State lives in one object; every change funnels through commit() so undo /
// redo can snapshot it. Photos are kept as loaded Image objects in a pool and
// panels reference them by index, which keeps snapshots tiny (no image data).

import { LAYOUTS, getLayout, panelCount } from './layouts.js';
import { GRADES, getGrade } from './grades.js';
import { drawCover, panelAt } from './cover.js';
import {
  makePhoto, loadImageFromUrl, loadImageFromFile,
  makePanels, emptyPanel, fillPanelsWithOnePhoto, alternatePanels, clampCrop,
} from './photos.js';
import { runShot } from './shots.js';

const SIZES = [
  { id: 'square', name: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 x 1080', w: 1920, h: 1080 },
  { id: 'story', name: 'Story 1080 x 1920', w: 1080, h: 1920 },
];

const DRIFTS = [
  { ox: -0.22, oy: -0.12, zoom: 1.25 }, { ox: 0.2, oy: -0.2, zoom: 1.4 },
  { ox: 0, oy: 0.18, zoom: 1.15 }, { ox: -0.28, oy: 0.1, zoom: 1.5 },
  { ox: 0.26, oy: 0.22, zoom: 1.3 }, { ox: 0, oy: 0, zoom: 1.05 },
  { ox: -0.12, oy: 0.26, zoom: 1.45 }, { ox: 0.14, oy: -0.26, zoom: 1.2 },
  { ox: 0, oy: -0.05, zoom: 1.6 },
];

const canvas = document.getElementById('coverCanvas');
const status = document.getElementById('status');

const state = {
  layoutId: 'classic-nine',
  gradeId: 'vice-sunset',
  title: 'VICE PANELS',
  subtitle: 'vice panels originals',
  badge: 'VICE CITY · EST. 2026',
  heat: 4,
  grain: true,
  vignette: true,
  halftone: false,
  sizeId: 'portrait',
  panels: makePanels(panelCount('classic-nine')),
  selected: 0,
  selectedPhoto: -1,
};

const pool = [];
const sampleCache = new Map();
let history = [];
let historyIndex = -1;

function currentSize() {
  return SIZES.find((s) => s.id === state.sizeId) ?? SIZES[1];
}

function snapshot() {
  return JSON.stringify({
    layoutId: state.layoutId, gradeId: state.gradeId, title: state.title,
    subtitle: state.subtitle, badge: state.badge, heat: state.heat,
    grain: state.grain, vignette: state.vignette, halftone: state.halftone,
    sizeId: state.sizeId, selected: state.selected, selectedPhoto: state.selectedPhoto,
    panels: state.panels.map((p) => ({ ...p })),
  });
}

function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  state.panels = s.panels.map((p) => ({ ...p }));
  syncControls();
  redraw();
}

function commit() {
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot());
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  syncHistoryButtons();
}

function syncHistoryButtons() {
  document.getElementById('undoBtn').disabled = historyIndex <= 0;
  document.getElementById('redoBtn').disabled = historyIndex >= history.length - 1;
}

function view(editor = true) {
  return {
    layout: getLayout(state.layoutId),
    grade: getGrade(state.gradeId),
    title: state.title,
    subtitle: state.subtitle,
    badge: state.badge,
    heat: state.heat,
    grain: state.grain,
    vignette: state.vignette,
    halftone: state.halftone,
    editor,
    selected: editor ? state.selected : -1,
    panels: state.panels.map((p) => ({
      img: p.photo >= 0 && pool[p.photo] ? pool[p.photo].img : null,
      zoom: p.zoom, ox: p.ox, oy: p.oy,
    })),
  };
}

function redraw() {
  const size = currentSize();
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, view(true));
  syncPanelInfo();
}

function syncPanelInfo() {
  const info = document.getElementById('panelInfo');
  const p = state.panels[state.selected];
  const photoName = p && p.photo >= 0 && pool[p.photo] ? pool[p.photo].label : 'no photo yet';
  info.innerHTML = `<b>Panel ${state.selected + 1}</b> of ${state.panels.length} — ${photoName}. Drag to pan, scroll to zoom.`;
  const zoom = document.getElementById('zoomRange');
  const zoomVal = document.getElementById('zoomVal');
  if (p) {
    zoom.value = String(p.zoom);
    zoomVal.textContent = `${p.zoom.toFixed(2)}x`;
  }
}

// ---------- controls ----------

function buildLayoutButtons() {
  const host = document.getElementById('layoutList');
  host.innerHTML = '';
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'layout-btn' + (layout.id === state.layoutId ? ' active' : '');
    btn.dataset.layout = layout.id;
    btn.innerHTML = `<b>${layout.name}</b><small>${layout.blurb}</small>`;
    btn.addEventListener('click', () => setLayout(layout.id));
    host.appendChild(btn);
  }
}

function buildGradeButtons() {
  const host = document.getElementById('gradeList');
  host.innerHTML = '';
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grade-btn' + (grade.id === state.gradeId ? ' active' : '');
    btn.dataset.grade = grade.id;
    btn.innerHTML = `<span class="dot" style="background: linear-gradient(180deg, ${grade.top}, ${grade.bottom})"></span>${grade.name}`;
    btn.addEventListener('click', () => {
      state.gradeId = grade.id;
      commit(); buildGradeButtons(); redraw();
    });
    host.appendChild(btn);
  }
}

function buildHeatStars() {
  const host = document.getElementById('heatStars');
  host.innerHTML = '';
  for (let i = 0; i < 5; i += 1) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '★';
    btn.className = i < state.heat ? 'on' : '';
    btn.setAttribute('aria-label', `Heat ${i + 1}`);
    btn.addEventListener('click', () => {
      state.heat = state.heat === i + 1 ? i : i + 1;
      commit(); buildHeatStars(); redraw();
    });
    host.appendChild(btn);
  }
}

function buildSizeButtons() {
  const host = document.getElementById('sizeList');
  host.innerHTML = '';
  for (const size of SIZES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'size-btn' + (size.id === state.sizeId ? ' active' : '');
    btn.textContent = size.name;
    btn.addEventListener('click', () => {
      state.sizeId = size.id;
      commit(); buildSizeButtons(); redraw();
    });
    host.appendChild(btn);
  }
}

function setLayout(id) {
  if (id === state.layoutId) return;
  const count = panelCount(id);
  const next = makePanels(count);
  state.panels.forEach((p, i) => { if (i < count) next[i] = { ...p }; });
  state.layoutId = id;
  state.panels = next;
  state.selected = Math.min(state.selected, count - 1);
  commit(); buildLayoutButtons(); redraw();
}

function syncControls() {
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('badgeInput').value = state.badge;
  document.getElementById('grainToggle').checked = state.grain;
  document.getElementById('vignetteToggle').checked = state.vignette;
  document.getElementById('halftoneToggle').checked = state.halftone;
  buildLayoutButtons(); buildGradeButtons(); buildHeatStars(); buildSizeButtons();
  renderStrip(); syncHistoryButtons();
}

// ---------- photos ----------

function renderStrip() {
  const host = document.getElementById('photoStrip');
  host.innerHTML = '';
  if (!pool.length) {
    const empty = document.createElement('div');
    empty.className = 'strip-empty';
    empty.textContent = 'No photos yet — add your own or load a bundled sample.';
    host.appendChild(empty);
    return;
  }
  pool.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb' + (i === state.selectedPhoto ? ' active' : '');
    const img = document.createElement('img');
    img.src = photo.img.src;
    img.alt = photo.label;
    const label = document.createElement('span');
    label.textContent = photo.label;
    btn.append(img, label);
    btn.addEventListener('click', () => {
      state.selectedPhoto = i;
      renderStrip();
    });
    host.appendChild(btn);
  });
}

function addPhoto(img, label) {
  pool.push(makePhoto(img, label));
  state.selectedPhoto = pool.length - 1;
  renderStrip();
  return pool.length - 1;
}

async function loadSample(key) {
  if (sampleCache.has(key)) return sampleCache.get(key);
  const img = await loadImageFromUrl(`samples/${key}.jpg`);
  const label = key === 'pier' ? 'Sample · Pier' : 'Sample · Boulevard';
  const idx = addPhoto(img, label);
  sampleCache.set(key, idx);
  return idx;
}

function wirePhotoControls() {
  document.getElementById('photoInput').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      try {
        const img = await loadImageFromFile(file);
        addPhoto(img, file.name.replace(/\.[^.]+$/, ''));
      } catch { /* skip unreadable files */ }
    }
    if (files.length) {
      status.textContent = `${pool.length} photo(s) in the strip. Pick a panel, then assign.`;
      commit();
    }
    e.target.value = '';
  });
  document.getElementById('samplePierBtn').addEventListener('click', async () => { await loadSample('pier'); commit(); });
  document.getElementById('sampleBlvdBtn').addEventListener('click', async () => { await loadSample('boulevard'); commit(); });
  document.getElementById('assignBtn').addEventListener('click', () => {
    if (state.selectedPhoto < 0) { status.textContent = 'Choose a photo in the strip first.'; return; }
    state.panels[state.selected] = { ...state.panels[state.selected], photo: state.selectedPhoto };
    commit(); redraw();
  });
  document.getElementById('fillBtn').addEventListener('click', () => {
    if (state.selectedPhoto < 0) { status.textContent = 'Choose a photo in the strip first.'; return; }
    state.panels = fillPanelsWithOnePhoto(state.panels, state.selectedPhoto);
    commit(); redraw();
  });
  document.getElementById('altBtn').addEventListener('click', () => {
    if (pool.length < 2) { status.textContent = 'Load at least two photos to alternate.'; return; }
    state.panels = alternatePanels(state.panels, pool.map((_, i) => i));
    commit(); redraw();
  });
}

// ---------- canvas interaction ----------

function canvasPoint(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - rect.left) / rect.width) * canvas.width,
    y: ((evt.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function wireCanvas() {
  let dragging = null;
  canvas.addEventListener('pointerdown', (evt) => {
    const pt = canvasPoint(evt);
    const idx = panelAt(getLayout(state.layoutId), canvas.width, canvas.height, pt.x, pt.y);
    if (idx >= 0) {
      state.selected = idx;
      dragging = { x: evt.clientX, y: evt.clientY };
      canvas.setPointerCapture(evt.pointerId);
      redraw();
    }
  });
  canvas.addEventListener('pointermove', (evt) => {
    if (!dragging) return;
    const panel = state.panels[state.selected];
    if (!panel || panel.photo < 0) return;
    const rect = canvas.getBoundingClientRect();
    const dx = ((evt.clientX - dragging.x) / rect.width) * 2.2;
    const dy = ((evt.clientY - dragging.y) / rect.height) * 2.2;
    dragging = { x: evt.clientX, y: evt.clientY };
    panel.ox = Math.min(0.6, Math.max(-0.6, panel.ox + dx));
    panel.oy = Math.min(0.6, Math.max(-0.6, panel.oy + dy));
    redraw();
  });
  const endDrag = () => { if (dragging) { dragging = null; commit(); } };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (evt) => {
    evt.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Math.min(4, Math.max(1, panel.zoom * (evt.deltaY < 0 ? 1.07 : 0.93)));
    clampCrop(panel);
    redraw();
    syncPanelInfo();
  }, { passive: false });
  document.getElementById('zoomRange').addEventListener('input', (e) => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Number(e.target.value);
    redraw(); syncPanelInfo();
  });
  document.getElementById('zoomRange').addEventListener('change', commit);
}

// ---------- text / toggles / history ----------

function wireTextControls() {
  const bind = (id, key) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => { state[key] = el.value; redraw(); });
    el.addEventListener('change', commit);
  };
  bind('titleInput', 'title');
  bind('subtitleInput', 'subtitle');
  bind('badgeInput', 'badge');
  const bindToggle = (id, key) => {
    document.getElementById(id).addEventListener('change', (e) => {
      state[key] = e.target.checked;
      commit(); redraw();
    });
  };
  bindToggle('grainToggle', 'grain');
  bindToggle('vignetteToggle', 'vignette');
  bindToggle('halftoneToggle', 'halftone');
  document.getElementById('undoBtn').addEventListener('click', () => {
    if (historyIndex > 0) { historyIndex -= 1; restore(history[historyIndex]); syncHistoryButtons(); }
  });
  document.getElementById('redoBtn').addEventListener('click', () => {
    if (historyIndex < history.length - 1) { historyIndex += 1; restore(history[historyIndex]); syncHistoryButtons(); }
  });
  document.getElementById('randomBtn').addEventListener('click', () => {
    state.panels = state.panels.map((p, i) => {
      if (p.photo < 0) return p;
      const d = DRIFTS[Math.floor(Math.random() * DRIFTS.length)];
      void i;
      return { ...p, zoom: d.zoom, ox: d.ox, oy: d.oy };
    });
    commit(); redraw();
  });
}

// ---------- export ----------

function exportPng() {
  const size = currentSize();
  const out = document.createElement('canvas');
  out.width = size.w;
  out.height = size.h;
  drawCover(out, view(false));
  out.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    status.textContent = `Saved cover-${size.w}x${size.h}.png — post it anywhere.`;
  }, 'image/png');
}

// ---------- shot scenes ----------

async function applyScene(scene) {
  state.layoutId = scene.layoutId;
  state.gradeId = scene.gradeId;
  state.title = scene.title;
  state.subtitle = scene.subtitle ?? '';
  state.badge = scene.badge ?? '';
  state.heat = scene.heat ?? 0;
  state.grain = true;
  state.vignette = true;
  state.halftone = scene.halftone ?? false;
  const sizeEntry = SIZES.find((s) => s.w === scene.size.w && s.h === scene.size.h);
  state.sizeId = sizeEntry ? sizeEntry.id : 'square';
  const indices = {};
  for (const key of new Set(scene.panelPhotos)) {
    indices[key] = await loadSample(key);
  }
  state.panels = makePanels(panelCount(scene.layoutId));
  state.panels = state.panels.map((panel, i) => {
    const key = scene.panelPhotos[i % scene.panelPhotos.length];
    const crop = (scene.crops && scene.crops[i]) || DRIFTS[i % DRIFTS.length];
    return { photo: indices[key], zoom: crop.zoom, ox: crop.ox, oy: crop.oy };
  });
  state.selected = 0;
  state.selectedPhoto = indices[scene.panelPhotos[0]];
  if (scene.coverOnly) document.body.classList.add('shot-cover');
  canvas.width = scene.size.w;
  canvas.height = scene.size.h;
  // Keep state.size in step with the scene even for sizes outside SIZES.
  drawCover(canvas, view(!scene.coverOnly));
  syncControls();
  drawCover(canvas, view(!scene.coverOnly));
  syncPanelInfo();
}

async function markReady() {
  try { await document.fonts.ready; } catch { /* fonts are progressive */ }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__shotReady = true;
}

// ---------- boot ----------

function initEditor() {
  buildLayoutButtons(); buildGradeButtons(); buildHeatStars(); buildSizeButtons();
  wirePhotoControls(); wireCanvas(); wireTextControls();
  document.getElementById('exportBtn').addEventListener('click', exportPng);
  commit();
  redraw();
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  buildLayoutButtons(); buildGradeButtons(); buildHeatStars(); buildSizeButtons();
  runShot(shot, params, { applyScene, markReady });
} else {
  initEditor();
}

export { emptyPanel };
