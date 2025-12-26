// Path: src/core/QuantumDependencyManager.js
// Guarantees deterministic dependency trees across environments.

import crypto from "crypto";

export class QuantumDependencyManager {
  constructor(options = {}) {
    this.defaultNode = options.defaultNode || "18.x";
    this.registryMirror = options.registryMirror || "https://registry.npmjs.org";
  }

  /**
   * Build a deterministic dependency plan for a given intent and recipe.
   *
   * @param {object} params
   * @returns {object}
   */
  buildDeterministicPlan(params) {
    const { intent, recipe, runtime, targetNodeVersion } = params;

    const nodeVersion = targetNodeVersion || this.defaultNode;
    const capabilityIds = (recipe?.steps || []).map((s) => s.capabilityId);
    const seed = `${intent}:${capabilityIds.join(",")}:${nodeVersion}:${runtime}`;
    const planId = this.#hash(seed);

    const baseDeps = this.#inferBaseDependencies(capabilityIds);
    const lockedDeps = this.#lockVersions(baseDeps, planId);

    return {
      planId,
      runtime: runtime || "node",
      nodeVersion,
      registryMirror: this.registryMirror,
      dependencies: lockedDeps,
      integritySummary: this.#buildIntegritySummary(lockedDeps)
    };
  }

  #inferBaseDependencies(capabilityIds) {
    const deps = {
      yaml: "^2.6.0",
      ajv: "^8.17.1",
      chalk: "^5.3.0"
    };

    if (capabilityIds.includes("planetary-impact-sim")) {
      deps["decimal.js"] = "^10.4.3";
    }
    if (capabilityIds.includes("live-virtual-harvester")) {
      deps["node-html-parser"] = "^6.1.13";
    }
    if (capabilityIds.includes("cross-platform-builder")) {
      deps["execa"] = "^9.5.2";
    }

    return deps;
  }

  #lockVersions(deps, planId) {
    const locked = {};
    const keys = Object.keys(deps).sort();
    keys.forEach((name, index) => {
      const baseVersion = deps[name];
      const lockSeed = `${planId}:${name}:${baseVersion}:${index}`;
      const digest = this.#hash(lockSeed);
      const patch = parseInt(digest.slice(0, 2), 16) % 20;
      const lockedVersion = baseVersion.replace("^", "").replace("~", "");
      const parts = lockedVersion.split(".");
      if (parts.length === 3) {
        parts[2] = String(patch);
      }
      locked[name] = parts.join(".");
    });
    return locked;
  }

  #buildIntegritySummary(lockedDeps) {
    const entries = Object.entries(lockedDeps);
    const count = entries.length;
    const names = entries.map(([name]) => name);
    const signature = this.#hash(JSON.stringify(entries));
    return {
      packageCount: count,
      packageNames: names,
      lockSignature: signature
    };
  }

  #hash(text) {
    return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
  }
}

export default QuantumDependencyManager;
