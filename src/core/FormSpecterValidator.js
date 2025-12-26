// Path: src/core/FormSpecterValidator.js

import FormSpecterErrorCodes from "./FormSpecterErrorCodes.js";

function isEmailFormatValid(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

function getEmailDomain(email) {
  const parts = String(email).split("@");
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

export class FormSpecterValidator {
  constructor(config) {
    this.config = config;
  }

  validateField(fieldDescriptor, value) {
    const { type, required, min, max } = fieldDescriptor || {};
    const failures = [];

    if (required && (value === null || value === undefined || value === "")) {
      failures.push(FormSpecterErrorCodes.REQUIRED);
      return this._result(failures);
    }

    switch (type) {
      case "email":
        this._validateEmail(value, failures);
        break;
      case "number":
        this._validateNumber(value, { min, max }, failures);
        break;
      case "file":
        this._validateFile(value, failures);
        break;
      case "phone":
        this._validatePhone(value, failures);
        break;
      case "date":
        this._validateDate(value, failures);
        break;
      default:
        this._validateLength(value, failures);
        break;
    }

    return this._result(failures);
  }

  _validateEmail(value, failures) {
    if (!value) return;

    if (!isEmailFormatValid(value)) {
      failures.push(FormSpecterErrorCodes.INVALID_EMAIL_FORMAT);
      return;
    }

    const domain = getEmailDomain(value);
    if (!domain) {
      failures.push(FormSpecterErrorCodes.INVALID_EMAIL);
      return;
    }

    if (this.config.manuallyBlockedDomains.includes(domain)) {
      failures.push(FormSpecterErrorCodes.MANUALLY_BLOCKED_EMAIL_DOMAIN);
      return;
    }

    if (this.config.blockedDomains.includes(domain)) {
      failures.push(FormSpecterErrorCodes.BLOCKED_EMAIL_DOMAIN);
    }
  }

  _validateNumber(value, { min, max }, failures) {
    if (value === null || value === undefined || value === "") return;

    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      failures.push(FormSpecterErrorCodes.INVALID_NUMBER);
      return;
    }

    if (typeof min === "number" && numeric < min) {
      failures.push(FormSpecterErrorCodes.NUMBER_TOO_SMALL);
    }

    if (typeof max === "number" && numeric > max) {
      failures.push(FormSpecterErrorCodes.NUMBER_TOO_LARGE);
    }

    if (
      typeof min === "number" &&
      typeof max === "number" &&
      (numeric < min || numeric > max)
    ) {
      failures.push(FormSpecterErrorCodes.NUMBER_OUT_OF_RANGE);
    }
  }

  _validateFile(value, failures) {
    if (!value) return;

    const size =
      typeof value.size === "number"
        ? value.size
        : typeof value === "number"
        ? value
        : null;

    if (size !== null && size > this.config.maxFileSizeBytes) {
      failures.push(FormSpecterErrorCodes.FILE_TOO_LARGE);
    }
  }

  _validatePhone(value, failures) {
    if (!value) return;

    const pattern = /^\+?((\(?\d+\)?)[-.]?\s*)+$/;
    if (!pattern.test(String(value))) {
      failures.push(FormSpecterErrorCodes.PHONE_INVALID_CHARACTERS);
    }
  }

  _validateDate(value, failures) {
    if (!value) return;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      failures.push(FormSpecterErrorCodes.INVALID_DATE);
    }
  }

  _validateLength(value, failures) {
    if (!value && value !== 0) return;

    const str = String(value);
    if (str.length > this.config.maxInputLength) {
      failures.push(FormSpecterErrorCodes.INPUT_TOO_LARGE);
    }
  }

  _result(failures) {
    return { ok: failures.length === 0, errors: failures };
  }
}

export default FormSpecterValidator;
