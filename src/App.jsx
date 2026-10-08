import { useEffect } from 'react';
import { documentTitle } from './utils/pageTitles';
import AutomationsPage from './pages/AutomationsPage';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfirmDialogProvider } from './components/ui/ConfirmDialog';
import { ToastProvider } from './components/ui/Toast';

// Public
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import AppShellSkeleton from './components/layout/AppShellSkeleton';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ContactUsPage from './pages/ContactUsPage';

// Protected
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import AdsManagerPage from './pages/AdsManagerPage';
import SocialPage from './pages/SocialPage';
import AiAgentPage from './pages/AiAgentPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import WhatsAppHubPage from './pages/WhatsAppHubPage';
import GmbPage from './pages/GmbPage';
import FollowupsPage from './pages/FollowupsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import LeadAutomationPage from './pages/LeadAutomation/LeadAutomationPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';
import CoachingPage from './pages/CoachingPage';
import SettingsPage from './pages/SettingsPage';
import BillingPage from './pages/BillingPage';
import HelpPage from './pages/HelpPage';

// ⭐ NEW: Brochures & Quotations
import BrochuresPage from './pages/BrochuresPage';
import IntegrationsPage from './pages/IntegrationsPage';
import QuotationsPage from './pages/QuotationsPage';
import QuotationEditorPage from './pages/QuotationEditorPage';
import QuotationViewPage from './pages/QuotationViewPage';
import QuotationPublicPage from './pages/QuotationPublicPage';

// ⭐ Super Admin console (see src/superadmin)
import SuperAdminLayout from './superadmin/SuperAdminLayout';
import SuperAdminDashboardPage from './superadmin/pages/SuperAdminDashboardPage';
import SuperAdminWorkspacesPage from './superadmin/pages/SuperAdminWorkspacesPage';
import SuperAdminWorkspaceDetailPage from './superadmin/pages/SuperAdminWorkspaceDetailPage';
import SuperAdminUsersPage from './superadmin/pages/SuperAdminUsersPage';
import SuperAdminLeadsPage from './superadmin/pages/SuperAdminLeadsPage';
import SuperAdminCampaignsPage from './superadmin/pages/SuperAdminCampaignsPage';
import SuperAdminTemplatesPage from './superadmin/pages/SuperAdminTemplatesPage';
import SuperAdminHistoryPage from './superadmin/pages/SuperAdminHistoryPage';
import SuperAdminAutomationsPage from './superadmin/pages/SuperAdminAutomationsPage';
import SuperAdminBookingsPage from './superadmin/pages/SuperAdminBookingsPage';
import SuperAdminWhatsAppPage from './superadmin/pages/SuperAdminWhatsAppPage';
import SuperAdminAiAgentPage from './superadmin/pages/SuperAdminAiAgentPage';
import SuperAdminIntegrationsPage from './superadmin/pages/SuperAdminIntegrationsPage';
import SuperAdminCustomersPage from './superadmin/pages/SuperAdminCustomersPage';
import SuperAdminSalonsPage from './superadmin/pages/SuperAdminSalonsPage';
import SuperAdminSubscriptionsPage from './superadmin/pages/SuperAdminSubscriptionsPage';
import SuperAdminBillingPage from './superadmin/pages/SuperAdminBillingPage';
import SuperAdminPlansPage from './superadmin/pages/SuperAdminPlansPage';
import SuperAdminActivityLogsPage from './superadmin/pages/SuperAdminActivityLogsPage';
import SuperAdminSupportPage from './superadmin/pages/SuperAdminSupportPage';
import SuperAdminSettingsPage from './superadmin/pages/SuperAdminSettingsPage';

const SuperAdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader message="Checking your session..." minHeight="h-screen" />;
  return user?.role === 'super_admin' ? children : <Navigate to="/login" replace />;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppShellSkeleton />;
  return user ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function RouteTitle() { const { pathname } = useLocation(); useEffect(() => { document.title = documentTitle(pathname); }, [pathname]); return null; }

const App = () => (
  <AuthProvider>
    <ToastProvider>
    <ConfirmDialogProvider>
      <RouteTitle />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/accept-invite" element={<GuestRoute><AcceptInvitePage /></GuestRoute>} />
        <Route path="/q/:id" element={<QuotationPublicPage />} />
        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<Navigate to="/terms-of-service" replace />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/contact" element={<ContactUsPage />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="leads/:id" element={<LeadDetailPage />} />
          <Route path="campaigns" element={<Navigate to="/ads?tab=campaigns" replace />} />
          <Route path="ads" element={<AdsManagerPage />} />
          <Route path="social" element={<SocialPage />} />
          <Route path="campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="ai-agent" element={<AiAgentPage />} />
          <Route path="whatsapp" element={<WhatsAppHubPage />} />
          <Route path="gmb" element={<GmbPage />} />
          <Route path="templates" element={<Navigate to="/whatsapp?tab=templates" replace />} />
          <Route path="followups" element={<FollowupsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="automations" element={<AutomationsPage />} />
          <Route path="lead-automation" element={<LeadAutomationPage />} />
          <Route path="brochures" element={<BrochuresPage />} />
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="quotations/new" element={<QuotationEditorPage />} />
          <Route path="quotations/:id/edit" element={<QuotationEditorPage />} />
          <Route path="quotations/:id" element={<QuotationViewPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="coaching" element={<CoachingPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="help" element={<HelpPage />} />
        </Route>

        <Route path="/super-admin" element={<SuperAdminProtectedRoute><SuperAdminLayout /></SuperAdminProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboardPage />} />
          <Route path="workspaces" element={<SuperAdminWorkspacesPage />} />
          <Route path="workspaces/:id" element={<SuperAdminWorkspaceDetailPage />} />
          <Route path="users" element={<SuperAdminUsersPage />} />
          <Route path="leads" element={<SuperAdminLeadsPage />} />
          <Route path="campaigns" element={<SuperAdminCampaignsPage />} />
          <Route path="templates" element={<SuperAdminTemplatesPage />} />
          <Route path="appointments" element={<SuperAdminBookingsPage />} />
          <Route path="whatsapp" element={<SuperAdminWhatsAppPage />} />
          <Route path="ai-agent" element={<SuperAdminAiAgentPage />} />
          <Route path="integrations" element={<SuperAdminIntegrationsPage />} />
          <Route path="subscriptions" element={<SuperAdminSubscriptionsPage />} />
          <Route path="billing" element={<SuperAdminBillingPage />} />
          <Route path="plans" element={<SuperAdminPlansPage />} />
          <Route path="automations" element={<SuperAdminAutomationsPage />} />
          <Route path="activity" element={<SuperAdminActivityLogsPage />} />
          <Route path="audit-logs" element={<SuperAdminActivityLogsPage />} />
          <Route path="support" element={<SuperAdminSupportPage />} />
          <Route path="history" element={<SuperAdminHistoryPage />} />
          <Route path="settings" element={<SuperAdminSettingsPage />} />
          {/* Legacy paths kept working, redirected to their new equivalents */}
          <Route path="bookings" element={<Navigate to="appointments" replace />} />
          <Route path="activity-logs" element={<Navigate to="audit-logs" replace />} />
          <Route path="customers" element={<SuperAdminCustomersPage />} />
          <Route path="salons" element={<SuperAdminSalonsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ConfirmDialogProvider>
    </ToastProvider>
  </AuthProvider>
);

export default App;
