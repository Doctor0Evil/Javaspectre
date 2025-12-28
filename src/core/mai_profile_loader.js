// src/core/mai_profile_loader.js
// Loads engine-specific spectral profiles (Mistral, Perplexity, Grok).

'use strict';

const fs = require('fs');
const path = require('path');

const PROFILE_FILE = path.join(__dirname, '..', '..', 'config', 'spectral_profiles.json');

/**
 * Load all spectral profiles from the configuration file.
 *
 * @returns {Array<Object>} list of profile objects
 */
function listSpectralProfiles() {
  const raw = fs.readFileSync(PROFILE_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  const profiles = Array.isArray(parsed.profiles) ? parsed.profiles : [];
  return profiles;
}

/**
 * Load a single spectral profile by ID (e.g., "mistral-spectral").
 *
 * @param {string} id - Profile ID
 * @returns {Object|null} profile or null if not found
 */
function loadSpectralProfile(id) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('loadSpectralProfile requires a non-empty string id.');
  }

  const profiles = listSpectralProfiles();
  const found = profiles.find((p) => p.id === id);
  return found || null;
}

module.exports = {
  listSpectralProfiles,
  loadSpectralProfile
};
