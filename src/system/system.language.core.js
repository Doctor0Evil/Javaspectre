// Path: src/system/system.language.core.js

import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * ALNModuleDescriptor
 * JS representation of:
 * struct ALNModuleDescriptor {
 *   name: string
 *   version: string
 *   domain: string
 *   repoUrl: string
 *   owner: string
 *   structCount: int
 *   functionCount: int
 *   constantCount: int
 *   hash: string
 * }
 */

/**
 * RepoBlueprintRef
 * JS representation of:
 * struct RepoBlueprintRef {
 *   name: string
 *   rootDir: string
 *   createdAt: string
 * }
 */

/**
 * SystemLanguageCore
 * Implements:
 *   fn registerModule(descriptor: ALNModuleDescriptor) -> void
 *   fn syncRepo(blueprint: RepoBlueprintRef) -> void
 *   fn listModulesByDomain(domain: string) -> [ALNModuleDescriptor]
 *   fn diffBlueprintAgainstRepo(blueprint: RepoBlueprintRef) -> string
 */
class SystemLanguageCore {
  constructor(options = {}) {
    this.registry = new Map();
    this.rootDir = options.rootDir || process.cwd();
  }

  // ---------------------------------------------------------------------------
  // registerModule(descriptor: ALNModuleDescriptor) -> void
  // ---------------------------------------------------------------------------

  registerModule(descriptor) {
    this._validateDescriptor(descriptor);

    const key = `${descriptor.domain}:${descriptor.name}`;
    const normalized = {
      name: descriptor.name.trim(),
      version: descriptor.version.trim(),
      domain: descriptor.domain.trim(),
      repoUrl: descriptor.repoUrl.trim(),
      owner: descriptor.owner.trim(),
      structCount: descriptor.structCount | 0,
      functionCount: descriptor.functionCount | 0,
      constantCount: descriptor.constantCount | 0,
      hash: descriptor.hash || this._hashDescriptor(descriptor),
      registeredAt: new Date().toISOString()
    };

    this.registry.set(key, normalized);
  }

  // ---------------------------------------------------------------------------
  // listModulesByDomain(domain: string) -> [ALNModuleDescriptor]
  // ---------------------------------------------------------------------------

  listModulesByDomain(domain) {
    const d = (domain || "").trim().toLowerCase();
    const out = [];
    for (const [, desc] of this.registry.entries()) {
      if (desc.domain.toLowerCase() === d) {
        out.push({ ...desc });
      }
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // syncRepo(blueprint: RepoBlueprintRef) -> void
  //   - Ensures basic ALN repo layout exists under blueprint.rootDir
  // ---------------------------------------------------------------------------

  syncRepo(blueprint) {
    this._validateBlueprintRef(blueprint);

    const rootDir = path.isAbsolute(blueprint.rootDir)
      ? blueprint.rootDir
      : path.join(this.rootDir, blueprint.rootDir);

    this._ensureDir(rootDir);

    const coreFiles = ["README.md", "MANIFESTO.md", "LICENSE", "package.json", ".gitignore"];
    const directories = {
      src: {
        core: ["ALNEngine.js", "system.language.core.js"],
        blueprints: ["RepoBlueprint.js"],
        cli: ["aln-cli.js"]
      },
      examples: ["demo-system-language-core.js"],
      test: ["SystemLanguageCore.test.js"]
    };

    // Root files
    coreFiles.forEach((fileName) => {
      const full = path.join(rootDir, fileName);
      if (!fs.existsSync(full)) {
        fs.writeFileSync(full, this._defaultRootFileContent(fileName, blueprint), "utf8");
      }
    });

    // Directories + files
    Object.entries(directories).forEach(([dirName, content]) => {
      const dirPath = path.join(rootDir, dirName);
      this._ensureDir(dirPath);

      if (Array.isArray(content)) {
        content.forEach((file) => {
          const full = path.join(dirPath, file);
          if (!fs.existsSync(full)) {
            fs.writeFileSync(full, this._defaultModuleContent(file), "utf8");
          }
        });
      } else {
        // nested
        this._syncNestedDir(rootDir, dirName, content);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // diffBlueprintAgainstRepo(blueprint: RepoBlueprintRef) -> string
  //   - Text diff of expected vs actual for quick, ALN-style diagnostics
  // ---------------------------------------------------------------------------

  diffBlueprintAgainstRepo(blueprint) {
    this._validateBlueprintRef(blueprint);

    const rootDir = path.isAbsolute(blueprint.rootDir)
      ? blueprint.rootDir
      : path.join(this.rootDir, blueprint.rootDir);

    const expected = this._expectedStructure();
    const actualPaths = this._scanPaths(rootDir);

    const lines = [];
    lines.push(`# Diff for ${blueprint.name}`);
    lines.push(`Root: ${rootDir}`);
    lines.push("");

    expected.forEach((relPath) => {
      const full = path.join(rootDir, relPath);
      if (!fs.existsSync(full)) {
        lines.push(`MISSING  ${relPath}`);
      } else {
        lines.push(`OK       ${relPath}`);
      }
    });

    // Extra files not in expected
    const expectedSet = new Set(expected);
    actualPaths.forEach((relPath) => {
      if (!expectedSet.has(relPath)) {
        lines.push(`EXTRA    ${relPath}`);
      }
    });

    return lines.join("\n");
  }

  // ---------------------------------------------------------------------------
  // Internal: structure / FS helpers
  // ---------------------------------------------------------------------------

  _expectedStructure() {
    const coreFiles = ["README.md", "MANIFESTO.md", "LICENSE", "package.json", ".gitignore"];
    const dirs = {
      src: {
        core: ["ALNEngine.js", "system.language.core.js"],
        blueprints: ["RepoBlueprint.js"],
        cli: ["aln-cli.js"]
      },
      examples: ["demo-system-language-core.js"],
      test: ["SystemLanguageCore.test.js"]
    };

    const expected = [...coreFiles];

    Object.entries(dirs).forEach(([dirName, content]) => {
      if (Array.isArray(content)) {
        content.forEach((file) => expected.push(path.join(dirName, file)));
      } else {
        Object.entries(content).forEach(([subDir, files]) => {
          files.forEach((file) => expected.push(path.join(dirName, subDir, file)));
        });
      }
    });

    return expected;
  }

  _scanPaths(rootDir) {
    const results = [];

    const walk = (base, relBase = "") => {
      const entries = fs.existsSync(base) ? fs.readdirSync(base, { withFileTypes: true }) : [];
      for (const entry of entries) {
        const relPath = path.join(relBase, entry.name);
        const full = path.join(base, entry.name);
        if (entry.isDirectory()) {
          walk(full, relPath);
        } else {
          results.push(relPath);
        }
      }
    };

    walk(rootDir, "");
    return results;
  }

  _syncNestedDir(rootDir, baseDir, structure) {
    const basePath = path.join(rootDir, baseDir);
    this._ensureDir(basePath);

    Object.entries(structure).forEach(([subDir, files]) => {
      const subPath = path.join(basePath, subDir);
      this._ensureDir(subPath);
      files.forEach((file) => {
        const full = path.join(subPath, file);
        if (!fs.existsSync(full)) {
          fs.writeFileSync(full, this._defaultModuleContent(file), "utf8");
        }
      });
    });
  }

  _ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  _defaultRootFileContent(fileName, blueprint) {
    if (fileName === "README.md") {
      return `# ${blueprint.name}\n\nSystem-language core repo synchronized via ALN.\n`;
    }
    if (fileName === "MANIFESTO.md") {
      return `# System Language Core\n\nThis repository is aligned with ALN system.language.core.\n`;
    }
    if (fileName === "package.json") {
      const pkg = {
        name: this._slug(blueprint.name),
        version: "0.1.0",
        type: "module",
        description: "ALN system.language.core repository",
        scripts: {
          test: "node ./test/SystemLanguageCore.test.js || echo \"Add tests\""
        }
      };
      return JSON.stringify(pkg, null, 2);
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
      return `// Auto-generated stub for ${base}\n\nexport class ${className} {\n  constructor() {}\n}\n\nexport default ${className};\n`;
    }
    return "";
  }

  // ---------------------------------------------------------------------------
  // Validation / hashing
  // ---------------------------------------------------------------------------

  _validateDescriptor(d) {
    const required = ["name", "version", "domain", "repoUrl", "owner"];
    required.forEach((key) => {
      if (!d || typeof d[key] !== "string" || !d[key].trim()) {
        throw new Error(`ALNModuleDescriptor.${key} must be a non-empty string.`);
      }
    });
  }

  _validateBlueprintRef(b) {
    if (!b || typeof b.name !== "string" || !b.name.trim()) {
      throw new Error("RepoBlueprintRef.name must be a non-empty string.");
    }
    if (!b.rootDir || typeof b.rootDir !== "string") {
      throw new Error("RepoBlueprintRef.rootDir must be a string.");
    }
  }

  _hashDescriptor(desc) {
    const str = JSON.stringify({
      name: desc.name,
      version: desc.version,
      domain: desc.domain,
      repoUrl: desc.repoUrl,
      owner: desc.owner,
      structCount: desc.structCount,
      functionCount: desc.functionCount,
      constantCount: desc.constantCount
    });
    return crypto.createHash("sha256").update(str).digest("hex").slice(0, 16);
  }

  _slug(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

const systemLanguageCore = new SystemLanguageCore();

export { SystemLanguageCore };
export default systemLanguageCore;
