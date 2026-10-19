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
    let variation={};
    globalThis.fetch=async(url,init)=>{
      assert.equal(url,'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry');
      const payload=JSON.parse(init.body);
      assert.equal(payload.paymentMethod,'NQ');assert.equal(payload.paymentAmount,10000);assert.equal(payload.signature,gateway.signature('DS123GLS-test10000','test-secret'));
      assert.equal(payload.callbackUrl,'https://shop.example.test/api/payments/duitku/callback');
      assert.equal(payload.returnUrl,'https://shop.example.test/pembayaran?order=GLS-test');
      return Response.json({statusCode:'00',merchantCode:'DS123',amount:'10000',reference:'ref',paymentUrl:'https://sandbox.duitku.com/pay',...variation});
    };
    await gateway.createInvoice(order,'NQ',{email:'test@example.invalid',name:'Tester',whatsapp:'08123456789'});
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
