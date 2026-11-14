// The parts that need a browser: saving a profile as a download, and loading
// one from a file the person picks or drops. Nothing is stored and nothing is
// sent anywhere: "save" means a file on the person's own device.

import { MAX_FILE_BYTES } from './constants.js';
import { parseProfile, profileFileName, serialiseProfile } from './profile.js';
import { validateProfile } from './validate.js';

/**
 * @import { EurthProfile } from '../dist/types.js'
 * @import { ProfileError, ProfileResult } from './validate.js'
 */

/**
 * @typedef {object} ProfileDropHandlers
 * @property {(profile: EurthProfile) => void} onprofile Called with the profile from a dropped file.
 * @property {(errors: ProfileError[]) => void} onerror Called when the dropped file cannot be used.
 * @property {(over: boolean) => void} [onover] Called with `true` when a file is dragged over the element and `false` when it leaves or is dropped, to show a hint.
 */

/**
 * @param {string} message
 * @returns {{ ok: false, errors: ProfileError[] }}
 */
function fileError(message) {
  return { ok: false, errors: [{ path: '', message }] };
}

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
export function downloadProfile(profile) {
  const result = validateProfile(profile);
  if (!result.ok) return result;

  const blob = new Blob([serialiseProfile(profile)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = profileFileName(profile);
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the address goes.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return result;
}

/**
 * Reads a profile from a file. The file is someone else's input: its size is
 * checked before it is read, and its contents go through `parseProfile`.
 * @param {Blob} file A `File` from a file input or a drop.
 * @returns {Promise<ProfileResult>} Never rejects.
 */
export async function readProfileFile(file) {
  if (!file || typeof file.size !== 'number') {
    return fileError('That is not a file.');
  }
  if (file.size > MAX_FILE_BYTES) {
    return fileError('The file is too large. A profile is at most 2 MB.');
  }
  try {
    return parseProfile(await file.text());
  } catch {
    return fileError('The file could not be read. Please try again.');
  }
}

/**
 * Asks the person to pick a profile file from their device.
 *
 * Call this from a click or another action by the person; browsers do not
 * open the file dialogue otherwise.
 *
 * @returns {Promise<ProfileResult | null>} What `parseProfile` gives for the picked file, or `null` when the person closes the dialogue without picking one.
 */
export function pickProfile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;

    /** @param {ProfileResult | null} result */
    const finish = (result) => {
      input.remove();
      resolve(result);
    };
    input.addEventListener(
      'change',
      () => {
        const file = input.files?.[0];
        if (file) readProfileFile(file).then(finish);
        else finish(null);
      },
      { once: true }
    );
    input.addEventListener('cancel', () => finish(null), { once: true });

    // In the page, so that the change event arrives in every browser.
    document.body.append(input);
    input.click();
  });
}

/**
 * @param {Event} event
 * @returns {DataTransfer | null}
 */
function filesBeingDragged(event) {
  const transfer = /** @type {DragEvent} */ (event).dataTransfer ?? null;
  if (!transfer) return null;
  return Array.from(transfer.types ?? []).includes('Files') ? transfer : null;
}

/**
 * Lets the person drop a profile file on an element, or on the whole window.
 * Drags that carry no file (text, a link, an image from the page) are left
 * alone.
 *
 * @param {HTMLElement | Window | Document} element Where a file may be dropped.
 * @param {ProfileDropHandlers} handlers
 * @returns {() => void} Call this to stop listening.
 */
export function profileDrop(element, handlers) {
  const { onprofile, onerror, onover } = handlers;
  let depth = 0;

  /** @param {Event} event */
  const enter = (event) => {
    if (!filesBeingDragged(event)) return;
    event.preventDefault();
    depth++;
    if (depth === 1) onover?.(true);
  };

  /** @param {Event} event */
  const over = (event) => {
    const transfer = filesBeingDragged(event);
    if (!transfer) return;
    // Without this the browser would open the file instead of handing it over.
    event.preventDefault();
    transfer.dropEffect = 'copy';
  };

  /** @param {Event} event */
  const leave = (event) => {
    if (!filesBeingDragged(event)) return;
    depth = Math.max(0, depth - 1);
    if (depth === 0) onover?.(false);
  };

  /** @param {Event} event */
  const drop = (event) => {
    const transfer = filesBeingDragged(event);
    if (!transfer) return;
    event.preventDefault();
    depth = 0;
    onover?.(false);
    const files = transfer.files;
    const file = files?.[0];
    if (!file || files.length !== 1) {
      onerror(fileError('Please drop one profile file at a time.').errors);
      return;
    }
    readProfileFile(file).then((result) => {
      if (result.ok) onprofile(result.profile);
      else onerror(result.errors);
    });
  };

  element.addEventListener('dragenter', enter);
  element.addEventListener('dragover', over);
  element.addEventListener('dragleave', leave);
  element.addEventListener('drop', drop);

  return () => {
    element.removeEventListener('dragenter', enter);
    element.removeEventListener('dragover', over);
    element.removeEventListener('dragleave', leave);
    element.removeEventListener('drop', drop);
  };
}
