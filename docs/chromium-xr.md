# Chromium & XR with ALN

Javaspectre makes Chromium-based environments and XR scenes first-class ALN targets.

## ChromiumHarness

`src/core/ChromiumHarness.js` converts Chromium telemetry into ALN documents:

- Uses DOM and network logs to build `artifacts.virtualObjects` via VirtualObjectExcavator.
- Emits an `intent` describing the scan, a `domain` (typically `xr_systems`), and a `workflowPlan` with a harness step.

Example CLI usage:

1. Collect telemetry into `telemetry/telemetry.json` using a Puppeteer/Playwright script.
2. Run:
