<script lang="ts">
	import { Share2, Copy, Check, ShieldCheck, UserCheck, Clock } from 'lucide-svelte';

	let { data, form } = $props();

	let copiedCode = $state<string | null>(null);

	function copyLink(code: string) {
		const url = `${window.location.origin}/register?invite=${code}`;
		navigator.clipboard.writeText(url);
		copiedCode = code;
		setTimeout(() => {
			copiedCode = null;
		}, 2500);
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div style="max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
	<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
		<div>
			<h1 style="font-size: 2rem; color: var(--color-dark); margin-bottom: 0.35rem;">
				Gestion des invitations
			</h1>
			<p style="color: var(--color-text-muted); font-size: 0.95rem;">
				Invitez vos amis pour qu'ils puissent créer un compte et rejoindre vos dépenses.
			</p>
		</div>

		<form method="POST" action="?/create">
			<button type="submit" class="btn btn-primary">
				<Share2 size={16} />
				<span>Générer un lien d'invitation</span>
			</button>
		</form>
	</div>

	<!-- Information Card -->
	<div class="card" style="background: #fffdf5; border: 1.5px solid #fde68a; padding: 1.25rem; display: flex; align-items: flex-start; gap: 1rem;">
		<ShieldCheck size={26} color="#d97706" style="flex-shrink: 0; margin-top: 2px;" />
		<div style="font-size: 0.9rem; color: #78350f; line-height: 1.5;">
			<strong>Système privé sur invitation :</strong> Par défaut, personne ne peut s'inscrire librement sur Rembourse. Chaque lien généré ci-dessous est unique et permet à une seule personne de rejoindre l'application en toute sécurité.
		</div>
	</div>

	<!-- Invitations List -->
	{#if data.invitations.length === 0}
		<div class="card" style="text-align: center; padding: 3rem 1.5rem;">
			<Share2 size={44} color="#94a3b8" style="margin: 0 auto 1rem;" />
			<h3 style="font-size: 1.25rem; color: var(--color-dark); margin-bottom: 0.5rem;">
				Vous n'avez pas encore généré d'invitation
			</h3>
			<p style="color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
				Cliquez sur le bouton ci-dessus pour générer un premier lien à partager par WhatsApp, SMS ou Discord.
			</p>
		</div>
	{:else}
		<div style="display: flex; flex-direction: column; gap: 0.85rem;">
			{#each data.invitations as inv}
				<div class="card" style="padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
					<div>
						<div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
							<code style="font-size: 1.1rem; font-weight: 800; color: var(--color-dark); background: #f1f5f9; padding: 0.2rem 0.6rem; border-radius: var(--radius-sm);">
								{inv.code}
							</code>
							{#if inv.is_used}
								<span class="badge badge-approved">
									<UserCheck size={12} />
									Utilisée
								</span>
							{:else}
								<span class="badge badge-pending">
									<Clock size={12} />
									En attente
								</span>
							{/if}
						</div>

						<div style="font-size: 0.85rem; color: #64748b;">
							Créée le {formatDate(inv.created_at)}
							{#if inv.is_used && (inv as any).used_by_name}
								• Inscrit : <strong>{(inv as any).used_by_name}</strong>
							{/if}
						</div>
					</div>

					<div>
						{#if !inv.is_used}
							<button
								type="button"
								class="btn btn-primary btn-sm"
								onclick={() => copyLink(inv.code)}
							>
								{#if copiedCode === inv.code}
									<Check size={16} />
									<span>Lien copié !</span>
								{:else}
									<Copy size={16} />
									<span>Copier le lien</span>
								{/if}
							</button>
						{:else}
							<button type="button" class="btn btn-outline btn-sm" disabled style="opacity: 0.6;">
								<span>Déjà activée</span>
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
