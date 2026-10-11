import type { CslItem } from "./types";

export const emptyDraft = { title: "", author: "", year: "", journal: "", kind: "Jurnal", doi: "", url: "", volume: "", issue: "", page: "", publisher: "" };
export function toDraft(csl: CslItem) {
  return {
    title: csl.title ?? "", author: (csl.author ?? []).map((a) => a.literal ?? [a.family, a.given].filter(Boolean).join(", ")).join("; "),
    year: String(csl.issued?.["date-parts"]?.[0]?.[0] ?? ""), journal: csl["container-title"] ?? "",
    kind: csl.type === "book" ? "Buku" : csl.type === "webpage" ? "Website" : "Jurnal",
    doi: csl.DOI ?? "", url: csl.URL ?? "", volume: csl.volume ?? "", issue: csl.issue ?? "", page: csl.page ?? "", publisher: csl.publisher ?? "",
  };
}
export function fromDraft(draft: typeof emptyDraft, id: string, original?: CslItem): CslItem {
  const previous = original && toDraft(original);
  const type = original && previous?.kind === draft.kind ? original.type : draft.kind === "Buku" ? "book" : draft.kind === "Website" ? "webpage" : "article-journal";
  if (!draft.title.trim()) throw new Error("Judul wajib diisi.");
  if (draft.year && !/^\d{4}$/.test(draft.year)) throw new Error("Tahun harus berupa empat angka.");
  if (draft.url && !/^https?:\/\//i.test(draft.url)) throw new Error("URL harus dimulai dengan https:// atau http://.");
  return { ...original, id, type, title: draft.title.trim(),
    author: previous?.author === draft.author ? original?.author : draft.author.split(";").map((name) => name.trim()).filter(Boolean).map((name) => {
      const [family, ...given] = name.split(",").map((part) => part.trim());
      return given.length ? { family, given: given.join(", ") } : { literal: family };
    }),
    issued: previous?.year === draft.year ? original?.issued : draft.year ? { "date-parts": [[Number(draft.year)]] } : undefined,
    "container-title": draft.journal.trim() || undefined, publisher: draft.publisher.trim() || undefined,
    DOI: draft.doi.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "") || undefined,
    URL: draft.url.trim() || undefined, volume: draft.volume.trim() || undefined, issue: draft.issue.trim() || undefined, page: draft.page.trim() || undefined,
    accessed: type === "webpage" ? original?.accessed ?? { "date-parts": [[new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]] } : original?.accessed,
  };
}
