import { json, type RequestHandler } from '@sveltejs/kit';
import { disputeTransaction } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	try {
		const { type, id, reason } = await request.json();
		if (!type || !id || !reason || (type !== 'debt' && type !== 'payment')) {
			return json({ error: 'Le motif de contestation est obligatoire.' }, { status: 400 });
		}

		const res = disputeTransaction(type, Number(id), locals.user.id, reason);
		if (!res.success) {
			return json({ error: res.error }, { status: 400 });
		}

		return json({ success: true });
	} catch (err: any) {
		return json({ error: err.message || 'Erreur interne' }, { status: 500 });
	}
};
