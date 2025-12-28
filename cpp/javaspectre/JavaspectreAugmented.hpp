// cpp/javaspectre/JavaspectreAugmented.hpp
#pragma once
#include "JavaspectreAgent.hpp"
#include <cstdint>

namespace javaspectre {

struct CitizenSafetyVector {
    // AU.ET / CSP are internal, read from ALN ledger (not mutated here).
    double ecompute;      // compute load quota snapshot
    double ebio;          // bio-interface load snapshot
    double erisk;         // risk budget snapshot
    double dion_nsv;      // ionizing dose, nSv window
    double sar_mwkg;      // RF SAR, mW/kg
    double jtissue_mam2;  // induced current density, mA/m^2
};

struct CitizenContext {
    std::string citizenId;     // ALN / FIDO2 identity
    std::string vnodePath;     // e.g. "vnodeaugcitizensimhub" or home pod
    std::string regionProfile; // "ICNIRP_EU", "FCC_US", etc.
    bool medicalMode{false};   // stricter caps if true
};

// Augmented-human capability envelope supplied by ALN/CEM runtime.
struct CitizenEnvelope {
    CitizenContext ctx;
    CitizenSafetyVector safety;
    // Hash-reference to ALN-side state: AU.ET/CSP, epoch hash, etc.
    std::string energyEpochHash;
};

} // namespace javaspectre
