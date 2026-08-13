#!/usr/bin/env bash
# Clean production redeploy — fixes stale /_next/static MIME errors
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Stopping app (ignore error if not running)"
pm2 stop tradingwall 2>/dev/null || pm2 stop all 2>/dev/null || true

echo "==> Pull latest"
git pull

echo "==> Install deps"
npm ci || npm install

echo "==> Clean old build"
rm -rf .next

echo "==> Build"
npm run build

echo "==> Start"
pm2 start npm --name tradingwall -- start 2>/dev/null || pm2 restart tradingwall || pm2 restart all

echo "==> Done. Hard-refresh the site (Ctrl+F5) or purge CDN cache."
