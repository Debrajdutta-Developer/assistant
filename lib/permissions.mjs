import fs from 'node:fs/promises';
import path from 'node:path';

export const CAPABILITIES = {
  chat: { label: 'AI Chat', description: 'Allow Astra to process chat messages.', local: true },
  memory: { label: 'Personal Memory', description: 'Allow Astra to read and write local notes.', local: true },
  voice_output: { label: 'Voice Output', description: 'Allow Astra to speak replies in the browser.', local: true },
  microphone: { label: 'Microphone Input', description: 'Allow browser speech recognition when the browser supports it.', local: true },
  github_read: { label: 'GitHub Read', description: 'Read repositories you explicitly connect.', oauth: 'github' },
  github_write: { label: 'GitHub Write', description: 'Create or modify GitHub content after explicit approval.', oauth: 'github' },
  gmail_read: { label: 'Gmail Read', description: 'Read Gmail messages after Google authorization.', oauth: 'google' },
  gmail_send: { label: 'Gmail Send', description: 'Create/send Gmail messages after Google authorization.', oauth: 'google' },
  drive_read: { label: 'Drive Read', description: 'Read Google Drive files after Google authorization.', oauth: 'google' },
  drive_write: { label: 'Drive Write', description: 'Create or modify Google Drive files after Google authorization.', oauth: 'google' },
  calendar_read: { label: 'Calendar Read', description: 'Read calendar events after Google authorization.', oauth: 'google' },
  calendar_write: { label: 'Calendar Write', description: 'Create or modify Google Calendar events after Google authorization.', oauth: 'google' }
};

const file = path.resolve('data/permissions.json');

function defaults() {
  return Object.fromEntries(Object.entries(CAPABILITIES).map(([name, meta]) => [name, Boolean(meta.local)]));
}

export async function readPermissions() {
  try {
    const value = JSON.parse(await fs.readFile(file, 'utf8'));
    return { ...defaults(), ...value };
  } catch (e) {
    if (e.code === 'ENOENT') return defaults();
    throw e;
  }
}

export async function setPermission(name, enabled) {
  if (!CAPABILITIES[name]) throw Error('Unknown capability.');
  const permissions = await readPermissions();
  permissions[name] = Boolean(enabled);
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await fs.writeFile(file, JSON.stringify(permissions, null, 2), { mode: 0o600 });
  return permissions;
}

export function requirePermission(permissions, name) {
  if (!permissions[name]) throw Error('Permission required: ' + name);
}
