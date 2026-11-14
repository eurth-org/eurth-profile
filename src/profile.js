// Making, reading, changing, merging and writing profiles. Nothing here
// touches the page, the network or any storage, and nothing changes the
// profile it is given: every change gives back a new profile.

import { FILE_EXTENSION, MAX_FILE_BYTES, SCHEMA_VERSION, SECTIONS } from './constants.js';
import { isObject } from './util.js';
import { validateProfile } from './validate.js';

/**
 * @import { EurthProfile } from '../dist/types.js'
 * @import { ProfileResult } from './validate.js'
 */

/**
 * The name of a known section.
 * @typedef {typeof SECTIONS[number]} SectionName
 */

/**
 * What a section holds: the section's own type for a known name, and any
 * JSON object for a name this version does not know.
 * @template {string} K
 * @typedef {K extends SectionName ? NonNullable<EurthProfile[K]> : Record<string, unknown>} SectionData
 */

/**
 * @typedef {object} StampOptions
 * @property {Date | string} [now] The moment to stamp as `updated`. Defaults to the present; pass one to get the same result every time, in a test for example.
 */

/**
 * @typedef {object} MergeOptions
 * @property {'newest' | 'incoming' | 'base'} [prefer] Which side wins where both have a section. `newest` (the default) goes by the section's `updated`; a section without one counts as oldest, and a tie goes to the incoming profile.
 * @property {readonly string[]} [sections] Take only these sections from the incoming profile. Without it, all of them.
 */

const NATION_MAX = 80;

/**
 * @param {Date | string | undefined} now
 * @returns {string}
 */
function stamp(now) {
  const date = now === undefined ? new Date() : now instanceof Date ? now : new Date(now);
  return date.toISOString();
}

/**
 * @param {unknown} nation
 * @returns {string}
 */
function tidyNation(nation) {
  const text = typeof nation === 'string' ? nation.replace(/\s+/g, ' ').trim() : '';
  return Array.from(text).slice(0, NATION_MAX).join('');
}

/**
 * @param {unknown} name
 * @returns {asserts name is string}
 */
function assertSectionName(name) {
  if (typeof name !== 'string' || name === '') {
    throw new TypeError('A section name should be text, for example "flag".');
  }
  if (name === 'meta') {
    throw new TypeError('"meta" is not a section a tool sets. Use setNation to change the name.');
  }
  if (name === '__proto__') {
    throw new TypeError('"__proto__" cannot be used as a section name.');
  }
}

/**
 * Starts a new profile with only `meta`. A tool that is not Wiki or Card
 * starts a profile this way and then fills in its own section.
 * @param {string} nation The nation's name. Spaces are tidied and the name is cut to 80 characters.
 * @param {StampOptions} [options]
 * @returns {EurthProfile}
 */
export function createProfile(nation, options = {}) {
  return {
    meta: { schema: SCHEMA_VERSION, nation: tidyNation(nation), updated: stamp(options.now) }
  };
}

/**
 * The size of a text in bytes once saved as UTF-8.
 * @param {string} text
 * @returns {number}
 */
function byteLength(text) {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit < 0x80) bytes += 1;
    else if (unit < 0x800) bytes += 2;
    else if (unit >= 0xd800 && unit <= 0xdbff && i + 1 < text.length) {
      bytes += 4;
      i++;
    } else bytes += 3;
  }
  return bytes;
}

/**
 * @param {string} message
 * @returns {ProfileResult}
 */
function fileError(message) {
  return { ok: false, errors: [{ path: '', message }] };
}

/**
 * Reads a profile from the text of a file. The text is someone else's input:
 * it is checked for size, read as JSON, and checked against the schema before
 * anything is given back.
 * @param {string} text
 * @returns {ProfileResult} `{ ok: true, profile }`, or `{ ok: false, errors }` with messages to show the person.
 */
export function parseProfile(text) {
  if (typeof text !== 'string') {
    return fileError('The file could not be read as text.');
  }
  if (text.length > MAX_FILE_BYTES || (text.length * 3 > MAX_FILE_BYTES && byteLength(text) > MAX_FILE_BYTES)) {
    return fileError('The file is too large. A profile is at most 2 MB.');
  }
  const json = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  if (json.trim() === '') {
    return fileError('The file is empty.');
  }
  /** @type {unknown} */
  let value;
  try {
    value = JSON.parse(json);
  } catch {
    return fileError(
      'The file is not valid JSON, so it cannot be read as a profile. It may be damaged, or it may not be a profile at all.'
    );
  }
  return validateProfile(value);
}

/**
 * Gives one section of a profile, or `undefined` when the profile does not
 * have it. Treat what you get as read-only; use `setSection` to change it.
 * @template {string} K
 * @param {EurthProfile | null | undefined} profile
 * @param {K} name
 * @returns {EurthProfile[K] | undefined}
 */
export function getSection(profile, name) {
  if (!isObject(profile) || !Object.hasOwn(profile, name)) return undefined;
  return /** @type {EurthProfile[K]} */ (profile[name]);
}

/**
 * Gives a new profile with one section replaced, and `updated` stamped on
 * that section and on `meta`. Every other key, known or not, is left exactly
 * as it was, in the same order.
 *
 * The section is replaced whole. To keep fields in your own section that this
 * version of your tool does not know, spread the old section first:
 * `setSection(profile, 'flag', { ...getSection(profile, 'flag'), svg })`.
 *
 * Write only the sections your tool owns (see `SECTION_OWNERS`).
 *
 * @template {string} K
 * @param {EurthProfile} profile
 * @param {K} name
 * @param {SectionData<K>} data
 * @param {StampOptions} [options]
 * @returns {EurthProfile}
 */
export function setSection(profile, name, data, options = {}) {
  assertSectionName(name);
  if (!isObject(data)) {
    throw new TypeError(`The "${name}" section should be an object.`);
  }
  const updated = stamp(options.now);
  return {
    ...profile,
    meta: { ...profile.meta, updated },
    [name]: { ...data, updated }
  };
}

/**
 * Gives a new profile without one section, and `updated` stamped on `meta`.
 * A profile that does not have the section comes back as it is.
 * @param {EurthProfile} profile
 * @param {string} name
 * @param {StampOptions} [options]
 * @returns {EurthProfile}
 */
export function removeSection(profile, name, options = {}) {
  assertSectionName(name);
  if (!Object.hasOwn(profile, name)) return profile;
  const { [name]: _removed, ...rest } = profile;
  return { ...rest, meta: { ...profile.meta, updated: stamp(options.now) } };
}

/**
 * Gives a new profile with the nation's name changed, and `updated` stamped
 * on `meta`.
 * @param {EurthProfile} profile
 * @param {string} nation Spaces are tidied and the name is cut to 80 characters.
 * @param {StampOptions} [options]
 * @returns {EurthProfile}
 */
export function setNation(profile, nation, options = {}) {
  return {
    ...profile,
    meta: { ...profile.meta, nation: tidyNation(nation), updated: stamp(options.now) }
  };
}

/**
 * When a section was last written, as a number to compare. A section without
 * a readable `updated` counts as older than any other.
 * @param {unknown} section
 * @returns {number}
 */
function writtenAt(section) {
  if (!isObject(section) || typeof section.updated !== 'string') return -Infinity;
  const time = Date.parse(section.updated);
  return Number.isNaN(time) ? -Infinity : time;
}

/**
 * Brings two profiles of the same nation together: the result has every
 * section of both. Where both have a section, `prefer` decides; sections this
 * version does not know follow the same rule. The nation's name is the base
 * profile's, unless that is empty, and `meta.updated` is the later of the two.
 * @param {EurthProfile} base The profile the tool already has.
 * @param {EurthProfile} incoming The profile being brought in, for example a loaded file.
 * @param {MergeOptions} [options]
 * @returns {EurthProfile}
 */
export function mergeProfiles(base, incoming, options = {}) {
  const prefer = options.prefer ?? 'newest';
  if (prefer !== 'newest' && prefer !== 'incoming' && prefer !== 'base') {
    throw new TypeError('"prefer" should be "newest", "incoming" or "base".');
  }
  const only = options.sections ? new Set(options.sections) : null;

  /** @type {Record<string, unknown>} */
  const meta = { ...base.meta };
  for (const key of Object.keys(incoming.meta)) {
    if (key !== '__proto__' && !Object.hasOwn(meta, key)) meta[key] = incoming.meta[key];
  }
  meta.schema = SCHEMA_VERSION;
  if (typeof base.meta.nation !== 'string' || base.meta.nation.trim() === '') {
    meta.nation = incoming.meta.nation;
  }
  if (writtenAt(incoming.meta) > writtenAt(base.meta)) {
    meta.updated = incoming.meta.updated;
  }

  /** @type {Record<string, unknown>} */
  const merged = { ...base, meta };
  for (const key of Object.keys(incoming)) {
    if (key === 'meta' || key === '__proto__') continue;
    if (only && !only.has(key)) continue;
    const theirs = incoming[key];
    if (!Object.hasOwn(base, key)) {
      merged[key] = theirs;
      continue;
    }
    const takeIncoming =
      prefer === 'incoming' || (prefer === 'newest' && writtenAt(theirs) >= writtenAt(base[key]));
    if (takeIncoming) merged[key] = theirs;
  }
  return /** @type {EurthProfile} */ (merged);
}

/**
 * @param {string} text
 * @returns {string}
 */
function indent(text) {
  return text.replace(/\n/g, '\n  ');
}

/**
 * Writes a profile as the text of a file: JSON with a two-space indent and a
 * final line break. `meta` comes first, then the known sections in the order
 * of `SECTIONS`, then every other key in the order it had. Saving the same
 * profile always gives the same text.
 *
 * This does not check the profile; `downloadProfile` does before it saves.
 * @param {EurthProfile} profile
 * @returns {string}
 */
export function serialiseProfile(profile) {
  /** @type {string[]} */
  const known = ['meta', ...SECTIONS];
  const keys = [
    ...known.filter((key) => Object.hasOwn(profile, key)),
    ...Object.keys(profile).filter((key) => !known.includes(key))
  ];
  // Written key by key, because JavaScript would put a key like "2026" before
  // "meta" if the whole object went through JSON.stringify at once.
  const lines = [];
  for (const key of keys) {
    const value = JSON.stringify(profile[key], null, 2);
    if (value !== undefined) lines.push(`  ${JSON.stringify(key)}: ${indent(value)}`);
  }
  return lines.length ? `{\n${lines.join(',\n')}\n}\n` : '{}\n';
}

/** Letters that do not fall apart into a plain letter and an accent. */
/** @type {Record<string, string>} */
const PLAIN_LETTERS = {
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
  ø: 'o',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ł: 'l',
  ı: 'i'
};

/** Names Windows keeps for itself, which cannot start a file name. */
const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/;

/**
 * The file name to save a profile under: the nation's name in lower case,
 * plain letters and digits, with hyphens for everything else, for example
 * `orioni.eurth.json`. A profile whose name leaves nothing usable is saved as
 * `nation.eurth.json`.
 * @param {EurthProfile | null | undefined} profile
 * @returns {string}
 */
export function profileFileName(profile) {
  const nation = isObject(profile) && isObject(profile.meta) ? profile.meta.nation : '';
  let slug = (typeof nation === 'string' ? nation : '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[ßæœøđðþłı]/g, (letter) => PLAIN_LETTERS[letter] ?? '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  if (RESERVED.test(slug)) slug = `nation-${slug}`;
  return `${slug || 'nation'}${FILE_EXTENSION}`;
}
