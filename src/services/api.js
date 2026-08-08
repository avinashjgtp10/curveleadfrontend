import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 (auto logout) and 402 (trial expired)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (err.response?.status === 402) {
      window.dispatchEvent(new CustomEvent('trial-expired', {
        detail: { message: err.response.data?.error },
      }));
    }
    return Promise.reject(err);
  }
);

// ============================================
// Auth
// ============================================
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  requestOtp: (email) => api.post('/auth/request-otp', { email }),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  getInviteInfo: (token) => api.get(`/auth/invite/${token}`),
  acceptInvite: (data) => api.post('/auth/accept-invite', data),
};

// ============================================
// Leads
// ============================================
export const leadAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getOne: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  score: (id) => api.post(`/leads/${id}/score`),
  getStages: () => api.get('/leads/stages/all'),
  addFollowup: (id, data) => api.post(`/leads/${id}/followups`, data),
  getFollowupsToday: (params) => api.get('/leads/followups/today', { params }),
  bulkUpdate: (data) => api.put('/leads/bulk', data),
  bulkDelete: (ids) => api.delete('/leads/bulk', { data: { ids } }),
  findDuplicates: () => api.get('/leads/duplicates'),
  mergeDuplicates: (keep_id, remove_ids) => api.post('/leads/duplicates/merge', { keep_id, remove_ids }),
  export: (params) => api.get('/leads/export', { params, responseType: 'blob' }),
  logCall: (id) => api.post(`/leads/${id}/call-click`),
  markContacted: (id) => api.post(`/leads/${id}/mark-contacted`),
};

// ============================================
// Campaigns
// ============================================
export const campaignAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getOne: (id, params) => api.get(`/campaigns/${id}`, { params }),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  getAds: (id) => api.get(`/campaigns/${id}/ads`),
};

// ============================================
// WhatsApp
// ============================================
export const whatsappAPI = {
  getInbox: () => api.get('/whatsapp/inbox'),
  getConversation: (leadId) => api.get(`/whatsapp/conversation/${leadId}`),
  send: (leadId, message) => api.post('/whatsapp/send', { lead_id: leadId, message }),
};

// ============================================
// AI
// ============================================
// ============================================
// Lead Import
// ============================================
export const leadImportAPI = {
  import: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/leads/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  downloadTemplate: () => api.get('/leads/import/template', { responseType: 'blob' }),
};

export const aiAPI = {
  scoreLead: (leadId) => api.post(`/ai/score-lead/${leadId}`),
  scoreBulk: () => api.post('/ai/score-bulk'),
  qualify: (leadId) => api.post(`/ai/qualify/${leadId}`),
  marketAnalysis: (data) => api.post('/ai/market-analysis', data),
};

// ============================================
// Followups
// ============================================
export const followupAPI = {
  getAll: (params) => api.get('/followups', { params }),
  create: (data) => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
  complete: (id, data) => api.put(`/followups/${id}/complete`, data),
  delete: (id) => api.delete(`/followups/${id}`),
};

// ============================================
// Staff
// ============================================
export const staffAPI = {
  getAll: () => api.get('/staff'),
  create: (data) => api.post('/staff', data),
  invite: (data) => api.post('/staff/invite', data),
  getInvitations: () => api.get('/staff/invitations'),
  resendInvitation: (id) => api.post(`/staff/invitations/${id}/resend`),
  revokeInvitation: (id) => api.delete(`/staff/invitations/${id}`),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
};

// ============================================
// Teams
// ============================================
export const teamAPI = {
  getAll: () => api.get('/teams'),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
};

// ============================================
// Reports
// ============================================
export const reportsAPI = {
  conversion: (params) => api.get('/reports/conversion', { params }),
  bySource: (params) => api.get('/reports/by-source', { params }),
  byStaff: (params) => api.get('/reports/by-staff', { params }),
  byCampaign: (params) => api.get('/reports/by-campaign', { params }),
  dashboard: (params) => api.get('/reports/summary', { params }),
};

// ============================================
// Settings
// ============================================
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// ============================================
// Lead Stages
// ============================================
export const stageAPI = {
  getAll: () => api.get('/lead-stages'),
  create: (data) => api.post('/lead-stages', data),
  update: (id, data) => api.put(`/lead-stages/${id}`, data),
  delete: (id) => api.delete(`/lead-stages/${id}`),
  reorder: (stages) => api.put('/lead-stages/reorder', { stages }),
};

// ============================================
// Lead Statuses
// ============================================
export const statusAPI = {
  getAll: (params) => api.get('/lead-statuses', { params }),
  byStage: () => api.get('/lead-statuses/by-stage'),
  history: (leadId) => api.get(`/lead-statuses/history/${leadId}`),
  create: (data) => api.post('/lead-statuses', data),
  update: (id, data) => api.put(`/lead-statuses/${id}`, data),
  delete: (id) => api.delete(`/lead-statuses/${id}`),
  reorder: (statuses) => api.put('/lead-statuses/reorder', { statuses }),
};

// ============================================
// Templates
// ============================================
export const templateAPI = {
  getAll: (params) => api.get('/templates', { params }),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  generate: (id, data) => api.post(`/templates/${id}/send`, data),
};

// ============================================
// Automations (sequences + trigger rules)
// ============================================
export const automationAPI = {
  getSequences: () => api.get('/automations/sequences'),
  createSequence: (data) => api.post('/automations/sequences', data),
  updateSequence: (id, data) => api.put(`/automations/sequences/${id}`, data),
  deleteSequence: (id) => api.delete(`/automations/sequences/${id}`),
  getRules: () => api.get('/automations/rules'),
  createRule: (data) => api.post('/automations/rules', data),
  updateRule: (id, data) => api.put(`/automations/rules/${id}`, data),
  deleteRule: (id) => api.delete(`/automations/rules/${id}`),
};

// ============================================
// Payments
// ============================================
export const paymentAPI = {
  getPlans: () => api.get('/payments/plans'),
  createOrder: (planName, billingPeriod) => api.post('/payments/create-order', { planName, billingPeriod }),
  verify: (data) => api.post('/payments/verify', data),
};

// ============================================
// ⭐ NEW: Notes
// ============================================
export const notesAPI = {
  getByLead: (leadId) => api.get(`/notes/lead/${leadId}`),
  create: (leadId, data) => api.post(`/notes/lead/${leadId}`, data),
  update: (leadId, noteId, data) => api.put(`/notes/lead/${leadId}/${noteId}`, data),
  delete: (leadId, noteId) => api.delete(`/notes/lead/${leadId}/${noteId}`),
};

// ============================================
// ⭐ NEW: Attachments
// ============================================
export const attachmentsAPI = {
  getByLead: (leadId) => api.get(`/attachments/lead/${leadId}`),
  upload: (leadId, formData) => api.post(`/attachments/lead/${leadId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (leadId, attachmentId) => api.delete(`/attachments/lead/${leadId}/${attachmentId}`),
  shareWhatsApp: (leadId, attachmentId) => api.post(`/attachments/lead/${leadId}/${attachmentId}/share-whatsapp`),
};

// ============================================
// ⭐ NEW: Brochures
// ============================================
export const brochuresAPI = {
  getAll: (params) => api.get('/brochures', { params }),
  upload: (formData) => api.post('/brochures', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/brochures/${id}`),
  shareWithLead: (brochureId, leadId) => api.post(`/brochures/${brochureId}/share/${leadId}`),
};

// ============================================
// ⭐ NEW: Quotations
// ============================================
export const quotationsAPI = {
  getAll: (params) => api.get('/quotations', { params }),
  getOne: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  send: (id) => api.post(`/quotations/${id}/send`),
  accept: (id) => api.post(`/quotations/${id}/accept`),
  reject: (id, reason) => api.post(`/quotations/${id}/reject`, { reason }),
  delete: (id) => api.delete(`/quotations/${id}`),
};

// ============================================
// Integrations
// ============================================
export const integrationsAPI = {
  getSettings: () => api.get('/integrations/settings'),
  updateSettings: (data) => api.put('/integrations/settings', data),
  generateApiKey: () => api.post('/integrations/api-key'),
  revokeApiKey: () => api.delete('/integrations/api-key'),
  getEmbedScript: () => api.get('/integrations/embed-script'),
  facebookAuth: (user_token) => api.post('/integrations/facebook/auth', { user_token }),
  facebookConnectPage: (data) => api.post('/integrations/facebook/connect-page', data),
  facebookSyncLeads: () => api.post('/integrations/facebook/sync-leads'),
  getCapiStats: () => api.get('/integrations/meta/capi-stats'),
  getAdAccounts: () => api.get('/integrations/facebook/ad-accounts'),
  syncAdInsights: () => api.post('/integrations/facebook/sync-ad-insights'),
};

// ============================================
// Recordings
// ============================================
export const recordingAPI = {
  getByLead: (leadId) => api.get(`/recordings/${leadId}`),
  upload: (leadId, file, title) => {
    const fd = new FormData();
    fd.append('file', file);
    if (title) fd.append('title', title);
    return api.post(`/recordings/${leadId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getTeam: (params) => api.get('/recordings/team', { params }),
  delete: (id) => api.delete(`/recordings/${id}`),
  retry: (id) => api.post(`/recordings/${id}/retry`),
};

// ============================================
// AI Calling Agent
// ============================================
export const aiCallingAPI = {
  getSettings: () => api.get('/ai-calling/settings'),
  updateSettings: (data) => api.put('/ai-calling/settings', data),
  getVoices: () => api.get('/ai-calling/voices'),
  getAgents: () => api.get('/ai-calling/agents'),
  createAgent: (data) => api.post('/ai-calling/agents', data),
  updateAgent: (id, data) => api.put(`/ai-calling/agents/${id}`, data),
  deleteAgent: (id) => api.delete(`/ai-calling/agents/${id}`),
  getLeadCalls: (leadId) => api.get(`/ai-calling/leads/${leadId}/calls`),
  callLead: (leadId, agentId) => api.post(`/ai-calling/leads/${leadId}/call`, { agentId }),
  getCall: (id) => api.get(`/ai-calling/calls/${id}`),
};

// ============================================
// Sales Playbook & Coaching
// ============================================
export const playbookAPI = {
  get: () => api.get('/playbook'),
  regenerate: () => api.post('/playbook/generate'),
  getCoaching: () => api.get('/playbook/coaching'),
};

// ============================================
// Notifications
// ============================================
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getCount: () => api.get('/notifications/count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
