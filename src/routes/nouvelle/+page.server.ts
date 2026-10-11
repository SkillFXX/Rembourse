import type { Actions, PageServerLoad } from './$types';
import { getAllUsers, getCategories, createDebt, createPayment } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const currentUserId = locals.user!.id;
	const friends = getAllUsers().filter((u) => u.id !== currentUserId);
	const categories = getCategories();

	const initialType = url.searchParams.get('type') || 'debt';
	const friendParam = url.searchParams.get('friend');
	const selectedFriendId = friendParam ? Number(friendParam) : (friends[0]?.id || null);

	return {
		user: locals.user!,
		friends,
		categories,
		initialType,
		selectedFriendId
	};
};

export const actions: Actions = {
	createDebt: async ({ request, locals }) => {
		const formData = await request.formData();
		const currentUserId = locals.user!.id;

		const role = formData.get('role') as string; // 'i_paid' (I advanced for friend) or 'friend_paid' (Friend advanced for me)
		const friendId = Number(formData.get('friendId'));
		const amount = parseFloat(formData.get('amount') as string);
		const reason = formData.get('reason') as string;
		const categoryId = formData.get('categoryId') ? Number(formData.get('categoryId')) : null;
		const notes = (formData.get('notes') as string) || '';

		if (!friendId || isNaN(amount) || amount <= 0 || !reason?.trim()) {
			return fail(400, { error: 'Veuillez remplir le montant et le motif.' });
		}

		const creditorId = role === 'friend_paid' ? friendId : currentUserId;
		const debtorId = role === 'friend_paid' ? currentUserId : friendId;

		const res = createDebt({
			creatorId: currentUserId,
			creditorId,
			debtorId,
			amount,
			reason: reason.trim(),
			categoryId,
			notes: notes.trim() || null
		});

		if (!res.success) {
			return fail(400, { error: res.error });
		}

		throw redirect(303, '/validations');
	},

	createPayment: async ({ request, locals }) => {
		const formData = await request.formData();
		const currentUserId = locals.user!.id;

		const role = formData.get('role') as string; // 'i_refunded' (I paid friend) or 'friend_refunded' (Friend paid me)
		const friendId = Number(formData.get('friendId'));
		const amount = parseFloat(formData.get('amount') as string);
		const reason = (formData.get('reason') as string) || 'Remboursement';
		const paymentMethod = (formData.get('paymentMethod') as string) || 'Espèces';

		if (!friendId || isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Veuillez indiquer un montant valide.' });
		}

		const payerId = role === 'friend_refunded' ? friendId : currentUserId;
		const receiverId = role === 'friend_refunded' ? currentUserId : friendId;

		const res = createPayment({
			creatorId: currentUserId,
			payerId,
			receiverId,
			amount,
			reason: reason.trim(),
			paymentMethod
		});

		if (!res.success) {
			return fail(400, { error: res.error });
		}

		throw redirect(303, '/validations');
	}
};
