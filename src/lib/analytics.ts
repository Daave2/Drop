import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { app, isFirebaseConfigured } from './firebase';

let analytics: Analytics | undefined;

export function trackEvent(event: string, params?: Record<string, any>) {
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
