/**
 * Saves a profile as a file on the person's device, named after the nation
 * (see `profileFileName`). The profile is checked first; one that does not
 * pass is not saved, and the problems come back instead.
 *
 * Call this from a click or another action by the person.
 *
 * @param {EurthProfile} profile
 * @returns {ProfileResult} `{ ok: true, profile }` once the download has started, or `{ ok: false, errors }`.
 */
export function downloadProfile(profile: EurthProfile): ProfileResult;
/**
 * Reads a profile from a file. The file is someone else's input: its size is
 * checked before it is read, and its contents go through `parseProfile`.
 * @param {Blob} file A `File` from a file input or a drop.
 * @returns {Promise<ProfileResult>} Never rejects.
 */
export function readProfileFile(file: Blob): Promise<ProfileResult>;
/**
 * Asks the person to pick a profile file from their device.
 *
 * Call this from a click or another action by the person; browsers do not
 * open the file dialogue otherwise.
 *
 * @returns {Promise<ProfileResult | null>} What `parseProfile` gives for the picked file, or `null` when the person closes the dialogue without picking one.
 */
export function pickProfile(): Promise<ProfileResult | null>;
/**
 * Lets the person drop a profile file on an element, or on the whole window.
 * Drags that carry no file (text, a link, an image from the page) are left
 * alone.
 *
 * @param {HTMLElement | Window | Document} element Where a file may be dropped.
 * @param {ProfileDropHandlers} handlers
 * @returns {() => void} Call this to stop listening.
 */
export function profileDrop(element: HTMLElement | Window | Document, handlers: ProfileDropHandlers): () => void;
export type ProfileDropHandlers = {
    /**
     * Called with the profile from a dropped file.
     */
    onprofile: (profile: EurthProfile) => void;
    /**
     * Called when the dropped file cannot be used.
     */
    onerror: (errors: ProfileError[]) => void;
    /**
     * Called with `true` when a file is dragged over the element and `false` when it leaves or is dropped, to show a hint.
     */
    onover?: ((over: boolean) => void) | undefined;
};
import type { EurthProfile } from './types.js';
import type { ProfileResult } from './validate.js';
import type { ProfileError } from './validate.js';
