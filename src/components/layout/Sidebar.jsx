import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, IndianRupee,
  Receipt, UserCog, Settings, LogOut, X, TrendingUp, ClipboardCheck,
  Layers, Crown, ChevronDown, Wallet, Clock
} from 'lucide-react';

const menuGroups = [
  {
    label: null,
    roles: ['admin', 'staff'],
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'CRM',
    roles: ['admin', 'staff'],
    items: [
      { path: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'staff'] },
      { path: '/students', label: 'Students', icon: GraduationCap, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'Academics',
    roles: ['admin'],
    items: [
      { path: '/courses', label: 'Courses', icon: BookOpen, roles: ['admin'] },
      { path: '/batches', label: 'Batches', icon: Layers, roles: ['admin'] },
      { path: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'Finance',
    roles: ['admin'],
    items: [
      { path: '/fees', label: 'Fees & Revenue', icon: IndianRupee, roles: ['admin'] },
      { path: '/expenses', label: 'Expenses', icon: Receipt, roles: ['admin'] },
      { path: '/salary', label: 'Salary', icon: Wallet, roles: ['admin'] },
      { path: '/reports', label: 'P&L Reports', icon: TrendingUp, roles: ['admin'] },
    ],
  },
  {
    label: 'Team',
    roles: ['admin'],
    items: [
      { path: '/staff', label: 'Staff', icon: UserCog, roles: ['admin'] },
    ],
  },
  {
    label: null,
    roles: ['admin'],
    items: [
      { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState({});

  const handleLogout = () => { logout(); navigate('/login'); };

  const effectiveRole = user?.role === 'super_admin' ? 'admin' : user?.role;

  const toggleGroup = (label) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isGroupActive = (items) => {
    return items.some(item => location.pathname.startsWith(item.path));
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-60 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out flex flex-col
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">CL</span>
            </div>
            <span className="font-bold text-base text-gray-900">CurveLead</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>

        {/* Academy name */}
        <div className="px-4 py-2.5 border-b border-gray-100 shrink-0">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Academy</p>
          <p className="text-xs font-semibold text-gray-700 truncate">{tenant?.name || 'My Academy'}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {/* Super Admin section */}
          {user?.role === 'super_admin' && (
            <>
              <p className="px-3 py-1 text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Platform</p>
              <NavLink to="/super-admin" onClick={onClose} end
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${isActive ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Crown size={18} /> Super Admin
              </NavLink>
              <hr className="my-2 border-gray-100" />
            </>
          )}

          {menuGroups.map((group, gi) => {
            if (!group.roles.includes(effectiveRole)) return null;

            const visibleItems = group.items.filter(item => item.roles.includes(effectiveRole));
            if (visibleItems.length === 0) return null;

            // No label = standalone item (Dashboard, Settings)
            if (!group.label) {
              return visibleItems.map(item => (
                <NavLink key={item.path} to={item.path} onClick={onClose}
                  className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <item.icon size={18} /> {item.label}
                </NavLink>
              ));
            }

            // Group with label and collapsible submenu
            const isExpanded = !collapsed[group.label];
            const groupActive = isGroupActive(visibleItems);

            return (
              <div key={group.label} className="mb-1">
                <button onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors ${groupActive ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  {group.label}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                </button>
                {isExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {visibleItems.map(item => (
                      <NavLink key={item.path} to={item.path} onClick={onClose}
                        className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <item.icon size={18} /> {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="border-t border-gray-200 p-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-brand-700 font-semibold text-xs">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
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
