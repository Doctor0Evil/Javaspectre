// file: runtime/bridge/openxr-neuro-bridge.js
import { validateNeuroSignalChannel } from "../neuroxr-validator.js";

export async function openNeuroChannel(channelSpec, openHardwareFn) {
  // channelSpec is derived from ALN/JSON (no UI logic in it)
  validateNeuroSignalChannel(channelSpec);

  // If validation passes, we are allowed to talk to hardware
  const handle = await openHardwareFn(channelSpec);
  return handle;
}
