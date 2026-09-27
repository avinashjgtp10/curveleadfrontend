import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TrialExpiredModal from '../ui/TrialExpiredModal';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const titles = {
    '/dashboard': 'Dashboard',
    '/leads': 'Leads',
    '/campaigns': 'Campaigns',
    '/ai-agent': 'AI Agent',
    '/whatsapp': 'WhatsApp',
    '/followups': 'Follow-ups',
    '/appointments': 'Appointments',
    '/lead-automation': 'Lead Automation',
    '/staff': 'Team',
    '/reports': 'Reports',
    '/billing': 'Billing',
    '/settings': 'Settings',
    '/market-intelligence': 'Market Intelligence',
    '/help': 'Help & Support',
  };

  const title = Object.entries(titles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'CurveLead';
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isDashboard && <Header title={title} onMenuClick={() => setSidebarOpen(true)} />}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet context={{ onMenuClick: () => setSidebarOpen(true) }} />
        </main>
      </div>
      <TrialExpiredModal />
    </div>
  );
};

export default Layout;
