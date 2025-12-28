/**
 * PhotonResonanceMarbleHeatfield.js
 * Destination: /research/optics/PhotonResonanceMarbleHeatfield.js
 *
 * Extends the photon–marble interaction simulator with:
 *  - 2D surface grid + depth layers (pseudo-3D voxel field)
 *  - Per-pulse heat diffusion and cooling
 *  - Projection to a 3D-ish ASCII / matrix representation for XR/digital-twin feeds
 *
 * Designed to approximate safe laser cleaning envelopes on marble surfaces.
 */

class PhotonResonanceMarbleHeatfield {
  constructor(config = {}) {
    this.gridSizeX = config.gridSizeX || 64;
    this.gridSizeY = config.gridSizeY || 64;
    this.layersZ = config.layersZ || 6;          // depth slices
    this.baseTemperature = config.baseTemperature || 295; // Kelvin
    this.maxSafeTemperature = config.maxSafeTemperature || 340;
    this.laserSpotRadius = config.laserSpotRadius || 3;   // grid cells
    this.energyPerPulse = config.energyPerPulse || 0.8;   // J/cm^2 equivalent
    this.thermalDiffusivity = config.thermalDiffusivity || 0.18; // marble ~1e-6 m²/s scaled
    this.coolingFactor = config.coolingFactor || 0.985;
    this.timeStep = config.timeStep || 1e-3;     // seconds per iteration
    this.wavelength = config.wavelength || 1064; // nm
    this.feedbackRate = config.feedbackRate || 0.03;

    this.heatfield = this.createHeatfield();
  }

  createHeatfield() {
    const field = [];
    for (let z = 0; z < this.layersZ; z++) {
      const layer = [];
      for (let y = 0; y < this.gridSizeY; y++) {
        const row = new Float32Array(this.gridSizeX);
        row.fill(this.baseTemperature);
        layer.push(row);
      }
      field.push(layer);
    }
    return field;
  }

  photonEnergy() {
    const h = 6.626e-34;
    const c = 3e8;
    return (h * c) / (this.wavelength * 1e-9);
  }

  depositEnergy(spotX, spotY) {
    const energy = this.energyPerPulse * (1 + this.feedbackRate * 0.5);
    const radiusSq = this.laserSpotRadius * this.laserSpotRadius;
    const kScaling = 0.35; // scaling factor mapping Joules to temperature rise

    for (let y = 0; y < this.gridSizeY; y++) {
      for (let x = 0; x < this.gridSizeX; x++) {
        const dx = x - spotX;
        const dy = y - spotY;
        const distSq = dx * dx + dy * dy;
        if (distSq <= radiusSq) {
          const attenuation = 1 - distSq / (radiusSq + 1e-6);
          for (let z = 0; z < this.layersZ; z++) {
            const depthFactor = Math.exp(-z * 0.8);
            const deltaT = energy * attenuation * depthFactor * kScaling;
            this.heatfield[z][y][x] += deltaT;
          }
        }
      }
    }
  }

  diffuseAndCool() {
    const alpha = this.thermalDiffusivity;
    const newField = this.createHeatfield();

    for (let z = 0; z < this.layersZ; z++) {
      for (let y = 0; y < this.gridSizeY; y++) {
        for (let x = 0; x < this.gridSizeX; x++) {
          const t = this.heatfield[z][y][x];
          let sum = 0;
          let count = 0;

          const neighbors = [
            [x - 1, y, z],
            [x + 1, y, z],
            [x, y - 1, z],
            [x, y + 1, z],
            [x, y, z - 1],
            [x, y, z + 1]
          ];

          for (const [nx, ny, nz] of neighbors) {
            if (
              nx >= 0 && nx < this.gridSizeX &&
              ny >= 0 && ny < this.gridSizeY &&
              nz >= 0 && nz < this.layersZ
            ) {
              sum += this.heatfield[nz][ny][nx];
              count++;
            }
          }

          const avgNeighbor = count > 0 ? sum / count : t;
          const diffused = t + alpha * (avgNeighbor - t);
          const cooled = this.baseTemperature + (diffused - this.baseTemperature) * this.coolingFactor;

          newField[z][y][x] = cooled;
        }
      }
    }

    this.heatfield = newField;
  }

  spectralStep(spotX, spotY) {
    this.depositEnergy(spotX, spotY);
    this.diffuseAndCool();
    this.feedbackRate *= 0.999;
  }

  maxTemperature() {
    let maxT = -Infinity;
    for (let z = 0; z < this.layersZ; z++) {
      for (let y = 0; y < this.gridSizeY; y++) {
        for (let x = 0; x < this.gridSizeX; x++) {
          if (this.heatfield[z][y][x] > maxT) {
            maxT = this.heatfield[z][y][x];
          }
        }
      }
    }
    return maxT;
  }

  projectSurfaceMatrix() {
    const surface = [];
    for (let y = 0; y < this.gridSizeY; y++) {
      const row = [];
      for (let x = 0; x < this.gridSizeX; x++) {
        let tMax = this.baseTemperature;
        for (let z = 0; z < this.layersZ; z++) {
          const t = this.heatfield[z][y][x];
          if (t > tMax) tMax = t;
        }
        row.push(tMax);
      }
      surface.push(row);
    }
    return surface;
  }

  projectAsciiHeightmap() {
    const surface = this.projectSurfaceMatrix();
    let globalMin = Infinity;
    let globalMax = -Infinity;

    for (const row of surface) {
      for (const value of row) {
        if (value < globalMin) globalMin = value;
        if (value > globalMax) globalMax = value;
      }
    }

    const range = Math.max(globalMax - globalMin, 1e-3);
    const chars = " .:-=+*#%@";
    const outputLines = [];

    for (const row of surface) {
      let line = "";
      for (const value of row) {
        const normalized = (value - globalMin) / range;
        const idx = Math.min(
          chars.length - 1,
          Math.max(0, Math.floor(normalized * chars.length))
        );
        line += chars[idx];
      }
      outputLines.push(line);
    }

    return outputLines.join("\n");
  }

  simulateScanPath(steps = 120) {
    const results = [];
    for (let i = 0; i < steps; i++) {
      const t = i / Math.max(steps - 1, 1);
      const x = Math.round(t * (this.gridSizeX - 1));
      const y = Math.round(
        this.gridSizeY / 2 +
        (this.gridSizeY / 3) * Math.sin(2 * Math.PI * t)
      );

      this.spectralStep(x, y);

      const maxT = this.maxTemperature();
      const safe = maxT <= this.maxSafeTemperature;

      results.push({
        step: i,
        spot: { x, y },
        maxTemperature: maxT,
        safe
      });
    }

    return {
      metadata: {
        gridSizeX: this.gridSizeX,
        gridSizeY: this.gridSizeY,
        layersZ: this.layersZ,
        baseTemperature: this.baseTemperature,
        maxSafeTemperature: this.maxSafeTemperature,
        wavelength: this.wavelength,
        energyPerPulse: this.energyPerPulse,
        feedbackRateFinal: this.feedbackRate
      },
      steps: results,
      asciiProjection: this.projectAsciiHeightmap()
    };
  }
}

// Example autonomous run
const heatfieldSimulator = new PhotonResonanceMarbleHeatfield({
  gridSizeX: 64,
  gridSizeY: 32,
  layersZ: 8,
  baseTemperature: 295,
  maxSafeTemperature: 340,
  laserSpotRadius: 3,
  energyPerPulse: 0.8,
  thermalDiffusivity: 0.22,
  coolingFactor: 0.986,
  timeStep: 1e-3,
  wavelength: 1064,
  feedbackRate: 0.03
});

const heatfieldResult = heatfieldSimulator.simulateScanPath(160);

export default {
  metadata: {
    project: "Column of Marcus Aurelius – 3D Heatfield Laser Restoration Model",
    author: "Javaspectre Labs / Dr. Jacob Scott Farmer",
    date: new Date().toLocaleDateString(),
    notes: "Pseudo-3D heat distribution model for safe laser cleaning envelopes on marble surfaces."
  },
  result: heatfieldResult
};
