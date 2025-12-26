// RepoBlueprint.js
// Declarative repository blueprint with 24-hour replication focus.

export class RepoBlueprint {
  constructor({ name, summary, tags = [], transparencyTrail }) {
    if (!name) throw new Error('RepoBlueprint requires a non-empty "name".');
    if (!summary) throw new Error('RepoBlueprint requires a non-empty "summary".');

    this.name = name;
    this.summary = summary;
    this.tags = tags;
    this.transparencyTrail = transparencyTrail;
    this.createdAt = new Date().toISOString();

    this.structure = this.#defaultStructure();
    this.replicationProfile = this.#defaultReplicationProfile();
  }

  #defaultStructure() {
    return {
      rootFiles: ['README.md', 'MANIFESTO.md', 'package.json', 'LICENSE', '.gitignore'],
      directories: {
        src: {
          core: ['ALNKernel.js', 'SpectralHarvester.js', 'IntegrityEngine.js', 'TransparencyTrail.js'],
          blueprints: ['RepoBlueprint.js', 'InnovationScaffold.js', 'ReplicationProfile.js'],
          cli: ['javaspectre.js']
        },
        examples: ['demo-manifesto.js'],
        scripts: ['run-demo.js', 'generate-repo.js'],
        test: ['ALNKernel.test.js', 'SpectralHarvester.test.js', 'IntegrityEngine.test.js']
      }
    };
  }

  #defaultReplicationProfile() {
    return {
      targetMaxHours: 24,
      prerequisites: [
        'Node.js >= 18',
        'npm or pnpm',
        'Git and GitHub account (or equivalent git host)'
      ],
      steps: [
        'Clone the repository.',
        'Install dependencies with "npm install".',
        'Run "npm test" to validate core modules.',
        'Run "node examples/demo-manifesto.js" to see a spectral blueprint in action.',
        'Fork and adapt the blueprints for your own spectral system.'
      ]
    };
  }

  toJSON() {
    return {
      name: this.name,
      summary: this.summary,
      tags: this.tags,
      createdAt: this.createdAt,
      structure: this.structure,
      replicationProfile: this.replicationProfile,
      transparencyTrail: this.transparencyTrail
    };
  }
}

export default RepoBlueprint;
