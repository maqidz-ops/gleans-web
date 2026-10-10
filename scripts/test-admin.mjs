import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';
const dir = await mkdtemp(resolve('.admin-test-'));
after(() => rm(dir, { recursive: true, force: true }));
await writeFile(`${dir}/model.mjs`, ts.transpileModule(await readFile('src/lib/admin/model.ts','utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
await writeFile(`${dir}/media.mjs`,ts.transpileModule(await readFile('src/lib/admin/media.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {validateMedia}=await import(`${dir}/media.mjs`);
const {initialAdmin,saveAdminRecord,adminSchema,ADMIN_STORAGE_KEY,inviteDemoAdmin,revokeDemoAdmin,upgradeAdminDemo} = await import(`${dir}/model.mjs`);
await writeFile(`${dir}/retention.mjs`,ts.transpileModule(await readFile('src/lib/shield-retention.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {shieldAccess,SHIELD_RETENTION_MS}=await import(`${dir}/retention.mjs`);
test('demo state round-trips with its own storage namespace',()=>{
 assert.ok(ADMIN_STORAGE_KEY.includes('admin-demo'));
 const state=initialAdmin(); assert.deepEqual(adminSchema.parse(JSON.parse(JSON.stringify(state))),state);
});
test('wallet adjustments require a reason and preserve unrelated records',()=>{
 const state=initialAdmin(),customer={...state.customers[0],quota:7};
 assert.throws(()=>saveAdminRecord(state,'customers',customer),/alasan/);
 const next=saveAdminRecord(state,'customers',customer,'Koreksi pesanan demo');
 assert.equal(next.customers[0].quota,7);assert.equal(state.customers[0].quota,2);
 assert.deepEqual(next.orders,state.orders);assert.match(next.activity[0].action,/Koreksi pesanan demo/);
 assert.throws(()=>saveAdminRecord(state,'customers',{...customer,balance:-1},'Koreksi saldo'));
});
test('unpaid orders cannot start processing and unfinished reports cannot be sent',()=>{
 const state=initialAdmin();
 assert.throws(()=>saveAdminRecord(state,'orders',{...state.orders[2],processing:'Diproses'}),/terbayar/);
 assert.throws(()=>saveAdminRecord(state,'orders',{...state.orders[0],delivery:'Terkirim'}),/selesai/);
 const next=saveAdminRecord(state,'orders',{...state.orders[0],processing:'Selesai',delivery:'Terkirim'});
 assert.equal(next.orders[0].delivery,'Terkirim');
 assert.doesNotThrow(()=>saveAdminRecord(state,'orders',{...state.orders[3],payment:'Refund'}));
});
test('article slugs remain unique and edits do not duplicate records',()=>{
 const state=initialAdmin();
 assert.throws(()=>saveAdminRecord(state,'blogs',{...state.blogs[0],slug:state.blogs[1].slug}),/sudah digunakan/);
 const next=saveAdminRecord(state,'blogs',{...state.blogs[0],title:'Judul baru',status:'Terbit'});
 assert.equal(next.blogs.length,state.blogs.length);assert.equal(next.blogs[0].status,'Terbit');
});
test('promotion schedules and codes validate before saving',()=>{
 const state=initialAdmin(),promo=state.promos[1];
 assert.throws(()=>saveAdminRecord(state,'promos',{...promo,end:'2026-09-01'}),/Tanggal/);
 assert.throws(()=>saveAdminRecord(state,'promos',{...promo,code:''}),/kode promo/);
 const next=saveAdminRecord(state,'promos',{...promo,active:true});assert.equal(next.promos[1].active,true);
});

test('saved demo data migrates admin and activity defaults',()=>{
 const state=initialAdmin();delete state.admins;delete state.activity[0].actor;delete state.activity[0].object;
 const restored=adminSchema.parse(state);assert.equal(restored.admins[0].role,'Owner');assert.equal(restored.activity[0].actor,'Gleans');
});
test('demo invitations validate roles, reject duplicate emails, and log activity',()=>{
 const state=initialAdmin(),member={name:'Editor Test',email:'editor@example.com',role:'Editor'};
 const next=inviteDemoAdmin(state,member);assert.equal(next.admins.at(-1).status,'Diundang');assert.equal(next.activity[0].object,member.email);
 assert.throws(()=>inviteDemoAdmin(next,{...member,email:'EDITOR@example.com'}),/sudah ada/);
 assert.throws(()=>inviteDemoAdmin(state,{...member,role:'Owner'}));assert.equal(state.admins.length,1);
});

test('media rejects unsupported formats, empty files, and files above 10 MB',()=>{
 assert.doesNotThrow(()=>validateMedia(new File(['image'],'sample.png',{type:'image/png'})));
 assert.throws(()=>validateMedia(new File(['<svg/>'],'sample.svg',{type:'image/svg+xml'})),/PNG/);
 assert.throws(()=>validateMedia(new File([],'empty.png',{type:'image/png'})),/10 MB/);
 assert.throws(()=>validateMedia(new File([new Uint8Array(10*1024*1024+1)],'large.jpg',{type:'image/jpeg'})),/10 MB/);
});

test('Shield download expires exactly 24 hours after completion',()=>{
 const completed='2026-10-09T01:00:00.000Z', time=Date.parse(completed);
 assert.equal(shieldAccess(completed,time+SHIELD_RETENTION_MS-1).status,'available');
 assert.equal(shieldAccess(completed,time+SHIELD_RETENTION_MS).status,'expired');
 assert.equal(shieldAccess(undefined,time).status,'unknown');
 assert.equal(shieldAccess('invalid',time).status,'unknown');
});
test('demo upgrade preserves edits and adds retention scenarios only once',()=>{
 const old=initialAdmin(); old.demoVersion=1; old.orders=old.orders.slice(0,4);delete old.orders[1].completedAt;old.customers[0].name='Edited';
 const next=upgradeAdminDemo(old);assert.equal(next.customers[0].name,'Edited');assert.equal(next.orders.length,6);
 assert.ok(next.orders[1].completedAt);assert.equal(next.orders[3].failureReason,'timeout');
 assert.deepEqual(upgradeAdminDemo(next),next);
});

test('revocation preserves history, blocks Owner, and allows re-invitation',()=>{
 const invited=inviteDemoAdmin(initialAdmin(),{name:'Operator Test',email:'operator@example.com',role:'Operator'}), id=invited.admins.at(-1).id;
 const revoked=revokeDemoAdmin(invited,id);assert.equal(revoked.admins.at(-1).status,'Dicabut');assert.match(revoked.activity[0].action,/Membatalkan/);
 assert.deepEqual(revokeDemoAdmin(revoked,id),revoked);assert.deepEqual(revoked.orders,invited.orders);
 assert.throws(()=>revokeDemoAdmin(revoked,'ADMIN-001'),/Owner/);assert.throws(()=>revokeDemoAdmin(revoked,'missing'),/ditemukan/);
 const again=inviteDemoAdmin(revoked,{name:'Operator Test',email:'operator@example.com',role:'Editor'});assert.equal(again.admins.length,revoked.admins.length);assert.equal(again.admins.at(-1).status,'Diundang');
 again.admins.at(-1).status='Aktif';assert.match(revokeDemoAdmin(again,id).activity[0].action,/Mencabut akses/);
});

test('article categories restore legacy data and persist edits',()=>{
 const state=initialAdmin();delete state.blogs[0].category;
 const restored=adminSchema.parse(state);assert.equal(restored.blogs[0].category,'Edukasi');
 const next=saveAdminRecord(restored,'blogs',{...restored.blogs[0],category:'Kampus'});
 assert.equal(adminSchema.parse(JSON.parse(JSON.stringify(next))).blogs[0].category,'Kampus');
 assert.throws(()=>saveAdminRecord(restored,'blogs',{...restored.blogs[0],category:'Tidak valid'}));
});

test('blog editor restores metadata and validates scheduled publication',()=>{
 const state=initialAdmin(); const old={...state.blogs[0]};delete old.author;delete old.coverId;delete old.coverAlt;
 const restored=adminSchema.parse({...state,blogs:[old]});assert.equal(restored.blogs[0].author,'Tim Gleans');
 assert.throws(()=>saveAdminRecord(state,'blogs',{...state.blogs[0],status:'Terjadwal'}),/mendatang/);
 assert.throws(()=>saveAdminRecord(state,'blogs',{...state.blogs[0],status:'Terjadwal',publishAt:'2020-01-01T00:00:00.000Z'}),/mendatang/);
 const publishAt=new Date(Date.now()+86400000).toISOString();
 const next=saveAdminRecord(state,'blogs',{...state.blogs[0],status:'Terjadwal',publishAt,author:'Penulis Demo',coverId:'cover-demo',coverAlt:'Cover artikel'});
 const record=adminSchema.parse(JSON.parse(JSON.stringify(next))).blogs[0];
 assert.equal(record.publishAt,publishAt);assert.equal(record.author,'Penulis Demo');assert.equal(record.coverId,'cover-demo');assert.equal(record.status,'Terjadwal');
});
