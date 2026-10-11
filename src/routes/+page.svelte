<script lang="ts">
	import {
		Plus,
		ArrowUpRight,
		ArrowDownLeft,
		CheckCircle,
		Clock,
		AlertTriangle,
		Share2,
		ChevronRight,
		Utensils,
		ShoppingCart,
		Home,
		Car,
		Receipt,
		Banknote,
		Gift,
		MoreHorizontal,
		Check,
		X,
		KeyRound
	} from 'lucide-svelte';

	let { data } = $props();

	function getCategoryIcon(iconName: string | undefined) {
		switch (iconName) {
			case 'utensils':
				return Utensils;
			case 'shopping-cart':
				return ShoppingCart;
			case 'home':
				return Home;
			case 'car':
				return Car;
			case 'receipt':
				return Receipt;
			case 'banknote':
				return Banknote;
			case 'gift':
				return Gift;
			default:
				return MoreHorizontal;
		}
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
	}
</script>

<div style="display: flex; flex-direction: column; gap: 1.5rem;">
	<!-- Hero Solde Card -->
	<div
		class="card"
		style="background: linear-gradient(135deg, #0e2331 0%, #17364b 100%); color: #ffffff; padding: 2rem; position: relative; overflow: hidden; border: none; box-shadow: var(--shadow-lg);"
	>
		<!-- Background decorative circles -->
		<div
			style="position: absolute; right: -20px; top: -20px; width: 140px; height: 140px; border-radius: 9999px; background: rgba(253, 198, 25, 0.15); pointer-events: none;"
		></div>

		<div style="position: relative; z-index: 10;">
			<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
				<div style="text-transform: uppercase; letter-spacing: 1px; font-size: 0.8rem; font-weight: 800; color: #fdc619;">
					Solde Global Net
				</div>
				<div style="font-size: 0.85rem; color: #94a3b8; font-weight: 600;">
					Bonjour, {data.user.full_name.split(' ')[0]} 👋
				</div>
			</div>

			<div style="display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.75rem;">
				<div
					style="font-family: var(--font-title); font-size: 3rem; line-height: 1; color: {data.balances.totalNet > 0 ? '#fdc619' : data.balances.totalNet < 0 ? '#f87171' : '#ffffff'};"
				>
					{data.balances.totalNet > 0 ? '+' : ''}{data.balances.totalNet.toFixed(2)} €
				</div>
			</div>

			<p style="font-size: 0.95rem; color: #cbd5e1; margin-bottom: 1.75rem;">
				{#if data.balances.totalNet > 0}
					🎉 Vos amis vous doivent un total de <strong>{data.balances.totalNet.toFixed(2)} €</strong>
				{:else if data.balances.totalNet < 0}
					⚠️ Vous devez au total <strong>{Math.abs(data.balances.totalNet).toFixed(2)} €</strong> à vos amis
				{:else}
					✨ Tous vos comptes sont parfaitement équilibrés !
				{/if}
			</p>

			<!-- Quick Actions -->
			<div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
				<a
					href="/nouvelle?type=debt"
					class="btn btn-primary"
					style="font-size: 0.95rem; padding: 0.75rem 1.25rem;"
				>
					<Plus size={18} />
					<span>J'ai payé pour un ami</span>
				</a>

				<a
					href="/nouvelle?type=payment"
					class="btn"
					style="background: rgba(255, 255, 255, 0.15); color: #ffffff; backdrop-filter: blur(8px); padding: 0.75rem 1.25rem;"
				>
					<Banknote size={18} />
					<span>Rembourser</span>
				</a>
			</div>
		</div>
	</div>

	<!-- Alert banner if pending validations -->
	{#if data.balances.pendingValidationsCount > 0}
		<a
			href="/validations"
			class="card"
			style="background: #fffbeb; border: 2px solid #fde68a; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; text-decoration: none; transition: transform 0.2s;"
		>
			<div style="display: flex; align-items: center; gap: 1rem;">
				<div
					style="width: 44px; height: 44px; border-radius: 9999px; background: #fdc619; display: flex; align-items: center; justify-content: center; color: #0e2331; font-weight: 800;"
				>
					⚡
				</div>
				<div>
					<div style="font-weight: 800; color: #92400e; font-size: 1.05rem;">
						{data.balances.pendingValidationsCount} transaction{data.balances.pendingValidationsCount > 1 ? 's' : ''} à valider !
					</div>
					<div style="font-size: 0.85rem; color: #b45309;">
						Un ami attend votre confirmation pour mettre à jour vos soldes.
					</div>
				</div>
			</div>
			<div class="btn btn-primary btn-sm" style="box-shadow: none;">
				<span>Vérifier</span>
				<ChevronRight size={16} />
			</div>
		</a>
	{/if}

	<!-- Friends Balances Overview -->
	<div>
		<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
			<h2 style="font-size: 1.35rem; color: var(--color-dark);">
				Comptes entre amis
			</h2>
			<a href="/amis" style="font-size: 0.85rem; font-weight: 800; color: #0e2331; display: flex; align-items: center; gap: 0.2rem;">
				<span>Tout voir</span>
				<ChevronRight size={14} />
			</a>
		</div>

		{#if data.balances.friendsBalances.length === 0}
			<div class="card" style="text-align: center; padding: 2.5rem 1rem;">
				<p style="color: var(--color-text-muted); margin-bottom: 1rem;">
					Vous n'avez pas encore d'amis inscrits sur Rembourse.
				</p>
				<button class="btn btn-primary" onclick={() => { /* opens invite modal */ window.location.href = '/invitations'; }}>
					<Share2 size={16} />
					<span>Inviter un premier ami</span>
				</button>
			</div>
		{:else}
			<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
				{#each data.balances.friendsBalances as fb}
					<div class="card" style="margin-bottom: 0; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
						<div style="display: flex; align-items: center; justify-content: space-between;">
							<div style="display: flex; align-items: center; gap: 0.75rem;">
								<div
									style="width: 44px; height: 44px; border-radius: 9999px; background: #0e2331; color: #fdc619; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-title); font-size: 1.2rem;"
								>
									{fb.friendName[0]}
								</div>
								<div>
									<div style="font-weight: 800; color: var(--color-dark); font-size: 1rem;">
										{fb.friendName}
									</div>
									<div style="font-size: 0.8rem; color: #64748b;">
										@{fb.friendUsername}
									</div>
								</div>
							</div>

							{#if fb.pendingToValidateCount > 0}
								<a href="/validations" class="badge badge-pending" title="Validation requise">
									{fb.pendingToValidateCount} à valider
								</a>
							{/if}
						</div>

						<div style="background-color: #f8fafc; border-radius: var(--radius-md); padding: 0.85rem; text-align: center;">
							<div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #64748b; margin-bottom: 0.2rem;">
								Situation bilatérale
							</div>
							<div
								style="font-family: var(--font-title); font-size: 1.5rem; color: {fb.netBalance > 0 ? '#059669' : fb.netBalance < 0 ? '#dc2626' : '#64748b'};"
							>
								{#if fb.netBalance > 0}
									Il vous doit {fb.netBalance.toFixed(2)} €
								{:else if fb.netBalance < 0}
									Vous lui devez {Math.abs(fb.netBalance).toFixed(2)} €
								{:else}
									À l'équilibre (0.00 €)
								{/if}
							</div>
							<div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.2rem;">
								Avances : {fb.totalLent.toFixed(2)} € | Remboursé : {fb.totalPaidToFriend.toFixed(2)} €
							</div>
						</div>

						<div style="display: flex; gap: 0.5rem;">
							<a
								href="/nouvelle?type=debt&friend={fb.friendId}"
								class="btn btn-outline btn-sm"
								style="flex: 1; padding: 0.45rem;"
							>
								<Plus size={14} />
								<span>Avance</span>
							</a>
							<a
								href="/nouvelle?type=payment&friend={fb.friendId}"
								class="btn btn-primary btn-sm"
								style="flex: 1; padding: 0.45rem;"
							>
								<Banknote size={14} />
								<span>Rembourser</span>
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Recent Transactions Timeline -->
	<div>
		<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
			<h2 style="font-size: 1.35rem; color: var(--color-dark);">
				Dernières transactions
			</h2>
			<a href="/historique" style="font-size: 0.85rem; font-weight: 800; color: #0e2331; display: flex; align-items: center; gap: 0.2rem;">
				<span>Historique complet</span>
				<ChevronRight size={14} />
			</a>
		</div>

		{#if data.timeline.length === 0}
			<div class="card" style="text-align: center; padding: 2rem;">
				<p style="color: var(--color-text-muted);">Aucune transaction enregistrée pour le moment.</p>
			</div>
		{:else}
			<div class="card" style="padding: 0.5rem; overflow: hidden;">
				{#each data.timeline as tx, i}
					{@const IconComp = tx.itemType === 'debt' ? getCategoryIcon((tx as any).category_icon) : Banknote}
					{@const isDebt = tx.itemType === 'debt'}
					{@const isCreditor = isDebt && (tx as any).creditor_id === data.user.id}
					{@const isPayer = !isDebt && (tx as any).payer_id === data.user.id}

					<div
						style="display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1rem; {i !== data.timeline.length - 1 ? 'border-bottom: 1px solid var(--color-border-subtle);' : ''}"
					>
						<div style="display: flex; align-items: center; gap: 0.85rem;">
							<div
								style="width: 42px; height: 42px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; background-color: {isDebt ? '#fff7ed' : '#ecfdf5'}; color: {isDebt ? '#ea580c' : '#059669'};"
							>
								<IconComp size={20} />
							</div>

							<div>
								<div style="font-weight: 800; color: var(--color-dark); font-size: 0.95rem;">
									{tx.reason}
								</div>
								<div style="font-size: 0.8rem; color: #64748b;">
									{#if isDebt}
										{isCreditor ? `Avancé pour ${(tx as any).debtor_name}` : `${(tx as any).creditor_name} a avancé pour vous`}
									{:else}
										{isPayer ? `Remboursé à ${(tx as any).receiver_name}` : `Reçu de ${(tx as any).payer_name}`}
									{/if}
									• {formatDate(tx.created_at)}
								</div>
							</div>
						</div>

						<div style="text-align: right;">
							<div
								style="font-weight: 800; font-size: 1.05rem; color: {isDebt ? (isCreditor ? '#059669' : '#dc2626') : (isPayer ? '#dc2626' : '#059669')};"
							>
								{isDebt ? (isCreditor ? '+' : '-') : (isPayer ? '-' : '+')}{tx.amount.toFixed(2)} €
							</div>

							<div style="margin-top: 0.2rem;">
								{#if tx.approval_status === 'approved'}
									<span class="badge badge-approved">Validé</span>
								{:else if tx.approval_status === 'pending_approval'}
									<span class="badge badge-pending">En attente</span>
								{:else if tx.approval_status === 'disputed'}
									<span class="badge badge-disputed">Contesté</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
