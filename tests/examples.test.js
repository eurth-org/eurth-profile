import { describe, expect, it } from 'vitest';
import {
  SECTIONS,
  parseProfile,
  profileFileName,
  serialiseProfile,
  svgDataUrl,
  validateProfile
} from '../src/index.js';
import { ajvAccepts } from './helpers/ajv.js';
import { examples } from './helpers/files.js';

// The examples are frozen fixtures: tools test against them, and no 1.x
// release may ever turn one away. If a test here fails, the change that made
// it fail is a breaking change. Do not edit the examples to make it pass.

describe('the examples', () => {
  it('are three, of different sizes', () => {
    expect(examples.map((entry) => entry.name)).toEqual([
      'calderwyn.eurth.json',
      'hesperwick.eurth.json',
      'vantmoor.eurth.json'
    ]);
    const sections = Object.fromEntries(
      examples.map(({ name, profile }) => [name, Object.keys(profile).filter((key) => key !== 'meta')])
    );
    expect(sections['hesperwick.eurth.json']).toEqual(['flag']);
    expect(sections['vantmoor.eurth.json']).toEqual(['identity', 'flag', 'government', 'stats', 'cities']);
    expect(sections['calderwyn.eurth.json']).toEqual([...SECTIONS]);
  });

  it.each(examples)('$name is a valid profile', ({ profile, text }) => {
    expect(validateProfile(profile)).toEqual({ ok: true, profile });
    expect(parseProfile(text)).toEqual({ ok: true, profile });
    expect(ajvAccepts(profile)).toBe(true);
  });

  it.each(examples)('$name is written the way serialiseProfile writes', ({ profile, text }) => {
    expect(serialiseProfile(profile)).toBe(text);
  });

  it.each(examples)('$name is named after its nation', ({ name, profile }) => {
    expect(profileFileName(profile)).toBe(name);
  });

  it.each(examples)('$name has only known sections, each dated', ({ profile }) => {
    for (const [key, section] of Object.entries(profile)) {
      if (key === 'meta') continue;
      expect(SECTIONS).toContain(key);
      expect(Date.parse(section.updated), key).not.toBeNaN();
      expect(Date.parse(section.updated), key).toBeLessThanOrEqual(Date.parse(profile.meta.updated));
    }
  });

  it('have SVGs that can be shown through an <img>', () => {
    const svgs = examples.flatMap(({ profile }) => [profile.flag?.svg, profile.arms?.svg]).filter(Boolean);
    expect(svgs.length).toBe(3);
    for (const svg of svgs) {
      expect(svgDataUrl(svg)).toMatch(/^data:image\/svg\+xml;charset=utf-8,%3Csvg/);
      expect(svg).not.toMatch(/<script|on\w+=|href=/i);
    }
  });
});
