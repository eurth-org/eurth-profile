import { describe, expect, it } from 'vitest';
import { MAX_DEPTH, validateProfile } from '../src/index.js';
import { validateSchema } from '../src/validate.js';
import { invalidProfiles, unusualButValid } from './fixtures/invalid.js';
import { ajvAccepts } from './helpers/ajv.js';
import { example, examples } from './helpers/files.js';

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function messages(value) {
  const result = validateProfile(value);
  return result.ok ? [] : result.errors.map((error) => error.message);
}

describe('the checker and Ajv agree', () => {
  it.each(examples)('yes to the example $name', ({ profile }) => {
    expect(validateSchema(profile)).toEqual([]);
    expect(ajvAccepts(profile)).toBe(true);
  });

  it.each(unusualButValid)('yes to %s', (_name, value) => {
    expect(validateSchema(value)).toEqual([]);
    expect(ajvAccepts(value)).toBe(true);
    expect(validateProfile(value).ok).toBe(true);
  });

  it.each(invalidProfiles)('no to %s', (_name, value) => {
    expect(ajvAccepts(value)).toBe(false);
    expect(validateSchema(value).length).toBeGreaterThan(0);
    expect(validateProfile(value).ok).toBe(false);
  });

  it('on every example with every value swapped for something else, one at a time', () => {
    const swaps = [
      null,
      true,
      0,
      1,
      -1,
      1.5,
      200,
      201,
      10001,
      1e12 + 1,
      '',
      'x',
      'x'.repeat(80),
      'x'.repeat(81),
      'x'.repeat(200),
      'x'.repeat(201),
      'x'.repeat(601),
      '🏰'.repeat(80),
      '🏰'.repeat(81),
      'https://eurth.org/',
      'http://eurth.org/',
      '#abcdef',
      '#abcdeg',
      '2:3',
      'left',
      '2026-11-14T09:30:00Z',
      '2026-02-30T09:30:00Z',
      '2026-11-14T09:30:00',
      [],
      ['x'],
      [1],
      [{}],
      Array(201).fill('x'),
      {},
      { name: 'x' },
      { name: 'x', seats: 1, year: 1, title: 'x' }
    ];

    /** @param {any} value @returns {(string | number)[][]} */
    const pathsOf = (value) => {
      /** @type {(string | number)[][]} */
      const paths = [];
      /** @param {any} node @param {(string | number)[]} path */
      const walk = (node, path) => {
        if (path.length) paths.push(path);
        if (Array.isArray(node)) node.forEach((item, index) => walk(item, [...path, index]));
        else if (typeof node === 'object' && node !== null) {
          for (const key of Object.keys(node)) walk(node[key], [...path, key]);
        }
      };
      walk(value, []);
      return paths;
    };

    let compared = 0;
    let turnedAway = 0;
    for (const { name } of examples) {
      const original = example(name.replace('.eurth.json', ''));
      for (const path of pathsOf(original)) {
        const last = /** @type {string | number} */ (path.at(-1));
        // Each swap, and then the key taken away altogether.
        for (const swap of [...swaps, undefined]) {
          const copy = structuredClone(original);
          let parent = copy;
          for (const step of path.slice(0, -1)) parent = parent[step];
          if (swap === undefined) {
            if (Array.isArray(parent)) parent.splice(Number(last), 1);
            else delete parent[last];
          } else {
            parent[last] = structuredClone(swap);
          }
          const ours = validateSchema(copy).length === 0;
          const theirs = ajvAccepts(copy);
          if (ours !== theirs) {
            throw new Error(
              `${name}: with ${path.join('.')} set to ${JSON.stringify(swap)?.slice(0, 60)}, the checker says ${ours} and Ajv says ${theirs}`
            );
          }
          compared++;
          if (!ours) turnedAway++;
        }
      }
    }
    expect(compared).toBeGreaterThan(5000);
    expect(turnedAway).toBeGreaterThan(1000);
    expect(compared - turnedAway).toBeGreaterThan(100);
  }, 60_000);
});

describe('validateProfile', () => {
  it('accepts a profile with only meta and one section', () => {
    const profile = {
      meta: { schema: 1, nation: 'Hesperwick', updated: '2026-11-02T18:40:12.000Z' },
      flag: { ratio: '3:5' }
    };
    const result = validateProfile(profile);
    expect(result).toEqual({ ok: true, profile });
    expect(result.ok && result.profile).toBe(profile);
  });

  it('writes messages for people', () => {
    const meta = { schema: 1, nation: 'Calderwyn', updated: '2026-11-13T21:05:44.000Z' };
    expect(messages({ meta, identity: { capital: 'c'.repeat(81) } })).toEqual([
      'identity.capital should be text of at most 80 characters.'
    ]);
    expect(messages({ meta, identity: { capital: 12 } })).toEqual([
      'identity.capital should be text of at most 80 characters.'
    ]);
    expect(messages({ meta, stats: { population: -4 } })).toEqual([
      'stats.population should be a whole number between 0 and 1,000,000,000,000.'
    ]);
    expect(messages({ meta, cities: { urbanisation: 140 } })).toEqual([
      'cities.urbanisation should be a number between 0 and 100.'
    ]);
    expect(messages({ meta, cities: { largestShare: 140, exponent: 4 } })).toEqual([
      'cities.largestShare should be a number between 0 and 100.',
      'cities.exponent should be a number between 0 and 3.'
    ]);
    expect(messages({ meta, cities: { list: [{ name: 'Wynmere' }, { name: 'Tarrowby', capital: 'no' }] } })).toEqual([
      'cities.list[1].capital should be true or false.'
    ]);
    expect(messages({ meta, cities: { list: [{ population: 3 }] } })).toEqual(['cities.list[0].name is missing.']);
    expect(messages({ meta, identity: { languages: Array(21).fill('Eskish') } })).toEqual([
      'identity.languages should be a list of at most 20 items.'
    ]);
    expect(messages({ meta, identity: { languages: [''] } })).toEqual([
      'identity.languages[0] should be text of 1 to 80 characters.'
    ]);
    expect(messages({ meta, flag: { ratio: 'wide' } })).toEqual(['flag.ratio should be text like "2:3".']);
    expect(messages({ meta, flag: { colours: ['#fff'] } })).toEqual(['flag.colours[0] should be text like "#2698d4".']);
    expect(messages({ meta, flag: { link: 'http://flag.eurth.org/' } })).toEqual([
      'flag.link should be text like "https://flag.eurth.org/" of at most 4,000 characters.'
    ]);
    expect(messages({ meta, flag: { updated: 'last week' } })).toEqual([
      'flag.updated should be a date and time such as "2026-11-14T09:30:00Z".'
    ]);
    expect(messages({ meta, wiki: { drivesOn: 'middle' } })).toEqual(['wiki.drivesOn should be "left" or "right".']);
    expect(messages({ meta, flag: [] })).toEqual(['flag should be a JSON object.']);
    expect(messages({ meta: { nation: 'Calderwyn' } })).toEqual(['meta.schema is missing.', 'meta.updated is missing.']);
    expect(messages({})).toEqual(['meta is missing.']);
    expect(messages([])).toEqual(['The profile should be a JSON object with a "meta" section.']);
    expect(messages(null)).toEqual(['The profile should be a JSON object with a "meta" section.']);
    expect(messages({ meta: { ...meta, schema: 0 } })).toEqual(['meta.schema should be 1.']);
  });

  it('gives the path of each problem, and lists several at once', () => {
    const result = validateProfile({
      meta: { schema: 1, nation: 'Calderwyn', updated: '2026-11-13T21:05:44.000Z' },
      identity: { capital: 5, motto: 6 },
      seats: { parties: [{ name: 'Lantern Party', seats: 'many' }] }
    });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.map((error) => error.path)).toEqual([
      'identity.capital',
      'identity.motto',
      'seats.parties[0].seats'
    ]);
  });

  it('asks to update the tool when the file is from a newer format', () => {
    const result = validateProfile({
      meta: { schema: 2, nation: 'Calderwyn', updated: '2026-11-13T21:05:44.000Z' },
      flag: { ratio: ['a shape this version has never seen'] }
    });
    expect(result).toEqual({
      ok: false,
      errors: [
        {
          path: 'meta.schema',
          message:
            'This profile uses a newer format (schema 2) than this tool understands (schema 1). Please update the tool, or reload the page to get its latest version, then try again.'
        }
      ]
    });
  });

  it('stops listing problems after twenty', () => {
    const result = validateProfile({
      meta: { schema: 1, nation: 'Calderwyn', updated: '2026-11-13T21:05:44.000Z' },
      names: { places: Array(150).fill(7) }
    });
    expect(!result.ok && result.errors.length).toBe(21);
    expect(!result.ok && result.errors.at(-1)?.message).toBe('There are more problems; these are the first 20.');
  });

  it('does not look inside a list that is too long', () => {
    const result = validateProfile({
      meta: { schema: 1, nation: 'Calderwyn', updated: '2026-11-13T21:05:44.000Z' },
      names: { places: Array(100000).fill(7) }
    });
    expect(!result.ok && result.errors).toEqual([
      { path: 'names.places', message: 'names.places should be a list of at most 200 items.' }
    ]);
  });

  it('turns away values nested too deeply, in known and unknown keys alike', () => {
    const meta = { schema: 1, nation: 'Calderwyn', updated: '2026-11-13T21:05:44.000Z' };
    /** @param {number} levels @returns {unknown} */
    const nest = (levels) => {
      /** @type {unknown} */
      let value = 'bottom';
      for (let i = 0; i < levels; i++) value = i % 2 ? [value] : { deeper: value };
      return value;
    };
    // The profile itself is level 0 and the unknown key's value is level 1.
    expect(validateProfile({ meta, burrow: nest(MAX_DEPTH - 1) }).ok).toBe(true);
    expect(messages({ meta, burrow: nest(MAX_DEPTH) })).toEqual([
      `The profile is nested too deeply. A profile goes at most ${MAX_DEPTH} levels deep.`
    ]);
    expect(messages({ meta, burrow: nest(50000) })).toHaveLength(1);

    /** @type {Record<string, unknown>} */
    const loop = { meta };
    loop.self = loop;
    expect(messages(loop)).toHaveLength(1);
  });

  it('turns away a key named __proto__ wherever it is', () => {
    const texts = [
      '{"meta":{"schema":1,"nation":"Calderwyn","updated":"2026-11-13T21:05:44.000Z"},"__proto__":{"polluted":true}}',
      '{"meta":{"schema":1,"nation":"Calderwyn","updated":"2026-11-13T21:05:44.000Z","__proto__":{"polluted":true}}}',
      '{"meta":{"schema":1,"nation":"Calderwyn","updated":"2026-11-13T21:05:44.000Z"},"flag":{"__proto__":{"polluted":true}}}',
      '{"meta":{"schema":1,"nation":"Calderwyn","updated":"2026-11-13T21:05:44.000Z"},"weather":[{"a":{"__proto__":{"polluted":true}}}]}'
    ];
    for (const text of texts) {
      expect(messages(JSON.parse(text))).toEqual([
        'The profile has a key named "__proto__", which Eurth tools do not accept.'
      ]);
    }
    expect(/** @type {any} */ ({}).polluted).toBeUndefined();
  });

  it('does not change what it checks', () => {
    const before = JSON.stringify(example('calderwyn'));
    const profile = example('calderwyn');
    validateProfile(profile);
    expect(JSON.stringify(profile)).toBe(before);
  });
});
