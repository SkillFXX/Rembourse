import type { PageServerLoad } from './$types';
import { getDebtsForUser, getPaymentsForUser, getCategories, getAllUsers } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const debts = getDebtsForUser(userId, 200);
	const payments = getPaymentsForUser(userId, 200);
	const categories = getCategories();
	const friends = getAllUsers().filter((u) => u.id !== userId);

	const items = [
		...debts.map((d) => ({ ...d, txType: 'debt' as const })),
		...payments.map((p) => ({ ...p, txType: 'payment' as const }))
	].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

	return {
		user: locals.user!,
		items,
		categories,
		friends
	};
};
