import type { PageServerLoad } from './$types';
import { getUserBalances } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const balances = getUserBalances(userId);

	return {
		user: locals.user!,
		friendsBalances: balances.friendsBalances
	};
};

