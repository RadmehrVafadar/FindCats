---
name: Find the Cats
description: Graphite travel illustrations on ivory paper, with an unboxed cat counter.
colors:
  paper: "#f5f0e6"
  ink: "#484738"
  quiet: "#716c5e"
  accent: "#53634e"
  control: "#faf7ef"
typography:
  title:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "23px"
    fontWeight: 400
    letterSpacing: "-0.025em"
  progress:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
spacing:
  compact: "10px"
  regular: "16px"
  wide: "24px"
components:
  progress:
    textColor: "{colors.ink}"
    typography: "{typography.progress}"
  completion:
    textColor: "{colors.accent}"
    typography: "{typography.progress}"
  retry-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.quiet}"
    padding: "10px 18px"
---

# Design System: Find the Cats

## Overview

**Creative North Star: "The Travel Sketchbook"**

Detailed graphite streetscapes on textured ivory paper carry the experience.
An unboxed counter leaves the portrait artwork dominant, while muted green acknowledges completion and keyboard focus.

**Key Characteristics:**

- Portrait travel illustrations with cats integrated into the architecture.
- Warm paper, graphite text, and a restrained botanical accent.
- A small cat icon and counter directly over the artwork, with no surrounding game chrome.

## Colors

The palette extends the warmth and low saturation of the pencil artwork.

### Primary

- **Botanical Green** (`accent`) identifies completion, focus outlines, and editor accents.

### Neutral

- **Ivory Paper** (`paper`) surrounds the artwork and backs retry controls.
- **Graphite Ink** (`ink`) carries headings, counters, and controls.
- **Warm Pencil** (`quiet`) softens loading messages and retry actions.
- **Pale Paper** (`control`) backs development editor fields and controls.

## Typography

Self-hosted Lora, with Georgia and serif fallbacks, gives loading messages and the editor heading their bookish character.
Self-hosted DM Sans, with a sans-serif fallback, keeps controls and counters compact.
Progress uses tabular numerals and the progress token.
At the phone breakpoint, progress becomes (13px).

## Layout

The centered game column has a portrait image ratio of (2:3).
Its width is the minimum of the full viewport width and the small viewport height converted to the image ratio.
The artwork reaches the top of the viewport and fills the limiting dimension without cropping cats or stretching the drawing.
No height is reserved for a heading, footer, or zoom controls.
The counter sits inside the top-right image corner, inset by (16px) or the relevant device safe area, whichever is larger.
Phones and short landscape screens use the same proportional fit.

## Elevation & Depth

One low-contrast shadow distinguishes physical paper from the surrounding page.
The picture uses `0 7px 32px #58462d0c`.
The counter has no background, border, shadow, or container decoration.
The artwork itself supplies most depth and texture.

## Shapes

The portrait artwork retains square edges.
Retry and editor controls also keep square edges.
Cat tap polygons and reveal polygons remain independent, so forgiving targets do not lighten the surrounding scene.

## Components

### Picture and cat reveal

The SVG preserves artwork coordinates while supporting pinch zoom, dragging, and keyboard controls.
A found cat lightens through a clipped copy of the original image, fading in over (650ms) with `cubic-bezier(.16,1,.3,1)`.
Reduced-motion preferences remove this animation.

### Progress and completion

A small outline cat icon accompanies a tabular found-count fraction.
The overlay lets pointer input pass through to the illustration.
Completion turns the counter botanical green and advances automatically after (2200ms).
Pinch and keyboard zoom remain available without visible zoom buttons.

### Loading and retry

Centered italic Lora text sits above the picture while it opens.
An image failure exposes a square, quiet-bordered retry button using the paper background.
Keyboard focus uses a (2px) accent outline with (4px) offset on controls and (5px) offset around the picture.

## Do's and Don'ts

### Do:

- **Do** keep portrait graphite artwork visually dominant.
- **Do** use the existing paper, pencil, and botanical roles for interface elements.
- **Do** preserve lightweight controls and visible keyboard focus.
- **Do** lighten found cats within their reveal outlines.

### Don't:

- **Don't** surround the game with a landing page, navigation, account flow, or dashboard.
- **Don't** add decorative containers that compete with the artwork.
- **Don't** add a location heading, footer instructions, or visible zoom controls to the game.
- **Don't** turn cat feedback into a bright fill over the surrounding scene.
