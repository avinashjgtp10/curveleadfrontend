// The Super Admin console runs on real backend data (see services/api.js
// superAdminAPI). The only thing left here is the frontend-only demo login
// bypass, kept as a fallback way into the console without a real account.

export const MOCK_SUPERADMIN_CREDENTIALS = {
  email: 'admin@curved.com',
  password: '12345678',
};

export const MOCK_SESSION_KEY = 'curvelead_mock_superadmin';
