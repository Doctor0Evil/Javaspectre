// qpudatashards/xr/examples/neuroxr_generate_profiles_example.js
// Example: emit OpenXR-ready NeuroXR JSON artifacts to disk.

import fs from "fs";
import path from "path";
import {
  generateOpenXRNeuroRuntimeManifest,
  getNeuroSignalChannelJsonSchema,
  getNeuroXRConsentUIFlow,
  getNeuroXRConformanceTests,
  getRequiredConsentTypesForMultiPartySharing,
} from "../xr_neuro_openxr_profile_generator.js";

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeJsonFile(targetPath, data) {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(targetPath, json, "utf8");
  console.log(`Wrote ${targetPath}`);
}

function main() {
  const outDir = path.resolve(
    process.cwd(),
    "qpudatashards",
    "xr",
    "out",
    "neuroxr_profiles"
  );
  ensureDir(outDir);

  // 1. OpenXR NeuroXR runtime manifest (can be pointed to by XR_RUNTIME_JSON). [web:26][web:39]
  const runtimeManifest = generateOpenXRNeuroRuntimeManifest(
    "NeuroXR-Phoenix-DigitalTwin"
  );
  writeJsonFile(path.join(outDir, "openxr_neuroxr_runtime_manifest.json"), runtimeManifest);

  // 2. NeuroSignalChannel JSON Schema with neurorights and consent fields. [web:17][web:31][web:37][web:40]
  const neuroSignalSchema = getNeuroSignalChannelJsonSchema();
  writeJsonFile(path.join(outDir, "neuro_signal_channel.schema.json"), neuroSignalSchema);

  // 3. Consent UI flow for shared neuro data in XR sessions.
  const consentFlow = getNeuroXRConsentUIFlow();
  writeJsonFile(path.join(outDir, "neuroxr_consent_ui_flow.json"), consentFlow);

  // 4. CTS-style conformance tests for latency and privacy.
  const conformanceTests = getNeuroXRConformanceTests();
  writeJsonFile(path.join(outDir, "neuroxr_conformance_tests.json"), conformanceTests);

  // 5. Required consent types for multi-party neuro signal sharing.
  const multiPartyConsentPolicy = getRequiredConsentTypesForMultiPartySharing();
  writeJsonFile(
    path.join(outDir, "neuroxr_multi_party_consent_policy.json"),
    multiPartyConsentPolicy
  );
}

main();
