// Path: src/capabilities/ConsciousnessTransferSimulator.js
// ConsciousnessTransferSimulator
// Cybernetic resleeving simulator for identity coherence.
//
// Anchors:
// - Norbert Wiener's cybernetics (1948): feedback and control in information systems.
// - Lyapunov stability: V(x) > 0, dV/dt < 0 ensures asymptotic stability of identity error.
// - Sci-fi interpretation: "stacks" and "sleeves" as virtual-objects for transfer scenarios.
//
// Features:
// - Neuromorphic adaptation: per-sleeve weights for how well a mind fits a sleeve type.
// - Integrity decay: sleeve sickness / drift modeled as a feedback term.
// - XR hooks: graph of transfers over time for 3D resleeving visualizations.
// - Node-ready: can run as a service, streaming JSON logs for xAI dashboards.

import crypto from "crypto";
import os from "os";
import fs from "fs/promises";

export class ConsciousnessTransferSimulator {
  constructor({
    baseIntegrity = 0.95,
    decayRate = 0.02,
    sleeves = [],
    xrEnabled = true,
    logPath = "./consciousness_transfer_log.json"
  } = {}) {
    this.transferId = crypto.randomBytes(16).toString("hex");

    this.integrity = this.#clamp01(baseIntegrity);
    this.decayRate = decayRate > 0 ? decayRate : 0.01;

    this.sleeves = Array.isArray(sleeves) ? [...sleeves] : [];
    this.history = [
      {
        timestamp: new Date().toISOString(),
        integrity: this.integrity,
        sleeve: null
      }
    ];

    this.neuromorphicWeights = new Map();
    this.xrData = xrEnabled ? this.#initXR() : null;
    this.logPath = logPath;

    this.historicalContext = {
      root: "Wiener, Cybernetics (1948): feedback and control",
      mechanisms: "Mind–body feedback loops for resleeving stability"
    };

    this.hostMeta = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemoryGB: Math.round((os.totalmem() / (1024 ** 3)) * 100) / 100
    };
  }

  #clamp01(x) {
    if (!Number.isFinite(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
  }

  #clampWeight(w) {
    if (!Number.isFinite(w)) return 1;
    if (w < 0.5) return 0.5;
    if (w > 1.5) return 1.5;
    return w;
  }

  /**
   * Simulate a resleeve event with cybernetic feedback.
   * @param {string} newSleeveType - e.g., "envoy_combat", "diplomat", "baseline".
   * @param {number} transferImpact - Direct perturbation in [-1, 1] (recommended -0.2..0.2).
   * @returns {Promise<object>}
   */
  async simulate(newSleeveType, transferImpact = 0) {
    if (typeof newSleeveType !== "string" || newSleeveType.trim() === "") {
      throw new Error(
        'ConsciousnessTransferSimulator.simulate: "newSleeveType" must be a non-empty string.'
      );
    }
    if (typeof transferImpact !== "number" || !Number.isFinite(transferImpact)) {
      throw new Error(
        'ConsciousnessTransferSimulator.simulate: "transferImpact" must be a finite number.'
      );
    }

    const timestamp = new Date().toISOString();

    const rawWeight = this.neuromorphicWeights.get(newSleeveType) || 1.0;
    const adaptedWeight = this.#clampWeight(rawWeight * (1 + transferImpact));
    this.neuromorphicWeights.set(newSleeveType, adaptedWeight);

    const deltaIntegrity = transferImpact * adaptedWeight;
    this.integrity = this.#clamp01(this.integrity + deltaIntegrity);

    this.sleeves.push({
      type: newSleeveType,
      affinity: adaptedWeight
    });

    const decayFactor = this.decayRate * (this.sleeves.length / 10);
    this.integrity = this.#clamp01(this.integrity - decayFactor);

    this.history.push({
      timestamp,
      integrity: this.integrity,
      sleeve: newSleeveType
    });

    if (this.xrData) {
      const previous =
        this.history.length > 1
          ? this.history[this.history.length - 2].timestamp
          : "root";
      this.xrData.nodes.push({
        id: timestamp,
        integrity: this.integrity,
        sleeve: newSleeveType
      });
      this.xrData.edges.push({
        from: previous,
        to: timestamp,
        relation: "resleeve"
      });
    }

    const proof = this.#proveLyapunov();

    const snapshot = {
      transferId: this.transferId,
      currentIntegrity: this.integrity,
      history: this.history.slice(-128),
      neuromorphicWeights: Array.from(this.neuromorphicWeights.entries()),
      sleeves: this.sleeves.slice(-64),
      xrData: this.xrData,
      proof,
      hostMeta: this.hostMeta,
      simulatedAt: timestamp,
      context: this.historicalContext
    };

    await this.#logSimulation(snapshot);
    return snapshot;
  }

  #initXR() {
    return {
      nodes: [
        {
          id: "root",
          integrity: this.integrity,
          sleeve: "origin",
          label: this.historicalContext.root
        }
      ],
      edges: []
    };
  }

  #proveLyapunov() {
    const x = 1 - this.integrity;
    const A = -this.decayRate;
    const P = 1;
    const Q = -2 * A;

    const u = 0;
    const dVdt = 2 * x * (A * x + u);

    return {
      equation: "V(x) = x^2, dV/dt = 2x(Ax + u)",
      parameters: {
        A,
        P,
        Q,
        x,
        u
      },
      dVdt,
      stable: dVdt < 0 && Q > 0,
      note:
        "x = 1 - integrity is identity error; negative dV/dt with Q>0 indicates asymptotic stability for small perturbations."
    };
  }

  async #logSimulation(result) {
    try {
      const line = JSON.stringify(result) + "\n";
      await fs.appendFile(this.logPath, line, "utf8");
    } catch (err) {
      void err;
    }
  }

  /**
   * Service mode: periodic synthetic resleeves.
   * @param {number} intervalMs
   * @param {() => string} sleeveGenerator
   * @param {() => number} impactGenerator
   */
  async runAsService(
    intervalMs = 5000,
    sleeveGenerator = () => "envoy_combat",
    impactGenerator = () => Math.random() * 0.2 - 0.1
  ) {
    console.log("ConsciousnessTransferSimulator service started.");
    setInterval(async () => {
      try {
        const newSleeve = sleeveGenerator();
        const impact = impactGenerator();
        const result = await this.simulate(newSleeve, impact);
        console.log(
          "Resleeve",
          newSleeve,
          "integrity:",
          result.currentIntegrity.toFixed(3)
        );
      } catch (err) {
        console.error("ConsciousnessTransferSimulator service error:", err);
      }
    }, intervalMs);
  }
}

export default ConsciousnessTransferSimulator;
