/* eslint-disable @typescript-eslint/no-require-imports -- Browserify uses CommonJS entry points. */
// Browser-only worker adapter for the MIT-licensed word-extractor parser.
const CFB = require('cfb');
const { Buffer } = require('buffer');
const WordOleExtractor = require('word-extractor/lib/word-ole-extractor');

async function extractDocText(input) {
  const bytes = Buffer.from(input);
  const compound = CFB.read(bytes, { type: 'buffer' });
  const entry = CFB.find(compound, 'WordDocument');
  if (!entry?.content) throw new Error('File DOC tidak valid. Simpan ulang sebagai DOCX lalu coba lagi.');
  const word = Buffer.from(entry.content);
  if (word.length < 84 || word.readUInt16LE(0) !== 0xa5ec || word.readUInt16LE(2) < 0xc1) {
    throw new Error('Format DOC belum didukung. Gunakan Word 97–2003 atau simpan ulang sebagai DOCX.');
  }
  if (word.readUInt16LE(10) & 0x8100) throw new Error('DOC dilindungi kata sandi. Buka proteksinya sebelum mengonversi.');
  if (word.readUInt32LE(76) > 2_000_000) throw new Error('Teks DOC terlalu panjang. Bagi dokumen menjadi beberapa file.');
  // Use CFB's bounded container reader; the Word parser only needs stream bytes.
  // This also avoids Node stream behavior differences in browser polyfills.
  const parser = new WordOleExtractor();
  parser.documentStream = (_document, name) => {
    const stream = CFB.find(compound, name);
    if (!stream?.content) return Promise.reject(new Error('Struktur DOC tidak lengkap. Simpan ulang sebagai DOCX.'));
    return Promise.resolve(Buffer.from(stream.content));
  };
  parser.streamBuffer = (buffer) => Promise.resolve(buffer);
  const document = await parser.extractWordDocument(compound, word);
  return document.getBody();
}
module.exports = { extractDocText };

if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = async (event) => {
    try { self.postMessage({ text: await extractDocText(event.data) }); }
    catch (error) { self.postMessage({ error: error.message || 'File DOC gagal dibaca.' }); }
  };
}
