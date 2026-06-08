import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadAPI, aiAPI, whatsappAPI, quotationsAPI } from '../services/api';
import LeadNotes from '../components/lead/LeadNotes';
import LeadAttachments from '../components/lead/LeadAttachments';
import ShareBrochureModal from '../components/lead/ShareBrochureModal';
import { ArrowLeft, Phone, MessageCircle, Mail, MapPin, Zap, Edit2, Save, Send, BookOpen, FileText, Plus } from 'lucide-react';

const scoreColors = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-gray-100 text-gray-600',
};

const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [messages, setMessages] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [showShareBrochure, setShowShareBrochure] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [leadRes, msgRes, quoteRes] = await Promise.all([
        leadAPI.getOne(id),
        whatsappAPI.getConversation(id).catch(() => ({ data: { messages: [] } })),
        quotationsAPI.getAll({ lead_id: id }).catch(() => ({ data: { quotations: [] } })),
      ]);
      setLead(leadRes.data.lead);
      setActivities(leadRes.data.activities || []);
      setMessages(msgRes.data.messages || []);
      setQuotations(quoteRes.data.quotations || []);
      setForm(leadRes.data.lead);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      await leadAPI.update(id, form);
      setEditing(false);
      loadData();
    } catch (e) { alert('Failed to save'); }
  };

  const handleAIScore = async () => {
    try {
      await aiAPI.scoreLead(id);
      loadData();
    } catch (e) { alert('AI scoring failed'); }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await whatsappAPI.send(id, newMessage);
      setNewMessage('');
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed to send'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  if (!lead) return <p>Lead not found</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowShareBrochure(true)}
            className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium flex items-center gap-1.5">
            <BookOpen size={14} /> Share Brochure
          </button>
          <button onClick={() => navigate(`/quotations/new?lead_id=${id}`)}
            className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium flex items-center gap-1.5">
            <FileText size={14} /> New Quotation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                {editing ? (
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="text-xl font-bold w-full border-b focus:outline-none focus:border-brand-500" />
                ) : <h2 className="text-xl font-bold">{lead.name}</h2>}
                <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${scoreColors[lead.lead_score]}`}>
                  {lead.lead_score?.toUpperCase()}
                </span>
              </div>
              <button onClick={() => editing ? handleSave() : setEditing(true)} className="p-2 hover:bg-gray-100 rounded-lg">
                {editing ? <Save size={16} /> : <Edit2 size={16} />}
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                <a href={`tel:${lead.phone}`} className="hover:text-brand-600">{lead.phone}</a>
              </div>
              {lead.email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /><a href={`mailto:${lead.email}`} className="hover:text-brand-600">{lead.email}</a></div>}
              {lead.location && <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /><span>{lead.location}</span></div>}
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500">Source</p>
                <p className="capitalize font-medium">{lead.source?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Stage</p>
                <p className="capitalize font-medium">{lead.stage}</p>
              </div>
              {lead.score_reason && (
                <div>
                  <p className="text-xs text-gray-500">AI Reason</p>
                  <p className="text-xs">{lead.score_reason}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <a href={`tel:${lead.phone}`} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1"><Phone size={14} /> Call</a>
              <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1"><MessageCircle size={14} /> WhatsApp</a>
            </div>

            <button onClick={handleAIScore} className="mt-2 w-full py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium flex items-center justify-center gap-1">
              <Zap size={14} /> Re-score with AI
            </button>
          </div>

          {/* Quotations for this lead */}
          {quotations.length > 0 && (
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText size={16} /> Quotations ({quotations.length})
              </h3>
              <div className="space-y-2">
                {quotations.map(q => (
                  <button key={q.id} onClick={() => navigate(`/quotations/${q.id}`)}
                    className="w-full text-left p-2.5 hover:bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono">{q.quote_number}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                        q.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        q.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        q.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>{q.status?.toUpperCase()}</span>
                    </div>
                    <p className="text-sm font-bold text-brand-600 mt-1">₹{parseFloat(q.total).toLocaleString('en-IN')}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* WhatsApp Conversation */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><MessageCircle size={18} /> WhatsApp Conversation</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto mb-3">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No messages yet</p>
              ) : messages.map(m => (
                <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${m.direction === 'outbound' ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}>
                    <p>{m.message}</p>
                    <p className={`text-[10px] mt-1 ${m.direction === 'outbound' ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(m.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <button onClick={handleSendMessage} className="px-4 py-2 bg-brand-600 text-white rounded-lg"><Send size={16} /></button>
            </div>
          </div>

          {/* ⭐ Notes */}
          <LeadNotes leadId={id} />

          {/* ⭐ Attachments */}
          <LeadAttachments leadId={id} />

          {/* Activity Timeline */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activities.map(a => (
                  <div key={a.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.title}</p>
                      {a.description && <p className="text-xs text-gray-500">{a.description}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(a.created_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Brochure Modal */}
      {showShareBrochure && (
        <ShareBrochureModal leadId={id} onClose={() => setShowShareBrochure(false)} onShared={loadData} />
      )}
    </div>
  );
};

export default LeadDetailPage;
