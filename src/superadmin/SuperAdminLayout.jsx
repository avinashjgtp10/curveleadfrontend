import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, CalendarCheck, UserCircle2, Store, Settings, Bell, ChevronDown, Search, LogOut } from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';
import { MOCK_SESSION_KEY } from './mockData';

const NAV_ITEMS = [
  { path: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/super-admin/leads', label: 'Leads', icon: Users },
  { path: '/super-admin/automations', label: 'Automations', icon: Zap },
  { path: '/super-admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { path: '/super-admin/customers', label: 'Customers', icon: UserCircle2 },
  { path: '/super-admin/salons', label: 'Salons', icon: Store },
  { path: '/super-admin/settings', label: 'Settings', icon: Settings },
];

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem(MOCK_SESSION_KEY);
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <aside className="w-60 shrink-0 bg-[#10143a] flex flex-col">
        <div className="h-16 flex items-center px-5">
          <BrandLogo variant="white" className="h-8 w-auto" />
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'text-indigo-200/70 hover:bg-white/5 hover:text-white'
              }`}>
              <item.icon size={18} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center text-white font-semibold text-sm shrink-0">A</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">Admin</p>
              <p className="text-[11px] text-indigo-200/70 truncate">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white border-b flex items-center justify-between px-6 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads, customers, salons..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button className="relative p-2 text-gray-500 hover:text-gray-800">
              <Bell size={19} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">SA</div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">Super Admin</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-xl shadow-lg z-20 py-1">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
