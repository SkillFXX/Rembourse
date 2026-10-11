<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		registerServiceWorker,
		getPushSubscriptionState,
		subscribeToPushNotifications
	} from '$lib/notifications';
	import {
		Home,
		CheckSquare,
		History,
		Users,
		Share2,
		LogOut,
		PlusCircle,
		X,
		KeyRound,
		ChevronDown,
		Download,
		BellRing,
		Smartphone
	} from 'lucide-svelte';

	let { data, children } = $props();

	let showUserMenu = $state(false);
	let showInviteModal = $state(false);
	let generatedInviteUrl = $state('');
	let inviteLoading = $state(false);
	let copied = $state(false);

	// PWA Install state
	let installPrompt = $state<any>(null);
	let canInstall = $state(false);
	let isInstalled = $state(false);
	let installDismissed = $state(false);
	let isIos = $state(false);
	let showIosModal = $state(false);

	// Web Push state
	let pushSupported = $state(false);
	let pushPermission = $state<NotificationPermission>('default');
	let pushSubscribed = $state(false);
	let pushDismissed = $state(false);
	let pushEnabling = $state(false);

	async function handleInstallClick() {
		if (installPrompt) {
			installPrompt.prompt();
			const { outcome } = await installPrompt.userChoice;
			if (outcome === 'accepted') {
				canInstall = false;
				isInstalled = true;
			}
			installPrompt = null;
		} else if (isIos) {
			showIosModal = true;
		}
	}

	async function enablePushNotifications() {
		pushEnabling = true;
		try {
			const res = await subscribeToPushNotifications();
			if (res.success) {
				pushPermission = 'granted';
				pushSubscribed = true;
				pushDismissed = true;
			} else {
				alert(res.error || 'Erreur lors de l\'activation des notifications.');
			}
		} finally {
			pushEnabling = false;
		}
	}

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
		const closeDropdown = () => {
			showUserMenu = false;
		};
		window.addEventListener('click', closeDropdown);

		if (typeof window !== 'undefined') {
			isInstalled =
				window.matchMedia('(display-mode: standalone)').matches ||
				(navigator as any).standalone === true;
			const ua = window.navigator.userAgent.toLowerCase();
			isIos = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream && !isInstalled;

			// Register PWA Service Worker
			registerServiceWorker();

			// Listen for standard PWA install prompt
			const installHandler = (e: any) => {
				e.preventDefault();
				installPrompt = e;
				canInstall = true;
			};
			window.addEventListener('beforeinstallprompt', installHandler);

			// Check Push Notification status
			getPushSubscriptionState().then((state) => {
				pushSupported = state.supported;
				pushPermission = state.permission;
				pushSubscribed = state.subscribed;

				// If already granted, ensure subscription is active
				if (state.permission === 'granted' && !state.subscribed && data.user) {
					subscribeToPushNotifications().then((r) => {
						if (r.success) pushSubscribed = true;
					});
				}
			});

			return () => {
				window.removeEventListener('click', closeDropdown);
				window.removeEventListener('beforeinstallprompt', installHandler);
			};
		}

		return () => {
			window.removeEventListener('click', closeDropdown);
		};
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

				<!-- Desktop Nav (Épuré & Simple) -->
				<nav class="desktop-nav">
					<a href="/" class="desktop-nav-link" class:active={page.url.pathname === '/'}>
						<Home size={18} />
						<span>Tableau de bord</span>
					</a>
					<a
						href="/validations"
						class="desktop-nav-link"
						class:active={page.url.pathname === '/validations'}
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
						class:active={page.url.pathname === '/historique'}
					>
						<History size={18} />
						<span>Historique</span>
					</a>
					<a
						href="/amis"
						class="desktop-nav-link"
						class:active={page.url.pathname === '/amis'}
					>
						<Users size={18} />
						<span>Amis</span>
					</a>
				</nav>

				<!-- Unique Compact Profile Dropdown -->
				<div class="header-actions" style="position: relative;">
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							showUserMenu = !showUserMenu;
						}}
						class="btn btn-outline btn-sm"
						style="border-color: #cbd5e1; gap: 0.45rem; padding: 0.35rem 0.75rem; background: #ffffff;"
					>
						<div
							style="width: 28px; height: 28px; border-radius: 9999px; background: #0e2331; color: #fdc619; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-title); font-size: 0.85rem;"
						>
							{data.user.full_name[0]}
						</div>
						<span style="font-weight: 800; color: var(--color-dark); font-size: 0.9rem;">
							{data.user.full_name.split(' ')[0]}
						</span>
						<ChevronDown size={14} color="#64748b" />
					</button>

					{#if showUserMenu}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="user-dropdown-menu"
							onclick={(e) => e.stopPropagation()}
						>
							<div style="padding: 0.85rem 1rem; border-bottom: 1px solid var(--color-border); background: #f8fafc;">
								<div style="font-weight: 800; color: var(--color-dark); font-size: 0.95rem;">
									{data.user.full_name}
								</div>
								<div style="font-size: 0.8rem; color: #64748b;">
									@{data.user.username}
								</div>
							</div>

							<div style="padding: 0.4rem; display: flex; flex-direction: column; gap: 0.2rem;">
								<a
									href="/profil"
									class="dropdown-item"
									onclick={() => (showUserMenu = false)}
								>
									<KeyRound size={16} />
									<span>Profil & Mot de passe</span>
								</a>

								<button
									type="button"
									class="dropdown-item"
									style="width: 100%; border: none; background: none; text-align: left; cursor: pointer;"
									onclick={() => {
										showUserMenu = false;
										generateInvite();
									}}
								>
									<Share2 size={16} color="#fdc619" />
									<span>Inviter un ami</span>
								</button>

								<form
									action="/api/auth/logout"
									method="POST"
									style="margin-top: 0.25rem; border-top: 1px solid var(--color-border-subtle); padding-top: 0.25rem;"
								>
									<button
										type="submit"
										class="dropdown-item"
										style="width: 100%; border: none; background: none; text-align: left; cursor: pointer; color: var(--color-danger);"
									>
										<LogOut size={16} />
										<span>Se déconnecter</span>
									</button>
								</form>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</header>
	{/if}

	<main class="main-content">
		<!-- PWA Install Banner (Mobile & Desktop) -->
		{#if (canInstall || (isIos && !isInstalled)) && !installDismissed && !isInstalled}
			<div class="pwa-install-banner">
				<div class="install-info">
					<img src="/icon.png" alt="Rembourse" class="install-icon" />
					<div>
						<div class="install-title">Installer Rembourse</div>
						<div class="install-sub">Application ultra-rapide & notifications push</div>
					</div>
				</div>
				<div class="install-actions">
					<button type="button" class="btn-install" onclick={handleInstallClick}>
						<Download size={14} />
						Installer
					</button>
					<button
						type="button"
						class="btn-dismiss"
						onclick={() => (installDismissed = true)}
						aria-label="Fermer"
					>
						<X size={16} />
					</button>
				</div>
			</div>
		{/if}

		<!-- Web Push Prompt (Si l'utilisateur est connecté et n'a pas encore activé les push) -->
		{#if data.user && pushSupported && pushPermission === 'default' && !pushDismissed}
			<div class="push-banner">
				<div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0;">
					<div
						style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: #fef3c7; color: #b45309; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
					>
						<BellRing size={20} />
					</div>
					<div>
						<div style="font-weight: 800; font-size: 0.9rem; color: var(--color-dark);">
							Activer les notifications push
						</div>
						<div style="font-size: 0.8rem; color: #475569;">
							Soyez prévenu dès qu'un ami ajoute une dépense ou un remboursement.
						</div>
					</div>
				</div>
				<div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
					<button
						type="button"
						class="btn btn-sm btn-primary"
						disabled={pushEnabling}
						onclick={enablePushNotifications}
					>
						{pushEnabling ? 'Activation...' : 'Activer'}
					</button>
					<button
						type="button"
						class="btn-dismiss"
						style="color: #64748b;"
						onclick={() => (pushDismissed = true)}
						aria-label="Fermer"
					>
						<X size={16} />
					</button>
				</div>
			</div>
		{/if}

		{@render children()}
	</main>

	{#if data.user}
		<!-- Mobile Bottom Nav (Simple & Épuré) -->
		<nav class="bottom-nav">
			<a href="/" class="nav-item" class:active={page.url.pathname === '/'}>
				<Home size={22} class="nav-icon" />
				<span>Accueil</span>
			</a>
			<a
				href="/validations"
				class="nav-item"
				class:active={page.url.pathname === '/validations'}
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
				<div
					style="background: var(--color-primary); width: 44px; height: 44px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md);"
				>
					<PlusCircle size={26} color="#0e2331" />
				</div>
				<span style="font-size: 0.7rem; font-weight: 800;">Ajouter</span>
			</a>
			<a
				href="/historique"
				class="nav-item"
				class:active={page.url.pathname === '/historique'}
			>
				<History size={22} class="nav-icon" />
				<span>Historique</span>
			</a>
			<a
				href="/profil"
				class="nav-item"
				class:active={page.url.pathname === '/profil'}
			>
				<KeyRound size={22} class="nav-icon" />
				<span>Profil</span>
			</a>
		</nav>
	{/if}
</div>

<!-- Modal Inviter un ami -->
{#if showInviteModal}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) showInviteModal = false;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') showInviteModal = false;
		}}
	>
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

<!-- Modal Guide Installation iOS Safari -->
{#if showIosModal}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) showIosModal = false;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') showIosModal = false;
		}}
	>
		<div class="modal-content">
			<div class="modal-header">
				<h3 style="font-size: 1.25rem; color: var(--color-dark); display: flex; align-items: center; gap: 0.5rem;">
					<Smartphone size={20} color="#fdc619" />
					Installer sur iPhone / iPad
				</h3>
				<button class="btn btn-outline btn-icon" onclick={() => (showIosModal = false)}>
					<X size={18} />
				</button>
			</div>
			<div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
				<p style="color: var(--color-text-muted); font-size: 0.95rem;">
					Pour installer Rembourse comme une application sur votre iPhone (Safari) :
				</p>
				<div style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
					<div style="display: flex; align-items: flex-start; gap: 0.75rem;">
						<span style="background: var(--color-primary); color: var(--color-dark); font-weight: 800; border-radius: 9999px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0;">1</span>
						<span style="font-size: 0.9rem; color: var(--color-dark);">
							Touchez le bouton <strong>Partager</strong> en bas de l'écran Safari (le carré avec une flèche vers le haut).
						</span>
					</div>
					<div style="display: flex; align-items: flex-start; gap: 0.75rem;">
						<span style="background: var(--color-primary); color: var(--color-dark); font-weight: 800; border-radius: 9999px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0;">2</span>
						<span style="font-size: 0.9rem; color: var(--color-dark);">
							Faites défiler vers le bas et sélectionnez <strong>Sur l'écran d'accueil</strong>.
						</span>
					</div>
					<div style="display: flex; align-items: flex-start; gap: 0.75rem;">
						<span style="background: var(--color-primary); color: var(--color-dark); font-weight: 800; border-radius: 9999px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0;">3</span>
						<span style="font-size: 0.9rem; color: var(--color-dark);">
							Appuyez sur <strong>Ajouter</strong> en haut à droite.
						</span>
					</div>
				</div>
				<p style="font-size: 0.85rem; color: #166534; background: #f0fdf4; padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid #bbf7d0;">
					✨ L'icône Rembourse apparaîtra sur votre écran d'accueil avec les notifications push en direct !
				</p>
			</div>
			<div class="modal-footer">
				<button class="btn btn-dark" onclick={() => (showIosModal = false)}>Compris</button>
			</div>
		</div>
	</div>
{/if}

