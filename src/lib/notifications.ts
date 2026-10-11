// Client-side PWA and Web Push helper

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}

export async function getPushSubscriptionState(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}> {
  if (!isPushSupported()) {
    return {
      supported: false,
      permission: 'denied',
      subscribed: false
    };
  }

  const permission = Notification.permission;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return {
      supported: true,
      permission,
      subscribed: !!sub
    };
  } catch {
    return {
      supported: true,
      permission,
      subscribed: false
    };
  }
}

export async function subscribeToPushNotifications(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Les notifications Push ne sont pas supportées par ce navigateur.' };
  }

  try {
    // 1. Request Notification permission
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      return { success: false, error: 'Permission de notification refusée par l\'utilisateur.' };
    }

    // 2. Fetch VAPID public key
    const res = await fetch('/api/push/vapid-key');
    if (!res.ok) {
      return { success: false, error: 'Impossible de récupérer la clé VAPID du serveur.' };
    }
    const { publicKey } = await res.json();
    if (!publicKey) {
      return { success: false, error: 'Clé VAPID manquante.' };
    }

    // 3. Register or get Service Worker
    const reg = await navigator.serviceWorker.ready;

    // 4. Subscribe with PushManager
    const convertedKey = urlBase64ToUint8Array(publicKey);
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });

    // 5. Send subscription to server
    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON())
    });

    if (!saveRes.ok) {
      return { success: false, error: 'Échec de l\'enregistrement sur le serveur.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Push subscription failed:', err);
    return { success: false, error: err.message || 'Erreur lors de l\'activation des notifications.' };
  }
}

export async function unsubscribeFromPushNotifications(): Promise<{ success: boolean }> {
  if (!isPushSupported()) return { success: true };

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint })
      });
      await sub.unsubscribe();
    }
    return { success: true };
  } catch (err) {
    console.error('Unsubscribe failed:', err);
    return { success: false };
  }
}
