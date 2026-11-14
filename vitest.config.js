import { compile } from 'svelte/compiler';
import { defineConfig } from 'vitest/config';

// Compiles ProfileButtons.svelte for the one test that mounts it. Svelte's own
// compiler is all it takes, so the tests need no Svelte plugin for Vite.
const svelteForTests = {
  name: 'svelte-for-tests',
  /**
   * @param {string} code
   * @param {string} id
   */
  transform(code, id) {
    if (!id.endsWith('.svelte')) return null;
    const { js } = compile(code, { filename: id, generate: 'client' });
    return { code: js.code, map: js.map };
  }
};

export default defineConfig({
  plugins: [svelteForTests],
  // Svelte's browser build, so the component can be mounted under jsdom.
  resolve: { conditions: ['browser'] },
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node'
  }
});
