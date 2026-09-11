import { useEffect, useState } from 'react';
import { settingsAPI, authAPI, templateAPI, stageAPI, statusAPI, campaignAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Building, Lock, Webhook, CheckCircle, Copy, MessageSquare, Trash2, Plus, Edit2, Layers, GripVertical, X, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';

const SettingsPage = () => {
  const confirm = useConfirmDialog();
  const toast = useToast();
  const { user, tenant } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'profile');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [business, setBusiness] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '',
    gst_number: '', pan_number: '', website: '',
    bank_details: { account_holder: '', bank_name: '', account_number: '', ifsc: '', upi: '' },
    daily_report_enabled: false,
    daily_report_time: '08:00',
    email_reply_to: '',
    automation_business_hours_enabled: false,
    automation_business_hours_start: '09:00',
    automation_business_hours_end: '20:00',
    automation_daily_cap_enabled: false,
    automation_daily_cap: 1,
  });
  const [businessOriginal, setBusinessOriginal] = useState(null);
  const [editingBusiness, setEditingBusiness] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [tmplModal, setTmplModal] = useState(false);
  const [editingTmpl, setEditingTmpl] = useState(null);
  const [tmplForm, setTmplForm] = useState({ name: '', category: 'follow_up', channel: 'whatsapp', message: '', stage_name: '', campaign_id: '' });
  const [tmplErrors, setTmplErrors] = useState({});
  const [campaigns, setCampaigns] = useState([]);

  const [stages, setStages] = useState([]);
  const [stageModal, setStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageForm, setStageForm] = useState({ name: '', color: 'blue', is_won: false, is_lost: false, meta_event_name: '' });
  const [stageErrors, setStageErrors] = useState({});
  const [expandedStage, setExpandedStage] = useState(null);

  const [statusModal, setStatusModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusForm, setStatusForm] = useState({ name: '', stage_id: '' });
  const [statusStageId, setStatusStageId] = useState(null);
  const [modalError, setModalError] = useState('');

  useEffect(() => { loadSettings(); }, []);

  useEffect(() => {
    if (tab === 'templates') { loadTemplates(); loadStages(); loadCampaigns(); }
    if (tab === 'pipeline') loadStages();
  }, [tab]);

  const loadSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      setSettings(data.settings || {});
      setProfile({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
      const s = data.settings || {};
      const loadedBusiness = {
        name: s.name || tenant?.name || '',
        email: s.email || '',
        phone: s.phone || '',
        address: s.address || '',
        city: s.city || '',
        state: s.state || '',
        gst_number: s.gst_number || '',
        pan_number: s.pan_number || '',
        website: s.website || '',
        bank_details: s.bank_details || { account_holder: '', bank_name: '', account_number: '', ifsc: '', upi: '' },
        daily_report_enabled: !!s.daily_report_enabled,
        daily_report_time: s.daily_report_time || '08:00',
        email_reply_to: s.email_reply_to || '',
        automation_business_hours_enabled: !!s.automation_business_hours_enabled,
        automation_business_hours_start: s.automation_business_hours_start || '09:00',
        automation_business_hours_end: s.automation_business_hours_end || '20:00',
        automation_daily_cap_enabled: !!s.automation_daily_cap_enabled,
        automation_daily_cap: s.automation_daily_cap || 1,
      };
      setBusiness(loadedBusiness);
      setBusinessOriginal(loadedBusiness);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadTemplates = async () => {
    try {
      const { data } = await templateAPI.getAll();
      setTemplates(data.templates || []);
    } catch (e) { console.error(e); }
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveBusiness = async () => {
    if (!business.name.trim()) return toast.error('Business Name is required');
    try {
      await settingsAPI.update({ ...settings, ...business });
      setBusinessOriginal(business);
      setEditingBusiness(false);
      showSaved();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleCancelBusiness = () => {
    if (businessOriginal) setBusiness(businessOriginal);
    setEditingBusiness(false);
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      showSaved();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const openCreateTmpl = () => {
    setEditingTmpl(null);
    setTmplForm({ name: '', category: 'follow_up', channel: 'whatsapp', message: '', stage_name: '', campaign_id: '' });
    setTmplErrors({});
    setTmplModal(true);
  };

  const openEditTmpl = (t) => {
    setEditingTmpl(t);
    setTmplForm({ name: t.name, category: t.category, channel: t.channel, message: t.message, stage_name: t.stage_name || '', campaign_id: t.campaign_id || '' });
    setTmplErrors({});
    setTmplModal(true);
  };

  const handleSaveTmpl = async () => {
    const errs = {};
    if (!tmplForm.name.trim()) errs.name = 'Template name is required';
    if (!tmplForm.message.trim()) errs.message = 'Message is required';
    setTmplErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      if (editingTmpl) {
        await templateAPI.update(editingTmpl.id, tmplForm);
      } else {
        await templateAPI.create(tmplForm);
      }
      setTmplModal(false);
      loadTemplates();
      showSaved();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleDeleteTmpl = async (id) => {
    if (!await confirm({ title: 'Delete this template?' })) return;
    try {
      await templateAPI.delete(id);
      loadTemplates();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const loadStages = async () => {
    try {
      const { data } = await statusAPI.byStage();
      setStages(data.stages || []);
    } catch {
      // Fallback: statuses not deployed yet — show stages without statuses
      try {
        const { data } = await stageAPI.getAll();
        setStages((data.stages || []).map(s => ({ ...s, statuses: [] })));
      } catch (e) { console.error(e); }
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data } = await campaignAPI.getAll();
      setCampaigns(data.campaigns || []);
    } catch (e) { console.error(e); }
  };

  const openCreateStage = () => {
    setEditingStage(null);
    setStageForm({ name: '', color: 'blue', is_won: false, is_lost: false, meta_event_name: '' });
    setStageErrors({});
    setStageModal(true);
  };

  const openEditStage = (s) => {
    setEditingStage(s);
    setStageForm({ name: s.name, color: s.color || 'blue', is_won: s.is_won || false, is_lost: s.is_lost || false, meta_event_name: s.meta_event_name || '' });
    setStageErrors({});
    setStageModal(true);
  };

  const handleSaveStage = async () => {
    if (!stageForm.name.trim()) { setStageErrors({ name: 'Stage name is required' }); return; }
    setStageErrors({});
    setModalError('');
    try {
      if (editingStage) {
        await stageAPI.update(editingStage.id, stageForm);
      } else {
        await stageAPI.create(stageForm);
      }
      setStageModal(false);
      loadStages();
      showSaved();
    } catch (e) { setModalError(e.response?.data?.error || 'Failed to save stage'); }
  };

  const handleDeleteStage = async (stage) => {
    if (stage.is_default) return toast.error('Default stages cannot be deleted');
    if (!await confirm({ title: `Delete stage "${stage.name}"?`, message: 'Leads in this stage will keep the stage label.' })) return;
    try {
      await stageAPI.delete(stage.id);
      loadStages();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete'); }
  };

  const openCreateStatus = (stageId) => {
    setEditingStatus(null);
    setStatusStageId(stageId);
    setStatusForm({ name: '', stage_id: stageId });
    setModalError('');
    setStatusModal(true);
  };

  const openEditStatus = (st, stageId) => {
    setEditingStatus(st);
    setStatusStageId(stageId);
    setStatusForm({ name: st.name, stage_id: stageId });
    setModalError('');
    setStatusModal(true);
  };

  const handleSaveStatus = async () => {
    if (!statusForm.name.trim()) return setModalError('Status name is required');
    setModalError('');
    try {
      if (editingStatus) {
        await statusAPI.update(editingStatus.id, { name: statusForm.name });
      } else {
        await statusAPI.create({ name: statusForm.name, stage_id: statusStageId });
      }
      setStatusModal(false);
      loadStages();
      showSaved();
    } catch (e) { setModalError(e.response?.data?.error || 'Failed to save status'); }
  };

  const handleDeleteStatus = async (st) => {
    if (st.is_default) return toast.error('Default statuses cannot be deleted');
    if (!await confirm({ title: `Delete status "${st.name}"?` })) return;
    try {
      await statusAPI.delete(st.id);
      loadStages();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete'); }
  };

  const webhookUrl = `${window.location.origin.replace('www.', '')}/api/webhook/meta/${tenant?.id}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSaved();
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'templates', label: 'Templates', icon: MessageSquare },
    { id: 'pipeline', label: 'Pipeline', icon: Layers },
    { id: 'integrations', label: 'Integrations', icon: Webhook },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      {saved && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 shadow-lg">
          <CheckCircle size={16} /> Saved!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        <div className="bg-white rounded-2xl border p-2 h-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left mb-0.5 ${tab === t.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border p-5">
          {tab === 'profile' && (
            <>
              <h2 className="text-lg font-bold mb-4">My Profile</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input type="text" value={profile.name} disabled className="w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input type="email" value={profile.email} disabled className="w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                  <input type="text" value={user?.role} disabled className="w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-50 capitalize" />
                </div>
              </div>
            </>
          )}

          {tab === 'business' && (
            <>
              <div className="flex items-start justify-between mb-1 gap-3">
                <div>
                  <h2 className="text-lg font-bold mb-1">Business Settings</h2>
                  <p className="text-xs text-gray-400 mb-4">These details appear on your quotations and PDFs</p>
                </div>
                {!editingBusiness && (
                  <button onClick={() => setEditingBusiness(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 shrink-0">
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>

              {(() => {
                const inputCls = `w-full px-3 py-2.5 border rounded-lg text-sm ${!editingBusiness ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`;
                const monoCls = `w-full px-3 py-2.5 border rounded-lg text-sm font-mono ${!editingBusiness ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`;
                return (
                  <>
                    {/* Basic Info */}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Basic Info</p>
                    <div className="space-y-3 mb-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Business Name *</label>
                          <input type="text" disabled={!editingBusiness} value={business.name} onChange={e => setBusiness({ ...business, name: e.target.value })}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Business Email</label>
                          <input type="email" disabled={!editingBusiness} value={business.email} onChange={e => setBusiness({ ...business, email: e.target.value })}
                            className={inputCls} placeholder="billing@yourbusiness.com" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                          <input type="tel" disabled={!editingBusiness} value={business.phone} onChange={e => setBusiness({ ...business, phone: e.target.value })}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Website</label>
                          <input type="url" disabled={!editingBusiness} value={business.website} onChange={e => setBusiness({ ...business, website: e.target.value })}
                            className={inputCls} placeholder="https://yourbusiness.com" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                        <textarea disabled={!editingBusiness} value={business.address} onChange={e => setBusiness({ ...business, address: e.target.value })}
                          rows={2} className={inputCls} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                          <input type="text" disabled={!editingBusiness} value={business.city} onChange={e => setBusiness({ ...business, city: e.target.value })}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                          <input type="text" disabled={!editingBusiness} value={business.state} onChange={e => setBusiness({ ...business, state: e.target.value })}
                            className={inputCls} />
                        </div>
                      </div>
                    </div>

                    {/* Tax Info */}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tax Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">GST Number (GSTIN)</label>
                        <input type="text" disabled={!editingBusiness} value={business.gst_number} onChange={e => setBusiness({ ...business, gst_number: e.target.value.toUpperCase() })}
                          className={monoCls} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">PAN Number</label>
                        <input type="text" disabled={!editingBusiness} value={business.pan_number} onChange={e => setBusiness({ ...business, pan_number: e.target.value.toUpperCase() })}
                          className={monoCls} placeholder="AAAAA0000A" maxLength={10} />
                      </div>
                    </div>

                    {/* Bank Details */}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bank / Payment Details</p>
                    <div className="space-y-3 mb-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Account Holder Name</label>
                          <input type="text" disabled={!editingBusiness} value={business.bank_details.account_holder}
                            onChange={e => setBusiness({ ...business, bank_details: { ...business.bank_details, account_holder: e.target.value } })}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Bank Name</label>
                          <input type="text" disabled={!editingBusiness} value={business.bank_details.bank_name}
                            onChange={e => setBusiness({ ...business, bank_details: { ...business.bank_details, bank_name: e.target.value } })}
                            className={inputCls} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
                          <input type="text" disabled={!editingBusiness} value={business.bank_details.account_number}
                            onChange={e => setBusiness({ ...business, bank_details: { ...business.bank_details, account_number: e.target.value } })}
                            className={monoCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">IFSC Code</label>
                          <input type="text" disabled={!editingBusiness} value={business.bank_details.ifsc}
                            onChange={e => setBusiness({ ...business, bank_details: { ...business.bank_details, ifsc: e.target.value.toUpperCase() } })}
                            className={monoCls} placeholder="SBIN0001234" maxLength={11} />
                        </div>
                      </div>
                      <div className="sm:w-1/2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">UPI ID</label>
                        <input type="text" disabled={!editingBusiness} value={business.bank_details.upi}
                          onChange={e => setBusiness({ ...business, bank_details: { ...business.bank_details, upi: e.target.value } })}
                          className={inputCls} placeholder="yourname@upi" />
                      </div>
                    </div>

                    {/* Email */}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Email</p>
                    <div className="mb-5 sm:w-1/2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Reply-to email</label>
                      <input type="email" disabled={!editingBusiness} value={business.email_reply_to} onChange={e => setBusiness({ ...business, email_reply_to: e.target.value })}
                        className={inputCls} placeholder={business.email || 'billing@yourbusiness.com'} />
                      <p className="text-xs text-gray-400 mt-1">Emails sent to leads (demo invites, follow-up sequences) and reports come from CurveLead, but show your business name and route replies here. Leave blank to use your Business Email above.</p>
                    </div>

                    {/* Reports */}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Reports</p>
                    <div className="mb-5">
                      <label className={`flex items-center gap-2 text-sm ${editingBusiness ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <input type="checkbox" disabled={!editingBusiness} checked={business.daily_report_enabled}
                          onChange={e => setBusiness({ ...business, daily_report_enabled: e.target.checked })}
                          className="w-4 h-4 rounded" />
                        <span className="font-medium">Email me a daily report</span>
                      </label>
                      <p className="text-xs text-gray-400 mt-1 ml-6">Sent once a day to the business email above — new leads, hot leads, follow-ups due/overdue, SLA breaches, deals won, and active campaign spend. Each staff member gets their own version scoped to their assigned leads.</p>
                      {business.daily_report_enabled && (
                        <div className="mt-3 ml-6">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Send time (IST)</label>
                          <input type="time" disabled={!editingBusiness} value={business.daily_report_time}
                            onChange={e => setBusiness({ ...business, daily_report_time: e.target.value })}
                            className={`px-3 py-2 border rounded-lg text-sm ${!editingBusiness ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`} />
                        </div>
                      )}
                    </div>

                    {/* Automation */}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Automation</p>
                    <div className="mb-5">
                      <label className={`flex items-center gap-2 text-sm ${editingBusiness ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <input type="checkbox" disabled={!editingBusiness} checked={business.automation_business_hours_enabled}
                          onChange={e => setBusiness({ ...business, automation_business_hours_enabled: e.target.checked })}
                          className="w-4 h-4 rounded" />
                        <span className="font-medium">Only send automated messages during business hours</span>
                      </label>
                      <p className="text-xs text-gray-400 mt-1 ml-6">Anything due outside this window waits until the next allowed time instead of sending late.</p>
                      {business.automation_business_hours_enabled && (
                        <div className="mt-3 ml-6 flex items-center gap-2">
                          <input type="time" disabled={!editingBusiness} value={business.automation_business_hours_start}
                            onChange={e => setBusiness({ ...business, automation_business_hours_start: e.target.value })}
                            className={`px-3 py-2 border rounded-lg text-sm ${!editingBusiness ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`} />
                          <span className="text-xs text-gray-400">to</span>
                          <input type="time" disabled={!editingBusiness} value={business.automation_business_hours_end}
                            onChange={e => setBusiness({ ...business, automation_business_hours_end: e.target.value })}
                            className={`px-3 py-2 border rounded-lg text-sm ${!editingBusiness ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`} />
                        </div>
                      )}
                    </div>
                    <div className="mb-5">
                      <label className={`flex items-center gap-2 text-sm ${editingBusiness ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <input type="checkbox" disabled={!editingBusiness} checked={business.automation_daily_cap_enabled}
                          onChange={e => setBusiness({ ...business, automation_daily_cap_enabled: e.target.checked })}
                          className="w-4 h-4 rounded" />
                        <span className="font-medium">Cap automated messages per lead per day</span>
                      </label>
                      <p className="text-xs text-gray-400 mt-1 ml-6">Even if multiple rules would fire, no lead gets more than this many automated messages in a day.</p>
                      {business.automation_daily_cap_enabled && (
                        <div className="mt-3 ml-6">
                          <input type="number" min="1" disabled={!editingBusiness} value={business.automation_daily_cap}
                            onChange={e => setBusiness({ ...business, automation_daily_cap: parseInt(e.target.value, 10) || 1 })}
                            className={`w-24 px-3 py-2 border rounded-lg text-sm ${!editingBusiness ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`} />
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {editingBusiness && (
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveBusiness} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">
                    Save Changes
                  </button>
                  <button onClick={handleCancelBusiness} className="px-4 py-2 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'password' && (
            <>
              <h2 className="text-lg font-bold mb-4">Change Password</h2>
              <div className="space-y-3 max-w-sm">
                <input type="password" placeholder="Current Password" value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" />
                <input type="password" placeholder="New Password (min 6)" value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" />
                <input type="password" placeholder="Confirm New Password" value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" />
                <button onClick={handleChangePassword} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">Change Password</button>
              </div>
            </>
          )}

          {tab === 'templates' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Message Templates</h2>
                {user?.role === 'admin' && (
                  <button onClick={openCreateTmpl}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                    <Plus size={14} /> New Template
                  </button>
                )}
              </div>

              {templates.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No templates yet. Create one to get started.</p>
              ) : (
                <div className="space-y-2">
                  {templates.map(t => (
                    <div key={t.id} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm">{t.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 capitalize">{t.category.replace(/_/g, ' ')}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 capitalize">{t.channel}</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{t.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1.5">Used {t.use_count || 0} times</p>
                        </div>
                        {user?.role === 'admin' && (
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openEditTmpl(t)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={13} /></button>
                            <button onClick={() => handleDeleteTmpl(t.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={13} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tmplModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded-2xl p-5 w-full max-w-lg shadow-xl">
                    <h3 className="font-bold text-base mb-4">{editingTmpl ? 'Edit Template' : 'New Template'}</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Name <span className="text-red-500">*</span></label>
                        <input value={tmplForm.name}
                          onChange={e => { setTmplForm({ ...tmplForm, name: e.target.value }); if (tmplErrors.name) setTmplErrors(er => ({ ...er, name: undefined })); }}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm ${tmplErrors.name ? 'border-red-500' : ''}`} placeholder="e.g. Welcome Message" />
                        {tmplErrors.name && <p className="text-xs text-red-500 mt-1">{tmplErrors.name}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                          <select value={tmplForm.category} onChange={e => setTmplForm({ ...tmplForm, category: e.target.value })}
                            className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                            <option value="follow_up">Follow Up</option>
                            <option value="promotion">Promotion</option>
                            <option value="reminder">Reminder</option>
                            <option value="welcome">Welcome</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Channel</label>
                          <select value={tmplForm.channel} onChange={e => setTmplForm({ ...tmplForm, channel: e.target.value })}
                            className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                            <option value="whatsapp">WhatsApp</option>
                            <option value="sms">SMS</option>
                            <option value="email">Email</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Assign to stage (optional)</label>
                          <select value={tmplForm.stage_name} onChange={e => setTmplForm({ ...tmplForm, stage_name: e.target.value })}
                            className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                            <option value="">None</option>
                            {stages.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Assign to campaign (optional)</label>
                          <select value={tmplForm.campaign_id} onChange={e => setTmplForm({ ...tmplForm, campaign_id: e.target.value })}
                            className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                            <option value="">None</option>
                            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Message <span className="text-red-500">*</span></label>
                        <textarea value={tmplForm.message}
                          onChange={e => { setTmplForm({ ...tmplForm, message: e.target.value }); if (tmplErrors.message) setTmplErrors(er => ({ ...er, message: undefined })); }}
                          rows={5} className={`w-full px-3 py-2.5 border rounded-lg text-sm font-mono ${tmplErrors.message ? 'border-red-500' : ''}`}
                          placeholder={'Hi {name}, thanks for your interest in {course} at {business}...'} />
                        {tmplErrors.message && <p className="text-xs text-red-500 mt-1">{tmplErrors.message}</p>}
                        <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                          Variables:{' '}
                          {['{name}', '{phone}', '{course}', '{course_fee}', '{course_duration}', '{business}', '{business_phone}'].map(v => (
                            <code key={v} className="bg-gray-100 px-1 rounded mr-1">{v}</code>
                          ))}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setTmplModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                      <button onClick={handleSaveTmpl} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700">
                        {editingTmpl ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'pipeline' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">Pipeline Stages & Statuses</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Stages = where a lead is · Statuses = what's happening within that stage</p>
                </div>
                {user?.role === 'admin' && (
                  <button onClick={openCreateStage}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                    <Plus size={14} /> Add Stage
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {stages.filter(s => s.id).map((s) => {
                  const isExpanded = expandedStage === s.id;
                  const stageColor = {
                    blue: 'bg-blue-400', green: 'bg-green-400', yellow: 'bg-yellow-400',
                    orange: 'bg-orange-400', red: 'bg-red-400', purple: 'bg-purple-400',
                    pink: 'bg-pink-400', gray: 'bg-gray-400', cyan: 'bg-cyan-400',
                    amber: 'bg-amber-400',
                  }[s.color] || 'bg-gray-400';

                  return (
                    <div key={s.id} className="border rounded-xl overflow-hidden">
                      {/* Stage row */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-white">
                        <GripVertical size={14} className="text-gray-300 shrink-0" />
                        <div className={`w-3 h-3 rounded-full shrink-0 ${stageColor}`} />
                        <button
                          className="flex items-center gap-1.5 flex-1 text-left"
                          onClick={() => setExpandedStage(isExpanded ? null : s.id)}
                        >
                          <span className="text-sm font-semibold">{s.name}</span>
                          <span className="text-[10px] text-gray-400 ml-1">({s.statuses?.length || 0} statuses)</span>
                          {s.is_won && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">WON</span>}
                          {s.is_lost && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">LOST</span>}
                          {isExpanded ? <ChevronDown size={13} className="text-gray-400 ml-auto" /> : <ChevronRight size={13} className="text-gray-400 ml-auto" />}
                        </button>
                        {user?.role === 'admin' && (
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openCreateStatus(s.id)} className="p-1.5 hover:bg-brand-50 text-brand-600 rounded-lg" title="Add status">
                              <Tag size={13} />
                            </button>
                            <button onClick={() => openEditStage(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={13} /></button>
                            <button onClick={() => handleDeleteStage(s)}
                              className={`p-1.5 rounded-lg ${s.is_default ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-red-50 text-red-500'}`}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Statuses (expanded) */}
                      {isExpanded && (
                        <div className="border-t bg-gray-50 px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Statuses</p>
                            {user?.role === 'admin' && (
                              <button onClick={() => openCreateStatus(s.id)}
                                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                                <Plus size={11} /> Add Status
                              </button>
                            )}
                          </div>
                          {(s.statuses || []).length === 0 ? (
                            <p className="text-xs text-gray-400 py-2">No statuses yet. Add one above.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {(s.statuses || []).map(st => (
                                <div key={st.id} className="flex items-center gap-1.5 bg-white border rounded-lg px-2.5 py-1.5 text-xs">
                                  <span className="font-medium text-gray-700">{st.name}</span>
                                  {user?.role === 'admin' && (
                                    <div className="flex gap-0.5 ml-1">
                                      <button onClick={() => openEditStatus(st, s.id)} className="text-gray-400 hover:text-gray-600"><Edit2 size={10} /></button>
                                      <button onClick={() => handleDeleteStatus(st)}
                                        className={st.is_default ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-red-500'}>
                                        <X size={10} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Stage modal */}
              {stageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-base">{editingStage ? 'Edit Stage' : 'New Stage'}</h3>
                      <button onClick={() => setStageModal(false)}><X size={16} className="text-gray-400" /></button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Stage Name <span className="text-red-500">*</span></label>
                        <input value={stageForm.name}
                          onChange={e => { setStageForm({ ...stageForm, name: e.target.value }); if (stageErrors.name) setStageErrors({}); }}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm ${stageErrors.name ? 'border-red-500' : ''}`} placeholder="e.g. Negotiation" />
                        {stageErrors.name && <p className="text-xs text-red-500 mt-1">{stageErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Color</label>
                        <div className="flex gap-2 flex-wrap">
                          {['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink', 'gray', 'cyan', 'amber'].map(c => (
                            <button key={c} onClick={() => setStageForm({ ...stageForm, color: c })}
                              className={`w-7 h-7 rounded-full bg-${c}-400 transition-all ${stageForm.color === c ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'hover:scale-105'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={stageForm.is_won} onChange={e => setStageForm({ ...stageForm, is_won: e.target.checked, is_lost: e.target.checked ? false : stageForm.is_lost })}
                            className="w-4 h-4 rounded" />
                          <span className="font-medium text-green-700">Mark as Won</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={stageForm.is_lost} onChange={e => setStageForm({ ...stageForm, is_lost: e.target.checked, is_won: e.target.checked ? false : stageForm.is_won })}
                            className="w-4 h-4 rounded" />
                          <span className="font-medium text-red-700">Mark as Lost</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Meta Conversion Event</label>
                        <select value={stageForm.meta_event_name} onChange={e => setStageForm({ ...stageForm, meta_event_name: e.target.value })}
                          className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                          <option value="">— Don't send —</option>
                          <option value="Lead">Lead</option>
                          <option value="Contact">Contact</option>
                          <option value="Schedule">Schedule</option>
                          <option value="SubmitApplication">SubmitApplication</option>
                          <option value="Subscribe">Subscribe</option>
                          <option value="StartTrial">StartTrial</option>
                          <option value="CompleteRegistration">CompleteRegistration</option>
                          <option value="Purchase">Purchase</option>
                        </select>
                        <p className="text-[11px] text-gray-400 mt-1">When a Meta-sourced lead moves into this stage, this event is sent to Meta's Conversions API to help optimise your ad campaigns.</p>
                      </div>
                    </div>
                    {modalError && (
                      <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{modalError}</div>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setStageModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                      <button onClick={handleSaveStage} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700">
                        {editingStage ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status modal */}
              {statusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-base">{editingStatus ? 'Edit Status' : 'New Status'}</h3>
                      <button onClick={() => setStatusModal(false)}><X size={16} className="text-gray-400" /></button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Status Name *</label>
                      <input value={statusForm.name} onChange={e => setStatusForm({ ...statusForm, name: e.target.value })}
                        className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="e.g. No Answer" autoFocus />
                    </div>
                    {modalError && (
                      <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{modalError}</div>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setStatusModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                      <button onClick={handleSaveStatus} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700">
                        {editingStatus ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'integrations' && (
            <>
              <h2 className="text-lg font-bold mb-4">Integrations</h2>

              <div className="border rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">Meta Ads Webhook</h3>
                    <p className="text-xs text-gray-500 mt-1">Auto-capture leads from Facebook & Instagram</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">ACTIVE</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Webhook URL:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white px-2 py-1.5 rounded border break-all">{webhookUrl}</code>
                    <button onClick={() => copyToClipboard(webhookUrl)} className="p-2 hover:bg-gray-100 rounded"><Copy size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Verify Token: <code className="bg-gray-100 px-1.5 py-0.5 rounded">curvelead_webhook_2026</code>
                </p>
              </div>

              <div className="border rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">WhatsApp Business API</h3>
                    <p className="text-xs text-gray-500 mt-1">Send and receive WhatsApp messages</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">SETUP REQUIRED</span>
                </div>
                <p className="text-xs text-gray-500">Configure via environment variables on the server. See documentation.</p>
              </div>

              <div className="border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">AI (Groq)</h3>
                    <p className="text-xs text-gray-500 mt-1">Auto-score leads as hot/warm/cold</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">ACTIVE</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
