// src/chat/JavaspectreCommandBlock.cpp
// Javaspectre Command Block for C++ Chat Integration
// © 2025 Perplexity Labs Inc. / Dr. Jacob S. Farmer

#include <string>
#include <string_view>
#include <unordered_map>
#include <functional>
#include <vector>
#include <chrono>
#include <random>
#include <sstream>
#include <iomanip>
#include <optional>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// ---------- Core types ----------

struct ChatCommandContext {
    std::string input;
    std::vector<std::string> args;
    std::string userId;
    std::string sessionId;
    json metadata;
};

using CommandHandler = std::function<json(const ChatCommandContext&)>;

class ChatInterface {
public:
    virtual ~ChatInterface() = default;
    virtual void registerCommand(const std::string& trigger, CommandHandler handler) = 0;
    virtual void log(const std::string& message, const json& meta = json::object()) = 0;
};

// ---------- Utility functions ----------

static std::string nowIso() {
    using namespace std::chrono;
    const auto now = system_clock::now();
    const auto tt  = system_clock::to_time_t(now);
    std::tm tm{};
#if defined(_WIN32)
    gmtime_s(&tm, &tt);
#else
    gmtime_r(&tt, &tm);
#endif
    std::ostringstream oss;
    oss << std::put_time(&tm, "%Y-%m-%dT%H:%M:%SZ");
    return oss.str();
}

static std::string createTraceId() {
    using namespace std::chrono;
    const auto now = system_clock::now().time_since_epoch();
    const auto ms  = duration_cast<milliseconds>(now).count();
    std::mt19937_64 rng(static_cast<std::mt19937_64::result_type>(ms));
    std::uniform_int_distribution<uint64_t> dist;
    const uint64_t r = dist(rng);

    std::ostringstream oss;
    oss << "jsp-" << std::hex << ms << "-" << (r & 0xFFFFFFull);
    return oss.str();
}

static void safeLog(ChatInterface* chat, const std::string& message, const json& meta = json::object()) {
    if (chat) {
        chat->log(message, meta);
    }
}

// ---------- Risk classification ----------

struct RiskClassification {
    bool cognitiveHazard{false};
    bool entropyAnomaly{false};
    bool ontologicalInstability{false};
    std::vector<json> signals;
};

class ALNRiskClassifier {
public:
    RiskClassification classify(std::string_view input, const json& meta) const {
        const std::string textLower = toLower(std::string(input));

        const std::vector<std::string> cognitiveHazardKeywords{
            "forbidden", "memetic", "cursed", "anomalous cognition"
        };
        const std::vector<std::string> entropyKeywords{
            "random stream", "noise", "entropy source", "unstable log"
        };
        const std::vector<std::string> ontologicalKeywords{
            "reality rewrite", "self-erasure", "identity collapse", "ontology loop"
        };

        RiskClassification rc;

        if (containsAny(textLower, cognitiveHazardKeywords)) {
            rc.cognitiveHazard = true;
            rc.signals.push_back(json{
                {"type", "cognitive-hazard-indicator"},
                {"reason", "Detected memetic/forbidden semantics in input text."},
                {"weight", 0.9}
            });
        }

        if (containsAny(textLower, entropyKeywords)) {
            rc.entropyAnomaly = true;
            rc.signals.push_back(json{
                {"type", "entropy-anomaly-indicator"},
                {"reason", "Detected references to entropy/noise sources."},
                {"weight", 0.7}
            });
        }

        if (containsAny(textLower, ontologicalKeywords)) {
            rc.ontologicalInstability = true;
            rc.signals.push_back(json{
                {"type", "ontological-instability-indicator"},
                {"reason", "Detected ontology/identity destabilizing language."},
                {"weight", 0.85}
            });
        }

        if (meta.contains("layer") && meta["layer"] == "deep-excavation") {
            rc.signals.push_back(json{
                {"type", "deep-excavation-context"},
                {"reason", "Context flagged as deep-excavation; raising review priority."},
                {"weight", 0.4}
            });
        }

        return rc;
    }

private:
    static std::string toLower(std::string s) {
        for (auto& ch : s) {
            ch = static_cast<char>(::tolower(static_cast<unsigned char>(ch)));
        }
        return s;
    }

    static bool containsAny(const std::string& text, const std::vector<std::string>& words) {
        for (const auto& w : words) {
            if (text.find(w) != std::string::npos) {
                return true;
            }
        }
        return false;
    }
};

// ---------- Synthesis result ----------

struct SynthesisResult {
    std::string blueprint;
    std::string integrationPotential; // "Low" | "Medium" | "High" | "Unknown"
    bool complianceAnchor{true};
};

// ---------- JavaspectreCommandBlock ----------

class JavaspectreCommandBlock {
public:
    explicit JavaspectreCommandBlock(ChatInterface* chat = nullptr)
        : chatInterface_(chat), version_("1.0.0") {
        if (chatInterface_) {
            init(chatInterface_);
        }
    }

    void init(ChatInterface* chat) {
        chatInterface_ = chat;
        safeLog(chatInterface_, "Command Block Initialized.", {
            {"module", name_},
            {"version", version_}
        });
        attachCommands();
    }

private:
    std::string name_{"JavaspectreCommandBlock"};
    std::string version_;
    bool active_{true};
    ChatInterface* chatInterface_{nullptr};
    ALNRiskClassifier riskClassifier_{};

    void attachCommands() {
        if (!chatInterface_) {
            throw std::runtime_error("[Javaspectre] Cannot attach commands before initialization.");
        }

        registerCommand("/excavate", [this](const ChatCommandContext& ctx) {
            return runExcavation(ctx);
        });

        registerCommand("/spectral-scan", [this](const ChatCommandContext& ctx) {
            return runSpectralScan(ctx);
        });

        registerCommand("/classify", [this](const ChatCommandContext& ctx) {
            return runClassification(ctx);
        });

        registerCommand("/synthesize", [this](const ChatCommandContext& ctx) {
            return runSynthesis(ctx);
        });

        safeLog(chatInterface_, "Commands registered.", {
            {"commands", json::array({"/excavate", "/spectral-scan", "/classify", "/synthesize"})}
        });
    }

    void registerCommand(const std::string& trigger, CommandHandler handler) {
        chatInterface_->registerCommand(trigger, std::move(handler));
    }

    // ----- Standardized envelope -----

    json outputEnvelope(
        const json& data,
        const std::string& title,
        const std::string& command,
        const ChatCommandContext& ctx,
        const std::optional<std::string>& layer = std::nullopt
    ) const {
        json meta{
            {"version", version_},
            {"command", command},
            {"userId", ctx.userId},
            {"sessionId", ctx.sessionId},
            {"traceId", createTraceId()}
        };
        if (layer.has_value()) {
            meta["layer"] = *layer;
        }

        json envelope{
            {"title", title},
            {"timestamp", nowIso()},
            {"system", "Javaspectre Command Block (C++)"},
            {"data", data},
            {"meta", meta}
        };
        return envelope;
    }

    // ----- Command handlers -----

    json runExcavation(const ChatCommandContext& ctx) const {
        const std::string layer = ctx.args.empty() ? "default" : ctx.args.front();

        // Placeholder for actual excavation engine integration.
        json coreResult{
            {"layer", layer},
            {"status", "ok"},
            {"notes", "Integrate with C++ native VirtualObjectExcavator or bridge to JS/ALN layer."}
        };

        // Best-effort JSON parse of input to support deep virtual-object excavation.
        json parsed = json::object();
        if (!ctx.input.empty()) {
            try {
                parsed = json::parse(ctx.input);
            } catch (...) {
                parsed = json{
                    {"status", "skipped"},
                    {"reason", "Input is not valid JSON; deep excavation not performed."}
                };
            }
        }

        json data{
            {"layer", layer},
            {"coreExcavation", coreResult},
            {"virtualObjectInput", parsed}
        };

        return outputEnvelope(data, "Excavation Report", "/excavate", ctx, layer);
    }

    json runSpectralScan(const ChatCommandContext& ctx) const {
        const std::string trimmed = trim(ctx.input);

        if (trimmed.empty()) {
            json data{{"error", "No input provided for spectral scan."}};
            return outputEnvelope(data, "Spectral Scan Error", "/spectral-scan", ctx);
        }

        // Minimal semantic + structural hints; extend with full ALN scan pipeline.
        json scan{
            {"length", trimmed.size()},
            {"hasJsonBraces", trimmed.find('{') != std::string::npos},
            {"hasCodeLikeTokens", trimmed.find("class ") != std::string::npos ||
                                  trimmed.find("function ") != std::string::npos},
            {"preview", trimmed.substr(0, std::min<size_t>(80, trimmed.size()))}
        };

        json data{
            {"scan", scan},
            {"capabilityHints", json::array({"spectral-analysis", "structure-detection"})}
        };

        return outputEnvelope(data, "Spectral Scan Output", "/spectral-scan", ctx);
    }

    json runClassification(const ChatCommandContext& ctx) const {
        const std::string trimmed = trim(ctx.input);
        json meta = ctx.metadata;
        if (meta.is_null()) {
            meta = json::object();
        }
        if (!ctx.args.empty()) {
            meta["layer"] = ctx.args.front();
        }

        const auto rc = riskClassifier_.classify(trimmed, meta);

        json data{
            {"cognitiveHazard", rc.cognitiveHazard},
            {"entropyAnomaly", rc.entropyAnomaly},
            {"ontologicalInstability", rc.ontologicalInstability},
            {"signals", rc.signals}
        };

        return outputEnvelope(data, "Risk & Anomaly Classification", "/classify", ctx);
    }

    json runSynthesis(const ChatCommandContext& ctx) const {
        const std::string trimmed = trim(ctx.input);

        SynthesisResult sr;
        if (!trimmed.empty()) {
            sr.blueprint = "Blueprint constructed for: " + trimmed;
            sr.integrationPotential = "High";
            sr.complianceAnchor = true;
        } else {
            sr.blueprint = "Blueprint constructed for: <empty-input>";
            sr.integrationPotential = "Unknown";
            sr.complianceAnchor = true;
        }

        json data{
            {"blueprint", sr.blueprint},
            {"integrationPotential", sr.integrationPotential},
            {"complianceAnchor", sr.complianceAnchor}
        };

        return outputEnvelope(data, "Synthesis Protocol", "/synthesize", ctx);
    }

    // ----- Helpers -----

    static std::string trim(const std::string& s) {
        if (s.empty()) return s;
        std::size_t start = 0;
        while (start < s.size() && std::isspace(static_cast<unsigned char>(s[start]))) {
            ++start;
        }
        if (start == s.size()) return std::string();
        std::size_t end = s.size() - 1;
        while (end > start && std::isspace(static_cast<unsigned char>(s[end]))) {
            --end;
        }
        return s.substr(start, end - start + 1);
    }
};
