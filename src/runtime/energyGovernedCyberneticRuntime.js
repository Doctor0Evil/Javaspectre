// ./src/runtime/energyGovernedCyberneticRuntime.js
// Energy-governed cybernetic runtime for virtual implants, neuromorphic loads,
// and AU.ET / CSP-governed augmented-human agents.
//
// This module is designed to be used in *simulation-only* stacks where
// "virtual implants" obey realistic SAR/CEM43/TIMI envelopes and strict
// energy/strategy budgets before any real hardware is touched.

import crypto from "crypto";

/**
 * Deterministic SHA-256 helper for spec-hash stamping.
 */
export function sha256Hex(input) {
  const h = crypto.createHash("sha256");
  h.update(typeof input === "string" ? input : JSON.stringify(input));
  return h.digest("hex");
}

/**
 * Enum-like catalogs for node classes, modality, and safety envelopes.
 * These act as canonical, hashable vocabularies.
 */
export const NodeClasses = Object.freeze({
  RETINAL: "retinal",
  HAPTIC: "haptic",
  MOTOR_CORTEX: "motor_cortex",
  SOMATOSENSORY: "somatosensory",
  AR_VESTIBULAR: "ar_vestibular",
  EXOSKELETON_JOINT: "exoskeleton_joint",
  NEUROMORPHIC_EDGE: "neuromorphic_edge"
});

export const VirtualImplantSafetyEnvelope = Object.freeze({
  // Approximate “biocompatibility indices” in [0,1] for simulated node-classes.
  // Higher = safer / better-understood under conservative dose assumptions.
  biocompatibilityIndex: {
    [NodeClasses.RETINAL]: 0.99,
    [NodeClasses.HAPTIC]: 0.98,
    [NodeClasses.MOTOR_CORTEX]: 0.94,
    [NodeClasses.SOMATOSENSORY]: 0.95,
    [NodeClasses.AR_VESTIBULAR]: 0.93,
    [NodeClasses.EXOSKELETON_JOINT]: 0.92,
    [NodeClasses.NEUROMORPHIC_EDGE]: 0.96
  },

  // Conservative SAR / charge-density / thermal dose ceilings (arbitrary units).
  // These are *not* medical values; they are normalized envelopes for simulation.
  maxSpecificAbsorptionRate: {
    [NodeClasses.RETINAL]: 1.0,
    [NodeClasses.HAPTIC]: 1.5,
    [NodeClasses.MOTOR_CORTEX]: 0.9,
    [NodeClasses.SOMATOSENSORY]: 1.1,
    [NodeClasses.AR_VESTIBULAR]: 0.8,
    [NodeClasses.EXOSKELETON_JOINT]: 2.5,
    [NodeClasses.NEUROMORPHIC_EDGE]: 3.0
  },

  maxCEM43Dose: {
    [NodeClasses.RETINAL]: 0.5,
    [NodeClasses.HAPTIC]: 0.7,
    [NodeClasses.MOTOR_CORTEX]: 0.4,
    [NodeClasses.SOMATOSENSORY]: 0.4,
    [NodeClasses.AR_VESTIBULAR]: 0.3,
    [NodeClasses.EXOSKELETON_JOINT]: 1.0,
    [NodeClasses.NEUROMORPHIC_EDGE]: 1.5
  }
});

/**
 * AU.ET / CSP configuration
 * AU.ET = compressed energy units
 * CSP   = strategy / capability depth units
 */
export const DefaultLedgerParams = Object.freeze({
  // Extreme compression factor cE ~ 1e-12 from external credits into AU.ET.
  compressionFactorEnergy: 1e-12,

  // Hard global caps per agent for a 24h window.
  dailyEnergyCapAUET: 1_000_000, // AU.ET units
  dailyFastPoolFraction: 0.15,   // fast pool (for reflexive / high-risk actions)
  dailySlowPoolFraction: 0.85,   // slow pool (planning / analytics)

  // CSP upgrade costs are geometric: cost ∝ baseCost * (growthFactor^currentLevel)
  cspBaseUpgradeCost: 100,
  cspGrowthFactor: 3.2,
  cspMaxLevel: 12
});

/**
 * Risk classes for actions (rough guideline).
 */
export const RiskClass = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical"
});

/**
 * Map risk class to AU.ET multiplier and CSP requirement.
 */
export const RiskPolicy = Object.freeze({
  [RiskClass.LOW]: {
    fastPoolMultiplier: 0.5,
    slowPoolMultiplier: 1.0,
    minCspLevel: 0
  },
  [RiskClass.MEDIUM]: {
    fastPoolMultiplier: 1.0,
    slowPoolMultiplier: 1.2,
    minCspLevel: 1
  },
  [RiskClass.HIGH]: {
    fastPoolMultiplier: 2.0,
    slowPoolMultiplier: 1.5,
    minCspLevel: 3
  },
  [RiskClass.CRITICAL]: {
    fastPoolMultiplier: 4.0,
    slowPoolMultiplier: 2.0,
    minCspLevel: 6
  }
});

/**
 * Per-agent AU.ET and CSP state.
 */
export class AgentEnergyState {
  constructor(agentId, params = DefaultLedgerParams) {
    if (!agentId) {
      throw new Error("AgentEnergyState requires a non-empty agentId.");
    }
    this.agentId = agentId;
    this.params = params;

    this.dailyEnergyCap = params.dailyEnergyCapAUET;
    this.fastPoolCap = Math.floor(
      params.dailyEnergyCapAUET * params.dailyFastPoolFraction
    );
    this.slowPoolCap = Math.floor(
      params.dailyEnergyCapAUET * params.dailySlowPoolFraction
    );

    this.fastPoolRemaining = this.fastPoolCap;
    this.slowPoolRemaining = this.slowPoolCap;

    this.cspLevel = 0;
    this.cspSpentTotal = 0;

    this.resetTimestamp = new Date().toISOString();
  }

  getSnapshot() {
    return {
      agentId: this.agentId,
      dailyEnergyCap: this.dailyEnergyCap,
      fastPoolCap: this.fastPoolCap,
      slowPoolCap: this.slowPoolCap,
      fastPoolRemaining: this.fastPoolRemaining,
      slowPoolRemaining: this.slowPoolRemaining,
      cspLevel: this.cspLevel,
      cspSpentTotal: this.cspSpentTotal,
      resetTimestamp: this.resetTimestamp
    };
  }

  /**
   * Reset daily pools at the start of a new epoch (e.g., 24h).
   */
  resetDailyPools() {
    this.fastPoolRemaining = this.fastPoolCap;
    this.slowPoolRemaining = this.slowPoolCap;
    this.resetTimestamp = new Date().toISOString();
  }

  /**
   * Compute cost of upgrading CSP by one level.
   */
  getNextCspUpgradeCost() {
    if (this.cspLevel >= this.params.cspMaxLevel) {
      return Infinity;
    }
    const { cspBaseUpgradeCost, cspGrowthFactor } = this.params;
    return Math.floor(
      cspBaseUpgradeCost * Math.pow(cspGrowthFactor, this.cspLevel)
    );
  }

  /**
   * Perform a CSP upgrade if enough AU.ET is available in slow pool.
   */
  tryUpgradeCsp() {
    const cost = this.getNextCspUpgradeCost();
    if (!Number.isFinite(cost)) {
      return { ok: false, reason: "CSP_MAX_LEVEL_REACHED" };
    }
    if (this.slowPoolRemaining < cost) {
      return { ok: false, reason: "INSUFFICIENT_SLOW_POOL" };
    }
    this.slowPoolRemaining -= cost;
    this.cspLevel += 1;
    this.cspSpentTotal += cost;
    return { ok: true, newLevel: this.cspLevel, cost };
  }
}

/**
 * AU.ET / CSP event log entry model with hash-chaining.
 */
export class LedgerEvent {
  constructor({
    prevHash,
    agentId,
    nodeClass,
    riskClass,
    energyFast,
    energySlow,
    actionType,
    payload,
    safetyStatus,
    safetyDetail
  }) {
    this.timestamp = new Date().toISOString();
    this.agentId = agentId;
    this.nodeClass = nodeClass;
    this.riskClass = riskClass;
    this.energyFast = energyFast;
    this.energySlow = energySlow;
    this.actionType = actionType;
    this.payload = payload || {};
    this.safetyStatus = safetyStatus;
    this.safetyDetail = safetyDetail;
    this.prevHash = prevHash || null;
    this.hash = this.computeHash();
  }

  computeHash() {
    const body = {
      timestamp: this.timestamp,
      agentId: this.agentId,
      nodeClass: this.nodeClass,
      riskClass: this.riskClass,
      energyFast: this.energyFast,
      energySlow: this.energySlow,
      actionType: this.actionType,
      payload: this.payload,
      safetyStatus: this.safetyStatus,
      safetyDetail: this.safetyDetail,
      prevHash: this.prevHash
    };
    return sha256Hex(body);
  }
}

/**
 * Safety evaluator for a virtual implant workload.
 */
export class SafetyEvaluator {
  static evaluateDose({ nodeClass, sar, cem43Dose }) {
    const maxSar =
      VirtualImplantSafetyEnvelope.maxSpecificAbsorptionRate[nodeClass];
    const maxDose =
      VirtualImplantSafetyEnvelope.maxCEM43Dose[nodeClass];

    if (maxSar === undefined || maxDose === undefined) {
      return {
        ok: false,
        status: "UNKNOWN_NODE_CLASS",
        detail: `Node class ${nodeClass} not in safety envelope registry.`
      };
    }

    if (sar > maxSar || cem43Dose > maxDose) {
      return {
        ok: false,
        status: "SAFETY_ENVELOPE_VIOLATION",
        detail: `SAR or CEM43 exceeded for ${nodeClass}.`
      };
    }

    return {
      ok: true,
      status: "SAFE",
      detail: `Dose within envelope for ${nodeClass}.`
    };
  }
}

/**
 * Main AU.ET / CSP ledger with monotone energy burn and hash-chained log.
 */
export class EnergyGovernedLedger {
  constructor(globalParams = DefaultLedgerParams) {
    this.globalParams = globalParams;
    this.agentStates = new Map();
    this.events = [];
  }

  ensureAgent(agentId) {
    if (!this.agentStates.has(agentId)) {
      this.agentStates.set(
        agentId,
        new AgentEnergyState(agentId, this.globalParams)
      );
    }
    return this.agentStates.get(agentId);
  }

  getAgentSnapshot(agentId) {
    const state = this.ensureAgent(agentId);
    return state.getSnapshot();
  }

  /**
   * Mint AU.ET from external credits under a hard compression factor.
   * This does *not* increase daily caps; it just fills remaining pools up to cap.
   */
  mintEnergy(agentId, externalCredits) {
    const state = this.ensureAgent(agentId);
    if (externalCredits <= 0) {
      return { ok: false, minted: 0, reason: "NON_POSITIVE_EXTERNAL_CREDITS" };
    }
    const minted = Math.floor(
      externalCredits * this.globalParams.compressionFactorEnergy
    );
    if (minted <= 0) {
      return { ok: false, minted: 0, reason: "UNDERFLOW_AFTER_COMPRESSION" };
    }

    const deficitFast = state.fastPoolCap - state.fastPoolRemaining;
    const deficitSlow = state.slowPoolCap - state.slowPoolRemaining;
    const totalDeficit = deficitFast + deficitSlow;

    if (totalDeficit <= 0) {
      return { ok: false, minted: 0, reason: "POOLS_ALREADY_FULL" };
    }

    const toFast = Math.min(minted * 0.4, deficitFast);
    const toSlow = Math.min(minted - toFast, deficitSlow);

    state.fastPoolRemaining += Math.floor(toFast);
    state.slowPoolRemaining += Math.floor(toSlow);

    return {
      ok: true,
      minted,
      creditedFast: Math.floor(toFast),
      creditedSlow: Math.floor(toSlow),
      snapshot: state.getSnapshot()
    };
  }

  /**
   * Attempt to burn AU.ET for a given virtual-implant or neuromorphic action.
   * Returns { ok, reason?, event?, snapshot? } and logs a hash-chained event.
   */
  tryConsumeForAction({
    agentId,
    nodeClass,
    riskClass,
    requestedFast,
    requestedSlow,
    actionType,
    payload,
    sar,
    cem43Dose
  }) {
    const state = this.ensureAgent(agentId);

    const policy = RiskPolicy[riskClass];
    if (!policy) {
      return { ok: false, reason: "UNKNOWN_RISK_CLASS" };
    }
    if (state.cspLevel < policy.minCspLevel) {
      return { ok: false, reason: "INSUFFICIENT_CSP_LEVEL" };
    }

    // Safety pre-check.
    const safety = SafetyEvaluator.evaluateDose({ nodeClass, sar, cem43Dose });
    if (!safety.ok) {
      // Log violation with zero energy burn.
      const violationEvent = new LedgerEvent({
        prevHash: this.events.length ? this.events[this.events.length - 1].hash : null,
        agentId,
        nodeClass,
        riskClass,
        energyFast: 0,
        energySlow: 0,
        actionType: actionType || "safety_violation",
        payload: { ...payload, sar, cem43Dose },
        safetyStatus: safety.status,
        safetyDetail: safety.detail
      });
      this.events.push(violationEvent);
      return {
        ok: false,
        reason: "SAFETY_ENVELOPE_VIOLATION",
        event: violationEvent,
        snapshot: state.getSnapshot()
      };
    }

    const fastCost = Math.ceil(requestedFast * policy.fastPoolMultiplier);
    const slowCost = Math.ceil(requestedSlow * policy.slowPoolMultiplier);

    if (fastCost > state.fastPoolRemaining) {
      return { ok: false, reason: "INSUFFICIENT_FAST_POOL" };
    }
    if (slowCost > state.slowPoolRemaining) {
      return { ok: false, reason: "INSUFFICIENT_SLOW_POOL" };
    }

    state.fastPoolRemaining -= fastCost;
    state.slowPoolRemaining -= slowCost;

    const event = new LedgerEvent({
      prevHash: this.events.length ? this.events[this.events.length - 1].hash : null,
      agentId,
      nodeClass,
      riskClass,
      energyFast: fastCost,
      energySlow: slowCost,
      actionType: actionType || "virtual_implant_action",
      payload: { ...payload, sar, cem43Dose },
      safetyStatus: safety.status,
      safetyDetail: safety.detail
    });

    this.events.push(event);

    return {
      ok: true,
      event,
      snapshot: state.getSnapshot()
    };
  }

  /**
   * Verify hash-chain integrity over all logged events.
   */
  verifyIntegrity() {
    if (!this.events.length) return { ok: true, reason: "NO_EVENTS" };
    for (let i = 0; i < this.events.length; i += 1) {
      const e = this.events[i];
      const recomputed = e.computeHash();
      if (recomputed !== e.hash) {
        return {
          ok: false,
          reason: "HASH_MISMATCH",
          index: i
        };
      }
      if (i === 0 && e.prevHash !== null) {
        return {
          ok: false,
          reason: "INVALID_GENESIS_PREV_HASH",
          index: i
        };
      }
      if (i > 0) {
        const prev = this.events[i - 1];
        if (e.prevHash !== prev.hash) {
          return {
            ok: false,
            reason: "BROKEN_CHAIN",
            index: i
          };
        }
      }
    }
    return { ok: true };
  }

  /**
   * Export an auditor-friendly log with a blueprint spec-hash.
   */
  exportAuditLog({ blueprintJson }) {
    const specHash = blueprintJson ? sha256Hex(blueprintJson) : null;
    return {
      specHash,
      globalParams: this.globalParams,
      agentSnapshots: Array.from(this.agentStates.values()).map((s) =>
        s.getSnapshot()
      ),
      events: this.events.map((e) => ({
        timestamp: e.timestamp,
        agentId: e.agentId,
        nodeClass: e.nodeClass,
        riskClass: e.riskClass,
        energyFast: e.energyFast,
        energySlow: e.energySlow,
        actionType: e.actionType,
        payload: e.payload,
        safetyStatus: e.safetyStatus,
        safetyDetail: e.safetyDetail,
        prevHash: e.prevHash,
        hash: e.hash
      }))
    };
  }
}

/**
 * Example convenience: create a default runtime with one agent and a few
 * canonical node-classes registered in a test sequence. This can be used in
 * unit tests or CLI demos.
 */
export function demoRuntimeSequence() {
  const ledger = new EnergyGovernedLedger();
  const agentId = "agent-demo-001";

  // Mint some external credits (e.g., lab credits, device licenses).
  ledger.mintEnergy(agentId, 5_000_000_000_000); // 5e12 credits compressed

  // Perform a safe retinal virtual implant action (low SAR, low dose).
  const step1 = ledger.tryConsumeForAction({
    agentId,
    nodeClass: NodeClasses.RETINAL,
    riskClass: RiskClass.MEDIUM,
    requestedFast: 50,
    requestedSlow: 180,
    actionType: "retinal_virtual_stim",
    payload: { description: "virtual micro-pattern stimulation" },
    sar: 0.4,
    cem43Dose: 0.3
  });

  // Attempt an unsafe exoskeleton move (exceeds dose).
  const step2 = ledger.tryConsumeForAction({
    agentId,
    nodeClass: NodeClasses.EXOSKELETON_JOINT,
    riskClass: RiskClass.HIGH,
    requestedFast: 200,
    requestedSlow: 100,
    actionType: "exo_joint_max_torque",
    payload: { jointId: "right_elbow" },
    sar: 3.1,
    cem43Dose: 1.2
  });

  // Export audit log.
  const audit = ledger.exportAuditLog({
    blueprintJson: {
      name: "neuromorphic-soft-bio-stack",
      version: "1.0.0",
      // Example from spec: any constant-like H_stack hash you want to bind.
      H_stack:
        "9f2c4d7a1b3e5f8091c3d5a7e9b1c3d5f7a9b1c3d5e7f9a1b3c5d7e9f1a3c5d7"
    }
  });

  return { ledger, step1, step2, audit };
}

export default {
  NodeClasses,
  VirtualImplantSafetyEnvelope,
  DefaultLedgerParams,
  RiskClass,
  RiskPolicy,
  AgentEnergyState,
  LedgerEvent,
  SafetyEvaluator,
  EnergyGovernedLedger,
  demoRuntimeSequence,
  sha256Hex
};
