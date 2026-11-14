import { describe, expect, it } from 'vitest';
import builtSchema from '../dist/schema.js';
import { SECTIONS, SECTION_OWNERS, MAX_SVG_LENGTH } from '../src/index.js';
import { ANNOTATION_KEYWORDS, SUPPORTED_FORMATS, SUPPORTED_KEYWORDS } from '../src/validate.js';
import { schema } from './helpers/ajv.js';

/**
 * @param {any} node
 * @returns {any} The node with a `$ref` followed, and the node's own keys laid over it.
 */
function resolved(node) {
  if (typeof node.$ref !== 'string') return node;
  const target = schema.$defs[node.$ref.replace('#/$defs/', '')];
  return { ...target, ...node };
}

/**
 * Every object-shaped part of the schema, with the path to it.
 * @returns {{ path: string, node: any }[]}
 */
function everyNode() {
  /** @type {{ path: string, node: any }[]} */
  const found = [];
  /** @param {any} node @param {string} path */
  const walk = (node, path) => {
    found.push({ path, node });
    for (const [key, child] of Object.entries(node.properties ?? {})) walk(child, `${path}.${key}`);
    if (node.items) walk(node.items, `${path}[]`);
  };
  walk(schema, 'profile');
  for (const [name, node] of Object.entries(schema.$defs)) walk(node, `$defs.${name}`);
  return found;
}

describe('the schema', () => {
  it('is draft 2020-12 with the agreed address', () => {
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toBe('https://style.eurth.org/schemas/eurth-profile-1.json');
  });

  it('asks for meta and nothing else', () => {
    expect(schema.required).toEqual(['meta']);
    expect(resolved(schema.properties.meta).required).toEqual(['schema', 'nation', 'updated']);
    for (const name of SECTIONS) {
      expect(resolved(schema.properties[name]).required, name).toBeUndefined();
    }
  });

  it('lists meta first and then the sections in the order of SECTIONS', () => {
    expect(Object.keys(schema.properties)).toEqual(['meta', ...SECTIONS]);
  });

  it('names an owner for every section', () => {
    expect(Object.keys(SECTION_OWNERS)).toEqual([...SECTIONS]);
    for (const name of SECTIONS) {
      expect(SECTION_OWNERS[name].length, name).toBeGreaterThan(0);
    }
    expect(SECTION_OWNERS.identity).toEqual(['wiki', 'card']);
    expect(SECTION_OWNERS.flag).toEqual(['flag']);
    expect(SECTION_OWNERS.government).toEqual(['gov']);
    expect(SECTION_OWNERS.calendar).toEqual(['cal']);
    expect(SECTION_OWNERS.timeline).toEqual(['time']);
  });

  it('keeps unknown keys everywhere: every object allows additional properties', () => {
    const objects = everyNode().filter(({ node }) => node.type === 'object');
    expect(objects.length).toBeGreaterThan(SECTIONS.length);
    for (const { path, node } of objects) {
      expect(node.additionalProperties, path).toBe(true);
    }
  });

  it('describes every property', () => {
    for (const { path, node } of everyNode()) {
      for (const [key, child] of Object.entries(node.properties ?? {})) {
        const description = resolved(child).description;
        expect(typeof description, `${path}.${key}`).toBe('string');
        expect(description.length, `${path}.${key}`).toBeGreaterThan(10);
      }
    }
  });

  it('gives every section the three shared fields and at most six of its own', () => {
    for (const name of SECTIONS) {
      const properties = resolved(schema.properties[name]).properties;
      expect(properties.link, name).toEqual({ $ref: '#/$defs/link' });
      expect(properties.summary, name).toEqual({ $ref: '#/$defs/summary' });
      expect(properties.updated, name).toEqual({ $ref: '#/$defs/updated' });
      const own = Object.keys(properties).filter((key) => !['link', 'summary', 'updated'].includes(key));
      expect(own.length, name).toBeGreaterThan(0);
      expect(own.length, name).toBeLessThanOrEqual(6);
    }
  });

  it('caps every text and every list', () => {
    for (const { path, node } of everyNode()) {
      const full = resolved(node);
      if (full.type === 'string') {
        expect(typeof full.maxLength === 'number' || typeof full.pattern === 'string', path).toBe(true);
      }
      if (full.type === 'array') {
        expect(full.maxItems, path).toBeLessThanOrEqual(200);
        expect(full.items, path).toBeDefined();
      }
      if (full.type === 'number' || full.type === 'integer') {
        expect(typeof full.minimum, path).toBe('number');
        expect(typeof full.maximum, path).toBe('number');
      }
    }
    expect(schema.$defs.link.maxLength).toBe(4000);
    expect(schema.$defs.summary.maxLength).toBe(600);
    expect(schema.$defs.svg.maxLength).toBe(MAX_SVG_LENGTH);
  });

  it('uses only keywords the checker enforces', () => {
    const known = new Set([...SUPPORTED_KEYWORDS, ...ANNOTATION_KEYWORDS]);
    for (const { path, node } of everyNode()) {
      for (const keyword of Object.keys(node)) {
        expect(known.has(keyword), `${path} uses "${keyword}"`).toBe(true);
      }
      if (node.format !== undefined) expect(SUPPORTED_FORMATS, path).toContain(node.format);
      if (node.type !== undefined) expect(typeof node.type, path).toBe('string');
      if (node.additionalProperties !== undefined) expect(node.additionalProperties, path).toBe(true);
    }
  });

  it('is the same schema in dist/schema.js', () => {
    expect(builtSchema).toEqual(schema);
  });
});
