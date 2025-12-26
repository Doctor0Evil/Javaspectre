// Path: src/core/ALNEngine.js

/**
 * Hardened ALNEngine
 * - Deterministic, auditable planning
 * - Pluggable opKind registry
 * - Safety-policy hooks for critical / BCI / neuromorphic / nanoswarm contexts
 */

class ALNEngine {
  constructor(options = {}) {
    this.modelId = options.modelId || "aln-core-v1";
    this.maxSteps =
      typeof options.maxSteps === "number" ? options.maxSteps : 32;
    this.defaultLanguage = "JavaScript";

    // Registry of step executors keyed by opKind
    this.opRegistry = new Map();

    // Register built-in operations
    this._registerBuiltinOps();

    // Optional external safety / policy hook:
    // (steps, context, transparencyTrail) => { steps, transparencyTrail }
    this.policyHook = options.policyHook || null;
  }

  // ---------------------------------------------------------------------------
  // 1. Intent → Plan
  // ---------------------------------------------------------------------------

  plan(intent, context = {}) {
    if (typeof intent !== "string" || !intent.trim()) {
      throw new Error("ALNEngine.plan: intent must be a non-empty string.");
    }

    const createdAt = new Date().toISOString();
    const normalizedContext = this._normalizeContext(context);
    const classifiers = this._classifyIntent(intent, normalizedContext);
    const steps = this._synthesizeSteps(intent, normalizedContext, classifiers);

    const planId = this._hash(
      JSON.stringify({
        intent,
        classifiers,
        createdAt
      })
    );

    let transparencyTrail = {
      planId,
      modelId: this.modelId,
      intent,
      classifiers,
      context: normalizedContext,
      createdAt,
      assumptions: this._deriveAssumptions(
        intent,
        normalizedContext,
        classifiers
      ),
      risks: this._deriveRisks(intent, normalizedContext),
      tradeoffs: this._deriveTradeoffs(intent, normalizedContext)
    };

    // Optional policy hook can rewrite steps / add risk tags
    let finalSteps = steps;
    if (typeof this.policyHook === "function") {
      const policyResult = this.policyHook(steps, normalizedContext, transparencyTrail);
      if (policyResult && Array.isArray(policyResult.steps)) {
        finalSteps = policyResult.steps;
      }
      if (policyResult && policyResult.transparencyTrail) {
        transparencyTrail = policyResult.transparencyTrail;
      }
    }

    return { planId, steps: finalSteps, transparencyTrail };
  }

  // ---------------------------------------------------------------------------
  // 2. ALN Module Introspection
  // ---------------------------------------------------------------------------

  introspectModule(moduleName, alnModuleSpec) {
    const structs = [];
    const functions = [];
    const constants = [];

    if (Array.isArray(alnModuleSpec.structs)) {
      for (const s of alnModuleSpec.structs) {
        structs.push({
          name: String(s.name || ""),
          fields: Array.isArray(s.fields) ? s.fields : [],
          doc: s.doc ? String(s.doc) : ""
        });
      }
    }

    if (Array.isArray(alnModuleSpec.functions)) {
      for (const fn of alnModuleSpec.functions) {
        functions.push({
          name: String(fn.name || ""),
          params: Array.isArray(fn.params) ? fn.params : [],
          returnType: fn.returnType ? String(fn.returnType) : "any",
          doc: fn.doc ? String(fn.doc) : ""
        });
      }
    }

    if (Array.isArray(alnModuleSpec.constants)) {
      for (const c of alnModuleSpec.constants) {
        constants.push({
          name: String(c.name || ""),
          type: c.type ? String(c.type) : "any",
          value: c.value,
          doc: c.doc ? String(c.doc) : ""
        });
      }
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
  // 3. Repo Blueprint Generator
  // ---------------------------------------------------------------------------

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

    const moduleEntry = alnSpecGraph && alnSpecGraph.module
      ? `${alnSpecGraph.module}.js`
      : "ALNModule.js";

    const structure = {
      rootFiles: coreFiles,
      directories: {
        src: {
          core: ["ALNEngine.js", moduleEntry],
          blueprints: ["RepoBlueprint.js", "VirtualObjectMapper.js"],
          cli: ["aln-cli.js"]
        },
        examples: ["demo-aln-plan.js", "demo-theme-mapper.js"],
        test: ["ALNEngine.test.js", "ModuleContracts.test.js"]
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
  // 4. Plan Executor
  // ---------------------------------------------------------------------------

  executePlan(steps, context = {}) {
    if (!Array.isArray(steps)) {
      throw new Error("ALNEngine.executePlan: steps must be an array.");
    }

    const ctx = { ...context };
    const log = [];

    for (let i = 0; i < steps.length && i < this.maxSteps; i++) {
      const step = steps[i];
      const executor = this.opRegistry.get(step.opKind);

      if (!executor) {
        log.push({
          stepId: step.id || `step-${i}`,
          description: step.description || "",
          opKind: step.opKind,
          resultSummary: `No registered handler for opKind=${step.opKind}`
        });
        continue;
      }

      const result = executor(step, ctx);

      log.push({
        stepId: step.id || `step-${i}`,
        description: step.description || "",
        opKind: step.opKind,
        resultSummary: result.summary
      });

      if (result.mutatedContext && typeof result.mutatedContext === "object") {
        Object.assign(ctx, result.mutatedContext);
      }
    }

    return { log, finalContext: ctx };
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  _normalizeContext(context) {
    const safe =
      context && typeof context === "object" && !Array.isArray(context)
        ? { ...context }
        : {};

    if (!safe.language) safe.language = this.defaultLanguage;
    if (typeof safe.requireCompleteness !== "boolean") {
      safe.requireCompleteness = true;
    }
    if (!safe.domain) safe.domain = "general";

    return safe;
  }

  _classifyIntent(intent, context) {
    const lower = intent.toLowerCase();
    const tags = [];

    if (lower.includes("theme") || lower.includes("design token")) {
      tags.push("theme-mapping");
    }
    if (lower.includes("repository") || lower.includes("repo")) {
      tags.push("repo-scaffolding");
    }
    if (lower.includes("api")) {
      tags.push("api-design");
    }
    if (lower.includes("badge") || lower.includes("shields")) {
      tags.push("badge-generation");
    }
    if (lower.includes("virtual-object") || lower.includes("dom")) {
      tags.push("virtual-object-extraction");
    }
    if (lower.includes("medical") || lower.includes("clinical")) {
      tags.push("medical");
    }
    if (lower.includes("bci") || lower.includes("brain-computer")) {
      tags.push("bci");
    }
    if (lower.includes("neuromorphic") || lower.includes("nanoswarm")) {
      tags.push("neuromorphic");
    }

    if (tags.length === 0) tags.push("general-architecture");

    const complexity =
      lower.includes("multi-tenant") ||
      lower.includes("distributed") ||
      lower.includes("federal")
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
        summary: intent.trim().slice(0, 512),
        tags: classifiers.tags
      }
    });

    if (classifiers.tags.includes("theme-mapping")) {
      steps.push({
        id: "design-theme-graph",
        opKind: "design-graph",
        description:
          "Design virtual-object graph for theme tokens and color schemes.",
        outputs: {
          virtualObjects: [
            "ThemeScales",
            "ThemeTypography",
            "ColorSchemeSet",
            "ThemeTokenReport"
          ]
        }
      });
    }

    if (classifiers.tags.includes("repo-scaffolding")) {
      steps.push({
        id: "design-repo-structure",
        opKind: "repo-blueprint",
        description: "Design repository structure aligned with ALN modules.",
        outputs: {
          directories: [
            "src/core",
            "src/blueprints",
            "src/cli",
            "examples",
            "test"
          ]
        }
      });
    }

    steps.push({
      id: "map-modules",
      opKind: "module-contracts",
      description:
        "Define ALN module contracts (structs, functions, constants).",
      outputs: {
        modules: ["ALNEngine", "VirtualObjectMapper", "DomainSpecificModule"]
      }
    });

    steps.push({
      id: "generate-artifacts",
      opKind: "artifact-plan",
      description: "Plan generated artifacts (language files, docs, tests).",
      outputs: {
        languages: [context.language || "JavaScript"],
        artifacts: ["JS modules", "README sections", "tests"]
      }
    });

    steps.push({
      id: "replication-strategy",
      opKind: "replication",
      description:
        "Ensure 24-hour replication strategy for the resulting system.",
      outputs: {
        maxHours: 24,
        requiredSkills: ["Node.js", "Git", "basic CLI"],
        hostingTargets: ["GitHub"]
      }
    });

    if (
      classifiers.tags.some((t) =>
        ["medical", "bci", "neuromorphic"].includes(t)
      )
    ) {
      steps.push({
        id: "safety-overlay",
        opKind: "safety-policy",
        description:
          "Apply safety overlays and human-in-the-loop requirements for critical domains.",
        outputs: {
          requiresHumanReview: true,
          prohibitedOps: ["self-modify", "hardware-direct-control"],
          auditLevel: "strict"
        }
      });
    }

    return steps;
  }

  _deriveAssumptions(intent, context, classifiers) {
    const assumptions = [];

    assumptions.push(
      "User wants ALN-style structured planning, not ad-hoc scripting."
    );
    assumptions.push(`Target language for artifacts is ${context.language}.`);
    if (classifiers.tags.includes("repo-scaffolding")) {
      assumptions.push(
        "User intends to publish code in a Git-based repository."
      );
    }
    assumptions.push(
      "A human maintainer will review and refine generated artifacts."
    );

    if (
      classifiers.tags.some((t) =>
        ["medical", "bci", "neuromorphic"].includes(t)
      )
    ) {
      assumptions.push(
        "Safety-critical workflows require independent clinical and ethics review."
      );
    }

    return assumptions;
  }

  _deriveRisks(intent, context) {
    const risks = [];

    risks.push(
      "Risk of over-generalizing ALN module contracts for simple use cases."
    );
    if (intent.toLowerCase().includes("critical")) {
      risks.push(
        "Safety-critical context requires additional human review and testing."
      );
    }
    if (context.requireCompleteness) {
      risks.push(
        "Strict completeness may slow iteration if requirements are evolving."
      );
    }
    if (
      (context.domain || "").toLowerCase() === "medical" ||
      intent.toLowerCase().includes("medical")
    ) {
      risks.push(
        "Medical and clinical settings must comply with regulatory and patient-safety standards."
      );
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

  _registerBuiltinOps() {
    this.opRegistry.set("analyze", (step, ctx) => ({
      summary: `Intent parsed with tags: ${(step.outputs?.tags || []).join(
        ", "
      )}`,
      mutatedContext: {
        intentSummary: step.outputs?.summary,
        intentTags: step.outputs?.tags || []
      }
    }));

    this.opRegistry.set("design-graph", (step, ctx) => ({
      summary: `Designed theme virtual-object graph (${(
        step.outputs?.virtualObjects || []
      ).join(", ")})`,
      mutatedContext: {
        virtualObjects: (ctx.virtualObjects || []).concat(
          step.outputs?.virtualObjects || []
        )
      }
    }));

    this.opRegistry.set("repo-blueprint", (step) => ({
      summary: `Planned directories: ${(step.outputs?.directories || []).join(
        ", "
      )}`,
      mutatedContext: {
        plannedDirectories: step.outputs?.directories || []
      }
    }));

    this.opRegistry.set("module-contracts", (step) => ({
      summary: `Declared ALN modules: ${(step.outputs?.modules || []).join(
        ", "
      )}`,
      mutatedContext: {
        alnModules: step.outputs?.modules || []
      }
    }));

    this.opRegistry.set("artifact-plan", (step) => ({
      summary: `Artifact languages: ${(step.outputs?.languages || []).join(
        ", "
      )}`,
      mutatedContext: {
        artifactPlan: step.outputs?.artifacts || []
      }
    }));

    this.opRegistry.set("replication", (step) => ({
      summary: `Replication target: <= ${step.outputs?.maxHours || "?"}h`,
      mutatedContext: {
        replicationProfile: step.outputs
      }
    }));

    this.opRegistry.set("safety-policy", (step, ctx) => ({
      summary: `Applied safety overlay (audit=${step.outputs?.auditLevel})`,
      mutatedContext: {
        safetyOverlay: {
          requiresHumanReview: !!step.outputs?.requiresHumanReview,
          prohibitedOps: step.outputs?.prohibitedOps || [],
          auditLevel: step.outputs?.auditLevel || "normal"
        }
      }
    }));
  }

  registerOp(opKind, fn) {
    if (typeof opKind !== "string" || !opKind.trim()) {
      throw new Error("ALNEngine.registerOp: opKind must be a non-empty string.");
    }
    if (typeof fn !== "function") {
      throw new Error("ALNEngine.registerOp: fn must be a function.");
    }
    this.opRegistry.set(opKind, fn);
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
