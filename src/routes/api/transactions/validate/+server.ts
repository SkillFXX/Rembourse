import { json, type RequestHandler } from '@sveltejs/kit';
import { validateTransaction } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	try {
		const { type, id } = await request.json();
		if (!type || !id || (type !== 'debt' && type !== 'payment')) {
			return json({ error: 'Données invalides' }, { status: 400 });
		}

		const res = validateTransaction(type, Number(id), locals.user.id);
		if (!res.success) {
			return json({ error: res.error }, { status: 400 });
		}

		return json({ success: true });
	} catch (err: any) {
		return json({ error: err.message || 'Erreur interne' }, { status: 500 });
	}
};

