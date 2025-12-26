// Path: src/core/ALNEngine.js

/**
 * ALNEngine
 *
 * A JavaScript-hosted Augmented Language Network runtime that:
 * - Turns natural-language intents into structured ALN plans.
 * - Treats ALN "modules" (like ThemeTokenMapper.aln) as first-class virtual-objects.
 * - Generates repository blueprints and executable JS skeletons from ALN specs.
 * - Executes ALN plans stepwise on live data for rapid prototyping.
 *
 * This is designed as the kind of "killer runtime" that could make ALN
 * the most useful and widely adopted programming meta-language.
 */

class ALNEngine {
  constructor(options = {}) {
    this.modelId = options.modelId || "aln-core-v1";
    this.maxSteps = typeof options.maxSteps === "number" ? options.maxSteps : 32;
    this.defaultLanguage = "JavaScript";
  }

  // ---------------------------------------------------------------------------
  // 1. Intent → Plan (core ALN move)
  // ---------------------------------------------------------------------------

  /**
   * High-level reasoning entrypoint.
   * Turns an intent string + optional context into a normalized ALN plan.
   *
   * @param {string} intent
   * @param {object} [context]
   * @returns {{planId: string, steps: object[], transparencyTrail: object}}
   */
  plan(intent, context = {}) {
    if (typeof intent !== "string" || !intent.trim()) {
      throw new Error("ALNEngine.plan: intent must be a non-empty string.");
    }

    const createdAt = new Date().toISOString();
    const planId = this._hash(`${intent}:${createdAt}`);

    const normalizedContext = this._normalizeContext(context);
    const classifiers = this._classifyIntent(intent, normalizedContext);
    const steps = this._synthesizeSteps(intent, normalizedContext, classifiers);

    const transparencyTrail = {
      planId,
      modelId: this.modelId,
      intent,
      classifiers,
      context: normalizedContext,
      createdAt,
      assumptions: this._deriveAssumptions(intent, normalizedContext, classifiers),
      risks: this._deriveRisks(intent, normalizedContext),
      tradeoffs: this._deriveTradeoffs(intent, normalizedContext)
    };

    return { planId, steps, transparencyTrail };
  }

  // ---------------------------------------------------------------------------
  // 2. ALN Module Introspection (ThemeTokenMapper-style)
  // ---------------------------------------------------------------------------

  /**
   * Introspect an ALN-style module description into a structural type graph.
   * This allows JS tools to understand ALN modules (structs, fns, constants).
   *
   * @param {string} moduleName
   * @param {object} alnModuleSpec - e.g., parsed from .aln definition
   */
  introspectModule(moduleName, alnModuleSpec) {
    const structs = [];
    const functions = [];
    const constants = [];

    if (Array.isArray(alnModuleSpec.structs)) {
      alnModuleSpec.structs.forEach((s) => {
        structs.push({
          name: s.name,
          fields: s.fields || [],
          doc: s.doc || ""
        });
      });
    }

    if (Array.isArray(alnModuleSpec.functions)) {
      alnModuleSpec.functions.forEach((fn) => {
        functions.push({
          name: fn.name,
          params: fn.params || [],
          returnType: fn.returnType || "any",
          doc: fn.doc || ""
        });
      });
    }

    if (Array.isArray(alnModuleSpec.constants)) {
      alnModuleSpec.constants.forEach((c) => {
        constants.push({
          name: c.name,
          type: c.type || "any",
          value: c.value,
          doc: c.doc || ""
        });
      });
    }

    return {
      module: moduleName,
      structs,
      functions,
      constants,
      summary: {
        structCount: structs.length,
        functionCount: functions.length,
        constantCount: constants.length
      }
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Repo Blueprint Generator (ALN → GitHub-ready JS repo)
  // ---------------------------------------------------------------------------

  /**
   * Generate a repo blueprint from an ALN module + intent.
   *
   * @param {string} intent
   * @param {object} alnSpecGraph - result of introspectModule or combined specs
   * @returns {{name: string, structure: object, replicationProfile: object}}
   */
  generateRepoBlueprint(intent, alnSpecGraph) {
    const baseName = this._slug(
      intent
        .split(/\s+/)
        .slice(0, 4)
        .join("-")
    );

    const name = baseName || "aln-project";
    const createdAt = new Date().toISOString();

    const coreFiles = [
      "README.md",
      "MANIFESTO.md",
      "LICENSE",
      "package.json",
      ".gitignore"
    ];

    const structure = {
      rootFiles: coreFiles,
      directories: {
        src: {
          core: [
            "ALNEngine.js",
            `${alnSpecGraph.module || "ALNModule"}.js`
          ],
          blueprints: [
            "RepoBlueprint.js",
            "VirtualObjectMapper.js"
          ],
          cli: [
            "aln-cli.js"
          ]
        },
        examples: [
          "demo-aln-plan.js",
          "demo-theme-mapper.js"
        ],
        test: [
          "ALNEngine.test.js",
          "ModuleContracts.test.js"
        ]
      }
    };

    const replicationProfile = {
      targetMaxHours: 24,
      prerequisites: ["Node.js >= 18", "npm or pnpm", "Git + GitHub account"],
      steps: [
        "Clone the repository.",
        "Run `npm install`.",
        "Run `npm test`.",
        "Run `node examples/demo-aln-plan.js` to see ALN planning in action.",
        "Adapt src/core and src/blueprints to your system."
      ],
      createdAt
    };

    return { name, structure, replicationProfile, createdAt };
  }

  // ---------------------------------------------------------------------------
  // 4. Plan Executor (ALN steps → real JS operations)
  // ---------------------------------------------------------------------------

  /**
   * Execute an ALN plan step-by-step on a given context.
   * This is a minimal, pluggable runner; real systems can extend opKinds.
   *
   * @param {object[]} steps - plan steps from plan().steps
   * @param {object} context
   * @returns {{log: object[], finalContext: object}}
   */
  executePlan(steps, context = {}) {
    const ctx = { ...context };
    const log = [];

    for (let i = 0; i < steps.length && i < this.maxSteps; i++) {
      const step = steps[i];
      const result = this._executeStep(step, ctx);
      log.push({
        stepId: step.id,
        description: step.description,
        opKind: step.opKind,
        resultSummary: result.summary
      });
      if (result.mutatedContext) {
        Object.assign(ctx, result.mutatedContext);
      }
    }

    return { log, finalContext: ctx };
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  _normalizeContext(context) {
    const safe = context && typeof context === "object" ? { ...context } : {};
    if (!safe.language) safe.language = this.defaultLanguage;
    if (!safe.requireCompleteness) safe.requireCompleteness = true;
    return safe;
  }

  _classifyIntent(intent, context) {
    const lower = intent.toLowerCase();
    const tags = [];

    if (lower.includes("theme") || lower.includes("design token")) tags.push("theme-mapping");
    if (lower.includes("repository") || lower.includes("repo")) tags.push("repo-scaffolding");
    if (lower.includes("api")) tags.push("api-design");
    if (lower.includes("badge") || lower.includes("shields")) tags.push("badge-generation");
    if (lower.includes("virtual-object") || lower.includes("dom")) tags.push("virtual-object-extraction");

    if (tags.length === 0) tags.push("general-architecture");

    const complexity = lower.includes("multi-tenant") || lower.includes("distributed")
      ? "high"
      : "normal";

    return { tags, complexity, language: context.language };
  }

  _synthesizeSteps(intent, context, classifiers) {
    const steps = [];

    steps.push({
      id: "parse-intent",
      opKind: "analyze",
      description: "Parse and summarize user intent.",
      outputs: {
        summary: intent.trim().slice(0, 256),
        tags: classifiers.tags
      }
    });

    if (classifiers.tags.includes("theme-mapping")) {
      steps.push({
        id: "design-theme-graph",
        opKind: "design-graph",
        description: "Design virtual-object graph for theme tokens and color schemes.",
        outputs: {
          virtualObjects: ["ThemeScales", "ThemeTypography", "ColorSchemeSet", "ThemeTokenReport"]
        }
      });
    }

    if (classifiers.tags.includes("repo-scaffolding")) {
      steps.push({
        id: "design-repo-structure",
        opKind: "repo-blueprint",
        description: "Design repository structure aligned with ALN modules.",
        outputs: {
          directories: ["src/core", "src/blueprints", "src/cli", "examples", "test"]
        }
      });
    }

    steps.push({
      id: "map-modules",
      opKind: "module-contracts",
      description: "Define ALN module contracts (structs, functions, constants).",
      outputs: {
        modules: ["ALNEngine", "VirtualObjectMapper", "DomainSpecificModule"]
      }
    });

    steps.push({
      id: "generate-artifacts",
      opKind: "artifact-plan",
      description: "Plan generated artifacts (JS files, docs, tests).",
      outputs: {
        languages: [context.language || "JavaScript"],
        artifacts: ["JS modules", "README sections", "tests"]
      }
    });

    steps.push({
      id: "replication-strategy",
      opKind: "replication",
      description: "Ensure 24-hour replication strategy for the resulting system.",
      outputs: {
        maxHours: 24,
        requiredSkills: ["Node.js", "Git", "basic CLI"],
        hostingTargets: ["GitHub"]
      }
    });

    return steps;
  }

  _deriveAssumptions(intent, context, classifiers) {
    const assumptions = [];

    assumptions.push("User wants ALN-style structured planning, not ad-hoc scripting.");
    assumptions.push(`Target language for artifacts is ${context.language}.`);
    if (classifiers.tags.includes("repo-scaffolding")) {
      assumptions.push("User intends to publish code in a Git-based repository.");
    }
    assumptions.push("A human maintainer will review and refine generated artifacts.");

    return assumptions;
  }

  _deriveRisks(intent, context) {
    const risks = [];

    risks.push("Risk of over-generalizing ALN module contracts for simple use cases.");
    if (intent.toLowerCase().includes("critical")) {
      risks.push("Safety-critical context requires additional human review and testing.");
    }
    if (context.requireCompleteness) {
      risks.push("Strict completeness may slow iteration if requirements are evolving.");
    }

    return risks;
  }

  _deriveTradeoffs(intent, context) {
    return [
      "Favor explicit ALN module contracts over loosely-typed helper scripts.",
      "Prefer repository blueprints that are easy to fork over tightly coupled monoliths.",
      "Optimize for transparency and replication over micro-optimizations."
    ];
  }

  _executeStep(step, ctx) {
    switch (step.opKind) {
      case "analyze":
        return {
          summary: `Intent parsed with tags: ${step.outputs.tags.join(", ")}`,
          mutatedContext: {
            intentSummary: step.outputs.summary,
            intentTags: step.outputs.tags
          }
        };
      case "design-graph":
        return {
          summary: `Designed theme virtual-object graph (${step.outputs.virtualObjects.join(", ")})`,
          mutatedContext: {
            virtualObjects: (ctx.virtualObjects || []).concat(step.outputs.virtualObjects)
          }
        };
      case "repo-blueprint":
        return {
          summary: `Planned directories: ${step.outputs.directories.join(", ")}`,
          mutatedContext: {
            plannedDirectories: step.outputs.directories
          }
        };
      case "module-contracts":
        return {
          summary: `Declared ALN modules: ${step.outputs.modules.join(", ")}`,
          mutatedContext: {
            alnModules: step.outputs.modules
          }
        };
      case "artifact-plan":
        return {
          summary: `Artifact languages: ${step.outputs.languages.join(", ")}`,
          mutatedContext: {
            artifactPlan: step.outputs.artifacts
          }
        };
      case "replication":
        return {
          summary: `Replication target: <= ${step.outputs.maxHours}h`,
          mutatedContext: {
            replicationProfile: step.outputs
          }
        };
      default:
        return {
          summary: `No-op for opKind=${step.opKind}`,
          mutatedContext: null
        };
    }
  }

  _hash(input) {
    let h1 = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      h1 ^= input.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
      h1 >>>= 0;
    }
    return `plan-${h1.toString(16)}`;
  }

  _slug(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

export default ALNEngine;
