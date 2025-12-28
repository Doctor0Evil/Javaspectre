// cpp/javaspectre/JavaspectreAgent.hpp
#pragma once
#include <string>
#include <vector>
#include <map>
#include <optional>

namespace javaspectre {

struct AgentAction {
    std::string type;                 // e.g., "RUN_DEEP_EXCAVATION"
    std::map<std::string, std::string> payload; // free-form key/value
    int priority{0};                  // higher = more urgent
};

struct AgentPlan {
    std::string goal;                 // human-readable goal
    std::vector<AgentAction> steps;   // ordered actions
};

struct AgentEnvelope {
    std::string title;
    std::string timestamp;
    std::string system{"Javaspectre Command Block"};
    std::string humanReadable;        // for UI/logs
    std::map<std::string, std::string> data; // summary fields (small)
    AgentPlan plan;                   // machine-readable plan
};

// A minimal tool execution result
struct ToolResult {
    bool success{false};
    std::string detail;
};

class ToolExecutor {
public:
    // Dispatch a single AgentAction to local or remote tools.
    // This is intentionally simple & auditable.
    static ToolResult execute(const AgentAction& action);

    // Execute all steps in a plan, in order.
    static std::vector<ToolResult> executePlan(const AgentPlan& plan);
};

} // namespace javaspectre
