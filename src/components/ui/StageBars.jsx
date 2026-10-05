// Horizontal bars with every stage labelled — replaces vertical bar charts whose axis
// dropped most stage names. rows: [{ name, count, note?, tone? }]; exits (lost /
// unqualified) are passed separately so they never read as a step in the pipeline.
const TONES = { brand: 'bg-brand-500', won: 'bg-emerald-500', exit: 'bg-red-400' };

const Row = ({ r, max }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="font-medium text-gray-800 truncate">{r.name}</span>
      <span className="shrink-0 text-gray-700 tabular-nums">
        <span className="font-semibold">{r.count.toLocaleString()}</span>
        {r.note && <span className="ml-2 text-xs text-gray-400">{r.note}</span>}
      </span>
    </div>
    <div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full rounded-full ${TONES[r.tone] || TONES.brand}`} style={{ width: `${max ? Math.max(2, (r.count / max) * 100) : 0}%` }} />
    </div>
  </div>
);

const StageBars = ({ rows = [], exits = [], exitsLabel = 'Left the pipeline' }) => {
  const max = Math.max(0, ...rows.map(r => r.count), ...exits.map(r => r.count));
  return (
    <div className="space-y-3">
      {rows.map(r => <Row key={r.name} r={r} max={max} />)}
      {exits.length > 0 && (
        <div className="pt-3 border-t space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{exitsLabel}</p>
          {exits.map(r => <Row key={r.name} r={{ ...r, tone: 'exit' }} max={max} />)}
        </div>
      )}
    </div>
  );
};

export default StageBars;
