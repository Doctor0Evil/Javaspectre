// Path: billing/JavaspectreActionsBudgetPlan.js

export const actionsBudgetPlan = {
  cycle: "2025-12",
  includedMinutes: 2000,
  targetMaxSpendUsd: 1000,
  repositories: [
    {
      slug: "Doctor0Evil/ALN_Programming_Language",
      hardCapUsd: 400,
      strategies: [
        "Run full CI only on main and release branches",
        "Move long-running benchmarks to scheduled nightly workflows",
        "Enable aggressive dependency caching on Linux runners",
      ],
    },
    {
      slug: "Doctor0Evil/ALN-Superintelligence-Programming",
      hardCapUsd: 150,
      strategies: [
        "Limit OS matrix to Linux where possible",
        "Use separate, cheaper lint-only workflow for PRs",
      ],
    },
    {
      slug: "Doctor0Evil/NeuroScope",
      hardCapUsd: 120,
      strategies: [
        "Disable auto-runs on every push; require explicit workflow dispatch for heavy tests",
      ],
    },
    {
      slug: "Doctor0Evil/NeuroTech-Games",
      hardCapUsd: 120,
      strategies: [
        "Run GPU-heavy or integration tests on a self-hosted runner",
      ],
    },
    {
      slug: "Doctor0Evil/IBCP",
      hardCapUsd: 120,
      strategies: [
        "Split docs-only workflows from build/test workflows",
      ],
    },
  ],
};
