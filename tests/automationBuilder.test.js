import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import React from 'react';
import { create, act } from 'react-test-renderer';
const require = createRequire(import.meta.url);
// Pure helper modules (no side effects) are loaded for real; everything else the editor imports is stubbed below.
function pureUtil(file) {
 const m = { exports: {} };
 vm.runInNewContext(require('esbuild').transformSync(readFileSync(new URL('../src/' + file, import.meta.url),'utf8'), { loader:'js',format:'cjs' }).code, { module:m, exports:m.exports });
 return m.exports;
}
function component(file, apis) {
 const module = { exports: {} };
 const code = require('esbuild').transformSync(readFileSync(new URL('../src/' + file, import.meta.url),'utf8'), { loader:'jsx',format:'cjs',jsx:'automatic' }).code;
 vm.runInNewContext(code,{module,exports:module.exports,console,require(name){
  if(name==='react')return React;
  if(name==='react/jsx-runtime')return require(name);
  if(name==='lucide-react')return new Proxy({},{get:()=> 'span'});
  if(name.includes('services/api'))return apis;
  if(name.includes('AuthContext'))return{useAuth:()=>({user:{role:'admin'}})};
  if(name.includes('ConfirmDialog'))return{useConfirmDialog:()=>async()=>true};
  if(name.includes('Toast'))return{useToast:()=>({success:()=>{},error:message=>{throw new Error(message);}})};
  if(name.includes('utils/delay'))return pureUtil('utils/delay.js');
  if(name.includes('utils/leadVariables'))return pureUtil('utils/leadVariables.js');
  if(name.includes('utils/sequenceStatus'))return pureUtil('utils/sequenceStatus.js');
  if(name.includes('/SequenceList'))return{__esModule:true,default:component('pages/LeadAutomation/SequenceList.jsx',apis)};
  if(name.includes('VariableHelp'))return{__esModule:true,default:()=>null,UnknownVariables:()=>null};
  return{__esModule:true,default:()=>null};
 }});
 return module.exports.default;
}
test('editing preserves routes, stop conditions, language and parameter mapping in the save payload',async()=>{
 let saved;
 const common={id:'common',name:'Enquiry',description:'',is_active:false,stop_conditions:{on_reply:true,demo_booked:true,customer_converted:true},steps:[{channel:'whatsapp',delay_minutes:0,message:'',always_template:true,approved_template_name:'welcome',template_language:'en_US',template_parameters:[{field:'name'}],reply_routes:[{answer:'1',classification:'New Business',aliases:['starting a business'],sequence_id:'branch'}]}]};
 const empty=async()=>({data:{}});
 const Builder=component('pages/LeadAutomation/AutomationBuilder.jsx',{automationAPI:{getSequences:async()=>({data:{sequences:[common,{id:'branch',name:'Branch',steps:[]}]}}),getRules:async()=>({data:{rules:[]}}),updateSequence:async(id,body)=>{saved=body;}},stageAPI:{getAll:empty},statusAPI:{getAll:empty,byStage:empty},campaignAPI:{getAll:empty},templateAPI:{getAll:empty},whatsappAPI:{getBroadcastTemplates:async()=>({data:{templates:[]}})}});
 let r;await act(async()=>{r=create(React.createElement(Builder));});
 await act(async()=>r.root.findByProps({'aria-label':'Edit sequence Enquiry'}).props.onClick());
 assert.equal(r.root.findByProps({'aria-label':'Step 1 template language'}).props.value,'en_US');
 assert.equal(r.root.findByProps({'aria-label':'Step 1 parameter 1'}).props.value,'name');
 const update=r.root.findAllByType('button').find(b=>b.children.includes('Update'));
 await act(async()=>update.props.onClick());
 assert.equal(saved.is_active,false);assert.equal(saved.stop_conditions.demo_booked,true);assert.equal(saved.steps[0].always_template,true);assert.deepEqual(JSON.parse(JSON.stringify(saved.steps[0].reply_routes)),common.steps[0].reply_routes);
 await act(async()=>r.unmount());
});
test('uncertain-delivery UI requires a note and provider ID before confirming sent',async()=>{
 let saved;let recovered=0;
 const Recovery=component('components/lead/AutomationRecovery.jsx',{automationAPI:{recoverEnrollment:async(id,body)=>{saved={id,...body};}}});
 let r;await act(async()=>{r=create(React.createElement(Recovery,{enrollment:{id:'e',status:'uncertain',last_error:'timeout'},onRecovered:()=>recovered++}));});
 const button=()=>r.root.findAllByType('button').find(b=>b.children.includes('Confirm sent'));
 assert.equal(button().props.disabled,true);
 await act(async()=>r.root.findByType('textarea').props.onChange({target:{value:'Verified with provider'}}));
 assert.equal(button().props.disabled,true);
 await act(async()=>r.root.findByType('input').props.onChange({target:{value:'wamid-confirmed'}}));
 assert.equal(button().props.disabled,false);
 await act(async()=>button().props.onClick());
 assert.equal(saved.action,'confirmed_sent');assert.equal(saved.provider_id,'wamid-confirmed');assert.equal(recovered,1);
 await act(async()=>r.unmount());
});

const textOf = (node) => (node == null ? '' : typeof node === 'string' ? node : Array.isArray(node) ? node.map(textOf).join(' ') : textOf(node.children));
test('the sequence list shows status, lead counts, what starts each sequence, and the right actions',async()=>{
 const List=component('pages/LeadAutomation/SequenceList.jsx',{});
 const seqs=[
  {id:'a',name:'Nurture',is_active:true,steps:[1,2,3],enrolled_total:12,enrolled_active:7,with_errors:0,in_review:1},
  {id:'b',name:'Winback',is_active:false,steps:[1],enrolled_total:4,enrolled_active:0,with_errors:0,in_review:0},
  {id:'c',name:'Fresh',is_active:false,steps:[],enrolled_total:0},
  {id:'d',name:'Broken',is_active:true,steps:[1],enrolled_total:3,enrolled_active:1,with_errors:2},
 ];
 const rules=[{id:'r1',sequence_id:'a',is_active:true,trigger_type:'new_lead'},{id:'r2',sequence_id:'b',is_active:false,trigger_type:'new_lead'}];
 const calls=[];
 const handlers={onEdit:s=>calls.push(['edit',s.id]),onToggle:s=>calls.push(['toggle',s.id]),onDuplicate:s=>calls.push(['dup',s.id]),onDelete:s=>calls.push(['del',s.id])};
 let r;await act(async()=>{r=create(React.createElement(List,{sequences:seqs,rules,isAdmin:true,triggerLabel:x=>x.trigger_type==='new_lead'?'New lead received':'?',...handlers}));});
 const all=textOf(r.toJSON()).replace(/\s+/g,' ');
 for(const t of ['Active','Paused','Draft','Has errors','3 steps','12 leads enrolled (7 in progress)','1 needs review','Starts when: New lead received','New lead received (off)','No trigger starts this sequence yet','2 leads blocked or failed'])assert.ok(all.includes(t),t);
 const btn=label=>r.root.findByProps({'aria-label':label});
 assert.ok(btn('Pause sequence Nurture')&&btn('Resume sequence Winback')&&btn('Turn on sequence Fresh'));
 for(const [label,expected] of [['Pause sequence Nurture',['toggle','a']],['Resume sequence Winback',['toggle','b']],['Duplicate sequence Fresh',['dup','c']],['Delete sequence Broken',['del','d']],['Edit sequence Nurture',['edit','a']]]){
  calls.length=0;await act(async()=>btn(label).props.onClick());assert.deepEqual(calls[0],expected,label);
 }
 await act(async()=>r.unmount());
 await act(async()=>{r=create(React.createElement(List,{sequences:seqs,rules,isAdmin:false,triggerLabel:()=>'x',...handlers}));});
 assert.equal(r.root.findAllByType('button').length,0,'staff who cannot manage automations see no action buttons');
 assert.ok(textOf(r.toJSON()).includes('Nurture'));
 await act(async()=>r.unmount());
});
