const StatCard = ({ label, value, icon: Icon, cls = 'bg-blue-50 text-blue-600', trend }) => (
  <div className="bg-white rounded-2xl p-5 border">
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cls}`}>
        <Icon size={18} />
      </div>
      {trend && <span className="text-xs font-semibold text-emerald-600">↑ {trend}</span>}
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

export default StatCard;
