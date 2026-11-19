// photos.js — where cover photographs come from.
//
// Three doors in: the two sample photographs bundled with the app, a file
// the reader picks, and a file the reader drops on the stage. Every door
// hands back a loaded HTMLImageElement; object URLs are kept alive for the
// session (a cover may be re-rendered many times) and same-origin sample
// loads are cached so switching back and forth is instant.

/** The bundled sample photographs, paths relative to app/. */
export const SAMPLES = [
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier', src: 'samples/pier.jpg' },
];

const sampleMap = new Map(SAMPLES.map((sample) => [sample.id, sample]));

/** The sample with this id, or the first sample when the id is unknown. */
export function sampleById(id) {
  return sampleMap.get(id) ?? SAMPLES[0];
}

const cache = new Map();

/** Load an image from a URL, remembering it by URL for the session. */
export function loadFromUrl(src) {
  if (cache.has(src)) return cache.get(src);
  const pending = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`could not load ${src}`));
    image.src = src;
  });
  cache.set(src, pending);
  return pending;
}

/** Load one of the bundled sample photographs by id. */
export function loadSample(id) {
  return loadFromUrl(sampleById(id).src);
}

/**
 * Load a photograph from a reader-picked file. Resolves with
 * { image, id } where the id names the file so the UI can label it.
 */
export function loadFromFile(file) {
  const src = URL.createObjectURL(file);
  return loadFromUrl(src).then((image) => ({
    image,
    id: `file:${file.name}`,
    label: file.name,
  }));
}

/** Whether a drag event is carrying files the stage should accept. */
export function dragHasPhoto(event) {
  return [...(event.dataTransfer?.types ?? [])].includes('Files');
}

/** The first image file in a drop, or null when the drop holds none. */
export function photoFromDrop(event) {
  const files = [...(event.dataTransfer?.files ?? [])];
  return files.find((file) => file.type.startsWith('image/')) ?? files[0] ?? null;
}
