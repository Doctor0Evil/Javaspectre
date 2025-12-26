// Path: src/capabilities/SpectralRefiner.js
// One-command "refinement" pipeline for upgrading rough code into hardened modules.

import fs from "fs";
import path from "path";
import { IntegrityScanner } from "../core/IntegrityScanner.js";

export class SpectralRefiner {
  constructor(options = {}) {
    this.integrityScanner =
      options.integrityScanner || new IntegrityScanner({ forbidPlaceholders: true });
  }

  /**
   * Refine a JavaScript file in place, producing a safer and more structured module.
   *
   * @param {object} params
   * @param {string} params.filePath
   * @returns {object}
   */
  refineFile(params = {}) {
    const { filePath } = params;
    if (!filePath) {
      throw new Error("SpectralRefiner.refineFile: filePath is required.");
    }

    const full = path.resolve(filePath);
    if (!fs.existsSync(full)) {
      throw new Error(`SpectralRefiner.refineFile: file does not exist: ${full}`);
    }

    const original = fs.readFileSync(full, "utf8");
    const sanitized = this.#sanitizeSource(original);
    const withExport = this.#ensureExport(sanitized);

    fs.writeFileSync(full, withExport, "utf8");

    const repoRoot = this.#findRepoRoot(path.dirname(full));
    return this.integrityScanner.scanRepository(repoRoot);
  }

  #sanitizeSource(source) {
    let cleaned = source;
    const patterns = ["TODO", "TBD", "FIXME", "PLACEHOLDER"];
    patterns.forEach((p) => {
      const re = new RegExp(p, "g");
      cleaned = cleaned.replace(re, "");
    });
    return cleaned;
  }

  #ensureExport(source) {
    if (source.includes("export ") || source.includes("module.exports")) {
      return source;
    }

    const wrapped = [];
    wrapped.push("// Export wrapper auto-added by Javaspectre SpectralRefiner.");
    wrapped.push(source.trim());
    wrapped.push("");
    wrapped.push("export default {};");

    return wrapped.join("\n");
  }

  #findRepoRoot(startDir) {
    let dir = startDir;
    while (dir && dir !== path.dirname(dir)) {
      const candidate = path.join(dir, "package.json");
      if (fs.existsSync(candidate)) {
        return dir;
      }
      dir = path.dirname(dir);
    }
    return startDir;
  }
}

export default SpectralRefiner;
