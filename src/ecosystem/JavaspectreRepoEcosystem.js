// Path: src/ecosystem/JavaspectreRepoEcosystem.js

/**
 * JavaspectreRepoEcosystem
 * A spectral-grade registry that models the Doctor0Evil GitHub universe
 * as virtual-objects, ready for excavation, visualization, and automation.
 *
 * No external network calls. This is a declarative, hand-curated source
 * of truth that other modules (CLI, web dashboards, impact simulators)
 * can consume.
 */

class VirtualRepoObject {
  constructor({
    id,
    name,
    slug,
    visibility,
    languages,
    primaryLanguage,
    categories,
    description,
    techFocus,
    spectralRole,
    complianceFocus,
    status,
    updatedAt,
    license,
    tags,
  }) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.visibility = visibility;
    this.languages = languages;
    this.primaryLanguage = primaryLanguage;
    this.categories = categories;
    this.description = description;
    this.techFocus = techFocus;
    this.spectralRole = spectralRole;
    this.complianceFocus = complianceFocus;
    this.status = status;
    this.updatedAt = updatedAt;
    this.license = license;
    this.tags = tags;
  }
}

/**
 * Seed: high-signal repos from the current ecosystem snapshot.
 * You can extend this toward 100 entries by appending more objects.
 */
const REPO_OBJECTS = [
  new VirtualRepoObject({
    id: "repo-aln-superintelligence-programming",
    name: "ALN-Superintelligence-Programming",
    slug: "Doctor0Evil/ALN-Superintelligence-Programming",
    visibility: "private-template",
    languages: ["CSS"],
    primaryLanguage: "CSS",
    categories: ["language", "ai-chat", "superintelligence"],
    description:
      "Next-gen ALN-native language for retail, AI, gaming, and virtual hardware. Born in chat, self-evolving, secure by design.",
    techFocus: [
      "augmented-language-networks",
      "domain-specific-language",
      "ai-automation",
    ],
    spectralRole: "core-language-kernel",
    complianceFocus: ["secure-by-design"],
    status: "active",
    updatedAt: "2025-12-14T00:00:00.000Z",
    license: "proprietary-template",
    tags: ["ALN", "SAI-MAI", "language", "kernel"],
  }),

  new VirtualRepoObject({
    id: "repo-bit-hub",
    name: "Bit.Hub",
    slug: "Doctor0Evil/Bit.Hub",
    visibility: "private-template",
    languages: ["Rust"],
    primaryLanguage: "Rust",
    categories: ["security", "credentials", "dev-tools"],
    description:
      "Secure, cross-platform Git credential storage with auth to GitHub, Azure Repos, and others.",
    techFocus: [
      "secure-storage",
      "multi-provider-auth",
      "developer-tooling",
    ],
    spectralRole: "credential-anchor",
    complianceFocus: ["identity", "access-control"],
    status: "active",
    updatedAt: "2025-12-25T00:00:00.000Z",
    license: "unspecified",
    tags: ["git", "credentials", "security", "tooling"],
  }),

  new VirtualRepoObject({
    id: "repo-metasitebuilder",
    name: "metasitebuilder",
    slug: "Doctor0Evil/metasitebuilder",
    visibility: "private-template",
    languages: ["JavaScript", "Other"],
    primaryLanguage: "JavaScript",
    categories: ["web", "nanoswarm", "policy"],
    description:
      "Quantum-ready metasite creation with nanoswarm, SAIMAI policy enforcement, and Web5 DID credentials for copy-protected meta0-data.",
    techFocus: [
      "web5",
      "dids",
      "nanoswarm",
      "policy-enforcement",
    ],
    spectralRole: "policy-hardened-site-factory",
    complianceFocus: ["copy-protection", "origin-verification"],
    status: "active",
    updatedAt: "2025-10-14T00:00:00.000Z",
    license: "unspecified",
    tags: ["metasites", "swarmnet", "saimai", "compliance"],
  }),

  new VirtualRepoObject({
    id: "repo-virta-sys",
    name: "Virta-Sys",
    slug: "Doctor0Evil/Virta-Sys",
    visibility: "private-template",
    languages: ["CSS"],
    primaryLanguage: "CSS",
    categories: ["virtual-hardware", "infrastructure"],
    description:
      "Virtual-hardware ecosystems with no reliance on physical hardware or infrastructure, aiming for 100% uptime.",
    techFocus: [
      "virtual-hardware",
      "distributed-systems",
      "ultra-availability",
    ],
    spectralRole: "virtual-infra-fabric",
    complianceFocus: ["resilience"],
    status: "active",
    updatedAt: "2025-11-12T00:00:00.000Z",
    license: "MIT",
    tags: ["infra", "virtualization", "uptime"],
  }),

  new VirtualRepoObject({
    id: "repo-javaspectre",
    name: "Javaspectre",
    slug: "Doctor0Evil/Javaspectre",
    visibility: "public",
    languages: ["JavaScript"],
    primaryLanguage: "JavaScript",
    categories: ["spectral-ai", "tooling", "framework"],
    description:
      "Spectral-grade ALN framework that turns conceptual uncertainty into executable JavaScript and replicable repositories.",
    techFocus: [
      "augmented-language-networks",
      "virtual-object-excavation",
      "repo-blueprinting",
      "sustainability-intel",
    ],
    spectralRole: "core-spectral-engine",
    complianceFocus: ["traceability", "auditability"],
    status: "active",
    updatedAt: "2025-12-28T00:00:00.000Z",
    license: "MIT",
    tags: ["javaspectre", "framework", "spectral-ai"],
  }),

  new VirtualRepoObject({
    id: "repo-swarmnet",
    name: "swarmnet",
    slug: "Doctor0Evil/swarmnet",
    visibility: "private-template",
    languages: ["ANTLR", "Other"],
    primaryLanguage: "ANTLR",
    categories: ["networking", "nanoswarm", "protocol"],
    description:
      "Swarmnet configuration and language foundations for nanoswarm, wasm contracts, and AI chat integrations.",
    techFocus: [
      "consensus-protocols",
      "wasm-contracts",
      "ai-orchestration",
    ],
    spectralRole: "network-backbone",
    complianceFocus: ["governance", "execution-policies"],
    status: "active",
    updatedAt: "2025-12-20T00:00:00.000Z",
    license: "unspecified",
    tags: ["swarmnet", "protocol", "bostrom"],
  }),

  new VirtualRepoObject({
    id: "repo-edge-browser-cyb",
    name: "Microsoft-Edge-Browser.cyb",
    slug: "Doctor0Evil/Microsoft-Edge-Browser.cyb",
    visibility: "private-template",
    languages: ["ANTLR"],
    primaryLanguage: "ANTLR",
    categories: ["browser", "compliance", "web5"],
    description:
      "Federated, compliance-focused browser architecture with cryptographic audit, device-bound DIDs/VCs, and modular policy-driven execution.",
    techFocus: [
      "browser-architecture",
      "cryptographic-audit",
      "web5",
      "policy-gating",
    ],
    spectralRole: "compliant-edge-runtime",
    complianceFocus: ["audit", "device-binding", "zero-trust"],
    status: "active",
    updatedAt: "2025-12-28T00:00:00.000Z",
    license: "MIT",
    tags: ["browser", "compliance", "edge"],
  }),

  new VirtualRepoObject({
    id: "repo-infra",
    name: "Infra",
    slug: "Doctor0Evil/Infra",
    visibility: "private-template",
    languages: ["CSS", "Other"],
    primaryLanguage: "CSS",
    categories: ["city-planning", "governance", "infra"],
    description:
      "Technology planner, city-builder, and compliance-agenda system for intelligent urban design and regulatory automation.",
    techFocus: [
      "smart-cities",
      "regtech",
      "infra-simulation",
    ],
    spectralRole: "urban-systems-orchestrator",
    complianceFocus: ["urban-policy", "infrastructure-governance"],
    status: "active",
    updatedAt: "2025-12-28T00:00:00.000Z",
    license: "unspecified",
    tags: ["infrastructure", "city", "automation"],
  }),

  new VirtualRepoObject({
    id: "repo-cybercore",
    name: "Cybercore",
    slug: "Doctor0Evil/Cybercore",
    visibility: "private-template",
    languages: ["Rust"],
    primaryLanguage: "Rust",
    categories: ["neuromorphic", "blockchain", "biosensing"],
    description:
      "Augmented-user system combining neuromorphic AI, secure blockchain governance, and real-time biosensing for next-gen smart cities.",
    techFocus: [
      "neuromorphic-ai",
      "biosensing",
      "governance-chains",
    ],
    spectralRole: "augmented-user-kernel",
    complianceFocus: ["privacy", "zero-trust"],
    status: "active",
    updatedAt: "2025-12-28T00:00:00.000Z",
    license: "unspecified",
    tags: ["cybernetics", "smart-city", "blockchain"],
  }),

  new VirtualRepoObject({
    id: "repo-sai-mai",
    name: "SAI-MAI",
    slug: "Doctor0Evil/SAI-MAI",
    visibility: "public-template",
    languages: ["CSS", "Other"],
    primaryLanguage: "CSS",
    categories: ["superintelligence-config", "policy"],
    description:
      "Superintelligence system configurations for AI-chat platforms, with persistent SAI/MAI fragment configurations using swarmnet.",
    techFocus: [
      "superintelligence-config",
      "policy-templates",
      "swarmnet-integration",
    ],
    spectralRole: "config-anchor",
    complianceFocus: ["safety", "policy-enforcement"],
    status: "active",
    updatedAt: "2025-12-14T00:00:00.000Z",
    license: "unspecified",
    tags: ["sai", "mai", "configs"],
  }),

  new VirtualRepoObject({
    id: "repo-promptjinn",
    name: "PromptJinn",
    slug: "Doctor0Evil/PromptJinn",
    visibility: "public",
    languages: ["JavaScript"],
    primaryLanguage: "JavaScript",
    categories: ["prompt-engineering", "tooling"],
    description:
      "JavaScript-based prompt engineering and orchestration toolkit for structured, reusable prompt flows.",
    techFocus: [
      "prompt-templates",
      "execution-graphs",
      "ai-integrations",
    ],
    spectralRole: "prompt-orchestration-node",
    complianceFocus: [],
    status: "active",
    updatedAt: "2025-12-26T00:00:00.000Z",
    license: "unspecified",
    tags: ["prompts", "javaspectre-compatible"],
  }),
];

/**
 * Utility functions for introspection and downstream use.
 */

function getAllRepos() {
  return REPO_OBJECTS.slice();
}

function getRepoById(id) {
  return REPO_OBJECTS.find((r) => r.id === id) || null;
}

function getReposByCategory(category) {
  return REPO_OBJECTS.filter((r) =>
    r.categories.includes(category)
  );
}

function getReposByTag(tag) {
  const needle = String(tag).toLowerCase();
  return REPO_OBJECTS.filter((r) =>
    r.tags.some((t) => t.toLowerCase() === needle)
  );
}

function buildEcosystemSummary() {
  const byVisibility = {};
  const byPrimaryLanguage = {};
  const bySpectralRole = {};

  for (const repo of REPO_OBJECTS) {
    byVisibility[repo.visibility] =
      (byVisibility[repo.visibility] || 0) + 1;

    byPrimaryLanguage[repo.primaryLanguage] =
      (byPrimaryLanguage[repo.primaryLanguage] || 0) + 1;

    bySpectralRole[repo.spectralRole] =
      (bySpectralRole[repo.spectralRole] || 0) + 1;
  }

  return {
    totalRepos: REPO_OBJECTS.length,
    byVisibility,
    byPrimaryLanguage,
    bySpectralRole,
  };
}

/**
 * Exported API: ready for CLIs, dashboards, or impact simulators.
 */
export const JavaspectreRepoEcosystem = {
  all: getAllRepos,
  byId: getRepoById,
  byCategory: getReposByCategory,
  byTag: getReposByTag,
  summary: buildEcosystemSummary,
};

export default JavaspectreRepoEcosystem;
