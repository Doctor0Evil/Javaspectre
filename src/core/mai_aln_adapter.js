// src/core/mai_aln_adapter.js
// mai_aln_adapter.js
// Formats resonance analysis data into an ALN-friendly JSON envelope.

'use strict';

/**
 * Convert a resonance analysis report into ALN-style structured JSON.
 *
 * Expected input shape (from analyzeResonance):
 * {
 *   inputPreview: string,
 *   score: number,
 *   summary: { ... },
 *   suggestions: string[],
 *   warnings: string[],
 *   info: string[],
 *   rawScan: { ... }
 * }
 *
 * @param {Object} analysis - Result from analyzeResonance.
 * @param {Object} [context] - Optional contextual metadata (session, user, etc.).
 * @returns {Object} ALN-formatted payload.
 */
function toALNFormat(analysis, context = {}) {
    if (!analysis || typeof analysis !== 'object') {
        throw new Error('toALNFormat requires a non-null resonance analysis object.');
    }

    const timestamp = new Date().toISOString();
    const score = typeof analysis.score === 'number' ? analysis.score : null;

    const findingBuckets = bucketFindings(analysis);

    return {
        meta: {
            source: 'Javaspectre:ResonanceEngine',
            mode: 'spectral-introspection',
            timestamp,
            score,
            severity: classifySeverity(score),
            input_preview: analysis.inputPreview || null,
            session: {
                id: context.sessionId || null,
                trace_id: context.traceId || null
            }
        },
        spectral_metrics: {
            depth: analysis.summary?.depth ?? null,
            node_count: analysis.summary?.nodeCount ?? null,
            leaf_count: analysis.summary?.leafCount ?? null,
            entropy: analysis.summary?.entropy ?? null,
            symmetry: analysis.summary?.symmetry ?? null,
            anomaly_count: analysis.summary?.anomalyCount ?? null
        },
        findings: {
            hidden_properties: findingBuckets.hiddenProperties,
            optimization_opportunities: findingBuckets.optimizations,
            structural_risks: findingBuckets.risks,
            informational_notes: findingBuckets.informational
        },
        aln_hints: {
            // Short textual hints suitable for direct ALN/system prompts.
            summary: buildSummary(score, findingBuckets),
            recommended_actions: buildActionHints(score, findingBuckets)
        },
        raw: {
            // Raw scan is preserved for downstream tools that need full context.
            resonance_summary: analysis.summary || null
        }
    };
}

/**
 * Bucket messages into categories using simple heuristics and keywords.
 */
function bucketFindings(analysis) {
    const hiddenProperties = [];
    const optimizations = [];
    const risks = [];
    const informational = [];

    const allSuggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions : [];
    const allWarnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];
    const allInfo = Array.isArray(analysis.info) ? analysis.info : [];

    for (const msg of allSuggestions) {
        if (includesAny(msg, ['Hidden properties', 'hidden properties'])) {
            hiddenProperties.push(msg);
        } else {
            optimizations.push(msg);
        }
    }

    for (const msg of allWarnings) {
        // Treat all warnings as risks for ALN
        risks.push(msg);
        if (includesAny(msg, ['Hidden properties', 'hidden properties'])) {
            hiddenProperties.push(msg);
        }
    }

    for (const msg of allInfo) {
        informational.push(msg);
    }

    return {
        hiddenProperties: dedupeStrings(hiddenProperties),
        optimizations: dedupeStrings(optimizations),
        risks: dedupeStrings(risks),
        informational: dedupeStrings(informational)
    };
}

/**
 * Assign a coarse severity class from the resonance score.
 */
function classifySeverity(score) {
    if (typeof score !== 'number') return 'unknown';
    if (score < 40) return 'high';
    if (score < 70) return 'moderate';
    if (score < 85) return 'low';
    return 'minimal';
}

/**
 * Build a short, ALN-friendly summary string.
 */
function buildSummary(score, buckets) {
    if (typeof score !== 'number') {
        return 'Resonance score unavailable; see findings for structural diagnostics.';
    }

    const parts = [];

    if (score < 40) {
        parts.push(`Low resonance (${score}/100) with multiple optimization and risk indicators.`);
    } else if (score < 70) {
        parts.push(`Moderate resonance (${score}/100) with clear improvement opportunities.`);
    } else {
        parts.push(`High resonance (${score}/100) and generally healthy structure.`);
    }

    if (buckets.hiddenProperties.length > 0) {
        parts.push('Hidden properties detected; introspection and documentation are recommended.');
    }

    if (buckets.risks.length > 0) {
        parts.push('Structural risks present; review warnings for ALN-critical issues.');
    }

    return parts.join(' ');
}

/**
 * Build a small set of recommended next actions for downstream orchestration.
 */
function buildActionHints(score, buckets) {
    const actions = [];

    if (typeof score !== 'number' || score < 40) {
        actions.push('refactor_structure');
        actions.push('simplify_nesting');
    } else if (score < 70) {
        actions.push('targeted_refactor');
    } else {
        actions.push('log_as_baseline');
    }

    if (buckets.hiddenProperties.length > 0) {
        actions.push('inspect_prototype_chain');
        actions.push('document_hidden_properties');
    }

    if (buckets.risks.length > 0) {
        actions.push('run_deep_safety_review');
    }

    return dedupeStrings(actions);
}

/**
 * Utility: check if a string contains any of the given substrings (case-sensitive).
 */
function includesAny(text, needles) {
    if (typeof text !== 'string') return false;
    for (const n of needles) {
        if (text.includes(n)) return true;
    }
    return false;
}

/**
 * Utility: dedupe strings while preserving order.
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
    toALNFormat
};
