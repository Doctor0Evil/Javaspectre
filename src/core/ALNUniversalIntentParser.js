// Path: src/core/ALNUniversalIntentParser.js
// ALNUniversalIntentParser:
// Language-agnostic ALN intent parsing and workflow orchestration blueprint.

export class ALNUniversalIntentParser {
  constructor(options = {}) {
    this.version = '1.0.0';

    this.defaultLocale =
      typeof options.defaultLocale === 'string' ? options.defaultLocale : 'en';

    this.supportedRunners = [
      'ubuntu-latest',
      'windows-latest',
      'macos-latest',
      'xr-edge-sim',
    ];

    this.defaultNodeVersion =
      typeof options.defaultNodeVersion === 'string'
        ? options.defaultNodeVersion
        : '20';

    this.mlIntegrationDefaults = {
      enabled: true,
      modelHint: 'aln-general-intent-v1',
      telemetryTopic: 'javaspectre/aln-intents',
      feedbackChannel: 'pull-request-comments',
    };
  }

  /**
   * Parse natural-language text (any locale) into an ALN-spec-conformant
   * document with intent, domain, constraints, environment, and artifacts.
   */
  parse(rawText, env = {}) {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error(
        'ALNUniversalIntentParser.parse: rawText must be a non-empty string.',
      );
    }

    const normalized = rawText.trim();
    const locale = this._inferLocale(normalized, env.locale || this.defaultLocale);
    const tokens = this._tokenize(normalized);
    const hints = this._extractHints(tokens, normalized, locale);

    const intentId = this._hashIntent(normalized);

    const goal = this._inferGoal(normalized, hints);
    const domain = this._inferDomain(normalized, hints);
    const constraints = this._inferConstraints(normalized, hints, env);
    const environment = this._inferEnvironment(env, hints);
    const mlIntegration = this._buildMLIntegration(hints);
    const xrProfile = this._buildXRProfile(hints);

    const workflowPlan = this._buildWorkflowPlan({
      id: intentId,
      locale,
      goal,
      domain,
      constraints,
      environment,
      mlIntegration,
      xrProfile,
    });

    const summary = this._buildSummary(
      {
        id: intentId,
        locale,
        goal,
        domain,
        constraints,
        environment,
        mlIntegration,
        xrProfile,
      },
      workflowPlan,
    );

    const artifacts = {
      workflowPlan,
      virtualObjects: [],
      transparencyTrail: {
        planId: workflowPlan.id,
        assumptions: [
          'User intends to run ALN artifacts on a Git-based host.',
          'JavaScript and Node.js are available for execution.',
        ],
        risks: [],
        tradeoffs: [
          'Optimized for GitHub-style workflows before other providers.',
        ],
      },
    };

    return {
      type: 'ALNUniversalIntent',
      version: this.version,
      intent: {
        id: intentId,
        text: normalized,
        locale,
        goal,
        tags: hints.tokens.slice(0, 12),
      },
      domain,
      constraints,
      environment,
      mlIntegration,
      xrProfile,
      artifacts,
      summary,
    };
  }

  // -----------------------------
  // Locale and token handling
  // -----------------------------

  _inferLocale(text, fallback) {
    const lower = text.toLowerCase();
    if (/[ぁ-んァ-ン一-龯]/.test(text)) return 'ja';
    if (/[áéíóúñü]/.test(text)) return 'es';
    if (lower.includes('github') || lower.includes('workflow')) return 'en';
    return fallback;
  }

  _tokenize(text) {
    return text
      .split(/[\s,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  _extractHints(tokens, text, locale) {
    const lower = text.toLowerCase();

    const hasGithub =
      lower.includes('github') ||
      lower.includes('gitlab') ||
      lower.includes('ci/cd') ||
      lower.includes('ci') ||
      lower.includes('workflow');

    const hasXR =
      lower.includes('xr') ||
      lower.includes('vr') ||
      lower.includes('ar') ||
      lower.includes('headset') ||
      lower.includes('mixed reality');

    const hasML =
      lower.includes('ml') ||
      lower.includes('machine learning') ||
      lower.includes('ai model') ||
      lower.includes('reinforcement');

    const sustainability =
      lower.includes('sustainab') ||
      lower.includes('carbon') ||
      lower.includes('energy') ||
      lower.includes('green');

    const highSecurity =
      lower.includes('security') ||
      lower.includes('compliance') ||
      lower.includes('pci') ||
      lower.includes('hipaa') ||
      lower.includes('gdpr');

    const speedPriority =
      lower.includes('low latency') ||
      lower.includes('real-time') ||
      lower.includes('realtime') ||
      lower.includes('subframe');

    return {
      locale,
      hasGithub,
      hasXR,
      hasML,
      sustainability,
      highSecurity,
      speedPriority,
      tokens,
      fullTextLower: lower,
    };
  }

  // -----------------------------
  // Intent semantics
  // -----------------------------

  _inferGoal(text, hints) {
    const lower = hints.fullTextLower;

    if (lower.includes('build') && lower.includes('workflow')) {
      return 'build_ci_workflow';
    }
    if (lower.includes('deploy') && lower.includes('xr')) {
      return 'deploy_xr_application';
    }
    if (lower.includes('train') && hints.hasML) {
      return 'train_ml_model_pipeline';
    }
    if (lower.includes('analyze logs') || lower.includes('analyze telemetry')) {
      return 'analyze_telemetry';
    }
    return 'general_aln_orchestration';
  }

  _inferDomain(text, hints) {
    const lower = hints.fullTextLower;

    if (lower.includes('game') || lower.includes('gaming')) {
      return 'interactive_gaming';
    }
    if (lower.includes('finance')) return 'financial_systems';
    if (lower.includes('health') || lower.includes('medical')) {
      return 'healthcare';
    }
    if (hints.hasXR) return 'xr_systems';
    if (hints.hasML) return 'ml_pipelines';
    return 'general_software';
  }

  _inferConstraints(text, hints, env) {
    const lower = hints.fullTextLower;

    const maxLatencyMs = hints.speedPriority ? 20 : 120;
    const preferGreenRunners = hints.sustainability || !!env.preferGreenRunners;
    const securityLevel = hints.highSecurity ? 'high' : 'standard';

    const runtime = {
      language: 'JavaScript',
      nodeVersion: env.nodeVersion || this.defaultNodeVersion,
      allowNativeModules: !!env.allowNativeModules,
    };

    return {
      maxLatencyMs,
      preferGreenRunners,
      securityLevel,
      retries: typeof env.retries === 'number' ? env.retries : 2,
      timeoutSeconds:
        typeof env.timeoutSeconds === 'number' ? env.timeoutSeconds : 900,
      runtime,
      rawTextLower: lower,
    };
  }

  _inferEnvironment(env, hints) {
    const runners = Array.isArray(env.runners) ? env.runners : [];
    const uniqueRunners = runners.length
      ? Array.from(new Set(runners))
      : ['ubuntu-latest'];

    const supported = uniqueRunners.filter((r) =>
      this.supportedRunners.includes(r),
    );

    return {
      requestedRunners: uniqueRunners,
      compatibleRunners: supported.length ? supported : ['ubuntu-latest'],
      gitProvider: env.gitProvider || 'github',
      repoSlug: env.repoSlug || 'unknown/unknown',
      defaultBranch: env.defaultBranch || 'main',
      environmentVariables: this._normalizeEnvVars(env.environmentVariables),
    };
  }

  _normalizeEnvVars(raw) {
    const base = raw && typeof raw === 'object' ? raw : {};
    const safe = {};

    Object.keys(base).forEach((key) => {
      const v = base[key];
      if (v === undefined || v === null) return;
      safe[key] = String(v);
    });

    safe.ALN_ENGINE_VERSION = this.version;
    safe.JAVASPECTRE_ENABLED = 'true';

    return safe;
  }

  // -----------------------------
  // ML and XR profiles
  // -----------------------------

  _buildMLIntegration(hints) {
    if (!this.mlIntegrationDefaults.enabled || !hints.hasML) {
      return {
        enabled: false,
        reason:
          'ML integration disabled or not requested explicitly in the intent text.',
      };
    }

    return {
      enabled: true,
      modelHint: this.mlIntegrationDefaults.modelHint,
      telemetryTopic: this.mlIntegrationDefaults.telemetryTopic,
      feedbackChannel: this.mlIntegrationDefaults.feedbackChannel,
      modes: ['online-evaluation', 'offline-replay'],
    };
  }

  _buildXRProfile(hints) {
    if (!hints.hasXR) {
      return {
        optimizedForXR: false,
        reason: 'No XR-specific hints detected in the text.',
      };
    }

    const baselineLatency = hints.speedPriority ? 15 : 35;

    return {
      optimizedForXR: true,
      displayTargets: ['headset', 'monitor-mirror'],
      inputChannels: ['controller', 'hand-tracking', 'gaze', 'voice-intent'],
      preferredRefreshHz: 90,
      maxMotionToPhotonLatencyMs: baselineLatency,
      environment: {
        supportsRoomScale: true,
        supportsSeated: true,
        compositorHint: 'low-persistence-preferred',
      },
    };
  }

  // -----------------------------
  // Workflow plan and summary
  // -----------------------------

  _buildWorkflowPlan(alnIntent) {
    const steps = [];

    steps.push({
      id: 'checkout',
      name: 'Checkout repository',
      runner: 'ubuntu-latest',
      actions: [
        {
          kind: 'github-action',
          uses: 'actions/checkout@v4',
        },
      ],
    });

    steps.push({
      id: 'setup-node',
      name: 'Setup Node.js for ALN execution',
      runner: 'ubuntu-latest',
      actions: [
        {
          kind: 'github-action',
          uses: 'actions/setup-node@v4',
          with: {
            'node-version': alnIntent.constraints.runtime.nodeVersion,
            cache: 'npm',
          },
        },
      ],
    });

    steps.push({
      id: 'install-deps',
      name: 'Install dependencies',
      runner: 'ubuntu-latest',
      actions: [
        {
          kind: 'shell',
          run: 'npm install',
        },
      ],
    });

    if (alnIntent.mlIntegration.enabled) {
      steps.push({
        id: 'ml-telemetry',
        name: 'Prepare ML telemetry channels',
        runner: 'ubuntu-latest',
        actions: [
          {
            kind: 'shell',
            run:
              'echo "ML telemetry topic: ' +
              alnIntent.mlIntegration.telemetryTopic +
              '"',
          },
        ],
      });
    }

    if (alnIntent.xrProfile.optimizedForXR) {
      steps.push({
        id: 'xr-sim',
        name: 'Run XR-optimized tests',
        runner: 'ubuntu-latest',
        actions: [
          {
            kind: 'shell',
            run:
              'npm test -- --group xr --max-latency ' +
              alnIntent.xrProfile.maxMotionToPhotonLatencyMs,
          },
        ],
      });
    }

    steps.push({
      id: 'run-spectral',
      name: 'Run spectral engine or scripts',
      runner: 'ubuntu-latest',
      actions: [
        {
          kind: 'shell',
          run: 'npm test || echo "No tests defined, skipping."',
        },
      ],
    });

    return {
      id: `workflow-${alnIntent.id}`,
      name: 'ALN Universal Workflow Plan',
      targetProvider: alnIntent.environment.gitProvider,
      defaultRunner: 'ubuntu-latest',
      steps,
    };
  }

  _buildSummary(alnIntent, workflowPlan) {
    return {
      goal: alnIntent.goal,
      domain: alnIntent.domain,
      locale: alnIntent.locale,
      compatibleRunners: alnIntent.environment.compatibleRunners,
      hasMLIntegration: alnIntent.mlIntegration.enabled,
      optimizedForXR: alnIntent.xrProfile.optimizedForXR === true,
      stepCount: workflowPlan.steps.length,
    };
  }

  // -----------------------------
  // Utilities
  // -----------------------------

  _hashIntent(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    const normalized = Math.abs(hash).toString(16);
    return normalized.padStart(8, '0');
  }
}

export default ALNUniversalIntentParser;
