// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileButtons from '../src/ProfileButtons.svelte';
import { downloadProfile, pickProfile, profileDrop } from '../src/dom.js';
import { example } from './helpers/files.js';
import { fromRoot } from './helpers/paths.js';

vi.mock('../src/dom.js', () => ({
  downloadProfile: vi.fn(),
  pickProfile: vi.fn(),
  profileDrop: vi.fn()
}));

const source = readFileSync(fromRoot('src', 'ProfileButtons.svelte'), 'utf8');

/** @type {ReturnType<typeof vi.fn>} */
let stopListening;
/** @type {Record<string, any>[]} */
let mounted = [];

/**
 * @param {Record<string, unknown>} props
 * @returns {{ load: HTMLButtonElement, save: HTMLButtonElement, buttons: HTMLButtonElement[], component: Record<string, any> }}
 */
function show(props) {
  const component = mount(ProfileButtons, { target: document.body, props: /** @type {any} */ (props) });
  mounted.push(component);
  flushSync();
  const buttons = [...document.body.querySelectorAll('button')];
  return {
    component,
    buttons,
    load: /** @type {HTMLButtonElement} */ (buttons[0]),
    save: /** @type {HTMLButtonElement} */ (buttons[1])
  };
}

beforeEach(() => {
  stopListening = vi.fn();
  vi.mocked(profileDrop).mockReturnValue(/** @type {any} */ (stopListening));
});

afterEach(() => {
  for (const component of mounted) unmount(component);
  mounted = [];
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe('ProfileButtons', () => {
  it('shows two real buttons with the suite class and nothing else', () => {
    const { buttons } = show({ profile: example('calderwyn'), onload: vi.fn(), onerror: vi.fn() });

    expect(buttons.map((button) => button.textContent)).toEqual(['Load profile', 'Save profile']);
    for (const button of buttons) {
      expect(button.type).toBe('button');
      expect(button.className).toBe('eu-btn');
      expect(button.getAttribute('style')).toBeNull();
    }
    expect(document.body.querySelectorAll('*')).toHaveLength(2);
    expect(document.head.querySelector('style')).toBeNull();
  });

  it('switches Save off without a profile', () => {
    const without = show({ profile: null, onload: vi.fn(), onerror: vi.fn() });
    expect(without.load.disabled).toBe(false);
    expect(without.save.disabled).toBe(true);

    document.body.replaceChildren();
    const withProfile = show({ profile: example('hesperwick'), onload: vi.fn(), onerror: vi.fn() });
    expect(withProfile.save.disabled).toBe(false);
  });

  it('loads: hands a picked profile to onload', async () => {
    const profile = example('calderwyn');
    vi.mocked(pickProfile).mockResolvedValue({ ok: true, profile });
    const onload = vi.fn();
    const onerror = vi.fn();

    show({ profile: null, onload, onerror }).load.click();
    await vi.waitFor(() => expect(onload).toHaveBeenCalledExactlyOnceWith(profile));
    expect(onerror).not.toHaveBeenCalled();
  });

  it('loads: hands the problems to onerror', async () => {
    const errors = [{ path: 'meta', message: 'meta is missing.' }];
    vi.mocked(pickProfile).mockResolvedValue({ ok: false, errors });
    const onload = vi.fn();
    const onerror = vi.fn();

    show({ profile: null, onload, onerror }).load.click();
    await vi.waitFor(() => expect(onerror).toHaveBeenCalledExactlyOnceWith(errors));
    expect(onload).not.toHaveBeenCalled();
  });

  it('loads: does nothing when the person closes the dialogue', async () => {
    vi.mocked(pickProfile).mockResolvedValue(null);
    const onload = vi.fn();
    const onerror = vi.fn();

    show({ profile: null, onload, onerror }).load.click();
    await vi.waitFor(() => expect(pickProfile).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onload).not.toHaveBeenCalled();
    expect(onerror).not.toHaveBeenCalled();
  });

  it('saves the profile it was given', () => {
    const profile = example('calderwyn');
    vi.mocked(downloadProfile).mockReturnValue({ ok: true, profile });
    const onerror = vi.fn();

    show({ profile, onload: vi.fn(), onerror }).save.click();
    expect(downloadProfile).toHaveBeenCalledTimes(1);
    expect(vi.mocked(downloadProfile).mock.calls[0]?.[0]).toEqual(profile);
    expect(onerror).not.toHaveBeenCalled();
  });

  it('hands the problems to onerror when the profile cannot be saved', () => {
    const errors = [{ path: 'stats.population', message: 'stats.population should be a whole number.' }];
    vi.mocked(downloadProfile).mockReturnValue({ ok: false, errors });
    const onerror = vi.fn();

    show({ profile: example('calderwyn'), onload: vi.fn(), onerror }).save.click();
    expect(onerror).toHaveBeenCalledExactlyOnceWith(errors);
  });

  it('takes a profile dropped anywhere on the window, unless drop is off', () => {
    const onload = vi.fn();
    const onerror = vi.fn();
    const { component } = show({ profile: null, onload, onerror });

    expect(profileDrop).toHaveBeenCalledTimes(1);
    const [target, handlers] = /** @type {[unknown, any]} */ (vi.mocked(profileDrop).mock.calls[0]);
    expect(target).toBe(window);

    const profile = example('hesperwick');
    handlers.onprofile(profile);
    expect(onload).toHaveBeenCalledExactlyOnceWith(profile);
    handlers.onerror([{ path: '', message: 'Please drop one profile file at a time.' }]);
    expect(onerror).toHaveBeenCalledTimes(1);

    expect(stopListening).not.toHaveBeenCalled();
    unmount(component);
    mounted = [];
    expect(stopListening).toHaveBeenCalledTimes(1);

    vi.mocked(profileDrop).mockClear();
    show({ profile: null, onload, onerror, drop: false });
    expect(profileDrop).not.toHaveBeenCalled();
  });

  it('carries no styling, storage or links of its own', () => {
    expect(source).not.toMatch(/<style/);
    expect(source).not.toMatch(/style=/);
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(|\bpx\b|\brem\b|font-/i);
    expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|cookie|fetch\(/);
    expect(source).not.toMatch(/github/i);
    expect(source).toMatch(/<script lang="ts">/);
    // Types that can simply be erased: no enums, namespaces or parameter properties.
    expect(source).not.toMatch(/\benum\b|\bnamespace\b|\bdeclare\b/);
  });
});
