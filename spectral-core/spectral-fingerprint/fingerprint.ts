// spectral-core/spectral-fingerprint/fingerprint.ts

import crypto from "crypto";

export class SpectralFingerprint {
  static generate(input: unknown): string {
    const json = JSON.stringify(input, Object.keys(input as object).sort());
    return crypto.createHash("sha256").update(json).digest("hex");
  }
}
