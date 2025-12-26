// Path: src/cli/commands/replicate.js`

import path from "path";
import { ReplicationManager } from "../../capabilities/ReplicationManager.js";

export async function runReplicate(args, engine) {
  const repoPath = args[0] ? path.resolve(args[0]) : process.cwd();
  const projectName = args[1] || path.basename(repoPath);

  const replication = new ReplicationManager();
  const { manifest, manifestPath } =
    replication.generateReplicationManifest({
      projectName,
      repoPath
    });

  const intent = `replicate ${projectName}`;
  const result = await engine.run(intent, { repoRoot: repoPath });

  process.stdout.write(
    JSON.stringify(
      {
        action: "replicate",
        manifest,
        manifestPath,
        engineRunId: result.runId
      },
      null,
      2
    ) + "\n"
  );
}
