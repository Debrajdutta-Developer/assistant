const APP_ALIASES = {
  whatsapp: 'whatsapp',
  'you tube': 'youtube',
  youtube: 'youtube',
  chrome: 'chrome',
  maps: 'maps',
  'google maps': 'maps',
  settings: 'settings'
};

const clean = value => String(value || '').trim();

export function routeCommand(input) {
  const text = clean(input);
  const normalized = text.toLowerCase();
  if (!text) return { handled: false };

  const openApp = normalized.match(/^(?:open|launch|start)\s+(.+)$/);
  if (openApp) {
    const app = APP_ALIASES[openApp[1].trim()];
    if (app) return { handled: true, action: 'open-app', args: { app }, reply: `Opening ${app}.` };
  }

  const url = text.match(/^(?:open|go to|visit)\s+(https:\/\/\S+)$/i);
  if (url) return { handled: true, action: 'open-url', args: { url: url[1] }, reply: 'Opening that link.' };

  const dial = text.match(/^(?:dial|call)\s+([0-9+*#() -]{3,30})$/i);
  if (dial) return { handled: true, action: 'dial', args: { number: dial[1] }, reply: 'Opening the phone dialer.' };

  const flashlight = normalized.match(/^(?:turn|switch)\s+(on|off)\s+(?:the\s+)?flashlight$/);
  if (flashlight) return { handled: true, action: 'flashlight', args: { on: flashlight[1] === 'on' }, reply: `Turning flashlight ${flashlight[1]}.` };

  if (/^(?:what(?:'s| is) my battery|battery status|check battery)$/i.test(text)) {
    return { handled: true, action: 'battery', args: {}, reply: null };
  }

  const notify = text.match(/^(?:notify me|send me a notification)\s+(?:that\s+)?(.+)$/i);
  if (notify) return { handled: true, action: 'notify', args: { title: 'Jarvis', text: notify[1].trim() }, reply: 'Notification sent.' };

  return { handled: false };
}
