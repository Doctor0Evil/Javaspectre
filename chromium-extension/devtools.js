// Path: chromium-extension/devtools.js
// Registers a DevTools panel for ALN / virtual-object inspection.

chrome.devtools.panels.create(
  'Javaspectre',
  '',
  'panel.html',
  function () {
    // Panel created; nothing else needed here for now.
  }
);
