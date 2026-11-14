// Builds dist/ from the schema and the JSDoc types in src/.
//
//   node tools/build.js           writes dist/
//   node tools/build.js <folder>  writes the same files to another folder,
//                                 so a test can compare them with dist/
//
// dist/ is committed: tools install this package straight from GitHub, with
// no build step on their side. Run this after every change to the schema or
// to a JSDoc type, and commit the result.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'json-schema-to-typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, process.argv[2] ?? 'dist');
const schemaPath = join(root, 'schema', 'eurth-profile.schema.json');
const schemaText = readFileSync(schemaPath, 'utf8');
const schema = JSON.parse(schemaText);

const banner =
  '// Generated from schema/eurth-profile.schema.json by `npm run build`.\n// Do not edit by hand: change the schema, then build again.';

mkdirSync(outDir, { recursive: true });

// 1. The profile's types, from the schema.
const types = await compile(schema, 'EurthProfile', {
  bannerComment: banner,
  additionalProperties: true,
  ignoreMinAndMaxItems: true,
  cwd: join(root, 'schema'),
  style: { singleQuote: true, printWidth: 100 }
});
writeFileSync(join(outDir, 'types.d.ts'), types);

// 2. The schema as a JavaScript module, so that browsers, bundlers and Node
//    all load it the same way, with no JSON import to trip over.
writeFileSync(
  join(outDir, 'schema.js'),
  `${banner}\n\nexport default ${JSON.stringify(schema, null, 2)};\n`
);
writeFileSync(
  join(outDir, 'schema.d.ts'),
  `${banner}\n\n/** The Eurth profile JSON Schema (draft 2020-12), as a plain object. */\ndeclare const schema: { readonly [keyword: string]: unknown };\nexport default schema;\n`
);

// 3. Declarations for the JavaScript in src/, from its JSDoc.
execFileSync(
  process.execPath,
  [
    join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
    '-p',
    join(root, 'tsconfig.build.json'),
    '--outDir',
    outDir
  ],
  { cwd: root, stdio: 'inherit' }
);

// 4. In src/ the types are '../dist/types.js'; from inside dist/ they are next door.
for (const name of readdirSync(outDir)) {
  if (!name.endsWith('.d.ts')) continue;
  const file = join(outDir, name);
  const text = readFileSync(file, 'utf8');
  const tidy = text.replaceAll('../dist/types.js', './types.js');
  if (tidy !== text) writeFileSync(file, tidy);
}
