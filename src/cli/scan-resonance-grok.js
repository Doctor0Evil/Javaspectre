// src/cli/scan-resonance-grok.js
// Grok-themed CLI for scanning JSON and emitting ALN-style resonance output.

'use strict';

const fs = require('fs');
const path = require('path');
const { analyzeResonance, toALNFormat, loadSpectralProfile } = require('../../index');

function readJsonFile(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(abs, 'utf8');
  return JSON.parse(raw);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    process.stderr.write('Usage: scan-resonance-grok <path-to-json>\n');
    process.exitCode = 1;
    return;
  }

  const filePath = args[0];
  const profile = loadSpectralProfile('grok-spectral');

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
    sessionId: `grok-${path.basename(filePath)}`,
    traceId: `grok-${Date.now().toString(16)}`,
    profile
  });

  process.stdout.write(JSON.stringify(aln, null, 2) + '\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  main
};
