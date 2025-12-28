// Path: src/cybernetics/GeopoliticalAllianceSimulator.js
// GeopoliticalAllianceSimulator
// Cybernetic alliance-strength simulator with:
// - Historical anchoring (e.g., Russo-Persian War 1826–1828, later Armenia–Russia security ties)
// - Differential-equation style decay model for alliance strength
// - Neuromorphic adaptation from discrete events
// - XR-ready graph output for 3D visualization layers (WebXR, Three.js, A-Frame)
// - JSON log stream usable by dashboards or xAI policy engines

import crypto from "crypto";
import os from "os";
import fs from "fs/promises";

export class GeopoliticalAllianceSimulator {
  constructor({
    initialStrength = 0.8,
    decayRate = 0.05,
    events = [],
    xrEnabled = true,
    logPath = "./geopolitical_sim_log.json"
  } = {}) {
    this.allianceId = crypto.randomBytes(16).toString("hex");
    this.strength = this.#clamp01(initialStrength);
    this.decayRate = Math.max(0, decayRate);
    this.events = Array.isArray(events) ? [...events] : [];
    this.history = [
      {
        timestamp: new Date().toISOString(),
        strength: this.strength,
        event: null
      }
    ];
    this.neuromorphicWeights = new Map();
    this.xrData = xrEnabled ? this.#initXR() : null;
    this.logPath = logPath;

    this.historicalContext = {
      root: "Russo-Persian War 1826–1828",
      modern:
        "CSTO collective security framework (from 1992) and Nagorno‑Karabakh crises in the 1990s, 2020 and 2023"
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
    if (Number.isNaN(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
  }

  /**
   * Simulate alliance shift with cybernetic feedback.
   * @param {Array<{type:string, impact:number, meta?:object}>} newEvents
   * @returns {Promise<object>}
   */
  async simulate(newEvents = []) {
    if (!Array.isArray(newEvents)) {
      throw new Error(
        'GeopoliticalAllianceSimulator.simulate: "newEvents" must be an array.'
      );
    }

    const now = new Date();
    const timestamp = now.toISOString();
    this.events.push(...newEvents);

    for (const raw of newEvents) {
      if (!raw || typeof raw !== "object") continue;
      const type = typeof raw.type === "string" ? raw.type : "unknown";
      const impact =
        typeof raw.impact === "number" && Number.isFinite(raw.impact)
          ? raw.impact
          : 0;

      const currentWeight = this.neuromorphicWeights.get(type) || 1.0;
      const adaptedWeight = this.#clampWeight(
        currentWeight * (1 + impact / 10)
      );
      this.neuromorphicWeights.set(type, adaptedWeight);

      this.strength = this.#clamp01(
        this.strength + impact * adaptedWeight
      );

      this.history.push({
        timestamp,
        strength: this.strength,
        event: {
          type,
          impact,
          meta: raw.meta || null
        }
      });
    }

    const decayFactor = this.decayRate * (this.events.length / 10);
    this.strength = this.#clamp01(this.strength - decayFactor);

    if (this.xrData) {
      const previous =
        this.history.length > 1
          ? this.history[this.history.length - 2].timestamp
          : "root";
      this.xrData.nodes.push({
        id: timestamp,
        strength: this.strength,
        label: "evolution-step",
        events: newEvents.length
      });
      this.xrData.edges.push({
        from: previous,
        to: timestamp,
        relation: "evolution"
      });
    }

    const proof = this.#proveDecay();
    const snapshot = {
      allianceId: this.allianceId,
      currentStrength: this.strength,
      history: this.history.slice(-128),
      neuromorphicWeights: Array.from(this.neuromorphicWeights.entries()),
      xrData: this.xrData,
      proof,
      hostMeta: this.hostMeta,
      simulatedAt: timestamp
    };

    await this.#logSimulation(snapshot);
    return snapshot;
  }

  #clampWeight(w) {
    if (Number.isNaN(w)) return 1;
    if (w < 0.1) return 0.1;
    if (w > 2.0) return 2.0;
    return w;
  }

  #initXR() {
    return {
      nodes: [
        {
          id: "root",
          strength: this.strength,
          label: this.historicalContext.root
        }
      ],
      edges: []
    };
  }

  #proveDecay() {
    const t = this.events.length;
    const S0 = this.history[0].strength;
    const k = this.decayRate;

    const expected = S0 * Math.exp(-k * t);
    const actual = this.strength;
    const error = Math.abs(actual - expected);

    return {
      equation: "dS/dt = -k S",
      solution: "S(t) = S0 * exp(-k * t)",
      parameters: { S0, k, t },
      expected,
      actual,
      error,
      stable: error < 0.1 && k > 0,
      note:
        "Approximate exponential decay; events act as external inputs, but positive k keeps the base system convergent."
    };
  }

  async #logSimulation(result) {
    try {
      const line = JSON.stringify(result) + "\n";
      await fs.appendFile(this.logPath, line, "utf8");
    } catch (err) {
      // Swallow log errors to avoid breaking the simulator in production.
      void err;
    }
  }

  /**
   * Run as service: call simulate() repeatedly using an eventSource.
   * @param {number} intervalMs
   * @param {() => Array<{type:string,impact:number,meta?:object}>} eventSource
   */
  async runAsService(intervalMs = 5000, eventSource = () => []) {
    console.log("GeopoliticalAllianceSimulator service started.");
    setInterval(async () => {
      try {
        const newEvents = eventSource() || [];
        if (Array.isArray(newEvents) && newEvents.length > 0) {
          const result = await this.simulate(newEvents);
          console.log(
            "Alliance",
            this.allianceId,
            "strength:",
            result.currentStrength.toFixed(3),
            "events:",
            newEvents.length
          );
        }
      } catch (err) {
        console.error("GeopoliticalAllianceSimulator service error:", err);
      }
    }, intervalMs);
  }
}

export default GeopoliticalAllianceSimulator;
