// Ajv, for the tests only. The tools cannot run it (their content security
// policy has no unsafe-eval), so the package has its own checker; here Ajv is
// the second opinion that the checker reads the schema the same way.

import { readFileSync } from 'node:fs';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import { fromRoot } from './paths.js';

const addFormats = /** @type {any} */ (addFormatsModule).default ?? addFormatsModule;

export const schemaPath = fromRoot('schema', 'eurth-profile.schema.json');
export const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

const ajv = new Ajv2020({ strict: true, allErrors: false });
addFormats(ajv);

const compiled = ajv.compile(schema);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function ajvAccepts(value) {
  return compiled(value) === true;
}
