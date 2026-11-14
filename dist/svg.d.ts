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
export function svgDataUrl(svg: unknown): string;
