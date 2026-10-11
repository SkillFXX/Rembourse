<script lang="ts">
	import { goto } from '$app/navigation';
	import { LogIn, KeyRound, User as UserIcon, AlertCircle, Sparkles } from 'lucide-svelte';

	let { data } = $props();

	let identifier = $state('');
	let password = $state('');
	let errorMessage = $state('');
	let loading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		errorMessage = '';
		loading = true;

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ identifier, password })
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				errorMessage = result.error || 'Erreur lors de la connexion';
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

<div style="max-width: 440px; margin: 2rem auto; padding: 0 1rem;">
	<div style="text-align: center; margin-bottom: 2rem;">
		<img src="/icon.png" alt="Rembourse" style="width: 84px; height: 84px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); margin-bottom: 1rem;" />
		<div>
			<img src="/text.png" alt="Rembourse" style="height: 40px; object-fit: contain;" />
		</div>
		<p style="color: var(--color-text-muted); font-size: 1.05rem; margin-top: 0.5rem; font-weight: 600;">
			Les bons comptes font les meilleurs amis.
		</p>
	</div>

	<div class="card" style="padding: 2rem;">
		<h2 style="font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--color-dark); text-align: center;">
			Connexion
		</h2>

		{#if errorMessage}
			<div style="background-color: var(--color-danger-light); border-left: 4px solid var(--color-danger); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; color: #991b1b; font-size: 0.9rem;">
				<AlertCircle size={18} />
				<span>{errorMessage}</span>
			</div>
		{/if}

		<form onsubmit={handleLogin}>
			<div class="form-group">
				<label class="form-label" for="login-ident">Nom d'utilisateur ou Email</label>
				<div style="position: relative;">
					<input
						id="login-ident"
						type="text"
						bind:value={identifier}
						placeholder="ex: admin ou quentin"
						class="form-control"
						style="padding-left: 2.5rem;"
						required
					/>
					<div style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted);">
						<UserIcon size={18} />
					</div>
				</div>
			</div>

			<div class="form-group">
				<label class="form-label" for="login-pass">Mot de passe</label>
				<div style="position: relative;">
					<input
						id="login-pass"
						type="password"
						bind:value={password}
						placeholder="Votre mot de passe"
						class="form-control"
						style="padding-left: 2.5rem;"
						required
					/>
					<div style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted);">
						<KeyRound size={18} />
					</div>
				</div>
			</div>

			<button
				type="submit"
				class="btn btn-primary"
				style="width: 100%; padding: 0.85rem; font-size: 1.05rem; margin-top: 0.5rem;"
				disabled={loading}
			>
				<LogIn size={18} />
				<span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
			</button>
		</form>

		<div style="margin-top: 1.5rem; text-align: center; font-size: 0.9rem; color: var(--color-text-muted); border-top: 1px solid var(--color-border); padding-top: 1.25rem;">
			<span>Vous n'avez pas encore de compte ?</span><br />
			<span style="font-size: 0.85rem; color: #64748b; display: block; margin-top: 0.25rem;">
				🔒 Inscription par <strong>invitation uniquement</strong>. Demandez un lien à un ami déjà inscrit !
			</span>
		</div>
	</div>

	<!-- Demo Switcher Card: Easy 1-click test for evaluators -->
	<div class="card" style="background: #fffdf5; border: 1.5px dashed var(--color-primary); padding: 1.25rem;">
		<div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: var(--color-dark);">
			<Sparkles size={18} color="#fdc619" />
			<span style="font-weight: 800; font-size: 0.9rem;">Accès Rapide Test & Démo :</span>
		</div>
		<p style="font-size: 0.82rem; color: #64748b; margin-bottom: 0.75rem;">
			Pour tester immédiatement les flux de validation entre amis sans ressaisir les identifiants :
		</p>
		<div style="display: flex; flex-direction: column; gap: 0.5rem;">
			{#each data.demoUsers as u}
				<form action="/api/auth/switch" method="POST">
					<input type="hidden" name="userId" value={u.id} />
					<button
						type="submit"
						class="btn btn-outline btn-sm"
						style="width: 100%; justify-content: flex-start; background: #ffffff;"
					>
						<span style="font-weight: 800; color: var(--color-dark);">{u.full_name}</span>
						<span style="color: #64748b; margin-left: auto; font-size: 0.75rem;">(@{u.username})</span>
					</button>
				</form>
			{/each}
		</div>
	</div>
</div>
