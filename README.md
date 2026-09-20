# Astra Assistant

Mobile first personal assistant prototype with a CSS animated character, text chat, browser voice input and speech output. A free OpenRouter model can answer questions when you provide your own key. Without a key the app clearly labels its demo mode. Free providers have changing quotas and availability; no unlimited access is promised.

## Android / Termux

Install Node.js 20+ and Git in Termux, then run:

```sh
git clone https://github.com/Debrajdutta-Developer/assistant.git
cd assistant
node --version
npm start
```

Open `http://localhost:3000` in your phone browser. No `npm install` is needed because this version has no external packages. If you want real AI responses, create `.env` in the project directory with `OPENROUTER_API_KEY=your_key_here` and restart `npm start`. Keep `.env` private and never commit it. Keys stay on the local server; this is intended for localhost, not public deployment.

Browser speech recognition and available voices vary by browser and device. The avatar is an original CSS illustration, not a generated photo. This version does not control other apps, execute commands, or send messages. It needs the server running in Termux.
