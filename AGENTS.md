# Find the Cats

A minimal travel illustration game with six cats per scene.
Keep the artwork dominant and the player interface small.
Stack: React, TypeScript, SVG, and Vite.

## Commands

```bash
npm ci                                           # Install locked dependencies.
npm run dev                                      # Start the local game and development editor.
npm run lint                                     # Check TypeScript, React, and configuration files.
npm test                                         # Run state and geometry tests.
node --experimental-strip-types --test --test-name-pattern="zoom" tests/game.test.ts # Run a focused unit test.
npx playwright install chromium webkit           # Install the browsers required for E2E checks.
npm run test:e2e                                  # Run desktop and phone browser checks.
npm run test:e2e -- --grep "two-finger"            # Run one focused browser check.
npm run build                                    # Typecheck and build static output.
npm run preview                                  # Serve the production build.
```

## Repo map

```text
src/                 Game, scene data, editor, and styles.
public/assets/art/   Finished artwork and exact generation prompts.
public/assets/fonts/ Local fonts and their licenses.
tests/               State, geometry, and browser checks.
docs/                Implemented concepts and artwork workflow.
```

## Conventions

- Keep image dimensions and all cat polygons in the same native SVG coordinate system to prevent target drift.
- Keep tap regions and reveal outlines independent so touch forgiveness does not lighten the background.
- Gate the editor behind `import.meta.env.DEV` to exclude authoring tools from production.
- Finish artwork edits before tracing cat regions, then verify actual artwork coordinates in browser tests.
- Keep each long Markdown sentence on its own line for readable diffs.
- Leave changes staged and uncommitted; the user handles commits and merges.

## Docs

- Before changing interaction, persistence, puzzle data, or the editor, read `docs/gameplay.md`.
- Before changing interface styling, read `DESIGN.md` and `PRODUCT.md`.
