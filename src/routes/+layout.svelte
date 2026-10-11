<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { requestNotificationPermission, sendLocalNotification } from '$lib/notifications';
	import {
		Home,
		CheckSquare,
		History,
		Users,
		Share2,
		Bell,
		LogOut,
		PlusCircle,
		UserCheck,
		Menu,
		X
	} from 'lucide-svelte';

	let { data, children } = $props();

	let showQuickSwitchModal = $state(false);
	let showInviteModal = $state(false);
	let generatedInviteUrl = $state('');
	let inviteLoading = $state(false);
	let copied = $state(false);
	let lastPendingCount = $state(data.pendingCount || 0);

	async function generateInvite() {
		inviteLoading = true;
		copied = false;
		try {
			const res = await fetch('/api/invitations/create', { method: 'POST' });
			const result = await res.json();
			if (result.success) {
				const origin = window.location.origin;
				generatedInviteUrl = `${origin}${result.inviteUrl}`;
				showInviteModal = true;
			}
		} catch (e) {
			console.error(e);
		} finally {
			inviteLoading = false;
		}
	}

	async function copyInvite() {
		try {
			await navigator.clipboard.writeText(generatedInviteUrl);
			copied = true;
			setTimeout(() => (copied = false), 2500);
		} catch (e) {
			console.error(e);
		}
	}

	onMount(() => {
		// Ask notification permission on first interaction if logged in
		if (data.user) {
			requestNotificationPermission();

			// Periodic check for new transactions requiring validation
			const interval = setInterval(async () => {
				try {
					const res = await fetch('/api/notifications');
					if (res.ok) {
						const d = await res.json();
						if (d.pendingValidationsCount > lastPendingCount) {
							sendLocalNotification(
								'Rembourse - Action requise',
								`Vous avez ${d.pendingValidationsCount} transaction(s) en attente de votre validation !`
							);
						}
						lastPendingCount = d.pendingValidationsCount;
					}
				} catch (e) {
					// silent
				}
			}, 15000);

			return () => clearInterval(interval);
		}
	});
</script>

<div class="app-layout">
	{#if data.user}
		<header class="top-header">
			<div class="header-inner">
				<a href="/" class="brand-link">
					<img src="/icon.png" alt="Rembourse" class="brand-logo-img" />
					<img src="/text.png" alt="Rembourse" class="brand-text-img" />
				</a>

				<!-- Desktop Nav -->
				<nav class="desktop-nav">
					<a href="/" class="desktop-nav-link" class:active={$page.url.pathname === '/'}>
						<Home size={18} />
						<span>Tableau de bord</span>
					</a>
					<a
						href="/validations"
						class="desktop-nav-link"
						class:active={$page.url.pathname === '/validations'}
					>
						<CheckSquare size={18} />
						<span>À valider</span>
						{#if data.pendingCount > 0}
							<span class="badge badge-pending" style="font-size: 0.7rem; padding: 2px 7px;">
								{data.pendingCount}
							</span>
						{/if}
					</a>
					<a
						href="/historique"
						class="desktop-nav-link"
						class:active={$page.url.pathname === '/historique'}
					>
						<History size={18} />
						<span>Historique</span>
					</a>
					<a
						href="/amis"
						class="desktop-nav-link"
						class:active={$page.url.pathname === '/amis'}
					>
						<Users size={18} />
						<span>Amis</span>
					</a>
					<a
						href="/invitations"
						class="desktop-nav-link"
						class:active={$page.url.pathname === '/invitations'}
					>
						<Share2 size={18} />
						<span>Invitations</span>
					</a>
					<a
						href="/profil"
						class="desktop-nav-link"
						class:active={$page.url.pathname === '/profil'}
					>
						<KeyRound size={18} />
						<span>Profil & Sécurité</span>
					</a>
				</nav>

				<div class="header-actions">
					<button
						onclick={generateInvite}
						class="btn btn-primary btn-sm"
						title="Inviter un ami"
					>
						<Share2 size={15} />
						<span>+ Inviter un ami</span>
					</button>

					<a
						href="/profil"
						class="btn btn-outline btn-sm"
						style="border-color: #cbd5e1; gap: 0.35rem;"
						title="Mon profil & Modifier mot de passe"
					>
						<KeyRound size={15} color="#0e2331" />
						<span class="btn-label-desktop">Mon compte</span>
					</a>

					<!-- Quick User Switcher button (ideal for testing multi-user workflow) -->
					<button
						onclick={() => (showQuickSwitchModal = true)}
						class="btn btn-outline btn-sm"
						style="border-color: #cbd5e1; gap: 0.35rem;"
						title="Changer d'utilisateur (Test multi-comptes)"
					>
						<UserCheck size={16} color="#0e2331" />
						<span style="max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
							{data.user.full_name.split(' ')[0]}
						</span>
					</button>

					<form action="/api/auth/logout" method="POST" style="display: inline;">
						<button class="btn btn-outline btn-icon" title="Se déconnecter" type="submit">
							<LogOut size={16} />
						</button>
					</form>
				</div>
			</div>
		</header>
	{/if}

	<main class="main-content">
		{@render children()}
	</main>

	{#if data.user}
		<!-- Mobile Bottom Nav -->
		<nav class="bottom-nav">
			<a href="/" class="nav-item" class:active={$page.url.pathname === '/'}>
				<Home size={22} class="nav-icon" />
				<span>Accueil</span>
			</a>
			<a
				href="/validations"
				class="nav-item"
				class:active={$page.url.pathname === '/validations'}
			>
				<CheckSquare size={22} class="nav-icon" />
				<span>À valider</span>
				{#if data.pendingCount > 0}
					<span class="badge-notif">{data.pendingCount}</span>
				{/if}
			</a>
			<a
				href="/nouvelle"
				class="nav-item"
				style="color: var(--color-dark); margin-top: -12px;"
			>
				<div style="background: var(--color-primary); width: 44px; height: 44px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md);">
					<PlusCircle size={26} color="#0e2331" />
				</div>
				<span style="font-size: 0.7rem; font-weight: 800;">Ajouter</span>
			</a>
			<a
				href="/invitations"
				class="nav-item"
				class:active={$page.url.pathname === '/invitations'}
			>
				<Share2 size={22} class="nav-icon" />
				<span>Inviter</span>
			</a>
			<a
				href="/profil"
				class="nav-item"
				class:active={$page.url.pathname === '/profil'}
			>
				<KeyRound size={22} class="nav-icon" />
				<span>Profil</span>
			</a>
		</nav>
	{/if}
</div>

<!-- Modal Inviter un ami -->
{#if showInviteModal}
	<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showInviteModal = false; }}>
		<div class="modal-content">
			<div class="modal-header">
				<h3 style="font-size: 1.25rem; color: var(--color-dark); display: flex; align-items: center; gap: 0.5rem;">
					<Share2 size={20} color="#fdc619" />
					Inviter un ami
				</h3>
				<button class="btn btn-outline btn-icon" onclick={() => (showInviteModal = false)}>
					<X size={18} />
				</button>
			</div>
			<div class="modal-body">
				<p style="color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: 1rem;">
					Sur Rembourse, les inscriptions se font uniquement sur invitation. Envoyez ce lien unique à votre ami pour qu'il puisse créer son compte :
				</p>
				<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
					<input
						type="text"
						readonly
						value={generatedInviteUrl}
						class="form-control"
						style="background-color: #f8fafc; font-weight: 600;"
					/>
					<button class="btn btn-primary" onclick={copyInvite}>
						{copied ? 'Copié !' : 'Copier'}
					</button>
				</div>
				<p style="font-size: 0.85rem; color: #64748b; background: #fffbeb; padding: 0.75rem; border-radius: var(--radius-md); border-left: 4px solid var(--color-primary);">
					💡 Une fois qu'il aura rejoint l'application, vous pourrez directement vous envoyer des avances et des remboursements !
				</p>
			</div>
			<div class="modal-footer">
				<button class="btn btn-dark" onclick={() => (showInviteModal = false)}>Fermer</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal Changement Rapide d'Utilisateur (Super pratique pour tester les validations réciproques) -->
{#if showQuickSwitchModal}
	<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showQuickSwitchModal = false; }}>
		<div class="modal-content">
			<div class="modal-header">
				<h3 style="font-size: 1.25rem; color: var(--color-dark); display: flex; align-items: center; gap: 0.5rem;">
					<UserCheck size={20} color="#fdc619" />
					Changer d'utilisateur (Test)
				</h3>
				<button class="btn btn-outline btn-icon" onclick={() => (showQuickSwitchModal = false)}>
					<X size={18} />
				</button>
			</div>
			<div class="modal-body">
				<p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
					Basculez instantanément sur un autre compte pour tester le système de validation / contestation mutuel :
				</p>
				<div style="display: flex; flex-direction: column; gap: 0.75rem;">
					{#each data.allUsers as u}
						<form action="/api/auth/switch" method="POST" style="width: 100%;">
							<input type="hidden" name="userId" value={u.id} />
							<button
								type="submit"
								class="btn btn-outline"
								style="width: 100%; justify-content: space-between; padding: 0.75rem 1rem; {data.user?.id === u.id ? 'border: 2px solid var(--color-primary); background-color: var(--color-primary-light);' : ''}"
							>
								<div style="display: flex; align-items: center; gap: 0.75rem;">
									<div style="width: 34px; height: 34px; border-radius: 9999px; background: #0e2331; color: #fdc619; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-title);">
										{u.full_name[0]}
									</div>
									<div style="text-align: left;">
										<div style="font-weight: 800; color: var(--color-dark);">{u.full_name}</div>
										<div style="font-size: 0.8rem; color: #64748b;">@{u.username} ({u.role})</div>
									</div>
								</div>
								{#if data.user?.id === u.id}
									<span class="badge badge-approved" style="font-size: 0.7rem;">Actif</span>
								{/if}
							</button>
						</form>
					{/each}
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn btn-outline" onclick={() => (showQuickSwitchModal = false)}>Fermer</button>
			</div>
		</div>
	</div>
{/if}
