# Eurth profile

This repository is `@eurth/profile`: the JSON Schema, types and small library for the Eurth nation profile, one versioned JSON file (`<nation>.eurth.json`) passed between Eurth's worldbuilding tools. Each tool is a static Astro and Svelte 5 site on its own subdomain of eurth.org. Tools install this package straight from GitHub (`github:eurth-org/eurth-profile#semver:^1`).

Ask Stijn before spending money.

## The rules

- **Each tool writes its own section and nothing else.** Every other key comes out exactly as it went in, including keys this version doesn't know. `identity` belongs to Wiki, and Card may edit it. Any other tool that starts a profile sets only `meta.nation`. The rules are data in `SECTION_OWNERS`; keep the README in step.
- **`meta` is the only required section.** A profile with `meta` and one section is valid.
- **Sections stay small.** Three shared optional fields (`link`, `summary`, `updated`) and at most about six typed fields, all optional. A tool's whole state lives in `link`, not in the profile.
- **Unknown keys are kept; known keys are checked strictly.** `additionalProperties: true` at the top level and in every object. Every property has a `description`.
- **Within 1.x, only add.** New optional fields and sections are fine. Removing, renaming, tightening a limit or adding a value to an `enum` breaks older tools and waits for schema 2. The three files in `examples/` are frozen: they must always validate, and are never edited to make a test pass.
- **A loaded file is someone else's input.** Cap everything: file 2 MB, SVG 512 KB, texts, numbers, lists (200 items at most), nesting. Look up keys with `Object.hasOwn`, never copy with `Object.assign` or `target[key] = value` where `key` comes from a file.
- **Never trust SVG.** It is shown through an `<img>` with `svgDataUrl`, never put into a page as markup. Text is plain text.
- **Nothing stored, nothing sent.** No localStorage, sessionStorage, IndexedDB, cookies or network requests. "Save" means a download.
- **Strict content security policy:** `script-src 'self'`, no `unsafe-eval`. So no Ajv at run time: `src/validate.js` interprets the schema for the keywords it uses, and the schema stays the single source. A new keyword in the schema needs support in the checker and an entry in `SUPPORTED_KEYWORDS`. Ajv is for the tests, which hold the checker to Ajv's verdict.
- **No run-time dependencies.** Svelte 5 is an optional peer, for `ProfileButtons.svelte` only.
- **No styling in `ProfileButtons.svelte`:** the `eu-btn` class comes from the suite's stylesheet.
- **No links to GitHub in anything a person sees in a tool.** The README is fine.

## How it is built

- `schema/eurth-profile.schema.json` is the source for sections, fields and limits.
- `src/` is plain ES modules with JSDoc types. Tools load it untranspiled from `node_modules`, so no TypeScript syntax and no JSON imports there.
- `dist/` is built and committed, because there is no build step on install: `npm run build` writes the types and `schema.js` from the schema and the declarations from `src/`. Build and commit `dist/` with every change to the schema or a type. A test and the CI fail otherwise.
- Functions never change their arguments. A changed profile is a new object that shares the untouched sections.
- `npm run check`, `npm run build` and `npm test` must all pass.

## Words

British English in prose, messages and docs. Sentence case headings. A plain, warm staff voice. Error messages are full sentences for the person using a tool, with no jokes. No emoji.

## Housekeeping

- `roadmap.md` has three parts: "Next", one dated section per release (newest first), and "Not planned" with reasons. Add a feature to it in the commit that adds the feature, and add the release section before tagging.
- `docs/feedback-log.md` records what was asked for and what was done.
- Releasing is described in the README.
