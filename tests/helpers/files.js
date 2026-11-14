import { readdirSync, readFileSync } from 'node:fs';
import { fromRoot } from './paths.js';

const examplesDir = fromRoot('examples');

/** The example profiles, as `{ name, text, profile }`. */
export const examples = readdirSync(examplesDir)
  .filter((name) => name.endsWith('.eurth.json'))
  .sort()
  .map((name) => {
    const text = readFileSync(fromRoot('examples', name), 'utf8');
    return { name, text, profile: JSON.parse(text) };
  });

/**
 * @param {string} name
 * @returns {any} A fresh copy of one example, safe to change.
 */
export function example(name) {
  const found = examples.find((entry) => entry.name === `${name}.eurth.json`);
  if (!found) throw new Error(`No example called ${name}`);
  return JSON.parse(found.text);
}

/**
 * @param {string} name A file in tests/fixtures.
 * @returns {string}
 */
export function fixtureText(name) {
  return readFileSync(fromRoot('tests', 'fixtures', name), 'utf8');
}

/**
 * Freezes a value all the way down, so a test fails if anything tries to change it.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function deepFreeze(value) {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(/** @type {any} */ (value)[key]);
  }
  return value;
}
