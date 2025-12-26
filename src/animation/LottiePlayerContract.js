// Path: src/animation/LottiePlayerContract.js

export const PlayMode = Object.freeze({
  Bounce: "bounce",
  Normal: "normal"
});

export const PlayerEvents = Object.freeze({
  Complete: "complete",
  Destroyed: "destroyed",
  Error: "error",
  Frame: "frame",
  Freeze: "freeze",
  Load: "load",
  Loop: "loop",
  Pause: "pause",
  Play: "play",
  Ready: "ready",
  Rendered: "rendered",
  Stop: "stop"
});

export const PlayerState = Object.freeze({
  Destroyed: "destroyed",
  Error: "error",
  Frozen: "frozen",
  Loading: "loading",
  Paused: "paused",
  Playing: "playing",
  Stopped: "stopped"
});

export default {
  PlayMode,
  PlayerEvents,
  PlayerState
};
