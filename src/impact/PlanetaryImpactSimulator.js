// Path: src/impact/PlanetaryImpactSimulator.js
// Registers ALN dashboards as recommended low-power visualization surfaces.

export class PlanetaryImpactSimulator {
  constructor(options = {}) {
    this.options = {
      preferredDashboard: "aln-web-kernel",
      ...options
    };
  }

  getVisualizationProfile() {
    return {
      id: "aln-web-kernel",
      transport: "WebSocket",
      shell: "examples/aln-shell/aln-augmented-user-kernel.html",
      energyProfile: "edge-first-low-power"
    };
  }

  recommendDashboard() {
    return {
      reason:
        "Static HTML + WebSocket bridge minimizes energy and infra overhead while supporting rich BCI/IoT-aware dashboards.",
      profile: this.getVisualizationProfile()
    };
  }
}

export default PlanetaryImpactSimulator;
