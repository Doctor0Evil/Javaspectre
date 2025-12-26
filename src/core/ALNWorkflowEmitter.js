// Path: src/core/ALNWorkflowEmitter.js
// ALNWorkflowEmitter: converts ALN artifacts.workflowPlan into GitHub Actions YAML.

export class ALNWorkflowEmitter {
  constructor(options = {}) {
    this.defaultBranch =
      typeof options.defaultBranch === 'string' ? options.defaultBranch : 'main';
    this.defaultJobId =
      typeof options.defaultJobId === 'string' ? options.defaultJobId : 'aln-job';
  }

  /**
   * Emit GitHub Actions YAML from an ALN document that conforms to ALNSpec.
   * Expects doc.artifacts.workflowPlan to be present.
   */
  emitGitHubYaml(alnDocument) {
    if (!alnDocument || typeof alnDocument !== 'object') {
      throw new Error('ALNWorkflowEmitter.emitGitHubYaml: invalid ALN document.');
    }
    const artifacts = alnDocument.artifacts || {};
    const workflowPlan = artifacts.workflowPlan;
    if (!workflowPlan || !Array.isArray(workflowPlan.steps)) {
      throw new Error(
        'ALNWorkflowEmitter.emitGitHubYaml: missing artifacts.workflowPlan.steps.'
      );
    }

    const lines = [];
    lines.push('name: ALN Generated Workflow');
    lines.push('on:');
    lines.push('  push:');
    lines.push(`    branches: [ ${this.defaultBranch} ]`);
    lines.push('  pull_request:');
    lines.push(`    branches: [ ${this.defaultBranch} ]`);
    lines.push('jobs:');
    lines.push(`  ${this.defaultJobId}:`);
    lines.push('    runs-on: ubuntu-latest');
    lines.push('    steps:');

    for (const step of workflowPlan.steps) {
      lines.push(`      - name: ${step.name}`);
      if (step.actions && step.actions.length > 0) {
        for (const action of step.actions) {
          if (action.kind === 'github-action') {
            lines.push(`        uses: ${action.uses}`);
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
}

export default ALNWorkflowEmitter;
