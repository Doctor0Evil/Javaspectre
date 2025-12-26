#!/usr/bin/env node
// javaspectre.js
// Minimal CLI for harvesting a description into a RepoBlueprint JSON.

import { SpectralHarvester } from '../core/SpectralHarvester.js';

function main() {
  const [, , ...args] = process.argv;

  if (args.length === 0) {
    console.error('Usage: javaspectre "<description>" [tag1 tag2 ...]');
    process.exit(1);
  }

  const description = args[0];
  const tags = args.slice(1);

  const harvester = new SpectralHarvester();
  const blueprint = harvester.harvestToRepoBlueprint({ description, tags });

  // Emit JSON to stdout for piping into other tools.
  process.stdout.write(JSON.stringify(blueprint.toJSON(), null, 2) + '\n');
}

main();
