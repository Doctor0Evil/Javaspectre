// Path: src/core/ALNIntentResolver.js
// Converts natural language intents into executable blueprints and canonical forms.

export class ALNIntentResolver {
  constructor(options = {}) {
    this.modelId = options.modelId || "javaspectre-aln-intent-v1";
  }

  /**
   * Resolve a raw intent string into a canonical representation that other modules can use.
   *
   * @param {string} intent
   * @param {object} context
   * @returns {Promise<object>}
   */
  async resolveIntent(intent, context = {}) {
    if (!intent || typeof intent !== "string") {
      throw new Error("ALNIntentResolver.resolveIntent: intent must be a non-empty string.");
    }

    const lower = intent.toLowerCase();

    const domain = this.#inferDomain(lower);
    const priority = this.#inferPriority(lower);
    const flags = this.#inferFlags(lower);
    const objectives = this.#extractObjectives(lower);

    const canonicalIntent = this.#buildCanonicalIntent({
      intent,
      domain,
      objectives,
      flags
    });

    const transparency = {
      modelId: this.modelId,
      domain,
      priority,
      flags,
      objectives,
      receivedContextKeys: Object.keys(context || {})
    };

    return {
      canonicalIntent,
      domain,
      priority,
      flags,
      objectives,
      transparency
    };
  }

  #inferDomain(lower) {
    if (lower.includes("sustain") || lower.includes("carbon") || lower.includes("energy")) {
      return "sustainability";
    }
    if (lower.includes("repo") || lower.includes("repository") || lower.includes("scaffold")) {
      return "repository";
    }
    if (lower.includes("dom") || lower.includes("selector") || lower.includes("scrape")) {
      return "dom-harvest";
    }
    if (lower.includes("deploy") || lower.includes("docker") || lower.includes("serverless")) {
      return "deployment";
    }
    if (lower.includes("refine") || lower.includes("optimize") || lower.includes("improve")) {
      return "refinement";
    }
    return "general";
  }

  #inferPriority(lower) {
    if (lower.includes("critical") || lower.includes("urgent")) return "high";
    if (lower.includes("explore") || lower.includes("experiment")) return "low";
    return "normal";
  }

  #inferFlags(lower) {
    const flags = [];
    if (lower.includes("24-hour") || lower.includes("24 hour") || lower.includes("24h")) {
      flags.push("replication-24h");
    }
    if (lower.includes("open source") || lower.includes("public repo")) {
      flags.push("open-source-target");
    }
    if (lower.includes("zero-config") || lower.includes("zero config")) {
      flags.push("zero-config");
    }
    if (lower.includes("self-healing") || lower.includes("self healing")) {
      flags.push("self-healing");
    }
    return flags;
  }

  #extractObjectives(lower) {
    const objectives = [];
    const patterns = [
      "build ",
      "create ",
      "make ",
      "design ",
      "analyze ",
      "simulate "
    ];

    patterns.forEach((p) => {
      const idx = lower.indexOf(p);
      if (idx >= 0) {
        const fragment = lower.slice(idx + p.length).trim();
        if (fragment.length > 0) {
          objectives.push(fragment);
        }
      }
    });

    if (objectives.length === 0) {
      objectives.push(lower.trim());
    }

    const seen = new Set();
    return objectives.filter((o) => {
      const key = o;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  #buildCanonicalIntent({ intent, domain, objectives, flags }) {
    return [
      `[domain:${domain}]`,
      `[flags:${flags.join(",") || "none"}]`,
      `[objectives:${objectives.join(" | ")}]`,
      intent
    ].join(" ");
  }
}

export default ALNIntentResolver;
