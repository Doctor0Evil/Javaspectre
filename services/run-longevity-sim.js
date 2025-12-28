// Path: services/run-longevity-sim.js
// Service wrapper for LongevityAncestrySimulator.

import LongevityAncestrySimulator from "../src/capabilities/LongevityAncestrySimulator.js";

const simulator = new LongevityAncestrySimulator({
  baseWHG: 0.02,
  betaWHG: 0.32,
  snpCount: 15,
  xrEnabled: true,
  logPath: "./logs/longevity_sim_log.json"
});

function randomPressureGenerator() {
  const templates = [
    { type: "ice_age", impact: 0.12 },
    { type: "pathogen_burden", impact: 0.08 },
    { type: "sedentary_lifestyle", impact: -0.10 },
    { type: "caloric_restriction", impact: 0.09 },
    { type: "air_pollution", impact: -0.07 }
  ];
  const pickCount = 1 + Math.floor(Math.random() * 3);
  const pressures = [];
  for (let i = 0; i < pickCount; i += 1) {
    const chosen = templates[Math.floor(Math.random() * templates.length)];
    pressures.push({
      type: chosen.type,
      impact: chosen.impact,
      meta: { source: "simulated", note: "Scenario exploration" }
    });
  }
  return pressures;
}

(async () => {
  await simulator.runAsService(4000, randomPressureGenerator);
})();
