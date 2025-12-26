// Path: src/capabilities/LiveVirtualHarvester.js
// DOM/API scanning and virtual-object model generation.

import { parse } from "node-html-parser";

export class LiveVirtualHarvester {
  constructor(options = {}) {
    this.maxDepth = typeof options.maxDepth === "number" ? options.maxDepth : 6;
    this.maxSamples =
      typeof options.maxSamples === "number" ? options.maxSamples : 50;
  }

  /**
   * Harvest structures from HTML and optional JSON payloads.
   *
   * @param {object} params
   * @param {string} [params.html]
   * @param {any} [params.json]
   * @returns {object}
   */
  harvest(params = {}) {
    const { html, json } = params;

    const domSummary = html ? this.#analyzeHtml(html) : null;
    const jsonSummary =
      typeof json !== "undefined" ? this.#analyzeJson(json) : null;

    const combinedCatalog = {
      domSelectors: domSummary ? domSummary.selectors : [],
      domAttributes: domSummary ? domSummary.attributes : [],
      jsonShapes: jsonSummary ? jsonSummary.shapes : [],
      jsonSamples: jsonSummary ? jsonSummary.samples : []
    };

    const typeDefinitions = this.#buildTypeDefinitions(combinedCatalog);

    return {
      catalog: combinedCatalog,
      typeDefinitions
    };
  }

  #analyzeHtml(html) {
    const root = parse(html);
    const allNodes = root.querySelectorAll("*");
    const selectors = new Map();
    const attributes = new Map();

    const limit = Math.min(allNodes.length, this.maxSamples);

    for (let i = 0; i < limit; i += 1) {
      const el = allNodes[i];
      if (!el) continue;

      const tag = el.tagName.toLowerCase();
      const classes = (el.getAttribute("class") || "")
        .split(/\s+/)
        .filter(Boolean);
      const id = el.getAttribute("id");

      const selectorParts = [tag];
      if (id) selectorParts.push(`#${id}`);
      if (classes.length > 0) {
        selectorParts.push("." + classes.join("."));
      }
      const selector = selectorParts.join("");

      selectors.set(selector, (selectors.get(selector) || 0) + 1);

      Array.from(el.attributes || []).forEach((attr) => {
        const key = attr.name;
        attributes.set(key, (attributes.get(key) || 0) + 1);
      });
    }

    const selectorList = Array.from(selectors.entries())
      .map(([selector, count]) => ({ selector, count }))
      .sort((a, b) => b.count - a.count);

    const attributeList = Array.from(attributes.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      selectors: selectorList,
      attributes: attributeList
    };
  }

  #analyzeJson(value) {
    const shapes = [];
    const samples = [];
    const visited = new WeakSet();

    const walk = (v, path, depth) => {
      if (depth > this.maxDepth) return;

      if (v && typeof v === "object") {
        if (visited.has(v)) return;
        visited.add(v);
      }

      const type = this.#typeOf(v);
      samples.push({ path, type });

      if (type === "object") {
        const keys = Object.keys(v);
        shapes.push({ path, kind: "object", keys });
        keys.forEach((k) => walk(v[k], `${path}.${k}`, depth + 1));
      } else if (type === "array") {
        const len = v.length;
        shapes.push({ path, kind: "array", length: len });
        const max = Math.min(len, 5);
        for (let i = 0; i < max; i += 1) {
          walk(v[i], `${path}[${i}]`, depth + 1);
        }
      }
    };

    walk(value, "$", 0);

    return {
      shapes,
      samples
    };
  }

  #typeOf(v) {
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    return typeof v;
  }

  #buildTypeDefinitions(catalog) {
    const lines = [];

    catalog.jsonShapes.forEach((shape) => {
      if (shape.kind === "object") {
        const className = this.#classNameFromPath(shape.path);
        const keys = shape.keys || [];
        lines.push(`// Auto-generated shape for ${shape.path}`);
        lines.push(`export class ${className} {`);
        lines.push("  constructor(init = {}) {");
        keys.forEach((k) => {
          lines.push(`    this.${k} = init.${k};`);
        });
        lines.push("  }");
        lines.push("}");
        lines.push("");
      }
    });

    return lines.join("\n");
  }

  #classNameFromPath(pathStr) {
    const clean = pathStr.replace(/[^a-zA-Z0-9]+/g, " ");
    const parts = clean.split(" ").filter(Boolean);
    const capitalized = parts.map(
      (p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    );
    const name = capitalized.join("");
    return name || "VirtualObject";
  }
}

export default LiveVirtualHarvester;
