import { Video, Phone, MessageCircle, Users2 } from 'lucide-react';

export const AVATAR_COLORS = ['bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-red-100 text-red-700', 'bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700', 'bg-cyan-100 text-cyan-700'];

export const TYPE_META = {
  call:     { label: 'Follow-up',    Icon: Phone,         color: 'text-amber-500' },
  whatsapp: { label: 'WhatsApp',     Icon: MessageCircle, color: 'text-green-500' },
  visit:    { label: 'Consultation', Icon: Users2,        color: 'text-emerald-500' },
  demo:     { label: 'Product Demo', Icon: Video,         color: 'text-violet-500' },
};

export const STATUS_META = {
  upcoming: { label: 'Upcoming',  cls: 'bg-green-50 text-green-700' },
  overdue:  { label: 'Overdue',   cls: 'bg-red-50 text-red-600' },
  completed:{ label: 'Completed', cls: 'bg-blue-50 text-blue-600' },
};

export const APPOINTMENT_TABS = [
  { id: 'all', label: 'All Appointments' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today', label: 'Today' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
];

export const APPOINTMENTS_PAGE_LIMIT = 5;

export const EMPTY_APPT_FILTERS = { type: '', assigned_to: '', date_from: '', date_to: '' };

export const EMPTY_NEW_APPOINTMENT_FORM = { lead_id: '', lead_name: '', next_followup_at: '', followup_type: 'call', reminder_minutes: '15', notes: '' };
