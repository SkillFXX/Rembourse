import { json, type RequestHandler } from '@sveltejs/kit';
import { getUserByUsernameOrEmail, verifyPassword, createSession, logAudit } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { identifier, password } = await request.json();
		if (!identifier || !password) {
			return json({ error: 'Identifiant et mot de passe requis.' }, { status: 400 });
		}

		const user = getUserByUsernameOrEmail(identifier);
		if (!user) {
			return json({ error: 'Utilisateur introuvable.' }, { status: 401 });
		}

		const valid = verifyPassword(password, user.password);
		if (!valid) {
			return json({ error: 'Mot de passe incorrect.' }, { status: 401 });
		}

		const token = createSession(user.id);
		cookies.set('rembourse_session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		logAudit(user.id, 'LOGIN', 'user', user.id, 'Connexion réussie');

		return json({ success: true, redirect: '/' });
	} catch (err: any) {
		return json({ error: err.message || 'Erreur lors de la connexion' }, { status: 500 });
	}
};

