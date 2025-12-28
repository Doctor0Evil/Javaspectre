#!/usr/bin/env node
// /opt/javaspectre/bin/javaspectre-cli.js
// Javaspectre CLI launcher
// Terminal-first assistant that routes prompts into Javaspectre capabilities.

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

// Example: import core spectral engines here
// import { JavaspectreSuperpowerEngine } from "../src/spectral/JavaspectreSuperpowerEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printHelp() {
  console.log(`Javaspectre CLI

Usage:
  javaspectre "<prompt>"          Run one-shot spectral analysis
  javaspectre --repl              Start interactive REPL
  javaspectre --help              Show this help

Examples:
  javaspectre "analyze repo ./src for virtual objects"
  javaspectre --repl
`);
}

async function handlePrompt(prompt) {
  // Hook into your existing capabilities here.
  // For now, just echo with a placeholder spectral response.
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    prompt,
    response: `Javaspectre analyzed: "${prompt}" (attach specific capability handlers here).`
  };
}

async function runOneShot(prompt) {
  const result = await handlePrompt(prompt);
  console.log(JSON.stringify(result, null, 2));
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

  const prompt = args.join(" ");
  await runOneShot(prompt);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
