import { useState, useEffect } from 'react';
import { templateAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/ui/PageLoader';
import { Plus, Edit2, Trash2, X, MessageCircle, Copy, Send, Eye, FileText } from 'lucide-react';

const categoryLabels = {
  welcome: 'Welcome', followup: 'Follow-up', fee_reminder: 'Fee Reminder',
  course_info: 'Course Info', custom: 'Custom',
};

const categoryColors = {
  welcome: 'bg-green-100 text-green-700', followup: 'bg-blue-100 text-blue-700',
  fee_reminder: 'bg-red-100 text-red-700', course_info: 'bg-purple-100 text-purple-700',
  custom: 'bg-gray-100 text-gray-700',
};

const availableVariables = [
  { key: '{name}', desc: 'Lead/Student name' },
  { key: '{phone}', desc: 'Phone number' },
  { key: '{course}', desc: 'Course name' },
  { key: '{course_fee}', desc: 'Course fee' },
  { key: '{course_duration}', desc: 'Course duration' },
  { key: '{academy}', desc: 'Academy name' },
  { key: '{academy_phone}', desc: 'Academy phone' },
  { key: '{academy_address}', desc: 'Academy address' },
  { key: '{amount}', desc: 'Fee amount due' },
  { key: '{due_date}', desc: 'Due date' },
  { key: '{balance}', desc: 'Balance remaining' },
];

const TemplatesPage = () => {
  const { isAdmin } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selected, setSelected] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'custom', channel: 'whatsapp', message: '' });

  useEffect(() => { loadTemplates(); }, [filter]);

  const loadTemplates = async () => {
    setLoading(true);
    try { const { data } = await templateAPI.getAll(filter || undefined); setTemplates(data.templates); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const openAdd = () => {
    setSelected(null);
    setForm({ name: '', category: 'custom', channel: 'whatsapp', message: '' });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setSelected(t);
    setForm({ name: t.name, category: t.category, channel: t.channel, message: t.message });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) await templateAPI.update(selected.id, form);
      else await templateAPI.create(form);
      setShowModal(false); loadTemplates();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try { await templateAPI.delete(id); loadTemplates(); } catch (e) { alert('Failed'); }
  };

  const openPreview = (t) => {
    setPreviewTemplate(t);
    setShowPreview(true);
  };

  const insertVariable = (variable) => {
    setForm(f => ({ ...f, message: f.message + variable }));
  };

  const copyMessage = (message) => {
    navigator.clipboard.writeText(message);
    alert('Message copied!');
  };

  // Preview with sample data
  const previewMessage = (message) => {
    const sampleData = {
      '{name}': 'Priya Sharma', '{phone}': '9876543210', '{course}': 'Advanced Makeup',
      '{course_fee}': '25,000', '{course_duration}': '6 months', '{academy}': 'Lakme Academy',
      '{academy_phone}': '7875914818', '{academy_address}': 'Baramati, Maharashtra',
      '{amount}': '10,000', '{due_date}': '15 Apr 2026', '{balance}': '15,000',
    };
    let preview = message;
    for (const [key, value] of Object.entries(sampleData)) {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    return preview;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">All Categories</option>
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <span className="self-center text-sm text-gray-500">{templates.length} templates</span>
        </div>
        {isAdmin && (
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">
            <Plus size={18} /> New Template
          </button>
        )}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[t.category] || categoryColors.custom}`}>
                  {categoryLabels[t.category] || t.category}
                </span>
                <h3 className="font-semibold text-gray-900 mt-2">{t.name}</h3>
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              )}
            </div>

            {/* Message preview */}
            <div className="bg-green-50 rounded-lg p-3 text-sm text-gray-700 border-l-3 border-green-400 max-h-32 overflow-hidden">
              {t.message}
            </div>

            {/* Variables used */}
            <div className="flex flex-wrap gap-1 mt-3">
              {(t.message.match(/\{[^}]+\}/g) || []).map((v, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{v}</span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button onClick={() => openPreview(t)}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100">
                <Eye size={14} /> Preview
              </button>
              <button onClick={() => copyMessage(t.message)}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100">
                <Copy size={14} /> Copy
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-2">Used {t.use_count} times</p>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MessageCircle size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No templates yet</p>
          <p className="text-sm mt-1">Create message templates for quick WhatsApp follow-ups</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{selected ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Welcome Message" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                    {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  rows={6} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none"
                  placeholder="Hi {name}, thank you for your interest in {course}..." required />
              </div>

              {/* Variable buttons */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Click to insert variable:</p>
                <div className="flex flex-wrap gap-1">
                  {availableVariables.map(v => (
                    <button key={v.key} type="button" onClick={() => insertVariable(v.key)}
                      className="px-2 py-1 bg-brand-50 text-brand-700 text-xs rounded hover:bg-brand-100 transition" title={v.desc}>
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              {form.message && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Preview (with sample data):</p>
                  <div className="bg-green-50 rounded-lg p-3 text-sm text-gray-700 border-l-3 border-green-400 whitespace-pre-wrap">
                    {previewMessage(form.message)}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">{selected ? 'Update' : 'Create Template'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPreview(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Preview: {previewTemplate.name}</h2>
              <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* WhatsApp style bubble */}
              <div className="bg-[#DCF8C6] rounded-lg rounded-tl-none p-4 text-sm text-gray-800 shadow-sm whitespace-pre-wrap max-w-[90%]">
                {previewMessage(previewTemplate.message)}
                <p className="text-right text-xs text-gray-500 mt-2">12:30 PM ✓✓</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { copyMessage(previewMessage(previewTemplate.message)); }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                  <Copy size={16} /> Copy Message
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(previewMessage(previewTemplate.message))}`} target="_blank" rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  <Send size={16} /> Send on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;
