// Path: src/capabilities/ColorSchemeMapper.js

import ColorTokenMapper from "./ColorTokenMapper.js";
import SyntaxTokenMapper from "./SyntaxTokenMapper.js";

/**
 * ColorSchemeMapper
 * Compares a base `colors` object and a variant (e.g., light_tritanopia.colors),
 * emitting cross-scheme virtual-objects and per-token deltas.
 */
class ColorSchemeMapper {
  constructor(options = {}) {
    this.colorTokenMapper = new ColorTokenMapper(options);
    this.syntaxTokenMapper = new SyntaxTokenMapper(options);
  }

  /**
   * Map a pair of schemes into a cross-linked report.
   *
   * @param {object} baseColors - canonical colors object (e.g., light.colors)
   * @param {object} variantColors - variant colors (e.g., light_tritanopia.colors)
   * @param {string} variantName - name of the variant (e.g., "light_tritanopia")
   */
  mapSchemes(baseColors, variantColors, variantName = "variant") {
    const baseColorReport = this.colorTokenMapper.mapColors(baseColors);
    const variantColorReport = this.colorTokenMapper.mapColors(variantColors);

    const baseSyntax = (baseColors.prettylights && baseColors.prettylights.syntax) || {};
    const variantSyntax =
      (variantColors.prettylights && variantColors.prettylights.syntax) || {};

    const baseSyntaxReport = this.syntaxTokenMapper.mapSyntax(baseSyntax);
    const variantSyntaxReport = this.syntaxTokenMapper.mapSyntax(variantSyntax);

    const syntaxDeltas = this._computeTokenDeltas(
      baseSyntaxReport.syntaxRoleMap,
      variantSyntaxReport.syntaxRoleMap
    );

    const diffBlobDeltas = this._computeGroupDeltas(
      baseColors.diffBlob,
      variantColors.diffBlob,
      "diffBlob"
    );

    return {
      variantName,
      base: {
        colors: baseColorReport,
        syntax: baseSyntaxReport
      },
      variant: {
        colors: variantColorReport,
        syntax: variantSyntaxReport
      },
      deltas: {
        syntaxRoles: syntaxDeltas,
        diffBlob: diffBlobDeltas
      }
    };
  }

  _computeTokenDeltas(baseRoles, variantRoles) {
    const keys = new Set([...Object.keys(baseRoles || {}), ...Object.keys(variantRoles || {})]);
    const deltas = {};

    keys.forEach((role) => {
      const base = baseRoles[role] || null;
      const variant = variantRoles[role] || null;
      if (!base && !variant) return;

      const baseFallback = base && base.fallback ? base.fallback : base && base.raw;
      const variantFallback = variant && variant.fallback ? variant.fallback : variant && variant.raw;

      if (baseFallback === variantFallback) return;

      deltas[role] = {
        base: base,
        variant: variant
      };
    });

    return deltas;
  }

  _computeGroupDeltas(baseGroup, variantGroup, prefix) {
    const out = {};
    const baseFlat = this._flattenGroup(baseGroup, prefix);
    const variantFlat = this._flattenGroup(variantGroup, prefix);

    const keys = new Set([...Object.keys(baseFlat), ...Object.keys(variantFlat)]);
    keys.forEach((key) => {
      const base = baseFlat[key] || null;
      const variant = variantFlat[key] || null;
      if (!base && !variant) return;

      const baseVal = base && base.fallback ? base.fallback : base && base.raw;
      const variantVal = variant && variant.fallback ? variant.fallback : variant && variant.raw;
      if (baseVal === variantVal) return;

      out[key] = {
        base,
        variant
      };
    });

    return out;
  }

  _flattenGroup(group, prefix) {
    if (!group || typeof group !== "object") return {};
    const mapper = new ColorTokenMapper();
    return mapper._flattenTokenGroup(group, prefix);
  }
}

export default ColorSchemeMapper;
