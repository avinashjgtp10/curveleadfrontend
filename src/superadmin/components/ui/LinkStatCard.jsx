import { ArrowRight } from 'lucide-react';

// Pastel icon tile with a big number and label. Renders as a button when `onClick` is given.
const LinkStatCard = ({ label, value, icon: Icon, tint = 'bg-indigo-50 text-indigo-500', onClick }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className="text-left bg-white rounded-2xl border border-indigo-50 shadow-[0_2px_12px_rgba(99,102,241,0.05)] p-5 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tint}`}><Icon size={21} /></div>
      <p className="text-[28px] font-bold text-[#141a3d] mt-4 leading-none">{value}</p>
      <div className="flex items-center justify-between mt-2 gap-2">
        <span className="text-xs text-slate-500">{label}</span>
        {onClick && <ArrowRight size={14} className="text-indigo-300 shrink-0" />}
      </div>
    </Tag>
  );
};

export default LinkStatCard;
