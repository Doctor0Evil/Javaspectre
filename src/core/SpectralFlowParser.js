// File: ./src/core/SpectralFlowParser.js
// Purpose: Parse Mermaid flowcharts into executable ALN blueprints for Javaspectre.
//
// Design notes (aligned with Javaspectre Doctrine):
// - Pure JavaScript ES module (Code Purity Law).
// - No placeholders; every field has concrete, documented behavior (Completion & Integrity).
// - Emits structured ALN plans + VO catalog + replication profile (Enrichment & Replication).
// - Safe in Node and browser (no hard require; optional crypto abstraction).

import crypto from 'crypto'; // Node path; in browser bundlers, provide a shim.

const DEFAULT_DOCTRINES = Object.freeze([
  1, // Code Purity Law
  2, // Completion and Integrity Protocol
  3, // Enrichment Mandate
  4, // Real-World Innovation Imperative
  5, // ALN Resonance Principle
  6, // Accelerated Replication Framework
  7, // Quantum Precision Doctrine
  8, // Adaptive Evolution Rule
  9, // Cognitive Transparency Standard
  10 // Spectral Impact Maximization
]);

/**
 * Lightweight crypto abstraction so this module can be bundled for browser
 * when a compatible hashing implementation is injected.
 */
export class HashEngine {
  constructor(impl) {
    this.impl = impl || crypto;
  }

  sha256Hex(input) {
    return this.impl.createHash('sha256').update(String(input)).digest('hex');
  }
}

/**
 * SpectralFlowParser
 * - Ingests a Mermaid flowchart source string.
 * - Extracts nodes/edges.
 * - Infers virtual-object categories from labels.
 * - Emits an ALN-aligned blueprint ready for downstream engines.
 */
export class SpectralFlowParser {
  /**
   * @param {object} [options]
   * @param {number} [options.maxNodes] - Defensive limit to prevent pathological inputs.
   * @param {HashEngine} [options.hashEngine] - Optional hashing engine for plan IDs.
   * @param {Array<number>} [options.doctrines] - Doctrine IDs to tag the blueprint with.
   */
  constructor(options = {}) {
    this.maxNodes = typeof options.maxNodes === 'number' && options.maxNodes > 0
      ? options.maxNodes
      : 1000;

    this.hashEngine = options.hashEngine instanceof HashEngine
      ? options.hashEngine
      : new HashEngine();

    this.doctrines = Array.isArray(options.doctrines) && options.doctrines.length > 0
      ? Array.from(new Set(options.doctrines)).sort((a, b) => a - b)
      : DEFAULT_DOCTRINES.slice();

    this.voCatalog = new Map(); // id -> VO descriptor
  }

  /**
   * Main entrypoint.
   * @param {string} mermaidSource - Raw Mermaid flowchart text.
   * @returns {object} blueprint - ALN-executable blueprint.
   */
  parseFlowchart(mermaidSource) {
    if (typeof mermaidSource !== 'string' || mermaidSource.trim().length === 0) {
      throw new Error('SpectralFlowParser.parseFlowchart: mermaidSource must be a non-empty string.');
    }

    const nodes = this.extractNodes(mermaidSource);
    const edges = this.extractEdges(mermaidSource);

    if (nodes.length === 0) {
      throw new Error('SpectralFlowParser.parseFlowchart: no nodes found in Mermaid source.');
    }

    if (nodes.length > this.maxNodes) {
      throw new Error(
        `SpectralFlowParser.parseFlowchart: node count ${nodes.length} exceeds maxNodes ${this.maxNodes}.`
      );
    }

    const virtualObjects = this.excavateVirtualObjects(nodes);
    const phases = this.buildPhases(nodes);
    const replicationProfile = this.buildReplicationProfile();
    const transparencyTrail = this.buildTransparencyTrail(mermaidSource, nodes, edges, virtualObjects);

    return {
      name: 'javaspectre-flow-executor',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      phases,
      edges,
      virtualObjects,
      replicationProfile,
      transparencyTrail
    };
  }

  /**
   * Extract nodes of the form:
   *   A1[Label text]
   */
  extractNodes(source) {
    const nodeRegex = /([A-Za-z0-9_]+)\[([^\]]+)\]/g;
    const nodes = [];
    const seen = new Set();
    let match;

    while ((match = nodeRegex.exec(source)) !== null) {
      const id = match[1];
      const rawLabel = match[2];
      if (seen.has(id)) continue;
      seen.add(id);

      const label = this.normalizeLabel(rawLabel);
      const voType = this.inferVOType(label);
      const modulePath = this.inferModulePath(voType);

      nodes.push({
        id,
        label,
        voType,
        modulePath
      });
    }

    return nodes;
  }

  /**
   * Extract edges of the form:
   *   A1 --> A2
   */
  extractEdges(source) {
    const edgeRegex = /([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/g;
    const edges = [];
    let match;

    while ((match = edgeRegex.exec(source)) !== null) {
      edges.push({
        from: match[1],
        to: match[2],
        kind: 'sequence'
      });
    }

    return edges;
  }

  normalizeLabel(rawLabel) {
    return String(rawLabel)
      .replace(/<br\/?>/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Map a human label to a VO category.
   * Extend this to cover all 12+ rare VOs from your doctrine.
   */
  inferVOType(label) {
    const lower = label.toLowerCase();

    if (lower.includes('intent')) return 'IntentHarvesterContract';
    if (lower.includes('doctrine')) return 'DoctrineMapperRegistry';
    if (lower.includes('excavator')) return 'VirtualObjectExcavator';
    if (lower.includes('knowledge graph') || lower.includes('spectral graph')) return 'KnowledgeGraphNode';
    if (lower.includes('blueprint') || lower.includes('repo')) return 'RepoBlueprintTemplate';
    if (lower.includes('execution') || lower.includes('ci')) return 'ExecutionEngineNode';
    if (lower.includes('replication')) return 'ReplicationVerifier';
    if (lower.includes('impact')) return 'ImpactMetricCollector';
    if (lower.includes('self-refinement') || lower.includes('meta')) return 'SelfRefinementKernel';
    if (lower.includes('guardrail')) return 'GuardrailWeaver';
    if (lower.includes('dataset') || lower.includes('telemetry')) return 'CrossCuttingDataset';
    if (lower.includes('external') || lower.includes('adapter')) return 'ExternalSurfaceAdapter';
    if (lower.includes('plan') && lower.includes('aln')) return 'ALNPlanGenerator';

    return 'KnowledgeGraphNode';
  }

  /**
   * Map VO type to a concrete module path in the repo.
   */
  inferModulePath(voType) {
    switch (voType) {
      case 'IntentHarvesterContract':
        return 'core/ALNIntentResolver.js';
      case 'DoctrineMapperRegistry':
        return 'core/DoctrineMapper.js';
      case 'VirtualObjectExcavator':
        return 'core/VirtualObjectExcavator.js';
      case 'KnowledgeGraphNode':
        return 'kg/KnowledgeGraphForge.js';
      case 'RepoBlueprintTemplate':
        return 'blueprints/RepoBlueprintSynthesizer.js';
      case 'ExecutionEngineNode':
        return 'execution/ExecutionEngine.js';
      case 'ReplicationVerifier':
        return 'execution/ReplicationVerifier.js';
      case 'ImpactMetricCollector':
        return 'impact/ImpactEvaluator.js';
      case 'SelfRefinementKernel':
        return 'meta/SelfRefinementKernel.js';
      case 'GuardrailWeaver':
        return 'core/GuardrailWeaver.js';
      case 'CrossCuttingDataset':
        return 'data/CrossCuttingDataset.js';
      case 'ExternalSurfaceAdapter':
        return 'integrations/ExternalSurfaceAdapter.js';
      case 'ALNPlanGenerator':
        return 'core/ALNPlanGenerator.js';
      default:
        return 'kg/KnowledgeGraphForge.js';
    }
  }

  /**
   * Build VO catalog and return a plain array view.
   */
  excavateVirtualObjects(nodes) {
    this.voCatalog.clear();

    nodes.forEach((node) => {
      const vo = {
        id: node.id,
        label: node.label,
        category: node.voType,
        modulePath: `./src/${node.modulePath}`,
        fields: this.generateVOFields(node),
        createdAt: new Date().toISOString()
      };
      this.voCatalog.set(node.id, vo);
    });

    return Array.from(this.voCatalog.values());
  }

  generateVOFields(node) {
    const baseInputs = ['userIntent', 'constraints', 'context'];
    const baseOutputs = ['alnPlan', 'repoBlueprint', 'impactMetrics'];

    const categorySpecific = {
      IntentHarvesterContract: {
        inputs: ['rawText', 'codeSnippets', 'files'],
        outputs: ['normalizedIntent', 'classifiedGoals']
      },
      DoctrineMapperRegistry: {
        inputs: ['normalizedIntent'],
        outputs: ['selectedDoctrines', 'constraintSet']
      },
      VirtualObjectExcavator: {
        inputs: ['sourceCode', 'runtimeDumps', 'domSnapshots'],
        outputs: ['virtualObjectCatalog', 'linkGraph']
      },
      KnowledgeGraphNode: {
        inputs: ['virtualObjectCatalog'],
        outputs: ['knowledgeGraph']
      },
      RepoBlueprintTemplate: {
        inputs: ['knowledgeGraph', 'constraints'],
        outputs: ['repoBlueprint']
      },
      ExecutionEngineNode: {
        inputs: ['repoBlueprint'],
        outputs: ['deploymentArtifacts']
      },
      ReplicationVerifier: {
        inputs: ['deploymentArtifacts'],
        outputs: ['replicationScore', 'replicationHints']
      },
      ImpactMetricCollector: {
        inputs: ['telemetry', 'usageData'],
        outputs: ['impactReport']
      },
      SelfRefinementKernel: {
        inputs: ['impactReport', 'feedback'],
        outputs: ['refinementDirectives']
      }
    };

    const extra = categorySpecific[node.voType] || { inputs: [], outputs: [] };

    return {
      inputs: Array.from(new Set([...baseInputs, ...extra.inputs])),
      outputs: Array.from(new Set([...baseOutputs, ...extra.outputs])),
      invariants: [
        'jsOnly',
        'noPlaceholders',
        '24hReplicable',
        'transparentRationale'
      ]
    };
  }

  buildPhases(nodes) {
    return nodes.map((n, index) => ({
      id: n.id,
      index,
      label: n.label,
      voType: n.voType,
      modulePath: `./src/${n.modulePath}`,
      active: true
    }));
  }

  buildReplicationProfile() {
    return {
      maxHours: 24,
      prerequisites: [
        'Node.js >= 18',
        'npm or pnpm',
        'Git and a Git hosting provider (e.g., GitHub)',
        'Internet access for dependency installation'
      ],
      steps: [
        'npm install',
        'npm test',
        'npm run harvest-flow',
        'npm run deploy-blueprint'
      ],
      verification: {
        script: 'npm test',
        requiresGreenBuild: true
      }
    };
  }

  buildTransparencyTrail(mermaidSource, nodes, edges, virtualObjects) {
    const timestamp = new Date().toISOString();
    const basis = `${mermaidSource}:${timestamp}`;
    const hash = this.hashEngine.sha256Hex(basis).slice(0, 16);

    return {
      planId: `flow-${hash}-${Date.now()}`,
      modelId: 'javaspectre-aln-flow-v1',
      doctrines: this.doctrines.slice(),
      createdAt: timestamp,
      statistics: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        virtualObjectCount: virtualObjects.length
      },
      assumptions: [
        'Mermaid flowchart accurately reflects the intended ALN pipeline.',
        'Downstream modules exist at the inferred module paths.',
        'All generated repos will be open-source or auditable by maintainers.'
      ],
      risks: [
        'Inaccurate label-to-VO mapping could miswire certain phases.',
        'Very large flowcharts may require tuned maxNodes or streaming parsing.'
      ],
      tradeoffs: [
        'Prefers semantic clarity of VO types over minimal configuration.',
        'Optimized for auditability and replication rather than micro-optimizations.'
      ]
    };
  }
}

export default SpectralFlowParser;
