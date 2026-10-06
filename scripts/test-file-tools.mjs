import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { Worker as NodeWorker } from 'node:worker_threads';
import { resolve } from 'node:path';
import ts from 'typescript';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const directory = await mkdtemp(resolve('.file-tools-test-'));
after(() => rm(directory, { recursive: true, force: true }));
for (const name of ['tools', 'doc', 'compress']) {
  const source = (await readFile(`src/lib/file/${name}.ts`, 'utf8')).replace('"./doc"', '"./doc.mjs"').replace('"./compress"', '"./compress.mjs"');
  await writeFile(`${directory}/${name}.mjs`, ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText);
}
// Test the same generated worker used in the browser, with a Node messaging bridge.
globalThis.Worker = class {
  constructor() {
    this.thread = new NodeWorker(`
      const { parentPort } = require('node:worker_threads');
      globalThis.self = { postMessage: (message) => parentPort.postMessage(message) };
      require(${JSON.stringify(resolve('public/workers/doc-parser.js'))});
      parentPort.on('message', (data) => self.onmessage({ data }));
    `, { eval: true });
    this.thread.on('message', (data) => this.onmessage?.({ data }));
    this.thread.on('error', (error) => this.onerror?.(error));
  }
  postMessage(data, transfer) { this.thread.postMessage(data, transfer); }
  terminate() { void this.thread.terminate(); }
};
// Reproduce a browser without Promise.withResolvers before importing the tools.
delete Promise.withResolvers;
const tools = await import(`${directory}/tools.mjs`);
assert.equal(typeof Promise.withResolvers, 'function');
const { extractDocText } = await import(`${directory}/doc.mjs`);
const { mergePdfs, convertToPdf, imagesToPdf, compressPdf, validateSelection } = tools;
const fontBytes = new Uint8Array(await readFile('public/fonts/NotoSans-Regular.ttf'));
const context = { fontBytes };
const rootRequire = createRequire(import.meta.url);
const canvasRequire = createRequire(rootRequire.resolve('pdfjs-dist/package.json'));
const { createCanvas } = canvasRequire('@napi-rs/canvas');
const mammothRequire = createRequire(rootRequire.resolve('mammoth/package.json'));
const JSZip = mammothRequire('jszip');

  globalThis.window = { requestAnimationFrame: (callback) => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout, document: { createElement: () => {
    const target = createCanvas(1, 1);
    target.toBlob = async (callback, mime, quality) => callback(new Blob([await target.encode('jpeg', Math.round(quality * 100))], { type: mime }));
    return target;
  } } };

after(() => { delete globalThis.window; });

async function pdfFile(name, labels, objectStreams = false) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const label of labels) doc.addPage([595, 842]).drawText(label, { x: 48, y: 790, size: 12, font });
  return new File([await doc.save({ useObjectStreams: objectStreams })], name, { type: 'application/pdf' });
}
async function textPages(bytes) {
  await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data: Uint8Array.from(bytes), useSystemFonts: true });
  try {
    const doc = await task.promise;
    const text = [];
    for (let page = 1; page <= doc.numPages; page += 1) {
      const content = await (await doc.getPage(page)).getTextContent();
      text.push(content.items.map((item) => item.str ?? '').join(' '));
    }
    return text;
  } finally { await task.destroy(); }
}

test('merge preserves all pages in the selected file order', async () => {
  const first = await pdfFile('first.pdf', ['FIRST', 'SECOND']);
  const last = await pdfFile('last.pdf', ['LAST']);
  const result = await mergePdfs([last, first]);
  assert.equal(result.pages, 3);
  assert.deepEqual((await textPages(result.bytes)).map((text) => text.trim()), ['LAST', 'FIRST', 'SECOND']);
});

test('reject invalid formats, insufficient merge files, empty and oversized selections', async () => {
  assert.throws(() => validateSelection([new File(['x'], 'wrong.doc')], 'merge'), /PDF/);
  assert.throws(() => validateSelection([new File(['x'], 'one.pdf')], 'merge'), /minimal dua/);
  assert.throws(() => validateSelection([new File([], 'empty.txt')], 'convert'), /kosong/);
  const large = new File([new Uint8Array(25 * 1024 * 1024 + 1)], 'large.pdf');
  assert.throws(() => validateSelection([large], 'compress'), /25 MB/);
  assert.doesNotThrow(() => validateSelection(Array.from({ length: 20 }, (_, i) => new File(['x'], `${i}.pdf`)), 'merge'));
  const medium = new File([new Uint8Array(20 * 1024 * 1024)], 'medium.pdf');
  assert.throws(() => validateSelection([medium, medium, medium], 'compress'), /50 MB/);
  await assert.rejects(mergePdfs([await pdfFile('good.pdf', ['OK']), new File(['bad data'], 'bad.pdf')]), /bad.pdf/);
});

test('TXT becomes a paginated PDF with Unicode and long tokens intact', async () => {
  const text = 'Mahasiswa αβ é — “kutipan”\n' + Array.from({ length: 100 }, (_, i) => `Paragraf ${i + 1} untuk dokumen akademik.`).join('\n') + '\n' + 'panjang'.repeat(40);
  const result = await convertToPdf(new File([text], 'catatan.txt'), context);
  assert.ok(result.pages >= 2);
  const output = (await textPages(result.bytes)).join(' ');
  assert.match(output, /Mahasiswa αβ é/);
  assert.match(output, /Paragraf 100/);
  assert.match(output, /panjang/);
  await assert.rejects(convertToPdf(new File(['   '], 'blank.txt'), context), /tidak memiliki teks/);
});

test('DOCX body text is preserved in the PDF', async () => {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Contoh skripsi DOCX</w:t></w:r></w:p><w:p><w:r><w:t>Paragraf kedua</w:t></w:r></w:p></w:body></w:document>');
  const result = await convertToPdf(new File([await zip.generateAsync({ type: 'uint8array' })], 'skripsi.docx'), context);
  assert.match((await textPages(result.bytes)).join(' '), /Contoh skripsi DOCX.*Paragraf kedua/);
  assert.match(result.notice, /Tata letak/);
});

test('real legacy DOC is read by the browser worker and converted', async () => {
  const file = new File([await readFile('tests/fixtures/word-table.doc')], 'table.doc');
  const result = await convertToPdf(file, context);
  const text = (await textPages(result.bytes)).join(' ');
  assert.match(text, /This is a simple paragraph/);
  assert.match(text, /Row 1, cell 1/);
  assert.match(text, /And a second paragraph/);
  const revisions = await extractDocText(new Uint8Array(await readFile('tests/fixtures/word-revisions.doc')));
  assert.match(revisions, /Unicode characters/);
  assert.match(revisions, /This text has been inserted/);
  await assert.rejects(extractDocText(new Uint8Array([1, 2, 3])), /./);
});

test('PNG and JPEG produce a one-page PDF with embedded image content', async () => {
  for (const [name, path] of [['image.png', 'public/images/icon-upload.png'], ['image.jpg', 'public/images/blog-thumbnail-tutorial.jpg']]) {
    const result = await convertToPdf(new File([await readFile(path)], name), context);
    const doc = await PDFDocument.load(result.bytes);
    assert.equal(doc.getPageCount(), 1);
    assert.ok(result.bytes.length > 100);
  }
  await assert.rejects(convertToPdf(new File(['bad png'], 'bad.png'), context), /PNG/);
});

test('PNG and JPEG selections form one PDF in the selected order', async () => {
  const wide = createCanvas(120, 60);
  const tall = createCanvas(60, 120);
  wide.getContext('2d').fillRect(0, 0, 120, 60);
  tall.getContext('2d').fillRect(0, 0, 60, 120);
  const png = new File([wide.toBuffer('image/png')], 'wide.png');
  const jpeg = new File([tall.toBuffer('image/jpeg')], 'tall.jpeg');
  const result = await imagesToPdf([jpeg, png]);
  assert.equal(result.name, 'gleans-gambar.pdf');
  assert.equal(result.pages, 2);
  assert.equal(result.sourceBytes, png.size + jpeg.size);
  const pdf = await PDFDocument.load(result.bytes);
  const [first, second] = pdf.getPages().map((page) => page.getSize());
  assert.ok(first.height > first.width);
  assert.ok(second.width > second.height);
  const reversed = await PDFDocument.load((await imagesToPdf([png, jpeg])).bytes);
  assert.ok(reversed.getPage(0).getWidth() > reversed.getPage(0).getHeight());
  await assert.rejects(imagesToPdf([new File(['text'], 'wrong.txt')]), /PNG atau JPEG/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(imagesToPdf([png], { signal: controller.signal }), { name: 'AbortError' });
});

test('automatic compression falls back for compact text and never returns a larger file', async () => {
  const input = await pdfFile('text.pdf', ['SEARCHABLE TEXT'], false);
  const result = await compressPdf(input);
  assert.ok(result.bytes.length <= input.size);
  assert.equal((await textPages(result.bytes))[0].trim(), 'SEARCHABLE TEXT');
  const compact = new File([result.bytes], 'compact.pdf');
  const again = await compressPdf(compact);
  assert.ok(again.bytes.length <= compact.size);
  if (again.bytes.length === compact.size) assert.deepEqual(again.bytes, new Uint8Array(await compact.arrayBuffer()));
});

test('automatic compression reduces image-heavy PDF and preserves page dimensions', async () => {
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(512, 512);
  let random = 12345;
  for (let i = 0; i < pixels.data.length; i += 4) {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
    pixels.data[i] = random & 255; pixels.data[i + 1] = (random >>> 8) & 255; pixels.data[i + 2] = (random >>> 16) & 255; pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(canvas.toBuffer('image/png'));
  doc.addPage([512, 512]).drawImage(image, { x: 0, y: 0, width: 512, height: 512 });
  const input = new File([await doc.save()], 'scan.pdf');
  const result = await compressPdf(input);
  assert.ok(result.bytes.length < input.size);
  const output = await PDFDocument.load(result.bytes);
  assert.equal(output.getPageCount(), 1);
  assert.deepEqual(output.getPage(0).getSize(), { width: 512, height: 512 });
  assert.match(result.notice, /Halaman menjadi gambar/);
  const controller = new AbortController();
  await assert.rejects(compressPdf(input, {
    signal: controller.signal,
    onProgress: (message) => { if (message.includes("halaman")) controller.abort(); },
  }), { name: 'AbortError' });
});

test('cancellation prevents output and terminates DOC parsing', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(compressPdf(await pdfFile("cancel.pdf", ["CANCEL"]), { signal: controller.signal }), { name: "AbortError" });
  await assert.rejects(mergePdfs([await pdfFile('a.pdf', ['A']), await pdfFile('b.pdf', ['B'])], { signal: controller.signal }), { name: 'AbortError' });
  await assert.rejects(convertToPdf(new File(['x'], 'x.txt'), { ...context, signal: controller.signal }), { name: 'AbortError' });
  await assert.rejects(extractDocText(new Uint8Array(await readFile('tests/fixtures/word-table.doc')), controller.signal), { name: 'AbortError' });
});
