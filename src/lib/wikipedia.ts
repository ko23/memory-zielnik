export interface HerbLookupResult {
  title: string;
  imageUrl: string;
  sourceLabel: string;
}

// [searchTerm, matchedTitles, descriptions, urls]
type OpenSearchResponse = [string, string[], string[], string[]];

interface SummaryResponse {
  title?: string;
  thumbnail?: {
    source: string;
  };
}

const WIKI_LANG = "pl";
const SEARCH_URL = `https://${WIKI_LANG}.wikipedia.org/w/api.php`;
const SUMMARY_URL = (title: string) =>
  `https://${WIKI_LANG}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

/**
 * Resolves a typed name to a Wikipedia title via the `opensearch` action.
 * Plan originally specified `list=search` (MediaWiki full-text search), but
 * live testing found it returns zero hits for Polish herb names typed
 * without diacritics (e.g. "koper wloski") and wrong-disambiguation results
 * for single ambiguous words (e.g. "koper" alone resolves to a Slovenian
 * city). `opensearch` correctly resolved every tested seed-herb name.
 */
async function resolveTitle(name: string): Promise<string | null> {
  const url = `${SEARCH_URL}?action=opensearch&format=json&origin=*&limit=1&search=${encodeURIComponent(name)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return null;
  }
  if (!response.ok) {
    return null;
  }

  let data: OpenSearchResponse;
  try {
    data = (await response.json()) as OpenSearchResponse;
  } catch {
    return null;
  }

  const title = data[1]?.[0];
  return title ?? null;
}

async function fetchSummary(title: string): Promise<SummaryResponse | null> {
  let response: Response;
  try {
    response = await fetch(SUMMARY_URL(title));
  } catch {
    return null;
  }
  if (!response.ok) {
    return null;
  }

  try {
    return (await response.json()) as SummaryResponse;
  } catch {
    return null;
  }
}

/**
 * Resolves a herb name to a single best-match image from Polish Wikipedia.
 * Always searches first (typed names rarely match real page titles'
 * capitalization/diacritics), then fetches that page's summary. Returns
 * null if there's no search hit, the summary fetch fails, or the page has
 * no thumbnail image.
 */
export async function lookupHerbImage(name: string): Promise<HerbLookupResult | null> {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const title = await resolveTitle(trimmed);
  if (!title) {
    return null;
  }

  const summary = await fetchSummary(title);
  if (!summary || !summary.thumbnail) {
    return null;
  }

  return {
    title: summary.title ?? title,
    imageUrl: summary.thumbnail.source,
    sourceLabel: `Wikipedia: ${summary.title ?? title}`,
  };
}
