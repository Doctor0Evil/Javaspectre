// Path: chromium-extension/panel.js
// Connects DevTools panel UI with page context via inspectedWindow.eval.

(function () {
  const scanButton = document.getElementById('scan-page');
  const alnIntentEl = document.getElementById('aln-intent');
  const virtualObjectsEl = document.getElementById('virtual-objects');

  scanButton.addEventListener('click', () => {
    const code = 'window.__JAVASPECTRE_EXTRACT_VIRTUAL_OBJECTS__ && window.__JAVASPECTRE_EXTRACT_VIRTUAL_OBJECTS__()';

    chrome.devtools.inspectedWindow.eval(
      code,
      { useContentScriptContext: true },
      (result, exceptionInfo) => {
        if (exceptionInfo && exceptionInfo.isException) {
          alnIntentEl.textContent =
            'Error during extraction: ' + (exceptionInfo.value || 'Unknown');
          virtualObjectsEl.textContent = '';
          return;
        }
        if (!result) {
          alnIntentEl.textContent =
            'No ALN document returned from page context.';
          virtualObjectsEl.textContent = '';
          return;
        }

        try {
          alnIntentEl.textContent = JSON.stringify(result.intent, null, 2);
          virtualObjectsEl.textContent = JSON.stringify(
            result.artifacts.virtualObjects,
            null,
            2
          );
        } catch (err) {
          alnIntentEl.textContent =
            'Error formatting ALN: ' + (err.message || String(err));
          virtualObjectsEl.textContent = '';
        }
      }
    );
  });
})();
