import { json } from '@sveltejs/kit';
import { savePushSubscription } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { endpoint, keys } = data;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return json({ error: 'Données de souscription invalides' }, { status: 400 });
    }

    savePushSubscription(locals.user.id, endpoint, keys.p256dh, keys.auth);
    return json({ success: true });
  } catch (err: any) {
    return json({ error: err.message || 'Erreur interne' }, { status: 500 });
  }
};
