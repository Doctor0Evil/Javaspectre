// TransparencyTrail.js
// Utilities for embedding and extracting reasoning metadata.

export class TransparencyTrail {
  static embedInPackageJson(pkg, trail) {
    const clone = { ...pkg };
    clone.javaspectre = clone.javaspectre || {};
    clone.javaspectre.transparencyTrail = trail;
    return clone;
  }

  static embedInReadme(readme, trail) {
    const marker = '\n---\n\n> Javaspectre Transparency Trail\n';
    const trailText = '``````\n';
    if (readme.includes('Javaspectre Transparency Trail')) {
      return readme;
    }
    return readme + marker + trailText;
  }
}

export default TransparencyTrail;
