import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const require = createRequire(import.meta.url);
async function moduleFrom(path, substitutions={}) {
  let source=(await readFile(path,'utf8')).replace('import "server-only";','');
  source=source.replace('"zod"',JSON.stringify(pathToFileURL(require.resolve('zod')).href));
  for (const [before, after] of Object.entries(substitutions)) source=source.replace(before,after);
  const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
}
const gateway=await moduleFrom('src/features/payments/server/duitku.ts');

test('Duitku signature uses HMAC-SHA256 and rejects forged/malformed callbacks',()=>{
  assert.equal(gateway.signature('what do ya want for nothing?','Jefe'),'5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
  const sig=gateway.signature('DS12310000GLS-order','test-secret');
  assert.equal(gateway.validSignature('DS12310000GLS-order',sig,'test-secret'),true);
  assert.equal(gateway.validSignature('DS12310001GLS-order',sig,'test-secret'),false);
  for(const value of ['', '00', 'z'.repeat(64),'0'.repeat(64)]) assert.equal(gateway.validSignature('value',value,'test-secret'),false);
});
test('only exact Sandbox HTTPS payment URLs are allowed',()=>{
  for (const url of ['https://sandbox.duitku.com/pay','https://api-sandbox.duitku.com/pay']) assert.equal(gateway.allowedPaymentUrl(url),true);
  for (const url of ['javascript:alert(1)','http://sandbox.duitku.com/pay','https://sandbox.duitku.com.attacker.test','https://attacker.test/?next=sandbox.duitku.com']) assert.equal(gateway.allowedPaymentUrl(url),false);
});
test('Sandbox is explicit; live mode and absent credentials fail closed',()=>{
  const previous={...process.env};
  try{
    process.env.DUITKU_MERCHANT_CODE='DS123';process.env.DUITKU_API_KEY='test-secret';
    for (const mode of ['', 'production', 'live']) {process.env.DUITKU_ENV=mode;assert.throws(()=>gateway.duitkuConfig());}
    process.env.DUITKU_ENV='sandbox';assert.equal(gateway.duitkuConfig().merchantCode,'DS123');
    delete process.env.DUITKU_API_KEY;assert.throws(()=>gateway.duitkuConfig());
  }finally{process.env=previous;}
});
test('invoice signs the server amount and rejects unexpected merchant, amount and redirect', async()=>{
  const previous={...process.env};const originalFetch=globalThis.fetch;
  Object.assign(process.env,{DUITKU_ENV:'sandbox',DUITKU_MERCHANT_CODE:'DS123',DUITKU_API_KEY:'test-secret',DUITKU_PUBLIC_URL:'https://shop.example.test'});
  const order={id:'GLS-test',amount:10000,document_name:'paper.txt'};
  try{
    let variation={}; let expectedEmail="test@example.invalid";
    globalThis.fetch=async(url,init)=>{
      assert.equal(url,'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry');
      const payload=JSON.parse(init.body);
      assert.equal(payload.email, expectedEmail);
      assert.equal(payload.paymentMethod,'NQ');assert.equal(payload.paymentAmount,10000);assert.equal(payload.signature,gateway.signature('DS123GLS-test10000','test-secret'));
      assert.equal(payload.callbackUrl,'https://shop.example.test/api/payments/duitku/callback');
      assert.equal(payload.returnUrl,'https://shop.example.test/pembayaran?order=GLS-test');
      return Response.json({statusCode:'00',merchantCode:'DS123',amount:'10000',reference:'ref',paymentUrl:'https://sandbox.duitku.com/pay',...variation});
    };
    await gateway.createInvoice(order,'NQ',{email:'test@example.invalid',name:'Tester',whatsapp:'08123456789'});
    expectedEmail=undefined;
    await gateway.createInvoice(order,'NQ',{email:'',name:'Guest',whatsapp:'08123456789'});
    expectedEmail='test@example.invalid';
    for(const item of [{amount:1},{merchantCode:'wrong'},{paymentUrl:'https://attacker.test'},{statusCode:'99'}]){variation=item;await assert.rejects(()=>gateway.createInvoice(order,'NQ',{email:'test@example.invalid',name:'Tester',whatsapp:'08123456789'}));}
  }finally{globalThis.fetch=originalFetch;process.env=previous;}
});
test('server pricing recalculates known promotions and refuses unknown codes',async()=>{
  const {resolvePromo}=await moduleFrom('src/features/orders/lib/pricing.ts');
  assert.equal(resolvePromo('gleans10',10000).discount,1000);
  assert.equal(resolvePromo('SKRIPSIAMAN',10000).discount,2500);
  assert.equal(resolvePromo('fake',10000),null);
});
test('reconciliation verifies amount, ID and reference; paid state cannot regress',async()=>{
  let response={merchantOrderId:'GLS-test',amount:'10000',reference:'ref',statusCode:'01'};const writes=[];
  globalThis.__duitkuTest={transactionStatus:async()=>response,paymentAdmin:()=>({database:{from:()=>({update:values=>({eq:(field,value)=>({neq:async(condition,status)=>{writes.push({values,field,value,condition,status});return {error:null};}})})})}})};
  const {reconcilePayment}=await moduleFrom('src/features/payments/server/service.ts',{
    'import { transactionStatus } from "./duitku";':'const {transactionStatus,paymentAdmin}=globalThis.__duitkuTest;',
    'import { paymentAdmin, type StoredOrder } from "./repository";':'type StoredOrder = any;'
  });
  const order={id:'GLS-test',amount:10000,reference:'ref'};
  try{
    for(const change of [{amount:1},{merchantOrderId:'other'},{reference:'other'}]){const previous=response;response={...response,...change};await assert.rejects(()=>reconcilePayment(order));response=previous;}
    assert.equal(writes.length,0);
    await reconcilePayment(order);assert.equal(writes[0].values.status,'pending');assert.equal(writes[0].status,'paid');
    response.statusCode='00';await reconcilePayment(order);assert.equal(writes[1].values.status,'paid');assert.ok(writes[1].values.paid_at);
  } finally {delete globalThis.__duitkuTest;}
});


test('Storage metadata supports backend and SDK response shapes without trusting arbitrary fields', async()=>{
  const {uploadedFiles}=await moduleFrom('src/features/payments/server/documents.ts');
  const file={key:'owner/paper.txt',url:'https://storage.example.test/paper.txt',size:100};
  assert.deepEqual(uploadedFiles({objects:[file]}),[file]);
  assert.deepEqual(uploadedFiles({data:[file],pagination:{}}),[file]);
  assert.throws(()=>uploadedFiles({data:[{...file,size:-1}]}));
});
test('cross-origin writes and missing origins are rejected', async()=>{
  const {sameOrigin}=await moduleFrom('src/features/payments/server/http.ts');
  const request=(origin,host='localhost:3000')=>new Request('http://localhost:3000/api/payments/orders',{headers:{host,...(origin?{origin}:{})}});
  assert.equal(sameOrigin(request('http://localhost:3000')),true);
  assert.equal(sameOrigin(request('https://attacker.test')),false);
  assert.equal(sameOrigin(request(null)),false);
  assert.equal(sameOrigin(request('null')),false);
});
test('minimum amount rejection remains retryable with a safe message',async()=>{
  const previous={...process.env};const originalFetch=globalThis.fetch;
  Object.assign(process.env,{DUITKU_ENV:'sandbox',DUITKU_MERCHANT_CODE:'DS123',DUITKU_API_KEY:'test-secret',DUITKU_PUBLIC_URL:'https://shop.example.test'});
  globalThis.fetch=async()=>Response.json({Message:'Minimum Payment 10000 IDR'},{status:400});
  try {
    await assert.rejects(()=>gateway.createInvoice({id:'GLS-test',amount:9000,document_name:'paper.txt'},'NQ',{email:'test@example.invalid',name:'Tester',whatsapp:'08123456789'}),error=>error instanceof gateway.InvoiceRejected && error.publicMessage.includes('10.000'));
  } finally {globalThis.fetch=originalFetch;process.env=previous;}
});


test('checkout selects only an active QRIS channel and never falls back to VA',()=>{
  const method=code=>({paymentMethod:code,paymentName:code,totalFee:'0'});
  assert.equal(gateway.selectQrisMethod([method('VA'),method('SP'),method('NQ')]).paymentMethod,'NQ');
  assert.equal(gateway.selectQrisMethod([method('NQ'),method('SQ')]).paymentMethod,'SQ');
  assert.equal(gateway.selectQrisMethod([method('SP')]).paymentMethod,'SP');
  assert.throws(()=>gateway.selectQrisMethod([method('VA'),method('VC')]));
  assert.throws(()=>gateway.selectQrisMethod([]));
  assert.equal(gateway.isQrisMethod('VA'),false);
});
test('invoice adapter refuses a non-QRIS payment even if called directly',async()=>{
  await assert.rejects(()=>gateway.createInvoice({id:'GLS-test',amount:10000,document_name:'paper.txt'},'VA',{email:'test@example.invalid',name:'Tester',whatsapp:'08123456789'}),/QRIS_ONLY/);
});

test('checkout uses the server-verified identity, including after session refresh, without another browser auth request',async()=>{
  const {checkoutUserId}=await moduleFrom('src/features/orders/lib/checkout-session.ts');
  const id='11111111-1111-4111-8111-111111111111';
  let requests=0;
  const fetchSession=async(path,options)=>{
    requests++;assert.equal(path,'/api/auth/session');assert.equal(options.credentials,'same-origin');assert.equal(options.cache,'no-store');
    return Response.json({account:{id,name:'Tester',email:'test@example.invalid'}});
  };
  assert.equal(await checkoutUserId(fetchSession),id);
  assert.equal(requests,1);
  assert.equal(await checkoutUserId(async()=>Response.json({account:null})),null);
  await assert.rejects(()=>checkoutUserId(async()=>Response.json({error:'Unavailable'},{status:503})),/Layanan akun/);
  await assert.rejects(()=>checkoutUserId(async()=>Response.json({account:{name:'Tester'}})),/Sesi akun belum dapat diperiksa/);
});

test('invoice numbers use the short uppercase format and retry only primary-key collisions',async()=>{
  const {invoiceNumber,reserveInvoice}=await moduleFrom('src/features/payments/server/invoice.ts');
  const numbers=Array.from({length:1000},()=>invoiceNumber());
  for(const id of numbers) assert.match(id,/^GLS-[0-9A-F]{12}$/);
  assert.equal(new Set(numbers).size,numbers.length);
  const ids=[];
  const result=await reserveInvoice(async id=>{
    ids.push(id);
    return ids.length===1 ? {error:{code:'23505',message:'duplicate key violates duitku_orders_pkey'}} : {error:null,data:{id}};
  });
  assert.equal(ids.length,2);assert.notEqual(ids[0],ids[1]);assert.equal(result.data.id,ids[1]);
  let attempts=0;
  await reserveInvoice(async()=>{attempts++;return {error:{code:'23505',message:'duitku_orders_document_key_key'}};});
  assert.equal(attempts,1);
  attempts=0;
  await reserveInvoice(async()=>{attempts++;return {error:{code:'23505',message:'duitku_orders_pkey'}};});
  assert.equal(attempts,3);
});

test('order lookup normalizes invoice case and Indonesian WhatsApp formats without accepting partial searches',async()=>{
  const {parseOrderLookup}=await moduleFrom('src/features/orders/lib/lookup.ts');
  assert.deepEqual(parseOrderLookup(' gls-a7f29b83c1d4 '),{kind:'invoice',invoice:'GLS-A7F29B83C1D4'});
  assert.deepEqual(parseOrderLookup('GLS-8644B90D-5365-4A41-AD04-3355302481BF'),{kind:'invoice',invoice:'GLS-8644b90d-5365-4a41-ad04-3355302481bf'});
  const expected={kind:'whatsapp',numbers:['08123456789','628123456789','+628123456789']};
  for(const value of ['08123456789','628123456789','+62 812-3456-789']) assert.deepEqual(parseOrderLookup(value),expected);
  for(const value of ['', 'GLS-', '0812', '12345', 'GLS-%', 'or=(owner_id.neq.null)', '+1 2345678900']) assert.equal(parseOrderLookup(value),null);
});
test('guest lookup shows invoice metadata and payment actions without exposing document access capabilities',async()=>{
  const lookup=await moduleFrom('src/features/orders/lib/lookup.ts');
  const http=await moduleFrom('src/features/payments/server/http.ts');
  let user=null, allowed=true, clientCalls=0, publicFields='', maxRows=0;
  const records=[{id:'GLS-A7F29B83C1D4',owner_id:'owner',whatsapp:'08123456789',document_name:'private.txt',status:'pending',amount:10000,created_at:'2026-10-20T00:00:00Z',expires_at:null,paid_at:null},{id:'GLS-B7F29B83C1D4',owner_id:'other',whatsapp:'08123456789',document_name:'other-private.txt',status:'paid',amount:10000,created_at:'2026-10-19T18:00:00Z'}];
  function builder(isPublic){let fields='',filters=[];return {
    select(value){fields=value;if(isPublic)publicFields=value;return this;},eq(key,value){filters.push(row=>row[key]===value);return this;},in(key,values){filters.push(row=>values.includes(row[key]));return this;},order(){return this;},async limit(value){maxRows=value;return {error:null,data:records.filter(row=>filters.every(filter=>filter(row))).slice(0,value).map(row=>Object.fromEntries(fields.split(',').map(key=>[key,row[key]])))}}};}
  globalThis.__lookupTest={...lookup,...http,dashboardUser:async()=>user,serverClient:async()=>{clientCalls++;return {database:{from:()=>builder(false)}}},paymentAdmin:()=>({database:{from:()=>builder(true)}}),allowOrderLookup:async()=>allowed,orderAccess:async()=>({allowed:false,code:null})};
  const {POST}=await moduleFrom('src/app/api/payments/orders/lookup/route.ts',{
    'import { dashboardUser, serverClient } from "@/features/auth/server";':'const {dashboardUser,serverClient}=globalThis.__lookupTest;',
    'import { orderAccess } from "@/features/payments/server/guest";':'const {orderAccess}=globalThis.__lookupTest;',
    'import { LOOKUP_COLUMNS, PUBLIC_LOOKUP_COLUMNS, lookupSummary, orderLookupSchema, parseOrderLookup, type LookupOrder } from "@/features/orders/lib/lookup";':'const {LOOKUP_COLUMNS,PUBLIC_LOOKUP_COLUMNS,lookupSummary,orderLookupSchema,parseOrderLookup}=globalThis.__lookupTest; type LookupOrder=any;',
    'import { json, sameOrigin } from "@/features/payments/server/http";':'const {json,sameOrigin}=globalThis.__lookupTest;',
    'import { paymentAdmin } from "@/features/payments/server/repository";':'const {paymentAdmin}=globalThis.__lookupTest;',
    'import { allowOrderLookup } from "@/features/payments/server/lookup-limit";':'const {allowOrderLookup}=globalThis.__lookupTest;'
  });
  const request=(body,origin='http://localhost:3000')=>new Request('http://localhost:3000/api/payments/orders/lookup',{method:'POST',headers:{host:'localhost:3000',origin},body:typeof body==='string'?body:JSON.stringify(body)});
  try {
    assert.equal((await POST(request({query:'08123456789'},'https://attacker.test'))).status,403);
    assert.equal((await POST(request({query:'0812'}))).status,400);
    assert.equal((await POST(request({query:'08123456789',owner_id:'other'}))).status,400);
    assert.equal((await POST(request('{bad json'))).status,400);
    assert.equal((await POST(request('x'.repeat(513)))).status,413);
    const response=await POST(request({query:'+628123456789'}));
    assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
    const body=await response.json();assert.equal(body.orders.length,2);assert.equal(maxRows,30);assert.equal(clientCalls,0);
    assert.equal(publicFields,lookup.PUBLIC_LOOKUP_COLUMNS+',owner_id,guest_hash,access_hash');
    for(const order of body.orders){
      assert.match(order.id,/^GLS-[0-9A-F]{12}$/);assert.equal(order.can_open,true);assert.equal(order.can_download,false);assert.equal(typeof order.document_name,'string');assert.equal(order.amount,10000);
      for(const field of ['owner_id','whatsapp','email','document_key','document_url','reference','qr_string','payment_url','guest_hash','access_hash','access_code']) assert.equal(order[field],undefined);
    }
    const byInvoice=(await (await POST(request({query:records[0].id.toLowerCase()}))).json()).orders;
    assert.equal(byInvoice[0].id,records[0].id);assert.equal(byInvoice[0].document_name,'private.txt');assert.equal(byInvoice[0].can_open,true);assert.equal(byInvoice[0].can_download,false);
    user={id:'owner'};
    const own=(await (await POST(request({query:'08123456789'}))).json()).orders;
    assert.equal(own.length,1);assert.equal(own[0].id,records[0].id);assert.equal(own[0].document_name,'private.txt');assert.equal(own[0].amount,10000);assert.equal(own[0].can_open,true);
    const other=(await (await POST(request({query:records[1].id}))).json()).orders;
    assert.equal(other[0].document_name,'other-private.txt');assert.equal(other[0].can_open,true);assert.equal(other[0].can_download,false);
    allowed=false;
    const limited=await POST(request({query:records[0].id}));assert.equal(limited.status,429);assert.equal(limited.headers.get('retry-after'),'60');
  } finally {delete globalThis.__lookupTest;}
});
test('public lookup rate key ignores untrusted forwarded headers and hashes trusted addresses',async()=>{
  const {lookupRateKey}=await moduleFrom('src/features/payments/server/lookup-limit.ts',{'import { paymentAdmin } from "./repository";':'const paymentAdmin=()=>{};'});
  const previous=process.env.VERCEL;
  const request=address=>new Request('http://localhost',{headers:{'x-forwarded-for':address,'x-vercel-forwarded-for':address}});
  try {
    delete process.env.VERCEL;
    assert.equal(lookupRateKey(request('192.0.2.1'),'secret'),lookupRateKey(request('192.0.2.2'),'secret'));
    process.env.VERCEL='1';
    const key=lookupRateKey(request('192.0.2.1'),'secret');assert.match(key,/^[a-f0-9]{64}$/);
    assert.notEqual(key,lookupRateKey(request('192.0.2.2'),'secret'));
    assert.equal(lookupRateKey(request('invalid'),'secret'),lookupRateKey(request('also-invalid'),'secret'));
  } finally {if(previous===undefined)delete process.env.VERCEL;else process.env.VERCEL=previous;}
});

test('guest access uses independent unguessable order codes and httpOnly browser credentials',async()=>{
  const store=new Map();const settings=[];
  globalThis.__guestCookies={get:name=>store.has(name)?{value:store.get(name)}:undefined,set:(name,value,options)=>{store.set(name,value);settings.push(options);}};
  const guest=await moduleFrom('src/features/payments/server/guest.ts',{'import { cookies } from "next/headers";':'const cookies=async()=>globalThis.__guestCookies;'});
  try {
    assert.equal(await guest.guestSession(),null);
    const session=await guest.guestSession(true);assert.match(session.secret,/^[A-Za-z0-9_-]{43}$/);assert.equal(settings[0].httpOnly,true);assert.equal(settings[0].sameSite,'lax');
    assert.deepEqual(await guest.guestSession(),session);
    const id='GLS-A7F29B83C1D4',code=guest.orderAccessCode(session.secret,id),hash=guest.accessDigest(code);
    assert.equal(guest.matchesAccess(code,hash),true);assert.equal(guest.matchesAccess(guest.orderAccessCode(session.secret,'GLS-B7F29B83C1D4'),hash),false);assert.equal(guest.matchesAccess(id,hash),false);
    const order={id,owner_id:null,guest_hash:session.hash,access_hash:hash};
    assert.equal((await guest.orderAccess(order)).allowed,true);
    store.clear();assert.equal((await guest.orderAccess(order)).allowed,false);
    await guest.saveOrderAccess(id,code);assert.equal((await guest.orderAccess(order)).allowed,true);
    assert.equal((await guest.orderAccess({...order,id:'GLS-B7F29B83C1D4'})).allowed,false);
    store.clear();assert.equal((await guest.orderAccess({...order,owner_id:'owner'},'owner')).allowed,true);assert.equal((await guest.orderAccess({...order,owner_id:'owner'},'other')).allowed,false);
  } finally {delete globalThis.__guestCookies;}
});
test('report download requires access, verified payment, a real report and an unexpired download window',async()=>{
  const {reportAvailability}=await moduleFrom('src/features/payments/server/report.ts');
  const order={status:'paid',fulfillment_status:'completed',report_key:'sealed/report.pdf',report_expires_at:'2026-10-21T00:00:00Z'};const now=Date.parse('2026-10-20T00:00:00Z');
  assert.equal(reportAvailability(order,false,now),403);
  assert.equal(reportAvailability({...order,status:'pending'},true,now),409);
  assert.equal(reportAvailability({...order,fulfillment_status:'processing'},true,now),404);
  assert.equal(reportAvailability({...order,report_key:null},true,now),404);
  assert.equal(reportAvailability({...order,report_expires_at:'2026-10-20T00:00:00Z'},true,now),410);
  assert.equal(reportAvailability({...order,report_expires_at:'invalid'},true,now),410);
  assert.equal(reportAvailability(order,true,now),200);
});
test('server rejects renamed or mismatched document formats before sealing an upload',async()=>{
  const {validDocumentHeader}=await moduleFrom('src/features/payments/server/uploads.ts',{
    'import { paymentAdmin } from "./repository";':'const paymentAdmin=()=>{};',
    'import { PAYMENT_DOCUMENT_BUCKET } from "../types";':'const PAYMENT_DOCUMENT_BUCKET="test";'
  });
  const bytes=value=>new TextEncoder().encode(value);
  assert.equal(validDocumentHeader(bytes('%PDF-1.7\n'),'report.pdf'),true);
  assert.equal(validDocumentHeader(bytes('<script>bad</script>'),'report.pdf'),false);
  assert.equal(validDocumentHeader(bytes('PK\u0003\u0004'),'document.docx'),true);
  assert.equal(validDocumentHeader(bytes('text'),'document.docx'),false);
  assert.equal(validDocumentHeader(bytes('ordinary text'),'document.txt'),true);
  assert.equal(validDocumentHeader(new Uint8Array([0,1,2]),'document.txt'),false);
});
