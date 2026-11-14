import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fromRoot } from './helpers/paths.js';

// dist/ is committed, because tools install this package straight from
// GitHub with no build step. This test builds again into a scratch folder and
// fails if the result differs from what is committed: run `npm run build`
// and commit dist/ with the change.

describe('dist/', () => {
  it('is what `npm run build` makes from the schema and src/', () => {
    const fresh = fromRoot('node_modules', '.cache', 'eurth-profile-build');
    rmSync(fresh, { recursive: true, force: true });
    execFileSync(process.execPath, [fromRoot('tools', 'build.js'), fresh], { cwd: fromRoot(), stdio: 'pipe' });

    const committed = readdirSync(fromRoot('dist')).sort();
    expect(readdirSync(fresh).sort()).toEqual(committed);
    for (const name of committed) {
      expect(readFileSync(fromRoot('dist', name), 'utf8'), `dist/${name} is out of date`).toBe(
        readFileSync(`${fresh}/${name}`, 'utf8')
      );
    }
    rmSync(fresh, { recursive: true, force: true });
  }, 120_000);

  it('has the types the package points to', () => {
    const files = readdirSync(fromRoot('dist'));
    for (const name of ['index.d.ts', 'types.d.ts', 'schema.js', 'schema.d.ts']) {
      expect(files).toContain(name);
    }
    const types = readFileSync(fromRoot('dist', 'types.d.ts'), 'utf8');
    for (const name of ['EurthProfile', 'Meta', 'Identity', 'Flag', 'Government', 'Cities', 'Wiki']) {
      expect(types).toContain(`export interface ${name} {`);
    }
    // Declarations point to their neighbours, not back out of dist/.
    for (const name of files.filter((file) => file.endsWith('.d.ts'))) {
      expect(readFileSync(fromRoot('dist', name), 'utf8'), name).not.toContain('../');
    }
  });
});
