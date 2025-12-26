// Path: javaspectre-xr-demo/scripts/generate-aln-workflow.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ALNWorkflowEmitter from '../src/core/ALNWorkflowEmitter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
  const alnPath = path.join(__dirname, '../aln/chromium-scan.json');
  if (!fs.existsSync(alnPath)) {
    console.error('ALN document not found at', alnPath);
    process.exit(1);
  }
  const doc = JSON.parse(fs.readFileSync(alnPath, 'utf8'));

  const emitter = new ALNWorkflowEmitter({
    defaultBranch: 'main',
    defaultJobId: 'xr-demo'
  });

  const yaml = emitter.emitGitHubYaml(doc);
  const outPath = path.join(
    __dirname,
    '../.github/workflows/aln-xr-demo.yml'
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, yaml, 'utf8');

  console.log('GitHub workflow emitted to', outPath);
}

main();
