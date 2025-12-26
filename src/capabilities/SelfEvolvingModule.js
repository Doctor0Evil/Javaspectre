// Path: src/capabilities/SelfEvolvingModule.js"
// PR-generating self-optimization subsystem.

import fs from "fs";
import path from "path";
import crypto from "crypto";

export class SelfEvolvingModule {
  constructor(options = {}) {
    this.repoRoot = options.repoRoot || process.cwd();
    this.reportDir =
      options.reportDir || path.join(this.repoRoot, ".javaspectre", "evolution");
  }

  /**
   * Analyze a repository and emit a refactor suggestion report.
   *
   * @returns {object}
   */
  analyzeRepo() {
    const files = this.#collectJsFiles(this.repoRoot);
    const suggestions = [];

    files.forEach((file) => {
      const full = path.join(this.repoRoot, file);
      const source = fs.readFileSync(full, "utf8");
      const metrics = this.#computeMetrics(source);

      if (metrics.lines > 300 || metrics.complexity > 40) {
        suggestions.push({
          file,
          reason: "Large or complex file.",
          metrics
        });
      }
    });

    const report = {
      repoRoot: this.repoRoot,
      createdAt: new Date().toISOString(),
      filesAnalyzed: files.length,
      suggestions
    };

    this.#ensureDir(this.reportDir);
    const id = crypto.randomBytes(8).toString("hex");
    const dest = path.join(this.reportDir, `refactor-report-${id}.json`);
    fs.writeFileSync(dest, JSON.stringify(report, null, 2), "utf8");

    return {
      report,
      path: dest
    };
  }

  #collectJsFiles(root) {
    const pending = ["src", "tests"];
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

  #computeMetrics(source) {
    const lines = source.split("\n");
    let complexity = 0;
    const patterns = ["if ", "for ", "while ", "case ", "catch ", "&&", "||", "?"];

    lines.forEach((line) => {
      const trimmed = line.trim();
      patterns.forEach((p) => {
        if (trimmed.includes(p)) {
          complexity += 1;
        }
      });
    });

    return {
      lines: lines.length,
      complexity
    };
  }

  #ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export default SelfEvolvingModule;
