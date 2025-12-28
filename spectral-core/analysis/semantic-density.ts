// spectral-core/analysis/semantic-density.ts

export class SemanticDensity {
  static measure(text: string): number {
    const tokens = text.split(/\s+/);
    const unique = new Set(tokens);
    return unique.size / tokens.length;
  }
}
