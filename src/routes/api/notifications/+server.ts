import { json, type RequestHandler } from '@sveltejs/kit';
import { getNotificationsForUser, markNotificationsRead, getUserBalances } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	const notifications = getNotificationsForUser(locals.user.id);
	const balances = getUserBalances(locals.user.id);

	return json({
		notifications,
		pendingValidationsCount: balances.pendingValidationsCount
	});
};

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	markNotificationsRead(locals.user.id);
	return json({ success: true });
};
