#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/deploy.sh
# Requires: node>=18, npm, pm2 installed globally (npm i -g pm2)

APP_NAME="family-store"
PORT="${PORT:-3000}"

# Install deps
npm ci --omit=dev || npm install --omit=dev

# Build Next.js (standalone)
npm run build

# Create a runtime .env if not exists (optional prompt-less copy)
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "Copied .env.example to .env (please edit values)."
fi

# Start or reload with PM2
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$APP_NAME" --update-env
else
  pm2 start ecosystem.config.cjs --env production
fi

pm2 save

echo "Deployed. App should be available on port $PORT."

