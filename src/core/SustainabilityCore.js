// Path: src/core/SustainabilityCore.js
// Aggregates impact metrics, emissions scoring, and optimization advice.

import fs from "fs";
import path from "path";

export class SustainabilityCore {
  constructor(options = {}) {
    this.modelsDir =
      options.modelsDir ||
      path.join(process.cwd(), "data", "models");
    this.sustainabilityModelFile =
      options.sustainabilityModelFile || "sustainability.json";
    this.impactPatternsFile =
      options.impactPatternsFile || "impactPatterns.json";
    this.models = this.#loadModels();
  }

  /**
   * Evaluate impact for a planned execution.
   *
   * @param {object} params
   * @returns {object}
   */
  evaluateImpact(params) {
    const { intent, dependencyPlan, executionRecipe } = params;

    const baseline = this.models.baseline;
    const dependencyScore = this.#scoreDependencies(dependencyPlan);
    const capabilityScore = this.#scoreCapabilities(executionRecipe);
    const intentScore = this.#scoreIntent(intent);

    const total = baseline.baseScore + dependencyScore + capabilityScore + intentScore;
    const clamped = Math.max(0, Math.min(100, Math.round(total)));

    const optimizationHints = this.#buildHints({
      dependencyPlan,
      executionRecipe,
      score: clamped
    });

    return {
      summary: {
        impactScore: clamped,
        classification: clamped >= 70 ? "high-positive" : clamped >= 40 ? "neutral" : "needs-improvement"
      },
      components: {
        baseline,
        dependencyScore,
        capabilityScore,
        intentScore
      },
      optimizationHints
    };
  }

  #loadModels() {
    const sustainabilityPath = path.join(
      this.modelsDir,
      this.sustainabilityModelFile
    );
    const impactPatternsPath = path.join(
      this.modelsDir,
      this.impactPatternsFile
    );

    let sustainability = {
      baseScore: 50
    };
    let impactPatterns = {
      energySavingKeywords: ["energy", "efficiency", "optimize", "green", "carbon"],
      highImpactCapabilities: ["planetary-impact-sim", "adaptive-integrity-service"]
    };

    if (fs.existsSync(sustainabilityPath)) {
      try {
        sustainability = JSON.parse(fs.readFileSync(sustainabilityPath, "utf8"));
      } catch {
        // keep defaults
      }
    }

    if (fs.existsSync(impactPatternsPath)) {
      try {
        impactPatterns = JSON.parse(fs.readFileSync(impactPatternsPath, "utf8"));
      } catch {
        // keep defaults
      }
    }

    return {
      baseline: {
        baseScore: typeof sustainability.baseScore === "number" ? sustainability.baseScore : 50
      },
      impactPatterns
    };
  }

  #scoreDependencies(dependencyPlan) {
    if (!dependencyPlan || !dependencyPlan.dependencies) return 0;
    const count = Object.keys(dependencyPlan.dependencies).length;
    if (count <= 5) return 10;
    if (count <= 10) return 5;
    if (count <= 20) return 0;
    return -5;
  }

  #scoreCapabilities(executionRecipe) {
    if (!executionRecipe || !executionRecipe.steps) return 0;
    const { impactPatterns } = this.models;
    let score = 0;
    executionRecipe.steps.forEach((step) => {
      if (impactPatterns.highImpactCapabilities.includes(step.capabilityId)) {
        score += 8;
      }
      if (step.capabilityId === "cross-platform-builder") {
        score += 3;
      }
    });
    return score;
  }

  #scoreIntent(intent) {
    if (!intent || typeof intent !== "string") return 0;
    const lower = intent.toLowerCase();
    const { impactPatterns } = this.models;
    let score = 0;
    impactPatterns.energySavingKeywords.forEach((kw) => {
      if (lower.includes(kw)) {
        score += 4;
      }
    });
    if (lower.includes("monitor") || lower.includes("dashboard")) {
      score += 2;
    }
    if (lower.includes("batch job") || lower.includes("cron")) {
      score -= 2;
    }
    return score;
  }

  #buildHints({ dependencyPlan, executionRecipe, score }) {
    const hints = [];

    if (dependencyPlan && dependencyPlan.dependencies) {
      const count = Object.keys(dependencyPlan.dependencies).length;
      if (count > 10) {
        hints.push(
          `Dependency count is ${count}. Consider consolidating libraries or removing unused packages to reduce build and install energy.`
        );
      }
    }

    if (executionRecipe && executionRecipe.steps) {
      const hasImpactSim = executionRecipe.steps.some(
        (s) => s.capabilityId === "planetary-impact-sim"
      );
      if (!hasImpactSim) {
        hints.push(
          "Include PlanetaryImpactSim in the execution recipe to quantify CO₂, energy, and cost outcomes before deployment."
        );
      }
    }

    if (score < 40) {
      hints.push(
        "Overall impact score is low. Revisit architecture choices with a focus on fewer moving parts, cache use, and hosting on efficient infrastructure."
      );
    }

    if (hints.length === 0) {
      hints.push(
        "Impact score is strong and no immediate sustainability concerns were detected for this plan."
      );
    }

    return hints;
  }
}

export default SustainabilityCore;
