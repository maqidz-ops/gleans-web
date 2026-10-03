export type CslName = { family?: string; given?: string; literal?: string };

export type CslDate = { "date-parts"?: (number | string)[][]; raw?: string };

export type CslItem = {
  id: string;
  type: string;
  title?: string;
  author?: CslName[];
  editor?: CslName[];
  issued?: CslDate;
  accessed?: CslDate;
  "container-title"?: string;
  publisher?: string;
  "publisher-place"?: string;
  volume?: string;
  issue?: string;
  page?: string;
  edition?: string;
  DOI?: string;
  ISBN?: string;
  URL?: string;
};

export type CitationStyle = "apa" | "ieee";

export type Source = { id: string; csl: CslItem; addedAt: number };

export type Candidate = {
  key: string;
  title: string;
  authors: string;
  year?: number;
  container?: string;
  doi?: string;
  csl: CslItem;
  provider: "crossref" | "openalex";
};

export const STYLE_LABEL: Record<CitationStyle, string> = {
  apa: "APA 7",
  ieee: "IEEE",
};
