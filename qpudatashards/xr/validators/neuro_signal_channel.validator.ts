// qpudatashards/xr/validators/neuro_signal_channel.validator.ts
// High-assurance runtime validation and policy checks for NeuroSignalChannel.
//
// - Uses Ajv with JSON Schema draft 2020-12. [web:44][web:55]
// - Exposes a type-safe validateNeuroSignalChannel() function (type guard).
// - Adds neurorights and consent sanity checks on top of pure schema validation. [web:40][web:48]

import Ajv, { DefinedError } from "ajv";
import addFormats from "ajv-formats";
import { NeuroSignalChannel } from "../types/neuro_signal_channel.types.js";
import neuroSignalChannelSchema from "../schemas/neuro_signal_channel.schema.json" assert { type: "json" };

// --- AJV INITIALIZATION (draft 2020-12) -------------------------------------

// Ajv v8+ supports draft-2020-12 via explicit options. [web:44][web:55]
const ajv = new Ajv({
  strict: true,
  allErrors: true,
  allowUnionTypes: true,
  $data: true
});

addFormats(ajv);

// Compile validator once and reuse for maximum performance. [web:50]
const validateSchema = ajv.compile<NeuroSignalChannel>(neuroSignalChannelSchema);

// --- ERROR MODEL -----------------------------------------------------------

export interface NeuroSignalValidationIssue {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  message: string;
}

export interface NeuroSignalValidationResult {
  ok: boolean;
  errors: NeuroSignalValidationIssue[];
}

/**
 * Convert Ajv errors into a compact, human/audit-friendly structure.
 */
function normalizeAjvErrors(errors: DefinedError[] | null | undefined): NeuroSignalValidationIssue[] {
  if (!errors || errors.length === 0) return [];
  return errors.map((err) => ({
    instancePath: err.instancePath || "",
    schemaPath: err.schemaPath || "",
    keyword: err.keyword,
    message: err.message || "Validation error"
  }));
}

// --- POLICY & NEURORIGHTS CHECKS -------------------------------------------

/**
 * Neurorights-level policy checks that go beyond raw JSON Schema validation.
 * For example, prohibiting ad-targeting purposes or disallowing unsafe
 * sharing scopes for high-risk channels. [web:40][web:48][web:57]
 */
function runNeurorightsPolicyChecks(channel: NeuroSignalChannel): NeuroSignalValidationIssue[] {
  const issues: NeuroSignalValidationIssue[] = [];

  // 1. Prohibit ad-targeting or similar invasive purposes.
  const lowerPurpose = channel.purpose.toLowerCase();
  if (lowerPurpose.includes("ad-target") || lowerPurpose.includes("advertising")) {
    issues.push({
      instancePath: "/purpose",
      schemaPath: "neurorights-policy/purpose",
      keyword: "neurorights",
      message: "Advertising and ad-targeting are disallowed purposes for NeuroSignalChannel."
    });
  }

  // 2. If risk_level is high or critical, require anonymization and encryption. [web:37][web:40]
  if (channel.risk_level === "high" || channel.risk_level === "critical") {
    if (channel.anonymization_required === false) {
      issues.push({
        instancePath: "/anonymization_required",
        schemaPath: "neurorights-policy/anonymization",
        keyword: "neurorights",
        message: "High/critical risk channels must require anonymization or strong pseudonymization."
      });
    }
    const sec = channel.data_security;
    if (!sec || !sec.encryption_at_rest || !sec.encryption_in_transit) {
      issues.push({
        instancePath: "/data_security",
        schemaPath: "neurorights-policy/encryption",
        keyword: "neurorights",
        message: "High/critical risk channels must enable encryption at rest and in transit."
      });
    }
  }

  // 3. Mental privacy: if neurorights_tags includes mental_privacy, restrict sharing scope. [web:17][web:40]
  if (channel.neurorights_tags.includes("mental_privacy")) {
    const scope = channel.consent_requirements.data_sharing_scope;
    if (scope === "city_local_encrypted" || scope === "research_aggregated_only") {
      // allowed, but research should be aggregated
      // additional check: no_sharing or research_aggregated_only are preferred for EEG-like modalities
      if (
        channel.modality === "EEG" ||
        channel.modality === "fNIRS" ||
        channel.modality === "optical"
      ) {
        if (scope !== "no_sharing" && scope !== "research_aggregated_only") {
          issues.push({
            instancePath: "/consent_requirements/data_sharing_scope",
            schemaPath: "neurorights-policy/mental_privacy_scope",
            keyword: "neurorights",
            message:
              "For high-privacy modalities (EEG/fNIRS/optical) with mental_privacy, sharing should be 'no_sharing' or 'research_aggregated_only'."
          });
        }
      }
    }
  }

  // 4. Multi-party consent sanity: if multi_party=true, require a group or guardian/ethics consent type.
  if (channel.consent_requirements.multi_party) {
    const ct = channel.consent_requirements.consent_type;
    const allowed = [
      "guardian_explicit",
      "group_explicit",
      "research_ethics_committee"
    ];
    if (!allowed.includes(ct)) {
      issues.push({
        instancePath: "/consent_requirements/consent_type",
        schemaPath: "neurorights-policy/multi_party",
        keyword: "neurorights",
        message:
          "Multi-party consent requires guardian_explicit, group_explicit, or research_ethics_committee consent_type."
      });
    }
  }

  // 5. Retention bounds: encourage tighter retention for high-risk channels.
  if (channel.retention_days !== undefined) {
    if (channel.risk_level === "high" || channel.risk_level === "critical") {
      if (channel.retention_days > 365) {
        issues.push({
          instancePath: "/retention_days",
          schemaPath: "neurorights-policy/retention",
          keyword: "neurorights",
          message:
            "High/critical risk channels should not retain data for more than 365 days without exceptional justification."
        });
      }
    }
  }

  return issues;
}

// --- PUBLIC API ------------------------------------------------------------

/**
 * Validate a NeuroSignalChannel object against JSON Schema and high-level
 * neurorights/privacy/consent policies.
 *
 * Returns a rich result object and acts as a TypeScript type-guard.
 */
export function validateNeuroSignalChannel(
  data: unknown
): data is NeuroSignalChannel {
  const valid = validateSchema(data as NeuroSignalChannel);
  if (!valid) {
    return false;
  }

  // Run neurorights policy checks on top of schema validation.
  const policyIssues = runNeurorightsPolicyChecks(data as NeuroSignalChannel);
  return policyIssues.length === 0;
}

/**
 * Validate and return structured error information suitable for logs,
 * audits, or XR runtime dashboards.
 */
export function validateNeuroSignalChannelDetailed(
  data: unknown
): NeuroSignalValidationResult {
  const schemaValid = validateSchema(data as NeuroSignalChannel);
  const schemaErrors = normalizeAjvErrors(
    (validateSchema.errors as DefinedError[]) || []
  );

  if (!schemaValid) {
    return {
      ok: false,
      errors: schemaErrors
    };
  }

  const policyIssues = runNeurorightsPolicyChecks(data as NeuroSignalChannel);
  if (policyIssues.length > 0) {
    return {
      ok: false,
      errors: policyIssues
    };
  }

  return {
    ok: true,
    errors: []
  };
}
