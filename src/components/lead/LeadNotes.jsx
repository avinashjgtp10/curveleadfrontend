import { useEffect, useState } from 'react';
import { notesAPI } from '../../services/api';
import { Plus, Edit2, Trash2, X, MessageSquare, Phone, Calendar, FileText } from 'lucide-react';

const noteTypeIcons = {
  meeting: <Calendar size={14} />,
  call: <Phone size={14} />,
  general: <MessageSquare size={14} />,
  follow_up: <FileText size={14} />,
};

const noteTypeColors = {
  meeting: 'bg-purple-100 text-purple-700',
  call: 'bg-blue-100 text-blue-700',
  general: 'bg-gray-100 text-gray-700',
  follow_up: 'bg-amber-100 text-amber-700',
};

const LeadNotes = ({ leadId, onActivityAdded }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ note: '', note_type: 'general' });

  useEffect(() => { load(); }, [leadId]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await notesAPI.getByLead(leadId);
      setNotes(data.notes || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.note.trim()) return alert('Note content required');
    try {
      if (editing) {
        await notesAPI.update(leadId, editing, { note: form.note });
      } else {
        await notesAPI.create(leadId, form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ note: '', note_type: 'general' });
      load();
      if (!editing) onActivityAdded?.();
    } catch (e) { alert('Failed'); }
  };

  const handleEdit = (note) => {
    setEditing(note.id);
    setForm({ note: note.note, note_type: note.note_type });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try { await notesAPI.delete(leadId, id); load(); } catch (e) { alert('Failed'); }
  };

  return (
    <div className="bg-white rounded-2xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare size={18} /> Discussion Notes
        </h3>
        <button onClick={() => { setEditing(null); setForm({ note: '', note_type: 'general' }); setShowForm(true); }}
          className="text-xs px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg font-medium hover:bg-brand-100 flex items-center gap-1">
          <Plus size={14} /> Add Note
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border">
          <div className="flex gap-2 mb-2">
            {['general', 'meeting', 'call', 'follow_up'].map(t => (
              <button key={t} onClick={() => setForm({ ...form, note_type: t })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${form.note_type === t ? 'bg-brand-600 text-white' : 'bg-white text-gray-600'}`}>
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
          <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
            placeholder="Write your note here..."
            rows={4} className="w-full px-3 py-2 border rounded-lg text-sm" autoFocus />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 border rounded-lg text-xs font-medium">Cancel</button>
            <button onClick={handleSave} className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold">
              {editing ? 'Update' : 'Save'} Note
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-6 text-sm text-gray-400">Loading...</div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No notes yet. Add discussion notes from meetings or calls.</p>
      ) : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${noteTypeColors[n.note_type]}`}>
                  {noteTypeIcons[n.note_type]} {n.note_type?.replace('_', ' ')}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(n)} className="p-1 hover:bg-white rounded text-gray-400"><Edit2 size={12} /></button>
                  <button onClick={() => handleDelete(n.id)} className="p-1 hover:bg-white rounded text-red-400"><Trash2 size={12} /></button>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.note}</p>
              <p className="text-[10px] text-gray-400 mt-2">
                {n.created_by_name || 'Unknown'} • {new Date(n.created_at).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadNotes;
