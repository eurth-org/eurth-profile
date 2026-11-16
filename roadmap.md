# Roadmap

The Eurth profile is one small JSON file, `<nation>.eurth.json`, that carries a nation from one Eurth worldbuilding tool to the next. This package, `@eurth/profile`, is the schema, the types and the library the tools share to read, check, change, merge, save and load it.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Next

- **Tag `v1.0.0`,** so that `#semver:^1` has something to find. Until then tools can't install the package by version.
- **Put the schema at its address:** `https://style.eurth.org/schemas/eurth-profile-1.json` is the schema's `$id`, and nothing is served there yet.
- **Flagwright and Governmint first:** both exist already. Each gets the two profile buttons, writes its own section and reads `identity`.
- **Settle each section with its tool:** the fields of the tools that are still mock-ups (arms, seats, names, stats, dynasty, calendar, timeline, bank, passport, rank, cities, anthem, wiki) were drafted from those mock-ups. As each tool is built, add what it turns out to need. Adding a field is a minor release; changing one is not possible within 1.x, so keep drafts small.
- **A "what changed" helper** for tools that want to tell the person which sections a loaded file brought in.
- **A type check of `ProfileButtons.svelte` in CI** (`svelte-check`); for now a test mounts it.

## Not yet released: 1.1.0

- **`anthem` gains `metre`, `rhyme`, `mood` and `themes`:** the hymn metre as printed ("8.7.8.7"), the rhyme scheme ("ABAB"), the mood and what the anthem sings of, so Wiki and Card can say what kind of anthem it is without opening Anthem's link. All optional; nothing existing changes.

## 15 November 2026: 1.0.1

- **A plainer message for the wrong file:** a JSON file with no `meta` section is answered with "This file isn't a nation profile…" and what to pick, where it used to say "meta is missing."

## 14 November 2026: 1.0.0

The first version.

- **The format:** schema 1, as JSON Schema (draft 2020-12). `meta` plus sixteen optional sections: identity, flag, arms, government, seats, names, stats, dynasty, calendar, timeline, bank, passport, rank, cities, anthem and wiki. Every section shares `link`, `summary` and `updated`, and has at most six typed fields of its own, all optional.
- **Unknown keys kept everywhere,** at the top level and inside every section, so later 1.x releases can add fields without breaking older tools.
- **Ownership as data:** `SECTION_OWNERS` says which tool may write which section.
- **Checking without Ajv:** a small checker that reads the schema itself and runs under a strict content security policy, with messages written for people. The tests hold it to Ajv's verdict.
- **Limits for hostile files:** 2 MB a file, 512 KB an SVG, capped texts, numbers and lists, 32 levels of nesting, and no `__proto__` keys.
- **The library:** `createProfile`, `validateProfile`, `parseProfile`, `getSection`, `setSection`, `removeSection`, `setNation`, `mergeProfiles`, `serialiseProfile`, `profileFileName` and `svgDataUrl`.
- **In the browser:** `downloadProfile`, `pickProfile`, `readProfileFile` and `profileDrop`, and `ProfileButtons.svelte` with "Load profile" and "Save profile".
- **Types** generated from the schema, and declarations for the library, committed in `dist/` so tools can install straight from the repository.
- **Three example profiles,** frozen: Hesperwick (minimal), Vantmoor (mid-sized) and Calderwyn (every section).

## Not planned

- **Browser storage.** No local storage, session storage, IndexedDB or cookies, here or in the tools. The suite's promise is that nothing is kept; the file on your own device is the save.
- **Accounts, sync or a server.** There is nowhere to send a profile and no one to send it as. Sharing a nation means sharing the file.
- **Network requests.** The package never fetches anything, not even its own schema.
- **Ajv, or any other dependency, at run time.** Ajv needs `unsafe-eval`, which the tools' content security policy forbids, and a format this small doesn't need a dependency to check it. Ajv stays in the tests as a second opinion.
- **A tool's whole design in the profile.** That lives in the section's `link`. Sections stay small enough to read at a glance.
- **Cleaning SVG so it can be inlined.** Sanitisers are large and are bypassed sooner or later. Profile SVG goes in an `<img>`, where the browser runs none of it.
- **Colours, fonts or spacing in `ProfileButtons.svelte`.** The look belongs to the suite's stylesheet.
- **Publishing to the npm registry,** for now. Tools install from the repository; a registry release can come later if someone outside the suite wants it.
