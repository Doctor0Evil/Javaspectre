// Path: src/capabilities/AnimationEasingMapper.js

/**
 * AnimationEasingMapper extracts cubic-bezier presets from theme objects,
 * validates them, and emits executable CSS/JS timing functions.
 */
class AnimationEasingMapper {
  constructor() {
    this.standardPresets = {
      easeOutCubic: "cubic-bezier(0.33, 1, 0.68, 1)",
      easeInCubic: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
      easeInOutCubic: "cubic-bezier(0.645, 0.045, 0.355, 1)",
      easeOutQuart: "cubic-bezier(0.23, 1, 0.32, 1)"
    };
  }

  /**
   * Map animation object to validated easing presets.
   * @param {object} animationObj - e.g., { easeOutCubic: "cubic-bezier(...)" }
   * @returns {array} easing virtual-objects
   */
  mapAnimations(animationObj) {
    const easings = [];
    if (!animationObj || typeof animationObj !== "object") return easings;

    Object.entries(animationObj).forEach(([name, bezierStr]) => {
      if (typeof bezierStr !== "string") return;

      const validated = this.validateBezier(bezierStr);
      if (!validated) return;

      easings.push({
        id: `EasingPreset:${name}`,
        name,
        bezier: bezierStr,
        type: this.inferEasingType(bezierStr),
        cssVar: `--animation-${name}`,
        jsInterpolator: this.buildInterpolator(bezierStr),
        velocityProfile: validated.profile,
        category: "timing-function"
      });
    });

    return easings;
  }

  validateBezier(bezierStr) {
    const match = bezierStr.match(/cubic-bezier\(([^)]+)\)/);
    if (!match) return null;

    const coords = match[1].split(',').map(c => parseFloat(c.trim()));
    if (coords.length !== 4) return null;

    const [x1, y1, x2, y2] = coords;
    if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null;

    const profile = this.analyzeCurve(x1, y1, x2, y2);
    return { coords, profile };
  }

  inferEasingType(bezierStr) {
    const match = bezierStr.match(/cubic-bezier\(([^)]+)\)/);
    if (!match) return "custom";

    const [x1, y1, x2, y2] = match[1].split(',').map(c => parseFloat(c.trim()));
    
    if (Math.abs(x1 - 0.33) < 0.05 && Math.abs(x2 - 0.68) < 0.05) return "easeOutCubic";
    if (y1 < 0.2 && y2 > 0.8) return "ease-out";
    if (y1 > 0.8 && y2 < 0.2) return "ease-in";
    return "ease-in-out";
  }

  analyzeCurve(x1, y1, x2, y2) {
    const startSlope = 3 * x1 * (1 - x1) * (y2 - y1);
    const endSlope = 3 * x2 * x2 * (y1 - y2);
    
    if (startSlope > 1 && endSlope < 1) return "decelerates";
    if (startSlope < 1 && endSlope > 1) return "accelerates";
    return "balanced";
  }

  buildInterpolator(bezierStr) {
    const coords = this.parseBezier(bezierStr);
    if (!coords) return () => 0.5;

    const [x1, y1, x2, y2] = coords;
    
    return (t) => {
      // Simplified cubic bezier solver (Newton's method)
      let x = t;
      for (let i = 0; i < 4; i++) {
        const slope = 3 * x * (1 - x) * (3 * x * (x - 2) + 1) + 1;
        x -= (3 * x * x * (x - 1) + t - x * (3 * x - 3)) / slope;
      }
      return 3 * x * (1 - x) * (3 * x * (x - 2) + 1) * y1 + 3 * x * x * (1 - x) * y2;
    };
  }

  parseBezier(bezierStr) {
    const match = bezierStr.match(/cubic-bezier\(([0-9. ,]+)\)/);
    if (!match) return null;
    return match[1].split(',').map(c => parseFloat(c.trim()));
  }
}

export default AnimationEasingMapper;
