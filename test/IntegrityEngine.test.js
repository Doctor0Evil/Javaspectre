// IntegrityEngine.test.js
import { IntegrityEngine } from '../src/core/IntegrityEngine.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

const engine = new IntegrityEngine();
const result = engine.validateSource({
  filename: 'Example.js',
  source: 'export const x = 1;'
});

assert(result.ok === true, 'Clean file should pass integrity check.');

console.log('IntegrityEngine.test.js: OK');
