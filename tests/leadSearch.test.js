import test from 'node:test';
import assert from 'node:assert/strict';
import { matchParts, normalizeHiddenStages, effectiveHiddenStages, createLatestRequest } from '../src/utils/leadSearch.js';
test('one hidden-stage default; explicit preferences preserved and explicit stage remains selectable',()=>{
 assert.deepEqual(normalizeHiddenStages(undefined),['unqualified','lost']);
 assert.deepEqual(normalizeHiddenStages([]),[]);
 assert.deepEqual(normalizeHiddenStages(['WON','won',' Lost ']),['won','lost']);
 assert.deepEqual(effectiveHiddenStages(['won','lost'],'Won'),['lost']);
});
test('highlights accented and astral names, literal symbols and formatted phone suffixes safely',()=>{
 const marked=(v,q,phone)=>matchParts(v,q,phone).filter(p=>p.match).map(p=>p.text).join('');
 assert.equal(marked('José Pérez','jose'),'José');
 assert.equal(marked('𝐒𝐮𝐧𝐢𝐭𝐚 Sharma','Sunita'),'𝐒𝐮𝐧𝐢𝐭𝐚');
 assert.equal(marked('+91 89802 35151','235151',true),'2 35151');
 assert.equal(marked('100% Hair','%'),'%');
 assert.equal(marked('<script>alert(1)</script>','script'),'scriptscript');
 assert.equal(matchParts('e\u0301','e')[0].text,'e\u0301');
});
test('late responses cannot overwrite newer searches or updates after unmount',()=>{
 const manager=createLatestRequest();const old=manager.begin();const current=manager.begin();
 assert.equal(old.signal.aborted,true);assert.equal(old.isCurrent(),false);assert.equal(current.isCurrent(),true);
 manager.cancel();assert.equal(current.signal.aborted,true);assert.equal(current.isCurrent(),false);
});
