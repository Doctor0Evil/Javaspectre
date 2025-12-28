// src/capabilities/ExtraterrestrialHabSimulator.js
// ExtraterrestrialHabSimulator
// A modular, SmartHab-inspired simulator for extraterrestrial habitat resilience.
// Simulates tightly coupled subsystems (air, water, power, thermal, crew load)
// and disruption scenarios, with XR-ready blueprints for training and visualization.

export class ExtraterrestrialHabSimulator {
  constructor(config = {}) {
    this.timestepHours = config.timestepHours || 1;
    this.totalHours = config.totalHours || 72;

    this.subsystems = this.#initSubsystems(config.subsystems || {});
    this.crew = this.#initCrew(config.crew || {});
    this.events = config.events || [];
    this.xrEnabled = !!config.xrEnabled;
  }

  runSimulation() {
    const timeline = [];
    let state = this.#initialState();

    for (let t = 0; t <= this.totalHours; t += this.timestepHours) {
      const activeEvents = this.#eventsAtTime(t);
      state = this.#applyEvents(state, activeEvents);
      state = this.#stepDynamics(state);

      const metrics = this.#computeMetrics(state);
      const xrScene = this.xrEnabled ? this.#xrBlueprint(state, metrics, t) : null;

      timeline.push({
        hour: t,
        state,
        metrics,
        activeEvents,
        xrScene
      });
    }

    const finalMetrics = timeline[timeline.length - 1].metrics;

    return {
      config: {
        timestepHours: this.timestepHours,
        totalHours: this.totalHours
      },
      timeline,
      summary: {
        survivabilityScore: finalMetrics.survivabilityScore,
        resilienceScore: finalMetrics.resilienceScore,
        alertsRaised: finalMetrics.alertsRaised
      }
    };
  }

  // ---------- Initialization ----------

  #initSubsystems(overrides) {
    return {
      air: {
        o2Level: 21.0,
        co2Level: 0.04,
        leakRate: 0.0,
        scrubberEfficiency: 0.98,
        ...overrides.air
      },
      water: {
        storageLiters: 2000,
        recycleEfficiency: 0.85,
        leakRate: 0.0,
        ...overrides.water
      },
      power: {
        capacityKwh: 500,
        storedKwh: 400,
        generationKwhPerHour: 10,
        criticalLoadKwhPerHour: 6,
        nonCriticalLoadKwhPerHour: 4,
        solarDegradation: 0.0,
        ...overrides.power
      },
      thermal: {
        tempC: 22,
        externalTempC: -40,
        insulationFactor: 0.9,
        heaterPowerKwhPerHour: 2,
        coolingPowerKwhPerHour: 1.5,
        ...overrides.thermal
      }
    };
  }

  #initCrew(overrides) {
    return {
      count: overrides.count || 4,
      o2ConsumptionPerHour: overrides.o2ConsumptionPerHour || 0.03,
      co2ProductionPerHour: overrides.co2ProductionPerHour || 0.03,
      waterUsePerDayLiters: overrides.waterUsePerDayLiters || 10,
      metabolicHeatKw: overrides.metabolicHeatKw || 0.4
    };
  }

  #initialState() {
    return {
      time: 0,
      subsystems: JSON.parse(JSON.stringify(this.subsystems)),
      crew: { ...this.crew },
      alerts: []
    };
  }

  // ---------- Event handling ----------

  #eventsAtTime(hour) {
    return this.events.filter(e => e.hour === hour);
  }

  #applyEvents(state, events) {
    const newState = JSON.parse(JSON.stringify(state));
    newState.alerts = [];

    for (const evt of events) {
      switch (evt.type) {
        case "solarStorm":
          newState.subsystems.power.solarDegradation =
            Math.min(0.9, newState.subsystems.power.solarDegradation + (evt.magnitude || 0.5));
          newState.alerts.push(`Solar storm: generation degraded by ${(evt.magnitude || 0.5) * 100}%`);
          break;
        case "micrometeoroidImpact":
          newState.subsystems.air.leakRate += evt.leakDelta || 0.02;
          newState.alerts.push("Micrometeoroid impact: hull leak increased.");
          break;
        case "coolingFailure":
          newState.subsystems.thermal.coolingPowerKwhPerHour = 0;
          newState.alerts.push("Cooling failure: no active cooling available.");
          break;
        case "crewInjury":
          newState.crew.count = Math.max(1, newState.crew.count - 1);
          newState.alerts.push("Crew injury: crew count reduced.");
          break;
        default:
          newState.alerts.push(`Unknown event type: ${evt.type}`);
      }
    }

    return newState;
  }

  // ---------- Dynamics ----------

  #stepDynamics(state) {
    const dt = this.timestepHours;
    const s = JSON.parse(JSON.stringify(state));
    s.time += dt;

    const { air, water, power, thermal } = s.subsystems;
    const crew = s.crew;

    // Air loop
    const totalO2Use = crew.count * crew.o2ConsumptionPerHour * dt;
    const totalCo2Prod = crew.count * crew.co2ProductionPerHour * dt;

    air.o2Level = Math.max(0, air.o2Level - totalO2Use - air.leakRate * dt);
    air.co2Level = Math.max(0, air.co2Level + totalCo2Prod - air.scrubberEfficiency * totalCo2Prod);

    // Water loop
    const waterUse = (crew.waterUsePerDayLiters / 24) * dt * crew.count;
    const recycled = waterUse * water.recycleEfficiency;
    const net = waterUse - recycled + water.leakRate * dt;
    water.storageLiters = Math.max(0, water.storageLiters - net);

    // Power loop
    const solarFactor = 1 - power.solarDegradation;
    const generation = power.generationKwhPerHour * solarFactor * dt;
    const demand = (power.criticalLoadKwhPerHour + power.nonCriticalLoadKwhPerHour) * dt;

    power.storedKwh = Math.max(0, Math.min(power.capacityKwh, power.storedKwh + generation - demand));

    if (power.storedKwh < power.criticalLoadKwhPerHour * dt) {
      power.nonCriticalLoadKwhPerHour = 0;
      s.alerts.push("Non-critical loads shed due to low power.");
    }

    // Thermal loop
    const netHeatKw =
      crew.metabolicHeatKw * crew.count +
      (power.criticalLoadKwhPerHour + power.nonCriticalLoadKwhPerHour) * 0.1;

    const externalInfluence = (thermal.externalTempC - thermal.tempC) *
      (1 - thermal.insulationFactor) * 0.05 * dt;

    const heaterEffect = thermal.heaterPowerKwhPerHour * 0.3 * dt;
    const coolingEffect = thermal.coolingPowerKwhPerHour * 0.4 * dt;

    thermal.tempC += netHeatKw * 0.1 * dt + externalInfluence + heaterEffect - coolingEffect;

    return s;
  }

  // ---------- Metrics & XR ----------

  #computeMetrics(state) {
    const { air, water, power, thermal } = state.subsystems;
    const alerts = [...state.alerts];

    let survivabilityScore = 1.0;

    if (air.o2Level < 18 || air.o2Level > 23.5) survivabilityScore -= 0.3;
    if (air.co2Level > 0.1) survivabilityScore -= 0.2;
    if (water.storageLiters < 500) survivabilityScore -= 0.2;
    if (power.storedKwh < 100) survivabilityScore -= 0.2;
    if (thermal.tempC < 16 || thermal.tempC > 30) survivabilityScore -= 0.1;

    survivabilityScore = Math.max(0, survivabilityScore);

    const resilienceScore = Math.max(
      0,
      1.0 -
        (air.leakRate * 2 +
          power.solarDegradation * 1.5 +
          (500 - water.storageLiters) / 5000)
    );

    const alertsRaised = alerts.length;

    return {
      survivabilityScore,
      resilienceScore,
      alertsRaised,
      air,
      water,
      power,
      thermal
    };
  }

  #xrBlueprint(state, metrics, hour) {
    return {
      sceneId: `hab-hour-${hour}`,
      sceneType: "HabitatStatusPanel",
      overlays: [
        {
          type: "gauge",
          label: "O2 %",
          value: metrics.air.o2Level,
          range: [0, 25]
        },
        {
          type: "gauge",
          label: "CO2 %",
          value: metrics.air.co2Level,
          range: [0, 1]
        },
        {
          type: "gauge",
          label: "Water (L)",
          value: metrics.water.storageLiters,
          range: [0, 3000]
        },
        {
          type: "gauge",
          label: "Power (kWh)",
          value: metrics.power.storedKwh,
          range: [0, metrics.power.capacityKwh || 500]
        },
        {
          type: "gauge",
          label: "Temp (°C)",
          value: metrics.thermal.tempC,
          range: [-20, 40]
        },
        {
          type: "indicator",
          label: "Survivability",
          value: metrics.survivabilityScore
        },
        {
          type: "indicator",
          label: "Resilience",
          value: metrics.resilienceScore
        }
      ],
      annotations: state.alerts.map(a => ({
        type: "alert",
        message: a
      }))
    };
  }
}

export default ExtraterrestrialHabSimulator;

// Example usage:
// import ExtraterrestrialHabSimulator from './ExtraterrestrialHabSimulator.js';
// const sim = new ExtraterrestrialHabSimulator({
//   timestepHours: 1,
//   totalHours: 48,
//   xrEnabled: true,
//   events: [
//     { hour: 5, type: 'solarStorm', magnitude: 0.6 },
//     { hour: 12, type: 'micrometeoroidImpact', leakDelta: 0.03 }
//   ]
// });
// const result = sim.runSimulation();
// console.log(JSON.stringify(result.summary, null, 2));
