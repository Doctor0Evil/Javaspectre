// file: tools/compileNeuroAln.js
import fs from "node:fs";
import crypto from "node:crypto";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: true });

function compileNeuroAlnToSchema(alnText) {
  // Minimal ALN parser stub: in practice use a real parser.
  if (!alnText.includes("ontology") || !alnText.includes("class NeuroSignalChannel")) {
    throw new Error("Invalid or incomplete ALN core definition");
  }

  const schema = {
    $id: "https://neuroxr.org/schema/NeuroSignalChannel.json",
    type: "object",
    additionalProperties: false,
    required: [
      "modality",
      "neural_data_classification",
      "data_sensitivity_tier",
      "sampling_rate_hz",
      "safety_envelope"
    ],
    properties: {
      modality: { type: "string" },
      neural_data_classification: {
        type: "string",
        enum: ["direct_cns", "direct_pns", "inferred_non_neural", "behavioral"]
      },
      data_sensitivity_tier: {
        type: "string",
        enum: ["low", "medium", "high", "neural"]
      },
      sampling_rate_hz: {
        type: "number",
        minimum: 0.0,
        maximum: 100000.0
      },
      safety_envelope: {
        $ref: "https://neuroxr.org/schema/SafetyEnvelope.json"
      }
    }
  };

  // Sanity‑compile with Ajv to guarantee schema is valid.
  ajv.compile(schema);

  return schema;
}

function hashJson(obj) {
  const h = crypto.createHash("sha256");
  h.update(JSON.stringify(obj));
  return h.digest("hex");
}

function main() {
  const alnText = fs.readFileSync("ontologies/neuroxr-core.aln", "utf8");
  const schema = compileNeuroAlnToSchema(alnText);
  const hash = hashJson(schema);

  fs.writeFileSync(
    "schemas/NeuroSignalChannel.schema.json",
    JSON.stringify(schema, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    "schemas/NeuroSignalChannel.schema.hash",
    hash + "\n",
    "utf8"
  );
}

main();
