// Path: src/core/CognitiveTransparency.js
// Generates rationale metadata for every code artifact and engine run.

export class CognitiveTransparency {
  constructor(options = {}) {
    this.engineId = options.engineId || "javaspectre-transparency-engine-v1";
  }

  /**
   * Build a transparency trail for a SpectralEngine run or similar process.
   *
   * @param {object} payload
   * @returns {object}
   */
  buildTrail(payload) {
    const {
      runId,
      intent,
      resolvedIntent,
      recipe,
      dependencyPlan,
      integrityReport,
      sustainabilityReport,
      startedAt,
      completedAt
    } = payload;

    return {
      engineId: this.engineId,
      runId,
      timestamps: {
        startedAt,
        completedAt
      },
      intent: {
        raw: intent,
        resolved: resolvedIntent
      },
      planning: {
        recipe,
        dependencyPlan
      },
      integrity: integrityReport,
      sustainability: sustainabilityReport,
      rationale: this.#deriveRationale({
        intent,
        resolvedIntent,
        recipe,
        dependencyPlan,
        integrityReport,
        sustainabilityReport
      })
    };
  }

  /**
   * Embed transparency metadata into a JSON-like manifest (e.g., package.json).
   *
   * @param {object} manifest
   * @param {object} trail
   * @returns {object}
   */
  embedIntoManifest(manifest, trail) {
    const clone = { ...manifest };
    clone.javaspectre = clone.javaspectre || {};
    clone.javaspectre.transparencyTrail = trail;
    return clone;
  }

  #deriveRationale({
    intent,
    resolvedIntent,
    recipe,
    dependencyPlan,
    integrityReport,
    sustainabilityReport
  }) {
    const reasons = [];

    reasons.push(
      "This run applies the Javaspectre Operational Doctrine: code purity, completeness, enrichment, and spectral impact."
    );

    if (resolvedIntent?.domain) {
      reasons.push(`Intent classified under domain "${resolvedIntent.domain}".`);
    }
    if (resolvedIntent?.flags?.length) {
      reasons.push(
        `Intent flags activated: ${resolvedIntent.flags.join(", ")}.`
      );
    }
    if (recipe?.steps?.length) {
      const names = recipe.steps.map((s) => s.capabilityName).join(", ");
      reasons.push(`Execution recipe selected capabilities: ${names}.`);
    }
    if (dependencyPlan?.dependencies) {
      const names = Object.keys(dependencyPlan.dependencies);
      reasons.push(
        `Deterministic dependency plan locked ${names.length} packages: ${names.join(", ")}.`
      );
    }
    if (integrityReport) {
      if (integrityReport.ok) {
        reasons.push(
          "Integrity scan passed with no placeholders and all files exporting public APIs."
        );
      } else {
        reasons.push(
          `Integrity scan found ${integrityReport.violations.length} issue(s) requiring remediation.`
        );
      }
    }
    if (sustainabilityReport) {
      reasons.push(
        `Sustainability analysis indicates projected impact score ${sustainabilityReport.summary?.impactScore}.`
      );
    }

    return {
      narrative: reasons,
      doctrine: [
        "Code Purity Law",
        "Completion and Integrity Protocol",
        "Enrichment Mandate",
        "Spectral Impact Maximization"
      ]
    };
  }
}

export default CognitiveTransparency;
