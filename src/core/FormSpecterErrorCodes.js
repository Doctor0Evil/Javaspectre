// Path: src/core/FormSpecterErrorCodes.js

export const FormSpecterErrorCodes = Object.freeze({
  BLOCKED_EMAIL_DOMAIN: "blockedEmailDomain",
  MANUALLY_BLOCKED_EMAIL_DOMAIN: "manuallyBlockedEmailDomain",
  INVALID_EMAIL: "invalidEmail",
  INVALID_EMAIL_FORMAT: "invalidEmailFormat",
  EMAIL_OPTIN_REQUIRED: "emailOptInRequired",
  RESUBSCRIBE_REQUIRED: "resubscribeRequired",

  REQUIRED: "required",
  INVALID_NUMBER: "invalidNumber",
  NUMBER_TOO_SMALL: "invalidNumberRangeTooSmall",
  NUMBER_TOO_LARGE: "invalidNumberRangeTooLarge",
  NUMBER_OUT_OF_RANGE: "numberOutOfRange",

  INPUT_TOO_LARGE: "inputTooLarge",
  FILE_TOO_LARGE: "fileTooLarge",

  INVALID_DATE: "invalidDate",
  PHONE_INVALID_CHARACTERS: "phoneInvalidCharacters",

  INVALID_CONFIGURATION: "invalidConfiguration",
  TOO_MANY_REQUESTS: "tooManyRequests",
});

export default FormSpecterErrorCodes;
