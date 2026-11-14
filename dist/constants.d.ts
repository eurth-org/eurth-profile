/** The version of the profile format this package reads and writes. */
export const SCHEMA_VERSION: 1;
/**
 * The known sections, in the order they are written to the file. `meta` is
 * not in this list: it is always there, always first, and belongs to every
 * tool.
 */
export const SECTIONS: readonly ["identity", "flag", "arms", "government", "seats", "names", "stats", "dynasty", "calendar", "timeline", "bank", "passport", "rank", "cities", "anthem", "wiki"];
/**
 * Which tools may write each section. Tools are named by their subdomain of
 * eurth.org: Flagwright is `flag`, Governmint is `gov`, Calendar is `cal`,
 * Time is `time`.
 *
 * A tool writes only the sections that list it here, and leaves every other
 * key in the file exactly as it found it. `identity` belongs to Wiki, and
 * Card may edit it too; every other tool reads it and never writes it. A tool
 * that starts a new profile sets `meta.nation` and nothing else.
 *
 * @type {Readonly<Record<typeof SECTIONS[number], readonly string[]>>}
 */
export const SECTION_OWNERS: Readonly<Record<(typeof SECTIONS)[number], readonly string[]>>;
/** The largest profile file a tool will read: 2 MB. */
export const MAX_FILE_BYTES: number;
/** The longest SVG a profile may carry, in characters: 512 KB. */
export const MAX_SVG_LENGTH: number;
/** How deeply a profile's values may be nested. Real profiles need four or five levels. */
export const MAX_DEPTH: 32;
/** The file name ending of a profile. */
export const FILE_EXTENSION: ".eurth.json";
