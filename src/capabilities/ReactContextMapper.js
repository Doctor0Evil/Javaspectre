// Path: src/capabilities/ReactContextMapper.js

/**
 * ReactContextMapper
 * Discovers React Context virtual-objects and their dependency links
 * inside arbitrary introspection snapshots (e.g., dependencies.firstContext).
 */

class ReactContextMapper {
  constructor(options = {}) {
    this.maxDepth = typeof options.maxDepth === "number" ? options.maxDepth : 6;
  }

  /**
   * Entry point: map any unknown value to context descriptors and links.
   *
   * @param {any} root - unknown JS value (e.g., dependencies object)
   * @returns {{contexts: Array, links: Array, summary: object}}
   */
  map(root) {
    const contexts = [];
    const links = [];
    const visited = new WeakSet();

    this._walk(root, "root", 0, visited, contexts, links);

    return {
      contexts,
      links,
      summary: this._buildSummary(contexts, links)
    };
  }

  // -----------------------
  // Walking & detection
  // -----------------------

  _walk(node, path, depth, visited, contexts, links) {
    if (depth > this.maxDepth) return;
    if (!node || typeof node !== "object") return;
    if (visited.has(node)) return;
    visited.add(node);

    // Detect React Context
    if (this._looksLikeReactContext(node)) {
      const descriptor = this._buildContextDescriptor(node, path);
      contexts.push(descriptor);
    }

    // Detect hook-like dependency nodes that reference a context
    if (this._looksLikeDependencyNode(node)) {
      const link = this._buildDependencyLink(node, path);
      if (link) links.push(link);
    }

    // Recurse into properties
    Object.keys(node).forEach((key) => {
      const value = node[key];
      const childPath = `${path}.${key}`;
      if (value && typeof value === "object") {
        this._walk(value, childPath, depth + 1, visited, contexts, links);
      }
    });
  }

  _looksLikeReactContext(obj) {
    // Heuristic: has $$typeof with description containing "react.context"
    const token = obj.$$typeof;
    if (!token) return false;

    const desc =
      typeof token === "symbol" && typeof token.description === "string"
        ? token.description
        : String(token);

    if (!desc.includes("react.context")) return false;

    // Basic fields that React Context usually has
    return (
      "Provider" in obj &&
      "_currentValue" in obj &&
      "_defaultValue" in obj &&
      "_threadCount" in obj
    );
  }

  _looksLikeDependencyNode(obj) {
    // Heuristic for a dependency/hook node containing a context reference
    if ("context" in obj && obj.context && typeof obj.context === "object") {
      if (this._looksLikeReactContext(obj.context)) {
        return true;
      }
    }
    if ("firstContext" in obj && obj.firstContext && typeof obj.firstContext === "object") {
      if (this._looksLikeReactContext(obj.firstContext.context || obj.firstContext)) {
        return true;
      }
    }
    return false;
  }

  // -----------------------
  // Builders
  // -----------------------

  _buildContextDescriptor(ctx, path) {
    const id = this._inferContextId(ctx, path);
    const providerDesc = this._describeProvider(ctx.Provider);
    const consumerDesc = this._describeConsumer(ctx.Consumer);

    return {
      id,
      kind: "ReactContextDescriptor",
      inspectPath: path,
      globalName: ctx._globalName || null,
      defaultValue: this._safeSample(ctx._defaultValue),
      currentValue: this._safeSample(ctx._currentValue),
      currentValue2: this._safeSample(ctx._currentValue2),
      threadCount: typeof ctx._threadCount === "number" ? ctx._threadCount : null,
      provider: providerDesc,
      consumer: consumerDesc
    };
  }

  _buildDependencyLink(node, path) {
    const contextNode =
      node.context ||
      (node.firstContext && node.firstContext.context) ||
      node.firstContext ||
      null;

    if (!contextNode || !this._looksLikeReactContext(contextNode)) {
      return null;
    }

    const contextId = this._inferContextId(contextNode, `${path}.context`);
    const memoizedValue =
      "memoizedValue" in node ? this._safeSample(node.memoizedValue) : undefined;

    return {
      kind: "ContextDependencyLink",
      hookPath: path,
      contextId,
      memoizedValue,
      hasNext: !!node.next
    };
  }

  _inferContextId(ctx, path) {
    if (ctx._globalName) return `ReactContext:${ctx._globalName}`;
    if (ctx.displayName) return `ReactContext:${ctx.displayName}`;
    return `ReactContext@${path}`;
  }

  _describeProvider(provider) {
    if (!provider || typeof provider !== "object") return null;
    const token = provider.$$typeof;
    const desc =
      typeof token === "symbol" && typeof token.description === "string"
        ? token.description
        : token
        ? String(token)
        : null;

    return {
      $$typeof: desc,
      hasContext: !!provider._context
    };
  }

  _describeConsumer(consumer) {
    if (!consumer || typeof consumer !== "object") return null;
    const token = consumer.$$typeof;
    const desc =
      typeof token === "symbol" && typeof token.description === "string"
        ? token.description
        : token
        ? String(token)
        : null;

    return {
      $$typeof: desc
    };
  }

  _safeSample(value) {
    if (value === null || value === undefined) return value;
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean") return value;
    if (Array.isArray(value)) {
      return { kind: "array", length: value.length };
    }
    return { kind: t, summary: Object.keys(value).slice(0, 5) };
  }

  _buildSummary(contexts, links) {
    return {
      contextCount: contexts.length,
      dependencyLinkCount: links.length,
      notes: [
        "ReactContextDescriptor virtual-objects can be merged with other excavation outputs to map live dependency graphs.",
        "ContextDependencyLink edges show where hooks depend on specific contexts; useful for debugging and visualization."
      ]
    };
  }
}

export default ReactContextMapper;
