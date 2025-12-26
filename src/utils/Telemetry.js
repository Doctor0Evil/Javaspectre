// Path: src/utils/Telemetry.js
// Tracks usage metrics and spectral audits.

import fs from "fs";
import path from "path";

export class Telemetry {
  constructor(options = {}) {
    this.outputDir =
      options.outputDir || path.join(process.cwd(), ".javaspectre", "telemetry");
  }

  record(event) {
    const record = {
      timestamp: new Date().toISOString(),
      event
    };
    this.#ensureDir(this.outputDir);
    const file = path.join(this.outputDir, "events.log");
    fs.appendFileSync(file, JSON.stringify(record) + "\n", "utf8");
    return file;
  }

  #ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export default Telemetry;
