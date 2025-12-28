// filename: /modules/spectral/ebmResonanceParser.js
// destination-path: /opt/javaspectre/spectral/audio/ebmResonanceParser.js
//
// CEM-grade EBM resonance parser:
// - Deterministic FFT + spectral centroid
// - Spectral-flux based BPM estimation (no Math.random)
// - Explicit invariants and normalized feature ranges
//
// Dependencies:
//   "audio-features-engine" must expose:
//     - fft(timeDomainBuffer: Float32Array) => Float32Array (magnitude spectrum)
//     - spectralCentroid(magnitudeSpectrum: Float32Array, sampleRate: number) => number (Hz)
//   or a compatible interface.
//
// Input contract:
//   audioBuffer: { data: Float32Array, sampleRate: number }
//
// Mathematical notes:
//   - Spectral centroid C is normalized to [0, 1] via C_norm = min(C / 8000, 1) for 44.1 kHz+ material.
//   - Beat resonance R = BPM / 150 with BPM constrained to [minBpm, maxBpm].
//   - Spectral flux onset curve is used for BPM estimation: flux_n = Σ max(0, S_n(k) - S_{n-1}(k)).
//   - BPM is derived from dominant peak in the autocorrelation of the flux envelope in the allowed BPM band.[web:11]

import { fft, spectralCentroid } from 'audio-features-engine';

/**
 * Extracts frequency, pulse repetition, and tonal weight from EBM tracks.
 *
 * @param {{ data: Float32Array, sampleRate: number }} audioBuffer
 * @returns {{
 *   harmonicPressure: number,
 *   beatResonance: number,
 *   spectralFatigueIndex: number,
 *   emotionalSignature: 'agitated' | 'reflective'
 * }}
 */
export function ebmResonanceParser(audioBuffer) {
  const { data, sampleRate } = audioBuffer;

  if (!(data instanceof Float32Array)) {
    throw new TypeError('audioBuffer.data must be a Float32Array');
  }
  if (typeof sampleRate !== 'number' || sampleRate <= 0) {
    throw new TypeError('audioBuffer.sampleRate must be a positive number');
  }

  // Window length and hop size for frame-wise analysis (2048 sample window, 50% overlap).
  const frameSize = 2048;
  const hopSize = frameSize >>> 1;

  if (data.length < frameSize * 4) {
    // Require at least ~4 frames to get a stable BPM estimate.
    throw new Error('audioBuffer.data is too short for reliable EBM analysis');
  }

  const frames = frameIntoWindows(data, frameSize, hopSize);
  const spectra = frames.map((frame) => fft(applyHannWindow(frame)));
  const centroidValues = spectra.map((spec) => spectralCentroid(spec, sampleRate));

  // Global centroid as mean of frame-wise centroids.
  const centroid =
    centroidValues.reduce((acc, v) => acc + v, 0) / Math.max(centroidValues.length, 1);

  const minBpm = 100;
  const maxBpm = 180;
  const bpm = detectPulseRateFromSpectralFlux(spectra, sampleRate, hopSize, minBpm, maxBpm);

  // Normalizations:
  // harmonicPressure in [0, 1+] using 8 kHz as reference band center.
  const harmonicPressure = Math.min(centroid / 8000, 2.0);

  // beatResonance normalized to ~[0.66, 1.2] in the EBM BPM band.
  const beatResonance = bpm / 150;

  // spectralFatigueIndex: dimensionless ratio of rhythmic density to brightness.
  // SFI = (BPM / 60) / (C / 1000) = (1000 * BPM) / (60 * C).
  // Clamp to avoid division by zero and excessive values.
  const safeCentroid = Math.max(centroid, 1);
  const spectralFatigueIndexRaw = (1000 * bpm) / (60 * safeCentroid);
  const spectralFatigueIndex = Number(spectralFatigueIndexRaw.toFixed(3));

  const emotionalSignature = classifyMood(centroid, bpm);

  return {
    harmonicPressure,
    beatResonance,
    spectralFatigueIndex,
    emotionalSignature,
  };
}

/**
 * Frame the signal into overlapping windows.
 *
 * For hopSize = frameSize / 2, number of frames:
 *   N = floor((L - frameSize) / hopSize) + 1,  L = data.length.
 */
function frameIntoWindows(data, frameSize, hopSize) {
  const frames = [];
  const total = data.length;
  for (let start = 0; start + frameSize <= total; start += hopSize) {
    const frame = new Float32Array(frameSize);
    for (let i = 0; i < frameSize; i++) {
      frame[i] = data[start + i];
    }
    frames.push(frame);
  }
  return frames;
}

/**
 * Apply Hann window to reduce spectral leakage:
 *   w[n] = 0.5 * (1 - cos(2πn / (N - 1))) for 0 ≤ n < N.[web:17]
 */
function applyHannWindow(frame) {
  const N = frame.length;
  const out = new Float32Array(N);
  const factor = 2 * Math.PI / (N - 1);
  for (let n = 0; n < N; n++) {
    const w = 0.5 * (1 - Math.cos(factor * n));
    out[n] = frame[n] * w;
  }
  return out;
}

/**
 * Detect BPM from spectral flux envelope.
 *
 * Steps:[web:11]
 * 1. For each magnitude spectrum S_n(k), compute FLUX_n = Σ_k max(0, S_n(k) - S_{n-1}(k)).
 * 2. High-pass and normalize the flux envelope.
 * 3. Compute autocorrelation R(τ) on the flux envelope.
 * 4. Search for maximum R(τ) corresponding to periods in [60 / maxBpm, 60 / minBpm] seconds.
 * 5. BPM = 60 / T_peak.
 *
 * @param {Float32Array[]} spectra - per-frame magnitude spectra (fft output).
 * @param {number} sampleRate
 * @param {number} hopSize
 * @param {number} minBpm
 * @param {number} maxBpm
 * @returns {number} bpm
 */
function detectPulseRateFromSpectralFlux(
  spectra,
  sampleRate,
  hopSize,
  minBpm,
  maxBpm,
) {
  if (spectra.length < 4) {
    return (minBpm + maxBpm) * 0.5;
  }

  const numFrames = spectra.length;
  const binCount = spectra[0].length;

  // 1. Spectral flux per frame.
  const flux = new Float32Array(numFrames);
  for (let i = 1; i < numFrames; i++) {
    let sum = 0;
    const prev = spectra[i - 1];
    const curr = spectra[i];
    for (let k = 0; k < binCount; k++) {
      const diff = curr[k] - prev[k];
      if (diff > 0) {
        sum += diff;
      }
    }
    flux[i] = sum;
  }

  // 2a. High-pass like behavior: subtract local mean (moving average).
  const window = Math.min(16, numFrames);
  const ma = new Float32Array(numFrames);
  let acc = 0;
  for (let i = 0; i < numFrames; i++) {
    acc += flux[i];
    if (i >= window) {
      acc -= flux[i - window];
    }
    ma[i] = acc / Math.min(i + 1, window);
  }

  // 2b. Rectify and normalize.
  let maxFlux = 0;
  for (let i = 0; i < numFrames; i++) {
    const v = flux[i] - ma[i];
    const rect = v > 0 ? v : 0;
    flux[i] = rect;
    if (rect > maxFlux) maxFlux = rect;
  }
  if (maxFlux > 0) {
    for (let i = 0; i < numFrames; i++) {
      flux[i] /= maxFlux;
    }
  }

  // 3. Autocorrelation over flux envelope.
  const framePeriodSec = hopSize / sampleRate;
  const minPeriodSec = 60 / maxBpm;
  const maxPeriodSec = 60 / minBpm;

  const minLag = Math.max(1, Math.round(minPeriodSec / framePeriodSec));
  const maxLag = Math.min(
    numFrames - 2,
    Math.round(maxPeriodSec / framePeriodSec),
  );

  if (minLag >= maxLag) {
    return (minBpm + maxBpm) * 0.5;
  }

  let bestLag = minLag;
  let bestVal = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i + lag < numFrames; i++) {
      sum += flux[i] * flux[i + lag];
    }
    if (sum > bestVal) {
      bestVal = sum;
      bestLag = lag;
    }
  }

  const bestPeriodSec = bestLag * framePeriodSec;
  let bpm = 60 / bestPeriodSec;

  // Clamp to the specified band.
  if (bpm < minBpm) bpm = minBpm;
  if (bpm > maxBpm) bpm = maxBpm;

  return bpm;
}

/**
 * Classify mood into coarse EBM categories.
 *
 * Heuristic:
 *   - "agitated" when brightness and tempo are both high.
 *   - "reflective" otherwise.
 *
 * Thresholds are chosen from common EBM production practice:
 *   - centroid threshold ~4 kHz,
 *   - BPM threshold ~130 BPM.[web:19]
 */
function classifyMood(centroid, pulseRate) {
  return centroid > 4000 && pulseRate > 130 ? 'agitated' : 'reflective';
}

// Integrity stamp for this module (example, recompute in CI):
//   sha256sum /opt/javaspectre/spectral/audio/ebmResonanceParser.js
//   IMPLEMENTATION_HASH = "7c98b02a5c5c074c6419d46f36ef65941b5e9ad6d0a78a4e09bcd793d1e4c6a2"
export const IMPLEMENTATION_HASH =
  '7c98b02a5c5c074c6419d46f36ef65941b5e9ad6d0a78a4e09bcd793d1e4c6a2';
