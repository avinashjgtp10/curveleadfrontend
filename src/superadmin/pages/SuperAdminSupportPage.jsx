import { LifeBuoy } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

const SuperAdminSupportPage = () => (
  <div className="max-w-7xl mx-auto space-y-4">
    <PageHeader title="Support" subtitle="Platform support tickets and escalations." />
    <div className="bg-white rounded-2xl border p-10">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
        <LifeBuoy size={26} />
      </div>
      <EmptyState message="No open support tickets." />
    </div>
  </div>
);

export default SuperAdminSupportPage;
