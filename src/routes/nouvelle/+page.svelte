<script lang="ts">
	import {
		Plus,
		Banknote,
		Utensils,
		ShoppingCart,
		Home,
		Car,
		Receipt,
		Gift,
		MoreHorizontal,
		User,
		Info,
		Check,
		ArrowRight
	} from 'lucide-svelte';

	let { data, form } = $props();

	let transactionType = $state<'debt' | 'payment'>('debt');
	let selectedFriendId = $state<number>(0);

	$effect(() => {
		if (data.initialType) transactionType = data.initialType as any;
		if (data.selectedFriendId) selectedFriendId = data.selectedFriendId;
		else if (data.friends?.length) selectedFriendId = data.friends[0].id;
	});

	// Debt form state
	let debtRole = $state<'i_paid' | 'friend_paid'>('i_paid');
	let debtAmount = $state('');
	let debtReason = $state('');
	let debtCategoryId = $state<number | null>(1); // Restaurant & Sorties by default

	// Payment form state
	let paymentRole = $state<'i_refunded' | 'friend_refunded'>('i_refunded');
	let paymentAmount = $state('');
	let paymentReason = $state('Remboursement');
	let paymentMethod = $state('Espèces');

	const quickReasons = ['Macdo', 'Courses', 'Resto', 'Café', 'Cadeau', 'Plein essence', 'Uber / Taxi'];

	function setQuickReason(r: string) {
		debtReason = r;
	}

	let selectedFriend = $derived(data.friends.find((f: any) => f.id === selectedFriendId));
</script>

<div style="max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
	<div>
		<h1 style="font-size: 2rem; color: var(--color-dark); margin-bottom: 0.35rem;">
			Nouvelle transaction
		</h1>
		<p style="color: var(--color-text-muted); font-size: 0.95rem;">
			Déclarez une dépense avancée ou un remboursement en quelques clics.
		</p>
	</div>

	<!-- Type Toggle: Dépense vs Remboursement -->
	<div style="display: flex; background: #e2e8f0; padding: 4px; border-radius: var(--radius-full);">
		<button
			type="button"
			onclick={() => (transactionType = 'debt')}
			class="btn"
			style="flex: 1; border-radius: var(--radius-full); box-shadow: none; font-size: 0.95rem; {transactionType === 'debt' ? 'background: #fdc619; color: #0e2331; font-weight: 800; box-shadow: var(--shadow-sm);' : 'background: transparent; color: #64748b;'}"
		>
			<Plus size={18} />
			<span>Dépense avancée</span>
		</button>
		<button
			type="button"
			onclick={() => (transactionType = 'payment')}
			class="btn"
			style="flex: 1; border-radius: var(--radius-full); box-shadow: none; font-size: 0.95rem; {transactionType === 'payment' ? 'background: #0e2331; color: #ffffff; font-weight: 800; box-shadow: var(--shadow-sm);' : 'background: transparent; color: #64748b;'}"
		>
			<Banknote size={18} />
			<span>Remboursement</span>
		</button>
	</div>

	{#if form?.error}
		<div style="background-color: var(--color-danger-light); border-left: 4px solid var(--color-danger); padding: 0.85rem; border-radius: var(--radius-sm); color: #991b1b; font-size: 0.9rem; font-weight: 700;">
			{form.error}
		</div>
	{/if}

	<!-- Friend Selection -->
	<div class="card" style="padding: 1.25rem;">
		<label class="form-label" style="margin-bottom: 0.75rem;" for="friend-select-input">
			Avec quel ami ?
		</label>

		{#if data.friends.length === 0}
			<p style="color: var(--color-text-muted); font-size: 0.9rem;">
				Vous n'avez pas encore d'amis inscrits. <a href="/invitations" style="color: #0e2331; font-weight: 800; text-decoration: underline;">Invitez un ami ici</a> !
			</p>
		{:else}
			<div style="display: flex; gap: 0.65rem; overflow-x: auto; padding-bottom: 0.5rem;" id="friend-select-input">
				{#each data.friends as friend}
					<button
						type="button"
						onclick={() => (selectedFriendId = friend.id)}
						class="btn"
						style="flex-shrink: 0; padding: 0.6rem 1rem; border-radius: var(--radius-lg); border: 2px solid {selectedFriendId === friend.id ? 'var(--color-primary)' : 'var(--color-border)'}; background: {selectedFriendId === friend.id ? 'var(--color-primary-light)' : '#ffffff'}; color: var(--color-dark); box-shadow: none;"
					>
						<div style="width: 30px; height: 30px; border-radius: 9999px; background: #0e2331; color: #fdc619; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-title); font-size: 0.9rem;">
							{friend.full_name[0]}
						</div>
						<span style="font-weight: 700; font-size: 0.9rem;">{friend.full_name}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if transactionType === 'debt'}
		<!-- DEBT FORM -->
		<form method="POST" action="?/createDebt" class="card" style="padding: 1.5rem;">
			<input type="hidden" name="friendId" value={selectedFriendId} />

			<!-- Who paid? -->
			<div class="form-group">
				<label class="form-label">Qui a payé ?</label>
				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
					<label
						style="border: 2px solid {debtRole === 'i_paid' ? 'var(--color-primary)' : 'var(--color-border)'}; background: {debtRole === 'i_paid' ? 'var(--color-primary-light)' : '#ffffff'}; border-radius: var(--radius-md); padding: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;"
					>
						<input
							type="radio"
							name="role"
							value="i_paid"
							bind:group={debtRole}
							style="display: none;"
						/>
						<span style="font-weight: 800; color: var(--color-dark); font-size: 0.9rem;">
							🙋‍♂️ J'ai payé
						</span>
					</label>

					<label
						style="border: 2px solid {debtRole === 'friend_paid' ? 'var(--color-primary)' : 'var(--color-border)'}; background: {debtRole === 'friend_paid' ? 'var(--color-primary-light)' : '#ffffff'}; border-radius: var(--radius-md); padding: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;"
					>
						<input
							type="radio"
							name="role"
							value="friend_paid"
							bind:group={debtRole}
							style="display: none;"
						/>
						<span style="font-weight: 800; color: var(--color-dark); font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
							👉 {selectedFriend?.full_name.split(' ')[0] || 'L\'ami'} a payé
						</span>
					</label>
				</div>
			</div>

			<!-- Amount -->
			<div class="form-group">
				<label class="form-label" for="debt-amount-input">Montant (€)</label>
				<div style="position: relative;">
					<input
						id="debt-amount-input"
						type="number"
						name="amount"
						step="0.01"
						min="0.01"
						bind:value={debtAmount}
						placeholder="0.00"
						class="form-control"
						style="font-family: var(--font-title); font-size: 1.8rem; height: 60px; padding-left: 1.25rem; padding-right: 3rem;"
						required
					/>
					<div style="position: absolute; right: 1.25rem; top: 50%; transform: translateY(-50%); font-family: var(--font-title); font-size: 1.8rem; color: #94a3b8;">
						€
					</div>
				</div>
			</div>

			<!-- Reason & Quick buttons -->
			<div class="form-group">
				<label class="form-label" for="debt-reason-input">Motif de la dépense</label>
				<input
					id="debt-reason-input"
					type="text"
					name="reason"
					bind:value={debtReason}
					placeholder="ex: Macdo, Plein essence, Courses..."
					class="form-control"
					required
				/>
				<div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem;">
					{#each quickReasons as qr}
						<button
							type="button"
							class="btn btn-outline btn-sm"
							style="padding: 0.2rem 0.6rem; font-size: 0.78rem;"
							onclick={() => setQuickReason(qr)}
						>
							{qr}
						</button>
					{/each}
				</div>
			</div>

			<!-- Category selection -->
			<div class="form-group">
				<label class="form-label">Catégorie</label>
				<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.5rem;">
					{#each data.categories as cat}
						<label
							style="border: 1.5px solid {debtCategoryId === cat.id ? 'var(--color-primary)' : 'var(--color-border)'}; background: {debtCategoryId === cat.id ? 'var(--color-primary-light)' : '#ffffff'}; border-radius: var(--radius-md); padding: 0.6rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 700;"
						>
							<input
								type="radio"
								name="categoryId"
								value={cat.id}
								bind:group={debtCategoryId}
								style="display: none;"
							/>
							<span>{cat.name}</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Clarification box -->
			<div style="background: #f8fafc; border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1.5rem; display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.85rem; color: #475569;">
				<Info size={18} color="#0e2331" style="flex-shrink: 0; margin-top: 2px;" />
				<div>
					{#if debtRole === 'i_paid'}
						Vous avancez de l'argent pour <strong>{selectedFriend?.full_name || 'votre ami'}</strong>. Une fois validée par lui, il vous devra cette somme.
					{:else}
						<strong>{selectedFriend?.full_name || 'Votre ami'}</strong> a avancé pour vous. Vous lui devrez cette somme après validation.
					{/if}
				</div>
			</div>

			<button
				type="submit"
				class="btn btn-primary"
				style="width: 100%; padding: 0.9rem; font-size: 1.05rem;"
			>
				<span>Envoyer pour validation</span>
				<ArrowRight size={18} />
			</button>
		</form>
	{:else}
		<!-- PAYMENT FORM -->
		<form method="POST" action="?/createPayment" class="card" style="padding: 1.5rem;">
			<input type="hidden" name="friendId" value={selectedFriendId} />

			<!-- Who reimbursed? -->
			<div class="form-group">
				<label class="form-label">Sens du remboursement</label>
				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
					<label
						style="border: 2px solid {paymentRole === 'i_refunded' ? 'var(--color-dark)' : 'var(--color-border)'}; background: {paymentRole === 'i_refunded' ? '#f1f5f9' : '#ffffff'}; border-radius: var(--radius-md); padding: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;"
					>
						<input
							type="radio"
							name="role"
							value="i_refunded"
							bind:group={paymentRole}
							style="display: none;"
						/>
						<span style="font-weight: 800; color: var(--color-dark); font-size: 0.9rem;">
							💸 J'ai remboursé
						</span>
					</label>

					<label
						style="border: 2px solid {paymentRole === 'friend_refunded' ? 'var(--color-dark)' : 'var(--color-border)'}; background: {paymentRole === 'friend_refunded' ? '#f1f5f9' : '#ffffff'}; border-radius: var(--radius-md); padding: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;"
					>
						<input
							type="radio"
							name="role"
							value="friend_refunded"
							bind:group={paymentRole}
							style="display: none;"
						/>
						<span style="font-weight: 800; color: var(--color-dark); font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
							💰 Il m'a remboursé
						</span>
					</label>
				</div>
			</div>

			<!-- Amount -->
			<div class="form-group">
				<label class="form-label" for="pay-amount-input">Montant remboursé (€)</label>
				<div style="position: relative;">
					<input
						id="pay-amount-input"
						type="number"
						name="amount"
						step="0.01"
						min="0.01"
						bind:value={paymentAmount}
						placeholder="0.00"
						class="form-control"
						style="font-family: var(--font-title); font-size: 1.8rem; height: 60px; padding-left: 1.25rem; padding-right: 3rem;"
						required
					/>
					<div style="position: absolute; right: 1.25rem; top: 50%; transform: translateY(-50%); font-family: var(--font-title); font-size: 1.8rem; color: #94a3b8;">
						€
					</div>
				</div>
			</div>

			<!-- Payment Method -->
			<div class="form-group">
				<label class="form-label" for="pay-method-select">Moyen de paiement</label>
				<select id="pay-method-select" name="paymentMethod" bind:value={paymentMethod} class="form-control">
					<option value="Espèces">Espèces</option>
					<option value="Virement bancaire">Virement bancaire</option>
					<option value="Lydia / Paylib / Wero">Lydia / Paylib / Wero</option>
					<option value="PayPal">PayPal</option>
					<option value="Autre">Autre</option>
				</select>
			</div>

			<!-- Reason / Note -->
			<div class="form-group">
				<label class="form-label" for="pay-reason-input">Motif / Commentaire</label>
				<input
					id="pay-reason-input"
					type="text"
					name="reason"
					bind:value={paymentReason}
					placeholder="ex: Remboursement du resto..."
					class="form-control"
				/>
			</div>

			<!-- Clarification box -->
			<div style="background: #f8fafc; border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1.5rem; display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.85rem; color: #475569;">
				<Info size={18} color="#0e2331" style="flex-shrink: 0; margin-top: 2px;" />
				<div>
					{#if paymentRole === 'i_refunded'}
						Vous déclarez avoir versé <strong>{paymentAmount || '0.00'} €</strong> à <strong>{selectedFriend?.full_name || 'votre ami'}</strong>. Il devra confirmer avoir bien reçu cet argent.
					{:else}
						Vous déclarez que <strong>{selectedFriend?.full_name || 'votre ami'}</strong> vous a versé <strong>{paymentAmount || '0.00'} €</strong>.
					{/if}
				</div>
			</div>

			<button
				type="submit"
				class="btn btn-dark"
				style="width: 100%; padding: 0.9rem; font-size: 1.05rem;"
			>
				<span>Enregistrer le remboursement</span>
				<ArrowRight size={18} />
			</button>
		</form>
	{/if}
</div>
