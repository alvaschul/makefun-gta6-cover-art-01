// VICE PANELS · Cover Studio — the editor's wiring.
//
// Holds the one cover state, renders it through cover.js whenever anything
// changes, and handles photo intake (picker, samples, drag-and-drop) and
// the PNG export. A ?shot=N URL swaps the editor for a fixed scene instead
// (see shots.js), which is how the entry's screenshots are reproduced.

import { GRADES, gradeById } from './grades.js';
import { LAYOUTS, layoutById } from './layouts.js';
import { SIZES, sizeById, drawCover } from './cover.js';
import { SAMPLES, loadPhoto, loadPhotoFile, dragHasFiles } from './photos.js';
import { sceneFromUrl, sceneState } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const status = $('status');

const state = {
  photo: null,
  grade: gradeById('vice-sunset'),
  layout: layoutById('hero-stack'),
  size: sizeById('portrait'),
  title: 'VICE PANELS',
  accent: 'cover studio',
  lines: ['ONE PHOTO IN, COVER OUT', 'INKED, PANELLED, READY TO POST'],
  issue: 'ISSUE 01 · COVER STUDIO',
};

let renderQueued = false;
function render() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    if (state.photo) drawCover(canvas, state);
  });
}

function setStatus(text) {
  status.textContent = text;
}

function fillSelect(select, items, currentId) {
  select.replaceChildren(
    ...items.map((item) => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.name;
      opt.selected = item.id === currentId;
      return opt;
    }),
  );
}

async function usePhoto(img, label) {
  state.photo = img;
  await document.fonts.ready;
  render();
  setStatus(`${label} loaded — the cover updates as you edit.`);
}

async function useSample(id) {
  const sample = SAMPLES.find((s) => s.id === id) ?? SAMPLES[0];
  setStatus(`Loading ${sample.label.toLowerCase()}…`);
  usePhoto(await loadPhoto(sample.src), sample.label);
}

function wireControls() {
  fillSelect($('grade'), GRADES, state.grade.id);
  fillSelect($('layout'), LAYOUTS, state.layout.id);
  fillSelect($('size'), SIZES, state.size.id);
  $('grade-blurb').textContent = state.grade.blurb;

  $('grade').addEventListener('change', (e) => {
    state.grade = gradeById(e.target.value);
    $('grade-blurb').textContent = state.grade.blurb;
    render();
  });
  $('layout').addEventListener('change', (e) => {
    state.layout = layoutById(e.target.value);
    render();
  });
  $('size').addEventListener('change', (e) => {
    state.size = sizeById(e.target.value);
    render();
  });

  const bindText = (id, apply) => {
    $(id).addEventListener('input', (e) => {
      apply(e.target.value);
      render();
    });
  };
  bindText('title', (v) => (state.title = v));
  bindText('accent', (v) => (state.accent = v));
  bindText('line1', (v) => (state.lines[0] = v));
  bindText('line2', (v) => (state.lines[1] = v));
  bindText('issue', (v) => (state.issue = v));

  document.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', () => useSample(btn.dataset.sample));
  });

  $('photo-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(`Loading ${file.name}…`);
    usePhoto(await loadPhotoFile(file), file.name);
  });

  const stage = $('stage');
  stage.addEventListener('dragover', (e) => {
    if (!dragHasFiles(e)) return;
    e.preventDefault();
    stage.classList.add('dragging');
  });
  stage.addEventListener('dragleave', () => stage.classList.remove('dragging'));
  stage.addEventListener('drop', async (e) => {
    e.preventDefault();
    stage.classList.remove('dragging');
    const file = e.dataTransfer?.files?.[0];
    if (file) usePhoto(await loadPhotoFile(file), file.name);
  });

  $('export').addEventListener('click', () => {
    if (!state.photo) return;
    drawCover(canvas, state);
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-panels-${state.size.w}x${state.size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus(`Exported a ${state.size.w} × ${state.size.h} PNG.`);
    }, 'image/png');
  });
}

// Put the controls and the state in step with a scene (or the defaults).
function applyWords(words) {
  state.title = words.title;
  state.accent = words.accent;
  state.lines = [...words.lines];
  state.issue = words.issue;
  $('title').value = words.title;
  $('accent').value = words.accent;
  $('line1').value = words.lines[0] ?? '';
  $('line2').value = words.lines[1] ?? '';
  $('issue').value = words.issue;
}

async function start() {
  wireControls();
  const scene = sceneFromUrl(window.location.href);
  if (scene) {
    const words = sceneState(scene);
    state.grade = gradeById(words.gradeId);
    state.layout = layoutById(words.layoutId);
    state.size = sizeById(words.sizeId);
    applyWords(words);
    fillSelect($('grade'), GRADES, state.grade.id);
    fillSelect($('layout'), LAYOUTS, state.layout.id);
    fillSelect($('size'), SIZES, state.size.id);
    $('grade-blurb').textContent = state.grade.blurb;
    document.body.classList.add(scene.editor ? 'shot-editor' : 'shot-cover');
    await useSample(scene.sample);
    return;
  }
  await useSample('boulevard');
}

start().catch((err) => setStatus(`Something went wrong: ${err.message}`));
