// spectral-core/validation/object-schema-validator.ts

export class ObjectSchemaValidator {
  static validate(obj: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!obj) errors.push("Object is null or undefined.");
    if (typeof obj !== "object") errors.push("Object must be a structured entity.");
    if (!obj.type) errors.push("Missing required field: type.");
    if (!obj.metadata) errors.push("Missing required field: metadata.");

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
