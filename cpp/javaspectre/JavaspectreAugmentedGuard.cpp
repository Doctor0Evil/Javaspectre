// cpp/javaspectre/JavaspectreAugmentedGuard.cpp
#include "JavaspectreAugmentedGuard.hpp"
#include "JavaspectreCore.hpp"
#include <iostream>

namespace javaspectre {

ToolResult AugmentedToolExecutor::executeForCitizen(
    const CitizenContext& citizen,
    const AgentAction& action
) {
    ToolResult result;
    result.success = false;

    auto logEntry = Logger::log("AugmentedCitizenAction.request", action.type);
    std::cout << "[Javaspectre] Citizen " << citizen.citizenId
              << " requests action " << action.type
              << " at " << logEntry.timestamp << std::endl;

    CitizenEnvelope env = AlnGateway::fetchCitizenEnvelope(citizen.citizenId);

    SafetyDecision sd = AlnGateway::evaluateAction(env, action);
    if (!sd.allowed) {
        result.detail = "Action denied by ALN safety/energy guard: " + sd.reason;
        Logger::log("AugmentedCitizenAction.denied", result.detail);
        return result;
    }

    bool committed = AlnGateway::commitAction(env, action);
    if (!committed) {
        result.detail = "ALN ledger commit failed; action not executed.";
        Logger::log("AugmentedCitizenAction.commitFailed", result.detail);
        return result;
    }

    // Route only *after* ledger commit, so logs and AU.ET/CSP are authoritative.
    ToolResult routed = ToolExecutor::execute(action);
    if (!routed.success) {
        result.detail = "Tool route failed after commit: " + routed.detail;
        Logger::log("AugmentedCitizenAction.routeFailed", result.detail);
        return result;
    }

    result.success = true;
    result.detail = "Action executed under ALN safety envelope. " + routed.detail;
    Logger::log("AugmentedCitizenAction.executed", result.detail);
    return result;
}

} // namespace javaspectre
