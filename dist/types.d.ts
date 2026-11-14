// Generated from schema/eurth-profile.schema.json by `npm run build`.
// Do not edit by hand: change the schema, then build again.

/**
 * The tool's share link for this section. Opening it in the tool brings back the full design. It must be an https link.
 */
export type Link = string;
/**
 * One plain-text paragraph that describes this section, for tools that only want to show a line or two.
 */
export type Summary = string;
/**
 * When the owning tool last wrote this section, as an ISO 8601 date and time with a time zone.
 */
export type Updated = string;
/**
 * A colour as a six-digit hex code.
 */
export type Colour = string;

/**
 * A nation's profile, passed between the Eurth worldbuilding tools as one file, <nation>.eurth.json. Each tool fills in its own section and leaves every other key exactly as it found it, including keys it doesn't know. Only "meta" is required. All text is plain text: show it as text, never as markup.
 */
export interface EurthProfile {
  meta: Meta;
  identity?: Identity;
  flag?: Flag;
  arms?: Arms;
  government?: Government;
  seats?: Seats;
  names?: Names;
  stats?: Stats;
  dynasty?: Dynasty;
  calendar?: Calendar;
  timeline?: Timeline;
  bank?: Bank;
  passport?: Passport;
  rank?: Rank;
  cities?: Cities;
  anthem?: Anthem;
  wiki?: Wiki;
  [k: string]: unknown;
}
/**
 * About the file itself. Every tool keeps this up to date when it saves.
 */
export interface Meta {
  /**
   * The version of this format. Always 1 for now.
   */
  schema: 1;
  /**
   * The nation's name, as the person calls it. Used for the file name. A tool that starts a new profile sets this and nothing else.
   */
  nation: string;
  /**
   * When any tool last changed this file, as an ISO 8601 date and time with a time zone.
   */
  updated: string;
  [k: string]: unknown;
}
/**
 * The nation's names and basics. Owned by Wiki; Card may edit it too. Every other tool reads it and never writes it.
 */
export interface Identity {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The short, everyday name, for example "Calderwyn".
   */
  commonName?: string;
  /**
   * The full, formal name, for example "Kingdom of Calderwyn".
   */
  officialName?: string;
  /**
   * The capital city.
   */
  capital?: string;
  /**
   * What the people are called, for example "Calderwynian".
   */
  demonym?: string;
  /**
   * The national motto, without quotation marks.
   */
  motto?: string;
  /**
   * The official languages, most used first.
   *
   * @maxItems 20
   */
  languages?: string[];
  [k: string]: unknown;
}
/**
 * The national flag. Owned by Flagwright.
 */
export interface Flag {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The flag as an SVG image, at most 512 KB. Only ever show it through an <img> element; never insert it into a page as markup.
   */
  svg?: string;
  /**
   * The flag's proportions as height to width, for example "2:3".
   */
  ratio?: string;
  /**
   * The flag's colours as hex codes, the most used first.
   *
   * @maxItems 20
   */
  colours?: Colour[];
  [k: string]: unknown;
}
/**
 * The coat of arms. Owned by Arms.
 */
export interface Arms {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The arms as an SVG image, at most 512 KB. Only ever show it through an <img> element; never insert it into a page as markup.
   */
  svg?: string;
  /**
   * The arms described in the language of heraldry, for example "Azure, a chevron Or between three mullets argent".
   */
  blazon?: string;
  [k: string]: unknown;
}
/**
 * How the nation is governed. Owned by Governmint.
 */
export interface Government {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The form of government, for example "Parliamentary republic".
   */
  form?: string;
  /**
   * The head of state, with title, for example "Queen Ilsa I".
   */
  headOfState?: string;
  /**
   * The head of government, with title, for example "Prime Minister Aerin Kalluna".
   */
  headOfGovernment?: string;
  /**
   * The name of the legislature, for example "National Assembly".
   */
  legislature?: string;
  [k: string]: unknown;
}
/**
 * The legislature's seats and who holds them. Owned by Seats.
 */
export interface Seats {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The name of the chamber, for example "National Assembly".
   */
  chamber?: string;
  /**
   * The number of seats in the chamber.
   */
  total?: number;
  /**
   * The electoral system, for example "D'Hondt" or "First past the post".
   */
  system?: string;
  /**
   * A label for the election these seats come from, for example "Election 2026".
   */
  election?: string;
  /**
   * The parties that hold seats, largest first.
   *
   * @maxItems 100
   */
  parties?: {
    /**
     * The party's name.
     */
    name: string;
    /**
     * The number of seats the party holds.
     */
    seats: number;
    /**
     * A colour as a six-digit hex code.
     */
    colour?: string;
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
/**
 * Names in the nation's own sound, picked in the name generator. Owned by Names.
 */
export interface Names {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * What the naming language is called, for example "Coastal".
   */
  language?: string;
  /**
   * Place names to draw on, for cities, regions and rivers.
   *
   * @maxItems 200
   */
  places?: string[];
  /**
   * Given names to draw on.
   *
   * @maxItems 200
   */
  people?: string[];
  /**
   * Family names to draw on.
   *
   * @maxItems 200
   */
  surnames?: string[];
  [k: string]: unknown;
}
/**
 * The nation's headline numbers. Owned by Stats.
 */
export interface Stats {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The number of people.
   */
  population?: number;
  /**
   * The land area in square kilometres.
   */
  areaKm2?: number;
  /**
   * Nominal GDP in US dollars, as a plain number (1.94 trillion is 1940000000000).
   */
  gdpUsd?: number;
  /**
   * Real GDP growth in per cent a year, for example 2.1.
   */
  gdpGrowth?: number;
  /**
   * Life expectancy at birth, in years.
   */
  lifeExpectancy?: number;
  /**
   * The number of active military personnel.
   */
  activeMilitary?: number;
  [k: string]: unknown;
}
/**
 * The ruling house and who comes next. Owned by Dynasty.
 */
export interface Dynasty {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The name of the house, for example "House of Varenko".
   */
  house?: string;
  /**
   * The succession law, for example "Absolute primogeniture".
   */
  law?: string;
  /**
   * The reigning monarch, with title.
   */
  monarch?: string;
  /**
   * The heir, with title.
   */
  heir?: string;
  /**
   * The line of succession, first in line first.
   *
   * @maxItems 50
   */
  succession?: string[];
  [k: string]: unknown;
}
/**
 * The nation's or world's calendar. Owned by Calendar (cal).
 */
export interface Calendar {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * What the calendar is called, for example "Selunnan Reckoning".
   */
  name?: string;
  /**
   * The number of days in an ordinary year.
   */
  daysPerYear?: number;
  /**
   * The months of the year, in order.
   *
   * @maxItems 100
   */
  months?: {
    /**
     * The month's name.
     */
    name: string;
    /**
     * The number of days in the month in an ordinary year.
     */
    days?: number;
    [k: string]: unknown;
  }[];
  /**
   * The names of the days of the week, in order.
   *
   * @maxItems 30
   */
  weekdays?: string[];
  /**
   * The label written after a year, for example "FS" in "1022 FS".
   */
  era?: string;
  [k: string]: unknown;
}
/**
 * The nation's history at a glance. Owned by Time.
 */
export interface Timeline {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The timeline's title, for example "History of the Oriental Coast".
   */
  title?: string;
  /**
   * The first year the timeline covers. Years before year 1 are negative.
   */
  startYear?: number;
  /**
   * The last year the timeline covers.
   */
  endYear?: number;
  /**
   * The key events, earliest first. A short list for other tools to quote, not the whole timeline.
   *
   * @maxItems 200
   */
  events?: {
    /**
     * The year of the event.
     */
    year: number;
    /**
     * What happened, in a few words.
     */
    title: string;
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
/**
 * The nation's money. Owned by Bank.
 */
export interface Bank {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The name of the currency, for example "Selun".
   */
  currency?: string;
  /**
   * The currency's short code, for example "TLS".
   */
  code?: string;
  /**
   * Who issues the banknotes, for example "Bank of Teland".
   */
  issuer?: string;
  /**
   * The values of the banknotes, largest first.
   *
   * @maxItems 50
   */
  denominations?: number[];
  [k: string]: unknown;
}
/**
 * The nation's passport and identity documents. Owned by Passport.
 */
export interface Passport {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * A colour as a six-digit hex code.
   */
  colour?: string;
  [k: string]: unknown;
}
/**
 * The ranks of the armed forces. Owned by Rank.
 */
export interface Rank {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The branches of the armed forces, for example "Army" and "Navy".
   *
   * @maxItems 20
   */
  branches?: string[];
  /**
   * The ranks, highest first.
   *
   * @maxItems 200
   */
  ranks?: {
    /**
     * The name of the rank, for example "Colonel".
     */
    name: string;
    /**
     * The branch the rank belongs to, as named in "branches".
     */
    branch?: string;
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
/**
 * The nation's largest cities. Owned by Cities.
 */
export interface Cities {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The total population the cities were sized for. Cities keeps its own copy, so its list still adds up after the number in "stats" has changed.
   */
  population?: number;
  /**
   * The share of people who live in towns and cities, in per cent.
   */
  urbanisation?: number;
  /**
   * The largest city's share of the urban population, in per cent, for example 28.
   */
  largestShare?: number;
  /**
   * The rank-size exponent: the city of rank n has the largest city's population divided by n to this power. 1 is the plain rank-size rule, where the second city is half the first and the third a third.
   */
  exponent?: number;
  /**
   * The cities, largest first.
   *
   * @maxItems 200
   */
  list?: {
    /**
     * The city's name.
     */
    name: string;
    /**
     * The number of people who live in the city.
     */
    population?: number;
    /**
     * True for the capital city.
     */
    capital?: boolean;
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
/**
 * The national anthem. Owned by Anthem.
 */
export interface Anthem {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The anthem's title, for example "Steady Against the Tide".
   */
  title?: string;
  /**
   * The words, as plain text: one line per line, with an empty line between verses.
   */
  lyrics?: string;
  [k: string]: unknown;
}
/**
 * The nation's wiki page. Owned by Wiki, which also owns "identity".
 */
export interface Wiki {
  link?: Link;
  summary?: Summary;
  updated?: Updated;
  /**
   * The side of the road people drive on.
   */
  drivesOn?: 'left' | 'right';
  [k: string]: unknown;
}
