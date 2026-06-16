import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneCall, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp, PhoneMissed, AlertCircle } from 'lucide-react';
import { aiCallingAPI } from '../../services/api';

const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const fmtDuration = (s) => {
  if (!s) return '';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const StatusChip = ({ status }) => {
  const map = {
    queued:      { label: 'Queued',     cls: 'bg-gray-100 text-gray-500' },
    ringing:     { label: 'Ringing…',   cls: 'bg-blue-50 text-blue-600 animate-pulse' },
    in_progress: { label: 'On Call…',   cls: 'bg-blue-50 text-blue-600 animate-pulse' },
    completed:   { label: 'Completed',  cls: 'bg-green-50 text-green-600' },
    failed:      { label: 'Failed',     cls: 'bg-red-50 text-red-500' },
    no_answer:   { label: 'No Answer',  cls: 'bg-amber-50 text-amber-600' },
  };
  const s = map[status] || map.queued;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
};

const ScoreBar = ({ score }) => {
  if (score === undefined || score === null) return null;
  const pct = (score / 10) * 100;
  const color = score >= 7 ? 'bg-green-500' : score >= 4 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700">{score}/10</span>
    </div>
  );
};

const AnalysisPanel = ({ analysis }) => {
  if (!analysis || analysis.error) {
    return <p className="text-xs text-red-400 mt-2">{analysis?.error || 'Analysis not available'}</p>;
  }
  const sentimentColor = { positive: 'text-green-600', neutral: 'text-gray-500', negative: 'text-red-500', unclear: 'text-gray-400' };
  return (
    <div className="mt-3 space-y-3 text-sm">
      {analysis.overall_score !== undefined && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Call Score</p>
          <ScoreBar score={analysis.overall_score} />
        </div>
      )}
      <p className="text-xs text-gray-600 leading-relaxed">{analysis.summary}</p>
      <div className="grid grid-cols-2 gap-2">
        {analysis.pitch_covered?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-green-600 mb-1">Covered</p>
            <ul className="space-y-0.5">
              {analysis.pitch_covered.map((p, i) => (
                <li key={i} className="flex items-start gap-1 text-[11px] text-gray-600">
                  <CheckCircle size={10} className="text-green-500 mt-0.5 shrink-0" />{p}
                </li>
              ))}
            </ul>
          </div>
        )}
        {analysis.pitch_missed?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-red-500 mb-1">Missed</p>
            <ul className="space-y-0.5">
              {analysis.pitch_missed.map((p, i) => (
                <li key={i} className="flex items-start gap-1 text-[11px] text-gray-600">
                  <XCircle size={10} className="text-red-400 mt-0.5 shrink-0" />{p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 pt-1 border-t">
        <span className="text-[10px] text-gray-400">Sentiment:</span>
        <span className={`text-[11px] font-medium capitalize ${sentimentColor[analysis.customer_sentiment] || 'text-gray-500'}`}>
          {analysis.customer_sentiment || '—'}
        </span>
        {analysis.next_action && (
          <>
            <span className="text-[10px] text-gray-400 ml-auto">Next:</span>
            <span className="text-[11px] text-brand-600">{analysis.next_action}</span>
          </>
        )}
      </div>
    </div>
  );
};

const CallCard = ({ call }) => {
  const [expanded, setExpanded] = useState(false);
  const hasAnalysis = call.status === 'completed' && call.analysis;
  const isLive = ['queued', 'ringing', 'in_progress'].includes(call.status);
  const isUnsuccessful = ['failed', 'no_answer'].includes(call.status);

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-gray-50">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-100">
          {isUnsuccessful ? <PhoneMissed size={15} className="text-amber-600" /> : <PhoneCall size={15} className="text-brand-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{call.agent_name || 'AI Agent'}{call.voice_name ? ` · ${call.voice_name}` : ''}</p>
          <p className="text-[10px] text-gray-400">
            {fmtDate(call.created_at)}{call.duration_seconds ? ` · ${fmtDuration(call.duration_seconds)}` : ''}
          </p>
        </div>
        <StatusChip status={call.status} />
        {hasAnalysis && (
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600 ml-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
        {isLive && <Loader2 size={14} className="text-blue-400 animate-spin ml-1" />}
      </div>

      {call.recording_url && (
        <div className="px-3 py-2 border-t bg-white">
          <audio src={call.recording_url} controls className="w-full h-8" />
        </div>
      )}

      {expanded && hasAnalysis && (
        <div className="px-3 pb-3 border-t bg-white">
          <AnalysisPanel analysis={call.analysis} />
        </div>
      )}

      {isUnsuccessful && (
        <div className="px-3 py-2 border-t bg-amber-50 flex items-center gap-1.5">
          <AlertCircle size={13} className="text-amber-500" />
          <p className="text-xs text-amber-600">{call.ended_reason || 'The call did not connect.'}</p>
        </div>
      )}
    </div>
  );
};

export default function LeadAiCalls({ leadId }) {
  const [calls, setCalls] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const pollRef = useRef();

  const load = async () => {
    try {
      const { data } = await aiCallingAPI.getLeadCalls(leadId);
      setCalls(data.calls || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    return () => clearInterval(pollRef.current);
  }, [leadId]);

  // Poll while any call is still queued/ringing/in-progress
  useEffect(() => {
    clearInterval(pollRef.current);
    const hasLive = calls.some(c => ['queued', 'ringing', 'in_progress'].includes(c.status));
    if (hasLive) pollRef.current = setInterval(load, 6000);
    return () => clearInterval(pollRef.current);
  }, [calls]);

  const openPicker = async () => {
    try {
      const { data } = await aiCallingAPI.getAgents();
      setAgents(data.agents || []);
      setSelectedAgent(data.agents?.find(a => a.is_default)?.id || data.agents?.[0]?.id || '');
      setShowPicker(true);
    } catch {
      alert('Could not load AI agent personas. Configure AI Calling under Integrations first.');
    }
  };

  const handleCall = async () => {
    if (!selectedAgent) return;
    setCalling(true);
    try {
      await aiCallingAPI.callLead(leadId, selectedAgent);
      setShowPicker(false);
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to start call.');
    } finally { setCalling(false); }
  };

  return (
    <div className="bg-white rounded-2xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">AI Voice Calls</h3>
        <button
          onClick={openPicker}
          className="flex items-center gap-1.5 text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Phone size={13} /> Call with AI Agent
        </button>
      </div>

      {showPicker && (
        <div className="mb-4 border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
          {agents.length === 0 ? (
            <p className="text-xs text-gray-500">No AI agent personas configured yet. Create one under Integrations → AI Calling Agent.</p>
          ) : (
            <>
              <label className="block text-xs font-medium text-gray-500 mb-1">Choose agent voice/persona</label>
              <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white mb-3">
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}{a.voice_name ? ` (${a.voice_name})` : ''}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={handleCall} disabled={calling}
                  className="flex items-center gap-1.5 text-xs bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-60">
                  {calling ? <Loader2 size={13} className="animate-spin" /> : <PhoneCall size={13} />}
                  {calling ? 'Starting…' : 'Start Call'}
                </button>
                <button onClick={() => setShowPicker(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border">
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
      ) : calls.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center"><PhoneCall size={16} className="text-brand-600" /></div>
          </div>
          <p className="text-sm text-gray-400">No AI calls yet for this lead</p>
          <p className="text-xs text-brand-500 mt-2">The AI agent will call, transcribe and summarize automatically</p>
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map(c => <CallCard key={c.id} call={c} />)}
        </div>
      )}
    </div>
  );
}
