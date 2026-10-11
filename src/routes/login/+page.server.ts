import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAllUsers } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/');
	}

	const demoUsers = getAllUsers();

	return {
		demoUsers
	};
};
