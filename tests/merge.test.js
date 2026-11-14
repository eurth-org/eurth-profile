import { describe, expect, it } from 'vitest';
import { mergeProfiles, serialiseProfile, validateProfile } from '../src/index.js';
import { deepFreeze, example } from './helpers/files.js';

const OLD = '2026-01-01T00:00:00.000Z';
const MID = '2026-06-01T00:00:00.000Z';
const NEW = '2026-11-01T00:00:00.000Z';

/**
 * @param {string} nation
 * @param {string} updated
 * @param {Record<string, unknown>} [sections]
 * @returns {any}
 */
const profile = (nation, updated, sections = {}) =>
  deepFreeze({ meta: { schema: 1, nation, updated }, ...sections });

describe('mergeProfiles', () => {
  it('keeps every section of both', () => {
    const base = profile('Calderwyn', OLD, { flag: { ratio: '2:3', updated: OLD } });
    const incoming = profile('Calderwyn', MID, { anthem: { title: 'Lanterns on the Water', updated: MID } });
    const merged = mergeProfiles(base, incoming);

    expect(Object.keys(merged)).toEqual(['meta', 'flag', 'anthem']);
    expect(merged.flag).toBe(base.flag);
    expect(merged.anthem).toBe(incoming.anthem);
    expect(validateProfile(merged).ok).toBe(true);
  });

  it('takes the newer section where both have one', () => {
    const base = profile('Calderwyn', NEW, {
      flag: { ratio: '2:3', updated: NEW },
      stats: { population: 1, updated: OLD }
    });
    const incoming = profile('Calderwyn', MID, {
      flag: { ratio: '1:2', updated: MID },
      stats: { population: 2, updated: MID }
    });
    const merged = mergeProfiles(base, incoming);

    expect(merged.flag).toBe(base.flag);
    expect(merged.stats).toBe(incoming.stats);
  });

  it('compares moments, not text: time zones are taken into account', () => {
    const base = profile('Calderwyn', OLD, { flag: { ratio: '2:3', updated: '2026-06-01T10:00:00+02:00' } });
    const incoming = profile('Calderwyn', OLD, { flag: { ratio: '1:2', updated: '2026-06-01T09:00:00Z' } });
    // 10:00 at +02:00 is 08:00 UTC, so the incoming section is the newer one.
    expect(mergeProfiles(base, incoming).flag).toBe(incoming.flag);
    expect(mergeProfiles(incoming, base).flag).toBe(incoming.flag);
  });

  it('counts a section without a date as oldest', () => {
    const dated = profile('Calderwyn', OLD, { flag: { ratio: '2:3', updated: OLD } });
    const undated = profile('Calderwyn', NEW, { flag: { ratio: '1:2' } });
    expect(mergeProfiles(dated, undated).flag).toBe(dated.flag);
    expect(mergeProfiles(undated, dated).flag).toBe(dated.flag);
  });

  it('gives a tie to the incoming profile', () => {
    const base = profile('Calderwyn', OLD, { flag: { ratio: '2:3', updated: MID }, arms: { blazon: 'Azure' } });
    const incoming = profile('Calderwyn', OLD, { flag: { ratio: '1:2', updated: MID }, arms: { blazon: 'Gules' } });
    const merged = mergeProfiles(base, incoming);
    expect(merged.flag).toBe(incoming.flag);
    expect(merged.arms).toBe(incoming.arms);
  });

  it('can prefer the incoming profile or the base outright', () => {
    const base = profile('Calderwyn', NEW, { flag: { ratio: '2:3', updated: NEW }, arms: { blazon: 'Azure', updated: OLD } });
    const incoming = profile('Calderwyn', MID, { flag: { ratio: '1:2', updated: MID }, arms: { blazon: 'Gules', updated: MID }, anthem: { title: 'West Wind' } });

    const theirs = mergeProfiles(base, incoming, { prefer: 'incoming' });
    expect(theirs.flag).toBe(incoming.flag);
    expect(theirs.arms).toBe(incoming.arms);
    expect(theirs.anthem).toBe(incoming.anthem);

    const ours = mergeProfiles(base, incoming, { prefer: 'base' });
    expect(ours.flag).toBe(base.flag);
    expect(ours.arms).toBe(base.arms);
    expect(ours.anthem).toBe(incoming.anthem);

    expect(() => mergeProfiles(base, incoming, { prefer: /** @type {any} */ ('latest') })).toThrow(TypeError);
  });

  it('can take only some sections from the incoming profile', () => {
    const base = profile('Calderwyn', OLD, { flag: { ratio: '2:3', updated: OLD } });
    const incoming = profile('Calderwyn', MID, {
      flag: { ratio: '1:2', updated: MID },
      arms: { blazon: 'Gules', updated: MID },
      anthem: { title: 'West Wind', updated: MID }
    });

    const merged = mergeProfiles(base, incoming, { sections: ['arms'] });
    expect(Object.keys(merged)).toEqual(['meta', 'flag', 'arms']);
    expect(merged.flag).toBe(base.flag);
    expect(merged.arms).toBe(incoming.arms);

    expect(mergeProfiles(base, incoming, { sections: [] })).toEqual({ ...base, meta: { ...base.meta, updated: MID } });
    expect(mergeProfiles(base, incoming, { sections: ['flag'], prefer: 'base' }).flag).toBe(base.flag);
  });

  it('treats sections it does not know by the same rule', () => {
    const base = profile('Calderwyn', OLD, {
      weather: { climate: 'Oceanic', updated: NEW },
      folklore: { tales: 3, updated: OLD },
      note: 'from the base'
    });
    const incoming = profile('Calderwyn', OLD, {
      weather: { climate: 'Alpine', updated: MID },
      folklore: { tales: 9, updated: MID },
      note: 'from the incoming file',
      transport: { gauge: 1435 }
    });
    const merged = mergeProfiles(base, incoming);

    expect(merged.weather).toBe(base.weather);
    expect(merged.folklore).toBe(incoming.folklore);
    // Neither has a date, so it is a tie, and a tie goes to the incoming profile.
    expect(merged.note).toBe('from the incoming file');
    expect(merged.transport).toBe(incoming.transport);
    expect(Object.keys(merged)).toEqual(['meta', 'weather', 'folklore', 'note', 'transport']);
  });

  it('keeps the base nation name unless it is empty', () => {
    expect(mergeProfiles(profile('Calderwyn', OLD), profile('Calderwin', NEW)).meta.nation).toBe('Calderwyn');
    expect(mergeProfiles(profile('', OLD), profile('Calderwyn', NEW)).meta.nation).toBe('Calderwyn');
    expect(mergeProfiles(profile('   ', OLD), profile('Calderwyn', NEW)).meta.nation).toBe('Calderwyn');
    expect(mergeProfiles(profile('', OLD), profile('', NEW)).meta.nation).toBe('');
  });

  it('dates meta by the later of the two, and keeps what else is in meta', () => {
    const base = deepFreeze({ meta: { schema: 1, nation: 'Calderwyn', updated: MID, madeWith: 'flag 1.7' } });
    const incoming = deepFreeze({ meta: { schema: 1, nation: 'Calderwyn', updated: NEW, madeWith: 'arms 2.0', locale: 'en-GB' } });

    expect(mergeProfiles(base, incoming).meta).toEqual({
      schema: 1,
      nation: 'Calderwyn',
      updated: NEW,
      madeWith: 'flag 1.7',
      locale: 'en-GB'
    });
    expect(mergeProfiles(incoming, base).meta.updated).toBe(NEW);
    expect(mergeProfiles(incoming, base).meta.madeWith).toBe('arms 2.0');
  });

  it('changes neither profile', () => {
    const base = example('vantmoor');
    const incoming = example('calderwyn');
    const baseBefore = serialiseProfile(base);
    const incomingBefore = serialiseProfile(incoming);
    const merged = mergeProfiles(deepFreeze(base), deepFreeze(incoming));

    expect(serialiseProfile(base)).toBe(baseBefore);
    expect(serialiseProfile(incoming)).toBe(incomingBefore);
    expect(merged.meta.nation).toBe('Vantmoor');
    expect(merged.meta.updated).toBe(incoming.meta.updated);
    expect(validateProfile(merged).ok).toBe(true);
    // Vantmoor's sections first, in its order, then what only Calderwyn has.
    expect(Object.keys(merged).slice(0, 6)).toEqual(Object.keys(base));
    expect(Object.keys(merged)).toHaveLength(Object.keys(incoming).length);
  });

  it('merging a profile with itself changes nothing', () => {
    const one = deepFreeze(example('calderwyn'));
    expect(serialiseProfile(mergeProfiles(one, one))).toBe(serialiseProfile(one));
  });

  it('is not fooled by a __proto__ key in a file that was never checked', () => {
    const base = JSON.parse('{"meta":{"schema":1,"nation":"x","updated":"2026-01-01T00:00:00Z"}}');
    const incoming = JSON.parse(
      '{"meta":{"schema":1,"nation":"x","updated":"2026-01-01T00:00:00Z","__proto__":{"polluted":1}},"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":1}}}'
    );
    const merged = mergeProfiles(base, incoming);

    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(merged.meta)).toBe(Object.prototype);
    expect(/** @type {any} */ (merged).polluted).toBeUndefined();
    expect(/** @type {any} */ (merged.meta).polluted).toBeUndefined();
    expect(/** @type {any} */ ({}).polluted).toBeUndefined();
    expect(Object.hasOwn(merged, 'constructor')).toBe(true);
  });
});
