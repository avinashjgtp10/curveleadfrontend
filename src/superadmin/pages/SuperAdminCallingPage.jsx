import { useCallback, useEffect, useState } from 'react';
import Modal from '../components/ui/Modal';
import { superAdminAPI, voiceAdminAPI } from '../../services/api';
import { decimalToUnits, toMicro, toMinor, percentToBps, microToDisplay } from '../../utils/voiceCall';

const BTN = 'px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50';
const INPUT = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300';
const apiError = (e) => e.response?.data?.error || 'Request failed.';
const Field = ({ label, children, hint }) => (
  <label className="block text-xs font-medium text-gray-600 space-y-1"><span>{label}</span>{children}{hint && <span className="block text-[11px] text-gray-400">{hint}</span>}</label>
);
const Card = ({ title, children }) => (
  <section className="bg-white border rounded-2xl p-5 space-y-4"><h2 className="text-sm font-bold text-gray-900">{title}</h2>{children}</section>
);

function AccountCard({ tenantId, data, onSaved, setMsg }) {
  const a = data.account;
  const [f, setF] = useState({});
  useEffect(() => {
    setF({
      providerAccountReference: a?.provider_account_reference || '', status: a?.status || 'pending', businessVerificationStatus: a?.business_verification_status || 'unverified',
      defaultCurrency: a?.default_currency || 'INR', countries: (a?.allowed_destination_countries || []).join(', '), maxCallSeconds: a?.max_call_seconds ?? 1800,
      dailyCallLimitPerAgent: a?.daily_call_limit_per_agent ?? 200, dailySpend: a ? String(Number(a.daily_spend_limit_minor) / 100) : '0',
    });
  }, [a]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    const spend = toMinor(f.dailySpend);
    if (spend === null) return setMsg({ error: 'Daily spend limit must be a number.' });
    try {
      await voiceAdminAPI.saveAccount(tenantId, {
        providerAccountReference: f.providerAccountReference.trim() || null, status: f.status, businessVerificationStatus: f.businessVerificationStatus,
        defaultCurrency: f.defaultCurrency.trim().toUpperCase(), allowedDestinationCountries: f.countries.split(',').map(c => c.trim().toUpperCase()).filter(Boolean),
        maxCallSeconds: Number(f.maxCallSeconds), dailyCallLimitPerAgent: Number(f.dailyCallLimitPerAgent), dailySpendLimitMinor: spend,
      });
      setMsg({ ok: 'Account saved.' }); onSaved();
    } catch (e) { setMsg({ error: apiError(e) }); }
  };
  return (
    <Card title="Calling account">
      <p className="text-xs text-gray-500">Organization country: <b>{data.organizationCountry || 'not set'}</b>. Saving never enables a country route by itself; routes are approved separately below.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Telnyx connection ID"><input className={INPUT} value={f.providerAccountReference || ''} onChange={set('providerAccountReference')} /></Field>
        <Field label="Status"><select className={INPUT} value={f.status || 'pending'} onChange={set('status')}>{['pending', 'active', 'suspended', 'closed'].map(x => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Business verification"><select className={INPUT} value={f.businessVerificationStatus || 'unverified'} onChange={set('businessVerificationStatus')}>{['unverified', 'pending', 'verified', 'rejected'].map(x => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Currency"><input className={INPUT} value={f.defaultCurrency || ''} maxLength={3} onChange={set('defaultCurrency')} /></Field>
        <Field label="Approved destination countries" hint="ISO codes, comma separated (e.g. IN, AE, SG)"><input className={INPUT} value={f.countries || ''} onChange={set('countries')} /></Field>
        <Field label="Max call length (seconds)"><input type="number" className={INPUT} value={f.maxCallSeconds ?? ''} onChange={set('maxCallSeconds')} /></Field>
        <Field label="Daily calls per agent"><input type="number" className={INPUT} value={f.dailyCallLimitPerAgent ?? ''} onChange={set('dailyCallLimitPerAgent')} /></Field>
        <Field label="Daily spend limit" hint="0 = wallet balance only"><input className={INPUT} value={f.dailySpend ?? ''} onChange={set('dailySpend')} /></Field>
      </div>
      <button onClick={save} className={`${BTN} bg-indigo-600 text-white`}>Save account</button>
    </Card>
  );
}

function NumbersCard({ tenantId, data, onSaved, setMsg }) {
  const [num, setNum] = useState('');
  const add = async () => { try { await voiceAdminAPI.addNumber(tenantId, { phoneNumber: num }); setNum(''); setMsg({ ok: 'Caller ID added (pending verification).' }); onSaved(); } catch (e) { setMsg({ error: apiError(e) }); } };
  const setStatus = async (id, verificationStatus) => { try { await voiceAdminAPI.updateNumber(id, { verificationStatus }); onSaved(); } catch (e) { setMsg({ error: apiError(e) }); } };
  return (
    <Card title="Caller IDs">
      <p className="text-xs text-gray-500">Verify a number only after confirming the organization is entitled to present it. Unverified numbers are never used.</p>
      {data.numbers.length === 0 ? <p className="text-sm text-gray-500">No caller IDs yet.</p> : (
        <ul className="divide-y text-sm">{data.numbers.map(n => (
          <li key={n.id} className="py-2 flex items-center gap-3"><span className="font-medium flex-1">{n.phone_number_e164} <span className="text-gray-400">({n.country_code})</span></span>
            <span className="capitalize text-xs">{n.verification_status}</span>
            {n.verification_status !== 'verified' && <button className={`${BTN} bg-emerald-50 text-emerald-700`} onClick={() => setStatus(n.id, 'verified')}>Verify</button>}
            {n.verification_status !== 'revoked' && <button className={`${BTN} bg-red-50 text-red-700`} onClick={() => setStatus(n.id, 'revoked')}>Revoke</button>}</li>))}</ul>)}
      <div className="flex gap-2"><input className={INPUT} placeholder="+6561234567" value={num} onChange={e => setNum(e.target.value)} /><button disabled={!num} onClick={add} className={`${BTN} bg-indigo-600 text-white`}>Add</button></div>
    </Card>
  );
}

function RatesCard({ tenantId, data, onSaved, setMsg }) {
  const [f, setF] = useState({ destinationCountry: '', destinationPrefix: '', callType: 'any', currency: 'INR', cost: '', markup: '20', increment: '60', orgOnly: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const add = async () => {
    const cost = toMicro(f.cost); const bps = percentToBps(f.markup);
    if (cost === null || bps === null) return setMsg({ error: 'Cost and markup must be plain numbers.' });
    try {
      const { data: r } = await voiceAdminAPI.addRate({
        destinationCountry: f.destinationCountry.toUpperCase(), destinationPrefix: f.destinationPrefix.replace(/\D/g, ''), callType: f.callType, currency: f.currency.toUpperCase(),
        costPerMinuteMicro: cost, markupBps: Number(bps), billingIncrementSeconds: Number(f.increment), tenantId: f.orgOnly ? tenantId : undefined,
      });
      setMsg({ ok: `Rate added. Selling price: ${microToDisplay(r.sellingPricePerMinuteMicro)} per minute.` }); onSaved();
    } catch (e) { setMsg({ error: apiError(e) }); }
  };
  return (
    <Card title="Rates">
      <p className="text-xs text-gray-500">Enter the provider cost from your Telnyx price list; the selling price is cost plus markup. Adding a rate for the same country, prefix and type replaces the current one.</p>
      {data.rates.length === 0 ? <p className="text-sm text-gray-500">No rates yet. Without a rate, calls to that destination are refused.</p> : (
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="text-left text-gray-500"><tr>{['Scope', 'Country', 'Prefix', 'Type', 'Cost/min', 'Sell/min', 'Billed in', 'Cur', 'Status'].map(h => <th key={h} className="py-1 pr-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{data.rates.map(r => (
            <tr key={r.id}><td className="py-1 pr-3">{r.tenant_id ? 'This org' : 'Platform'}</td><td className="pr-3">{r.destination_country}</td><td className="pr-3">+{r.destination_prefix}</td><td className="pr-3">{r.call_type}</td>
              <td className="pr-3">{microToDisplay(r.cost_per_minute_micro)}</td><td className="pr-3">{microToDisplay(r.selling_price_per_minute_micro)}</td><td className="pr-3">{r.billing_increment_seconds}s</td><td className="pr-3">{r.currency}</td>
              <td className="pr-3">{r.effective_to ? 'superseded' : 'current'}</td></tr>))}</tbody></table></div>)}
      <div className="grid sm:grid-cols-4 gap-3">
        <Field label="Country (ISO)"><input className={INPUT} maxLength={2} value={f.destinationCountry} onChange={set('destinationCountry')} /></Field>
        <Field label="Prefix (digits)"><input className={INPUT} value={f.destinationPrefix} onChange={set('destinationPrefix')} placeholder="91" /></Field>
        <Field label="Type"><select className={INPUT} value={f.callType} onChange={set('callType')}>{['any', 'mobile', 'landline'].map(x => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Currency"><input className={INPUT} maxLength={3} value={f.currency} onChange={set('currency')} /></Field>
        <Field label="Provider cost / min"><input className={INPUT} value={f.cost} onChange={set('cost')} inputMode="decimal" /></Field>
        <Field label="Markup %"><input className={INPUT} value={f.markup} onChange={set('markup')} inputMode="decimal" /></Field>
        <Field label="Billing increment (s)"><input type="number" className={INPUT} value={f.increment} onChange={set('increment')} /></Field>
        <label className="flex items-end gap-2 text-xs pb-2"><input type="checkbox" checked={f.orgOnly} onChange={set('orgOnly')} /> Only for this organization</label>
      </div>
      <button onClick={add} disabled={!f.destinationCountry || !f.destinationPrefix || !f.cost} className={`${BTN} bg-indigo-600 text-white`}>Add rate</button>
    </Card>
  );
}

function RoutesCard({ setMsg }) {
  const [rows, setRows] = useState(null);
  const [pending, setPending] = useState(null); // { row, enable }
  const [notes, setNotes] = useState('');
  const load = useCallback(() => voiceAdminAPI.routes().then(({ data }) => setRows(data)).catch((e) => setMsg({ error: apiError(e) })), [setMsg]);
  useEffect(() => { load(); }, [load]);
  const confirm = async () => {
    try { await voiceAdminAPI.setRoute({ originCountry: pending.row.origin_country, destinationCountry: pending.row.destination_country, enabled: pending.enable, notes }); setPending(null); setNotes(''); load(); }
    catch (e) { setMsg({ error: apiError(e) }); }
  };
  return (
    <Card title="Country routes (platform-wide)">
      <p className="text-xs text-gray-500">Every route starts disabled. Enable one only after the provider confirms it can terminate those calls and the legal position is checked; the approval note is stored with your name.</p>
      {!rows ? <p className="text-sm text-gray-500">Loading…</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs text-gray-500"><tr><th className="py-1">Org country → Destination</th><th>Status</th><th>Approval note</th><th /></tr></thead>
          <tbody className="divide-y">{rows.map(r => (
            <tr key={r.id}><td className="py-2 font-medium">{r.origin_country} → {r.destination_country}</td>
              <td><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{r.enabled ? 'Enabled' : 'Disabled'}</span></td>
              <td className="text-xs text-gray-500 max-w-xs truncate" title={r.approval_notes || ''}>{r.approval_notes || '—'}</td>
              <td className="text-right"><button className={`${BTN} ${r.enabled ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`} onClick={() => { setPending({ row: r, enable: !r.enabled }); setNotes(''); }}>{r.enabled ? 'Disable' : 'Enable'}</button></td></tr>))}</tbody></table></div>)}
      {pending && (
        <Modal title={`${pending.enable ? 'Enable' : 'Disable'} ${pending.row.origin_country} → ${pending.row.destination_country}`} onClose={() => setPending(null)}
          footer={<><button className={`${BTN} border flex-1`} onClick={() => setPending(null)}>Cancel</button><button disabled={pending.enable && notes.trim().length < 10} className={`${BTN} bg-indigo-600 text-white flex-1`} onClick={confirm}>Confirm</button></>}>
          <Field label={pending.enable ? 'Approval note (required): who verified provider routing and legal status, and when' : 'Reason (optional)'}>
            <textarea className={INPUT} rows={4} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
        </Modal>)}
    </Card>
  );
}

export default function SuperAdminCallingPage() {
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState('');
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);
  useEffect(() => { superAdminAPI.getTenants().then(({ data: d }) => setTenants(d.tenants || [])).catch(() => setMsg({ error: 'Could not load organizations.' })); }, []);
  const load = useCallback(() => (tenantId ? voiceAdminAPI.overview(tenantId).then(({ data: d }) => setData(d)).catch((e) => setMsg({ error: apiError(e) })) : Promise.resolve()), [tenantId]);
  useEffect(() => { setData(null); load(); }, [load]);
  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="text-xl font-bold text-[#141a3d]">Calling</h1>
      {msg && <div role="status" className={`text-sm rounded-xl px-4 py-2 ${msg.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg.error || msg.ok}</div>}
      <RoutesCard setMsg={setMsg} />
      <Card title="Organization setup">
        <select className={INPUT} value={tenantId} onChange={e => { setTenantId(e.target.value); setMsg(null); }}>
          <option value="">Select an organization…</option>{tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      </Card>
      {tenantId && !data && <p className="text-sm text-gray-500">Loading…</p>}
      {data && <>
        <AccountCard tenantId={tenantId} data={data} onSaved={load} setMsg={setMsg} />
        <NumbersCard tenantId={tenantId} data={data} onSaved={load} setMsg={setMsg} />
        <RatesCard tenantId={tenantId} data={data} onSaved={load} setMsg={setMsg} />
        {data.wallets.length > 0 && <Card title="Wallet"><ul className="text-sm">{data.wallets.map(w => <li key={w.currency}>{w.currency}: available {(Number(w.available_balance) / 100).toFixed(2)}, reserved {(Number(w.reserved_balance) / 100).toFixed(2)}</li>)}</ul></Card>}
      </>}
    </div>
  );
}
