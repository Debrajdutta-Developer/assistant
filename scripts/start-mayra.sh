#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
termux-wake-lock >/dev/null 2>&1 || true
pkill -f 'scripts/mayra-daemon.mjs' >/dev/null 2>&1 || true
nohup node scripts/mayra-daemon.mjs > data/mayra-daemon.log 2>&1 &
printf 'Mayra background daemon started on 127.0.0.1:3001\n'
