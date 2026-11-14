import { describe, expect, it } from 'vitest';
import {
  MAX_FILE_BYTES,
  SCHEMA_VERSION,
  SECTIONS,
  createProfile,
  getSection,
  parseProfile,
  profileFileName,
  removeSection,
  serialiseProfile,
  setNation,
  setSection,
  validateProfile
} from '../src/index.js';
import { deepFreeze, example, fixtureText } from './helpers/files.js';

const NOW = '2027-01-01T00:00:00.000Z';

/**
 * @param {string} text
 * @returns {import('../src/index.js').EurthProfile}
 */
function parsed(text) {
  const result = parseProfile(text);
  if (!result.ok) throw new Error(result.errors.map((error) => error.message).join(' '));
  return result.profile;
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function parseMessages(text) {
  const result = parseProfile(text);
  return result.ok ? [] : result.errors.map((error) => error.message);
}

describe('constants', () => {
  it('are what the tools were told', () => {
    expect(SCHEMA_VERSION).toBe(1);
    expect(MAX_FILE_BYTES).toBe(2 * 1024 * 1024);
    expect(SECTIONS).toEqual([
      'identity',
      'flag',
      'arms',
      'government',
      'seats',
      'names',
      'stats',
      'dynasty',
      'calendar',
      'timeline',
      'bank',
      'passport',
      'rank',
      'cities',
      'anthem',
      'wiki'
    ]);
    expect(Object.isFrozen(SECTIONS)).toBe(true);
  });
});

describe('createProfile', () => {
  it('makes a valid profile with only meta', () => {
    const profile = createProfile('Orioni', { now: NOW });
    expect(profile).toEqual({ meta: { schema: 1, nation: 'Orioni', updated: NOW } });
    expect(validateProfile(profile).ok).toBe(true);
  });

  it('stamps the present moment by default', () => {
    const before = Date.now();
    const stamped = Date.parse(createProfile('Orioni').meta.updated);
    expect(stamped).toBeGreaterThanOrEqual(before);
    expect(stamped).toBeLessThanOrEqual(Date.now());
  });

  it('tidies the name and stays valid whatever it is given', () => {
    expect(createProfile('  Kingdom   of\tCalderwyn \n', { now: NOW }).meta.nation).toBe('Kingdom of Calderwyn');
    expect(createProfile('n'.repeat(300), { now: NOW }).meta.nation).toHaveLength(80);
    expect(Array.from(createProfile('🏰'.repeat(300), { now: NOW }).meta.nation)).toHaveLength(80);
    for (const odd of ['', '   ', undefined, null, 5, {}, []]) {
      const profile = createProfile(/** @type {any} */ (odd), { now: NOW });
      expect(profile.meta.nation).toBe('');
      expect(validateProfile(profile).ok).toBe(true);
    }
  });
});

describe('parseProfile', () => {
  it('reads a profile', () => {
    const text = '{"meta":{"schema":1,"nation":"Hesperwick","updated":"2026-11-02T18:40:12.000Z"},"flag":{"ratio":"3:5"}}';
    expect(parseProfile(text)).toEqual({ ok: true, profile: JSON.parse(text) });
  });

  it('reads a file that starts with a byte order mark', () => {
    const text = '\uFEFF{"meta":{"schema":1,"nation":"Hesperwick","updated":"2026-11-02T18:40:12.000Z"}}';
    expect(parseProfile(text).ok).toBe(true);
  });

  it('explains bad JSON without quoting the parser', () => {
    const message =
      'The file is not valid JSON, so it cannot be read as a profile. It may be damaged, or it may not be a profile at all.';
    for (const text of ['{', '{"meta":', 'hello', '<svg></svg>', "{'meta': 1}", '{"meta":{}}}', 'NaN', '{"a":1,}']) {
      expect(parseMessages(text), text).toEqual([message]);
    }
  });

  it('says so when the file is empty or is not text', () => {
    expect(parseMessages('')).toEqual(['The file is empty.']);
    expect(parseMessages('  \n\t ')).toEqual(['The file is empty.']);
    expect(parseMessages(/** @type {any} */ (undefined))).toEqual(['The file could not be read as text.']);
    expect(parseMessages(/** @type {any} */ ({ meta: {} }))).toEqual(['The file could not be read as text.']);
  });

  it('turns away JSON that is not a profile', () => {
    expect(parseMessages('null')).toEqual(['The profile should be a JSON object with a "meta" section.']);
    expect(parseMessages('[]')).toEqual(['The profile should be a JSON object with a "meta" section.']);
    expect(parseMessages('"Calderwyn"')).toEqual(['The profile should be a JSON object with a "meta" section.']);
    expect(parseMessages('{}')).toEqual(['meta is missing.']);
    expect(parseMessages('{"name":"some-package","version":"1.0.0"}')).toEqual(['meta is missing.']);
  });

  it('turns away a file over 2 MB before reading it as JSON', () => {
    const tooLarge = 'The file is too large. A profile is at most 2 MB.';
    const head = '{"meta":{"schema":1,"nation":"Calderwyn","updated":"2026-11-13T21:05:44.000Z"},"padding":"';
    const tail = '"}';
    const room = MAX_FILE_BYTES - head.length - tail.length;

    expect(parseProfile(head + 'x'.repeat(room) + tail).ok).toBe(true);
    expect(parseMessages(head + 'x'.repeat(room + 1) + tail)).toEqual([tooLarge]);
    // Not valid JSON either, but size is checked first.
    expect(parseMessages('['.repeat(MAX_FILE_BYTES + 1))).toEqual([tooLarge]);
    // Counted in bytes, not characters: é is two bytes, ☃ is three, 🏰 is four.
    expect(parseMessages(head + 'é'.repeat(room / 2 + 1) + tail)).toEqual([tooLarge]);
    expect(parseMessages(head + '☃'.repeat(Math.floor(room / 3) + 1) + tail)).toEqual([tooLarge]);
    expect(parseMessages(head + '🏰'.repeat(Math.floor(room / 4) + 1) + tail)).toEqual([tooLarge]);
    expect(parseProfile(head + '🏰'.repeat(Math.floor(room / 4)) + tail).ok).toBe(true);
  });

  it('survives hostile JSON', () => {
    // Very deep nesting: either the JSON reader gives up or the depth check does.
    expect(parseProfile('['.repeat(200000) + ']'.repeat(200000)).ok).toBe(false);
    expect(
      parseProfile(
        `{"meta":{"schema":1,"nation":"x","updated":"2026-11-13T21:05:44.000Z"},"a":${'{"a":'.repeat(100000)}1${'}'.repeat(100000)}}`
      ).ok
    ).toBe(false);
    // A million short items in a known list.
    const many = `{"meta":{"schema":1,"nation":"x","updated":"2026-11-13T21:05:44.000Z"},"names":{"places":[${'"a",'.repeat(400000)}"a"]}}`;
    expect(parseMessages(many)).toEqual(['names.places should be a list of at most 200 items.']);
    // An SVG over the limit, a script where a colour should be.
    const svg = `{"meta":{"schema":1,"nation":"x","updated":"2026-11-13T21:05:44.000Z"},"flag":{"svg":"<svg>${'a'.repeat(600000)}</svg>"}}`;
    expect(parseMessages(svg)).toEqual(['flag.svg should be text of at most 524,288 characters.']);
    const colour = '{"meta":{"schema":1,"nation":"x","updated":"2026-11-13T21:05:44.000Z"},"passport":{"colour":"red\\"><script>alert(1)</script>"}}';
    expect(parseMessages(colour)).toEqual(['passport.colour should be text like "#2698d4".']);
  });

  it('turns away a newer format with a request to update the tool', () => {
    const text = '{"meta":{"schema":3,"nation":"Calderwyn","updated":"2029-01-01T00:00:00Z"},"flag":{"shape":"pennant"}}';
    expect(parseMessages(text)).toEqual([
      'This profile uses a newer format (schema 3) than this tool understands (schema 1). Please update the tool, or reload the page to get its latest version, then try again.'
    ]);
  });

  it('never lets a file reach into Object.prototype', () => {
    const hostile = [
      '{"meta":{"schema":1,"nation":"x","updated":"2026-11-13T21:05:44.000Z"},"__proto__":{"polluted":"yes"}}',
      '{"meta":{"schema":1,"nation":"x","updated":"2026-11-13T21:05:44.000Z"},"flag":{"__proto__":{"polluted":"yes"}}}',
      '{"__proto__":{"meta":{"schema":1,"nation":"x","updated":"2026-11-13T21:05:44.000Z"}}}'
    ];
    for (const text of hostile) expect(parseProfile(text).ok).toBe(false);

    const kept = parsed(
      '{"meta":{"schema":1,"nation":"x","updated":"2026-11-13T21:05:44.000Z"},"constructor":{"prototype":{"polluted":"yes"}},"flag":{"constructor":{"prototype":{"polluted":"yes"}}}}'
    );
    const changed = setSection(kept, 'stats', { population: 1 }, { now: NOW });
    const back = parsed(serialiseProfile(changed));

    for (const profile of [kept, changed, back]) {
      expect(Object.getPrototypeOf(profile)).toBe(Object.prototype);
      expect(Object.hasOwn(profile, 'constructor')).toBe(true);
      expect(getSection(profile, 'constructor')).toEqual({ prototype: { polluted: 'yes' } });
    }
    expect(/** @type {any} */ ({}).polluted).toBeUndefined();
    expect(/** @type {any} */ (Object.prototype).polluted).toBeUndefined();
    expect({}.constructor).toBe(Object);
  });
});

describe('getSection', () => {
  const profile = deepFreeze(example('calderwyn'));

  it('gives a section, or undefined', () => {
    expect(getSection(profile, 'flag')).toBe(profile.flag);
    expect(getSection(profile, 'meta')).toBe(profile.meta);
    expect(getSection(example('hesperwick'), 'arms')).toBeUndefined();
    expect(getSection(profile, 'weather')).toBeUndefined();
  });

  it('does not mistake what every object has for a section', () => {
    for (const name of ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf']) {
      expect(getSection(profile, name), name).toBeUndefined();
    }
  });

  it('is at ease without a profile', () => {
    expect(getSection(null, 'flag')).toBeUndefined();
    expect(getSection(undefined, 'flag')).toBeUndefined();
  });
});

describe('setSection', () => {
  it('replaces one section and stamps it and meta', () => {
    const before = deepFreeze(example('vantmoor'));
    const after = setSection(before, 'flag', { ratio: '1:2', colours: ['#000000'] }, { now: NOW });

    expect(after.flag).toEqual({ ratio: '1:2', colours: ['#000000'], updated: NOW });
    expect(after.meta).toEqual({ schema: 1, nation: 'Vantmoor', updated: NOW });
    expect(validateProfile(after).ok).toBe(true);
  });

  it('leaves every other key exactly as it was, in the same order', () => {
    const before = deepFreeze(example('calderwyn'));
    const after = setSection(before, 'stats', { population: 5 }, { now: NOW });

    expect(Object.keys(after)).toEqual(Object.keys(before));
    for (const key of Object.keys(before)) {
      if (key === 'stats' || key === 'meta') continue;
      expect(after[key], key).toBe(before[key]);
    }
    expect(before.stats.population).toBe(12480000);
    expect(before.meta.updated).toBe('2026-11-13T21:05:44.000Z');
  });

  it('adds a section the profile did not have, after the others', () => {
    const before = deepFreeze(example('hesperwick'));
    const after = setSection(before, 'anthem', { title: 'West Wind' }, { now: new Date(NOW) });
    expect(Object.keys(after)).toEqual(['meta', 'flag', 'anthem']);
    expect(after.anthem).toEqual({ title: 'West Wind', updated: NOW });
    expect(after.flag).toBe(before.flag);
  });

  it('overwrites an old stamp in the data, and keeps the data itself unchanged', () => {
    const data = deepFreeze({ updated: '2001-01-01T00:00:00Z', title: 'West Wind' });
    const after = setSection(example('hesperwick'), 'anthem', data, { now: NOW });
    expect(after.anthem).toEqual({ updated: NOW, title: 'West Wind' });
    expect(data.updated).toBe('2001-01-01T00:00:00Z');
  });

  it('takes a section this version does not know', () => {
    const after = setSection(example('hesperwick'), 'weather', { climate: 'Oceanic' }, { now: NOW });
    expect(after.weather).toEqual({ climate: 'Oceanic', updated: NOW });
    expect(validateProfile(after).ok).toBe(true);
  });

  it('refuses meta, odd names and data that is not an object', () => {
    const profile = example('hesperwick');
    expect(() => setSection(profile, 'meta', /** @type {any} */ ({ nation: 'x' }))).toThrow(TypeError);
    expect(() => setSection(profile, '__proto__', {})).toThrow(TypeError);
    expect(() => setSection(profile, '', {})).toThrow(TypeError);
    expect(() => setSection(profile, /** @type {any} */ (5), {})).toThrow(TypeError);
    expect(() => setSection(profile, 'flag', /** @type {any} */ (null))).toThrow(TypeError);
    expect(() => setSection(profile, 'flag', /** @type {any} */ ([]))).toThrow(TypeError);
    expect(() => setSection(profile, 'flag', /** @type {any} */ ('<svg/>'))).toThrow(TypeError);
  });
});

describe('unknown keys', () => {
  const text = fixtureText('future.eurth.json');

  it('come through parse and serialise byte for byte', () => {
    expect(serialiseProfile(parsed(text))).toBe(text);
  });

  it('come through parse, setSection and serialise byte for byte', () => {
    const changed = setSection(parsed(text), 'stats', { population: 1 }, { now: NOW });
    const out = serialiseProfile(changed);

    const statsBlock = `  "stats": {\n    "population": 1,\n    "updated": "${NOW}"\n  },\n`;
    expect(out).toContain(statsBlock);
    // Take the new section out again and put the old date back on meta:
    // what is left must be the file as it was, to the byte.
    const restored = out
      .replace(statsBlock, '')
      .replace(`"updated": "${NOW}"`, '"updated": "2026-11-13T21:05:44.000Z"');
    expect(restored).toBe(text);
  });

  it('stay inside a section when its owner spreads the old section', () => {
    const profile = parsed(text);
    const stampInFile = '2026-11-13T21:05:44.000Z';
    const again = setSection(profile, 'flag', { ...getSection(profile, 'flag') }, { now: stampInFile });
    expect(serialiseProfile(again)).toBe(text);
  });

  it('stay through removeSection and setNation', () => {
    const profile = parsed(text);
    const without = removeSection(profile, 'cities', { now: NOW });
    expect(Object.keys(without)).toEqual(Object.keys(profile).filter((key) => key !== 'cities'));
    expect(without.weather).toBe(profile.weather);
    expect(without.meta).toEqual({ ...profile.meta, updated: NOW });

    const renamed = setNation(profile, 'Calderwyn and the Isles', { now: NOW });
    expect(renamed.meta).toEqual({ ...profile.meta, nation: 'Calderwyn and the Isles', updated: NOW });
    expect(Object.keys(renamed.meta)).toEqual(Object.keys(profile.meta));
    expect(renamed.weather).toBe(profile.weather);
    expect(renamed.constructor).toBe(profile.constructor);
  });
});

describe('removeSection', () => {
  it('takes one section out and stamps meta', () => {
    const before = deepFreeze(example('vantmoor'));
    const after = removeSection(before, 'stats', { now: NOW });
    expect(Object.keys(after)).toEqual(['meta', 'identity', 'flag', 'government', 'cities']);
    expect(after.meta.updated).toBe(NOW);
    expect(after.cities).toBe(before.cities);
    expect(before.stats).toBeDefined();
    expect(validateProfile(after).ok).toBe(true);
  });

  it('gives the profile back as it is when the section is not there', () => {
    const before = deepFreeze(example('hesperwick'));
    expect(removeSection(before, 'stats', { now: NOW })).toBe(before);
    expect(removeSection(before, 'toString', { now: NOW })).toBe(before);
  });

  it('refuses to remove meta', () => {
    expect(() => removeSection(example('hesperwick'), 'meta')).toThrow(TypeError);
  });
});

describe('setNation', () => {
  it('changes the name, stamps meta and leaves the sections alone', () => {
    const before = deepFreeze(example('vantmoor'));
    const after = setNation(before, '  New   Vantmoor ', { now: NOW });
    expect(after.meta).toEqual({ schema: 1, nation: 'New Vantmoor', updated: NOW });
    expect(after.identity).toBe(before.identity);
    expect(before.meta.nation).toBe('Vantmoor');
    expect(Object.keys(after)).toEqual(Object.keys(before));
  });
});

describe('serialiseProfile', () => {
  it('writes two-space JSON with a final line break', () => {
    const text = serialiseProfile(createProfile('Orioni', { now: NOW }));
    expect(text).toBe(`{\n  "meta": {\n    "schema": 1,\n    "nation": "Orioni",\n    "updated": "${NOW}"\n  }\n}\n`);
  });

  it('puts meta first, then known sections in order, then the rest as they came', () => {
    const jumbled = {
      zebra: 1,
      wiki: { drivesOn: 'left' },
      2026: 'a key that JavaScript would sort to the front',
      flag: { ratio: '2:3' },
      apple: 2,
      identity: { capital: 'Haldermouth' },
      meta: { schema: 1, nation: 'Calderwyn', updated: NOW }
    };
    const text = serialiseProfile(/** @type {any} */ (jumbled));
    const order = [...text.matchAll(/^ {2}"([^"]+)":/gm)].map((match) => match[1]);
    expect(order).toEqual(['meta', 'identity', 'flag', 'wiki', '2026', 'zebra', 'apple']);
    expect(JSON.parse(text)).toEqual(jumbled);
  });

  it('gives the same text every time, and text that parses back to the same profile', () => {
    const profile = deepFreeze(example('calderwyn'));
    const text = serialiseProfile(profile);
    expect(serialiseProfile(profile)).toBe(text);
    expect(parsed(text)).toEqual(profile);
    expect(text.endsWith('}\n')).toBe(true);
    expect(text.endsWith('\n\n')).toBe(false);
  });
});

describe('profileFileName', () => {
  it.each([
    ['Orioni', 'orioni.eurth.json'],
    ['Republic of Teland', 'republic-of-teland.eurth.json'],
    ['  Sunset   Sea  Islands ', 'sunset-sea-islands.eurth.json'],
    ['São Tomé & Príncipe', 'sao-tome-principe.eurth.json'],
    ['Ænglaland', 'aenglaland.eurth.json'],
    ['Großfürstentum Östland', 'grossfurstentum-ostland.eurth.json'],
    ['Łódź-on-Þames', 'lodz-on-thames.eurth.json'],
    ["People's Republic (North)", 'people-s-republic-north.eurth.json'],
    ['Nation 51', 'nation-51.eurth.json'],
    ['../../etc/passwd', 'etc-passwd.eurth.json'],
    ['C:\\Windows\\system32', 'c-windows-system32.eurth.json'],
    ['con', 'nation-con.eurth.json'],
    ['LPT1', 'nation-lpt1.eurth.json'],
    ['日本', 'nation.eurth.json'],
    ['🏰', 'nation.eurth.json'],
    ['---', 'nation.eurth.json'],
    ['', 'nation.eurth.json']
  ])('%j is saved as %s', (nation, fileName) => {
    expect(profileFileName(createProfile(nation, { now: NOW }))).toBe(fileName);
  });

  it('keeps long names to a sensible length, with no hyphen at the end', () => {
    const name = profileFileName(createProfile(`${'abcdefghi '.repeat(7)}xyz`, { now: NOW }));
    expect(name).toBe(`${'abcdefghi-'.repeat(5)}abcdefghi.eurth.json`);
    expect(name.length).toBeLessThanOrEqual(60 + '.eurth.json'.length);
  });

  it('falls back when there is no usable profile', () => {
    expect(profileFileName(null)).toBe('nation.eurth.json');
    expect(profileFileName(undefined)).toBe('nation.eurth.json');
    expect(profileFileName(/** @type {any} */ ({}))).toBe('nation.eurth.json');
    expect(profileFileName(/** @type {any} */ ({ meta: { nation: 5 } }))).toBe('nation.eurth.json');
  });

  it('only ever uses lower-case letters, digits and hyphens', () => {
    for (const nation of ['A/B', 'a\\b', 'a:b', 'a*b?', '<script>', 'a\u0000b', 'a\nb', '.hidden', 'a..b', 'ÀÉÎÕÜ']) {
      expect(profileFileName(createProfile(nation, { now: NOW }))).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.eurth\.json$/);
    }
  });
});
