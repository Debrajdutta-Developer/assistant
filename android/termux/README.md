# Jarvis Android bridge

This bridge lets a Jarvis server running inside Termux request a small, explicit set of Android actions through normal Android intents.

## Setup

From the cloned Jarvis repository in Termux:

```bash
cd ~/assistant
chmod +x android/termux/jarvis-bridge.sh
```

No extra package is required for `open-app`, `open-url`, or `dial`. Notifications require the Termux:API app plus the `termux-api` package.

## Supported actions

- Open allowlisted apps: WhatsApp, YouTube, Chrome, Maps, Settings
- Open HTTPS URLs
- Open the phone dialer with a number
- Post a local notification when Termux:API is installed

Jarvis intentionally does not unlock the device, bypass authentication, or silently grant Android permissions. Those are Android security boundaries.
