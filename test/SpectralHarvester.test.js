// SpectralHarvester.test.js
import { SpectralHarvester } from '../src/core/SpectralHarvester.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

const harvester = new SpectralHarvester();
const blueprint = harvester.harvestToRepoBlueprint({
  description: 'A spectral AI that designs open-source JavaScript repositories.',
  tags: ['test']
});

const json = blueprint.toJSON();
assert(json.name, 'Blueprint must have a name.');
assert(json.structure && json.structure.directories, 'Blueprint must describe directory structure.');

console.log('SpectralHarvester.test.js: OK');
