import { json, type RequestHandler } from '@sveltejs/kit';
import { registerWithInvitation, createSession } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { username, email, password, full_name, inviteCode } = await request.json();

		if (!username || !email || !password || !full_name || !inviteCode) {
			return json({ error: 'Tous les champs et le code d\'invitation sont requis.' }, { status: 400 });
		}

		const res = registerWithInvitation({
			username,
			email,
			password,
			full_name,
			inviteCode
		});

		if (!res.success || !res.user) {
			return json({ error: res.error || 'Erreur lors de l\'inscription.' }, { status: 400 });
		}

		// Log in directly
		const token = createSession(res.user.id);
		cookies.set('rembourse_session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		return json({ success: true, redirect: '/' });
	} catch (err: any) {
		return json({ error: err.message || 'Erreur interne' }, { status: 500 });
	}
};

