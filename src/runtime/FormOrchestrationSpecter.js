// Path: src/runtime/FormOrchestrationSpecter.js

// This module assumes that the host app/runtime makes the following three
// objects available and passes them in when constructing the specter:
//
// - schedulerSurface:  React-style scheduler surface (l1pX-like), e.g.:
//   { unstable_scheduleCallback, unstable_runWithPriority, unstable_NormalPriority, ... }
// - fieldValidationKernel: sB95-like object:
//   { N, d, m, h, g, c, M, I, S, k, l, a, b, E, ... }
// - errorCodeEnum: o-like object exporting canonical error codes:
//   { INVALID_EMAIL, INVALID_EMAIL_FORMAT, REQUIRED, FILE_TOO_LARGE, ... }

export class FormOrchestrationSpecter {
  constructor({ schedulerSurface, fieldValidationKernel, errorCodeEnum }) {
    if (!schedulerSurface || !fieldValidationKernel || !errorCodeEnum) {
      throw new Error(
        "FormOrchestrationSpecter requires schedulerSurface, fieldValidationKernel, and errorCodeEnum."
      );
    }

    this.scheduler = schedulerSurface;
    this.kernel = fieldValidationKernel;
    this.errors = errorCodeEnum;

    this.telemetry = {
      totalValidations: 0,
      failuresByCode: Object.create(null),
      lastRuns: [],
    };
  }

  // SPECTRAL API: schedule a validation task with a given priority lane.
  scheduleValidation({ priority, task }) {
    const {
      unstable_scheduleCallback,
      unstable_NormalPriority,
      unstable_UserBlockingPriority,
      unstable_ImmediatePriority,
      unstable_LowPriority,
      unstable_IdlePriority,
    } = this.scheduler;

    if (typeof task !== "function") {
      throw new Error("scheduleValidation requires a task function.");
    }

    const priorityMap = {
      immediate: unstable_ImmediatePriority,
      userBlocking: unstable_UserBlockingPriority,
      normal: unstable_NormalPriority,
      low: unstable_LowPriority,
      idle: unstable_IdlePriority,
    };

    const lane = priorityMap[priority] ?? unstable_NormalPriority;

    return unstable_scheduleCallback(lane, () => {
      const startedAt = this.scheduler.unstable_now
        ? this.scheduler.unstable_now()
        : Date.now();

      const result = task();

      const endedAt = this.scheduler.unstable_now
        ? this.scheduler.unstable_now()
        : Date.now();

      this.telemetry.lastRuns.push({
        type: "validation",
        priority: priority || "normal",
        startedAt,
        endedAt,
        durationMs: endedAt - startedAt,
      });

      return result;
    });
  }

  // High-level field validation that delegates to the kernel and normalizes into errorCodeEnum.
  validateField(fieldDescriptor, value) {
    const { type, required, min, max, countryCodeExtension } =
      fieldDescriptor || {};

    const failures = [];

    // Required checks (for text/select/option etc.)
    if (required && (value === null || value === undefined || value === "")) {
      failures.push(this.errors.REQUIRED || this.errors.REQUIRED_FIELD);
      return this._recordFailures(failures);
    }

    switch (type) {
      case "email":
        this._validateEmail(value, failures);
        break;

      case "number":
        this._validateNumber(value, { min, max }, failures);
        break;

      case "phone":
        this._validatePhone(value, { countryCodeExtension }, failures);
        break;

      case "select":
        this._validateSelect(value, failures);
        break;

      case "file":
        this._validateFile(value, failures);
        break;

      case "text":
      default:
        this._validateLength(value, failures);
        break;
    }

    return this._recordFailures(failures);
  }

  // --- Internal validators wired to the kernel + enum ---

  _validateEmail(value, failures) {
    const { INVALID_EMAIL, INVALID_EMAIL_FORMAT } = this.errors;

    if (typeof value !== "string" || !value.includes("@")) {
      failures.push(INVALID_EMAIL || INVALID_EMAIL_FORMAT);
      return;
    }

    // Coarse-grained format check using an RFC-like pattern is recommended.
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(value)) {
      failures.push(INVALID_EMAIL_FORMAT || INVALID_EMAIL);
    }
  }

  _validateNumber(value, range, failures) {
    const { INVALID_NUMBER, INVALID_NUMBER_RANGE_TOO_SMALL, INVALID_NUMBER_RANGE_TOO_LARGE, NUMBER_OUT_OF_RANGE } =
      this.errors;

    if (value === "" || value === null || value === undefined) {
      return;
    }

    const asString = String(value);

    // Use the kernel's numeric regex if available.
    const pattern = this.kernel.d;
    if (pattern && !pattern.test(asString)) {
      failures.push(INVALID_NUMBER);
      return;
    }

    const numeric = Number(asString);
    if (Number.isNaN(numeric)) {
      failures.push(INVALID_NUMBER);
      return;
    }

    if (typeof range?.min === "number" && numeric < range.min) {
      failures.push(INVALID_NUMBER_RANGE_TOO_SMALL || NUMBER_OUT_OF_RANGE);
    }

    if (typeof range?.max === "number" && numeric > range.max) {
      failures.push(INVALID_NUMBER_RANGE_TOO_LARGE || NUMBER_OUT_OF_RANGE);
    }
  }

  _validatePhone(value, { countryCodeExtension }, failures) {
    const { PHONE_INVALID_CHARACTERS } = this.errors;

    if (!value) return;

    const m = this.kernel.m;
    const h = this.kernel.h;
    const O = this.kernel.O || { default: (prefix = "", t = "") => t };

    const normalizedPrefixStripped = O.default
      ? O.default(countryCodeExtension || "", String(value))
      : String(value);

    const digitsOnly = h ? h(normalizedPrefixStripped) : normalizedPrefixStripped;

    if (!m || !m.test(normalizedPrefixStripped)) {
      failures.push(PHONE_INVALID_CHARACTERS);
      return;
    }

    if (digitsOnly.length < 6) {
      failures.push(PHONE_INVALID_CHARACTERS);
    }
  }

  _validateSelect(value, failures) {
    const { MISSING_SELECT, MISSING_OPTION_SELECTION, REQUIRED, REQUIRED_FIELD } =
      this.errors;

    if (!value || (Array.isArray(value) && value.length === 0)) {
      failures.push(
        MISSING_SELECT ||
          MISSING_OPTION_SELECTION ||
          REQUIRED ||
          REQUIRED_FIELD
      );
    }
  }

  _validateFile(value, failures) {
    const { FILE_TOO_LARGE } = this.errors;
    const maxBytes = this.kernel.N || 104857600;

    if (!value) return;

    const fileSize =
      typeof value.size === "number"
        ? value.size
        : typeof value === "number"
        ? value
        : null;

    if (fileSize !== null && fileSize > maxBytes) {
      failures.push(FILE_TOO_LARGE);
    }
  }

  _validateLength(value, failures) {
    const { INPUT_TOO_LARGE } = this.errors;

    if (!value && value !== 0) return;

    const asString = String(value);
    const maxLen = 65536;
    if (asString.length > maxLen) {
      failures.push(INPUT_TOO_LARGE);
    }
  }

  // --- Telemetry + introspection ---

  _recordFailures(failures) {
    this.telemetry.totalValidations += 1;

    if (failures && failures.length) {
      for (const code of failures) {
        if (!code) continue;
        if (!this.telemetry.failuresByCode[code]) {
          this.telemetry.failuresByCode[code] = 0;
        }
        this.telemetry.failuresByCode[code] += 1;
      }
    }

    return {
      ok: !failures.length,
      errors: failures,
    };
  }

  getTelemetrySnapshot() {
    return {
      totalValidations: this.telemetry.totalValidations,
      failuresByCode: { ...this.telemetry.failuresByCode },
      lastRuns: [...this.telemetry.lastRuns],
    };
  }
}

export default FormOrchestrationSpecter;
