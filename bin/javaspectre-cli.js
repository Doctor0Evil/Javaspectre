#!/usr/bin/env node
// bin/javaspectre-cli.js
// Javaspectre CLI
// Terminal-first spectral assistant that routes prompts into capabilities under src/capabilities.
// Designed for:
// - One-shot commands: spectral analysis, simulations, optimizers
// - REPL-style exploration of virtual objects and cybernetic models

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

// Core capability wiring (extend as needed)
import { JavaspectreSuperpowerEngine } from "../src/spectral/JavaspectreSuperpowerEngine.js";
import AIWorkstationOptimizer from "../src/capabilities/AIWorkstationOptimizer.js";
import ExtraterrestrialHabSimulator from "../src/capabilities/ExtraterrestrialHabSimulator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printHelp() {
  console.log(`Javaspectre CLI

Usage:
  javaspectre "<prompt>"               Run one-shot spectral analysis
  javaspectre --mode workstation       Optimize AI workstation profile (JSON on stdin or file)
  javaspectre --mode hab               Run extraterrestrial habitat simulation (JSON config)
  javaspectre --repl                   Start interactive REPL
  javaspectre --help                   Show this help

Examples:
  javaspectre "scan ./src for virtual objects"
  javaspectre --mode workstation < workstation.json
  javaspectre --mode hab < hab-config.json
  javaspectre --repl
`);
}

async function readStdinJson() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => {
      if (!data.trim()) return resolve({});
      try {
        const json = JSON.parse(data);
        resolve(json);
      } catch (err) {
        reject(new Error("Failed to parse JSON from stdin."));
      }
    });
    process.stdin.on("error", reject);
  });
}

async function handlePrompt(prompt) {
  const engine = new JavaspectreSuperpowerEngine();
  const analysis = engine.analyzeJavaScriptSource(
    `// virtual object\n// ${prompt}\n`,
    { label: "cli-prompt" }
  );

  return {
    mode: "spectral-prompt",
    prompt,
    contracts: analysis.contracts,
    metrics: {
      objectCount: analysis.report.stats.objectCount,
      virtualTagCount: analysis.report.stats.virtualTagCount
    }
  };
}

async function handleWorkstationMode(config) {
  const optimizer = new AIWorkstationOptimizer(config || {});
  const result = optimizer.optimize();
  return { mode: "workstation", input: config, result };
}

async function handleHabMode(config) {
  const sim = new ExtraterrestrialHabSimulator(config || {});
  const result = sim.runSimulation();
  return { mode: "hab-sim", input: config, result };
}

async function runOneShotPrompt(prompt) {
  const result = await handlePrompt(prompt);
  console.log(JSON.stringify(result, null, 2));
}

async function runMode(mode, args) {
  if (mode === "workstation") {
    const config = await readStdinJson();
    const result = await handleWorkstationMode(config);
    console.log(JSON.stringify(result, null, 2));
  } else if (mode === "hab") {
    const config = await readStdinJson();
    const result = await handleHabMode(config);
    console.log(JSON.stringify(result, null, 2));
  } else {
    throw new Error(`Unknown mode: ${mode}`);
  }
}

async function runRepl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "javaspectre> "
  });

  console.log("Javaspectre REPL. Type :q to exit.");
  rl.prompt();

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }
    if (trimmed === ":q" || trimmed === ":quit" || trimmed === ":exit") {
      rl.close();
      return;
    }
    try {
      const result = await handlePrompt(trimmed);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("Error:", err.message || err);
    }
    rl.prompt();
  }).on("close", () => {
    console.log("Goodbye from Javaspectre.");
    process.exit(0);
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args[0] === "--repl") {
    await runRepl();
    return;
  }

  const modeIndex = args.indexOf("--mode");
  if (modeIndex !== -1 && args.length > modeIndex + 1) {
    const mode = args[modeIndex + 1];
    await runMode(mode, args.slice(modeIndex + 2));
    return;
  }

  const prompt = args.join(" ");
  await runOneShotPrompt(prompt);
}

main().catch((err) => {
  console.error("Fatal error:", err.message || err);
  process.exit(1);
});
