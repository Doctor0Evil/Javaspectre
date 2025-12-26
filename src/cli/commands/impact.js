// Path: src/cli/commands/impact.js

import { PlanetaryImpactSim } from "../../capabilities/PlanetaryImpactSim.js";
import { SustainabilityCore } from "../../core/SustainabilityCore.js";

export async function runImpact(args, engine) {
  const requestsPerDay = Number(args[0] || "0");

  const sim = new PlanetaryImpactSim();
  const simResult = sim.simulate({ requestsPerDay });

  const core = new SustainabilityCore();
  const coreResult = core.evaluateImpact({
    intent: `impact analysis for ${requestsPerDay} requests per day`,
    dependencyPlan: null,
    executionRecipe: { steps: [] }
  });

  const intent = `impact simulation ${requestsPerDay} requests per day`;
  const engineResult = await engine.run(intent, {});

  process.stdout.write(
    JSON.stringify(
      {
        action: "impact",
        requestsPerDay,
        planetarySim: simResult,
        sustainabilityCore: coreResult,
        engineRunId: engineResult.runId
      },
      null,
      2
    ) + "\n"
  );
}
