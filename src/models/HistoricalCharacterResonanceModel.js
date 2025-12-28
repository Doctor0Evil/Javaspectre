// src/models/HistoricalCharacterResonanceModel.js
// Historical Character Resonance Model for mapping fictional archetypes
// (e.g., Deadpool) to real-world historical figures (e.g., Mad Jack Churchill).

class HistoricalCharacterResonanceModel {
  constructor() {
    this.archetypes = this._loadArchetypes();
    this.figures = this._loadFigures();
    this.weightSchema = this._defaultWeightSchema();
  }

  _defaultWeightSchema() {
    // Higher weight = more influence on similarity
    return {
      battlefieldAudacity: 1.0,
      survivabilityDefiance: 0.9,
      unconventionalWeapons: 0.9,
      theatricalPersona: 0.8,
      darkHumorResilience: 0.8,
      ruleBreaking: 0.7,
      injuryTolerance: 0.7,
      eraTechGap: 0.4,    // How anachronistic the behavior is for its time
      mythicNarrative: 0.6
    };
  }

  _normalizeVector(v) {
    const keys = Object.keys(this.weightSchema);
    const norm = {};
    keys.forEach((k) => {
      const val = typeof v[k] === "number" ? v[k] : 0;
      // Clamp to [0,1]
      norm[k] = Math.max(0, Math.min(1, val));
    });
    return norm;
  }

  _weightedCosineSimilarity(a, b) {
    const keys = Object.keys(this.weightSchema);
    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (const k of keys) {
      const w = this.weightSchema[k];
      const av = (a[k] ?? 0) * w;
      const bv = (b[k] ?? 0) * w;
      dot += av * bv;
      magA += av * av;
      magB += bv * bv;
    }

    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  _loadArchetypes() {
    // Deadpool archetype vector (0–1 scale)
    const deadpool = {
      id: "deadpool",
      label: "Deadpool (Marvel archetype)",
      traits: this._normalizeVector({
        battlefieldAudacity: 1.0,
        survivabilityDefiance: 1.0,
        unconventionalWeapons: 0.85,  // swords, guns, grenades, improvised
        theatricalPersona: 0.95,
        darkHumorResilience: 1.0,
        ruleBreaking: 1.0,
        injuryTolerance: 1.0,
        eraTechGap: 0.6,             // often clashes with context, meta
        mythicNarrative: 0.9
      }),
      meta: {
        universe: "Marvel",
        notes: "Fourth-wall-breaking, regenerative mercenary; extreme irreverence and survivability."
      }
    };

    return [deadpool];
  }

  _loadFigures() {
    // Mad Jack Churchill as primary candidate for Deadpool-like resonance
    const madJackChurchill = {
      id: "mad_jack_churchill_1906_1996",
      name: "Lt. Col. Jack 'Mad Jack' Churchill",
      era: "20th-century (World War II)",
      traits: this._normalizeVector({
        battlefieldAudacity: 0.98,
        survivabilityDefiance: 0.95,
        unconventionalWeapons: 1.0,   // longbow, claymore, bagpipes in WWII
        theatricalPersona: 0.95,
        darkHumorResilience: 0.8,
        ruleBreaking: 0.8,
        injuryTolerance: 0.7,
        eraTechGap: 0.9,              // medieval weapons vs. modern war
        mythicNarrative: 0.9
      }),
      evidence: [
        "Led WWII assaults carrying a longbow, claymore, and bagpipes.",
        "Credited with the last recorded longbow kill in modern warfare.",
        "Captured by Germans, escaped multiple camps, and returned to combat.",
        "Known for outrageous bravado and quotes that treated war almost theatrically."
      ]
    };

    // Example alternate candidates if desired in future:
    const audieMurphy = {
      id: "audie_murphy_1925_1971",
      name: "Audie Murphy",
      era: "20th-century (World War II)",
      traits: this._normalizeVector({
        battlefieldAudacity: 1.0,
        survivabilityDefiance: 0.95,
        unconventionalWeapons: 0.4,
        theatricalPersona: 0.5,
        darkHumorResilience: 0.4,
        ruleBreaking: 0.5,
        injuryTolerance: 0.9,
        eraTechGap: 0.2,
        mythicNarrative: 0.95
      }),
      evidence: [
        "One of the most decorated American combat soldiers of WWII.",
        "Survived repeated near-suicidal engagements with heavy enemy fire.",
        "Later became a film star, amplifying the mythic aura around his service."
      ]
    };

    const simoHaya = {
      id: "simo_hayha_1905_2002",
      name: "Simo Häyhä",
      era: "20th-century (Winter War)",
      traits: this._normalizeVector({
        battlefieldAudacity: 0.9,
        survivabilityDefiance: 0.9,
        unconventionalWeapons: 0.5,
        theatricalPersona: 0.2,
        darkHumorResilience: 0.2,
        ruleBreaking: 0.4,
        injuryTolerance: 0.8,
        eraTechGap: 0.3,
        mythicNarrative: 0.9
      }),
      evidence: [
        "Legendary sniper with extraordinarily high confirmed kill counts.",
        "Survived extreme injuries and harsh conditions.",
        "Became almost mythological in reputation as 'The White Death'."
      ]
    };

    return [madJackChurchill, audieMurphy, simoHaya];
  }

  listArchetypes() {
    return this.archetypes.map((a) => ({
      id: a.id,
      label: a.label,
      meta: a.meta
    }));
  }

  listFigures() {
    return this.figures.map((f) => ({
      id: f.id,
      name: f.name,
      era: f.era
    }));
  }

  getArchetypeById(id) {
    return this.archetypes.find((a) => a.id === id) || null;
  }

  getFigureById(id) {
    return this.figures.find((f) => f.id === id) || null;
  }

  computeResonance(archetypeId, figureId) {
    const archetype = this.getArchetypeById(archetypeId);
    const figure = this.getFigureById(figureId);
    if (!archetype || !figure) {
      throw new Error("Invalid archetypeId or figureId.");
    }

    const score = this._weightedCosineSimilarity(
      archetype.traits,
      figure.traits
    );

    const breakdown = this._explainTraitOverlap(archetype, figure);
    return {
      archetype: { id: archetype.id, label: archetype.label },
      figure: { id: figure.id, name: figure.name, era: figure.era },
      score,
      breakdown,
      evidence: figure.evidence
    };
  }

  _explainTraitOverlap(archetype, figure) {
    const keys = Object.keys(this.weightSchema);
    const reasons = [];

    for (const k of keys) {
      const a = archetype.traits[k] ?? 0;
      const f = figure.traits[k] ?? 0;
      const w = this.weightSchema[k];
      const delta = Math.abs(a - f);
      const avg = (a + f) / 2;

      if (avg > 0.7 && delta < 0.3) {
        reasons.push({
          trait: k,
          alignment: "strong",
          description: this._traitDescription(k, "strong"),
          weight: w,
          archetypeValue: a,
          figureValue: f
        });
      } else if (avg > 0.4 && delta < 0.5) {
        reasons.push({
          trait: k,
          alignment: "moderate",
          description: this._traitDescription(k, "moderate"),
          weight: w,
          archetypeValue: a,
          figureValue: f
        });
      }
    }

    // Sort reasons by trait weight descending
    reasons.sort((a, b) => b.weight - a.weight);
    return reasons;
  }

  _traitDescription(traitKey, level) {
    const labels = {
      battlefieldAudacity: "Battlefield audacity and willingness to take absurd risks under fire.",
      survivabilityDefiance: "Pattern of surviving situations that should reasonably be fatal.",
      unconventionalWeapons: "Use of weapons or tactics that look anachronistic or absurd in context.",
      theatricalPersona: "Showmanship, flair, and almost cinematic behavior in real life.",
      darkHumorResilience: "Use of humor, irony, or flippancy in the face of danger and trauma.",
      ruleBreaking: "Habitual disregard for conventional rules and expectations.",
      injuryTolerance: "High tolerance for pain, injury, or physical damage without quitting.",
      eraTechGap: "Behavior that clashes dramatically with the technology and norms of its time.",
      mythicNarrative: "Degree to which stories about the person read like myth or comic-book arcs."
    };

    const base = labels[traitKey] || traitKey;
    if (level === "strong") {
      return `Strong resonance: ${base}`;
    }
    if (level === "moderate") {
      return `Moderate resonance: ${base}`;
    }
    return base;
  }

  // Convenience: best match for an archetype across all figures
  findBestMatches(archetypeId, { topK = 3 } = {}) {
    const archetype = this.getArchetypeById(archetypeId);
    if (!archetype) {
      throw new Error(`Unknown archetype: ${archetypeId}`);
    }

    const scored = this.figures.map((f) => {
      const score = this._weightedCosineSimilarity(
        archetype.traits,
        f.traits
      );
      return { figure: f, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topK);

    return top.map((entry) => ({
      id: entry.figure.id,
      name: entry.figure.name,
      era: entry.figure.era,
      score: entry.score
    }));
  }
}

export default HistoricalCharacterResonanceModel;
