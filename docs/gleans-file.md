# Gleans File

`/file` processes files locally in the browser; documents are not uploaded to a server. Processing libraries load when an action starts. The DOC worker and PDF font are served from the same site.

The workspace uses two panels: input files on the left and results on the right (stacked on mobile). Both panels show document counts and combined sizes. The Download button saves one result as PDF or multiple results together as ZIP; individual results also have their own download links. Image selections (PNG/JPEG) combine into a single PDF in their selected order; document conversions remain separate when mixed with images. The input panel supports clicking or Enter/Space to choose files, while its action controls do not open the picker. Workspace panels use 24 px corners, file and result cards use 16 px corners, and tabs, summary bars, and their action buttons use fully rounded corners.

## Supported actions

- Convert: DOCX, Word 97–2003 DOC, UTF-8 TXT, PNG and JPEG → PDF. Word conversion preserves the main body text only; layout, images, tables, headers and footers are not reproduced. Text uses the bundled Noto Sans font; unsupported characters produce a clear error. Images are placed proportionally on A4 pages.
- Merge: combine at least two PDFs in the chosen order. The up/down controls change file order before merging.
- Compress: automatic adaptive compression based on `maqidz-ops/ngampus-app` commit `8f0021d` (`src/lib/pdf/compress.ts`). It samples the first page, selects JPEG quality and resolution with a target output near 57.5% of the original (up to 65% accepted), and tries up to three full passes. Raster results lose selectable text, interactive forms and links. If rasterization does not reduce size, rewrite PDF structure or return the original bytes. There is no mode selector or page-count limit; progress and cancellation remain available.

There is no file-count limit. Size limits: 25 MiB per file and 50 MiB total per tool. Images are limited to 25 megapixels. Password-protected Word/PDF files must be unlocked before processing. Results stay available when switching tabs; modifying inputs invalidates the corresponding results. Batch failures retain earlier completed results. Processing can be cancelled.

## Development and validation

- `pnpm install --frozen-lockfile`
- `npm run test:file`: verifies real legacy DOC parsing, DOCX/TXT text, PNG/JPEG embedding, merged page order, automatic compression and fallback, invalid selections and cancellation.
- `npm run lint`
- `pnpm exec tsc --noEmit`
- `npm run build`

`predev` and `prebuild` regenerate the browser DOC parser using Browserify. Its source is `scripts/doc-worker.cjs`; the generated worker and dependency license notices live under `public/workers`. `word-extractor` is pinned because the worker adapter uses its internal Word OLE parser. Tests run that same bundled worker through a Node messaging bridge. Real DOC fixtures and their MIT license are included in `tests/fixtures`.

Noto Sans is licensed under SIL OFL; see `public/fonts/OFL.txt`.
