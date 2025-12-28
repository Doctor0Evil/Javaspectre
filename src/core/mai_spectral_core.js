// src/core/mai_spectral_core.js
// mai_spectral_core.js
// Spectral Resonance Analyzer (JavaSpectre Core)
// Purpose: Deep introspection of JavaScript objects, detecting hidden properties,
//          structural anomalies, and computing a multi-axis "spectral resonance" score.

'use strict';

/**
 * Perform a full spectral scan on any JavaScript value.
 * Returns visible and hidden keys, structural metrics, and a resonance score.
 * This module is side-effect free and safe to use in any Node or browser context.
 *
 * @param {*} input - Any JavaScript value or object to scan.
 * @param {Object} [options] - Optional configuration.
 * @param {boolean} [options.includePrototype=true] - Whether to inspect prototype chain.
 * @param {boolean} [options.includeNonEnumerable=false] - Whether to include non-enumerable props.
 * @returns {Object} Spectral scan report.
 */
function spectralScan(input, options = {}) {
    const config = normalizeOptions(options);

    const rootType = getType(input);
    const rootIsObjectLike = rootType === 'object' || rootType === 'array' || rootType === 'function';

    // Non-object values are still supported (they just have no deep resonance)
    if (!rootIsObjectLike) {
        return buildReport({
            input,
            rootType,
            visibleProps: [],
            hiddenProps: [],
            nonEnumerableProps: [],
            prototypeChain: [],
            depth: 0,
            nodeCount: 1,
            leafCount: 1,
            symmetry: 1,
            entropy: 0,
            anomalies: [],
            config
        });
    }

    const {
        visibleProps,
        hiddenProps,
        nonEnumerableProps,
        prototypeChain
    } = collectProperties(input, config);

    const {
        depth,
        nodeCount,
        leafCount,
        typeDistribution,
        entropy
    } = analyzeStructure(input, new WeakSet());

    const symmetry = calculateSymmetry(typeDistribution);
    const anomalies = detectAnomalies({
        input,
        rootType,
        depth,
        nodeCount,
        leafCount,
        visibleProps,
        hiddenProps,
        entropy,
        symmetry
    });

    const resonance = calculateResonance({
        depth,
        symmetry,
        entropy,
        nodeCount,
        leafCount,
        anomalyCount: anomalies.length
    });

    return buildReport({
        input,
        rootType,
        visibleProps,
        hiddenProps,
        nonEnumerableProps,
        prototypeChain,
        depth,
        nodeCount,
        leafCount,
        symmetry,
        entropy,
        typeDistribution,
        anomalies,
        resonance,
        config
    });
}

/**
 * Normalize and validate options.
 */
function normalizeOptions(options) {
    return {
        includePrototype: typeof options.includePrototype === 'boolean' ? options.includePrototype : true,
        includeNonEnumerable: typeof options.includeNonEnumerable === 'boolean' ? options.includeNonEnumerable : false,
        maxDepth: Number.isInteger(options.maxDepth) && options.maxDepth > 0 ? options.maxDepth : 32
    };
}

/**
 * Returns a stable, high-level type string.
 */
function getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    const t = typeof value;
    if (t === 'object') return 'object';
    if (t === 'function') return 'function';
    return t; // 'string', 'number', 'boolean', 'undefined', 'symbol', 'bigint'
}

/**
 * Collect visible, hidden, and non-enumerable properties along with the prototype chain.
 */
function collectProperties(obj, config) {
    const visibleProps = [];
    const hiddenProps = [];
    const nonEnumerableProps = [];
    const prototypeChain = [];

    // Own enumerable properties
    for (const key of Object.keys(obj)) {
        visibleProps.push(key);
    }

    // Non-enumerable own properties if requested
    if (config.includeNonEnumerable) {
        const allOwnNames = Object.getOwnPropertyNames(obj);
        for (const key of allOwnNames) {
            if (!visibleProps.includes(key)) {
                nonEnumerableProps.push(key);
            }
        }
    }

    // Prototype chain and inherited props
    if (config.includePrototype) {
        let proto = Object.getPrototypeOf(obj);
        const seen = new Set();

        while (proto && !seen.has(proto)) {
            seen.add(proto);
            const protoName = proto.constructor && proto.constructor.name
                ? proto.constructor.name
                : 'ObjectPrototype';
            prototypeChain.push(protoName);

            const protoKeys = Object.keys(proto);
            for (const key of protoKeys) {
                if (!obj.hasOwnProperty(key) && typeof obj[key] !== 'undefined') {
                    if (!hiddenProps.includes(key)) {
                        hiddenProps.push(key);
                    }
                }
            }

            proto = Object.getPrototypeOf(proto);
        }
    }

    return {
        visibleProps,
        hiddenProps,
        nonEnumerableProps,
        prototypeChain
    };
}

/**
 * Analyze structural depth, node counts, and type distribution.
 */
function analyzeStructure(obj, seen, depth = 0, typeDistribution = {}) {
    if (obj === null || typeof obj !== 'object') {
        // leaf node
        incrementType(typeDistribution, getType(obj));
        return {
            depth,
            nodeCount: 1,
            leafCount: 1,
            typeDistribution,
            entropy: calculateEntropy(typeDistribution)
        };
    }

    if (seen.has(obj)) {
        // cycle detected, treat as leaf-like to avoid infinite recursion
        incrementType(typeDistribution, 'cycle');
        return {
            depth,
            nodeCount: 1,
            leafCount: 1,
            typeDistribution,
            entropy: calculateEntropy(typeDistribution)
        };
    }

    seen.add(obj);

    let maxChildDepth = depth;
    let nodeCount = 1; // current node
    let leafCount = 0;

    const keys = Object.keys(obj);
    if (keys.length === 0) {
        // empty object/array is a leaf-like node
        incrementType(typeDistribution, getType(obj));
        leafCount += 1;
    } else {
        incrementType(typeDistribution, getType(obj));
        for (const key of keys) {
            const child = obj[key];
            const result = analyzeStructure(child, seen, depth + 1, typeDistribution);
            maxChildDepth = Math.max(maxChildDepth, result.depth);
            nodeCount += result.nodeCount;
            leafCount += result.leafCount;
        }
    }

    const entropy = calculateEntropy(typeDistribution);

    return {
        depth: maxChildDepth,
        nodeCount,
        leafCount,
        typeDistribution,
        entropy
    };
}

/**
 * Increment type distribution map.
 */
function incrementType(map, type) {
    // eslint-disable-next-line no-param-reassign
    map[type] = (map[type] || 0) + 1;
}

/**
 * Shannon entropy over the type distribution.
 */
function calculateEntropy(typeDistribution) {
    const total = Object.values(typeDistribution).reduce((sum, v) => sum + v, 0);
    if (total === 0) return 0;

    let entropy = 0;
    for (const count of Object.values(typeDistribution)) {
        const p = count / total;
        entropy -= p * Math.log2(p);
    }
    // Normalize roughly into 0..1 by dividing by log2(N) where N is number of distinct types.
    const n = Object.keys(typeDistribution).length;
    if (n <= 1) return 0;
    return entropy / Math.log2(n);
}

/**
 * Structural symmetry: 1 means strongly dominated by a few types,
 * 0 means highly diversified/heterogeneous.
 */
function calculateSymmetry(typeDistribution) {
    const types = Object.keys(typeDistribution);
    const total = types.reduce((sum, t) => sum + typeDistribution[t], 0);
    if (total === 0 || types.length === 0) return 1;

    // Use Herfindahl–Hirschman Index (HHI)-style measure normalized to 0..1
    let hhi = 0;
    for (const t of types) {
        const p = typeDistribution[t] / total;
        hhi += p * p;
    }
    // hhi in (0,1]; treat it directly as a "symmetry" proxy (higher = more concentrated = more symmetric)
    return hhi;
}

/**
 * Detect basic anomalies: extreme depth, excessive hidden properties, etc.
 */
function detectAnomalies(context) {
    const anomalies = [];

    if (context.depth > 16) {
        anomalies.push({
            code: 'DEPTH_EXCESSIVE',
            severity: 'high',
            message: `Object depth ${context.depth} exceeds recommended limit of 16.`,
            value: context.depth
        });
    }

    if (context.hiddenProps.length > context.visibleProps.length) {
        anomalies.push({
            code: 'HIDDEN_DOMINANT',
            severity: 'medium',
            message: 'Hidden properties outnumber visible properties, possible prototype-heavy design or leakage.',
            value: {
                visible: context.visibleProps.length,
                hidden: context.hiddenProps.length
            }
        });
    }

    if (context.entropy < 0.1 && context.nodeCount > 32) {
        anomalies.push({
            code: 'LOW_ENTROPY',
            severity: 'low',
            message: 'Very homogeneous structure with many nodes; may indicate over-regularized or boilerplate-heavy design.',
            value: {
                entropy: context.entropy,
                nodeCount: context.nodeCount
            }
        });
    }

    if (context.leafCount === 0 && context.nodeCount > 0) {
        anomalies.push({
            code: 'NO_LEAVES',
            severity: 'medium',
            message: 'No primitive leaves detected; structure may be purely structural or cyclic.',
            value: {
                nodeCount: context.nodeCount
            }
        });
    }

    return anomalies;
}

/**
 * Calculate a normalized resonance score (0–100) from structural metrics.
 *
 * - depthScore rewards moderate depth but penalizes very shallow or extremely deep structures.
 * - symmetryScore favors some regularity but not extreme monocultures.
 * - entropyScore favors healthy diversity of types.
 * - densityScore measures leaf-to-node ratio.
 */
function calculateResonance(metrics) {
    const {
        depth,
        symmetry,
        entropy,
        nodeCount,
        leafCount,
        anomalyCount
    } = metrics;

    // Depth: ideal around 3–8
    const idealMin = 3;
    const idealMax = 8;
    let depthScore;
    if (depth <= 0) {
        depthScore = 0;
    } else if (depth < idealMin) {
        depthScore = depth / idealMin;
    } else if (depth > idealMax) {
        const over = depth - idealMax;
        depthScore = Math.max(0, 1 - (over / 16));
    } else {
        depthScore = 1;
    }

    // Symmetry: discourage extremes; map [0,1] ⇒ [0,1] with a hump in the middle
    const symmetryCentered = 1 - Math.abs(symmetry - 0.6) / 0.6; // peak near 0.6
    const symmetryScore = clamp(symmetryCentered, 0, 1);

    // Entropy is already normalized 0..1
    const entropyScore = clamp(entropy, 0, 1);

    // Density: proportion of leaves to nodes (healthy range: ~0.3–0.9)
    let density = nodeCount > 0 ? leafCount / nodeCount : 0;
    let densityScore;
    if (density <= 0) densityScore = 0;
    else if (density < 0.3) densityScore = density / 0.3;
    else if (density > 0.9) densityScore = Math.max(0, 1 - (density - 0.9) / 0.5);
    else densityScore = 1;

    // Combine with weights
    let raw =
        depthScore * 0.3 +
        symmetryScore * 0.2 +
        entropyScore * 0.3 +
        densityScore * 0.2;

    // Penalize anomalies
    if (anomalyCount > 0) {
        raw *= Math.max(0, 1 - 0.1 * anomalyCount);
    }

    return Math.round(clamp(raw, 0, 1) * 100);
}

function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
}

/**
 * Build final report with ALN-style metadata and human-readable summary.
 */
function buildReport(ctx) {
    const {
        input,
        rootType,
        visibleProps,
        hiddenProps,
        nonEnumerableProps,
        prototypeChain,
        depth,
        nodeCount,
        leafCount,
        symmetry,
        entropy,
        typeDistribution = {},
        anomalies = [],
        resonance,
        config
    } = ctx;

    const timestamp = new Date().toISOString();

    const summary = {
        rootType,
        hasHiddenProps: hiddenProps.length > 0,
        hasNonEnumerableProps: nonEnumerableProps.length > 0,
        depth,
        nodeCount,
        leafCount,
        resonance,
        anomalyCount: anomalies.length
    };

    const reasoning = {
        intent: 'Analyze structural resonance and hidden properties of a JavaScript value.',
        constraints: {
            language: 'JavaScript',
            maxDepth: config.maxDepth,
            includePrototype: config.includePrototype,
            includeNonEnumerable: config.includeNonEnumerable
        },
        createdAt: timestamp,
        assumptions: [
            'Input is treated as an opaque value; no mutation occurs.',
            'Cyclic references are possible and are handled via WeakSet tracking.',
            'Resonance score is heuristic and intended for comparative diagnostics, not security guarantees.'
        ],
        metrics: {
            depth,
            nodeCount,
            leafCount,
            symmetry,
            entropy
        },
        notes: [
            'Higher resonance suggests balanced depth, healthy type diversity, and moderate symmetry.',
            'Multiple anomalies indicate structures that may benefit from refactoring or documentation.',
            'Hidden properties are often inherited via prototypes; they may signal framework internals or leakage.'
        ]
    };

    return {
        summary,
        resonance,
        metrics: {
            depth,
            nodeCount,
            leafCount,
            symmetry,
            entropy,
            typeDistribution
        },
        properties: {
            visible: visibleProps.slice().sort(),
            hidden: hiddenProps.slice().sort(),
            nonEnumerable: nonEnumerableProps.slice().sort(),
            prototypeChain
        },
        anomalies,
        reasoning,
        meta: {
            analyzedAt: timestamp,
            inputPreview: buildPreview(input)
        }
    };
}

/**
 * Lightweight preview of the input for logging and inspection.
 */
function buildPreview(input) {
    const t = getType(input);
    if (t === 'string') {
        return input.length > 64 ? `${input.slice(0, 61)}...` : input;
    }
    if (t === 'number' || t === 'boolean' || t === 'null' || t === 'undefined' || t === 'bigint') {
        return String(input);
    }
    if (t === 'function') {
        return input.name ? `function ${input.name}()` : 'anonymous function';
    }
    if (t === 'array') {
        return `Array(${input.length})`;
    }
    if (t === 'object') {
        const keys = Object.keys(input);
        return `Object{${keys.slice(0, 5).join(', ')}${keys.length > 5 ? ', ...' : ''}}`;
    }
    if (t === 'symbol') {
        return input.toString();
    }
    return `<${t}>`;
}

module.exports = {
    spectralScan
};
