// src/chat/JavaspectreCommandBlock.js
// Javaspectre Command Block for AI Chat Integration
// © 2025 Perplexity Labs Inc. / Dr. Jacob S. Farmer

import {
  SpectralScanner,
  ObjectExcavator,
} from "../spectral-core/spectral-tools.js";

import { VirtualObjectExcavator } from "../core/VirtualObjectExcavator.js";
import { JavaspectreCapabilities } from "../capabilities/JavaspectreCapabilities.js";

/**
 * Core types
 */

export class JavaspectreCommandBlockContext {
  constructor({ input, args = [], userId, sessionId, metadata = {} }) {
    this.input = typeof input === "string" ? input : "";
    this.args = Array.isArray(args) ? args : [];
    this.userId = userId;
    this.sessionId = sessionId;
    this.metadata = metadata;
  }
}

/**
 * Chat interface abstraction
 */
export class JavaspectreChatInterfaceAdapter {
  constructor(host) {
    this.host = host;
  }

  registerCommand(trigger, handler) {
    if (!this.host || typeof this.host.registerCommand !== "function") {
      throw new Error("[Javaspectre] Host chat interface does not support registerCommand.");
    }
    this.host.registerCommand(trigger, async (ctx) => {
      const wrapped = new JavaspectreCommandBlockContext(ctx);
      return handler(wrapped);
    });
  }

  log(message, meta = {}) {
    if (this.host && typeof this.host.log === "function") {
      this.host.log(message, meta);
      return;
    }
    try {
      console.log(`[Javaspectre] ${message}`, meta);
    } catch {
      // no-op
    }
  }
}

/**
 * Risk & synthesis types
 */

export class JavaspectreRiskClassification {
  constructor({ cognitiveHazard, entropyAnomaly, ontologicalInstability, signals }) {
    this.cognitiveHazard = Boolean(cognitiveHazard);
    this.entropyAnomaly = Boolean(entropyAnomaly);
    this.ontologicalInstability = Boolean(ontologicalInstability);
    this.signals = Array.isArray(signals) ? signals : [];
  }
}

export class JavaspectreSynthesisResult {
  constructor({ blueprint, integrationPotential, complianceAnchor }) {
    this.blueprint = blueprint;
    this.integrationPotential = integrationPotential;
    this.complianceAnchor = Boolean(complianceAnchor);
  }
}

/**
 * Output envelope
 */

export class JavaspectreOutputEnvelope {
  constructor({ title, command, data, userId, sessionId, layer, version }) {
    this.title = title;
    this.timestamp = new Date().toISOString();
    this.system = "Javaspectre Command Block";
    this.data = data;
    this.meta = {
      version,
      command,
      userId,
      sessionId,
      layer,
      traceId: JavaspectreOutputEnvelope.createTraceId(),
    };
  }

  static createTraceId() {
    return `jsp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

/**
 * Deterministic-ish risk classifier using ALN-style heuristics
 * (no randomness; pure function of input text + metadata).
 */
export class ALNRiskClassifier {
  classify(input, metadata = {}) {
    const text = (input || "").toLowerCase();
    const signals = [];

    const cognitiveHazardKeywords = ["forbidden", "memetic", "cursed", "anomalous cognition"];
    const entropyKeywords = ["random stream", "noise", "entropy source", "unstable log"];
    const ontologicalKeywords = ["reality rewrite", "self-erasure", "identity collapse", "ontology loop"];

    const containsAny = (words) => words.some((w) => text.includes(w));

    const cognitiveHazard = containsAny(cognitiveHazardKeywords);
    if (cognitiveHazard) {
      signals.push({
        type: "cognitive-hazard-indicator",
        reason: "Detected memetic/forbidden semantics in input text.",
        weight: 0.9,
      });
    }

    const entropyAnomaly = containsAny(entropyKeywords);
    if (entropyAnomaly) {
      signals.push({
        type: "entropy-anomaly-indicator",
        reason: "Detected references to entropy/noise sources.",
        weight: 0.7,
      });
    }

    const ontologicalInstability = containsAny(ontologicalKeywords);
    if (ontologicalInstability) {
      signals.push({
        type: "ontological-instability-indicator",
        reason: "Detected ontology/identity destabilizing language.",
        weight: 0.85,
      });
    }

    if (metadata && metadata.layer === "deep-excavation") {
      signals.push({
        type: "deep-excavation-context",
        reason: "Context flagged as deep-excavation; raising review priority.",
        weight: 0.4,
      });
    }

    return new JavaspectreRiskClassification({
      cognitiveHazard,
      entropyAnomaly,
      ontologicalInstability,
      signals,
    });
  }
}

/**
 * Deep virtual-object excavation bridge for chat environments.
 * - Accepts raw JSON / JS-like input.
 * - Feeds into VirtualObjectExcavator.
 * - Returns a compact, chat-friendly summary + raw model.
 */
export class ChatVirtualObjectBridge {
  constructor() {
    this.excavator = new VirtualObjectExcavator({
      maxDepth: 6,
      maxArraySample: 10,
      includeDom: false,
      includeFunctions: false,
    });
  }

  safeParse(input) {
    const trimmed = (input || "").trim();
    if (!trimmed) return null;
    try {
      // Best-effort JSON parse for chat payloads.
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  excavateFromInput(input) {
    const value = this.safeParse(input);
    if (value === null) {
      return {
        summary: {
          status: "skipped",
          reason: "Input is not parseable as JSON; no deep excavation performed.",
        },
        virtualObjects: [],
        relationships: [],
        domSheets: [],
      };
    }

    const result = this.excavator.excavate({ value, domRoot: null });

    const dominantKinds = {};
    for (const vo of result.virtualObjects) {
      const kind = vo.kind || "unknown";
      dominantKinds[kind] = (dominantKinds[kind] || 0) + 1;
    }

    return {
      summary: {
        status: "ok",
        rootId: result.root && result.root.id,
        objectCount: result.virtualObjects.length,
        relationshipCount: result.relationships.length,
        domSheetCount: result.domSheets.length,
        dominantKinds,
      },
      virtualObjects: result.virtualObjects,
      relationships: result.relationships,
      domSheets: result.domSheets,
    };
  }
}

/**
 * Javaspectre Command Block
 */
export class JavaspectreCommandBlock {
  constructor(chatInterface) {
    this.name = "JavaspectreCommandBlock";
    this.version = "1.1.0";
    this.active = true;

    this.chatInterface = chatInterface
      ? new JavaspectreChatInterfaceAdapter(chatInterface)
      : undefined;

    this.riskClassifier = new ALNRiskClassifier();
    this.voBridge = new ChatVirtualObjectBridge();

    if (this.chatInterface) {
      this.init(this.chatInterface);
    }
  }

  init(chatInterface) {
    this.chatInterface = chatInterface instanceof JavaspectreChatInterfaceAdapter
      ? chatInterface
      : new JavaspectreChatInterfaceAdapter(chatInterface);

    this.chatInterface.log("Command Block Initialized.", {
      module: this.name,
      version: this.version,
    });

    this.attachCommands();
  }

  attachCommands() {
    if (!this.chatInterface) {
      throw new Error("[Javaspectre] Cannot attach commands before initialization.");
    }

    const commands = [
      { trigger: "/excavate", handler: this.runExcavation.bind(this) },
      { trigger: "/spectral-scan", handler: this.runSpectralScan.bind(this) },
      { trigger: "/classify", handler: this.runClassification.bind(this) },
      { trigger: "/synthesize", handler: this.runSynthesis.bind(this) },
      { trigger: "/capabilities", handler: this.runCapabilities.bind(this) },
    ];

    for (const cmd of commands) {
      this.chatInterface.registerCommand(cmd.trigger, cmd.handler);
    }

    this.chatInterface.log("Commands registered.", {
      commands: commands.map((c) => c.trigger),
    });
  }

  /**
   * /excavate – layer-based + optional JSON deep virtual-object excavation.
   * Usage examples inside chat:
   *   /excavate default { "user": { "id": 1, "roles": ["admin"] } }
   *   /excavate deep-excavation { ...large-structure... }
   */
  async runExcavation(context) {
    const layer = context.args && context.args[0]
      ? String(context.args[0]).trim()
      : "default";

    const payload = context.input || "";
    const deepModel = this.voBridge.excavateFromInput(payload);

    try {
      const coreResult = await Promise.resolve(ObjectExcavator.excavate(layer));

      return new JavaspectreOutputEnvelope({
        title: "Excavation Report",
        command: "/excavate",
        userId: context.userId,
        sessionId: context.sessionId,
        layer,
        version: this.version,
        data: {
          layer,
          coreExcavation: coreResult,
          virtualObjectExcavation: deepModel,
        },
      });
    } catch (error) {
      this.chatInterface && this.chatInterface.log("Excavation failed.", {
        error: String(error),
        layer,
      });

      return new JavaspectreOutputEnvelope({
        title: "Excavation Error",
        command: "/excavate",
        userId: context.userId,
        sessionId: context.sessionId,
        layer,
        version: this.version,
        data: {
          error: "Excavation failed",
          details: String(error),
        },
      });
    }
  }

  /**
   * /spectral-scan – semantic & structural scanning with capability hints.
   */
  async runSpectralScan(context) {
    const input = (context.input || "").trim();

    if (!input) {
      return new JavaspectreOutputEnvelope({
        title: "Spectral Scan Error",
        command: "/spectral-scan",
        userId: context.userId,
        sessionId: context.sessionId,
        version: this.version,
        data: { error: "No input provided for spectral scan." },
      });
    }

    try {
      const scan = await Promise.resolve(SpectralScanner.performFullScan(input));

      const matchedCapabilities = this.matchCapabilities(input);

      return new JavaspectreOutputEnvelope({
        title: "Spectral Scan Output",
        command: "/spectral-scan",
        userId: context.userId,
        sessionId: context.sessionId,
        version: this.version,
        data: {
          scan,
          matchedCapabilities,
        },
      });
    } catch (error) {
      this.chatInterface && this.chatInterface.log("Spectral scan failed.", {
        error: String(error),
      });

      return new JavaspectreOutputEnvelope({
        title: "Spectral Scan Error",
        command: "/spectral-scan",
        userId: context.userId,
        sessionId: context.sessionId,
        version: this.version,
        data: {
          error: "Spectral scan failed",
          details: String(error),
        },
      });
    }
  }

  /**
   * /classify – deterministic risk & anomaly classification using ALNRiskClassifier.
   */
  async runClassification(context) {
    const input = (context.input || "").trim();
    const analysis = this.riskClassifier.classify(input, {
      userId: context.userId,
      sessionId: context.sessionId,
      layer: context.args && context.args[0] ? String(context.args[0]) : undefined,
    });

    return new JavaspectreOutputEnvelope({
      title: "Risk & Anomaly Classification",
      command: "/classify",
      userId: context.userId,
      sessionId: context.sessionId,
      version: this.version,
      data: analysis,
    });
  }

  /**
   * /synthesize – blueprint + integration potential, preserving your original semantics.
   */
  async runSynthesis(context) {
    const input = (context.input || "").trim();

    const base = new JavaspectreSynthesisResult({
      blueprint: input
        ? `Blueprint constructed for: ${input}`
        : "Blueprint constructed for: <empty-input>",
      integrationPotential: input ? "High" : "Unknown",
      complianceAnchor: true,
    });

    return new JavaspectreOutputEnvelope({
      title: "Synthesis Protocol",
      command: "/synthesize",
      userId: context.userId,
      sessionId: context.sessionId,
      version: this.version,
      data: base,
    });
  }

  /**
   * /capabilities – expose the 15 spectral capabilities in a chat-friendly format.
   */
  async runCapabilities(context) {
    const capabilities = Array.isArray(JavaspectreCapabilities)
      ? JavaspectreCapabilities
      : [];

    return new JavaspectreOutputEnvelope({
      title: "Javaspectre Capabilities Map",
      command: "/capabilities",
      userId: context.userId,
      sessionId: context.sessionId,
      version: this.version,
      data: {
        count: capabilities.length,
        capabilities,
      },
    });
  }

  /**
   * Simple intent-to-capability matcher using text heuristics.
   */
  matchCapabilities(input) {
    const text = (input || "").toLowerCase();
    const capabilities = Array.isArray(JavaspectreCapabilities)
      ? JavaspectreCapabilities
      : [];

    const matches = [];

    for (const cap of capabilities) {
      const tags = Array.isArray(cap.spectralTags) ? cap.spectralTags : [];
      const keywords = [
        cap.name || "",
        cap.category || "",
        ...(tags || []),
      ]
        .join(" ")
        .toLowerCase()
        .split(/[\s,]+/)
        .filter(Boolean);

      const score = keywords.reduce((acc, kw) => {
        if (!kw) return acc;
        if (text.includes(kw)) return acc + 1;
        return acc;
      }, 0);

      if (score > 0) {
        matches.push({
          id: cap.id,
          name: cap.name,
          category: cap.category,
          heuristicScore: cap.heuristicScore || 0,
          matchScore: score,
          primaryCli: cap.primaryCli,
        });
      }
    }

    matches.sort((a, b) => {
      const h = (b.heuristicScore || 0) - (a.heuristicScore || 0);
      if (h !== 0) return h;
      return (b.matchScore || 0) - (a.matchScore || 0);
    });

    return matches.slice(0, 5);
  }
}

/**
 * Auto-mount for AI chat environments supporting custom modules.
 */
// eslint-disable-next-line no-undef
const globalAny = globalThis;

if (typeof globalAny.ChatAI !== "undefined") {
  const block = new JavaspectreCommandBlock(globalAny.ChatAI);
  // block.init is called from constructor when chatInterface is provided.
}

export default JavaspectreCommandBlock;
