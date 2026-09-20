import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

try { const raw = await fs.readFile('.env', 'utf8'); for (const line of raw.split('\n')) { const match = line.match(/^([A-Z_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim(); } } catch {}
const port = Number(process.env.PORT || 3000);
const root = path.resolve('public');
const send = (res, code, data, type = 'application/json') => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'" }); res.end(typeof data === 'string' ? data : JSON.stringify(data)); };
http.createServer(async (req, res) => {
  if (req.url === '/api/status' && req.method === 'GET') return send(res, 200, { mode: process.env.OPENROUTER_API_KEY ? 'AI connected' : 'Demo mode' });
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = ''; for await (const part of req) { body += part; if (body.length > 30000) return send(res, 413, { error: 'Message too large' }); }
    let messages; try { messages = JSON.parse(body).messages; if (!Array.isArray(messages) || messages.length > 16 || messages.some(m => !['user','assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 4000)) throw Error(); } catch { return send(res, 400, { error: 'Invalid message' }); }
    if (!process.env.OPENROUTER_API_KEY) return send(res, 200, { reply: 'Demo mode চলছে। সত্যিকারের AI response পেতে Termux-এর .env ফাইলে নিজের OpenRouter API key বসিয়ে server restart করো।', demo: true });
    try {
      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: 'openrouter/free', messages: [{ role: 'system', content: 'You are Astra, a practical assistant. Reply in the user’s language. Be clear about what you can actually do; never claim to have taken actions you have not taken.' }, ...messages] }), signal: AbortSignal.timeout(45000) });
      const json = await upstream.json(); if (!upstream.ok) return send(res, 502, { error: json?.error?.message || `Provider error ${upstream.status}` });
      return send(res, 200, { reply: json.choices?.[0]?.message?.content || 'No response returned.', demo: false });
    } catch { return send(res, 502, { error: 'AI provider unreachable. Check your connection and try again.' }); }
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  const files = { '/': ['index.html','text/html; charset=utf-8'], '/app.js': ['app.js','text/javascript; charset=utf-8'], '/style.css': ['style.css','text/css; charset=utf-8'] };
  const file = files[req.url]; if (!file) return send(res, 404, 'Not found', 'text/plain');
  try { send(res, 200, await fs.readFile(path.join(root, file[0]), 'utf8'), file[1]); } catch { send(res, 500, 'File unavailable', 'text/plain'); }
}).listen(port, '127.0.0.1', () => console.log(`Astra: http://localhost:${port}`));
