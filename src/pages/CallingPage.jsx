import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { voiceAPI } from '../services/api';
import { loadRazorpay } from '../utils/razorpay';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/dateTime.js';
import { formatMinor, toMinor, callResult, durationText, chargeText, outcomeLabel } from '../utils/voiceCall';

const TONE_CLS = { ok: 'bg-green-50 text-green-700', bad: 'bg-red-50 text-red-700', warn: 'bg-amber-50 text-amber-800', live: 'bg-blue-50 text-blue-700', muted: 'bg-gray-100 text-gray-600' };
const fmt = (d) => (d ? formatDateTime(d, undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');

// Loads once; shows loading / error / empty / data so a failed request never looks like "no calls".
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  useEffect(() => {
    let live = true;
    setState({ loading: true, error: null, data: null });
    fn().then(({ data }) => live && setState({ loading: false, error: null, data }))
      .catch((e) => live && setState({ loading: false, error: e.response?.data?.error || 'Could not load.', data: null }));
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
const Async = ({ s, empty, children }) => {
  if (s.loading) return <div className="flex justify-center py-10 text-gray-400"><Loader2 className="animate-spin" size={18} /></div>;
  if (s.error) return <p className="py-8 text-center text-sm text-red-600">{s.error}</p>;
  if (!s.data || (Array.isArray(s.data) && !s.data.length)) return <p className="py-8 text-center text-sm text-gray-500">{empty}</p>;
  return children(s.data);
};
const Table = ({ head, children }) => (
  <div className="overflow-x-auto bg-white border rounded-xl"><table className="w-full text-sm">
    <thead className="bg-gray-50 text-xs text-gray-500 text-left"><tr>{head.map(h => <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
    <tbody className="divide-y">{children}</tbody></table></div>
);

const History = () => {
  const s = useLoad(() => voiceAPI.listCalls({ limit: 100 }));
  return <Async s={s} empty="No calls yet. Open a lead and tap Call.">{(rows) => (
    <Table head={['When', 'Lead', 'Number', 'Status', 'Duration', 'Charge', 'Outcome']}>
      {rows.map(c => {
        const r = callResult(c);
        return (
          <tr key={c.id}>
            <td className="px-3 py-2 whitespace-nowrap">{fmt(c.started_at)}</td>
            <td className="px-3 py-2">{c.lead_id ? <Link className="text-brand-600 hover:underline" to={`/leads/${c.lead_id}`}>Open lead</Link> : '\u2014'}</td>
            <td className="px-3 py-2 whitespace-nowrap">{c.to_number}</td>
            <td className="px-3 py-2">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${TONE_CLS[r.tone]}`}>{r.label}</span>
              {r.reason && <span className="block text-[11px] text-gray-500 mt-0.5">{r.reason}</span>}
            </td>
            <td className="px-3 py-2">{durationText(c)}</td>
            <td className="px-3 py-2">{chargeText(c)}</td>
            <td className="px-3 py-2">{r.outcome ? outcomeLabel(r.outcome) : '\u2014'}</td>
          </tr>);
      })}
    </Table>)}</Async>;
};

const AgentReport = () => {
  const s = useLoad(() => voiceAPI.agentReport());
  return <Async s={s} empty="No calls in the last 30 days.">{(rows) => (
    <Table head={['Agent', 'Calls', 'Connected', 'Talk time', 'Spend']}>
      {rows.map(r => (
        <tr key={r.agent_id}><td className="px-3 py-2 font-medium">{r.name}</td><td className="px-3 py-2">{r.calls}</td><td className="px-3 py-2">{r.connected}</td>
          <td className="px-3 py-2">{formatDuration(Number(r.billable_seconds))}</td><td className="px-3 py-2">{formatMinor(r.spend_minor, r.currency)}</td></tr>))}
    </Table>)}</Async>;
};

const PRESETS = ['500', '1000', '2500', '5000'];

const Recharge = ({ currency, onDone }) => {
  const toast = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState('1000');
  const [busy, setBusy] = useState(false);
  const minor = toMinor(amount);

  const pay = async () => {
    if (!minor || minor === '0') return toast.error('Enter a valid amount.');
    setBusy(true);
    try {
      await loadRazorpay();
      const { data: o } = await voiceAPI.topup(minor);
      const checkout = new window.Razorpay({
        key: o.keyId, order_id: o.orderId, amount: o.amount, currency: o.currency, name: 'CurveLead', description: 'Calling wallet recharge',
        prefill: { name: user?.name || '', email: user?.email || '' }, theme: { color: '#4f46e5' },
        handler: async (resp) => {
          try {
            // The balance changes only once the server has confirmed the payment with Razorpay.
            const { data } = await voiceAPI.topupVerify(resp);
            if (data.result === 'pending') toast.info('Payment received. Your balance will update as soon as it is confirmed.');
            else toast.success('Wallet recharged.');
            onDone();
          } catch (e) { toast.error(e.response?.data?.error || 'Payment captured but could not be verified. Contact support with your payment ID.'); }
          finally { setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.on('payment.failed', (r) => { toast.error(r.error?.description || 'Payment failed.'); setBusy(false); });
      checkout.open();
    } catch (e) { toast.error(e.response?.data?.error || e.message || 'Could not start payment.'); setBusy(false); }
  };

  return (
    <div className="bg-white border rounded-xl p-4 max-w-md space-y-3">
      <p className="text-sm font-semibold">Recharge wallet ({currency})</p>
      <div className="flex flex-wrap gap-2">{PRESETS.map(p => (
        <button key={p} onClick={() => setAmount(p)} aria-pressed={amount === p}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${amount === p ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-300'}`}>{p}</button>))}</div>
      <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" aria-label="Amount"
        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
      <button onClick={pay} disabled={busy || !minor} className="h-9 px-4 rounded-lg bg-brand-600 text-white text-sm font-semibold disabled:opacity-50">
        {busy ? 'Waiting for payment…' : `Pay ${minor ? formatMinor(minor, currency) : ''}`}</button>
    </div>
  );
};

const WalletTab = ({ isAdmin }) => {
  const [n, setN] = useState(0);
  const w = useLoad(() => voiceAPI.wallet(), [n]);
  const t = useLoad(() => voiceAPI.walletTransactions({ limit: 50 }), [n]);
  return (
    <div className="space-y-4">
      <Async s={w} empty="No calling wallet yet. Contact support to enable calling.">{(x) => (
        <>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="bg-white border rounded-xl p-4"><p className="text-xs text-gray-500">Available</p><p className="text-xl font-bold">{formatMinor(x.available_balance, x.currency)}</p></div>
            <div className="bg-white border rounded-xl p-4"><p className="text-xs text-gray-500">Reserved for calls</p><p className="text-xl font-bold">{formatMinor(x.reserved_balance, x.currency)}</p></div>
          </div>
          {isAdmin && <Recharge currency={x.currency} onDone={() => setN(v => v + 1)} />}
        </>)}</Async>
      <Async s={t} empty="No wallet activity yet.">{(rows) => (
        <Table head={['When', 'Type', 'Amount']}>{rows.map(r => (
          <tr key={r.id}><td className="px-3 py-2 whitespace-nowrap">{fmt(r.created_at)}</td><td className="px-3 py-2 capitalize">{r.transaction_type}</td><td className="px-3 py-2">{formatMinor(r.amount, r.currency)}</td></tr>))}</Table>)}</Async>
    </div>
  );
};

const NumbersRates = () => {
  const n = useLoad(() => voiceAPI.numbers());
  const r = useLoad(() => voiceAPI.rates());
  return (
    <div className="space-y-6">
      <section><h3 className="text-sm font-bold mb-2">Authorized caller IDs</h3>
        <Async s={n} empty="No caller IDs yet. Caller IDs are added and verified by CurveLead support.">{(rows) => (
          <Table head={['Number', 'Country', 'Status']}>{rows.map(x => (
            <tr key={x.id}><td className="px-3 py-2">{x.phone_number_e164}</td><td className="px-3 py-2">{x.country_code}</td><td className="px-3 py-2 capitalize">{x.verification_status}</td></tr>))}</Table>)}</Async></section>
      <section><h3 className="text-sm font-bold mb-2">Countries &amp; rates</h3>
        <Async s={r} empty="No routes are enabled for your workspace yet. Countries are enabled after provider and compliance review.">{(rows) => (
          <Table head={['Country', 'Prefix', 'Type', 'Rate', 'Billed in']}>{rows.map((x, i) => (
            <tr key={i}><td className="px-3 py-2">{x.destination_country}</td><td className="px-3 py-2">+{x.destination_prefix}</td><td className="px-3 py-2 capitalize">{x.call_type}</td>
              <td className="px-3 py-2">{x.display}</td><td className="px-3 py-2">{x.billing_increment_seconds}s</td></tr>))}</Table>)}</Async></section>
    </div>
  );
};

export default function CallingPage() {
  const { user } = useAuth();
  const isAdmin = ['admin', 'super_admin'].includes(user?.role);
  const tabs = [['history', 'Call history', History], ...(isAdmin ? [['agents', 'Agent report', AgentReport]] : []), ['wallet', 'Wallet', WalletTab], ['numbers', 'Numbers & rates', NumbersRates]];
  const [tab, setTab] = useState('history');
  const Active = tabs.find(t => t[0] === tab)[2];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Calling</h1>
      <div className="flex flex-wrap gap-1">{tabs.map(([id, label]) => (
        <button key={id} onClick={() => setTab(id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === id ? 'bg-brand-600 text-white' : 'bg-white border text-gray-600'}`}>{label}</button>))}</div>
      <Active isAdmin={isAdmin} />
    </div>
  );
}
