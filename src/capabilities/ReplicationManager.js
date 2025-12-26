// Path: src/capabilities/ReplicationManager.js
// 24-hour replication verification and artifact stamping.

import fs from "fs";
import path from "path";

export class ReplicationManager {
  constructor(options = {}) {
    this.outputDir =
      options.outputDir || path.join(process.cwd(), ".javaspectre");
  }

  /**
   * Generate a replication manifest describing how to reproduce a project in 24 hours.
   *
   * @param {object} params
   * @param {string} params.projectName
   * @param {string} params.repoPath
   * @param {object} [params.dependencyPlan]
   * @returns {object}
   */
  generateReplicationManifest(params = {}) {
    const { projectName, repoPath, dependencyPlan } = params;

    if (!projectName || !repoPath) {
      throw new Error(
        "ReplicationManager.generateReplicationManifest: projectName and repoPath are required."
      );
    }

    const manifest = {
      projectName,
      repoPath: path.resolve(repoPath),
      createdAt: new Date().toISOString(),
      targetMaxHours: 24,
      prerequisites: [
        "Node.js 18 or newer",
        "npm or compatible package manager",
        "Git client",
        "Network access to fetch dependencies"
      ],
      steps: [
        "Clone the repository.",
        "Install dependencies with `npm install`.",
        "Run `npm test` to validate core behavior.",
        "Run `npm start` or the documented entry command.",
        "Consult README.md for domain-specific configuration, if any."
      ],
      dependencyPlan: dependencyPlan || null
    };

    this.#ensureDir(this.outputDir);
    const dest = path.join(
      this.outputDir,
      `${this.#slug(projectName)}.replication.json`
    );
    fs.writeFileSync(dest, JSON.stringify(manifest, null, 2), "utf8");

    return {
      manifest,
      manifestPath: dest
    };
  }

  #ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  #slug(name) {
    return String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

export default ReplicationManager;
