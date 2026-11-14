// @eurth/profile: the Eurth nation profile.
//
// One small JSON file, <nation>.eurth.json, carries a nation from one Eurth
// worldbuilding tool to the next. This package reads, checks, changes, merges,
// saves and loads that file. See README.md.

export {
  FILE_EXTENSION,
  MAX_DEPTH,
  MAX_FILE_BYTES,
  MAX_SVG_LENGTH,
  SCHEMA_VERSION,
  SECTIONS,
  SECTION_OWNERS
} from './constants.js';
export { validateProfile } from './validate.js';
export {
  createProfile,
  getSection,
  mergeProfiles,
  parseProfile,
  profileFileName,
  removeSection,
  serialiseProfile,
  setNation,
  setSection
} from './profile.js';
export { svgDataUrl } from './svg.js';
export { downloadProfile, pickProfile, profileDrop, readProfileFile } from './dom.js';

/**
 * @typedef {import('../dist/types.js').EurthProfile} EurthProfile
 * @typedef {import('../dist/types.js').Meta} Meta
 * @typedef {import('../dist/types.js').Identity} Identity
 * @typedef {import('../dist/types.js').Flag} Flag
 * @typedef {import('../dist/types.js').Arms} Arms
 * @typedef {import('../dist/types.js').Government} Government
 * @typedef {import('../dist/types.js').Seats} Seats
 * @typedef {import('../dist/types.js').Names} Names
 * @typedef {import('../dist/types.js').Stats} Stats
 * @typedef {import('../dist/types.js').Dynasty} Dynasty
 * @typedef {import('../dist/types.js').Calendar} Calendar
 * @typedef {import('../dist/types.js').Timeline} Timeline
 * @typedef {import('../dist/types.js').Bank} Bank
 * @typedef {import('../dist/types.js').Passport} Passport
 * @typedef {import('../dist/types.js').Rank} Rank
 * @typedef {import('../dist/types.js').Cities} Cities
 * @typedef {import('../dist/types.js').Anthem} Anthem
 * @typedef {import('../dist/types.js').Wiki} Wiki
 * @typedef {import('./validate.js').ProfileError} ProfileError
 * @typedef {import('./validate.js').ProfileResult} ProfileResult
 * @typedef {import('./profile.js').SectionName} SectionName
 * @typedef {import('./profile.js').StampOptions} StampOptions
 * @typedef {import('./profile.js').MergeOptions} MergeOptions
 * @typedef {import('./dom.js').ProfileDropHandlers} ProfileDropHandlers
 */

/**
 * @template {string} K
 * @typedef {import('./profile.js').SectionData<K>} SectionData
 */
