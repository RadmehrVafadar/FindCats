# Find the Cats

A quiet hidden-cat game in a travel sketchbook, drawn in graphite on warm ivory paper.

![Find the Cats: ten places, sixty cats, take your time.](docs/images/cover.svg)

![Seoul fills the available height, with a light cat counter clearly visible over its dark tiled eaves.](docs/images/gameplay.png)

## Features

- Ten places to explore, including Amsterdam, Prague, Chefchaouen, Havana, and Seoul.
- Six cats in every drawing, with a gentle pencil-lightening reveal.
- An unboxed cat counter that switches between light and dark ink as you explore.
- Pinch and drag to look closer, or use the keyboard.
- Find all six to travel onward; pictures shuffle without repeating, including on refresh.
- A development-only editor for tracing cat outlines and forgiving tap regions.

## Quick start

Requires Node.js 24 or later.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.
The polygon editor lives at `/editor` during development.
Build with `npm run build`, then serve `dist/` at `/` or reverse-proxy it under `/find-cats/`.
Asset URLs are relative, so the same build works at either location.
Both `/find-cats` and `/find-cats/` work without a redirect; forward their requests with the prefix stripped, as described in [proxy setup](docs/gameplay.md#deployment-and-proxy-setup).
Fonts and artwork are bundled locally; playing needs no account, API key, or backend.

## A closer look

Tap or click a cat to find it.
On a touch screen, pinch to zoom and drag to explore.
With the picture focused, use `+` / `-` to zoom, arrow keys to pan, and `0` to reset.

Run `npm run lint` and `npm test` for code and geometry checks.
Install Chromium and WebKit with `npx playwright install chromium webkit`, then run `npm run test:e2e` for desktop and phone gameplay checks.

## Docs

- [Gameplay and artwork](docs/gameplay.md) - scene data, interaction, storage, and adding illustrations.
- [Design system](DESIGN.md) - ivory paper, graphite, botanical green, and an interface that stays out of the picture.
