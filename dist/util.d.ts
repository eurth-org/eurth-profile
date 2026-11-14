/**
 * Is this a JSON object: not null, not a list?
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export function isObject(value: unknown): value is Record<string, unknown>;
/**
 * The length of a text in characters, counting an emoji or other character
 * beyond the basic plane as one, as JSON Schema does.
 * @param {string} text
 * @returns {number}
 */
export function lengthOf(text: string): number;
/**
 * Is the text longer than `max` characters? Quick for the usual case.
 * @param {string} text
 * @param {number} max
 * @returns {boolean}
 */
export function isLongerThan(text: string, max: number): boolean;
