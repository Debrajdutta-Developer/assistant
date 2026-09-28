import crypto from 'node:crypto';

/**
 * Nexus-inspired orchestration core for Jarvis.
 * The visual/spatial ideas come from the user's Nexus project; this module
 * keeps the assistant implementation provider-agnostic and fast on Android.
 */

const FAST_ACTIONS = new Set([
  'open-app','open-url','dial','notify','battery','flashlight'
]);

export function classifyTask(text = '') {
  const input = String(text).trim();
  const lower = input.toLowerCase();
  if (!input) return { kind: 'empty', complexity: 0 };

  if (/^(open|launch|start)\s+(whatsapp|youtube|chrome|maps|settings)$/i.test(input)) {
    return { kind: 'device', intent: 'open-app', complexity: 0, fast: true };
  }
  if (/^(turn|switch)\s+(on|off)\s+(the\s+)?flashlight$/i.test(input)) {
    return { kind: 'device', intent: 'flashlight', complexity: 0, fast: true };
  }
  if (/^(check|show|get)\s+(my\s+)?battery/i.test(input)) {
    return { kind: 'device', intent: 'battery', complexity: 0, fast: true };
  }
  if (/^(dial|call)\s+/i.test(input)) {
    return { kind: 'device', intent: 'dial', complexity: 0, fast: true };
  }
  if (/(research|compare|investigate|find out|deep dive)/i.test(lower)) {
    return { kind: 'research', complexity: 3, needsTools: true };
  }
  if (/(build|create|code|debug|implement|repository|repo)/i.test(lower)) {
    return { kind: 'build', complexity: 3, needsTools: true };
  }
  if (/(remember|forget|save this|note this|what did i tell you)/i.test(lower)) {
    return { kind: 'memory', complexity: 1 };
  }
  if (/(screen|what's on my screen|what is on my screen)/i.test(lower)) {
    return { kind: 'vision', complexity: 2, needsVision: true };
  }
  return { kind: 'chat', complexity: 1 };
}

export function planTask(text, context = {}) {
  const classification = classifyTask(text);
  const id = crypto.randomUUID();
  const phases = [];

  if (classification.fast) {
    phases.push({ id: 'act', type: 'action', status: 'ready' });
  } else {
    phases.push({ id: 'understand', type: 'reason', status: 'ready' });
    if (classification.needsTools) phases.push({ id: 'tools', type: 'tools', status: 'ready' });
    if (classification.needsVision) phases.push({ id: 'observe', type: 'vision', status: 'ready' });
    phases.push({ id: 'verify', type: 'verify', status: 'ready' });
    phases.push({ id: 'respond', type: 'respond', status: 'ready' });
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    input: String(text).slice(0, 4000),
    classification,
    context: {
      mode: context.mode || 'auto',
      activeModule: context.activeModule || null
    },
    phases
  };
}

export function chooseExecutionMode(plan, runtime = {}) {
  if (plan.classification.fast) return 'fast-action';
  if (plan.classification.kind === 'research') return runtime.online ? 'research-cloud' : 'research-local';
  if (plan.classification.kind === 'build') return runtime.online ? 'coding-cloud' : 'coding-local';
  if (plan.classification.kind === 'vision') return runtime.vision ? 'vision' : 'vision-unavailable';
  return runtime.local ? 'local-chat' : (runtime.online ? 'cloud-chat' : 'fallback-chat');
}

export function providerScore(provider = {}) {
  const latency = Number(provider.latencyMs || 5000);
  const failures = Number(provider.failures || 0);
  const successes = Number(provider.successes || 0);
  const reliability = successes / Math.max(1, successes + failures);
  return Math.max(0, reliability * 100 - Math.min(60, latency / 100) - failures * 3);
}

export function summarizePlan(plan) {
  return {
    id: plan.id,
    kind: plan.classification.kind,
    mode: plan.classification.fast ? 'fast-action' : 'agent',
    phases: plan.phases.map(p => p.id)
  };
}

export const NEXUS_CAPABILITIES = [
  'spatial-ui',
  'voice',
  'task-planning',
  'fast-device-actions',
  'model-routing',
  'memory',
  'vision',
  'research',
  'coding',
  'mcp-tools',
  'verification',
  'permission-gates'
];

export { FAST_ACTIONS };
