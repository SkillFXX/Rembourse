# 💸 Rembourse

Application **PWA (Progressive Web App)** moderne pour gérer les avances d'argent, dettes et remboursements entre amis, conçue avec **SvelteKit**, **Svelte 5 (Runes)** et **SQLite**.

---

## 🌟 Fonctionnalités

1. **Calcul des Soldes Nets et Bilatéraux**
   - Dites le plus simplement possible : *"J'ai payé 8€ de repas pour un ami"* puis *"Il m'a remboursé 10€"* $\rightarrow$ l'application calcule instantanément que vous lui devez 2€ !
   - Calcul automatique et transparent des équilibres financiers entre vous et chacun de vos amis.

2. **Validation et Contestation Obligatoires**
   - Chaque nouvelle transaction (avance ou remboursement) doit **impérativement être validée** par le destinataire pour impacter les soldes officiels.
   - En cas de désaccord, l'utilisateur peut **contester la transaction avec un motif explicatif obligatoire** (ex : *"Je n'étais pas là"*, *"Déjà réglé en liquide"*).
   - Historique complet avec filtres et statuts : **Validée**, **En attente de validation**, **Contestée** (avec motif affiché).

3. **Système Privé sur Invitation Uniquement**
   - Inscription réservée au cercle d'amis : aucun compte ne peut être créé sans code d'invitation valide.
   - N'importe quel membre connecté peut générer un lien d'invitation unique (`/register?invite=INV-XXXX`) pour inviter un ami.
   - Lors de la première installation vierge, le code d'invitation initial `INV-BIENVENUE` permet au premier utilisateur de créer le compte administrateur.

4. **Progressive Web App (PWA) & Notifications Push Web**
   - **Installable en 1 clic** sur Android, PC, Mac et iOS (Safari).
   - Bannière d'installation native avec détection automatique du support PWA et guide pas à pas pour Safari iOS.
   - **Notifications Push natives (VAPID)** : alertes en temps réel à chaque transaction en attente de validation ou contestée, avec configuration VAPID automatique côté serveur.

5. **Direction Artistique**
   - **Font Titre** : `Lilita One`
   - **Font Texte** : `Nunito`
   - **Logos** : `icon.png` (icône carrée / maskable) et `text.png` (typographique)
   - **Palette de couleurs** :
     - Fond clair : `#fcfdfc`
     - Jaune éclatant / Accent : `#fdc619`
     - Bleu nuit profond / Contraste : `#0e2331`

---

## 🚀 Démarrage en Développement Local

### 1. Prérequis
- **Node.js 22 LTS** ou supérieur
- **npm**

### 2. Installation
```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

L'application est accessible sur [http://localhost:5173](http://localhost:5173).

---

## 🛠️ Production & Déploiement

### Compilation locale
```bash
npm run build
node build/index.js
```
L'application écoute par défaut sur le port `3000` (`http://localhost:3000`).

---

## 🐧 Déploiement sur Conteneur Proxmox (LXC / CTX)

### Option 1 — Déploiement automatisé avec GitHub Runner (Recommandé)

Le projet intègre un workflow GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) qui compile et redéploie automatiquement l'application sur votre CTX à chaque `git push` sur la branche `master`.

#### 1. Enregistrer le Runner sur votre CTX Proxmox :
Sur GitHub : **Settings** $\rightarrow$ **Actions** $\rightarrow$ **Runners** $\rightarrow$ **New self-hosted runner** (Linux / x64).

Dans le terminal de votre CTX :
```bash
mkdir -p /opt/actions-runner && cd /opt/actions-runner
curl -o actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/download/v2.322.0/actions-runner-linux-x64-2.322.0.tar.gz
tar xzf ./actions-runner-linux-x64.tar.gz
./config.sh --url https://github.com/<votre-user>/Rembourse --token <TOKEN_GITHUB>
sudo ./svc.sh install
sudo ./svc.sh start
```

Dès que vous poussez sur `master`, le runner compile l'application, synchronise les fichiers dans `/opt/rembourse` (en préservant la base SQLite dans `/opt/rembourse/data`), configure le service systemd et redémarre l'application.

---

### Option 2 — Déploiement manuel direct via Systemd

1. **Installer Node.js 22 sur le CTX :**
   ```bash
   apt update && apt install -y curl git build-essential python3
   curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
   apt install -y nodejs
   ```

2. **Cloner et compiler :**
   ```bash
   cd /opt
   git clone <URL_REPO> rembourse
   cd rembourse
   npm ci
   npm run build
   ```

3. **Créer le service systemd :**
   ```bash
   cat << 'EOF' > /etc/systemd/system/rembourse.service
   [Unit]
   Description=Rembourse PWA Service
   After=network.target

   [Service]
   Type=simple
   User=root
   WorkingDirectory=/opt/rembourse
   ExecStart=/usr/bin/node build/index.js
   Restart=always
   RestartSec=5
   Environment=NODE_ENV=production
   Environment=PORT=3000
   Environment=HOST=0.0.0.0

   [Install]
   WantedBy=multi-user.target
   EOF

   systemctl daemon-reload
   systemctl enable --now rembourse
   ```

---

## 🔒 Sécurité et Persistance des Données

- **Base de données SQLite** : stockée dans `data/rembourse.db` avec mode WAL (*Write-Ahead Logging*).
- **Mots de passe** : hachés avec `bcrypt`.
- **Sessions sécurisées** : cookies HTTP-Only de 30 jours avec tokens cryptographiques aléatoires.
- **Protection des données privées** : la base de données et les fichiers d'export `.sql` sont strictement ignorés par Git via `.gitignore`.
