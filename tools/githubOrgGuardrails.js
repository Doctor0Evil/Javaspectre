// githubOrgGuardrails.js
// Simple, local ALN-style planner for GitHub org policy guardrails (no web/file tokens).

export function planGithubOrgGuardrails(options) {
  const {
    wantOrgPaidCodespaces = true,
    monthlyCodespacesBudgetUSD = 50,
    requireMultipleReviewers = true,
    requiredApprovals = 2,
    enforceCodeOwners = true,
    requireStatusChecks = true,
    enablePages = true
  } = options || {};

  const steps = [];

  // Codespaces & billing
  if (wantOrgPaidCodespaces) {
    steps.push({
      area: "codespaces",
      action: "configure_org_billing_and_spend_limit",
      details: {
        billingOwner: "org",
        spendingLimitUSD: monthlyCodespacesBudgetUSD,
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
    targetBranches: ["main", "master"],
    settings: {}
  };

  if (requireMultipleReviewers) {
    branchRule.settings.pullRequestApprovals = {
      enabled: true,
      requiredApprovals: Math.max(1, requiredApprovals),
      includeAdmins: true
    };
  }

  if (enforceCodeOwners) {
    branchRule.settings.codeOwners = {
      requireReviewFromCodeOwners: true,
      codeownersFilePath: ".github/CODEOWNERS"
    };
  }

  if (requireStatusChecks) {
    branchRule.settings.statusChecks = {
      requireStatusChecksToPass: true,
      strict: true,
      exampleChecks: ["ci/test", "ci/lint"]
    };
  }

  steps.push(branchRule);

  // GitHub Pages
  if (enablePages) {
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
      teams: ["core", "security", "infra"],
      policySummary:
        "Map critical paths to teams in CODEOWNERS and ensure at least one non-author approval from the owning team."
    }
  });

  return {
    generatedAt: new Date().toISOString(),
    intent: "Standardize GitHub org guardrails for Codespaces, reviews, and deployments.",
    steps
  };
}

// Example CLI-style usage when run directly with Node.
if (process.argv[1] && process.argv[1].endsWith("githubOrgGuardrails.js")) {
  const plan = planGithubOrgGuardrails({
    wantOrgPaidCodespaces: true,
    monthlyCodespacesBudgetUSD: 100,
    requiredApprovals: 2
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(plan, null, 2));
}
