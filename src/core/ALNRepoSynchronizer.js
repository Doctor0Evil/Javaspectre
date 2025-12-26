// Path: src/core/ALNRepoSynchronizer.js

import fs from "fs";
import path from "path";

/**
 * ALNRepoSynchronizer
 *
 * Reads an ALN plan + repo blueprint and:
 * - Ensures required directories/files exist.
 * - Emits minimal JS stubs wired to ALN module contracts.
 * - Produces a sync report for CI / maintainers.
 *
 * This bridges ALN plans with real GitHub repos.
 */

class ALNRepoSynchronizer {
  constructor(rootDir) {
    this.rootDir = rootDir || process.cwd();
  }

  /**
   * Synchronize file system with ALN repo blueprint.
   *
   * @param {object} blueprint - from ALNEngine.generateRepoBlueprint
   * @returns {{created: string[], touched: string[], missing: string[]}}
   */
  syncFromBlueprint(blueprint) {
    const created = [];
    const touched = [];
    const missing = [];

    if (!blueprint || typeof blueprint !== "object") {
      throw new Error("ALNRepoSynchronizer.syncFromBlueprint: blueprint object is required.");
    }

    const dirs = blueprint.structure?.directories || {};
    const rootFiles = blueprint.structure?.rootFiles || [];

    // Ensure root files
    rootFiles.forEach((fileName) => {
      const full = path.join(this.rootDir, fileName);
      if (!fs.existsSync(full)) {
        fs.writeFileSync(full, this._defaultRootFileContent(fileName, blueprint), "utf8");
        created.push(fileName);
      } else {
        touched.push(fileName);
      }
    });

    // Ensure directories + files
    Object.entries(dirs).forEach(([dirName, content]) => {
      if (Array.isArray(content)) {
        // directory with simple file array
        const dirPath = path.join(this.rootDir, dirName);
        this._ensureDir(dirPath);
        content.forEach((file) => {
          const full = path.join(dirPath, file);
          if (!fs.existsSync(full)) {
            fs.writeFileSync(full, this._defaultModuleContent(file), "utf8");
            created.push(path.join(dirName, file));
          } else {
            touched.push(path.join(dirName, file));
          }
        });
      } else if (typeof content === "object" && content !== null) {
        // nested structure
        this._syncNestedDir(dirName, content, created, touched);
      }
    });

    // Compute missing (declared but not present on disk after attempt)
    const allDeclared = new Set([
      ...rootFiles,
      ...created,
      ...touched
    ]);

    allDeclared.forEach((relPath) => {
      const full = path.join(this.rootDir, relPath);
      if (!fs.existsSync(full)) {
        missing.push(relPath);
      }
    });

    return { created, touched, missing };
  }

  /**
   * Sync nested directories recursively.
   */
  _syncNestedDir(baseDir, structure, created, touched) {
    const basePath = path.join(this.rootDir, baseDir);
    this._ensureDir(basePath);

    Object.entries(structure).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const dirPath = path.join(basePath, key);
        this._ensureDir(dirPath);
        value.forEach((file) => {
          const full = path.join(dirPath, file);
          const rel = path.join(baseDir, key, file);
          if (!fs.existsSync(full)) {
            fs.writeFileSync(full, this._defaultModuleContent(file), "utf8");
            created.push(rel);
          } else {
            touched.push(rel);
          }
        });
      } else if (typeof value === "object" && value !== null) {
        this._syncNestedDir(path.join(baseDir, key), value, created, touched);
      }
    });
  }

  _ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  _defaultRootFileContent(fileName, blueprint) {
    if (fileName === "README.md") {
      return `# ${blueprint.name}\n\nGenerated from ALN blueprint.\n`;
    }
    if (fileName === "MANIFESTO.md") {
      return `# ALN Manifesto\n\nThis repository is synchronized with ALN plans and blueprints.\n`;
    }
    if (fileName === "package.json") {
      return JSON.stringify(
        {
          name: blueprint.name,
          version: "0.1.0",
          type: "module",
          description: "ALN-generated repository",
          scripts: {
            test: "node ./test/ALNEngine.test.js || echo \"Add tests\""
          }
        },
        null,
        2
      );
    }
    if (fileName === ".gitignore") {
      return "node_modules/\n.DS_Store\n";
    }
    if (fileName === "LICENSE") {
      return "MIT License - See https://opensource.org/licenses/MIT\n";
    }
    return "";
  }

  _defaultModuleContent(fileName) {
    if (fileName.endsWith(".js")) {
      const base = path.basename(fileName, ".js");
      const className = base.replace(/[^a-zA-Z0-9]/g, "") || "Module";
      return `// Auto-generated stub from ALN blueprint\n\nexport class ${className} {\n  constructor() {}\n}\n\nexport default ${className};\n`;
    }
    return "";
  }
}

export default ALNRepoSynchronizer;
