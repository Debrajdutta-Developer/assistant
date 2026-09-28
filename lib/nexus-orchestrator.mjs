const DEVICE_INTENTS = new Set(['open-app','open-url','dial','notify','battery','flashlight']);

export function classifyNexus(text, fastRoute = null) {
  const input = String(text || '').trim();
  if (!input) return { kind: 'empty', confidence: 1, plan: [] };
  if (fastRoute?.handled && DEVICE_INTENTS.has(fastRoute.action)) {
    return { kind: 'device', confidence: 0.99, plan: [{ step: 'execute', action: fastRoute.action, args: fastRoute.args }], reply: fastRoute.reply };
  }
  const lower = input.toLowerCase();
  if (/\b(research|find out|investigate|compare sources|deep dive)\b/.test(lower)) return { kind: 'research', confidence: 0.82, plan: [{ step: 'research', action: 'web-search' }, { step: 'synthesize', action: 'ai' }] };
  if (/\b(build|create|code|program|debug|implement|repo|github)\b/.test(lower)) return { kind: 'build', confidence: 0.82, plan: [{ step: 'inspect', action: 'workspace' }, { step: 'reason', action: 'ai' }, { step: 'verify', action: 'tests' }] };
  if (/\b(remember|forget|save this|what did i tell you)\b/.test(lower)) return { kind: 'memory', confidence: 0.8, plan: [{ step: 'memory', action: 'memory-store-or-recall' }] };
  if (/\b(screen|screenshot|what is on my screen|look at this)\b/.test(lower)) return { kind: 'vision', confidence: 0.78, plan: [{ step: 'observe', action: 'screen-capture' }, { step: 'reason', action: 'vision-ai' }] };
  return { kind: 'chat', confidence: 0.7, plan: [{ step: 'respond', action: 'ai' }] };
}

export function shouldConfirm(kind, action) { return kind === 'device' && ['dial','notify'].includes(action); }

export function nexusStatus() {
  return { version: '1.0', mode: 'nexus-orchestrated', fastPath: true, deviceActions: true, agentPlanning: true, confirmationLayer: true, memoryLayer: true, visionPlan: true, researchPlan: true, buildPlan: true };
}
