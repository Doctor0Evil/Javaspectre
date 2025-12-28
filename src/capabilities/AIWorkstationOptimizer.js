// src/capabilities/AIWorkstationOptimizer.js
// AIWorkstationOptimizer
// Scores and optimizes an AI/developer workstation across:
// - Ergonomics (posture, breaks, layout hints)
// - Compute profile (CPU/GPU/RAM/IO vs typical AI + validator loads)
// - Energy efficiency (performance per watt, basic power policies)
// Outputs: optimization plan + scores; XR/ALN layers can visualize this upstream.

export class AIWorkstationOptimizer {
  constructor(profile = {}) {
    this.hardware = {
      cpuCores: profile.cpuCores || 8,
      cpuGhz: profile.cpuGhz || 3.2,
      ramGb: profile.ramGb || 32,
      gpuVramGb: profile.gpuVramGb || 8,
      storageType: profile.storageType || "nvme", // hdd|ssd|nvme
      storageTb: profile.storageTb || 1,
      networkMbps: profile.networkMbps || 300,
      psuWatts: profile.psuWatts || 650
    };

    this.workStyle = {
      dailyHours: profile.dailyHours || 8,
      breakIntervalMinutes: profile.breakIntervalMinutes || 60,
      standingDesk: !!profile.standingDesk,
      externalMonitorCount: profile.externalMonitorCount || 2,
      usesWristSupport: !!profile.usesWristSupport
    };

    this.roles = profile.roles || [
      "ai-dev",
      "validator-ops",
      "general-productivity"
    ];
  }

  optimize() {
    const ergonomicsScore = this.#scoreErgonomics();
    const computeScore = this.#scoreCompute();
    const efficiencyScore = this.#scoreEfficiency();

    const scoreAggregate =
      0.35 * ergonomicsScore +
      0.4 * computeScore +
      0.25 * efficiencyScore;

    const recommendations = [
      ...this.#ergonomicRecommendations(ergonomicsScore),
      ...this.#computeRecommendations(computeScore),
      ...this.#efficiencyRecommendations(efficiencyScore)
    ];

    return {
      scores: {
        ergonomics: ergonomicsScore,
        compute: computeScore,
        efficiency: efficiencyScore,
        overall: Number(scoreAggregate.toFixed(2))
      },
      recommendations,
      xrBlueprint: this.#xrPanelBlueprint()
    };
  }

  // ---------- Scoring ----------

  #scoreErgonomics() {
    let score = 1.0;

    if (this.workStyle.breakIntervalMinutes > 60) score -= 0.25;
    if (this.workStyle.dailyHours > 10) score -= 0.2;
    if (!this.workStyle.standingDesk) score -= 0.15;
    if (!this.workStyle.usesWristSupport) score -= 0.15;
    if (this.workStyle.externalMonitorCount < 2) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  #scoreCompute() {
    let score = 1.0;

    if (this.hardware.cpuCores < 8 || this.hardware.cpuGhz < 3.0) score -= 0.25;
    if (this.hardware.ramGb < 32) score -= 0.25;
    if (this.hardware.storageType === "hdd") score -= 0.25;
    if (this.hardware.storageTb < 1) score -= 0.1;
    if (this.roles.includes("validator-ops") && this.networkMbps < 200) {
      score -= 0.15;
    }

    if (this.roles.includes("ai-dev") && this.hardware.gpuVramGb < 12) {
      score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  #scoreEfficiency() {
    let score = 1.0;

    const perfIndex =
      this.hardware.cpuCores * this.hardware.cpuGhz +
      this.hardware.gpuVramGb * 0.5;

    const perfPerWatt = perfIndex / Math.max(this.hardware.psuWatts, 1);
    if (perfPerWatt < 0.04) score -= 0.3;
    if (perfPerWatt < 0.06) score -= 0.15;

    if (this.hardware.storageType === "hdd") score -= 0.15;
    if (this.hardware.ramGb > 64 && !this.roles.includes("heavy-ai")) {
      score -= 0.05;
    }

    return Math.max(0, Math.min(1, score));
  }

  // ---------- Recommendations ----------

  #ergonomicRecommendations(score) {
    const recs = [];
    if (score < 0.9) {
      if (this.workStyle.breakIntervalMinutes > 60) {
        recs.push("Set a timer to take a 5–7 minute micro-break every 45–60 minutes.");
      }
      if (!this.workStyle.standingDesk) {
        recs.push("Consider a sit–stand solution to alternate posture during long AI or validator sessions.");
      }
      if (!this.workStyle.usesWristSupport) {
        recs.push("Add wrist support or an ergonomic keyboard/mouse to reduce strain during coding.");
      }
      if (this.workStyle.externalMonitorCount < 2) {
        recs.push("Use at least two external displays for code, dashboards, and telemetry without excessive head rotation.");
      }
    }
    if (recs.length === 0) {
      recs.push("Ergonomics look solid; maintain current habits and periodic posture self-checks.");
    }
    return recs;
  }

  #computeRecommendations(score) {
    const recs = [];
    if (score < 0.9) {
      if (this.hardware.cpuCores < 8 || this.hardware.cpuGhz < 3.0) {
        recs.push("Upgrade to at least 8 high-clock cores for stable AI workloads and node operations.");
      }
      if (this.hardware.ramGb < 32) {
        recs.push("Increase RAM to at least 32 GB for local AI tooling and indexing-heavy services.");
      }
      if (this.hardware.storageType === "hdd") {
        recs.push("Migrate workloads to SSD or NVMe storage for low-latency builds and node databases.");
      }
      if (this.roles.includes("validator-ops") && this.networkMbps < 200) {
        recs.push("Upgrade to a more stable, higher-bandwidth link (≥ 200 Mbps) for validator and indexing reliability.");
      }
      if (this.roles.includes("ai-dev") && this.hardware.gpuVramGb < 12) {
        recs.push("Consider a GPU with ≥ 12 GB VRAM for fine-tuning and large-model experimentation.");
      }
    }
    if (recs.length === 0) {
      recs.push("Compute profile is balanced for your declared roles; focus on software tuning and observability.");
    }
    return recs;
  }

  #efficiencyRecommendations(score) {
    const recs = [];
    if (score < 0.9) {
      recs.push("Enable OS-level power profiles that scale cores dynamically when idle.");
      recs.push("Schedule heavy experiments or indexing jobs in batches instead of always-on workloads.");
      recs.push("Prefer GPU-accelerated workloads where possible to increase performance-per-watt.");
    } else {
      recs.push("Energy profile is strong; consider adding telemetry to track performance-per-watt over time.");
    }
    return recs;
  }

  // ---------- XR Blueprint ----------

  #xrPanelBlueprint() {
    return {
      scene: "AIWorkstationControlPanel",
      panels: [
        {
          id: "ergonomics-panel",
          type: "gauge",
          label: "Ergonomics Score",
          range: [0, 1],
          bind: "scores.ergonomics"
        },
        {
          id: "compute-panel",
          type: "gauge",
          label: "Compute Score",
          range: [0, 1],
          bind: "scores.compute"
        },
        {
          id: "efficiency-panel",
          type: "gauge",
          label: "Efficiency Score",
          range: [0, 1],
          bind: "scores.efficiency"
        },
        {
          id: "recommendations-list",
          type: "list",
          label: "Optimization Actions",
          bind: "recommendations"
        }
      ],
      interactions: [
        "onSelectRecommendation: highlight related hardware or habit in XR.",
        "onScoreDrilldown: show underlying metrics and thresholds."
      ]
    };
  }
}

export default AIWorkstationOptimizer;

// Example usage:
// import AIWorkstationOptimizer from './AIWorkstationOptimizer.js';
// const optimizer = new AIWorkstationOptimizer({
//   cpuCores: 8,
//   cpuGhz: 3.4,
//   ramGb: 32,
//   gpuVramGb: 12,
//   storageType: 'nvme',
//   storageTb: 2,
//   networkMbps: 500,
//   psuWatts: 650,
//   dailyHours: 9,
//   breakIntervalMinutes: 90,
//   standingDesk: false,
//   externalMonitorCount: 1,
//   usesWristSupport: false,
//   roles: ['ai-dev', 'validator-ops']
// });
// const result = optimizer.optimize();
// console.log(JSON.stringify(result, null, 2));
