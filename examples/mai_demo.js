// examples/mai_demo.js
// Example: Analyzing a Mistral-AI configuration object with Javaspectre resonance + ALN adapter.

'use strict';

const { analyzeResonance } = require('../src/core/mai_resonance_scanner');
const { toALNFormat } = require('../src/core/mai_aln_adapter');

// Example Mistral-style config object (JSON-mode friendly)
const mistralConfig = {
    model: 'mistral-large-latest',
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    _internal: {
        debug: true,
        trace_id: 'mstl-9f3c7a2b4c1d8e60'
    }
};

function main() {
    try {
        const analysis = analyzeResonance(mistralConfig);
        const alnPayload = toALNFormat(analysis, {
            sessionId: 'demo-mistral-config',
            traceId: 'demo-trace-001'
        });

        // Emit clean JSON for piping or capture.
        // Use stdout only; avoid extra logs for maximum tool compatibility.
        process.stdout.write(JSON.stringify(alnPayload, null, 2) + '\n');
    } catch (error) {
        // Basic stderr logging for demo use; production systems should use a logger.
        console.error('[mai_demo] Error during resonance analysis:', error.message);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    main
};
