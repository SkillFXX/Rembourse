import type { LayoutServerLoad } from './$types';
import { getUserBalances } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {
			user: null,
			pendingCount: 0
		};
	}

	const balances = getUserBalances(locals.user.id);

	return {
		user: locals.user,
		pendingCount: balances.pendingValidationsCount
	};
};
