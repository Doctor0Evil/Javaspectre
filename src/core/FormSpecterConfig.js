// Path: src/core/FormSpecterConfig.js

export const defaultFormSpecterConfig = {
  formId: null,
  portalId: null,
  region: "us",
  locale: "en-US",

  blockedDomains: [],
  manuallyBlockedDomains: [],
  maxFileSizeBytes: 104857600,
  maxInputLength: 65536,

  translations: {},

  onReady: () => {},
  onSubmitAttempt: () => {},
  onSubmitSuccess: () => {},
  onSubmitError: () => {},
  onValidationFailed: () => {},
  onAnalyticEvent: () => {},
  getExtraMetaDataBeforeSubmit: () => ({}),
};

export function mergeFormSpecterConfig(userConfig = {}) {
  return {
    ...defaultFormSpecterConfig,
    ...userConfig,
    blockedDomains: [...(userConfig.blockedDomains || [])],
    manuallyBlockedDomains: [...(userConfig.manuallyBlockedDomains || [])],
  };
}
