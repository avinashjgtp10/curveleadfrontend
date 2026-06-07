import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Megaphone, MessageCircle, Clock, UserCog, BarChart3, Settings, LogOut, X, BookOpen, FileText } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { path: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'staff'] },
  { path: '/quotations', label: 'Quotations', icon: FileText, roles: ['admin', 'staff'] },
  { path: '/brochures', label: 'Brochures', icon: BookOpen, roles: ['admin', 'staff'] },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone, roles: ['admin'] },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, roles: ['admin', 'staff'] },
  { path: '/followups', label: 'Follow-ups', icon: Clock, roles: ['admin', 'staff'] },
  { path: '/staff', label: 'Team', icon: UserCog, roles: ['admin'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role === 'super_admin' ? 'admin' : user?.role;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-50 h-full w-60 bg-white border-r flex flex-col transform transition-transform lg:translate-x-0 lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">CL</span>
            </div>
            <span className="font-bold">CurveLead</span>
          </div>
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
              <span className="text-brand-700 font-semibold text-xs">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
