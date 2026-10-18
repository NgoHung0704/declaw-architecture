# Verification — top-down atlas

- Build: standalone light/dark HTML and SVG, with no runtime dependencies or remote assets.
- Model + map tests: 9 passing cases covering denial/quarantine branches, store-before-catalog ordering, all source graph references, distinct district landmarks, role-based placement, variable-size parcels without overlap, and all 92 orthogonal routes attaching to valid ports without crossing node interiors.
- Source definitions: 76 references across 34 Python files match exact qualified definitions and line numbers in the pinned local DeClaw checkout (60 distinct definitions).
- Browser: 69 desktop assertions at 1440 × 1100, 68 narrow-panel assertions at 390 × 900 with reduced motion, and 19 short-screen fallback assertions at 390 × 450 passed. Checks cover all 12 graphs, source contracts, layer visibility, mouse pan, cursor-anchored mouse scroll zoom, real two-contact pinch, symbol zoom, relation endpoint highlighting, interrupting transitions, legacy deep links, flows, denial/quarantine scenarios, dark mode and horizontal overflow. Runtime exceptions are collected and fail the suite.
- New layout checks cover label containment inside variable-size districts, a journey footer that never overlaps the canvas, numbered district visits, an inspector following the active step, native fullscreen entry/exit, automatic inspector collapse, playback controls remaining in view, keyboard exit, the narrow information drawer and the full-window fallback after a rejected native request.
- Screenshots: normal overview, fullscreen with a request trace, Documents internals, focused Memory symbol in dark mode and final map are captured in `.verification/`. Reviewed preview images are copied to `assets/`.

The headless browser's real window dimensions match device emulation. This matters when leaving native fullscreen: an emulated large page in a smaller real widget can otherwise put synthetic scroll coordinates outside the input bounds. The preview browser was also checked manually; wheel zoom remained functional after fullscreen entry and exit.

Camera and signal motion respect `prefers-reduced-motion`. Hidden tabs stop playback and selected-wire animation. Wire pulses are bounded rather than a continuous background animation.

These checks verify the curated explanatory model and interface. They do not execute DeClaw, prove every possible application call, or guarantee security detection. Source snapshot and the scope notes in the inspector remain authoritative.
