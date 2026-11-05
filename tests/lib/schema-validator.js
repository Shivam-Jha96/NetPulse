/**
 * Zero-dependency JSON Schema Draft-07 Syntax and Payload Validator.
 * Implements rigorous structural validation of schemas and conforms data payloads.
 */

export class SchemaValidator {
  /**
   * Validate that a given schema object complies with JSON Schema Draft-07 specification.
   * @param {object} schema - The schema object to validate
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateSchemaSyntax(schema) {
    const errors = [];

    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      return { valid: false, errors: ['Schema must be a non-null object'] };
    }

    // $schema draft check
    if (schema.$schema) {
      if (typeof schema.$schema !== 'string') {
        errors.push('$schema must be a string URI');
      } else if (!schema.$schema.includes('json-schema.org/draft-07/schema')) {
        errors.push(`$schema does not reference Draft-07: got "${schema.$schema}"`);
      }
    }

    // Title / description check
    if (schema.title && typeof schema.title !== 'string') {
      errors.push('title must be a string');
    }

    // Type check
    const validTypes = ['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'];
    if (schema.type) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      for (const t of types) {
        if (!validTypes.includes(t)) {
          errors.push(`Invalid type "${t}" in schema`);
        }
      }
    }

    // Required check
    if (schema.required) {
      if (!Array.isArray(schema.required)) {
        errors.push('"required" must be an array of property names');
      } else {
        for (const req of schema.required) {
          if (typeof req !== 'string') {
            errors.push(`"required" elements must be strings, got ${typeof req}`);
          }
        }
      }
    }

    // Properties check
    if (schema.properties) {
      if (typeof schema.properties !== 'object' || Array.isArray(schema.properties)) {
        errors.push('"properties" must be an object dictionary');
      } else {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          if (!propSchema || typeof propSchema !== 'object') {
            errors.push(`Property "${propName}" schema must be an object`);
          } else {
            // Recursive check
            const subResult = this.validateSchemaSyntax(propSchema);
            for (const err of subResult.errors) {
              errors.push(`In property "${propName}": ${err}`);
            }
          }
        }
      }
    }

    // Definitions / $defs check
    const defs = schema.definitions || schema.$defs;
    if (defs) {
      if (typeof defs !== 'object' || Array.isArray(defs)) {
        errors.push('"definitions" must be an object dictionary');
      } else {
        for (const [defName, defSchema] of Object.entries(defs)) {
          const subResult = this.validateSchemaSyntax(defSchema);
          for (const err of subResult.errors) {
            errors.push(`In definition "${defName}": ${err}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a mock data payload against a JSON schema.
   * @param {object} schema - The JSON schema
   * @param {any} data - The data payload to test
   * @param {string} [path=''] - Current JSON path for error reporting
   * @param {object} [rootSchema=schema] - Root schema for $ref resolution
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validatePayload(schema, data, path = '$', rootSchema = schema) {
    const errors = [];

    if (!schema) {
      return { valid: true, errors: [] };
    }

    // Handle $ref (local definitions)
    if (schema.$ref && typeof schema.$ref === 'string') {
      const resolved = this.resolveRef(schema.$ref, rootSchema);
      if (!resolved) {
        return { valid: false, errors: [`Cannot resolve reference: ${schema.$ref} at ${path}`] };
      }
      return this.validatePayload(resolved, data, path, rootSchema);
    }

    // Type validation
    if (schema.type) {
      const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
      const actualType = this.getDataType(data);

      const typeMatches = allowedTypes.some(t => {
        if (t === 'integer') return actualType === 'number' && Number.isInteger(data);
        if (t === 'number') return actualType === 'number';
        return actualType === t;
      });

      if (!typeMatches) {
        errors.push(`Expected type [${allowedTypes.join(', ')}] at ${path}, got ${actualType}`);
        return { valid: false, errors };
      }
    }

    // Enum validation
    if (schema.enum && Array.isArray(schema.enum)) {
      if (!schema.enum.includes(data)) {
        errors.push(`Value ${JSON.stringify(data)} at ${path} is not one of enum [${schema.enum.join(', ')}]`);
      }
    }

    // String constraints
    if (typeof data === 'string') {
      if (schema.minLength !== undefined && data.length < schema.minLength) {
        errors.push(`String length ${data.length} is less than minLength ${schema.minLength} at ${path}`);
      }
      if (schema.maxLength !== undefined && data.length > schema.maxLength) {
        errors.push(`String length ${data.length} exceeds maxLength ${schema.maxLength} at ${path}`);
      }
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push(`Value "${data}" at ${path} does not match pattern ${schema.pattern}`);
        }
      }
      if (schema.format) {
        const formatValid = this.validateFormat(schema.format, data);
        if (!formatValid) {
          errors.push(`Value "${data}" at ${path} does not match format "${schema.format}"`);
        }
      }
    }

    // Number constraints
    if (typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push(`Number ${data} is less than minimum ${schema.minimum} at ${path}`);
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push(`Number ${data} exceeds maximum ${schema.maximum} at ${path}`);
      }
    }

    // Array constraints
    if (Array.isArray(data)) {
      if (schema.minItems !== undefined && data.length < schema.minItems) {
        errors.push(`Array has ${data.length} items, less than minItems ${schema.minItems} at ${path}`);
      }
      if (schema.maxItems !== undefined && data.length > schema.maxItems) {
        errors.push(`Array has ${data.length} items, exceeds maxItems ${schema.maxItems} at ${path}`);
      }
      if (schema.items) {
        for (let i = 0; i < data.length; i++) {
          const itemRes = this.validatePayload(schema.items, data[i], `${path}[${i}]`, rootSchema);
          errors.push(...itemRes.errors);
        }
      }
    }

    // Object constraints
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      // Required fields
      if (schema.required && Array.isArray(schema.required)) {
        for (const req of schema.required) {
          if (!(req in data) || data[req] === undefined) {
            errors.push(`Missing required property "${req}" at ${path}`);
          }
        }
      }

      // Property validation
      if (schema.properties) {
        for (const [propKey, propVal] of Object.entries(data)) {
          if (schema.properties[propKey]) {
            const propRes = this.validatePayload(schema.properties[propKey], propVal, `${path}.${propKey}`, rootSchema);
            errors.push(...propRes.errors);
          } else if (schema.additionalProperties === false) {
            errors.push(`Additional property "${propKey}" not permitted at ${path}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static getDataType(val) {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
  }

  static resolveRef(ref, rootSchema) {
    if (!ref.startsWith('#/')) return null;
    const parts = ref.substring(2).split('/');
    let current = rootSchema;
    for (const part of parts) {
      if (!current || typeof current !== 'object') return null;
      current = current[part];
    }
    return current;
  }

  static validateFormat(format, val) {
    switch (format) {
      case 'ipv4':
        return /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/.test(val);
      case 'ipv6':
        return /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:){1,7}:|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}/.test(val);
      case 'date-time':
        return !isNaN(Date.parse(val));
      case 'uri':
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      default:
        return true;
    }
  }
}
