// IntegrityEngine.js
// Enforces the Completion and Integrity Protocol for code artifacts.

export class IntegrityEngine {
  constructor({ forbidPlaceholders = true } = {}) {
    this.forbidPlaceholders = forbidPlaceholders;
    this.placeholderPatterns = [
      'TODO',
      'TBD',
      'PLACEHOLDER',
      'FIXME'
    ];
  }

  /**
   * Validate a JavaScript source string against integrity constraints.
   */
  validateSource({ filename, source }) {
    if (!filename) throw new Error('IntegrityEngine.validateSource: "filename" is required.');
    if (typeof source !== 'string' || source.length === 0) {
      throw new Error('IntegrityEngine.validateSource: "source" must be a non-empty string.');
    }

    const violations = [];

    if (this.forbidPlaceholders) {
      for (const pattern of this.placeholderPatterns) {
        if (source.includes(pattern)) {
          violations.push({
            type: 'placeholder',
            pattern,
            message: `Forbidden placeholder "${pattern}" found in ${filename}.`
          });
        }
      }
    }

    if (!source.includes('export ') && !source.includes('module.exports')) {
      violations.push({
        type: 'no-export',
        message: `File ${filename} does not export any public API.`
      });
    }

    return {
      filename,
      ok: violations.length === 0,
      violations
    };
  }
}

export default IntegrityEngine;
