// Showing an SVG from a profile, safely.

import { MAX_SVG_LENGTH } from './constants.js';
import { isLongerThan } from './util.js';

const PREFIX = 'data:image/svg+xml;charset=utf-8,';

/**
 * Turns an SVG from a profile into a `data:` address for the `src` of an
 * `<img>`.
 *
 * An SVG in a profile is someone else's input and can carry scripts. Inside
 * an `<img>` the browser draws it as a picture and runs none of it, so that
 * is the only way a tool may show one. Never put a profile's SVG into the
 * page as markup: no `{@html}`, no `innerHTML`, no `<object>`, `<embed>` or
 * `<iframe>`.
 *
 * @param {unknown} svg The SVG as text, for example `getSection(profile, 'flag')?.svg`.
 * @returns {string} The address, or an empty string when there is nothing usable (not text, not an SVG, or longer than 512 KB). Check for that before you draw the `<img>`.
 */
export function svgDataUrl(svg) {
  if (typeof svg !== 'string' || svg === '' || isLongerThan(svg, MAX_SVG_LENGTH)) return '';
  if (!/<svg[\s>]/i.test(svg)) return '';
  try {
    // encodeURIComponent leaves ' ( ) as they are; encode them too, so the
    // address is safe inside any quotes and inside CSS url().
    return (
      PREFIX +
      encodeURIComponent(svg).replace(
        /['()]/g,
        (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
      )
    );
  } catch {
    // A broken character (half of a surrogate pair) cannot be encoded.
    return '';
  }
}
