# Astra Assistant

A mobile-friendly personal assistant prototype. It has an animated character, text chat, optional browser voice, a local personal notes store, a local Ollama model, and an optional OpenAI-compatible online router. Source is MIT licensed.

## Run on a computer

Install Node.js 20+ and [Ollama](https://ollama.com/download), then clone this repo and run `npm start`. Open http://localhost:3000. The UI has a **Download offline starter model** button; it downloads `qwen3:0.6b` (about 523 MB) through Ollama after you confirm. You can instead run `ollama pull qwen3:0.6b` yourself. Once downloaded, typed offline chat works without internet while Ollama and Astra run. Smaller local models can be less capable.

Copy `.env.example` to `.env` to configure options. **Offline** always uses Ollama and never sends chat or notes to the router. **Online** calls an OpenAI-compatible router using `ROUTER_URL`, `ROUTER_API_KEY`, and `ROUTER_MODEL`. For 9Router, start it and configure its provider in its dashboard, then use its local `/v1` endpoint. A different option is OpenRouter with `ROUTER_URL=https://openrouter.ai/api/v1` and `ROUTER_MODEL=openrouter/free`. **Auto** tries Ollama first and then the router if unavailable. Free providers still have quotas. The router key is not the GitHub token.

Personal notes live in `data/notes.json` on the host machine and are gitignored. They are injected into offline conversations. For online requests, notes are excluded unless you tick **Share notes with online model**. The current message and recent chat *are* sent online when online mode or auto fallback uses the router. Do not save secrets such as passwords or OTPs in notes. Notes are plain local files, not encrypted.

## Phone + computer

Astra runs on the computer. A phone browser can reach its web UI if both devices can connect to the computer over a trusted local network. Set `HOST=0.0.0.0` and a strong `ASTRA_ACCESS_TOKEN` in the computer's private `.env`, start Astra, then open `http://COMPUTER-LAN-IP:3000` on the phone. Enter the token when prompted. This is local-network HTTP, so use only a trusted network and do not expose port 3000 to the internet. Remote access needs a separate HTTPS solution. The access token is kept only in page memory and will be requested again when reloaded.

Speech recognition in a browser may use a cloud service even when the AI mode says offline. Use typed chat for guaranteed offline input. Browser speech voices also vary by device.

## Scope

Astra does not yet control operating-system settings, send messages, open apps on other devices, perform arbitrary shell commands, or sync notes between independent installations. Connecting more devices requires software running on each device and explicit permissions. A computer model is downloaded to the computer running Ollama, not automatically onto every phone or laptop. Keep `.env` and `data/` private.
