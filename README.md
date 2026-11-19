[![make.fun — Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![Entry rank](https://make.fun/badge/gta6-cover-art-01/alvaschul/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![Entry reward](https://make.fun/badge/gta6-cover-art-01/alvaschul/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

# VICE PANELS · Cover Studio

An offline web app that turns any photo and a few words into GTA 6-style
multi-panel cover art — flat inked panels, a sunset or neon colour grade,
big masthead lettering — and exports it as a PNG ready to post.

Everything runs in the browser from the files in `app/`. Photos are read on
your own machine and never uploaded; there is no build step and no network
call.

## Run it

Serve `app/` with any static file server and open `index.html` in a desktop
browser. From the repository root, the kit's helper does it:

```
node serve.ts
```

then visit http://localhost:8080.

## Hand it in (make.fun)

```
MAKEFUN_OUTPUT_DIR=/tmp/vice-out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and
writes `dossier.json` there with the kit's `buildDossier`, so the dossier
is byte for byte the one the scorer rebuilds from the same files.

## How a cover is made

1. **Photo** — pick a file, drag one onto the cover, or start from a bundled
   sample (a boulevard and a pier, both made for this app and free to use).
2. **Look** — choose a colour grade and a panel layout. The photo is cut
   into flat ink bands along the grade's colour ramp, its edges are found
   and burned back in as comic ink outlines, and a whisper of print grain
   goes over the top. Each panel crops a different moment of the one photo,
   so a single picture fills the whole cover.
3. **Words** — the masthead title (Anton, filled with the grade's sunset),
   a script accent (Yellowtail), two cover lines and an issue line, all
   editable, with a barcode drawn from the cover's own words.
4. **Export** — one click writes the PNG at the chosen post size.

## Grades

- **Vice Sunset** — magenta dusk, tangerine light, teal shadows.
- **Neon Night** — wet-asphalt blues under cyan and hot pink.
- **Golden Strip** — sepia heat: umber, amber, cream.
- **Ink Noir** — seven greys, no colour, straight comic ink.

## Panel layouts

- **Hero Stack** — one wide scene over two close-ups.
- **Quad Grid** — four beats of the same photo, dawn to vice hour.
- **Tall Story** — a tall lead panel with three details down the side.
- **Triptych** — three vertical acts.

## Post sizes

- Portrait post — 1080 × 1350
- Square post — 1080 × 1080
- Story — 1080 × 1920
- Wide banner — 1920 × 1080

## Screenshots

`screenshots/` holds four captures described in `shots.json`. They are
reproducible: serve the app and open `index.html?shot=1` … `?shot=4`.
Scenes 1, 3 and 4 are exported covers; scene 2 shows the editor at work.
The scene definitions live in `app/src/shots.js`.

## Files

- `main.ts` — the entry program: copies the app and screenshots out and
  writes the dossier.
- `serve.ts` — the kit's static server for trying the app locally.
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged.
- `app/index.html`, `app/style.css` — the page and its styling.
- `app/src/main.js` — editor wiring: state, intake, export, shot mode.
- `app/src/cover.js` — cover composition: panels, masthead, barcode.
- `app/src/poster.js` — the poster pipeline: banding, ink edges, grain.
- `app/src/grades.js` — the four colour grades as ink ramps.
- `app/src/layouts.js` — the four panel layouts and their crops.
- `app/src/photos.js` — photo loading: files, drag-and-drop, samples.
- `app/src/shots.js` — the four fixed screenshot scenes.
- `app/fonts/` — Anton and Yellowtail, bundled under the SIL Open Font
  License 1.1 (see `app/fonts/OFL.txt`).
- `app/samples/` — the two bundled sample photos.

## Originality

VICE PANELS is an original studio tool. It uses no Rockstar Games logo,
wordmark, artwork, character or font, and is not affiliated with Rockstar
Games or the Grand Theft Auto series. The bundled fonts are open-licensed
typefaces, credited above.

## License

MIT — see `LICENSE`.
