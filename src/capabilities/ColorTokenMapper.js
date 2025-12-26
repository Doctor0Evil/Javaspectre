// Path: src/capabilities/ColorTokenMapper.js

/**
 * ColorTokenMapper
 * Turns a GitHub-style `colors` theme object into structured virtual-objects:
 * - ColorSemanticFamilies (accent, danger, open, closed, neutral, done, attention, fg, canvas, overlay)
 * - ComponentColorSystems (btn, header, codemirror, actionListItem, avatar, etc.)
 * - CodeAndDiffColorSystems (prettylights.syntax, codemirror.syntax, diffBlob, diffstat, checks)
 * - AnsiColorSets (ansi, checks.ansi)
 *
 * Each color entry captures both the CSS variable name and its fallback color/value.
 */

class ColorTokenMapper {
  constructor(options = {}) {
    this.maxPreview = typeof options.maxPreview === "number" ? options.maxPreview : 32;
  }

  /**
   * Map a raw `colors` object into a structured color report.
   */
  mapColors(colorsRoot) {
    const root = colorsRoot || {};

    const semanticFamilies = this._buildSemanticFamilies(root);
    const componentSystems = this._buildComponentSystems(root);
    const codeAndDiffSystems = this._buildCodeAndDiffSystems(root);
    const ansiColorSets = this._buildAnsiColorSets(root);

    const virtualObjects = [
      {
        id: "color-semantic-families",
        kind: "color-semantic-families",
        families: semanticFamilies
      },
      {
        id: "color-component-systems",
        kind: "color-component-systems",
        systems: componentSystems
      },
      {
        id: "color-code-and-diff-systems",
        kind: "color-code-and-diff-systems",
        systems: codeAndDiffSystems
      },
      {
        id: "ansi-color-sets",
        kind: "ansi-color-sets",
        sets: ansiColorSets
      }
    ];

    return {
      sourceKind: "theme-colors-object",
      virtualObjects,
      semanticFamilies,
      componentSystems,
      codeAndDiffSystems,
      ansiColorSets,
      summary: this._buildSummary(root, semanticFamilies, componentSystems, codeAndDiffSystems, ansiColorSets)
    };
  }

  // -----------------------
  // Semantic families
  // -----------------------

  _buildSemanticFamilies(root) {
    const familyKeys = [
      "accent",
      "attention",
      "danger",
      "open",
      "closed",
      "neutral",
      "done",
      "fg",
      "canvas",
      "overlay",
      "pageHeaderBg"
    ];

    const families = {};

    familyKeys.forEach((key) => {
      const value = root[key];
      if (!value) return;

      if (key === "pageHeaderBg") {
        families[key] = {
          kind: "single",
          tokens: {
            pageHeaderBg: this._parseCssVar(value)
          }
        };
      } else if (value && typeof value === "object") {
        families[key] = {
          kind: "group",
          tokens: this._flattenTokenGroup(value, key)
        };
      }
    });

    return families;
  }

  // -----------------------
  // Component systems
  // -----------------------

  _buildComponentSystems(root) {
    const systems = {};

    const componentKeys = [
      "btn",
      "header",
      "headerSearch",
      "menu",
      "avatar",
      "actionListItem",
      "input",
      "counter",
      "control",
      "marketingIcon",
      "mktg",
      "canvas",
      "fg"
    ];

    componentKeys.forEach((key) => {
      const value = root[key];
      if (!value || typeof value !== "object") return;

      systems[key] = {
        key,
        tokens: this._flattenTokenGroup(value, key)
      };
    });

    return systems;
  }

  // -----------------------
  // Code, diff, and checks systems
  // -----------------------

  _buildCodeAndDiffSystems(root) {
    const systems = {};

    if (root.prettylights && root.prettylights.syntax) {
      systems.prettylightsSyntax = {
        key: "prettylights.syntax",
        tokens: this._flattenTokenGroup(root.prettylights.syntax, "prettylights.syntax")
      };
    }

    if (root.codemirror) {
      const baseTokens = this._flattenTokenGroup(root.codemirror, "codemirror");
      systems.codemirror = { key: "codemirror", tokens: baseTokens };

      if (root.codemirror.syntax) {
        systems.codemirrorSyntax = {
          key: "codemirror.syntax",
          tokens: this._flattenTokenGroup(root.codemirror.syntax, "codemirror.syntax")
        };
      }
    }

    if (root.diffBlob) {
      systems.diffBlob = {
        key: "diffBlob",
        tokens: this._flattenTokenGroup(root.diffBlob, "diffBlob")
      };
    }

    if (root.diffstat) {
      systems.diffstat = {
        key: "diffstat",
        tokens: this._flattenTokenGroup(root.diffstat, "diffstat")
      };
    }

    if (root.checks) {
      systems.checks = {
        key: "checks",
        tokens: this._flattenTokenGroup(root.checks, "checks")
      };
    }

    return systems;
  }

  // -----------------------
  // ANSI color sets
  // -----------------------

  _buildAnsiColorSets(root) {
    const sets = {};

    if (root.ansi) {
      sets.ansi = {
        key: "ansi",
        tokens: this._flattenTokenGroup(root.ansi, "ansi")
      };
    }

    if (root.checks && root.checks.ansi) {
      sets.checksAnsi = {
        key: "checks.ansi",
        tokens: this._flattenTokenGroup(root.checks.ansi, "checks.ansi")
      };
    }

    return sets;
  }

  // -----------------------
  // Helpers
  // -----------------------

  _flattenTokenGroup(obj, prefix) {
    const out = {};

    const walk = (node, pathPrefix) => {
      if (!node || typeof node !== "object") return;
      Object.keys(node).forEach((key) => {
        const value = node[key];
        const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key;
        if (value && typeof value === "object" && !this._looksLikeCssVarString(value)) {
          walk(value, fullPath);
        } else {
          out[fullPath] = this._parseCssVar(value);
        }
      });
    };

    walk(obj, prefix);
    return out;
  }

  _looksLikeCssVarString(value) {
    return typeof value === "string" && value.trim().startsWith("var(");
  }

  _parseCssVar(value) {
    if (typeof value !== "string") {
      return { raw: value, cssVar: null, fallback: null };
    }

    const trimmed = value.trim();
    if (!trimmed.startsWith("var(")) {
      return { raw: trimmed, cssVar: null, fallback: null };
    }

    // Support nested var syntax like var(--token, var(--other, #fff))
    const inner = trimmed.slice(4, -1); // remove var( and )
    const parts = this._splitTopLevelComma(inner);
    const varName = parts[0] ? parts[0].trim() : null;
    const fallback = parts[1] ? parts.slice(1).join(",").trim() : null;

    return {
      raw: trimmed,
      cssVar: varName,
      fallback
    };
  }

  _splitTopLevelComma(str) {
    const result = [];
    let depth = 0;
    let current = "";

    for (let i = 0; i < str.length; i += 1) {
      const ch = str[i];
      if (ch === "(") {
        depth += 1;
        current += ch;
      } else if (ch === ")") {
        depth = Math.max(0, depth - 1);
        current += ch;
      } else if (ch === "," && depth === 0) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }

    if (current) result.push(current);
    return result;
  }

  _buildSummary(root, semanticFamilies, componentSystems, codeAndDiffSystems, ansiColorSets) {
    const totalTopLevelKeys = Object.keys(root || {}).length;

    return {
      totalTopLevelKeys,
      semanticFamilyCount: Object.keys(semanticFamilies).length,
      componentSystemCount: Object.keys(componentSystems).length,
      codeAndDiffSystemCount: Object.keys(codeAndDiffSystems).length,
      ansiSetCount: Object.keys(ansiColorSets).length,
      notes: [
        "Use ColorSemanticFamilies to drive stateful UI (success, danger, warning, neutral) without hard-coding hex colors.",
        "Use ComponentColorSystems to generate or validate button, header, menu, and input theming.",
        "Use CodeAndDiffColorSystems to keep code editors, diffs, and CI views visually consistent.",
        "Use AnsiColorSets to theme terminals and log views according to the same palette."
      ]
    };
  }
}

export default ColorTokenMapper;
