// Path: src/utils/RepoWriter.js
// File scaffold and metadata writer.

import fs from "fs";
import path from "path";

export class RepoWriter {
  constructor(options = {}) {
    this.root = options.root || process.cwd();
  }

  writeFile(relativePath, contents) {
    const full = path.join(this.root, relativePath);
    const dir = path.dirname(full);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(full, contents, "utf8");
    return full;
  }

  writeJson(relativePath, obj) {
    return this.writeFile(relativePath, JSON.stringify(obj, null, 2));
  }
}

export default RepoWriter;
