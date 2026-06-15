import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PageLoader from './components/ui/PageLoader';

// Public
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Protected
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import WhatsAppInboxPage from './pages/WhatsAppInboxPage';
import FollowupsPage from './pages/FollowupsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import BillingPage from './pages/BillingPage';
import MarketIntelligencePage from './pages/MarketIntelligencePage';

// ⭐ NEW: Brochures & Quotations
import BrochuresPage from './pages/BrochuresPage';
import IntegrationsPage from './pages/IntegrationsPage';
import QuotationsPage from './pages/QuotationsPage';
import QuotationEditorPage from './pages/QuotationEditorPage';
import QuotationViewPage from './pages/QuotationViewPage';
import QuotationPublicPage from './pages/QuotationPublicPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader message="Checking your session..." minHeight="h-screen" />;
  return user ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const App = () => (
  <AuthProvider>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
      <Route path="/q/:id" element={<QuotationPublicPage />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="whatsapp" element={<WhatsAppInboxPage />} />
        <Route path="followups" element={<FollowupsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="brochures" element={<BrochuresPage />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="quotations/new" element={<QuotationEditorPage />} />
        <Route path="quotations/:id/edit" element={<QuotationEditorPage />} />
        <Route path="quotations/:id" element={<QuotationViewPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="market-intelligence" element={<MarketIntelligencePage />} />
      </Route>
    </Routes>
  </AuthProvider>
);

export default App;
