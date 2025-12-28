// Path: cli/bill-due-fix.js
// Javaspectre "Bill Due Fix" CLI
// Run: node cli/bill-due-fix.js

const billingSnapshot = {
  account: {
    hasLockBanner: false,
    hasUnpaidInvoices: true,
    twoFaRequired: false,
    emailUnverified: false,
  },
  payments: [
    {
      date: "2025-12-24",
      id: "0ISVRMYT",
      method: "MasterCard ending in 6476",
      amountUsd: 1103.62,
      status: "DECLINED",
    },
    {
      date: "2025-12-17",
      id: "1QGKSPW0",
      method: "MasterCard ending in 6476",
      amountUsd: 1103.62,
      status: "DECLINED",
    },
    {
      date: "2025-12-10",
      id: "1GKPPYZ7",
      method: "MasterCard ending in 6476",
      amountUsd: 1103.62,
      status: "DECLINED",
    },
    {
      date: "2025-11-13",
      id: "1LC6POQZ",
      method: "MasterCard ending in 6476",
      amountUsd: 9.82,
      status: "SUCCESS",
    },
  ],
  usage: {
    actions: {
      grossUsd: 1562.04,
      discountsUsd: 550.74,
      budgetUsd: 1000.0, // adjust to your real Actions budget
      spentUsd: 1011.3,
      includedMinutes: 2000,
      usedMinutes: 2000,
    },
    codespaces: {
      grossUsd: 0,
      discountsUsd: 0,
      budgetUsd: 0,
      spentUsd: 0,
      includedCoreHours: 120,
      usedCoreHours: 0,
    },
    copilotPremium: {
      grossUsd: 0.36,
      discountsUsd: 0,
      budgetUsd: 0, // you currently allow no paid premium
      spentUsd: 0,
      includedRequests: 100,
      usedRequests: 9,
    },
  },
};

function classifyBillingRisk(snapshot) {
  const { account, payments, usage } = snapshot;

  const consecutiveDeclines = countConsecutiveDeclines(payments);
  const actionsUtil = utilization(
    usage.actions.spentUsd,
    usage.actions.budgetUsd,
  );
  const actionsMinutesUtil = utilization(
    usage.actions.usedMinutes,
    usage.actions.includedMinutes,
  );
  const premiumUtil = utilization(
    usage.copilotPremium.usedRequests,
    usage.copilotPremium.includedRequests,
  );

  const flags = {
    consecutiveDeclines,
    actionsUtil,
    actionsMinutesUtil,
    premiumUtil,
    hasLockBanner: account.hasLockBanner,
    hasUnpaidInvoices: account.hasUnpaidInvoices,
  };

  const risk = computeRisk(flags);

  return { risk, flags };
}

function countConsecutiveDeclines(payments) {
  let streak = 0;
  for (const p of payments) {
    if ((p.status || "").toUpperCase() === "DECLINED") {
      streak += 1;
    } else if ((p.status || "").toUpperCase() === "SUCCESS") {
      break;
    }
  }
  return streak;
}

function utilization(used, total) {
  if (!total || total <= 0) return 0;
  return used / total;
}

function computeRisk(flags) {
  if (flags.hasLockBanner || flags.hasUnpaidInvoices) {
    return "CRITICAL";
  }
  if (flags.consecutiveDeclines >= 2) {
    return "HIGH";
  }
  if (
    flags.actionsUtil >= 1 ||
    flags.actionsMinutesUtil >= 1 ||
    flags.premiumUtil >= 1
  ) {
    return "HIGH";
  }
  if (
    flags.consecutiveDeclines > 0 ||
    flags.actionsUtil >= 0.75 ||
    flags.actionsMinutesUtil >= 0.75 ||
    flags.premiumUtil >= 0.75
  ) {
    return "MEDIUM";
  }
  return "LOW";
}

function renderFixPlan(result) {
  const { risk, flags } = result;
  console.log("=== Javaspectre Bill-Due Fix ===");
  console.log(`Risk level     : ${risk}`);
  console.log(
    `Declines       : ${flags.consecutiveDeclines} recent consecutive declines`,
  );
  console.log(
    `Actions budget : ${(flags.actionsUtil * 100).toFixed(1)}% of Actions budget`,
  );
  console.log(
    `Actions minutes: ${(flags.actionsMinutesUtil * 100).toFixed(1)}% of free minutes`,
  );
  console.log(
    `Premium usage  : ${(flags.premiumUtil * 100).toFixed(1)}% of premium requests`,
  );
  console.log("");

  if (risk === "LOW") {
    console.log("- Status is healthy. Keep budgets and alerts configured for Actions, Codespaces, and Copilot premium.");
    return;
  }

  if (flags.hasUnpaidInvoices || flags.hasLockBanner) {
    console.log("1) Clear unpaid invoices and lock state:");
    console.log("   - Go to: Settings → Billing & plans → Billing history.");
    console.log("   - Pay or retry any failed or pending invoice, even very small ones.");
    console.log("   - After payment, wait up to 24 hours and then re-run your workflows.");
    console.log("");
  }

  if (flags.consecutiveDeclines >= 2) {
    console.log("2) Fix repeated declined card charges:");
    console.log("   - Go to: Settings → Billing & plans → Payment information.");
    console.log("   - Add or update a valid credit card (not expired, correct CVV and address).");
    console.log("   - If PayPal is failing, switch to a direct credit card.");
    console.log("   - Call your bank and explicitly approve recurring charges from GitHub.");
    console.log("");
  } else if (flags.consecutiveDeclines > 0) {
    console.log("2) Recent decline detected:");
    console.log("   - Double-check that your card is valid and has sufficient limit.");
    console.log("   - Confirm billing address matches bank records.");
    console.log("");
  }

  if (flags.actionsUtil >= 1 || flags.actionsMinutesUtil >= 1) {
    console.log("3) Actions usage is above budget or free tier:");
    console.log("   - Go to: Settings → Billing & plans → Budgets.");
    console.log("   - Increase the Actions budget slightly above current usage, or set a non-zero spending limit.");
    console.log("   - Temporarily disable or scale down heavy CI workflows and OS matrices.");
    console.log("");
  } else if (flags.actionsUtil >= 0.75 || flags.actionsMinutesUtil >= 0.75) {
    console.log("3) Actions usage is approaching limits:");
    console.log("   - Prioritize critical workflows; move non-essential tests to nightly or self-hosted runners.");
    console.log("   - Configure email alerts at 75%, 90%, and 100% of Actions budget.");
    console.log("");
  }

  if (flags.premiumUtil >= 1) {
    console.log("4) Copilot premium requests at or over limit:");
    console.log("   - Optional: raise Copilot premium budget a small amount (for example, $5–$10).");
    console.log("   - Reserve GPT-5.1-Codex and agents for critical coding sessions only.");
    console.log("");
  } else if (flags.premiumUtil >= 0.75) {
    console.log("4) Copilot premium usage is high:");
    console.log("   - Keep heavy tasks on standard Copilot where possible to preserve premium allowance.");
    console.log("");
  }

  console.log("5) If jobs still say:");
  console.log('   \"The job was not started because recent account payments have failed or your spending limit needs to be increased.\"');
  console.log("   - Re-check: Settings → Billing & plans → Actions spending limit and budgets.");
  console.log("   - If everything looks correct and lock persists, contact GitHub Support:");
  console.log("     https://support.github.com/contact");
  console.log("   - Include: screenshot of billing page, payment history, and the exact error text.");
}

function main() {
  const result = classifyBillingRisk(billingSnapshot);
  renderFixPlan(result);

  if (result.risk === "HIGH" || result.risk === "CRITICAL") {
    process.exitCode = 2;
  }
}

main();
