// main.js — the studio itself: state, controls, and the render loop.
//
// One state object describes the cover; every control edits it and asks
// for a render, and cover.js does the drawing. Renders are scheduled on
// the next animation frame so dragging through a text field does not
// posterize the photograph thirty times a second (the art is cached
// anyway — only the lettering is cheap enough to redraw freely).
//
// With ?shot=N in the URL the studio boots straight into one of shots.js's
// scenes instead: cover scenes hide the chrome for a clean photograph of
// the cover, the editor scene keeps everything on show.

import { GRADES, gradeById } from './grades.js';
import { LAYOUTS, SIZES, layoutById, sizeById } from './layouts.js';
import { SAMPLES, loadSample, loadFromFile, dragHasPhoto, photoFromDrop } from './photos.js';
import { drawCover, forgetArtwork } from './cover.js';
import { sceneFromQuery } from './shots.js';

const canvas = document.getElementById('cover');
const stage = document.getElementById('stage');
const statusLine = document.getElementById('statusLine');
const photoLabel = document.getElementById('photoLabel');

const state = {
  image: null,
  photoKey: 'sample:boulevard',
  gradeId: 'vice-sunset',
  layoutId: 'hero-strip',
  sizeId: 'portrait',
  title: 'VICE PANELS',
  script: 'Cover Studio',
  caption: 'THE CITY IS YOURS — MIND THE PARKING',
  lines: ['25 PAGES OF NEON', 'THE HEAT IS ON: A FIELD GUIDE', 'PLUS: BOATS, BADGES & BETRAYAL'],
  issue: 'Nº 06',
  price: '$6.66',
};

let renderQueued = false;
function render() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    if (!state.image) return;
    drawCover(canvas, state);
    const size = sizeById(state.sizeId);
    statusLine.textContent =
      `${size.width} × ${size.height} · ${gradeById(state.gradeId).name} · ${layoutById(state.layoutId).name}`;
  });
}

/** Point the studio at a new photograph and render with it. */
async function setPhoto(image, key, label) {
  state.image = image;
  state.photoKey = key;
  forgetArtwork();
  photoLabel.textContent = label;
  render();
}

// ------------------------------------------------------------------ chips

/**
 * Build a radiogroup of chip buttons into `host`. `options` are
 * { id, name, blurb? }; `current` is the selected id; `onPick(id)` fires
 * on selection. Chips are real buttons: tab reaches the group, arrows
 * move within it, space and enter choose.
 */
function buildChips(host, options, current, onPick) {
  host.replaceChildren();
  options.forEach((option) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.id = option.id;
    chip.setAttribute('role', 'radio');
    chip.setAttribute('aria-checked', String(option.id === current));
    if (option.id === current) chip.classList.add('on');
    const name = document.createElement('span');
    name.className = 'chip-name';
    name.textContent = option.name;
    chip.append(name);
    if (option.blurb) {
      const blurb = document.createElement('span');
      blurb.className = 'chip-blurb';
      blurb.textContent = option.blurb;
      chip.append(blurb);
    }
    chip.addEventListener('click', () => selectChip(host, chip, onPick));
    host.append(chip);
  });
  host.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const chips = [...host.querySelectorAll('.chip')];
    const at = chips.indexOf(document.activeElement);
    if (at < 0) return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const next = chips[(at + step + chips.length) % chips.length];
    next.focus();
    selectChip(host, next, onPick);
  });
}

function selectChip(host, chip, onPick) {
  host.querySelectorAll('.chip').forEach((other) => {
    other.classList.toggle('on', other === chip);
    other.setAttribute('aria-checked', String(other === chip));
  });
  onPick(chip.dataset.id);
}

/** Mark the chip for `id` selected without firing the pick handler. */
function syncChips(host, id) {
  host.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('on', chip.dataset.id === id);
    chip.setAttribute('aria-checked', String(chip.dataset.id === id));
  });
}

// ------------------------------------------------------------------ build

const gradeChips = document.getElementById('gradeChips');
const layoutChips = document.getElementById('layoutChips');
const sizeChips = document.getElementById('sizeChips');
const sampleButtons = document.getElementById('sampleButtons');

buildChips(gradeChips, GRADES, state.gradeId, (id) => { state.gradeId = id; render(); });
buildChips(layoutChips, LAYOUTS, state.layoutId, (id) => { state.layoutId = id; render(); });
buildChips(sizeChips, SIZES.map((s) => ({ id: s.id, name: s.name, blurb: s.use })), state.sizeId,
  (id) => { state.sizeId = id; render(); });

SAMPLES.forEach((sample) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sample-btn';
  button.textContent = sample.name;
  button.addEventListener('click', async () => {
    const image = await loadSample(sample.id);
    setPhoto(image, `sample:${sample.id}`, `Sample — ${sample.name}`);
  });
  sampleButtons.append(button);
});

document.getElementById('photoFile').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const { image, id, label } = await loadFromFile(file);
  setPhoto(image, id, label);
});

stage.addEventListener('dragover', (event) => {
  if (!dragHasPhoto(event)) return;
  event.preventDefault();
  stage.classList.add('dropping');
});
stage.addEventListener('dragleave', () => stage.classList.remove('dropping'));
stage.addEventListener('drop', async (event) => {
  event.preventDefault();
  stage.classList.remove('dropping');
  const file = photoFromDrop(event);
  if (!file) return;
  const { image, id, label } = await loadFromFile(file);
  setPhoto(image, id, label);
});

// ------------------------------------------------------------------ texts

const textFields = [
  ['titleInput', 'title'],
  ['scriptInput', 'script'],
  ['captionInput', 'caption'],
  ['issueInput', 'issue'],
  ['priceInput', 'price'],
];
for (const [id, key] of textFields) {
  const input = document.getElementById(id);
  input.value = state[key];
  input.addEventListener('input', () => { state[key] = input.value; render(); });
}
const linesInput = document.getElementById('linesInput');
linesInput.value = state.lines.join('\n');
linesInput.addEventListener('input', () => {
  state.lines = linesInput.value.split('\n');
  render();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vice-panels-${state.sizeId}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
});

// ------------------------------------------------------------------ boot

/** Push a shots.js scene into the state and the form, for ?shot=N boots. */
function applyScene(scene) {
  Object.assign(state, {
    gradeId: scene.state.gradeId,
    layoutId: scene.state.layoutId,
    sizeId: scene.state.sizeId,
    title: scene.state.title,
    script: scene.state.script,
    caption: scene.state.caption,
    lines: [...scene.state.lines],
    issue: scene.state.issue,
    price: scene.state.price,
  });
  syncChips(gradeChips, state.gradeId);
  syncChips(layoutChips, state.layoutId);
  syncChips(sizeChips, state.sizeId);
  for (const [id, key] of textFields) document.getElementById(id).value = state[key];
  linesInput.value = state.lines.join('\n');
  document.body.classList.add(scene.mode === 'cover' ? 'shot-cover' : 'shot-editor');
  return scene.state.photo;
}

async function boot() {
  const scene = sceneFromQuery(location.search);
  const sampleId = scene ? applyScene(scene) : 'boulevard';
  try {
    await Promise.race([
      Promise.all([document.fonts.load('100px Anton'), document.fonts.load('100px Yellowtail')]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch { /* lettering falls back to system fonts, still fine */ }
  const image = await loadSample(sampleId);
  await setPhoto(image, `sample:${sampleId}`, `Sample — ${sampleId}`);
  document.fonts?.ready.then(() => render());
  if (scene) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.dataset.shotReady = '1';
    }));
  }
}

boot();
