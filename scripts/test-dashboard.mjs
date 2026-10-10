import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';
const dir = await mkdtemp(resolve('.dashboard-test-'));
after(() => rm(dir, { recursive: true, force: true }));
for (const [name,path] of [['plans','src/lib/plans.ts'],['model','src/lib/dashboard/model.ts']]) {
  const source = (await readFile(path,'utf8')).replace('"../plans"','"./plans.mjs"');
  await writeFile(`${dir}/${name}.mjs`,ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
}
const {initialDemo,demoReducer,purchaseError,demoSchema,upgradeDemoRetention} = await import(`${dir}/model.mjs`);
const at = '2026-10-07T12:00:00.000Z';
const purchase = (kind, extra={}) => ({id:'test-1',kind,amount:10000,method:'qris',at,...extra});
const apply = (state,p,outcome='success') => demoReducer(state,{type:'purchase',purchase:p,outcome});
test('top-up adds balance exactly once',()=>{
 const s=initialDemo(true), p=purchase('topup',{amount:25000}); const next=apply(s,p);
 assert.equal(next.balance,25000); assert.equal(next.transactions.length,1); assert.deepEqual(apply(next,p),next);
});
test('package purchase debits balance and adds the exact quota',()=>{
 const p=purchase('package',{amount:45000,planId:'starter',method:'balance'}); const next=apply(initialDemo(),p);
 assert.equal(next.balance,5000); assert.equal(next.quota,7);
 assert.equal(apply(initialDemo(true),p).transactions.length,0);
});
test('QRIS package does not debit wallet',()=>{
 const next=apply(initialDemo(true),purchase('package',{amount:85000,planId:'standart'})); assert.equal(next.balance,0); assert.equal(next.quota,10);
});
test('failed and expired payments do not change wallet or quota',()=>{
 for(const outcome of ['failed','expired']) { const s=initialDemo(),next=apply(s,purchase('order',{method:'quota'}),outcome); assert.equal(next.balance,s.balance);assert.equal(next.quota,s.quota);assert.equal(next.orders[0].payment,outcome); }
});
test('failed processing refunds quota once and is terminal',()=>{
 const s=initialDemo(), next=apply(s,purchase('order',{method:'quota'})); assert.equal(next.quota,1);
 const action={type:'progress',id:'test-1',status:'failed',at}; const refunded=demoReducer(next,action);
 assert.equal(refunded.quota,2); assert.equal(refunded.orders[0].payment,'refunded'); assert.deepEqual(demoReducer(refunded,action),refunded);
});
test('wallet refund restores balance, QRIS refund does not credit wallet',()=>{
 for(const method of ['balance','qris']) {const s=initialDemo(),paid=apply(s,purchase('order',{method}));const failed=demoReducer(paid,{type:'progress',id:'test-1',status:'failed',at});assert.equal(failed.balance,s.balance);assert.equal(failed.transactions[0].kind,'refund');}
});
test('invalid requests, insufficient funds and empty quota are rejected',()=>{
 const s=initialDemo(true); for(const p of [purchase('topup',{amount:9999}),purchase('order',{amount:1}),purchase('package',{amount:1,planId:'starter'}),purchase('order',{method:'quota'}),purchase('order',{method:'balance'})]) {assert.ok(purchaseError(s,p));assert.deepEqual(apply(s,p),s);}
});
test('pending order settles once; completion cannot later refund',()=>{
 const s=initialDemo(),p=purchase('order',{id:'DEMO-1002'}),paid=apply(s,p);assert.equal(paid.orders.filter(x=>x.id===p.id).length,1);assert.equal(paid.orders[0].words,3200);
 const done=demoReducer(paid,{type:'progress',id:p.id,status:'completed',at});assert.equal(done.orders[0].completedAt,at);assert.deepEqual(demoReducer(done,{type:'progress',id:p.id,status:'failed',at}),done);
});
test('saved state validates and reset supports empty account',()=>{
 const s=initialDemo(); assert.ok(demoSchema.safeParse(JSON.parse(JSON.stringify(s))).success); assert.equal(demoSchema.safeParse({...s,balance:-1}).success,false);
 const empty=demoReducer(s,{type:'reset',empty:true});assert.equal(empty.orders.length,0);assert.equal(empty.quota,0);assert.equal(empty.balance,0);
});

test('old completed sample gains expiry without changing unrelated orders',()=>{
 const state=initialDemo();delete state.orders.find(o=>o.id==='DEMO-1001').completedAt;
 const next=upgradeDemoRetention(state);assert.equal(next.orders.find(o=>o.id==='DEMO-1001').completedAt,'2026-10-06T09:00:00.000Z');assert.deepEqual(next.orders[0],state.orders[0]);
});
