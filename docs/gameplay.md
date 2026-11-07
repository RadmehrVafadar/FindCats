# Gameplay and artwork

Each picture is an original graphite-style illustration with six cat targets in its native image coordinates.

## Why

The illustration and targets must stay aligned during zooming and panning.
Each cat needs a forgiving touch area and an independent silhouette for its lightened reveal.

## How it works

`App.tsx` owns the scene queue and found cat IDs.
A new browser starts in Paris, with Venice and Kyoto shuffled behind it.
Completing a scene displays a short message and advances automatically after 2.2 seconds.
The next-picture button can advance immediately during that pause.
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
Tab focuses individual cat targets; Enter or Space marks them found.
Focusing the picture enables arrow-key panning, plus/minus zooming, and zero to reset.
Reduced-motion preferences disable reveal animation.

## Tech

React and TypeScript with a Vite static build.
State is saved under `find-the-cats:v1` in localStorage.
Invalid stored values are discarded or filtered against current puzzle data.
Storage failures fall back to in-memory play.
Returning to a picture begins a fresh round; refreshing intentionally opens another picture.
Fonts and illustrations are served locally.

## Key files

- `src/puzzles.ts` - scene metadata, image dimensions, and cat polygons.
- `src/game.ts` - queue, validation, hit testing, and camera math.
- `src/App.tsx` - progress and automatic scene transitions.
- `src/Picture.tsx` - artwork, reveal filter, and input handling.
- `src/Editor.tsx` - development-only polygon tracing and JSON export.
- `public/art/` - finished images and their exact generation prompts.
- `public/fonts/` - bundled Lora and DM Sans fonts and licenses.
- `tests/game.test.ts` - state and geometry checks.
- `tests/game.spec.ts` - browser gameplay, gesture, and editor checks.

## Decisions and gotchas

Open `/editor` using the development server.
Choose an existing illustration or upload PNG, JPEG, or WebP artwork.
Enter its ID and location, add a cat, and trace at least three points around each region.
Save the precise reveal outline and the forgiving tap region separately.
Preview the puzzle to test the targets, then export JSON.
The editor keeps changes in memory until export; reloading discards unexported work.
Copy uploaded artwork into `public/art/` using its original filename and add the exported record to `src/puzzles.ts`.
Replace artwork before tracing targets because image edits can move the cats.
Review every cat for recognizable anatomy, fair visibility, and accidental extra cats.

The built-in image generation tool produced the three illustrations.
Exact prompts are stored in sibling `.prompt.txt` files and embedded in each PNG's metadata.
The current artwork uses full-resolution PNGs, approximately 4.3 MB per scene.
Automated phone checks use Chromium device emulation; physical-phone playtesting and difficulty feedback are still needed.
