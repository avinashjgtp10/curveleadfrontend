import { useState } from 'react';
import { templateAPI } from '../../services/api';
import { useToast } from '../ui/Toast';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Empty, ErrorBox, Loading, useLoad } from './hubUi';

// Internal quick-reply snippets (not Meta templates) — the same records as Settings → Templates.
const SavedRepliesTab = () => {
  const toast = useToast();
  const confirm = useConfirmDialog();
  const { data, error, loading, reload } = useLoad(() => templateAPI.getAll({ channel: 'whatsapp' }));
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;

  const save = async () => {
    if (!form.name.trim() || !form.message.trim()) return toast.error('Name and message are required.');
    setSaving(true);
    try {
      await templateAPI.create({ ...form, channel: 'whatsapp', category: 'quick_reply' });
      setForm(null); reload();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (t) => {
    if (!await confirm({ title: `Delete "${t.name}"?` })) return;
    try { await templateAPI.delete(t.id); reload(); } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">Ready-made replies your team can insert while chatting. Use {'{{name}}'} to add the lead's name.</p>
        <button onClick={() => setForm({ name: '', message: '' })}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
          <Plus size={15} /> New reply
        </button>
      </div>

      {form && (
        <Card title="New saved reply">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name, e.g. Price list"
            className="w-full px-3 py-2 border rounded-lg text-sm mb-2" />
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4}
            placeholder="Hi {{name}}, here are our prices…" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setForm(null)} className="px-4 py-1.5 border rounded-lg text-sm">Cancel</button>
            <button onClick={save} disabled={saving} className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Card>
      )}

      <Card>
        {data.templates.length === 0 ? <Empty>No saved replies yet.</Empty> : data.templates.map(t => (
          <div key={t.id} className="flex items-start justify-between gap-3 py-3 border-b last:border-0">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{t.name}</p>
              <p className="text-xs text-gray-500 whitespace-pre-wrap mt-0.5">{t.message}</p>
            </div>
            <button onClick={() => remove(t)} className="p-1 text-gray-400 hover:text-red-500 shrink-0"><Trash2 size={15} /></button>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default SavedRepliesTab;
