// Path: src/utils/FuzzySelector.js
// Fuzzy matching utilities for DOM-sheet mapping.

export class FuzzySelector {
  /**
   * Score similarity between two CSS-like selectors using a simple token overlap metric.
   *
   * @param {string} a
   * @param {string} b
   * @returns {number} score between 0 and 1
   */
  static score(a, b) {
    const tokensA = FuzzySelector.#tokenize(a);
    const tokensB = FuzzySelector.#tokenize(b);
    if (tokensA.length === 0 || tokensB.length === 0) return 0;

    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    let overlap = 0;
    setA.forEach((t) => {
      if (setB.has(t)) overlap += 1;
    });
    const unionSize = setA.size + setB.size - overlap;
    return unionSize === 0 ? 0 : overlap / unionSize;
  }

  /**
   * Given a target selector and a list of candidate selectors, find the best match.
   *
   * @param {string} target
   * @param {Array<string>} candidates
   * @returns {{selector: string|null, score: number}}
   */
  static bestMatch(target, candidates) {
    let best = null;
    let bestScore = 0;
    candidates.forEach((c) => {
      const s = FuzzySelector.score(target, c);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    });
    return {
      selector: best,
      score: bestScore
    };
  }

  static #tokenize(sel) {
    return String(sel)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  }
}

export default FuzzySelector;
