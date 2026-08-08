import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Megaphone, MessageCircle, UserCog, BarChart3, Settings, LogOut, X, BookOpen, CreditCard, Plug, CalendarCheck, Globe, Lightbulb, HelpCircle } from 'lucide-react';
import BrandLogo from '../ui/BrandLogo';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { path: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'staff'] },
  { path: '/brochures', label: 'Brochures', icon: BookOpen, roles: ['admin', 'staff'] },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone, roles: ['admin'] },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, roles: ['admin', 'staff'] },
  { path: '/appointments', label: 'Appointments', icon: CalendarCheck, roles: ['admin', 'staff'] },
  { path: '/staff', label: 'Team', icon: UserCog, roles: ['admin'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  { path: '/coaching', label: 'Sales Coaching', icon: Lightbulb, roles: ['admin'] },
  { path: '/market-intelligence', label: 'Market AI', icon: Globe, roles: ['admin'] },
  { path: '/integrations', label: 'Integrations', icon: Plug, roles: ['admin'] },
  { path: '/billing', label: 'Billing', icon: CreditCard, roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  { path: '/help', label: 'User Guide', icon: HelpCircle, roles: ['admin', 'staff'] },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role === 'super_admin' ? 'admin' : user?.role;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-50 h-full w-60 bg-white border-r flex flex-col transform transition-transform lg:translate-x-0 lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <button className="flex items-center" onClick={() => navigate('/dashboard')}>
            <BrandLogo className="w-32 h-auto" />
          </button>
          <button onClick={onClose} className="lg:hidden p-1"><X size={18} /></button>
        </div>

        <div className="px-4 py-2.5 border-b">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Workspace</p>
          <p className="text-xs font-semibold text-gray-700 truncate">{tenant?.name || 'My Business'}</p>
        </div>

        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {navItems.filter(item => item.roles.includes(role)).map(item => (
            <NavLink key={item.path} to={item.path} onClick={onClose}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <item.icon size={18} /> {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-brand-700 font-semibold text-xs">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button onClick={() => setShowLogoutConfirm(true)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-72 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <LogOut size={22} className="text-red-500" />
            </div>
            <h3 className="text-center font-semibold text-gray-800 mb-1">Logout</h3>
            <p className="text-center text-sm text-gray-500 mb-5">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleLogout}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
