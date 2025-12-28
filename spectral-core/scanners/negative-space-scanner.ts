// spectral-core/scanners/negative-space-scanner.ts

export class NegativeSpaceScanner {
  static scan(structure: any): string[] {
    const missing: string[] = [];

    if (!structure?.children) return ["Missing children array"];

    structure.children.forEach((child: any, i: number) => {
      if (!child) missing.push(`Child at index ${i} is null`);
    });

    return missing;
  }
}
