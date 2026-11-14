/**
 * Checks a value against the profile schema and nothing else. Most code wants
 * `validateProfile`, which also guards against hostile input.
 * @param {unknown} value
 * @returns {ProfileError[]} The problems found; empty when the value fits the schema.
 */
export function validateSchema(value: unknown): ProfileError[];
/**
 * Checks that a value is a profile this package can work with. Treat every
 * loaded file as someone else's input and pass it through here (`parseProfile`
 * does) before using it.
 *
 * Known keys are checked strictly; keys this version does not know are left
 * alone, so that a file from a newer tool still loads.
 *
 * @param {unknown} value
 * @returns {ProfileResult} `{ ok: true, profile }` with the same object, or `{ ok: false, errors }`.
 */
export function validateProfile(value: unknown): ProfileResult;
/**
 * @import { EurthProfile } from './types.js'
 */
/**
 * One problem with a profile.
 * @typedef {object} ProfileError
 * @property {string} path Where the problem is, for example `identity.capital` or `cities.list[3].name`. Empty for a problem with the file as a whole.
 * @property {string} message A full sentence for the person, in plain words.
 */
/**
 * What checking or reading a profile gives back.
 * @typedef {{ ok: true, profile: EurthProfile } | { ok: false, errors: ProfileError[] }} ProfileResult
 */
/** @typedef {{ readonly [keyword: string]: any }} SchemaNode */
/** The keywords this checker enforces. A test fails if the schema uses any other. */
export const SUPPORTED_KEYWORDS: readonly string[];
/** Keywords that describe the schema and check nothing. */
export const ANNOTATION_KEYWORDS: readonly string[];
/** The values of `format` this checker enforces. */
export const SUPPORTED_FORMATS: readonly string[];
/**
 * One problem with a profile.
 */
export type ProfileError = {
    /**
     * Where the problem is, for example `identity.capital` or `cities.list[3].name`. Empty for a problem with the file as a whole.
     */
    path: string;
    /**
     * A full sentence for the person, in plain words.
     */
    message: string;
};
/**
 * What checking or reading a profile gives back.
 */
export type ProfileResult = {
    ok: true;
    profile: EurthProfile;
} | {
    ok: false;
    errors: ProfileError[];
};
export type SchemaNode = {
    readonly [keyword: string]: any;
};
import type { EurthProfile } from './types.js';
