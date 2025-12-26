// ALNKernel.test.js
import ALNKernel from '../src/core/ALNKernel.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

const kernel = new ALNKernel();
const { planId, steps, transparencyTrail } = kernel.reason({
  intent: 'Create a JavaScript CLI tool for spectral repository generation.',
  constraints: {}
});

assert(planId && typeof planId === 'string', 'planId must be a string.');
assert(Array.isArray(steps) && steps.length > 0, 'steps must be non-empty.');
assert(transparencyTrail && transparencyTrail.planId === planId, 'planId must match in trail.');

console.log('ALNKernel.test.js: OK');
