// Two small helpers shared by the rest of the package. Not part of the public API.

/**
 * Is this a JSON object: not null, not a list?
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The length of a text in characters, counting an emoji or other character
 * beyond the basic plane as one, as JSON Schema does.
 * @param {string} text
 * @returns {number}
 */
export function lengthOf(text) {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) i++;
    }
    count++;
  }
  return count;
}

/**
 * Is the text longer than `max` characters? Quick for the usual case.
 * @param {string} text
 * @param {number} max
 * @returns {boolean}
 */
export function isLongerThan(text, max) {
  if (text.length <= max) return false;
  return text.length > max * 2 || lengthOf(text) > max;
}
