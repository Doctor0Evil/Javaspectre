// Path: src/core/NeuroSpectralHardware.js
// NeuroSpectralHardware: a virtual hardware plane for high-tech gaming,
// introspective mechanics, and ALN-grade virtual-object definition.

export class NeuroSpectralHardware {
  constructor(options = {}) {
    this.version = '1.0.0';

    this.defaults = {
      maxPlayers: typeof options.maxPlayers === 'number' ? options.maxPlayers : 64,
      maxWorlds: typeof options.maxWorlds === 'number' ? options.maxWorlds : 16,
      maxDevicesPerPlayer:
        typeof options.maxDevicesPerPlayer === 'number'
          ? options.maxDevicesPerPlayer
          : 8,
      tickRateHz: typeof options.tickRateHz === 'number' ? options.tickRateHz : 120,
      baseLatencyMs:
        typeof options.baseLatencyMs === 'number' ? options.baseLatencyMs : 18,
    };

    this.virtualHardwareLattice = this._buildInitialLattice();
  }

  /**
   * Build a fully-populated virtual hardware lattice.
   * This acts like a synthetic “hardware bus” for next-gen engines.
   */
  _buildInitialLattice() {
    const baseLatency = this.defaults.baseLatencyMs;

    return {
      id: 'neuro-spectral-lattice',
      createdAt: new Date().toISOString(),
      tickRateHz: this.defaults.tickRateHz,
      capacity: {
        maxPlayers: this.defaults.maxPlayers,
        maxWorlds: this.defaults.maxWorlds,
        maxDevicesPerPlayer: this.defaults.maxDevicesPerPlayer,
        maxConcurrentStreams: 4096,
        maxVirtualSensors: 8192,
      },
      latencyFields: {
        baseLatencyMs: baseLatency,
        jitterBudgetMs: 6,
        predictionHorizonMs: 120,
        neuroSyncWindowMs: 24,
        phantomChannelBudgetMs: 4,
      },
      sensoryChannels: this._buildSensoryChannels(),
      cognitiveSurfaces: this._buildCognitiveSurfaces(),
      phantomAffordances: this._buildPhantomAffordances(),
      energyProfile: this._buildEnergyProfile(),
      datasets: this._buildInitialDatasets(),
    };
  }

  _buildSensoryChannels() {
    return [
      {
        id: 'vision-primary',
        type: 'visual',
        resolution: [2560, 1440],
        fieldOfViewDeg: 110,
        maxRefreshHz: 240,
        latencySensitivity: 1.0,
        jitterTolerance: 0.25,
        bandwidthScore: 0.82,
      },
      {
        id: 'audio-spatial',
        type: 'audio',
        channels: 8,
        maxSampleRateHz: 96000,
        headTrackingOffsetMs: 3,
        positionalAccuracyScore: 0.91,
        occlusionModelScore: 0.76,
      },
      {
        id: 'haptics-surface',
        type: 'haptic',
        actuators: 32,
        maxUpdateHz: 480,
        envelopePreset: 'neuro-surface-v1',
        phantomOverlaySupport: true,
        intensityFloor: 0.05,
        intensityCeiling: 0.94,
      },
      {
        id: ' proprioception-field',
        type: 'proprioceptive',
        inferredFromMotion: true,
        deviceSources: ['imu', 'controller-imu', 'headset-imu'],
        coherenceScore: 0.73,
        driftCompensationScore: 0.69,
      },
    ];
  }

  _buildCognitiveSurfaces() {
    return [
      {
        id: 'flow-lane-default',
        dimension: 'player-flow',
        range: [0, 1],
        descriptors: ['bored', 'engaged', 'overwhelmed'],
        neutralPoint: 0.5,
        defaultValue: 0.47,
        updateHz: 10,
      },
      {
        id: 'intent-confidence',
        dimension: 'input-intent-confidence',
        range: [0, 1],
        descriptors: ['noise', 'ambiguous', 'clear'],
        neutralPoint: 0.4,
        defaultValue: 0.61,
        updateHz: 120,
      },
      {
        id: 'immersion-field',
        dimension: 'presence-immersion',
        range: [0, 1],
        descriptors: ['detached', 'present', 'submerged'],
        neutralPoint: 0.55,
        defaultValue: 0.63,
        updateHz: 30,
      },
    ];
  }

  _buildPhantomAffordances() {
    return [
      {
        id: 'phantom-latency-buffer',
        category: 'network',
        description:
          'Virtual latency budget used to pre-render plausible futures and hide spikes.',
        maxReserveMs: 14,
        defaultReserveMs: 6,
        strategy: 'predictive-interpolation',
        fields: ['predictedPosition', 'predictedAction', 'confidence'],
      },
      {
        id: 'ghost-input-channel',
        category: 'input',
        description:
          'Inferred player control channel built from micro-movements, gaze, and rhythm.',
        sampleWindowMs: 220,
        updateHz: 60,
        fields: [
          'microAimJitter',
          'preFireRhythm',
          'gazeLagMs',
          'anticipatoryCurve',
        ],
      },
      {
        id: 'echo-resonance-layer',
        category: 'world-feedback',
        description:
          'Non-physical feedback layer that encodes narrative, risk, and reward density.',
        gridResolution: [32, 32, 16],
        fields: ['riskDensity', 'rewardDensity', 'narrativePressure', 'socialEcho'],
      },
    ];
  }

  _buildEnergyProfile() {
    return {
      unit: 'arbitrary-compute-quanta',
      baselineIdlePerTick: 1.0,
      baselineActivePerTick: 4.5,
      phantomProcessingPerTick: 1.8,
      energySavingsFromPredictionRatio: 0.27,
      dataset: {
        samplingHz: 1,
        lastSamples: [
          { tick: 0, idle: 1.0, active: 0.0, phantom: 0.0 },
          { tick: 60, idle: 0.9, active: 3.1, phantom: 1.4 },
          { tick: 120, idle: 0.8, active: 3.6, phantom: 1.9 },
        ],
      },
    };
  }

  _buildInitialDatasets() {
    const seedTicks = Array.from({ length: 16 }, (_, i) => i);
    const phantomLatencySeries = seedTicks.map((tick) => ({
      tick,
      observedMs: 14 + Math.sin(tick * 0.37) * 3,
      compensatedMs: 9 + Math.cos(tick * 0.21) * 2,
      phantomReserveMs: 5 + Math.sin(tick * 0.19) * 1.5,
    }));

    const intentConfidenceSeries = seedTicks.map((tick) => ({
      tick,
      primaryControlChannel: 'mixed',
      intentConfidence: Math.min(
        0.96,
        Math.max(0.12, 0.6 + Math.sin(tick * 0.29) * 0.25),
      ),
      microAimJitter: 0.3 + Math.abs(Math.sin(tick * 0.17)) * 0.4,
      anticipatoryScore: 0.4 + Math.abs(Math.cos(tick * 0.11)) * 0.5,
    }));

    const immersionSeries = seedTicks.map((tick) => ({
      tick,
      presence: 0.5 + Math.sin(tick * 0.09) * 0.2,
      motionCoherence: 0.6 + Math.cos(tick * 0.15) * 0.25,
      narrativePressure: 0.4 + Math.sin(tick * 0.23) * 0.35,
    }));

    return {
      phantomLatencySeries,
      intentConfidenceSeries,
      immersionSeries,
    };
  }

  /**
   * ALN-like reasoning pass: given raw telemetry, infer missing variables and
   * emit structured virtual-objects that engines can use directly.
   */
  inferVirtualObjects(rawTelemetry) {
    const safe = this._normalizeTelemetry(rawTelemetry);

    const virtualObjects = [];

    virtualObjects.push(
      this._buildPlayerIntentManifold(safe),
      this._buildLatencyFieldDescriptor(safe),
      this._buildSensoryEnvelopeDescriptor(safe),
      this._buildCognitiveLoadDescriptor(safe),
    );

    return {
      lattice: this.virtualHardwareLattice,
      virtualObjects,
      summary: this._buildInferenceSummary(virtualObjects),
    };
  }

  _normalizeTelemetry(raw) {
    const base = raw || {};

    return {
      players:
        Array.isArray(base.players) && base.players.length > 0
          ? base.players
          : this._buildSyntheticPlayers(),
      deviceMetrics:
        Array.isArray(base.deviceMetrics) && base.deviceMetrics.length > 0
          ? base.deviceMetrics
          : this._buildSyntheticDeviceMetrics(),
      networkSamples:
        Array.isArray(base.networkSamples) && base.networkSamples.length > 0
          ? base.networkSamples
          : this._buildSyntheticNetworkSamples(),
      motionVectors:
        Array.isArray(base.motionVectors) && base.motionVectors.length > 0
          ? base.motionVectors
          : this._buildSyntheticMotionVectors(),
    };
  }

  _buildSyntheticPlayers() {
    return [
      {
        id: 'player-1',
        inputsPerSecond: 72,
        averageSessionMinutes: 47,
        headMovementVariance: 0.41,
        microCorrectFrequencyHz: 2.8,
        deviceCount: 3,
      },
      {
        id: 'player-2',
        inputsPerSecond: 55,
        averageSessionMinutes: 32,
        headMovementVariance: 0.27,
        microCorrectFrequencyHz: 1.9,
        deviceCount: 2,
      },
    ];
  }

  _buildSyntheticDeviceMetrics() {
    return [
      {
        deviceId: 'headset-primary',
        thermalHeadroomPct: 0.68,
        batteryHealthPct: 0.92,
        cpuLoadPct: 0.51,
        gpuLoadPct: 0.63,
        memoryPressurePct: 0.59,
      },
      {
        deviceId: 'controller-right',
        thermalHeadroomPct: 0.81,
        batteryHealthPct: 0.76,
        cpuLoadPct: 0.17,
        gpuLoadPct: 0.0,
        memoryPressurePct: 0.14,
      },
    ];
  }

  _buildSyntheticNetworkSamples() {
    const ticks = Array.from({ length: 24 }, (_, i) => i);
    return ticks.map((t) => ({
      tick: t,
      rttMs: 26 + Math.sin(t * 0.25) * 9,
      jitterMs: 2 + Math.abs(Math.cos(t * 0.3) * 3),
      packetLossPct: Math.max(0, 0.02 + Math.sin(t * 0.11) * 0.015),
    }));
  }

  _buildSyntheticMotionVectors() {
    const ticks = Array.from({ length: 24 }, (_, i) => i);
    return ticks.map((t) => ({
      tick: t,
      linearVelocity: [
        Math.sin(t * 0.15) * 1.3,
        Math.cos(t * 0.1) * 0.4,
        Math.sin(t * 0.07) * 0.6,
      ],
      angularVelocity: [
        Math.cos(t * 0.13) * 0.8,
        Math.sin(t * 0.09) * 0.5,
        Math.cos(t * 0.05) * 0.3,
      ],
      microCorrectionsPerSecond: 1.2 + Math.abs(Math.sin(t * 0.19) * 2.1),
    }));
  }

  _buildPlayerIntentManifold(safe) {
    const playerCount = safe.players.length;
    const avgInputs =
      safe.players.reduce((sum, p) => sum + p.inputsPerSecond, 0) /
      Math.max(1, playerCount);

    const avgSessionMinutes =
      safe.players.reduce((sum, p) => sum + p.averageSessionMinutes, 0) /
      Math.max(1, playerCount);

    const aimRhythmScore = Math.min(1, avgInputs / 90);
    const focusScore = Math.min(1, avgSessionMinutes / 60);

    const manifold = {
      id: 'player-intent-manifold',
      category: 'neuro-intent',
      fields: {
        aimRhythmScore,
        focusScore,
        inferredIntentConfidence: Math.min(
          1,
          0.35 + aimRhythmScore * 0.4 + focusScore * 0.25,
        ),
        multiDeviceSynergy: Math.min(
          1,
          safe.players.reduce((sum, p) => sum + p.deviceCount, 0) /
            (playerCount * this.defaults.maxDevicesPerPlayer),
        ),
      },
      inputs: {
        playerCount,
        avgInputsPerSecond: avgInputs,
        avgSessionMinutes,
      },
    };

    return manifold;
  }

  _buildLatencyFieldDescriptor(safe) {
    const base = this.virtualHardwareLattice.latencyFields.baseLatencyMs;
    const samples = safe.networkSamples;
    const count = samples.length;

    const avgRtt =
      samples.reduce((sum, s) => sum + s.rttMs, 0) / Math.max(1, count);
    const avgJitter =
      samples.reduce((sum, s) => sum + s.jitterMs, 0) / Math.max(1, count);
    const avgLoss =
      samples.reduce((sum, s) => sum + s.packetLossPct, 0) / Math.max(1, count);

    const predictiveBudget =
      this.virtualHardwareLattice.latencyFields.phantomChannelBudgetMs;

    const phantomLatencyField = {
      id: 'phantom-latency-field',
      category: 'network-latency',
      fields: {
        baseLatencyMs: base,
        observedLatencyMs: avgRtt,
        jitterMs: avgJitter,
        packetLossPct: avgLoss,
        recommendedPredictionWindowMs: Math.min(
          200,
          avgRtt + avgJitter + predictiveBudget,
        ),
        phantomCompensationScore: this._clamp01(
          0.3 +
            (predictiveBudget / 20) * 0.3 +
            (avgLoss < 0.03 ? 0.25 : 0.1),
        ),
      },
      inputs: {
        sampleCount: count,
      },
    };

    return phantomLatencyField;
  }

  _buildSensoryEnvelopeDescriptor(safe) {
    const devices = safe.deviceMetrics;
    const count = devices.length;

    const avgThermal =
      devices.reduce((sum, d) => sum + d.thermalHeadroomPct, 0) /
      Math.max(1, count);
    const avgCpu =
      devices.reduce((sum, d) => sum + d.cpuLoadPct, 0) /
      Math.max(1, count);
    const avgGpu =
      devices.reduce((sum, d) => sum + d.gpuLoadPct, 0) /
      Math.max(1, count);

    const visualChannel = this.virtualHardwareLattice.sensoryChannels.find(
      (c) => c.type === 'visual',
    );

    const effectiveRefresh =
      visualChannel && visualChannel.maxRefreshHz
        ? visualChannel.maxRefreshHz * this._clamp01(1 - avgGpu * 0.6)
        : 120;

    return {
      id: 'sensory-envelope',
      category: 'sensory-capacity',
      fields: {
        thermalHeadroomPct: avgThermal,
        cpuLoadPct: avgCpu,
        gpuLoadPct: avgGpu,
        effectiveVisualRefreshHz: effectiveRefresh,
        phantomHapticsHeadroomPct: this._clamp01(0.4 + avgThermal * 0.5),
      },
      inputs: {
        deviceCount: count,
      },
    };
  }

  _buildCognitiveLoadDescriptor(safe) {
    const motions = safe.motionVectors;
    const count = motions.length;

    const avgMicroCorrections =
      motions.reduce((sum, m) => sum + m.microCorrectionsPerSecond, 0) /
      Math.max(1, count);

    const baseFlow = this.virtualHardwareLattice.cognitiveSurfaces.find(
      (s) => s.dimension === 'player-flow',
    );

    const inferredLoad = this._clamp01(
      0.3 + Math.min(0.7, avgMicroCorrections / 6),
    );

    const flowPosition = this._clamp01(
      (baseFlow && baseFlow.defaultValue
        ? baseFlow.defaultValue
        : 0.5) +
        (inferredLoad - 0.5) * 0.3,
    );

    return {
      id: 'cognitive-load-field',
      category: 'cognitive-state',
      fields: {
        inferredCognitiveLoad: inferredLoad,
        suggestedDifficultyScale: this._clamp01(
          0.4 + (1 - inferredLoad) * 0.5,
        ),
        flowLanePosition: flowPosition,
      },
      inputs: {
        microCorrectionsPerSecond: avgMicroCorrections,
        motionSampleCount: count,
      },
    };
  }

  _buildInferenceSummary(virtualObjects) {
    const byCategory = new Map();
    for (const v of virtualObjects) {
      const cat = v.category || 'unknown';
      byCategory.set(cat, (byCategory.get(cat) || 0) + 1);
    }

    return {
      totalVirtualObjects: virtualObjects.length,
      byCategory: Array.from(byCategory.entries()).map(([category, count]) => ({
        category,
        count,
      })),
      hint:
        'Attach these virtual-objects to your engine loop as synthetic hardware layers for intent, latency, sensory capacity, and cognitive state.',
    };
  }

  _clamp01(x) {
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
  }
}

export default NeuroSpectralHardware;
