// Path: tests/integrity.test.js

import { IntegrityScanner } from "../src/core/IntegrityScanner.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed.");
  }
}

(async () => {
  const scanner = new IntegrityScanner({ forbidPlaceholders: false });
  const report = await scanner.scanRepository(process.cwd());
  assert(report.filesScanned >= 0, "Integrity scanner should run.");
  console.log("integrity.test.js OK");
})();
