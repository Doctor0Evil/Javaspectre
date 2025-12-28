// cpp/javaspectre/JavaspectreAugmentedGuard.hpp
#pragma once
#include "JavaspectreAugmented.hpp"
#include "JavaspectreAgent.hpp"
#include <string>

namespace javaspectre {

struct SafetyDecision {
    bool allowed{false};
    std::string reason;
    // Quantitative margins for logging/audit.
    double sigma_rad{1.0};      // 1 - max(D/Dmax, SAR/SARmax, J/Jmax)
    double sigma_energy{1.0};   // AU.ET / daily cap margin
    double sigma_risk{1.0};     // safety budget remaining fraction
};

// Thin IPC client into ALN/CEM Rust runtime.
class AlnGateway {
public:
    // Returns current citizen envelope (energy + safety vector).
    static CitizenEnvelope fetchCitizenEnvelope(const std::string& citizenId);

    // Ask ALN runtime if a specific AgentAction is safe for this citizen.
    static SafetyDecision evaluateAction(
        const CitizenEnvelope& env,
        const AgentAction& action
    );

    // Commit the action as an EnergyEvent if allowed (AU.ET/CSP + safety update).
    static bool commitAction(
        const CitizenEnvelope& env,
        const AgentAction& action
    );
};

class AugmentedToolExecutor {
public:
    static ToolResult executeForCitizen(
        const CitizenContext& citizen,
        const AgentAction& action
    );
};

} // namespace javaspectre
