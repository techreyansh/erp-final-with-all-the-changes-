/**
 * CEO Executive Dashboard access attempt logging.
 * Used by CEOOnlyRoute for every access attempt (granted or denied).
 * When backend is available, replace the implementation to send to your audit/API endpoint.
 */

const logAccessAttempt = (payload) => {
  const entry = {
    resource: 'ceo-executive-dashboard',
    path: '/ceo-command',
    granted: payload.granted,
    userId: payload.userId ?? null,
    userRole: payload.userRole ?? null,
    timestamp: new Date().toISOString(),
  };
  if (typeof window !== 'undefined' && window.__CEO_DASHBOARD_ACCESS_LOG__) {
    window.__CEO_DASHBOARD_ACCESS_LOG__(entry);
  }
  if (process.env.NODE_ENV === 'development') {
    console.info('[CEO Dashboard Access]', entry);
  }
};

export default { logAccessAttempt };
