// Path: src/capabilities/SyntaxTokenMapper.js

/**
 * SyntaxTokenMapper
 * Converts a `prettylights.syntax` object into structured virtual-objects:
 * - SyntaxRoleMap (language token roles)
 * - DiffMarkupRoleMap (inserted/changed/deleted markup)
 * - DiagnosticRoleMap (errors, bracket highlighting, linter marks)
 *
 * Each entry captures both the CSS variable and its fallback color.
 */

class SyntaxTokenMapper {
  constructor(options = {}) {
    this.maxPreview = typeof options.maxPreview === "number" ? options.maxPreview : 32;
  }

  /**
   * Map a raw `prettylights.syntax` object into a structured report.
   */
  mapSyntax(prettylightsSyntax) {
    const raw = prettylightsSyntax || {};
    const syntaxRoleMap = this._buildSyntaxRoleMap(raw);
    const diffMarkupRoleMap = this._buildDiffMarkupRoleMap(raw);
    const diagnosticRoleMap = this._buildDiagnosticRoleMap(raw);

    const virtualObjects = [
      {
        id: "syntax-role-map",
        kind: "syntax-role-map",
        roles: syntaxRoleMap
      },
      {
        id: "diff-markup-role-map",
        kind: "diff-markup-role-map",
        roles: diffMarkupRoleMap
      },
      {
        id: "diagnostic-role-map",
        kind: "diagnostic-role-map",
        roles: diagnosticRoleMap
      }
    ];

    return {
      sourceKind: "prettylights-syntax-tokens",
      virtualObjects,
      syntaxRoleMap,
      diffMarkupRoleMap,
      diagnosticRoleMap,
      summary: this._buildSummary(raw, syntaxRoleMap, diffMarkupRoleMap, diagnosticRoleMap)
    };
  }

  // -----------------------
  // Role maps
  // -----------------------

  _buildSyntaxRoleMap(raw) {
    const roles = {};

    const mappings = {
      comment: "comment",
      constant: "constant",
      constantOtherReferenceLink: "constant.other.reference-link",
      entity: "entity",
      entityTag: "entity.tag",
      keyword: "keyword",
      string: "string",
      stringRegexp: "string.regexp",
      storageModifierImport: "storage.modifier.import",
      variable: "variable",
      markupBold: "markup.bold",
      markupItalic: "markup.italic",
      markupList: "markup.list",
      markupHeading: "markup.heading",
      metaDiffRange: "meta.diff.range"
    };

    Object.keys(mappings).forEach((key) => {
      if (raw[key]) {
        roles[mappings[key]] = this._parseCssVar(raw[key]);
      }
    });

    return roles;
  }

  _buildDiffMarkupRoleMap(raw) {
    const roles = {};

    const mappings = {
      markupInsertedBg: "markup.inserted.bg",
      markupInsertedText: "markup.inserted.text",
      markupDeletedBg: "markup.deleted.bg",
      markupDeletedText: "markup.deleted.text",
      markupChangedBg: "markup.changed.bg",
      markupChangedText: "markup.changed.text",
      markupIgnoredBg: "markup.ignored.bg",
      markupIgnoredText: "markup.ignored.text",
      carriageReturnBg: "control.carriage-return.bg",
      carriageReturnText: "control.carriage-return.text"
    };

    Object.keys(mappings).forEach((key) => {
      if (raw[key]) {
        roles[mappings[key]] = this._parseCssVar(raw[key]);
      }
    });

    return roles;
  }

  _buildDiagnosticRoleMap(raw) {
    const roles = {};

    const mappings = {
      invalidIllegalBg: "diagnostic.invalid-illegal.bg",
      invalidIllegalText: "diagnostic.invalid-illegal.text",
      sublimelinterGutterMark: "diagnostic.linter.gutter-mark",
      brackethighlighterAngle: "diagnostic.brackethighlighter.angle",
      brackethighlighterUnmatched: "diagnostic.brackethighlighter.unmatched"
    };

    Object.keys(mappings).forEach((key) => {
      if (raw[key]) {
        roles[mappings[key]] = this._parseCssVar(raw[key]);
      }
    });

    return roles;
  }

  // -----------------------
  // CSS var parsing
  // -----------------------

  /**
   * Parse strings like:
   *   var(--color-prettylights-syntax-keyword, #ff7b72)
   * into:
   *   { raw: "...", cssVar: "--color-prettylights-syntax-keyword", fallback: "#ff7b72" }
   */
  _parseCssVar(value) {
    if (typeof value !== "string") {
      return { raw: value, cssVar: null, fallback: null };
    }

    const trimmed = value.trim();

    if (!trimmed.startsWith("var(")) {
      return { raw: trimmed, cssVar: null, fallback: null };
    }

    const inner = trimmed.slice(4, -1); // remove var( and )
    const parts = inner.split(",");
    const varName = parts[0] ? parts[0].trim() : null;
    const fallback = parts[1] ? parts.slice(1).join(",").trim() : null;

    return {
      raw: trimmed,
      cssVar: varName,
      fallback
    };
  }

  // -----------------------
  // Summary
  // -----------------------

  _buildSummary(raw, syntaxRoleMap, diffMarkupRoleMap, diagnosticRoleMap) {
    const totalKeys = Object.keys(raw || {}).length;

    return {
      totalRawKeys: totalKeys,
      syntaxRoleCount: Object.keys(syntaxRoleMap).length,
      diffMarkupRoleCount: Object.keys(diffMarkupRoleMap).length,
      diagnosticRoleCount: Object.keys(diagnosticRoleMap).length,
      notes: [
        "SyntaxRoleMap can be bound directly to language token kinds from a parser or highlighter.",
        "DiffMarkupRoleMap enables consistent visualization of inserted/changed/deleted regions across UIs.",
        "DiagnosticRoleMap centralizes colors for errors, bracket mismatches, and linter hints."
      ]
    };
  }
}

export default SyntaxTokenMapper;
