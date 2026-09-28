import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.resolve('data/nexus-memory.json');
const MAX_ITEMS = 250;

async function readStore() {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeStore(items) {
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await fs.writeFile(file, JSON.stringify(items.slice(-MAX_ITEMS), null, 2), { mode: 0o600 });
}

function redact(value) {
  return String(value)
    .replace(/(?:sk|ghp|AIza|xoxb|xapp)-[A-Za-z0-9_-]{12,}/g, '[REDACTED]')
    .replace(/\b(?:password|passwd|token|api[_ -]?key|secret)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]');
}

export async function remember(kind, content, metadata = {}) {
  const items = await readStore();
  items.push({
    id: cryptoRandomId(),
    kind,
    content: redact(content).slice(0, 4000),
    metadata,
    createdAt: new Date().toISOString()
  });
  await writeStore(items);
  return items.at(-1);
}

export async function recall(query = '', limit = 8) {
  const items = await readStore();
  const terms = redact(query).toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return items.slice(-limit).reverse();
  return items
    .map(item => ({ item, score: terms.reduce((n, term) => n + (String(item.content).toLowerCase().includes(term) ? 1 : 0), 0) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.item);
}

export async function memoryStats() {
  const items = await readStore();
  const kinds = {};
  for (const item of items) kinds[item.kind] = (kinds[item.kind] || 0) + 1;
  return { count: items.length, kinds };
}

function cryptoRandomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
