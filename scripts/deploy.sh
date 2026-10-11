#!/bin/bash
set -e

echo "🚀 Déploiement de Rembourse en cours..."

APP_DIR="${APP_DIR:-/opt/rembourse}"
cd "$APP_DIR"

echo "📥 Récupération des dernières modifications..."
git fetch origin master
git reset --hard origin/master

echo "📦 Installation des dépendances..."
npm ci

echo "🔨 Compilation de la PWA & serveur Node..."
npm run build

echo "🔄 Redémarrage du service..."
if command -v systemctl &> /dev/null && systemctl list-unit-files | grep -q rembourse.service; then
    sudo systemctl restart rembourse || systemctl restart rembourse
    echo "✅ Service systemd 'rembourse' redémarré avec succès !"
elif command -v docker &> /dev/null && [ -f docker-compose.yml ]; then
    docker compose up -d --build
    echo "✅ Conteneur Docker mis à jour et redémarré !"
else
    echo "⚠️ Aucun service systemd ou conteneur docker détecté pour le redémarrage automatique."
fi

echo "🎉 Déploiement terminé !"

