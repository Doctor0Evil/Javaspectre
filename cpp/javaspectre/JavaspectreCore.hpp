// cpp/javaspectre/JavaspectreCore.hpp
#pragma once
#include <string>
#include <vector>
#include <map>
#include <optional>

namespace javaspectre {

struct HazardInput {
    double entropy{};
    double semanticDensity{};
    double recursionDepth{};
    double identityVariance{};
};

struct HazardOutput {
    bool cognitiveHazard{};
    bool entropyAnomaly{};
    bool ontologicalInstability{};
    double score{};
};

class HazardEngine {
public:
    static HazardOutput evaluate(const HazardInput& input);
};

class SpectralFingerprint {
public:
    static std::string generate(const std::string& json);
};

struct SchemaValidationResult {
    bool valid{false};
    std::vector<std::string> errors;
};

class ObjectSchemaValidator {
public:
    static SchemaValidationResult validate(const std::map<std::string, std::string>& obj);
};

struct ComplianceInfo {
    std::string source;
    std::string timestamp;
    std::string rights;
};

class ComplianceAnchor {
public:
    static std::map<std::string, std::string> attach(
        const std::map<std::string, std::string>& obj,
        const std::string& source);
};

class SemanticDensity {
public:
    static double measure(const std::string& text);
};

struct LogEntry {
    std::string event;
    std::string data;
    std::string timestamp;
    std::string system{"Javaspectre"};
};

class Logger {
public:
    static LogEntry log(const std::string& event, const std::string& data = "");
};

class NegativeSpaceScanner {
public:
    static std::vector<std::string> scan(const std::map<std::string, std::vector<std::optional<std::string>>>& structure);
};

class ResonanceMap {
public:
    static std::vector<int> map(const std::string& input);
};

} // namespace javaspectre
