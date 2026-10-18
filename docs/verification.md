# Verification — top-down atlas

- Build: standalone light/dark HTML and SVG, with no runtime dependencies or remote assets.
- Model + map tests: 8 passing cases covering denial/quarantine branches, store-before-catalog ordering, all source graph references, distinct district landmarks, and all 92 orthogonal routes attaching OUT to IN without crossing node interiors.
- Source definitions: 76 references across 34 Python files match exact qualified definitions and line numbers in the pinned local DeClaw checkout (60 distinct definitions).
- Browser: 57 desktop assertions at 1440 × 1100 and 56 narrow-panel assertions at 390 × 900 with reduced motion passed. Checks cover all 12 graphs, source contracts, layer visibility, mouse pan, cursor-anchored wheel zoom, real two-contact pinch, symbol zoom, relation endpoint highlighting, interrupting transitions, legacy deep links, flows, denial/quarantine scenarios, dark mode and horizontal overflow. Runtime exceptions are collected and fail the suite.
- Screenshots: overview, Documents internals, focused Memory symbol in dark mode and final map are captured in `.verification/`. Reviewed preview images are copied to `assets/`.

Camera and signal motion respect `prefers-reduced-motion`. Hidden tabs stop playback and selected-wire animation. Wire pulses are bounded rather than a continuous background animation.

These checks verify the curated explanatory model and interface. They do not execute DeClaw, prove every possible application call, or guarantee security detection. Source snapshot and the scope notes in the inspector remain authoritative.
