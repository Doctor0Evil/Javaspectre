// src/cli/jspectre-scan.js
// Generic CLI for scanning a JSON file and emitting ALN-style resonance output.

'use strict';

const fs = require('fs');
const path = require('path');
const { analyzeResonance, toALNFormat } = require('../core/mai_resonance_scanner')
  && require('../core/mai_aln_adapter')
  ? require('../../index')
  : {};

/**
 * Read JSON from a file path safely.
 */
function readJsonFile(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(abs, 'utf8');
  return JSON.parse(raw);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    process.stderr.write('Usage: jspectre-scan <path-to-json> [profile-id]\n');
    process.exitCode = 1;
    return;
  }

  const filePath = args[0];

  let data;
  try {
    data = readJsonFile(filePath);
  } catch (err) {
    process.stderr.write(`Failed to read JSON from "${filePath}": ${err.message}\n`);
    process.exitCode = 1;
    return;
  }

  let analysis;
  try {
    analysis = analyzeResonance(data);
  } catch (err) {
    process.stderr.write(`Resonance analysis failed: ${err.message}\n`);
    process.exitCode = 1;
    return;
  }

  const aln = toALNFormat(analysis, {
    sessionId: `cli-${path.basename(filePath)}`,
    traceId: `trace-${Date.now().toString(16)}`
  });

  process.stdout.write(JSON.stringify(aln, null, 2) + '\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  main
};
