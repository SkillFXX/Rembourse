<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import {
		CheckCircle2,
		XCircle,
		Clock,
		AlertCircle,
		Banknote,
		ArrowRight,
		MessageSquare,
		Send,
		X
	} from 'lucide-svelte';

	let { data } = $props();

	let activeTab = $state<'to_validate' | 'waiting_others'>('to_validate');

	// Dispute modal state
	let showDisputeModal = $state(false);
	let disputeTarget = $state<{ type: 'debt' | 'payment'; id: number; title: string; amount: number } | null>(null);
	let disputeReason = $state('');
	let disputeError = $state('');
	let disputeLoading = $state(false);

	let actionMessage = $state<{ text: string; isError: boolean } | null>(null);

	function showFeedback(text: string, isError = false) {
		actionMessage = { text, isError };
		setTimeout(() => {
			actionMessage = null;
		}, 3500);
	}

	async function validateTx(type: 'debt' | 'payment', id: number) {
		try {
			const res = await fetch('/api/transactions/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type, id })
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				showFeedback(result.error || 'Erreur lors de la validation', true);
			} else {
				showFeedback('Transaction validée avec succès ! Les soldes ont été mis à jour.');
				await invalidateAll();
			}
		} catch (e: any) {
			showFeedback(e.message || 'Erreur réseau', true);
		}
	}

	function openDispute(type: 'debt' | 'payment', id: number, title: string, amount: number) {
		disputeTarget = { type, id, title, amount };
		disputeReason = '';
		disputeError = '';
		showDisputeModal = true;
	}

	async function submitDispute() {
		if (!disputeTarget) return;
		if (!disputeReason.trim()) {
			disputeError = 'Veuillez saisir un motif explicatif pour contester cette transaction.';
			return;
		}

		disputeLoading = true;
		disputeError = '';

		try {
			const res = await fetch('/api/transactions/dispute', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: disputeTarget.type,
					id: disputeTarget.id,
					reason: disputeReason.trim()
				})
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				disputeError = result.error || 'Erreur lors de la contestation';
			} else {
				showDisputeModal = false;
				showFeedback('Transaction contestée. Votre ami a été notifié du motif.');
				await invalidateAll();
			}
		} catch (e: any) {
			disputeError = e.message || 'Erreur réseau';
		} finally {
			disputeLoading = false;
		}
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'long',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let myValidationsTotal = $derived(
		data.validations.debtsToValidate.length + data.validations.paymentsToValidate.length
	);
	let waitingOthersTotal = $derived(
		data.validations.debtsWaitingOthers.length + data.validations.paymentsWaitingOthers.length
	);
</script>

<div style="max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
	<div>
		<h1 style="font-size: 2rem; color: var(--color-dark); margin-bottom: 0.35rem;">
			Validations des transactions
		</h1>
		<p style="color: var(--color-text-muted); font-size: 0.95rem;">
			Pour garantir la confiance, chaque dépense ou remboursement créé doit être validé ou contesté avec motif.
		</p>
	</div>

	{#if actionMessage}
		<div
			style="background-color: {actionMessage.isError ? 'var(--color-danger-light)' : 'var(--color-success-light)'}; border-left: 4px solid {actionMessage.isError ? 'var(--color-danger)' : 'var(--color-success)'}; padding: 1rem; border-radius: var(--radius-sm); color: {actionMessage.isError ? '#991b1b' : '#065f46'}; font-weight: 700; font-size: 0.95rem;"
		>
			{actionMessage.text}
		</div>
	{/if}

	<!-- Tab Switcher -->
	<div style="display: flex; background: #e2e8f0; padding: 4px; border-radius: var(--radius-full);">
		<button
			onclick={() => (activeTab = 'to_validate')}
			class="btn"
			style="flex: 1; border-radius: var(--radius-full); box-shadow: none; font-size: 0.9rem; {activeTab === 'to_validate' ? 'background: #ffffff; color: var(--color-dark); box-shadow: var(--shadow-sm);' : 'background: transparent; color: #64748b;'}"
		>
			<span>À valider par moi</span>
			{#if myValidationsTotal > 0}
				<span class="badge badge-pending" style="font-size: 0.75rem;">{myValidationsTotal}</span>
			{/if}
		</button>
		<button
			onclick={() => (activeTab = 'waiting_others')}
			class="btn"
			style="flex: 1; border-radius: var(--radius-full); box-shadow: none; font-size: 0.9rem; {activeTab === 'waiting_others' ? 'background: #ffffff; color: var(--color-dark); box-shadow: var(--shadow-sm);' : 'background: transparent; color: #64748b;'}"
		>
			<span>En attente de mes amis</span>
			{#if waitingOthersTotal > 0}
				<span class="badge" style="background: #cbd5e1; color: #334155; font-size: 0.75rem;">{waitingOthersTotal}</span>
			{/if}
		</button>
	</div>

	<!-- Tab 1: A valider par moi -->
	{#if activeTab === 'to_validate'}
		{#if myValidationsTotal === 0}
			<div class="card" style="text-align: center; padding: 3rem 1.5rem;">
				<div
					style="width: 60px; height: 60px; border-radius: 9999px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;"
				>
					<CheckCircle2 size={32} />
				</div>
				<h3 style="font-size: 1.35rem; color: var(--color-dark); margin-bottom: 0.5rem;">
					Tout est à jour !
				</h3>
				<p style="color: var(--color-text-muted); font-size: 0.95rem;">
					Aucune dépense ni aucun remboursement n'attend votre validation actuellement.
				</p>
			</div>
		{:else}
			<div style="display: flex; flex-direction: column; gap: 1rem;">
				<!-- Debts to validate -->
				{#each data.validations.debtsToValidate as debt}
					<div class="card" style="border: 2px solid #fde68a; padding: 1.5rem;">
						<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
							<div>
								<span class="badge badge-pending" style="margin-bottom: 0.5rem;">
									Dépense à valider
								</span>
								<h3 style="font-size: 1.4rem; color: var(--color-dark);">
									{debt.reason}
								</h3>
								<div style="font-size: 0.85rem; color: #64748b; margin-top: 0.2rem;">
									Créé par <strong>{debt.creator_name}</strong> le {formatDate(debt.created_at)}
								</div>
							</div>

							<div style="text-align: right;">
								<div style="font-family: var(--font-title); font-size: 1.8rem; color: #dc2626;">
									{debt.amount.toFixed(2)} €
								</div>
								<div style="font-size: 0.8rem; color: #64748b;">
									{debt.category_name || 'Dépense'}
								</div>
							</div>
						</div>

						<div style="background-color: #f8fafc; border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1.25rem; font-size: 0.9rem; color: #334155;">
							👉 <strong>{debt.creditor_name}</strong> a payé cette somme pour <strong>{debt.debtor_name}</strong>. En validant, cette dette sera ajoutée à vos comptes.
						</div>

						<div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
							<button
								class="btn btn-outline"
								style="color: var(--color-danger); border-color: #fca5a5;"
								onclick={() => openDispute('debt', debt.id, debt.reason, debt.amount)}
							>
								<XCircle size={18} />
								<span>Contester avec un motif</span>
							</button>

							<button
								class="btn btn-primary"
								onclick={() => validateTx('debt', debt.id)}
							>
								<CheckCircle2 size={18} />
								<span>Valider la dépense</span>
							</button>
						</div>
					</div>
				{/each}

				<!-- Payments to validate -->
				{#each data.validations.paymentsToValidate as payment}
					<div class="card" style="border: 2px solid #a7f3d0; padding: 1.5rem;">
						<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
							<div>
								<span class="badge" style="background: #d1fae5; color: #065f46; margin-bottom: 0.5rem;">
									Remboursement à valider
								</span>
								<h3 style="font-size: 1.4rem; color: var(--color-dark);">
									{payment.reason}
								</h3>
								<div style="font-size: 0.85rem; color: #64748b; margin-top: 0.2rem;">
									Enregistré par <strong>{payment.creator_name}</strong> ({payment.payment_method}) le {formatDate(payment.created_at)}
								</div>
							</div>

							<div style="text-align: right;">
								<div style="font-family: var(--font-title); font-size: 1.8rem; color: #059669;">
									{payment.amount.toFixed(2)} €
								</div>
							</div>
						</div>

						<div style="background-color: #f8fafc; border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1.25rem; font-size: 0.9rem; color: #334155;">
							👉 Remboursement de <strong>{payment.payer_name}</strong> vers <strong>{payment.receiver_name}</strong>.
						</div>

						<div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
							<button
								class="btn btn-outline"
								style="color: var(--color-danger); border-color: #fca5a5;"
								onclick={() => openDispute('payment', payment.id, payment.reason, payment.amount)}
							>
								<XCircle size={18} />
								<span>Contester</span>
							</button>

							<button
								class="btn btn-success"
								onclick={() => validateTx('payment', payment.id)}
							>
								<CheckCircle2 size={18} />
								<span>Valider le remboursement</span>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Tab 2: En attente de mes amis -->
		{#if waitingOthersTotal === 0}
			<div class="card" style="text-align: center; padding: 3rem 1.5rem;">
				<p style="color: var(--color-text-muted);">
					Aucune transaction créée par vous n'est en attente de validation chez vos amis.
				</p>
			</div>
		{:else}
			<div style="display: flex; flex-direction: column; gap: 1rem;">
				{#each data.validations.debtsWaitingOthers as d}
					<div class="card" style="padding: 1.25rem;">
						<div style="display: flex; justify-content: space-between; align-items: center;">
							<div>
								<div style="font-weight: 800; font-size: 1.1rem; color: var(--color-dark);">
									{d.reason}
								</div>
								<div style="font-size: 0.85rem; color: #64748b; margin-top: 0.2rem;">
									Avance de {d.amount.toFixed(2)} € pour <strong>{d.debtor_name}</strong> • Créée le {formatDate(d.created_at)}
								</div>
							</div>

							<div style="text-align: right;">
								<span class="badge badge-pending">
									<Clock size={12} />
									En attente de {d.debtor_name.split(' ')[0]}
								</span>
							</div>
						</div>
					</div>
				{/each}

				{#each data.validations.paymentsWaitingOthers as p}
					<div class="card" style="padding: 1.25rem;">
						<div style="display: flex; justify-content: space-between; align-items: center;">
							<div>
								<div style="font-weight: 800; font-size: 1.1rem; color: var(--color-dark);">
									{p.reason}
								</div>
								<div style="font-size: 0.85rem; color: #64748b; margin-top: 0.2rem;">
									Remboursement de {p.amount.toFixed(2)} € • Créé le {formatDate(p.created_at)}
								</div>
							</div>

							<div style="text-align: right;">
								<span class="badge badge-pending">
									<Clock size={12} />
									En attente de confirmation
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- Modal Contestation avec motif obligatoire -->
{#if showDisputeModal && disputeTarget}
	<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showDisputeModal = false; }}>
		<div class="modal-content">
			<div class="modal-header">
				<h3 style="font-size: 1.25rem; color: var(--color-danger); display: flex; align-items: center; gap: 0.5rem;">
					<AlertCircle size={20} />
					Contester cette transaction
				</h3>
				<button class="btn btn-outline btn-icon" onclick={() => (showDisputeModal = false)}>
					<X size={18} />
				</button>
			</div>

			<div class="modal-body">
				<div style="background-color: #f8fafc; padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
					<div style="font-weight: 800; color: var(--color-dark);">{disputeTarget.title}</div>
					<div style="font-size: 0.9rem; color: #64748b;">Montant : <strong>{disputeTarget.amount.toFixed(2)} €</strong></div>
				</div>

				{#if disputeError}
					<div style="background: var(--color-danger-light); border-left: 4px solid var(--color-danger); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 1rem; color: #991b1b; font-size: 0.85rem;">
						{disputeError}
					</div>
				{/if}

				<div class="form-group">
					<label class="form-label" for="disp-reason">
						Motif de contestation <span style="color: var(--color-danger);">*</span>
					</label>
					<textarea
						id="disp-reason"
						bind:value={disputeReason}
						rows="3"
						class="form-control"
						placeholder="Ex: Je n'ai pas consommé cela, le montant est erroné, j'ai déjà remboursé en espèces hier..."
						required
					></textarea>
					<span style="font-size: 0.78rem; color: #64748b; margin-top: 0.25rem; display: block;">
						Ce motif sera visible par votre ami dans l'historique et lui sera transmis.
					</span>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn btn-outline" onclick={() => (showDisputeModal = false)}>
					Annuler
				</button>
				<button
					class="btn btn-danger"
					onclick={submitDispute}
					disabled={disputeLoading || !disputeReason.trim()}
				>
					<Send size={16} />
					<span>{disputeLoading ? 'Envoi...' : 'Confirmer la contestation'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}

