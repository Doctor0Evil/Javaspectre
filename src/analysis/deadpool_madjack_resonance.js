// src/analysis/deadpool_madjack_resonance.js
// Deadpool ↔ Mad Jack Churchill resonance demo (JS port of MATLAB-style script)

function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length.");
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function normalize(weights) {
  const sum = weights.reduce((acc, x) => acc + x, 0);
  if (sum === 0) return weights.map(() => 0);
  return weights.map((x) => x / sum);
}

export function computeDeadpoolMadJackResonance() {
  const archetype = "deadpool";
  const target = "mad_jack_churchill_1906_1996";

  const traits = ["risk", "combat_skill", "unconventionality", "dark_humor", "resilience"];

  const vDeadpool = [0.98, 0.95, 0.99, 1.0, 0.97];
  const vMadJack = [0.96, 0.93, 0.98, 0.70, 0.95];

  const resScore = cosineSimilarity(vDeadpool, vMadJack);

  const delta = vMadJack.map((v, i) => v - vDeadpool[i]);

  const alignment = delta.map((d) => {
    if (Math.abs(d) < 0.03) return "neutral";
    return d > 0 ? "jack_plus" : "deadpool_plus";
  });

  const evidenceLabels = [
    "Longbow kill in WWII combat",
    "Broadsword-led commando charges",
    "Solo capture of 40+ enemy soldiers",
    "Bagpipes played going into battle",
    "Escapes from a concentration camp"
  ];

  const evidenceRaw = [0.95, 0.92, 0.90, 0.85, 0.93];
  const evidenceW = normalize(evidenceRaw);

  const detailed = {
    archetype,
    target,
    score: resScore,
    traits,
    delta,
    alignment,
    evidence: evidenceLabels,
    evidenceWeights: evidenceW
  };

  return detailed;
}

// If run directly: pretty-print the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  const detailed = computeDeadpoolMadJackResonance();
  console.log(
    `Deadpool ↔ Mad Jack Churchill resonance score: ${detailed.score.toFixed(3)}`
  );

  console.log("\nPer-trait signed alignment (Mad Jack - Deadpool):");
  detailed.traits.forEach((t, i) => {
    const tag = detailed.alignment[i].toUpperCase();
    const d = detailed.delta[i];
    console.log(`- [${tag}] ${t} : Δ = ${d >= 0 ? "+" : ""}${d.toFixed(3)}`);
  });

  console.log("\nEvidence for Mad Jack Churchill (normalized weights):");
  detailed.evidence.forEach((label, i) => {
    console.log(`- w = ${detailed.evidenceWeights[i].toFixed(3)} :: ${label}`);
  });
}
