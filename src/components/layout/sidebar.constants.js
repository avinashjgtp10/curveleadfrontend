import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarCheck,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  TrendingUp,
  MessageCircle,
  Plug,
  Settings,
  Star,
  UserCog,
  Users,
  Workflow,
} from 'lucide-react';

export const SIDEBAR_NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { path: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'staff'] },
  { path: '/brochures', label: 'Brochures', icon: BookOpen, roles: ['admin', 'staff'] },
  { path: '/ads', label: 'Ads Manager', icon: TrendingUp, roles: ['admin'] },
  { path: '/ai-agent', label: 'AI Agent', icon: Bot, roles: ['admin'] },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, roles: ['admin', 'staff'] },
  { path: '/gmb', label: 'GMB', icon: Star, roles: ['admin'] },
  { path: '/appointments', label: 'Appointments', icon: CalendarCheck, roles: ['admin', 'staff'] },
  { path: '/automations', label: 'Automations', icon: Workflow, roles: ['admin', 'staff'] },
  { path: '/staff', label: 'Team', icon: UserCog, roles: ['admin'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  { path: '/coaching', label: 'Sales Coaching', icon: Lightbulb, roles: ['admin'] },
  { path: '/integrations', label: 'Integrations', icon: Plug, roles: ['admin'] },
  { path: '/billing', label: 'Billing', icon: CreditCard, roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  { path: '/help', label: 'Help & Support', icon: HelpCircle, roles: ['admin', 'staff'] },
];

export const SIDEBAR_GROUPS = [
 { label:'Sell', paths:['/dashboard','/leads','/appointments','/staff'] },
 { label:'Engage', paths:['/whatsapp','/brochures','/ai-agent'] },
 { label:'Grow', paths:['/ads','/gmb','/coaching','/reports'] },
 { label:'Setup', paths:['/automations','/integrations','/billing','/settings','/help'] },
];
