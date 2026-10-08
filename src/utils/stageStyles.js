const STATUS_STYLE = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-teal-100 text-teal-700',
  qualified: 'bg-purple-100 text-purple-700',
  demo: 'bg-orange-100 text-orange-700',
  proposal: 'bg-amber-100 text-amber-700',
  negotiation: 'bg-pink-100 text-pink-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-gray-200 text-gray-600',
  follow: 'bg-indigo-100 text-indigo-700',
  unqualified: 'bg-red-100 text-red-600',
};

export const stageBadgeClass = (stage) => {
  const stageKey = String(stage || '').toLowerCase();
  const found = Object.keys(STATUS_STYLE).find(k => stageKey.startsWith(k));
  return found ? STATUS_STYLE[found] : 'bg-gray-100 text-gray-600';
};

