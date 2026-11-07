# Find the Cats

A quiet picture-first game about finding six cats in pencil drawings of Paris, Venice, and Kyoto.

## Features

- Cats gently lighten when found.
- The next picture loads automatically after all six are found.
- Pinch, drag, or use the zoom buttons to explore.
- Scenes shuffle without repeating, including on refresh.
- A development-only editor traces tap regions and reveal outlines.

## Quick start

Requires Node.js 24 or later.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.
The editor is at `/editor` during development and is excluded from production builds.

```bash
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview
```

The static production site is written to `dist/`.
No account, API key, backend, or runtime network service is required.

## Docs

- [Gameplay and artwork](docs/gameplay.md) - scene data, interaction, storage, and adding illustrations.
- [Design system](DESIGN.md) - the minimal picture-first interface.
