import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { app, isFirebaseConfigured } from './firebase';

let analytics: Analytics | undefined;

type ARLaunchFailedReason =
  | 'xr_unsupported'
  | 'xr_check_failed'
  | 'orientation_denied'
  | 'media_devices_unsupported'
  | 'camera_denied';

type ARPermissionType = 'orientation' | 'camera';

export function trackEvent(
  event: 'ar_launch_failed',
  params: { reason: ARLaunchFailedReason },
): void;
export function trackEvent(
  event: 'ar_permission_denied',
  params: { type: ARPermissionType },
): void;
export function trackEvent(event: 'ar_permission_granted'): void;
export function trackEvent(event: string, params?: Record<string, unknown>): void;
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
