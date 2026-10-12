import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { financeAPI } from '../../services/api';
import { useToast } from '../ui/Toast';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { workspaceCurrency as getWorkspaceCurrency, intlLocale } from '../../utils/locale';
import { KIND_LABEL, STATUS_LABEL, money, signedAmount, dateLabel, outstanding, OUTSTANDING_NOTE, rowActions, newIdempotencyKey, apiMessage, bookedBasisLabel } from '../../utils/financeFormat';

// What the customer actually paid, as a ledger: payments, refunds, reversals. Money is never edited or deleted here;
// a mistake is fixed by a reversal or a correction, and both stay visible. The server enforces every rule.

const ACTIONS = {
  record: { title: 'Record a payment', cta: 'Record payment' },
  refund: { title: 'Refund a payment', cta: 'Refund', reason: true, amount: true },
  reverse: { title: 'Reverse a payment', cta: 'Reverse payment', reason: true, note: 'Use this when a payment was recorded in error, bounced or was charged back. It takes back everything still left of it.' },
  correct: { title: 'Correct the amount', cta: 'Correct amount', reason: true, amount: true, note: 'The original is reversed and a new payment is recorded. Both stay visible.' },
  edit: { title: 'Edit payment details', cta: 'Save details', reason: true, details: true },
  complete: { title: 'Mark as received', cta: 'Mark received', date: true },
  booked: { title: 'Adjust the booked value', cta: 'Save adjustment', reason: true, amount: true, note: 'The booked value was frozen when the lead was marked Won, so later quote edits never change it. Use this only for an agreed change; the old value, the new value and your reason are kept.' },
};

const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm';
const today = () => new Date().toISOString().slice(0, 10);

export default function FinancePanel({ leadId, onChanged }) {
  const toast = useToast();
  const confirm = useConfirmDialog();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { type, payment? }
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const keyRef = useRef(null);
  const workspaceCurrency = getWorkspaceCurrency();
  const fmt = (amount, currency) => money(amount, currency, intlLocale());

  const load = useCallback(async () => {
    try { const { data: d } = await financeAPI.getLead(leadId); setData(d); setError(''); }
    catch (e) { setError(apiMessage(e)); }
  }, [leadId]);
  useEffect(() => { load(); }, [load]);

  const open = (type, payment = null) => {
    keyRef.current = newIdempotencyKey(); // one key per opened form: a retry or double-click replays instead of duplicating
    setForm({ amount: type === 'booked' && data?.booked?.value != null ? String(data.booked.value) : '', currency: payment?.currency || workspaceCurrency, paid_on: today(), method: payment?.method || '', reference: '', notes: payment?.notes || '', reason: '' });
    setModal({ type, payment });
  };
  const close = () => { setModal(null); setBusy(false); };

  const submit = async (confirmDuplicate = false) => {
    const { type, payment } = modal; const f = form; setBusy(true);
    try {
      if (type === 'record') await financeAPI.record(leadId, { amount: f.amount, currency: f.currency, paid_on: f.paid_on, method: f.method, reference: f.reference, notes: f.notes, confirm_duplicate: confirmDuplicate }, keyRef.current);
      else if (type === 'refund') await financeAPI.refund(payment.id, { amount: f.amount, reason: f.reason, paid_on: f.paid_on }, keyRef.current);
      else if (type === 'reverse') await financeAPI.reverse(payment.id, { reason: f.reason }, keyRef.current);
      else if (type === 'correct') await financeAPI.correct(payment.id, { amount: f.amount, reason: f.reason, paid_on: f.paid_on }, keyRef.current);
      else if (type === 'edit') await financeAPI.amend(payment.id, { reason: f.reason, paid_on: f.paid_on, paid_on_basis: f.paid_on ? 'confirmed' : undefined, method: f.method, reference: f.reference, notes: f.notes });
      else if (type === 'complete') await financeAPI.complete(payment.id, { paid_on: f.paid_on });
      else if (type === 'booked') await financeAPI.adjustBooked(leadId, { value: f.amount, reason: f.reason });
      toast.success('Saved.'); close(); await load(); onChanged && onChanged();
    } catch (e) {
      const d = e.response && e.response.data;
      if (d && d.code === 'possible_duplicate' && await confirm({ title: 'Record this payment again?', message: d.error, confirmText: 'Record again', destructive: false })) return submit(true);
      toast.error(apiMessage(e)); setBusy(false);
    }
  };

  const cancelPending = async (p) => {
    if (!await confirm({ title: 'Cancel this pending payment?', message: 'It never counted. It stays in the history as cancelled.', confirmText: 'Cancel payment' })) return;
    try { await financeAPI.cancel(p.id, {}); toast.success('Cancelled.'); await load(); onChanged && onChanged(); } catch (e) { toast.error(apiMessage(e)); }
  };

  if (error && !data) return <p className="text-sm text-gray-500 p-4" role="alert">{error}</p>;
  if (!data) return <p className="text-sm text-gray-400 p-4">Loading…</p>;

  const out = outstanding(data.deal_value, data.totals, workspaceCurrency);
  const cfg = modal && ACTIONS[modal.type];

  return (
    <div className="space-y-4" data-testid="finance-panel">
      {data.merged && <p className="text-xs bg-amber-50 text-amber-800 rounded-lg px-3 py-2">This lead was merged into another lead. The money below is the customer's combined history; record new payments on the surviving lead.</p>}

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[140px] bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-500">Quoted price (not collected money)</p>
          <p className="text-sm font-bold">{data.deal_value ? fmt(data.deal_value, workspaceCurrency) : '—'}</p>
        </div>
        <div className="flex-1 min-w-[160px] bg-blue-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-500">Booked value (what was agreed)</p>
          {data.booked && data.booked.value != null ? (
            <>
              <p className="text-sm font-bold text-blue-700">{fmt(data.booked.value, data.booked.currency || workspaceCurrency)}</p>
              <p className="text-[10px] text-gray-500">{bookedBasisLabel(data.booked)}</p>
              {data.can_manage && <button type="button" onClick={() => open('booked')} className="text-[10px] text-brand-600 hover:underline">Adjust</button>}
            </>
          ) : <p className="text-xs text-gray-500">Not booked yet. It is frozen when the lead is marked Won with a price.</p>}
        </div>
        {data.totals.length === 0 && <div className="flex-1 min-w-[140px] bg-green-50 rounded-lg px-3 py-2"><p className="text-[10px] text-gray-500">Collected</p><p className="text-sm font-bold text-green-700">{fmt(0, workspaceCurrency)}</p></div>}
        {data.totals.map((t) => (
          <div key={t.currency} className="flex-1 min-w-[160px] bg-green-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-gray-500">Collected ({t.currency}, net of refunds)</p>
            <p className="text-sm font-bold text-green-700">{fmt(t.net_collected, t.currency)}</p>
            {t.pending > 0 && <p className="text-[10px] text-gray-500">+ {fmt(t.pending, t.currency)} pending (not counted)</p>}
          </div>
        ))}
        <div className="flex-1 min-w-[140px] bg-amber-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-500">Outstanding vs quoted price</p>
          {out.amount == null ? <p className="text-xs text-gray-500">{OUTSTANDING_NOTE[out.reason]}</p> : <p className="text-sm font-bold text-amber-700">{fmt(out.amount, out.currency)}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Payments</h3>
        {data.can_manage && <button onClick={() => open('record')} className="inline-flex items-center gap-1 text-xs bg-brand-600 text-white rounded-lg px-3 py-1.5"><Plus size={14} /> Record payment</button>}
      </div>

      {data.payments.length === 0 ? <p className="text-sm text-gray-400">No payments recorded yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-gray-500 border-b"><th className="py-2 pr-3">Date</th><th className="pr-3">Type</th><th className="pr-3 text-right">Amount</th><th className="pr-3">Details</th><th className="pr-3">Status</th><th /></tr></thead>
            <tbody>
              {data.payments.map((p) => {
                const signed = signedAmount(p); const counted = p.status === 'completed';
                return (
                  <tr key={p.id} className={`border-b align-top ${counted ? '' : 'text-gray-400'}`}>
                    <td className="py-2 pr-3 whitespace-nowrap">{dateLabel(p)}</td>
                    <td className="pr-3">{KIND_LABEL[p.kind]}{p.replaces_id && <span className="block text-[10px] text-gray-400">replaces an earlier entry</span>}</td>
                    <td className={`pr-3 text-right whitespace-nowrap font-medium ${signed < 0 ? 'text-red-600' : ''}`}>{counted && signed < 0 ? '−' : ''}{fmt(Math.abs(Number(p.amount)), p.currency)}</td>
                    <td className="pr-3">{[p.method, p.reference].filter(Boolean).join(' · ')}{p.reason && <span className="block text-[10px] text-gray-500">{p.reason}</span>}{p.notes && <span className="block text-[10px] text-gray-500">{p.notes}</span>}</td>
                    <td className="pr-3">{STATUS_LABEL[p.status]}</td>
                    <td className="whitespace-nowrap">
                      {rowActions(p, data.can_manage).map((a) => (
                        <button key={a} onClick={() => (a === 'cancel' ? cancelPending(p) : open(a, p))} className="text-brand-600 hover:underline mr-2">{{ refund: 'Refund', reverse: 'Reverse', correct: 'Correct', edit: 'Edit', complete: 'Mark received', cancel: 'Cancel' }[a]}</button>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-gray-400">Payments are never deleted. A mistake is fixed with a reversal or a correction, and every change is kept in an audit trail.</p>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={cfg.title}>
          <form className="bg-white rounded-xl p-5 w-full max-w-md space-y-3" onSubmit={(e) => { e.preventDefault(); submit(false); }}>
            <div className="flex items-center justify-between"><h4 className="font-semibold">{cfg.title}</h4><button type="button" onClick={close} aria-label="Close"><X size={16} /></button></div>
            {cfg.note && <p className="text-xs text-gray-500">{cfg.note}</p>}
            {(modal.type === 'record' || cfg.amount) && (
              <div className="flex gap-2">
                <label className="flex-1 text-xs text-gray-500">Amount<input required type="number" min="0.01" step="0.01" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
                {modal.type === 'record' && <label className="w-24 text-xs text-gray-500">Currency<input required maxLength={3} className={`${inputCls} uppercase`} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></label>}
              </div>
            )}
            {(modal.type === 'record' || modal.type === 'refund' || modal.type === 'correct' || modal.type === 'complete' || cfg.details) && (
              <label className="block text-xs text-gray-500">Date received<input type="date" required={modal.type === 'record' || modal.type === 'complete'} className={inputCls} value={form.paid_on} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} /></label>
            )}
            {(modal.type === 'record' || cfg.details) && (
              <div className="flex gap-2">
                <label className="flex-1 text-xs text-gray-500">Method<input className={inputCls} placeholder="UPI, cash, bank…" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} /></label>
                <label className="flex-1 text-xs text-gray-500">Reference<input className={inputCls} placeholder="Transaction id" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></label>
              </div>
            )}
            {(modal.type === 'record' || cfg.details) && <label className="block text-xs text-gray-500">Notes<input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>}
            {cfg.reason && <label className="block text-xs text-gray-500">Reason (required, kept in the audit trail)<input required minLength={3} className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={close} className="text-sm px-3 py-2 rounded-lg bg-gray-100">Close</button>
              <button type="submit" disabled={busy} className="text-sm px-3 py-2 rounded-lg bg-brand-600 text-white disabled:opacity-50">{busy ? 'Saving…' : cfg.cta}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
