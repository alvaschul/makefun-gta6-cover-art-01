// photos.js — where a cover's photographs come from.
//
// Two sample photos ship with the app (made for it, free to use); the
// person's own photos arrive through the file picker or drag-and-drop and
// are read on their own machine only — nothing is ever uploaded.

export const SAMPLES = [
  { id: 'boulevard', src: 'samples/boulevard.jpg', name: 'Boulevard' },
  { id: 'pier', src: 'samples/pier.jpg', name: 'Pier' },
];

let counter = 0;

function toPhoto(img, id, name) {
  return { id, img, name, w: img.naturalWidth, h: img.naturalHeight };
}

export function loadSample(sample) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(toPhoto(img, `sample-${sample.id}`, sample.name));
    img.onerror = () => reject(new Error(`could not load ${sample.src}`));
    img.src = sample.src;
  });
}

export function loadFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      counter += 1;
      const name = file.name.replace(/\.[^.]+$/, '') || 'My photo';
      resolve(toPhoto(img, `file-${counter}`, name));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`could not read ${file.name}`));
    };
    img.src = url;
  });
}

export function isImageFile(file) {
  return file && typeof file.type === 'string' && file.type.startsWith('image/');
}
