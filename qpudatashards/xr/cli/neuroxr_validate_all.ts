// qpudatashards/xr/cli/neuroxr_validate_all.ts
// NeuroXR validation CLI
//
// Responsibilities:
// - Discover and validate all NeuroSignalChannel JSON specs.
// - Discover and validate all Neuro Context Scene JSON specs.
// - Optionally validate telemetry and governance proposals (extensible).
// - Print human-friendly diagnostics and machine-readable summary.
// - Designed for both local dev and CI workflows.
//
// Run (from project root):
//   npx ts-node qpudatashards/xr/cli/neuroxr_validate_all.ts
//   npx ts-node qpudatashards/xr/cli/neuroxr_validate_all.ts --json
//
// After build:
//   node dist/qpudatashards/xr/cli/neuroxr_validate_all.js --json

import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

import {
  validateNeuroSignalChannelDetailed,
  NeuroSignalValidationResult,
} from "../validators/neuro_signal_channel.validator.js";
import { NeuroSignalChannel } from "../types/neuro_signal_channel.types.js";
import {
  validateNeuroContextSceneDetailed,
  NeuroContextSceneValidationResult,
} from "../validators/neuro_context_scene.validator.js";
import { NeuroContextScene } from "../types/neuro_context_scene.types.js";

// ---------------------------------------------------------------------------
// CLI options & environment
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface NeuroXRValidateAllOptions {
  outputJson: boolean;
  rootDir: string;
}

interface NeuroXRFileValidationResult {
  kind: "channel" | "scene" | "unknown";
  filePath: string;
  ok: boolean;
  errors: {
    instancePath: string;
    schemaPath: string;
    keyword: string;
    message: string;
  }[];
}

interface NeuroXRValidationSummary {
  ok: boolean;
  totalFiles: number;
  channelFiles: number;
  sceneFiles: number;
  unknownFiles: number;
  failedFiles: number;
  results: NeuroXRFileValidationResult[];
}

/**
 * Parse simple CLI flags. We deliberately keep this small and explicit
 * instead of adding a heavy CLI framework to preserve clarity. [web:58]
 */
function parseCliArgs(argv: string[]): NeuroXRValidateAllOptions {
  const args = argv.slice(2);
  let outputJson = false;
  let rootDir = process.cwd();

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--json" || arg === "-j") {
      outputJson = true;
    } else if (arg === "--root" || arg === "-r") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("Missing value for --root");
      }
      rootDir = path.resolve(process.cwd(), value);
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      printUsageAndExit();
    } else {
      // treat any non-flag arg as a root dir override for convenience
      rootDir = path.resolve(process.cwd(), arg);
    }
  }

  return { outputJson, rootDir };
}

function printUsageAndExit(): never {
  const rel = path.relative(
    process.cwd(),
    path.resolve(
      __dirname,
      "../cli/neuroxr_validate_all.ts"
    )
  );
  console.log("NeuroXR Validate All – XR.NeuroObjectForge/Javaspectre");
  console.log("");
  console.log("Usage:");
  console.log(`  npx ts-node ${rel} [options]`);
  console.log("");
  console.log("Options:");
  console.log("  --json, -j        Output machine-readable JSON summary");
  console.log("  --root, -r PATH   Override root directory (default: CWD)");
  console.log("  --help, -h        Show this help message");
  console.log("");
  console.log("Behavior:");
  console.log("  - Scans qpudatashards/xr for:");
  console.log("      * NeuroSignalChannel JSON files");
  console.log("      * Neuro Context Scene JSON files (.neuro.json)");
  console.log("  - Validates them using Ajv-based validators and neurorights checks.");
  console.log("  - Exits with code 1 if any file fails.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

/**
 * Recursively walk a directory and collect JSON files.
 * We avoid glob dependencies to keep the CLI lean and clear. [web:65]
 */
function walkJsonFiles(rootDir: string): string[] {
  const results: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

/**
 * Identify if a JSON file is likely a NeuroSignalChannel, Neuro Context Scene,
 * or something else, based on filename/location and minimal structural checks.
 * This keeps validation routing explicit and predictable. [web:59]
 */
function inferFileKind(filePath: string, data: unknown): "channel" | "scene" | "unknown" {
  const lower = filePath.toLowerCase();

  if (lower.includes("neuro_signal_channel") || lower.includes("channel_")) {
    return "channel";
  }

  if (lower.includes("scene") || lower.endsWith(".neuro.json")) {
    return "scene";
  }

  // Optionally inspect minimal shape
  if (typeof data === "object" && data !== null) {
    const maybe = data as Record<string, unknown>;
    if (
      typeof maybe.modality === "string" &&
      typeof maybe.frequency_band === "string" &&
      typeof maybe.sampling_rate_hz === "number"
    ) {
      return "channel";
    }
    if (
      typeof maybe.domain === "string" &&
      Array.isArray(maybe.spatial_entities)
    ) {
      return "scene";
    }
  }

  return "unknown";
}

// ---------------------------------------------------------------------------
// Validation wiring
// ---------------------------------------------------------------------------

function readJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to parse JSON in "${filePath}": ${(err as Error).message}`
    );
  }
}

function validateChannelFile(filePath: string, data: unknown): NeuroXRFileValidationResult {
  const result: NeuroSignalValidationResult =
    validateNeuroSignalChannelDetailed(data);
  return {
    kind: "channel",
    filePath,
    ok: result.ok,
    errors: result.errors,
  };
}

function validateSceneFile(filePath: string, data: unknown): NeuroXRFileValidationResult {
  const result: NeuroContextSceneValidationResult =
    validateNeuroContextSceneDetailed(data);
  return {
    kind: "scene",
    filePath,
    ok: result.ok,
    errors: result.errors,
  };
}

function printFileResultHuman(result: NeuroXRFileValidationResult): void {
  const rel = path.relative(process.cwd(), result.filePath);
  const headerLine =
    result.kind === "channel"
      ? "NeuroSignalChannel"
      : result.kind === "scene"
      ? "NeuroContextScene"
      : "Unknown";

  if (result.ok) {
    console.log("──────────────────────────────────────────────────────────────");
    console.log(`✔ ${headerLine} VALID: ${rel}`);
    console.log("──────────────────────────────────────────────────────────────");
  } else {
    console.error("──────────────────────────────────────────────────────────────");
    console.error(`✖ ${headerLine} INVALID: ${rel}`);
    if (result.errors.length === 0) {
      console.error("  (No error details available.)");
    } else {
      console.error("  Errors:");
      result.errors.forEach((err, idx) => {
        const pathStr = err.instancePath || "/";
        console.error(
          `    [${idx + 1}] path=${pathStr} keyword=${err.keyword}\n` +
            `        ${err.message} (schema: ${err.schemaPath})`
        );
      });
    }
    console.error("──────────────────────────────────────────────────────────────");
  }
}

// ---------------------------------------------------------------------------
// Summary computation
// ---------------------------------------------------------------------------

function summarizeResults(results: NeuroXRFileValidationResult[]): NeuroXRValidationSummary {
  let totalFiles = results.length;
  let channelFiles = 0;
  let sceneFiles = 0;
  let unknownFiles = 0;
  let failedFiles = 0;

  for (const r of results) {
    if (!r.ok) failedFiles += 1;
    if (r.kind === "channel") channelFiles += 1;
    else if (r.kind === "scene") sceneFiles += 1;
    else unknownFiles += 1;
  }

  return {
    ok: failedFiles === 0,
    totalFiles,
    channelFiles,
    sceneFiles,
    unknownFiles,
    failedFiles,
    results,
  };
}

function printSummaryHuman(summary: NeuroXRValidationSummary): void {
  console.log("");
  console.log("NeuroXR Validation Summary");
  console.log("──────────────────────────────────────────────────────────────");
  console.log(`  Total JSON files scanned:   ${summary.totalFiles}`);
  console.log(`  Channel spec files:         ${summary.channelFiles}`);
  console.log(`  Scene context files:        ${summary.sceneFiles}`);
  console.log(`  Unknown JSON files:         ${summary.unknownFiles}`);
  console.log(`  Failed files:               ${summary.failedFiles}`);
  console.log("──────────────────────────────────────────────────────────────");

  if (summary.ok) {
    console.log("✅ All NeuroXR definitions passed schema and neurorights validation.");
  } else {
    console.error("❌ One or more NeuroXR definitions failed validation. See logs above.");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv);
  const xrRoot = path.resolve(options.rootDir, "qpudatashards", "xr");

  if (!fs.existsSync(xrRoot) || !fs.statSync(xrRoot).isDirectory()) {
    throw new Error(
      `XR root not found at "${xrRoot}". Ensure you're in the project root or use --root.`
    );
  }

  const jsonFiles = walkJsonFiles(xrRoot);
  if (jsonFiles.length === 0) {
    console.warn(`No JSON files found under "${xrRoot}". Nothing to validate.`);
    process.exitCode = 0;
    return;
  }

  const results: NeuroXRFileValidationResult[] = [];

  for (const filePath of jsonFiles) {
    try {
      const data = readJsonFile(filePath);
      const kind = inferFileKind(filePath, data);

      let fileResult: NeuroXRFileValidationResult;
      if (kind === "channel") {
        fileResult = validateChannelFile(filePath, data);
      } else if (kind === "scene") {
        fileResult = validateSceneFile(filePath, data);
      } else {
        // Skip validation for unknown JSON; mark as ok but unknown kind.
        fileResult = {
          kind: "unknown",
          filePath,
          ok: true,
          errors: [],
        };
      }

      results.push(fileResult);
      printFileResultHuman(fileResult);
    } catch (err) {
      results.push({
        kind: "unknown",
        filePath,
        ok: false,
        errors: [
          {
            instancePath: "",
            schemaPath: "neuroxr-validate-all/io",
            keyword: "exception",
            message: (err as Error).message,
          },
        ],
      });
      console.error("──────────────────────────────────────────────────────────────");
      console.error(`✖ Error while processing: ${path.relative(process.cwd(), filePath)}`);
      console.error(`  ${(err as Error).message}`);
      console.error("──────────────────────────────────────────────────────────────");
    }
  }

  const summary = summarizeResults(results);

  if (options.outputJson) {
    const json = JSON.stringify(summary, null, 2);
    // For CI, machine-readable output is invaluable. [web:58][web:67]
    console.log(json);
  } else {
    printSummaryHuman(summary);
  }

  if (!summary.ok) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

main().catch((err) => {
  console.error("Fatal error in neuroxr_validate_all CLI:");
  console.error((err as Error).stack || (err as Error).message);
  process.exitCode = 1;
});
