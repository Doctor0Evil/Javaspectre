// cpp/javaspectre/JavaspectreAgent.cpp
#include "JavaspectreAgent.hpp"
#include "JavaspectreCore.hpp"
#include <iostream>

namespace javaspectre {

ToolResult ToolExecutor::execute(const AgentAction& action) {
    ToolResult result;
    result.success = false;

    // Transparency: always log the action
    auto logEntry = Logger::log("AgentAction.dispatch", action.type);
    std::cout << "[Javaspectre] Dispatching action: " << action.type
              << " at " << logEntry.timestamp << std::endl;

    // Very simple routing — you can expand this switch to real tools
    if (action.type == "RUN_DEEP_EXCAVATION") {
        // Placeholder: in practice, call into your excavation pipeline,
        // or trigger a JS/ALN microservice via IPC/HTTP.
        result.success = true;
        result.detail = "Deep excavation triggered for layer: " +
            (action.payload.contains("layer") ? action.payload.at("layer") : "unknown");
    } else if (action.type == "PLAN_GENERATE_REPO_BLUEPRINT") {
        result.success = true;
        result.detail = "Repo blueprint generation requested for target: " +
            (action.payload.contains("target") ? action.payload.at("target") : "unspecified");
    } else if (action.type == "REQUEST_HUMAN_REVIEW") {
        result.success = true;
        result.detail = "Human review requested for item: " +
            (action.payload.contains("item") ? action.payload.at("item") : "unspecified");
    } else if (action.type == "TRIGGER_REMOTE_TOOL") {
        // This is your IPC/HTTP hook to JS/ALN layer.
        // You can log the intended endpoint/tool identifier.
        result.success = true;
        result.detail = "Remote tool trigger stub executed (configure endpoint in integration layer).";
    } else {
        result.detail = "Unknown action type: " + action.type;
    }

    return result;
}

std::vector<ToolResult> ToolExecutor::executePlan(const AgentPlan& plan) {
    std::vector<ToolResult> results;
    results.reserve(plan.steps.size());

    auto logEntry = Logger::log("AgentPlan.execute", plan.goal);
    std::cout << "[Javaspectre] Executing plan: " << plan.goal
              << " at " << logEntry.timestamp << std::endl;

    for (const auto& step : plan.steps) {
        results.push_back(execute(step));
    }
    return results;
}

} // namespace javaspectre
