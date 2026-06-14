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

// Handle 401 (auto logout)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
};

// ============================================
// Campaigns
// ============================================
export const campaignAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getOne: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  getROI: (id) => api.get(`/campaigns/${id}/roi`),
  getLeads: (id) => api.get(`/campaigns/${id}/leads`),
};

// ============================================
// WhatsApp
// ============================================
export const whatsappAPI = {
  getInbox: () => api.get('/whatsapp/inbox'),
  getConversation: (leadId) => api.get(`/whatsapp/conversations/${leadId}`),
  send: (leadId, message) => api.post('/whatsapp/send', { lead_id: leadId, message }),
};

// ============================================
// AI
// ============================================
export const aiAPI = {
  scoreLead: (leadId) => api.post(`/ai/score-lead/${leadId}`),
  scoreBulk: () => api.post('/ai/score-bulk'),
  qualify: (leadId) => api.post(`/ai/qualify/${leadId}`),
};

// ============================================
// Followups
// ============================================
export const followupAPI = {
  getAll: (params) => api.get('/followups', { params }),
  create: (data) => api.post('/followups', data),
  complete: (id, data) => api.put(`/followups/${id}/complete`, data),
  delete: (id) => api.delete(`/followups/${id}`),
};

// ============================================
// Staff
// ============================================
export const staffAPI = {
  getAll: () => api.get('/staff'),
  invite: (data) => api.post('/staff/invite', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
};

// ============================================
// Reports
// ============================================
export const reportsAPI = {
  conversion: (params) => api.get('/reports/conversion', { params }),
  bySource: (params) => api.get('/reports/by-source', { params }),
  byStaff: (params) => api.get('/reports/by-staff', { params }),
  byCampaign: (params) => api.get('/reports/by-campaign', { params }),
  dashboard: () => api.get('/reports/summary'),
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
