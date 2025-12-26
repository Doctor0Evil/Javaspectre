// Path: src/core/ALNModuleRegistry.js

/**
 * ALNModuleRegistry
 *
 * A global, auditable registry of ALN modules and their contracts.
 * Makes ALN specs discoverable, comparable, and reusable across repos.
 */

class ALNModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  /**
   * Register or update an ALN module contract.
   * @param {object} spec
   * @param {string} spec.name
   * @param {string} [spec.version]
   * @param {string} [spec.domain]   - e.g., "theme", "repo", "api", "vm-introspection"
   * @param {object[]} [spec.structs]
   * @param {object[]} [spec.functions]
   * @param {object[]} [spec.constants]
   * @param {object} [spec.meta]     - arbitrary metadata (repo URL, owner, etc.)
   */
  register(spec) {
    if (!spec || typeof spec.name !== "string" || !spec.name.trim()) {
      throw new Error("ALNModuleRegistry.register: spec.name must be a non-empty string.");
    }

    const name = spec.name.trim();
    const version = spec.version || "0.1.0";
    const existing = this.modules.get(name);

    const record = {
      name,
      version,
      domain: spec.domain || "general",
      structs: Array.isArray(spec.structs) ? spec.structs.slice() : [],
      functions: Array.isArray(spec.functions) ? spec.functions.slice() : [],
      constants: Array.isArray(spec.constants) ? spec.constants.slice() : [],
      meta: { ...(spec.meta || {}) },
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      const history = existing.history || [];
      history.push({
        version: existing.version,
        updatedAt: existing.updatedAt,
        meta: existing.meta
      });
      record.history = history;
    } else {
      record.history = [];
    }

    this.modules.set(name, record);
    return record;
  }

  /**
   * Get a module contract by name.
   */
  get(name) {
    return this.modules.get(name) || null;
  }

  /**
   * List modules with lightweight summaries.
   */
  list() {
    const out = [];
    for (const [, rec] of this.modules.entries()) {
      out.push({
        name: rec.name,
        version: rec.version,
        domain: rec.domain,
        structCount: rec.structs.length,
        functionCount: rec.functions.length,
        constantCount: rec.constants.length,
        updatedAt: rec.updatedAt
      });
    }
    return out;
  }

  /**
   * Search modules by domain/tag-like filters.
   * @param {object} query
   * @param {string} [query.domain]
   * @param {string} [query.text]
   */
  search(query = {}) {
    const domain = query.domain && query.domain.toLowerCase();
    const text = query.text && query.text.toLowerCase();
    const results = [];

    for (const [, rec] of this.modules.entries()) {
      if (domain && rec.domain.toLowerCase() !== domain) continue;

      if (text) {
        const haystack = JSON.stringify(rec).toLowerCase();
        if (!haystack.includes(text)) continue;
      }

      results.push(rec);
    }

    return results;
  }

  /**
   * Export registry to a JSON-serializable snapshot.
   */
  exportSnapshot() {
    return {
      exportedAt: new Date().toISOString(),
      modules: this.list()
    };
  }
}

const globalALNModuleRegistry = new ALNModuleRegistry();

export { ALNModuleRegistry };
export default globalALNModuleRegistry;
