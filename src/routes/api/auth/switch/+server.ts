import { redirect, type RequestHandler } from '@sveltejs/kit';
import { createSession, getUserById, logAudit } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const formData = await request.formData();
	const userId = Number(formData.get('userId'));

	if (userId) {
		const targetUser = getUserById(userId);
		if (targetUser) {
			const token = createSession(targetUser.id);
			cookies.set('rembourse_session', token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30
			});
			logAudit(targetUser.id, 'LOGIN', 'user', targetUser.id, 'Bascule rapide de compte');
		}
	}

	throw redirect(303, '/');
};

