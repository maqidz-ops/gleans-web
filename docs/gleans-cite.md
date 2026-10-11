# Gleans Cite

The `/sitasi` workspace supports title search (Crossref/OpenAlex), DOI resolution, selecting results, manual journal/book/website entries, editing full author lists and bibliographic metadata, and removing sources. Search results require explicit selection. Plain website URLs prefill the manual form; automatic website scraping is not implemented. Missing author and year are left empty rather than invented.

Citation.js and bundled CSL definitions format APA 7, IEEE, and Vancouver. APA in-text citations use the full source context to disambiguate same-author/year entries. Numeric styles follow bibliography order. Copy actions use plain text. DOCX export uses standard OOXML, retaining basic CSL emphasis and APA hanging indents; it exports the bibliography regardless of the active in-text preview.

Sources and style are stored locally using the existing `gleans:citations:v1` and `gleans:citation-style` keys. Storage failures are shown to the user. Metadata queries are sent directly to Crossref/OpenAlex/DOI.org; no account or server database is needed. Requests have a 15-second timeout per provider. One search provider can fail while the other still returns results.

Run `npm run test:cite` and `npm run build` to verify. Vancouver CSL comes from https://www.zotero.org/styles/nlm-citation-sequence (CC BY-SA 3.0; author and license metadata retained in the bundled file).
