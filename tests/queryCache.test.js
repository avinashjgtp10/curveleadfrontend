import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiCache, invalidatedPaths, isRequestCancelled } from '../src/services/queryCache.js';
const deferred = () => { let resolve, reject; const promise = new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const pause = () => new Promise(r => setTimeout(r, 5));
test('simultaneous callers and fresh reads share one request; mutations invalidate related paths',async t=>{
 let calls=0;const wait=deferred();
 const cache=createApiCache({getSession:()=> 'user-a',fetcher:async()=>{calls++;return wait.promise;}});t.after(()=>cache.clear());
 const one=cache.read('/auth/preferences'),two=cache.read('/auth/preferences');assert.equal(calls,1);
 wait.resolve({data:{preferences:{}}});assert.deepEqual(await one,await two);
 await cache.read('/auth/preferences');assert.equal(calls,1);
 await cache.invalidate(invalidatedPaths('/auth/preferences'));await cache.read('/auth/preferences');assert.equal(calls,2);
});
test('cache keys normalize params and isolate filters, pages and auth sessions',async t=>{
 let session='a',calls=0;
 const cache=createApiCache({getSession:()=>session,fetcher:async()=>({data:{value:++calls}})});t.after(()=>cache.clear());
 assert.equal((await cache.read('/leads',{page:1,search:'Harish'})).data.value,1);
 assert.equal((await cache.read('/leads',{search:'Harish',unused:undefined,page:1})).data.value,1);
 assert.equal((await cache.read('/leads',{page:2,search:'Harish'})).data.value,2);
 session='b';assert.equal((await cache.read('/leads',{page:1,search:'Harish'})).data.value,3);
 cache.clear();assert.equal((await cache.read('/leads',{page:1,search:'Harish'})).data.value,4);
 assert.ok(!JSON.stringify(cache.client.getQueryCache().getAll().map(q=>q.queryKey)).includes('user-a'));
});
test('one cancelled consumer does not abort another; final unsubscribe aborts transport',async t=>{
 let transport,requests=0;const wait=deferred();
 const cache=createApiCache({getSession:()=> 'a',fetcher:async(url,params,signal)=>{requests++;transport=signal;return wait.promise;}});t.after(()=>cache.clear());
 const a=new AbortController(),b=new AbortController();
 const one=cache.read('/leads',{search:'Harish'},{signal:a.signal}).catch(e=>e);
 const two=cache.read('/leads',{search:'Harish'},{signal:b.signal}).catch(e=>e);
 a.abort();assert.ok(isRequestCancelled(await one));await pause();assert.equal(transport.aborted,false);assert.equal(requests,1);
 b.abort();assert.ok(isRequestCancelled(await two));await pause();assert.equal(transport.aborted,true);
 wait.resolve({data:{old:true}});await pause();assert.equal(cache.client.getQueryData(['api',1,'/leads',{search:'Harish'}]),undefined);
});
test('StrictMode-like abort/remount in one turn reuses the request',async t=>{
 let requests=0;const wait=deferred();
 const cache=createApiCache({getSession:()=> 'a',fetcher:async()=>{requests++;return wait.promise;}});t.after(()=>cache.clear());
 const controller=new AbortController();
 const first=cache.read('/leads',{}, {signal:controller.signal}).catch(e=>e);
 controller.abort();const second=cache.read('/leads');await pause();assert.equal(requests,1);
 wait.resolve({data:{leads:[]}});assert.ok(isRequestCancelled(await first));assert.deepEqual(await second,{data:{leads:[]}});
});
test('invalidating during a read prevents the older result from repopulating the cache',async t=>{
 let requests=0;const wait=deferred();
 const cache=createApiCache({getSession:()=> 'a',fetcher:async()=>++requests===1?wait.promise:{data:{fresh:true}}});t.after(()=>cache.clear());
 const old=cache.read('/leads').catch(e=>e);await cache.invalidate(invalidatedPaths('/leads/123'));assert.ok(isRequestCancelled(await old));
 assert.deepEqual(await cache.read('/leads'),{data:{fresh:true}});wait.resolve({data:{fresh:false}});await pause();
 assert.deepEqual(await cache.read('/leads'),{data:{fresh:true}});
});
test('failed reads are retryable, forced refresh bypasses freshness, unrelated mutations preserve reference cache',async t=>{
 let calls=0;
 const cache=createApiCache({getSession:()=> 'a',fetcher:async()=>{if(++calls===1)throw new Error('offline');return {data:calls};}});t.after(()=>cache.clear());
 await assert.rejects(cache.read('/staff'),/offline/);assert.equal((await cache.read('/staff')).data,2);
 await cache.invalidate(invalidatedPaths('/leads/123'));assert.equal((await cache.read('/staff')).data,2);
 assert.equal((await cache.read('/staff',{}, {force:true})).data,3);
});
test('changing sessions cancels an old in-flight read and caches only the new account result',async t=>{
 let session='a',requests=0;const pending=deferred();
 const cache=createApiCache({getSession:()=>session,fetcher:async()=>++requests===1?pending.promise:{data:{account:'b'}}});t.after(()=>cache.clear());
 const old=cache.read('/auth/me').catch(e=>e);session='b';
 assert.deepEqual(await cache.read('/auth/me'),{data:{account:'b'}});
 assert.ok(isRequestCancelled(await old));pending.resolve({data:{account:'a'}});await pause();
 assert.deepEqual(await cache.read('/auth/me'),{data:{account:'b'}});
});
