import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const stateDir = path.join(root, 'data');
const stateFile = path.join(stateDir, 'mayra-state.json');
const wake = /^(?:hey\s+)?(?:hello\s+)?mayra\b/i;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function setState(patch) {
  await mkdir(stateDir, { recursive: true, mode: 0o700 });
  let current = {};
  try { current = JSON.parse(await readFile(stateFile, 'utf8')); } catch {}
  await writeFile(stateFile, JSON.stringify({ ...current, ...patch, updatedAt: Date.now() }), { mode: 0o600 });
}

function transcribe() {
  return new Promise((resolve) => {
    const child = spawn('termux-speech-to-text', [], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.on('error', () => resolve(''));
    child.on('close', () => resolve(out.trim().replace(/^"|"$/g, '')));
  });
}

async function main() {
  await setState({ online: true, listening: true, woken: false, transcript: '', response: '' });
  while (true) {
    const text = await transcribe();
    if (!text) { await sleep(250); continue; }
    await setState({ transcript: text, listening: true });
    const match = text.match(wake);
    if (!match) continue;
    const command = text.slice(match[0].length).trim();
    await setState({ woken: true, transcript: command, response: '' });
    if (command) {
      try {
        const response = await fetch('http://127.0.0.1:3000/api/assistant/command', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: command })
        });
        const data = await response.json();
        await setState({ response: data.reply || data.error || 'Done.' });
      } catch {
        await setState({ response: 'I could not reach the Jarvis backend.' });
      }
    }
    await sleep(500);
    await setState({ woken: false, transcript: '' });
  }
}

main().catch(async (error) => {
  await setState({ online: false, error: String(error?.message || error) });
  process.exit(1);
});
