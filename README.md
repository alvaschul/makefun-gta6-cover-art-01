[![make.fun — GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![make.fun rank](https://make.fun/badge/gta6-cover-art-01/alvaschul/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![make.fun reward](https://make.fun/badge/gta6-cover-art-01/alvaschul/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

# VICE PANELS · Cover Studio

A GTA 6-style cover art maker that runs entirely in the browser. Give it a
photo and a caption and it hands back a multi-panel poster cover — your
photo flattened into inked comic art, framed in heavy black panels, under
a sunset-gradient masthead — exported as a PNG in the sizes social posts
actually use. No uploads, no accounts, no network: your photos never
leave your machine.

## Run it

Serve the `app/` folder with any static file server and open it in a
desktop browser. The kit's own server is the shortest path:

```
node serve.ts
```

then open http://localhost:8080. That is the whole setup — there is no
build step and nothing to install.

## What it does

- **Any photo.** Use the two bundled samples (a boulevard and a pier,
  made for this app), pick files from your machine, or drag photos
  straight onto the cover. One photo can fill every panel, or several
  photos can share the cover — click a panel to select it, click a photo
  in the tray to place it there, drag on the cover to reframe, scroll or
  use the slider to zoom.
- **Inked poster art, not a filter.** Each photo is graded, posterized
  into flat colour bands, and run through an edge pass that pulls its
  outlines toward ink black, with a whisper of print grain over the top
  (`app/src/poster.js`).
- **Four colour grades.** Vice Sunset (the flagship magenta-to-tangerine
  sunset), Neon Rain, Golden Hour and Midnight Chrome — each re-grades
  the art, the sky, the masthead and the ink together
  (`app/src/grades.js`).
- **Six panel layouts.** Solo Splash, Split Duo, Top Story Trio, Four-Up
  Grid, Vice Grid and Film Strips, each panel wearing its little rotated
  tag — COVER STORY, EXCLUSIVE, FIRST LOOK (`app/src/layouts.js`).
- **Real cover furniture.** A gradient Anton masthead with an ink stroke,
  a Yellowtail script accent, editable title / accent / issue line /
  cover lines, and a barcode in the corner for the magazine feel
  (`app/src/cover.js`).
- **Post sizes.** Square 1080×1080, portrait 1080×1350, wide 1920×1080
  and story 1080×1920. The Export PNG button downloads the cover at full
  size; the preview you have been editing is the same drawing the export
  makes, so what you see is what you post.

## Screenshots

`screenshots/` holds four renders of the fixed scenes in
`app/src/shots.js`: open the app with `?shot=1` … `?shot=4` to reproduce
them exactly. `shots.json` lists each file with its caption and capture
size. The first is a wide exported cover; the second is the editor with
a photo loaded; the third and fourth are portrait and story covers.

## How it is put together

| File | Job |
| --- | --- |
| `app/index.html` | The page: top bar, control panel, stage. |
| `app/style.css` | The studio's dark newsstand styling and the bundled fonts. |
| `app/src/main.js` | Wiring: controls, photo tray, panel editing, export, shot scenes. |
| `app/src/cover.js` | Composing a cover: panels, masthead, cover lines, barcode, PNG export. |
| `app/src/poster.js` | The grade → posterize → ink → grain photo pipeline. |
| `app/src/grades.js` | The four colour grades. |
| `app/src/layouts.js` | The six panel layouts. |
| `app/src/photos.js` | Sample photos and reading the visitor's own photos. |
| `app/src/shots.js` | The deterministic `?shot=N` scenes behind the screenshots. |
| `main.ts` | Hands the entry in: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`. |

## Fonts

The masthead face is Anton and the script accent is Yellowtail, both
bundled under `app/fonts/` and both licensed under the SIL Open Font
License 1.1 — see `app/fonts/OFL.txt`. Everything else about the app is
original: no game artwork, logos or fonts are used anywhere.

## Handing it in

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```

writes `out/app/`, `out/screenshots/` and `out/dossier.json`.
