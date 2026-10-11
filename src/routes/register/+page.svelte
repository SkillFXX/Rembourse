<script lang="ts">
	import { goto } from '$app/navigation';
	import { UserPlus, ShieldAlert, CheckCircle2, User, Mail, Lock, AlertCircle } from 'lucide-svelte';

	let { data } = $props();

	let full_name = $state('');
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let errorMessage = $state('');
	let loading = $state(false);

	async function handleRegister(e: Event) {
		e.preventDefault();
		errorMessage = '';
		loading = true;

		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					full_name,
					username,
					email,
					password,
					inviteCode: data.inviteCode
				})
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				errorMessage = result.error || 'Erreur lors de l\'inscription';
			} else {
				goto('/');
			}
		} catch (err: any) {
			errorMessage = err.message || 'Erreur réseau';
		} finally {
			loading = false;
		}
	}
</script>

<div style="max-width: 480px; margin: 2rem auto; padding: 0 1rem;">
	<div style="text-align: center; margin-bottom: 2rem;">
		<img src="/icon.png" alt="Rembourse" style="width: 76px; height: 76px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); margin-bottom: 0.75rem;" />
		<div>
			<img src="/text.png" alt="Rembourse" style="height: 36px; object-fit: contain;" />
		</div>
	</div>

	{#if !data.isValid}
		<div class="card" style="padding: 2.25rem; text-align: center;">
			<div style="width: 60px; height: 60px; border-radius: 9999px; background: #fee2e2; color: #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;">
				<ShieldAlert size={32} />
			</div>

			<h2 style="font-size: 1.5rem; color: var(--color-dark); margin-bottom: 0.75rem;">
				Accès sur invitation uniquement
			</h2>

			{#if data.reason === 'used'}
				<p style="color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem;">
					Ce lien d'invitation généré par <strong>{data.inviterName}</strong> a déjà été utilisé pour créer un compte.
				</p>
			{:else if data.reason === 'invalid'}
				<p style="color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem;">
					Le code d'invitation <code>{data.inviteCode}</code> n'est pas valide ou a expiré.
				</p>
			{:else}
				<p style="color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem;">
					Personne ne peut créer de compte directement sans invitation. Demandez à un ami déjà inscrit sur <strong>Rembourse</strong> de vous envoyer son lien d'invitation unique !
				</p>
			{/if}

			<div style="display: flex; flex-direction: column; gap: 0.75rem;">
				<a href="/login" class="btn btn-primary" style="width: 100%;">
					Retour à la page de connexion
				</a>
			</div>
		</div>
	{:else}
		<div class="card" style="padding: 2rem;">
			<div style="background-color: var(--color-primary-light); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
				<CheckCircle2 size={24} color="#0e2331" />
				<div>
					<div style="font-size: 0.8rem; text-transform: uppercase; font-weight: 800; color: #64748b;">Invitation validée</div>
					<div style="font-weight: 800; color: var(--color-dark); font-size: 0.95rem;">
						Invité(e) par <strong>{data.inviterName}</strong>
					</div>
				</div>
			</div>

			<h2 style="font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--color-dark); text-align: center;">
				Créer votre compte
			</h2>

			{#if errorMessage}
				<div style="background-color: var(--color-danger-light); border-left: 4px solid var(--color-danger); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; color: #991b1b; font-size: 0.9rem;">
					<AlertCircle size={18} />
					<span>{errorMessage}</span>
				</div>
			{/if}

			<form onsubmit={handleRegister}>
				<div class="form-group">
					<label class="form-label" for="reg-name">Nom complet (Prénom et Nom)</label>
					<div style="position: relative;">
						<input
							id="reg-name"
							type="text"
							bind:value={full_name}
							placeholder="ex: Alex Dupont"
							class="form-control"
							style="padding-left: 2.5rem;"
							required
						/>
						<div style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted);">
							<User size={18} />
						</div>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label" for="reg-uname">Nom d'utilisateur</label>
					<div style="position: relative;">
						<input
							id="reg-uname"
							type="text"
							bind:value={username}
							placeholder="ex: alexdupont"
							class="form-control"
							style="padding-left: 2.5rem;"
							required
						/>
						<div style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted);">
							<User size={18} />
						</div>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label" for="reg-email">Adresse email</label>
					<div style="position: relative;">
						<input
							id="reg-email"
							type="email"
							bind:value={email}
							placeholder="ex: alex@exemple.fr"
							class="form-control"
							style="padding-left: 2.5rem;"
							required
						/>
						<div style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted);">
							<Mail size={18} />
						</div>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label" for="reg-pass">Mot de passe</label>
					<div style="position: relative;">
						<input
							id="reg-pass"
							type="password"
							bind:value={password}
							placeholder="Choisissez un mot de passe sécurisé"
							class="form-control"
							style="padding-left: 2.5rem;"
							required
							minlength={4}
						/>
						<div style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted);">
							<Lock size={18} />
						</div>
					</div>
				</div>

				<button
					type="submit"
					class="btn btn-primary"
					style="width: 100%; padding: 0.85rem; font-size: 1.05rem; margin-top: 0.5rem;"
					disabled={loading}
				>
					<UserPlus size={18} />
					<span>{loading ? 'Création du compte...' : 'Créer mon compte'}</span>
				</button>
			</form>
		</div>
	{/if}
</div>

