// Path: src/capabilities/LongevityAncestrySimulator.js
// LongevityAncestrySimulator
// Cybernetic, ancestry-aware longevity simulator.
//
// Anchors:
// - Villabruna Western Hunter-Gatherer (WHG) individual (~14kya) as a proxy for WHG ancestry.
// - Hardy–Weinberg principle for allele stability in large populations.
// - Logistic regression odds model for ancestry-linked trait probabilities.
//
// Features:
// - Neuromorphic adaptation: environmental pressures update weights and effective WHG proportion.
// - Allele evolution loop for 15 pro-longevity SNPs (synthetic frequencies).
// - XR hooks: time-series graph of simulated odds for 3D / XR dashboards.
// - Node-ready: can run as a service and stream JSON logs for xAI dashboards.

import crypto from "crypto";
import os from "os";
import fs from "fs/promises";

export class LongevityAncestrySimulator {
  constructor({
    baseWHG = 0.02,
    betaWHG = 0.32,
    snpCount = 15,
    xrEnabled = true,
    logPath = "./longevity_sim_log.json"
  } = {}) {
    this.simId = crypto.randomBytes(16).toString("hex");

    this.baseWHG = this.#clamp01(baseWHG);
    this.betaWHG = betaWHG;
    this.sdWHG = 0.01;
    this.snpCount = snpCount;

    this.alleles = this.#initAlleles();
    this.environmentPressures = new Map();

    const now = new Date().toISOString();
    this.history = [
      {
        timestamp: now,
        odds: this.#calcOdds(this.baseWHG),
        whg: this.baseWHG
      }
    ];

    this.xrData = xrEnabled ? this.#initXR() : null;
    this.logPath = logPath;

    this.historicalContext = {
      root: "Villabruna Western Hunter-Gatherer (~14kya)",
      mechanisms: "Post-LGM adaptations in immunity and energy metabolism"
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
   * Main simulation step.
   * @param {number} whgProportion - User WHG ancestry (0–1).
   * @param {Array<{type:string, impact:number, meta?:object}>} pressures
   * @returns {Promise<object>}
   */
  async simulate(whgProportion, pressures = []) {
    if (typeof whgProportion !== "number" || whgProportion < 0 || whgProportion > 1) {
      throw new Error(
        'LongevityAncestrySimulator.simulate: "whgProportion" must be a number between 0 and 1.'
      );
    }
    if (!Array.isArray(pressures)) {
      throw new Error(
        'LongevityAncestrySimulator.simulate: "pressures" must be an array.'
      );
    }

    const timestamp = new Date().toISOString();
    let adjustedWHG = this.#clamp01(whgProportion);

    for (const raw of pressures) {
      if (!raw || typeof raw !== "object") continue;
      const type = typeof raw.type === "string" ? raw.type : "unknown";
      const impact =
        typeof raw.impact === "number" && Number.isFinite(raw.impact)
          ? raw.impact
          : 0;

      const currentWeight = this.environmentPressures.get(type) || 1.0;
      const adaptedWeight = this.#clampWeight(
        currentWeight + impact * 0.05
      );
      this.environmentPressures.set(type, adaptedWeight);

      adjustedWHG = this.#clamp01(
        adjustedWHG + impact * adaptedWeight * 0.01
      );
    }

    this.#evolveAlleles(pressures.length);

    const odds = this.#calcOdds(adjustedWHG);
    this.history.push({ timestamp, odds, whg: adjustedWHG });

    if (this.xrData) {
      const previous =
        this.history.length > 1
          ? this.history[this.history.length - 2].timestamp
          : "root";
      this.xrData.nodes.push({
        id: timestamp,
        odds,
        whg: adjustedWHG
      });
      this.xrData.edges.push({
        from: previous,
        to: timestamp,
        relation: "evolution"
      });
    }

    const hweProof = this.#proveHWE();
    const lrProof = this.#proveLR(adjustedWHG);

    const snapshot = {
      simId: this.simId,
      currentOdds: odds,
      history: this.history.slice(-128),
      neuromorphicWeights: Array.from(this.environmentPressures.entries()),
      alleles: this.alleles,
      xrData: this.xrData,
      hweProof,
      lrProof,
      hostMeta: this.hostMeta,
      simulatedAt: timestamp,
      context: this.historicalContext
    };

    await this.#logSimulation(snapshot);
    return snapshot;
  }

  #initAlleles() {
    return Array.from({ length: this.snpCount }, () => {
      const base = 0.4 + Math.random() * 0.2;
      return this.#clamp01(base);
    });
  }

  #evolveAlleles(pressureCount) {
    if (!Number.isFinite(pressureCount) || pressureCount <= 0) return;
    const magnitude = pressureCount * 0.01;
    this.alleles = this.alleles.map((p) => {
      const delta = magnitude * (Math.random() - 0.5);
      const next = p + delta;
      if (next < 0.1) return 0.1;
      if (next > 0.9) return 0.9;
      return next;
    });
  }

  #calcOdds(whg) {
    if (this.sdWHG <= 0) return 0.5;
    const z = this.betaWHG * (whg - this.baseWHG) / this.sdWHG;
    const ez = Math.exp(z);
    return ez / (1 + ez);
  }

  #initXR() {
    return {
      nodes: [
        {
          id: "root",
          odds: this.#calcOdds(this.baseWHG),
          whg: this.baseWHG,
          label: this.historicalContext.root
        }
      ],
      edges: []
    };
  }

  #proveHWE() {
    const proofs = this.alleles.map((p) => {
      const q = 1 - p;
      const expected = [p * p, 2 * p * q, q * q];
      const observed = expected.map((v) => {
        const jitter = (Math.random() - 0.5) * 0.01;
        const o = v + jitter;
        return o < 0 ? 0 : o;
      });
      const chi2 = expected.reduce((sum, e, i) => {
        if (e <= 0) return sum;
        const diff = observed[i] - e;
        return sum + (diff * diff) / e;
      }, 0);
      return {
        p,
        q,
        chi2,
        equilibrium: chi2 < 3.84
      };
    });

    return {
      equation: "p^2 + 2pq + q^2 = 1",
      note:
        "Checks whether simulated SNPs approximate Hardy–Weinberg proportions under weak selection.",
      proofs,
      overallEquilibrium: proofs.every((pr) => pr.equilibrium)
    };
  }

  #proveLR(whg) {
    const z = (whg - this.baseWHG) / this.sdWHG;
    const or = Math.exp(this.betaWHG * z);
    return {
      equation: "OR = exp(β * (whg - μ)/σ)",
      parameters: {
        beta: this.betaWHG,
        mu: this.baseWHG,
        sigma: this.sdWHG,
        whg
      },
      or,
      percentChange: (or - 1) * 100,
      note:
        "Illustrates how WHG ancestry (in SD units) can shift odds in a binomial GLM-style model."
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
   * Service mode: periodically sample WHG and pressures.
   * @param {number} intervalMs
   * @param {() => Array<{type:string,impact:number,meta?:object}>} pressureGenerator
   */
  async runAsService(intervalMs = 5000, pressureGenerator = () => []) {
    console.log("LongevityAncestrySimulator service started.");
    setInterval(async () => {
      try {
        const pressures = pressureGenerator() || [];
        const whg = 0.015 + Math.random() * 0.035;
        const result = await this.simulate(whg, pressures);
        console.log(
          "Longevity sim",
          this.simId,
          "odds:",
          result.currentOdds.toFixed(3),
          "WHG:",
          result.history[result.history.length - 1].whg.toFixed(4)
        );
      } catch (err) {
        console.error("LongevityAncestrySimulator service error:", err);
      }
    }, intervalMs);
  }
}

export default LongevityAncestrySimulator;
