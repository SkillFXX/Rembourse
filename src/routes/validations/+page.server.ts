import type { PageServerLoad } from './$types';
import { getPendingValidationsForUser } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const validations = getPendingValidationsForUser(userId);

	return {
		user: locals.user!,
		validations
	};
};

