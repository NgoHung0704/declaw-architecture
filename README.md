# DeClaw Atlas

A top-down, interactive map of DeClaw. Each software responsibility has a district and a functional landmark: a neural brain, a memory cabinet with a key vault, a document processor, a permission gate, a plugin connector, and more. Click a district to zoom into its source-backed functions and classes.

The layout follows responsibilities and dependencies: **CLI at the left → Brain in the centre → Tools and Workspace at the right**. Memory and Ollama sit above the coordination layer; Documents, Storage and Plugins form the lower data area. Brain and Documents are larger to establish the hierarchy of the map. Parcel area is an editorial choice, not a resource measurement.

All visualization code lives in this independent repository. Nothing is added to the DeClaw application.

![DeClaw Atlas](assets/preview.png)

## Open

Open **index.html** in a browser, or run `npm run dev` and visit http://127.0.0.1:4174. The HTML is self-contained: no install, backend, credentials, model service or external fonts. `index-dark.html` starts in dark mode. GitHub displays HTML source; download the files or use a local preview. The repository remains private; Pages is not enabled.

## Explore

- Click a district or its name below the map. The camera eases into the district and reveals its internal graph. Click a function to zoom closer and inspect its responsibility, inputs, outputs and exact source line.
- Drag to pan. Use the wheel, two-finger pinch, or + / − to zoom. Wheel zoom stays anchored to the cursor. The ⊡ button fits the whole current level. Narrow panels start at a readable neighbourhood scale; pan to adjacent districts or use ⊡ for the complete map.
- Follow the arrows from OUT ports to IN ports. Click a wire to highlight both endpoints, fit them into view, and inspect the typed relationship. Calls, data/dependencies, branches and construction/registration use different line patterns. Hover a district to reveal its neighbours; **Tất cả đường nối** reveals the complete overview wiring.
- **Toàn màn hình** expands the workspace, automatically collapsing the inspector. Native fullscreen is used when available; embedded browsers that reject it retain a full-window layout. The same button or Escape returns to the normal workspace. F toggles fullscreen when the map has focus.
- **Thông tin** opens or closes the inspector. It is a column on wide screens and a dismissible drawer on narrow screens; opening the narrow drawer pauses playback. Both layouts have keyboard-accessible source symbol and relation lists.
- A minimap appears when the overview is zoomed in. Click it to recenter, or use Enter on it to fit the overview. Escape clears a symbol/wire selection, then returns to the overview; it closes a narrow drawer or fullscreen first. Arrow keys pan, + / − zoom, Home fits, and Tab + Enter opens a district or symbol.
- **Theo dấu yêu cầu** lives inside the map frame, below the canvas so it never covers a district. Four simulations cover reads, approved writes, indexing and retrieval. Numbered map badges show the order of visits; the active district and its inspector follow the selected step. The footer can be collapsed, reset or cleared. A highlighted architecture wire is used only when a matching relation exists; consecutive scenario steps do not invent direct software calls.
- Denied writes stop before filesystem execution. Unsafe reads/retrieved chunks are withheld. Reduced motion uses immediate camera changes and manual playback steps.
- Hash URLs preserve district, symbol or wire, flow, outcome, step and active trace mode. Old `view=open` URLs still resolve. Browser Back/Forward follows district navigation.

The map contains **12 districts**, **20 inter-district relations**, **76 symbol references to 60 distinct definitions**, and **72 internal relations**. A definition may appear in multiple responsibility views. Static SVG exports are in `assets/declaw-light.svg` and `assets/declaw-dark.svg`.

## Source grounding

Source snapshot: [NgoHung0704/DeClaw at 2f37214](https://github.com/NgoHung0704/DeClaw/tree/2f37214e73cbbdadc8d037ce78d6c0e81a73a1ed). The map is curated against this revision, not a live dependency scanner or telemetry display.

Districts represent responsibilities. Most modules share one local Python process. Ollama is a separate model service; each loaded plugin has a subprocess worker communicating through NDJSON stdio. SQLite and ChromaDB are local storage dependencies. The picture does not represent twelve microservices.

The inspector preserves scope: indexing does not classify the whole corpus; retrieval screens top-k chunks. Chroma text payload encryption does not encrypt vectors or all metadata. The core httpx observer is not an OS firewall. Memory views do not claim every memory type is automatically injected into every agent turn. FastAPI gateway, connected desktop and shell sandbox are deferred work.

No application source, user documents or secrets are bundled. Source links require access to the DeClaw repository.

## Build and verify

Node.js 20.10+; no npm dependencies:

```sh
npm run build
npm test
npm run test:browser
npm run test:browser:reduced
npm run test:layout
node scripts/check-sources.mjs /path/to/DeClaw
```

Browser integration tests use a temporary headless Chromium profile and exercise actual mouse dragging, mouse scroll gestures, two-contact touch input and native fullscreen. The short-screen layout check also verifies the fallback when native fullscreen is rejected. Window size matches device emulation so native fullscreen does not leave the input widget at a different size. Set `CHROME_PATH` if discovery fails. Reports and test screenshots are ignored under `.verification/`. See [verification notes](docs/verification.md).

| File | Purpose |
| --- | --- |
| `model.mjs` | Component descriptions, source revision and pure request simulations |
| `internals.mjs` | Source definitions, contracts and typed internal relations |
| `map.mjs` | Semantic landmarks, district layout, orthogonal routing and SVG rendering |
| `app.js`, `style.css` | Camera, transitions, gestures, inspector, playback and responsive themes |
| `scripts/build.mjs` | Standalone light/dark HTML and SVG exports |
| `docs/map.json` | Generated district/node coordinates and relation routes |

## Anatomy attribution

This study began with the [Anatomy](https://github.com/wheresryan22/anatomy) geometry kit. Versions 1–2 explored an isometric machine; version 3 follows the requested top-down map with purpose-built SVG landmarks. Earlier renderers remain in Git history. Vendored Anatomy files and their license remain under `vendor/anatomy`; its Chrome startup helper is used by the integration tests. The current page does not load the 3D kit.
