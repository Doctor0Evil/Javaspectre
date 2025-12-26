// Path: src/playground/web/app.js

class BrowserALNParser {
  constructor() {
    this.version = '1.0.0';
    this.defaultNodeVersion = '20';
  }

  parse(text, env) {
    const rawText = String(text || '').trim();
    if (!rawText) {
      throw new Error('Intent text cannot be empty.');
    }
    const locale = (env && env.locale) || 'en';
    const id = this._hashIntent(rawText);
    const goal = this._inferGoal(rawText.toLowerCase());
    const domain = this._inferDomain(rawText.toLowerCase());
    const constraints = {
      maxLatencyMs: goal === 'deploy_xr_application' ? 20 : 120,
      preferGreenRunners: rawText.toLowerCase().includes('green'),
      securityLevel: 'standard',
      retries: 2,
      timeoutSeconds: 900,
      runtime: {
        language: 'JavaScript',
        nodeVersion: this.defaultNodeVersion,
        allowNativeModules: false
      }
    };
    const environment = {
      gitProvider: 'github',
      repoSlug: (env && env.repoSlug) || 'unknown/unknown',
      defaultBranch: (env && env.defaultBranch) || 'main',
      compatibleRunners: ['ubuntu-latest'],
      environmentVariables: {
        ALN_ENGINE_VERSION: this.version,
        JAVASPECTRE_ENABLED: 'true'
      }
    };
    const workflowPlan = this._buildWorkflowPlan({
      id,
      goal,
      domain,
      constraints
    });

    return {
      intent: {
        id,
        text: rawText,
        locale,
        goal,
        tags: rawText.split(/\s+/).slice(0, 8)
      },
      domain,
      constraints,
      environment,
      artifacts: {
        workflowPlan,
        virtualObjects: [],
        transparencyTrail: {
          planId: workflowPlan.id,
          assumptions: [
            'User intends to run ALN artifacts on a Git-based host.',
            'JavaScript and Node.js are available for execution.'
          ],
          risks: [],
          tradeoffs: []
        }
      }
    };
  }

  _inferGoal(lower) {
    if (lower.includes('xr') || lower.includes('vr')) {
      return 'deploy_xr_application';
    }
    if (lower.includes('workflow') || lower.includes('ci')) {
      return 'build_ci_workflow';
    }
    if (lower.includes('train') && lower.includes('model')) {
      return 'train_ml_model_pipeline';
    }
    return 'general_aln_orchestration';
  }

  _inferDomain(lower) {
    if (lower.includes('xr') || lower.includes('vr') || lower.includes('ar')) {
      return 'xr_systems';
    }
    if (lower.includes('game')) return 'interactive_gaming';
    if (lower.includes('ml') || lower.includes('machine learning')) {
      return 'ml_pipelines';
    }
    return 'general_software';
  }

  _buildWorkflowPlan(ctx) {
    const steps = [
      {
        id: 'checkout',
        name: 'Checkout repository',
        runner: 'ubuntu-latest',
        actions: [
          {
            kind: 'github-action',
            uses: 'actions/checkout@v4'
          }
        ]
      },
      {
        id: 'setup-node',
        name: 'Setup Node.js',
        runner: 'ubuntu-latest',
        actions: [
          {
            kind: 'github-action',
            uses: 'actions/setup-node@v4',
            with: {
              'node-version': ctx.constraints.runtime.nodeVersion,
              cache: 'npm'
            }
          }
        ]
      },
      {
        id: 'install-deps',
        name: 'Install dependencies',
        runner: 'ubuntu-latest',
        actions: [
          {
            kind: 'shell',
            run: 'npm install'
          }
        ]
      },
      {
        id: 'run-tests',
        name: 'Run tests or spectral checks',
        runner: 'ubuntu-latest',
        actions: [
          {
            kind: 'shell',
            run: 'npm test || echo "No tests defined, skipping."'
          }
        ]
      }
    ];

    if (ctx.domain === 'xr_systems' || ctx.domain === 'interactive_gaming') {
      steps.push({
        id: 'xr-tests',
        name: 'Run XR-focused tests',
        runner: 'ubuntu-latest',
        actions: [
          {
            kind: 'shell',
            run: 'npm test -- --group xr'
          }
        ]
      });
    }

    return {
      id: `workflow-${ctx.id}`,
      steps
    };
  }

  _hashIntent(text) {
    let hash = 0;
    const s = text || '';
    for (let i = 0; i < s.length; i += 1) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    const normalized = Math.abs(hash).toString(16);
    return normalized.padStart(8, '0');
  }
}

function toYaml(workflowPlan) {
  const lines = [];
  lines.push('name: ALN Generated Workflow');
  lines.push('on:');
  lines.push('  push:');
  lines.push('    branches: [ main ]');
  lines.push('  pull_request:');
  lines.push('    branches: [ main ]');
  lines.push('jobs:');
  lines.push('  aln-job:');
  lines.push('    runs-on: ubuntu-latest');
  lines.push('    steps:');

  for (const step of workflowPlan.steps) {
    lines.push('      - name: ' + step.name);
    if (step.actions && step.actions.length > 0) {
      for (const action of step.actions) {
        if (action.kind === 'github-action') {
          lines.push('        uses: ' + action.uses);
          if (action.with) {
            lines.push('        with:');
            Object.keys(action.with).forEach((k) => {
              lines.push(`          ${k}: ${action.with[k]}`);
            });
          }
        } else if (action.kind === 'shell') {
          lines.push('        run: |');
          lines.push('          ' + action.run);
        }
      }
    }
  }

  return lines.join('\n');
}

function main() {
  const parser = new BrowserALNParser();

  const intentInput = document.getElementById('intent-input');
  const repoSlugInput = document.getElementById('repo-slug');
  const defaultBranchInput = document.getElementById('default-branch');
  const runButton = document.getElementById('run-aln');

  const alnOutput = document.getElementById('aln-output');
  const workflowOutput = document.getElementById('workflow-output');

  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  runButton.addEventListener('click', () => {
    try {
      const env = {
        repoSlug: repoSlugInput.value.trim(),
        defaultBranch: defaultBranchInput.value.trim()
      };
      const doc = parser.parse(intentInput.value, env);
      alnOutput.textContent = JSON.stringify(doc, null, 2);
      workflowOutput.textContent = toYaml(doc.artifacts.workflowPlan);
    } catch (err) {
      alnOutput.textContent = 'Error: ' + (err.message || String(err));
      workflowOutput.textContent = '';
    }
  });
}

main();
