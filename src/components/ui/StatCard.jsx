const StatCard = ({ label, value, icon: Icon, color = 'bg-blue-100 text-blue-600', sub }) => (
  <div className="bg-white rounded-2xl p-4 border">
    <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-2`}>
      <Icon size={18} />
    </div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-xl font-bold mt-0.5">{value}</p>
    {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

export default StatCard;
