import { pageTitle } from '../../utils/pageTitles';
import { useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TrialExpiredModal from '../ui/TrialExpiredModal';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = pageTitle(location.pathname);
  const mainRef = useRef(null);
  useLayoutEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet context={{ onMenuClick: () => setSidebarOpen(true) }} />
        </main>
      </div>
      <TrialExpiredModal />
    </div>
  );
};

export default Layout;
