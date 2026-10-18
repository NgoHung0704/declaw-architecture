# Verification — 2026-10-18

## Source review

Pinned DeClaw revision: `2f37214e73cbbdadc8d037ce78d6c0e81a73a1ed`.

Reviewed README, agent graph, model wiring, tool registry/confirmation, document session/indexer/search and core HTTP observer. Checked all 36 unique linked paths exist in the source checkout. No application files were changed. The existing unrelated `.claude/settings.json` edit was left alone.

## Geometry

`npm run audit`: **audit passed**.

- 80 real rounded-slab solids, 80 items, 225 measured overlap/order constraints.
- Zero unsupported solids, hanging parts, sunk pairs, depth-order violations or shapes with inadequate drawing coverage.
- No tubes, cables, exploded states or 3D rotations are drawn; no such modes are claimed as validated.
- The assembled rest pose is the only geometry pose. Playback changes selected mechanism, not geometry.
- Anatomy line-end checks: **0 of 30 ends on 86 lines float**, both light and dark.
- Inspected both themes at normal scale and 4× across both halves of the entire mechanism, including drawer/handle contacts, press uprights, audit platen, inset slots, tray walls and corner fasteners.

## Behavior

`npm test`: **4/4** meaningful model tests passed. Invariants include refusal before filesystem execution, quarantine before agent observations, and storage before catalog commit.

`npm run test:browser`: **13/13** assertions passed in headless Chrome at 1440px.

`npm run test:browser:reduced`: **13/13** assertions passed at 390px with reduced motion.

Coverage: physical SVG pointer selection; all 12 inspectors; keyboard navigation; all four complete journeys; denied writes; unsafe read/retrieval branches; quick playback; timed progression or manual reduced-motion progression; pause; theme toggle; hash restoration; horizontal overflow. Browser console clean.

Full-page and figure screenshots checked on desktop and phone. Inspector text, controls and source links remain within the viewport. Generated screenshots and actions are ignored under `.verification/`; the reviewed preview is committed under `assets/preview.png`.

## Limits

These checks validate the illustration, not the DeClaw runtime. Guided journeys intentionally simplify control flow and show representative success/denial/quarantine paths, not every exception, retry, permission grant or audit scheduling detail. No model, document parser or application backend is executed by the page.
