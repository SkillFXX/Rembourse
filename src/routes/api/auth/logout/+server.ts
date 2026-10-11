import { redirect, type RequestHandler } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/db';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('rembourse_session');
	if (token) {
		deleteSession(token);
		cookies.delete('rembourse_session', { path: '/' });
	}
	throw redirect(303, '/login');
};
