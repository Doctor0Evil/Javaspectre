// Path: src/core/JavaspectreExcavationCore.ts

export interface VirtualObjectHandle {
  id: string;              // stable-ish ID: selector + content hash
  kind: "dom-node" | "component" | "request" | "event-scope";
  selector?: string;
  url?: string;
  label: string;
  createdAt: string;
}

export interface VirtualObjectSnapshot {
  handle: VirtualObjectHandle;
  domContext?: string;     // trimmed outerHTML or text
  dataShape?: Record<string, unknown>; // inferred JSON-like shape
  eventContext?: {
    type: string;
    x?: number;
    y?: number;
    button?: number;
  };
}

export interface ExcavationContext {
  url: string;
  timestamp: number;
  eventType: string;
  eventTargetDescription?: string;
}
