// Path: src/utils/SchemaEmitter.js
// Emits JSON schemas discovered during excavation.

export class SchemaEmitter {
  /**
   * Convert a set of JSON shapes into a simple schema map.
   *
   * @param {Array<object>} shapes
   * @returns {object}
   */
  static toJsonSchema(shapes = []) {
    const schema = {};
    shapes.forEach((shape) => {
      const key = shape.path;
      if (!schema[key]) {
        schema[key] = {
          type: shape.kind,
          exampleKeys: shape.keys || null,
          length: shape.length || null
        };
      }
    });
    return schema;
  }
}

export default SchemaEmitter;
