import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { app, isFirebaseConfigured } from './firebase';

// Cached analytics instance so we only initialize Firebase Analytics once.
let analytics: Analytics | undefined;

/**
 * Log a Firebase Analytics event if analytics is available. The analytics
 * instance is lazily initialized and errors are swallowed to avoid breaking
 * the user experience in development or unsupported environments.
 */
export function trackEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !isFirebaseConfigured) return;
  if (!analytics) {
    try {
      analytics = getAnalytics(app);
    } catch {
      return;
    }
  }
  try {
    logEvent(analytics, event, params);
  } catch {
    // ignore analytics errors
  }
}
