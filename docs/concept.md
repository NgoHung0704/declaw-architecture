# Atlas design

The overview is a top-down map of responsibilities. Functional landmarks carry the meaning: Brain's neuron connections, Memory's cabinet and vault lock, Tools' wrench and screwdriver, Documents' sheets and chunking station, Sanitizer's shield and filter, Approval's checkpoint, Workspace's folder, Storage's SQL cylinder and vector nodes, Ollama's model chip, Plugins' connector, Audit's event ledger and the CLI terminal.

The visual hierarchy is district → source symbol → relation. A district opens directly into its graph through a camera transition and crossfade at the district's map position. Functions have left IN and right OUT ports; district-wide input and output bands explain the overall contract. Selected connections fit both endpoint cards and highlight only the relevant relationship. The inspector provides full explanations and pinned source links when map labels are abbreviated.

District routes are curated relationships. Calls point to the callee; awaited results return to the caller. Other patterns identify data/dependencies, conditional branches and construction/registration. Routes avoid all node interiors and attach to their visible ports. Crossings and shared routes can occur; selection isolates each relation. This is not a literal network deployment, circuit or runtime trace.

Both map levels support dragging, cursor-anchored wheel zoom, pinch zoom, fit and keyboard navigation. Transitions start from the visible camera pose and can be cancelled by gestures or replaced by a new district selection. Narrow panels start closer, with the complete scene always available through Fit. Node selection zooms closer, while full contracts remain accessible through the inspector.

The source model remains deliberately separate from the renderer. Architecture descriptions and internal references are tied to DeClaw revision `2f37214e73cbbdadc8d037ce78d6c0e81a73a1ed`. All content is curated; changes in DeClaw require updating and verifying the model.
