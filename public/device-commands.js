// Small deterministic device-command layer. Unknown requests continue to the AI chat model.
window.tryDeviceCommand = async function (text) {
  const normalized = text.trim().toLowerCase().replace(/[!?]+$/,'');
  const apps = {
    whatsapp:'whatsapp','whatsapp messenger':'whatsapp',
    youtube:'youtube','you tube':'youtube',
    chrome:'chrome','google chrome':'chrome',
    maps:'maps','google maps':'maps',
    settings:'settings','android settings':'settings'
  };

  const openMatch = normalized.match(/^(?:please\s+)?(?:open|launch|start)\s+(.+)$/);
  if (openMatch) {
    const app = apps[openMatch[1].trim()];
    if (app) { await deviceAction('/api/device/open-app',{app}); return `Opening ${app}.`; }
  }

  const urlMatch = normalized.match(/^(?:please\s+)?(?:open|go to|visit)\s+(https:\/\/\S+)$/i);
  if (urlMatch) { await deviceAction('/api/device/open-url',{url:urlMatch[1]}); return 'Opening that link.'; }

  const dialMatch = normalized.match(/^(?:please\s+)?(?:dial|call)\s+([0-9+*#() -]{3,30})$/i);
  if (dialMatch) { await deviceAction('/api/device/dial',{number:dialMatch[1]}); return 'Opening the phone dialer.'; }

  const notifyMatch = normalized.match(/^notify me(?: that)?\s+(.+)$/i);
  if (notifyMatch) { await deviceAction('/api/device/notify',{title:'Jarvis',text:notifyMatch[1]}); return 'Done. I sent the notification.'; }

  if (/^(?:turn|switch)\s+(?:the\s+)?flashlight\s+on$/.test(normalized) || /^flashlight\s+on$/.test(normalized)) {
    await deviceAction('/api/device/flashlight',{on:true}); return 'Flashlight on.';
  }
  if (/^(?:turn|switch)\s+(?:the\s+)?flashlight\s+off$/.test(normalized) || /^flashlight\s+off$/.test(normalized)) {
    await deviceAction('/api/device/flashlight',{on:false}); return 'Flashlight off.';
  }

  if (/^(?:what(?:'s| is)\s+)?(?:my\s+)?battery(?:\s+status)?$/.test(normalized) || /^(?:check|show)\s+(?:my\s+)?battery$/.test(normalized)) {
    const res = await api('/api/device/battery'); const data = await res.json(); if (!res.ok) throw Error(data.error||'Battery status failed.');
    const pct = data?.result?.percentage ?? data?.percentage; return pct == null ? 'I could not read the battery percentage.' : `Your battery is at ${pct} percent.`;
  }

  return null;
};
