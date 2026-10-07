import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-csl";
import apaStyle from "./styles/apa";
import vancouverStyle from "./styles/vancouver";
import ieeeStyle from "./styles/ieee";
import type { CitationStyle, CslItem } from "./types";

const TEMPLATE: Record<CitationStyle, string> = { apa: "gleans-apa7", ieee: "gleans-ieee", vancouver: "gleans-vancouver" };

let registered = false;
function ensureTemplates() {
  if (registered) return;
  const { styles } = plugins.config.get("@csl") as unknown as {
    styles: { add: (name: string, xml: string) => void };
  };
  styles.add(TEMPLATE.apa, apaStyle);
  styles.add(TEMPLATE.ieee, ieeeStyle);
  styles.add(TEMPLATE.vancouver, vancouverStyle);
  registered = true;
}

export type FormattedEntry = { id: string; html: string; text: string; inText: string };

export function formatBibliography(items: CslItem[], style: CitationStyle): FormattedEntry[] {
  if (items.length === 0) return [];
  ensureTemplates();
  const cite = new Cite(items);
  const options = { template: TEMPLATE[style], lang: "en-US", asEntryArray: true as const };
  const html = cite.format("bibliography", { ...options, format: "html" }) as unknown as [string, string][];
  const text = cite.format("bibliography", { ...options, format: "text" }) as unknown as [string, string][];
  const textById = new Map(text.map(([id, value]) => [id, value.trim()]));

  return html.map(([id, value], index) => ({
    id,
    html: value.trim(),
    text: textById.get(id) ?? "",
    inText: style === "ieee" ? `[${index + 1}]` : style === "vancouver" ? `(${index + 1})` : String(cite.format("citation", {
      template: TEMPLATE[style], lang: "en-US", format: "text", entry: [id],
      citationsPre: items.filter((item) => item.id !== id).map((item) => [item.id]),
    } as never)).trim(),
  }));
}
