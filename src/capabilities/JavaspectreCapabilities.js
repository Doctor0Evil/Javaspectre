// Path: src/capabilities/JavaspectreCapabilities.js
// Description:
// Central registry and reasoning surface for Javaspectre's 15 spectral capabilities.
// This module does NOT execute heavy work itself; instead, it:
// - Describes capabilities in a machine-consumable way.
// - Maps user intents to capabilities.
// - Provides composition strategies and sustainability hints.
// Other modules (SpectralEngine, CLI commands, etc.) can call into this
// to decide what to run and how to explain it.

export const JavaspectreCapabilities = [
  {
    id: 'zero-config-repo-blueprinting',
    index: 1,
    name: 'Zero-Config Repo Blueprinting',
    category: 'scaffolding',
    summary:
      'Analyzes a single prompt or code fragment and auto-generates complete repository structures ready for git push in under 60 seconds.',
    entryModule: 'src/capabilities/RepoBlueprinting.js',
    primaryCli: ['make'],
    inputs: ['prompt', 'code-fragment'],
    outputs: ['repo-structure', 'package-json', 'tests', 'ci-config'],
    guarantees: [
      'No manual configuration required.',
      'Valid package.json with scripts, license, and README stubs.',
      'Initial tests and CI prepared for immediate use.'
    ],
    spectralTags: ['automation', 'bootstrap', 'repo', 'blueprint'],
    sustainabilityImpact: {
      dimension: 'developer-time',
      notes:
        'Reduces repetitive boilerplate work and misconfigured projects, lowering wasted compute from failed pipelines.',
      heuristicScore: 0.7
    }
  },

  {
    id: 'live-virtual-object-harvesting',
    index: 2,
    name: 'Live Virtual-Object Harvesting',
    category: 'introspection',
    summary:
      'Scans webpages, API responses, or DOM trees in real time, extracting hidden data shapes and emitting TypeScript definitions and API wrappers.',
    entryModule: 'src/capabilities/LiveVirtualHarvester.js',
    primaryCli: ['inspect'],
    inputs: ['url', 'html-fragment', 'json-response'],
    outputs: ['type-definitions', 'api-wrappers', 'virtual-object-catalog'],
    guarantees: [
      'No manual schema writing.',
      'Stable structural signatures for re-use.',
      'Supports DOM, JSON, and mixed payloads when integrated with a browser runner.'
    ],
    spectralTags: ['dom', 'api', 'virtual-object', 'schema'],
    sustainabilityImpact: {
      dimension: 'data-efficiency',
      notes:
        'Encourages selective, schema-aware data access, which can reduce over-fetching and redundant API calls.',
      heuristicScore: 0.6
    }
  },

  {
    id: 'one-command-spectral-refinement',
    index: 3,
    name: 'One-Command Spectral Refinement',
    category: 'refinement',
    summary:
      'Transforms partial or rough code into production-grade modules with tests, docs, and performance optimizations via a single command.',
    entryModule: 'src/capabilities/SpectralRefiner.js',
    primaryCli: ['refine'],
    inputs: ['source-file', 'repo-path'],
    outputs: ['refined-modules', 'tests', 'docs'],
    guarantees: [
      'Refined code remains behaviorally compatible with original intent.',
      'Adds tests and basic documentation automatically.',
      'Targets idiomatic, modern JavaScript patterns.'
    ],
    spectralTags: ['refactor', 'optimization', 'upgrade'],
    sustainabilityImpact: {
      dimension: 'runtime-efficiency',
      notes:
        'Refinements can reduce CPU and memory waste by removing dead code and improving algorithmic complexity.',
      heuristicScore: 0.8
    }
  },

  {
    id: 'twenty-four-hour-replication-guarantee',
    index: 4,
    name: '24-Hour Replication Guarantee',
    category: 'replication',
    summary:
      'Embeds exact install and run instructions with mocks and configs so any motivated developer can replicate the system within 24 hours.',
    entryModule: 'src/capabilities/ReplicationManager.js',
    primaryCli: ['replicate', 'make'],
    inputs: ['repo-blueprint', 'project-config'],
    outputs: ['replication-manifest', 'scripts', 'mock-datasets'],
    guarantees: [
      'npm install && npm start works without additional configuration.',
      'All required datasets and configs are included or linked.',
      'Replicability is explicitly tested in CI where configured.'
    ],
    spectralTags: ['replication', 'onboarding', 'ops'],
    sustainabilityImpact: {
      dimension: 'waste-avoidance',
      notes:
        'Prevents repeated trial-and-error setups, saving both developer hours and unnecessary CI/compute cycles.',
      heuristicScore: 0.75
    }
  },

  {
    id: 'aln-powered-intent-resolution',
    index: 5,
    name: 'ALN-Powered Intent Resolution',
    category: 'reasoning',
    summary:
      'Converts ambiguous natural language into precise technical blueprints with compliance checks, cost models, and deployment paths.',
    entryModule: 'src/core/ALNIntentResolver.js',
    primaryCli: ['make', 'impact'],
    inputs: ['natural-language-intent', 'constraints'],
    outputs: ['implementation-plan', 'risk-assessment', 'deployment-plan'],
    guarantees: [
      'All plans remain within JavaScript + open tooling constraints.',
      'Compliance and ethical considerations are flagged when relevant.',
      'Provides explicit tradeoff explanations for major decisions.'
    ],
    spectralTags: ['aln', 'nlp', 'planning'],
    sustainabilityImpact: {
      dimension: 'design-quality',
      notes:
        'Higher-quality early-stage planning avoids wasteful builds and failed deployments, indirectly reducing resource use.',
      heuristicScore: 0.7
    }
  },

  {
    id: 'dom-sheet-auto-mapping',
    index: 6,
    name: 'DOM-Sheet Auto-Mapping',
    category: 'introspection',
    summary:
      'Discovers stable CSS selectors, class patterns, and attribute schemas and emits resilient extraction modules.',
    entryModule: 'src/capabilities/DOMSheetMapper.js',
    primaryCli: ['inspect'],
    inputs: ['url', 'dom-fragment'],
    outputs: ['dom-sheets', 'selector-modules'],
    guarantees: [
      'Selectors are designed to survive minor UI changes via fuzzy matching.',
      'Mappings are exportable as reusable scraping or monitoring modules.',
      'Schema changes can be detected over time for alerting or versioning.'
    ],
    spectralTags: ['dom', 'css', 'scraping', 'monitoring'],
    sustainabilityImpact: {
      dimension: 'crawl-efficiency',
      notes:
        'Stable, reusable selectors reduce repeated trial crawls and brittle scraping scripts that waste bandwidth.',
      heuristicScore: 0.55
    }
  },

  {
    id: 'quantum-dependency-resolution',
    index: 7,
    name: 'Quantum Dependency Resolution',
    category: 'dependencies',
    summary:
      'Generates deterministic dependency trees and lock-compatible configs that avoid install failures across environments.',
    entryModule: 'src/core/QuantumDependencyManager.js',
    primaryCli: ['make', 'refine'],
    inputs: ['dependency-spec', 'target-environment'],
    outputs: ['lock-map', 'package-json-patch'],
    guarantees: [
      'Dependency trees are installable on Node LTS with minimal conflicts.',
      'Peer dependency issues are pre-resolved where possible.',
      'Ensures reproducible builds across supported platforms.'
    ],
    spectralTags: ['dependencies', 'lockfile', 'reproducibility'],
    sustainabilityImpact: {
      dimension: 'build-stability',
      notes:
        'Stable dependency graphs reduce failed builds and repeated installations, saving CPU, bandwidth, and time.',
      heuristicScore: 0.85
    }
  },

  {
    id: 'self-evolving-codebases',
    index: 8,
    name: 'Self-Evolving Codebases',
    category: 'evolution',
    summary:
      'Continuously analyzes repositories for refactor opportunities, security patches, and API simplifications, proposing or auto-opening PRs.',
    entryModule: 'src/capabilities/SelfEvolvingModule.js',
    primaryCli: ['refine', 'analyze'],
    inputs: ['repo-path', 'telemetry'],
    outputs: ['refactor-proposals', 'auto-prs'],
    guarantees: [
      'No auto-merge without explicit policy; proposals are transparent.',
      'Changes are accompanied by rationale and diff summaries.',
      'Focuses on performance, security, and maintainability improvements.'
    ],
    spectralTags: ['refactor', 'security', 'automation'],
    sustainabilityImpact: {
      dimension: 'life-cycle-efficiency',
      notes:
        'Keeps codebases lean and secure, reducing long-term resource usage and vulnerability-driven rework.',
      heuristicScore: 0.8
    }
  },

  {
    id: 'sustainability-impact-calculator',
    index: 9,
    name: 'Sustainability Impact Calculator',
    category: 'sustainability',
    summary:
      'Embeds carbon footprint metrics, energy scores, and green-hosting suggestions into generated systems.',
    entryModule: 'src/core/SustainabilityCore.js',
    primaryCli: ['impact', 'make'],
    inputs: ['project-metadata', 'estimated-usage'],
    outputs: ['impact-report', 'optimization-recommendations'],
    guarantees: [
      'Uses transparent, documented estimation models.',
      'Highlights levers like hosting choice, caching, and data minimization.',
      'Can export impact snapshots for audits and reporting.'
    ],
    spectralTags: ['sustainability', 'carbon', 'optimization'],
    sustainabilityImpact: {
      dimension: 'planetary-impact',
      notes:
        'Encourages greener design choices and highlights optimization opportunities from inception.',
      heuristicScore: 0.9
    }
  },

  {
    id: 'cross-platform-native-deployment',
    index: 10,
    name: 'Cross-Platform Native Deployment',
    category: 'deployment',
    summary:
      'Generates Docker, serverless, browser, and CLI variants from the same blueprint, with zero-config CI/CD pipelines.',
    entryModule: 'src/capabilities/CrossPlatformBuilder.js',
    primaryCli: ['make', 'replicate'],
    inputs: ['repo-blueprint', 'deployment-targets'],
    outputs: ['dockerfiles', 'serverless-configs', 'web-bundles', 'ci-pipelines'],
    guarantees: [
      'Each target is runnable with minimal configuration.',
      'Deployment scripts are consistent with replication manifests.',
      'CI jobs avoid redundant builds when possible.'
    ],
    spectralTags: ['docker', 'serverless', 'browser', 'cli', 'ci'],
    sustainabilityImpact: {
      dimension: 'infra-efficiency',
      notes:
        'Unified builds reduce duplicate effort and encourage efficient reuse of artifacts and pipelines.',
      heuristicScore: 0.7
    }
  },

  {
    id: 'cognitive-transparency-engine',
    index: 11,
    name: 'Cognitive Transparency Engine',
    category: 'explanation',
    summary:
      'Attaches machine-readable “why” metadata to artifacts, capturing assumptions, tradeoffs, and evolution history.',
    entryModule: 'src/core/CognitiveTransparency.js',
    primaryCli: ['analyze', 'impact'],
    inputs: ['artifact', 'plan'],
    outputs: ['transparency-metadata'],
    guarantees: [
      'Each major decision is documented with a short rationale.',
      'Metadata can be exported as JSON for audits.',
      'No hidden behavior; all non-trivial steps are explainable.'
    ],
    spectralTags: ['transparency', 'audit', 'explainability'],
    sustainabilityImpact: {
      dimension: 'governance',
      notes:
        'Transparent systems are easier to govern and optimize, reducing costly missteps and rework.',
      heuristicScore: 0.65
    }
  },

  {
    id: 'phantom-pattern-detection',
    index: 12,
    name: 'Phantom Pattern Detection',
    category: 'discovery',
    summary:
      'Uncovers undocumented APIs, hidden state machines, and emergent behaviors in black-box systems, exposing them as named interfaces.',
    entryModule: 'src/capabilities/PhantomDetector.js',
    primaryCli: ['inspect', 'analyze'],
    inputs: ['runtime-traces', 'network-logs', 'dom-diffs'],
    outputs: ['phantom-interfaces', 'behavior-models'],
    guarantees: [
      'Patterns are probabilistic and labeled as such.',
      'Findings include confidence scores and evidence links.',
      'Interfaces can be explicitly accepted or ignored by maintainers.'
    ],
    spectralTags: ['reverse-engineering', 'traces', 'black-box'],
    sustainabilityImpact: {
      dimension: 'reuse',
      notes:
        'By surfacing hidden behaviors, teams can reuse existing capabilities instead of building redundant features.',
      heuristicScore: 0.6
    }
  },

  {
    id: 'instant-open-source-readiness',
    index: 13,
    name: 'Instant Open-Source Readiness',
    category: 'oss',
    summary:
      'Generates licenses, contribution guidelines, codes of conduct, and templates tuned for credibility and adoption.',
    entryModule: 'src/capabilities/OpenSourceGenerator.js',
    primaryCli: ['make', 'refine'],
    inputs: ['project-profile'],
    outputs: [
      'LICENSE',
      'CONTRIBUTING.md',
      'CODE_OF_CONDUCT.md',
      '.github/ISSUE_TEMPLATE',
      '.github/PULL_REQUEST_TEMPLATE'
    ],
    guarantees: [
      'All generated policies are compatible with common open-source norms.',
      'Configurable for individual, lab, or organization governance styles.',
      'Includes README badges and metadata for clarity.'
    ],
    spectralTags: ['oss', 'community', 'governance'],
    sustainabilityImpact: {
      dimension: 'community',
      notes:
        'Well-governed projects attract and retain contributors, increasing reuse and decreasing duplicated efforts.',
      heuristicScore: 0.7
    }
  },

  {
    id: 'adaptive-integrity-scanner',
    index: 14,
    name: 'Adaptive Integrity Scanner',
    category: 'integrity',
    summary:
      'Continuously validates that no placeholders, dead code, or incomplete exports exist, maintaining “spectral purity.”',
    entryModule: 'src/capabilities/AdaptiveIntegrityService.js',
    primaryCli: ['refine', 'analyze'],
    inputs: ['repo-path'],
    outputs: ['integrity-report', 'fix-suggestions'],
    guarantees: [
      'Finds unused exports, untested modules, and TODO-like markers.',
      'Can auto-fix simple integrity issues where policy allows.',
      'Results are designed to integrate with CI gating.'
    ],
    spectralTags: ['integrity', 'linting', 'quality'],
    sustainabilityImpact: {
      dimension: 'code-health',
      notes:
        'Healthy codebases avoid performance regressions and reduce the cost of maintenance work over time.',
      heuristicScore: 0.8
    }
  },

  {
    id: 'planetary-impact-simulator',
    index: 15,
    name: 'Planetary Impact Simulator',
    category: 'sustainability',
    summary:
      'Models projected CO2 reduction, cost savings, and lives impacted for proposed systems before code generation.',
    entryModule: 'src/capabilities/PlanetaryImpactSim.js',
    primaryCli: ['impact'],
    inputs: ['scenario-description', 'rough-usage-model', 'region-profile'],
    outputs: ['scenario-report', 'priority-score'],
    guarantees: [
      'Uses transparent heuristics; not a replacement for formal LCA.',
      'Ranks candidate projects by estimated positive impact.',
      'Integrates back into ALN planning to prioritize high-ROI ideas.'
    ],
    spectralTags: ['sustainability', 'simulation', 'prioritization'],
    sustainabilityImpact: {
      dimension: 'portfolio-selection',
      notes:
        'Helps prioritize the highest-impact projects, aligning developer effort with global sustainability goals.',
      heuristicScore: 0.95
    }
  }
];

/**
 * Find capabilities relevant to a given natural-language intent.
 * This is a lightweight, rule-based filter; heavier reasoning should
 * be delegated to ALNIntentResolver.
 */
export function suggestCapabilitiesForIntent(intent) {
  if (!intent || typeof intent !== 'string') return [];

  const text = intent.toLowerCase();
  const matches = [];

  for (const cap of JavaspectreCapabilities) {
    let score = 0;

    if (text.includes('sustain') || text.includes('carbon') || text.includes('energy')) {
      if (cap.category === 'sustainability') score += 3;
      if (cap.spectralTags.includes('sustainability')) score += 2;
    }

    if (text.includes('repo') || text.includes('repository') || text.includes('scaffold')) {
      if (cap.category === 'scaffolding') score += 3;
      if (cap.spectralTags.includes('repo')) score += 1;
    }

    if (text.includes('dom') || text.includes('scrape') || text.includes('selector')) {
      if (cap.spectralTags.includes('dom')) score += 3;
    }

    if (text.includes('deploy') || text.includes('docker') || text.includes('serverless')) {
      if (cap.category === 'deployment') score += 3;
    }

    if (text.includes('refine') || text.includes('optimize') || text.includes('improve')) {
      if (cap.category === 'refinement' || cap.category === 'evolution') score += 2;
    }

    if (text.includes('open source') || text.includes('community') || text.includes('license')) {
      if (cap.category === 'oss') score += 3;
    }

    if (text.includes('integrity') || text.includes('quality') || text.includes('lint')) {
      if (cap.category === 'integrity') score += 2;
    }

    if (text.includes('impact') || text.includes('planetary') || text.includes('save the earth')) {
      if (cap.category === 'sustainability') score += 2;
    }

    if (score > 0) {
      matches.push({ capability: cap, score });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score || a.capability.index - b.capability.index)
    .map((m) => m.capability);
}

/**
 * Return a concise, JSON-safe description of all capabilities for use by
 * other AI systems or UI layers.
 */
export function listCapabilitiesSummary() {
  return JavaspectreCapabilities.map((cap) => ({
    id: cap.id,
    name: cap.name,
    category: cap.category,
    summary: cap.summary,
    entryModule: cap.entryModule,
    primaryCli: cap.primaryCli,
    sustainabilityImpact: cap.sustainabilityImpact
  }));
}

/**
 * Compose an execution recipe given an intent.
 * This is a high-level suggestion that SpectralEngine can refine.
 */
export function buildExecutionRecipe(intent) {
  const candidates = suggestCapabilitiesForIntent(intent);
  const selected = candidates.slice(0, 5); // keep recipe compact

  return {
    intent,
    steps: selected.map((cap, idx) => ({
      step: idx + 1,
      capabilityId: cap.id,
      capabilityName: cap.name,
      entryModule: cap.entryModule,
      purpose: cap.summary,
      sustainabilityHint: cap.sustainabilityImpact.notes
    }))
  };
}

export default {
  JavaspectreCapabilities,
  suggestCapabilitiesForIntent,
  listCapabilitiesSummary,
  buildExecutionRecipe
};
