import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const titles = {
    '/dashboard': 'Dashboard',
    '/leads': 'Leads',
    '/campaigns': 'Campaigns',
    '/whatsapp': 'WhatsApp Inbox',
    '/followups': 'Follow-ups',
    '/staff': 'Team',
    '/reports': 'Reports',
    '/settings': 'Settings',
  };

  const title = Object.entries(titles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'CurveLead';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
