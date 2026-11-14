/**
 * Starts a new profile with only `meta`. A tool that is not Wiki or Card
 * starts a profile this way and then fills in its own section.
 * @param {string} nation The nation's name. Spaces are tidied and the name is cut to 80 characters.
 * @param {StampOptions} [options]
 * @returns {EurthProfile}
 */
export function createProfile(nation: string, options?: StampOptions): EurthProfile;
/**
 * Reads a profile from the text of a file. The text is someone else's input:
 * it is checked for size, read as JSON, and checked against the schema before
 * anything is given back.
 * @param {string} text
 * @returns {ProfileResult} `{ ok: true, profile }`, or `{ ok: false, errors }` with messages to show the person.
 */
export function parseProfile(text: string): ProfileResult;
/**
 * Gives one section of a profile, or `undefined` when the profile does not
 * have it. Treat what you get as read-only; use `setSection` to change it.
 * @template {string} K
 * @param {EurthProfile | null | undefined} profile
 * @param {K} name
 * @returns {EurthProfile[K] | undefined}
 */
export function getSection<K extends string>(profile: EurthProfile | null | undefined, name: K): EurthProfile[K] | undefined;
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
export function setSection<K extends string>(profile: EurthProfile, name: K, data: SectionData<K>, options?: StampOptions): EurthProfile;
/**
 * Gives a new profile without one section, and `updated` stamped on `meta`.
 * A profile that does not have the section comes back as it is.
 * @param {EurthProfile} profile
 * @param {string} name
 * @param {StampOptions} [options]
 * @returns {EurthProfile}
 */
export function removeSection(profile: EurthProfile, name: string, options?: StampOptions): EurthProfile;
/**
 * Gives a new profile with the nation's name changed, and `updated` stamped
 * on `meta`.
 * @param {EurthProfile} profile
 * @param {string} nation Spaces are tidied and the name is cut to 80 characters.
 * @param {StampOptions} [options]
 * @returns {EurthProfile}
 */
export function setNation(profile: EurthProfile, nation: string, options?: StampOptions): EurthProfile;
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
export function mergeProfiles(base: EurthProfile, incoming: EurthProfile, options?: MergeOptions): EurthProfile;
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
export function serialiseProfile(profile: EurthProfile): string;
/**
 * The file name to save a profile under: the nation's name in lower case,
 * plain letters and digits, with hyphens for everything else, for example
 * `orioni.eurth.json`. A profile whose name leaves nothing usable is saved as
 * `nation.eurth.json`.
 * @param {EurthProfile | null | undefined} profile
 * @returns {string}
 */
export function profileFileName(profile: EurthProfile | null | undefined): string;
/**
 * The name of a known section.
 */
export type SectionName = (typeof SECTIONS)[number];
/**
 * What a section holds: the section's own type for a known name, and any
 * JSON object for a name this version does not know.
 */
export type SectionData<K extends string> = K extends SectionName ? NonNullable<EurthProfile[K]> : Record<string, unknown>;
export type StampOptions = {
    /**
     * The moment to stamp as `updated`. Defaults to the present; pass one to get the same result every time, in a test for example.
     */
    now?: string | Date | undefined;
};
export type MergeOptions = {
    /**
     * Which side wins where both have a section. `newest` (the default) goes by the section's `updated`; a section without one counts as oldest, and a tie goes to the incoming profile.
     */
    prefer?: "newest" | "incoming" | "base" | undefined;
    /**
     * Take only these sections from the incoming profile. Without it, all of them.
     */
    sections?: readonly string[] | undefined;
};
import type { EurthProfile } from './types.js';
import type { ProfileResult } from './validate.js';
import { SECTIONS } from './constants.js';
