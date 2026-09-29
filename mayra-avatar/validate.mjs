import fs from 'node:fs';

const asset = 'public/avatars/mayra.glb';
const states = ['idle', 'listening', 'thinking', 'speaking', 'interrupted', 'offline'];

console.log('[MAYRA] Human-avatar runtime contract loaded.');
console.log('[MAYRA] States:', states.join(', '));

if (!fs.existsSync(asset)) {
  console.log(`[MAYRA] Avatar asset not installed yet: ${asset}`);
  console.log('[MAYRA] Add a properly licensed rigged human GLB with facial blendshapes/visemes.');
  process.exit(0);
}

const size = fs.statSync(asset).size;
console.log(`[MAYRA] Avatar asset found: ${asset} (${size} bytes)`);
console.log('[MAYRA] Ready for Nexus/Gemini Live renderer integration.');
