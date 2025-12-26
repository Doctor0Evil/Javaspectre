// Path: tests/builder.test.js

import fs from "fs";
import path from "path";
import { CrossPlatformBuilder } from "../src/capabilities/CrossPlatformBuilder.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed.");
  }
}

(() => {
  const repoRoot = process.cwd();
  const builder = new CrossPlatformBuilder({ repoRoot });
  const result = builder.generateArtifacts({ entry: "src/core/SpectralEngine.js" });

  assert(fs.existsSync(path.join(result.dockerDir, "Dockerfile")), "Dockerfile should exist.");
  assert(
    fs.existsSync(path.join(result.bundleDir, "webpack.config.js")),
    "webpack.config.js should exist."
  );

  console.log("builder.test.js OK");
})();
