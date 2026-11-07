# Gameplay and artwork

Each picture is an original graphite-style illustration with six cat targets in its native image coordinates.

## Why

The illustration and targets must stay aligned during zooming and panning.
Each cat needs a forgiving touch area and an independent silhouette for its lightened reveal.

## How it works

`App.tsx` owns the scene queue and found cat IDs.
A new browser starts in Paris, with the other nine locations shuffled behind it.
The collection includes Venice, Kyoto, Lisbon, Istanbul, Amsterdam, Prague, Chefchaouen, Havana, and Seoul.
Completing a scene shows six of six and advances automatically after 2.2 seconds.
The unboxed cat icon and counter sit over the top-right of the illustration and let taps pass through to the artwork.
The counter samples a small patch of the underlying image, mapped through the current SVG viewBox, and chooses black or white ink for higher luminance contrast.
Camera changes, image loading, and resizing schedule at most one sample per animation frame.
Thin opposite-color edges keep the icon and fraction readable across pencil strokes and mixed light and dark details.
The picture uses the largest uncropped 2:3 rectangle that fits the viewport, with no space reserved for a header, footer, or zoom controls.
Refreshing also advances to the next queued scene.
Every available scene appears before the collection reshuffles, with no immediate repeat at a collection boundary.
The next queued illustration is preloaded.

`Picture.tsx` renders the artwork, tap polygons, and clipped reveal images inside one SVG viewBox.
An SVG color-transfer filter lifts dark pencil marks toward ivory instead of merely multiplying brightness.
Found IDs are deduplicated, and repeated clicks never increase progress.
Pointer movement beyond seven CSS pixels is treated as dragging.
Pinch gestures transform the same viewBox and suppress cat selection for the entire gesture.
Zoom ranges from 100% to 400%, clamped to the illustration bounds.

The counter announces progress to assistive technology.
The location remains available through the illustration and main landmark's accessible names.
Tab focuses individual cat targets; Enter or Space marks them found.
Focusing the picture enables arrow-key panning, plus/minus zooming, and zero to reset.
An SVG description provides instructions to assistive technology without adding visible text.
Reduced-motion preferences disable reveal animation.

## Tech

React and TypeScript with a Vite static build.
State is saved under `find-the-cats:v1` in localStorage.
Invalid stored values are discarded or filtered against current puzzle data.
Storage failures fall back to in-memory play.
Returning to a picture begins a fresh round; refreshing intentionally opens another picture.
Vite builds with `base: './'`, so scripts, styles, fonts, and illustrations resolve relative to the game document.
The same build supports a standalone root URL and a prefix-stripping reverse proxy at `/find-cats/`.

## Key files

- `src/puzzles.ts` - scene metadata, image dimensions, and cat polygons.
- `src/game.ts` - queue, validation, hit testing, and camera math.
- `src/App.tsx` - progress and automatic scene transitions.
- `src/Picture.tsx` - artwork, reveal filter, and input handling.
- `src/Progress.tsx` - unboxed progress and adaptive background contrast.
- `src/Editor.tsx` - development-only polygon tracing and JSON export.
- `public/assets/art/` - finished images and their exact generation prompts.
- `public/assets/fonts/` - bundled Lora and DM Sans fonts and licenses.
- `tests/game.test.ts` - state and geometry checks.
- `tests/game.spec.ts` - browser gameplay, gesture, and editor checks.
- `tests/assets.spec.ts` - production assets, gameplay, and refresh at `/` and behind a prefix-stripping `/find-cats/` proxy.

## Decisions and gotchas

Open `/editor` using the development server.
Choose an existing illustration or upload PNG, JPEG, or WebP artwork.
Enter its ID and location, add a cat, and trace at least three points around each region.
Save the precise reveal outline and the forgiving tap region separately.
Some cats use explicit tap regions to bridge narrow legs or a long tail while their reveal outlines follow the silhouettes.
Preview the puzzle to test the targets, then export JSON.
The editor keeps changes in memory until export; reloading discards unexported work.
Copy uploaded artwork into `public/assets/art/` using its original filename and add the exported record to `src/puzzles.ts`.
Replace artwork before tracing targets because image edits can move the cats.
Review every cat for recognizable anatomy, fair visibility, and accidental extra cats.

The built-in image generation tool produced all ten illustrations.
Exact prompts are stored in sibling `.prompt.txt` files.
The current artwork uses full-resolution PNGs, approximately 4.3 MB per scene.
Automated phone checks use Chromium device emulation; physical-phone playtesting and difficulty feedback are still needed.

## Deployment and proxy setup

Deploy `dist/` at the standalone Vercel origin root.
In the portfolio, keep the external rewrite `/find-cats/:path*` to `https://find-cats-nine.vercel.app/:path*`, including scripts, styles, fonts, and images.
Place it before any portfolio catch-all so asset requests cannot return portfolio HTML.
Redirect `/find-cats` to `/find-cats/` and preserve that trailing slash, since document-relative URLs otherwise resolve at the portfolio root.
Ensure the portfolio's slash normalization does not redirect `/find-cats/` back to `/find-cats`.
Do not add a portfolio-root `/assets/` rewrite; those paths belong to the portfolio.
No HTML response rewriting, CORS changes, or asset-host configuration is required.

`npm run test:e2e` builds once and checks both a root preview and an HTTP proxy that strips `/find-cats/`, rejects requests outside the mount, and preserves upstream content types.
Production checks load all ten illustrations, inspect script/style/font/image request paths, find cats, advance scenes, zoom, and refresh.
