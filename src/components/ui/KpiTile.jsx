import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

// Design-system KPI: label, value, change vs the same span of the previous period (arrow and
// colour follow the sign), and the period it covers.
const KpiTile = ({ label, value, delta, period, hint, icon: Icon }) => {
  const n = Number(delta);
  const Arrow = n > 0 ? ArrowUpRight : n < 0 ? ArrowDownRight : Minus;
  const tone = n > 0 ? 'text-emerald-600' : n < 0 ? 'text-red-500' : 'text-gray-400';
  return (
    <div className="rounded-xl border bg-white p-4" title={hint || undefined}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {Icon && <Icon size={16} className="text-gray-400" />}
      </div>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta != null && Number.isFinite(n) && <span className={`inline-flex items-center gap-0.5 font-semibold ${tone}`}><Arrow size={13} />{Math.abs(n)}%</span>}
        {period && <span className="text-gray-400">{period}</span>}
      </div>
    </div>
  );
};

export default KpiTile;
