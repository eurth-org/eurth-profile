import { describe, expect, it } from 'vitest';
import { MAX_SVG_LENGTH, svgDataUrl } from '../src/index.js';

const PREFIX = 'data:image/svg+xml;charset=utf-8,';

describe('svgDataUrl', () => {
  it('gives a data address that holds the SVG unchanged', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#123a5a"/></svg>';
    const url = svgDataUrl(svg);
    expect(url.startsWith(PREFIX)).toBe(true);
    expect(decodeURIComponent(url.slice(PREFIX.length))).toBe(svg);
  });

  it('leaves nothing in the address that could end an attribute or a CSS url()', () => {
    const svg = `<svg onload="alert('x')"><text>"quotes" 'single' (brackets) <b> & é ☃ 🏰 \n\t</text><script>alert(1)</script></svg>`;
    const url = svgDataUrl(svg);
    expect(url.slice(PREFIX.length)).toMatch(/^[A-Za-z0-9\-_.!~*%]+$/);
    expect(url).not.toMatch(/["'<>()\s]/);
    expect(decodeURIComponent(url.slice(PREFIX.length))).toBe(svg);
  });

  it('gives an empty text when there is nothing usable', () => {
    for (const odd of [undefined, null, '', 5, {}, [], true, 'hello', '<html></html>', '<svgx></svgx>']) {
      expect(svgDataUrl(odd), String(odd)).toBe('');
    }
  });

  it('turns away an SVG over 512 KB', () => {
    const fits = `<svg>${'x'.repeat(MAX_SVG_LENGTH - 11)}</svg>`;
    expect(fits).toHaveLength(MAX_SVG_LENGTH);
    expect(svgDataUrl(fits)).not.toBe('');
    expect(svgDataUrl(`${fits} `)).toBe('');
  });

  it('gives an empty text for a broken character instead of throwing', () => {
    expect(svgDataUrl('<svg>\uD83C</svg>')).toBe('');
  });

  it('accepts an SVG that starts with an XML declaration or a comment', () => {
    expect(svgDataUrl('<?xml version="1.0"?>\n<!-- flag -->\n<SVG viewBox="0 0 1 1"></SVG>')).not.toBe('');
  });
});
