class SpectralFactSniffer {
  constructor(options = {}) {
    this.thresholds = Object.assign({
      factMin: 0.6,
      fictionMin: 0.6,
      specMin: 0.4
    }, options.thresholds || {});
  }

  /**
   * Normalize text helpers
   */
  static normalize(text = "") {
    return String(text || "").toLowerCase();
  }

  /**
   * Basic feature extraction Φ(V)
   * item: { title, body, source, section, tags:[], url }
   */
  extractFeatures(item) {
    const title = SpectralFactSniffer.normalize(item.title);
    const body = SpectralFactSniffer.normalize(item.body || "");
    const source = SpectralFactSniffer.normalize(item.source || "");
    const section = SpectralFactSniffer.normalize(item.section || "");
    const tags = (item.tags || []).map(SpectralFactSniffer.normalize);

    // Source reputation heuristics
    const scienceSources = [
      "live science",
      "iflscience",
      "nasa",
      "esa",
      "nature",
      "science advances",
      "mit",
      "university",
      "museum"
    ];
    const entertainmentSources = [
      "screenrant",
      "comic basics",
      "game",
      "gaming",
      "prime video",
      "netflix",
      "star trek",
      "fleet command"
    ];

    const sourceScoreScience = scienceSources.some(s => source.includes(s)) ? 1 : 0;
    const sourceScoreEnt = entertainmentSources.some(s => source.includes(s)) ? 1 : 0;

    // Franchise / fictional universe markers
    const franchiseMarkers = [
      "gta 6",
      "grand theft auto",
      "need for speed",
      "he-man",
      "skeletor",
      "star trek",
      "sci-fi masterpiece",
      "sylvester stallone",
      "prime video"
    ];
    const hasFranchise = franchiseMarkers.some(m => title.includes(m) || body.includes(m));

    // Science entity markers
    const scienceMarkers = [
      "fossil",
      "telescope",
      "james webb",
      "prototaxites",
      "homo habilis",
      "devonian",
      "cave art",
      "rock art",
      "gold deposit",
      "aurora",
      "aurora lights",
      "nasa",
      "artemis ii",
      "rocket",
      "skeleton",
      "genetic",
      "genetics"
    ];
    const hasScienceEntity = scienceMarkers.some(m => title.includes(m) || body.includes(m));

    // Sensational / speculative language
    const sensationalMarkers = [
      "alien object",
      "locate god",
      "god is",
      "unknown life form",
      "baffled",
      "mind-blowing",
      "supergiant",
      "massive mystery",
      "accelerates without gravity"
    ];
    const hasSensational = sensationalMarkers.some(m => title.includes(m) || body.includes(m));

    // Evidence markers
    const evidenceMarkers = [
      "published in",
      "peer-reviewed",
      "journal",
      "science advances",
      "study finds",
      "researchers",
      "scientists",
      "institute",
      "university",
      "fossil record",
      "spectral analysis"
    ];
    const hasEvidence = evidenceMarkers.some(m => body.includes(m) || title.includes(m));

    // Section / tag signals
    const isNews = section.includes("news") || tags.includes("news");
    const isOpinion = section.includes("opinion");
    const isSponsored = section.includes("sponsored") || tags.includes("sponsored");
    const isEntertainment = section.includes("entertainment") || section.includes("movies") || section.includes("gaming");

    return {
      sourceScoreScience,
      sourceScoreEnt,
      hasFranchise,
      hasScienceEntity,
      hasSensational,
      hasEvidence,
      isNews,
      isOpinion,
      isSponsored,
      isEntertainment
    };
  }

  /**
   * Compute spectral scores S_fact, S_fiction, S_spec
   */
  computeScores(features) {
    const f = features;

    // Fact score emphasises science sources, evidence, and news context
    let S_fact = 0;
    S_fact += 0.35 * f.sourceScoreScience;
    S_fact += 0.25 * (f.hasEvidence ? 1 : 0);
    S_fact += 0.2 * (f.hasScienceEntity ? 1 : 0);
    S_fact += 0.1 * (f.isNews ? 1 : 0);
    S_fact += 0.1 * (!f.isSponsored ? 1 : 0);

    // Fiction score emphasises franchises, entertainment sources and sections
    let S_fiction = 0;
    S_fiction += 0.4 * (f.hasFranchise ? 1 : 0);
    S_fiction += 0.3 * (f.sourceScoreEnt ? 1 : 0);
    S_fiction += 0.3 * (f.isEntertainment ? 1 : 0);

    // Speculative score emphasises sensational language on top of science entities
    let S_spec = 0;
    S_spec += 0.5 * (f.hasSensational ? 1 : 0);
    S_spec += 0.3 * (f.hasScienceEntity ? 1 : 0);
    S_spec += 0.2 * (f.hasEvidence ? 0.3 : 0); // slightly up if some evidence exists

    // Clamp to [0,1]
    const clamp = v => Math.max(0, Math.min(1, v));

    return {
      S_fact: clamp(S_fact),
      S_fiction: clamp(S_fiction),
      S_spec: clamp(S_spec)
    };
  }

  /**
   * Decide coarse label from scores
   */
  decideLabel(scores) {
    const { S_fact, S_fiction, S_spec } = scores;
    const { factMin, fictionMin, specMin } = this.thresholds;

    if (S_fact >= factMin && S_fact >= S_fiction && S_fact >= S_spec) {
      return "non-fiction";
    }
    if (S_fiction >= fictionMin && S_fiction >= S_fact && S_fiction >= S_spec) {
      return "fiction";
    }
    if (S_spec >= specMin) {
      return "speculative-science-linked";
    }
    // Fallback: whichever is highest
    const maxScore = Math.max(S_fact, S_fiction, S_spec);
    if (maxScore === S_fact) return "non-fiction";
    if (maxScore === S_fiction) return "fiction";
    return "speculative-science-linked";
  }

  /**
   * Compute simple drift score δ in [0,1]
   * Higher = more sensational relative to evidence.
   */
  computeDrift(features, scores) {
    const sensationalWeight = features.hasSensational ? 1 : 0;
    const evidenceWeight = features.hasEvidence ? 1 : 0;
    const raw = 0.6 * sensationalWeight + 0.4 * (1 - evidenceWeight);
    return Math.max(0, Math.min(1, raw));
  }

  /**
   * Main analysis entry point
   */
  analyze(item) {
    const features = this.extractFeatures(item);
    const scores = this.computeScores(features);
    const label = this.decideLabel(scores);
    const drift = this.computeDrift(features, scores);

    const path = [];
    path.push("M_src"); // source probe
    if (features.hasEvidence) path.push("M_ev");
    if (features.hasFranchise) path.push("M_fr");
    if (features.hasSensational) path.push("M_spec");
    path.push("M_drift");

    return {
      label,
      scores,
      features,
      drift,
      excavationPath: path.join(" -> ")
    };
  }
}

export default SpectralFactSniffer;
