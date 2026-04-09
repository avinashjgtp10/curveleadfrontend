import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, IndianRupee,
  Receipt, UserCog, Settings, LogOut, X, TrendingUp, ClipboardCheck, Layers, Crown, Building2
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { path: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'staff'] },
  { path: '/students', label: 'Students', icon: GraduationCap, roles: ['admin', 'staff'] },
  { path: '/courses', label: 'Courses', icon: BookOpen, roles: ['admin'] },
  { path: '/batches', label: 'Batches', icon: Layers, roles: ['admin'] },
  { path: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['admin', 'staff'] },
  { path: '/fees', label: 'Fees & Revenue', icon: IndianRupee, roles: ['admin'] },
  { path: '/staff', label: 'Staff', icon: UserCog, roles: ['admin'] },
  { path: '/expenses', label: 'Expenses', icon: Receipt, roles: ['admin'] },
  { path: '/salary', label: 'Salary', icon: IndianRupee, roles: ['admin'] },
  { path: '/reports', label: 'Reports', icon: TrendingUp, roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

const superAdminItems = [
  { path: '/super-admin', label: 'Super Admin', icon: Crown },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const effectiveRole = user?.role === 'super_admin' ? 'admin' : user?.role;
  const filteredNav = navItems.filter(item => item.roles.includes(effectiveRole));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CL</span>
            </div>
            <span className="font-bold text-lg text-gray-900">CurveLead</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Academy name */}
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Academy</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{tenant?.name || 'My Academy'}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {user?.role === 'super_admin' && (
            <>
              <p className="px-3 py-1 text-xs text-amber-600 font-semibold uppercase tracking-wide">Platform</p>
              {superAdminItems.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={onClose} end={item.path === '/super-admin'}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <item.icon size={20} />{item.label}
                </NavLink>
              ))}
              <hr className="my-2 border-gray-200" />
              <p className="px-3 py-1 text-xs text-gray-400 font-semibold uppercase tracking-wide">Academy</p>
            </>
          )}
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info & logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-brand-700 font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
