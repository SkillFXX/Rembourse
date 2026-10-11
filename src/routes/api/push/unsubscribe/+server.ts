import { json } from '@sveltejs/kit';
import { removePushSubscription } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const data = await request.json();
    if (data.endpoint) {
      removePushSubscription(data.endpoint);
    }
    return json({ success: true });
  } catch (err: any) {
    return json({ error: err.message || 'Erreur interne' }, { status: 500 });
  }
};

