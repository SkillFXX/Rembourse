import type { PageServerLoad } from './$types';
import { getInvitation } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (locals.user) {
		throw redirect(303, '/');
	}

	const code = url.searchParams.get('invite') || '';
	if (!code) {
		return {
			isValid: false,
			reason: 'missing',
			inviteCode: '',
			inviterName: ''
		};
	}

	const invite = getInvitation(code);
	if (!invite) {
		return {
			isValid: false,
			reason: 'invalid',
			inviteCode: code,
			inviterName: ''
		};
	}

	if (invite.is_used) {
		return {
			isValid: false,
			reason: 'used',
			inviteCode: code,
			inviterName: invite.creator_name || 'Un ami'
		};
	}

	return {
		isValid: true,
		reason: 'ok',
		inviteCode: invite.code,
		inviterName: invite.creator_name || 'Un ami'
	};
};

