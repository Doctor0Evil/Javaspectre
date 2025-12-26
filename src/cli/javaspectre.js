// Path: src/cli/javaspectre.js
// Entry command; supports make, refine, replicate, inspect, and impact.

#!/usr/bin/env node

import { SpectralEngine } from "../core/SpectralEngine.js";
import { runMake } from "./commands/make.js";
import { runRefine } from "./commands/refine.js";
import { runReplicate } from "./commands/replicate.js";
import { runInspect } from "./commands/inspect.js";
import { runImpact } from "./commands/impact.js";

function printHelp() {
  const lines = [
    "Javaspectre CLI",
    "",
    "Usage:",
    "  javaspectre <command> [args]",
    "",
    "Commands:",
    "  make      Create or scaffold spectral repositories and blueprints.",
    "  refine    Refine existing code into production-grade modules.",
    "  replicate Generate or verify 24-hour replication manifests.",
    "  inspect   Harvest DOM/API structures and phantom patterns.",
    "  impact    Evaluate and simulate sustainability impact.",
    "",
    "Examples:",
    "  javaspectre make \"sustainable energy analytics service\"",
    "  javaspectre refine ./src/index.js",
    "  javaspectre replicate ./",
    "  javaspectre inspect ./examples/sample.html",
    "  javaspectre impact 100000",
    ""
  ];
  process.stdout.write(lines.join("\n"));
}

async function main() {
  const [, , command, ...rest] = process.argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  const engine = new SpectralEngine();

  if (command === "make") {
    await runMake(rest, engine);
    return;
  }
  if (command === "refine") {
    await runRefine(rest, engine);
    return;
  }
  if (command === "replicate") {
    await runReplicate(rest, engine);
    return;
  }
  if (command === "inspect") {
    await runInspect(rest, engine);
    return;
  }
  if (command === "impact") {
    await runImpact(rest, engine);
    return;
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
