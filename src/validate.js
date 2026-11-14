// A small JSON Schema checker for the Eurth profile.
//
// The tools run under a strict content security policy (script-src 'self', no
// unsafe-eval), and Ajv builds its validators with `new Function`, so Ajv
// cannot run there. This file reads the schema itself and checks a value
// against it, for the keywords the schema uses and no others. The schema
// stays the single source: nothing about sections or fields is written here.
// The tests check this file against Ajv, so the two always agree.

import schema from '../dist/schema.js';
import { MAX_DEPTH, SCHEMA_VERSION } from './constants.js';
import { isLongerThan, isObject, lengthOf } from './util.js';

/**
 * @import { EurthProfile } from '../dist/types.js'
 */

/**
 * One problem with a profile.
 * @typedef {object} ProfileError
 * @property {string} path Where the problem is, for example `identity.capital` or `cities.list[3].name`. Empty for a problem with the file as a whole.
 * @property {string} message A full sentence for the person, in plain words.
 */

/**
 * What checking or reading a profile gives back.
 * @typedef {{ ok: true, profile: EurthProfile } | { ok: false, errors: ProfileError[] }} ProfileResult
 */

/** @typedef {{ readonly [keyword: string]: any }} SchemaNode */

/** The keywords this checker enforces. A test fails if the schema uses any other. */
export const SUPPORTED_KEYWORDS = Object.freeze([
  '$ref',
  'type',
  'properties',
  'required',
  'additionalProperties',
  'items',
  'enum',
  'const',
  'minLength',
  'maxLength',
  'pattern',
  'format',
  'minItems',
  'maxItems',
  'minimum',
  'maximum'
]);

/** Keywords that describe the schema and check nothing. */
export const ANNOTATION_KEYWORDS = Object.freeze([
  '$schema',
  '$id',
  '$defs',
  'title',
  'description',
  'examples'
]);

/** The values of `format` this checker enforces. */
export const SUPPORTED_FORMATS = Object.freeze(['date-time']);

/** After this many problems the checker stops listing them. */
const MAX_ERRORS = 20;

const numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 6 });

/** @type {Map<string, RegExp>} */
const patterns = new Map();

/**
 * @param {string} pattern
 * @returns {RegExp}
 */
function regexFor(pattern) {
  let regex = patterns.get(pattern);
  if (!regex) {
    regex = new RegExp(pattern, 'u');
    patterns.set(pattern, regex);
  }
  return regex;
}

const DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Is this an ISO 8601 date and time with a time zone, on a day that exists?
 * @param {string} text
 * @returns {boolean}
 */
function isDateTime(text) {
  const match = DATE_TIME.exec(text);
  if (!match) return false;
  const [year, month, day, hour, minute, second, zoneHour, zoneMinute] = match
    .slice(1)
    .map((part) => (part === undefined ? 0 : Number(part)));
  if (year === undefined || month === undefined || day === undefined) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = month === 2 && leap ? 29 : (DAYS_IN_MONTH[month - 1] ?? 0);
  if (day > days) return false;
  return (
    (hour ?? 0) <= 23 &&
    (minute ?? 0) <= 59 &&
    (second ?? 0) <= 59 &&
    (zoneHour ?? 0) <= 23 &&
    (zoneMinute ?? 0) <= 59
  );
}

/**
 * @param {string} type
 * @param {unknown} value
 * @returns {boolean}
 */
function hasType(type, value) {
  switch (type) {
    case 'object':
      return isObject(value);
    case 'array':
      return Array.isArray(value);
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    default:
      throw new Error(`The schema uses a type this checker does not know: ${type}`);
  }
}

/**
 * Does the value itself fit this part of the schema? Says nothing about what
 * is inside an object or a list; `check` looks there next.
 * @param {SchemaNode} node
 * @param {unknown} value
 * @returns {boolean}
 */
function fits(node, value) {
  if (typeof node.type === 'string' && !hasType(node.type, value)) return false;
  if ('const' in node && value !== node.const) return false;
  if (Array.isArray(node.enum) && !node.enum.includes(value)) return false;

  if (typeof value === 'string') {
    const { minLength, maxLength } = node;
    if (typeof maxLength === 'number' && isLongerThan(value, maxLength)) return false;
    if (typeof minLength === 'number' && lengthOf(value) < minLength) return false;
    if (typeof node.pattern === 'string' && !regexFor(node.pattern).test(value)) return false;
    if (typeof node.format === 'string') {
      if (node.format !== 'date-time') {
        throw new Error(`The schema uses a format this checker does not know: ${node.format}`);
      }
      if (!isDateTime(value)) return false;
    }
  }

  if (typeof value === 'number') {
    if (typeof node.minimum === 'number' && value < node.minimum) return false;
    if (typeof node.maximum === 'number' && value > node.maximum) return false;
  }

  if (Array.isArray(value)) {
    if (typeof node.minItems === 'number' && value.length < node.minItems) return false;
    if (typeof node.maxItems === 'number' && value.length > node.maxItems) return false;
  }

  return true;
}

/**
 * @param {number | undefined} min
 * @param {number | undefined} max
 * @param {string} unit For example "characters" or "items". Empty for plain numbers.
 * @returns {string}
 */
function range(min, max, unit) {
  const tail = unit ? ` ${unit}` : '';
  const low = typeof min === 'number' ? numberFormat.format(min) : undefined;
  const high = typeof max === 'number' ? numberFormat.format(max) : undefined;
  if (low !== undefined && high !== undefined) {
    return unit ? ` of ${low} to ${high}${tail}` : ` between ${low} and ${high}`;
  }
  if (high !== undefined) return ` of at most ${high}${tail}`;
  if (low !== undefined) return ` of at least ${low}${tail}`;
  return '';
}

/**
 * What this part of the schema asks for, in plain words: "text of at most 80
 * characters", "a whole number between 1 and 10,000".
 * @param {SchemaNode} node
 * @returns {string}
 */
function describe(node) {
  if ('const' in node) return JSON.stringify(node.const);
  if (Array.isArray(node.enum)) {
    const options = node.enum.map((/** @type {unknown} */ option) => JSON.stringify(option));
    const last = options.pop();
    return options.length ? `${options.join(', ')} or ${last}` : String(last);
  }
  const example = Array.isArray(node.examples) ? JSON.stringify(node.examples[0]) : undefined;
  switch (node.type) {
    case 'string': {
      const length = range(node.minLength, node.maxLength, 'characters');
      if (node.format === 'date-time') {
        return `a date and time${example ? ` such as ${example}` : ''}`;
      }
      if (typeof node.pattern === 'string') {
        return `${example ? `text like ${example}` : 'text in the expected form'}${length}`;
      }
      return `text${length}`;
    }
    case 'integer':
      return `a whole number${range(node.minimum, node.maximum, '')}`;
    case 'number':
      return `a number${range(node.minimum, node.maximum, '')}`;
    case 'boolean':
      return 'true or false';
    case 'array':
      return `a list${range(node.minItems, node.maxItems, 'items')}`;
    case 'object':
      return 'a JSON object';
    case 'null':
      return 'empty (null)';
    default:
      return 'a different kind of value';
  }
}

/**
 * @param {string} reference
 * @returns {SchemaNode}
 */
function resolve(reference) {
  const prefix = '#/$defs/';
  const name = reference.startsWith(prefix) ? reference.slice(prefix.length) : '';
  const defs = /** @type {Record<string, SchemaNode>} */ (schema.$defs);
  if (!name || !Object.hasOwn(defs, name)) {
    throw new Error(`The schema points to a definition that is not there: ${reference}`);
  }
  return /** @type {SchemaNode} */ (defs[name]);
}

/**
 * @param {string} path
 * @param {string} key
 * @returns {string}
 */
function join(path, key) {
  return path ? `${path}.${key}` : key;
}

/**
 * @param {SchemaNode} node
 * @param {unknown} value
 * @param {string} path
 * @param {ProfileError[]} errors
 * @returns {void}
 */
function check(node, value, path, errors) {
  if (errors.length >= MAX_ERRORS) return;

  if (typeof node.$ref === 'string') {
    const before = errors.length;
    check(resolve(node.$ref), value, path, errors);
    if (errors.length > before) return;
  }

  if (!fits(node, value)) {
    errors.push({ path, message: `${path || 'The profile'} should be ${describe(node)}.` });
    return;
  }

  if (isObject(value)) {
    if (Array.isArray(node.required)) {
      for (const key of node.required) {
        if (!Object.hasOwn(value, key)) {
          const missing = join(path, key);
          errors.push({ path: missing, message: `${missing} is missing.` });
        }
      }
    }
    if (isObject(node.properties)) {
      // Only the keys the schema names are checked. Every other key is kept
      // as it is (additionalProperties is true everywhere).
      for (const key of Object.keys(node.properties)) {
        if (Object.hasOwn(value, key)) {
          check(/** @type {SchemaNode} */ (node.properties[key]), value[key], join(path, key), errors);
        }
      }
    }
  }

  if (Array.isArray(value) && isObject(node.items)) {
    for (let i = 0; i < value.length; i++) {
      check(node.items, value[i], `${path}[${i}]`, errors);
    }
  }
}

/**
 * Checks a value against the profile schema and nothing else. Most code wants
 * `validateProfile`, which also guards against hostile input.
 * @param {unknown} value
 * @returns {ProfileError[]} The problems found; empty when the value fits the schema.
 */
export function validateSchema(value) {
  /** @type {ProfileError[]} */
  const errors = [];
  check(schema, value, '', errors);
  if (errors.length >= MAX_ERRORS) {
    errors.length = MAX_ERRORS;
    errors.push({
      path: '',
      message: `There are more problems; these are the first ${MAX_ERRORS}.`
    });
  }
  return errors;
}

/**
 * Looks through every value in the file, known or not, for two things no
 * honest profile has: nesting far deeper than any tool needs, and a key named
 * `__proto__`, which could change how objects behave in a tool that copies it
 * carelessly.
 * @param {unknown} root
 * @returns {ProfileError | null}
 */
function scan(root) {
  /** @type {[unknown, number][]} */
  const stack = [[root, 0]];
  while (stack.length) {
    const [value, depth] = /** @type {[unknown, number]} */ (stack.pop());
    if (typeof value !== 'object' || value === null) continue;
    if (depth >= MAX_DEPTH) {
      return {
        path: '',
        message: `The profile is nested too deeply. A profile goes at most ${MAX_DEPTH} levels deep.`
      };
    }
    if (Array.isArray(value)) {
      for (const item of value) stack.push([item, depth + 1]);
      continue;
    }
    if (Object.hasOwn(value, '__proto__')) {
      return {
        path: '',
        message: 'The profile has a key named "__proto__", which Eurth tools do not accept.'
      };
    }
    for (const key of Object.keys(value)) {
      stack.push([/** @type {Record<string, unknown>} */ (value)[key], depth + 1]);
    }
  }
  return null;
}

/**
 * Checks that a value is a profile this package can work with. Treat every
 * loaded file as someone else's input and pass it through here (`parseProfile`
 * does) before using it.
 *
 * Known keys are checked strictly; keys this version does not know are left
 * alone, so that a file from a newer tool still loads.
 *
 * @param {unknown} value
 * @returns {ProfileResult} `{ ok: true, profile }` with the same object, or `{ ok: false, errors }`.
 */
export function validateProfile(value) {
  if (!isObject(value)) {
    return {
      ok: false,
      errors: [{ path: '', message: 'The profile should be a JSON object with a "meta" section.' }]
    };
  }

  const hostile = scan(value);
  if (hostile) return { ok: false, errors: [hostile] };

  const meta = value.meta;
  if (isObject(meta) && typeof meta.schema === 'number' && meta.schema > SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [
        {
          path: 'meta.schema',
          message: `This profile uses a newer format (schema ${numberFormat.format(meta.schema)}) than this tool understands (schema ${SCHEMA_VERSION}). Please update the tool, or reload the page to get its latest version, then try again.`
        }
      ]
    };
  }

  const errors = validateSchema(value);
  if (errors.length) return { ok: false, errors };
  return { ok: true, profile: /** @type {EurthProfile} */ (value) };
}
