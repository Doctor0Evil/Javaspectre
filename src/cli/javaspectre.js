// Path: src/cli/javaspectre.js
// Entry command; supports make, refine, replicate, inspect, impact, describe, and make-aln-shell.

#!/usr/bin/env node

import { SpectralEngine } from "../core/SpectralEngine.js";
import SpectralHarvester from "../core/SpectralHarvester.js";
import { createAlnShellRepo } from "../aln-shell/createAlnShellRepo.js";

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
    "  make             Create or scaffold spectral repositories and blueprints.",
    "  refine           Refine existing code into production-grade modules.",
    "  replicate        Generate or verify 24-hour replication manifests.",
    "  inspect          Harvest DOM/API structures and phantom patterns.",
    "  impact           Evaluate and simulate sustainability impact.",
    "  describe         Turn a plain-text description into a RepoBlueprint JSON.",
    "  make-aln-shell   Scaffold a zero-IDE ALN Web Kernel repo.",
    "",
    "Examples:",
    "  javaspectre make \"sustainable energy analytics service\"",
    "  javaspectre refine ./src/index.js",
    "  javaspectre replicate ./",
    "  javaspectre inspect ./examples/sample.html",
    "  javaspectre impact 100000",
    "  javaspectre describe \"A spectral AI that designs open-source JS repos.\"",
    "  javaspectre make-aln-shell aln-shell-demo",
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

  // Core spectral engine for make/refine/replicate/inspect/impact
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

  // Repo blueprint generation from natural language
  if (command === "describe") {
    if (rest.length === 0) {
      printHelp();
      process.exit(1);
    }
    const description = rest.join(" ");
    const harvester = new SpectralHarvester();
    const blueprint = harvester.harvestToRepoBlueprint(description, ["cli", "spectral"]);
    process.stdout.write(JSON.stringify(blueprint.toJSON(), null, 2));
    return;
  }

  // ALN Web Kernel scaffolding
  if (command === "make-aln-shell") {
    const targetDir = rest[0] || "aln-shell-repo";
    createAlnShellRepo(targetDir);
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
