// Path: src/core/IntegrityScanner.js
// Ensures repositories self-heal from incomplete or dead code.

import fs from "fs";
import path from "path";

export class IntegrityScanner {
  constructor(options = {}) {
    this.forbidPlaceholders = options.forbidPlaceholders !== false;
    this.placeholderPatterns = options.placeholderPatterns || [
      "TODO",
      "TBD",
      "FIXME",
      "PLACEHOLDER"
    ];
    this.rootPatterns = options.rootPatterns || ["src", "tests"];
  }

  /**
   * Scan a repository on disk for integrity violations.
   *
   * @param {string} repoRoot
   * @returns {Promise<object>}
   */
  async scanRepository(repoRoot) {
    const root = repoRoot || process.cwd();
    const jsFiles = this.#collectJsFiles(root);

    const fileReports = jsFiles.map((filePath) =>
      this.#scanFile(path.join(root, filePath), filePath)
    );

    const violations = fileReports.flatMap((r) => r.violations);
    const ok = violations.length === 0;

    return {
      repoRoot: root,
      ok,
      filesScanned: jsFiles.length,
      violations,
      summary: {
        placeholderViolations: violations.filter((v) => v.type === "placeholder").length,
        exportViolations: violations.filter((v) => v.type === "no-export").length
      }
    };
  }

  #collectJsFiles(root) {
    const pending = [...this.rootPatterns];
    const result = [];

    while (pending.length > 0) {
      const rel = pending.pop();
      const full = path.join(root, rel);
      if (!fs.existsSync(full)) continue;

      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        const entries = fs.readdirSync(full);
        entries.forEach((name) => {
          const subRel = path.join(rel, name);
          pending.push(subRel);
        });
      } else if (stat.isFile()) {
        if (full.endsWith(".js") || full.endsWith(".mjs") || full.endsWith(".cjs")) {
          result.push(rel);
        }
      }
    }

    return result;
  }

  #scanFile(fullPath, relativePath) {
    const source = fs.readFileSync(fullPath, "utf8");
    const violations = [];

    if (this.forbidPlaceholders) {
      this.placeholderPatterns.forEach((pattern) => {
        const idx = source.indexOf(pattern);
        if (idx >= 0) {
          violations.push({
            type: "placeholder",
            pattern,
            file: relativePath,
            offset: idx,
            message: `Forbidden placeholder pattern "${pattern}" found in ${relativePath}.`
          });
        }
      });
    }

    if (!source.includes("export ") && !source.includes("module.exports")) {
      violations.push({
        type: "no-export",
        file: relativePath,
        message: `File ${relativePath} does not export any public API.`
      });
    }

    return {
      file: relativePath,
      violations
    };
  }
}

export default IntegrityScanner;
