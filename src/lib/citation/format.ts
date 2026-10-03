import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-csl";
import apaStyle from "./styles/apa";
import ieeeStyle from "./styles/ieee";
import type { CitationStyle, CslItem } from "./types";

const TEMPLATE: Record<CitationStyle, string> = { apa: "gleans-apa7", ieee: "gleans-ieee" };

let registered = false;
function ensureTemplates() {
  if (registered) return;
  const { styles } = plugins.config.get("@csl") as unknown as {
    styles: { add: (name: string, xml: string) => void };
  };
  styles.add(TEMPLATE.apa, apaStyle);
  styles.add(TEMPLATE.ieee, ieeeStyle);
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
    inText:
      style === "ieee"
        ? `[${index + 1}]`
        : String(
            new Cite(items.find((i) => i.id === id)).format("citation", {
              template: TEMPLATE[style],
              lang: "en-US",
              format: "text",
            } as never),
          ).trim(),
  }));
}
