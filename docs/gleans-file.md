# Gleans File

`/file` processes files locally in the browser; documents are not uploaded to a server. Processing libraries load when an action starts. The DOC worker and PDF font are served from the same site.

## Supported actions

- Convert: DOCX, Word 97–2003 DOC, UTF-8 TXT, PNG and JPEG → PDF. Word conversion preserves the main body text only; layout, images, tables, headers and footers are not reproduced. Text uses the bundled Noto Sans font; unsupported characters produce a clear error. Images are placed proportionally on A4 pages.
- Merge: combine at least two PDFs in the chosen order. The up/down controls change file order before merging.
- Compress: optimize PDF structure while retaining text by default. The optional smaller mode renders pages to JPEG (maximum 100 pages), losing selectable text, interactive forms and links. If a result is larger, return the original bytes with a notice.

Selection limits: 10 files, 25 MiB per file and 50 MiB total per tool. Images are limited to 25 megapixels. Password-protected Word/PDF files must be unlocked before processing. Results stay available when switching tabs; modifying inputs invalidates the corresponding results. Batch failures retain earlier completed results. Processing can be cancelled.

## Development and validation

- `pnpm install --frozen-lockfile`
- `npm run test:file`: verifies real legacy DOC parsing, DOCX/TXT text, PNG/JPEG embedding, merged page order, both compression modes, invalid selections and cancellation.
- `npm run lint`
- `pnpm exec tsc --noEmit`
- `npm run build`

`predev` and `prebuild` regenerate the browser DOC parser using Browserify. Its source is `scripts/doc-worker.cjs`; the generated worker and dependency license notices live under `public/workers`. `word-extractor` is pinned because the worker adapter uses its internal Word OLE parser. Tests run that same bundled worker through a Node messaging bridge. Real DOC fixtures and their MIT license are included in `tests/fixtures`.

Noto Sans is licensed under SIL OFL; see `public/fonts/OFL.txt`.
