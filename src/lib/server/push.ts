import webpush from 'web-push';
import { getAppSetting, setAppSetting, getUserPushSubscriptions, removePushSubscription } from './db';

let vapidConfigured = false;

function ensureVapidConfig() {
  if (vapidConfigured) return;

  let publicKey = process.env.VAPID_PUBLIC_KEY || getAppSetting('vapid_public_key');
  let privateKey = process.env.VAPID_PRIVATE_KEY || getAppSetting('vapid_private_key');
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@rembourse.local';

  if (!publicKey || !privateKey) {
    console.log('[Push] Génération de nouvelles clés VAPID pour l\'application...');
    const vapidKeys = webpush.generateVAPIDKeys();
    publicKey = vapidKeys.publicKey;
    privateKey = vapidKeys.privateKey;
    setAppSetting('vapid_public_key', publicKey);
    setAppSetting('vapid_private_key', privateKey);
    console.log('[Push] Clés VAPID enregistrées avec succès.');
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export function getVapidPublicKey(): string {
  ensureVapidConfig();
  return process.env.VAPID_PUBLIC_KEY || getAppSetting('vapid_public_key') || '';
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  try {
    ensureVapidConfig();
    const subs = getUserPushSubscriptions(userId);
    if (!subs || subs.length === 0) return;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/validations',
      tag: payload.tag || 'rembourse-notification',
      icon: payload.icon || '/icon.png'
    });

    for (const sub of subs) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSub, notificationPayload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Push] Abonnement expiré pour l'endpoint (${err.statusCode}), suppression...`);
          removePushSubscription(sub.endpoint);
        } else {
          console.error('[Push] Erreur d\'envoi notification push:', err.message || err);
        }
      }
    }
  } catch (err) {
    console.error('[Push] Erreur générale sendPushToUser:', err);
  }
}

// Auto-register push notifier into db layer
import { registerPushNotifier } from './db';
registerPushNotifier((userId, payload) => {
  sendPushToUser(userId, payload);
});

