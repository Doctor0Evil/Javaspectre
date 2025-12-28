// index.js
// Public entrypoint for the jspectre-mistral package.

'use strict';

const { spectralScan } = require('./src/core/mai_spectral_core');
const { analyzeResonance } = require('./src/core/mai_resonance_scanner');
const { toALNFormat } = require('./src/core/mai_aln_adapter');
const { loadSpectralProfile, listSpectralProfiles } = require('./src/core/mai_profile_loader');

module.exports = {
  spectralScan,
  analyzeResonance,
  toALNFormat,
  loadSpectralProfile,
  listSpectralProfiles
};
