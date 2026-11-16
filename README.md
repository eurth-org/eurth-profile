# Eurth profile

> A friendly note: this is part of Eurth's advent calendar, and the doors open from 10 December. Please don't spoil the surprise before then.

The Eurth nation profile: one small JSON file, `<nation>.eurth.json`, that carries a nation from one Eurth worldbuilding tool to the next. Each tool fills in its own section and leaves the rest exactly as it found it.

This repository holds the JSON Schema, the TypeScript types and a small library, `@eurth/profile`, to read, check, change, merge, save and load the file. What's planned and what each release added is in the [roadmap](roadmap.md).

## What it is

Eurth's tools are separate sites: a flag maker, a government builder, a calendar maker and more, each on its own address. None of them has accounts and none of them stores anything. The profile is how a nation travels between them: you save it from one tool as a file on your own device, and load it in the next.

- **One file, many sections.** `flag` belongs to Flagwright, `government` to Governmint, `calendar` to the calendar maker, and so on. A profile with `meta` and a single section is a complete, valid profile.
- **Nothing is lost.** A tool changes only its own section. Every other key comes out exactly as it went in, including keys from newer tools that it has never heard of.
- **Nothing is stored or sent.** No local storage, no cookies, no network requests. "Save" means a download; "load" means picking or dropping a file.
- **A loaded file is someone else's input.** Size, text lengths, list lengths and SVG are all capped and checked before a tool uses any of it.

## The file

```json
{
  "meta": {
    "schema": 1,
    "nation": "Hesperwick",
    "updated": "2026-11-02T18:40:12.000Z"
  },
  "flag": {
    "link": "https://flag.eurth.org/#example-hesperwick",
    "summary": "A white Nordic cross on sea green, with a gold border to the cross.",
    "updated": "2026-11-02T18:40:12.000Z",
    "ratio": "3:5",
    "colours": ["#1f6f5c", "#ffffff", "#e0b03a"]
  }
}
```

`meta` is the only required section: the format version (`schema`, always 1 for now), the nation's name, and when the file was last changed.

Every other section is optional, and every field in it is optional too. All sections share three fields:

| Field | What it holds |
| --- | --- |
| `link` | The tool's share link. Opening it brings back the full design, so a section never has to carry a tool's whole state. Https only, at most 4,000 characters. |
| `summary` | One plain-text paragraph, at most 600 characters, for tools that only want a line or two. |
| `updated` | When the owning tool last wrote the section, as an ISO 8601 date and time with a time zone. |

On top of those, each section has a few typed fields that other tools are likely to want:

| Section | Written by | Fields |
| --- | --- | --- |
| `identity` | Wiki, Card | `commonName`, `officialName`, `capital`, `demonym`, `motto`, `languages` |
| `flag` | Flagwright | `svg`, `ratio` (height to width, such as `"2:3"`), `colours` (hex codes) |
| `arms` | Arms | `svg`, `blazon` |
| `government` | Governmint | `form`, `headOfState`, `headOfGovernment`, `legislature` |
| `seats` | Seats | `chamber`, `total`, `system`, `election`, `parties` (`name`, `seats`, `colour`) |
| `names` | Names | `language`, `places`, `people`, `surnames` |
| `stats` | Stats | `population`, `areaKm2`, `gdpUsd`, `gdpGrowth`, `lifeExpectancy`, `activeMilitary` |
| `dynasty` | Dynasty | `house`, `law`, `monarch`, `heir`, `succession` |
| `calendar` | Calendar | `name`, `daysPerYear`, `months` (`name`, `days`), `weekdays`, `era` |
| `timeline` | Time | `title`, `startYear`, `endYear`, `events` (`year`, `title`) |
| `bank` | Bank | `currency`, `code`, `issuer`, `denominations` |
| `passport` | Passport | `colour` |
| `rank` | Rank | `branches`, `ranks` (`name`, `branch`) |
| `cities` | Cities | `urbanisation`, `list` (`name`, `population`, `capital`) |
| `anthem` | Anthem | `title`, `lyrics`, `metre`, `rhyme`, `mood`, `themes` |
| `wiki` | Wiki | `drivesOn` |

The full description of every field, with its limits, is in [the schema](schema/eurth-profile.schema.json) (JSON Schema, draft 2020-12).

### Unknown keys are kept

The schema allows extra keys at the top level and inside every section, and the library carries them through untouched. That is what lets a 1.x release add a field or a section without breaking a tool that was built before it. Known keys are checked strictly: `stats.population` must be a whole number, whoever wrote it.

"Untouched" means the same JSON values in the same order. Two things JavaScript itself decides: a number written as `1.0` is saved as `1`, and keys that are whole numbers (`"2026"`) come before other keys.

### Limits

A tool turns away a file that goes over any of these, with a message for the person:

- the file: 2 MB
- an SVG: 512 KB (524,288 characters)
- a list: 200 items at most, fewer for most lists
- names 80 characters, mottoes and event titles 200, summaries 600, links 4,000
- nesting: 32 levels
- a key named `__proto__`, anywhere

### Showing what a profile holds

- **SVG only ever goes in an `<img>`.** An SVG from a profile can carry scripts. Inside an `<img>` the browser draws it as a picture and runs none of it. Use `svgDataUrl(svg)` for the `src`, and never put a profile's SVG into the page as markup: no `{@html}`, no `innerHTML`, no `<object>`, `<embed>` or `<iframe>`. The tool's content security policy needs `img-src 'self' data:`.
- **Text is plain text.** Show it as text (`{summary}` in Svelte), never as markup.
- **Links are checked for https and nothing more.** A `link` may point anywhere. Show it as a link the person can see before following it, and only load a design from a link to your own tool.

## Who writes what

Each tool owns the section of its name and writes nothing else.

- Flagwright writes `flag`, Governmint writes `government`, the calendar maker (cal) writes `calendar`, Time writes `timeline`. Every other tool writes the section named after it.
- `identity` belongs to Wiki, and Card may edit it too. Every other tool reads `identity` and never writes it.
- A tool that starts a new profile sets `meta.nation` and nothing else: `createProfile(nation)`.
- Every tool keeps `meta.updated` current; `setSection` does that for you.
- Card and Prompts have no section of their own. They read.

The same rules are exported as data, with tools named by their subdomain of eurth.org:

```js
import { SECTION_OWNERS } from '@eurth/profile';

SECTION_OWNERS.identity; // ['wiki', 'card']
SECTION_OWNERS.government; // ['gov']
```

## Install

```sh
npm install github:eurth-org/eurth-profile#semver:^1
```

The package has no dependencies and no build step on install: the built files in `dist/` are committed. The source is plain JavaScript modules with types alongside, so bundlers and Vitest use it as it is. Svelte 5 is needed only for `ProfileButtons.svelte`.

## Use

In a tool (Svelte 5):

```svelte
<script lang="ts">
  import ProfileButtons from '@eurth/profile/ProfileButtons.svelte';
  import { createProfile, getSection, setSection, svgDataUrl } from '@eurth/profile';
  import type { EurthProfile, ProfileError } from '@eurth/profile';

  // A profile is replaced, never changed in place, so $state.raw is enough.
  let profile = $state.raw<EurthProfile | null>(null);
  let problems = $state.raw<ProfileError[]>([]);

  const flag = $derived(svgDataUrl(getSection(profile, 'flag')?.svg));

  function saveMyDesign(svg: string, link: string) {
    const base = profile ?? createProfile('Hesperwick');
    // Spread the old section to keep fields a newer version of this tool may have added.
    profile = setSection(base, 'arms', { ...getSection(base, 'arms'), svg, link });
  }
</script>

<ProfileButtons
  {profile}
  onload={(loaded) => { profile = loaded; problems = []; }}
  onerror={(errors) => (problems = errors)}
/>

{#if flag}<img src={flag} alt="Flag of {profile?.meta.nation}" />{/if}

{#each problems as problem}<p>{problem.message}</p>{/each}
```

`ProfileButtons` renders two buttons, "Load profile" and "Save profile", with the suite's `eu-btn` class and no styling of its own. Save is switched off until there is a profile. With `drop` (on by default) a profile file can be dropped anywhere on the window.

| Prop | |
| --- | --- |
| `profile` | The profile to save, or `null`. |
| `onload(profile)` | Called with a loaded or dropped profile, already checked. |
| `onerror(errors)` | Called with the problems when a file can't be used or a profile can't be saved. |
| `drop` | Whether the whole window takes a dropped file. Default `true`. |

## API

Everything is exported from `@eurth/profile`. No function changes what it is given; each one that changes a profile gives back a new one.

### Constants

| Name | |
| --- | --- |
| `SCHEMA_VERSION` | `1` |
| `SECTIONS` | The sixteen section names, in the order they are written. `meta` is not in the list: it is always first. |
| `SECTION_OWNERS` | For each section, the tools that may write it. |
| `MAX_FILE_BYTES` | 2 MB |
| `MAX_SVG_LENGTH` | 524,288 characters |
| `MAX_DEPTH` | 32 |
| `FILE_EXTENSION` | `'.eurth.json'` |

### Checking and reading

Both give `{ ok: true, profile }` or `{ ok: false, errors }`, where each error is `{ path, message }`. The message is a full sentence for the person: "identity.capital should be text of at most 80 characters."

| Function | |
| --- | --- |
| `validateProfile(value)` | Checks a value against the schema and the limits above. |
| `parseProfile(text)` | Reads the text of a file: checks its size, reads the JSON, then checks it as `validateProfile` does. A file from a newer format (`meta.schema` above 1) is turned away with a request to update the tool. |

### Making and changing

| Function | |
| --- | --- |
| `createProfile(nation)` | A new profile with only `meta`. |
| `getSection(profile, name)` | One section, or `undefined`. Takes a `null` profile in its stride. |
| `setSection(profile, name, data, { now? })` | A new profile with that section replaced, and `updated` stamped on the section and on `meta`. Everything else is the same objects in the same order. The section is replaced whole: spread the old one first to keep fields your version doesn't know. |
| `removeSection(profile, name, { now? })` | A new profile without that section. |
| `setNation(profile, nation, { now? })` | A new profile with the name changed. |
| `mergeProfiles(base, incoming, { prefer?, sections? })` | Every section of both. Where both have one, `prefer` decides: `'newest'` (the default) goes by the section's `updated`, with a missing date counting as oldest and a tie going to the incoming profile; `'incoming'` and `'base'` take that side outright. `sections` limits what is taken from the incoming profile. Unknown sections follow the same rule. The name is the base profile's unless that is empty. |

### Writing

| Function | |
| --- | --- |
| `serialiseProfile(profile)` | The text of the file: two-space JSON with a final line break, `meta` first, known sections in the order of `SECTIONS`, then unknown keys in the order they had. |
| `profileFileName(profile)` | `orioni.eurth.json`: lower case, plain letters, digits and hyphens. `nation.eurth.json` when the name leaves nothing usable. |
| `svgDataUrl(svg)` | A `data:image/svg+xml;charset=utf-8,...` address for an `<img src>`, or an empty string when there is nothing usable. |

### In the browser

| Function | |
| --- | --- |
| `downloadProfile(profile)` | Checks the profile and saves it as a download. Gives the problems back instead if it would not load again. |
| `pickProfile()` | Opens the file dialogue. Resolves to what `parseProfile` gives, or `null` if the person closes it. |
| `readProfileFile(file)` | Reads a `File`. Checks the size before reading. Never rejects. |
| `profileDrop(element, { onprofile, onerror, onover? })` | Takes a file dropped on an element or the window. Leaves drags without a file alone. Gives back a function that stops listening. |

`downloadProfile` and `pickProfile` must be called from a click or another action by the person.

### Also exported

- `@eurth/profile/schema.json`: the JSON Schema.
- `@eurth/profile/ProfileButtons.svelte`: the two buttons.
- `@eurth/profile/examples/*`: the example profiles.
- Types: `EurthProfile`, one per section (`Flag`, `Government`, ...), `ProfileError`, `ProfileResult`, `SectionName`, `MergeOptions`.

## Examples

Three profiles for invented nations, to build and test tools against:

| File | Shape |
| --- | --- |
| [`hesperwick.eurth.json`](examples/hesperwick.eurth.json) | The smallest useful profile: `meta` and a flag. |
| [`vantmoor.eurth.json`](examples/vantmoor.eurth.json) | Mid-sized: identity, flag, government, statistics and cities. |
| [`calderwyn.eurth.json`](examples/calderwyn.eurth.json) | Filled in across every section. |

They are frozen. Tools test against them, so no 1.x release may ever turn one of them away, and the tests here hold the package to that. Their `link` values are placeholders, not real designs.

## Why not Ajv

The tools run under a strict content security policy: `script-src 'self'`, no `unsafe-eval`. Ajv builds its checks with `new Function`, which that policy forbids. So `src/validate.js` reads the schema itself and enforces the keywords the schema uses, and nothing about sections or fields is written twice: the schema stays the single source. In the tests, and only there, the same schema runs through Ajv, and the two must agree on every example, on a set of profiles that must be turned away, and on some 12,000 small changes to the examples.

## Development

Node 22 or newer.

```sh
npm install
npm run check   # types, from the JSDoc in src/
npm run build   # dist/: types from the schema, declarations from src/
npm test
```

- `schema/eurth-profile.schema.json` is where sections and fields are defined. Give every property a `description`, keep every object open (`additionalProperties: true`), and cap every text, number and list.
- `src/` is plain JavaScript with JSDoc types. It is what tools run, as it is.
- `dist/` is built and committed: `types.d.ts` and `schema.js` from the schema, the other `.d.ts` files from `src/`. After a change to the schema or to a type, run `npm run build` and commit `dist/` with it. A test and the CI both fail when `dist/` is out of date.
- `examples/` is frozen (see above).
- Requests and what became of them are in [the feedback log](docs/feedback-log.md).

Adding a field or a section is a minor release. Removing one, renaming one, tightening a limit or adding a value to a fixed list such as `wiki.drivesOn` would make older tools turn away newer files, so those wait for schema 2.

## Releasing

1. Move what's done out of "Next" in [roadmap.md](roadmap.md) and add a dated section for the release, newest first.
2. Set the version in `package.json` and run `npm install` so the lockfile follows.
3. `npm run check`, `npm run build`, `npm test`. Commit, with `dist/`.
4. Tag the commit `v1.2.3` and push the tag. Tools ask for `#semver:^1`, so they pick up the newest 1.x tag the next time they install.

Made by Orioni for [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004. Apache 2.0.
