// Path: /opt/javaspectre-systems/sustainability/ImpactMetricsToolkit.js
// Description:
// Utility functions to support:
// - Hospital decarbonization targeting,
// - Carbon-aware computing savings quantification,
// - Basic VSM viability checks.

export class ImpactMetricsToolkit {
  /**
   * Rank hospital subsystems by indicative emission share.
   * @returns {Array<{subsystem: string, indicativeSharePercent: number}>}
   */
  static hospitalHotspots() {
    return [
      { subsystem: "HVAC_and_building_services", indicativeSharePercent: 50 },
      { subsystem: "Imaging_and_clinical_equipment", indicativeSharePercent: 20 },
      { subsystem: "Anaesthetics_and_medical_gases", indicativeSharePercent: 10 },
      { subsystem: "IT_and_data_infrastructure", indicativeSharePercent: 10 },
      { subsystem: "Linen_and_other_consumables", indicativeSharePercent: 10 }
    ];
  }

  /**
   * Compute emissions and savings between baseline and carbon-aware scenarios.
   * @param {object} baseline - { energyKWh, carbonIntensityGramsPerKWh }
   * @param {object} aware - { energyKWh, carbonIntensityGramsPerKWh }
   * @param {string} [unit="job"] - Functional unit label.
   * @returns {object} summary
   */
  static carbonSavings(baseline, aware, unit = "job") {
    const compute = (e, ci) => {
      if (typeof e !== "number" || e < 0) {
        throw new Error("energyKWh must be a non-negative number.");
      }
      if (typeof ci !== "number" || ci < 0) {
        throw new Error("carbonIntensityGramsPerKWh must be a non-negative number.");
      }
      return e * ci;
    };

    const baseEmissions = compute(
      baseline.energyKWh,
      baseline.carbonIntensityGramsPerKWh
    );
    const awareEmissions = compute(
      aware.energyKWh,
      aware.carbonIntensityGramsPerKWh
    );
    const saved = baseEmissions - awareEmissions;
    const savedPct = baseEmissions > 0 ? (saved / baseEmissions) * 100 : 0;

    return {
      unit,
      baseline: {
        energyKWh: baseline.energyKWh,
        carbonIntensityGramsPerKWh: baseline.carbonIntensityGramsPerKWh,
        emissionsGramsCO2: baseEmissions
      },
      carbonAware: {
        energyKWh: aware.energyKWh,
        carbonIntensityGramsPerKWh: aware.carbonIntensityGramsPerKWh,
        emissionsGramsCO2: awareEmissions
      },
      savings: {
        gramsCO2: saved,
        percent: Number(savedPct.toFixed(2))
      }
    };
  }

  /**
   * Minimal health-check for a Viable System Model implementation.
   * @param {object} config
   * @param {Array<string>} config.system1Units
   * @param {boolean} config.hasSystem2
   * @param {boolean} config.hasSystem3
   * @param {boolean} config.hasSystem4
   * @param {boolean} config.hasSystem5
   * @returns {object} report
   */
  static checkVSM(config) {
    const missing = [];
    if (!Array.isArray(config.system1Units) || config.system1Units.length === 0) {
      missing.push("System 1 (operational units)");
    }
    if (!config.hasSystem2) missing.push("System 2 (coordination)");
    if (!config.hasSystem3) missing.push("System 3 (control/resource)");
    if (!config.hasSystem4) missing.push("System 4 (intelligence/strategy)");
    if (!config.hasSystem5) missing.push("System 5 (policy/identity)");

    return {
      ok: missing.length === 0,
      missing,
      notes:
        missing.length === 0
          ? "All core VSM systems are represented."
          : "Address missing systems to improve viability."
    };
  }
}
