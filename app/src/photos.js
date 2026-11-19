// VICE PANELS — photo pool and per-panel crop state.
// A photo is { id, img, label } where img is a loaded HTMLImageElement.
// A panel state is { photo: index into the pool (or -1), zoom, ox, oy } —
// zoom multiplies the cover-fit scale, ox/oy shift the image centre as a
// fraction of the overflow, so -0.5..0.5 pans across the cropped area.

let nextPhotoId = 1;

export function makePhoto(img, label) {
  const photo = { id: nextPhotoId, img, label };
  nextPhotoId += 1;
  return photo;
}

export function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = url;
  });
}

export async function loadImageFromFile(file) {
  const url = URL.createObjectURL(file);
  try {
    return await loadImageFromUrl(url);
  } finally {
    // The bitmap is decoded once drawn; keep the object URL alive is not
    // needed after load in practice, but revoking too early can blank the
    // image in some browsers, so leave it for the session.
  }
}

export function emptyPanel(photoIndex = -1) {
  return { photo: photoIndex, zoom: 1, ox: 0, oy: 0 };
}

export function makePanels(count, photoIndex = -1) {
  return Array.from({ length: count }, () => emptyPanel(photoIndex));
}

// Spread one photo across every panel with a different crop each, the
// quickest way to a full cover from a single picture.
export function fillPanelsWithOnePhoto(panels, photoIndex) {
  const drifts = [
    { ox: -0.22, oy: -0.12, zoom: 1.25 },
    { ox: 0.2, oy: -0.2, zoom: 1.4 },
    { ox: 0, oy: 0.18, zoom: 1.15 },
    { ox: -0.28, oy: 0.1, zoom: 1.5 },
    { ox: 0.26, oy: 0.22, zoom: 1.3 },
    { ox: 0, oy: 0, zoom: 1.05 },
    { ox: -0.12, oy: 0.26, zoom: 1.45 },
    { ox: 0.14, oy: -0.26, zoom: 1.2 },
    { ox: 0, oy: -0.05, zoom: 1.6 },
  ];
  return panels.map((panel, i) => {
    const d = drifts[i % drifts.length];
    return { photo: photoIndex, zoom: d.zoom, ox: d.ox, oy: d.oy };
  });
}

// Alternate two (or more) photos across the panels, chessboard style.
export function alternatePanels(panels, photoIndices) {
  if (!photoIndices.length) return panels;
  return panels.map((panel, i) => ({
    ...panel,
    photo: photoIndices[i % photoIndices.length],
  }));
}

export function clampCrop(panel) {
  panel.zoom = Math.min(4, Math.max(1, panel.zoom));
  panel.ox = Math.min(0.6, Math.max(-0.6, panel.ox));
  panel.oy = Math.min(0.6, Math.max(-0.6, panel.oy));
  return panel;
}
