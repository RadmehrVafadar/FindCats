---
name: Find the Cats
description: Graphite travel illustrations on ivory paper, with quiet controls.
colors:
  paper: "#f5f0e6"
  ink: "#484738"
  quiet: "#716c5e"
  accent: "#53634e"
  control: "#faf7ef"
  control-hover: "#e9e5d8"
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
  caption:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  button: "4px"
  controls: "6px"
spacing:
  compact: "10px"
  regular: "16px"
  wide: "24px"
components:
  zoom-controls:
    backgroundColor: "{colors.control}"
    textColor: "{colors.ink}"
    rounded: "{rounded.controls}"
  zoom-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0 10px"
  zoom-button-hover:
    backgroundColor: "{colors.control-hover}"
  progress:
    textColor: "{colors.ink}"
    typography: "{typography.progress}"
  completion:
    textColor: "{colors.accent}"
    typography: "{typography.caption}"
  retry-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.quiet}"
    padding: "10px 18px"
---

# Design System: Find the Cats

## Overview

**Creative North Star: "The Travel Sketchbook"**

Detailed graphite streetscapes on textured ivory paper carry the experience.
Small, restrained controls leave the portrait artwork dominant, while muted green acknowledges progress and keyboard focus.

**Key Characteristics:**

- Portrait travel illustrations with cats integrated into the architecture.
- Warm paper, graphite text, and a restrained botanical accent.
- A small location heading, counter, zoom cluster, and caption.

## Colors

The palette extends the warmth and low saturation of the pencil artwork.

### Primary

- **Botanical Green** (`accent`) identifies completion, focus outlines, and editor accents.

### Neutral

- **Ivory Paper** (`paper`) surrounds the artwork and backs retry controls.
- **Graphite Ink** (`ink`) carries headings, counters, and controls.
- **Warm Pencil** (`quiet`) softens the game name, instructions, and loading messages.
- **Pale Paper** (`control`) lifts the zoom cluster slightly above the image.
- **Pressed Paper** (`control-hover`) gives enabled zoom buttons their hover state.

## Typography

Self-hosted Lora, with Georgia and serif fallbacks, gives the location heading its bookish character.
Self-hosted DM Sans, with a sans-serif fallback, keeps controls and counters compact.
The location title uses the title token; the adjacent game name is italic Lora at (15px), with normal letter spacing.
Progress uses tabular numerals, and the footer uses the caption token.
At the phone breakpoint, the title becomes (22px), game name (14px), progress (13px), and caption (10px).

## Layout

The centered game column has a portrait image ratio of (2:3).
Desktop width is the minimum of viewport width minus (48px), viewport height minus (124px) converted to the image ratio, and (760px).
The desktop header is (70px) high and footer reserves at least (54px).
At widths up to (600px), the column uses the minimum of full width and viewport height minus (110px) converted to the image ratio, with a (62px) header and (48px) footer.
Phone text has (16px) horizontal padding while the image can reach the column edges.
At widths up to (340px), the adjacent game name and extended instruction disappear.
Short landscape viewports up to (500px) high use a maximum column width of (500px), with (32px) total horizontal clearance.

## Elevation & Depth

Two low-contrast shadows distinguish physical paper from floating controls.
The picture uses `0 7px 32px #58462d0c`; the zoom cluster uses `0 3px 15px #32271220`.
The artwork itself supplies most depth and texture.

## Shapes

The portrait artwork retains square edges.
Only the compact zoom cluster and its buttons use the gently curved radius tokens.
Cat tap polygons and reveal polygons remain independent, so forgiving targets do not lighten the surrounding scene.

## Components

### Picture and cat reveal

The SVG preserves artwork coordinates while supporting pinch zoom, dragging, and keyboard controls.
A found cat lightens through a clipped copy of the original image, fading in over (650ms) with `cubic-bezier(.16,1,.3,1)`.
Reduced-motion preferences remove this animation.

### Progress and completion

A small outline cat icon accompanies a tabular found-count fraction.
Completion turns the counter and footer botanical green, presents an underlined next-picture action, and advances automatically after (2200ms).

### Zoom controls

A pale paper cluster sits at the lower-right image corner, inset by (12px) on desktop and (10px) on phones.
Buttons are at least (40px) wide and (42px) high on desktop, increasing to (44px) square on phones.
Disabled controls use (0.35) opacity; focus uses a (2px) accent outline with (4px) offset.

### Loading and retry

Centered italic Lora text sits above the picture while it opens.
An image failure exposes a square, quiet-bordered retry button using the paper background.

## Do's and Don'ts

### Do:

- **Do** keep portrait graphite artwork visually dominant.
- **Do** use the existing paper, pencil, and botanical roles for interface elements.
- **Do** preserve lightweight controls and visible keyboard focus.
- **Do** lighten found cats within their reveal outlines.

### Don't:

- **Don't** surround the game with a landing page, navigation, account flow, or dashboard.
- **Don't** add decorative containers that compete with the artwork.
- **Don't** turn cat feedback into a bright fill over the surrounding scene.
