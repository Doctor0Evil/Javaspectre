// Path: src/blueprints/LicenseBadgeGenerator.js

/**
 * Generates Shields.io MIT badges matching GitHub Primer colors.
 */
class LicenseBadgeGenerator {
  static githubPrimerMIT() {
    return [
      // Primary recommendation
      {
        markdown: '[![License](https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge&logo=github)](LICENSE)',
        color: 'brightgreen', // #1976d2 → Primer success
        purpose: 'Highest GitHub recognition + theme contrast'
      },
      {
        markdown: '[![License](https://img.shields.io/badge/license-MIT-0969da?style=for-the-badge&logo=github)](LICENSE)',
        color: '#0969da',     // Exact Primer accent.fg
        purpose: 'Direct Primer accent match'
      },
      {
        markdown: '[![License](https://img.shields.io/badge/license-MIT-00d084?style=for-the-badge&logo=github)](LICENSE)',
        color: '#00d084',     // Primer success emphasis
        purpose: 'Maximum brightness + accessibility'
      }
    ];
  }
}

export default LicenseBadgeGenerator;
