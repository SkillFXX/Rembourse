import type { PageServerLoad } from './$types';
import {
	getUserBalances,
	getDebtsForUser,
	getPaymentsForUser,
	getCategories,
	getAllUsers
} from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const balances = getUserBalances(userId);
	const recentDebts = getDebtsForUser(userId, 8);
	const recentPayments = getPaymentsForUser(userId, 8);
	const categories = getCategories();
	const allUsers = getAllUsers();

	// Merge debts and payments into unified recent timeline
	const timeline = [
		...recentDebts.map((d) => ({ ...d, itemType: 'debt' as const })),
		...recentPayments.map((p) => ({ ...p, itemType: 'payment' as const }))
	].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

	return {
		user: locals.user!,
		balances,
		timeline,
		categories,
		allUsers
	};
};
