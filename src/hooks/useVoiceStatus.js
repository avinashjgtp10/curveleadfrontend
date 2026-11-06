import { useEffect, useState } from 'react';
import { voiceAPI } from '../services/api';

// One shared /voice/status lookup (30 s cache) so the call button and the "last call" line don't each ask the server.
let cached = null; // { at, promise }
const loadStatus = () => {
  if (!cached || Date.now() - cached.at > 30_000) {
    cached = { at: Date.now(), promise: voiceAPI.status().then(({ data }) => !!data.enabled).catch(() => false) };
  }
  return cached.promise;
};
export const resetVoiceStatus = () => { cached = null; };

// null while loading, then true/false.
export default function useVoiceStatus() {
  const [enabled, setEnabled] = useState(null);
  useEffect(() => {
    let live = true;
    loadStatus().then((e) => { if (live) setEnabled(e); });
    return () => { live = false; };
  }, []);
  return enabled;
}
