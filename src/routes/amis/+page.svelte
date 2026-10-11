<script lang="ts">
	import { Plus, Banknote, Share2, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-svelte';

	let { data } = $props();
</script>

<div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
	<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
		<div>
			<h1 style="font-size: 2rem; color: var(--color-dark); margin-bottom: 0.35rem;">
				Mes amis
			</h1>
			<p style="color: var(--color-text-muted); font-size: 0.95rem;">
				Retrouvez vos comptes bilatéraux détaillés avec chaque ami.
			</p>
		</div>

		<a href="/invitations" class="btn btn-primary">
			<Share2 size={16} />
			<span>Inviter un nouvel ami</span>
		</a>
	</div>

	{#if data.friendsBalances.length === 0}
		<div class="card" style="text-align: center; padding: 3rem 1.5rem;">
			<Users size={48} color="#64748b" style="margin: 0 auto 1rem;" />
			<h3 style="font-size: 1.3rem; color: var(--color-dark); margin-bottom: 0.5rem;">
				Aucun ami pour le moment
			</h3>
			<p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">
				Invitez vos proches avec un lien unique pour commencer à gérer vos comptes ensemble !
			</p>
			<a href="/invitations" class="btn btn-primary">
				<Share2 size={16} />
				<span>Créer une invitation</span>
			</a>
		</div>
	{:else}
		<div style="display: flex; flex-direction: column; gap: 1rem;">
			{#each data.friendsBalances as fb}
				<div class="card" style="padding: 1.5rem;">
					<div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
						<div style="display: flex; align-items: center; gap: 0.9rem;">
							<div
								style="width: 52px; height: 52px; border-radius: 9999px; background: #0e2331; color: #fdc619; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-title); font-size: 1.5rem;"
							>
								{fb.friendName[0]}
							</div>
							<div>
								<div style="font-weight: 800; color: var(--color-dark); font-size: 1.2rem;">
									{fb.friendName}
								</div>
								<div style="font-size: 0.85rem; color: #64748b;">
									@{fb.friendUsername}
								</div>
							</div>
						</div>

						<div style="text-align: right;">
							<div style="font-size: 0.8rem; text-transform: uppercase; font-weight: 800; color: #64748b; margin-bottom: 0.2rem;">
								Solde bilatéral
							</div>
							<div
								style="font-family: var(--font-title); font-size: 1.75rem; color: {fb.netBalance > 0 ? '#059669' : fb.netBalance < 0 ? '#dc2626' : '#64748b'};"
							>
								{#if fb.netBalance > 0}
									Il vous doit {fb.netBalance.toFixed(2)} €
								{:else if fb.netBalance < 0}
									Vous lui devez {Math.abs(fb.netBalance).toFixed(2)} €
								{:else}
									À l'équilibre (0.00 €)
								{/if}
							</div>
						</div>
					</div>

					<!-- Detailed totals breakdown -->
					<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
						<div>
							<div style="font-size: 0.75rem; color: #64748b; font-weight: 700;">Avancé pour lui</div>
							<div style="font-weight: 800; color: var(--color-dark); font-size: 1.05rem;">{fb.totalLent.toFixed(2)} €</div>
						</div>
						<div>
							<div style="font-size: 0.75rem; color: #64748b; font-weight: 700;">Avancé par lui</div>
							<div style="font-weight: 800; color: var(--color-dark); font-size: 1.05rem;">{fb.totalBorrowed.toFixed(2)} €</div>
						</div>
						<div>
							<div style="font-size: 0.75rem; color: #64748b; font-weight: 700;">Remboursé à lui</div>
							<div style="font-weight: 800; color: var(--color-dark); font-size: 1.05rem;">{fb.totalPaidToFriend.toFixed(2)} €</div>
						</div>
						<div>
							<div style="font-size: 0.75rem; color: #64748b; font-weight: 700;">Remboursé par lui</div>
							<div style="font-weight: 800; color: var(--color-dark); font-size: 1.05rem;">{fb.totalReceivedFromFriend.toFixed(2)} €</div>
						</div>
					</div>

					<div style="display: flex; gap: 0.75rem; justify-content: flex-end; flex-wrap: wrap;">
						<a
							href="/nouvelle?type=debt&friend={fb.friendId}"
							class="btn btn-outline btn-sm"
						>
							<Plus size={16} />
							<span>J'ai payé pour lui</span>
						</a>

						<a
							href="/nouvelle?type=payment&friend={fb.friendId}"
							class="btn btn-primary btn-sm"
						>
							<Banknote size={16} />
							<span>Rembourser</span>
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

