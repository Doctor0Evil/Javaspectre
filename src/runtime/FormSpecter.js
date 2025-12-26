// Path: src/runtime/FormSpecter.js

import { mergeFormSpecterConfig } from "../core/FormSpecterConfig.js";
import FormSpecterValidator from "../core/FormSpecterValidator.js";

export class FormSpecter {
  constructor(userConfig = {}) {
    this.config = mergeFormSpecterConfig(userConfig);
    this.validator = new FormSpecterValidator(this.config);

    this.state = {
      fields: {},
      submission: { attempted: false, succeeded: false, errors: [] },
      metrics: { firstContentfulPaintMs: null },
    };

    this._fcpStart = performance && performance.now ? performance.now() : null;
    queueMicrotask(() => this._markFirstContentfulPaint());
  }

  _markFirstContentfulPaint() {
    if (this.state.metrics.firstContentfulPaintMs !== null) return;

    const now = performance && performance.now ? performance.now() : Date.now();
    if (this._fcpStart != null) {
      this.state.metrics.firstContentfulPaintMs = now - this._fcpStart;
      this._emitAnalytic("first_contentful_paint", {
        durationMs: this.state.metrics.firstContentfulPaintMs,
      });
    }

    this.config.onReady(this.getSnapshot());
  }

  registerField(fieldDescriptor) {
    const { name } = fieldDescriptor;
    if (!name) {
      throw new Error("Field descriptor must include a name.");
    }
    this.state.fields[name] = { descriptor: fieldDescriptor, value: "" };
  }

  updateFieldValue(name, value) {
    const field = this.state.fields[name];
    if (!field) {
      throw new Error(`Unknown field: ${name}`);
    }

    field.value = value;
    const result = this.validator.validateField(field.descriptor, value);
    if (!result.ok) {
      this.config.onValidationFailed({ field: name, errors: result.errors });
    }

    return result;
  }

  async submit() {
    this.state.submission.attempted = true;
    this.config.onSubmitAttempt(this.getSnapshot());

    const allErrors = [];

    for (const [name, field] of Object.entries(this.state.fields)) {
      const result = this.validator.validateField(field.descriptor, field.value);
      if (!result.ok) {
        allErrors.push({ field: name, errors: result.errors });
      }
    }

    if (allErrors.length) {
      this.state.submission.errors = allErrors;
      this.config.onSubmitError({ snapshot: this.getSnapshot(), errors: allErrors });
      return { ok: false, errors: allErrors };
    }

    const extraMeta = this.config.getExtraMetaDataBeforeSubmit(this.getSnapshot());
    this.state.submission.succeeded = true;

    this.config.onSubmitSuccess({
      snapshot: this.getSnapshot(),
      meta: extraMeta,
    });

    this._emitAnalytic("form_submitted", {
      fieldCount: Object.keys(this.state.fields).length,
    });

    return { ok: true, errors: [] };
  }

  getSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  _emitAnalytic(eventName, payload) {
    if (typeof this.config.onAnalyticEvent === "function") {
      this.config.onAnalyticEvent({ eventName, payload });
    }
  }
}

export default FormSpecter;
