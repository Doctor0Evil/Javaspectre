// Path: src/core/SpectralEngine.js
// Main orchestrator integrating ALN reasoning, capability selection, and spectral automation.

import crypto from 'crypto';
import ALNKernel from './ALNKernel.js';
import SpectralHarvester from './SpectralHarvester.js';
import IntegrityEngine from './IntegrityEngine.js';
import TransparencyTrail from './TransparencyTrail.js';
import VirtualObjectExcavator from './VirtualObjectExcavator.js';
import ALNUniversalIntentParser from './ALNUniversalIntentParser.js';
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
    this.alnParser =
      options.alnParser || new ALNUniversalIntentParser();
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
   * High-level entrypoint.
   *
   * Supports:
   * - raw: `input` is a string intent; `env` optional → parsed to ALN document
   * - structured: `input` is an ALN-style document:
   *   { intent, domain, constraints, environment, artifacts }
   *
   * Returns a SpectralRun object suitable for JSON serialization.
   *
   * @param {string|object} input
   * @param {object} env
   * @returns {Promise<object>}
   */
  async run(input, env = {}) {
    const alnDoc =
      typeof input === 'string'
        ? this.alnParser.parse(input, env)
        : input;

    this._validateAlnDoc(alnDoc);

    const startedAt = new Date().toISOString();
    const runId = this.#hash(`${this.engineId}:${alnDoc.intent.text}:${startedAt}`);

    const alnResult = this.alnKernel.reason(
      alnDoc.intent.text,
      {
        language: alnDoc.constraints.runtime.language,
        requireCompleteness: true,
        forbidPlaceholders: true,
        maxReplicationTimeHours: 24,
      },
      {
        domain: alnDoc.domain,
        environment: alnDoc.environment,
      },
    );

    // If domain-aware recipe builder is available, use it; otherwise fall back
    // to capabilities module recipe builder using the raw intent text.
    const recipe =
      typeof this._buildExecutionRecipeFromDomain === 'function'
        ? this._buildExecutionRecipeFromDomain(alnDoc)
        : buildExecutionRecipe(alnDoc.intent.text);

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
      virtualObjects:
        (alnDoc.artifacts && alnDoc.artifacts.virtualObjects) || [],
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
        input: {
          alnIntentId: alnDoc.intent.id,
          domain: alnDoc.domain,
          intentText: alnDoc.intent.text,
          environment: alnDoc.environment,
        },
        output: null,
        error: null,
      };

      try {
        const result = await this.executeCapabilityStep(
          step,
          capMeta,
          alnDoc,
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
      intentId: alnDoc.intent.id,
      intentText: alnDoc.intent.text,
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

    // Optionally embed transparency into external artifacts if desired
    if (TransparencyTrail && typeof TransparencyTrail.embedInPackageJson === 'function') {
      // hook point for future integration; left no-op by default
    }

    return {
      type: 'SpectralRun',
      version: '0.2.0',
      runId,
      engineId: this.engineId,
      alnDocument: alnDoc,
      intent: alnDoc.intent.text,
      context: {
        domain: alnDoc.domain,
        environment: alnDoc.environment,
      },
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

  _validateAlnDoc(doc) {
    if (!doc || typeof doc !== 'object') {
      throw new Error('SpectralEngine.run: ALN document must be an object.');
    }
    if (!doc.intent || typeof doc.intent.text !== 'string') {
      throw new Error('SpectralEngine.run: ALN document must include intent.text.');
    }
    if (!doc.constraints || !doc.constraints.runtime) {
      throw new Error('SpectralEngine.run: ALN document missing constraints.runtime.');
    }
  }

  _buildExecutionRecipeFromDomain(alnDoc) {
    const steps = [];
    const domain = alnDoc.domain;

    // Always blueprint first
    steps.push({
      step: 1,
      capabilityId: 'zero-config-repo-blueprinting',
      capabilityName: 'Zero-Config Repo Blueprinting',
      entryModule: 'src/capabilities/RepoBlueprinting.js',
    });

    // Domain-gated live virtual-object harvesting
    if (domain === 'xr_systems' || domain === 'interactive_gaming') {
      steps.push({
        step: 2,
        capabilityId: 'live-virtual-object-harvesting',
        capabilityName: 'Live Virtual-Object Harvesting',
        entryModule: 'src/capabilities/LiveVirtualHarvester.js',
      });
    }

    // Always refine
    steps.push({
      step: steps.length + 1,
      capabilityId: 'one-command-spectral-refinement',
      capabilityName: 'One-Command Spectral Refinement',
      entryModule: 'src/capabilities/SpectralRefiner.js',
    });

    // Always compute (or stub) sustainability impact
    steps.push({
      step: steps.length + 1,
      capabilityId: 'sustainability-impact-calculator',
      capabilityName: 'Sustainability Impact Calculator',
      entryModule: 'src/capabilities/SustainabilityCore.js',
    });

    return {
      id: `recipe-${alnDoc.intent.id}`,
      steps,
    };
  }

  /**
   * Execute a single recipe step by delegating into the appropriate
   * internal orchestration path.
   */
  async executeCapabilityStep(step, capMeta, alnDoc, alnResult, artifacts) {
    const id = step.capabilityId;
    const intentText = alnDoc.intent.text;
    const context = {
      domain: alnDoc.domain,
      environment: alnDoc.environment,
      tags: (alnDoc.artifacts && alnDoc.artifacts.tags) || [],
      sources: (alnDoc.artifacts && alnDoc.artifacts.sources) || [],
      sampleValue:
        alnDoc.artifacts && Object.prototype.hasOwnProperty.call(alnDoc.artifacts, 'sampleValue')
          ? alnDoc.artifacts.sampleValue
          : null,
    };

    if (id === 'zero-config-repo-blueprinting') {
      const harvester = new SpectralHarvester(this.alnKernel);
      const blueprint = harvester.harvestToRepoBlueprint(
        intentText,
        context.tags || [],
      );
      const serialized = blueprint.toJSON();
      artifacts.repoBlueprints.push(serialized);
      return { kind: 'repo-blueprint', blueprint: serialized };
    }

    if (id === 'live-virtual-object-harvesting') {
      const excavation = this.virtualObjectExcavator.excavate({
        value: context.sampleValue,
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
