// filename: /Javaspectre/astrospectral/lunarAnomalyDetector.js
// destination: /modules/astrospectral/lunarAnomalyDetector.js

/**
 * Lunar Anomaly Spectral Detector
 * Javaspectre module for modeling chemical activity, subsurface dynamics,
 * and potential biosignatures on airless bodies like the Moon.
 *
 * Integrates patterns from:
 *  - LCROSS volatile plume composition (cometary/exogenic volatiles in PSRs)
 *  - Chandrayaan‑3 ChaSTE + payload thermal profiles and inferred water-ice stability
 *  - Recent polar/regolith models on temporary atmospheres and outgassing
 *
 * Design goals:
 *  - Deterministic, bounded 0–1 indices for each signal channel
 *  - Explicit mission-provenance tags per signal
 *  - A composite anomaly and habitability index that can feed ALN/QPU stacks
 */

"use strict";

class LunarAnomalyDetector {
  constructor() {
    /**
     * All indices are constrained to [0,1].
     * Values here are mid-range, “neutral” priors before mission-specific updates.
     */
    this.signals = {
      // Fractional intensity of volatile-rich regolith or PSR clathrates
      chemicalActivity: 0.30,

      // Probability of stable subsurface water ice at decimetre–metre depth
      subsurfaceWater: 0.15,

      // Relative strength of current or recent geological flux (outgassing, radon)
      geologicalFlux: 0.22,

      // Integrated, extremely conservative biosignature likelihood on an airless body
      biosignatureProbability: 0.01,

      // Stability of polar cold-trap conditions (geometry + thermophysical behavior)
      coldTrapStability: 0.35,

      // Human‑induced temporary atmosphere / contamination contribution
      anthropogenicAtmosphere: 0.05
    };

    /**
     * Per-channel mission provenance and scalarization.
     * Each entry can be ingested by ALN as a declarative block.
     */
    this.provenance = {
      chemicalActivity: {
        primaryMissions: ["LCROSS-Cabeus", "LRO-LAMP", "LRO-LEND"],
        dominantSourceModel: "exogenic-cometary+chondritic-volatiles",
        references: [
          "LCROSS volatile plume; ~20% ejecta volatiles with exogenic (cometary) signature.",
          "Elemental ratios (C/H, N/C, O/C, C/S) inconsistent with purely volcanic origin."
        ]
      },
      subsurfaceWater: {
        primaryMissions: ["Chandrayaan-1 M3", "Chandrayaan-3 ChaSTE"],
        dominantSourceModel: "polar-PSR-regolith-ice + migrating exosphere frost",
        references: [
          "ChaSTE near-south-pole temperature profiles show strong slope/insolation control on ice stability and depth.",
          "Thermal models indicate shallow subsurface ice can be stable at certain poleward slopes."
        ]
      },
      geologicalFlux: {
        primaryMissions: ["Apollo ALSEP legacy", "Chang’e-6 DORN (planned)"],
        dominantSourceModel: "radon outgassing + radiogenic heating + meteoroid gardening",
        references: [
          "DORN is designed to measure radon outgassing and constrain dust levitation and exosphere transport.",
          "Temporary atmospheres arise from natural outgassing and human activities during surface ops."
        ]
      },
      biosignatureProbability: {
        primaryMissions: [],
        dominantSourceModel: "forward-contamination + delivered organics, not indigenous biology",
        references: [
          "No confirmed lunar biosignatures; index maintained at very low prior on an airless, UV‑bathed body."
        ]
      },
      coldTrapStability: {
        primaryMissions: ["LRO-Diviner", "Chandrayaan-3 ChaSTE"],
        dominantSourceModel: "microtopography-controlled cold traps and PSRs",
        references: [
          "Steep, poleward-facing slopes can host stable surface/subsurface ice; warm slopes destabilize it."
        ]
      },
      anthropogenicAtmosphere: {
        primaryMissions: ["Apollo", "Artemis-era models"],
        dominantSourceModel: "EVA outgassing + lander exhaust → temporary local exospheres",
        references: [
          "Models show human activity can generate short-lived local atmospheres during intensive operations."
        ]
      }
    };

    /**
     * Weights for composite indices; sum(habitabilityWeights) <= 1 by design.
     * Adjusted so that geological, chemical, and water-related signals dominate.
     */
    this.weights = {
      anomaly: {
        chemicalActivity: 0.22,
        subsurfaceWater: 0.22,
        geologicalFlux: 0.20,
        biosignatureProbability: 0.06,
        coldTrapStability: 0.20,
        anthropogenicAtmosphere: 0.10
      },
      habitability: {
        subsurfaceWater: 0.40,
        chemicalActivity: 0.25,
        geologicalFlux: 0.20,
        coldTrapStability: 0.15
      }
    };

    /**
     * ALN-compatible spectral embedding; allows mapping each signal to a
     * QPU/neuromorphic feature vector, e.g., for multi-body comparative analysis.
     */
    this.spectralEmbedding = {
      // Order: [chemical, water, flux, biosignature, coldTrap, anthropogenic]
      baseVector: [0.30, 0.15, 0.22, 0.01, 0.35, 0.05]
    };
  }

  /**
   * Clamp and update a specific signal channel.
   * @param {string} type
   * @param {number} value
   */
  updateSignal(type, value) {
    if (!(type in this.signals)) {
      throw new Error(`Unknown signal type: ${type}`);
    }
    const clamped = Math.max(0, Math.min(1, Number(value)));
    this.signals[type] = clamped;
  }

  /**
   * Bulk update with a partial object.
   * @param {{[k: string]: number}} updates
   */
  bulkUpdate(updates) {
    Object.entries(updates).forEach(([k, v]) => {
      if (k in this.signals) this.updateSignal(k, v);
    });
  }

  /**
   * Compute composite anomaly and habitability indices (0–1).
   */
  computeResonance() {
    const sig = this.signals;
    const wA = this.weights.anomaly;
    const wH = this.weights.habitability;

    const overallAnomaly =
      sig.chemicalActivity * wA.chemicalActivity +
      sig.subsurfaceWater * wA.subsurfaceWater +
      sig.geologicalFlux * wA.geologicalFlux +
      sig.biosignatureProbability * wA.biosignatureProbability +
      sig.coldTrapStability * wA.coldTrapStability +
      sig.anthropogenicAtmosphere * wA.anthropogenicAtmosphere;

    const habitabilityIndex =
      sig.subsurfaceWater * wH.subsurfaceWater +
      sig.chemicalActivity * wH.chemicalActivity +
      sig.geologicalFlux * wH.geologicalFlux +
      sig.coldTrapStability * wH.coldTrapStability;

    return {
      overallAnomaly,
      habitabilityIndex,
      spectralVector: this._computeSpectralVector()
    };
  }

  /**
   * Convert current signals into a 6D spectral vector.
   */
  _computeSpectralVector() {
    return [
      this.signals.chemicalActivity,
      this.signals.subsurfaceWater,
      this.signals.geologicalFlux,
      this.signals.biosignatureProbability,
      this.signals.coldTrapStability,
      this.signals.anthropogenicAtmosphere
    ];
  }

  /**
   * Generate a detailed spectral report suitable for logs / dashboards.
   */
  generateSpectralReport() {
    const resonance = this.computeResonance();

    console.log("Lunar Spectral Analysis Report");
    console.log("--------------------------------");
    console.log(
      `Overall Anomaly Score   : ${(resonance.overallAnomaly * 100).toFixed(1)}%`
    );
    console.log(
      `Habitability Index      : ${(resonance.habitabilityIndex * 100).toFixed(
        1
      )}%`
    );
    console.log(
      `Spectral Vector         : [${resonance.spectralVector
        .map((v) => v.toFixed(3))
        .join(", ")}]`
    );
    console.log("\nSignal Breakdown (percent):");
    Object.entries(this.signals).forEach(([key, val]) => {
      const label = key.replace(/([A-Z])/g, " $1").toUpperCase();
      console.log(`  ${label.padEnd(26)}: ${(val * 100).toFixed(1)}%`);
    });
  }

  /**
   * Export a compact ALN-compatible data structure for ingestion.
   */
  exportForALN(siteId = "LUNAR_POLE_GENERIC") {
    const resonance = this.computeResonance();
    return {
      siteId,
      signals: { ...this.signals },
      resonance,
      provenance: this.provenance,
      weights: this.weights,
      timestampIso: new Date().toISOString()
    };
  }
}

// ===== Deployment with mission-informed parameters =====

// Instantiate detector
const lunarScan = new LunarAnomalyDetector();

/**
 * Mission-inspired updates:
 * - LCROSS: strong volatiles in Cabeus PSR, likely cometary/chondritic in origin.
 * - Chandrayaan‑3: thermal profiles suggest shallow subsurface ice is stable
 *   in certain polar microenvironments; more extensive ice than previously thought.
 * - Ongoing/planned radon measurements (e.g., DORN) and modeling of temporary
 *   atmospheres from human activity motivate a non-zero geologicalFlux and
 *   anthropogenicAtmosphere baseline.
 */

// Elevated volatile richness consistent with PSR volatiles
lunarScan.updateSignal("chemicalActivity", 0.55);

// Subsurface water probability boosted by ChaSTE and related analyses
lunarScan.updateSignal("subsurfaceWater", 0.42);

// Geological flux: low-to-moderate, reflecting radon outgassing and regolith dynamics
lunarScan.updateSignal("geologicalFlux", 0.30);

// Cold trap stability: strong for favorable polar PSR microtopography
lunarScan.updateSignal("coldTrapStability", 0.60);

// Temporary anthropogenic atmosphere: modest but non-negligible around active bases
lunarScan.updateSignal("anthropogenicAtmosphere", 0.18);

// Biosignature probability remains very low on the Moon
lunarScan.updateSignal("biosignatureProbability", 0.02);

// Emit spectral report
lunarScan.generateSpectralReport();

// Optional: export for ALN pipeline
// const alnPayload = lunarScan.exportForALN("LUNAR_SOUTH_POLE_SITE_X");
// console.log(JSON.stringify(alnPayload, null, 2));
