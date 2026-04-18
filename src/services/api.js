import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('curvelead_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('curvelead_token');
      localStorage.removeItem('curvelead_user');
      localStorage.removeItem('curvelead_tenant');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  inviteStaff: (data) => api.post('/auth/invite-staff', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Lead APIs
export const leadAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getOne: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  addFollowup: (id, data) => api.post(`/leads/${id}/followups`, data),
  getStats: () => api.get('/leads/stats'),
  getTodayFollowups: () => api.get('/leads/followups/today'),
  // Journey / Activities
  getActivities: (id) => api.get(`/leads/${id}/activities`),
  addActivity: (id, data) => api.post(`/leads/${id}/activities`, data),
  logCall: (id, data) => api.post(`/leads/${id}/log-call`, data),
  logWhatsApp: (id, data) => api.post(`/leads/${id}/log-whatsapp`, data),
  logVisit: (id, data) => api.post(`/leads/${id}/log-visit`, data),
  logNote: (id, data) => api.post(`/leads/${id}/log-note`, data),
};

// Course APIs
export const courseAPI = {
  getAll: () => api.get('/courses'),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// Batch APIs
export const batchAPI = {
  getAll: (params) => api.get('/batches', { params }),
  getOne: (id) => api.get(`/batches/${id}`),
  create: (data) => api.post('/batches', data),
  update: (id, data) => api.put(`/batches/${id}`, data),
  delete: (id) => api.delete(`/batches/${id}`),
};

// Student APIs
export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getOne: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  enrollLead: (leadId, data) => api.post(`/students/enroll-lead/${leadId}`, data),
};

// Attendance APIs
export const attendanceAPI = {
  getByBatch: (batchId, date) => api.get(`/attendance/batch/${batchId}`, { params: { date } }),
  mark: (batchId, data) => api.post(`/attendance/batch/${batchId}`, data),
  getByStudent: (studentId, month) => api.get(`/attendance/student/${studentId}`, { params: { month } }),
  getBatchReport: (batchId, month) => api.get(`/attendance/report/${batchId}`, { params: { month } }),
};

// Fee APIs
export const feeAPI = {
  getAll: (params) => api.get('/fees', { params }),
  getDetails: (id) => api.get(`/fees/${id}`),
  recordPayment: (id, data) => api.post(`/fees/${id}/pay`, data),
  getMonthlyRevenue: (months) => api.get('/fees/revenue/monthly', { params: { months } }),
  getReminders: () => api.get('/fees/reminders'),
  actionReminder: (installmentId, data) => api.post(`/fees/reminders/${installmentId}/action`, data),
  updateInstallments: (id, data) => api.put(`/fees/${id}/installments`, data),
  delete: (id) => api.delete(`/fees/${id}`),
  deletePayment: (id) => api.delete(`/fees/payment/${id}`),
  downloadReceiptPDF: (feeId, paymentId) => api.get(`/fees/${feeId}/receipt/${paymentId}/pdf`, { responseType: 'blob' }),
  emailReceipt: (feeId, paymentId, data) => api.post(`/fees/${feeId}/receipt/${paymentId}/email`, data),
};

// Staff APIs
export const staffAPI = {
  getAll: () => api.get('/staff'),
  getOne: (id, params) => api.get(`/staff/${id}`, { params }),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  getTrainers: () => api.get('/staff/trainers'),
  // Time management
  getTimeLogs: (date) => api.get('/staff/time-logs', { params: { date } }),
  checkIn: (data) => api.post('/staff/check-in', data),
  checkOut: (data) => api.post('/staff/check-out', data),
  overrideStatus: (id, data) => api.put(`/staff/time-logs/${id}/override`, data),
  markAttendance: (data) => api.post('/staff/attendance', data),
  // Incentives
  addIncentive: (data) => api.post('/staff/incentives', data),
  deleteIncentive: (id) => api.delete(`/staff/incentives/${id}`),
  // Settings
  updateSettings: (data) => api.put('/staff/settings', data),
};

// Expense APIs
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getCategories: () => api.get('/expenses/categories'),
  createCategory: (data) => api.post('/expenses/categories', data),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getMonthlyReport: (months) => api.get('/expenses/report/monthly', { params: { months } }),
};

// Salary APIs
export const salaryAPI = {
  getOverview: (month, year) => api.get('/salary', { params: { month, year } }),
  process: (data) => api.post('/salary/process', data),
  getHistory: (months) => api.get('/salary/history', { params: { months } }),
};

// Reports APIs
export const reportsAPI = {
  getPnL: (view, fy) => api.get('/reports/pnl', { params: { view, fy } }),
  getSummary: () => api.get('/reports/summary'),
};

// Super Admin APIs
export const superAdminAPI = {
  getStats: () => api.get('/super-admin/stats'),
  getPlans: () => api.get('/super-admin/plans'),
  getTenants: (params) => api.get('/super-admin/tenants', { params }),
  updateTenant: (id, data) => api.put(`/super-admin/tenants/${id}`, data),
  extendTrial: (id, days) => api.post(`/super-admin/tenants/${id}/extend-trial`, { days }),
};

// Settings APIs
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Template APIs
export const templateAPI = {
  getAll: (category) => api.get('/templates', { params: { category } }),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  generate: (id, data) => api.post(`/templates/${id}/send`, data),
};

// Lead Stages APIs
export const leadStageAPI = {
  getAll: () => api.get('/lead-stages'),
  create: (data) => api.post('/lead-stages', data),
  update: (id, data) => api.put(`/lead-stages/${id}`, data),
  delete: (id) => api.delete(`/lead-stages/${id}`),
  reorder: (stages) => api.put('/lead-stages/reorder', { stages }),
};

// Dashboard API
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export default api;
