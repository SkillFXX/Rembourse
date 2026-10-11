import type { Handle } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('rembourse_session');

	if (sessionToken) {
		const user = getSessionUser(sessionToken);
		event.locals.user = user;
	} else {
		event.locals.user = null;
	}

	const url = event.url.pathname;
	const isPublic =
		url === '/login' ||
		url === '/register' ||
		url.startsWith('/api/auth') ||
		url.startsWith('/api/health') ||
		url === '/manifest.json' ||
		url.endsWith('.png') ||
		url.endsWith('.svg') ||
		url.endsWith('.ico');

	if (!event.locals.user && !isPublic) {
		// Store target in query param for return after login
		return new Response(null, {
			status: 303,
			headers: { location: `/login?redirect=${encodeURIComponent(event.url.pathname + event.url.search)}` }
		});
	}

	return resolve(event);
};
