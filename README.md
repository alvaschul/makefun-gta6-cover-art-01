# VICE PANELS · Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/alvaschul/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard)
[![reward](https://make.fun/badge/gta6-cover-art-01/alvaschul/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns your own photos and a caption into GTA 6-style
cover art — the multi-panel poster look with bold display lettering and a
Vice City sunset / neon colour grade — and exports it as a PNG ready to post.
Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).
Everything is original: no Rockstar Games logos, artwork or fonts. Photos are
read locally in the browser and never uploaded anywhere.

## What it does

- **Six layouts** in relative coordinates, so they reflow to any export size:
  Classic Nine (the iconic 3×3 grid under a title block), Hero & Three,
  Cover Story (full-bleed hero with two tilted polaroid snapshots),
  Split Boulevard, Six Pack, and Full Bleed.
- **Any photo**: load several of your own photos (or the two bundled samples),
  click a panel to select it, drag to pan and scroll or slide to zoom each
  panel's crop independently, assign one photo per panel, fill every panel
  from a single photo with varied crops, or alternate photos across panels.
- **Six grades** painted on canvas: Vice Sunset, Neon Night, Golden Hour,
  Teal Heat, Noir Mono and Bleached — filter pass plus duotone sunset ramps,
  with optional film grain, vignette and a halftone title band.
- **Lettering**: editable display title (Anton, SIL OFL, vendored locally),
  a neon script subtitle (Yellowtail, SIL OFL), a 0–5 heat-star meter and an
  editable badge ribbon.
- **Fast export**: one click renders a PNG at 1080×1080, 1080×1350,
  1920×1080 or 1080×1920 (story). Undo/redo and a crop shuffler included.

## Run it

```sh
node serve.ts            # serves app/ on http://localhost:8080
```

Open the page, add photos, pick a layout and grade, letter your caption and
export. No build step, no network: every script, style, font and sample lives
under `app/`.

## Hand it in (make.fun plumbing)

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
`vendor/makefun-app.ts` library, exactly as the bounty kit requires:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`. The vendored fonts are under the SIL Open Font License
1.1; see `app/fonts/OFL.txt`.
