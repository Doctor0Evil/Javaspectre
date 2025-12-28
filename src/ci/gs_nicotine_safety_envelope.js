// src/ci/gs_nicotine_safety_envelope.js
// Googolswarm.os Nicotine Safety Envelope Compiler
// Compiles evidence-based constraints into a machine-enforceable safety envelope
// for nicotine dosing and nanoswarm control logic.
//
// This module is engine-agnostic and can be invoked from ALN skills, Unreal
// controllers, or nanoswarm schedulers.

// High-level evidence anchors encoded as defaults:
//
// - Long-term NRT (patch) up to 24 weeks improves cessation and is safe;
//   extension to 52 weeks is safe but adds little efficacy.[71]
// - Programmable CNT patches can deliver therapeutic-range nicotine fluxes
//   with high/low switchable rates.[76]
// - Nanovaccine SEL-068 strongly attenuates nicotine’s subjective effects
//   for >30 weeks without major safety signals in primates.[88]

'use strict';

/**
 * Compile a nicotine safety envelope from guideline-level evidence and
 * patient-specific context.
 *
 * @param {Object} opts
 * @param {string} opts.patientId
 * @param {number} [opts.weightKg] - Optional, for dose-per-kg checks.
 * @param {('adult'|'youth')} [opts.ageBand] - Age band; youth => stricter limits.
 * @param {boolean} [opts.pregnant]
 * @param {boolean} [opts.cardiovascularRisk]
 * @param {boolean} [opts.severePsychRisk]
 * @param {('cessation'|'harm_reduction')} [opts.therapeuticGoal]
 * @param {number} [opts.maxDailyMgOverride] - Optional manual ceiling.
 * @param {number} [opts.maxWeeksHighDoseOverride]
 * @param {number} [opts.maxWeeksAnyDoseOverride]
 * @returns {Object} safetyEnvelope
 */
function compileNicotineSafetyEnvelope(opts) {
  if (!opts || typeof opts !== 'object') {
    throw new Error('compileNicotineSafetyEnvelope requires an options object.');
  }

  const {
    patientId,
    weightKg,
    ageBand = 'adult',
    pregnant = false,
    cardiovascularRisk = false,
    severePsychRisk = false,
    therapeuticGoal = 'cessation',
    maxDailyMgOverride,
    maxWeeksHighDoseOverride,
    maxWeeksAnyDoseOverride
  } = opts;

  if (!patientId || typeof patientId !== 'string') {
    throw new Error('compileNicotineSafetyEnvelope requires a patientId string.');
  }

  // Base numeric anchors (per-day oral/transdermal-equivalent, rough clinical norms)
  // These numbers are intentionally conservative and should be adjusted as
  // Googolswarm.os ingests more granular PK/PD priors.
  const base = {
    maxDailyMgStandard: 42,          // ~equivalent of a strong patch + PRN
    maxDailyMgYouth: 21,             // youth => at most half of adult ceiling
    maxDailyMgCVRisk: 21,            // cardiovascular risk => lower ceiling
    maxDailyMgPregnancy: 21,         // pregnancy => only if explicitly approved
    maxDailyMgSeverePsych: 35,       // slightly reduced vs standard

    maxWeeksHighDoseDefault: 12,     // typical 8–12 weeks intensive cessation
    maxWeeksHighDoseExtended: 24,    // extended therapy with evidence of benefit[71]
    maxWeeksAnyDoseMaintenance: 52   // safe but low-additional-benefit region[71],

    maxBolusMgFastChannel: 2,        // single bolus via fast inhaled route
    maxBolusPerHour: 2,              // number of fast boluses per hour
    maxPlasmaNgMlAcute: 50           // soft bound for projected peak levels (example)
  };

  // Determine daily ceiling
  let maxDailyMg = base.maxDailyMgStandard;
  const rationales = [];

  if (ageBand === 'youth') {
    maxDailyMg = Math.min(maxDailyMg, base.maxDailyMgYouth);
    rationales.push('Youth band: daily ceiling tightened to youth-appropriate limit.');
  }

  if (cardiovascularRisk) {
    maxDailyMg = Math.min(maxDailyMg, base.maxDailyMgCVRisk);
    rationales.push('Cardiovascular risk: daily ceiling reduced.');
  }

  if (pregnant) {
    maxDailyMg = Math.min(maxDailyMg, base.maxDailyMgPregnancy);
    rationales.push('Pregnancy: daily ceiling restricted; NRT should be explicitly authorized.');
  }

  if (severePsychRisk) {
    maxDailyMg = Math.min(maxDailyMg, base.maxDailyMgSeverePsych);
    rationales.push('Severe psychiatric risk: daily ceiling slightly reduced.');
  }

  if (typeof maxDailyMgOverride === 'number' && maxDailyMgOverride > 0) {
    maxDailyMg = Math.min(maxDailyMg, maxDailyMgOverride);
    rationales.push('Manual ceiling override applied by clinician.');
  }

  // Long-horizon limits
  let maxWeeksHighDose;
  let maxWeeksAnyDose;

  if (therapeuticGoal === 'cessation') {
    // Intensive cessation: 8–12 weeks; can extend to 24 weeks with benefit.[71]
    maxWeeksHighDose = base.maxWeeksHighDoseExtended;
    maxWeeksAnyDose = base.maxWeeksAnyDoseMaintenance;
    rationales.push('Cessation goal: high-dose phase up to ~24 weeks, maintenance dose up to ~52 weeks.');
  } else {
    // Harm reduction: more emphasis on stable, moderate dosing for relapse prevention.
    maxWeeksHighDose = base.maxWeeksHighDoseDefault;
    maxWeeksAnyDose = base.maxWeeksAnyDoseMaintenance;
    rationales.push('Harm-reduction goal: high-dose phase shorter, but maintenance allowed when risk of combustible relapse is high.');
  }

  if (typeof maxWeeksHighDoseOverride === 'number' && maxWeeksHighDoseOverride > 0) {
    maxWeeksHighDose = Math.min(maxWeeksHighDose, maxWeeksHighDoseOverride);
    rationales.push('Manual maxWeeksHighDose override applied by clinician.');
  }

  if (typeof maxWeeksAnyDoseOverride === 'number' && maxWeeksAnyDoseOverride > 0) {
    maxWeeksAnyDose = Math.min(maxWeeksAnyDose, maxWeeksAnyDoseOverride);
    rationales.push('Manual maxWeeksAnyDose override applied by clinician.');
  }

  // Fast-channel limits (e.g., CNT pulse, micro-inhaler)
  const fastChannel = {
    maxBolusMg: base.maxBolusMgFastChannel,
    maxBolusesPerHour: base.maxBolusPerHour,
    maxBolusesPerDay: base.maxBolusPerHour * 6, // limit fast pulses to a subset of day
    rationale: 'Fast channels are limited to prevent reinforcement of spike-seeking behavior.'
  };

  // Construct envelope
  const envelope = {
    patientId,
    createdAt: new Date().toISOString(),
    constraints: {
      populationEvidenceVersion: 'nicotine-nrt-v1',
      dailyDose: {
        maxMg: maxDailyMg,
        weightAdjustedMaxMgPerKg: weightKg ? maxDailyMg / weightKg : null
      },
      horizonWeeks: {
        maxHighDose: maxWeeksHighDose,
        maxAnyDose: maxWeeksAnyDose
      },
      fastChannel,
      pkpdLimits: {
        maxProjectedPlasmaNgPerMl: base.maxPlasmaNgMlAcute,
        enforceChronicExposureBounds: true
      },
      eligibility: {
        allowedAgeBand: ageBand === 'adult',
        youth: ageBand === 'youth',
        contraindications: {
          pregnancy: pregnant,
          cardiovascularRisk,
          severePsychRisk
        }
      },
      therapeuticGoal
    },
    enforcement: {
      // ALN-compatible rule summaries; actual policy code lives elsewhere.
      rules: [
        'Block any action that would exceed maxMg daily when integrated over channels.',
        'Reject schedules that would extend high-dose treatment beyond maxHighDose weeks.',
        'Require explicit clinician approval to continue any-dose treatment beyond maxAnyDose weeks.',
        'Disallow fast-channel pulses that exceed fastChannel limits (per bolus/hour/day).',
        'For youth or pregnancy, require clinician-in-the-loop mode for all schedule changes.',
        'For cardiovascular or severe psychiatric risk, bias RL policies toward slower and lower dosing.',
        'Never increase total daily dose above prior 7-day rolling maximum once taper has started.'
      ]
    },
    rationales
  };

  return envelope;
}

/**
 * Check a proposed daily schedule against the envelope.
 *
 * @param {Object} envelope - Output of compileNicotineSafetyEnvelope.
 * @param {Object} schedule
 * @param {number} schedule.dayIndex - Day since treatment start (0-based).
 * @param {number} schedule.totalMg - Total projected nicotine in mg (all channels).
 * @param {Array<{type:string, mg:number, time:string}>} [schedule.fastBoluses]
 * @param {number} [schedule.cumulativeWeeksHighDose] - Weeks of high-dose so far.
 * @param {number} [schedule.cumulativeWeeksAnyDose] - Weeks of any-dose so far.
 * @returns {{ok:boolean, violations:Array<Object>}}
 */
function validateDailySchedule(envelope, schedule) {
  const violations = [];

  if (!envelope || typeof envelope !== 'object') {
    throw new Error('validateDailySchedule requires a safety envelope object.');
  }
  if (!schedule || typeof schedule !== 'object') {
    throw new Error('validateDailySchedule requires a schedule object.');
  }

  const maxMg = envelope.constraints.dailyDose.maxMg;
  const fastChannel = envelope.constraints.fastChannel;

  if (typeof schedule.totalMg !== 'number' || schedule.totalMg < 0) {
    violations.push({
      code: 'INVALID_TOTAL_MG',
      severity: 'high',
      message: 'Schedule.totalMg must be a non-negative number.'
    });
  } else if (schedule.totalMg > maxMg) {
    violations.push({
      code: 'DAILY_DOSE_EXCEEDS_MAX',
      severity: 'high',
      message: `Proposed daily dose ${schedule.totalMg} mg exceeds envelope max ${maxMg} mg.`
    });
  }

  // Fast-channel checks
  const fastBoluses = Array.isArray(schedule.fastBoluses) ? schedule.fastBoluses : [];
  const fastTotalMg = fastBoluses.reduce((sum, b) => sum + (b.mg || 0), 0);

  if (fastBoluses.some((b) => b.mg > fastChannel.maxBolusMg)) {
    violations.push({
      code: 'FAST_BOLUS_TOO_LARGE',
      severity: 'medium',
      message: `At least one fast-channel bolus exceeds maxBolusMg ${fastChannel.maxBolusMg} mg.`
    });
  }

  if (fastBoluses.length > fastChannel.maxBolusesPerDay) {
    violations.push({
      code: 'FAST_BOLUS_COUNT_EXCEEDS_DAILY_LIMIT',
      severity: 'medium',
      message: `Fast-channel bolus count ${fastBoluses.length} exceeds daily limit ${fastChannel.maxBolusesPerDay}.`
    });
  }

  // Horizon checks
  const weeksHigh = schedule.cumulativeWeeksHighDose || 0;
  const weeksAny = schedule.cumulativeWeeksAnyDose || 0;
  const maxWeeksHigh = envelope.constraints.horizonWeeks.maxHighDose;
  const maxWeeksAny = envelope.constraints.horizonWeeks.maxAnyDose;

  if (weeksHigh > maxWeeksHigh) {
    violations.push({
      code: 'HIGH_DOSE_HORIZON_EXCEEDED',
      severity: 'high',
      message: `High-dose phase has exceeded maxHighDose ${maxWeeksHigh} weeks.`
    });
  }

  if (weeksAny > maxWeeksAny) {
    violations.push({
      code: 'ANY_DOSE_HORIZON_EXCEEDED',
      severity: 'medium',
      message: `Any-dose phase has exceeded maxAnyDose ${maxWeeksAny} weeks; continued dosing requires explicit review.`
    });
  }

  // Youth / pregnancy additional guardrails
  const eligibility = envelope.constraints.eligibility;
  if (eligibility.youth) {
    violations.push({
      code: 'YOUTH_ADDITIONAL_REVIEW',
      severity: 'medium',
      message: 'Youth patient: all NRT schedules require clinician-in-the-loop approval.'
    });
  }
  if (eligibility.contraindications.pregnancy) {
    violations.push({
      code: 'PREGNANCY_ADDITIONAL_REVIEW',
      severity: 'medium',
      message: 'Pregnancy flagged: NRT use must be explicitly authorized and monitored.'
    });
  }

  return {
    ok: violations.length === 0,
    violations
  };
}

module.exports = {
  compileNicotineSafetyEnvelope,
  validateDailySchedule
};
