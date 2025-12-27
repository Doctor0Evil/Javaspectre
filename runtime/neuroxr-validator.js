// file: runtime/neuroxr-validator.js
import fs from "node:fs";
import crypto from "node:crypto";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: true });

// Verify schema integrity
function verifySchemaIntegrity(schemaPath, hashPath) {
  const schemaText = fs.readFileSync(schemaPath, "utf8");
  const expectedHash = fs.readFileSync(hashPath, "utf8").trim();
  const actualHash = crypto
    .createHash("sha256")
    .update(schemaText)
    .digest("hex");
  if (actualHash !== expectedHash) {
    throw new Error(`Schema integrity check failed for ${schemaPath}`);
  }
  return JSON.parse(schemaText);
}

// Custom keyword: neurorightsGuard
ajv.addKeyword({
  keyword: "neurorightsGuard",
  async: false,
  type: "object",
  errors: true,
  metaSchema: {
    type: "object",
    properties: {
      requireConsentForNeural: { type: "boolean" },
      enforceSpatialScope: { type: "boolean" }
    },
    additionalProperties: false
  },
  validate(schema, data) {
    const errors = [];

    const tier = data.data_sensitivity_tier;
    const neuralClass = data.neural_data_classification;
    const env = data.safety_envelope || {};

    if (schema.requireConsentForNeural) {
      const isNeural =
        tier === "neural" ||
        neuralClass === "direct_cns" ||
        neuralClass === "direct_pns";
      if (isNeural && env.consent_status !== "granted") {
        errors.push({
          keyword: "neurorightsGuard",
          message: "Neural data collection without granted consent is forbidden"
        });
      }
    }

    if (schema.enforceSpatialScope) {
      if (env.spatial_scope === "forbidden_zone") {
        errors.push({
          keyword: "neurorightsGuard",
          message: "Neural data collection in forbidden spatial scope is blocked"
        });
      }
    }

    if (errors.length) {
      (this as any).errors = errors;
      return false;
    }
    return true;
  }
});

const safetyEnvelopeSchema = {
  $id: "https://neuroxr.org/schema/SafetyEnvelope.json",
  type: "object",
  additionalProperties: false,
  required: ["consent_status", "spatial_scope"],
  properties: {
    consent_status: {
      type: "string",
      enum: ["granted", "revoked", "pending"]
    },
    spatial_scope: {
      type: "string"
    },
    jurisdiction: {
      type: "string"
    }
  }
};

ajv.addSchema(safetyEnvelopeSchema);

const neuroSchema = verifySchemaIntegrity(
  "schemas/NeuroSignalChannel.schema.json",
  "schemas/NeuroSignalChannel.schema.hash"
);

neuroSchema.neurorightsGuard = {
  requireConsentForNeural: true,
  enforceSpatialScope: true
};

const validateNeuro = ajv.compile(neuroSchema);

export function validateNeuroSignalChannel(instance) {
  const ok = validateNeuro(instance);
  if (!ok) {
    const errs = validateNeuro.errors || [];
    const msg = errs.map(e => e.message).join("; ");
    throw new Error(`NeuroXR validation blocked: ${msg}`);
  }
  return true;
}
