import type { LayoutServerLoad } from './$types';
import { getUserBalances, getAllUsers } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {
			user: null,
			pendingCount: 0,
			allUsers: []
		};
	}

	const balances = getUserBalances(locals.user.id);
	const allUsers = getAllUsers();

	return {
		user: locals.user,
		pendingCount: balances.pendingValidationsCount,
		allUsers
	};
};
