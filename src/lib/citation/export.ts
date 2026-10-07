import type { FormattedEntry } from "./format";

function xml(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
}
/** A standard OOXML document; text is escaped, and no external content is embedded. */
export async function bibliographyDocx(entries: FormattedEntry[], style: string): Promise<Blob> {
  const paragraphs = entries.map((entry) => {
    // Preserve citation emphasis, accepting only text and basic formatting from CSL output.
    const doc = new DOMParser().parseFromString(entry.html, "text/html");
    function runs(node: Node, italic = false, bold = false): string {
      if (node.nodeType === 3) return `<w:r><w:rPr>${italic ? "<w:i/>" : ""}${bold ? "<w:b/>" : ""}</w:rPr><w:t xml:space="preserve">${xml(node.textContent ?? "")}</w:t></w:r>`;
      if (!(node instanceof Element)) return "";
      if (["SCRIPT", "STYLE"].includes(node.tagName)) return "";
      const isItalic = italic || ["I", "EM"].includes(node.tagName) || (node as HTMLElement).style.fontStyle === "italic";
      const isBold = bold || ["B", "STRONG"].includes(node.tagName) || (node as HTMLElement).style.fontWeight === "bold";
      return Array.from(node.childNodes).map((child) => runs(child, isItalic, isBold)).join("") + (node.classList.contains("csl-left-margin") ? '<w:r><w:tab/></w:r>' : "");
    }
    return `<w:p><w:pPr><w:spacing w:after="160" w:line="360" w:lineRule="auto"/>${style === "apa" ? '<w:ind w:left="720" w:hanging="720"/>' : ""}</w:pPr>${runs(doc.body)}</w:p>`;
  }).join("");
  return createDocx(paragraphs);
}

export async function createDocx(paragraphs: string): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Daftar Pustaka</w:t></w:r></w:p>${paragraphs}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
