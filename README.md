# DeClaw Architecture

Independent home for an interactive Anatomy illustration of DeClaw. This repository keeps visualization code and assets outside the application repository.

## Status

Repository initialized. The Anatomy illustration has not been implemented yet.

## Source of truth

Application: https://github.com/NgoHung0704/DeClaw

DeClaw is one local Python application, with a separate Ollama service and one local subprocess per loaded plugin. SQLite and ChromaDB are storage dependencies, not HTTP microservices.

Implemented areas to illustrate:

- Typer CLI and REPL; LangGraph agent loop.
- Typed tool registry, human approval for non-READ operations, workspace file tools.
- Document indexing, content-hash catalog, embeddings, retrieval and citations.
- Plugin host and doc-intel subprocess communicating through NDJSON over stdio.
- External-content sanitizer using a separate classifier session; unsafe content quarantine.
- Episodic and semantic memory, SQLite records, ChromaDB vectors, OS keyring.
- Audit events and the core-process HTTP observer.

The FastAPI gateway, connected desktop UI and shell sandbox are planned, not part of the working CLI path.

## Illustration plan

Use Anatomy: https://github.com/wheresryan22/anatomy (MIT).

Build a detailed isometric document-processing workbench: an input tray, agent controller, approval gate, document-processing station, isolated plugin bay, storage drawers, model unit and audit recorder. Selecting each mechanism reveals its actual software responsibility and source references. Guided playback will cover file reads, approved changes, indexing and document retrieval. Playback is an explanatory simulation, not execution telemetry.

Ship a standalone interactive HTML page with SVG geometry, light/dark themes, keyboard controls and reduced-motion support. Keep application source and document contents out of this repository; link to source paths and record the source commit when the figure is built.

## Hosting

This repository starts private. GitHub Pages is not enabled. Choose hosting and visibility after reviewing the completed visualization.
