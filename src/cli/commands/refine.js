// Path: src/cli/commands/refine.js

import path from "path";
import { SpectralRefiner } from "../../capabilities/SpectralRefiner.js";

export async function runRefine(args, engine) {
  const filePath = args[0];
  if (!filePath) {
    throw new Error("javaspectre refine requires a target file path.");
  }

  const refiner = new SpectralRefiner();
  const report = await refiner.refineFile({ filePath });

  const intent = `refine ${path.resolve(filePath)}`;
  const result = await engine.run(intent, { repoRoot: report.repoRoot });

  process.stdout.write(
    JSON.stringify(
      {
        action: "refine",
        filePath: path.resolve(filePath),
        integrityReport: report,
        engineRunId: result.runId
      },
      null,
      2
    ) + "\n"
  );
}
