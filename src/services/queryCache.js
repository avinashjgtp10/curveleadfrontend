import { QueryClient, hashKey, isCancelledError } from '@tanstack/react-query';

export const CACHE_TIMES = Object.freeze({
  '/auth/me': 60_000, '/auth/preferences': 60_000,
  '/lead-stages': 300_000, '/leads/stages/all': 300_000,
  '/lead-statuses/by-stage': 300_000, '/staff': 60_000,
  '/gmb/settings': 60_000, '/leads': 15_000,
  '/leads/followups/today': 15_000, '/integrations/facebook/sync-status': 30_000,
});
export const isRequestCancelled = error => isCancelledError(error) || error?.name === 'AbortError' || error?.code === 'ERR_CANCELED';
const aborted = () => Object.assign(new Error('Request cancelled'), { name: 'AbortError' });

// API-compatible cache so every existing caller shares reads without a page-by-page rewrite.
export function createApiCache({ fetcher, getSession }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: typeof window === 'undefined' ? Infinity : 300_000 } } });
  const consumers = new Map();
  let session, epoch = 0;
  const clear = () => {
    epoch++;
    for (const entry of consumers.values()) clearTimeout(entry.timer);
    consumers.clear();
    client.clear();
  };
  const read = (url, params = {}, { signal, force = false } = {}) => {
    const current = getSession();
    if (session !== current) { clear(); session = current; }
    if (signal?.aborted) return Promise.reject(aborted());
    const normalizedParams = Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''));
    const queryKey = ['api', epoch, url, normalizedParams];
    const key = hashKey(queryKey);
    let entry = consumers.get(key);
    if (!entry) { entry = { count: 0 }; consumers.set(key, entry); }
    clearTimeout(entry.timer);
    entry.count++;
    const promise = client.fetchQuery({ queryKey, staleTime: force ? 0 : CACHE_TIMES[url] || 0,
      queryFn: ({ signal: requestSignal }) => fetcher(url, normalizedParams, requestSignal),
    });
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = (fn, value) => {
        if (done) return;
        done = true;
        signal?.removeEventListener('abort', onAbort);
        entry.count--;
        if (entry.count === 0) {
          // React StrictMode can unsubscribe/re-subscribe in the same turn. Preserve the shared request.
          entry.timer = setTimeout(() => {
            if (entry.count === 0 && consumers.get(key) === entry) {
              client.cancelQueries({ queryKey, exact: true });
              consumers.delete(key);
            }
          }, 0);
        }
        fn(value);
      };
      const onAbort = () => finish(reject, aborted());
      signal?.addEventListener('abort', onAbort, { once: true });
      promise.then(value => finish(resolve, value), error => finish(reject, error));
    });
  };
  const invalidate = async paths => {
    const predicate = query => paths.includes(query.queryKey[2]);
    await client.cancelQueries({ predicate });
    await client.invalidateQueries({ predicate, refetchType: 'none' });
  };
  return { read, clear, invalidate, client };
}

export function invalidatedPaths(url = '') {
  if (url === '/auth/preferences') return ['/auth/preferences'];
  if (/^\/auth\//.test(url)) return ['/auth/me'];
  if (/^\/(lead-stages|lead-statuses|settings)/.test(url)) return ['/auth/me','/lead-stages','/leads/stages/all','/lead-statuses/by-stage','/leads'];
  if (/^\/(staff|teams)/.test(url)) return ['/staff','/auth/me','/leads'];
  if (/^\/gmb\//.test(url)) return ['/gmb/settings'];
  if (/^\/(leads|followups|ai|automations|whatsapp|integrations|notes|attachments|recordings|quotations|campaigns)/.test(url)) return ['/leads','/leads/followups/today','/integrations/facebook/sync-status'];
  return [];
}
