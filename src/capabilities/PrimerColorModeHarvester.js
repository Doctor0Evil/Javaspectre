// Path: src/capabilities/PrimerColorModeHarvester.js

class PrimerColorModeHarvester {
  /**
   * Extract color-mode payloads from __PRIMER_DATA_ script tags.
   * @param {Document} doc
   * @returns {{modePayloads: Array, activeMode: string|null}}
   */
  static harvest(doc) {
    const scripts = Array.from(
      doc.querySelectorAll('script[id^="__PRIMER_DATA_"][type="application/json"]')
    );

    const modePayloads = [];
    let activeMode = null;

    for (const el of scripts) {
      const raw = el.textContent || el.innerHTML || "";
      let json;
      try {
        json = JSON.parse(raw);
      } catch {
        continue;
      }

      if (json && typeof json.resolvedServerColorMode === "string") {
        const payload = {
          id: el.id,
          resolvedServerColorMode: json.resolvedServerColorMode,
          role: "PrimerServerColorModePayload",
          baseURI: el.baseURI
        };
        modePayloads.push(payload);
        activeMode = json.resolvedServerColorMode;
      }
    }

    return { modePayloads, activeMode };
  }
}

export default PrimerColorModeHarvester;
