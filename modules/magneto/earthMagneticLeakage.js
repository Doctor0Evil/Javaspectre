// filename: /Javaspectre/magneto/earthMagneticLeakage.js
// destination: /modules/magneto/earthMagneticLeakage.js

/**
 * Earth Magnetic Field Leakage Simulator
 * Javaspectre module modeling atmospheric particle escape through magnetosphere gaps,
 * magnetotail focusing, and long-term volatile delivery to the lunar surface.
 *
 * Physical basis (qualitative):
 *  - Ionospheric escape and polar wind supply ions to the magnetosphere.
 *  - In the geomagnetic tail, some of these ions are guided toward the lunar orbit
 *    when the Moon passes through the magnetotail, especially near full Moon.
 *  - Over Gyr timescales, this can contribute a non-trivial volatile component
 *    to lunar regolith, complementing solar-wind implantation and exogenic delivery.
 *
 * NOTE:
 *  - Absolute fluxes and ppm matches to Apollo regolith are model-derived
 *    order-of-magnitude illustrations, not direct inversions of specific samples.
 */

"use strict";

class EarthMagneticLeakage {
  constructor(config = {}) {
    /**
     * Volatile composition fraction of escaping neutral/ion flux
     * (normalized; representative of mixed terrestrial leakage, not exact).
     */
    this.volatiles = {
      water:   0.42,
      co2:     0.22,
      nitrogen:0.18,
      argon:   0.13,
      helium:  0.05
    };

    /**
     * Effective escape rate (kg/s) feeding into magnetotail-connected trajectories.
     * This is an aggregated parameter that folds in:
     *  - ion outflow rates
     *  - fraction of flux geometrically intersecting the Moon's cross-section
     *  - duty cycle of the Moon within the magnetotail
     *
     * For research use, this should be calibrated against detailed models;
     * here it is exposed as a tunable parameter.
     */
    this.escapeRateKgPerSec = config.escapeRateKgPerSec ?? 1.0e3; // kg/s (effective)

    /**
     * Fraction of tail-directed escaping flux that actually reaches and implants
     * into the lunar regolith (geometric + efficiency factor).
     */
    this.lunarCaptureEfficiency = config.lunarCaptureEfficiency ?? 2.5e-4; // dimensionless

    /**
     * Representative average bulk density of regolith (kg/m^3) and thickness sampled.
     */
    this.regolithDensityKgPerM3 = 1500;   // kg/m^3
    this.sampleDepthM = 0.5;              // m
    this.coveredAreaKm2 = 1.0e7;          // km^2 of polar+dayside area considered

    // Precompute mass of regolith in the considered shell
    const areaM2 = this.coveredAreaKm2 * 1.0e6;
    this.regolithMassKg = this.regolithDensityKgPerM3 * this.sampleDepthM * areaM2;
  }

  /**
   * Normalize the volatile fractions to ensure sum = 1.
   */
  _normalizedVolatiles() {
    const sum = Object.values(this.volatiles).reduce((a, b) => a + b, 0);
    const out = {};
    Object.entries(this.volatiles).forEach(([k, v]) => {
      out[k] = sum > 0 ? v / sum : 0;
    });
    return out;
  }

  /**
   * Simulate total volatile mass leaked from Earth and directed into magnetotail
   * over a given timespan.
   * @param {number} years
   * @returns {{[species: string]: number}} mass in kg per species
   */
  simulateLeakageMass(years) {
    const norm = this._normalizedVolatiles();
    const seconds = years * 365.25 * 24 * 3600;
    const totalLeakedKg = this.escapeRateKgPerSec * seconds;
    const masses = {};
    Object.entries(norm).forEach(([species, fraction]) => {
      masses[species] = totalLeakedKg * fraction;
    });
    return masses;
  }

  /**
   * Estimate the subset of leaked volatiles captured by the Moon.
   * @param {number} years
   * @returns {{[species: string]: number}} mass in kg per species
   */
  simulateLunarCaptureMass(years) {
    const leakage = this.simulateLeakageMass(years);
    const captured = {};
    Object.entries(leakage).forEach(([species, massKg]) => {
      captured[species] = massKg * this.lunarCaptureEfficiency;
    });
    return captured;
  }

  /**
   * Convert captured mass to approximate ppm in a notional regolith reservoir.
   * ppm = (mass_species / regolith_mass) * 1e6
   */
  estimateRegolithPpm(years) {
    const captured = this.simulateLunarCaptureMass(years);
    const ppm = {};
    Object.entries(captured).forEach(([species, massKg]) => {
      ppm[species] = (massKg / this.regolithMassKg) * 1.0e6;
    });
    return ppm;
  }

  /**
   * Compare model prediction against an Apollo-style sample descriptor.
   * @param {{waterPpm?: number, co2Ppm?: number, nitrogenPpm?: number}} apolloSample
   * @param {number} years
   */
  compareToApollo(apolloSample, years = 4.5e9) {
    const modelPpm = this.estimateRegolithPpm(years);
    const observed = {
      waterPpm: apolloSample.waterPpm ?? 120,
      co2Ppm: apolloSample.co2Ppm ?? 40,
      nitrogenPpm: apolloSample.nitrogenPpm ?? 10
    };

    const match = {};
    ["waterPpm", "co2Ppm", "nitrogenPpm"].forEach((key) => {
      const species = key.replace("Ppm", "");
      const pred = modelPpm[species] ?? 0;
      const obs = observed[key];
      const ratio = obs > 0 ? Math.min(pred, obs) / Math.max(pred, obs) : 0;
      match[key] = {
        observed: obs,
        predicted: pred,
        matchIndex: ratio
      };
    });

    const aggregatedMatch =
      (match.waterPpm.matchIndex +
        match.co2Ppm.matchIndex +
        match.nitrogenPpm.matchIndex) / 3.0;

    return {
      years,
      modelPpm,
      observed,
      perSpecies: match,
      aggregatedMatch
    };
  }

  /**
   * Generate a concise report.
   */
  generateReport() {
    const years = 4.5e9;
    const comparison = this.compareToApollo({}, years);

    console.log("Earth–Moon Volatile Transfer Report");
    console.log("----------------------------------");
    console.log(`Timescale simulated: ${(years / 1e9).toFixed(2)} Gyr\n`);

    console.log("Approximate model ppm in regolith-scale reservoir:");
    Object.entries(comparison.modelPpm).forEach(([species, ppm]) => {
      console.log(`  ${species.toUpperCase().padEnd(8)}≈ ${ppm.toExponential(3)} ppm`);
    });

    console.log("\nRepresentative Apollo-style observed ppm (order-of-magnitude):");
    Object.entries(comparison.observed).forEach(([key, val]) => {
      console.log(`  ${key.replace("Ppm", "").toUpperCase().padEnd(8)}≈ ${val.toFixed(1)} ppm`);
    });

    console.log(
      `\nAggregated match index (0–1, order-of-magnitude consistency): ` +
        comparison.aggregatedMatch.toFixed(2)
    );

    console.log(
      "\nImplication (qualitative): Earth’s magnetosphere does not simply block escape; " +
      "tail-directed leakage can contribute a long-term volatile source to the Moon, " +
      "complementing solar-wind implantation and exogenic delivery."
    );
  }
}

// Deploy lunar volatile seeding model
const leakageModel = new EarthMagneticLeakage();
leakageModel.generateReport();
