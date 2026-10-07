import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';
const dir = await mkdtemp(resolve('.citation-test-'));
after(() => rm(dir, { recursive: true, force: true }));
await mkdir(`${dir}/styles`);
for (const name of ['export','editor','resolve','format','styles/apa','styles/ieee','styles/vancouver']) {
 const source = (await readFile(`src/lib/citation/${name}.ts`, 'utf8')).replace(/from "\.\/styles\/(\w+)"/g, 'from "./styles/$1.mjs"');
 await writeFile(`${dir}/${name}.mjs`, ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
}
const { toDraft, fromDraft, emptyDraft } = await import(`${dir}/editor.mjs`);
const { formatBibliography } = await import(`${dir}/format.mjs`);
const { extractDoi, searchWorks } = await import(`${dir}/resolve.mjs`);
const item = {id:'a',type:'article-journal',title:'Learning together',author:[{family:'Smith',given:'Anna'}],issued:{'date-parts':[[2024,2,3]]},'container-title':'Research Journal',volume:'12',issue:'2',page:'10-25',DOI:'10.1234/test'};
test('editor preserves rich metadata and date when editing title',()=>{
 const result=fromDraft({...toDraft(item),title:'Updated title'},item.id,item);
 assert.deepEqual(result.author,item.author);assert.deepEqual(result.issued,item.issued);assert.equal(result.DOI,item.DOI);assert.equal(result.page,'10-25');
});
test('manual author parsing, no invented author/year, and validation',()=>{
 const result=fromDraft({...emptyDraft,title:'Book',author:'Smith, Anna; Research Group',kind:'Buku'},'b');
 assert.equal(result.type,'book'); assert.deepEqual(result.author,[{family:'Smith',given:'Anna'},{literal:'Research Group'}]);assert.equal(result.issued,undefined);
 assert.throws(()=>fromDraft({...emptyDraft,title:'X',year:'xx'},'x'),/Tahun/);
 assert.throws(()=>fromDraft({...emptyDraft,title:'X',url:'javascript:alert(1)'},'x'),/URL/);
});
test('APA uses whole bibliography for same-author same-year disambiguation',()=>{
 const entries=formatBibliography([item,{...item,id:'b',title:'Another study'}],'apa');
 assert.equal(entries.length,2);assert.match(entries[0].text,/2024a/);assert.match(entries[1].text,/2024b/);
 assert.match(entries[0].inText,/2024a/);assert.match(entries[1].inText,/2024b/);
 assert.match(entries[0].text,/Research Journal/);
});
test('numeric styles keep numbering and complete journal metadata',()=>{
 for(const style of ['ieee','vancouver']) {
 const entries=formatBibliography([item,{...item,id:'b',title:'Second'}],style);
 assert.match(entries[1].inText,/2/);assert.match(entries[0].text,/12/);assert.match(entries[0].text,/10/);
 }
});
test('search deduplicates DOI and survives one metadata provider failing',async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async(url)=>{
 if(String(url).includes('openalex')) throw new Error('Unavailable');
 return {ok:true,json:async()=>({message:{items:[{DOI:'10.1234/test',title:['Learning together'],author:[{family:'Smith'}],type:'journal-article'}]}})};
 };
 try{const results=await searchWorks('Learning together');assert.equal(results.length,1);assert.equal(results[0].csl.id,'doi:10.1234/test');}finally{globalThis.fetch=old;}
 assert.equal(extractDoi('https://doi.org/10.1234/test'),'10.1234/test');
});

test('DOCX archive contains valid document and relationships parts', async () => {
 const { createDocx } = await import(`${dir}/export.mjs`);
 const { default: JSZip } = await import('jszip');
 const blob = await createDocx('<w:p><w:r><w:t>LeCun &amp; Bengio</w:t></w:r></w:p>');
 const zip = await JSZip.loadAsync(await blob.arrayBuffer());
 assert.ok(zip.file('[Content_Types].xml')); assert.ok(zip.file('_rels/.rels'));
 const xml = await zip.file('word/document.xml').async('string');
 assert.match(xml,/LeCun &amp; Bengio/);assert.match(xml,/Daftar Pustaka/);
 assert.equal(blob.type,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
});
