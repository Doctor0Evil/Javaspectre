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

function sha256Hex(input: string): string {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(input))
    .then((buf) => {
      const bytes = new Uint8Array(buf);
      let out = "";
      for (const b of bytes) out += b.toString(16).padStart(2, "0");
      return out;
    });
}

function buildDomPath(el: Element): string {
  const segments: string[] = [];
  let node: Element | null = el;
  while (node && segments.length < 10) {
    const tag = node.tagName.toLowerCase();
    const id = node.id ? `#${node.id}` : "";
    const cls = node.className && typeof node.className === "string"
      ? "." + node.className.split(/\s+/).filter(Boolean).join(".")
      : "";
    segments.unshift(`${tag}${id}${cls}`);
    node = node.parentElement;
  }
  return segments.join(" > ");
}

export async function excavateNodeInMotion(
  el: Element,
  ctx: ExcavationContext
): Promise<VirtualObjectSnapshot> {
  const selector = buildDomPath(el);
  const outer = el.outerHTML || el.textContent || "";
  const trimmed = outer.slice(0, 4096);
  const baseSeed = `${ctx.url}|${ctx.eventType}|${selector}|${trimmed}`;
  const id = await sha256Hex(baseSeed);

  const handle: VirtualObjectHandle = {
    id,
    kind: "dom-node",
    selector,
    url: ctx.url,
    label: el.getAttribute("aria-label") || el.textContent?.slice(0, 80) || selector,
    createdAt: new Date(ctx.timestamp).toISOString(),
  };

  return {
    handle,
    domContext: trimmed,
    eventContext: { type: ctx.eventType },
  };
}

export async function quickListHiddenUnveil(
  root: Element,
  ctx: ExcavationContext,
  limit = 32
): Promise<VirtualObjectSnapshot[]> {
  const candidates: Element[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
  let node = walker.currentNode as Element | null;

  while (node && candidates.length < limit * 4) {
    const style = window.getComputedStyle(node);
    const hidden = style.display === "none" || style.visibility === "hidden" || style.opacity === "0";
    const ariaHidden = node.getAttribute("aria-hidden") === "true";
    const offscreen = style.position === "fixed" || style.position === "absolute";
    if ((hidden || ariaHidden || offscreen) && node.textContent && node.textContent.trim().length > 0) {
      candidates.push(node);
    }
    node = walker.nextNode() as Element | null;
  }

  const now = Date.now();
  const snapshots: VirtualObjectSnapshot[] = [];
  for (const el of candidates.slice(0, limit)) {
    const selector = buildDomPath(el);
    const text = el.textContent?.trim().slice(0, 512) || "";
    const seed = `${ctx.url}|hidden|${selector}|${text}`;
    const id = await sha256Hex(seed);
    snapshots.push({
      handle: {
        id,
        kind: "dom-node",
        selector,
        url: ctx.url,
        label: text || selector,
        createdAt: new Date(now).toISOString(),
      },
      domContext: el.outerHTML?.slice(0, 2048),
    });
  }

  return snapshots;
}

export function attachJavaspectreExcavators(
  onSnapshot: (snap: VirtualObjectSnapshot) => void,
  onBatch?: (snaps: VirtualObjectSnapshot[]) => void
): () => void {
  const handler = async (ev: MouseEvent) => {
    const target = ev.target as Element | null;
    if (!target) return;
    const ctx: ExcavationContext = {
      url: location.href,
      timestamp: Date.now(),
      eventType: ev.type,
      eventTargetDescription: target.tagName.toLowerCase(),
    };
    const snap = await excavateNodeInMotion(target, ctx);
    onSnapshot(snap);
  };

  const over = (ev: MouseEvent) => handler(ev);
  const click = (ev: MouseEvent) => handler(ev);

  window.addEventListener("mouseover", over, true);
  window.addEventListener("click", click, true);

  const mutationObserver = new MutationObserver(async () => {
    if (!onBatch) return;
    const ctx: ExcavationContext = {
      url: location.href,
      timestamp: Date.now(),
      eventType: "dom-mutation",
    };
    const snaps = await quickListHiddenUnveil(document.body, ctx, 16);
    if (snaps.length) onBatch(snaps);
  });

  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return () => {
    window.removeEventListener("mouseover", over, true);
    window.removeEventListener("click", click, true);
    mutationObserver.disconnect();
  };
}
