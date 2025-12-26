// Path: src/core/SpectralEngine.js
// Main orchestrator integrating ALN reasoning, capability selection, and spectral automation.

import crypto from "crypto";
import { buildExecutionRecipe } from "../capabilities/JavaspectreCapabilities.js";
import { ALNIntentResolver } from "./ALNIntentResolver.js";
import { QuantumDependencyManager } from "./QuantumDependencyManager.js";
import { IntegrityScanner } from "./IntegrityScanner.js";
import { CognitiveTransparency } from "./CognitiveTransparency.js";
import { SustainabilityCore } from "./SustainabilityCore.js";

export class SpectralEngine {
  constructor(options = {}) {
    this.engineId = options.engineId || "javaspectre-spectral-engine-v1";
    this.intentResolver = options.intentResolver || new ALNIntentResolver();
    this.dependencyManager =
      options.dependencyManager || new QuantumDependencyManager();
    this.integrityScanner =
      options.integrityScanner || new IntegrityScanner({ forbidPlaceholders: true });
    this.transparency =
      options.transparency || new CognitiveTransparency({ engineId: this.engineId });
    this.sustainabilityCore =
      options.sustainabilityCore || new SustainabilityCore();
  }

  /**
   * High-level orchestration entrypoint.
   * Turns a natural-language intent into a spectral execution plan and evaluation report.
   *
   * @param {string} intent
   * @param {object} context
   * @returns {Promise<object>}
   */
  async run(intent, context = {}) {
    if (!intent || typeof intent !== "string") {
      throw new Error("SpectralEngine.run: intent must be a non-empty string.");
    }

    const startedAt = new Date().toISOString();
    const runId = this.#hash(`${this.engineId}:${intent}:${startedAt}`);

    const resolvedIntent = await this.intentResolver.resolveIntent(intent, context);

    const recipe = buildExecutionRecipe(resolvedIntent.canonicalIntent);

    const dependencyPlan = this.dependencyManager.buildDeterministicPlan({
      intent: resolvedIntent.canonicalIntent,
      recipe,
      runtime: context.runtime || "node",
      targetNodeVersion: context.targetNodeVersion || "18.x"
    });

    const integrityReport = await this.integrityScanner.scanRepository(
      context.repoRoot || process.cwd()
    );

    const sustainabilityReport = this.sustainabilityCore.evaluateImpact({
      intent: resolvedIntent.canonicalIntent,
      dependencyPlan,
      executionRecipe: recipe
    });

    const transparencyTrail = this.transparency.buildTrail({
      runId,
      intent,
      resolvedIntent,
      recipe,
      dependencyPlan,
      integrityReport,
      sustainabilityReport,
      startedAt,
      completedAt: new Date().toISOString()
    });

    return {
      runId,
      engineId: this.engineId,
      intent,
      resolvedIntent,
      recipe,
      dependencyPlan,
      integrityReport,
      sustainabilityReport,
      transparencyTrail
    };
  }

  #hash(text) {
    return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
  }
}

export default SpectralEngine;
