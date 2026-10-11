import { json, type RequestHandler } from '@sveltejs/kit';
import { createInvitation } from '$lib/server/db';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	const invitation = createInvitation(locals.user.id);
	return json({
		success: true,
		invitation,
		inviteUrl: `/register?invite=${invitation.code}`
	});
};
