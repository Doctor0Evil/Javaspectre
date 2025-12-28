// Path: src/core/JavaspectreExcavationCore.js
// Javaspectre Excavation Core
// Event-reactive virtual-object excavation for live DOMs.
// - Stable virtual-object handles via DOM path + content hash
// - Motion-aware scanning of hidden / offscreen nodes
// - Non-blocking event wiring suitable for extensions, devtools, or in-page use

// ---- Core Types (JSDoc) ------------------------------------

/**
 * @typedef {Object} VirtualObjectHandle
 * @property {string} id          Stable-ish ID: selector + content hash.
 * @property {"dom-node"|"component"|"request"|"event-scope"} kind
 * @property {string} [selector]
 * @property {string} [url]
 * @property {string} label
 * @property {string} createdAt   ISO timestamp.
 */

/**
 * @typedef {Object} VirtualObjectSnapshot
 * @property {VirtualObjectHandle} handle
 * @property {string} [domContext]         Trimmed outerHTML or text.
 * @property {Object.<string, any>} [dataShape]
 * @property {{type:string,x?:number,y?:number,button?:number}} [eventContext]
 */

/**
 * @typedef {Object} ExcavationContext
 * @property {string} url
 * @property {number} timestamp
 * @property {string} eventType
 * @property {string} [eventTargetDescription]
 */

// ---- Hash & ID Utilities -----------------------------------

async function sha256Hex(input) {
  if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest) {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(input)
    );
    const bytes = new Uint8Array(buf);
    let out = "";
    for (const b of bytes) out += b.toString(16).padStart(2, "0");
    return out;
  }

  // Fallback for environments without Web Crypto (very rare in modern browsers)
  // Simple, deterministic hash (not cryptographically strong).
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
}

function buildDomPath(el) {
  const segments = [];
  let node = el;
  while (node && segments.length < 10) {
    const tag = node.tagName ? node.tagName.toLowerCase() : "unknown";
    const id = node.id ? "#" + node.id : "";
    let cls = "";
    if (node.className && typeof node.className === "string") {
      const clean = node.className
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 4)
        .join(".");
      cls = clean ? "." + clean : "";
    }
    segments.unshift(tag + id + cls);
    node = node.parentElement;
  }
  return segments.join(" > ");
}

// ---- Single-Node Excavation --------------------------------

/**
 * Excavate a single DOM element at the moment of interaction.
 * @param {Element} el
 * @param {ExcavationContext} ctx
 * @returns {Promise<VirtualObjectSnapshot>}
 */
export async function excavateNodeInMotion(el, ctx) {
  const selector = buildDomPath(el);
  const outer =
    typeof el.outerHTML === "string"
      ? el.outerHTML
      : el.textContent || "";
  const trimmed = outer.slice(0, 4096);
  const baseSeed = ctx.url + "|" + ctx.eventType + "|" + selector + "|" + trimmed;
  const id = await sha256Hex(baseSeed);

  const textLabel =
    el.getAttribute && el.getAttribute("aria-label")
      ? el.getAttribute("aria-label")
      : el.textContent || selector;

  /** @type {VirtualObjectHandle} */
  const handle = {
    id,
    kind: "dom-node",
    selector,
    url: ctx.url,
    label: (textLabel || "").trim().slice(0, 80) || selector,
    createdAt: new Date(ctx.timestamp).toISOString()
  };

  /** @type {VirtualObjectSnapshot} */
  const snapshot = {
    handle,
    domContext: trimmed,
    eventContext: { type: ctx.eventType }
  };

  return snapshot;
}

// ---- Motion-Aware List Excavation --------------------------

/**
 * Scan for hidden, aria-hidden, or offscreen nodes with meaningful text.
 * Useful for "quick-list / hidden-unveil" behaviors.
 * @param {Element} root
 * @param {ExcavationContext} ctx
 * @param {number} [limit]
 * @returns {Promise<VirtualObjectSnapshot[]>}
 */
export async function quickListHiddenUnveil(root, ctx, limit = 32) {
  const candidates = [];
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    null
  );
  let node = /** @type {Element|null} */ (walker.currentNode);

  while (node && candidates.length < limit * 4) {
    const style = window.getComputedStyle(node);
    const hidden =
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0";
    const ariaHidden = node.getAttribute("aria-hidden") === "true";
    const offscreen =
      style.position === "fixed" || style.position === "absolute";
    const hasText =
      node.textContent && node.textContent.trim().length > 0;

    if ((hidden || ariaHidden || offscreen) && hasText) {
      candidates.push(node);
    }

    node = /** @type {Element|null} */ (walker.nextNode());
  }

  const now = Date.now();
  /** @type {VirtualObjectSnapshot[]} */
  const snapshots = [];

  const slice = candidates.slice(0, limit);
  for (let i = 0; i < slice.length; i += 1) {
    const el = slice[i];
    const selector = buildDomPath(el);
    const text =
      (el.textContent || "").trim().slice(0, 512);
    const seed = ctx.url + "|hidden|" + selector + "|" + text;
    const id = await sha256Hex(seed);

    /** @type {VirtualObjectHandle} */
    const handle = {
      id,
      kind: "dom-node",
      selector,
      url: ctx.url,
      label: text || selector,
      createdAt: new Date(now).toISOString()
    };

    snapshots.push({
      handle,
      domContext:
        typeof el.outerHTML === "string"
          ? el.outerHTML.slice(0, 2048)
          : text
    });
  }

  return snapshots;
}

// ---- Event Wiring Helpers ----------------------------------

/**
 * Attach hover / click / mutation excavators.
 * Returns a teardown function to detach all listeners.
 * @param {(snap: VirtualObjectSnapshot) => void} onSnapshot
 * @param {(snaps: VirtualObjectSnapshot[]) => void} [onBatch]
 * @returns {() => void}
 */
export function attachJavaspectreExcavators(onSnapshot, onBatch) {
  const handler = async (ev) => {
    const target = /** @type {Element|null} */ (ev.target);
    if (!target || !(target instanceof Element)) return;

    /** @type {ExcavationContext} */
    const ctx = {
      url: String(location.href),
      timestamp: Date.now(),
      eventType: ev.type,
      eventTargetDescription:
        target.tagName ? target.tagName.toLowerCase() : "unknown"
    };

    try {
      const snap = await excavateNodeInMotion(target, ctx);
      onSnapshot(snap);
    } catch (err) {
      // Intentionally swallow errors to avoid breaking the page.
      // Consumers can add their own logging if desired.
      void err;
    }
  };

  const over = (ev) => handler(ev);
  const click = (ev) => handler(ev);

  window.addEventListener("mouseover", over, true);
  window.addEventListener("click", click, true);

  const mutationObserver = new MutationObserver(async () => {
    if (!onBatch) return;
    /** @type {ExcavationContext} */
    const ctx = {
      url: String(location.href),
      timestamp: Date.now(),
      eventType: "dom-mutation"
    };
    try {
      const snaps = await quickListHiddenUnveil(document.body, ctx, 16);
      if (snaps.length) onBatch(snaps);
    } catch (err) {
      void err;
    }
  });

  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  return () => {
    window.removeEventListener("mouseover", over, true);
    window.removeEventListener("click", click, true);
    mutationObserver.disconnect();
  };
}

// ---- Convenience API ---------------------------------------

/**
 * One-shot helper: attach excavators and return handle + teardown.
 * @param {(snap: VirtualObjectSnapshot) => void} onSnapshot
 * @param {(snaps: VirtualObjectSnapshot[]) => void} [onBatch]
 * @returns {{ detach: () => void }}
 */
export function startExcavationCore(onSnapshot, onBatch) {
  const detach = attachJavaspectreExcavators(onSnapshot, onBatch);
  return { detach };
}

export default {
  excavateNodeInMotion,
  quickListHiddenUnveil,
  attachJavaspectreExcavators,
  startExcavationCore
};
