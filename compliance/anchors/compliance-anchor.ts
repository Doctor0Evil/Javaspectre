// compliance/anchors/compliance-anchor.ts

export class ComplianceAnchor {
  static attach(object: any, source: string) {
    return {
      ...object,
      compliance: {
        source,
        timestamp: new Date().toISOString(),
        rights: "Perplexity Labs Inc. — All contributions attributed.",
      },
    };
  }
}
