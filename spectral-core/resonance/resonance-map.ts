// spectral-core/resonance/resonance-map.ts

export class ResonanceMap {
  static map(input: string): number[] {
    return [...input].map(char => char.charCodeAt(0) % 17);
  }
}
