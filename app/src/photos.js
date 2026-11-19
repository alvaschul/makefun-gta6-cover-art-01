// Photo intake: the bundled samples and the visitor's own pictures.
//
// Photos are read on this machine only. A picked file becomes an object URL
// in this tab and is never uploaded anywhere; the samples ship with the app.

export const SAMPLES = [
  { id: 'boulevard', src: 'samples/boulevard.jpg', label: 'Sample — Boulevard' },
  { id: 'pier', src: 'samples/pier.jpg', label: 'Sample — Pier' },
];

// Load an image from a URL inside the app and wait until it can be drawn.
export function loadPhoto(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load photo: ${src}`));
    img.src = src;
  });
}

// Load a visitor's own file the same way, from a throwaway object URL.
export function loadPhotoFile(file) {
  const url = URL.createObjectURL(file);
  return loadPhoto(url).then(
    (img) => img,
    (err) => {
      URL.revokeObjectURL(url);
      throw err;
    },
  );
}

// True when a drag event is carrying files, so the stage can light up.
export function dragHasFiles(event) {
  return [...(event.dataTransfer?.types ?? [])].includes('Files');
}
