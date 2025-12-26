// Path: scripts/validate-aln-spec.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJson(p) {
  const text = fs.readFileSync(p, 'utf8');
  return JSON.parse(text);
}

function computeSha256Hex(text) {
  const hash = crypto.createHash('sha256');
  hash.update(text, 'utf8');
  return hash.digest('hex');
}

function main() {
  const root = path.join(__dirname, '..');
  const specPath = path.join(root, 'blueprints', 'ALNSpec.blueprint.json');
  const specText = fs.readFileSync(specPath, 'utf8');
  const spec = JSON.parse(specText);

  const declaredHash =
    spec.verification && spec.verification.blueprintHash64
      ? spec.verification.blueprintHash64.toLowerCase()
      : null;

  if (!declaredHash) {
    console.error('ALNSpec missing verification.blueprintHash64.');
    process.exit(1);
  }

  const computedHash = computeSha256Hex(specText).toLowerCase();

  if (computedHash !== declaredHash) {
    console.error('ALNSpec hash mismatch.');
    console.error('Declared:', declaredHash);
    console.error('Computed:', computedHash);
    process.exit(1);
  }

  console.log('ALNSpec hash verification OK.');

  const schema = spec.schema;
  if (!schema || typeof schema !== 'object') {
    console.error('ALNSpec missing top-level schema field.');
    process.exit(1);
  }

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);

  const samplePath = path.join(root, 'aln', 'sample-intent.json');
  if (!fs.existsSync(samplePath)) {
    console.warn('No sample ALN document found at aln/sample-intent.json; skipping schema validation.');
    process.exit(0);
  }

  const doc = loadJson(samplePath);
  const valid = validate(doc);

  if (!valid) {
    console.error('Sample ALN document does not conform to ALNSpec:');
    console.error(validate.errors);
    process.exit(1);
  }

  console.log('Sample ALN document conforms to ALNSpec.');
}

main();
