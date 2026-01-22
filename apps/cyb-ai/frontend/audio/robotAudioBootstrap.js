import * as Tone from 'tone';

class RobotAudioBootstrap {
  constructor() {
    this.audioContext = null;
    this.isAudioEnabled = false;
  }

  init() {
    // Create AudioContext in suspended state
    this.audioContext = new Tone.Context({ latencyHint: 'interactive' });
    // Setup Tone.js nodes here
  }

  enableAudio() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('Audio resumed successfully');
        this.isAudioEnabled = true;
      }).catch(err => {
        console.error('Failed to resume audio:', err);
      });
    }
  }

  // Method to handle user gesture
  handleUserGesture() {
    this.enableAudio();
  }
}

export default RobotAudioBootstrap;
