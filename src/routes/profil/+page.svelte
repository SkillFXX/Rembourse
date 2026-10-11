<script lang="ts">
	import { onMount } from 'svelte';
	import {
		isPushSupported,
		getPushSubscriptionState,
		subscribeToPushNotifications,
		unsubscribeFromPushNotifications
	} from '$lib/notifications';
	import {
		KeyRound,
		User,
		Mail,
		Phone,
		Share2,
		Copy,
		Check,
		AlertCircle,
		CheckCircle2,
		ShieldCheck,
		Lock,
		BellRing,
		BellOff,
		Smartphone,
		Download
	} from 'lucide-svelte';

	let { data, form } = $props();

	let copiedCode = $state<string | null>(null);

	let pushState = $state<{ supported: boolean; permission: NotificationPermission; subscribed: boolean }>({
		supported: false,
		permission: 'default',
		subscribed: false
	});
	let pushLoading = $state(false);
	let pushMsg = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	onMount(() => {
		getPushSubscriptionState().then((st) => {
			pushState = st;
		});
	});

	async function togglePush() {
		pushLoading = true;
		pushMsg = null;
		try {
			if (pushState.subscribed) {
				await unsubscribeFromPushNotifications();
				pushState = await getPushSubscriptionState();
				pushMsg = { type: 'success', text: 'Notifications désactivées sur cet appareil.' };
			} else {
				const res = await subscribeToPushNotifications();
				pushState = await getPushSubscriptionState();
				if (res.success) {
					pushMsg = { type: 'success', text: 'Notifications push activées avec succès !' };
				} else {
					pushMsg = { type: 'error', text: res.error || 'Erreur lors de l\'activation.' };
				}
			}
		} finally {
			pushLoading = false;
		}
	}

	function copyLink(code: string) {
		const url = `${window.location.origin}/register?invite=${code}`;
		navigator.clipboard.writeText(url);
		copiedCode = code;
		setTimeout(() => {
			copiedCode = null;
		}, 2500);
	}
</script>

<div style="max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
	<div>
		<h1 style="font-size: 2rem; color: var(--color-dark); margin-bottom: 0.35rem;">
			Mon Profil & Paramètres
		</h1>
		<p style="color: var(--color-text-muted); font-size: 0.95rem;">
			Gérez vos informations de compte, votre mot de passe et vos invitations.
		</p>
	</div>

	<!-- SECTION 1: MODIFIER LE MOT DE PASSE -->
	<div class="card" style="padding: 1.75rem;">
		<div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.25rem;">
			<div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: #fef3c7; color: #b45309; display: flex; align-items: center; justify-content: center;">
				<KeyRound size={20} />
			</div>
			<div>
				<h2 style="font-size: 1.3rem; color: var(--color-dark);">
					Modifier mon mot de passe
				</h2>
				<span style="font-size: 0.8rem; color: #64748b;">
					Sécurisez votre compte avec un nouveau mot de passe
				</span>
			</div>
		</div>

		{#if form?.passwordError}
			<div style="background-color: var(--color-danger-light); border-left: 4px solid var(--color-danger); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; color: #991b1b; font-size: 0.9rem;">
				<AlertCircle size={18} />
				<span>{form.passwordError}</span>
			</div>
		{/if}

		{#if form?.passwordSuccess}
			<div style="background-color: var(--color-success-light); border-left: 4px solid var(--color-success); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; color: #065f46; font-size: 0.9rem; font-weight: 700;">
				<CheckCircle2 size={18} />
				<span>{form.passwordSuccess}</span>
			</div>
		{/if}

		<form method="POST" action="?/updatePassword">
			<div class="form-group">
				<label class="form-label" for="curr-pass">Mot de passe actuel</label>
				<input
					id="curr-pass"
					type="password"
					name="currentPassword"
					class="form-control"
					placeholder="Votre mot de passe actuel"
					required
				/>
			</div>

			<div class="form-group">
				<label class="form-label" for="new-pass">Nouveau mot de passe</label>
				<input
					id="new-pass"
					type="password"
					name="newPassword"
					class="form-control"
					placeholder="Au moins 4 caractères"
					minlength={4}
					required
				/>
			</div>

			<div class="form-group">
				<label class="form-label" for="conf-pass">Confirmer le nouveau mot de passe</label>
				<input
					id="conf-pass"
					type="password"
					name="confirmPassword"
					class="form-control"
					placeholder="Répétez le nouveau mot de passe"
					minlength={4}
					required
				/>
			</div>

			<div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
				<button type="submit" class="btn btn-primary">
					<Lock size={16} />
					<span>Enregistrer le nouveau mot de passe</span>
				</button>
			</div>
		</form>
	</div>

	<!-- SECTION 2: INVITER UN AMI (BIEN VISIBLE) -->
	<div class="card" style="padding: 1.75rem; border: 2px solid #fde68a; background: #fffdf5;">
		<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
			<div style="display: flex; align-items: center; gap: 0.6rem;">
				<div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: #fdc619; color: #0e2331; display: flex; align-items: center; justify-content: center;">
					<Share2 size={20} />
				</div>
				<div>
					<h2 style="font-size: 1.3rem; color: var(--color-dark);">
						Inviter un ami
					</h2>
					<span style="font-size: 0.8rem; color: #78350f;">
						Inscription fermée : seul un membre peut inviter de nouveaux utilisateurs
					</span>
				</div>
			</div>

			<form method="POST" action="?/createInvite">
				<button type="submit" class="btn btn-dark btn-sm">
					<Share2 size={15} />
					<span>Générer une invitation</span>
				</button>
			</form>
		</div>

		{#if data.invitations.length === 0}
			<p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">
				Vous n'avez pas encore généré d'invitation. Cliquez sur le bouton ci-dessus pour inviter un ami !
			</p>
		{:else}
			<div style="display: flex; flex-direction: column; gap: 0.65rem;">
				{#each data.invitations as inv}
					<div style="background: #ffffff; border: 1.5px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
						<div>
							<div style="display: flex; align-items: center; gap: 0.5rem;">
								<strong style="font-family: monospace; font-size: 1.05rem; color: var(--color-dark);">{inv.code}</strong>
								{#if inv.is_used}
									<span class="badge badge-approved" style="font-size: 0.7rem;">Utilisée</span>
								{:else}
									<span class="badge badge-pending" style="font-size: 0.7rem;">Active</span>
								{/if}
							</div>
							{#if inv.is_used && (inv as any).used_by_name}
								<div style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
									Inscrit : <strong>{(inv as any).used_by_name}</strong>
								</div>
							{/if}
						</div>

						<div>
							{#if !inv.is_used}
								<button
									type="button"
									class="btn btn-primary btn-sm"
									onclick={() => copyLink(inv.code)}
								>
									{#if copiedCode === inv.code}
										<Check size={14} />
										<span>Copié !</span>
									{:else}
										<Copy size={14} />
										<span>Copier le lien</span>
									{/if}
								</button>
							{:else}
								<span style="font-size: 0.8rem; color: #94a3b8; font-weight: 700;">Compte créé</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- SECTION 3: INFORMATIONS DU PROFIL -->
	<div class="card" style="padding: 1.75rem;">
		<div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.25rem;">
			<div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: #e0f2fe; color: #0369a1; display: flex; align-items: center; justify-content: center;">
				<User size={20} />
			</div>
			<div>
				<h2 style="font-size: 1.3rem; color: var(--color-dark);">
					Informations personnelles
				</h2>
				<span style="font-size: 0.8rem; color: #64748b;">
					Votre identifiant et vos coordonnées
				</span>
			</div>
		</div>

		{#if form?.profileError}
			<div style="background-color: var(--color-danger-light); border-left: 4px solid var(--color-danger); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; color: #991b1b; font-size: 0.9rem;">
				<AlertCircle size={18} />
				<span>{form.profileError}</span>
			</div>
		{/if}

		{#if form?.profileSuccess}
			<div style="background-color: var(--color-success-light); border-left: 4px solid var(--color-success); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; color: #065f46; font-size: 0.9rem; font-weight: 700;">
				<CheckCircle2 size={18} />
				<span>{form.profileSuccess}</span>
			</div>
		{/if}

		<form method="POST" action="?/updateProfile">
			<div class="form-group">
				<label class="form-label" for="prof-uname">Nom d'utilisateur</label>
				<input
					id="prof-uname"
					type="text"
					value={data.user.username}
					class="form-control"
					disabled
					style="background-color: #f8fafc; color: #64748b;"
				/>
				<span style="font-size: 0.78rem; color: #94a3b8; margin-top: 0.2rem; display: block;">
					Le nom d'utilisateur est unique et ne peut pas être modifié.
				</span>
			</div>

			<div class="form-group">
				<label class="form-label" for="prof-fname">Nom complet</label>
				<input
					id="prof-fname"
					type="text"
					name="full_name"
					value={data.user.full_name}
					class="form-control"
					required
				/>
			</div>

			<div class="form-group">
				<label class="form-label" for="prof-email">Adresse email</label>
				<input
					id="prof-email"
					type="email"
					name="email"
					value={data.user.email}
					class="form-control"
					required
				/>
			</div>

			<div class="form-group">
				<label class="form-label" for="prof-phone">Numéro de téléphone</label>
				<input
					id="prof-phone"
					type="tel"
					name="phone"
					value={data.user.phone || ''}
					class="form-control"
					placeholder="ex: 06 12 34 56 78"
				/>
			</div>

			<div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
				<button type="submit" class="btn btn-dark">
					<span>Mettre à jour mon profil</span>
				</button>
			</div>
		</form>
	</div>

	<!-- SECTION 3: NOTIFICATIONS PUSH & APPLICATION PWA -->
	<div class="card" style="padding: 1.75rem;">
		<div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.25rem;">
			<div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: #dbeafe; color: #1e40af; display: flex; align-items: center; justify-content: center;">
				<BellRing size={20} />
			</div>
			<div>
				<h2 style="font-size: 1.3rem; color: var(--color-dark);">
					Notifications Push & PWA
				</h2>
				<span style="font-size: 0.8rem; color: #64748b;">
					Recevez des alertes en temps réel à chaque transaction
				</span>
			</div>
		</div>

		{#if pushMsg}
			<div style="background-color: {pushMsg.type === 'success' ? 'var(--color-success-light)' : 'var(--color-danger-light)'}; border-left: 4px solid {pushMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}; padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; color: {pushMsg.type === 'success' ? '#065f46' : '#991b1b'}; font-size: 0.9rem; font-weight: 700;">
				{#if pushMsg.type === 'success'}
					<CheckCircle2 size={18} />
				{:else}
					<AlertCircle size={18} />
				{/if}
				<span>{pushMsg.text}</span>
			</div>
		{/if}

		<div style="display: flex; flex-direction: column; gap: 1rem;">
			<div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: #f8fafc; border-radius: var(--radius-md); border: 1px solid var(--color-border); gap: 0.75rem; flex-wrap: wrap;">
				<div style="display: flex; align-items: center; gap: 0.75rem;">
					{#if pushState.subscribed}
						<div style="width: 10px; height: 10px; border-radius: 9999px; background: var(--color-success); flex-shrink: 0;"></div>
						<div>
							<div style="font-weight: 800; font-size: 0.95rem; color: var(--color-dark);">Notifications push actives</div>
							<div style="font-size: 0.8rem; color: #64748b;">Cet appareil recevra une alerte à chaque nouvelle transaction.</div>
						</div>
					{:else}
						<div style="width: 10px; height: 10px; border-radius: 9999px; background: #94a3b8; flex-shrink: 0;"></div>
						<div>
							<div style="font-weight: 800; font-size: 0.95rem; color: var(--color-dark);">Notifications push inactives</div>
							<div style="font-size: 0.8rem; color: #64748b;">Activez-les pour ne manquer aucune demande de validation.</div>
						</div>
					{/if}
				</div>

				<button
					type="button"
					class="btn btn-sm {pushState.subscribed ? 'btn-outline' : 'btn-primary'}"
					disabled={pushLoading || !pushState.supported}
					onclick={togglePush}
				>
					{#if pushLoading}
						Patientez...
					{:else if pushState.subscribed}
						<BellOff size={16} />
						Désactiver
					{:else}
						<BellRing size={16} />
						Activer les notifications
					{/if}
				</button>
			</div>

			{#if !pushState.supported}
				<div style="font-size: 0.85rem; color: #b45309; background: #fffbeb; padding: 0.75rem; border-radius: var(--radius-sm); border-left: 4px solid var(--color-primary);">
					ℹ️ Les notifications Push Web nécessitent un navigateur moderne (Chrome, Edge, Firefox, Safari iOS 16.4+).
				</div>
			{/if}
		</div>
	</div>
</div>

