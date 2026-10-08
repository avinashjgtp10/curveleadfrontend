import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import React from 'react';
import { create, act } from 'react-test-renderer';
const require = createRequire(import.meta.url);
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
