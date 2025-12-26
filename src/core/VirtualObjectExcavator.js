// Path: src/core/VirtualObjectExcavator.js
// Description:
// A spectral-grade module for deep virtual-object excavation.
// It inspects unknown objects and DOM trees, infers virtual-object
// definitions, and emits reusable, expanded metadata suitable for
// higher-level APIs and deeper introspection.

export class VirtualObjectExcavator {
  constructor(options = {}) {
    this.maxDepth = typeof options.maxDepth === 'number' ? options.maxDepth : 6;
    this.maxArraySample = typeof options.maxArraySample === 'number' ? options.maxArraySample : 10;
    this.includeDom = options.includeDom !== false;
    this.includeFunctions = options.includeFunctions || false;
  }

  /**
   * Entry point: excavate both a JS value and optionally a DOM root.
   * @param {object} params
   * @param {any} params.value - Unknown JS value (object/array/primitive).
   * @param {HTMLElement|Document|null} [params.domRoot] - DOM root (e.g., document).
   * @returns {object} excavationResult
   */
  excavate({ value, domRoot = null }) {
    const virtualObjects = [];
    const relationships = [];
    const domSheets = [];

    const visited = new WeakSet();

    const rootId = 'root';
    const valueDef = this.#inspectValue(value, rootId, 0, visited, virtualObjects, relationships);

    if (this.includeDom && domRoot && typeof domRoot.querySelectorAll === 'function') {
      const domResult = this.#inspectDom(domRoot);
      domSheets.push(...domResult.domSheets);
      virtualObjects.push(...domResult.virtualObjects);
      relationships.push(...domResult.relationships);
    }

    return {
      root: valueDef,
      virtualObjects,
      relationships,
      domSheets,
      summary: this.#buildSummary(virtualObjects, relationships, domSheets)
    };
  }

  // -----------------------
  // Value Introspection
  // -----------------------

  #inspectValue(value, id, depth, visited, virtualObjects, relationships) {
    if (depth > this.maxDepth) {
      return {
        id,
        kind: 'depth-limit',
        note: 'Max depth reached; further excavation truncated.'
      };
    }

    const type = this.#getType(value);

    if (type === 'null' || type === 'undefined' || type === 'primitive') {
      return this.#primitiveDef(id, value);
    }

    if (type === 'array') {
      return this.#arrayDef(value, id, depth, visited, virtualObjects, relationships);
    }

    if (type === 'function') {
      if (!this.includeFunctions) {
        return {
          id,
          kind: 'function',
          name: value.name || null,
          note: 'Function encountered; functions disabled in excavation options.'
        };
      }
      return {
        id,
        kind: 'function',
        name: value.name || null,
        arity: value.length,
        note: 'Function captured as virtual-object descriptor.'
      };
    }

    if (type === 'object') {
      if (visited.has(value)) {
        return {
          id,
          kind: 'cycle',
          note: 'Cyclic reference encountered; reference recorded only.'
        };
      }
      visited.add(value);
      return this.#objectDef(value, id, depth, visited, virtualObjects, relationships);
    }

    return {
      id,
      kind: 'unknown',
      note: 'Unrecognized value type.'
    };
  }

  #getType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    const t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint' || t === 'symbol') {
      return 'primitive';
    }
    if (Array.isArray(value)) return 'array';
    if (t === 'function') return 'function';
    if (t === 'object') return 'object';
    return 'unknown';
  }

  #primitiveDef(id, value) {
    return {
      id,
      kind: 'primitive',
      valueType: value === null ? 'null' : typeof value,
      example: value
    };
  }

  #arrayDef(arr, id, depth, visited, virtualObjects, relationships) {
    const sampleSize = Math.min(this.maxArraySample, arr.length);
    const samples = arr.slice(0, sampleSize);
    const elementDefs = [];
    const elementTypes = new Set();

    samples.forEach((item, index) => {
      const elementId = `${id}[${index}]`;
      const def = this.#inspectValue(item, elementId, depth + 1, visited, virtualObjects, relationships);
      elementDefs.push(def);
      elementTypes.add(def.kind);
    });

    const arrayDef = {
      id,
      kind: 'array',
      length: arr.length,
      sampled: sampleSize,
      elementKinds: Array.from(elementTypes),
      elementSamples: elementDefs
    };

    virtualObjects.push({
      id,
      category: 'collection',
      signature: `Array<${Array.from(elementTypes).join('|')}>`,
      meta: {
        sampled: sampleSize,
        total: arr.length
      }
    });

    return arrayDef;
  }

  #objectDef(obj, id, depth, visited, virtualObjects, relationships) {
    const ctorName = obj.constructor && obj.constructor.name ? obj.constructor.name : 'Object';
    const fields = {};
    const fieldDescriptions = {};

    Object.keys(obj).forEach((key) => {
      const fieldId = `${id}.${key}`;
      const value = obj[key];
      const childDef = this.#inspectValue(value, fieldId, depth + 1, visited, virtualObjects, relationships);
      fields[key] = childDef;

      fieldDescriptions[key] = {
        kind: childDef.kind,
        valueType: childDef.valueType || null,
        example: childDef.example !== undefined ? childDef.example : undefined,
        note: childDef.note || null
      };

      relationships.push({
        from: id,
        to: childDef.id,
        relation: 'field',
        field: key
      });
    });

    const objDef = {
      id,
      kind: 'object',
      ctor: ctorName,
      fields
    };

    virtualObjects.push({
      id,
      category: 'struct',
      signature: `${ctorName}{...}`,
      fields: fieldDescriptions
    });

    return objDef;
  }

  // -----------------------
  // DOM Introspection
  // -----------------------

  #inspectDom(domRoot) {
    const virtualObjects = [];
    const relationships = [];
    const domSheets = [];

    const all = Array.from(domRoot.querySelectorAll('*'));
    const byTag = new Map();
    const byClass = new Map();

    all.forEach((el) => {
      const tag = el.tagName.toLowerCase();
      const classList = Array.from(el.classList || []);

      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag).push(el);

      classList.forEach((cls) => {
        const key = `.${cls}`;
        if (!byClass.has(key)) byClass.set(key, []);
        byClass.get(key).push(el);
      });
    });

    const domSheet = {
      tagSummaries: [],
      classSummaries: [],
      totalNodes: all.length
    };

    byTag.forEach((elements, tag) => {
      const selector = tag;
      const sample = elements[0] || null;
      const id = `dom:${selector}`;
      const attrs = sample ? this.#extractAttributes(sample) : {};

      domSheet.tagSummaries.push({
        selector,
        count: elements.length,
        attributesExample: attrs
      });

      virtualObjects.push({
        id,
        category: 'dom-tag',
        selector,
        count: elements.length,
        attributesExample: attrs
      });
    });

    byClass.forEach((elements, clsSelector) => {
      const selector = clsSelector;
      const sample = elements[0] || null;
      const id = `dom:${selector}`;
      const attrs = sample ? this.#extractAttributes(sample) : {};

      domSheet.classSummaries.push({
        selector,
        count: elements.length,
        attributesExample: attrs
      });

      virtualObjects.push({
        id,
        category: 'dom-class',
        selector,
        count: elements.length,
        attributesExample: attrs
      });
    });

    domSheets.push(domSheet);

    relationships.push({
      from: 'dom-root',
      to: 'dom-sheet-0',
      relation: 'summarizes'
    });

    return { virtualObjects, relationships, domSheets };
  }

  #extractAttributes(el) {
    const attrs = {};
    if (!el || !el.attributes) return attrs;
    Array.from(el.attributes).forEach((attr) => {
      attrs[attr.name] = attr.value;
    });
    return attrs;
  }

  // -----------------------
  // Summary / API Definition
  // -----------------------

  #buildSummary(virtualObjects, relationships, domSheets) {
    const byCategory = {};
    virtualObjects.forEach((vo) => {
      const cat = vo.category || 'unknown';
      if (!byCategory[cat]) byCategory[cat] = 0;
      byCategory[cat] += 1;
    });

    return {
      counts: {
        virtualObjects: virtualObjects.length,
        relationships: relationships.length,
        domSheets: domSheets.length
      },
      byCategory,
      hint: 'Use virtualObjects and relationships to design higher-level APIs and type definitions.'
    };
  }

  /**
   * Generate a simple JS type sketch (not actual TS) for a given struct virtual-object.
   * This is an example of turning excavation into developer-facing definitions.
   */
  generateTypeSketch(structId, excavationResult) {
    const vo = excavationResult.virtualObjects.find((v) => v.id === structId && v.category === 'struct');
    if (!vo) {
      return `// No struct virtual-object found with id "${structId}".`;
    }

    const lines = [];
    const name = structId.replace(/[^a-zA-Z0-9_]/g, '_') || 'VirtualObject';
    lines.push(`// Auto-generated sketch for virtual-object: ${structId}`);
    lines.push(`export class ${name} {`);

    Object.entries(vo.fields || {}).forEach(([fieldName, info]) => {
      const typeGuess = info.valueType || info.kind || 'any';
      lines.push(`  /**`);
      lines.push(`   * kind: ${info.kind || 'unknown'}`);
      if (info.note) lines.push(`   * note: ${info.note}`);
      if (info.example !== undefined) {
        const ex = typeof info.example === 'string' ? `"${info.example}"` : JSON.stringify(info.example);
        lines.push(`   * example: ${ex}`);
      }
      lines.push(`   */`);
      lines.push(`  ${fieldName}; // ${typeGuess}`);
      lines.push('');
    });

    lines.push('  constructor(init = {}) {');
    Object.keys(vo.fields || {}).forEach((fieldName) => {
      lines.push(`    this.${fieldName} = init.${fieldName};`);
    });
    lines.push('  }');

    lines.push('}');
    return lines.join('\n');
  }
}

export default VirtualObjectExcavator;
