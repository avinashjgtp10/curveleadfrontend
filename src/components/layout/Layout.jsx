import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/leads': 'Lead Management',
  '/students': 'Student Management',
  '/courses': 'Courses',
  '/batches': 'Batch Management',
  '/attendance': 'Attendance',
  '/fees': 'Fees & Revenue',
  '/templates': 'Message Templates',
  '/staff': 'Staff Management',
  '/expenses': 'Expenses',
  '/salary': 'Salary Management',
  '/reports': 'Reports',
  '/super-admin': 'Super Admin',
  '/settings': 'Settings',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getTitle = () => {
    const path = '/' + location.pathname.split('/')[1];
    return pageTitles[path] || 'CurveLead';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={getTitle()} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
