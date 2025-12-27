// qpudatashards/xr/types/neuro_signal_channel.types.d.ts
// TypeScript definitions derived from neuro_signal_channel.schema.json (JSON Schema 2020-12).

/**
 * Enumerates supported neuro/biosignal modalities.
 */
export type NeuroSignalModality =
  | "EEG"
  | "EMG"
  | "EOG"
  | "fNIRS"
  | "optical"
  | "mechanical_deformation"
  | "eye_tracking"
  | "heart_rate"
  | "skin_conductance";

/**
 * Risk classification levels for NeuroSignalChannel usage.
 */
export type NeuroSignalRiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Privacy classification aligned with smart-city neuro data policy
 * and neurorights guidelines. [web:40][web:48]
 */
export type NeuroSignalPrivacyLevel =
  | "public"
  | "community"
  | "clinical"
  | "secret";

/**
 * Neurorights tags that a given channel is intended to respect or enforce.
 */
export type NeurorightsTag =
  | "mental_privacy"
  | "cognitive_integrity"
  | "identity_continuity"
  | "equitable_access"
  | "non_discrimination";

/**
 * Consent types required before activation of a NeuroSignalChannel.
 */
export type NeuroConsentType =
  | "individual_explicit"
  | "guardian_explicit"
  | "group_explicit"
  | "research_ethics_committee";

/**
 * How quickly participants can revoke consent. [web:47]
 */
export type NeuroConsentRevocability =
  | "real_time"
  | "session_level"
  | "persistent";

/**
 * Allowed data-sharing scopes for neural/biosignal data, aligned with
 * emerging neural-data privacy expectations (e.g., MIND Act direction). [web:40][web:48]
 */
export type NeuroDataSharingScope =
  | "no_sharing"
  | "device_local_only"
  | "city_local_encrypted"
  | "research_aggregated_only";

/**
 * Consent requirements object, mirroring `consent_requirements` in the schema.
 */
export interface NeuroConsentRequirements {
  /**
   * Dominant consent type juridically required before collection or use.
   */
  consent_type: NeuroConsentType;

  /**
   * How quickly a participant can revoke consent.
   */
  revocability: NeuroConsentRevocability;

  /**
   * Whether more than one party must consent (e.g., clinician + participant).
   */
  multi_party: boolean;

  /**
   * Maximum allowed sharing scope for this channel.
   */
  data_sharing_scope: NeuroDataSharingScope;
}

/**
 * Data security configuration for stored and transmitted neural/biosignal data.
 */
export interface NeuroDataSecurityConfig {
  /**
   * Whether recordings and derived data are encrypted at rest.
   * Default is true.
   */
  encryption_at_rest: boolean;

  /**
   * Whether neural/biosignal data is encrypted in transit end-to-end.
   * Default is true.
   */
  encryption_in_transit: boolean;
}

/**
 * Core NeuroSignalChannel type corresponding to neuro_signal_channel.schema.json.
 */
export interface NeuroSignalChannel {
  /**
   * Stable identifier for this channel (UUID or human-readable label).
   */
  id: string;

  /**
   * Neuro/biosignal modality (EEG, EMG, etc.).
   */
  modality: NeuroSignalModality;

  /**
   * Named frequency band or sensor-specific band identifier.
   */
  frequency_band: string;

  /**
   * Sampling rate in hertz.
   */
  sampling_rate_hz: number;

  /**
   * End-to-end latency from acquisition to decoded feature (ms).
   */
  latency_ms: number;

  /**
   * Observed latency variation under load (ms).
   */
  jitter_ms?: number;

  /**
   * Contextual risk level for using this channel in XR.
   */
  risk_level: NeuroSignalRiskLevel;

  /**
   * Privacy classification for neural/biosignal data.
   */
  privacy_level: NeuroSignalPrivacyLevel;

  /**
   * Declared purpose for which this channel is used.
   * (Accessibility, therapy, research; ad-targeting disallowed.)
   */
  purpose: string;

  /**
   * Neurorights tags that this channel is specifically designed to uphold.
   */
  neurorights_tags: NeurorightsTag[];

  /**
   * Structured consent configuration required before activation.
   */
  consent_requirements: NeuroConsentRequirements;

  /**
   * Maximum retention time in days for raw and derived features.
   * Defaults to 30 in policy, but explicit here.
   */
  retention_days?: number;

  /**
   * Whether anonymization or strong pseudonymization is required.
   * Defaults to true in most policies.
   */
  anonymization_required?: boolean;

  /**
   * Data security configuration (encryption at rest/in transit).
   */
  data_security?: NeuroDataSecurityConfig;
}
