import type { Candidate, CslItem, CslName } from "./types";

const MAILTO = "team@gleans.my.id";
const DOI_PATTERN = /10\.\d{4,9}\/[^\s"<>]+/i;

export class CitationError extends Error {}

export function extractDoi(input: string): string | null {
  const decoded = safeDecode(input.trim());
  const match = decoded.match(DOI_PATTERN);
  if (!match) return null;
  return match[0].replace(/[.,;:)\]}>]+$/, "").replace(/\/(full|abstract|pdf|epdf)$/i, "");
}

export function isUrl(input: string) {
  return /^https?:\/\//i.test(input.trim()) || /^www\./i.test(input.trim());
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const KEEP_KEYS: (keyof CslItem)[] = [
  "type",
  "title",
  "author",
  "editor",
  "issued",
  "container-title",
  "publisher",
  "publisher-place",
  "volume",
  "issue",
  "page",
  "edition",
  "DOI",
  "ISBN",
  "URL",
];

export function cleanCsl(raw: Record<string, unknown>, id: string): CslItem {
  const item: Record<string, unknown> = { id };
  for (const key of KEEP_KEYS) {
    let value = raw[key];
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && (key === "title" || key === "container-title" || key === "ISBN")) {
      value = value[0];
    }
    if (typeof value === "string") value = stripMarkup(value);
    item[key] = value;
  }
  if (!item.type) item.type = "article-journal";
  return item as CslItem;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" };

function stripMarkup(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39);/g, (_, e: string) => ENTITIES[e])
    .replace(/\s+/g, " ")
    .trim();
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try { res = await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); }
  if (res.status === 404) throw new CitationError("Sumber tidak ditemukan.");
  if (!res.ok) throw new CitationError(`Layanan metadata sedang bermasalah (${res.status}).`);
  return res.json() as Promise<T>;
}

export async function fetchCslByDoi(doi: string): Promise<CslItem> {
  const id = `doi:${doi.toLowerCase()}`;
  try {
    const raw = await getJson<Record<string, unknown>>(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}/transform/application/vnd.citationstyles.csl+json?mailto=${MAILTO}`,
    );
    return cleanCsl(raw, id);
  } catch (crossrefError) {
    try {
      const raw = await getJson<Record<string, unknown>>(`https://doi.org/${encodeURIComponent(doi)}`, {
        headers: { Accept: "application/vnd.citationstyles.csl+json" },
      });
      return cleanCsl(raw, id);
    } catch {
      throw crossrefError instanceof CitationError
        ? new CitationError(`DOI ${doi} tidak ditemukan. Periksa kembali penulisannya.`)
        : crossrefError;
    }
  }
}

type CrossrefWork = {
  DOI: string;
  title?: string[];
  author?: { given?: string; family?: string; name?: string }[];
  "container-title"?: string[];
  issued?: { "date-parts"?: number[][] };
  type?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  page?: string;
};

const CROSSREF_TYPE: Record<string, string> = {
  "journal-article": "article-journal",
  "proceedings-article": "paper-conference",
  "book-chapter": "chapter",
  book: "book",
  monograph: "book",
  "edited-book": "book",
  dissertation: "thesis",
  "posted-content": "article",
  report: "report",
  dataset: "dataset",
};

export async function searchWorks(query: string): Promise<Candidate[]> {
  const [crossref, openalex] = await Promise.allSettled([searchCrossref(query), searchOpenAlex(query)]);
  if (crossref.status === "rejected" && openalex.status === "rejected") throw crossref.reason;
  const merged = new Map<string, { candidate: Candidate; score: number; order: number }>();
  let order = 0;
  for (const result of [crossref, openalex]) {
    if (result.status !== "fulfilled") continue;
    for (const candidate of result.value) {
      if (merged.has(candidate.key)) continue;
      merged.set(candidate.key, { candidate, score: titleSimilarity(query, candidate.title), order: order++ });
    }
  }
  return [...merged.values()]
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, 8)
    .map((m) => m.candidate);
}

/** Top result only if its title closely matches the query; used for bulk input. */
export async function findBestMatch(query: string): Promise<Candidate | null> {
  const [best] = await searchWorks(query);
  return best && titleSimilarity(query, best.title) >= 0.7 ? best : null;
}

function tokens(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function titleSimilarity(query: string, title: string) {
  const q = tokens(query);
  const t = tokens(title);
  if (q.length === 0 || t.length === 0) return 0;
  if (q.join(" ") === t.join(" ")) return 1;
  return 0.5 * dice(q, t) + 0.5 * dice(bigrams(q), bigrams(t));
}

function bigrams(words: string[]) {
  return words.length < 2 ? words : words.slice(1).map((w, i) => `${words[i]} ${w}`);
}

function dice(a: string[], b: string[]) {
  if (a.length === 0 || b.length === 0) return 0;
  const pool = new Set(b);
  const hits = a.filter((x) => pool.has(x)).length;
  return (2 * hits) / (a.length + b.length);
}

async function searchCrossref(query: string): Promise<Candidate[]> {
  const params = new URLSearchParams({
    "query.bibliographic": query,
    rows: "5",
    select: "DOI,title,author,container-title,issued,type,publisher,volume,issue,page",
    mailto: MAILTO,
  });
  const data = await getJson<{ message: { items: CrossrefWork[] } }>(`https://api.crossref.org/works?${params}`);
  return data.message.items
    .filter((w) => w.title?.[0])
    .map((w) => {
      const author: CslName[] = (w.author ?? []).map((a) =>
        a.family ? { family: a.family, given: a.given } : { literal: a.name ?? "" },
      );
      const csl = cleanCsl(
        {
          type: CROSSREF_TYPE[w.type ?? ""] ?? "article-journal",
          title: w.title,
          author,
          "container-title": w["container-title"],
          issued: w.issued,
          publisher: w.publisher,
          volume: w.volume,
          issue: w.issue,
          page: w.page,
          DOI: w.DOI,
        },
        `doi:${w.DOI.toLowerCase()}`,
      );
      return toCandidate(csl, "crossref");
    });
}

type OpenAlexWork = {
  id: string;
  doi?: string | null;
  title?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  type?: string | null;
  authorships?: { author: { display_name: string } }[];
  primary_location?: { source?: { display_name?: string; host_organization_name?: string } | null } | null;
  biblio?: { volume?: string | null; issue?: string | null; first_page?: string | null; last_page?: string | null };
};

async function searchOpenAlex(query: string): Promise<Candidate[]> {
  const params = new URLSearchParams({ search: query, "per-page": "5", mailto: MAILTO });
  const data = await getJson<{ results: OpenAlexWork[] }>(`https://api.openalex.org/works?${params}`);
  return data.results
    .filter((w) => w.title || w.display_name)
    .map((w) => {
      const doi = w.doi?.replace(/^https?:\/\/doi\.org\//i, "");
      const pages = [w.biblio?.first_page, w.biblio?.last_page].filter(Boolean).join("-");
      const csl = cleanCsl(
        {
          type: w.type === "book" ? "book" : w.type === "book-chapter" ? "chapter" : "article-journal",
          title: w.title ?? w.display_name,
          author: (w.authorships ?? []).map((a) => splitName(a.author.display_name)),
          issued: w.publication_year ? { "date-parts": [[w.publication_year]] } : undefined,
          "container-title": w.primary_location?.source?.display_name,
          publisher: w.primary_location?.source?.host_organization_name,
          volume: w.biblio?.volume,
          issue: w.biblio?.issue,
          page: pages || undefined,
          DOI: doi,
        },
        doi ? `doi:${doi.toLowerCase()}` : `openalex:${w.id.split("/").pop()}`,
      );
      return toCandidate(csl, "openalex");
    });
}

function splitName(full: string): CslName {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { literal: full };
  return { family: parts.pop(), given: parts.join(" ") };
}

function toCandidate(csl: CslItem, provider: Candidate["provider"]): Candidate {
  const names = (csl.author ?? []).map((a) => a.family ?? a.literal ?? "").filter(Boolean);
  const authors =
    names.length === 0 ? "Tanpa penulis" : names.length > 2 ? `${names[0]} dkk.` : names.join(" & ");
  const year = Number(csl.issued?.["date-parts"]?.[0]?.[0]) || undefined;
  return {
    key: csl.id,
    title: csl.title ?? "Tanpa judul",
    authors,
    year,
    container: csl["container-title"],
    doi: csl.DOI,
    csl,
    provider,
  };
}
