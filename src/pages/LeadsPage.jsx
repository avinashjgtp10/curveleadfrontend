import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadAPI, courseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Search, Filter, Phone, MessageCircle, ChevronRight,
  X, Calendar, Clock, User, MapPin, BookOpen, ArrowRight, Eye
} from 'lucide-react';

const stages = ['new', 'contacted', 'interested', 'enrolled', 'dropped'];
const sources = [
  { value: 'meta_lead_form', label: 'Meta Ads - Lead Form' },
  { value: 'meta_whatsapp', label: 'Meta Ads - WhatsApp' },
  { value: 'walkin', label: 'Walk-in' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

const stageColors = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  interested: 'bg-purple-100 text-purple-700',
  enrolled: 'bg-green-100 text-green-700',
  dropped: 'bg-red-100 text-red-700',
};

const LeadsPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ stage: '', source: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadLeads();
  }, [filters.stage, filters.source, pagination.page]);

  const loadCourses = async () => {
    try {
      const { data } = await courseAPI.getAll();
      setCourses(data.courses);
    } catch (err) { console.error(err); }
  };

  const loadLeads = async () => {
    setLoading(true);
    try {
      const { data } = await leadAPI.getAll({
        ...filters,
        page: pagination.page,
        limit: 20,
      });
      setLeads(data.leads);
      setPagination(data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadLeads();
  };

  const openAddModal = () => {
    setSelectedLead(null);
    setForm({ name: '', phone: '', email: '', location: '', source: 'walkin', course_interest_id: '', notes: '' });
    setShowModal(true);
  };

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setForm({
      name: lead.name, phone: lead.phone, email: lead.email || '',
      location: lead.location || '', source: lead.source, stage: lead.stage,
      course_interest_id: lead.course_interest_id || '', notes: lead.notes || '',
    });
    setShowModal(true);
  };

  const openFollowup = (lead) => {
    setSelectedLead(lead);
    setShowFollowupModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedLead) {
        await leadAPI.update(selectedLead.id, form);
      } else {
        await leadAPI.create(form);
      }
      setShowModal(false);
      loadLeads();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save lead.');
    }
  };

  const handleStageChange = async (leadId, newStage) => {
    try {
      await leadAPI.update(leadId, { stage: newStage });
      loadLeads();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Search
          </button>
        </form>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition"
        >
          <Plus size={18} /> Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.stage}
          onChange={(e) => { setFilters(f => ({ ...f, stage: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">All Stages</option>
          {stages.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select
          value={filters.source}
          onChange={(e) => { setFilters(f => ({ ...f, source: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">All Sources</option>
          {sources.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <span className="self-center text-sm text-gray-500">{pagination.total} leads found</span>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No leads found</p>
            <p className="text-sm mt-1">Add your first lead to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Course</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stage</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Follow-up</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <button onClick={() => openEditModal(lead)} className="text-left">
                        <p className="font-medium text-gray-900 hover:text-brand-600">{lead.name}</p>
                        <p className="text-xs text-gray-400 md:hidden">{lead.phone}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{lead.phone}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{lead.course_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell capitalize">
                      {lead.source.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 ${stageColors[lead.stage]}`}
                      >
                        {stages.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {lead.next_followup ? (
                        <span className={`text-xs font-medium ${new Date(lead.next_followup) < new Date() ? 'text-red-600' : 'text-amber-600'}`}>
                          {new Date(lead.next_followup).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`tel:${lead.phone}`} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Call">
                          <Phone size={16} />
                        </a>
                        <a href={`https://wa.me/91${lead.phone.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noreferrer"
                          className="p-1.5 hover:bg-green-50 rounded text-green-600" title="WhatsApp">
                          <MessageCircle size={16} />
                        </a>
                        <button onClick={() => openFollowup(lead)} className="p-1.5 hover:bg-brand-50 rounded text-brand-600" title="Add Follow-up">
                          <Clock size={16} />
                        </button>
                        <button onClick={() => navigate(`/leads/${lead.id}/journey`)} className="p-1.5 hover:bg-purple-50 rounded text-purple-600" title="View Journey">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Lead Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={selectedLead ? 'Edit Lead' : 'Add New Lead'}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Name *" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
              <Input label="Phone *" value={form.phone} onChange={v => setForm({ ...form, phone: v })} required />
              <Input label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
              <Input label="Location" value={form.location} onChange={v => setForm({ ...form, location: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source *</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                >
                  {sources.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Interest</label>
                <select
                  value={form.course_interest_id}
                  onChange={(e) => setForm({ ...form, course_interest_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {selectedLead && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {stages.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                placeholder="Any additional notes..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">
                {selectedLead ? 'Update Lead' : 'Add Lead'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Follow-up Modal */}
      {showFollowupModal && selectedLead && (
        <FollowupModal
          lead={selectedLead}
          onClose={() => setShowFollowupModal(false)}
          onSaved={() => { setShowFollowupModal(false); loadLeads(); }}
        />
      )}
    </div>
  );
};

// Reusable Input
const Input = ({ label, value, onChange, type = 'text', required = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
      required={required}
    />
  </div>
);

// Modal wrapper
const Modal = ({ children, title, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="fixed inset-0 bg-black/50" onClick={onClose} />
    <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="flex items-center justify-between p-5 border-b">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <X size={20} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

// Follow-up Modal
const FollowupModal = ({ lead, onClose, onSaved }) => {
  const [form, setForm] = useState({
    notes: '', followup_type: 'call', outcome: '',
    next_followup_at: '', whatsapp_log: '',
  });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data } = await leadAPI.getOne(lead.id);
      setHistory(data.followups || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await leadAPI.addFollowup(lead.id, form);
      onSaved();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add follow-up.');
    } finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose} title={`Follow-up: ${lead.name}`}>
      <div className="space-y-4">
        {/* Lead info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">{lead.name}</p>
            <p className="text-sm text-gray-500">{lead.phone}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <a href={`tel:${lead.phone}`} className="p-2 bg-green-100 text-green-700 rounded-lg">
              <Phone size={16} />
            </a>
            <a href={`https://wa.me/91${lead.phone.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noreferrer"
              className="p-2 bg-green-100 text-green-700 rounded-lg">
              <MessageCircle size={16} />
            </a>
          </div>
        </div>

        {/* Follow-up form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.followup_type} onChange={e => setForm({ ...form, followup_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="call">Phone Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="visit">Visit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
              <select value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">Select...</option>
                <option value="not_picked">Not Picked</option>
                <option value="interested">Interested</option>
                <option value="callback">Call Back Later</option>
                <option value="visited">Visited</option>
                <option value="not_interested">Not Interested</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes *</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" required
              placeholder="What happened on this follow-up..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Log</label>
            <textarea value={form.whatsapp_log} onChange={e => setForm({ ...form, whatsapp_log: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              placeholder="Paste WhatsApp conversation summary..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up</label>
            <input type="datetime-local" value={form.next_followup_at}
              onChange={e => setForm({ ...form, next_followup_at: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Follow-up'}
          </button>
        </form>

        {/* History */}
        {history.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">History ({history.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((f) => (
                <div key={f.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span className="capitalize">{f.followup_type} • {f.outcome || 'No outcome'}</span>
                    <span>{new Date(f.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-gray-700">{f.notes}</p>
                  {f.whatsapp_log && (
                    <p className="text-xs text-gray-500 mt-1 italic">WA: {f.whatsapp_log}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LeadsPage;
