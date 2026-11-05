import fs from 'node:fs';
import path from 'node:path';
import { SchemaValidator } from './schema-validator.js';

export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export const Assert = {
  ok(condition, message = 'Condition is not truthy') {
    if (!condition) {
      throw new AssertionError(message, condition, true);
    }
  },

  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new AssertionError(
        message || `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`,
        actual,
        expected
      );
    }
  },

  notEqual(actual, expected, message) {
    if (actual === expected) {
      throw new AssertionError(
        message || `Expected ${JSON.stringify(actual)} not to equal ${JSON.stringify(expected)}`,
        actual,
        expected
      );
    }
  },

  deepEqual(actual, expected, message) {
    const actStr = JSON.stringify(actual);
    const expStr = JSON.stringify(expected);
    if (actStr !== expStr) {
      throw new AssertionError(
        message || `Deep equality mismatch:\nActual:   ${actStr}\nExpected: ${expStr}`,
        actual,
        expected
      );
    }
  },

  includes(haystack, needle, message) {
    if (!haystack || (typeof haystack.includes === 'function' && !haystack.includes(needle))) {
      throw new AssertionError(
        message || `Expected collection/string to include ${JSON.stringify(needle)}`,
        haystack,
        needle
      );
    }
  },

  match(str, regex, message) {
    if (typeof str !== 'string' || !regex.test(str)) {
      throw new AssertionError(
        message || `Expected string "${str?.slice?.(0, 100)}" to match pattern ${regex}`,
        str,
        regex.toString()
      );
    }
  },

  fileExists(filePath, message) {
    if (!fs.existsSync(filePath)) {
      throw new AssertionError(
        message || `File does not exist: ${filePath}`,
        false,
        true
      );
    }
  },

  fileNotEmpty(filePath, minBytes = 1, message) {
    this.fileExists(filePath, message);
    const stats = fs.statSync(filePath);
    if (stats.size < minBytes) {
      throw new AssertionError(
        message || `File ${filePath} is smaller than ${minBytes} bytes (actual: ${stats.size})`,
        stats.size,
        minBytes
      );
    }
  },

  validJson(rawString, message) {
    try {
      return JSON.parse(rawString);
    } catch (err) {
      throw new AssertionError(
        message || `Failed to parse JSON: ${err.message}`,
        rawString.slice(0, 100),
        'valid JSON string'
      );
    }
  },

  draft07Schema(schemaObj, message) {
    const res = SchemaValidator.validateSchemaSyntax(schemaObj);
    if (!res.valid) {
      throw new AssertionError(
        message || `JSON Schema does not conform to Draft-07:\n - ${res.errors.join('\n - ')}`,
        res.errors,
        []
      );
    }
  },

  schemaConforms(schemaObj, payload, message) {
    const res = SchemaValidator.validatePayload(schemaObj, payload);
    if (!res.valid) {
      throw new AssertionError(
        message || `Payload does not conform to schema:\n - ${res.errors.join('\n - ')}`,
        res.errors,
        []
      );
    }
  },

  noErrors(errors, contextMessage = 'Encountered unexpected errors') {
    if (errors && errors.length > 0) {
      throw new AssertionError(
        `${contextMessage}:\n - ${errors.join('\n - ')}`,
        errors,
        []
      );
    }
  }
};
