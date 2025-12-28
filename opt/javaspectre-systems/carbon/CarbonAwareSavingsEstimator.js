// Path: /opt/javaspectre-systems/carbon/CarbonAwareSavingsEstimator.js
// Description:
// A self-contained module to compute baseline vs carbon-aware emissions
// and quantify absolute and percentage carbon savings for computing workloads.

export class CarbonAwareSavingsEstimator {
  /**
   * Compute emissions for a single run.
   * @param {number} energyKWh - Energy consumed by the workload.
   * @param {number} carbonIntensityGramsPerKWh - Grid carbon intensity.
   * @returns {number} emissionsGramsCO2
   */
  static computeEmissions(energyKWh, carbonIntensityGramsPerKWh) {
    if (typeof energyKWh !== "number" || energyKWh < 0) {
      throw new Error("energyKWh must be a non-negative number.");
    }
    if (
      typeof carbonIntensityGramsPerKWh !== "number" ||
      carbonIntensityGramsPerKWh < 0
    ) {
      throw new Error(
        "carbonIntensityGramsPerKWh must be a non-negative number."
      );
    }
    return energyKWh * carbonIntensityGramsPerKWh;
  }

  /**
   * Compare baseline and carbon-aware scenarios.
   * @param {object} baseline - { energyKWh, carbonIntensityGramsPerKWh }
   * @param {object} aware - { energyKWh, carbonIntensityGramsPerKWh }
   * @returns {object} result
   */
  static compareScenarios(baseline, aware) {
    const baselineEmissions = this.computeEmissions(
      baseline.energyKWh,
      baseline.carbonIntensityGramsPerKWh
    );
    const awareEmissions = this.computeEmissions(
      aware.energyKWh,
      aware.carbonIntensityGramsPerKWh
    );

    const savingsGrams = baselineEmissions - awareEmissions;
    const savingsPercent =
      baselineEmissions > 0
        ? (savingsGrams / baselineEmissions) * 100
        : 0;

    return {
      baseline: {
        energyKWh: baseline.energyKWh,
        carbonIntensityGramsPerKWh: baseline.carbonIntensityGramsPerKWh,
        emissionsGramsCO2: baselineEmissions
      },
      carbonAware: {
        energyKWh: aware.energyKWh,
        carbonIntensityGramsPerKWh: aware.carbonIntensityGramsPerKWh,
        emissionsGramsCO2: awareEmissions
      },
      savings: {
        gramsCO2: savingsGrams,
        percent: Number(savingsPercent.toFixed(2))
      }
    };
  }
}

// Example (for documentation):
// const baseline = { energyKWh: 10, carbonIntensityGramsPerKWh: 500 };
// const aware = { energyKWh: 9.5, carbonIntensityGramsPerKWh: 150 };
// const result = CarbonAwareSavingsEstimator.compareScenarios(baseline, aware);
// console.log(JSON.stringify(result, null, 2));
