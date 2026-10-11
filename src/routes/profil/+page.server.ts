import type { Actions, PageServerLoad } from './$types';
import {
	getUserById,
	getUserInvitations,
	updateUserPassword,
	updateUserProfile,
	createInvitation
} from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const user = getUserById(locals.user!.id);
	const invitations = getUserInvitations(locals.user!.id);

	return {
		user: user || locals.user!,
		invitations
	};
};

export const actions: Actions = {
	updatePassword: async ({ request, locals }) => {
		const formData = await request.formData();
		const currentPassword = (formData.get('currentPassword') as string) || '';
		const newPassword = (formData.get('newPassword') as string) || '';
		const confirmPassword = (formData.get('confirmPassword') as string) || '';

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { passwordError: 'Tous les champs sont requis.' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'Les nouveaux mots de passe ne correspondent pas.' });
		}

		if (newPassword.length < 4) {
			return fail(400, { passwordError: 'Le mot de passe doit comporter au moins 4 caractères.' });
		}

		const res = updateUserPassword(locals.user!.id, currentPassword, newPassword);
		if (!res.success) {
			return fail(400, { passwordError: res.error });
		}

		return { passwordSuccess: 'Mot de passe modifié avec succès !' };
	},

	updateProfile: async ({ request, locals }) => {
		const formData = await request.formData();
		const full_name = (formData.get('full_name') as string) || '';
		const email = (formData.get('email') as string) || '';
		const phone = (formData.get('phone') as string) || '';

		const res = updateUserProfile(locals.user!.id, { full_name, email, phone });
		if (!res.success) {
			return fail(400, { profileError: res.error });
		}

		return { profileSuccess: 'Informations mises à jour avec succès !' };
	},

	createInvite: async ({ locals }) => {
		const invite = createInvitation(locals.user!.id);
		return { inviteSuccess: true, newInviteCode: invite.code };
	}
};
