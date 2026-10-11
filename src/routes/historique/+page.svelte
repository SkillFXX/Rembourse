<script lang="ts">
	import {
		Search,
		Filter,
		Banknote,
		Utensils,
		ShoppingCart,
		Home,
		Car,
		Receipt,
		Gift,
		MoreHorizontal,
		AlertCircle,
		CheckCircle2,
		Clock,
		XCircle,
		X
	} from 'lucide-svelte';

	let { data } = $props();

	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'approved' | 'pending_approval' | 'disputed'>('all');
	let typeFilter = $state<'all' | 'debt' | 'payment'>('all');

	let selectedTx = $state<any | null>(null);

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

	function formatDate(d: string) {
		if (!d) return '';
		return new Date(d).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	let filteredItems = $derived(
		data.items.filter((item: any) => {
			if (statusFilter !== 'all' && item.approval_status !== statusFilter) return false;
			if (typeFilter !== 'all' && item.txType !== typeFilter) return false;
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				const matchReason = item.reason?.toLowerCase().includes(q);
				const matchCreator = item.creator_name?.toLowerCase().includes(q);
				const matchCreditor = item.creditor_name?.toLowerCase().includes(q);
				const matchDebtor = item.debtor_name?.toLowerCase().includes(q);
				const matchPayer = item.payer_name?.toLowerCase().includes(q);
				const matchReceiver = item.receiver_name?.toLowerCase().includes(q);
				return matchReason || matchCreator || matchCreditor || matchDebtor || matchPayer || matchReceiver;
			}
			return true;
		})
	);
</script>

<div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
	<div>
		<h1 style="font-size: 2rem; color: var(--color-dark); margin-bottom: 0.35rem;">
			Historique des transactions
		</h1>
		<p style="color: var(--color-text-muted); font-size: 0.95rem;">
			Consultez toutes les dépenses partagées, les remboursements et les contestations.
		</p>
	</div>

	<!-- Search & Filters -->
	<div class="card" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
		<div style="position: relative;">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Rechercher par motif, ami..."
				class="form-control"
				style="padding-left: 2.5rem;"
			/>
			<div style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted);">
				<Search size={18} />
			</div>
		</div>

		<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: space-between;">
			<!-- Status Filter -->
			<div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
				<button
					onclick={() => (statusFilter = 'all')}
					class="btn btn-sm"
					style="box-shadow: none; {statusFilter === 'all' ? 'background: var(--color-dark); color: #ffffff;' : 'background: #f1f5f9; color: #475569;'}"
				>
					Tous ({data.items.length})
				</button>
				<button
					onclick={() => (statusFilter = 'approved')}
					class="btn btn-sm"
					style="box-shadow: none; {statusFilter === 'approved' ? 'background: #059669; color: #ffffff;' : 'background: #f1f5f9; color: #475569;'}"
				>
					Validés
				</button>
				<button
					onclick={() => (statusFilter = 'pending_approval')}
					class="btn btn-sm"
					style="box-shadow: none; {statusFilter === 'pending_approval' ? 'background: #d97706; color: #ffffff;' : 'background: #f1f5f9; color: #475569;'}"
				>
					En attente
				</button>
				<button
					onclick={() => (statusFilter = 'disputed')}
					class="btn btn-sm"
					style="box-shadow: none; {statusFilter === 'disputed' ? 'background: #dc2626; color: #ffffff;' : 'background: #f1f5f9; color: #475569;'}"
				>
					Contestés
				</button>
			</div>

			<!-- Type Filter -->
			<div style="display: flex; gap: 0.4rem;">
				<button
					onclick={() => (typeFilter = typeFilter === 'debt' ? 'all' : 'debt')}
					class="btn btn-sm"
					style="box-shadow: none; {typeFilter === 'debt' ? 'background: var(--color-primary); color: #0e2331;' : 'background: #f1f5f9; color: #475569;'}"
				>
					Dépenses
				</button>
				<button
					onclick={() => (typeFilter = typeFilter === 'payment' ? 'all' : 'payment')}
					class="btn btn-sm"
					style="box-shadow: none; {typeFilter === 'payment' ? 'background: var(--color-primary); color: #0e2331;' : 'background: #f1f5f9; color: #475569;'}"
				>
					Remboursements
				</button>
			</div>
		</div>
	</div>

	<!-- Transactions List -->
	{#if filteredItems.length === 0}
		<div class="card" style="text-align: center; padding: 3rem 1.5rem;">
			<p style="color: var(--color-text-muted);">
				Aucune transaction ne correspond à vos filtres.
			</p>
		</div>
	{:else}
		<div class="card" style="padding: 0.5rem; overflow: hidden;">
			{#each filteredItems as tx, idx}
				{@const isDebt = tx.txType === 'debt'}
				{@const IconComp = isDebt ? getCategoryIcon((tx as any).category_icon) : Banknote}
				{@const isCreditor = isDebt && (tx as any).creditor_id === data.user.id}
				{@const isPayer = !isDebt && (tx as any).payer_id === data.user.id}

				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					onclick={() => (selectedTx = tx)}
					style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; cursor: pointer; transition: background 0.15s; {idx !== filteredItems.length - 1 ? 'border-bottom: 1px solid var(--color-border-subtle);' : ''}"
					onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc')}
					onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
				>
					<div style="display: flex; align-items: center; gap: 0.9rem;">
						<div
							style="width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; background-color: {isDebt ? '#fff7ed' : '#ecfdf5'}; color: {isDebt ? '#ea580c' : '#059669'}; flex-shrink: 0;"
						>
							<IconComp size={22} />
						</div>

						<div>
							<div style="font-weight: 800; color: var(--color-dark); font-size: 1rem;">
								{tx.reason}
							</div>
							<div style="font-size: 0.8rem; color: #64748b; margin-top: 0.15rem;">
								{#if isDebt}
									{isCreditor ? `Avancé pour ${(tx as any).debtor_name}` : `${(tx as any).creditor_name} a avancé pour vous`}
								{:else}
									{isPayer ? `Remboursé à ${(tx as any).receiver_name}` : `Reçu de ${(tx as any).payer_name}`}
								{/if}
								• {formatDate(tx.created_at)}
							</div>
							{#if tx.approval_status === 'disputed' && tx.dispute_reason}
								<div style="font-size: 0.78rem; color: var(--color-danger); margin-top: 0.2rem; font-weight: 700;">
									⚠️ Motif contestation : "{tx.dispute_reason}"
								</div>
							{/if}
						</div>
					</div>

					<div style="text-align: right; flex-shrink: 0;">
						<div
							style="font-family: var(--font-title); font-size: 1.15rem; color: {isDebt ? (isCreditor ? '#059669' : '#dc2626') : (isPayer ? '#dc2626' : '#059669')};"
						>
							{isDebt ? (isCreditor ? '+' : '-') : (isPayer ? '-' : '+')}{tx.amount.toFixed(2)} €
						</div>

						<div style="margin-top: 0.25rem;">
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

<!-- Transaction Detail Modal -->
{#if selectedTx}
	<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) selectedTx = null; }}>
		<div class="modal-content">
			<div class="modal-header">
				<h3 style="font-size: 1.25rem; color: var(--color-dark);">
					Détail de la transaction
				</h3>
				<button class="btn btn-outline btn-icon" onclick={() => (selectedTx = null)}>
					<X size={18} />
				</button>
			</div>

			<div class="modal-body">
				<div style="text-align: center; margin-bottom: 1.5rem; background: #f8fafc; padding: 1.25rem; border-radius: var(--radius-lg);">
					<div style="font-size: 0.8rem; text-transform: uppercase; font-weight: 800; color: #64748b; margin-bottom: 0.25rem;">
						{selectedTx.txType === 'debt' ? 'Avance / Dépense' : 'Remboursement'}
					</div>
					<div style="font-family: var(--font-title); font-size: 2.2rem; color: var(--color-dark);">
						{selectedTx.amount.toFixed(2)} €
					</div>
					<div style="margin-top: 0.5rem;">
						{#if selectedTx.approval_status === 'approved'}
							<span class="badge badge-approved">Validée</span>
						{:else if selectedTx.approval_status === 'pending_approval'}
							<span class="badge badge-pending">En attente de validation</span>
						{:else if selectedTx.approval_status === 'disputed'}
							<span class="badge badge-disputed">Contestée</span>
						{/if}
					</div>
				</div>

				<div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.95rem;">
					<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem;">
						<span style="color: var(--color-text-muted);">Motif</span>
						<span style="font-weight: 800; color: var(--color-dark);">{selectedTx.reason}</span>
					</div>

					{#if selectedTx.txType === 'debt'}
						<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem;">
							<span style="color: var(--color-text-muted);">Avancé par</span>
							<span style="font-weight: 700;">{selectedTx.creditor_name}</span>
						</div>
						<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem;">
							<span style="color: var(--color-text-muted);">Bénéficiaire</span>
							<span style="font-weight: 700;">{selectedTx.debtor_name}</span>
						</div>
						{#if selectedTx.category_name}
							<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem;">
								<span style="color: var(--color-text-muted);">Catégorie</span>
								<span style="font-weight: 700;">{selectedTx.category_name}</span>
							</div>
						{/if}
					{:else}
						<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem;">
							<span style="color: var(--color-text-muted);">Payeur</span>
							<span style="font-weight: 700;">{selectedTx.payer_name}</span>
						</div>
						<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem;">
							<span style="color: var(--color-text-muted);">Receveur</span>
							<span style="font-weight: 700;">{selectedTx.receiver_name}</span>
						</div>
						<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem;">
							<span style="color: var(--color-text-muted);">Moyen</span>
							<span style="font-weight: 700;">{selectedTx.payment_method}</span>
						</div>
					{/if}

					<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem;">
						<span style="color: var(--color-text-muted);">Enregistré par</span>
						<span style="font-weight: 700;">{selectedTx.creator_name}</span>
					</div>

					<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem;">
						<span style="color: var(--color-text-muted);">Date</span>
						<span>{formatDate(selectedTx.created_at)}</span>
					</div>

					{#if selectedTx.approval_status === 'disputed' && selectedTx.dispute_reason}
						<div style="background-color: var(--color-danger-light); border-left: 4px solid var(--color-danger); padding: 0.85rem; border-radius: var(--radius-sm); margin-top: 0.5rem;">
							<div style="font-weight: 800; color: #991b1b; font-size: 0.85rem; margin-bottom: 0.2rem;">
								Motif de la contestation :
							</div>
							<div style="color: #7f1d1d; font-size: 0.95rem;">
								« {selectedTx.dispute_reason} »
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn btn-dark" onclick={() => (selectedTx = null)}>
					Fermer
				</button>
			</div>
		</div>
	</div>
{/if}

