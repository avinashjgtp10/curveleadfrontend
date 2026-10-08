import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot, LayoutDashboard, Users, Zap, CalendarCheck, Store, Settings, Bell, ChevronDown, Search, LogOut, Crown, Briefcase, FileText,
  UserCog, CreditCard, Receipt, Layers, ScrollText, LifeBuoy, MessageCircle, Megaphone, Plug, Menu, X, CornerDownLeft, History,
} from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { superAdminAPI } from '../services/api';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { path: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/super-admin/workspaces', label: 'Organizations', icon: Store },
      { path: '/super-admin/salons', label: 'Business Management', icon: Briefcase },
      { path: '/super-admin/users', label: 'Users', icon: UserCog },
    ],
  },
  {
    title: 'Sales & Growth',
    items: [
      { path: '/super-admin/leads', label: 'Leads', icon: Users },
      { path: '/super-admin/campaigns', label: 'Campaigns', icon: Megaphone },
      { path: '/super-admin/templates', label: 'Templates', icon: FileText },
      { path: '/super-admin/appointments', label: 'Appointments', icon: CalendarCheck },
      { path: '/super-admin/whatsapp', label: 'WhatsApp', icon: MessageCircle },
    ],
  },
  {
    title: 'AI & Automation',
    items: [
      { path: '/super-admin/ai-agent', label: 'AI Agent', icon: Bot },
      { path: '/super-admin/automations', label: 'Automations', icon: Zap },
      { path: '/super-admin/integrations', label: 'Integrations', icon: Plug },
    ],
  },
  {
    title: 'Billing',
    items: [
      { path: '/super-admin/plans', label: 'Plans', icon: Layers },
      { path: '/super-admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { path: '/super-admin/billing', label: 'Billing & Invoices', icon: Receipt },
    ],
  },
  {
    title: 'Platform',
    items: [
      { path: '/super-admin/support', label: 'Support', icon: LifeBuoy, badgeKey: 'openTickets' },
      { path: '/super-admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
      { path: '/super-admin/history', label: 'History', icon: History },
    ],
  },
];
// Settings is not in the sidebar (it opens from the profile menu) but stays searchable and titled in the header.
const ALL_ITEMS = [
  ...NAV_GROUPS.flatMap(g => g.items.map(item => ({ ...item, group: g.title }))),
  { path: '/super-admin/settings', label: 'Settings', icon: Settings, group: 'Platform' },
];

const SidebarContent = ({ badges, user, onNavigate, onLogout }) => (
  <>
    <div className="h-16 flex items-center px-5 shrink-0">
      <BrandLogo className="h-8 w-auto" />
    </div>
    <nav className="flex-1 px-3 pb-3 overflow-y-auto space-y-5">
      {NAV_GROUPS.map(group => (
        <div key={group.title}>
          <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.title}</p>
          <div className="space-y-0.5">
            {group.items.map(item => (
              <NavLink key={item.path} to={item.path} onClick={onNavigate}
                className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}>
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-indigo-600" />}
                    <item.icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badgeKey && badges[item.badgeKey] > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center">{badges[item.badgeKey]}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
    <div className="p-4 shrink-0">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-3 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0"><Crown size={16} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#141a3d] truncate">{user?.name || 'Super Admin'}</p>
          <p className="text-[11px] text-slate-500 truncate">{user?.email || 'Full platform access'}</p>
        </div>
        <button onClick={onLogout} title="Log out" className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-slate-700">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  </>
);

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const confirm = useConfirmDialog();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [openTickets, setOpenTickets] = useState(0);
  const [apiError, setApiError] = useState('');
  const searchRef = useRef(null);

  const currentItem = ALL_ITEMS.find(i => location.pathname === i.path || location.pathname.startsWith(`${i.path}/`));

  useEffect(() => { setMobileNavOpen(false); setQuery(''); setApiError(''); }, [location.pathname]);

  useEffect(() => {
    const onError = (e) => setApiError(e.detail?.message || 'Something went wrong.');
    window.addEventListener('superadmin-api-error', onError);
    return () => window.removeEventListener('superadmin-api-error', onError);
  }, []);

  // The bell and the Support badge show the real number of open tickets.
  useEffect(() => {
    superAdminAPI.getSupportTickets({ status: 'open' })
      .then(({ data }) => setOpenTickets((data.tickets || []).length))
      .catch(() => setOpenTickets(0));
  }, [location.pathname]);

  // Ctrl/Cmd + K jumps to the page search from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ALL_ITEMS.filter(i => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)).slice(0, 6) : [];
  }, [query]);

  const goTo = (path) => { navigate(path); setQuery(''); searchRef.current?.blur(); };

  const handleLogout = async () => {
    setMenuOpen(false);
    const ok = await confirm({ title: 'Log out?', message: 'You will need to sign in again to access the Super Admin console.', confirmText: 'Log out' });
    if (!ok) return;
    logout(); // clears the real session (token, user, tenant)
    navigate('/login');
  };

  const badges = { openTickets };
  const initials = (user?.name || 'Super Admin').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f6f8fd] to-[#eef1fb] text-gray-900">
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-slate-100 flex-col">
        <SidebarContent badges={badges} user={user} onLogout={handleLogout} />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white flex flex-col shadow-xl">
            <button onClick={() => setMobileNavOpen(false)} className="absolute right-3 top-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close menu"><X size={18} /></button>
            <SidebarContent badges={badges} user={user} onNavigate={() => setMobileNavOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 flex items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setMobileNavOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-white" aria-label="Open menu"><Menu size={20} /></button>
          <p className="hidden sm:block text-sm font-semibold text-slate-500 truncate">{currentItem?.group ? `${currentItem.group} / ` : ''}<span className="text-[#141a3d]">{currentItem?.label || 'Super Admin'}</span></p>

          <div className="flex-1" />

          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
              onKeyDown={e => {
                if (e.key === 'Enter' && matches[0]) goTo(matches[0].path);
                if (e.key === 'Escape') { setQuery(''); e.target.blur(); }
              }}
              placeholder="Jump to a page…  Ctrl K"
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {searchFocused && query.trim() && (
              <div className="absolute left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg z-30 py-1 overflow-hidden">
                {matches.length ? matches.map((m, i) => (
                  <button key={m.path} onMouseDown={() => goTo(m.path)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-indigo-50">
                    <m.icon size={16} className="text-slate-400" />
                    <span className="flex-1 text-gray-800">{m.label}</span>
                    <span className="text-[11px] text-slate-400">{m.group}</span>
                    {i === 0 && <CornerDownLeft size={12} className="text-slate-300" />}
                  </button>
                )) : <p className="px-3 py-3 text-sm text-gray-400">No matching page.</p>}
              </div>
            )}
          </div>

          <button onClick={() => navigate('/super-admin/support')} className="relative p-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-800" title={openTickets ? `${openTickets} open support ticket${openTickets === 1 ? '' : 's'}` : 'No open support tickets'}>
            <Bell size={19} />
            {openTickets > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">{openTickets > 99 ? '99+' : openTickets}</span>
            )}
          </button>

          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-white">
              <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs">{initials}</span>
              <span className="text-sm font-medium text-gray-700 hidden md:inline">{user?.name || 'Super Admin'}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-20 py-1">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Super Admin'}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button onClick={() => { setMenuOpen(false); navigate('/super-admin/settings'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings size={15} /> Settings
                  </button>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8 pt-2">
          {apiError && (
            <div role="alert" className="max-w-7xl mx-auto mb-4 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="flex-1">{apiError}</span>
              <button onClick={() => setApiError('')} className="p-0.5 rounded hover:bg-red-100" aria-label="Dismiss"><X size={16} /></button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
