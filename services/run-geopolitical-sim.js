// Path: services/run-geopolitical-sim.js
// Simple CLI/service wrapper for GeopoliticalAllianceSimulator.

import GeopoliticalAllianceSimulator from "../src/cybernetics/GeopoliticalAllianceSimulator.js";

const simulator = new GeopoliticalAllianceSimulator({
  initialStrength: 0.7,
  decayRate: 0.04,
  xrEnabled: true,
  logPath: "./logs/geopolitical_sim_log.json"
});

function randomEventSource() {
  const types = [
    "treaty",
    "sanction",
    "conflict-skirmish",
    "peacekeeping",
    "arms-deal",
    "diplomatic-spat"
  ];
  const pickedType = types[Math.floor(Math.random() * types.length)];
  const impact =
    pickedType === "treaty" || pickedType === "peacekeeping"
      ? Math.random() * 0.15
      : -Math.random() * 0.2;

  return [
    {
      type: pickedType,
      impact,
      meta: {
        description: "Synthetic event for scenario exploration",
        region: "Transcaucasia",
        source: "simulated"
      }
    }
  ];
}

(async () => {
  await simulator.runAsService(4000, randomEventSource);
})();
