// Path: billing/JavaspectreBillingGuardian.js

/**
 * JavaspectreBillingGuardian
 *
 * Offline billing watchdog to prevent GitHub account lockouts and CI shutdowns.
 * You feed it:
 *  - recent payment history (success/declined),
 *  - current metered usage by product (Actions, Copilot premium, etc.),
 *  - budgets and limits.
 *
 * It returns:
 *  - risk level (LOW/MEDIUM/HIGH/CRITICAL),
 *  - concrete recommended actions,
 *  - structured flags you can wire into dashboards, CLIs, or alerts.
 */

class BillingGuardian {
  constructor(options = {}) {
    this.consecutiveDeclineThreshold =
      typeof options.consecutiveDeclineThreshold === "number"
        ? options.consecutiveDeclineThreshold
        : 2;

    this.highUtilizationThreshold =
      typeof options.highUtilizationThreshold === "number"
        ? options.highUtilizationThreshold
        : 0.9; // 90%

    this.warnUtilizationThreshold =
      typeof options.warnUtilizationThreshold === "number"
        ? options.warnUtilizationThreshold
        : 0.75; // 75%

    this.now = options.now instanceof Date ? options.now : new Date();
  }

  /**
   * Analyze full billing context and return a risk report.
   *
   * @param {Object} context
   * @param {Array<Object>} context.payments - Recent payments, newest first.
   *   Each: { date, id, method, amountUsd, status }.
   * @param {Object} context.usage - Usage by product.
   *   { actions: { grossUsd, discountsUsd, budgetUsd, spentUsd },
   *     copilotPremium: { grossUsd, budgetUsd, spentUsd, includedRequests, usedRequests } }
   * @param {Object} context.account - High-level account flags.
   *   { hasUnpaidInvoices, hasLockBanner }
   */
  analyze(context) {
    const paymentAnalysis = this._analyzePayments(context.payments || []);
    const usageAnalysis = this._analyzeUsage(context.usage || {});
    const accountFlags = context.account || {
      hasUnpaidInvoices: false,
      hasLockBanner: false,
    };

    const risk = this._computeRisk(paymentAnalysis, usageAnalysis, accountFlags);
    const recommendations = this._buildRecommendations(
      paymentAnalysis,
      usageAnalysis,
      accountFlags,
    );

    return {
      generatedAt: this.now.toISOString(),
      riskLevel: risk,
      paymentAnalysis,
      usageAnalysis,
      accountFlags,
      recommendations,
    };
  }

  // ---------------- Payment analysis ----------------

  _analyzePayments(payments) {
    let consecutiveDeclines = 0;
    let lastSuccess = null;
    let lastDecline = null;

    for (const p of payments) {
      if ((p.status || "").toLowerCase() === "declined") {
        consecutiveDeclines += 1;
        if (!lastDecline) lastDecline = p;
      } else if ((p.status || "").toLowerCase() === "success") {
        if (!lastSuccess) lastSuccess = p;
        // reset decline streak when we see a success
        break;
      }
    }

    const lastPayment = payments[0] || null;

    return {
      totalPaymentsConsidered: payments.length,
      lastPayment,
      lastSuccess,
      lastDecline,
      consecutiveDeclines,
      hasRecentDeclines: consecutiveDeclines > 0,
      exceedsDeclineThreshold:
        consecutiveDeclines >= this.consecutiveDeclineThreshold,
    };
  }

  // ---------------- Usage analysis ----------------

  _analyzeUsage(usage) {
    const actions = usage.actions || {
      grossUsd: 0,
      discountsUsd: 0,
      budgetUsd: 0,
      spentUsd: 0,
    };
    const copilotPremium = usage.copilotPremium || {
      grossUsd: 0,
      budgetUsd: 0,
      spentUsd: 0,
      includedRequests: 0,
      usedRequests: 0,
    };

    const actionsUtilization =
      actions.budgetUsd > 0 ? actions.spentUsd / actions.budgetUsd : 0;
    const copilotUtilization =
      copilotPremium.budgetUsd > 0
        ? copilotPremium.spentUsd / copilotPremium.budgetUsd
        : 0;

    const actionsNearBudget =
      actionsUtilization >= this.warnUtilizationThreshold &&
      actionsUtilization < 1;

    const actionsOverBudget = actions.spentUsd >= actions.budgetUsd &&
      actions.budgetUsd > 0;

    const copilotNearBudget =
      copilotUtilization >= this.warnUtilizationThreshold &&
      copilotUtilization < 1;

    const copilotOverBudget = copilotPremium.spentUsd >= copilotPremium.budgetUsd &&
      copilotPremium.budgetUsd > 0;

    const premiumRequestUtilization =
      copilotPremium.includedRequests > 0
        ? copilotPremium.usedRequests / copilotPremium.includedRequests
        : 0;

    const premiumRequestsNearLimit =
      premiumRequestUtilization >= this.warnUtilizationThreshold &&
      premiumRequestUtilization < 1;

    const premiumRequestsAtOrOverLimit =
      premiumRequestUtilization >= 1 &&
      copilotPremium.includedRequests > 0;

    return {
      actions: {
        ...actions,
        utilization: actionsUtilization,
        nearBudget: actionsNearBudget,
        overBudget: actionsOverBudget,
      },
      copilotPremium: {
        ...copilotPremium,
        utilization: copilotUtilization,
        nearBudget: copilotNearBudget,
        overBudget: copilotOverBudget,
        premiumRequestUtilization,
        premiumRequestsNearLimit,
        premiumRequestsAtOrOverLimit,
      },
    };
  }

  // ---------------- Risk computation ----------------

  _computeRisk(paymentAnalysis, usageAnalysis, accountFlags) {
    if (accountFlags.hasLockBanner || accountFlags.hasUnpaidInvoices) {
      return "CRITICAL";
    }

    if (paymentAnalysis.exceedsDeclineThreshold) {
      return "HIGH";
    }

    if (
      usageAnalysis.actions.overBudget ||
      usageAnalysis.copilotPremium.overBudget ||
      usageAnalysis.copilotPremium.premiumRequestsAtOrOverLimit
    ) {
      return "HIGH";
    }

    if (
      paymentAnalysis.hasRecentDeclines ||
      usageAnalysis.actions.nearBudget ||
      usageAnalysis.copilotPremium.nearBudget ||
      usageAnalysis.copilotPremium.premiumRequestsNearLimit
    ) {
      return "MEDIUM";
    }

    return "LOW";
  }

  // ---------------- Recommendations ----------------

  _buildRecommendations(paymentAnalysis, usageAnalysis, accountFlags) {
    const actions = [];
    const notes = [];

    // 1. Account-level issues
    if (accountFlags.hasLockBanner || accountFlags.hasUnpaidInvoices) {
      actions.push(
        "Open GitHub Settings → Billing & plans → Billing history and clear any unpaid invoices immediately.",
        "If lock persists after payment, contact GitHub Support with your latest invoice ID and decline codes.",
      );
      notes.push(
        "GitHub may pause Actions and other paid features when payments are past due or authorization fails.",
      );
    }

    // 2. Payment issues
    if (paymentAnalysis.exceedsDeclineThreshold) {
      actions.push(
        "Update your primary payment method in GitHub Settings → Billing & plans → Payment information.",
        "Call your bank or card issuer and explicitly whitelist recurring charges from GitHub.",
        "Temporarily reduce CI usage (Actions, Codespaces) until a successful charge appears in Billing history.",
      );
      notes.push(
        `Detected ${paymentAnalysis.consecutiveDeclines} consecutive declined payments. This pattern is commonly associated with account lockouts.`,
      );
    } else if (paymentAnalysis.hasRecentDeclines) {
      actions.push(
        "Verify card expiration date, CVV, and billing address on file with GitHub.",
        "Schedule a follow-up check: confirm a successful payment appears within 24 hours of updating billing info.",
      );
      notes.push(
        "Recent declined payments detected. Act now to avoid escalation to a locked billing state.",
      );
    }

    // 3. Actions usage / budgets
    const a = usageAnalysis.actions;
    if (a.overBudget) {
      actions.push(
        "Increase your GitHub Actions budget or spending limit slightly (for example, +10–20%) to avoid hard stops.",
        "Move long-running or non-critical CI workflows to scheduled windows or self-hosted runners.",
        "Disable redundant matrix jobs and limit OS variants to the minimum required.",
      );
      notes.push(
        "Actions spending has reached or exceeded the configured budget; GitHub may block additional usage when budgets are enforced.",
      );
    } else if (a.nearBudget) {
      actions.push(
        "Review top cost drivers (repositories and workflows) and scale back non-essential runs.",
        "Enable or tune budgets and alerts in Billing → Budgets for Actions to get proactive email notifications.",
      );
      notes.push(
        "Actions spending is approaching the configured monthly budget; plan adjustments before it hits 100%.",
      );
    }

    // 4. Copilot premium / premium requests
    const cp = usageAnalysis.copilotPremium;
    if (cp.overBudget || cp.premiumRequestsAtOrOverLimit) {
      actions.push(
        "Increase your Copilot premium request budget slightly or switch heavy tasks back to standard Copilot completions.",
      );
      notes.push(
        "Copilot premium usage has exhausted configured budget or included requests; additional premium calls may be blocked.",
      );
    } else if (cp.nearBudget || cp.premiumRequestsNearLimit) {
      actions.push(
        "Reserve premium models (e.g., GPT-5.1-Codex, agent features) for your most important coding sessions.",
      );
      notes.push(
        "Copilot premium usage is approaching its limit; prioritize critical tasks to avoid mid-session failures.",
      );
    }

    // 5. If everything looks good but there’s still some history of declines
    if (
      actions.length === 0 &&
      paymentAnalysis.hasRecentDeclines &&
      !accountFlags.hasLockBanner
    ) {
      actions.push(
        "Set a calendar reminder to re-check GitHub Billing & plans in 24 hours for any new decline events.",
      );
      notes.push(
        "No immediate lock indicators, but recent declines suggest monitoring is prudent.",
      );
    }

    // 6. Low-risk baseline advice
    if (actions.length === 0) {
      actions.push(
        "Enable budgets and threshold alerts for Actions and Copilot premium in GitHub Billing → Budgets.",
        "Regularly export or snapshot billing history and usage into your own monitoring system.",
      );
      notes.push(
        "Current billing risk appears low. Proactive monitoring will help prevent future surprises.",
      );
    }

    return { actions, notes };
  }
}

// -------- Convenience example using your December data --------

/**
 * Example: your recent payment/usage snapshot.
 * You can import this object and pass it into BillingGuardian.analyze(...)
 * to see the risk report for this exact state.
 */
export const december2025Snapshot = {
  payments: [
    {
      date: "2025-12-24",
      id: "0ISVRMYT",
      method: "MasterCard ending in 6476",
      amountUsd: 1103.62,
      status: "Declined",
    },
    {
      date: "2025-12-17",
      id: "1QGKSPW0",
      method: "MasterCard ending in 6476",
      amountUsd: 1103.62,
      status: "Declined",
    },
    {
      date: "2025-12-10",
      id: "1GKPPYZ7",
      method: "MasterCard ending in 6476",
      amountUsd: 1103.62,
      status: "Declined",
    },
    {
      date: "2025-11-13",
      id: "1LC6POQZ",
      method: "MasterCard ending in 6476",
      amountUsd: 9.82,
      status: "Success",
    },
  ],
  usage: {
    actions: {
      grossUsd: 1562.04,
      discountsUsd: 550.74,
      budgetUsd: 1000, // example budget; adjust to your real limit
      spentUsd: 1011.3,
    },
    copilotPremium: {
      grossUsd: 0.36,
      budgetUsd: 0,       // you currently allow no paid premium beyond included
      spentUsd: 0,
      includedRequests: 100, // hypothetical allowance
      usedRequests: 9,
    },
  },
  account: {
    hasUnpaidInvoices: true,   // inferred from multiple declines
    hasLockBanner: false,      // set true if you see a lock message in UI
  },
};

/**
 * Example function to generate a report for December.
 */
export function analyzeDecember2025() {
  const guardian = new BillingGuardian();
  return guardian.analyze(december2025Snapshot);
}

export default BillingGuardian;
