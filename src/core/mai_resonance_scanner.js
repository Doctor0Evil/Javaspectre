// src/core/mai_resonance_scanner.js
// mai_resonance_scanner.js
// Assigns a resonance score and suggests structural optimizations for ALN/JavaSpectre flows.

'use strict';

const { spectralScan } = require('./mai_spectral_core');

/**
 * Analyze the resonance of a JavaScript value and emit optimization guidance.
 *
 * @param {*} input - Any JavaScript value to analyze.
 * @param {Object} [options] - Options forwarded to spectralScan.
 * @returns {Object} Resonance analysis report.
 */
function analyzeResonance(input, options = {}) {
    const scan = spectralScan(input, options);

    const suggestions = [];
    const warnings = [];
    const info = [];

    const { summary, properties, metrics, anomalies } = scan;
    const { resonance } = summary;
    const { visible, hidden, nonEnumerable, prototypeChain } = properties;
    const { depth, nodeCount, leafCount, entropy, symmetry } = metrics;

    // Hidden and non-enumerable properties
    if (hidden.length > 0) {
        warnings.push(
            `Hidden properties detected: ${hidden.join(', ')}. Consider documenting or reducing prototype leakage.`
        );
    }
    if (nonEnumerable.length > 0) {
        info.push(
            `Non-enumerable properties present: ${nonEnumerable.join(', ')}. Ensure critical behavior is discoverable.`
        );
    }

    // Depth and complexity
    if (depth > 12) {
        suggestions.push(
            `Depth is ${depth}. Refactor deeply nested structures into smaller, composable objects or typed models.`
        );
    } else if (depth === 0 && typeof input === 'object' && input !== null) {
        suggestions.push(
            'Object has zero measured depth. Consider whether this should be a richer model or a typed value object.'
        );
    }

    // Resonance thresholds
    if (resonance < 40) {
        suggestions.push(
            `Low resonance (${resonance}/100). Normalize structure, reduce coupling, and clarify type boundaries for better ALN compatibility.`
        );
    } else if (resonance < 70) {
        suggestions.push(
            `Moderate resonance (${resonance}/100). Targeted refactors to depth and type diversity could improve spectral stability.`
        );
    } else {
        info.push(
            `High resonance (${resonance}/100). Structure appears balanced for ALN-style reasoning and introspection.`
        );
    }

    // Entropy and symmetry signals
    if (entropy < 0.15 && nodeCount > 16) {
        suggestions.push(
            `Entropy is low (${entropy.toFixed(2)}). Introduce clearer domain types or reduce repetitive boilerplate nodes.`
        );
    } else if (entropy > 0.8) {
        suggestions.push(
            `Entropy is high (${entropy.toFixed(2)}). Consider consolidating similar substructures into shared schemas or classes.`
        );
    }

    if (symmetry > 0.9 && nodeCount > 20) {
        suggestions.push(
            `Symmetry is very high (${symmetry.toFixed(2)}). Verify this regularity is intentional and not duplicated logic.`
        );
    }

    // Leaf density
    const density = nodeCount > 0 ? leafCount / nodeCount : 0;
    if (density < 0.25 && nodeCount > 10) {
        suggestions.push(
            `Leaf density is low (${density.toFixed(2)}). Many structural nodes with few primitive values; consider flattening or caching.`
        );
    } else if (density > 0.9 && nodeCount > 10) {
        suggestions.push(
            `Leaf density is very high (${density.toFixed(2)}). Many raw values with minimal structure; consider grouping into richer objects.`
        );
    }

    // Prototype-chain awareness
    if (prototypeChain.length > 3) {
        info.push(
            `Long prototype chain detected (${prototypeChain.join(' -> ')}). Be cautious of framework-specific internals leaking into API surface.`
        );
    }

    // Anomalies from core analyzer
    for (const anomaly of anomalies) {
        const label = `[${anomaly.severity.toUpperCase()}] ${anomaly.code}`;
        warnings.push(`${label}: ${anomaly.message}`);
    }

    return {
        inputPreview: scan.meta.inputPreview,
        score: resonance,
        summary: {
            rootType: summary.rootType,
            depth,
            nodeCount,
            leafCount,
            entropy,
            symmetry,
            anomalyCount: summary.anomalyCount
        },
        suggestions: dedupeStrings(suggestions),
        warnings: dedupeStrings(warnings),
        info: dedupeStrings(info),
        rawScan: scan
    };
}

/**
 * Simple string deduplication while preserving order.
 */
function dedupeStrings(list) {
    const seen = new Set();
    const result = [];
    for (const item of list) {
        if (!seen.has(item)) {
            seen.add(item);
            result.push(item);
        }
    }
    return result;
}

module.exports = {
    analyzeResonance
};
