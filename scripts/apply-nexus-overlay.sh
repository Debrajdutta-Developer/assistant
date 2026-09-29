#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OVERLAY="$ROOT/nexus-overlay"
TARGET="$ROOT/nexus-ui"
[ -d "$OVERLAY/src" ] || { echo '[NEXUS] overlay missing'; exit 1; }
cp -R "$OVERLAY/src/." "$TARGET/src/"
printf '[NEXUS] Mayra voice-first mobile overlay applied.\n'
