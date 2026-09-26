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
const normalized = value => clean(value).toLowerCase().replace(/\s+/g, ' ');

export function routeCommand(input) {
  const text = clean(input);
  const n = normalized(text);
  if (!text) return { handled: false };

  let m = n.match(/^(?:open|launch|start)\s+(.+)$/);
  if (m) {
    const app = APP_ALIASES[m[1]];
    if (app) return { handled: true, action: 'open-app', args: { app }, reply: `Opening ${app}.` };
  }

  m = text.match(/^(?:open|go to|visit)\s+(https:\/\/\S+)$/i);
  if (m) return { handled: true, action: 'open-url', args: { url: m[1] }, reply: 'Opening that link.' };

  m = text.match(/^(?:dial|call)\s+([0-9+*#() -]{3,30})$/i);
  if (m) return { handled: true, action: 'dial', args: { number: m[1] }, reply: 'Opening the phone dialer.' };

  m = n.match(/^(?:turn|switch)\s+(on|off)\s+(?:the\s+)?flashlight$/);
  if (m) return { handled: true, action: 'flashlight', args: { on: m[1] === 'on' }, reply: `Turning flashlight ${m[1]}.` };

  if (/^(?:what(?:'s| is) my battery|battery status|check battery|show battery)$/i.test(text)) {
    return { handled: true, action: 'battery', args: {}, reply: null };
  }

  m = text.match(/^(?:notify me|send me a notification)\s+(?:that\s+)?(.+)$/i);
  if (m) return { handled: true, action: 'notify', args: { title: 'Jarvis', text: m[1].trim() }, reply: 'Notification sent.' };

  return { handled: false };
}

export function actionLabel(action) {
  if (!action) return '';
  if (action.action === 'open-app') return `Opening ${action.args.app}.`;
  if (action.action === 'open-url') return 'Opening that link.';
  if (action.action === 'dial') return 'Opening the phone dialer.';
  if (action.action === 'flashlight') return `Turning flashlight ${action.args.on ? 'on' : 'off'}.`;
  if (action.action === 'battery') return 'Checking battery status.';
  if (action.action === 'notify') return 'Notification sent.';
  return 'Working.';
}
