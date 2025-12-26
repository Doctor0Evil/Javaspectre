3. Inspect `aln/chromium-scan.json` or feed it into `SpectralEngine.run(alnDoc)`.

## DevTools extension: Javaspectre Dev Lens

The Chromium extension:

- Adds a **Javaspectre** panel to DevTools.
- Evaluates a browser-friendly extractor on the inspected page.
- Shows the ALN `intent` and discovered `virtualObjects` in real time.

This makes hidden DOM structures and phantom objects visible and exportable.

## XR demo repository

The `javaspectre-xr-demo` repository combines:

- `NeuroSpectralHardware` for virtual hardware lattices (intent manifolds, latency fields).
- `ChromiumHarness` for page-level excavation.
- `ALNWorkflowEmitter` to turn ALN documents into CI workflows.

Together, these components demonstrate how ALN can orchestrate modern XR experiences, CI, and introspection from a single language layer.
