#!/data/data/com.termux/files/usr/bin/bash
set -u

# Jarvis Android bridge for Termux. Run this on the same Android phone as the Jarvis server.
# It intentionally uses Android's normal intents and Termux:API. It does NOT bypass the
# lock screen, accessibility protections, authentication, or Android permission prompts.

usage() {
  echo "Usage: $0 open-app <name> | open-url <url> | dial <number> | notify <title> <text> | battery | flashlight <on|off>"
  exit 2
}

case "${1:-}" in
  open-app)
    case "${2:-}" in
      whatsapp) pkg=com.whatsapp ;;
      youtube) pkg=com.google.android.youtube ;;
      chrome) pkg=com.android.chrome ;;
      maps) pkg=com.google.android.apps.maps ;;
      settings) am start -a android.settings.SETTINGS >/dev/null; exit $? ;;
      *) echo "App is not allowlisted: ${2:-}"; exit 1 ;;
    esac
    monkey -p "$pkg" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
    ;;
  open-url)
    url="${2:-}"
    case "$url" in
      https://*) : ;;
      *) echo "Only HTTPS URLs are allowed."; exit 1 ;;
    esac
    if command -v termux-open-url >/dev/null 2>&1; then termux-open-url "$url"; else am start -a android.intent.action.VIEW -d "$url" >/dev/null; fi
    ;;
  dial)
    number="${2:-}"
    # Avoid Bash =~ entirely for maximum compatibility with Termux shells.
    clean_number="$(printf '%s' "$number" | tr -d ' ')"
    case "$clean_number" in
      "") echo "Invalid phone number."; exit 1 ;;
      *[!0-9+\*#\(\)_-]*) echo "Invalid phone number."; exit 1 ;;
      *) : ;;
    esac
    if [ "${#clean_number}" -lt 3 ] || [ "${#clean_number}" -gt 30 ]; then echo "Invalid phone number."; exit 1; fi
    am start -a android.intent.action.DIAL -d "tel:${clean_number}" >/dev/null
    ;;
  notify)
    command -v termux-notification >/dev/null 2>&1 || { echo "Install Termux:API and the termux-api package first."; exit 1; }
    termux-notification --title "${2:-Jarvis}" --content "${3:-Jarvis notification}" >/dev/null
    ;;
  battery)
    command -v termux-battery-status >/dev/null 2>&1 || { echo "Install Termux:API and the termux-api package first."; exit 1; }
    termux-battery-status
    ;;
  flashlight)
    command -v termux-torch >/dev/null 2>&1 || { echo "Install Termux:API and the termux-api package first."; exit 1; }
    case "${2:-}" in on|off) termux-torch "$2" ;; *) echo "Use flashlight on or off."; exit 2 ;; esac
    ;;
  *) usage ;;
esac
