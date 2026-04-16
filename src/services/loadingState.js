// Global loading state tracker for Axios interceptors
// Uses a simple pub/sub pattern so React components can subscribe
// without needing a context provider.

let pendingRequests = 0;
const subscribers = new Set();

function notify() {
  const isLoading = pendingRequests > 0;
  subscribers.forEach((fn) => fn(isLoading));
}

export const loadingState = {
  start() {
    pendingRequests++;
    notify();
  },
  done() {
    pendingRequests = Math.max(0, pendingRequests - 1);
    notify();
  },
  /** Returns an unsubscribe function */
  subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
};
