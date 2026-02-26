// =============================================================================
// PRIVOD NEXT -- Push Notifications
// Web Push API wrapper for subscribing/unsubscribing to push notifications.
// =============================================================================

import { apiClient } from '@/api/client';

// ---------------------------------------------------------------------------
// VAPID public key — should be set in environment
// ---------------------------------------------------------------------------

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a URL-safe base64 VAPID key to a Uint8Array for `PushManager.subscribe()`.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check whether the Push API and service workers are available.
 */
function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Request notification permission from the user.
 *
 * @returns The permission result: 'granted', 'denied', or 'default'.
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  // If already granted or denied, return immediately
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Subscribe the current user to push notifications.
 * Sends the PushSubscription to the backend.
 *
 * @param userId - The ID of the authenticated user
 * @returns true if subscription was successful, false otherwise
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('[Push] Push notifications are not supported in this browser.');
    return false;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push] VAPID public key is not configured. Set VITE_VAPID_PUBLIC_KEY.');
    return false;
  }

  try {
    const permission = await requestPushPermission();
    if (permission !== 'granted') {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      // Already subscribed — ensure backend knows
      await apiClient.post('/push/subscribe', {
        userId,
        subscription: existingSubscription.toJSON(),
      });
      return true;
    }

    // Create new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Send subscription to backend
    await apiClient.post('/push/subscribe', {
      userId,
      subscription: subscription.toJSON(),
    });

    return true;
  } catch (error) {
    console.error('[Push] Failed to subscribe:', error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications and notify the backend.
 *
 * @returns true if unsubscription was successful, false otherwise
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return true; // Already unsubscribed
    }

    // Notify backend before unsubscribing
    try {
      await apiClient.post('/push/unsubscribe', {
        endpoint: subscription.endpoint,
      });
    } catch {
      // Backend notification failed, still unsubscribe locally
    }

    const success = await subscription.unsubscribe();
    return success;
  } catch (error) {
    console.error('[Push] Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Check if the user is currently subscribed to push notifications.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * Get the current notification permission status.
 */
export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
