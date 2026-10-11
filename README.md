# 💸 Rembourse

Application moderne de gestion des avances d'argent, dettes et remboursements entre amis, conçue avec **SvelteKit**, **SQLite** et **Capacitor**.

---

## 🌟 Fonctionnalités Principales

1. **Calcul des Soldes Nets et Bilatéraux**
   - Dites le plus simplement possible : *"J'ai payé 8€ de Macdo à Quentin"* puis *"Quentin m'a remboursé 10€"* et voyez immédiatement que vous lui devez 2€ !
   - Calcul automatique et instantané des équilibres financiers entre vous et chacun de vos amis.

2. **Validation et Contestation Obligatoires**
   - Chaque nouvelle transaction (avance ou remboursement) doit **impérativement être validée** par le destinataire pour impacter les soldes officiels.
   - En cas de désaccord, l'utilisateur peut **contester la transaction avec un motif explicatif obligatoire** (ex : *"Je n'étais pas là"*, *"Déjà réglé en liquide"*).
   - Historique complet des statuts : **Validée**, **En attente de validation**, **Contestée** (avec motif affiché).

3. **Système Privé sur Invitation Uniquement**
   - Personne ne peut s'inscrire librement sans invitation.
   - N'importe quel membre connecté peut générer un lien d'invitation unique (`/register?invite=INV-...`).
   - Le lien identifie l'ami qui invite et préserve un cercle de confiance entre proches.

4. **Multiplateforme & Notifications**
   - **Web (PC & iPhone)** : Responsive design soigné, installable en PWA (manifest, icône, thème).
   - **Android APK (Capacitor)** : Projet natif Android configuré dans `android/` avec `@capacitor/local-notifications` pour alerter les utilisateurs lorsqu'une transaction nécessite leur validation.

5. **Données Historiques Importées (`old_data.sql`)**
   - Migration automatique complète au démarrage des utilisateurs existants (Raphaël, Quentin, Tristan), des 8 catégories, des 13 dettes et des 6 paiements historiques.

6. **Direction Artistique Respectée**
   - **Font Titre** : `Lilita One`
   - **Font Texte** : `Nunito`
   - **Logos** : `icon.png` (carré) et `text.png` / `texte.png` (typographique)
   - **Palette de couleurs** :
     - Fond clair : `#fcfdfc`
     - Jaune éclatant / Accent : `#fdc619`
     - Bleu nuit profond / Contraste : `#0e2331`

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Migration de la base SQLite
La base de données SQLite se trouve dans `data/rembourse.db`. Si elle n'existe pas, elle sera créée et initialisée automatiquement avec les données de `old_data.sql`. Vous pouvez aussi relancer la migration manuellement :
```bash
npm run migrate
```

### 3. Lancer le serveur de développement Web
```bash
npm run dev
```
Accédez à l'application sur [http://localhost:5173](http://localhost:5173).

### 4. Comptes pré-configurés pour tester
Pour faciliter les tests du système de validation entre amis, un **Accès Rapide Test & Démo** est disponible sur la page de connexion ainsi qu'un bouton de changement rapide d'utilisateur dans la barre de navigation :
- **Raphaël Namur** (`admin`)
- **Quentin Poupion** (`quentin` / mdp: `quentin`)
- **Tristan Rousselle** (`tristan`)

---

## 📱 Build & Export Mobile Android (Capacitor)

1. Compiler l'application web :
   ```bash
   npm run build
   ```

2. Synchroniser avec le projet Android Capacitor :
   ```bash
   npm run cap:sync
   ```

3. Ouvrir le projet dans Android Studio pour générer l'APK :
   ```bash
   npm run cap:open
   ```
