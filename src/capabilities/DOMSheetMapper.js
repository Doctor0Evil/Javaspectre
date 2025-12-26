// Path: src/capabilities/DOMSheetMapper.js

/**
 * DOMSheetMapper
 * Spectral DOM–CSS introspection and “dom-sheet” virtual-object generator.
 *
 * - Safely traverses document.styleSheets (handles cross-origin failures).
 * - Extracts rules, selectors, and layer/media context.
 * - Maps selectors to live DOM usage via querySelectorAll.
 * - Classifies selector patterns (BEM-ish, utility-like, hashed modules).
 * - Emits a structured report suitable for Javaspectre-style deep excavation.
 */

class DOMSheetMapper {
  constructor(options = {}) {
    this.maxRulesPerSheet =
      typeof options.maxRulesPerSheet === "number" ? options.maxRulesPerSheet : 5000;
    this.maxSelectorsPerRule =
      typeof options.maxSelectorsPerRule === "number" ? options.maxSelectorsPerRule : 16;
    this.sampleNodesPerSelector =
      typeof options.sampleNodesPerSelector === "number"
        ? options.sampleNodesPerSelector
        : 10;
    this.enableDomUsageScan = options.enableDomUsageScan !== false;
  }

  /**
   * Entry point: build a complete dom-sheet report from the current document.
   */
  mapDocument(doc = document) {
    const styleSheets = Array.from(doc.styleSheets || []);
    const cssVirtualObjects = [];
    const selectorCatalog = new Map(); // key -> selector info
    const sheetSummaries = [];

    styleSheets.forEach((sheet, index) => {
      const sheetId = `sheet-${index}`;
      const sheetSummary = this._inspectStyleSheet(sheetId, sheet, doc, selectorCatalog);
      if (sheetSummary) {
        sheetSummaries.push(sheetSummary);
        cssVirtualObjects.push(sheetSummary.virtualObject);
      }
    });

    const selectorArray = Array.from(selectorCatalog.values());
    const selectorUsageStats = this._aggregateSelectorUsage(selectorArray);

    return {
      sheets: sheetSummaries,
      selectors: selectorArray,
      usage: selectorUsageStats,
      summary: this._buildSummary(sheetSummaries, selectorArray, selectorUsageStats),
      hint: "Use this dom-sheet map to generate stable extraction modules, monitoring rules, or further Javaspectre virtual-object excavation."
    };
  }

  // -----------------------
  // Sheet & rule inspection
  // -----------------------

  _inspectStyleSheet(sheetId, sheet, doc, selectorCatalog) {
    let href = null;
    let ownerNodeDescription = null;
    try {
      href = sheet.href || null;
    } catch (_) {
      href = null;
    }

    try {
      if (sheet.ownerNode) {
        ownerNodeDescription = this._describeNode(sheet.ownerNode);
      }
    } catch (_) {
      ownerNodeDescription = null;
    }

    let rules;
    try {
      rules = sheet.cssRules || sheet.rules || null;
    } catch (_) {
      // Cross-origin stylesheets throw on cssRules access
      return {
        id: sheetId,
        virtualObject: {
          id: sheetId,
          kind: "css-stylesheet",
          href,
          origin: "cross-origin-or-restricted",
          note: "cssRules not accessible; likely cross-origin.",
          ruleCount: null,
          ownerNode: ownerNodeDescription
        },
        selectorCount: 0,
        accessible: false
      };
    }

    if (!rules) {
      return {
        id: sheetId,
        virtualObject: {
          id: sheetId,
          kind: "css-stylesheet",
          href,
          origin: "empty-or-unknown",
          note: "Stylesheet has no accessible rules.",
          ruleCount: 0,
          ownerNode: ownerNodeDescription
        },
        selectorCount: 0,
        accessible: true
      };
    }

    const maxRules = this.maxRulesPerSheet;
    const ruleCount = Math.min(rules.length, maxRules);
    const ruleMetadata = [];

    for (let i = 0; i < ruleCount; i += 1) {
      const rule = rules[i];
      const ruleId = `${sheetId}-rule-${i}`;
      const meta = this._inspectRule(ruleId, rule, doc, selectorCatalog);
      if (meta) {
        ruleMetadata.push(meta);
      }
    }

    const selectorCount = ruleMetadata.reduce(
      (acc, r) => acc + (r.selectorCount || 0),
      0
    );

    const virtualObject = {
      id: sheetId,
      kind: "css-stylesheet",
      href,
      origin: href ? "linked" : "inline",
      ruleCount,
      selectorCount,
      ownerNode: ownerNodeDescription,
      rules: ruleMetadata
    };

    return {
      id: sheetId,
      virtualObject,
      selectorCount,
      accessible: true
    };
  }

  _inspectRule(ruleId, rule, doc, selectorCatalog) {
    if (!rule) return null;

    const type = rule.type;
    switch (type) {
      case CSSRule.STYLE_RULE:
        return this._inspectStyleRule(ruleId, rule, doc, selectorCatalog);
      case CSSRule.MEDIA_RULE:
        return this._inspectMediaRule(ruleId, rule, doc, selectorCatalog);
      case CSSRule.LAYER_BLOCK_RULE:
      case CSSRule.LAYER_RULE:
        return this._inspectLayerRule(ruleId, rule, doc, selectorCatalog);
      default:
        return {
          id: ruleId,
          kind: "css-rule",
          type,
          selectorCount: 0,
          descriptor: rule.cssText.slice(0, 200)
        };
    }
  }

  _inspectStyleRule(ruleId, rule, doc, selectorCatalog) {
    const rawSelectorText = rule.selectorText || "";
    const selectors = rawSelectorText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, this.maxSelectorsPerRule);

    const selectorEntries = [];
    selectors.forEach((selector) => {
      const selectorId = `${ruleId}::${selector}`;
      const descriptor = this._classifySelector(selector);

      let domUsage = null;
      if (this.enableDomUsageScan && doc && typeof doc.querySelectorAll === "function") {
        try {
          const nodes = Array.from(doc.querySelectorAll(selector)).slice(
            0,
            this.sampleNodesPerSelector
          );
          domUsage = {
            count: nodes.length,
            sampleNodes: nodes.map((n) => this._describeNode(n))
          };
        } catch (_) {
          domUsage = {
            count: null,
            sampleNodes: [],
            error: "Selector not queryable (possibly invalid or browser-limited)."
          };
        }
      }

      const existing = selectorCatalog.get(selector);
      if (!existing) {
        selectorCatalog.set(selector, {
          selector,
          pattern: descriptor.pattern,
          specificityHint: descriptor.specificityHint,
          kind: descriptor.kind,
          layers: new Set(),
          mediaQueries: new Set(),
          totalRuleHits: 1,
          totalDomMatches: domUsage && domUsage.count ? domUsage.count : 0,
          sampleNodes: domUsage ? domUsage.sampleNodes : []
        });
      } else {
        existing.totalRuleHits += 1;
        if (domUsage && typeof domUsage.count === "number") {
          existing.totalDomMatches += domUsage.count;
        }
        if (domUsage && domUsage.sampleNodes.length > 0 && existing.sampleNodes.length === 0) {
          existing.sampleNodes = domUsage.sampleNodes;
        }
      }

      selectorEntries.push({
        id: selectorId,
        selector,
        kind: descriptor.kind,
        pattern: descriptor.pattern,
        specificityHint: descriptor.specificityHint,
        domUsage
      });
    });

    return {
      id: ruleId,
      kind: "css-style-rule",
      selectorText: rawSelectorText,
      selectorCount: selectorEntries.length,
      selectors: selectorEntries
    };
  }

  _inspectMediaRule(ruleId, rule, doc, selectorCatalog) {
    const conditionText = rule.conditionText || "";
    const innerRules = [];
    const rules = rule.cssRules || [];
    const maxRules = Math.min(rules.length, this.maxRulesPerSheet);

    for (let i = 0; i < maxRules; i += 1) {
      const childRule = rules[i];
      const childId = `${ruleId}-inner-${i}`;
      const meta = this._inspectRule(childId, childRule, doc, selectorCatalog);
      if (meta && meta.selectors) {
        meta.selectors.forEach((s) => {
          const entry = selectorCatalog.get(s.selector);
          if (entry) {
            entry.mediaQueries.add(conditionText);
          }
        });
      }
      if (meta) {
        innerRules.push(meta);
      }
    }

    const selectorCount = innerRules.reduce(
      (acc, r) => acc + (r.selectorCount || 0),
      0
    );

    return {
      id: ruleId,
      kind: "css-media-rule",
      media: conditionText,
      selectorCount,
      rules: innerRules
    };
  }

  _inspectLayerRule(ruleId, rule, doc, selectorCatalog) {
    const layerName = rule.name || null;
    const innerRules = [];
    const rules = rule.cssRules || [];
    const maxRules = Math.min(rules.length, this.maxRulesPerSheet);

    for (let i = 0; i < maxRules; i += 1) {
      const childRule = rules[i];
      const childId = `${ruleId}-inner-${i}`;
      const meta = this._inspectRule(childId, childRule, doc, selectorCatalog);
      if (meta && meta.selectors) {
        meta.selectors.forEach((s) => {
          const entry = selectorCatalog.get(s.selector);
          if (entry) {
            entry.layers.add(layerName || "unnamed-layer");
          }
        });
      }
      if (meta) {
        innerRules.push(meta);
      }
    }

    const selectorCount = innerRules.reduce(
      (acc, r) => acc + (r.selectorCount || 0),
      0
    );

    return {
      id: ruleId,
      kind: "css-layer-rule",
      layer: layerName,
      selectorCount,
      rules: innerRules
    };
  }

  // -----------------------
  // Selector classification
  // -----------------------

  _classifySelector(selector) {
    const result = {
      kind: "unknown",
      pattern: "generic",
      specificityHint: "unknown"
    };

    if (!selector) return result;

    if (/^\.[a-z0-9_-]+$/i.test(selector)) {
      result.kind = "class-only";
    } else if (/^[a-z][a-z0-9_-]*$/i.test(selector)) {
      result.kind = "tag-only";
    } else if (/^#[a-z0-9_-]+$/i.test(selector)) {
      result.kind = "id-only";
      result.specificityHint = "high";
    } else if (selector.includes(":")) {
      result.kind = "pseudo-selector";
    } else if (selector.includes(">") || selector.includes("+") || selector.includes("~")) {
      result.kind = "combinator";
    } else if (selector.includes("[")) {
      result.kind = "attribute-selector";
    }

    if (/[a-z0-9]+__[a-z0-9]+--[a-z0-9-]+/i.test(selector)) {
      result.pattern = "bem-element-modifier";
    } else if (/[a-z0-9]+__[a-z0-9]+/i.test(selector)) {
      result.pattern = "bem-element";
    } else if (/[a-z0-9]+--[a-z0-9-]+/i.test(selector)) {
      result.pattern = "bem-modifier";
    } else if (
      /\.styles-module__/.test(selector) ||
      /__[A-Za-z0-9_-]+--[A-Za-z0-9_-]+/.test(selector)
    ) {
      result.pattern = "css-modules-hash";
    } else if (/\.u-[a-z0-9-]+/i.test(selector)) {
      result.pattern = "utility-class";
    }

    if (result.specificityHint === "unknown") {
      if (result.kind === "class-only" || result.kind === "pseudo-selector") {
        result.specificityHint = "medium";
      } else if (result.kind === "tag-only") {
        result.specificityHint = "low";
      }
    }

    return result;
  }

  // -----------------------
  // Aggregation & summary
  // -----------------------

  _aggregateSelectorUsage(selectorArray) {
    let totalRules = 0;
    let totalMatches = 0;
    let maxMatches = 0;
    let hotSelectors = [];

    selectorArray.forEach((entry) => {
      totalRules += entry.totalRuleHits || 0;
      totalMatches += entry.totalDomMatches || 0;
      if (entry.totalDomMatches > maxMatches) {
        maxMatches = entry.totalDomMatches;
      }
    });

    const threshold = Math.max(10, Math.floor(maxMatches * 0.4));
    hotSelectors = selectorArray
      .filter((e) => e.totalDomMatches >= threshold)
      .slice(0, 50);

    const byKind = {};
    selectorArray.forEach((e) => {
      const kind = e.kind || "unknown";
      if (!byKind[kind]) byKind[kind] = 0;
      byKind[kind] += 1;
    });

    const byPattern = {};
    selectorArray.forEach((e) => {
      const pattern = e.pattern || "generic";
      if (!byPattern[pattern]) byPattern[pattern] = 0;
      byPattern[pattern] += 1;
    });

    return {
      totalSelectors: selectorArray.length,
      totalRules,
      totalDomMatches: totalMatches,
      maxDomMatchesForSingleSelector: maxMatches,
      hotSelectors,
      byKind,
      byPattern
    };
  }

  _buildSummary(sheetSummaries, selectorArray, usage) {
    const linkedSheets = sheetSummaries.filter(
      (s) => s.virtualObject && s.virtualObject.origin === "linked"
    );
    const inlineSheets = sheetSummaries.filter(
      (s) => s.virtualObject && s.virtualObject.origin === "inline"
    );
    const restrictedSheets = sheetSummaries.filter((s) => !s.accessible);

    return {
      sheetCount: sheetSummaries.length,
      linkedSheetCount: linkedSheets.length,
      inlineSheetCount: inlineSheets.length,
      restrictedSheetCount: restrictedSheets.length,
      selectorCount: selectorArray.length,
      totalDomMatches: usage.totalDomMatches,
      notes: [
        "Use `usage.hotSelectors` to identify core layout/utility classes.",
        "Use `usage.byPattern` to detect BEM, utility, or CSS-module ecosystems.",
        "Use per-sheet rule counts to prioritize which CSS bundles to refactor or map."
      ]
    };
  }

  // -----------------------
  // Node description
  // -----------------------

  _describeNode(node) {
    if (!node) return null;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || "").trim();
      return {
        type: "text",
        sample: text.slice(0, 80)
      };
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return {
        type: "node",
        nodeType: node.nodeType
      };
    }

    const el = node;
    const classList = Array.from(el.classList || []);
    const attrs = {};
    if (el.attributes) {
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name === "class" || attr.name === "style") return;
        if (attr.name.startsWith("data-")) return;
        attrs[attr.name] = attr.value;
      });
    }

    return {
      type: "element",
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: classList,
      attrs,
      textSample: (el.textContent || "").trim().slice(0, 80)
    };
  }
}

/**
 * Convenience helper for one-line use in a browser console:
 *
 *   const mapper = new DOMSheetMapper();
 *   const report = mapper.mapDocument(document);
 *   console.log(report);
 */
export default DOMSheetMapper;
