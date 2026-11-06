import { useEffect, useState } from 'react';
import { staffAPI } from '../services/api';

// id -> name for the workspace's users (agent names in call lists). Loaded once per page load; empty if it fails.
let cache = null;
export default function useStaffNames() {
  const [names, setNames] = useState(cache || {});
  useEffect(() => {
    if (cache) return undefined;
    let live = true;
    staffAPI.getAll().then(({ data }) => {
      cache = Object.fromEntries((data?.staff || []).map((u) => [u.id, u.name]));
      if (live) setNames(cache);
    }).catch(() => {});
    return () => { live = false; };
  }, []);
  return names;
}
