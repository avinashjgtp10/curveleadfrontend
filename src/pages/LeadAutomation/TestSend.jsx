import { useState } from 'react';
import { Send } from 'lucide-react';
import { automationAPI } from '../../services/api';
import { stepPayload } from '../../utils/sequenceStatus';

// Sends this one step to the signed-in user's own phone. The server decides the destination, so it can never reach a lead.
export default function TestSend({ step, n }) {
  const [state, setState] = useState({ busy: false, ok: null, text: '' });
  const [note, setNote] = useState('');
  const send = async () => {
    setState({ busy: true, ok: null, text: '' });
    try {
      const { data } = await automationAPI.testSend({ step: stepPayload(step) });
      setNote(data.window_note || '');
      setState({ busy: false, ok: true, text: `Sent to your number ending ${data.to_last4}.` });
    } catch (e) {
      setNote(e?.response?.data?.window_note || '');
      setState({ busy: false, ok: false, text: e?.response?.data?.error || 'The test could not be sent.' });
    }
  };
  return (
    <div className="mt-2">
      <button type="button" onClick={send} disabled={state.busy} aria-label={`Step ${n} send test to my own number`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 border border-brand-200 rounded-lg px-2.5 py-1.5 hover:bg-brand-50 disabled:opacity-50">
        <Send size={12} /> {state.busy ? 'Sending…' : 'Send test to my own number'}
      </button>
      <span className="text-[11px] text-gray-500 ml-2">Goes only to the phone number on your profile, never to a lead.</span>
      {state.text && <p role="status" className={`text-[11px] mt-1 ${state.ok ? 'text-green-700' : 'text-red-600'}`}>{state.text}</p>}
      {note && state.text && <p className="text-[11px] text-gray-500 mt-0.5">{note}</p>}
    </div>
  );
}
