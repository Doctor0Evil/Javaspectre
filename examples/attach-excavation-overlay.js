// Path: examples/attach-excavation-overlay.js
// Simple overlay logger using the Javaspectre Excavation Core.

import {
  startExcavationCore
} from "../src/core/JavaspectreExcavationCore.js";

function createOverlay() {
  const box = document.createElement("div");
  box.style.position = "fixed";
  box.style.right = "12px";
  box.style.bottom = "12px";
  box.style.maxWidth = "400px";
  box.style.maxHeight = "40vh";
  box.style.overflow = "auto";
  box.style.background = "rgba(0,0,0,0.82)";
  box.style.color = "#e3e3e3";
  box.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  box.style.fontSize = "11px";
  box.style.padding = "8px";
  box.style.borderRadius = "6px";
  box.style.zIndex = "2147483647";
  box.style.pointerEvents = "none";
  box.id = "javaspectre-excavation-overlay";
  document.body.appendChild(box);
  return box;
}

function formatSnapshotLine(snap) {
  const h = snap.handle;
  const label = h.label || h.selector || h.id.slice(0, 12);
  const type = h.kind;
  return "[" + type + "] " + label + " :: " + h.id.slice(0, 12);
}

(function main() {
  const overlay = createOverlay();

  const onSnapshot = (snap) => {
    const line = document.createElement("div");
    line.textContent = formatSnapshotLine(snap);
    overlay.prepend(line);
    const maxLines = 80;
    while (overlay.childNodes.length > maxLines) {
      overlay.removeChild(overlay.lastChild);
    }
  };

  const onBatch = (snaps) => {
    const header = document.createElement("div");
    header.textContent =
      "Hidden batch: " + snaps.length + " node(s) discovered.";
    header.style.marginTop = "6px";
    header.style.fontWeight = "bold";
    overlay.prepend(header);
    for (let i = 0; i < snaps.length; i += 1) {
      const item = document.createElement("div");
      item.textContent = "  " + formatSnapshotLine(snaps[i]);
      overlay.prepend(item);
    }
  };

  const { detach } = startExcavationCore(onSnapshot, onBatch);

  // Expose teardown for debuggers or devtools.
  window.JavaspectreExcavation = {
    detach
  };
})();
