import crypto from 'crypto';

export class ALNKernel {
  constructor({ modelId = 'javaspectre-aln-v1' } = {}) {
    this.modelId = modelId;
  }

  /**
   * Run a reasoning pass over an input description and constraints.
   * Returns a structured plan plus a transparency trail.
   */
  reason({ intent, constraints = {}, context = {} }) {
    if (!intent || typeof intent !== 'string') {
      throw new Error('ALNKernel.reason: "intent" must be a non-empty string.');
    }

    const timestamp = new Date().toISOString();
    const planId = crypto.createHash('sha256')
      .update(`${intent}:${timestamp}`)
      .digest('hex')
      .slice(0, 16);

    const normalizedConstraints = this.#normalizeConstraints(constraints);

    const steps = this.#synthesizeSteps(intent, normalizedConstraints, context);

    const transparencyTrail = {
      planId,
      modelId: this.modelId,
      intent,
      constraints: normalizedConstraints,
      contextSummary: this.#summarizeContext(context),
      createdAt: timestamp,
      steps,
      assumptions: this.#deriveAssumptions(intent, normalizedConstraints, context),
      risks: this.#deriveRisks(intent, normalizedConstraints, context),
      tradeoffs: this.#deriveTradeoffs(intent, normalizedConstraints, context)
    };

    return { planId, steps, transparencyTrail };
  }

  #normalizeConstraints(constraints) {
    const defaults = {
      language: 'JavaScript',
      requireCompleteness: true,
      forbidPlaceholders: true,
      maxReplicationTimeHours: 24
    };
    return { ...defaults, ...constraints };
  }

  #synthesizeSteps(intent, constraints, context) {
    const steps = [];

    steps.push({
      id: 'analyze-intent',
      description: 'Interpret the user intent and classify the artifact type.',
      output: {
        artifactType: this.#inferArtifactType(intent),
        priority: 'high'
      }
    });

    steps.push({
      id: 'map-doctrine',
      description: 'Map the request to Javaspectre doctrines (1–10).',
      output: {
        doctrines: this.#mapDoctrines(intent, context)
      }
    });

    steps.push({
      id: 'design-structure',
      description: 'Design folder, file, and module structure.',
      output: {
        requiresRepoBlueprint: true,
        enforcesCodePurity: constraints.language === 'JavaScript'
      }
    });

    steps.push({
      id: 'enforce-integrity',
      description: 'Ensure no incomplete or placeholder code is produced.',
      output: {
        requireCompleteness: constraints.requireCompleteness,
        forbidPlaceholders: constraints.forbidPlaceholders
      }
    });

    steps.push({
      id: 'replication-plan',
      description: 'Ensure a 24-hour replication pathway exists.',
      output: {
        maxHours: constraints.maxReplicationTimeHours
      }
    });

    return steps;
  }

  #inferArtifactType(intent) {
    const lower = intent.toLowerCase();
    if (lower.includes('repository') || lower.includes('repo')) return 'repository';
    if (lower.includes('module') || lower.includes('library')) return 'library';
    if (lower.includes('cli')) return 'cli-tool';
    if (lower.includes('service') || lower.includes('api')) return 'service';
    return 'general-artifact';
  }

  #mapDoctrines(intent) {
    const doctrines = [];

    const lower = intent.toLowerCase();
    doctrines.push(1, 2, 3, 5, 6, 7, 8, 9, 10);

    if (lower.includes('sustain') || lower.includes('energy') || lower.includes('climate')) {
      doctrines.push(4);
    }

    return Array.from(new Set(doctrines)).sort((a, b) => a - b);
  }

  #summarizeContext(context) {
    const keys = Object.keys(context || {});
    if (keys.length === 0) return 'No explicit context provided.';
    return `Context keys: ${keys.join(', ')}.`;
  }

  #deriveAssumptions(intent, constraints) {
    const assumptions = [];
    assumptions.push('User intends to publish outputs as open-source.');
    assumptions.push(`Target implementation language is ${constraints.language}.`);
    if (constraints.maxReplicationTimeHours <= 24) {
      assumptions.push('A motivated developer is available for replication within 24 hours.');
    }
    if (intent.toLowerCase().includes('github')) {
      assumptions.push('Git and GitHub are accessible in the target environment.');
    }
    return assumptions;
  }

  #deriveRisks(intent) {
    const risks = [];
    risks.push('Risk of over-engineering structures for simple use cases.');
    if (intent.toLowerCase().includes('critical') || intent.toLowerCase().includes('safety')) {
      risks.push('Safety-critical context requires external human review and testing.');
    }
    return risks;
  }

  #deriveTradeoffs() {
    return [
      'Favor semantic clarity over minimal code size.',
      'Prefer explicit configuration over hidden conventions.',
      'Optimize for auditability and replication rather than micro-optimizations.'
    ];
  }
}

export default ALNKernel;
