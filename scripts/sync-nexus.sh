#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
NEXUS_URL="https://github.com/Debrajdutta-Developer/Nexus.git"
NEXUS_DIR="$ROOT/.nexus-source"
printf '\n[NEXUS] Syncing public Nexus base...\n'
if [ -d "$NEXUS_DIR/.git" ]; then
  git -C "$NEXUS_DIR" fetch --depth=1 origin main
  git -C "$NEXUS_DIR" reset --hard origin/main
else
  rm -rf "$NEXUS_DIR"
  git clone --depth=1 "$NEXUS_URL" "$NEXUS_DIR"
fi
printf '[NEXUS] Rebuilding nexus-ui from the complete Nexus source tree...\n'
rm -rf "$ROOT/nexus-ui"
mkdir -p "$ROOT/nexus-ui"
cp -R "$NEXUS_DIR/." "$ROOT/nexus-ui/"
rm -rf "$ROOT/nexus-ui/.git" "$ROOT/nexus-ui/node_modules" "$ROOT/nexus-ui/dist"
"$ROOT/scripts/apply-nexus-overlay.sh"
printf '[NEXUS] Nexus base + Mayra mobile overlay ready.\n'
printf '[NEXUS] Install/build with: cd nexus-ui && npm install && npm run build\n'
printf '[NEXUS] Development: npm run nexus:dev\n'
