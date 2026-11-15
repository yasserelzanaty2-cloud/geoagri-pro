export type BrowserPushPermissionState = NotificationPermission | 'unsupported';

const PUSH_ENABLED_STORAGE_KEY = 'geoagri_openmeteo_push_enabled_v1';

export function isPushNotificationPreferenceEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(PUSH_ENABLED_STORAGE_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function setPushNotificationPreferenceEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PUSH_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage quota errors in restricted sandboxes
  }
}

export function getBrowserNotificationPermission(): BrowserPushPermissionState {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserPushPermissionState> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission || 'denied';
  }
}

export function dispatchBrowserPushNotification(
  title: string,
  body: string,
  tag: string
): boolean {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }
  try {
    new Notification(title, {
      body,
      tag,
    });
    return true;
  } catch {
    return false;
  }
}
