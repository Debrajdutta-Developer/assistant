import fs from 'node:fs/promises';
import path from 'node:path';

export const CAPABILITIES = {
  chat: { label: 'AI Chat', description: 'Allow Jarvis to process chat messages.', local: true, core: true },
  memory: { label: 'Personal Memory', description: 'Allow Jarvis to read and write local notes.', local: true },
  voice_output: { label: 'Voice Output', description: 'Allow Jarvis to speak replies in the browser.', local: true, core: true },
  microphone: { label: 'Microphone Input', description: 'Allow browser speech recognition when the browser supports it.', local: true, core: true },
  device_open_apps: { label: 'Open Apps', description: 'Allow the Android bridge to launch allowlisted apps.', local: true },
  device_open_urls: { label: 'Open Links', description: 'Allow Jarvis to open a URL on the connected Android device.', local: true },
  device_dial: { label: 'Phone Dialer', description: 'Allow Jarvis to open the Android dialer with a number filled in.', local: false },
  device_notifications: { label: 'Notifications', description: 'Allow the Android bridge to post local notifications.', local: false },
  device_battery: { label: 'Battery Status', description: 'Allow Jarvis to read the Android battery status.', local: true },
  device_flashlight: { label: 'Flashlight', description: 'Allow Jarvis to toggle the Android flashlight.', local: false },
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
const CORE = new Set(Object.entries(CAPABILITIES).filter(([, meta]) => meta.core).map(([name]) => name));

function defaults() {
  return Object.fromEntries(Object.entries(CAPABILITIES).map(([name, meta]) => [name, Boolean(meta.local)]));
}

export async function readPermissions() {
  let permissions = defaults();
  try {
    const value = JSON.parse(await fs.readFile(file, 'utf8'));
    permissions = { ...permissions, ...value };
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  // Core assistant functions must not be accidentally disabled by an old permission file.
  for (const name of CORE) permissions[name] = true;
  return permissions;
}

export async function setPermission(name, enabled) {
  if (!CAPABILITIES[name]) throw Error('Unknown capability.');
  if (CAPABILITIES[name].core && !enabled) throw Error(name + ' is a core assistant capability and cannot be disabled.');
  const permissions = await readPermissions();
  permissions[name] = Boolean(enabled);
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await fs.writeFile(file, JSON.stringify(permissions, null, 2), { mode: 0o600 });
  return permissions;
}

export function requirePermission(permissions, name) {
  if (!permissions[name]) throw Error('Permission required: ' + name);
}
