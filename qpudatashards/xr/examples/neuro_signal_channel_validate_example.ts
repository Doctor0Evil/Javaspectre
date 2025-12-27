// qpudatashards/xr/examples/neuro_signal_channel_validate_example.ts
// Full-featured example: load NeuroSignalChannel JSON files, validate them,
// and print human-friendly diagnostics for XR runtime / CI integration.
//
// Usage:
//   npx ts-node qpudatashards/xr/examples/neuro_signal_channel_validate_example.ts \
//     qpudatashards/xr/samples/channel_accessibility.json \
//     qpudatashards/xr/samples/channel_clinical_eeg.json
//
// or after compilation:
//   node dist/qpudatashards/xr/examples/neuro_signal_channel_validate_example.js ...

import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

import {
  validateNeuroSignalChannelDetailed,
  NeuroSignalValidationResult,
} from "../validators/neuro_signal_channel.validator.js";
import { NeuroSignalChannel } from "../types/neuro_signal_channel.types.js";

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve a path relative to the project root (assumes this example
 * sits under qpudatashards/xr/examples).
 */
function resolveProjectPath(relative: string): string {
  const projectRoot = path.resolve(__dirname, "..", "..", "..");
  return path.resolve(projectRoot, relative);
}

/**
 * Pretty-print a single validation result in a human-friendly way.
 */
function printValidationResult(
  filePath: string,
  channel: NeuroSignalChannel | null,
  result: NeuroSignalValidationResult
): void {
  const rel = path.relative(process.cwd(), filePath);

  if (result.ok) {
    console.log("──────────────────────────────────────────────────────────────");
    console.log(`✔ NeuroSignalChannel VALID: ${rel}`);
    if (channel) {
      console.log(`  id:           ${channel.id}`);
      console.log(`  modality:     ${channel.modality}`);
      console.log(`  risk_level:   ${channel.risk_level}`);
      console.log(`  privacy_level:${channel.privacy_level}`);
      console.log(
        `  purpose:      ${channel.purpose.substring(0, 80)}${
          channel.purpose.length > 80 ? "…" : ""
        }`
      );
    }
    console.log("──────────────────────────────────────────────────────────────");
  } else {
    console.error("──────────────────────────────────────────────────────────────");
    console.error(`✖ NeuroSignalChannel INVALID: ${rel}`);
    if (channel) {
      console.error(`  id (if present): ${channel.id}`);
      console.error(`  modality (if present): ${channel.modality}`);
    }
    if (result.errors.length === 0) {
      console.error("  (No error details available.)");
    } else {
      console.error("  Errors:");
      result.errors.forEach((err, idx) => {
        const path = err.instancePath || "/";
        console.error(
          `    [${idx + 1}] path=${path} keyword=${err.keyword}\n` +
            `        ${err.message} (schema: ${err.schemaPath})`
        );
      });
    }
    console.error("──────────────────────────────────────────────────────────────");
  }
}

/**
 * Read and parse a JSON file into unknown.
 */
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

// ---------------------------------------------------------------------------
// Sample file provisioning (optional helper)
// ---------------------------------------------------------------------------

/**
 * Ensure that a sample directory and example NeuroSignalChannel file exists.
 * This makes the example self-contained and runnable even without user files.
 */
function ensureSampleFiles(): string[] {
  const samplesDir = resolveProjectPath("qpudatashards/xr/samples");
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  const sampleFile = path.join(samplesDir, "channel_accessibility.json");
  if (!fs.existsSync(sampleFile)) {
    const sampleChannel: NeuroSignalChannel = {
      id: "channel-accessibility-eeg-alpha",
      modality: "EEG",
      frequency_band: "alpha",
      sampling_rate_hz: 256,
      latency_ms: 45,
      jitter_ms: 5,
      risk_level: "medium",
      privacy_level: "clinical",
      purpose:
        "Accessibility-focused attentional modulation in XR wayfinding scenes.",
      neurorights_tags: ["mental_privacy", "cognitive_integrity"],
      consent_requirements: {
        consent_type: "individual_explicit",
        revocability: "real_time",
        multi_party: false,
        data_sharing_scope: "research_aggregated_only",
      },
      retention_days: 90,
      anonymization_required: true,
      data_security: {
        encryption_at_rest: true,
        encryption_in_transit: true,
      },
    };

    fs.writeFileSync(
      sampleFile,
      JSON.stringify(sampleChannel, null, 2),
      "utf8"
    );
    console.log(
      `Created sample NeuroSignalChannel file: ${path.relative(
        process.cwd(),
        sampleFile
      )}`
    );
  }

  return [sampleFile];
}

// ---------------------------------------------------------------------------
// Main program
// ---------------------------------------------------------------------------

function printUsage(): void {
  const rel = path.relative(
    process.cwd(),
    resolveProjectPath("qpudatashards/xr/examples/neuro_signal_channel_validate_example.ts")
  );
  console.log("Usage:");
  console.log(
    `  npx ts-node ${rel} <path/to/channel1.json> [path/to/channel2.json ...]`
  );
  console.log("");
  console.log(
    "If no files are provided, a sample NeuroSignalChannel JSON will be generated and validated."
  );
}

/**
 * Entry point: validates one or more NeuroSignalChannel JSON files.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let targetFiles: string[] = [];

  if (args.length === 0) {
    console.log(
      "No JSON files provided on the command line. Generating and validating a sample file instead..."
    );
    targetFiles = ensureSampleFiles();
  } else {
    targetFiles = args.map((arg) => path.resolve(process.cwd(), arg));
  }

  let overallOk = true;

  for (const filePath of targetFiles) {
    try {
      const data = readJsonFile(filePath);
      const result = validateNeuroSignalChannelDetailed(data);
      const channel = result.ok ? (data as NeuroSignalChannel) : null;

      printValidationResult(filePath, channel, result);

      if (!result.ok) {
        overallOk = false;
      }
    } catch (err) {
      overallOk = false;
      console.error("──────────────────────────────────────────────────────────────");
      console.error(`✖ Error processing file: ${filePath}`);
      console.error(`  ${(err as Error).message}`);
      console.error("──────────────────────────────────────────────────────────────");
    }
  }

  if (!overallOk) {
    console.error(
      "One or more NeuroSignalChannel definitions failed validation. See errors above."
    );
    printUsage();
    process.exitCode = 1;
  } else {
    console.log(
      "All NeuroSignalChannel definitions passed schema and neurorights validation."
    );
  }
}

// Execute main, propagate fatal errors.
main().catch((err) => {
  console.error("Fatal error in NeuroSignalChannel validation example:");
  console.error((err as Error).stack || (err as Error).message);
  process.exitCode = 1;
});
