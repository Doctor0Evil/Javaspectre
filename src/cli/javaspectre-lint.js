// File: ./src/cli/javaspectre-lint.js
// Purpose: CLI for the ALN-resonant linter.

#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import { ALNLinterEngine } from '../core/ALNLinterEngine.js';

async function main() {
  const [, , target] = process.argv;
  if (!target) {
    console.error('Usage: javaspectre-lint <file.js>');
    process.exit(1);
  }

  try {
    const engine = new ALNLinterEngine();
    const result = await engine.lintFile(target);
    const exitCode = result.summary.errorCount > 0 ? 1 : 0;

    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(exitCode);
  } catch (err) {
    console.error(`javaspectre-lint: ${err.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
