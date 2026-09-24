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
    [[ "${2:-}" =~ ^https:// ]] || { echo "Only HTTPS URLs are allowed."; exit 1; }
    if command -v termux-open-url >/dev/null 2>&1; then termux-open-url "$2"; else am start -a android.intent.action.VIEW -d "$2" >/dev/null; fi
    ;;
  dial)
    [[ "${2:-}" =~ ^[0-9+*#() -]{3,30}$ ]] || { echo "Invalid phone number."; exit 1; }
    am start -a android.intent.action.DIAL -d "tel:${2}" >/dev/null
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
