// Path: src/core/SpectralEngine.js
// Main orchestrator integrating ALN reasoning, capability selection, and spectral automation.

import crypto from 'crypto';
import ALNKernel from './ALNKernel.js';
import SpectralHarvester from './SpectralHarvester.js';
import IntegrityEngine from './IntegrityEngine.js';
import VirtualObjectExcavator from './VirtualObjectExcavator.js';
import {
  buildExecutionRecipe,
  listCapabilitiesSummary,
} from '../capabilities/JavaspectreCapabilities.js';
// Optional: wire when SustainabilityCore is implemented.
// import SustainabilityCore from './SustainabilityCore.js';

export class SpectralEngine {
  constructor(options = {}) {
    this.engineId = options.engineId || 'javaspectre-spectral-engine-v1';

    this.alnKernel = options.alnKernel || new ALNKernel();
    this.integrityEngine =
      options.integrityEngine || new IntegrityEngine(true);
    this.virtualObjectExcavator =
      options.virtualObjectExcavator ||
      new VirtualObjectExcavator({ includeDom: false });
    // this.sustainabilityCore =
    //   options.sustainabilityCore || new SustainabilityCore();

    this.defaultConstraints = {
      language: 'JavaScript',
      requireCompleteness: true,
      forbidPlaceholders: true,
      maxReplicationTimeHours: 24,
      ...(options.defaultConstraints || {}),
    };
  }

  /**
   * High-level entrypoint: run a full spectral pass for a given intent.
   * Returns a SpectralRun object suitable for JSON serialization.
   *
   * @param {string} intent
   * @param {object} context
   * @returns {Promise<object>}
   */
  async run(intent, context = {}) {
    if (!intent || typeof intent !== 'string') {
      throw new Error('SpectralEngine.run: intent must be a non-empty string.');
    }

    const startedAt = new Date().toISOString();
    const runId = this.#hash(`${this.engineId}:${intent}:${startedAt}`);

    const alnResult = this.alnKernel.reason(
      intent,
      this.defaultConstraints,
      context,
    );
    const recipe = buildExecutionRecipe(intent);

    const capabilitySummaries = listCapabilitiesSummary();
    const capabilityIndex = new Map(
      capabilitySummaries.map((c) => [c.id, c]),
    );

    const capabilityInvocations = [];
    const artifacts = {
      repoBlueprints: [],
      excavations: [],
      impactReports: [],
      integrityFindings: [],
      transparencyTrails: [],
      extra: [],
    };

    for (const step of recipe.steps) {
      const capMeta = capabilityIndex.get(step.capabilityId) || null;

      const invocation = {
        runId,
        stepId: `step-${step.step}`,
        capabilityId: step.capabilityId,
        capabilityName: step.capabilityName,
        entryModule: step.entryModule,
        startedAt: new Date().toISOString(),
        status: 'pending',
        input: { intent, context },
        output: null,
        error: null,
      };

      try {
        const result = await this.executeCapabilityStep(
          step,
          capMeta,
          intent,
          context,
          alnResult,
          artifacts,
        );
        invocation.status = 'ok';
        invocation.output = result;
      } catch (err) {
        invocation.status = 'error';
        invocation.error = {
          message: err.message || String(err),
          stack: err.stack || null,
        };
      }

      invocation.completedAt = new Date().toISOString();
      capabilityInvocations.push(invocation);
    }

    const transparencyTrail = {
      engineId: this.engineId,
      engineVersion: '0.2.0',
      runId,
      startedAt,
      completedAt: new Date().toISOString(),
      intent,
      constraints: this.defaultConstraints,
      alnPlan: {
        planId: alnResult.planId,
        steps: alnResult.steps,
        assumptions: alnResult.transparencyTrail.assumptions,
        risks: alnResult.transparencyTrail.risks,
        tradeoffs: alnResult.transparencyTrail.tradeoffs,
      },
      recipe,
      capabilityInvocations: capabilityInvocations.map(
        ({ error, ...rest }) => rest,
      ),
    };

    artifacts.transparencyTrails.push(transparencyTrail);

    return {
      type: 'SpectralRun',
      version: '0.2.0',
      runId,
      engineId: this.engineId,
      intent,
      context,
      startedAt,
      completedAt: transparencyTrail.completedAt,
      constraints: this.defaultConstraints,
      alnPlan: transparencyTrail.alnPlan,
      recipe,
      capabilityInvocations,
      artifacts,
      transparencyTrail,
      summary: this.buildRunSummary(artifacts, capabilityInvocations),
    };
  }

  /**
   * Execute a single recipe step by delegating into the appropriate
   * internal orchestration path.
   */
  async executeCapabilityStep(step, capMeta, intent, context, alnResult, artifacts) {
    const id = step.capabilityId;

    if (id === 'zero-config-repo-blueprinting') {
      const harvester = new SpectralHarvester(this.alnKernel);
      const blueprint = harvester.harvestToRepoBlueprint(
        intent,
        context.tags || [],
      );
      const serialized = blueprint.toJSON();
      artifacts.repoBlueprints.push(serialized);
      return { kind: 'repo-blueprint', blueprint: serialized };
    }

    if (id === 'live-virtual-object-harvesting') {
      const sampleValue = context.sampleValue || null;
      const excavation = this.virtualObjectExcavator.excavate({
        value: sampleValue,
        domRoot: null,
      });
      artifacts.excavations.push(excavation);
      return { kind: 'virtual-object-excavation', excavation };
    }

    if (id === 'one-command-spectral-refinement') {
      const sources = context.sources || [];
      const integrityReports = [];

      for (const src of sources) {
        const res = this.integrityEngine.validateSource(
          src.filename,
          src.code,
        );
        integrityReports.push(res);
      }

      artifacts.integrityFindings.push(...integrityReports);
      return { kind: 'integrity-check', reports: integrityReports };
    }

    if (id === 'sustainability-impact-calculator') {
      // When SustainabilityCore is implemented, delegate here.
      const stubReport = {
        modelVersion: 'draft-0',
        assumptions: [
          'Stub impact model; replace with SustainabilityCore implementation.',
        ],
        estimatedCO2eKgPerYear: null,
        recommendations: [],
      };
      artifacts.impactReports.push(stubReport);
      return { kind: 'impact-report', report: stubReport };
    }

    const note = {
      message: 'Capability recognized but no orchestration path is wired yet.',
      capabilityId: id,
      capabilityName: step.capabilityName,
      entryModule: step.entryModule,
      meta: capMeta || null,
    };
    artifacts.extra.push(note);
    return { kind: 'noop', note };
  }

  /**
   * Derive a concise human/machine-friendly summary for dashboards and logs.
   */
  buildRunSummary(artifacts, capabilityInvocations) {
    return {
      repoBlueprintCount: artifacts.repoBlueprints.length,
      excavationCount: artifacts.excavations.length,
      impactReportCount: artifacts.impactReports.length,
      integrityFindingCount: artifacts.integrityFindings.length,
      transparencyTrailCount: artifacts.transparencyTrails.length,
      extraNotesCount: artifacts.extra.length,
      failedSteps: capabilityInvocations
        .filter((inv) => inv.status === 'error')
        .map((inv) => ({
          stepId: inv.stepId,
          capabilityId: inv.capabilityId,
          message: inv.error?.message || 'Unknown error',
        })),
    };
  }

  #hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
  }
}

export default SpectralEngine;
