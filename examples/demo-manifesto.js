// demo-manifesto.js
// Demonstrates turning the Javaspectre manifesto into a RepoBlueprint.

import { SpectralHarvester } from '../src/core/SpectralHarvester.js';

const description = `
The Javaspectre Initiative: a spectral-grade AI framework that turns
conceptual uncertainty, fragmented code, and nascent systems into
production-grade JavaScript repositories with full transparency and
24-hour replication profiles.
`.trim();

const tags = ['javaspectre', 'aln', 'spectral-ai', 'repo-blueprint'];

const harvester = new SpectralHarvester();
const blueprint = harvester.harvestToRepoBlueprint({ description, tags });

console.log('Javaspectre Repo Blueprint:\n');
console.log(JSON.stringify(blueprint.toJSON(), null, 2));
