import { Link } from 'react-router-dom';
import { whatsappAPI } from '../../services/api';
import { Card, Empty, ErrorBox, Loading, useLoad } from './hubUi';

const QUALITY = { GREEN: 'bg-green-100 text-green-700', YELLOW: 'bg-amber-100 text-amber-700', RED: 'bg-red-100 text-red-700' };
const TIERS = {
  TIER_50: '50 customers / day', TIER_250: '250 customers / day', TIER_1K: '1,000 customers / day',
  TIER_10K: '10,000 customers / day', TIER_100K: '100,000 customers / day', TIER_UNLIMITED: 'Unlimited',
};

const Row = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b last:border-0 text-sm">
    <span className="text-gray-500">{label}</span><span className="text-gray-900 text-right">{children}</span>
  </div>
);

const NumbersTab = () => {
  const { data, error, loading, reload } = useLoad(() => whatsappAPI.hubNumbers());
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  const { shared, rep_numbers: reps } = data;
  const live = shared.live;

  return (
    <div className="space-y-4">
      <Card title="Shared business number" action={<button onClick={reload} className="text-xs text-brand-600 hover:underline">Refresh</button>}>
        {!shared.configured ? (
          <p className="text-sm text-amber-700">
            No WhatsApp number connected. Add it in <Link to="/integrations" className="underline font-medium">Integrations</Link>.
          </p>
        ) : (
          <>
            <Row label="Number">{live?.display_phone_number || shared.display_number || '—'}</Row>
            <Row label="Verified name">{live?.verified_name || shared.verified_name || '—'}</Row>
            <Row label="Phone number ID"><code className="text-xs">{shared.phone_number_id}</code></Row>
            <Row label="Business account ID">{shared.waba_id ? <code className="text-xs">{shared.waba_id}</code> : <span className="text-amber-600">Not set (needed for templates)</span>}</Row>
            {shared.live_error ? (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">Meta connection problem: {shared.live_error}</p>
            ) : live && (
              <>
                <Row label="Quality rating">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${QUALITY[live.quality_rating] || 'bg-gray-100 text-gray-600'}`}>{live.quality_rating || 'Unknown'}</span>
                </Row>
                <Row label="Daily messaging limit">{TIERS[live.messaging_limit_tier] || live.messaging_limit_tier || '—'}</Row>
                <Row label="Name status">{live.name_status || '—'}</Row>
              </>
            )}
          </>
        )}
      </Card>

      <Card title="Rep numbers">
        {reps.length === 0 ? <Empty>No team member has connected their own number.</Empty> : (
          reps.map(r => <Row key={r.id} label={r.name}><code className="text-xs">{r.whatsapp_phone_number_id}</code></Row>)
        )}
        <p className="text-[11px] text-gray-400 mt-3">Messages to a lead go from their assigned rep's number when one is connected, otherwise from the shared number.</p>
      </Card>
    </div>
  );
};

export default NumbersTab;
