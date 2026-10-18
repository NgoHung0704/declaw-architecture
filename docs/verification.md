# Verification — Hero 02, 2026-10-18

## Source grounding

Pinned application revision: `2f37214e73cbbdadc8d037ce78d6c0e81a73a1ed`.

`node scripts/check-sources.mjs /path/to/DeClaw` verified 76 chip references, representing 60 distinct qualified class/function definitions across 34 files. Each source line was checked against its qualified Python definition, including nested closures and class methods. Component-level source references were also checked. No application files were changed; the unrelated `.claude/settings.json` edit was left alone.

The twelve internal graphs contain 72 relationships. They distinguish actual calls, supplied data/dependencies, conditional branches and construction/registration. The plugin view includes both core host/IPC functions and the worker's `DocIntelPlugin.parse` and `chunk_blocks`.

## Geometry and motion

Anatomy's recorder, measured depth-order solver and geometry audit passed for the processor and all twelve circuit boards. The final expanded plugin board was additionally rechecked.

- Processor: 76 true recorded solids; 391 measured overlaps/order constraints.
- Circuit boards: 208 solids in total. Six-node boards contain 17 solids; eight-node boards contain 19.
- Every scene had zero unsupported solids, sunk pairs, stand-in shapes, depth violations or collisions in the checked states.
- Covers were checked at nine depth states and 31 intermediate opening positions, including assembled and raised poses.
- The build also enforces a continuous clearance invariant: stationary geometry ends at z=30; the cover starts at z=30 and translates only upward by 102*t for t in [0,1]. It therefore cannot intersect stationary geometry at any opening/closing/reversal position between the samples. Since the camera looks down, an overlapping cover remains in front of the stationary parts throughout its lift.
- Printed circuit traces are planar software annotations, not physical 3D tubes. Their terminal pads, routing and insulated-looking crossings are checked separately from solid geometry.

`npm run test:lines` passed all 26 cases: the whole machine and all twelve opened boards in both themes. Every case reported zero floating line ends. Invisible hit regions, duplicate under-strokes and animated pulse overlays were excluded from endpoint analysis so they could not falsely provide support for their own trace.

## Behavior

| Check | Result |
| --- | --- |
| Pure journey, branch and internal-graph tests | 6/6 |
| Existing journey browser assertions, 1440px | 13/13 |
| Existing journey assertions, 390px + reduced motion | 13/13 |
| Deep inspection assertions, 1440px | 43/43 |
| Deep inspection assertions, 390px + reduced motion | 42/42 |
| Source definition references | 76/76 |
| Line-end cases | 26/26 |

Browser coverage includes physical SVG selection, all twelve inspectors/graphs, symbol contracts, source-line links, two-endpoint wire highlighting, individual signal animation, zoom/fit, interrupting a camera transition, reversing a cover mid-close without replacing its visible object, opening another compartment while a prior close is pending, layered Escape navigation, exact-symbol hash restoration, all four request journeys and the denial/quarantine outcomes. Browser consoles were clean; no horizontal overflow was found in either viewport.

## Visual review

Reviewed whole-page desktop and phone screenshots, selected-compartment views, opened boards, all twelve internal graphs in light/dark contact sheets, and motion contact sheets for zoom and cover opening. Inspected the entire processor and both shared circuit-board geometries at 4x in both themes. Checked housing seams, tray/rail contacts, printed sheets, fastening points, chip packages/pin marks, trace endings/crossings and text placement.

Reviewed preview images are committed in `assets/preview.png` and `assets/inside-documents.png`. Temporary actions, screenshots and contact sheets are ignored under `.verification/`.

## Scope

These are checks of the illustration, not tests of the DeClaw runtime. No model or document parser is executed by this page. The circuit graphs show selected real definitions and representative relationships, not every function or failure path in the application. Physical compartment/board shapes are explanatory metaphors, not a literal electronics design, deployment diagram or performance measurement.
