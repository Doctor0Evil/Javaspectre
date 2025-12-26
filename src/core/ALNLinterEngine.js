// File: ./src/core/ALNLinterEngine.js
// Purpose: ALN-resonant JavaScript linter for Javaspectre.
// Integrates ALNKernel + static checks + doctrine rules into a single engine.

import fs from 'fs';
import path from 'path';
import ALNKernel from './ALNKernel.js';
import IntegrityEngine from './IntegrityEngine.js';

/**
 * ALNLinterEngine
 * - Lints JavaScript sources with a mix of static checks and ALN-guided reasoning.
 * - Outputs structured findings plus ALN transparency metadata.
 */
export class ALNLinterEngine {
  constructor(options = {}) {
    this.alnKernel = options.alnKernel || new ALNKernel();
    this.integrityEngine = options.integrityEngine || new IntegrityEngine(true);

    this.maxLines = typeof options.maxLines === 'number' && options.maxLines > 0
      ? options.maxLines
      : 5000;

    this.doctrines = options.doctrines && Array.isArray(options.doctrines)
      ? Array.from(new Set(options.doctrines)).sort((a, b) => a - b)
      : [1, 2, 3, 5, 7, 9, 10]; // Core doctrine subset.
  }

  /**
   * Lint a JS file on disk.
   * @param {string} filename
   * @returns {Promise<object>}
   */
  async lintFile(filename) {
    if (!filename || typeof filename !== 'string') {
      throw new Error('ALNLinterEngine.lintFile: filename must be a non-empty string.');
    }

    const abs = path.resolve(process.cwd(), filename);
    const source = await fs.promises.readFile(abs, 'utf8');

    return this.lintSource({
      filename: abs,
      source,
      fileIntent: this.inferFileIntentFromPath(abs)
    });
  }

  /**
   * Lint an in-memory JS source.
   * @param {object} params
   * @param {string} params.filename
   * @param {string} params.source
   * @param {string} [params.fileIntent] - Optional short English description.
   * @returns {Promise<object>}
   */
  async lintSource({ filename, source, fileIntent }) {
    if (!filename) {
      throw new Error('ALNLinterEngine.lintSource: filename is required.');
    }
    if (typeof source !== 'string' || source.trim().length === 0) {
      throw new Error('ALNLinterEngine.lintSource: source must be a non-empty string.');
    }

    const lines = source.split(/\r?\n/);
    if (lines.length > this.maxLines) {
      return this.buildResult({
        filename,
        source,
        findings: [{
          id: 'limit:max-lines',
          severity: 'warning',
          message: `File has ${lines.length} lines, exceeding configured maxLines ${this.maxLines}. Consider splitting into smaller modules.`,
          doctrine: 7
        }],
        metrics: this.computeBasicMetrics(lines),
        transparencyTrail: null
      });
    }

    const metrics = this.computeBasicMetrics(lines);
    const integrityResult = this.integrityEngine.validateSource(filename, source);

    const intent = this.buildALNIntent(filename, fileIntent, metrics);
    const constraints = {
      language: 'JavaScript',
      requireCompleteness: true,
      forbidPlaceholders: true,
      maxReplicationTimeHours: 24
    };

    const context = {
      filename,
      metrics,
      doctrines: this.doctrines
    };

    const [, alnSteps, alnTrail] = this.alnKernel.reason(intent, constraints, context);

    const doctrineFindings = this.applyDoctrineChecks(filename, source, metrics, integrityResult);
    const hygieneFindings = this.applyHygieneChecks(filename, lines, metrics);
    const findings = [
      ...integrityResult.violations.map((v) => this.wrapIntegrityViolation(v)),
      ...doctrineFindings,
      ...hygieneFindings
    ];

    return this.buildResult({
      filename,
      source,
      findings,
      metrics,
      transparencyTrail: alnTrail
    });
  }

  computeBasicMetrics(lines) {
    const lineCount = lines.length;
    let nonEmpty = 0;
    let commentLines = 0;
    let todoCount = 0;
    let exportCount = 0;
    let functionCount = 0;

    const exportRegex = /\bexport\b|\bmodule\.exports\b/;
    const funcRegex = /\bfunction\b|\b=>\s*{/;
    const commentLineRegex = /^\s*\/\//;
    const blockCommentStart = /^\s*\/\*/;
    const blockCommentEnd = /\*\/\s*$/;

    let inBlockComment = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.length > 0) nonEmpty += 1;

      if (inBlockComment) {
        commentLines += 1;
        if (blockCommentEnd.test(line)) {
          inBlockComment = false;
        }
      } else if (commentLineRegex.test(line)) {
        commentLines += 1;
      } else if (blockCommentStart.test(line)) {
        commentLines += 1;
        if (!blockCommentEnd.test(line)) {
          inBlockComment = true;
        }
      }

      if (/TODO|TBD|FIXME/i.test(line)) {
        todoCount += 1;
      }
      if (exportRegex.test(line)) {
        exportCount += 1;
      }
      if (funcRegex.test(line)) {
        functionCount += 1;
      }
    });

    return {
      lineCount,
      nonEmptyLines: nonEmpty,
      commentLines,
      todoCount,
      exportCount,
      functionCount,
      commentDensity: lineCount === 0 ? 0 : commentLines / lineCount
    };
  }

  buildALNIntent(filename, fileIntent, metrics) {
    const base = fileIntent && typeof fileIntent === 'string'
      ? fileIntent.trim()
      : `Lint and refine JavaScript module ${path.basename(filename)} for doctrine-compliant quality.`;

    const metas = [
      `File has ${metrics.lineCount} lines (${metrics.nonEmptyLines} non-empty).`,
      `Contains ${metrics.functionCount} functions and ${metrics.exportCount} exports.`,
      `Comment density is ${(metrics.commentDensity * 100).toFixed(1)}%.`,
      metrics.todoCount > 0
        ? `Found ${metrics.todoCount} TODO-like markers.`
        : 'Contains no TODO/TBD/FIXME markers.'
    ];

    return `${base} ${metas.join(' ')}`;
  }

  applyDoctrineChecks(filename, source, metrics, integrityResult) {
    const findings = [];

    if (!integrityResult.ok) {
      findings.push({
        id: 'doctrine:integrity',
        severity: 'error',
        message: 'IntegrityEngine detected violations; file fails the Completion and Integrity Protocol.',
        doctrine: 2,
        details: integrityResult.violations
      });
    }

    if (metrics.todoCount > 0) {
      findings.push({
        id: 'doctrine:placeholders',
        severity: 'warning',
        message: `Detected ${metrics.todoCount} TODO/TBD/FIXME markers; doctrine forbids placeholder work in production modules.`,
        doctrine: 2
      });
    }

    if (metrics.exportCount === 0) {
      findings.push({
        id: 'doctrine:public-api',
        severity: 'warning',
        message: 'File exports no public API; consider exposing a clear, minimal interface for reuse and transparency.',
        doctrine: 1
      });
    }

    if (metrics.lineCount > 800 && metrics.functionCount <= 3) {
      findings.push({
        id: 'doctrine:granularity',
        severity: 'info',
        message: 'Large file with few functions detected; doctrine encourages granular, inspectable units of behavior.',
        doctrine: 7
      });
    }

    if (source.includes('any /* spectral-ignore */')) {
      findings.push({
        id: 'doctrine:transparency-bypass',
        severity: 'warning',
        message: 'Found manual transparency bypass marker; ensure this is justified and documented.',
        doctrine: 9
      });
    }

    return findings;
  }

  applyHygieneChecks(filename, lines, metrics) {
    const findings = [];

    if (metrics.commentDensity < 0.02 && metrics.lineCount > 50) {
      findings.push({
        id: 'hygiene:low-comments',
        severity: 'info',
        message: 'Very low comment density detected; consider adding short rationales for complex logic.',
        doctrine: 9
      });
    }

    const trailingSpaceLines = [];
    lines.forEach((line, index) => {
      if (/\s+$/.test(line)) {
        trailingSpaceLines.push(index + 1);
      }
    });

    if (trailingSpaceLines.length > 0) {
      findings.push({
        id: 'hygiene:trailing-spaces',
        severity: 'info',
        message: `Trailing whitespace found on lines: ${trailingSpaceLines.slice(0, 20).join(', ')}.`,
        doctrine: 7
      });
    }

    let hasConsoleLog = false;
    lines.forEach((line) => {
      if (/\bconsole\.log\b/.test(line)) {
        hasConsoleLog = true;
      }
    });

    if (hasConsoleLog) {
      findings.push({
        id: 'hygiene:console-log',
        severity: 'warning',
        message: 'console.log statements detected; prefer structured telemetry or debug logging for production code.',
        doctrine: 10
      });
    }

    return findings;
  }

  wrapIntegrityViolation(v) {
    return {
      id: `integrity:${v.type}`,
      severity: v.type === 'placeholder' ? 'error' : 'warning',
      message: v.message,
      doctrine: 2,
      meta: {
        pattern: v.pattern || null
      }
    };
  }

  buildResult({ filename, source, findings, metrics, transparencyTrail }) {
    const severityOrder = { error: 3, warning: 2, info: 1 };
    const sortedFindings = findings.slice().sort((a, b) => {
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });

    const summary = {
      filename,
      totalFindings: sortedFindings.length,
      errorCount: sortedFindings.filter((f) => f.severity === 'error').length,
      warningCount: sortedFindings.filter((f) => f.severity === 'warning').length,
      infoCount: sortedFindings.filter((f) => f.severity === 'info').length
    };

    return {
      summary,
      metrics,
      findings: sortedFindings,
      transparencyTrail
    };
  }

  inferFileIntentFromPath(filename) {
    const base = path.basename(filename).toLowerCase();

    if (base.includes('test')) return 'Test module validating ALN or spectral behaviors.';
    if (base.includes('kernel')) return 'Core ALN reasoning kernel module.';
    if (base.includes('harvest')) return 'Module for harvesting or refining spectral inputs.';
    if (base.includes('impact')) return 'Module for measuring or simulating impact metrics.';
    if (base.includes('lint')) return 'Module for applying doctrine-aware linting to code artifacts.';

    return 'General-purpose Javaspectre module participating in ALN-driven systems.';
  }
}

export default ALNLinterEngine;
