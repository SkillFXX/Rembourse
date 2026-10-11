import type { Actions, PageServerLoad } from './$types';
import { getUserInvitations, createInvitation } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const invitations = getUserInvitations(userId);

	return {
		user: locals.user!,
		invitations
	};
};

export const actions: Actions = {
	create: async ({ locals }) => {
		const userId = locals.user!.id;
		const invite = createInvitation(userId);
		return { success: true, invite };
	}
};

