import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as api from '../src/index.js';
import { fromRoot } from './helpers/paths.js';

const pkg = JSON.parse(readFileSync(fromRoot('package.json'), 'utf8'));
const sources = readdirSync(fromRoot('src')).map((name) => ({
  name,
  text: readFileSync(fromRoot('src', name), 'utf8')
}));

describe('the package', () => {
  it('is @eurth/profile 1.x, plain ES modules under Apache 2.0', () => {
    expect(pkg.name).toBe('@eurth/profile');
    expect(pkg.version).toMatch(/^1\.\d+\.\d+$/);
    expect(pkg.type).toBe('module');
    expect(pkg.license).toBe('Apache-2.0');
    expect(pkg.engines.node).toBe('>=22');
  });

  it('needs nothing at run time and builds nothing on install', () => {
    expect(pkg.dependencies).toBeUndefined();
    expect(pkg.peerDependencies).toEqual({ svelte: '^5.0.0' });
    expect(pkg.peerDependenciesMeta).toEqual({ svelte: { optional: true } });
    for (const script of ['preinstall', 'install', 'postinstall', 'prepare', 'prepack']) {
      expect(pkg.scripts[script], script).toBeUndefined();
    }
  });

  it('exports files that are there', () => {
    expect(pkg.exports['.']).toEqual({ types: './dist/index.d.ts', default: './src/index.js' });
    expect(pkg.exports['./schema.json']).toBe('./schema/eurth-profile.schema.json');
    expect(pkg.exports['./ProfileButtons.svelte'].svelte).toBe('./src/ProfileButtons.svelte');
    expect(pkg.exports['./examples/*']).toBe('./examples/*');

    const targets = [
      pkg.exports['.'].types,
      pkg.exports['.'].default,
      pkg.exports['./schema.json'],
      ...Object.values(pkg.exports['./ProfileButtons.svelte'])
    ];
    for (const target of targets) expect(existsSync(fromRoot(target)), target).toBe(true);
    // Everything an export points to is in a folder that ships.
    for (const target of targets) expect(pkg.files).toContain(target.split('/')[1]);
    expect(pkg.files).toContain('examples');
  });

  it('exports the API the tools were promised', () => {
    expect(Object.keys(api).sort()).toEqual(
      [
        'FILE_EXTENSION',
        'MAX_DEPTH',
        'MAX_FILE_BYTES',
        'MAX_SVG_LENGTH',
        'SCHEMA_VERSION',
        'SECTIONS',
        'SECTION_OWNERS',
        'createProfile',
        'downloadProfile',
        'getSection',
        'mergeProfiles',
        'parseProfile',
        'pickProfile',
        'profileDrop',
        'profileFileName',
        'readProfileFile',
        'removeSection',
        'serialiseProfile',
        'setNation',
        'setSection',
        'svgDataUrl',
        'validateProfile'
      ].sort()
    );
  });

  it('can be loaded in Node without a page', () => {
    expect(typeof globalThis.document).toBe('undefined');
    expect(typeof api.downloadProfile).toBe('function');
  });
});

describe('the source', () => {
  it('is plain JavaScript and one Svelte component', () => {
    expect(sources.map((source) => source.name).sort()).toEqual([
      'ProfileButtons.svelte',
      'constants.js',
      'dom.js',
      'index.js',
      'profile.js',
      'svg.js',
      'util.js',
      'validate.js'
    ]);
  });

  it('stores nothing and sends nothing', () => {
    const forbidden =
      /localStorage|sessionStorage|indexedDB|document\.cookie|\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|navigator\.serviceWorker|caches\./;
    for (const { name, text } of sources) expect(text, name).not.toMatch(forbidden);
  });

  it('runs under a strict content security policy: no eval, no markup from text', () => {
    const forbidden = /\beval\s*\(|new Function|innerHTML|outerHTML|insertAdjacentHTML|document\.write|\{@html/;
    for (const { name, text } of sources) {
      // The component's opening comment names {@html} to warn against it; code may not use it.
      const code = text.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '');
      expect(code, name).not.toMatch(forbidden);
    }
  });

  it('does not link to GitHub in anything a person sees', () => {
    for (const { name, text } of sources) expect(text, name).not.toMatch(/github/i);
  });

  it('writes its messages in British English', () => {
    const american = /\b(color|colors|center|dialog|canceled|serialize|recognize|organize)\b/i;
    for (const { name, text } of sources) {
      const strings = [...text.matchAll(/(['`])((?:(?!\1)[^\\]|\\.)*)\1/g)].map((match) => match[2] ?? '');
      for (const string of strings) {
        if (!string.includes(' ')) continue; // identifiers, paths and event names, not sentences
        expect(string, `${name}: ${string}`).not.toMatch(american);
      }
    }
  });
});
