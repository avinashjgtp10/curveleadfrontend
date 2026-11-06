import { useEffect, useState } from 'react';
import { voiceAPI } from '../../services/api';
import { lastCallLine } from '../../utils/voiceCall';
import useVoiceStatus from '../../hooks/useVoiceStatus';

// "Last call: 2h ago, No answer" under the lead name. Renders nothing when calling is off or the lead was never called.
export default function LastCallLine({ leadId, refreshKey }) {
  const enabled = useVoiceStatus();
  const [line, setLine] = useState(null);
  useEffect(() => {
    if (!enabled || !leadId) { setLine(null); return undefined; }
    let live = true;
    voiceAPI.listCalls({ leadId, limit: 10 }).then(({ data }) => { if (live) setLine(lastCallLine(data)); }).catch(() => { if (live) setLine(null); });
    return () => { live = false; };
  }, [enabled, leadId, refreshKey]);
  return line ? <p className="text-xs text-gray-500">{line}</p> : null;
}
