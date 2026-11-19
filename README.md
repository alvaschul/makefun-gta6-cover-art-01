# VICE PANELS · Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/alvaschul/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/alvaschul/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A GTA 6-style cover art maker that runs entirely in the browser. Give it a
photograph and a headline; it hands back a multi-panel, ink-outlined,
sunset-graded magazine cover, ready to post. No accounts, no uploads, no
build step — your photo never leaves the page.

Built for the make.fun bounty **gta6-cover-art-01** ("Make GTA 6 Cover Art").

## Run it

```sh
node serve.ts            # serves app/ on http://localhost:8080
# or: node serve.ts --port 4173
```

Then open the page, pick a photo, and start shouting in headline form.

To package the entry dossier exactly as the bounty grades it:

```sh
node main.ts                       # writes ./output/dossier.json
MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
```

## What it does

- **Photo in, three ways** — file picker, drag-and-drop onto the cover, or
  two bundled samples (Boulevard, Pier).
- **Poster pipeline** — the photo is posterized into flat ink bands,
  outlined with Sobel edge ink and band-cliff strokes, screened with a
  halftone dot pattern in the shadows, and finished with print grain and a
  vignette. It reads as cover art, not as a filtered photo.
- **Four color grades** — Vice Sunset (the flagship: indigo, magenta,
  gold), Neon Rain, Midnight Cruise, and the faded Golden Hour '84.
- **Four panel layouts** — Hero Strip, Quad Grid, Triptych and Front Page.
  Every panel crops a different window of the same art and wears a rotated
  tag chip ("VICE CITY", "THE GETAWAY", "ACT I"…).
- **Full magazine furniture** — gradient Anton masthead with a Yellowtail
  script flourish, issue line, starred cover lines, a starburst price
  badge, a barcode that almost scans, and a caption bar along the foot.
  Every word is editable.
- **Post-ready sizes** — Portrait 4:5 (1080×1350), Square 1:1 (1080×1080)
  and Story 9:16 (1080×1920), exported as a full-size PNG in one click.

## Deterministic screenshots

The scenes in `app/src/shots.js` are complete cover states addressed by
URL — `app/?shot=1` … `?shot=4`. Cover scenes hide the studio chrome so a
headless browser photographs the bare cover; `?shot=2` keeps the whole
editor in frame. `shots.json` at the root is the manifest of the four
renders in `screenshots/`, the first of which is the entry's cover.

## Layout of the code

| File | Job |
| --- | --- |
| `main.ts` | Entrypoint: copies `app/` + `screenshots/` to the output dir and writes `dossier.json` via the kit's `vendor/makefun-app.ts`. |
| `serve.ts` | Tiny static server for `app/` (kit-provided). |
| `app/src/main.js` | Studio state, controls, drag-and-drop, export, shot-mode boot. |
| `app/src/cover.js` | Cover composition: panels, frames, masthead, badges, barcode, caption bar. |
| `app/src/poster.js` | The posterize/ink/halftone/grain pipeline (seeded, deterministic). |
| `app/src/grades.js` | The four color grades: ramps, ink, paper, pipeline knobs. |
| `app/src/layouts.js` | Output sizes and the four panel layouts. |
| `app/src/photos.js` | Photo sources: samples, file picker, drag-and-drop. |
| `app/src/shots.js` | The four screenshot scenes. |

## Fonts

Anton and Yellowtail are bundled as WOFF2 under `app/fonts/` and licensed
under the SIL Open Font License 1.1 — see `app/fonts/OFL.txt`.

## License

MIT — see `LICENSE`.
