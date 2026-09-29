import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';

const root = process.cwd();
const stateDir = path.join(root, 'data');
const stateFile = path.join(stateDir, 'mayra-state.json');
const port = 3001;
const wake = /^(?:hey\s+)?(?:hello\s+)?mayra\b/i;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let state = { online: true, listening: false, woken: false, status: 'Idle', transcript: '', response: '' };

async function persist() {
  await mkdir(stateDir, { recursive: true, mode: 0o700 });
  await writeFile(stateFile, JSON.stringify({ ...state, updatedAt: Date.now() }), { mode: 0o600 });
}
async function setState(patch) { state = { ...state, ...patch }; await persist(); }
function run(command, args = []) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.on('error', () => resolve(''));
    child.on('close', () => resolve(out.trim()));
  });
}
async function transcribe() { return (await run('termux-speech-to-text')).replace(/^"|"$/g, '').trim(); }
async function answer(command) {
  const fast = await fetch('http://127.0.0.1:3000/api/assistant/command', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: command }) });
  const fastData = await fast.json();
  if (fastData.handled) return fastData.reply || 'Done.';
  const chat = await fetch('http://127.0.0.1:3000/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: command }], mode: 'auto', shareNotes: false }) });
  const data = await chat.json();
  return data.reply || data.message || data.error || 'I am ready.';
}
async function speak(text) { if (text) await run('termux-tts-speak', ['-l', 'en', '-r', '1.02', text.slice(0, 2500)]); }

http.createServer((req, res) => {
  if (req.url === '/state') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
    return res.end(JSON.stringify({ ...state, updatedAt: Date.now() }));
  }
  res.writeHead(404); res.end();
}).listen(port, '127.0.0.1');

async function main() {
  await setState({ online: true, listening: true, woken: false, status: 'Idle' });
  while (true) {
    const text = await transcribe();
    if (!text) { await sleep(250); continue; }
    await setState({ transcript: text, listening: true });
    const match = text.match(wake);
    if (!match) continue;
    const command = text.slice(match[0].length).trim();
    await setState({ woken: true, status: 'Listening', transcript: command, response: '' });
    if (!command) await speak('Hi. I am Mayra. I am listening.');
    if (command) {
      try {
        await setState({ status: 'Thinking' });
        const response = await answer(command);
        await setState({ status: 'Speaking', response });
        await speak(response);
      } catch (error) {
        const response = String(error?.message || 'I could not reach the Jarvis runtime.');
        await setState({ status: 'Error', response });
        await speak(response);
      }
    }
    await sleep(500);
    await setState({ status: 'Idle', woken: false, transcript: '' });
  }
}
main().catch(async (error) => { await setState({ online: false, status: 'Offline', error: String(error?.message || error) }); process.exit(1); });
