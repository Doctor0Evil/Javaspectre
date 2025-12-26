// Path: src/capabilities/ThemeTokenMapper.js

/**
 * ThemeTokenMapper
 * Turns unknown theme `memoizedState` objects into structured virtual-objects:
 * - Scales (space, radii, fontSizes, breakpoints)
 * - Semantic groups (colors, shadows, colorSchemes)
 * - Cross-links usable by other Javaspectre modules.
 */

class ThemeTokenMapper {
  constructor(options = {}) {
    this.maxPreview = typeof options.maxPreview === "number" ? options.maxPreview : 16;
  }

  /**
   * Map a raw memoizedState-like value into a structured theme report.
   */
  mapTheme(memoizedState) {
    const root = this._extractThemeRoot(memoizedState);

    const scales = {
      space: this._buildScale("space", root.space),
      radii: this._buildScale("radii", root.radii),
      fontSizes: this._buildScale("fontSizes", root.fontSizes),
      breakpoints: this._buildScale("breakpoints", root.breakpoints),
      sizes: this._buildNamedMap("sizes", root.sizes)
    };

    const typography = {
      fontWeights: this._buildNamedMap("fontWeights", root.fontWeights),
      fonts: this._buildNamedMap("fonts", root.fonts),
      lineHeights: this._buildNamedMap("lineHeights", root.lineHeights)
    };

    const colorSchemes = this._buildColorSchemes(root.colorSchemes);
    const colors = this._flattenColors(root.colors);
    const shadows = this._flattenShadows(root.shadows);
    const animations = this._buildNamedMap("animation", root.animation);

    const virtualObjects = [
      this._buildVirtualObject("theme-root", "theme-root", {
        sections: Object.keys(root)
      }),
      this._buildVirtualObject("theme-scales", "theme-scales", scales),
      this._buildVirtualObject("theme-typography", "theme-typography", typography),
      this._buildVirtualObject("theme-color-schemes", "theme-color-schemes", colorSchemes.summary),
      this._buildVirtualObject("theme-colors", "theme-colors", {
        count: colors.length,
        sample: colors.slice(0, this.maxPreview)
      }),
      this._buildVirtualObject("theme-shadows", "theme-shadows", {
        count: shadows.length,
        sample: shadows.slice(0, this.maxPreview)
      }),
      this._buildVirtualObject("theme-animations", "theme-animations", animations)
    ];

    return {
      sourceKind: "memoized-theme-state",
      virtualObjects,
      scales,
      typography,
      colorSchemes,
      colors,
      shadows,
      animations,
      summary: this._buildSummary(scales, colorSchemes, colors, shadows)
    };
  }

  // -----------------------
  // Root extraction
  // -----------------------

  _extractThemeRoot(memoizedState) {
    // If this is the React hook format, the theme is often in memoizedState[0] or [1].
    if (Array.isArray(memoizedState) && memoizedState.length > 0) {
      const candidate = memoizedState[0] && typeof memoizedState[0] === "object"
        ? memoizedState[0]
        : memoizedState[1];

      if (candidate && typeof candidate === "object") {
        return candidate;
      }
    }

    if (memoizedState && typeof memoizedState === "object") {
      return memoizedState;
    }

    return {};
  }

  // -----------------------
  // Builders
  // -----------------------

  _buildScale(name, arr) {
    if (!Array.isArray(arr)) {
      return {
        name,
        kind: "scale",
        values: [],
        notes: "Not an array; scale unavailable."
      };
    }
    return {
      name,
      kind: "scale",
      length: arr.length,
      values: arr.slice(0, this.maxPreview),
      fullValues: arr
    };
  }

  _buildNamedMap(name, obj) {
    if (!obj || typeof obj !== "object") {
      return {
        name,
        kind: "map",
        entries: [],
        notes: "Not an object; map unavailable."
      };
    }
    const entries = Object.keys(obj).map((key) => ({
      key,
      value: obj[key]
    }));
    return {
      name,
      kind: "map",
      size: entries.length,
      entries: entries.slice(0, this.maxPreview),
      fullEntries: entries
    };
  }

  _buildColorSchemes(colorSchemes) {
    if (!colorSchemes || typeof colorSchemes !== "object") {
      return {
        raw: {},
        summary: {
          count: 0,
          schemeNames: [],
          notes: "No colorSchemes object detected."
        }
      };
    }

    const names = Object.keys(colorSchemes);
    const schemes = names.map((name) => {
      const scheme = colorSchemes[name] || {};
      return {
        name,
        keys: Object.keys(scheme),
        preview: this._previewObject(scheme)
      };
    });

    return {
      raw: colorSchemes,
      schemes,
      summary: {
        count: schemes.length,
        schemeNames: names,
        sample: schemes.slice(0, this.maxPreview)
      }
    };
  }

  _flattenColors(colors) {
    const out = [];
    const walk = (obj, prefix) => {
      if (!obj || typeof obj !== "object") return;
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object") {
          walk(value, path);
        } else {
          out.push({ path, value });
        }
      });
    };
    walk(colors, "");
    return out;
  }

  _flattenShadows(shadows) {
    const out = [];
    const walk = (obj, prefix) => {
      if (!obj || typeof obj !== "object") return;
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object") {
          walk(value, path);
        } else {
          out.push({ path, value });
        }
      });
    };
    walk(shadows, "");
    return out;
  }

  _previewObject(obj) {
    if (!obj || typeof obj !== "object") return [];
    const entries = Object.entries(obj).map(([key, value]) => ({
      key,
      value
    }));
    return entries.slice(0, this.maxPreview);
  }

  _buildVirtualObject(id, kind, payload) {
    return {
      id,
      kind,
      payload
    };
  }

  _buildSummary(scales, colorSchemes, colors, shadows) {
    return {
      hasSpaceScale: Array.isArray(scales.space.fullValues) && scales.space.fullValues.length > 0,
      hasBreakpointScale:
        Array.isArray(scales.breakpoints.fullValues) && scales.breakpoints.fullValues.length > 0,
      colorSchemeCount: colorSchemes.summary.count,
      colorCount: colors.length,
      shadowCount: shadows.length,
      notes: [
        "Use scales.space and scales.breakpoints to reconstruct responsive layout systems.",
        "Use colorSchemes.schemes to derive per-mode tokens (light, dark, high contrast, etc.).",
        "Flattened colors and shadows can be fed to VirtualObjectExcavator for deeper virtual-object excavation."
      ]
    };
  }
}

export default ThemeTokenMapper;
