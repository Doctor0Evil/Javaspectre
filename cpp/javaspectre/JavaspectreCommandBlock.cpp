// cpp/javaspectre/JavaspectreCommandBlock.cpp
#include "JavaspectreCommandBlock.hpp"
#include <chrono>
#include <ctime>
#include <sstream>

namespace javaspectre {

std::string CommandBlock::nowIso() {
    auto now = std::chrono::system_clock::now();
    auto time_t_now = std::chrono::system_clock::to_time_t(now);
    std::ostringstream ts;
    ts << std::put_time(std::gmtime(&time_t_now), "%FT%TZ");
    return ts.str();
}

AgentEnvelope CommandBlock::handleSpectralScan(const CommandContext& ctx) {
    AgentEnvelope env;
    env.title = "Spectral Scan Output";
    env.timestamp = nowIso();
    env.humanReadable = "Performed spectral scan on input.";

    // Example: use SemanticDensity as part of scan summary
    double density = SemanticDensity::measure(ctx.input);
    env.data["semanticDensity"] = std::to_string(density);

    env.plan.goal = "Refine understanding of input and identify next analysis steps.";
    env.plan.steps = {
        AgentAction{
            .type = "TRIGGER_REMOTE_TOOL",
            .payload = {{"tool", "ALNKernel.spectralScan"}, {"inputSnippet", ctx.input.substr(0, 128)}},
            .priority = 5
        }
    };

    return env;
}

AgentEnvelope CommandBlock::handleClassify(const CommandContext& ctx) {
    AgentEnvelope env;
    env.title = "Risk & Anomaly Classification";
    env.timestamp = nowIso();
    env.humanReadable = "Evaluated hazard profile for input context.";

    // For now, derive fake metrics from input length; in practice, use real models.
    HazardInput hin;
    hin.entropy = std::min(1.0, std::max(0.0, ctx.input.size() / 1000.0));
    hin.semanticDensity = SemanticDensity::measure(ctx.input);
    hin.recursionDepth = 0.3;  // placeholder
    hin.identityVariance = 0.2; // placeholder

    HazardOutput hout = HazardEngine::evaluate(hin);

    env.data["score"] = std::to_string(hout.score);
    env.data["cognitiveHazard"] = hout.cognitiveHazard ? "true" : "false";
    env.data["entropyAnomaly"] = hout.entropyAnomaly ? "true" : "false";
    env.data["ontologicalInstability"] = hout.ontologicalInstability ? "true" : "false";

    env.plan.goal = "Mitigate identified hazards and route for deeper analysis if needed.";

    std::vector<AgentAction> steps;

    if (hout.cognitiveHazard) {
        steps.push_back(AgentAction{
            .type = "REQUEST_HUMAN_REVIEW",
            .payload = {{"item", "cognitive-hazard-input"}, {"userId", ctx.userId}},
            .priority = 10
        });
    }

    if (hout.entropyAnomaly) {
        steps.push_back(AgentAction{
            .type = "RUN_DEEP_EXCAVATION",
            .payload = {{"layer", "entropy-anomaly"}, {"sessionId", ctx.sessionId}},
            .priority = 7
        });
    }

    steps.push_back(AgentAction{
        .type = "TRIGGER_REMOTE_TOOL",
        .payload = {{"tool", "ALNKernel.hazardReport"}, {"severityScore", std::to_string(hout.score)}},
        .priority = 5
    });

    env.plan.steps = std::move(steps);
    return env;
}

AgentEnvelope CommandBlock::handleOrchestrate(const CommandContext& ctx) {
    AgentEnvelope env;
    env.title = "Orchestration Plan";
    env.timestamp = nowIso();
    env.humanReadable = "Orchestrated multi-step plan from spectral scan and classification.";

    // 1. Conceptually call spectral-scan + classify
    AgentEnvelope scanEnv = handleSpectralScan(ctx);
    AgentEnvelope classifyEnv = handleClassify(ctx);

    env.data["semanticDensity"] = scanEnv.data.contains("semanticDensity")
        ? scanEnv.data.at("semanticDensity")
        : "0";

    env.data["hazardScore"] = classifyEnv.data.contains("score")
        ? classifyEnv.data.at("score")
        : "0";

    // 2. Synthesize multi-step plan
    env.plan.goal = "Excavate, analyze, and blueprint the input domain safely.";

    std::vector<AgentAction> steps;

    // First: remote spectral reasoning
    steps.push_back(AgentAction{
        .type = "TRIGGER_REMOTE_TOOL",
        .payload = {{"tool", "ALNKernel.spectralScan"}, {"inputSnippet", ctx.input.substr(0, 256)}},
        .priority = 6
    });

    // Second: deep excavation if entropy suggests it
    steps.push_back(AgentAction{
        .type = "RUN_DEEP_EXCAVATION",
        .payload = {{"layer", "deep"}, {"sessionId", ctx.sessionId}},
        .priority = 5
    });

    // Third: generate repo/blueprint suggestion
    steps.push_back(AgentAction{
        .type = "PLAN_GENERATE_REPO_BLUEPRINT",
        .payload = {{"target", "virtual-object-ecosystem"}, {"userId", ctx.userId}},
        .priority = 4
    });

    // Fourth: request human sign-off
    steps.push_back(AgentAction{
        .type = "REQUEST_HUMAN_REVIEW",
        .payload = {{"item", "orchestrated-plan"}, {"userId", ctx.userId}},
        .priority = 8
    });

    env.plan.steps = steps;

    // 3. Optional: auto-execute first step if consent granted
    if (ctx.consentExecuteFirstStep && !env.plan.steps.empty()) {
        auto result = ToolExecutor::execute(env.plan.steps.front());
        // You could stuff this into env.data["firstStepResult"] if desired.
        env.data["firstStepAutoExecuted"] = result.success ? "true" : "false";
    } else {
        env.data["firstStepAutoExecuted"] = "false";
    }

    return env;
}

} // namespace javaspectre
