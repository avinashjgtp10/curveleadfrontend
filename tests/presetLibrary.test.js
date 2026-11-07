import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, SUGGESTED_TEMPLATES, suggestStage, selectableStages, templateNeeds, buildPreset, stopsText } from '../src/utils/presetLibrary.js';
import { categoryOf } from '../src/utils/templatePicker.js';

const j = (v) => JSON.parse(JSON.stringify(v));
const tpl = (name, status = 'APPROVED', language = 'en_US') => ({ name, status, language, category: 'UTILITY', components: [{ type: 'BODY', text: 'Hi {{1}}' }] });

test('the library has the 8 presets and every one is safe by construction', () => {
  assert.deepEqual(PRESETS.map((p) => p.id), ['new_lead_nurture', 'no_response_followup', 'demo_booking', 'noshow_recovery', 'post_demo', 'quotation_followup', 'lost_reactivation', 'customer_upsell']);
  for (const p of PRESETS) {
    assert.ok(p.steps.length >= 1 && p.steps.every((s) => SUGGESTED_TEMPLATES[s.need]), p.id);
    assert.ok(p.stops.on_reply || ['demo_booking'].includes(p.id), `${p.id} stops on reply`);
    assert.ok(p.stops.customer_converted || p.id === 'customer_upsell', `${p.id} stops on conversion`);
  }
  for (const t of Object.values(SUGGESTED_TEMPLATES)) {
    const gaps = [...t.body_text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]);
    assert.deepEqual(gaps, ['1'], t.name); assert.equal(t.examples.length, 1);
    assert.match(t.name, /^[a-z0-9_]+$/); assert.ok(['UTILITY', 'MARKETING'].includes(categoryOf(t)));
    assert.ok(!/salon|clinic|gym|school|restaurant|hotel|patient/i.test(t.body_text), 'industry-neutral');
  }
});
test('confirmations and reminders are Utility; nudges and re-engagement are Marketing', () => {
  const cat = (id) => PRESETS.find((p) => p.id === id).steps.map((s) => SUGGESTED_TEMPLATES[s.need].category);
  assert.deepEqual(cat('demo_booking'), ['UTILITY', 'UTILITY']);
  assert.deepEqual(cat('lost_reactivation'), ['MARKETING']);
  assert.deepEqual(cat('customer_upsell'), ['MARKETING']);
});
test('stages are suggested from the workspace\'s own names and a lost stage is never offered', () => {
  const stages = [{ name: 'New' }, { name: 'Demo Booked' }, { name: 'No Show' }, { name: 'Lost', is_lost: true }, { name: 'Revisit later' }, { name: 'Won', is_won: true }];
  const by = (id) => PRESETS.find((p) => p.id === id).trigger;
  assert.equal(suggestStage(stages, by('demo_booking')), 'Demo Booked');
  assert.equal(suggestStage(stages, by('noshow_recovery')), 'No Show');
  assert.equal(suggestStage(stages, by('lost_reactivation')), 'Revisit later');
  assert.equal(suggestStage(stages, by('customer_upsell')), 'Won');
  assert.equal(suggestStage([{ name: 'Lost', is_lost: true }, { name: 'Revisit', is_lost: true }], by('lost_reactivation')), '');
  assert.equal(suggestStage(stages, by('new_lead_nurture')), '');
  assert.deepEqual(selectableStages(stages).map((s) => s.name), ['New', 'Demo Booked', 'No Show', 'Revisit later', 'Won']);
});
test('template needs say whether each template is approved, pending, rejected or missing', () => {
  const needs = templateNeeds(PRESETS[0], [tpl('lead_welcome'), tpl('lead_checkin', 'REJECTED')]);
  assert.deepEqual(needs.map((n) => [n.name, n.status]), [['lead_welcome', 'approved'], ['lead_checkin', 'rejected']]);
  assert.equal(templateNeeds(PRESETS[0], [tpl('lead_checkin', 'PENDING')])[1].status, 'pending');
  assert.deepEqual(templateNeeds(PRESETS[0], []).map((n) => n.status), ['missing', 'missing']);
});
test('building a preset uses an approved template, otherwise keeps plain text and no template', () => {
  const full = buildPreset(PRESETS[0], { templates: [tpl('lead_welcome'), tpl('lead_checkin', 'APPROVED', 'en')] });
  assert.deepEqual(j(full.sequence.steps.map((s) => [s.always_template, s.approved_template_name, s.template_language])), [[true, 'lead_welcome', 'en_US'], [true, 'lead_checkin', 'en'], [true, 'lead_checkin', 'en']]);
  assert.deepEqual(j(full.sequence.steps[0].template_parameters), [{ field: 'name' }]);
  const none = buildPreset(PRESETS[0], { templates: [] });
  assert.ok(none.sequence.steps.every((s) => s.always_template === undefined && s.approved_template_name === undefined && /\{\{name\}\}/.test(s.message)));
  assert.deepEqual(j(none.sequence.steps.map((s) => [s.delay_minutes, s.delay_unit])), [[0, 'minutes'], [1440, 'days'], [4320, 'days']]);
  assert.deepEqual(j(none.rule), { name: 'New lead nurture', trigger_type: 'new_lead', stage_name: '' });
  assert.deepEqual(j(buildPreset(PRESETS[2], { stageName: 'Demo Booked' }).rule), { name: 'Demo booking and reminders', trigger_type: 'stage_change', stage_name: 'Demo Booked' });
});
test('when a preset stops is stated in plain English', () => {
  assert.equal(stopsText(PRESETS[0].stops), 'Stops when the lead replies, a demo is booked, the lead becomes a customer or the lead opts out.');
  assert.equal(stopsText({ on_reply: true }), 'Stops when the lead replies or the lead opts out.');
});
