// Path: src/animation/LottieSpecterBridge.js

// LottieSpecterBridge
// -----------------------------------------------------------------------------
// A high-level bridge that connects a <lottie-player> element to a spectral
// event model suitable for FormSpecter / Javaspectre-like systems.
// It listens to player events, tracks state transitions, and emits structured,
// analytics-friendly signals without leaking DOM details.
//
// Usage sketch:
//
//   import { LottieSpecterBridge } from "./animation/LottieSpecterBridge.js";
//
//   const playerEl = document.querySelector("lottie-player");
//   const bridge = new LottieSpecterBridge(playerEl, {
//     context: "Trial",
//     channel: "onboarding-animation",
//     onSpectralEvent: (event) => console.log("Spectral event", event)
//   });
//
//   bridge.start(); // attach listeners
//
// -----------------------------------------------------------------------------

export class LottieSpecterBridge {
  constructor(playerElement, options = {}) {
    if (!playerElement) {
      throw new Error("LottieSpecterBridge requires a <lottie-player> element.");
    }

    this.player = playerElement;

    this.options = {
      context: options.context || null,
      channel: options.channel || "default",
      autoStart: options.autoStart !== false,
      onSpectralEvent: options.onSpectralEvent || (() => {}),
      clock: options.clock || (() => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now())),
      // Optional mapping of player events to spectral event types.
      eventMap: {
        complete: "animation_complete",
        destroyed: "animation_destroyed",
        error: "animation_error",
        frame: "animation_frame",
        freeze: "animation_frozen",
        pause: "animation_paused",
        play: "animation_playing",
        loop: "animation_loop",
        ready: "animation_ready"
      },
      ...options
    };

    this._started = false;
    this._eventLog = [];
    this._stateSnapshot = {
      state: null,
      lastEvent: null,
      playback: {
        speed: null,
        direction: null,
        loop: null,
        mode: null
      }
    };

    this._handlers = {
      complete: (e) => this._handlePlayerEvent("complete", e),
      destroyed: (e) => this._handlePlayerEvent("destroyed", e),
      error: (e) => this._handlePlayerEvent("error", e),
      frame: (e) => this._handlePlayerEvent("frame", e),
      freeze: (e) => this._handlePlayerEvent("freeze", e),
      pause: (e) => this._handlePlayerEvent("pause", e),
      play: (e) => this._handlePlayerEvent("play", e),
      loop: (e) => this._handlePlayerEvent("loop", e),
      ready: (e) => this._handlePlayerEvent("ready", e)
    };

    if (this.options.autoStart) {
      this.start();
    }
  }

  // Attach all event listeners and initialize snapshot.
  start() {
    if (this._started) return;

    this._started = true;

    this.player.addEventListener("complete", this._handlers.complete);
    this.player.addEventListener("destroyed", this._handlers.destroyed);
    this.player.addEventListener("error", this._handlers.error);
    this.player.addEventListener("frame", this._handlers.frame);
    this.player.addEventListener("freeze", this._handlers.freeze);
    this.player.addEventListener("pause", this._handlers.pause);
    this.player.addEventListener("play", this._handlers.play);
    this.player.addEventListener("loop", this._handlers.loop);
    this.player.addEventListener("ready", this._handlers.ready);

    this._syncPlaybackSnapshot();
    this._emitSpectralEvent("bridge_started", { initialState: this._stateSnapshot });
  }

  // Detach all event listeners.
  stop() {
    if (!this._started) return;

    this._started = false;

    this.player.removeEventListener("complete", this._handlers.complete);
    this.player.removeEventListener("destroyed", this._handlers.destroyed);
    this.player.removeEventListener("error", this._handlers.error);
    this.player.removeEventListener("frame", this._handlers.frame);
    this.player.removeEventListener("freeze", this._handlers.freeze);
    this.player.removeEventListener("pause", this._handlers.pause);
    this.player.removeEventListener("play", this._handlers.play);
    this.player.removeEventListener("loop", this._handlers.loop);
    this.player.removeEventListener("ready", this._handlers.ready);

    this._emitSpectralEvent("bridge_stopped", { finalState: this._stateSnapshot });
  }

  // Internal handler: normalize and emit spectral events.
  _handlePlayerEvent(eventName, domEvent) {
    this._syncPlaybackSnapshot();

    const spectralType = this.options.eventMap[eventName] || `animation_${eventName}`;
    const timestamp = this.options.clock();

    const payload = {
      type: spectralType,
      rawEvent: eventName,
      context: this.options.context,
      channel: this.options.channel,
      timestamp,
      stateSnapshot: { ...this._stateSnapshot },
      detail: domEvent && domEvent.detail ? domEvent.detail : null
    };

    this._stateSnapshot.lastEvent = {
      type: spectralType,
      rawEvent: eventName,
      timestamp
    };

    this._eventLog.push(payload);
    this.options.onSpectralEvent(payload);

    // Example: convenience triggers for higher-level UX flows
    if (spectralType === "animation_complete") {
      this._emitSpectralEvent("animation_complete_ack", {
        source: "bridge",
        lastEvent: this._stateSnapshot.lastEvent
      });
    }

    if (spectralType === "animation_error") {
      this._emitSpectralEvent("animation_error_alert", {
        source: "bridge",
        lastEvent: this._stateSnapshot.lastEvent
      });
    }
  }

  // Synchronize local playback snapshot with the player element.
  _syncPlaybackSnapshot() {
    const p = this.player;

    // Many <lottie-player> implementations expose these as properties.
    const speed = typeof p.getLottieSpeed === "function" ? p.getLottieSpeed() : p.speed ?? null;
    const direction = typeof p.getLottieDirection === "function" ? p.getLottieDirection() : p.direction ?? null;
    const loop = typeof p.getLottieLoop === "function" ? p.getLottieLoop() : p.loop ?? null;
    const mode = typeof p.getLottieMode === "function" ? p.getLottieMode() : p.mode ?? null;
    const currentState = p.currentState || p.state || null;

    this._stateSnapshot.state = currentState;
    this._stateSnapshot.playback = {
      speed,
      direction,
      loop,
      mode
    };
  }

  // Emit a synthetic spectral event not directly tied to a DOM event.
  _emitSpectralEvent(type, extra = {}) {
    const timestamp = this.options.clock();
    const payload = {
      type,
      context: this.options.context,
      channel: this.options.channel,
      timestamp,
      ...extra
    };
    this._eventLog.push(payload);
    this.options.onSpectralEvent(payload);
  }

  // Public: returns a shallow copy of recent events.
  getEventLog() {
    return this._eventLog.slice();
  }

  // Public: returns the most recent state snapshot.
  getStateSnapshot() {
    return { ...this._stateSnapshot };
  }

  // Public: convenience control methods (if supported by the underlying player).
  play() {
    if (typeof this.player.play === "function") {
      this.player.play();
    }
  }

  pause() {
    if (typeof this.player.pause === "function") {
      this.player.pause();
    }
  }

  stopAnimation() {
    if (typeof this.player.stop === "function") {
      this.player.stop();
    }
  }

  seekTo(progress) {
    // progress 0–1 or frame index, depending on player implementation.
    if (typeof this.player.seek === "function") {
      this.player.seek(progress);
    }
  }

  setSpeed(speed) {
    if (typeof this.player.setSpeed === "function") {
      this.player.setSpeed(speed);
    } else if ("speed" in this.player) {
      this.player.speed = speed;
    }
    this._syncPlaybackSnapshot();
  }

  setDirection(direction) {
    if (typeof this.player.setDirection === "function") {
      this.player.setDirection(direction);
    } else if ("direction" in this.player) {
      this.player.direction = direction;
    }
    this._syncPlaybackSnapshot();
  }

  setLoop(loop) {
    if ("loop" in this.player) {
      this.player.loop = loop;
    }
    this._syncPlaybackSnapshot();
  }

  setMode(mode) {
    if ("mode" in this.player) {
      this.player.mode = mode;
    }
    this._syncPlaybackSnapshot();
  }
}

export default LottieSpecterBridge;
