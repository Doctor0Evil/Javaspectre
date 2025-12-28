// cpp/javaspectre/JavaspectreCommandBlock_Augmented.cpp
#include "JavaspectreCommandBlock.hpp"
#include "JavaspectreAugmentedGuard.hpp"

namespace javaspectre {

AgentEnvelope CommandBlock::handleOrchestrateAugmented(const AugmentedCommandContext& ctx) {
    AgentEnvelope base = handleOrchestrate(ctx); // build spectral + hazard plan

    AgentEnvelope env;
    env.title = "Augmented-Citizen Orchestration Plan";
    env.timestamp = nowIso();
    env.humanReadable =
        "Multi-step augmented-citizen plan (energy/safety-gated by ALN).";

    // Copy summary metrics and plan goal/steps.
    env.data = base.data;
    env.plan.goal = base.plan.goal;
    env.plan.steps = base.plan.steps;

    // Optional: auto-execute first safe step.
    if (ctx.consentExecuteFirstStep && !env.plan.steps.empty()) {
        auto first = env.plan.steps.front();
        ToolResult r = AugmentedToolExecutor::executeForCitizen(ctx.citizen, first);
        env.data["firstStepAutoExecuted"] = r.success ? "true" : "false";
        env.data["firstStepDetail"] = r.detail;
    } else {
        env.data["firstStepAutoExecuted"] = "false";
    }

    return env;
}

} // namespace javaspectre
