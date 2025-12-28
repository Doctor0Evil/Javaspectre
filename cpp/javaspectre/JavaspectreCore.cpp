// cpp/javaspectre/JavaspectreCore.cpp
#include "JavaspectreCore.hpp"
#include <sstream>
#include <iomanip>
#include <chrono>
#include <ctime>
#include <set>
#include <openssl/sha.h> // or replace with your own hashing

namespace javaspectre {

HazardOutput HazardEngine::evaluate(const HazardInput& input) {
    double score =
        input.entropy * 0.4 +
        input.semanticDensity * 0.3 +
        input.recursionDepth * 0.2 +
        input.identityVariance * 0.1;

    HazardOutput out;
    out.score = score;
    out.cognitiveHazard = score > 0.65;
    out.entropyAnomaly = input.entropy > 0.75;
    out.ontologicalInstability = input.identityVariance > 0.6;
    return out;
}

std::string SpectralFingerprint::generate(const std::string& json) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256(reinterpret_cast<const unsigned char*>(json.c_str()), json.size(), hash);

    std::ostringstream oss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
        oss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    return oss.str();
}

SchemaValidationResult ObjectSchemaValidator::validate(const std::map<std::string, std::string>& obj) {
    SchemaValidationResult result;
    if (obj.empty()) {
        result.errors.push_back("Object is empty.");
    }
    if (!obj.contains("type")) {
        result.errors.push_back("Missing required field: type.");
    }
    if (!obj.contains("metadata")) {
        result.errors.push_back("Missing required field: metadata.");
    }
    result.valid = result.errors.empty();
    return result;
}

std::map<std::string, std::string> ComplianceAnchor::attach(
    const std::map<std::string, std::string>& obj,
    const std::string& source) {

    auto copy = obj;

    auto now = std::chrono::system_clock::now();
    auto time_t_now = std::chrono::system_clock::to_time_t(now);
    std::ostringstream ts;
    ts << std::put_time(std::gmtime(&time_t_now), "%FT%TZ");

    copy["compliance.source"] = source;
    copy["compliance.timestamp"] = ts.str();
    copy["compliance.rights"] = "Perplexity Labs Inc. — All contributions attributed.";

    return copy;
}

double SemanticDensity::measure(const std::string& text) {
    if (text.empty()) return 0.0;

    std::istringstream iss(text);
    std::vector<std::string> tokens;
    std::string token;
    while (iss >> token) {
        tokens.push_back(token);
    }
    if (tokens.empty()) return 0.0;

    std::set<std::string> unique(tokens.begin(), tokens.end());
    return static_cast<double>(unique.size()) / static_cast<double>(tokens.size());
}

LogEntry Logger::log(const std::string& event, const std::string& data) {
    auto now = std::chrono::system_clock::now();
    auto time_t_now = std::chrono::system_clock::to_time_t(now);
    std::ostringstream ts;
    ts << std::put_time(std::gmtime(&time_t_now), "%FT%TZ");

    LogEntry entry;
    entry.event = event;
    entry.data = data;
    entry.timestamp = ts.str();
    return entry;
}

std::vector<std::string> NegativeSpaceScanner::scan(
    const std::map<std::string, std::vector<std::optional<std::string>>>& structure) {

    std::vector<std::string> missing;

    auto it = structure.find("children");
    if (it == structure.end()) {
        missing.emplace_back("Missing children collection.");
        return missing;
    }

    const auto& children = it->second;
    for (size_t i = 0; i < children.size(); ++i) {
        if (!children[i].has_value()) {
            std::ostringstream msg;
            msg << "Child at index " << i << " is null or undefined.";
            missing.push_back(msg.str());
        }
    }

    return missing;
}

std::vector<int> ResonanceMap::map(const std::string& input) {
    std::vector<int> out;
    out.reserve(input.size());
    for (char c : input) {
        out.push_back(static_cast<int>(c) % 17);
    }
    return out;
}

} // namespace javaspectre
