import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The root of the repository. */
export const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * A path inside the repository. Plain paths, not URL objects: under jsdom the
 * global URL is jsdom's own, which Node's file functions do not take.
 * @param {...string} parts
 * @returns {string}
 */
export function fromRoot(...parts) {
  return join(root, ...parts);
}
