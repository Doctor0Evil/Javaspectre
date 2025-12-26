// Path: src/phone/PhoneCountryCodeResolver.js

// -----------------------------------------------------------------------------
// PhoneCountryCodeResolver
// -----------------------------------------------------------------------------
// A heavily enriched, production-focused utility for:
// - Normalizing raw phone inputs into E.164-like formats
// - Resolving country (ISO-3166-1 alpha-2) from dial code
// - Deriving calculated properties (countryCode, dialCode, nationalNumber, e164)
// - Providing metadata for analytics, quality checks, and CRM integration
//
// Design goals:
// - Pure functions, no external dependencies
// - Deterministic, testable behavior
// - Defensive against malformed inputs
// - Easy extension via DIALED_PREFIXES and region helpers
// -----------------------------------------------------------------------------

// Extended dialing code dataset (non-exhaustive, but much richer).
// Sorted longest-first by dialCode length so overlapping prefixes are handled safely.
const DIALED_PREFIXES = [
  // NANP region (North America)
  { countryCode: "US", dialCode: "+1", region: "NANP" },
  { countryCode: "CA", dialCode: "+1", region: "NANP" },
  { countryCode: "AG", dialCode: "+1-268", region: "NANP" },
  { countryCode: "AI", dialCode: "+1-264", region: "NANP" },
  { countryCode: "BB", dialCode: "+1-246", region: "NANP" },
  { countryCode: "BM", dialCode: "+1-441", region: "NANP" },
  { countryCode: "BS", dialCode: "+1-242", region: "NANP" },
  { countryCode: "DM", dialCode: "+1-767", region: "NANP" },
  { countryCode: "DO", dialCode: "+1-809", region: "NANP" },
  { countryCode: "GD", dialCode: "+1-473", region: "NANP" },
  { countryCode: "GU", dialCode: "+1-671", region: "NANP" },
  { countryCode: "JM", dialCode: "+1-876", region: "NANP" },
  { countryCode: "KN", dialCode: "+1-869", region: "NANP" },
  { countryCode: "KY", dialCode: "+1-345", region: "NANP" },
  { countryCode: "LC", dialCode: "+1-758", region: "NANP" },
  { countryCode: "MP", dialCode: "+1-670", region: "NANP" },
  { countryCode: "MS", dialCode: "+1-664", region: "NANP" },
  { countryCode: "PR", dialCode: "+1-787", region: "NANP" },
  { countryCode: "TT", dialCode: "+1-868", region: "NANP" },
  { countryCode: "VC", dialCode: "+1-784", region: "NANP" },
  { countryCode: "VG", dialCode: "+1-284", region: "NANP" },
  { countryCode: "VI", dialCode: "+1-340", region: "NANP" },

  // Europe major
  { countryCode: "GB", dialCode: "+44", region: "EU" },
  { countryCode: "FR", dialCode: "+33", region: "EU" },
  { countryCode: "DE", dialCode: "+49", region: "EU" },
  { countryCode: "IT", dialCode: "+39", region: "EU" },
  { countryCode: "ES", dialCode: "+34", region: "EU" },
  { countryCode: "NL", dialCode: "+31", region: "EU" },
  { countryCode: "BE", dialCode: "+32", region: "EU" },
  { countryCode: "CH", dialCode: "+41", region: "EU" },
  { countryCode: "SE", dialCode: "+46", region: "EU" },
  { countryCode: "NO", dialCode: "+47", region: "EU" },
  { countryCode: "DK", dialCode: "+45", region: "EU" },
  { countryCode: "PT", dialCode: "+351", region: "EU" },
  { countryCode: "IE", dialCode: "+353", region: "EU" },
  { countryCode: "FI", dialCode: "+358", region: "EU" },
  { countryCode: "PL", dialCode: "+48", region: "EU" },
  { countryCode: "CZ", dialCode: "+420", region: "EU" },
  { countryCode: "AT", dialCode: "+43", region: "EU" },

  // CIS
  { countryCode: "RU", dialCode: "+7", region: "CIS" },
  { countryCode: "KZ", dialCode: "+7", region: "CIS" },

  // Asia & Pacific
  { countryCode: "CN", dialCode: "+86", region: "APAC" },
  { countryCode: "IN", dialCode: "+91", region: "APAC" },
  { countryCode: "JP", dialCode: "+81", region: "APAC" },
  { countryCode: "KR", dialCode: "+82", region: "APAC" },
  { countryCode: "HK", dialCode: "+852", region: "APAC" },
  { countryCode: "SG", dialCode: "+65", region: "APAC" },
  { countryCode: "AU", dialCode: "+61", region: "APAC" },
  { countryCode: "NZ", dialCode: "+64", region: "APAC" },
  { countryCode: "TH", dialCode: "+66", region: "APAC" },
  { countryCode: "MY", dialCode: "+60", region: "APAC" },
  { countryCode: "PH", dialCode: "+63", region: "APAC" },
  { countryCode: "ID", dialCode: "+62", region: "APAC" },

  // Latin America
  { countryCode: "BR", dialCode: "+55", region: "LATAM" },
  { countryCode: "MX", dialCode: "+52", region: "LATAM" },
  { countryCode: "AR", dialCode: "+54", region: "LATAM" },
  { countryCode: "CL", dialCode: "+56", region: "LATAM" },
  { countryCode: "CO", dialCode: "+57", region: "LATAM" },
  { countryCode: "PE", dialCode: "+51", region: "LATAM" },
  { countryCode: "UY", dialCode: "+598", region: "LATAM" },
  { countryCode: "PY", dialCode: "+595", region: "LATAM" },
  { countryCode: "VE", dialCode: "+58", region: "LATAM" },

  // Africa & Middle East
  { countryCode: "ZA", dialCode: "+27", region: "AFRICA" },
  { countryCode: "NG", dialCode: "+234", region: "AFRICA" },
  { countryCode: "EG", dialCode: "+20", region: "AFRICA" },
  { countryCode: "KE", dialCode: "+254", region: "AFRICA" },
  { countryCode: "TZ", dialCode: "+255", region: "AFRICA" },
  { countryCode: "MA", dialCode: "+212", region: "AFRICA" },
  { countryCode: "SA", dialCode: "+966", region: "MENA" },
  { countryCode: "AE", dialCode: "+971", region: "MENA" },
  { countryCode: "IL", dialCode: "+972", region: "MENA" },
  { countryCode: "TR", dialCode: "+90", region: "MENA" }
];

// Pre-sort by dialCode length descending to ensure longest-prefix-first matching.
const SORTED_DIALED_PREFIXES = DIALED_PREFIXES.slice().sort((a, b) => {
  const aDigits = a.dialCode.replace(/[^\d]/g, "");
  const bDigits = b.dialCode.replace(/[^\d]/g, "");
  return bDigits.length - aDigits.length;
});

// -----------------------------------------------------------------------------
// Utility helpers
// -----------------------------------------------------------------------------

// Remove everything except digits.
function stripNonDigits(value) {
  return String(value).replace(/[^\d]/g, "");
}

// Remove everything except digits and "+" (keep first "+").
function normalizePlusAndDigits(value) {
  const trimmed = String(value).trim();
  if (!trimmed) return "";

  let result = "";
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (ch === "+") {
      if (!result.includes("+")) {
        result += ch;
      }
    } else if (ch >= "0" && ch <= "9") {
      result += ch;
    }
  }
  return result;
}

// Validates that a normalized phone string is plausibly E.164-like:
// - Starts with "+"
// - Contains 8–15 digits total (ITU E.164 guideline range)
export function isPlausibleE164(normalized) {
  if (typeof normalized !== "string" || !normalized.startsWith("+")) {
    return false;
  }
  const digits = stripNonDigits(normalized);
  const length = digits.length;
  return length >= 8 && length <= 15;
}

// -----------------------------------------------------------------------------
// Normalization
// -----------------------------------------------------------------------------

// Normalizes a raw input into a compact international-looking string.
// Examples:
//  " (213) 373-4253 "   -> "+12133734253" if defaultDialCode="+1"
//  "+44 20 7946 0018"   -> "+442079460018"
//  "020 7946 0018"      -> "+442079460018" if defaultDialCode="+44"
export function normalizePhoneInput(raw, defaultDialCode = null) {
  if (raw == null) return "";

  const trimmed = String(raw).trim();
  if (!trimmed) return "";

  // If already contains "+", keep "+" and digits only.
  if (trimmed.includes("+")) {
    const plusDigits = normalizePlusAndDigits(trimmed);
    return plusDigits || "";
  }

  // No "+" present: treat as national and inject defaultDialCode if provided.
  const digitsOnly = stripNonDigits(trimmed);
  if (!digitsOnly) return "";

  if (defaultDialCode && String(defaultDialCode).startsWith("+")) {
    const countryDigits = stripNonDigits(defaultDialCode);
    const combined = `+${countryDigits}${digitsOnly}`;
    return combined;
  }

  // Fallback: best-effort E.164 if value looks like leading country code.
  // If value starts with "00", convert to "+" (common international prefix).
  if (digitsOnly.startsWith("00")) {
    return `+${digitsOnly.slice(2)}`;
  }

  // Final fallback: just digits, no plus.
  return digitsOnly;
}

// -----------------------------------------------------------------------------
// Resolution & metadata
// -----------------------------------------------------------------------------

// Resolve dialing metadata (countryCode + dialCode + nationalNumber + region).
// Returns null if no plausible international prefix is found.
export function resolvePhoneCountry(raw, { defaultDialCode = null } = {}) {
  const normalized = normalizePhoneInput(raw, defaultDialCode);

  if (!normalized) {
    return null;
  }

  // Require "+" to consider it international/E.164-like.
  if (!normalized.startsWith("+")) {
    return null;
  }

  const normalizedDigits = stripNonDigits(normalized);
  if (!normalizedDigits) {
    return null;
  }

  let bestMatch = null;

  for (const entry of SORTED_DIALED_PREFIXES) {
    // Compare with a digits-only version of the dial code.
    const dialDigits = stripNonDigits(entry.dialCode);
    const candidate = `+${dialDigits}`;
    if (normalized.startsWith(candidate)) {
      if (
        !bestMatch ||
        dialDigits.length > stripNonDigits(bestMatch.dialCode).length
      ) {
        bestMatch = entry;
      }
    }
  }

  if (!bestMatch) {
    return {
      countryCode: null,
      dialCode: null,
      region: null,
      nationalNumber: normalizedDigits,
      e164: `+${normalizedDigits}`,
      normalized,
      plausibleE164: isPlausibleE164(normalized),
      source: "unmappedPrefix"
    };
  }

  const bestDialDigits = stripNonDigits(bestMatch.dialCode);
  const nationalNumber = normalizedDigits.slice(bestDialDigits.length);
  const e164 = `+${normalizedDigits}`;

  return {
    countryCode: bestMatch.countryCode,
    dialCode: `+${bestDialDigits}`,
    region: bestMatch.region || null,
    nationalNumber,
    e164,
    normalized,
    plausibleE164: isPlausibleE164(e164),
    source: "matchedPrefix"
  };
}

// Convenience function: returns just the country code (e.g. "US") or null.
export function getPhoneCountryCode(raw, options = {}) {
  const resolved = resolvePhoneCountry(raw, options);
  return resolved ? resolved.countryCode : null;
}

// Convenience function: returns just the dial code (e.g. "+1") or null.
export function getPhoneDialCode(raw, options = {}) {
  const resolved = resolvePhoneCountry(raw, options);
  return resolved ? resolved.dialCode : null;
}

// Returns a normalized E.164 representation or null if not plausible.
export function getE164(raw, options = {}) {
  const resolved = resolvePhoneCountry(raw, options);
  if (!resolved || !resolved.plausibleE164) {
    return null;
  }
  return resolved.e164;
}

// Example aggregation for analytics/CRM-like systems.
// Adds region, plausibility, and classification hints.
export function getCalculatedPhoneCountryProperty(raw, options = {}) {
  const result = resolvePhoneCountry(raw, options);
  if (!result) {
    return {
      countryCode: null,
      dialCode: null,
      region: null,
      nationalNumber: null,
      e164: null,
      normalized: null,
      plausibleE164: false,
      source: "unresolved"
    };
  }
  return result;
}

// -----------------------------------------------------------------------------
// Quality checks & classifications
// -----------------------------------------------------------------------------

// Detects whether the phone looks like it might be a test/placeholder number.
// This is heuristic, not authoritative.
export function isLikelyTestNumber(raw) {
  if (!raw && raw !== 0) return false;
  const digits = stripNonDigits(raw);

  if (!digits) return false;

  // 555 prefix is heavily used for fictional numbers in NANP.
  if (digits.startsWith("555")) return true;

  // Repeated same digit (e.g., "11111111") up to a certain length.
  if (/^(\d)\1{5,}$/.test(digits)) return true;

  return false;
}

// Returns a coarse-grained classification for analytics dashboards.
export function classifyPhoneNumber(raw, options = {}) {
  const meta = getCalculatedPhoneCountryProperty(raw, options);

  if (!meta.e164) {
    return {
      classification: "invalid_or_unresolved",
      meta
    };
  }

  if (!meta.plausibleE164) {
    return {
      classification: "implausible_e164",
      meta
    };
  }

  if (isLikelyTestNumber(raw)) {
    return {
      classification: "likely_test_number",
      meta
    };
  }

  return {
    classification: "valid_like",
    meta
  };
}

// -----------------------------------------------------------------------------
// Region-based helpers
// -----------------------------------------------------------------------------

export function isNANP(raw, options = {}) {
  const resolved = resolvePhoneCountry(raw, options);
  return resolved ? resolved.region === "NANP" : false;
}

export function isEU(raw, options = {}) {
  const resolved = resolvePhoneCountry(raw, options);
  return resolved ? resolved.region === "EU" : false;
}

export function isAPAC(raw, options = {}) {
  const resolved = resolvePhoneCountry(raw, options);
  return resolved ? resolved.region === "APAC" : false;
}

export function isLATAM(raw, options = {}) {
  const resolved = resolvePhoneCountry(raw, options);
  return resolved ? resolved.region === "LATAM" : false;
}

export function isMENA(raw, options = {}) {
  const resolved = resolvePhoneCountry(raw, options);
  return resolved ? resolved.region === "MENA" : false;
}

export function isAfrica(raw, options = {}) {
  const resolved = resolvePhoneCountry(raw, options);
  return resolved ? resolved.region === "AFRICA" : false;
}

// -----------------------------------------------------------------------------
// Export aggregate
// -----------------------------------------------------------------------------

const PhoneCountryCodeResolver = {
  DIALED_PREFIXES,
  normalizePhoneInput,
  resolvePhoneCountry,
  getPhoneCountryCode,
  getPhoneDialCode,
  getE164,
  getCalculatedPhoneCountryProperty,
  isPlausibleE164,
  isLikelyTestNumber,
  classifyPhoneNumber,
  isNANP,
  isEU,
  isAPAC,
  isLATAM,
  isMENA,
  isAfrica
};

export default PhoneCountryCodeResolver;
