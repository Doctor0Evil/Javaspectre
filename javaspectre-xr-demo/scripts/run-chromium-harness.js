// Path: javaspectre-xr-demo/scripts/run-chromium-harness.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ChromiumHarness from '../src/core/ChromiumHarness.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // In a real setup, you would integrate with Puppeteer/Playwright/Chrome CDP.
  // For now, assume telemetry.json contains a captured snapshot.
  const telemetryPath = path.join(__dirname, '../telemetry/telemetry.json');
  const raw = fs.existsSync(telemetryPath)
    ? JSON.parse(fs.readFileSync(telemetryPath, 'utf8'))
    : {};

  const harness = new ChromiumHarness();
  const alnDoc = harness.harvestFromChromium(raw);

  const outPath = path.join(__dirname, '../aln/chromium-scan.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(alnDoc, null, 2), 'utf8');

  console.log('Chromium ALN document written to', outPath);
}

main().catch((err) => {
  console.error('Error running Chromium harness:', err);
  process.exit(1);
});
