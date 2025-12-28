// cpp/javaspectre/JavaspectreCommandBlock.hpp
#pragma once
#include "JavaspectreAgent.hpp"
#include "JavaspectreCore.hpp"
#include "JavaspectreAugmented.hpp" // for CitizenContext
#include <string>

namespace javaspectre {

struct CommandContext {
    std::string input;
    std::string userId;
    std::string sessionId;
    std::string command;      // "/spectral-scan", "/classify", "/orchestrate", etc.
    bool consentExecuteFirstStep{false}; // safety flag
};

struct AugmentedCommandContext : CommandContext {
    CitizenContext citizen;
};

class CommandBlock {
public:
    // existing
    static AgentEnvelope handleSpectralScan(const CommandContext& ctx);
    static AgentEnvelope handleClassify(const CommandContext& ctx);
    static AgentEnvelope handleOrchestrate(const CommandContext& ctx);

    // new for augmented-human focus
    static AgentEnvelope handleOrchestrateAugmented(const AugmentedCommandContext& ctx);

private:
    static std::string nowIso();
};

} // namespace javaspectre
