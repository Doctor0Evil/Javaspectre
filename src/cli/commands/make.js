// Path: src/cli/commands/make.js

import path from "path";
import { RepoBlueprinting } from "../../capabilities/RepoBlueprinting.js";
import { OpenSourceGenerator } from "../../capabilities/OpenSourceGenerator.js";
import { CrossPlatformBuilder } from "../../capabilities/CrossPlatformBuilder.js";

export async function runMake(args, engine) {
  const prompt = args.join(" ").trim();
  if (!prompt) {
    throw new Error("javaspectre make requires a non-empty description.");
  }

  const targetDir = path.resolve(process.cwd(), "javaspectre-generated");

  const repoBlueprinting = new RepoBlueprinting();
  const blueprint = repoBlueprinting.generateRepo({
    targetDir,
    prompt
  });

  const ossGen = new OpenSourceGenerator({ repoRoot: targetDir });
  ossGen.generate({ projectName: blueprint.name });

  const crossBuilder = new CrossPlatformBuilder({ repoRoot: targetDir });
  crossBuilder.generateArtifacts({ entry: "src/index.js" });

  const result = await engine.run(prompt, { repoRoot: targetDir });

  process.stdout.write(
    JSON.stringify(
      {
        action: "make",
        targetDir,
        blueprint,
        engineRunId: result.runId
      },
      null,
      2
    ) + "\n"
  );
}
