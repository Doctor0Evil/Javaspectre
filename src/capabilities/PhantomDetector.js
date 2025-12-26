// Path: src/capabilities/PhantomDetector.js
// Black-box analysis and undocumented API mapping.

export class PhantomDetector {
  constructor(options = {}) {
    this.minOccurrences =
      typeof options.minOccurrences === "number" ? options.minOccurrences : 3;
  }

  /**
   * Analyze runtime traces and network logs to infer phantom interfaces.
   *
   * @param {object} params
   * @param {Array<object>} params.traces
   * @param {Array<object>} params.networkLogs
   * @returns {object}
   */
  analyze(params = {}) {
    const { traces = [], networkLogs = [] } = params;

    const apiPatterns = this.#extractApiPatterns(networkLogs);
    const stateMachines = this.#extractStateMachines(traces);

    return {
      phantomInterfaces: apiPatterns,
      behaviorModels: stateMachines
    };
  }

  #extractApiPatterns(networkLogs) {
    const map = new Map();

    networkLogs.forEach((log) => {
      const method = (log.method || "GET").toUpperCase();
      const url = String(log.url || "");
      const key = `${method} ${this.#normalizeUrl(url)}`;
      const stat = map.get(key) || {
        signature: key,
        count: 0,
        statusCodes: new Set()
      };
      stat.count += 1;
      if (log.status) {
        stat.statusCodes.add(log.status);
      }
      map.set(key, stat);
    });

    return Array.from(map.values())
      .filter((s) => s.count >= this.minOccurrences)
      .map((s) => ({
        interfaceId: s.signature,
        count: s.count,
        statusCodes: Array.from(s.statusCodes),
        confidence: Math.min(1, s.count / (this.minOccurrences * 2))
      }));
  }

  #extractStateMachines(traces) {
    const machines = [];
    const byEntity = new Map();

    traces.forEach((t) => {
      const entity = t.entity || "unknown";
      const state = t.state || "unknown";
      const next = t.nextState || null;
      const key = `${entity}:${state}`;
      if (!byEntity.has(key)) {
        byEntity.set(key, new Set());
      }
      if (next) {
        byEntity.get(key).add(next);
      }
    });

    byEntity.forEach((nextStates, key) => {
      const [entity, state] = key.split(":");
      machines.push({
        entity,
        state,
        transitions: Array.from(nextStates),
        confidence: Math.min(1, nextStates.size / 5)
      });
    });

    return machines;
  }

  #normalizeUrl(url) {
    return url.replace(/[0-9]{2,}/g, ":id").split("?")[0];
  }
}

export default PhantomDetector;
