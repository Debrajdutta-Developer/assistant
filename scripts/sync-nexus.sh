#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NEXUS_URL="https://github.com/Debrajdutta-Developer/Nexus.git"
NEXUS_DIR="$ROOT/.nexus-source"

printf '\n[NEXUS] Syncing Nexus source...\n'
if [ -d "$NEXUS_DIR/.git" ]; then
  git -C "$NEXUS_DIR" fetch --depth=1 origin main
  git -C "$NEXUS_DIR" reset --hard origin/main
else
  rm -rf "$NEXUS_DIR"
  git clone --depth=1 "$NEXUS_URL" "$NEXUS_DIR"
fi

printf '[NEXUS] Copying product UI/runtime source...\n'
rm -rf "$ROOT/nexus-ui"
mkdir -p "$ROOT/nexus-ui"
cp -R "$NEXUS_DIR/src/." "$ROOT/nexus-ui/"
cp "$NEXUS_DIR/index.css" "$ROOT/nexus-ui/index.css"
cp "$NEXUS_DIR/main.tsx" "$ROOT/nexus-ui/main.tsx"
cp "$NEXUS_DIR/index.html" "$ROOT/nexus-ui/index.html" 2>/dev/null || true

printf '[NEXUS] Source copied to nexus-ui/.\n'
printf '[NEXUS] This preserves the existing assistant server while making Nexus the UI base.\n'
printf '[NEXUS] Next: run npm run nexus:install then npm run nexus:dev\n'
