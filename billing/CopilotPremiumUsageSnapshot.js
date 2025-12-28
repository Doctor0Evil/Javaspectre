// Path: billing/CopilotPremiumUsageSnapshot.js

export const copilotPremiumUsageSnapshot = {
  cycle: "2025-12",
  pricePerRequestUsd: 0.04,
  includedConsumed: 9,
  billedRequests: 0,
  billedAmountUsd: 0,
  models: [
    {
      model: "GPT-5.1-Codex",
      includedRequests: 8,
      billedRequests: 0,
      grossUsd: 0.32,
    },
    {
      model: "Coding Agent model",
      includedRequests: 1,
      billedRequests: 0,
      grossUsd: 0.04,
    },
  ],
  budget: {
    currentUsd: 0,
    suggestionUsd: 10,
  },
};
