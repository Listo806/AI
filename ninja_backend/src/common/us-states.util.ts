/**
 * United States states, in one spelling.
 *
 * A state can reach us as "FL", "florida" or "Florida", from three different
 * places. Reports are only comparable if all of those become the same value, so
 * everything that stores or groups a state passes through here first.
 */
const STATES: Array<[string, string]> = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
  ['PR', 'Puerto Rico'], ['VI', 'U.S. Virgin Islands'], ['GU', 'Guam'],
  ['AS', 'American Samoa'], ['MP', 'Northern Mariana Islands'],
];

const BY_CODE = new Map(STATES.map(([code, name]) => [code.toLowerCase(), name]));
const BY_NAME = new Map(STATES.map(([, name]) => [name.toLowerCase(), name]));

/**
 * The canonical name of a United States state, or null when the value is not
 * one. Accepts the postal code or the name, in any case or spacing.
 */
export function canonicalUsState(value?: string | null): string | null {
  const raw = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!raw) return null;
  const key = raw.toLowerCase();
  return BY_CODE.get(key) || BY_NAME.get(key) || null;
}

/**
 * What to store for a region: the canonical state name when it is a United
 * States state, otherwise the value as given, tidied and length-capped, so
 * regions elsewhere in the world are still kept.
 */
export function normalizeRegion(value?: string | null): string | null {
  const raw = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!raw) return null;
  return canonicalUsState(raw) || raw.slice(0, 60);
}

/**
 * The same mapping as SQL, so grouping and filtering in the database produce
 * exactly the same names as the application does. Returns an expression that
 * maps `inner` to a canonical state name, leaving anything else as it is.
 */
export function canonicalUsStateSql(inner: string): string {
  const pairs = STATES.map(
    ([code, name]) => `('${code.toLowerCase()}','${name.toLowerCase()}','${name}')`,
  ).join(',');
  return `(
    SELECT COALESCE(
      (SELECT s.proper
         FROM (VALUES ${pairs}) AS s(code, lower_name, proper)
        WHERE s.code = LOWER(BTRIM(${inner}))
           OR s.lower_name = LOWER(BTRIM(${inner}))
        LIMIT 1),
      NULLIF(BTRIM(${inner}), '')
    )
  )`;
}
