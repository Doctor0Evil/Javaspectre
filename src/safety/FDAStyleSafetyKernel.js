// ./src/safety/FDAStyleSafetyKernel.js
// FDA-shaped safety kernel enforcing SAR / charge-density / CEM43-style envelopes
// plus cryptographically chained logs, suitable for BCI/XR smart-city runtimes.

import crypto from "crypto";

export const ImplantClass = Object.freeze({
  ECOG: "ecog",
  DBS: "dbs",
  RETINAL: "retinal",
  RFUS_HELMET: "rfus_helmet",
  EXOSKELETON: "exoskeleton"
});

// Normalized, conservative max values for simulation and runtime gating.
// Actual clinical values must be derived from ICNIRP/IEEE/IEC guidance.
export const BiophysicalLimits = Object.freeze({
  [ImplantClass.ECOG]: {
    sarMax: 1.2,          // W/kg (normalized local SAR envelope)
    chargeDensityMax: 0.9, // mC/cm^2 per phase (normalized)
    cem43Max: 0.6,        // normalized CEM43 dose ceiling
    impedanceMin: 0.3,    // normalized range for impedance checks
    impedanceMax: 2.5
  },
  [ImplantClass.DBS]: {
    sarMax: 0.8,
    chargeDensityMax: 0.7,
    cem43Max: 0.4,
    impedanceMin: 0.4,
    impedanceMax: 3.0
  },
  [ImplantClass.RETINAL]: {
    sarMax: 1.0,
    chargeDensityMax: 0.5,
    cem43Max: 0.5,
    impedanceMin: 0.5,
    impedanceMax: 2.0
  },
  [ImplantClass.RFUS_HELMET]: {
    sarMax: 0.7,
    chargeDensityMax: 0.0, // not applicable; keep 0 and ignore in checks
    cem43Max: 0.3,
    impedanceMin: 0.0,
    impedanceMax: 10.0
  },
  [ImplantClass.EXOSKELETON]: {
    sarMax: 2.5,          // for embedded EM/actuation electronics
    chargeDensityMax: 0.0,
    cem43Max: 1.0,
    impedanceMin: 0.1,
    impedanceMax: 10.0
  }
});

// Fixed-point scaling to avoid floating-point overflow/rounding surprises.
export const FixedPoint = Object.freeze({
  SCALE: 1e6,
  toFixedInt(value) {
    return Math.round(value * this.SCALE);
  },
  toFloat(fixedInt) {
    return fixedInt / this.SCALE;
  }
});

export function sha256Hex(input) {
  const h = crypto.createHash("sha256");
  h.update(typeof input === "string" ? input : JSON.stringify(input));
  return h.digest("hex");
}

/**
 * One safety check result.
 */
export class SafetyCheckResult {
  constructor(ok, status, detail, metrics) {
    this.ok = ok;
    this.status = status;
    this.detail = detail;
    this.metrics = metrics;
  }
}

/**
 * Core safety kernel: evaluates inequalities and logs immutable records.
 */
export class FDAStyleSafetyKernel {
  constructor({ implantLimits = BiophysicalLimits } = {}) {
    this.implantLimits = implantLimits;
    this.log = [];
  }

  /**
   * Evaluate whether a stimulation / actuation request is within biophysical limits.
   * Inputs are already in normalized units (mapped from real-world).
   */
  evaluateRequest({
    implantClass,
    intensity,     // I: normalized intensity (e.g., current, field)
    repetitionRate, // R: Hz
    dutyCycle,     // m: duty factor in [0,1]
    chargePerArea, // Q/A normalized
    cem43Dose,
    impedance
  }) {
    const limits = this.implantLimits[implantClass];
    if (!limits) {
      return new SafetyCheckResult(
        false,
        "UNKNOWN_IMPLANT_CLASS",
        `No limits registered for implant class ${implantClass}.`,
        null
      );
    }

    // f_SAR(I, R, m) <= SAR_max, evaluated in fixed-point
    const fSar = intensity * repetitionRate * dutyCycle;
    const sarFixed = FixedPoint.toFixedInt(fSar);
    const sarMaxFixed = FixedPoint.toFixedInt(limits.sarMax);
    const sarOk = sarFixed <= sarMaxFixed;

    // Q/A <= Q_max (skip if not applicable)
    let qaOk = true;
    let qaFixed = 0;
    let qaMaxFixed = 0;
    if (limits.chargeDensityMax > 0) {
      qaFixed = FixedPoint.toFixedInt(chargePerArea);
      qaMaxFixed = FixedPoint.toFixedInt(limits.chargeDensityMax);
      qaOk = qaFixed <= qaMaxFixed;
    }

    // CEM43 <= CEM43_max
    const cemFixed = FixedPoint.toFixedInt(cem43Dose);
    const cemMaxFixed = FixedPoint.toFixedInt(limits.cem43Max);
    const cemOk = cemFixed <= cemMaxFixed;

    // Impedance in [min, max] if meaningful
    let impOk = true;
    if (limits.impedanceMax > 0 || limits.impedanceMin > 0) {
      const impFixed = FixedPoint.toFixedInt(impedance);
      const impMinFixed = FixedPoint.toFixedInt(limits.impedanceMin);
      const impMaxFixed = FixedPoint.toFixedInt(limits.impedanceMax);
      impOk = impFixed >= impMinFixed && impFixed <= impMaxFixed;
    }

    const allOk = sarOk && qaOk && cemOk && impOk;

    const metrics = {
      implantClass,
      fSar: fSar,
      sarMax: limits.sarMax,
      sarOk,
      chargePerArea,
      chargeDensityMax: limits.chargeDensityMax,
      qaOk,
      cem43Dose,
      cem43Max: limits.cem43Max,
      cemOk,
      impedance,
      impedanceMin: limits.impedanceMin,
      impedanceMax: limits.impedanceMax,
      impOk
    };

    const status = allOk ? "SAFE" : "LIMIT_VIOLATION";
    const detail = allOk
      ? `Request within envelope for ${implantClass}.`
      : `One or more inequalities violated for ${implantClass}.`;

    return new SafetyCheckResult(allOk, status, detail, metrics);
  }

  /**
   * Append a tamper‑evident log entry. Request and result are fully captured.
   */
  logDecision({ request, result, decision }) {
    const prev = this.log.length ? this.log[this.log.length - 1] : null;
    const record = {
      timestamp: new Date().toISOString(),
      request,
      result,
      decision, // "ALLOW" or "REJECT"
      prevHash: prev ? prev.hash : null
    };
    record.hash = sha256Hex(record);
    this.log.push(record);
    return record;
  }

  /**
   * Combined API: evaluate, decide, and log in one call.
   */
  evaluateAndLog(request) {
    const result = this.evaluateRequest(request);
    const decision = result.ok ? "ALLOW" : "REJECT";
    const record = this.logDecision({ request, result, decision });
    return { decision, result, record };
  }

  /**
   * Verify log hash chain integrity (for forensic‑grade replay).
   */
  verifyLogIntegrity() {
    if (!this.log.length) return { ok: true, reason: "NO_RECORDS" };
    for (let i = 0; i < this.log.length; i += 1) {
      const rec = this.log[i];
      const copy = { ...rec };
      const storedHash = copy.hash;
      delete copy.hash;
      const recomputed = sha256Hex(copy);
      if (recomputed !== storedHash) {
        return { ok: false, index: i, reason: "HASH_MISMATCH" };
      }
      if (i === 0 && rec.prevHash !== null) {
        return { ok: false, index: i, reason: "BAD_GENESIS_PREV_HASH" };
      }
      if (i > 0 && rec.prevHash !== this.log[i - 1].hash) {
        return { ok: false, index: i, reason: "BROKEN_CHAIN" };
      }
    }
    return { ok: true };
  }

  /**
   * Export an auditor‑friendly snapshot with a blueprint / spec hash.
   */
  exportForAudit({ blueprintJson }) {
    const specHash = blueprintJson ? sha256Hex(blueprintJson) : null;
    return {
      specHash,
      limits: this.implantLimits,
      log: this.log
    };
  }
}

/**
 * Minimal self‑test / demo sequence that can double as a bench test.
 */
export function demoSafetyKernel() {
  const kernel = new FDAStyleSafetyKernel();

  // Safe retinal‑like stimulation (within normalized limits).
  const safeReq = {
    implantClass: ImplantClass.RETINAL,
    intensity: 0.4,
    repetitionRate: 120,
    dutyCycle: 0.25,
    chargePerArea: 0.3,
    cem43Dose: 0.2,
    impedance: 1.0
  };
  const safeDecision = kernel.evaluateAndLog(safeReq);

  // Unsafe RFUS helmet pulse (exceeds SAR and CEM43 envelope).
  const unsafeReq = {
    implantClass: ImplantClass.RFUS_HELMET,
    intensity: 0.9,
    repetitionRate: 200,
    dutyCycle: 0.7,
    chargePerArea: 0.0,
    cem43Dose: 0.5,
    impedance: 1.5
  };
  const unsafeDecision = kernel.evaluateAndLog(unsafeReq);

  const integrity = kernel.verifyLogIntegrity();

  const audit = kernel.exportForAudit({
    blueprintJson: {
      name: "fda-style-safety-kernel",
      version: "1.0.0",
      standards: [
        "ISO 14971",
        "IEC 62304",
        "ICNIRP/IEEE EMF SAR",
        "CEM43 thermal dose guidance"
      ]
    }
  });

  return { kernel, safeDecision, unsafeDecision, integrity, audit };
}

export default {
  ImplantClass,
  BiophysicalLimits,
  FixedPoint,
  FDAStyleSafetyKernel,
  SafetyCheckResult,
  demoSafetyKernel,
  sha256Hex
};
