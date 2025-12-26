// Path: tests/spectral.test.js

import { SpectralEngine } from "../src/core/SpectralEngine.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed.");
  }
}

(async () => {
  const engine = new SpectralEngine();
  const result = await engine.run(
    "make a sustainable energy usage dashboard",
    {}
  );

  assert(result.runId, "SpectralEngine should return a runId.");
  assert(result.recipe.steps.length > 0, "Execution recipe should have steps.");
  console.log("spectral.test.js OK");
})();
