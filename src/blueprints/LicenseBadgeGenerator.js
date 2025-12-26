// Path: src/blueprints/LicenseBadgeGenerator.js

/**
 * LicenseBadgeGenerator
 * Generates many Shields.io license badges tuned for GitHub + Primer use,
 * including multiple styles, color strategies, and randomizable variants.
 */
class LicenseBadgeGenerator {
  /**
   * Core factory for Shields URLs.
   * @param {object} opts
   * @param {string} opts.label   - Left text, e.g., "license"
   * @param {string} opts.message - Right text, e.g., "MIT"
   * @param {string} opts.color   - e.g., "brightgreen" or hex without '#'
   * @param {string} [opts.style] - e.g., "for-the-badge", "flat", "flat-square", "plastic"
   * @param {string} [opts.logo]  - e.g., "github"
   * @param {string} [opts.link]  - markdown link href
   * @returns {object} { markdown, url, meta }
   */
  static makeBadge({
    label,
    message,
    color,
    style = "for-the-badge",
    logo = "github",
    link = "LICENSE"
  }) {
    const safeColor = color.startsWith("#") ? color.slice(1) : color;
    const url = `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(
      message
    )}-${encodeURIComponent(safeColor)}?style=${encodeURIComponent(style)}&logo=${encodeURIComponent(
      logo
    )}`;

    const markdown = `[![${label}](${url})](${link})`;

    return {
      markdown,
      url,
      meta: {
        label,
        message,
        color: safeColor,
        style,
        logo,
        link
      }
    };
  }

  /**
   * Primer-aligned MIT badges (original set, enriched).
   * Returns a curated array of high-signal recommendations.
   */
  static githubPrimerMIT() {
    return [
      // Primary recommendation - high visibility, standard color name
      {
        markdown:
          "[![License](https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge&logo=github)](LICENSE)",
        color: "brightgreen",
        purpose: "Highest GitHub recognition + theme contrast (success-toned)"
      },
      {
        markdown:
          "[![License](https://img.shields.io/badge/license-MIT-0969da?style=for-the-badge&logo=github)](LICENSE)",
        color: "#0969da",
        purpose: "Direct Primer accent match for GitHub-like UIs"
      },
      {
        markdown:
          "[![License](https://img.shields.io/badge/license-MIT-00d084?style=for-the-badge&logo=github)](LICENSE)",
        color: "#00d084",
        purpose: "Maximum brightness while remaining accessible as a success badge"
      },
      // Neutral / subtle variants
      {
        markdown:
          "[![License](https://img.shields.io/badge/license-MIT-6e7781?style=flat&logo=github)](LICENSE)",
        color: "#6e7781",
        purpose: "Muted neutral style for low-noise READMEs"
      },
      {
        markdown:
          "[![License](https://img.shields.io/badge/license-MIT-24292f?style=flat-square&logo=github)](LICENSE)",
        color: "#24292f",
        purpose: "High-contrast dark neutral matching GitHub header"
      }
    ];
  }

  /**
   * Dark / night-mode friendly license badges.
   * Designed to sit on dark backgrounds (e.g., resolvedServerColorMode: night).
   */
  static nightModeVariants(license = "MIT") {
    const label = "license";
    const link = "LICENSE";

    const colors = [
      { color: "#0d1117", purpose: "Near-GitHub dark canvas background" },
      { color: "#1f6feb", purpose: "Bright accent blue for dark UIs" },
      { color: "#238636", purpose: "Primer success green tuned for dark backgrounds" },
      { color: "#6e7681", purpose: "Muted gray for subtle presence" }
    ];

    const styles = ["for-the-badge", "flat", "flat-square"];

    const variants = [];

    colors.forEach((c) => {
      styles.forEach((style) => {
        const badge = LicenseBadgeGenerator.makeBadge({
          label,
          message: license,
          color: c.color,
          style,
          logo: "github",
          link
        });
        variants.push({
          ...badge,
          purpose: `${c.purpose} (${style})`,
          theme: "night"
        });
      });
    });

    return variants;
  }

  /**
   * Light-mode and tritanopia-friendly variants for multiple licenses.
   * Uses constrained palette with high luminance and non-confusing hues.
   */
  static accessibleVariants(license = "MIT") {
    const label = "license";
    const link = "LICENSE";

    const palettes = [
      {
        id: "blue-strong",
        color: "#0969da",
        purpose: "Primary accent blue, strong contrast on light backgrounds"
      },
      {
        id: "blue-soft",
        color: "#54aeff",
        purpose: "Soft blue accent for gentle emphasis"
      },
      {
        id: "purple",
        color: "#8250df",
        purpose: "Distinct purple, robust for tritanopia-ish palettes"
      },
      {
        id: "neutral-strong",
        color: "#57606a",
        purpose: "Neutral strong gray for low-color UIs"
      }
    ];

    return palettes.map((p) => {
      const badge = LicenseBadgeGenerator.makeBadge({
        label,
        message: license,
        color: p.color,
        style: "for-the-badge",
        logo: "github",
        link
      });
      return {
        ...badge,
        paletteId: p.id,
        purpose: p.purpose,
        accessibilityHint: "Chosen for strong contrast and non-ambiguous hue"
      };
    });
  }

  /**
   * Style variants (plastic/flat/flat-square/for-the-badge) for a given license + color.
   */
  static styleVariants(license = "MIT", color = "#0969da") {
    const label = "license";
    const link = "LICENSE";
    const styles = ["for-the-badge", "flat", "flat-square", "plastic"];

    return styles.map((style) => {
      const badge = LicenseBadgeGenerator.makeBadge({
        label,
        message: license,
        color,
        style,
        logo: "github",
        link
      });
      return {
        ...badge,
        styleVariant: style,
        purpose: `Same color with different Shields.io style: ${style}`
      };
    });
  }

  /**
   * License family variants (MIT, Apache-2.0, GPL-3.0, BSD-3-Clause, MPL-2.0).
   * Good for multi-license or template repositories.
   */
  static multiLicenseSet(baseColor = "#0969da") {
    const licenses = [
      { id: "MIT", label: "MIT" },
      { id: "Apache-2.0", label: "Apache--2.0" },
      { id: "GPL-3.0", label: "GPL--3.0" },
      { id: "BSD-3-Clause", label: "BSD--3--Clause" },
      { id: "MPL-2.0", label: "MPL--2.0" }
    ];

    const linkById = {
      MIT: "LICENSE",
      "Apache-2.0": "LICENSE-APACHE",
      "GPL-3.0": "LICENSE-GPL",
      "BSD-3-Clause": "LICENSE-BSD",
      "MPL-2.0": "LICENSE-MPL"
    };

    return licenses.map((lic) => {
      const badge = LicenseBadgeGenerator.makeBadge({
        label: "license",
        message: lic.label,
        color: baseColor,
        style: "for-the-badge",
        logo: "github",
        link: linkById[lic.id] || "LICENSE"
      });
      return {
        ...badge,
        licenseId: lic.id,
        purpose: `Standardized license badge for ${lic.id}`
      };
    });
  }

  /**
   * Randomized badge generator:
   * - Random license from a small curated set
   * - Random style
   * - Random color from an opinionated palette
   */
  static randomBadge(seed = null) {
    const rng = LicenseBadgeGenerator._rng(seed);

    const licenses = ["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "MPL-2.0"];
    const styles = ["for-the-badge", "flat", "flat-square", "plastic"];
    const colors = [
      "#0969da",
      "#54aeff",
      "#238636",
      "#8250df",
      "#6e7781",
      "#24292f",
      "#f78166"
    ];

    const license = licenses[Math.floor(rng() * licenses.length)];
    const style = styles[Math.floor(rng() * styles.length)];
    const color = colors[Math.floor(rng() * colors.length)];

    const badge = LicenseBadgeGenerator.makeBadge({
      label: "license",
      message: license,
      color,
      style,
      logo: "github",
      link: "LICENSE"
    });

    return {
      ...badge,
      randomMeta: {
        seed,
        license,
        style,
        color
      },
      purpose: "Randomized yet curated license badge variant"
    };
  }

  /**
   * Deterministic pseudo-random generator (Mulberry32).
   * Allows reproducible random badges given a numeric seed.
   */
  static _rng(seed) {
    let a =
      typeof seed === "number" && Number.isFinite(seed)
        ? seed >>> 0
        : (Date.now() & 0xffffffff) >>> 0;

    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Convenience method returning a rich catalog of useful badge sets.
   * Great for UI selectors or README template generators.
   */
  static catalog() {
    return {
      primerMIT: LicenseBadgeGenerator.githubPrimerMIT(),
      nightModeMIT: LicenseBadgeGenerator.nightModeVariants("MIT"),
      accessibleMIT: LicenseBadgeGenerator.accessibleVariants("MIT"),
      styleMITAccent: LicenseBadgeGenerator.styleVariants("MIT", "#0969da"),
      multiLicenseAccent: LicenseBadgeGenerator.multiLicenseSet("#0969da")
    };
  }
}

export default LicenseBadgeGenerator;
