#!/usr/bin/env bash
# Fix broken /_next/static (MIME text/html + 400) after deploy
set -euo pipefail

APP_DIR="${1:-$(pwd)}"
cd "$APP_DIR"

echo "App dir: $APP_DIR"
echo "==> Stop process"
pm2 stop tradingwall 2>/dev/null || pm2 stop all 2>/dev/null || true
sleep 1

echo "==> Clean"
rm -rf .next
rm -rf node_modules/.cache

echo "==> Install + build"
npm ci || npm install
npm run build

echo "==> Verify critical assets exist"
ls -la .next/static/css | head
ls -la .next/static/chunks/app | head
test -f .next/BUILD_ID && echo "BUILD_ID=$(cat .next/BUILD_ID)"

CSS="$(ls .next/static/css/*.css 2>/dev/null | head -1 || true)"
LAYOUT="$(ls .next/static/chunks/app/layout-*.js 2>/dev/null | head -1 || true)"
if [[ -z "$CSS" || -z "$LAYOUT" ]]; then
  echo "ERROR: css or layout chunk missing after build — build is incomplete"
  exit 1
fi
echo "OK css: $CSS"
echo "OK layout: $LAYOUT"

echo "==> Start"
pm2 delete tradingwall 2>/dev/null || true
pm2 start npm --name tradingwall --cwd "$APP_DIR" -- start
pm2 save

echo ""
echo "Now update nginx to serve /_next/static from:"
echo "  alias $APP_DIR/.next/static/;"
echo "Then: sudo nginx -t && sudo systemctl reload nginx"
echo "Hard refresh browser (Ctrl+F5)."
