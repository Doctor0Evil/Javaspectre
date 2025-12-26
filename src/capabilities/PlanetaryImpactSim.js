// Path: src/capabilities/PlanetaryImpactSim.js
// Predictive modeler for sustainability ROI.

export class PlanetaryImpactSim {
  constructor(options = {}) {
    this.defaultEnergyPerRequestWh =
      typeof options.defaultEnergyPerRequestWh === "number"
        ? options.defaultEnergyPerRequestWh
        : 0.05;
    this.defaultCarbonIntensity =
      typeof options.defaultCarbonIntensity === "number"
        ? options.defaultCarbonIntensity
        : 400;
  }

  /**
   * Simulate impact for a simple web or API architecture.
   *
   * @param {object} params
   * @param {number} params.requestsPerDay
   * @param {number} [params.energyPerRequestWh]
   * @param {number} [params.carbonIntensity]
   * @returns {object}
   */
  simulate(params = {}) {
    const requestsPerDay = params.requestsPerDay || 0;
    const energyPerRequestWh =
      typeof params.energyPerRequestWh === "number"
        ? params.energyPerRequestWh
        : this.defaultEnergyPerRequestWh;
    const carbonIntensity =
      typeof params.carbonIntensity === "number"
        ? params.carbonIntensity
        : this.defaultCarbonIntensity;

    const energyPerDayWh = requestsPerDay * energyPerRequestWh;
    const energyPerYearWh = energyPerDayWh * 365;
    const energyPerYearKWh = energyPerYearWh / 1000;
    const emissionsKgPerYear = (energyPerYearKWh * carbonIntensity) / 1000;

    return {
      inputs: {
        requestsPerDay,
        energyPerRequestWh,
        carbonIntensity
      },
      results: {
        energyPerDayWh,
        energyPerYearWh,
        energyPerYearKWh,
        emissionsKgPerYear
      },
      hints: this.#buildHints({
        requestsPerDay,
        energyPerRequestWh,
        emissionsKgPerYear
      })
    };
  }

  #buildHints({ requestsPerDay, energyPerRequestWh, emissionsKgPerYear }) {
    const hints = [];

    if (requestsPerDay > 100000) {
      hints.push(
        "High request volume detected. Consider aggressive caching, edge delivery, or batch processing."
      );
    }
    if (energyPerRequestWh > 0.2) {
      hints.push(
        "Energy per request is relatively high. Investigate response size, heavy computation, or inefficient queries."
      );
    }
    if (emissionsKgPerYear > 1000) {
      hints.push(
        "Annual emissions exceed one metric ton. Consider greener hosting regions, renewable-backed providers, or architecture simplifications."
      );
    }

    if (hints.length === 0) {
      hints.push(
        "Impact appears moderate. Continue monitoring and revisit assumptions as traffic or architecture changes."
      );
    }

    return hints;
  }
}

export default PlanetaryImpactSim;
