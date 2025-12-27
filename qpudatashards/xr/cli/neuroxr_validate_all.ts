// qpudatashards/xr/cli/neuroxr_validate_all.ts
// NeuroXR full-repo validator CLI (no shortcuts).
//
// Responsibilities:
// - Discover and validate all NeuroSignalChannel JSON files.
// - Discover and validate all NeuroContextScene JSON files.
// - Optionally sanity-check telemetry samples (if present).
// - Print rich, human-readable diagnostics.
// - Exit non-zero if any artifact fails, for CI integration.
//
// Run via ts-node (dev):
//   npx ts-node qpudatashards/xr/cli/neuroxr_validate_all.ts
//
// Run after compilation:
//   node dist/qpudatashards/xr/cli/neuroxr_validate_all.js

import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

import {
  validateNeuroSignalChannelDetailed,
  NeuroSignalValidationResult,
} from "../validators/neuro_signal_channel.validator.js";
import { NeuroSignalChannel } from "../types/neuro_signal_channel.types.js";

// These would be implemented analogously to the channel validator/schema.
import {
  validateNeuroContextSceneDetailed,
  NeuroContextSceneValidationResult,
} from "../validators/neuro_context_scene.validator.js";
import { NeuroContextScene } from "../types/neuro_context_scene.types.d.js";

// Optionally ingest telemetry if present.
import { validateNeuroXRTelemetryDetailed } from "../telemetry/neuroxr_telemetry_ingest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Types for consolidated reporting
// ---------------------------------------------------------------------------

interface FileValidationSummary {
  filePath: string;
  kind: "channel" | "scene" | "telemetry";
  ok: boolean;
  errorCount: number;
}

interface AggregateReport {
  totalFiles: number;
  totalValid: number;
  totalInvalid: number;
  byKind: {
    channel: { total: number; valid: number; invalid: number };
    scene: { total: number; valid: number; invalid: number };
    telemetry: { total: number; valid: number; invalid: number };
  };
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function resolveProjectRoot(): string {
  // This CLI is at qpudatashards/xr/cli/, so project root is three levels up.
  return path.resolve(__dirname, "..", "..", "..");
}

function relativeToCwd(p: string): string {
  return path.relative(process.cwd(), p);
}

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

/**
 * Recursively walk the repo and collect JSON files that match simple
 * naming patterns for NeuroXR artifacts.
 */
function discoverJsonFiles(root: string): {
  channels: string[];
  scenes: string[];
  telemetry: string[];
} {
  const channels: string[] = [];
  const scenes: string[] = [];
  const telemetry: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules and dist for performance & clarity.
        if (
          entry.name === "node_modules" ||
          entry.name === "dist" ||
          entry.name === ".git"
        ) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        if (entry.name.includes("channel_")) {
          channels.push(fullPath);
        } else if (entry.name.includes("scene") || entry.name.endsWith(".neuro.json")) {
          scenes.push(fullPath);
        } else if (entry.name.includes("telemetry")) {
          telemetry.push(fullPath);
        }
      }
    }
  }

  walk(root);
  return { channels, scenes, telemetry };
}

// ---------------------------------------------------------------------------
// Printing helpers
// ---------------------------------------------------------------------------

function printHeader(title: string): void {
  console.log("");
  console.log("================================================================");
  console.log(title);
  console.log("================================================================");
}

function printChannelResult(
  filePath: string,
  channel: NeuroSignalChannel | null,
  result: NeuroSignalValidationResult
): void {
  const rel = relativeToCwd(filePath);

  if (result.ok) {
    console.log("──────────────────────────────────────────────────────────────");
    console.log(`✔ NeuroSignalChannel VALID: ${rel}`);
    if (channel) {
      console.log(`  id:             ${channel.id}`);
      console.log(`  modality:       ${channel.modality}`);
      console.log(`  risk_level:     ${channel.risk_level}`);
      console.log(`  privacy_level:  ${channel.privacy_level}`);
      console.log(
        `  purpose:        ${channel.purpose.substring(0, 80)}${
          channel.purpose.length > 80 ? "…" : ""
        }`
      );
    }
    console.log("──────────────────────────────────────────────────────────────");
  } else {
    console.error("──────────────────────────────────────────────────────────────");
    console.error(`✖ NeuroSignalChannel INVALID: ${rel}`);
    if (channel) {
      console.error(`  id (if present):       ${channel.id}`);
      console.error(`  modality (if present): ${channel.modality}`);
    }
    if (result.errors.length === 0) {
      console.error("  (No error details available.)");
    } else {
      console.error("  Errors:");
      result.errors.forEach((err, idx) => {
        const instPath = err.instancePath || "/";
        console.error(
          `    [${idx + 1}] path=${instPath} keyword=${err.keyword}\n` +
            `        ${err.message} (schema: ${err.schemaPath})`
        );
      });
    }
    console.error("──────────────────────────────────────────────────────────────");
  }
}

function printSceneResult(
  filePath: string,
  scene: NeuroContextScene | null,
  result: NeuroContextSceneValidationResult
): void {
  const rel = relativeToCwd(filePath);

  if (result.ok) {
    console.log("──────────────────────────────────────────────────────────────");
    console.log(`✔ NeuroContextScene VALID: ${rel}`);
    if (scene) {
      console.log(`  id:           ${scene.id}`);
      console.log(`  domain:       ${scene.domain}`);
      console.log(`  maxRiskLevel: ${scene.maxRiskLevel}`);
      console.log(
        `  description:  ${scene.description?.substring(0, 80) ?? ""}${
          scene.description && scene.description.length > 80 ? "…" : ""
        }`
      );
    }
    console.log("──────────────────────────────────────────────────────────────");
  } else {
    console.error("──────────────────────────────────────────────────────────────");
    console.error(`✖ NeuroContextScene INVALID: ${rel}`);
    if (scene) {
      console.error(`  id (if present):     ${scene.id}`);
      console.error(`  domain (if present): ${scene.domain}`);
    }
    if (result.errors.length === 0) {
      console.error("  (No error details available.)");
    } else {
      console.error("  Errors:");
      result.errors.forEach((err, idx) => {
        const instPath = err.instancePath || "/";
        console.error(
          `    [${idx + 1}] path=${instPath} keyword=${err.keyword}\n` +
            `        ${err.message} (schema: ${err.schemaPath})`
        );
      });
    }
    console.error("──────────────────────────────────────────────────────────────");
  }
}

function printTelemetryResult(filePath: string, ok: boolean, errors: string[]): void {
  const rel = relativeToCwd(filePath);

  if (ok) {
    console.log("──────────────────────────────────────────────────────────────");
    console.log(`✔ NeuroXR Telemetry VALID: ${rel}`);
    console.log("──────────────────────────────────────────────────────────────");
  } else {
    console.error("──────────────────────────────────────────────────────────────");
    console.error(`✖ NeuroXR Telemetry INVALID: ${rel}`);
    if (errors.length === 0) {
      console.error("  (No error details available.)");
    } else {
      console.error("  Errors:");
      errors.forEach((msg, idx) => {
        console.error(`    [${idx + 1}] ${msg}`);
      });
    }
    console.error("──────────────────────────────────────────────────────────────");
  }
}

// ---------------------------------------------------------------------------
// Aggregate reporting
// ---------------------------------------------------------------------------

function buildInitialReport(): AggregateReport {
  return {
    totalFiles: 0,
    totalValid: 0,
    totalInvalid: 0,
    byKind: {
      channel: { total: 0, valid: 0, invalid: 0 },
      scene: { total: 0, valid: 0, invalid: 0 },
      telemetry: { total: 0, valid: 0, invalid: 0 },
    },
  };
}

function updateReport(report: AggregateReport, summary: FileValidationSummary): void {
  report.totalFiles += 1;
  report.byKind[summary.kind].total += 1;

  if (summary.ok) {
    report.totalValid += 1;
    report.byKind[summary.kind].valid += 1;
  } else {
    report.totalInvalid += 1;
    report.byKind[summary.kind].invalid += 1;
  }
}

function printAggregateReport(report: AggregateReport): void {
  printHeader("NeuroXR Validation Summary");

  console.log(`Total files checked:   ${report.totalFiles}`);
  console.log(`Total valid:           ${report.totalValid}`);
  console.log(`Total invalid:         ${report.totalInvalid}`);
  console.log("");

  console.log("By kind:");
  console.log(
    `  NeuroSignalChannel: total=${report.byKind.channel.total}, valid=${report.byKind.channel.valid}, invalid=${report.byKind.channel.invalid}`
  );
  console.log(
    `  NeuroContextScene:  total=${report.byKind.scene.total}, valid=${report.byKind.scene.valid}, invalid=${report.byKind.scene.invalid}`
  );
  console.log(
    `  Telemetry:          total=${report.byKind.telemetry.total}, valid=${report.byKind.telemetry.valid}, invalid=${report.byKind.telemetry.invalid}`
  );

  console.log("");
  if (report.totalInvalid === 0) {
    console.log("Status: ✔ All NeuroXR artifacts passed validation.");
  } else {
    console.log("Status: ✖ Some NeuroXR artifacts failed validation. See logs above.");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const projectRoot = resolveProjectRoot();
  printHeader("NeuroXR Full Repository Validation");
  console.log(`Project root: ${projectRoot}`);
  console.log("");

  const discovered = discoverJsonFiles(projectRoot);
  const report = buildInitialReport();

  // 1. Validate all NeuroSignalChannel JSON files.
  printHeader("Step 1 – Validating NeuroSignalChannel JSON files");
  if (discovered.channels.length === 0) {
    console.log("No channel_*.json files found. (This may be expected in early stages.)");
  } else {
    for (const filePath of discovered.channels) {
      try {
        const data = readJsonFile(filePath);
        const detailed = validateNeuroSignalChannelDetailed(data);
        const channel = detailed.ok ? (data as NeuroSignalChannel) : null;

        printChannelResult(filePath, channel, detailed);

        updateReport(report, {
          filePath,
          kind: "channel",
          ok: detailed.ok,
          errorCount: detailed.errors.length,
        });
      } catch (err) {
        console.error("──────────────────────────────────────────────────────────────");
        console.error(`✖ Error processing NeuroSignalChannel file: ${relativeToCwd(filePath)}`);
        console.error(`  ${(err as Error).message}`);
        console.error("──────────────────────────────────────────────────────────────");

        updateReport(report, {
          filePath,
          kind: "channel",
          ok: false,
          errorCount: 1,
        });
      }
    }
  }

  // 2. Validate all NeuroContextScene JSON files.
  printHeader("Step 2 – Validating NeuroContextScene JSON files");
  if (discovered.scenes.length === 0) {
    console.log("No scene/neuro JSON files found. (This may be expected in early stages.)");
  } else {
    for (const filePath of discovered.scenes) {
      try {
        const data = readJsonFile(filePath);
        const detailed = validateNeuroContextSceneDetailed(data);
        const scene = detailed.ok ? (data as NeuroContextScene) : null;

        printSceneResult(filePath, scene, detailed);

        updateReport(report, {
          filePath,
          kind: "scene",
          ok: detailed.ok,
          errorCount: detailed.errors.length,
        });
      } catch (err) {
        console.error("──────────────────────────────────────────────────────────────");
        console.error(`✖ Error processing NeuroContextScene file: ${relativeToCwd(filePath)}`);
        console.error(`  ${(err as Error).message}`);
        console.error("──────────────────────────────────────────────────────────────");

        updateReport(report, {
          filePath,
          kind: "scene",
          ok: false,
          errorCount: 1,
        });
      }
    }
  }

  // 3. Validate telemetry JSON files if they exist.
  printHeader("Step 3 – Validating NeuroXR Telemetry JSON files (if any)");
  if (discovered.telemetry.length === 0) {
    console.log("No telemetry*.json files found. Skipping telemetry validation.");
  } else {
    for (const filePath of discovered.telemetry) {
      try {
        const data = readJsonFile(filePath);
        const detailed = validateNeuroXRTelemetryDetailed(data);

        printTelemetryResult(filePath, detailed.ok, detailed.errors);

        updateReport(report, {
          filePath,
          kind: "telemetry",
          ok: detailed.ok,
          errorCount: detailed.errors.length,
        });
      } catch (err) {
        console.error("──────────────────────────────────────────────────────────────");
        console.error(`✖ Error processing Telemetry file: ${relativeToCwd(filePath)}`);
        console.error(`  ${(err as Error).message}`);
        console.error("──────────────────────────────────────────────────────────────");

        updateReport(report, {
          filePath,
          kind: "telemetry",
          ok: false,
          errorCount: 1,
        });
      }
    }
  }

  // 4. Print aggregate report and set exit code.
  printAggregateReport(report);

  if (report.totalInvalid > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

main().catch((err) => {
  console.error("Fatal error in neuroxr_validate_all.ts:");
  console.error((err as Error).stack || (err as Error).message);
  process.exitCode = 1;
});
