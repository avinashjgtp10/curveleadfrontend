// Deterministic Follow-up Health — mirrors backend/utils/followupHealth.js thresholds.
// Pure date math, no AI involved.
const HOUR_MS = 60 * 60 * 1000;
const MISSED_AFTER_HOURS = 48;    // 2 days overdue
const CRITICAL_AFTER_HOURS = 120; // 5 days overdue

export function computeFollowupHealth(nextFollowupAt, isCompleted = false) {
  if (isCompleted || !nextFollowupAt) return 'good';
  const overdueHours = (Date.now() - new Date(nextFollowupAt).getTime()) / HOUR_MS;
  if (overdueHours <= 0) return 'good';
  if (overdueHours > CRITICAL_AFTER_HOURS) return 'critical';
  if (overdueHours > MISSED_AFTER_HOURS) return 'missed';
  return 'delayed';
}

export const FOLLOWUP_HEALTH_STYLES = {
  good:     { label: 'Good',     cls: 'bg-green-100 text-green-700' },
  delayed:  { label: 'Delayed',  cls: 'bg-amber-100 text-amber-700' },
  missed:   { label: 'Missed',   cls: 'bg-red-100 text-red-600' },
  critical: { label: 'Critical', cls: 'bg-red-600 text-white' },
};

export const FOLLOWUP_HEALTH_ACTIONS = {
  good: 'Continue planned follow-up',
  delayed: 'Follow up today',
  missed: 'Call and update status',
  critical: 'Manager follow-up needed',
};
