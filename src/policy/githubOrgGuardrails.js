// src/policy/githubOrgGuardrails.js
// Local ALN-style planner for GitHub org policy guardrails (no web/file tokens).

/**
 * @typedef {Object} GithubOrgGuardrailOptions
 * @property {boolean} [wantOrgPaidCodespaces=true]
 * @property {number}  [monthlyCodespacesBudgetUSD=50]
 * @property {boolean} [requireMultipleReviewers=true]
 * @property {number}  [requiredApprovals=2]
 * @property {boolean} [enforceCodeOwners=true]
 * @property {boolean} [requireStatusChecks=true]
 * @property {boolean} [enablePages=true]
 * @property {string[]} [protectedBranches]  // default: ["main", "master"]
 * @property {string[]} [statusCheckContexts] // default: ["ci/test", "ci/lint"]
 * @property {string[]} [reviewTeams] // default: ["core", "security", "infra"]
 */

/**
 * @typedef {Object} GithubOrgGuardrailStep
 * @property {string} area
 * @property {string} action
 * @property {Object} [details]
 * @property {string[]} [targetBranches]
 * @property {Object} [settings]
 */

/**
 * @typedef {Object} GithubOrgGuardrailPlan
 * @property {string} generatedAt
 * @property {string} intent
 * @property {GithubOrgGuardrailStep[]} steps
 * @property {GithubOrgGuardrailOptions} effectiveConfig
 */

/**
 * Normalize and validate options with hard defaults and minimal safety checks.
 * This is deliberately side-effect free so it can be used in tests and planners.
 * @param {GithubOrgGuardrailOptions} [options]
 * @returns {Required<GithubOrgGuardrailOptions>}
 */
export function normalizeGithubOrgGuardrailOptions(options = {}) {
  const {
    wantOrgPaidCodespaces = true,
    monthlyCodespacesBudgetUSD = 50,
    requireMultipleReviewers = true,
    requiredApprovals = 2,
    enforceCodeOwners = true,
    requireStatusChecks = true,
    enablePages = true,
    protectedBranches = ["main", "master"],
    statusCheckContexts = ["ci/test", "ci/lint"],
    reviewTeams = ["core", "security", "infra"]
  } = options;

  const safeBudget =
    Number.isFinite(monthlyCodespacesBudgetUSD) && monthlyCodespacesBudgetUSD >= 0
      ? monthlyCodespacesBudgetUSD
      : 0;

  const safeApprovals = Math.max(
    1,
    Number.isFinite(requiredApprovals) ? Math.floor(requiredApprovals) : 1
  );

  const safeBranches =
    Array.isArray(protectedBranches) && protectedBranches.length > 0
      ? protectedBranches
      : ["main"];

  const safeStatusChecks =
    Array.isArray(statusCheckContexts) && statusCheckContexts.length > 0
      ? statusCheckContexts
      : ["ci/test", "ci/lint"];

  const safeReviewTeams =
    Array.isArray(reviewTeams) && reviewTeams.length > 0
      ? reviewTeams
      : ["core"];

  return {
    wantOrgPaidCodespaces: Boolean(wantOrgPaidCodespaces),
    monthlyCodespacesBudgetUSD: safeBudget,
    requireMultipleReviewers: Boolean(requireMultipleReviewers),
    requiredApprovals: safeApprovals,
    enforceCodeOwners: Boolean(enforceCodeOwners),
    requireStatusChecks: Boolean(requireStatusChecks),
    enablePages: Boolean(enablePages),
    protectedBranches: safeBranches,
    statusCheckContexts: safeStatusChecks,
    reviewTeams: safeReviewTeams
  };
}

/**
 * Core planner: converts normalized options into an ALN-style guardrail plan.
 * @param {GithubOrgGuardrailOptions} [options]
 * @returns {GithubOrgGuardrailPlan}
 */
export function planGithubOrgGuardrails(options) {
  const cfg = normalizeGithubOrgGuardrailOptions(options);
  const steps = [];

  // Codespaces & billing
  if (cfg.wantOrgPaidCodespaces) {
    steps.push({
      area: "codespaces",
      action: "configure_org_billing_and_spend_limit",
      details: {
        billingOwner: "org",
        spendingLimitUSD: cfg.monthlyCodespacesBudgetUSD,
        rationale:
          "Org-owned Codespaces with a hard budget cap; personal free quotas remain for contributor-owned usage."
      }
    });
  } else {
    steps.push({
      area: "codespaces",
      action: "force_user_billing_only",
      details: {
        billingOwner: "user",
        rationale:
          "Disable org-paid Codespaces so contributors rely on personal free quotas and their own billing."
      }
    });
  }

  // Branch protection baseline
  const branchRule = {
    area: "branches",
    action: "set_branch_protection_template",
    targetBranches: cfg.protectedBranches,
    settings: {}
  };

  if (cfg.requireMultipleReviewers) {
    branchRule.settings.pullRequestApprovals = {
      enabled: true,
      requiredApprovals: cfg.requiredApprovals,
      includeAdmins: true
    };
  }

  if (cfg.enforceCodeOwners) {
    branchRule.settings.codeOwners = {
      requireReviewFromCodeOwners: true,
      codeownersFilePath: ".github/CODEOWNERS"
    };
  }

  if (cfg.requireStatusChecks) {
    branchRule.settings.statusChecks = {
      requireStatusChecksToPass: true,
      strict: true,
      requiredContexts: cfg.statusCheckContexts
    };
  }

  steps.push(branchRule);

  // GitHub Pages
  if (cfg.enablePages) {
    steps.push({
      area: "pages",
      action: "enable_github_pages",
      details: {
        source: "docs-folder-or-gh-pages-branch",
        enforceHttps: true,
        recommendedUse:
          "Host statically built docs, governance policies, and security pages for the org."
      }
    });
  }

  // Reviewer coverage
  steps.push({
    area: "reviews",
    action: "define_team_based_review_matrix",
    details: {
      teams: cfg.reviewTeams,
      policySummary:
        "Map critical paths to teams in CODEOWNERS and ensure at least one non-author approval from the owning team."
    }
  });

  return {
    generatedAt: new Date().toISOString(),
    intent:
      "Standardize GitHub org guardrails for Codespaces, reviews, and deployments.",
    steps,
    effectiveConfig: cfg
  };
}

/**
 * Scenario presets usable by higher-level planners or CLIs.
 */
export const githubOrgGuardrailPresets = {
  smallOpenSource: {
    wantOrgPaidCodespaces: false,
    monthlyCodespacesBudgetUSD: 0,
    requireMultipleReviewers: true,
    requiredApprovals: 1,
    enforceCodeOwners: true,
    requireStatusChecks: true,
    enablePages: true,
    protectedBranches: ["main"],
    statusCheckContexts: ["ci/test"],
    reviewTeams: ["core"]
  },
  regulatedEnterprise: {
    wantOrgPaidCodespaces: true,
    monthlyCodespacesBudgetUSD: 200,
    requireMultipleReviewers: true,
    requiredApprovals: 2,
    enforceCodeOwners: true,
    requireStatusChecks: true,
    enablePages: true,
    protectedBranches: ["main", "release/*"],
    statusCheckContexts: ["ci/test", "ci/lint", "ci/security-scan"],
    reviewTeams: ["core", "security", "infra", "compliance"]
  },
  experimentalLab: {
    wantOrgPaidCodespaces: true,
    monthlyCodespacesBudgetUSD: 100,
    requireMultipleReviewers: false,
    requiredApprovals: 1,
    enforceCodeOwners: false,
    requireStatusChecks: false,
    enablePages: false,
    protectedBranches: ["main"],
    statusCheckContexts: [],
    reviewTeams: ["core"]
  }
};

// Example CLI-style usage when run directly with Node.
if (process.argv[1] && process.argv[1].endsWith("githubOrgGuardrails.js")) {
  const presetArg = process.env.GITHUB_ORG_GUARDRAIL_PRESET || "regulatedEnterprise";
  const preset =
    githubOrgGuardrailPresets[presetArg] || githubOrgGuardrailPresets.regulatedEnterprise;

  const plan = planGithubOrgGuardrails({
    ...preset,
    // Environment overrides for quick tuning (optional)
    monthlyCodespacesBudgetUSD: process.env.CODESPACES_BUDGET_USD
      ? Number(process.env.CODESPACES_BUDGET_USD)
      : preset.monthlyCodespacesBudgetUSD
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(plan, null, 2));
}
