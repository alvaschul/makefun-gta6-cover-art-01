// main.js — wires the studio together: controls, canvas, photos, export.
//
// The flow is deliberately short: pick a photo (or use a sample), pick a
// grade and a layout, type your cover words, export the PNG. Panels can
// be clicked to select them, dragged to reframe their photo, and filled
// from the photo tray. In ?shot=N mode the studio applies one of the
// fixed scenes from shots.js instead, so screenshots are reproducible.

import { GRADES } from './grades.js';
import { LAYOUTS, layoutById } from './layouts.js';
import { SAMPLES, isImageFile, loadFile, loadSample } from './photos.js';
import { SIZES, createState, drawCover, exportPNG, panelAt, sizeById } from './cover.js';
import { shotFromLocation } from './shots.js';

const state = createState();
const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');

const shot = shotFromLocation();
let samplePhotos = {}; // sample id -> photo, once loaded

function ensurePanelArrays() {
  const count = layoutById(state.layoutId).panels.length;
  while (state.panelPhoto.length < count) {
    const next = state.photos.length ? state.panelPhoto.length % state.photos.length : 0;
    state.panelPhoto.push(next);
  }
  while (state.pans.length < count) state.pans.push({ x: 0, y: 0, zoom: 1 });
  if (state.selectedPanel >= count) state.selectedPanel = 0;
}

function render() {
  ensurePanelArrays();
  const size = sizeById(state.sizeId);
  if (canvas.width !== size.w) canvas.width = size.w;
  if (canvas.height !== size.h) canvas.height = size.h;
  const inShotCover = shot && shot.mode === 'cover';
  drawCover(ctx, state, { highlight: inShotCover ? null : state.selectedPanel });
  syncTray();
  const zoom = $('zoom');
  if (zoom) zoom.value = String(state.pans[state.selectedPanel]?.zoom ?? 1);
}

// ---------------------------------------------------------------- controls

function segmented(container, items, current, onPick, renderButton) {
  container.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seg' + (item.id === current ? ' active' : '');
    b.dataset.id = item.id;
    renderButton(b, item);
    b.addEventListener('click', () => onPick(item.id));
    container.appendChild(b);
  }
}

function buildControls() {
  segmented($('layoutBtns'), LAYOUTS, state.layoutId, (id) => {
    state.layoutId = id;
    buildControls();
    render();
  }, (b, item) => {
    b.textContent = item.name;
    b.title = `${item.panels.length} panel${item.panels.length > 1 ? 's' : ''}`;
  });

  segmented($('gradeBtns'), GRADES, state.gradeId, (id) => {
    state.gradeId = id;
    buildControls();
    render();
  }, (b, item) => {
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = `linear-gradient(180deg, ${item.sky.join(', ')})`;
    const label = document.createElement('span');
    label.textContent = item.name;
    b.append(sw, label);
    b.title = item.blurb;
  });

  segmented($('sizeBtns'), SIZES, state.sizeId, (id) => {
    state.sizeId = id;
    buildControls();
    render();
  }, (b, item) => {
    b.textContent = `${item.name} · ${item.w}×${item.h}`;
  });
}

function syncTray() {
  const tray = $('tray');
  tray.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb' + (state.panelPhoto[state.selectedPanel] === i ? ' active' : '');
    const img = document.createElement('img');
    img.src = photo.img.src;
    img.alt = '';
    const label = document.createElement('span');
    label.textContent = photo.name;
    b.append(img, label);
    b.title = `Put ${photo.name} in the selected panel`;
    b.addEventListener('click', () => {
      state.panelPhoto[state.selectedPanel] = i;
      render();
    });
    tray.appendChild(b);
  });
  const hint = $('panelHint');
  if (hint) {
    hint.textContent = state.photos.length
      ? `Panel ${state.selectedPanel + 1} of ${layoutById(state.layoutId).panels.length} — drag the cover to reframe it, scroll to zoom.`
      : 'Add a photo to begin.';
  }
}

async function addFiles(files) {
  for (const file of files) {
    if (!isImageFile(file)) continue;
    try {
      const photo = await loadFile(file);
      state.photos.push(photo);
      state.panelPhoto[state.selectedPanel] = state.photos.length - 1;
    } catch {
      /* a file we cannot read is simply not added */
    }
  }
  render();
}

function bindInputs() {
  $('fileInput').addEventListener('change', (e) => {
    addFiles([...e.target.files]);
    e.target.value = '';
  });
  for (const b of document.querySelectorAll('[data-sample]')) {
    b.addEventListener('click', () => {
      const photo = samplePhotos[b.dataset.sample];
      if (!photo) return;
      if (!state.photos.includes(photo)) state.photos.push(photo);
      state.panelPhoto[state.selectedPanel] = state.photos.indexOf(photo);
      render();
    });
  }
  const bindText = (id, apply) => {
    $(id).addEventListener('input', (e) => {
      apply(e.target.value);
      render();
    });
  };
  bindText('titleInput', (v) => (state.title = v));
  bindText('accentInput', (v) => (state.accent = v));
  bindText('issueInput', (v) => (state.issue = v));
  bindText('linesInput', (v) => (state.lines = v.split('\n')));
  $('zoom').addEventListener('input', (e) => {
    const pan = state.pans[state.selectedPanel];
    if (pan) pan.zoom = Number(e.target.value);
    render();
  });
  $('resetPan').addEventListener('click', () => {
    state.pans[state.selectedPanel] = { x: 0, y: 0, zoom: 1 };
    render();
  });
  $('exportBtn').addEventListener('click', async () => {
    const blob = await exportPNG(state);
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vice-panels-cover.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });

  const stage = $('stage');
  stage.addEventListener('dragover', (e) => {
    e.preventDefault();
    stage.classList.add('dropping');
  });
  stage.addEventListener('dragleave', () => stage.classList.remove('dropping'));
  stage.addEventListener('drop', (e) => {
    e.preventDefault();
    stage.classList.remove('dropping');
    addFiles([...e.dataTransfer.files]);
  });
}

function bindCanvas() {
  let drag = null;
  const toCover = (e) => {
    const rect = canvas.getBoundingClientRect();
    const size = sizeById(state.sizeId);
    return {
      x: ((e.clientX - rect.left) / rect.width) * size.w,
      y: ((e.clientY - rect.top) / rect.height) * size.h,
      dx: (e.movementX / rect.width) * size.w,
      dy: (e.movementY / rect.height) * size.h,
    };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = toCover(e);
    const size = sizeById(state.sizeId);
    const hit = panelAt(state, size.w, size.h, p.x, p.y);
    if (hit >= 0) state.selectedPanel = hit;
    drag = { x: p.x, y: p.y };
    canvas.setPointerCapture(e.pointerId);
    render();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toCover(e);
    const pan = state.pans[state.selectedPanel];
    if (pan) {
      pan.x = Math.max(-1, Math.min(1, pan.x - p.dx * 0.004));
      pan.y = Math.max(-1, Math.min(1, pan.y - p.dy * 0.004));
    }
    drag = { x: p.x, y: p.y };
    render();
  });
  const end = () => (drag = null);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const pan = state.pans[state.selectedPanel];
    if (!pan) return;
    pan.zoom = Math.max(1, Math.min(3, pan.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    render();
  }, { passive: false });
}

// ---------------------------------------------------------------- scenes

function applyScene(scene) {
  state.sizeId = scene.sizeId;
  state.gradeId = scene.gradeId;
  state.layoutId = scene.layoutId;
  state.title = scene.title;
  state.accent = scene.accent;
  state.issue = scene.issue;
  state.lines = [...scene.lines];
  state.panelPhoto = scene.photoIds.map((id) => {
    const photo = samplePhotos[id];
    return photo ? state.photos.indexOf(photo) : 0;
  });
  state.pans = scene.photoIds.map(() => ({ x: 0, y: 0, zoom: 1 }));
  state.selectedPanel = 0;
  if (scene.mode === 'cover') document.body.classList.add('shot');
  // Reflect the scene in the (possibly hidden) controls.
  $('titleInput').value = state.title;
  $('accentInput').value = state.accent;
  $('issueInput').value = state.issue;
  $('linesInput').value = state.lines.join('\n');
  buildControls();
}

async function boot() {
  buildControls();
  bindInputs();
  bindCanvas();
  try {
    const loaded = await Promise.all(SAMPLES.map((s) => loadSample(s)));
    loaded.forEach((photo, i) => {
      samplePhotos[SAMPLES[i].id] = photo;
    });
    state.photos = [samplePhotos.boulevard, samplePhotos.pier];
    state.panelPhoto = [0, 1, 0, 1];
  } catch {
    /* samples missing: the studio still opens, waiting for a photo */
  }
  if (shot) applyScene(shot);
  ensurePanelArrays();
  render();
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('100px Yellowtail'),
      document.fonts.ready,
    ]);
  } catch {
    /* fonts fall back to system faces; the render below still runs */
  }
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

boot();
