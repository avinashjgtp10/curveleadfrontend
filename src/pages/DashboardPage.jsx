import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import PageLoader from '../components/ui/PageLoader';
import { Users, TrendingUp, IndianRupee, Target, ArrowUpRight } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsAPI.dashboard()
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader message="Loading dashboard..." />;

  const stats = [
    { label: 'Total Leads', value: data?.total_leads || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Hot Leads', value: data?.hot_leads || 0, icon: TrendingUp, color: 'bg-red-100 text-red-600' },
    { label: 'Won This Month', value: data?.won_this_month || 0, icon: Target, color: 'bg-green-100 text-green-600' },
    { label: 'Revenue', value: `₹${Number(data?.total_revenue || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={20} />
            </div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Leads</h3>
            <button onClick={() => navigate('/leads')} className="text-sm text-brand-600 flex items-center gap-1">View all <ArrowUpRight size={14} /></button>
          </div>
          {data?.recentLeads?.length > 0 ? (
            <div className="space-y-2">
              {data.recentLeads.map(l => (
                <button key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg text-left">
                  <div>
                    <p className="font-medium text-sm">{l.name}</p>
                    <p className="text-xs text-gray-500">{l.phone} • {l.source}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    l.lead_score === 'hot' ? 'bg-red-100 text-red-700' :
                    l.lead_score === 'warm' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>{l.lead_score?.toUpperCase()}</span>
                </button>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-6">No leads yet. Start capturing!</p>}
        </div>

        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-semibold mb-4">Today's Follow-ups</h3>
          {data?.todayFollowups?.length > 0 ? (
            <div className="space-y-2">
              {data.todayFollowups.map(f => (
                <div key={f.id} className="p-3 bg-amber-50 rounded-lg">
                  <p className="font-medium text-sm">{f.lead_name}</p>
                  <p className="text-xs text-gray-500">{new Date(f.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-6">No follow-ups today.</p>}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
