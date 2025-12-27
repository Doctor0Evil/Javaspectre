// qpudatashards/xr/xr_neuro_openxr_profile_generator.js
// Companion generator for XRNeuroObjectForgeGrid – emits OpenXR-ready JSON
// profiles, NeuroSignalChannel schema, consent flows, and CTS-style tests.

import { XRNeuroObjectForgeGrid } from "./xr_neuroobjectforge_grid.js";

/**
 * 1. Generate an OpenXR-style runtime/profile JSON
 *    for NeuroXR spatial entities, based on CityNeuroXRDeploymentProfile.
 *
 * This follows the spirit of OpenXR runtime JSON manifests and spatial
 * entities extensions (XR_EXT_spatial_entities and friends). [web:21][web:26]
 */

export function generateOpenXRNeuroRuntimeManifest(runtimeName = "NeuroXR-Phoenix") {
  const profile = XRNeuroObjectForgeGrid.getCityNeuroXRDeploymentProfile();

  return {
    file_format_version: "1.0.0",
    runtime: {
      name: runtimeName,
      city_scope: profile.cityScope,
      api_version: "1.1",
      // base OpenXR runtime reference; actual library path is runtime-specific
      library_path: "libopenxr_neuroxr_phx.so",
      // Conceptual extension usage; actual extension names must be registered
      extensions: profile.openXRExtensions.map((ext) => ({
        name: ext,
        version: 1,
        required: true,
      })),
      spatial_entities: {
        enabled: profile.spatialEntities,
        anchors: profile.anchors,
        // designed to sit on top of XR_EXT_spatial_entities and related extensions
        // for planes, markers, anchors, and persistence. [web:21]
        depends_on: [
          "XR_EXT_spatial_entities",
          "XR_EXT_spatial_plane_tracking",
          "XR_EXT_spatial_marker_tracking",
          "XR_EXT_spatial_anchor",
          "XR_EXT_spatial_persistence",
        ],
      },
      neuroxr_profile: {
        id: profile.id,
        engine_adapters: profile.engineAdapters,
        domain_contexts: profile.domainContexts,
        neurorights: XRNeuroObjectForgeGrid.policies.cityScopeSmartCityNeuroXR.neurorights,
        consent_model:
          XRNeuroObjectForgeGrid.policies.cityScopeSmartCityNeuroXR.consentModel,
      },
    },
  };
}

/**
 * 2. JSON Schema for NeuroSignalChannel, including privacy and neurorights fields.
 *
 * Neural data is treated as sensitive and requires explicit, revocable,
 * neurorights-aligned consent. [web:17][web:31]
 */

export function getNeuroSignalChannelJsonSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "urn:xrneuro:schema:NeuroSignalChannel",
    title: "NeuroSignalChannel",
    type: "object",
    required: [
      "id",
      "modality",
      "frequency_band",
      "sampling_rate_hz",
      "latency_ms",
      "risk_level",
      "privacy_level",
      "purpose",
      "neurorights_tags",
      "consent_requirements",
    ],
    properties: {
      id: {
        type: "string",
        description: "Stable identifier for the signal channel instance",
      },
      modality: {
        type: "string",
        enum: [
          "EEG",
          "EMG",
          "EOG",
          "fNIRS",
          "optical",
          "mechanical_deformation",
          "eye_tracking",
          "heart_rate",
          "skin_conductance",
        ],
      },
      frequency_band: {
        type: "string",
        description: "Named band (e.g., delta, theta, alpha, beta, gamma) or sensor band label",
      },
      sampling_rate_hz: {
        type: "number",
        minimum: 0,
      },
      latency_ms: {
        type: "number",
        minimum: 0,
        description: "End-to-end channel latency including decoding pipeline",
      },
      jitter_ms: {
        type: "number",
        minimum: 0,
        description: "Observed variation in latency under load",
      },
      risk_level: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
      },
      privacy_level: {
        type: "string",
        enum: ["public", "community", "clinical", "secret"],
        description:
          "Privacy classification aligned with smart-city neuro XR policy",
      },
      purpose: {
        type: "string",
        description:
          "Declared primary purpose for which the channel is used (e.g., accessibility, therapy, research, advertising-prohibited)",
      },
      neurorights_tags: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "mental_privacy",
            "cognitive_integrity",
            "identity_continuity",
            "equitable_access",
            "non_discrimination",
          ],
        },
        minItems: 1,
      },
      consent_requirements: {
        type: "object",
        required: [
          "consent_type",
          "revocability",
          "multi_party",
          "data_sharing_scope",
        ],
        properties: {
          consent_type: {
            type: "string",
            enum: [
              "individual_explicit",
              "guardian_explicit",
              "group_explicit",
              "research_ethics_committee",
            ],
            description:
              "Dominant consent mode required before channel activation",
          },
          revocability: {
            type: "string",
            enum: ["real_time", "session_level", "persistent"],
            description:
              "How quickly a user can revoke consent and stop collection/processing",
          },
          multi_party: {
            type: "boolean",
            description:
              "Whether consent must be obtained from multiple parties (e.g., clinician + participant, or multiple participants in shared XR)",
          },
          data_sharing_scope: {
            type: "string",
            enum: [
              "no_sharing",
              "device_local_only",
              "city_local_encrypted",
              "research_aggregated_only",
            ],
            description:
              "Allowed sharing scope consistent with neural data privacy laws",
          },
        },
      },
      retention_days: {
        type: "integer",
        minimum: 0,
        description:
          "Maximum retention in days for raw signal and high-resolution derived features",
        default: XRNeuroObjectForgeGrid.policies.cityScopeSmartCityNeuroXR
          .retentionDays,
      },
      anonymization_required: {
        type: "boolean",
        description:
          "Whether anonymization or strong pseudonymization is required for storage/analysis",
        default: true,
      },
    },
  };
}

/**
 * 3. Consent UI flow for shared neuro data in XR sessions.
 *
 * Encodes a multi-channel, multi-party flow aligned with mental-privacy-first
 * neurorights guidance and emerging neural data laws. [web:17][web:31]
 */

export function getNeuroXRConsentUIFlow() {
  return {
    id: "NeuroXRConsentUIFlow.SharedSession",
    channels: XRNeuroObjectForgeGrid.safetyAndConsent.citizenConsentBroker
      .uiChannels,
    steps: [
      {
        id: "pre_session_briefing",
        label: "Pre-session briefing",
        description:
          "Explain what neural/bio signals will be captured, for what purposes, and with what protections.",
        ui_surfaces: ["mobile_companion", "web_portal"],
      },
      {
        id: "signal_channel_selection",
        label: "Signal channel selection",
        description:
          "Allow users to enable/disable individual NeuroSignalChannels and see their privacy and risk levels.",
        ui_surfaces: ["XR_HUD", "mobile_companion"],
      },
      {
        id: "consent_type_selection",
        label: "Consent type selection",
        description:
          "Choose consent type (individual, guardian, group) and review neurorights implications before proceeding.",
        ui_surfaces: ["XR_HUD", "web_portal"],
      },
      {
        id: "multi_party_confirmation",
        label: "Multi-party confirmation",
        description:
          "All required parties (e.g., clinician, guardians, co-participants) confirm consent for shared neuro data.",
        ui_surfaces: ["mobile_companion", "web_portal"],
      },
      {
        id: "in_session_status",
        label: "In-session consent status",
        description:
          "Show live indicators of active channels and consent state with one-gesture revocation.",
        ui_surfaces: ["XR_HUD"],
      },
      {
        id: "post_session_review",
        label: "Post-session review & deletion",
        description:
          "Offer per-channel review, export, or deletion of neural data, honoring local deletion and opt-out rights.",
        ui_surfaces: ["mobile_companion", "web_portal"],
      },
    ],
    revocation_controls: {
      in_session: {
        gesture: "hold-gaze + pinch for 2s",
        voice: "Stop neuro capture",
        effect: "Immediately disable all non-essential NeuroSignalChannels.",
      },
      post_session: {
        portal: "web_portal",
        options: ["delete_data", "export_data", "change_future_consent"],
      },
    },
  };
}

/**
 * 4. CTS-style conformance tests for NeuroXR latency and privacy.
 *
 * Inspired by OpenXR CTS and spatial-entities extension test styles. [web:21][web:30]
 */

export function getNeuroXRConformanceTests() {
  return [
    {
      id: "latency_bounds_neuro_channel",
      category: "performance",
      description:
        "Measure end-to-end latency for each NeuroSignalChannel under nominal and high-load conditions.",
      metrics: ["latency_ms", "jitter_ms"],
      pass_criteria: {
        max_latency_ms: 100,
        max_jitter_ms: 15,
      },
    },
    {
      id: "latency_bounds_spatial_entities",
      category: "performance",
      description:
        "Verify that spatial anchors and NeuroXR overlays track within tight bounds when bound to spatial entities.",
      metrics: ["tracking_error_mm", "update_interval_ms"],
      pass_criteria: {
        max_tracking_error_mm: 20,
        max_update_interval_ms: 50,
      },
    },
    {
      id: "privacy_flows_consent_enforcement",
      category: "privacy",
      description:
        "Ensure no NeuroSignalChannel is activated without explicit, logged consent and correct neurorights tags.",
      metrics: ["unauthorized_activation_count"],
      pass_criteria: {
        unauthorized_activation_count: 0,
      },
    },
    {
      id: "privacy_flows_data_minimization",
      category: "privacy",
      description:
        "Verify that only declared-purpose data is stored, and retention limits are enforced.",
      metrics: ["extra_field_count", "records_beyond_retention"],
      pass_criteria: {
        extra_field_count: 0,
        records_beyond_retention: 0,
      },
    },
    {
      id: "multi_party_consent_consistency",
      category: "consent",
      description:
        "Check that shared-session NeuroSignalChannels only activate after all required parties consent.",
      metrics: ["sessions_with_missing_consent"],
      pass_criteria: {
        sessions_with_missing_consent: 0,
      },
    },
  ];
}

/**
 * 5. Required consent types for multi-party neuro signal sharing in XR.
 *
 * Encodes a simple policy-level mapping for shared XR sessions that
 * involve neural data from multiple participants. [web:17][web:31]
 */

export function getRequiredConsentTypesForMultiPartySharing() {
  return {
    id: "NeuroXR.MultiPartyConsentPolicy",
    description:
      "Defines required consent types for multi-party neuro signal sharing in XR sessions.",
    rules: [
      {
        id: "shared_consumer_xr",
        context: "multi-user consumer XR experience",
        required_consent_types: ["individual_explicit"],
        notes:
          "Each participant must explicitly consent to sharing of derived metrics; raw neural data sharing is disallowed.",
      },
      {
        id: "clinical_group_session",
        context: "clinical therapy or rehab group session",
        required_consent_types: ["individual_explicit", "guardian_explicit"],
        notes:
          "Channels marked 'clinical' must have both patient and guardian consent where applicable, plus clinician oversight.",
      },
      {
        id: "research_study_xr",
        context: "IRB/ethics-governed research study",
        required_consent_types: [
          "individual_explicit",
          "research_ethics_committee",
        ],
        notes:
          "Neural data used for research must follow study-specific protocols, with clear anonymization and opt-out paths.",
      },
      {
        id: "public_demo_opt_in",
        context: "public demo in civic or educational XR setting",
        required_consent_types: ["individual_explicit"],
        notes:
          "Only low-risk, anonymized aggregate metrics may be shared; no raw or identifiable neural data.",
      },
    ],
  };
}
