// Path: src/capabilities/AdaptiveIntegrityService.js
// Continuous enforcement of spectral purity.

import { IntegrityScanner } from "../core/IntegrityScanner.js";

export class AdaptiveIntegrityService {
  constructor(options = {}) {
    this.scanner =
      options.scanner || new IntegrityScanner({ forbidPlaceholders: true });
  }

  /**
   * Run a one-off integrity scan and return results plus suggested actions.
   *
   * @param {object} params
   * @param {string} [params.repoRoot]
   * @returns {Promise<object>}
   */
  async runScan(params = {}) {
    const repoRoot = params.repoRoot || process.cwd();
    const report = await this.scanner.scanRepository(repoRoot);
    const actions = this.#suggestActions(report);
    return {
      report,
      actions
    };
  }

  #suggestActions(report) {
    const actions = [];

    report.violations.forEach((v) => {
      if (v.type === "placeholder") {
        actions.push({
          type: "edit-file",
          file: v.file,
          message:
            "Remove or resolve placeholder and replace with complete implementation."
        });
      }
      if (v.type === "no-export") {
        actions.push({
          type: "add-export",
          file: v.file,
          message:
            "Add an explicit export so the module provides a public API."
        });
      }
    });

    if (actions.length === 0) {
      actions.push({
        type: "none",
        message: "No integrity issues detected. Spectral purity is maintained."
      });
    }

    return actions;
  }
}

export default AdaptiveIntegrityService;
