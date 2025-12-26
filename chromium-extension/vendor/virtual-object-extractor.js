// Path: chromium-extension/vendor/virtual-object-extractor.js
// Lightweight virtual-object extractor for use via chrome.devtools.inspectedWindow.

window.__JAVASPECTRE_EXTRACT_VIRTUAL_OBJECTS__ = function () {
  function extractAttributes(el) {
    const attrs = {};
    if (!el || !el.attributes) return attrs;
    Array.from(el.attributes).forEach((attr) => {
      attrs[attr.name] = attr.value;
    });
    return attrs;
  }

  const all = Array.from(document.querySelectorAll('*')).slice(0, 2000);
  const byTag = new Map();

  all.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag).push(el);
  });

  const virtualObjects = [];
  byTag.forEach((elements, tag) => {
    const sample = elements[0] || null;
    virtualObjects.push({
      id: `dom-tag-${tag}`,
      category: 'dom-tag',
      fields: {
        selector: tag,
        count: elements.length,
        attributesExample: sample ? extractAttributes(sample) : {}
      }
    });
  });

  const intent = {
    id: 'devtools-' + String(Date.now()),
    text: 'DevTools ALN scan for current page',
    locale: 'en',
    goal: 'analyze_telemetry',
    tags: ['devtools', 'virtual-object', 'dom']
  };

  const alnDoc = {
    intent,
    domain: 'xr_systems',
    constraints: {
      maxLatencyMs: 120,
      preferGreenRunners: true,
      securityLevel: 'standard',
      retries: 0,
      timeoutSeconds: 10,
      runtime: {
        language: 'JavaScript',
        nodeVersion: '20',
        allowNativeModules: false
      }
    },
    environment: {
      gitProvider: 'github',
      repoSlug: 'unknown/unknown',
      defaultBranch: 'main',
      compatibleRunners: ['ubuntu-latest'],
      environmentVariables: {
        ALN_ENGINE_VERSION: '0.2.0',
        JAVASPECTRE_ENABLED: 'true'
      }
    },
    artifacts: {
      workflowPlan: {
        id: 'workflow-devtools',
        steps: []
      },
      virtualObjects,
      transparencyTrail: {
        planId: 'devtools',
        assumptions: ['Page allows client-side inspection.'],
        risks: [],
        tradeoffs: []
      }
    }
  };

  return alnDoc;
};
