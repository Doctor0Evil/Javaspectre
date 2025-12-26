// SpectralHarvester.js
// Transforms rough specifications into enriched repository blueprints.

import { RepoBlueprint } from '../blueprints/RepoBlueprint.js';
import ALNKernel from './ALNKernel.js';

export class SpectralHarvester {
  constructor({ alnKernel = new ALNKernel() } = {}) {
    this.alnKernel = alnKernel;
  }

  /**
   * Harvests a conceptual description into a RepoBlueprint.
   */
  harvestToRepoBlueprint({ description, tags = [] }) {
    if (!description || typeof description !== 'string') {
      throw new Error('SpectralHarvester.harvestToRepoBlueprint: "description" must be a non-empty string.');
    }

    const { transparencyTrail } = this.alnKernel.reason({
      intent: description,
      constraints: { language: 'JavaScript' },
      context: { tags }
    });

    const blueprint = new RepoBlueprint({
      name: this.#inferName(description),
      summary: description.trim(),
      tags,
      transparencyTrail
    });

    return blueprint;
  }

  #inferName(description) {
    const base = description
      .split(/[^\w]+/)
      .filter(Boolean)
      .slice(0, 3)
      .join('-')
      .toLowerCase();
    return base || 'javaspectre-project';
  }
}

export default SpectralHarvester;
