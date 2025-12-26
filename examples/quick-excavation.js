// Path: examples/quick-excavation.js
// Run with: node examples/quick-excavation.js

const samplePayload = {
  user: {
    id: 'u_12345',
    name: 'Spectral Operator',
    roles: ['admin', 'researcher'],
    preferences: {
      theme: 'dark',
      experimentalFlags: ['deep-excavation', 'vm-introspection']
    }
  },
  session: {
    id: 's_98765',
    startedAt: new Date().toISOString(),
    active: true
  },
  metrics: {
    pagesScanned: 42,
    apisTouched: 7,
    vmTargets: ['vm-alpha', 'vm-beta']
  }
};

/**
 * Very small, self-contained structural inspector.
 * This is not a full Javaspectre core, but demonstrates
 * “virtual-object” style summaries with zero extra setup.
 */
function inspect(value, path = 'root', depth = 0, maxDepth = 5, visited = new WeakSet()) {
  if (depth > maxDepth) {
    return { path, kind: 'depth-limit' };
  }

  const t = typeof value;
  if (value === null) return { path, kind: 'null' };
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint') {
    return { path, kind: 'primitive', type: t, example: value };
  }
  if (Array.isArray(value)) {
    return {
      path,
      kind: 'array',
      length: value.length,
      samples: value.slice(0, 5).map((v, i) =>
        inspect(v, `${path}[${i}]`, depth + 1, maxDepth, visited)
      )
    };
  }
  if (t === 'function') {
    return { path, kind: 'function', name: value.name || null, arity: value.length };
  }
  if (t === 'object') {
    if (visited.has(value)) {
      return { path, kind: 'cycle' };
    }
    visited.add(value);
    const fields = {};
    Object.keys(value).forEach((k) => {
      fields[k] = inspect(value[k], `${path}.${k}`, depth + 1, maxDepth, visited);
    });
    return {
      path,
      kind: 'object',
      ctor: value.constructor && value.constructor.name ? value.constructor.name : 'Object',
      fields
    };
  }
  return { path, kind: 'unknown', type: t };
}

function main() {
  const result = inspect(samplePayload);
  console.log('=== Javaspectre Quick Excavation ===');
  console.dir(result, { depth: null, colors: true });
}

if (require.main === module) {
  main();
}
