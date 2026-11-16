// Profiles that must be turned away, each wrong in one way. The package's own
// checker and Ajv must both say no to every one of them.

const meta = { schema: 1, nation: 'Calderwyn', updated: '2026-11-13T21:05:44.000Z' };

/**
 * @param {Record<string, unknown>} sections
 * @returns {Record<string, unknown>}
 */
const withMeta = (sections) => ({ meta, ...sections });

/** @type {[string, unknown][]} */
export const invalidProfiles = [
  // The file as a whole
  ['not an object: null', null],
  ['not an object: a list', [meta]],
  ['not an object: text', 'Calderwyn'],
  ['not an object: a number', 1],
  ['no meta', {}],
  ['no meta, one section', { flag: { ratio: '2:3' } }],

  // meta
  ['meta is a list', { meta: [] }],
  ['meta is text', { meta: 'Calderwyn' }],
  ['meta without schema', { meta: { nation: 'Calderwyn', updated: meta.updated } }],
  ['meta without nation', { meta: { schema: 1, updated: meta.updated } }],
  ['meta without updated', { meta: { schema: 1, nation: 'Calderwyn' } }],
  ['schema 0', { meta: { ...meta, schema: 0 } }],
  ['schema 2', { meta: { ...meta, schema: 2 } }],
  ['schema as text', { meta: { ...meta, schema: '1' } }],
  ['schema 1.5', { meta: { ...meta, schema: 1.5 } }],
  ['nation is a number', { meta: { ...meta, nation: 7 } }],
  ['nation is null', { meta: { ...meta, nation: null } }],
  ['nation too long', { meta: { ...meta, nation: 'n'.repeat(81) } }],
  ['updated is a date only', { meta: { ...meta, updated: '2026-11-13' } }],
  ['updated has no time zone', { meta: { ...meta, updated: '2026-11-13T21:05:44' } }],
  ['updated on a day that does not exist', { meta: { ...meta, updated: '2026-02-30T12:00:00Z' } }],
  ['updated on 29 February of a common year', { meta: { ...meta, updated: '2027-02-29T12:00:00Z' } }],
  ['updated in month 13', { meta: { ...meta, updated: '2026-13-01T12:00:00Z' } }],
  ['updated at hour 24', { meta: { ...meta, updated: '2026-11-13T24:00:00Z' } }],
  ['updated with a space', { meta: { ...meta, updated: '2026-11-13 21:05:44Z' } }],
  ['updated is a number', { meta: { ...meta, updated: 1794603944 } }],
  ['updated in words', { meta: { ...meta, updated: 'yesterday' } }],

  // Sections of the wrong kind
  ['a section that is text', withMeta({ flag: 'blue' })],
  ['a section that is a list', withMeta({ cities: [] })],
  ['a section that is null', withMeta({ identity: null })],
  ['a section that is a number', withMeta({ stats: 12 })],

  // The three fields every section shares
  ['link over http', withMeta({ flag: { link: 'http://flag.eurth.org/' } })],
  ['link with javascript:', withMeta({ flag: { link: 'javascript:alert(1)' } })],
  ['link with data:', withMeta({ arms: { link: 'data:text/html,<script>alert(1)</script>' } })],
  ['link with a space', withMeta({ flag: { link: 'https://flag.eurth.org/a b' } })],
  ['link with a line break', withMeta({ flag: { link: 'https://flag.eurth.org/\nhttps://x' } })],
  ['link that is only https://', withMeta({ flag: { link: 'https://' } })],
  ['link too long', withMeta({ flag: { link: `https://flag.eurth.org/#${'a'.repeat(4000)}` } })],
  ['link is a number', withMeta({ wiki: { link: 5 } })],
  ['summary too long', withMeta({ stats: { summary: 's'.repeat(601) } })],
  ['summary is a list', withMeta({ stats: { summary: ['a', 'b'] } })],
  ['section updated is not a date', withMeta({ seats: { updated: 'now' } })],
  ['section updated on 31 April', withMeta({ seats: { updated: '2026-04-31T00:00:00Z' } })],

  // identity
  ['capital too long', withMeta({ identity: { capital: 'c'.repeat(81) } })],
  ['capital is a number', withMeta({ identity: { capital: 3 } })],
  ['motto too long', withMeta({ identity: { motto: 'm'.repeat(201) } })],
  ['languages is text', withMeta({ identity: { languages: 'Calderwynian' } })],
  ['languages holds a number', withMeta({ identity: { languages: ['Calderwynian', 4] } })],
  ['languages holds an empty name', withMeta({ identity: { languages: [''] } })],
  ['too many languages', withMeta({ identity: { languages: Array(21).fill('Eskish') } })],

  // flag and arms
  ['svg too long', withMeta({ flag: { svg: `<svg>${'x'.repeat(524288)}</svg>` } })],
  ['svg is an object', withMeta({ arms: { svg: { markup: '<svg/>' } } })],
  ['ratio as a number', withMeta({ flag: { ratio: 1.5 } })],
  ['ratio with zero', withMeta({ flag: { ratio: '0:3' } })],
  ['ratio in words', withMeta({ flag: { ratio: 'two by three' } })],
  ['colour by name', withMeta({ flag: { colours: ['red'] } })],
  ['colour with three digits', withMeta({ flag: { colours: ['#fff'] } })],
  ['colour with CSS inside', withMeta({ flag: { colours: ['#ffffff;background:url(x)'] } })],
  ['too many colours', withMeta({ flag: { colours: Array(21).fill('#ffffff') } })],
  ['blazon too long', withMeta({ arms: { blazon: 'b'.repeat(401) } })],

  // government and seats
  ['form is a list', withMeta({ government: { form: ['Republic'] } })],
  ['head of state too long', withMeta({ government: { headOfState: 'h'.repeat(81) } })],
  ['total seats is zero', withMeta({ seats: { total: 0 } })],
  ['total seats is a fraction', withMeta({ seats: { total: 120.5 } })],
  ['total seats is text', withMeta({ seats: { total: '120' } })],
  ['total seats too high', withMeta({ seats: { total: 10001 } })],
  ['party without a name', withMeta({ seats: { parties: [{ seats: 4 }] } })],
  ['party without seats', withMeta({ seats: { parties: [{ name: 'Lantern Party' }] } })],
  ['party with negative seats', withMeta({ seats: { parties: [{ name: 'Lantern Party', seats: -1 }] } })],
  ['party that is text', withMeta({ seats: { parties: ['Lantern Party'] } })],
  ['party colour by name', withMeta({ seats: { parties: [{ name: 'Lantern Party', seats: 4, colour: 'gold' }] } })],
  ['too many parties', withMeta({ seats: { parties: Array(101).fill({ name: 'Party', seats: 1 }) } })],

  // names
  ['places is an object', withMeta({ names: { places: { first: 'Haldermouth' } } })],
  ['too many people', withMeta({ names: { people: Array(201).fill('Edric') } })],
  ['a surname too long', withMeta({ names: { surnames: ['s'.repeat(81)] } })],

  // stats
  ['population is text', withMeta({ stats: { population: '12 million' } })],
  ['population is negative', withMeta({ stats: { population: -1 } })],
  ['population is a fraction', withMeta({ stats: { population: 12.5 } })],
  ['population beyond the limit', withMeta({ stats: { population: 1e15 } })],
  ['area is negative', withMeta({ stats: { areaKm2: -5 } })],
  ['GDP is true', withMeta({ stats: { gdpUsd: true } })],
  ['growth below -100', withMeta({ stats: { gdpGrowth: -101 } })],
  ['life expectancy of 500', withMeta({ stats: { lifeExpectancy: 500 } })],

  // dynasty, calendar, timeline
  ['succession holds an object', withMeta({ dynasty: { succession: [{ name: 'Edric' }] } })],
  ['too long a line of succession', withMeta({ dynasty: { succession: Array(51).fill('Edric') } })],
  ['days per year is zero', withMeta({ calendar: { daysPerYear: 0 } })],
  ['month without a name', withMeta({ calendar: { months: [{ days: 30 }] } })],
  ['month with no days', withMeta({ calendar: { months: [{ name: 'Frostwane', days: 0 }] } })],
  ['month that is text', withMeta({ calendar: { months: ['Frostwane'] } })],
  ['too many weekdays', withMeta({ calendar: { weekdays: Array(31).fill('Tideday') } })],
  ['era too long', withMeta({ calendar: { era: 'e'.repeat(21) } })],
  ['start year is text', withMeta({ timeline: { startYear: '1180' } })],
  ['end year beyond the limit', withMeta({ timeline: { endYear: 1000001 } })],
  ['event without a year', withMeta({ timeline: { events: [{ title: 'Founding' }] } })],
  ['event without a title', withMeta({ timeline: { events: [{ year: 1184 }] } })],
  ['event with an empty title', withMeta({ timeline: { events: [{ year: 1184, title: '' }] } })],
  ['too many events', withMeta({ timeline: { events: Array(201).fill({ year: 1, title: 'Event' }) } })],

  // bank, passport, rank
  ['currency code too long', withMeta({ bank: { code: 'CALDERMARKS' } })],
  ['denomination is text', withMeta({ bank: { denominations: ['100'] } })],
  ['denomination is negative', withMeta({ bank: { denominations: [-5] } })],
  ['passport colour by name', withMeta({ passport: { colour: 'burgundy' } })],
  ['rank without a name', withMeta({ rank: { ranks: [{ branch: 'Army' }] } })],
  ['too many branches', withMeta({ rank: { branches: Array(21).fill('Army') } })],

  // cities, anthem, wiki
  ['urbanisation over 100', withMeta({ cities: { urbanisation: 140 } })],
  ['city without a name', withMeta({ cities: { list: [{ population: 5 }] } })],
  ['city with an empty name', withMeta({ cities: { list: [{ name: '' }] } })],
  ['city population as text', withMeta({ cities: { list: [{ name: 'Wynmere', population: '920,000' }] } })],
  ['city capital as text', withMeta({ cities: { list: [{ name: 'Wynmere', capital: 'yes' }] } })],
  ['too many cities', withMeta({ cities: { list: Array(201).fill({ name: 'Wynmere' }) } })],
  ['lyrics too long', withMeta({ anthem: { lyrics: 'la '.repeat(1400) } })],
  ['anthem title is a number', withMeta({ anthem: { title: 9 } })],
  ['anthem metre as a list of numbers', withMeta({ anthem: { metre: [8, 7, 8, 7] } })],
  ['anthem rhyme scheme too long', withMeta({ anthem: { rhyme: 'AB'.repeat(11) } })],
  ['anthem themes as one text', withMeta({ anthem: { themes: 'sea, freedom' } })],
  ['an empty anthem theme', withMeta({ anthem: { themes: ['sea', ''] } })],
  ['too many anthem themes', withMeta({ anthem: { themes: Array.from({ length: 13 }, (_, i) => `theme ${i}`) } })],
  ['drives on the middle', withMeta({ wiki: { drivesOn: 'middle' } })],
  ['drives on Left with a capital', withMeta({ wiki: { drivesOn: 'Left' } })]
];

/**
 * Profiles that look unusual and are fine. Both checkers must say yes.
 * @type {[string, unknown][]}
 */
export const unusualButValid = [
  ['only meta', { meta }],
  ['an empty nation name', { meta: { ...meta, nation: '' } }],
  ['meta and one empty section', withMeta({ anthem: {} })],
  ['a section with only its three shared fields', withMeta({ rank: { link: 'https://rank.eurth.org/', summary: '', updated: meta.updated } })],
  ['a key this version does not know', withMeta({ weather: { climate: 'Oceanic', rainyDays: 212 } })],
  ['an unknown key that is not an object', withMeta({ note: 'Made at the autumn workshop', lucky: 7, done: true, nothing: null })],
  ['unknown keys inside meta and inside sections', { meta: { ...meta, madeWith: 'flag 1.4' }, flag: { ratio: '2:3', waving: { speed: 2 } } }],
  ['unknown keys inside list items', withMeta({ cities: { list: [{ name: 'Wynmere', twinnedWith: ['Tamsel'] }] } })],
  ['a key called constructor', withMeta({ constructor: { prototype: { polluted: true } } })],
  ['keys named like built-in methods', withMeta({ toString: 5, identity: { hasOwnProperty: 1, valueOf: 'x' } })],
  ['a time zone offset', { meta: { ...meta, updated: '2026-11-13T22:05:44+01:00' } }],
  ['a date without fractions of a second', { meta: { ...meta, updated: '2026-11-13T21:05:44Z' } }],
  ['29 February of a leap year', { meta: { ...meta, updated: '2028-02-29T12:00:00Z' } }],
  ['a nation name of exactly 80 characters', { meta: { ...meta, nation: 'n'.repeat(80) } }],
  ['80 emoji count as 80 characters', { meta: { ...meta, nation: '🏰'.repeat(80) } }],
  ['a summary of exactly 600 characters', withMeta({ stats: { summary: 's'.repeat(600) } })],
  ['a link of exactly 4000 characters', withMeta({ flag: { link: 'https://flag.eurth.org/#'.padEnd(4000, 'a') } })],
  ['an svg of exactly 512 KB', withMeta({ flag: { svg: `<svg>${'x'.repeat(524288 - 11)}</svg>` } })],
  ['zero people', withMeta({ stats: { population: 0, areaKm2: 0.5, gdpGrowth: -3.2 } })],
  ['a year before year 1', withMeta({ timeline: { startYear: -753, events: [{ year: -753, title: 'The city is founded' }] } })],
  ['an anthem with its metre and settings, and no words yet', withMeta({ anthem: { metre: '8.7.8.7', rhyme: 'ABAB', mood: 'solemn hymn', themes: ['sea', 'freedom', 'unity'] } })],
  ['an anthem in free verse on no theme', withMeta({ anthem: { title: 'Lanterns on the Water', metre: 'free', themes: [] } })],
  ['empty lists', withMeta({ names: { places: [], people: [], surnames: [] }, cities: { list: [] } })],
  ['a whole number written with a decimal point', JSON.parse(`{"meta":{"schema":1.0,"nation":"Calderwyn","updated":"${meta.updated}"},"seats":{"total":151.0}}`)]
];
