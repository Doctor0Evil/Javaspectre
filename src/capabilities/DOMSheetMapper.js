// Path: src/capabilities/DOMSheetMapper.js
// Dynamic CSS selector and DOM pattern stabilization.

import { parse } from "node-html-parser";

export class DOMSheetMapper {
  constructor(options = {}) {
    this.maxSelectors =
      typeof options.maxSelectors === "number" ? options.maxSelectors : 40;
  }

  /**
   * Build a DOM sheet describing stable selectors and attribute patterns.
   *
   * @param {object} params
   * @param {string} params.html
   * @returns {object}
   */
  buildDomSheet(params = {}) {
    const { html } = params;
    if (!html) {
      throw new Error("DOMSheetMapper.buildDomSheet: html is required.");
    }

    const root = parse(html);
    const nodes = root.querySelectorAll("*");
    const selectorStats = new Map();

    nodes.forEach((el) => {
      const tag = el.tagName.toLowerCase();
      const cls = (el.getAttribute("class") || "")
        .split(/\s+/)
        .filter(Boolean);
      const id = el.getAttribute("id");

      const selectors = [];

      selectors.push(tag);

      if (id) {
        selectors.push(`${tag}#${id}`);
      }

      if (cls.length > 0) {
        selectors.push(`${tag}.${cls.join(".")}`);
      }

      selectors.forEach((sel) => {
        const stat = selectorStats.get(sel) || {
          selector: sel,
          count: 0,
          sampleText: ""
        };
        stat.count += 1;
        if (!stat.sampleText && el.text) {
          const text = String(el.text)
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 80);
          stat.sampleText = text;
        }
        selectorStats.set(sel, stat);
      });
    });

    const ranked = Array.from(selectorStats.values()).sort(
      (a, b) => b.count - a.count
    );

    const top = ranked.slice(0, this.maxSelectors);

    const sheet = {
      selectors: top,
      createdAt: new Date().toISOString()
    };

    return sheet;
  }
}

export default DOMSheetMapper;
