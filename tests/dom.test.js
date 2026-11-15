// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_FILE_BYTES,
  downloadProfile,
  pickProfile,
  profileDrop,
  readProfileFile,
  serialiseProfile
} from '../src/index.js';
import { example, examples } from './helpers/files.js';

const calderwynText = /** @type {{ text: string }} */ (examples.find((entry) => entry.name.startsWith('calderwyn'))).text;

/**
 * @param {string} text
 * @param {string} [name]
 * @returns {File}
 */
const fileOf = (text, name = 'calderwyn.eurth.json') => new File([text], name, { type: 'application/json' });

/** Lets the promises inside the helpers settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('downloadProfile', () => {
  /** @type {Blob[]} */
  let blobs;
  /** @type {{ download: string, href: string, inPage: boolean, hidden: boolean }[]} */
  let clicks;

  beforeEach(() => {
    blobs = [];
    clicks = [];
    // jsdom has no object URLs; these stand in for the browser's.
    URL.createObjectURL = vi.fn((blob) => {
      blobs.push(/** @type {Blob} */ (blob));
      return 'blob:eurth-test';
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      clicks.push({ download: this.download, href: this.href, inPage: this.isConnected, hidden: this.hidden });
    });
  });

  it('saves the profile as a JSON file named after the nation', async () => {
    vi.useFakeTimers();
    const profile = example('calderwyn');
    const result = downloadProfile(profile);

    expect(result).toEqual({ ok: true, profile });
    expect(clicks).toEqual([{ download: 'calderwyn.eurth.json', href: 'blob:eurth-test', inPage: true, hidden: true }]);
    expect(blobs).toHaveLength(1);
    expect(blobs[0]?.type).toBe('application/json');
    expect(await blobs[0]?.text()).toBe(serialiseProfile(profile));
    expect(await blobs[0]?.text()).toBe(calderwynText);

    // Nothing is left in the page, and the address is given back.
    expect(document.querySelector('a')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:eurth-test');
  });

  it('does not save a profile that would not load again', () => {
    const profile = example('calderwyn');
    profile.stats.population = 'plenty';
    const result = downloadProfile(profile);

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          path: 'stats.population',
          message: 'stats.population should be a whole number between 0 and 1,000,000,000,000.'
        }
      ]
    });
    expect(clicks).toEqual([]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});

describe('readProfileFile', () => {
  it('reads a profile from a file', async () => {
    expect(await readProfileFile(fileOf(calderwynText))).toEqual({ ok: true, profile: example('calderwyn') });
  });

  it('gives the problems for a file that is not a profile', async () => {
    const result = await readProfileFile(fileOf('{"name":"something else"}', 'package.json'));
    expect(result).toEqual({ ok: false, errors: [{ path: 'meta', message: 'This file isn\'t a nation profile: it has no "meta" section. Pick a file that ends in .eurth.json.' }] });
    expect((await readProfileFile(fileOf('not json'))).ok).toBe(false);
    expect((await readProfileFile(fileOf(''))).ok).toBe(false);
  });

  it('does not read a file over 2 MB at all', async () => {
    const text = vi.fn();
    const result = await readProfileFile(/** @type {any} */ ({ size: MAX_FILE_BYTES + 1, text }));
    expect(result).toEqual({
      ok: false,
      errors: [{ path: '', message: 'The file is too large. A profile is at most 2 MB.' }]
    });
    expect(text).not.toHaveBeenCalled();
  });

  it('never rejects', async () => {
    const broken = { size: 10, text: () => Promise.reject(new Error('disk gone')) };
    expect(await readProfileFile(/** @type {any} */ (broken))).toEqual({
      ok: false,
      errors: [{ path: '', message: 'The file could not be read. Please try again.' }]
    });
    expect((await readProfileFile(/** @type {any} */ (null))).ok).toBe(false);
    expect((await readProfileFile(/** @type {any} */ ('a string'))).ok).toBe(false);
  });
});

describe('pickProfile', () => {
  /**
   * Stands in for the person: when the file dialogue would open, run `act`
   * with the input instead.
   * @param {(input: HTMLInputElement) => void} act
   * @returns {{ inputs: HTMLInputElement[] }}
   */
  function whenTheDialogueOpens(act) {
    /** @type {HTMLInputElement[]} */
    const inputs = [];
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function () {
      inputs.push(this);
      act(this);
    });
    return { inputs };
  }

  /**
   * @param {HTMLInputElement} input
   * @param {File[]} files
   */
  function choose(input, files) {
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    input.dispatchEvent(new Event('change'));
  }

  it('opens a hidden file input for JSON files and gives the profile picked', async () => {
    /** @type {Record<string, unknown>} */
    let seen = {};
    const { inputs } = whenTheDialogueOpens((input) => {
      seen = { type: input.type, accept: input.accept, hidden: input.hidden, inPage: input.isConnected, multiple: input.multiple };
      choose(input, [fileOf(calderwynText)]);
    });

    const result = await pickProfile();

    expect(seen).toEqual({ type: 'file', accept: '.json,application/json', hidden: true, inPage: true, multiple: false });
    expect(result).toEqual({ ok: true, profile: example('calderwyn') });
    expect(inputs).toHaveLength(1);
    expect(document.querySelector('input')).toBeNull();
  });

  it('gives the problems when the picked file is not a profile', async () => {
    whenTheDialogueOpens((input) => choose(input, [fileOf('{"meta":{"schema":1}}')]));
    const result = await pickProfile();
    expect(result).toEqual({
      ok: false,
      errors: [
        { path: 'meta.nation', message: 'meta.nation is missing.' },
        { path: 'meta.updated', message: 'meta.updated is missing.' }
      ]
    });
    expect(document.querySelector('input')).toBeNull();
  });

  it('gives null when the person closes the dialogue', async () => {
    whenTheDialogueOpens((input) => input.dispatchEvent(new Event('cancel')));
    expect(await pickProfile()).toBeNull();
    expect(document.querySelector('input')).toBeNull();
  });

  it('gives null when the dialogue closes with no file', async () => {
    whenTheDialogueOpens((input) => choose(input, []));
    expect(await pickProfile()).toBeNull();
  });
});

describe('profileDrop', () => {
  /**
   * @param {string} type
   * @param {{ types: string[], files?: File[] }} transfer
   * @returns {Event & { dataTransfer: any }}
   */
  function drag(type, transfer) {
    const event = /** @type {any} */ (new Event(type, { bubbles: true, cancelable: true }));
    event.dataTransfer = { dropEffect: 'none', files: [], ...transfer };
    return event;
  }

  /** @returns {{ zone: HTMLElement, child: HTMLElement, onprofile: any, onerror: any, onover: any, stop: () => void }} */
  function setUp() {
    const zone = document.createElement('div');
    const child = document.createElement('p');
    zone.append(child);
    document.body.append(zone);
    const onprofile = vi.fn();
    const onerror = vi.fn();
    const onover = vi.fn();
    const stop = profileDrop(zone, { onprofile, onerror, onover });
    return { zone, child, onprofile, onerror, onover, stop };
  }

  it('hands over the profile from a dropped file', async () => {
    const { zone, onprofile, onerror } = setUp();
    const over = drag('dragover', { types: ['Files'] });
    zone.dispatchEvent(over);
    expect(over.defaultPrevented).toBe(true);
    expect(over.dataTransfer.dropEffect).toBe('copy');

    const drop = drag('drop', { types: ['Files'], files: [fileOf(calderwynText)] });
    zone.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
    await settle();

    expect(onprofile).toHaveBeenCalledExactlyOnceWith(example('calderwyn'));
    expect(onerror).not.toHaveBeenCalled();
  });

  it('gives the problems when the dropped file is not a profile', async () => {
    const { zone, onprofile, onerror } = setUp();
    zone.dispatchEvent(drag('drop', { types: ['Files'], files: [fileOf('<svg></svg>', 'flag.svg')] }));
    await settle();

    expect(onprofile).not.toHaveBeenCalled();
    expect(onerror).toHaveBeenCalledTimes(1);
    expect(onerror.mock.calls[0][0][0].message).toMatch(/^The file is not valid JSON/);
  });

  it('asks for one file at a time', async () => {
    const { zone, onprofile, onerror } = setUp();
    zone.dispatchEvent(drag('drop', { types: ['Files'], files: [fileOf(calderwynText), fileOf(calderwynText)] }));
    zone.dispatchEvent(drag('drop', { types: ['Files'], files: [] }));
    await settle();

    expect(onprofile).not.toHaveBeenCalled();
    expect(onerror).toHaveBeenCalledTimes(2);
    expect(onerror).toHaveBeenCalledWith([{ path: '', message: 'Please drop one profile file at a time.' }]);
  });

  it('leaves drags that carry no file alone', async () => {
    const { zone, onprofile, onerror, onover } = setUp();
    const events = ['dragenter', 'dragover', 'dragleave', 'drop'].map((type) =>
      drag(type, { types: ['text/plain', 'text/uri-list'] })
    );
    events.push(/** @type {any} */ (new Event('drop', { bubbles: true, cancelable: true })));
    for (const event of events) zone.dispatchEvent(event);
    await settle();

    for (const event of events) expect(event.defaultPrevented, event.type).toBe(false);
    expect(onprofile).not.toHaveBeenCalled();
    expect(onerror).not.toHaveBeenCalled();
    expect(onover).not.toHaveBeenCalled();
  });

  it('says when a file is over the element, once, even across its children', () => {
    const { zone, child, onover } = setUp();
    const files = { types: ['Files'] };

    zone.dispatchEvent(drag('dragenter', files));
    child.dispatchEvent(drag('dragenter', files));
    zone.dispatchEvent(drag('dragleave', files));
    expect(onover.mock.calls).toEqual([[true]]);

    child.dispatchEvent(drag('dragleave', files));
    expect(onover.mock.calls).toEqual([[true], [false]]);

    zone.dispatchEvent(drag('dragenter', files));
    zone.dispatchEvent(drag('drop', { ...files, files: [] }));
    expect(onover.mock.calls).toEqual([[true], [false], [true], [false]]);
  });

  it('works without onover, and on the whole window', async () => {
    const onprofile = vi.fn();
    const stop = profileDrop(window, { onprofile, onerror: vi.fn() });
    document.body.dispatchEvent(drag('dragenter', { types: ['Files'] }));
    document.body.dispatchEvent(drag('drop', { types: ['Files'], files: [fileOf(calderwynText)] }));
    await settle();
    expect(onprofile).toHaveBeenCalledTimes(1);
    stop();
  });

  it('stops listening when asked', async () => {
    const { zone, onprofile, onerror, onover, stop } = setUp();
    stop();
    const drop = drag('drop', { types: ['Files'], files: [fileOf(calderwynText)] });
    zone.dispatchEvent(drag('dragenter', { types: ['Files'] }));
    zone.dispatchEvent(drop);
    await settle();

    expect(drop.defaultPrevented).toBe(false);
    expect(onprofile).not.toHaveBeenCalled();
    expect(onerror).not.toHaveBeenCalled();
    expect(onover).not.toHaveBeenCalled();
  });
});

describe('nothing is stored and nothing is sent', () => {
  it('through a whole save and load', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:eurth-test');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const cookieBefore = document.cookie;

    downloadProfile(example('calderwyn'));
    await readProfileFile(fileOf(calderwynText));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    expect(document.cookie).toBe(cookieBefore);
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
    vi.unstubAllGlobals();
  });
});
