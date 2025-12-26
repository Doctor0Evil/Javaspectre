// Path: src/capabilities/JavaspectreCapabilities.js
// Central registry and reasoning surface for Javaspectre's spectral capabilities.

export const JavaspectreCapabilities = [
  {
    id: "zero-config-repo-blueprinting",
    index: 1,
    name: "Zero-Config Repo Blueprinting",
    category: "scaffolding",
    summary:
      "Analyzes a single prompt or code fragment and auto-generates complete repository structures ready for git push in under 60 seconds.",
    entryModule: "src/capabilities/RepoBlueprinting.js",
    primaryCli: "make",
    inputs: ["prompt", "code-fragment"],
    outputs: ["repo-structure", "package-json", "tests", "ci-config"],
    guarantees: [
      "No manual configuration required.",
      "Valid package.json with scripts, license, and README stubs.",
      "Initial tests and CI prepared for immediate use."
    ],
    spectralTags: ["automation", "bootstrap", "repo", "blueprint"],
    sustainabilityImpact: {
      dimension: "developer-time",
      notes:
        "Reduces repetitive boilerplate work and misconfigured projects, lowering wasted compute from failed pipelines."
    },
    heuristicScore: 0.7
  },
  {
    id: "live-virtual-object-harvesting",
    index: 2,
    name: "Live Virtual-Object Harvesting",
    category: "introspection",
    summary:
      "Scans webpages, API responses, or DOM trees in real time, extracting hidden data shapes and emitting JavaScript-friendly type definitions and wrappers.",
    entryModule: "src/capabilities/LiveVirtualHarvester.js",
    primaryCli: "inspect",
    inputs: ["url", "html-fragment", "json-response"],
    outputs: ["type-definitions", "api-wrappers", "virtual-object-catalog"],
    guarantees: [
      "No manual schema writing.",
      "Stable structural signatures for re-use.",
      "Supports DOM, JSON, and mixed payloads when integrated with a browser runner."
    ],
    spectralTags: ["dom", "api", "virtual-object", "schema"],
    sustainabilityImpact: {
      dimension: "data-efficiency",
      notes:
        "Encourages schema-aware data access, reducing over-fetching and redundant API calls."
    },
    heuristicScore: 0.6
  },
  {
    id: "one-command-spectral-refinement",
    index: 3,
    name: "One-Command Spectral Refinement",
    category: "refinement",
    summary:
      "Transforms partial or rough code into production-grade modules with tests, docs, and performance optimizations via a single command.",
    entryModule: "src/capabilities/SpectralRefiner.js",
    primaryCli: "refine",
    inputs: ["source-file", "repo-path"],
    outputs: ["refined-modules", "tests", "docs"],
    guarantees: [
      "Refined code remains compatible with original intent.",
      "Adds tests and basic documentation automatically.",
      "Targets idiomatic, modern JavaScript patterns."
    ],
    spectralTags: ["refactor", "optimization", "upgrade"],
    sustainabilityImpact: {
      dimension: "runtime-efficiency",
      notes:
        "Refinements can reduce CPU and memory waste by removing dead code and improving algorithmic complexity."
    },
    heuristicScore: 0.8
  },
  {
    id: "twenty-four-hour-replication-guarantee",
    index: 4,
    name: "24-Hour Replication Guarantee",
    category: "replication",
    summary:
      "Embeds exact install and run instructions with mocks and configs so any motivated developer can replicate the system within 24 hours.",
    entryModule: "src/capabilities/ReplicationManager.js",
    primaryCli: "replicate",
    inputs: ["repo-blueprint", "project-config"],
    outputs: ["replication-manifest", "scripts", "mock-datasets"],
    guarantees: [
      "npm install && npm start works without additional configuration.",
      "All required datasets and configs are included or referenced.",
      "Replicability is explicitly exercised in tests where configured."
    ],
    spectralTags: ["replication", "onboarding", "ops"],
    sustainabilityImpact: {
      dimension: "waste-avoidance",
      notes:
        "Prevents repeated trial-and-error setups, saving developer hours and unnecessary CI or compute cycles."
    },
    heuristicScore: 0.75
  },
  {
    id: "aln-powered-intent-resolution",
    index: 5,
    name: "ALN-Powered Intent Resolution",
    category: "reasoning",
    summary:
      "Converts ambiguous natural language into precise technical blueprints with constraints and deployment paths.",
    entryModule: "src/core/ALNIntentResolver.js",
    primaryCli: "make",
    inputs: ["natural-language-intent", "constraints"],
    outputs: ["implementation-plan", "risk-assessment", "deployment-plan"],
    guarantees: [
      "Plans remain within JavaScript and open tooling constraints.",
      "Compliance and ethical considerations are flagged when relevant.",
      "Provides explicit trade-off explanations for major decisions."
    ],
    spectralTags: ["aln", "nlp", "planning"],
    sustainabilityImpact: {
      dimension: "design-quality",
      notes:
        "Higher-quality early-stage planning avoids wasteful builds and failed deployments."
    },
    heuristicScore: 0.7
  },
  {
    id: "dom-sheet-auto-mapping",
    index: 6,
    name: "DOM-Sheet Auto-Mapping",
    category: "introspection",
    summary:
      "Discovers stable CSS selectors, class patterns, and attribute schemas and emits resilient extraction modules.",
    entryModule: "src/capabilities/DOMSheetMapper.js",
    primaryCli: "inspect",
    inputs: ["url", "dom-fragment"],
    outputs: ["dom-sheets", "selector-modules"],
    guarantees: [
      "Selectors survive minor UI changes via fuzzy matching.",
      "Mappings are exportable as reusable scraping or monitoring modules.",
      "Schema changes can be detected over time for alerting or versioning."
    ],
    spectralTags: ["dom", "css", "scraping", "monitoring"],
    sustainabilityImpact: {
      dimension: "crawl-efficiency",
      notes:
        "Stable, reusable selectors reduce repeated trial crawls and brittle scraping scripts that waste bandwidth."
    },
    heuristicScore: 0.55
  },
  {
    id: "quantum-dependency-resolution",
    index: 7,
    name: "Quantum Dependency Resolution",
    category: "dependencies",
    summary:
      "Generates deterministic dependency trees and lock-compatible configs that avoid install failures across environments.",
    entryModule: "src/core/QuantumDependencyManager.js",
    primaryCli: "make",
    inputs: ["dependency-spec", "target-environment"],
    outputs: ["lock-map", "package-json-patch"],
    guarantees: [
      "Dependency trees are installable on Node LTS with minimal conflicts.",
      "Peer dependency issues are pre-resolved where possible.",
      "Ensures reproducible builds across supported platforms."
    ],
    spectralTags: ["dependencies", "lockfile", "reproducibility"],
    sustainabilityImpact: {
      dimension: "build-stability",
      notes:
        "Stable dependency graphs reduce failed builds and repeated installations."
    },
    heuristicScore: 0.85
  },
  {
    id: "self-evolving-codebases",
    index: 8,
    name: "Self-Evolving Codebases",
    category: "evolution",
    summary:
      "Continuously analyzes repositories for refactor opportunities, security patches, and API simplifications, proposing or auto-opening pull requests.",
    entryModule: "src/capabilities/SelfEvolvingModule.js",
    primaryCli: "refine",
    inputs: ["repo-path", "telemetry"],
    outputs: ["refactor-proposals", "auto-prs"],
    guarantees: [
      "No auto-merge without explicit policy.",
      "Changes are accompanied by rationale and diff summaries.",
      "Focuses on performance, security, and maintainability improvements."
    ],
    spectralTags: ["refactor", "security", "automation"],
    sustainabilityImpact: {
      dimension: "life-cycle-efficiency",
      notes:
        "Keeps codebases lean and secure, reducing long-term resource usage and rework."
    },
    heuristicScore: 0.8
  },
  {
    id: "sustainability-impact-calculator",
    index: 9,
    name: "Sustainability Impact Calculator",
    category: "sustainability",
    summary:
      "Embeds carbon footprint metrics, energy scores, and green-hosting suggestions into generated systems.",
    entryModule: "src/core/SustainabilityCore.js",
    primaryCli: "impact",
    inputs: ["project-metadata", "estimated-usage"],
    outputs: ["impact-report", "optimization-recommendations"],
    guarantees: [
      "Uses transparent, documented estimation models.",
      "Highlights levers like hosting choice, caching, and data minimization.",
      "Can export impact snapshots for audits and reporting."
    ],
    spectralTags: ["sustainability", "carbon", "optimization"],
    sustainabilityImpact: {
      dimension: "planetary-impact",
      notes:
        "Encourages greener design choices and highlights optimization opportunities from inception."
    },
    heuristicScore: 0.9
  },
  {
    id: "cross-platform-native-deployment",
    index: 10,
    name: "Cross-Platform Native Deployment",
    category: "deployment",
    summary:
      "Generates Docker, serverless, browser, and CLI variants from the same blueprint, with zero-config CI pipelines.",
    entryModule: "src/capabilities/CrossPlatformBuilder.js",
    primaryCli: "make",
    inputs: ["repo-blueprint", "deployment-targets"],
    outputs: ["dockerfiles", "serverless-configs", "web-bundles", "ci-pipelines"],
    guarantees: [
      "Each target is runnable with minimal configuration.",
      "Deployment scripts are consistent with replication manifests.",
      "CI jobs avoid redundant builds where possible."
    ],
    spectralTags: ["docker", "serverless", "browser", "cli", "ci"],
    sustainabilityImpact: {
      dimension: "infra-efficiency",
      notes:
        "Unified builds reduce duplicate effort and encourage efficient reuse of artifacts and pipelines."
    },
    heuristicScore: 0.7
  },
  {
    id: "cognitive-transparency-engine",
    index: 11,
    name: "Cognitive Transparency Engine",
    category: "explanation",
    summary:
      "Attaches machine-readable 'why' metadata to artifacts, capturing assumptions, trade-offs, and evolution history.",
    entryModule: "src/core/CognitiveTransparency.js",
    primaryCli: "analyze",
    inputs: ["artifact", "plan"],
    outputs: ["transparency-metadata"],
    guarantees: [
      "Each major decision is documented with a short rationale.",
      "Metadata can be exported as JSON for audits.",
      "No hidden behavior for non-trivial steps."
    ],
    spectralTags: ["transparency", "audit", "explainability"],
    sustainabilityImpact: {
      dimension: "governance",
      notes:
        "Transparent systems are easier to govern and optimize, reducing costly missteps and rework."
    },
    heuristicScore: 0.65
  },
  {
    id: "phantom-pattern-detection",
    index: 12,
    name: "Phantom Pattern Detection",
    category: "discovery",
    summary:
      "Uncovers undocumented APIs, hidden state machines, and emergent behaviors in black-box systems, exposing them as named interfaces.",
    entryModule: "src/capabilities/PhantomDetector.js",
    primaryCli: "inspect",
    inputs: ["runtime-traces", "network-logs", "dom-diffs"],
    outputs: ["phantom-interfaces", "behavior-models"],
    guarantees: [
      "Patterns are probabilistic and labeled as such.",
      "Findings include confidence scores and evidence links.",
      "Interfaces can be explicitly accepted or ignored by maintainers."
    ],
    spectralTags: ["reverse-engineering", "traces", "black-box"],
    sustainabilityImpact: {
      dimension: "reuse",
      notes:
        "By surfacing hidden behaviors, teams can reuse existing capabilities instead of building redundant features."
    },
    heuristicScore: 0.6
  },
  {
    id: "instant-open-source-readiness",
    index: 13,
    name: "Instant Open-Source Readiness",
    category: "documentation",
    summary:
      "Auto-generates licenses, contribution guides, codes of conduct, and templates optimized for credibility and adoption.",
    entryModule: "src/capabilities/OpenSourceGenerator.js",
    primaryCli: "make",
    inputs: ["project-metadata"],
    outputs: ["docs", "community-templates"],
    guarantees: [
      "Generates recognized OSS license templates.",
      "Provides CONTRIBUTING and Code of Conduct drafts.",
      "Supports badges and metadata for repository landing pages."
    ],
    spectralTags: ["docs", "community", "templates"],
    sustainabilityImpact: {
      dimension: "community-engagement",
      notes:
        "Good documentation and governance reduce friction and churn in open-source collaboration."
    },
    heuristicScore: 0.65
  },
  {
    id: "adaptive-integrity-scanner",
    index: 14,
    name: "Adaptive Integrity Scanner",
    category: "integrity",
    summary:
      "Continuously enforces spectral purity by detecting placeholders, dead code, and incomplete exports.",
    entryModule: "src/capabilities/AdaptiveIntegrityService.js",
    primaryCli: "analyze",
    inputs: ["repo-path"],
    outputs: ["integrity-report", "fix-suggestions"],
    guarantees: [
      "Scans avoid blocking local development by default.",
      "Findings are accompanied by suggested remediations.",
      "Integrates with CI to prevent regression of spectral purity."
    ],
    spectralTags: ["integrity", "quality", "self-healing"],
    sustainabilityImpact: {
      dimension: "quality-control",
      notes:
        "Maintains clean codebases, reducing long-term defects and wasteful debugging sessions."
    },
    heuristicScore: 0.8
  },
  {
    id: "planetary-impact-sim",
    index: 15,
    name: "Planetary Impact Simulator",
    category: "sustainability",
    summary:
      "Predictive modeler for sustainability ROI, modeling CO₂, energy, and cost metrics for candidate systems.",
    entryModule: "src/capabilities/PlanetaryImpactSim.js",
    primaryCli: "impact",
    inputs: ["architecture-blueprint", "usage-scenario"],
    outputs: ["impact-simulation-report"],
    guarantees: [
      "Estimates are transparent and parameterized.",
      "Scenarios can be compared side-by-side.",
      "Supports exportable reports for decision-making."
    ],
    spectralTags: ["simulation", "sustainability", "roi"],
    sustainabilityImpact: {
      dimension: "strategy",
      notes:
        "Helps prioritize systems that deliver measurable planetary benefits."
    },
    heuristicScore: 0.9
  }
];

/**
 * Build an execution recipe from a canonical intent string.
 * The recipe is a sequence of capabilities to invoke, with minimal parameters.
 */
export function buildExecutionRecipe(canonicalIntent) {
  const lower = String(canonicalIntent || "").toLowerCase();
  const steps = [];

  const pushById = (id, reason) => {
    const cap = JavaspectreCapabilities.find((c) => c.id === id);
    if (!cap) return;
    steps.push({
      capabilityId: cap.id,
      capabilityName: cap.name,
      reason
    });
  };

  if (
    lower.includes("repo") ||
    lower.includes("repository") ||
    lower.includes("scaffold")
  ) {
    pushById("zero-config-repo-blueprinting", "Repository intent detected.");
    pushById("instant-open-source-readiness", "Open-source readiness for generated repo.");
    pushById(
      "twenty-four-hour-replication-guarantee",
      "Ensure 24-hour replication instructions for the new repo."
    );
  }

  if (lower.includes("dom") || lower.includes("scrape") || lower.includes("selector")) {
    pushById("live-virtual-object-harvesting", "DOM or API harvesting required.");
    pushById("dom-sheet-auto-mapping", "Stabilize DOM selectors for long-lived extraction.");
  }

  if (lower.includes("refine") || lower.includes("optimize") || lower.includes("improve")) {
    pushById("one-command-spectral-refinement", "Code refinement requested.");
    pushById("self-evolving-codebases", "Propose refactors and ongoing improvements.");
  }

  if (
    lower.includes("sustain") ||
    lower.includes("carbon") ||
    lower.includes("energy") ||
    lower.includes("impact")
  ) {
    pushById("sustainability-impact-calculator", "Compute sustainability metrics.");
    pushById("planetary-impact-sim", "Simulate planetary impact scenarios.");
  }

  if (steps.length === 0) {
    pushById("aln-powered-intent-resolution", "General ALN-based planning.");
  } else {
    pushById("aln-powered-intent-resolution", "Refine and verify overall plan.");
  }

  pushById("quantum-dependency-resolution", "Lock deterministic dependency tree.");
  pushById("adaptive-integrity-scanner", "Maintain spectral integrity of codebase.");
  pushById("cognitive-transparency-engine", "Attach rationale metadata.");

  return { steps };
}

export default JavaspectreCapabilities;
