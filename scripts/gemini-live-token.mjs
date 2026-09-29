import 'dotenv/config';
import http from 'node:http';
import { GoogleGenAI } from '@google/genai';

const port = Number(process.env.GEMINI_LIVE_PORT || 3040);
const host = process.env.GEMINI_LIVE_HOST || '127.0.0.1';
const apiKey = process.env.GEMINI_API_KEY?.trim();

if (!apiKey) {
  console.error('GEMINI_API_KEY is required. Put it in ~/assistant/.env as GEMINI_API_KEY=...');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function createToken() {
  const now = Date.now();
  return ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
      newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
      liveConnectConstraints: {
        model: 'gemini-3.8-live',
        config: {
          responseModalities: ['AUDIO'],
          sessionResumption: {},
          outputAudioTranscription: {},
          systemInstruction: {
            parts: [{
              text: [
                'You are Mayra, a warm, natural voice-first AI assistant.',
                'Speak naturally and conversationally. Keep answers concise unless the user asks for detail.',
                'You are an assistant, not a romantic partner. Do not claim to be a real girlfriend or human.',
                'You can use Nexus tools when the host application provides them.',
              ].join(' '),
            }],
          },
        },
      },
    },
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('access-control-allow-origin', 'http://127.0.0.1:3000');
  res.setHeader('access-control-allow-headers', 'content-type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/api/gemini/live-token') {
    try {
      const token = await createToken();
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({
        ok: true,
        model: 'gemini-3.8-live',
        token: token.name,
        expiresAt: token.expireTime,
      }));
    } catch (error) {
      res.writeHead(502, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: String(error?.message || error).slice(0, 300) }));
    }
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, host, () => {
  console.log(`Gemini Live token service: http://${host}:${port}`);
});
